# Redis: carrito de compras

Demostración individual de NoSQL y bases de datos clave/valor para Arquitectura de Software, Universidad de Lima. Estudiante: **Renato Matías Almeyda Cordero**. Proyecto independiente de Qhatu.

## Objetivo y modelo de datos

Esta API permite almacenar, consultar, modificar y eliminar productos usando Redis real. Redis es una base NoSQL que mantiene datos en memoria y ofrece persistencia configurable en disco. Una clave identifica un valor; en esta demo, ese valor es un Hash con campos por producto. No existe almacenamiento alternativo en JavaScript.

```text
Clave: carrito:123
Tipo: Hash
producto:101 → "2"
producto:205 → "1"
producto:310 → "3"
TTL: 2592000 segundos (30 días)
```

El modelo clave/valor permite obtener un carrito por usuario sin tablas ni joins. Redis almacena cantidades como cadenas; la API las devuelve como números.

## Arquitectura y tecnologías

Usuario/Postman → API Node.js + Express → Servicio → Repositorio → Redis.

- `routes`: rutas HTTP.
- `controllers`: traducen peticiones y respuestas.
- `services`: validaciones y reglas del carrito.
- `repositories`: comandos Redis y atomicidad.
- `config`: cliente oficial `redis` y conexión.
- `middlewares`: gestión centralizada de errores.

Node.js 24 LTS, JavaScript ESM, Express 5, cliente oficial Redis 5, Redis 7.4, Docker Compose y Node.js Test Runner. Postman se usa para la demostración manual.

POST ejecuta HSET y EXPIRE en una transacción y luego HGETALL; responde HTTP 200, coherente con el diagrama de secuencia. PUT y DELETE de producto usan Lua para comprobar HEXISTS, ejecutar HSET/HDEL y renovar EXPIRE de forma atómica. El repositorio es una capa adicional de detalle: puede añadirse entre servicio y Redis en los diagramas. Los tres diagramas se encuentran en `diagramas/`.

## Requisitos e instalación (Windows 11, PowerShell)

Instala Node.js 24 LTS, Docker Desktop con motor Linux activo y Postman. Desde esta carpeta:

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d --wait
docker compose exec redis redis-cli PING
npm start
```

El CLI debe responder `PONG`. La API escucha en `http://localhost:3000`. Mantén esa terminal abierta y usa otra para los comandos restantes. Si PowerShell impide ejecutar `npm.ps1`, utiliza `npm.cmd`.

Las variables `.env` son PORT, HOST y REDIS_URL. No guardes credenciales en el código ni compartas `.env`. Compose publica Redis solamente en `127.0.0.1:6379` y usa un volumen propio con AOF (`appendfsync everysec`). Si el puerto está ocupado, revisa el servicio existente antes de iniciar otro; no elimines datos o contenedores ajenos.

Si 6379 está ocupado, configura en `.env` `REDIS_PORT=6380` y `REDIS_URL=redis://127.0.0.1:6380`. Reinicia Node después del cambio. El puerto interno del contenedor sigue siendo 6379, por lo que los comandos `docker compose exec redis redis-cli ...` no cambian. La configuración local actual usa 6380 para evitar el conflicto con el contenedor existente `redis-carrito`. Conserva tu `.env` al repetir la instalación.

### Alternativa sin Docker

Usa una instalación Redis existente y accesible localmente (por ejemplo en WSL). Configura `REDIS_URL=redis://127.0.0.1:6379` en `.env`, comprueba `redis-cli PING` desde ese entorno y ejecuta `npm start`. No se requiere un CLI instalado en Windows cuando usas `docker compose exec redis redis-cli`.

## API

| Método y ruta | Operación | Resultado |
| --- | --- | --- |
| GET /api/health | PING | 200 o 503 |
| POST /api/carritos/:usuarioId/productos | HSET + EXPIRE | 200, carrito actualizado |
| GET /api/carritos/:usuarioId | HGETALL | 200, productos |
| PUT /api/carritos/:usuarioId/productos/:productoId | HSET + EXPIRE | 200 o 404 |
| DELETE /api/carritos/:usuarioId/productos/:productoId | HDEL + EXPIRE | 200 o 404 |
| DELETE /api/carritos/:usuarioId | DEL | 200, carrito vacío |
| GET /api/carritos/:usuarioId/ttl | TTL | 200, ttlSegundos |

POST recibe `{"productoId":"101","cantidad":2}`. PUT recibe `{"cantidad":5}`. POST reemplaza la cantidad si el producto ya existe; no la suma. Los identificadores son cadenas de 1–64 letras ASCII, números, guiones o guiones bajos. La cantidad es un entero positivo seguro de JavaScript; se rechazan cadenas numéricas, decimales, cero y negativos con 400. JSON inválido devuelve 400. Errores internos devuelven 500 sin detalles; Redis no disponible devuelve 503 y el cliente intenta reconectarse.

Un carrito inexistente se consulta como lista vacía y su TTL es -2. Redis usa -1 para una clave sin expiración (la API siempre aplica expiración a sus escrituras). Al eliminar el último campo, Redis elimina automáticamente el Hash. DELETE de carrito es idempotente. Las consultas no renuevan el TTL. Los cambios exitosos de producto sí lo renuevan si permanece la clave.

## Postman, de principio a fin

Importa `postman/Redis-Carrito-Demo.postman_collection.json`. Las variables de colección son `baseUrl=http://localhost:3000`, `usuarioId=123`, `productoId=101`. Ejecuta las peticiones en orden: Health, agregar 101, agregar 205, consultar, actualizar, consultar TTL, eliminar 101, consultar y vaciar. Las pestañas Body contienen JSON y Scripts/Post-response valida códigos y datos básicos. Puedes usar Collection Runner; usa un usuario reservado para la demo, pues sus peticiones modifican ese carrito. Para repetir solo una eliminación, agrega primero el producto.

## Inspeccionar Redis

```powershell
docker compose exec redis redis-cli HGETALL carrito:123
docker compose exec redis redis-cli TYPE carrito:123
docker compose exec redis redis-cli TTL carrito:123
```

Estos comandos son lecturas directas del mismo Redis de la API. No uses FLUSHDB ni FLUSHALL.

## Pruebas automatizadas

Con Redis activo, en otra terminal:

```powershell
npm test
```

Son pruebas de integración HTTP con Redis real: PING, creación, varios productos, reemplazo, modificación, eliminación, vaciado, TTL y renovación, entradas inválidas, 404 y persistencia al terminar y recrear el proceso Node.js. Usan puertos dinámicos y claves `test:<UUID>:carrito:*`; solo limpian sus propias claves. Si Redis falta, fallan explícitamente. No necesitan detener la API de la demo. Una interrupción forzada de las pruebas puede dejar claves de su UUID hasta que expiren.

## Persistencia entre reinicios

Agrega productos y consulta el carrito. Detén únicamente `npm start` con Ctrl+C. No detengas Redis. Ejecuta `npm start` otra vez y repite GET: el carrito sigue disponible porque está en otro proceso, Redis. Esto es diferente de demostrar recuperación tras reiniciar Redis: para ese caso Compose monta el volumen AOF. AOF cada segundo puede perder aproximadamente el último segundo de escrituras ante una caída abrupta.

## Ventajas y límites

Acceso directo por clave, operaciones pequeñas sobre campos, expiración automática y separación por capas. Es una demo local sin autenticación, catálogo, precios, pagos ni autorización por usuario; no está preparada para exponerla a Internet. El Hash no crea por sí solo relaciones ni consultas analíticas. Redis consume memoria y necesita políticas de capacidad y persistencia en producción. La lectura de respuesta después de una escritura puede reflejar cambios concurrentes posteriores.

## Detener

Ctrl+C detiene Node.js. Para detener Redis conservando el contenedor y volumen:

```powershell
docker compose stop
```

Para reanudar: `docker compose up -d --wait`. `docker compose down` retira los contenedores de este proyecto y conserva el volumen. No agregues `-v` si quieres conservar los datos.

Consulta `GUIA_CAPTURAS.md`, `GUIA_VIDEO.md` y `evidencias/VERIFICACION.md` para preparar y revisar la evidencia.
