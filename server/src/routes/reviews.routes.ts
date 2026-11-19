import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const publicReviewLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Demasiadas reseñas enviadas en poco tiempo. Espera unos minutos.',
});

const safePhotoUrlSchema = z
  .string()
  .max(300)
  .refine(
    (val) =>
      val.startsWith('/images/') ||
      val.startsWith('/uploads/') ||
      /^https:\/\/[^\s]+$/i.test(val),
    { message: 'La imagen debe ser una ruta local válida (/images/ o /uploads/) o HTTPS' }
  );

const createReviewSchema = z.object({
  authorName: z.string().min(2).max(80).optional(),
  authorOrigin: z.string().min(2).max(80).optional(),
  verifiedVia: z.enum(['GOOGLE', 'CUENTA_JOYRIDE']).optional(),
  rating: z.number().int().min(1).max(5).default(5),
  comment: z.string().min(8, 'Escribe al menos 8 caracteres').max(500),
  photoUrl: safePhotoUrlSchema.optional(),
});

router.get('/', async (_req, res, next) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({ reviews });
  } catch (err) {
    next(err);
  }
});

router.post('/', publicReviewLimiter, requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const body = createReviewSchema.parse(req.body);
    const authorName = (req.user?.name || body.authorName || 'Viajero Joy Ride').trim();
    const verifiedVia =
      body.verifiedVia || (req.user ? 'CUENTA_JOYRIDE' : 'GOOGLE');

    const review = await prisma.review.create({
      data: {
        userId: req.user?.userId || null,
        authorName,
        authorOrigin: (body.authorOrigin || 'Sucre, Bolivia').trim(),
        verifiedVia,
        rating: body.rating,
        comment: body.comment.trim(),
        photoUrl: body.photoUrl || null,
      },
    });

    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
});

export default router;
