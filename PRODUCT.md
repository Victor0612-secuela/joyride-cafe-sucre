# PRODUCT.md — Joy Ride Café® Sucre (E-Commerce, Reservas & Logística End-to-End)

## Visión del Producto
Transformar la experiencia legendaria de **Joy Ride Café®** (Calle Nicolás Ortiz N° 14, frente a la Catedral Metropolitana en Sucre, Bolivia) en una plataforma digital completa de pedidos en línea, reservas por zona/eventos (incluyendo clases gratuitas de Salsa & Bachata), pagos reales verificables (QR Simple en vivo, Depósito Bancario y PayPal API v2) y trazabilidad logística auditable desde Cocina/Bar hasta la entrega final por PIN.

## Usuarios y Roles del Sistema
1. **`CLIENTE` (Locales, Universitarios y Turistas en Sucre):**
   - Explora la carta real con disponibilidad de stock en vivo, etiquetas dietéticas (Vegano, Picante, Happy Hour 2x1) y maridajes sugeridos.
   - Arma pedidos para Delivery en Sucre o Recojo en Local, puede calcular división de cuenta entre amigos (*Split-Bill*), reserva mesas por ambiente (Patio Colonial, Mezzanine, Pantalla Gigante, Pista Salsa & Bachata) y rastrea cada segundo de su pedido hasta recibir su **PIN de entrega de 4 dígitos**.
2. **`CAJERO`:**
   - Audita la cola de pagos por Depósito/Transferencia Bancaria (`PAGO_EN_REVISION`), inspecciona el comprobante subido y aprueba (`PAGO_CONFIRMADO`) o rechaza con motivo obligatorio (liberando stock automáticamente).
3. **`EMPAQUETADOR` (Cocina / Bar & Empaque):**
   - Opera un tablero Kanban (`Por Preparar` | `En Preparación` | `Empacados`).
   - Debe verificar ítem por ítem en un Checklist interactivo antes de poder sellar el paquete; al completar 100%, el sistema genera etiqueta `JR-PKG-XXXX` y el PIN único de 4 dígitos para el cliente.
4. **`REPARTIDOR`:**
   - Toma pedidos `EMPACADO` (`EN_CAMINO`), visualiza dirección y referencia en Sucre, y finaliza el ciclo (`ENTREGADO`) ingresando el PIN de 4 dígitos provisto por el cliente (nunca expuesto previamente al repartidor).
5. **`ADMIN`:**
   - Supervisa analítica financiera (ingresos Bs./USD por método `QR`, `DEPOSITO_BANCARIO` y `PAYPAL`), productos top, alertas de stock bajo, CRUD de catálogo/promociones, Kardex (`StockMovement`) con ajustes auditados, usuarios/roles y reservas.

## Modos de Superficie (según `impeccable`)
- **Tienda, Menú, Eventos y Pasarela QR (`/`, `/login`, `/pagar-qr/:token`):** Modo **Persuade / Experience** — atmósfera nocturna editorial, fotografía real local optimizada, regla 60-30-10 fiel al logo oficial y layouts explícitos (Hero Full Bleed, Bento Grid, Editorial Asimétrico, Masonry, Split Screen).
- **Paneles Internos (`/panel/*` y `/mis-pedidos`):** Modo **Operate** — alta legibilidad, tablas y tableros escaneables, transiciones rápidas (`150–250ms`), badges semánticos con ícono + etiqueta, cero decoración innecesaria.
