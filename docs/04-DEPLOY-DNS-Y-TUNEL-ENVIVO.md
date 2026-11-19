# 04 — DNS Local, Túnel En Vivo Gratis y Despliegue en la Nube (Cero Cobros)

Esta guía documenta cómo presentar **JOY RIDE CAFÉ® — Sucre** con dominio limpio local, URL pública instantánea para tu defensa de **SIS324**, y despliegue permanente gratuito, manteniendo **\$0 de cobro** en mapas y APIs.

---

## 1. DNS Local en Windows (`http://joyride.local:4000`)

Para dejar de usar `localhost:4000` o IPs en tu presentación:

1. Abre **PowerShell como Administrador**.
2. Ejecuta en la raíz del proyecto (`C:\Users\VICTUS\.gemini\antigravity\scratch\joyride-cafe-sucre`):

```powershell
npm.cmd run dns:setup
```

Esto ejecuta [`scripts/setup-local-dns.ps1`](../scripts/setup-local-dns.ps1), que agrega de forma idempotente `127.0.0.1 joyride.local` y `127.0.0.1 www.joyride.local` en `C:\Windows\System32\drivers\etc\hosts` y vacía la caché DNS (`ipconfig /flushdns`).

3. Abre tu navegador en:
   - **`http://joyride.local:4000`** (Backend + Frontend unificado)
   - **`http://joyride.local:5173`** (Frontend Vite HMR en desarrollo)

Para revertirlo en cualquier momento (como Administrador):
```powershell
npm.cmd run dns:remove
```

> Nota: Tanto Express (`server/src/index.ts`) como `QrLivePaymentModal` detectan dinámicamente el host actual (`joyride.local`, `localhost` o dominio de túnel HTTPS), por lo que el enlace `/pagar-qr/:qrToken` funciona automáticamente en el dominio desde donde abras la app.

---

## 2. Exponer la App En Línea En Vivo (Gratis, para el Docente o Celulares en Clase)

Con el servidor corriendo en el puerto `4000` (por ejemplo con `npm.cmd run dev` o `npm.cmd start`):

### Opción A: `localtunnel` (ya preconfigurado en `package.json`)
En una segunda terminal:
```powershell
npm.cmd run expose:live
```
O especificando un subdominio amigable:
```powershell
npx.cmd localtunnel --port 4000 --subdomain joyride-sucre-live
```
- Te entregará una URL pública HTTPS (ej. `https://joyride-sucre-live.loca.lt`).
- **Tip:** Si `localtunnel` pide una contraseña de verificación única al abrirse por primera vez, basta ingresar la IP pública mostrada en `https://loca.lt/mytunnelpassword`.

### Opción B: Cloudflare Quick Tunnel (`cloudflared`, sin cuenta ni tarjeta, sin pantalla de password)
Si instalas `cloudflared` (`winget install Cloudflare.cloudflared` en Windows):
```powershell
cloudflared tunnel --url http://localhost:4000
```
Genera una URL `https://*.trycloudflare.com` directa, rápida y lista para que cualquier celular escanee el QR real o dinámico en tiempo real durante la exposición.

---

## 3. Despliegue Permanente en Render (`render.yaml` Blueprint) vs Vercel

### ¿Por qué Render para este sistema completo (y qué pasa con Vercel)?
- **Vercel** está pensado principalmente para frontends estáticos (`client/`) y funciones *serverless* efímeras: no guarda archivos subidos en disco (`/uploads/products/` o comprobantes bancarios), limita la duración de streams **SSE** en tiempo real y requiere configurar base de datos PostgreSQL externa aparte.
- **Render (`render.yaml`)** despliega en 1 clic nuestro servicio unificado Node/Express + **SSE en vivo** + almacenamiento local en ejecución + **PostgreSQL** provisionado gratuitamente sin tarjeta en Free Tier. (Si quisieras usar Vercel exclusivamente para el frontend `client/`, deberías apuntar `VITE_API_URL` hacia la API hospedada en Render o Railway.)

### Pasos para desplegar gratis en Render:

El repositorio incluye [`render.yaml`](../render.yaml) configurado como servicio unificado (Node/Express + PostgreSQL):

1. Sube el proyecto a un repositorio GitHub.
2. En **Render Dashboard → Blueprints → New Blueprint Instance**, selecciona el repositorio.
3. Render aprovisionará gratuitamente:
   - Base de datos PostgreSQL `joyride-db`
   - Web Service `joyride-cafe-sucre` (`build:server` + `build:client` y arranque con `prisma db push`)
4. Variables opcionales que puedes configurar cuando quieras:
   - `APP_URL`: URL pública asignada por Render (`https://joyride-cafe-sucre.onrender.com`)
   - `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`: Credenciales gratuitas de **PayPal Developer Sandbox** (si están vacías, la pasarela funciona en modo Sandbox demostrativo sin cobros)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`: Opcional (ej. Gmail App Password o Brevo Free Tier). Si están vacías, **todos los correos HTML se generan y persisten igualmente en PostgreSQL (`EmailLog`)** y pueden inspeccionarse en tiempo real desde **Panel Admin → Correos HTML & Novedades**.

---

## 4. Garantía de Cero Cobros en Mapas y Georreferenciación

Para protegerte de cargos inesperados de Google Cloud Billing:
- **Mapa Interactivo (`LiveDeliveryMap` y `/mapa-sucre`)**: utiliza `Leaflet 1.9.4` + teselas **Esri World Street Map** en modo oscuro (ArcGIS público gratuito sin API key ni tarjeta) + enrutamiento público **OSRM** con fallback de trazado directo.
- **Integración con Google Maps (100% gratis)**: todos los botones *"Abrir ruta en Google Maps"* generan enlaces web estándar (`https://www.google.com/maps/dir/?api=1&origin=...&destination=...`), los cuales abren la app nativa o web de Google Maps en el dispositivo sin consumir cuota ni requerir clave de facturación de Google Maps Platform.
