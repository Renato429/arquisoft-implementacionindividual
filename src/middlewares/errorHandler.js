export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Error interno inesperado.' : err.message });
}
