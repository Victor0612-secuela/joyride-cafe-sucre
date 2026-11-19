import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { OrderStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import {
  adjustProductStock,
  getAdminAnalytics,
  listAllOrdersAdmin,
  listStockKardex,
  listUsers,
  updateUserRole,
  upsertProduct,
} from '../services/admin.service';
import {
  adjustStockSchema,
  campaignEmailSchema,
  updateUserRoleSchema,
  upsertProductSchema,
} from '../validators/schemas';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  getEmailDeliveryMode,
  sendEventActivatedCampaign,
  sendFullEmailTestSuite,
  sendNewsletterCampaign,
} from '../services/email.service';

const router = Router();

router.use(requireAuth, requireRoles(Role.ADMIN));

router.get('/analytics', async (_req, res, next) => {
  try {
    const analytics = await getAdminAnalytics();
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const status =
      typeof req.query.status === 'string' && req.query.status in OrderStatus
        ? (req.query.status as OrderStatus)
        : undefined;
    const orders = await listAllOrdersAdmin(status);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.get('/kardex', async (req, res, next) => {
  try {
    const productId = typeof req.query.productId === 'string' ? req.query.productId : undefined;
    const movements = await listStockKardex(productId);
    res.json({ movements });
  } catch (err) {
    next(err);
  }
});

const uploadImageSchema = z.object({
  imageBase64: z.string().min(20, 'Imagen inválida'),
  fileName: z.string().optional(),
});

router.post('/products/upload-image', async (req, res, next) => {
  try {
    const body = uploadImageSchema.parse(req.body);
    const match = body.imageBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!match) {
      throw new AppError(400, 'Formato inválido. Usa PNG, JPG o WEBP en base64.');
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length > 5 * 1024 * 1024) {
      throw new AppError(400, 'La imagen no debe superar 5 MB.');
    }
    const productsDir = path.resolve(process.cwd(), 'uploads', 'products');
    await fs.mkdir(productsDir, { recursive: true });
    const outName = `prod-${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(productsDir, outName), buf);
    res.status(201).json({ imageUrl: `/uploads/products/${outName}` });
  } catch (err) {
    next(err);
  }
});

router.post('/products', async (req: AuthRequest, res, next) => {
  try {
    const body = upsertProductSchema.parse(req.body);
    const product = await upsertProduct(null, body, req.user!.userId);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
});

router.put('/products/:id', async (req: AuthRequest, res, next) => {
  try {
    const body = upsertProductSchema.parse(req.body);
    const product = await upsertProduct(String(req.params.id), body, req.user!.userId);
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.post('/products/:id/stock', async (req: AuthRequest, res, next) => {
  try {
    const body = adjustStockSchema.parse(req.body);
    const product = await adjustProductStock({
      productId: String(req.params.id),
      delta: body.delta,
      reason: body.reason,
      actorId: req.user!.userId,
    });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const body = updateUserRoleSchema.parse(req.body);
    const user = await updateUserRole(String(req.params.id), body.role, body.active);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.get('/emails', async (_req, res, next) => {
  try {
    const [emails, subscribersCount] = await Promise.all([
      prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.newsletterSubscriber.count({ where: { active: true } }),
    ]);
    res.json({
      emails,
      subscribersCount,
      deliveryMode: getEmailDeliveryMode(),
      managerEmail: env.MANAGER_EMAIL,
    });
  } catch (err) {
    next(err);
  }
});

const sendSuiteSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
});

router.post('/emails/send-suite', async (req, res, next) => {
  try {
    const body = sendSuiteSchema.parse(req.body);
    const result = await sendFullEmailTestSuite(body.email);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/emails/campaign', async (req, res, next) => {
  try {
    const body = campaignEmailSchema.parse(req.body);
    const result = await sendNewsletterCampaign(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// --- Media Upload (Images + Short Promo Videos) ---
const uploadMediaSchema = z.object({
  mediaBase64: z.string().min(20, 'Archivo inválido'),
  fileName: z.string().optional(),
});

router.post('/media/upload', async (req, res, next) => {
  try {
    const body = uploadMediaSchema.parse(req.body);
    const imgMatch = body.mediaBase64.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    const vidMatch = body.mediaBase64.match(/^data:video\/(mp4|webm);base64,(.+)$/);
    if (!imgMatch && !vidMatch) {
      throw new AppError(400, 'Formato no soportado. Usa PNG, JPG, WEBP, MP4 o WEBM.');
    }
    const isVideo = Boolean(vidMatch);
    const rawExt = (imgMatch ? imgMatch[1] : vidMatch![1]).toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
    const buf = Buffer.from(imgMatch ? imgMatch[2] : vidMatch![2], 'base64');
    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (buf.length > maxSize) {
      throw new AppError(400, isVideo ? 'El video no debe superar 15 MB.' : 'La imagen no debe superar 5 MB.');
    }
    const mediaDir = path.resolve(process.cwd(), 'uploads', 'media');
    await fs.mkdir(mediaDir, { recursive: true });
    const outName = `media-${crypto.randomUUID()}.${ext}`;
    await fs.writeFile(path.join(mediaDir, outName), buf);
    res.status(201).json({
      mediaUrl: `/uploads/media/${outName}`,
      mediaType: isVideo ? 'video' : 'image',
    });
  } catch (err) {
    next(err);
  }
});

// --- Dynamic Events CRUD & Activate/Notify ---
const eventSchema = z.object({
  title: z.string().min(3).max(140),
  subtitle: z.string().min(3).max(200),
  description: z.string().min(8).max(1500),
  badge: z.string().min(2).max(50).default('EVENTO JOY RIDE'),
  accent: z.enum(['cyan', 'magenta', 'amber', 'emerald']).default('magenta'),
  locationLabel: z.string().min(2).max(120).default('Calle Nicolás Ortiz N° 14'),
  scheduleLabel: z.string().min(2).max(120).default('18:00 – 02:30'),
  imageUrl: z.string().min(3).max(400),
  imagesJson: z.array(z.string()).optional(),
  videoUrl: z.string().max(400).optional().nullable(),
  spotId: z.string().max(80).default('joyride-hq'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  notifySubscribers: z.boolean().optional(),
});

router.get('/events', async (_req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

router.post('/events', async (req, res, next) => {
  try {
    const body = eventSchema.parse(req.body);
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48);
    const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 5)}`;

    const created = await prisma.event.create({
      data: {
        slug,
        title: body.title.trim(),
        subtitle: body.subtitle.trim(),
        description: body.description.trim(),
        badge: body.badge.trim(),
        accent: body.accent,
        locationLabel: body.locationLabel.trim(),
        scheduleLabel: body.scheduleLabel.trim(),
        imageUrl: body.imageUrl,
        imagesJson: body.imagesJson && body.imagesJson.length > 0 ? body.imagesJson : [body.imageUrl],
        videoUrl: body.videoUrl || null,
        spotId: body.spotId,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        sortOrder: body.sortOrder,
      },
    });

    if (created.isActive && body.notifySubscribers) {
      await sendEventActivatedCampaign(created).catch(() => {});
    }

    res.status(201).json({ event: created });
  } catch (err) {
    next(err);
  }
});

router.put('/events/:id', async (req, res, next) => {
  try {
    const body = eventSchema.parse(req.body);
    const existing = await prisma.event.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError(404, 'Evento no encontrado');

    const updated = await prisma.event.update({
      where: { id: existing.id },
      data: {
        title: body.title.trim(),
        subtitle: body.subtitle.trim(),
        description: body.description.trim(),
        badge: body.badge.trim(),
        accent: body.accent,
        locationLabel: body.locationLabel.trim(),
        scheduleLabel: body.scheduleLabel.trim(),
        imageUrl: body.imageUrl,
        imagesJson: body.imagesJson && body.imagesJson.length > 0 ? body.imagesJson : [body.imageUrl],
        videoUrl: body.videoUrl || null,
        spotId: body.spotId,
        isActive: body.isActive,
        isFeatured: body.isFeatured,
        sortOrder: body.sortOrder,
      },
    });

    if (!existing.isActive && updated.isActive && body.notifySubscribers) {
      await sendEventActivatedCampaign(updated).catch(() => {});
    }

    res.json({ event: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/events/:id/toggle', async (req, res, next) => {
  try {
    const existing = await prisma.event.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError(404, 'Evento no encontrado');

    const notify = req.body?.notifySubscribers !== false;
    const nextActive = !existing.isActive;
    const updated = await prisma.event.update({
      where: { id: existing.id },
      data: { isActive: nextActive },
    });

    let notifiedCount = 0;
    if (nextActive && notify) {
      const sent = await sendEventActivatedCampaign(updated).catch(() => ({ count: 0 }));
      notifiedCount = sent.count;
    }

    res.json({ event: updated, notifiedCount });
  } catch (err) {
    next(err);
  }
});

router.delete('/events/:id', async (req, res, next) => {
  try {
    await prisma.event.delete({ where: { id: String(req.params.id) } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// --- Dynamic Bento Promotions ("Ritmo Joy Ride en Sucre") CRUD ---
const promotionUpdateSchema = z.object({
  title: z.string().min(3).max(140),
  subtitle: z.string().min(3).max(200),
  description: z.string().min(8).max(1200),
  badgeText: z.string().min(2).max(50),
  scheduleText: z.string().min(2).max(120),
  discountPercent: z.number().int().min(0).max(100).default(0),
  imageUrl: z.string().min(3).max(400),
  active: z.boolean().default(true),
});

router.get('/promotions', async (_req, res, next) => {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json({ promotions });
  } catch (err) {
    next(err);
  }
});

router.put('/promotions/:id', async (req, res, next) => {
  try {
    const body = promotionUpdateSchema.parse(req.body);
    const existing = await prisma.promotion.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError(404, 'Promoción no encontrada');

    const updated = await prisma.promotion.update({
      where: { id: existing.id },
      data: {
        title: body.title.trim(),
        subtitle: body.subtitle.trim(),
        description: body.description.trim(),
        badgeText: body.badgeText.trim(),
        scheduleText: body.scheduleText.trim(),
        discountPercent: body.discountPercent,
        imageUrl: body.imageUrl.trim(),
        active: body.active,
      },
    });
    res.json({ promotion: updated });
  } catch (err) {
    next(err);
  }
});

router.patch('/promotions/:id/toggle', async (req, res, next) => {
  try {
    const existing = await prisma.promotion.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) throw new AppError(404, 'Promoción no encontrada');

    const updated = await prisma.promotion.update({
      where: { id: existing.id },
      data: { active: !existing.active },
    });
    res.json({ promotion: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
