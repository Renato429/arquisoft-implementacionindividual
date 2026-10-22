import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createRedisClient } from '../src/config/redis.js';
import { CarritoRepository } from '../src/repositories/carrito.repository.js';
import { createApp } from '../src/app.js';

test('HTTP 503 con cliente Redis desconectado', async () => {
  const client = createRedisClient();
  const server = createApp(new CarritoRepository(client)).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const path of ['/api/health', '/api/carritos/123']) {
      const response = await fetch(base + path);
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /Redis no está disponible/);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
