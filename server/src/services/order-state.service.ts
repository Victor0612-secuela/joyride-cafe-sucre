import { OrderStatus, Prisma } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { emitOrderUpdate, emitStaffBroadcast } from '../utils/sse';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE_PAGO: [OrderStatus.PAGO_EN_REVISION, OrderStatus.PAGO_CONFIRMADO, OrderStatus.CANCELADO],
  PAGO_EN_REVISION: [OrderStatus.PAGO_CONFIRMADO, OrderStatus.RECHAZADO],
  PAGO_CONFIRMADO: [OrderStatus.EN_PREPARACION, OrderStatus.CANCELADO],
  EN_PREPARACION: [OrderStatus.EMPACADO],
  EMPACADO: [OrderStatus.EN_CAMINO],
  EN_CAMINO: [OrderStatus.ENTREGADO],
  ENTREGADO: [],
  CANCELADO: [],
  RECHAZADO: [],
};

export function assertValidTransition(fromStatus: OrderStatus, toStatus: OrderStatus) {
  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      409,
      `Transición de estado inválida: no se puede pasar de ${fromStatus} a ${toStatus}`
    );
  }
}

export async function transitionOrderStatusTx(
  tx: Prisma.TransactionClient,
  params: {
    orderId: string;
    orderCode: string;
    fromStatus: OrderStatus;
    toStatus: OrderStatus;
    actorId: string | null;
    actorName: string;
    actorRole: string;
    reason: string;
  }
) {
  assertValidTransition(params.fromStatus, params.toStatus);

  const updated = await tx.order.update({
    where: { id: params.orderId },
    data: { status: params.toStatus },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId: params.orderId,
      actorId: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
    },
  });

  return updated;
}

export function broadcastOrderChange(orderId: string, orderCode: string, status: OrderStatus, paymentStatus?: string, message?: string) {
  emitOrderUpdate({ orderId, orderCode, status, paymentStatus, message });
  emitStaffBroadcast('staff_refresh', { orderId, orderCode, status });
}
