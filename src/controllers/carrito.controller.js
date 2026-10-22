export function carritoController(service) {
  return {
    get: async (req, res) => res.json(await service.get(req.params.usuarioId)),
    add: async (req, res) => res.json(await service.add(req.params.usuarioId, req.body)),
    update: async (req, res) => res.json(await service.update(req.params.usuarioId, req.params.productoId, req.body)),
    remove: async (req, res) => res.json(await service.remove(req.params.usuarioId, req.params.productoId)),
    clear: async (req, res) => res.json(await service.clear(req.params.usuarioId)),
    ttl: async (req, res) => res.json(await service.ttl(req.params.usuarioId))
  };
}
