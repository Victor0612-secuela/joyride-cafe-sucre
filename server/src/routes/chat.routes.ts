import { Router } from 'express';
import { ChatChannelType, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth, requireRoles } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { emitChatMessage } from '../utils/sse';

const router = Router();
const messageSchema = z.object({
  content: z.string().min(1, 'Mensaje requerido').max(500),
});

const STAFF_ROLES: Role[] = [Role.CAJERO, Role.EMPAQUETADOR, Role.REPARTIDOR, Role.ADMIN];

// Direct Order Chat: Client <-> Rider / Admin
router.get('/order/:orderId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const orderId = String(req.params.orderId);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, 'Pedido no encontrado');

    const allowed =
      order.userId === req.user!.userId ||
      req.user!.role === Role.REPARTIDOR ||
      req.user!.role === Role.ADMIN;
    if (!allowed) throw new AppError(403, 'No autorizado en este chat');

    const messages = await prisma.chatMessage.findMany({
      where: { channelType: ChatChannelType.ORDER_DELIVERY, orderId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post('/order/:orderId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const orderId = String(req.params.orderId);
    const body = messageSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError(404, 'Pedido no encontrado');

    const allowed =
      order.userId === req.user!.userId || req.user!.role === Role.REPARTIDOR;
    if (!allowed) {
      throw new AppError(
        403,
        'Modo auditoría: solo el cliente y el repartidor pueden chatear en este pedido'
      );
    }

    const saved = await prisma.chatMessage.create({
      data: {
        channelType: ChatChannelType.ORDER_DELIVERY,
        orderId,
        senderId: req.user!.userId,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        content: body.content.trim(),
      },
    });

    emitChatMessage({
      id: saved.id,
      channelType: saved.channelType,
      orderId: saved.orderId,
      senderId: saved.senderId,
      senderName: saved.senderName,
      senderRole: saved.senderRole,
      content: saved.content,
      createdAt: saved.createdAt,
    });

    res.status(201).json({ message: saved });
  } catch (err) {
    next(err);
  }
});

// Internal Staff Chat: Cajero <-> Cocina/Empaque <-> Repartidor <-> Admin
router.get('/staff', requireAuth, requireRoles(...STAFF_ROLES), async (_req, res, next) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { channelType: ChatChannelType.STAFF_OPS },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

router.post('/staff', requireAuth, requireRoles(...STAFF_ROLES), async (req: AuthRequest, res, next) => {
  try {
    const body = messageSchema.parse(req.body);
    const saved = await prisma.chatMessage.create({
      data: {
        channelType: ChatChannelType.STAFF_OPS,
        senderId: req.user!.userId,
        senderName: req.user!.name,
        senderRole: req.user!.role,
        content: body.content.trim(),
      },
    });

    emitChatMessage({
      id: saved.id,
      channelType: saved.channelType,
      senderId: saved.senderId,
      senderName: saved.senderName,
      senderRole: saved.senderRole,
      content: saved.content,
      createdAt: saved.createdAt,
    });

    res.status(201).json({ message: saved });
  } catch (err) {
    next(err);
  }
});

export default router;
