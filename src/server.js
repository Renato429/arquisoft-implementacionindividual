import { createRedisClient } from './config/redis.js';
import { CarritoRepository } from './repositories/carrito.repository.js';
import { createApp } from './app.js';

const client = createRedisClient();
// La API permanece accesible y devuelve 503 mientras Redis se reconecta.
client.connect().catch(() => console.error('No se pudo conectar a Redis.'));
const prefix = process.env.NODE_ENV === 'test' ? process.env.TEST_KEY_PREFIX : undefined;
if (process.env.NODE_ENV === 'test' && !prefix?.startsWith('test:')) throw new Error('Se requiere prefijo de pruebas test:.');
const app = createApp(new CarritoRepository(client, prefix));
const server = app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1', () => {
  console.log(`API escuchando en http://${process.env.HOST || '127.0.0.1'}:${server.address().port}`);
});
async function shutdown() {
  server.close(async () => { if (client.isOpen) client.destroy(); });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
