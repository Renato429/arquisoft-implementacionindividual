import { HttpError } from '../middlewares/errorHandler.js';

export class CarritoService {
  constructor(repository) { this.repository = repository; }
  id(value) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(value)) {
      throw new HttpError(400, 'Identificador inválido: usa de 1 a 64 letras, números, guiones o guiones bajos.');
    }
    return value;
  }
  quantity(value) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new HttpError(400, 'La cantidad debe ser un número entero positivo seguro.');
    return value;
  }
  async get(user) {
    const data = await this.repository.get(this.id(user));
    return { usuarioId: user, productos: Object.entries(data).map(([field, value]) => ({
      productoId: field.slice('producto:'.length), cantidad: Number(value)
    })).sort((a, b) => a.productoId.localeCompare(b.productoId)) };
  }
  async add(user, body) {
    this.id(user); this.id(body?.productoId); this.quantity(body?.cantidad);
    await this.repository.set(user, body.productoId, body.cantidad);
    return this.get(user);
  }
  async update(user, product, body) {
    this.id(user); this.id(product); this.quantity(body?.cantidad);
    if (!await this.repository.mutate(user, product, body.cantidad)) throw new HttpError(404, 'El producto no existe en el carrito.');
    return this.get(user);
  }
  async remove(user, product) {
    this.id(user); this.id(product);
    if (!await this.repository.mutate(user, product, undefined, true)) throw new HttpError(404, 'El producto no existe en el carrito.');
    return this.get(user);
  }
  async clear(user) {
    await this.repository.clear(this.id(user));
    return { usuarioId: user, productos: [] };
  }
  async ttl(user) {
    const ttlSegundos = await this.repository.ttl(this.id(user));
    return { usuarioId: user, ttlSegundos };
  }
}
