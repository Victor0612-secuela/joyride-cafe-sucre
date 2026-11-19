import { Router } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AuthRequest, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { active: true } } } },
      },
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

router.get('/products', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const { category, vegan, happyHour, search, includeInactive } = req.query;

    const where: Record<string, unknown> = {};
    const allowInactive = includeInactive === 'true' && req.user?.role === Role.ADMIN;
    if (!allowInactive) where.active = true;
    if (typeof category === 'string' && category && category !== 'all') {
      where.category = { slug: category };
    }
    if (vegan === 'true') where.esVegano = true;
    if (happyHour === 'true') where.enHappyHour = true;
    if (typeof search === 'string' && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ esDestacado: 'desc' }, { category: { sortOrder: 'asc' } }, { name: 'asc' }],
      include: {
        category: { select: { id: true, slug: true, name: true } },
      },
    });

    res.json({
      exchangeRate: env.USD_EXCHANGE_RATE,
      products: products.map((p) => ({
        ...p,
        precioBs: Number(p.precioBs),
        precioUsd: Number(p.precioUsd),
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/promotions', async (_req, res, next) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ promotions });
  } catch (err) {
    next(err);
  }
});

export default router;
