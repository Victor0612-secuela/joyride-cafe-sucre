import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const DEFAULT_JWT_SECRET = 'joyride-sucre-dev-jwt-secret-2026';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/joyride?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'joyride-sucre-dev-refresh-secret-2026',
  HMAC_SECRET: process.env.HMAC_SECRET || 'joyride-sucre-qr-hmac-secret-2026',
  APP_URL: (process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:4000').replace(/\/$/, ''),
  FRONTEND_URL: (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, ''),
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').trim(),
  USD_EXCHANGE_RATE: Number(process.env.USD_EXCHANGE_RATE || 6.96),
  PAYPAL_MODE: (process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox',
  PAYPAL_CLIENT_ID: (process.env.PAYPAL_CLIENT_ID || '').trim(),
  PAYPAL_CLIENT_SECRET: (process.env.PAYPAL_CLIENT_SECRET || '').trim(),
  STRIPE_PUBLISHABLE_KEY: (process.env.STRIPE_PUBLISHABLE_KEY || '').trim(),
  STRIPE_SECRET_KEY: (process.env.STRIPE_SECRET_KEY || '').trim(),
  MANAGER_EMAIL: (process.env.MANAGER_EMAIL || 'victor2004612@gmail.com').trim(),
  RESEND_API_KEY: (process.env.RESEND_API_KEY || '').trim(),
  SMTP_HOST: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: (process.env.SMTP_USER || '').trim(),
  SMTP_PASS: (process.env.SMTP_PASS || '').trim(),
  SMTP_FROM: (process.env.SMTP_FROM || 'Joy Ride Café Sucre <villarroelmolina2004612@gmail.com>').trim(),
};

if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEFAULT_JWT_SECRET) {
  console.warn('[SECURITY WARN] Production server is using default JWT_SECRET fallback!');
}
