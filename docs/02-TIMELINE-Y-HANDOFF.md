# 02 — Línea de Tiempo de Ejecución y Handoff

## Estado General por Fases

### Fase 0: Workspace, Skills de Diseño Anti-Slop y Assets Reales
- [x] Inicializar monorepo en `C:\Users\VICTUS\.gemini\antigravity\scratch\joyride-cafe-sucre` con Git.
- [x] Instalar suite de skills en `.agent/skills/`: `impeccable`, `taste-skill`, `ui-ux-pro-max`, `design-system`, `better-ui`, `better-typography`, `better-motion`, `better-colors`, `better-accessibility`, `interface-review`.
- [x] Crear `client/public/favicon.svg`, `package.json` raíz, `.gitignore` y `.env` / `.env.example`.
- [x] Descargar y optimizar logo oficial y fotografías reales de `joyridebol.com` + completar imágenes gastronómicas optimizadas en `client/public/images/*.webp`.

### Fase 1: Documentación Viva, PostgreSQL Local, Prisma Schema y Render Blueprint
- [x] Crear `GEMINI.md`, `PRODUCT.md`, `DESIGN.md`, `docs/01-ARQUITECTURA-Y-ENFOQUE.md`, `docs/02-TIMELINE-Y-HANDOFF.md`, `docs/03-MATRIZ-SIS324-Y-DEFENSA.md`.
- [x] Crear `render.yaml` y `scripts/dev-db.mjs` (`embedded-postgres` en puerto `5433`).
- [x] Crear `server/package.json` (`prisma@6.19.3`), `server/prisma/schema.prisma` y `server/prisma/seed.ts`.
- [x] Verificar arranque de PostgreSQL local, `prisma db push` y seed idempotente.

### Fase 2: Backend Blindado + Integración Pagos + RBAC + Pruebas E2E
- [x] Servicios de Inventario Atómico, Máquina de Estados y SSE.
- [x] Pasarela QR Verificable en vivo (HMAC + URL) y Depósito Bancario con revisión de Cajero.
- [x] Servicio PayPal Orders API v2 (`create-order`, `capture-order`, `cancel-order`, `config`).
- [x] Flujos RBAC: `EMPAQUETADOR` (Checklist 100% + PIN), `REPARTIDOR` (Pickup + Entrega por PIN), `ADMIN` (KPIs, CRUD, Kardex, Usuarios) y `RESERVAS`.
- [x] Compilación `tsc --noEmit` sin errores y suite `test-e2e.ts` 100% aprobada.

### Fase 3: Frontend Impeccable + Taste (60-30-10, Shimmers, 5 Layouts, Modales y Paneles)
- [x] Design System Tailwind 3.4 + Skeleton Shimmers reutilizables (cero spinners).
- [x] 5 Layouts obligatorios: Hero Full Bleed, Bento Grid, Editorial Asimétrico + Carta AJAX, Masonry Gallery, Split Screen Auth con acceso demo 1-clic.
- [x] Modales completos: Quick-View (con Maridaje), Cart/Checkout Dual + Split-Bill, QR Interactivo en Vivo, `/pagar-qr/:qrToken`, Auditoría/Timeline con PIN, Reservas/Salsa.
- [x] Paneles operativos (`Operate` mode): Cajero, Empaquetador Kanban, Repartidor PIN, Admin Analytics + Kardex.

### Fase 4: Build de Producción, Auditoría Visual en Navegador y Polish
- [x] `npm run build` exitoso (frontend + backend unificados).
- [x] Auditoría real en navegador (`1440x900` y `390x844`): flujos completos de compra QR, Empaque, Entrega por PIN, Cajero y Admin + correcciones de header móvil (`390px`), imágenes eager y Recharts bars.
- [x] Cierre documental final y verificación en puerto de producción.

### Fase 5: Upgrade V2 (UX Responsivo, Mapas $0, Chat en Vivo, QR BNB Real, Correos HTML y DNS/Túnel)
- [x] Activos V2: QR Real BNB integrado en `/assets/brand/qr-bnb-real.jpg`, 10 fotografías adicionales `.webp` de coctelería y ambiente nocturno (`client/public/images/`), y dependencias `nodemailer`, `leaflet`, `react-leaflet`.
- [x] Base de datos y backend V2: `ChatMessage`, `EmailLog`, `NewsletterSubscriber`, GPS/ETA en `Order` y `DeliveryTracking`, 5 plantillas HTML de correo, chat en tiempo real (`/api/chat/*`), `PATCH /api/delivery/orders/:id/location` y centro de correos/campañas (`/api/admin/emails*`).
- [x] Frontend V2: tipografía y targets responsivos (`390px`, `768px`, `1024px`, `1440px`), transición animada Split-Curtain al cerrar sesión, Split-Screen animado en Auth, barra superior de progreso y transiciones de ruta, WhatsApp flotante (`+591 76116875`), enlaces oficiales (Instagram, Facebook, TikTok, Web), Guía Turística `/mapa-sucre`, Mapa PedidosYa en vivo con OSRM, Chat directo Cliente-Repartidor y Chat Interno del Staff, Recibo Oficial imprimible/PDF, Modal QR dual (BNB Real + Dinámico), GPS del Repartidor y pestaña **Correos HTML & Novedades** en Admin.
- [x] DNS local (`scripts/setup-local-dns.ps1` -> `joyride.local`), script `expose:live` (`localtunnel`) y guía [`docs/04-DEPLOY-DNS-Y-TUNEL-ENVIVO.md`](./04-DEPLOY-DNS-Y-TUNEL-ENVIVO.md).

### Fase 6: Upgrade V3 (Escala 1920px, Concierge WhatsApp, Flip-Cards 3D, Carrusel Turismo, Reseñas Google & Upload Archivo)
- [x] Activos turísticos reales en `client/public/images/`: `sucre-chocolates.webp`, `sucre-rooftop-terraza.webp`, `sucre-purgatorium.webp`, `sucre-colonial-museum.webp`, `sucre-mirador-sunset.webp`, `sucre-maragua-bike.webp`.
- [x] Backend V3: modelo `Review` + `/api/reviews`, endpoint `POST /api/admin/products/upload-image` (subida real de archivos al catálogo), y chat de pedido en modo solo lectura para `ADMIN` (exclusivo Cliente ↔ Repartidor).
- [x] Escala espacial `max-w-[1640px]` en landing, Auth Split-Screen, barra superior sin solapamientos, y backdrop cinema blur en modales/drawers.
- [x] WhatsApp Concierge animado (`WhatsAppFloat.tsx`), tarjetas Bento con expansión por Z-index, Cartillas de Menú 3D (`MenuFlipCard`), Carrusel de Eventos & Turismo (`SucreEventsTourismCarousel.tsx` con Chocolates Para Ti, El Purgatorium, Terraza 625, etc.), Muro de Reseñas inclinado orgánico (`MasonryCommunity.tsx`), Mapa Sucre con GPS + rutas OSRM + ficha con shimmer & galería bajo el mapa (`SucreMapGuidePage.tsx`), y footer editorial.

---

## Decisiones Arquitectónicas (ADRs)
1. **ADR-01 (Servicio Unificado en Render):** Express sirve tanto `/api/*` como el build estático `client/dist` con SPA fallback, evitando errores de CORS y cold starts dobles en Render Free Tier.
2. **ADR-02 (PostgreSQL Local Cero-Fricción en Windows):** `embedded-postgres@18.6.0-beta.19` en `devDependencies` raíz (puerto `5433`, carpeta `.pgdata`) para usar el motor real PostgreSQL sin Docker ni dependencias globales, manteniendo `server/package.json` limpio para despliegues Linux en Render.
3. **ADR-03 (Prisma 6.19.3 y Tailwind 3.4.17):** Pineados explícitamente a versiones estables probadas para garantizar `schema.prisma` y `tailwind.config.ts` determinísticos.
4. **ADR-04 (Optimización Local de Imágenes):** Todas las imágenes de `joyridebol.com` y gastronomía se procesan localmente con `sharp` a `.webp <= 120 KB` para garantizar carga instantánea (`< 1s`) y cero URLs externas rotas en defensa.
5. **ADR-05 (Mapas Gratuitos sin Tarjeta):** Uso directo de `leaflet` + teselas Esri World Street Map (en modo oscuro) + OSRM público + enlaces web estándar a Google Maps (`$0` facturación).

---

## PUNTO DE RETOMA (HANDOFF PARA SIGUIENTE IA / SESIÓN)
- **Estado actual:** Sistema V2 100% construido, compilado y verificado end-to-end en PostgreSQL local (puerto `5433`), suite E2E de 12 bloques (`test-e2e.ts`) y auditoría visual/funcional multi-dispositivo (`390x844`, `768x1024`, `1440x900`).
- **Para arrancar en desarrollo completo (DB + API + Vite HMR):** ejecutar `npm.cmd run dev` en la raíz del proyecto (`C:\Users\VICTUS\.gemini\antigravity\scratch\joyride-cafe-sucre`).
- **Para usar dominio local `joyride.local`:** ejecutar una vez como Administrador `npm.cmd run dns:setup` y abrir `http://joyride.local:4000`.
- **Para exponer en vivo durante presentación:** ejecutar `npm.cmd run expose:live` (ver `docs/04-DEPLOY-DNS-Y-TUNEL-ENVIVO.md`).
