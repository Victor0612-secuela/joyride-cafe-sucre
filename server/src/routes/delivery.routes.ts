import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';
import { deliverOrder, listDeliveryOrders, pickupOrder, updateRiderLocation } from '../services/delivery.service';
import { deliverOrderSchema, updateRiderLocationSchema } from '../validators/schemas';

const router = Router();
const pinDeliverLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Demasiados intentos de validación de PIN. Espera unos minutos.',
});

router.use(requireAuth, requireRoles(Role.REPARTIDOR, Role.ADMIN));

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await listDeliveryOrders();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/pickup', async (req: AuthRequest, res, next) => {
  try {
    const result = await pickupOrder(String(req.params.id), {
      userId: req.user!.userId,
      name: req.user!.name,
      role: req.user!.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/deliver', pinDeliverLimiter, async (req: AuthRequest, res, next) => {
  try {
    const body = deliverOrderSchema.parse(req.body);
    const result = await deliverOrder({
      orderId: String(req.params.id),
      pin: body.pin,
      receiverName: body.receiverName,
      notes: body.notes,
      actor: {
        userId: req.user!.userId,
        name: req.user!.name,
        role: req.user!.role,
      },
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/location', async (req: AuthRequest, res, next) => {
  try {
    const body = updateRiderLocationSchema.parse(req.body);
    const result = await updateRiderLocation({
      orderId: String(req.params.id),
      riderLat: body.riderLat,
      riderLng: body.riderLng,
      etaMinutes: body.etaMinutes,
      riderId: req.user!.userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
