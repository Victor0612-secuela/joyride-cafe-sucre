import { Router } from 'express';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { releaseStockTx } from '../services/inventory.service';
import { broadcastOrderChange, transitionOrderStatusTx } from '../services/order-state.service';

const router = Router();

router.get('/mine', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        payment: true,
        packaging: { select: { sealCode: true, allVerified: true, items: true, startedAt: true, completedAt: true } },
        delivery: true,
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        payment: true,
        packaging: { include: { empaquetador: { select: { name: true } } } },
        delivery: { include: { repartidor: { select: { name: true } } } },
        history: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) throw new AppError(404, 'Pedido no encontrado');

    if (req.user!.role === 'CLIENTE' && order.userId !== req.user!.userId) {
      throw new AppError(403, 'No tienes acceso a este pedido');
    }

    // Hide PIN if caller is REPARTIDOR
    if (req.user!.role === 'REPARTIDOR' && order.delivery) {
      const { deliveryPin: _hidden, ...safeDelivery } = order.delivery;
      res.json({ order: { ...order, delivery: safeDelivery } });
      return;
    }

    res.json({ order });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: String(req.params.id) },
      include: { items: true, payment: true },
    });
    if (!order) throw new AppError(404, 'Pedido no encontrado');
    if (order.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'No autorizado para cancelar este pedido');
    }
    if (order.status !== OrderStatus.PENDIENTE_PAGO) {
      throw new AppError(409, `Solo se pueden cancelar pedidos pendientes de pago (estado: ${order.status})`);
    }

    await prisma.$transaction(async (tx) => {
      await transitionOrderStatusTx(tx, {
        orderId: order.id,
        orderCode: order.orderCode,
        fromStatus: order.status,
        toStatus: OrderStatus.CANCELADO,
        actorId: req.user!.userId,
        actorName: req.user!.name,
        actorRole: req.user!.role,
        reason: 'Pedido cancelado por el cliente; stock devuelto al catálogo',
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: 'EXPIRADO', reviewNotes: 'Cancelado por el cliente' },
        });
      }

      await releaseStockTx(
        tx,
        order.id,
        req.user!.userId,
        order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        `Devolución por cancelación del cliente (${order.orderCode})`
      );
    });

    broadcastOrderChange(order.id, order.orderCode, OrderStatus.CANCELADO, 'EXPIRADO', 'Pedido cancelado');
    res.json({ cancelled: true, orderId: order.id });
  } catch (err) {
    next(err);
  }
});

export default router;
