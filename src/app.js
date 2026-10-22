import express from 'express';
import { CarritoService } from './services/carrito.service.js';
import { carritoRoutes } from './routes/carrito.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export function createApp(repository) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', async (req, res) => {
    await repository.ping();
    res.json({ estado: 'ok', redis: 'PONG' });
  });
  app.use('/api/carritos', carritoRoutes(new CarritoService(repository)));
  app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use(errorHandler);
  return app;
}
