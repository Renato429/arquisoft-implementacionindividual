import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { createClient } from 'redis';

const prefix = `test:${randomUUID()}:carrito:`;
const client = createClient({ url: process.env.REDIS_URL || 'redis://127.0.0.1:6379', socket: { reconnectStrategy: false, connectTimeout: 2000 } });
client.on('error', () => {});
let child;
let base;
async function start() {
  child = spawn(process.execPath, ['src/server.js'], {
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1', NODE_ENV: 'test', TEST_KEY_PREFIX: prefix },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('La API no inició.')), 10000);
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Proceso terminó: ${code}`)); });
    child.stdout.on('data', data => {
      output += data;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  for (let i = 0; i < 50; i++) {
    if ((await fetch(`${base}/api/health`)).status === 200) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Redis no está listo en la API.');
}
async function stop() {
  if (!child || child.exitCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  await exited;
}
async function request(method, path, body, status = 200) {
  const response = await fetch(`${base}/api${path}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json();
  assert.equal(response.status, status, JSON.stringify(data));
  return data;
}
before(async () => { await client.connect(); await start(); });
after(async () => {
  await stop();
  if (client.isReady) {
    // Solo claves del UUID de esta ejecución; nunca FLUSHDB ni patrones globales.
    const keys = [];
    for await (const batch of client.scanIterator({ MATCH: `${prefix}*` })) keys.push(...batch);
    if (keys.length) await client.del(keys);
  }
  if (client.isOpen) client.destroy();
});

test('demostración HTTP completa con Redis real', async t => {
  await t.test('1. Conexión PING', async () => {
    assert.equal(await client.ping(), 'PONG');
    assert.equal((await request('GET', '/health')).redis, 'PONG');
  });
  await t.test('2. Crear carrito al guardar el primer producto', async () => {
    await request('POST', '/carritos/123/productos', { productoId: '101', cantidad: 2 });
    assert.equal(await client.hGet(`${prefix}123`, 'producto:101'), '2');
  });
  await t.test('3. Agregar existente reemplaza cantidad', async () => {
    const data = await request('POST', '/carritos/123/productos', { productoId: '101', cantidad: 4 });
    assert.equal(data.productos[0].cantidad, 4);
  });
  await t.test('4. Agregar varios y consultar HGETALL', async () => {
    await request('POST', '/carritos/123/productos', { productoId: '205', cantidad: 1 });
    assert.equal((await request('GET', '/carritos/123')).productos.length, 2);
  });
  await t.test('5. Modificar cantidad y renovar TTL', async () => {
    await client.expire(`${prefix}123`, 60);
    await request('PUT', '/carritos/123/productos/101', { cantidad: 7 });
    assert.equal(await client.hGet(`${prefix}123`, 'producto:101'), '7');
    assert.ok(await client.ttl(`${prefix}123`) > 2591900);
  });
  await t.test('6. Eliminar un producto y renovar TTL', async () => {
    await client.expire(`${prefix}123`, 60);
    const data = await request('DELETE', '/carritos/123/productos/205');
    assert.deepEqual(data.productos, [{ productoId: '101', cantidad: 7 }]);
    assert.ok(await client.ttl(`${prefix}123`) > 2591900);
  });
  await t.test('7. TTL de 30 días y renovación por POST', async () => {
    await client.expire(`${prefix}123`, 60);
    await request('POST', '/carritos/123/productos', { productoId: '101', cantidad: 7 });
    const data = await request('GET', '/carritos/123/ttl');
    assert.ok(data.ttlSegundos > 2591900 && data.ttlSegundos <= 2592000);
  });
  await t.test('8. Rechazar cantidades inválidas e identificadores', async () => {
    for (const cantidad of [-1, 0, 1.5, '2', null, true, Number.MAX_SAFE_INTEGER + 1]) {
      await request('POST', '/carritos/123/productos', { productoId: '101', cantidad }, 400);
      await request('PUT', '/carritos/123/productos/101', { cantidad }, 400);
    }
    await request('POST', '/carritos/123/productos', { productoId: 'a:b', cantidad: 2 }, 400);
    await request('GET', '/carritos/a%3Ab', undefined, 400);
    await request('POST', '/carritos/123/productos', undefined, 400);
    const response = await fetch(`${base}/api/carritos/123/productos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(response.status, 400);
  });
  await t.test('9. Productos inexistentes devuelven 404', async () => {
    await request('PUT', '/carritos/123/productos/999', { cantidad: 1 }, 404);
    await request('DELETE', '/carritos/123/productos/999', undefined, 404);
  });
  await t.test('10. Persistencia tras terminar y crear otro proceso Node.js', async () => {
    await stop(); await start();
    assert.deepEqual((await request('GET', '/carritos/123')).productos, [{ productoId: '101', cantidad: 7 }]);
  });
  await t.test('11. Vaciar carrito y TTL inexistente', async () => {
    await request('DELETE', '/carritos/123');
    assert.equal(await client.exists(`${prefix}123`), 0);
    assert.equal((await request('GET', '/carritos/123/ttl')).ttlSegundos, -2);
    assert.deepEqual((await request('GET', '/carritos/123')).productos, []);
  });
  await t.test('12. Eliminar último producto elimina el Hash', async () => {
    await request('POST', '/carritos/123/productos', { productoId: '101', cantidad: 1 });
    await request('DELETE', '/carritos/123/productos/101');
    assert.equal(await client.exists(`${prefix}123`), 0);
  });
});
