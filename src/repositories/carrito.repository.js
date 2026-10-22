import { HttpError } from '../middlewares/errorHandler.js';

export const TTL_SECONDS = 30 * 24 * 60 * 60;

export class CarritoRepository {
  constructor(client, prefix = 'carrito:') { this.client = client; this.prefix = prefix; }
  async execute(operation) {
    if (!this.client.isReady) throw new HttpError(503, 'Redis no está disponible. Inicia Redis e intenta nuevamente.');
    try { return await operation(); }
    catch (error) {
      if (error instanceof HttpError) throw error;
      if (!this.client.isReady || /Socket|Connection|ClientClosed|timeout|ECONN/i.test(error.name + error.message)) {
        throw new HttpError(503, 'Redis no está disponible. Revisa la conexión.');
      }
      throw error;
    }
  }
  key(id) { return `${this.prefix}${id}`; }
  field(id) { return `producto:${id}`; }
  ping() { return this.execute(() => this.client.ping()); }
  get(id) { return this.execute(() => this.client.hGetAll(this.key(id))); }
  ttl(id) { return this.execute(() => this.client.ttl(this.key(id))); }
  clear(id) { return this.execute(() => this.client.del(this.key(id))); }
  set(id, product, quantity) {
    return this.execute(() => this.client.multi()
      .hSet(this.key(id), this.field(product), String(quantity))
      .expire(this.key(id), TTL_SECONDS).exec());
  }
  mutate(id, product, quantity, remove = false) {
    // Lua evita que otra petición elimine el campo entre HEXISTS y HSET.
    const script = `
      if redis.call('HEXISTS', KEYS[1], ARGV[1]) == 0 then return 0 end
      if ARGV[3] == 'delete' then
        redis.call('HDEL', KEYS[1], ARGV[1])
      else
        redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
      end
      redis.call('EXPIRE', KEYS[1], ARGV[4])
      return 1`;
    return this.execute(() => this.client.eval(script, {
      keys: [this.key(id)],
      arguments: [this.field(product), String(quantity ?? ''), remove ? 'delete' : 'update', String(TTL_SECONDS)]
    }));
  }
}
