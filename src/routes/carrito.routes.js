import { Router } from 'express';
import { carritoController } from '../controllers/carrito.controller.js';

export function carritoRoutes(service) {
  const router = Router();
  const controller = carritoController(service);
  router.get('/:usuarioId/ttl', controller.ttl);
  router.get('/:usuarioId', controller.get);
  router.post('/:usuarioId/productos', controller.add);
  router.put('/:usuarioId/productos/:productoId', controller.update);
  router.delete('/:usuarioId/productos/:productoId', controller.remove);
  router.delete('/:usuarioId', controller.clear);
  return router;
}
