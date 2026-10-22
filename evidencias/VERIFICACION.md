# Verificación realizada — 22 de octubre de 2026

## Actualización: conflicto de puerto resuelto

Se encontró el contenedor existente `redis-carrito` en 127.0.0.1:6379. Se conservó intacto. La demo usa ahora REDIS_PORT=6380 y REDIS_URL=redis://127.0.0.1:6380 en su .env local; Compose permite configurar ese puerto.

- `docker compose up -d --wait`: contenedor propio Healthy.
- `docker compose exec redis redis-cli PING`: PONG.
- `npm test`: **14 pruebas aprobadas, 0 fallidas**, incluyendo las 12 subpruebas HTTP de integración con Redis real y persistencia al recrear el proceso Node.js.

El bloqueo de Redis descrito debajo corresponde al intento inicial y está resuelto. La colección en la interfaz de Postman/Bruno, las capturas y el renderizado de PlantUML siguen siendo verificaciones manuales pendientes.

## Registro del intento inicial

## Comprobado

- Node.js v24.11.1 y npm 11.6.2 disponibles.
- Docker CLI 29.6.1 y Compose v5.3.0 instalados.
- `npm install --no-audit --no-fund`: 72 paquetes instalados y package-lock.json generado. El primer intento restringido falló por DNS; el segundo con acceso de red terminó correctamente.
- `node --check` sobre todos los archivos de src y la prueba de integración: sin errores de sintaxis.
- `docker compose config --quiet`: finalizó correctamente.
- `npm start`: API iniciada en http://127.0.0.1:3000.
- Petición HTTP real GET /api/health: 503 con mensaje «Redis no está disponible. Inicia Redis e intenta nuevamente.».
- `npm test` con acceso a red local: **1 prueba aprobada, 1 fallida**. Aprobada: HTTP 503 con cliente Redis desconectado. Fallida en preparación: integración con Redis real, por `ECONNREFUSED 127.0.0.1:6379`. Sus 12 subpruebas no llegaron a ejecutarse.

## Bloqueo del entorno

El motor Docker no estaba activo inicialmente (pipe dockerDesktopLinuxEngine inexistente). Se intentó abrir Docker Desktop; sus procesos aparecieron activos, pero las consultas del motor y el inicio de Compose no devolvieron un servicio Redis disponible durante la verificación. No hay redis-cli en Windows ni redis-server en la distribución WSL existente. No se eliminaron contenedores ni volúmenes, ni se modificaron otros proyectos.

## Pendiente de verificar con Redis activo

CRUD con datos reales, TTL y renovación, limpieza de claves de prueba y persistencia al reiniciar Node. Las pruebas están implementadas, pero no se afirma que pasaron. Tampoco se ejecutó la colección en Postman ni se generaron capturas. No se validó visualmente el renderizado de PlantUML.

Abre Docker Desktop y espera que el motor Linux indique que está ejecutándose; resuelve cualquier aviso de su interfaz. Después, en PowerShell desde redis-carrito-demo:

```powershell
docker compose up -d --wait
docker compose exec redis redis-cli PING
npm test
npm start
```

Registra la salida real y sigue GUIA_CAPTURAS.md. No es necesario modificar el código para usar una instalación Redis local existente: configura REDIS_URL en .env.
