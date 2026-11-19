import { OrderStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { generateFourDigitPin } from '../utils/hmac';
import { broadcastOrderChange, transitionOrderStatusTx } from './order-state.service';
import { sendOrderPackedPinEmail } from './email.service';

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export async function listPackingOrders() {
  return prisma.order.findMany({
    where: {
      status: {
        in: [OrderStatus.PAGO_CONFIRMADO, OrderStatus.EN_PREPARACION, OrderStatus.EMPACADO],
      },
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { name: true, phone: true } },
      items: true,
      payment: { select: { method: true, status: true } },
      packaging: {
        include: { empaquetador: { select: { id: true, name: true } } },
      },
      delivery: {
        select: { packageLabelCode: true, deliveryAddress: true, deliveryReference: true },
      },
    },
  });
}

export async function startPreparation(orderId: string, actor: { userId: string; name: string; role: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, packaging: true },
  });

  if (!order) throw new AppError(404, 'Pedido no encontrado');

  const checklistItems: ChecklistItem[] = [
    ...order.items.map((item, idx) => ({
      id: `prod-${idx + 1}`,
      label: `${item.productName} (x${item.quantity}) preparado y sellado`,
      checked: false,
    })),
    {
      id: 'std-cutlery',
      label: 'Cubiertos, servilletas Joy Ride y salsa/llajwa incluidos',
      checked: false,
    },
    {
      id: 'std-seal',
      label: 'Bolsa kraft sellada con cinta de seguridad intacta',
      checked: false,
    },
  ];

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.EN_PREPARACION,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      reason: 'Comanda tomada por Cocina/Bar y Empaque',
    });

    const packaging = await tx.packagingChecklist.upsert({
      where: { orderId: order.id },
      update: {
        empaquetadorId: actor.userId,
        items: checklistItems as unknown as object[],
        allVerified: false,
        startedAt: new Date(),
      },
      create: {
        orderId: order.id,
        empaquetadorId: actor.userId,
        items: checklistItems as unknown as object[],
        allVerified: false,
      },
    });

    return { updatedOrder, packaging };
  });

  broadcastOrderChange(
    result.updatedOrder.id,
    result.updatedOrder.orderCode,
    result.updatedOrder.status,
    undefined,
    'Pedido en preparación en Cocina/Bar'
  );

  return result;
}

export async function updateChecklist(
  orderId: string,
  items: ChecklistItem[],
  notes: string | undefined,
  actorId: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { packaging: true, user: { select: { name: true, email: true } } },
  });

  if (!order) throw new AppError(404, 'Pedido no encontrado');
  if (order.status !== OrderStatus.EN_PREPARACION) {
    throw new AppError(409, 'Solo se puede editar el checklist cuando el pedido está EN_PREPARACION');
  }
  if (!order.packaging) {
    throw new AppError(400, 'El checklist aún no fue iniciado');
  }

  const allVerified = items.length > 0 && items.every((i) => i.checked === true);

  return prisma.packagingChecklist.update({
    where: { orderId },
    data: {
      empaquetadorId: actorId,
      items: items as unknown as object[],
      allVerified,
      notes,
    },
  });
}

export async function finishPacking(
  orderId: string,
  notes: string | undefined,
  actor: { userId: string; name: string; role: string }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { packaging: true, user: { select: { name: true, email: true } } },
  });

  if (!order) throw new AppError(404, 'Pedido no encontrado');
  if (order.status !== OrderStatus.EN_PREPARACION) {
    throw new AppError(409, `El pedido está en estado ${order.status}; debe estar EN_PREPARACION`);
  }
  if (!order.packaging) {
    throw new AppError(400, 'Falta inicializar el checklist de empaque');
  }

  const checklist = (order.packaging.items as unknown as ChecklistItem[]) || [];
  const allChecked = checklist.length > 0 && checklist.every((i) => i.checked === true);
  if (!allChecked) {
    throw new AppError(
      400,
      'Debes verificar el 100% de los ítems del checklist antes de sellar el empaque'
    );
  }

  const deliveryPin = generateFourDigitPin();
  const suffix = order.orderCode.replace('JR-', '');
  const packageLabelCode = `JR-PKG-${suffix}`;
  const sealCode = `JR-SEAL-${suffix}`;

  const result = await prisma.$transaction(async (tx) => {
    const packaging = await tx.packagingChecklist.update({
      where: { orderId },
      data: {
        empaquetadorId: actor.userId,
        sealCode,
        allVerified: true,
        notes: notes ?? order.packaging?.notes,
        completedAt: new Date(),
      },
    });

    const delivery = await tx.deliveryTracking.upsert({
      where: { orderId },
      update: {
        deliveryAddress: order.deliveryAddress || 'Sucre Centro',
        deliveryReference: order.deliveryReference,
        destLat: order.destLat ?? -19.0442,
        destLng: order.destLng ?? -65.2618,
        deliveryPin,
        packageLabelCode,
      },
      create: {
        orderId,
        deliveryAddress: order.deliveryAddress || 'Sucre Centro',
        deliveryReference: order.deliveryReference,
        destLat: order.destLat ?? -19.0442,
        destLng: order.destLng ?? -65.2618,
        riderLat: -19.04804,
        riderLng: -65.25973,
        etaMinutes: 14,
        deliveryPin,
        packageLabelCode,
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.EMPACADO,
      actorId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      reason: `Empaque sellado (${packageLabelCode}) · PIN de entrega generado`,
    });

    return { updatedOrder, packaging, delivery };
  });

  broadcastOrderChange(
    result.updatedOrder.id,
    result.updatedOrder.orderCode,
    result.updatedOrder.status,
    undefined,
    `Pedido empacado (${packageLabelCode}) listo para repartidor`
  );

  if (order.user?.email) {
    sendOrderPackedPinEmail({
      toEmail: order.user.email,
      customerName: order.user.name,
      orderId: result.updatedOrder.id,
      orderCode: result.updatedOrder.orderCode,
      deliveryPin,
      packageLabelCode,
    }).catch((err) => console.warn('[EMAIL] packed PIN email failed:', err));
  }

  return {
    orderId: result.updatedOrder.id,
    orderCode: result.updatedOrder.orderCode,
    status: result.updatedOrder.status,
    packageLabelCode,
    sealCode,
    deliveryPin,
  };
}
