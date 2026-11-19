# GEMINI.md — Reglas de Oro y Constitución Técnica del Proyecto

## Identidad del Caso de Estudio
- **Marca:** JOY RIDE CAFÉ® — Sucre, Bolivia (Fundado en 2001)
- **Lema oficial:** *"No solo para gringos — Probably the best bar in town"*
- **Dirección física:** Calle Nicolás Ortiz N° 14 (a media cuadra de la Plaza 25 de Mayo, frente a la Catedral Metropolitana), Sucre, Chuquisaca, Bolivia.
- **Contacto real:** Tel. `4 6425544` · WhatsApp `+591 75769070` · `info@joyridebol.com` · Web `www.joyridebol.com` · IG `@joyridecafe`
- **Horarios:** Lun–Sáb `07:00 – 02:30` | Dom `07:00 – 23:30` (Desayunos/Cafetería, Almuerzos, Happy Hour `18:00 – 21:00`, Salsa & Bachata Mar/Jue/Sáb, Música en vivo y Lounge nocturno).
- **Propósito académico:** Sistema E-Commerce, Reservas, Promociones y Logística End-to-End para **SIS324** (Impacto /20, Creatividad /20, Validez /20, Relevancia /20, Presentación /10).

## Stack Tecnológico Exacto
- **Monorepo:** `server/` (Backend API + servidor unificado en producción) y `client/` (SPA React).
- **Backend:** Node.js 24, Express, TypeScript, Prisma ORM `6.19.3`, PostgreSQL (`embedded-postgres` en puerto `5433` en local; Render Managed PostgreSQL en producción), Zod, JWT (`jsonwebtoken`), HMAC-SHA256, `bcryptjs`, Server-Sent Events (SSE).
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS `3.4.17`, Framer Motion, TanStack Query (`@tanstack/react-query`), Axios, `@paypal/react-paypal-js`, `qrcode.react`, Recharts, Lucide Icons.
- **Imágenes y Favicon:** 100% locales y optimizadas en `client/public/images/*.webp` (`<= 120 KB`), logo oficial `client/public/logo-joyride.png` y `client/public/favicon.svg`.

## Regla Cromática 60-30-10 y Tipografía
- **60% Base dominante:** Obsidiana Nocturna `#0B0D12`, Superficies elevadas `#141821` / `#1B2130`, bordes `1px solid #262C3A`, texto principal `#F8FAFC`, secundario `#94A3B8`.
- **30% Primario de marca (Cian Eléctrico Joy Ride):** `#00A0DF` (hover `#0082B8`, tintes sutiles `rgba(0, 160, 223, 0.12)`).
- **10% Acento de impacto (Magenta Neón Joy Ride):** `#F20574` reservado exclusivamente para CTAs primarios de compra/confirmación, badges de *Happy Hour 2x1*, alertas de stock bajo y estados críticos.
- **Tipografía:** `Syne` (Display editorial), `Plus Jakarta Sans` (UI y lectura), `JetBrains Mono` (`tabular-nums` en precios `Bs.`/`USD`, códigos `JR-XXXX`, tokens QR, PINs de 4 dígitos y timestamps de auditoría).

## Reglas Inquebrantables de Ingeniería y UI/UX
1. **Cero Spinners Genéricos:** Prohibido usar `animate-spin` circulitos o spinners de carga en pantallas, catálogos, tablas o modales. Toda carga asíncrona usa **Skeleton Screens con animación Shimmer** (`@keyframes shimmer`).
2. **Interacción 100% Asíncrona (AJAX):** Filtros, carrito, polling/SSE de QR cada 2.5s, aprobación de depósitos, checklist de empaque y entrega por PIN operan vía TanStack Query + Axios + SSE sin recargar la página.
3. **Máquina de Estados Blindada:**
   `PENDIENTE_PAGO` → (`PAGO_EN_REVISION` si depósito) → `PAGO_CONFIRMADO` → `EN_PREPARACION` → `EMPACADO` → `EN_CAMINO` → `ENTREGADO` (o `CANCELADO` / `RECHAZADO`).
   Ningún endpoint ni rol puede saltarse etapas; toda transición valida rol (`CAJERO`, `EMPAQUETADOR`, `REPARTIDOR`, `ADMIN`, `CLIENTE`) y registra una fila inmutable en `OrderStatusHistory`.
4. **Atomicidad de Inventario en PostgreSQL:** Toda reserva, consolidación o liberación de stock ocurre dentro de `prisma.$transaction` usando `updateMany` condicional (`stockDisponible: { gte: cantidad }`) y registra un asiento en `StockMovement`. Si no hay stock suficiente, retorna `409 Conflict` detallando el faltante.
5. **Seguridad y Separación Windows/Render:** `embedded-postgres` vive únicamente en `devDependencies` del `package.json` raíz, jamás en `server/package.json`. En producción (Render), Express sirve `/api/*` y los estáticos compilados de `client/dist` con SPA fallback.
6. **Criterio Anti-Slop (Skills instaladas en `.agent/skills/`):** Sin kickers/eyebrows innecesarios sobre títulos `h2`, sin `box-shadow: 4px 4px 0`, sin gradient text decorativo, sin emojis como sistema de iconos (`lucide-react` siempre), `outline-white/10` inset en fotos, `bounce: 0` en springs de Framer Motion y `overscroll-behavior: contain` en modales/drawers.
