import { Router } from 'express';
import { PaymentStatus, Role } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';
import {
  confirmQrPayment,
  getQrPublicInfo,
  initiateQrPayment,
  listDepositReviews,
  reviewDepositPayment,
  submitDepositPayment,
} from '../services/payment.service';
import {
  cancelPayPalOrder,
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalPublicConfig,
} from '../services/paypal.service';
import {
  cancelStripePaymentIntent,
  confirmStripePaymentIntent,
  createStripePaymentIntent,
  getStripePublicConfig,
} from '../services/stripe.service';
import {
  createOrderBaseSchema,
  depositSubmitSchema,
  paypalCaptureSchema,
  reviewDepositSchema,
  stripeConfirmSchema,
} from '../validators/schemas';

const router = Router();
const qrConfirmLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Demasiados intentos sobre la pasarela QR. Intenta nuevamente en unos minutos.',
});

// --- QR Live Gateway ---
function resolvePublicBaseUrl(req: AuthRequest): string | undefined {
  const fwdHost = req.headers['x-forwarded-host'];
  const hostHeader = (Array.isArray(fwdHost) ? fwdHost[0] : fwdHost) || req.headers.host;
  const fwdProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(fwdProto) ? fwdProto[0] : fwdProto) || req.protocol || 'http';
  if (hostHeader && !hostHeader.includes('localhost:5173')) {
    return `${proto}://${hostHeader}`;
  }
  return undefined;
}

router.post('/payments/qr/initiate', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = createOrderBaseSchema.parse(req.body);
    const result = await initiateQrPayment({
      ...body,
      userId: req.user!.userId,
      userName: req.user!.name,
      publicBaseUrl: resolvePublicBaseUrl(req),
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/payments/qr/info/:qrToken', async (req, res, next) => {
  try {
    const info = await getQrPublicInfo(String(req.params.qrToken));
    res.json(info);
  } catch (err) {
    next(err);
  }
});

router.post('/payments/qr/confirm/:qrToken', qrConfirmLimiter, async (req, res, next) => {
  try {
    const result = await confirmQrPayment(String(req.params.qrToken));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// --- Bank Deposit & Cashier Review ---
router.post('/payments/deposit/submit', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = depositSubmitSchema.parse(req.body);
    const result = await submitDepositPayment({
      ...body,
      userId: req.user!.userId,
      userName: req.user!.name,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get(
  '/cajero/payments',
  requireAuth,
  requireRoles(Role.CAJERO, Role.ADMIN),
  async (req, res, next) => {
    try {
      const status = typeof req.query.status === 'string' && req.query.status in PaymentStatus
        ? (req.query.status as PaymentStatus)
        : undefined;
      const payments = await listDepositReviews(status);
      res.json({ payments });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/cajero/payments/:paymentId/review',
  requireAuth,
  requireRoles(Role.CAJERO, Role.ADMIN),
  async (req: AuthRequest, res, next) => {
    try {
      const body = reviewDepositSchema.parse(req.body);
      const result = await reviewDepositPayment({
        paymentId: String(req.params.paymentId),
        decision: body.decision,
        notes: body.notes,
        cashierId: req.user!.userId,
        cashierName: req.user!.name,
        cashierRole: req.user!.role,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// --- PayPal Official Orders API v2 ---
router.get('/payments/paypal/config', (_req, res) => {
  res.json(getPayPalPublicConfig());
});

router.post('/payments/paypal/create-order', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = createOrderBaseSchema.parse(req.body);
    const result = await createPayPalOrder({
      ...body,
      userId: req.user!.userId,
      userName: req.user!.name,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/payments/paypal/capture-order', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = paypalCaptureSchema.parse(req.body);
    const result = await capturePayPalOrder({
      paypalOrderId: body.paypalOrderId,
      orderId: body.orderId,
      userId: req.user!.userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/payments/paypal/cancel-order/:orderId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await cancelPayPalOrder(String(req.params.orderId), req.user!.userId);
    res.json(result || { cancelled: false });
  } catch (err) {
    next(err);
  }
});

// --- Stripe Cards Gateway (PaymentIntents API / Test Express) ---
router.get('/payments/stripe/config', (_req, res) => {
  res.json(getStripePublicConfig());
});

router.post('/payments/stripe/create-intent', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = createOrderBaseSchema.parse(req.body);
    const result = await createStripePaymentIntent({
      ...body,
      userId: req.user!.userId,
      userName: req.user!.name,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/payments/stripe/confirm-intent', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = stripeConfirmSchema.parse(req.body);
    const result = await confirmStripePaymentIntent({
      orderId: body.orderId,
      paymentIntentId: body.paymentIntentId,
      cardBrand: body.cardBrand,
      cardLast4: body.cardLast4,
      userId: req.user!.userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/payments/stripe/cancel-intent/:orderId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const result = await cancelStripePaymentIntent(String(req.params.orderId), req.user!.userId);
    res.json(result || { cancelled: false });
  } catch (err) {
    next(err);
  }
});

export default router;
