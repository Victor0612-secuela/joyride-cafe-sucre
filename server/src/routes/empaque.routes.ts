import { Router } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.middleware';
import {
  finishPacking,
  listPackingOrders,
  startPreparation,
  updateChecklist,
} from '../services/empaque.service';
import { finishPackingSchema, updateChecklistSchema } from '../validators/schemas';

const router = Router();

router.use(requireAuth, requireRoles(Role.EMPAQUETADOR, Role.ADMIN));

router.get('/orders', async (_req, res, next) => {
  try {
    const orders = await listPackingOrders();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/start', async (req: AuthRequest, res, next) => {
  try {
    const result = await startPreparation(String(req.params.id), {
      userId: req.user!.userId,
      name: req.user!.name,
      role: req.user!.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/checklist', async (req: AuthRequest, res, next) => {
  try {
    const body = updateChecklistSchema.parse(req.body);
    const packaging = await updateChecklist(String(req.params.id), body.items, body.notes, req.user!.userId);
    res.json({ packaging });
  } catch (err) {
    next(err);
  }
});

router.patch('/orders/:id/finish-packing', async (req: AuthRequest, res, next) => {
  try {
    const body = finishPackingSchema.parse(req.body || {});
    const result = await finishPacking(String(req.params.id), body.notes, {
      userId: req.user!.userId,
      name: req.user!.name,
      role: req.user!.role,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
