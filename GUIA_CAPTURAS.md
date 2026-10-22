# Guía de capturas reales

Inicia Redis y Node siguiendo README. Importa la colección Postman. Usa el usuario 123 para esta demostración. Guarda imágenes reales en `evidencias/`; no reemplaces resultados con imágenes editadas.

## 1 — Redis funcionando

Ejecuta `docker compose exec redis redis-cli PING` (equivale a `redis-cli PING` dentro del contenedor). Captura el comando y `PONG`.

## 2 — Estructura del proyecto

Abre el explorador del editor mostrando src y sus capas, tests, postman, diagramas, docker-compose.yml y README. También puedes ejecutar `tree /F /A src` en PowerShell y mostrar `Get-ChildItem`.

## 3 — Agregar producto

En Postman ejecuta POST `{{baseUrl}}/api/carritos/{{usuarioId}}/productos` con `{"productoId":"101","cantidad":2}`. Captura URL, cuerpo, HTTP 200 y respuesta con cantidad 2. Ejecuta también “Agregar segundo producto” (205, cantidad 1).

## 4 — Consultar carrito

Ejecuta GET `{{baseUrl}}/api/carritos/{{usuarioId}}`. Captura HTTP 200 y ambos productos.

## 5 — Datos almacenados en Redis

Ejecuta `docker compose exec redis redis-cli HGETALL carrito:123`. Captura `producto:101`, `2`, `producto:205` y `1`. Puedes añadir `docker compose exec redis redis-cli TYPE carrito:123` para comprobar `hash`.

## 6 — Modificar cantidad

Ejecuta PUT `{{baseUrl}}/api/carritos/{{usuarioId}}/productos/{{productoId}}` con `{"cantidad":5}`. Captura HTTP 200 y cantidad 5.

## 7 — Eliminar producto

Ejecuta DELETE `{{baseUrl}}/api/carritos/{{usuarioId}}/productos/{{productoId}}`, después GET. Captura que solo permanece 205. Mantener otro producto permite mostrar un TTL positivo en el siguiente paso.

## 8 — TTL

Ejecuta `docker compose exec redis redis-cli TTL carrito:123` y GET `{{baseUrl}}/api/carritos/{{usuarioId}}/ttl`. Captura los segundos restantes, cercanos a 2592000. Explica que disminuyen y que Redis elimina la clave automáticamente al expirar; las escrituras renuevan 30 días. No hace falta esperar 30 días ni cambiar el TTL de la demo.

## 9 — Persistencia al reiniciar solamente Node.js

Captura GET con el producto 205. En la terminal de Node pulsa Ctrl+C; Redis sigue activo. Ejecuta `npm start`, repite GET y captura el mismo producto. Incluye las terminales o imágenes antes/después que acrediten el reinicio. No vacíes el carrito antes de esta captura.

## 10 — Pruebas automatizadas

Con Redis activo ejecuta `npm test`. Captura el comando, nombres de pruebas y resumen completo. Si falla, registra el fallo y corrígelo antes de presentar resultados. Las pruebas usan claves propias, sin alterar carrito:123. Finalmente puedes demostrar “Vaciar carrito” y GET vacío desde Postman.
