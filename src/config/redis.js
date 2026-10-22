import { createClient } from 'redis';

export function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    disableOfflineQueue: true,
    socket: { connectTimeout: 2000, reconnectStrategy: retries => Math.min(200 * retries, 2000) }
  });
  client.on('error', () => console.error('Redis no disponible; revisa la conexión.'));
  return client;
}
