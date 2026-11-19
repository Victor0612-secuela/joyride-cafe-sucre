import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

export default router;
