# Guion de video (6 minutos aproximadamente)

## 0:00–0:40 — Presentación

“Hola, soy Renato Matías Almeyda Cordero, estudiante de Ingeniería de Sistemas de la Universidad de Lima. Esta es mi demostración individual para Arquitectura de Software sobre bases NoSQL de clave/valor. Implementé un carrito pequeño con Node.js, Express y Redis, independiente del proyecto grupal Qhatu. Voy a mostrar tanto la API como los datos reales que guarda Redis.”

## 0:40–1:20 — NoSQL y clave/valor

“NoSQL agrupa distintos modelos de almacenamiento que no dependen de tablas relacionales. En el modelo clave/valor buscamos información mediante una clave. Aquí carrito:123 identifica el carrito del usuario 123. Su valor es un Hash: cada campo, como producto:101, contiene una cantidad. Redis mantiene los datos en memoria y puede persistirlos en disco; en Docker configuré AOF y un volumen. El carrito no se almacena en un arreglo dentro de Node.”

Muestra el diagrama de almacenamiento y señala los campos y TTL.

## 1:20–2:05 — Arquitectura y capas

“Postman representa al cliente. Express recibe la solicitud; las rutas identifican el endpoint y el controlador prepara la respuesta. El servicio valida identificadores y cantidades. El repositorio realiza las operaciones con Redis mediante su librería oficial. La configuración administra la conexión y un middleware centraliza los errores. Esta separación ayuda a entender responsabilidades y mantener el proyecto.”

Muestra src y el diagrama. “Para agregar uso HSET; para consultar, HGETALL; para retirar un producto, HDEL; y para vaciar, DEL.”

## 2:05–2:40 — Iniciar servicios

En PowerShell ejecuta `docker compose up -d --wait`, luego `docker compose exec redis redis-cli PING`.

“PONG confirma que Redis responde. Ahora ejecuto npm start en otra terminal. Redis y Node son procesos separados. Los puertos se limitan al equipo local porque esta es una demostración sin autenticación.”

## 2:40–4:10 — Postman y datos reales

“Importé la colección y configuré baseUrl, usuarioId y productoId. Primero health comprueba PING. Agrego el producto 101 con cantidad 2 y el 205 con cantidad 1. La respuesta 200 muestra los productos. El GET recupera el Hash de Redis.”

Ejecuta `docker compose exec redis redis-cli HGETALL carrito:123`.

“Aquí se ven exactamente los campos y cantidades guardados. Ahora cambio la cantidad de 101 a 5 usando PUT. Si envío cero o un decimal, la validación responde 400. Si intento modificar un producto inexistente, responde 404. Elimino 101 y queda 205. POST sobre un producto existente reemplaza su cantidad.”

## 4:10–4:45 — Expiración

Consulta el endpoint TTL y ejecuta `docker compose exec redis redis-cli TTL carrito:123`.

“El TTL se expresa en segundos. Treinta días equivalen a 2592000 segundos. Al agregar, modificar o retirar un producto, se renueva ese plazo si el carrito permanece. Una consulta no lo renueva. Cuando vence, Redis elimina la clave. Si elimino el último producto, el Hash también desaparece.”

## 4:45–5:30 — Reinicio y pruebas

“Voy a detener únicamente Node con Ctrl+C y volver a iniciarlo con npm start. El GET conserva el producto 205: los datos viven en Redis, no en el proceso de la API.”

Ejecuta `npm test` y muestra su resultado real.

“Las pruebas hacen solicitudes HTTP a procesos reales y usan un prefijo con UUID para no tocar datos de la demostración. También comprueban la persistencia al recrear Node. Ahora vacío el carrito con DELETE y verifico la lista vacía.”

## 5:30–6:10 — Conclusión

“Esta demostración muestra el modelo clave/valor con un Hash, operaciones CRUD y expiración automática. Redis facilita acceder al carrito por usuario y actualizar campos. Para una aplicación productiva faltarían autenticación, autorización y planificación de memoria y durabilidad. Conservar los datos al reiniciar Node es distinto de recuperarlos tras una caída de Redis; para esto configuré persistencia AOF y un volumen. Gracias.”
