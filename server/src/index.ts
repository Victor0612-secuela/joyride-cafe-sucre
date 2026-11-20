import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { errorHandler } from './middleware/error.middleware';
import { optionalAuth, AuthRequest } from './middleware/auth.middleware';
import { createRateLimiter } from './middleware/rateLimit.middleware';
import { registerSseClient } from './utils/sse';
import { releaseAllExpiredOrders } from './services/payment.service';
import authRoutes from './routes/auth.routes';
import catalogRoutes from './routes/catalog.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import empaqueRoutes from './routes/empaque.routes';
import deliveryRoutes from './routes/delivery.routes';
import reservationsRoutes from './routes/reservations.routes';
import adminRoutes from './routes/admin.routes';
import chatRoutes from './routes/chat.routes';
import reviewsRoutes from './routes/reviews.routes';
import eventsRoutes from './routes/events.routes';
import mapSpotsRoutes from './routes/map-spots.routes';
import { newsletterSubscribeSchema } from './validators/schemas';

const app = express();
const publicWriteLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Demasiadas solicitudes en poco tiempo. Espera unos minutos.',
});

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

const extraCorsOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = [
        env.FRONTEND_URL,
        env.APP_URL,
        'http://localhost:5173',
        'http://localhost:4000',
        ...extraCorsOrigins,
      ];
      if (
        allowed.includes(origin) ||
        /^https?:\/\/([a-z0-9-]+\.)?(joyride\.local|localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin) ||
        /^https:\/\/[a-z0-9-]+\.(onrender\.com|trycloudflare\.com|loca\.lt)$/i.test(origin) ||
        (env.NODE_ENV !== 'production' &&
          /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)[\d.]+(:\d+)?$/i.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '22mb' }));

// Static uploaded bank receipts, product photos & event media (hardened against inline script execution)
const uploadsDir = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(path.join(uploadsDir, 'receipts'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'products'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'media'), { recursive: true });
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox"
    );
    next();
  },
  express.static(uploadsDir)
);

// Static email assets (PNG logo & JPEG banners for Admin preview + email templates)
const emailAssetsCandidates = [
  path.resolve(__dirname, '../assets/email'),
  path.resolve(__dirname, '../../assets/email'),
  path.resolve(process.cwd(), 'assets/email'),
  path.resolve(process.cwd(), 'server/assets/email'),
];
const emailAssetsDir = emailAssetsCandidates.find((p) => fs.existsSync(p));
if (emailAssetsDir) {
  app.use(
    '/email-assets',
    (_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      next();
    },
    express.static(emailAssetsDir)
  );
}

// Persistent media assets stored in PostgreSQL (survives Render Free ephemeral disk restarts)
app.get('/api/media/:id', async (req, res, next) => {
  try {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: String(req.params.id) } });
    if (!asset) {
      res.status(404).json({ error: 'Recurso multimedia no encontrado' });
      return;
    }
    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; img-src 'self' data:; media-src 'self'; sandbox"
    );
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(asset.data));
  } catch (err) {
    next(err);
  }
});

// Health check for Render & readiness
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      service: 'joyride-cafe-sucre',
      database: 'postgresql',
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Database unavailable',
    });
  }
});

// Live SSE stream for order updates & staff dashboards
app.get('/api/events/stream', optionalAuth, (req: AuthRequest, res) => {
  const orderId = typeof req.query.orderId === 'string' ? req.query.orderId : undefined;
  const role = req.user?.role;
  registerSseClient(crypto.randomUUID(), res, { orderId, role });
});

// Prevent sensitive auth/payment/order API payloads from being cached in browser or proxies
app.use(
  ['/api/auth', '/api/admin', '/api/orders', '/api/payments', '/api/empaque', '/api/delivery', '/api/chat'],
  (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  }
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api', paymentsRoutes);
app.use('/api/empaque', empaqueRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/map-spots', mapSpotsRoutes);

// Public newsletter subscription for novelty/Happy Hour campaigns
app.post('/api/newsletter/subscribe', publicWriteLimiter, async (req, res, next) => {
  try {
    const body = newsletterSubscribeSchema.parse(req.body);
    const email = body.email.toLowerCase().trim();
    const sub = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true, ...(body.name ? { name: body.name.trim() } : {}) },
      create: { email, name: body.name?.trim() || null, active: true },
    });
    res.status(201).json({ subscribed: true, subscriber: sub });
  } catch (err) {
    next(err);
  }
});

// Unified Production Static Hosting for Render (client/dist)
const candidateDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../../../client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDist = candidateDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html')));

if (clientDist) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api/') ||
      req.path.startsWith('/uploads/') ||
      req.path.startsWith('/email-assets/')
    ) {
      next();
      return;
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`[API] Joy Ride Cafe Sucre server running on port ${PORT} (${env.NODE_ENV})`);
  if (clientDist) {
    console.log(`[API] Serving static frontend from ${clientDist}`);
  }
});

// Periodic cleanup of expired unpaid QR/PayPal stock reservations
setInterval(() => {
  releaseAllExpiredOrders().catch((err) => {
    console.error('[EXPIRATION SWEEP]', err);
  });
}, 60 * 1000);
