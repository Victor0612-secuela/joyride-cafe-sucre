# 06 — Dossier Maestro del Proyecto, Diagramas Estándar y Defensa Oral (Joy Ride Café® Sucre)

Este dossier ejecuta de principio a fin los 7 prompts arquitectónicos de `docs/05-PROMPTS-EXPOSICION-Y-ARQUITECTURA.md` y enlaza todos los diagramas estándar en formato **StarUML / UML 2.5 / Crow's Foot PostgreSQL**, listos para estudiar, proyectar o abrir directamente en herramientas de ingeniería.

---

## Índice Rápido de Diagramas y Fuentes Editables

- **Visor Web / PDF Imprimible (6 láminas juntas):** [visor-diagramas-staruml.html](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/visor-diagramas-staruml.html)
- **Proyecto StarUML (.mdj listo para abrir):** [joyride-staruml.mdj](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/joyride-staruml.mdj)
- **Esquema DBML (dbdiagram.io):** [joyride-bd.dbml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/joyride-bd.dbml)
- **SQL DDL PostgreSQL (Ingeniería Inversa StarUML / pgAdmin / DBeaver):** [joyride-schema.sql](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/joyride-schema.sql)

| N° | Diagrama | Imagen Renderizada (PNG) | Fuente PlantUML (.puml) |
|---|---|---|---|
| **01** | Casos de Uso UML 2.5 (5 Actores + 3 Sistemas Externos) | [01-casos-de-uso.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/01-casos-de-uso.png) | [01-casos-de-uso.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/01-casos-de-uso.puml) |
| **02** | Clases de Dominio UML 2.5 | [02-clases-dominio.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/02-clases-dominio.png) | [02-clases-dominio.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/02-clases-dominio.puml) |
| **03** | ERD Físico Crow's Foot (17 Tablas + 9 Enums PostgreSQL) | [03-erd-base-datos.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/03-erd-base-datos.png) | [03-erd-base-datos.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/03-erd-base-datos.puml) |
| **04** | Secuencia E2E (4 Pasarelas, Stock ACID, SSE, Empaque y PIN) | [04-secuencia-pedido-pago.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/04-secuencia-pedido-pago.png) | [04-secuencia-pedido-pago.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/04-secuencia-pedido-pago.puml) |
| **05** | Máquina de Estados del Pedido (`OrderStatus`) | [05-maquina-estados-pedido.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/05-maquina-estados-pedido.png) | [05-maquina-estados-pedido.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/05-maquina-estados-pedido.puml) |
| **06** | Componentes y Despliegue Render + PostgreSQL + PWA | [06-componentes-despliegue.png](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/imagenes/06-componentes-despliegue.png) | [06-componentes-despliegue.puml](file:///C:/Users/VICTUS/.gemini/antigravity/scratch/joyride-cafe-sucre/docs/diagramas/fuentes/06-componentes-despliegue.puml) |

---

## 1. Resumen Ejecutivo y Guión de Presentación (11 Diapositivas)

1. **Slide 1 — Portada e Identidad Real:** *Joy Ride Café® Sucre* (*"No solo para gringos — Probably the Best Bar in Town®"*), fundado en 2001 en Calle Nicolás Ortiz N° 14 frente a la Catedral Metropolitana.
   - *Mostrar en vivo:* Hero de `/` con emblema circular + botón **Explorar la Carta**.
2. **Slide 2 — Problema del Negocio:** Pedidos manuales por WhatsApp sin control de inventario en hora pico, comprobantes duplicados en caja y cero trazabilidad desde barra/cocina hasta la entrega.
   - *Viñetas:* Sobreventa simultánea · Falta de flujo multi-rol · Pérdida de turistas sin ruta guiada en Sucre.
3. **Slide 3 — Arquitectura Cliente–Servidor y Stack:** Monorepo TypeScript con React 18 + Vite 6 + Tailwind + Framer Motion, API Express 4 + Zod, PostgreSQL 16 + Prisma ORM v6 y canal SSE en tiempo real.
   - *Mostrar en vivo:* Lámina `06-componentes-despliegue.png`.
4. **Slide 4 — Experiencia Visual & Separación de Dominios (`/` vs `/carta`):** Inicio limpio orientado a historia, promociones Bento dinámicas, recorrido visual del local y agenda cultural; Carta dedicada en `/carta` con agrupación por secciones, filtros y cartilla flip interactiva.
   - *Mostrar en vivo:* Navegación de `/` a `/carta`, búsqueda y volteo de cartilla.
5. **Slide 5 — Base de Datos Relacional (17 Tablas) & Atomicidad ACID:** Control estricto de `stockDisponible` vs `stockReservado` dentro de `prisma.$transaction` y auditoría Kardex (`StockMovement`).
   - *Mostrar en vivo:* Lámina `03-erd-base-datos.png` y vista Kardex en `/panel/admin`.
6. **Slide 6 — Ecosistema de 4 Pasarelas de Pago Verificables:**
   - **Simple QR BNB** con token firmado HMAC-SHA256 y expiración temporal (`/pagar-qr/:token`).
   - **Depósito Bancario** con captura validada por el **Cajero** (aprobación pasa a cocina; rechazo libera stock).
   - **PayPal Orders v2** (conversión Bs → USD server-side + captura segura).
   - **Stripe Tarjetas** (`PaymentIntents` / prueba `4242` con cálculo 100% desde PostgreSQL).
7. **Slide 7 — Operación en Tiempo Real por 5 Roles (`SSE` + `RBAC`):** Separación de privilegios entre `CLIENTE`, `CAJERO`, `EMPAQUETADOR`, `REPARTIDOR` y `ADMIN`.
   - *Mostrar en vivo:* Paneles `/panel/cajero`, `/panel/empaque` y `/panel/repartidor`.
8. **Slide 8 — Máquina de Estados y PIN de Entrega de 4 Dígitos:** Validación estricta en `order-state.service.ts` (`ALLOWED_TRANSITIONS`) e impedimento físico/lógico de saltar etapas; al repartidor se le oculta el PIN hasta que el cliente se lo dicta en puerta.
   - *Mostrar en vivo:* Lámina `05-maquina-estados-pedido.png` y entrega final con PIN.
9. **Slide 9 — Mapa Interactivo de Sucre y Ruta GPS Sin Costo de API Key:** Leaflet + tiles Esri `World_Topo_Map` en relieve + geocodificación inversa OSM Nominatim + rutas OSRM (*Probably the Best Map in Town®*).
   - *Mostrar en vivo:* `/mapa-sucre` trazando ruta desde Nicolás Ortiz 14 hasta un punto turístico.
10. **Slide 10 — Blindaje Web y Anti-Manipulación (`F12`):** Cero confianza en precios enviados por el cliente, scope estricto en SSE, cabeceras Helmet + CORS + Rate Limiting + `Cache-Control: no-store` y correos HTML automatizados por Nodemailer/Gmail SMTP.
11. **Slide 11 — Despliegue Cloud y PWA Instalable:** `render.yaml` listo para Render + PostgreSQL administrado, Service Worker PWA instalable en móvil y suite E2E automatizada de **16 bloques** (`server/scripts/test-e2e.ts`).

---

## 2. Arquitectura API REST vs API RESTful y Códigos HTTP Reales

En defensa oral ante tribunal:
- Una **API REST** expone datos en JSON por HTTP sin estado.
- Una **API RESTful** (como la nuestra en `server/src/routes/*.routes.ts`) aplica disciplinadamente:
  1. **URIs orientadas a recursos** en plural (`/api/products`, `/api/orders`, `/api/events`, `/api/reservations`).
  2. **Semántica exacta de verbos HTTP**: `GET` lectura segura e idempotente (`GET /api/products`), `POST` creación o transición transaccional (`POST /api/payments/stripe/create-intent`), `PUT` reemplazo completo (`PUT /api/admin/products/:id`), `PATCH` mutación parcial de estado/checklist/coordenadas (`PATCH /api/delivery/orders/:id/location`), `DELETE` borrado (`DELETE /api/admin/events/:id`).
  3. **Códigos HTTP significativos:**
     - `200 OK`: lectura exitosa o transición aprobada.
     - `201 Created`: registro de usuario, reserva, evento o envío de depósito bancario.
     - `400 Bad Request`: datos malformados rechazados por Zod en `validators/schemas.ts`.
     - `401 Unauthorized`: ausencia o expiración de `Bearer JWT`.
     - `403 Forbidden`: intento de acceder a ruta de otro rol o capturar/confirmar un pago (`PayPal` / `Stripe`) cuya orden pertenece a otro usuario.
     - `404 Not Found`: ID de producto/orden/token inexistente.
     - `409 Conflict`: carrera de stock (`stockDisponible < quantity`), salto ilegal en `ALLOWED_TRANSITIONS`, o entrega bloqueada por checklist incompleto / PIN inválido.
     - `429 Too Many Requests`: superación del umbral en `rateLimit.middleware.ts` (`auth` 40/15m, intentos de PIN `delivery` 20/15m, escrituras públicas 40/15m).
  4. **Stateless JWT:** cada petición lleva `Authorization: Bearer <accessToken>` sin sesiones en memoria RAM, facilitando escalado horizontal en Render.

---

## 3. Diccionario Completo de Base de Datos (17 Tablas + 9 Enums) y Concurrencia ACID

### Enums PostgreSQL (`server/prisma/schema.prisma`)
1. `Role`: `CLIENTE | CAJERO | EMPAQUETADOR | REPARTIDOR | ADMIN`
2. `OrderStatus`: `PENDIENTE_PAGO | PAGO_EN_REVISION | PAGO_CONFIRMADO | EN_PREPARACION | EMPACADO | EN_CAMINO | ENTREGADO | CANCELADO | RECHAZADO`
3. `PaymentMethod`: `QR | DEPOSITO_BANCARIO | PAYPAL | STRIPE`
4. `PaymentStatus`: `PENDIENTE | EN_REVISION | COMPLETADO | RECHAZADO | EXPIRADO`
5. `DeliveryType`: `DELIVERY | RECOGER_LOCAL | CONSUMO_LOCAL`
6. `StockMovementType`: `ENTRADA_INICIAL | RESERVA_PEDIDO | VENTA_CONFIRMADA | LIBERACION_STOCK | AJUSTE_ADMIN`
7. `ReservationZone`: `PATIO_COLONIAL | MEZZANINE_TERRAZA | PANTALLA_GIGANTE | PISTA_SALSA_BACHATA`
8. `ReservationStatus`: `CONFIRMADA | CHECK_IN | CANCELADA`
9. `ChatChannelType`: `ORDER_DELIVERY | STAFF_OPS`

### Las 17 Tablas Relacionales
1. **`User`**: Cuentas y roles del sistema con `passwordHash` bcrypt y relación a pedidos, pagos verificados, empaque, entregas, reservas y chat.
2. **`Category`**: Categorías ordenadas de la carta (`sortOrder`).
3. **`Product`**: Platos/tragos con precios duales (`precioBs`, `precioUsd`), contadores `stockDisponible` + `stockReservado` + `stockMinimoAlerta`, banderas dietéticas/promo y maridaje (`maridajeSlug`).
4. **`StockMovement`**: Libro diario inmutable tipo **Kardex** (`previousStock`, `newStock`, `quantity`, `type`, `reason`) enlazado a producto, pedido y actor.
5. **`Order`**: Cabecera transaccional con `orderCode` (`JR-XXXXXX`), totales server-side, destino GPS (`destLat`, `destLng`), división de cuenta (`splitCount`) y expiración.
6. **`OrderItem`**: Líneas de detalle congelando precio unitario e importe en el momento de la compra.
7. **`Payment`**: Registro único 1:1 por orden; soporta QR (`qrToken`, `qrSignature`), Depósito (`bankName`, `referenceNumber`, `comprobanteUrl`, `verificadoPorId`), PayPal (`paypalOrderId`, `paypalCaptureId`) y Stripe (`stripePaymentIntentId`, `cardBrand`, `cardLast4`).
8. **`PackagingChecklist`**: Verificación 1:1 obligatoria en cocina (`items` JSON, `sealCode` de bolsa sellada y `allVerified`).
9. **`DeliveryTracking`**: Logística GPS 1:1 (`riderLat`, `riderLng`, `etaMinutes`, `packageLabelCode` y `deliveryPin` de 4 dígitos).
10. **`OrderStatusHistory`**: Auditoría cronológica (`fromStatus -> toStatus`) con actor, rol y motivo.
11. **`Reservation`**: Mesas y clases gratis de Salsa/Bachata con aforo por zona y `qrPassToken` único.
12. **`ChatMessage`**: Mensajería persistente separada por `ORDER_DELIVERY` y `STAFF_OPS`.
13. **`Promotion`**: Tarjetas dinámicas del tablero *Ritmo Joy Ride en Sucre* (Bento).
14. **`Event`**: Cartelera de eventos del local y puntos de la ruta turística de Sucre (`imagesJson`, `videoUrl`, `spotId`).
15. **`Review`**: Reseñas verificadas en formato Masonry.
16. **`NewsletterSubscriber`**: Suscriptores a boletines y promociones nocturnas.
17. **`EmailLog`**: Bitácora con el cuerpo HTML completo enviado o guardado para previsualización en Admin.

### Cómo Evitamos la Sobreventa Concurrente (ACID en `inventory.service.ts`)
1. Cuando dos clientes compran al mismo milisegundo la última unidad de *Super Pique a lo Macho*, ambos entran a `prisma.$transaction`:
   - `reserveStockTx` ejecuta `updateMany` con condición atómica `where: { id, active: true, stockDisponible: { gte: qty } }`.
   - PostgreSQL serializa la modificación de la fila: el primero decrece `stockDisponible` en `qty` e incrementa `stockReservado` en `qty` dejando `stockDisponible = 0` + escribe `StockMovement(RESERVA_PEDIDO)`.
   - El segundo cliente recibe `count === 0` y la transacción aborta limpia y atómicamente con **HTTP `409 Conflict`**.
2. Al confirmarse el pago (`confirmSaleTx`), se reduce `stockReservado`, se asienta `VENTA_CONFIRMADA` en Kardex y se verifica `stockDisponible <= stockMinimoAlerta` para disparar correo de alerta a Gerencia.
3. Si el pedido expira, el cliente cancela o el Cajero rechaza un depósito, `releaseStockTx` devuelve `stockReservado -> stockDisponible` con registro `LIBERACION_STOCK`.

---

## 4. Matriz de Ciberseguridad y Blindaje contra `F12` (DevTools)

| Vector de Ataque desde Navegador (`F12`) | Respuesta Real del Backend | Archivo que lo Impide |
|---|---|---|
| Modificar JSON del checkout para enviar `totalBs: 0.01` | Ignorado por completo; el servidor suma `Product.precioBs * qty + deliveryBs` directo desde PostgreSQL | `server/src/services/inventory.service.ts`, `payment.service.ts`, `paypal.service.ts`, `stripe.service.ts` |
| Enviar `role: "ADMIN"` al registrarse en `POST /api/auth/register` | El esquema/servicio ignora roles externos y asigna obligatoriamente `Role.CLIENTE` | `server/src/routes/auth.routes.ts` |
| Confirmar o capturar el pago de otro usuario cambiando `orderId` | Verifica `order.userId === req.user.id` y rechaza con `403 Forbidden` | `server/src/services/stripe.service.ts`, `paypal.service.ts` |
| Conectarse a `/api/events/stream` sin permisos para espiar pedidos | SSE restringe entregas solo a sockets autenticados como staff o que coincidan con el `orderId` autorizado | `server/src/utils/sse.ts` |
| Ver productos ocultos agregando `?includeInactive=true` | Filtro permitido únicamente cuando `req.user?.role === Role.ADMIN` | `server/src/routes/catalog.routes.ts` |
| Fuerza bruta al PIN de entrega de 4 dígitos o login | Rate limit deslizante por IP (`20/15m` en deliver, `40/15m` en auth) devuelve `429 Too Many Requests` | `server/src/middleware/rateLimit.middleware.ts` |
| Ver el PIN del cliente desde la cuenta de Repartidor | Se omite el campo `deliveryPin` cuando el solicitante es `REPARTIDOR` | `server/src/routes/orders.routes.ts`, `delivery.routes.ts` |
| Saltar de `PENDIENTE_PAGO` directo a `ENTREGADO` vía cURL/fetch | `ALLOWED_TRANSITIONS` bloquea transiciones ilegales con `409 Conflict` | `server/src/services/order-state.service.ts` |
| Inyectar XSS o URLs `javascript:` en reseñas o correos HTML | `requireAuth` obligatorio + validación de esquema URL segura + `escapeHtml()` | `server/src/routes/reviews.routes.ts`, `validators/schemas.ts`, `email.service.ts` |
| Leer datos sensibles desde caché del navegador tras cerrar sesión | Cabeceras `Cache-Control: no-store, private` + `Pragma: no-cache` | `server/src/index.ts` |

---

## 5. Guión de Demostración en Vivo (4 Minutos — 5 Actores)

1. **Minuto 0:00 – 0:50 (`CLIENTE` en `/`, `/carta` y `/mapa-sucre`):**
   - Muestra el Inicio (`http://localhost:4000/`): Hero, Bento *Ritmo Joy Ride en Sucre* (*Probably the Best Happy Hour*), galería del local *Así se vive Joy Ride por dentro* y el enlace *Probably the Best Map in Town®* (`/mapa-sucre`, traza ruta desde Nicolás Ortiz N° 14).
   - Entra a **`/carta`**: muestra la agrupación automática por secciones, voltea una cartilla de plato y añade productos al carrito.
2. **Minuto 0:50 – 1:40 (`CLIENTE` Checkout & Seguridad):**
   - Ingresa con la cuenta demo `Cliente`, marca pin GPS en el carrito, selecciona **Tarjeta / Stripe**, pulsa `Usar tarjeta prueba 4242` y paga: la orden pasa al instante a **`PAGO_CONFIRMADO`** y abre el historial SSE en vivo. (Opcional: repite con **Depósito Bancario** para demostrar la cola de Caja).
3. **Minuto 1:40 – 2:20 (`CAJERO` en `/panel/cajero`):**
   - Cambia a cuenta `Cajero`, revisa la captura del depósito pendiente y aprueba el pago -> el pedido avanza en vivo a cocina sin recargar.
4. **Minuto 2:20 – 3:05 (`EMPAQUETADOR` en `/panel/empaque`):**
   - Cambia a `Empaquetador`, inicia preparación (`EN_PREPARACION`), marca el checklist ítem por ítem al 100%, asigna código de sello (`JR-SEAL-...`) y presiona finalizar empaque (`EMPACADO` -> dispara generación de etiqueta y PIN de 4 dígitos).
5. **Minuto 3:05 – 3:40 (`REPARTIDOR` en `/panel/repartidor`):**
   - Inicia sesión como `Repartidor`, retira el paquete (`EN_CAMINO`), actualiza ubicación GPS y demuestra que no puede cerrar entrega sin el PIN correcto que solo posee el Cliente. Ingresa el PIN -> transición final a **`ENTREGADO`**.
6. **Minuto 3:40 – 4:00 (`ADMIN` en `/panel/admin`):**
   - Abre `/panel/admin` para mostrar métricas de ingresos separadas por las 4 pasarelas (QR, Depósito, PayPal, Stripe), movimientos Kardex, visor de correos HTML (`EmailLog`) y editor de eventos/Bento.

---

## 6. Banco de 15 Preguntas Difíciles del Tribunal y Respuestas Ganadoras

1. **¿Por qué usan `JWT` + `Refresh Token` en lugar de sesiones tradicionales en memoria del servidor?**
   - Porque una API RESTful debe ser *stateless*; guardar sesiones en RAM impide escalar horizontalmente o reiniciar el servidor en Render sin desconectar usuarios, mientras JWT porta firma HMAC verificable en cada micro-petición.
2. **¿Dónde se guarda el `cart` del cliente y por qué no en PostgreSQL antes de pagar?**
   - En `localStorage` (`CartContext`), permitiendo navegar, recargar o armar pedidos sin autenticación previa ni saturar la base de datos con carritos abandonados; al momento de pagar, PostgreSQL recalcula precios e inventarios reales desde cero.
3. **¿Cómo garantizan que un usuario experto no modifique el precio de Bs. 78 a Bs. 0.01 usando F12?**
   - El payload de checkout únicamente acepta `{ productId, quantity }`; los endpoints `/payments/*/initiate`, `create-intent` y `create-order` leen `Product.precioBs` directo desde PostgreSQL dentro de `$transaction`.
4. **¿Por qué integrar PayPal y Stripe desde el backend en lugar de usar solo sus botones SDK en React?**
   - Porque si la captura o creación del monto ocurriera solo en React, el cliente podría manipular el importe en JS antes de enviarlo a la pasarela; ejecutándolo desde Express mantenemos `STRIPE_SECRET_KEY` y `PAYPAL_CLIENT_SECRET` ocultos en el servidor y verificamos propiedad (`userId`).
5. **¿Cómo evitan que dos clientes compren el último plato al mismo tiempo?**
   - Con una actualización condicional atómica dentro de `prisma.$transaction` (`where: { id, stockDisponible: { gte: qty } }`), respaldada por bloqueo de fila en PostgreSQL; el segundo cliente recibe HTTP `409 Conflict`.
6. **¿Qué diferencia hay entre `stockDisponible` y `stockReservado`?**
   - Al crear un QR o orden pendiente, las unidades pasan de `stockDisponible` a `stockReservado` (`RESERVA_PEDIDO`) para que nadie más las tome mientras pagan; si confirman pasa a venta (`VENTA_CONFIRMADA`), y si rechazan o expiran regresan (`LIBERACION_STOCK`).
7. **¿Por qué eligieron Leaflet + Esri World Topo + OSRM en lugar de Google Maps Platform?**
   - Para evitar depender de tarjetas de crédito o facturación de API Keys de Google en proyectos universitarios/locales y lograr aun así mapas topográficos en relieve, geocodificación inversa (Nominatim) y rutas a pie reales sin costo.
8. **¿Qué pasa si la API de Gmail SMTP no tiene `SMTP_PASS` configurado durante la exposición?**
   - El servicio `email.service.ts` registra siempre el correo HTML completo en la tabla `EmailLog` (`STORED_PREVIEW`) con `escapeHtml()`, permitiendo inspeccionar la plantilla renderizada en `/panel/admin`; al colocar la contraseña de aplicación de 16 caracteres en `.env`, el mismo flujo envía correos reales por TLS puerto `587`.
9. **¿Cómo aseguran que un Repartidor no marque un pedido como `ENTREGADO` sin entregarlo?**
   - Primero, la respuesta de órdenes omite `deliveryPin` para el rol `REPARTIDOR`. Segundo, el cliente recibe su PIN por portal seguro y correo HTML y solo al dictarlo presencialmente el repartidor logra que `PATCH /deliver` valide coincidencia exacta y cambie el estado.
10. **¿Qué impide que alguien use fuerza bruta contra los 10.000 posibles códigos del PIN de 4 dígitos?**
    - `rateLimit.middleware.ts` limita `PATCH /deliver` a 20 intentos cada 15 minutos por IP y devuelve `429 Too Many Requests`.
11. **¿Por qué usan Server-Sent Events (SSE) y no WebSockets puros?**
    - Porque el flujo operativo de estados y cola de pedidos es unidireccional (servidor → paneles/cliente sobre HTTP estándar con reconexión automática del navegador via `EventSource`), evitando complejidad de handshake binario en proxies HTTPS como Render, apoyado por polling de respaldo.
12. **¿Cómo protegen el canal SSE para que un extraño no escuche pedidos ajenos?**
    - `sse.ts` filtra cada evento saliente y únicamente envía datos de una orden al cliente cuyo `orderId` autorizado coincide o a conexiones staff autenticadas (`CAJERO`, `EMPAQUETADOR`, `REPARTIDOR`, `ADMIN`).
13. **¿Cómo impiden que una imagen subida en `/uploads` ejecute código JavaScript malicioso?**
    - Se validan MIME types y tamaños en subida, y Express sirve `/uploads` bajo cabecera `Content-Security-Policy: default-src 'none'; sandbox` + `X-Content-Type-Options: nosniff`.
14. **¿Qué ocurre cuando un Cajero rechaza un comprobante de Depósito Bancario?**
    - En la misma transacción ACID, el pago pasa a `RECHAZADO`, el pedido pasa a `RECHAZADO` registrado en `OrderStatusHistory`, y `releaseStockTx` devuelve automáticamente cada unidad reservada a `stockDisponible` generando un asiento en Kardex.
15. **¿Cómo es la estrategia de despliegue en la nube y qué cambia respecto al entorno local?**
    - Localmente usamos `embedded-postgres` en puerto `5433` automatizado por `scripts/dev-db.mjs`; en producción, `render.yaml` aprovisiona un PostgreSQL 16 administrado y un Web Service Node.js que ejecuta `prisma db push`, compila `client/dist` y `server/dist` y sirve todo unificado desde un único dominio HTTPS.
