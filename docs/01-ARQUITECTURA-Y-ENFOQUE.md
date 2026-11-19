# 01 — Arquitectura y Enfoque Técnico (JOY RIDE CAFÉ® Sucre)

## 1. Diagrama de Arquitectura del Sistema

```
+----------------------------------------------------------------------------------+
|                       FRONTEND SPA (React + Vite + TS + Tailwind)                |
|  - Portada Editorial 60-30-10 (Hero, Bento, Editorial+Carta AJAX, Masonry)       |
|  - Split-Screen Auth + Modales (Quick-View, Cart/Checkout, QR Live, Auditoría)   |
|  - Paneles Operativos (Cajero, Empaquetador Kanban, Repartidor PIN, Admin KPIs)  |
|  - Skeleton Shimmers (0 spinners) · TanStack Query · Framer Motion · SSE Client  |
+-----------------------------------------+----------------------------------------+
                                          | HTTPS / JSON + SSE (/api/events/*)
                                          v
+----------------------------------------------------------------------------------+
|                   BACKEND UNIFICADO (Node.js 24 + Express + TS)                  |
|  - Middleware: Helmet, CORS, Zod Validation, JWT + Refresh, RBAC (5 Roles)       |
|  - Servicios:                                                                    |
|      * InventoryService  -> prisma.$transaction + updateMany condicional (Stock) |
|      * OrderStateService -> Máquina de estados estricta + OrderStatusHistory     |
|      * PaymentService    -> QR HMAC Verificable + Depósito Bancario con Voucher  |
|      * PayPalService     -> OAuth2 + Orders API v2 (Create & Capture)            |
|      * EmpaqueService    -> Checklist ítem x ítem + Sello + PIN de 4 dígitos     |
|      * DeliveryService   -> Retiro y entrega validada con PIN de 4 dígitos       |
|      * ReservationService-> Zonas Joy Ride + Clases Salsa/Bachata + Pase QR      |
|  - Producción Render: Sirve /api/* + estáticos /client/dist + SPA fallback       |
+-----------------------------------------+----------------------------------------+
                                          | Prisma ORM 6.19.3
                                          v
+----------------------------------------------------------------------------------+
|                    BASE DE DATOS POSTGRESQL (12 Tablas + Índices)                |
|  - Local: embedded-postgres (puerto 5433) · Producción: Render Managed Postgres  |
+----------------------------------------------------------------------------------+
```

## 2. Modelo Entidad-Relación (ERD)

```
User (id, name, email[UQ], passwordHash, role, phone, active)
  |--< Order (id, orderCode[UQ], userId, status, deliveryType, subtotalBs, discountBs,
  |          totalBs, totalUsd, deliveryAddress, deliveryReference, phoneContact, expiresAt)
  |      |--< OrderItem (id, orderId, productId, productName, unitPriceBs, quantity, subtotalBs)
  |      |--- Payment (id, orderId[UQ], method, status, amountBs, amountUsd, qrToken[UQ],
  |      |             qrSignature, bankName, referenceNumber, comprobanteUrl,
  |      |             paypalOrderId[UQ], paypalCaptureId, verificadoPorId, verifiedAt)
  |      |--- PackagingChecklist (id, orderId[UQ], empaquetadorId, items[JSON],
  |      |                        sealCode, allVerified, notes, startedAt, completedAt)
  |      |--- DeliveryTracking (id, orderId[UQ], repartidorId, deliveryAddress, deliveryPin,
  |      |                      packageLabelCode, pickedUpAt, deliveredAt, receiverName)
  |      |--< OrderStatusHistory (id, orderId, actorId, actorName, actorRole, fromStatus, toStatus, reason)
  |--< StockMovement (id, productId, orderId, actorId, type, quantity, previousStock, newStock, reason)
  |--< Reservation (id, code[UQ], userId, guestName, zone, date, timeSlot, partySize, includeSalsaClass, status)

Category (id, slug[UQ], name, description, sortOrder)
  |--< Product (id, categoryId, slug[UQ], name, description, precioBs, precioUsd,
                stockDisponible, stockReservado, stockMinimoAlerta,
                esVegano, esPicante, esDestacado, enHappyHour, tiempoPreparacionMin, imageUrl, maridajeSlug)
       |--< OrderItem
       |--< StockMovement

Promotion (id, slug[UQ], title, subtitle, badgeText, scheduleText, discountPercent, active)
```

### Índices y Restricciones Clave
- `Order.orderCode`, `Payment.qrToken`, `Payment.paypalOrderId`, `Reservation.code`, `User.email`, `Product.slug`, `Category.slug`: índices únicos.
- `Order(status, createdAt)` e `Order(userId, createdAt)`: índices compuestos para consultas operativas y de historial en `< 10ms`.
- `StockMovement(productId, createdAt)`: índice para el Kardex auditable por producto.

## 3. Máquina de Estados del Pedido y Reglas de Concurrencia

```
                        +--> [PAGO_EN_REVISION] --(Cajero Rechaza)--> [RECHAZADO] (libera stock)
                        |          |
                        |   (Cajero Aprueba)
                        v          v
[PENDIENTE_PAGO] --(QR / PayPal / Depósito OK)--> [PAGO_CONFIRMADO] (consolida reserva)
       |                                                 |
  (Expira 15m / Cancelado)                    (Empaquetador inicia)
       v                                                 v
  [CANCELADO] (libera stock)                     [EN_PREPARACION]
                                                         |
                                              (100% Checklist + Sello + PIN)
                                                         v
                                                    [EMPACADO]
                                                         |
                                               (Repartidor recoge)
                                                         v
                                                   [EN_CAMINO]
                                                         |
                                             (Cliente entrega PIN 4 dígitos)
                                                         v
                                                   [ENTREGADO]
```

### Reglas de Concurrencia de Inventario (`InventoryService`)
1. **Reserva atómica (`RESERVA_PEDIDO`):** Al crear cualquier pedido (`QR`, `DEPOSITO_BANCARIO` o `PAYPAL`), se ejecuta `prisma.$transaction` con `tx.product.updateMany({ where: { id, stockDisponible: { gte: qty }, active: true }, data: { stockDisponible: { decrement: qty }, stockReservado: { increment: qty } } })`. Esto evita condiciones de carrera (overselling) a nivel SQL. Si algún producto no alcanza (`count !== 1`), toda la transacción hace rollback y devuelve `409 Conflict` detallando el stock real restante.
2. **Consolidación (`VENTA_CONFIRMADA`):** Al confirmarse el pago (QR, Aprobación Cajero o PayPal Capture), se descuenta `stockReservado` y se asienta `StockMovement`.
3. **Liberación automática (`LIBERACION_STOCK`):** Si el usuario cancela, el cajero rechaza el depósito o expira el temporizador de 15 min de un QR/PayPal pendiente, un barrido transaccional devuelve `stockReservado` → `stockDisponible` de forma atómica.
