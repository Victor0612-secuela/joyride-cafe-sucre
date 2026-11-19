# 03 — Matriz de Cumplimiento SIS324 y Guión de Defensa en Vivo

## 1. Matriz de Evaluación SIS324 (90 / 90 pts objetivo)

| Criterio SIS324 | Puntos | Evidencia Implementada en Joy Ride Café® Sucre | Estado |
|---|---:|---|---|
| **Impacto** | /20 | Sistema End-to-End productivo desplegable en Render con PostgreSQL real, cobros verificables en vivo (QR, Depósito, PayPal v2) y trazabilidad completa hasta entrega por PIN. | Verificado |
| **Creatividad** | /20 | Identidad auténtica Joy Ride Café® Sucre (60-30-10 negro/cian/magenta), 5 layouts curados, Skeleton Shimmers, Maridaje Sugerido en 1 clic, Calculadora *Dividir la Ronda (Split-Bill)*, Reservas por Zona + Clases Salsa/Bachata con Pase QR. | Verificado |
| **Validez** | /20 | Atomicidad SQL de inventario (`prisma.$transaction` + `updateMany` condicional), máquina de estados sin saltos, RBAC estricto de 5 roles, validación Zod en cada endpoint, HMAC-SHA256 en tokens QR. | Verificado |
| **Relevancia** | /20 | Caso de estudio real de Sucre (Calle Nicolás Ortiz N° 14), catálogo de platos bolivianos/internacionales, Happy Hour 2x1, soporte dual `Bs.` / `USD` y roles operativos reales de resto-bar. | Verificado |
| **Presentación** | /10 | Dirección de arte anti-slop (`impeccable` + `taste-skill` + `better-ui`), acceso demo 1-clic por rol en Split-Screen, pasarela móvil `/pagar-qr/:token` en vivo y panel analítico Admin con Recharts. | Verificado |

### Cumplimiento Puntual de Requerimientos del Docente
1. **Control estricto de stock disponible:** Reserva atómica al ordenar (`stockDisponible` → `stockReservado`), rechazo `409 Conflict` si falta stock, consolidación al confirmar pago y restitución automática al cancelar, rechazar o expirar (15 min). Kardex completo en `StockMovement`.
2. **Cobro real con QR funcional y Depósito Bancario:**
   - **Vía A (QR):** QR renderizado apunta a `${APP_URL}/pagar-qr/:qrToken`. Al escanear desde celular (en Render) o abrir en otra pestaña en local, se confirma el pago y el checkout en la pantalla principal detecta el cambio en vivo vía SSE/AJAX.
   - **Vía B (Depósito):** Carga de comprobante y número de operación (`PAGO_EN_REVISION`) revisado y aprobado/rechazado por el rol `CAJERO`.
3. **Cobro con PayPal APIs oficiales:** Integración directa con PayPal Orders API v2 (`/v2/checkout/orders` Create & Capture + OAuth2) y `@paypal/react-paypal-js` en frontend con conversión automática `Bs. -> USD`.
4. **Control de preparación y empaque por roles:** Rol `EMPAQUETADOR` con tablero Kanban y checklist obligatorio ítem por ítem; genera etiqueta y PIN de entrega de 4 dígitos al completar 100%.
5. **Control de entrega y finalización:** Rol `REPARTIDOR` retira (`EN_CAMINO`) y cierra el pedido (`ENTREGADO`) únicamente validando el PIN de 4 dígitos del cliente.
6. **Despliegue en Render + PostgreSQL:** Blueprint `render.yaml` listo para 1 clic en Render con PostgreSQL administrado y build unificado.

---

## 2. Cuentas Demo para Defensa (Contraseña única: `JoyRide2026!`)

| Rol | Correo | Acceso Directo / Responsabilidad |
|---|---|---|
| `CLIENTE` | `cliente@joyride.bo` | Comprar, pagar QR/Depósito/PayPal, reservar zona, ver PIN y auditoría |
| `CAJERO` | `cajero@joyride.bo` | `/panel/cajero` — Revisar comprobantes bancarios, aprobar o rechazar |
| `EMPAQUETADOR` | `empaque@joyride.bo` | `/panel/empaque` — Kanban Cocina/Bar, checklist obligatorio, generar PIN |
| `REPARTIDOR` | `repartidor@joyride.bo` | `/panel/repartidor` — Retirar paquetes `EMPACADO` y entregar validando PIN |
| `ADMIN` | `admin@joyride.bo` | `/panel/admin` — KPIs, QR vs Depósito vs PayPal, catálogo, kardex, usuarios |

---

## 3. Guión de Demostración en Vivo (3 Minutos)
1. **Minuto 0:00 – 0:45 (Impacto Visual + Catálogo Real):** Mostrar Hero Full Bleed, Happy Hour 2x1 en Bento Grid, carta interactiva de Joy Ride Café® Sucre (cambio `Bs. / USD`, stock real en vivo, maridaje sugerido en Quick-View, intentar pedir más del stock disponible → bloqueo elegante).
2. **Minuto 0:45 – 1:30 (Cobro QR Funcional en Vivo):** Agregar *Super Pique a lo Macho* + *Chuflay Especial Singani*, usar *Dividir la Ronda*, elegir **Pago QR Instantáneo**, escanear con el celular (o abrir Simulador Móvil en nueva pestaña) y pulsar *Confirmar Pago QR* → el checkout cambia automáticamente a `PAGO_CONFIRMADO` y muestra el stock descontado.
3. **Minuto 1:30 – 2:30 (Roles Logísticos sin Saltarse Estados):** En `/login` entrar con 1 clic como **Empaquetador**, iniciar preparación, marcar el checklist al 100% y sellar paquete (genera el PIN de 4 dígitos). Luego entrar como **Repartidor**, tomar el pedido (`EN_CAMINO`) y finalizar ingresando el PIN real del cliente (`ENTREGADO`). Mostrar también la cola del **Cajero** aprobando o rechazando el depósito semilla.
4. **Minuto 2:30 – 3:00 (Admin, Kardex & PayPal/Render):** Abrir **Panel Admin**, mostrar ingresos segmentados (QR vs Depósito vs PayPal), alertas de stock bajo, Kardex de movimientos atómicos (`RESERVA_PEDIDO` / `VENTA_CONFIRMADA` / `LIBERACION_STOCK`) y `render.yaml`.

---

## 4. Variables de Entorno en Render
- `DATABASE_URL`: Conectada automáticamente desde la base PostgreSQL `joyride-db` vía `render.yaml`.
- `APP_URL`: URL pública asignada por Render (ej. `https://joyride-cafe-sucre.onrender.com`) — indispensable para que el QR escaneado desde cualquier celular apunte a Internet real.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `HMAC_SECRET`: Generados automáticamente por Render (`generateValue: true`).
- `USD_EXCHANGE_RATE`: `6.96`.
- `PAYPAL_MODE`: `sandbox` (o `live`).
- `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`: Credenciales de la app REST en [developer.paypal.com](https://developer.paypal.com/).
