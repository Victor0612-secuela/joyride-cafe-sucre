import { Router } from 'express';
import { AuthRequest, optionalAuth, requireAuth } from '../middleware/auth.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';
import {
  createReservation,
  getAvailability,
  listReservations,
  updateReservationStatus,
} from '../services/reservation.service';
import { createReservationSchema, updateReservationStatusSchema } from '../validators/schemas';

const router = Router();
const reservationCreateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Demasiadas reservas enviadas en poco tiempo. Espera unos minutos.',
});

router.get('/availability', async (req, res, next) => {
  try {
    const date =
      typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
        ? req.query.date
        : new Date().toISOString().slice(0, 10);
    const zones = await getAvailability(date);
    res.json({ date, zones });
  } catch (err) {
    next(err);
  }
});

router.post('/', reservationCreateLimiter, optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = createReservationSchema.parse(req.body);
    const reservation = await createReservation({
      ...body,
      userId: req.user?.userId,
    });
    res.status(201).json({ reservation });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const includeAll = req.user!.role === 'ADMIN' || req.user!.role === 'CAJERO';
    const reservations = await listReservations(req.user!.userId, includeAll);
    res.json({ reservations });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = updateReservationStatusSchema.parse(req.body);
    const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'CAJERO';
    const reservation = await updateReservationStatus(
      String(req.params.id),
      body.status,
      req.user!.userId,
      isAdmin
    );
    res.json({ reservation });
  } catch (err) {
    next(err);
  }
});

export default router;
