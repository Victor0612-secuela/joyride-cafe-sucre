import { Router } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const spots = await prisma.mapSpot.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ spots });
  } catch (err) {
    next(err);
  }
});

export default router;
