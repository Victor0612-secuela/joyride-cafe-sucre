import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { broadcastOrderChange, transitionOrderStatusTx } from './order-state.service';

export async function listDeliveryOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.EMPACADO, OrderStatus.EN_CAMINO, OrderStatus.ENTREGADO],
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 40,
    include: {
      user: { select: { name: true, phone: true } },
      items: true,
      packaging: { select: { sealCode: true, completedAt: true } },
      delivery: {
        include: { repartidor: { select: { id: true, name: true } } },
      },
    },
  });

  // Never leak deliveryPin to the rider! Only client/admin sees it.
  return orders.map((o) => ({
    ...o,
    delivery: o.delivery
      ? {
          id: o.delivery.id,
          repartidorId: o.delivery.repartidorId,
          repartidor: o.delivery.repartidor,
          deliveryAddress: o.delivery.deliveryAddress,
          deliveryReference: o.delivery.deliveryReference,
          destLat: o.delivery.destLat ?? -19.0442,
          destLng: o.delivery.destLng ?? -65.2618,
          riderLat: o.delivery.riderLat ?? -19.04804,
          riderLng: o.delivery.riderLng ?? -65.25973,
          etaMinutes: o.delivery.etaMinutes ?? 14,
          packageLabelCode: o.delivery.packageLabelCode,
          pickedUpAt: o.delivery.pickedUpAt,
          deliveredAt: o.delivery.deliveredAt,
          receiverName: o.delivery.receiverName,
          deliveryNotes: o.delivery.deliveryNotes,
        }
      : null,
  }));
}

export async function pickupOrder(orderId: string, actor: { userId: string; name: string; role: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { delivery: true },
  });

  if (!order) throw new AppError(404, 'Pedido no encontrado');
  if (order.status !== OrderStatus.EMPACADO) {
    throw new AppError(409, `El pedido debe estar EMPACADO para retirarlo (actual: ${order.status})`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const tracking = await tx.deliveryTracking.update({
      where: { orderId },
      data: {
        repartidorId: actor.userId,
        pickedUpAt: new Date(),
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.EN_CAMINO,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      reason: `Paquete ${tracking.packageLabelCode} retirado por repartidor hacia ${tracking.deliveryAddress}`,
    });

    return { updatedOrder, tracking };
  });

  broadcastOrderChange(
    result.updatedOrder.id,
    result.updatedOrder.orderCode,
    result.updatedOrder.status,
    undefined,
    'Tu pedido está en camino con nuestro repartidor'
  );

  return {
    orderId: result.updatedOrder.id,
    orderCode: result.updatedOrder.orderCode,
    status: result.updatedOrder.status,
    pickedUpAt: result.tracking.pickedUpAt,
  };
}

export async function deliverOrder(params: {
  orderId: string;
  pin: string;
  receiverName: string;
  notes?: string;
  actor: { userId: string; name: string; role: string };
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { delivery: true },
  });

  if (!order) throw new AppError(404, 'Pedido no encontrado');
  if (order.status !== OrderStatus.EN_CAMINO) {
    throw new AppError(409, `El pedido debe estar EN_CAMINO para entregarse (actual: ${order.status})`);
  }
  if (!order.delivery) {
    throw new AppError(400, 'Registro de entrega inexistente');
  }
  if (order.delivery.deliveryPin !== params.pin.trim()) {
    throw new AppError(400, 'PIN de entrega de 4 dígitos incorrecto. Solicítalo al cliente.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const tracking = await tx.deliveryTracking.update({
      where: { orderId: params.orderId },
      data: {
        repartidorId: params.actor.userId,
        deliveredAt: new Date(),
        receiverName: params.receiverName.trim(),
        deliveryNotes: params.notes?.trim() || 'Entregado con verificación de PIN de 4 dígitos',
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.ENTREGADO,
      actorId: params.actor.userId,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      reason: `Entrega finalizada y auditada · Receptor: ${params.receiverName.trim()}`,
    });

    return { updatedOrder, tracking };
  });

  broadcastOrderChange(
    result.updatedOrder.id,
    result.updatedOrder.orderCode,
    result.updatedOrder.status,
    undefined,
    '¡Pedido entregado con éxito!'
  );

  return {
    orderId: result.updatedOrder.id,
    orderCode: result.updatedOrder.orderCode,
    status: result.updatedOrder.status,
    deliveredAt: result.tracking.deliveredAt,
    receiverName: result.tracking.receiverName,
  };
}

export async function updateRiderLocation(params: {
  orderId: string;
  riderLat: number;
  riderLng: number;
  etaMinutes?: number;
  riderId: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
    include: { delivery: true },
  });
  if (!order || !order.delivery) {
    throw new AppError(404, 'Seguimiento de entrega no encontrado');
  }

  const updated = await prisma.deliveryTracking.update({
    where: { orderId: params.orderId },
    data: {
      repartidorId: params.riderId,
      riderLat: params.riderLat,
      riderLng: params.riderLng,
      ...(params.etaMinutes !== undefined ? { etaMinutes: params.etaMinutes } : {}),
    },
  });

  broadcastOrderChange(
    order.id,
    order.orderCode,
    order.status,
    undefined,
    `Ubicación del repartidor actualizada (ETA ${updated.etaMinutes ?? 8} min)`
  );

  return {
    orderId: order.id,
    riderLat: updated.riderLat,
    riderLng: updated.riderLng,
    etaMinutes: updated.etaMinutes,
  };
}
