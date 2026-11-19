import { DeliveryType, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import {
  computeDeliveryFeeBs,
  confirmStockTx,
  recordReservationMovementsTx,
  releaseStockTx,
  reserveStockTx,
  RequestedItem,
} from './inventory.service';
import { broadcastOrderChange, transitionOrderStatusTx } from './order-state.service';
import { generateOrderCode, roundUsd, signQrToken, verifyQrSignature } from '../utils/hmac';
import { sendManagerAlertEmail, sendOrderConfirmedEmail } from './email.service';

const QR_TTL_MINUTES = 15;

export interface CreateOrderInput {
  userId: string;
  userName: string;
  items: RequestedItem[];
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  deliveryReference?: string;
  destLat?: number;
  destLng?: number;
  phoneContact: string;
  notes?: string;
  splitCount?: number;
  publicBaseUrl?: string;
}

export const BANK_INFO_JOYRIDE = {
  bankName: 'Banco Nacional de Bolivia (BNB)',
  secondaryBank: 'Banco Unión S.A.',
  accountNumber: '1000-294810-44',
  accountHolder: 'Villarroel Molina Victor Manuel',
  qrValidUntil: '26 de septiembre de 2027',
  realQrImageUrl: '/assets/brand/qr-bnb-cropped.png',
  nit: '1029481022',
  currency: 'BOB',
};

async function notifyConfirmedSaleAndStock(orderId: string, paymentMethod: string) {
  const fullOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
  });
  if (!fullOrder) return;

  if (fullOrder.user?.email) {
    sendOrderConfirmedEmail({
      toEmail: fullOrder.user.email,
      customerName: fullOrder.user.name,
      orderId: fullOrder.id,
      orderCode: fullOrder.orderCode,
      paymentMethod,
      totalBs: Number(fullOrder.totalBs),
      totalUsd: Number(fullOrder.totalUsd),
      items: fullOrder.items,
    }).catch((err) => console.warn('[EMAIL] order confirmed failed:', err));
  }

  sendManagerAlertEmail({
    templateType: 'MANAGER_NEW_ORDER',
    subject: `Nueva venta ${fullOrder.orderCode} (${paymentMethod}) — Bs. ${Number(fullOrder.totalBs).toFixed(2)}`,
    title: `Ingreso confirmado: ${fullOrder.orderCode}`,
    bodyHtml: `<p>El cliente completó un pedido por <strong>Bs. ${Number(fullOrder.totalBs).toFixed(2)}</strong> vía <strong>${paymentMethod}</strong>.</p>`,
    relatedOrderId: fullOrder.id,
  }).catch((err) => console.warn('[EMAIL] manager new order alert failed:', err));

  for (const item of fullOrder.items) {
    if (item.product.stockDisponible <= item.product.stockMinimoAlerta) {
      sendManagerAlertEmail({
        templateType: 'LOW_STOCK_ALERT',
        subject: `Alerta Stock Bajo: ${item.product.name} (${item.product.stockDisponible} u.)`,
        title: `Stock crítico: ${item.product.name}`,
        bodyHtml: `<p>Quedan solamente <strong>${item.product.stockDisponible}</strong> unidades disponibles (mínimo configurado: ${item.product.stockMinimoAlerta}).</p>`,
        relatedOrderId: fullOrder.id,
      }).catch((err) => console.warn('[EMAIL] low stock alert failed:', err));
    }
  }
}

export async function initiateQrPayment(input: CreateOrderInput) {
  const expiresAt = new Date(Date.now() + QR_TTL_MINUTES * 60 * 1000);
  const qrToken = crypto.randomUUID();
  const deliveryFeeBs = computeDeliveryFeeBs(input.deliveryType);

  const result = await prisma.$transaction(async (tx) => {
    const { resolvedItems, subtotalBs } = await reserveStockTx(tx, input.items, null, input.userId);
    const totalBs = Number((subtotalBs + deliveryFeeBs).toFixed(2));
    const totalUsd = roundUsd(totalBs);
    const orderCode = generateOrderCode();

    const order = await tx.order.create({
      data: {
        orderCode,
        userId: input.userId,
        status: OrderStatus.PENDIENTE_PAGO,
        deliveryType: input.deliveryType,
        subtotalBs,
        discountBs: 0,
        totalBs,
        totalUsd,
        deliveryAddress:
          input.deliveryType === DeliveryType.DELIVERY
            ? input.deliveryAddress || 'Sucre Centro'
            : input.deliveryType === DeliveryType.CONSUMO_LOCAL
            ? input.deliveryAddress?.trim() || 'En el Local — Mesa en Joy Ride Café (Nicolás Ortiz N° 14)'
            : 'Recojo en Local — Calle Nicolás Ortiz N° 14',
        deliveryReference: input.deliveryReference,
        destLat: input.destLat ?? (input.deliveryType === DeliveryType.DELIVERY ? -19.0442 : -19.04804),
        destLng: input.destLng ?? (input.deliveryType === DeliveryType.DELIVERY ? -65.2618 : -65.25973),
        phoneContact: input.phoneContact,
        notes: input.notes,
        splitCount: Math.max(1, Math.min(12, input.splitCount || 1)),
        expiresAt,
        items: {
          create: resolvedItems,
        },
        history: {
          create: {
            actorId: input.userId,
            actorName: input.userName,
            actorRole: 'CLIENTE',
            fromStatus: null,
            toStatus: OrderStatus.PENDIENTE_PAGO,
            reason: `Pedido creado con Pago QR Instantáneo (expira en ${QR_TTL_MINUTES} min)`,
          },
        },
      },
      include: { items: true },
    });

    await recordReservationMovementsTx(
      tx,
      order.id,
      input.userId,
      resolvedItems,
      `Reserva atómica para pedido QR ${order.orderCode}`
    );

    const signature = signQrToken(qrToken, order.id, totalBs.toFixed(2));
    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.QR,
        status: PaymentStatus.PENDIENTE,
        amountBs: totalBs,
        amountUsd: totalUsd,
        qrToken,
        qrSignature: signature,
        bankName: BANK_INFO_JOYRIDE.bankName,
      },
    });

    return { order, payment };
  });

  const baseUrl = (input.publicBaseUrl || env.APP_URL).replace(/\/$/, '');
  const qrPayUrl = `${baseUrl}/pagar-qr/${qrToken}`;
  return {
    orderId: result.order.id,
    orderCode: result.order.orderCode,
    status: result.order.status,
    totalBs: Number(result.order.totalBs),
    totalUsd: Number(result.order.totalUsd),
    deliveryFeeBs,
    expiresAt: result.order.expiresAt,
    qrToken,
    qrPayUrl,
    qrPayload: qrPayUrl,
    bankInfo: BANK_INFO_JOYRIDE,
  };
}

export async function getQrPublicInfo(qrToken: string) {
  const payment = await prisma.payment.findUnique({
    where: { qrToken },
    include: {
      order: {
        include: {
          items: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Código QR no encontrado o inválido');
  }

  const isExpired =
    payment.status === PaymentStatus.PENDIENTE &&
    payment.order.expiresAt !== null &&
    payment.order.expiresAt.getTime() < Date.now();

  if (isExpired) {
    await releaseExpiredOrderById(payment.orderId);
  }

  const fresh = await prisma.payment.findUnique({
    where: { qrToken },
    include: {
      order: {
        include: {
          items: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!fresh) {
    throw new AppError(404, 'Código QR no encontrado');
  }

  const validSig = fresh.qrSignature
    ? verifyQrSignature(qrToken, fresh.orderId, Number(fresh.amountBs).toFixed(2), fresh.qrSignature)
    : true;

  if (!validSig) {
    throw new AppError(400, 'Firma criptográfica del QR inválida');
  }

  return {
    merchant: 'JOY RIDE CAFÉ® — Sucre, Bolivia',
    address: 'Calle Nicolás Ortiz N° 14',
    qrToken,
    orderId: fresh.orderId,
    orderCode: fresh.order.orderCode,
    customerName: fresh.order.user.name,
    orderStatus: fresh.order.status,
    paymentStatus: fresh.status,
    amountBs: Number(fresh.amountBs),
    amountUsd: Number(fresh.amountUsd),
    expiresAt: fresh.order.expiresAt,
    bankInfo: BANK_INFO_JOYRIDE,
    items: fresh.order.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPriceBs: Number(i.unitPriceBs),
      subtotalBs: Number(i.subtotalBs),
    })),
  };
}

export async function confirmQrPayment(qrToken: string) {
  const payment = await prisma.payment.findUnique({
    where: { qrToken },
    include: { order: { include: { items: true } } },
  });

  if (!payment) {
    throw new AppError(404, 'Código QR inválido o inexistente');
  }

  if (payment.status === PaymentStatus.COMPLETADO) {
    return {
      alreadyConfirmed: true,
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      orderStatus: payment.order.status,
      paymentStatus: payment.status,
      amountBs: Number(payment.amountBs),
    };
  }

  if (payment.status === PaymentStatus.EXPIRADO || payment.order.status === OrderStatus.CANCELADO) {
    throw new AppError(410, 'Este código QR ha expirado y el stock reservado fue liberado');
  }

  if (payment.order.expiresAt && payment.order.expiresAt.getTime() < Date.now()) {
    await releaseExpiredOrderById(payment.orderId);
    throw new AppError(410, 'El tiempo de reserva (15 min) expiró; genera un nuevo QR');
  }

  if (payment.qrSignature) {
    const okSig = verifyQrSignature(
      qrToken,
      payment.orderId,
      Number(payment.amountBs).toFixed(2),
      payment.qrSignature
    );
    if (!okSig) {
      throw new AppError(400, 'Firma HMAC del código QR inválida');
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const freshOrder = await tx.order.findUnique({
      where: { id: payment.orderId },
      include: { items: true },
    });
    if (!freshOrder) throw new AppError(404, 'Pedido no encontrado');

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETADO,
        verifiedAt: new Date(),
        reviewNotes: 'Confirmado en vivo vía Simple QR',
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: freshOrder.id,
      orderCode: freshOrder.orderCode,
      fromStatus: freshOrder.status,
      toStatus: OrderStatus.PAGO_CONFIRMADO,
      actorId: freshOrder.userId,
      actorName: 'Pasarela Simple QR',
      actorRole: 'SISTEMA',
      reason: 'Pago QR confirmado instantáneamente y enviado a Cocina/Bar',
    });

    await confirmStockTx(
      tx,
      freshOrder.id,
      freshOrder.userId,
      freshOrder.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Venta QR confirmada (${freshOrder.orderCode})`
    );

    return { updatedOrder, updatedPayment };
  });

  broadcastOrderChange(
    updated.updatedOrder.id,
    updated.updatedOrder.orderCode,
    updated.updatedOrder.status,
    updated.updatedPayment.status,
    '¡Pago QR confirmado al instante!'
  );

  notifyConfirmedSaleAndStock(updated.updatedOrder.id, 'Simple QR / BNB').catch(() => {});

  return {
    alreadyConfirmed: false,
    orderId: updated.updatedOrder.id,
    orderCode: updated.updatedOrder.orderCode,
    orderStatus: updated.updatedOrder.status,
    paymentStatus: updated.updatedPayment.status,
    amountBs: Number(updated.updatedPayment.amountBs),
  };
}

async function saveReceiptImage(comprobanteData: string): Promise<string> {
  if (!comprobanteData) {
    throw new AppError(400, 'El comprobante bancario es obligatorio');
  }

  if (comprobanteData.startsWith('http://') || comprobanteData.startsWith('https://') || comprobanteData.startsWith('/uploads/')) {
    return comprobanteData;
  }

  const match = comprobanteData.match(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/i);
  if (!match) {
    throw new AppError(400, 'Formato de comprobante inválido (usa PNG, JPG, WEBP o SVG)');
  }

  const ext = match[1].toLowerCase().includes('svg') ? 'svg' : match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  const buf = Buffer.from(match[2], 'base64');
  if (buf.length > 2 * 1024 * 1024) {
    throw new AppError(400, 'El comprobante excede el límite permitido de 2 MB');
  }

  const uploadsDir = path.resolve(process.cwd(), 'uploads', 'receipts');
  await fs.mkdir(uploadsDir, { recursive: true });
  const fileName = `receipt-${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(uploadsDir, fileName), buf);
  return `/uploads/receipts/${fileName}`;
}

export async function submitDepositPayment(
  input: CreateOrderInput & {
    bankName: string;
    referenceNumber: string;
    comprobanteBase64: string;
  }
) {
  const comprobanteUrl = await saveReceiptImage(input.comprobanteBase64);
  const deliveryFeeBs = computeDeliveryFeeBs(input.deliveryType);

  const result = await prisma.$transaction(async (tx) => {
    const { resolvedItems, subtotalBs } = await reserveStockTx(tx, input.items, null, input.userId);
    const totalBs = Number((subtotalBs + deliveryFeeBs).toFixed(2));
    const totalUsd = roundUsd(totalBs);
    const orderCode = generateOrderCode();

    const order = await tx.order.create({
      data: {
        orderCode,
        userId: input.userId,
        status: OrderStatus.PAGO_EN_REVISION,
        deliveryType: input.deliveryType,
        subtotalBs,
        discountBs: 0,
        totalBs,
        totalUsd,
        deliveryAddress:
          input.deliveryType === DeliveryType.DELIVERY
            ? input.deliveryAddress || 'Sucre Centro'
            : input.deliveryType === DeliveryType.CONSUMO_LOCAL
            ? input.deliveryAddress?.trim() || 'En el Local — Mesa en Joy Ride Café (Nicolás Ortiz N° 14)'
            : 'Recojo en Local — Calle Nicolás Ortiz N° 14',
        deliveryReference: input.deliveryReference,
        destLat: input.destLat ?? (input.deliveryType === DeliveryType.DELIVERY ? -19.0442 : -19.04804),
        destLng: input.destLng ?? (input.deliveryType === DeliveryType.DELIVERY ? -65.2618 : -65.25973),
        phoneContact: input.phoneContact,
        notes: input.notes,
        splitCount: Math.max(1, Math.min(12, input.splitCount || 1)),
        items: { create: resolvedItems },
        history: {
          create: [
            {
              actorId: input.userId,
              actorName: input.userName,
              actorRole: 'CLIENTE',
              fromStatus: null,
              toStatus: OrderStatus.PENDIENTE_PAGO,
              reason: 'Pedido creado con Depósito/Transferencia Bancaria',
            },
            {
              actorId: input.userId,
              actorName: input.userName,
              actorRole: 'CLIENTE',
              fromStatus: OrderStatus.PENDIENTE_PAGO,
              toStatus: OrderStatus.PAGO_EN_REVISION,
              reason: `Comprobante ${input.referenceNumber} (${input.bankName}) enviado a revisión de Caja`,
            },
          ],
        },
      },
      include: { items: true },
    });

    await recordReservationMovementsTx(
      tx,
      order.id,
      input.userId,
      resolvedItems,
      `Reserva atómica para depósito ${order.orderCode}`
    );

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.DEPOSITO_BANCARIO,
        status: PaymentStatus.EN_REVISION,
        amountBs: totalBs,
        amountUsd: totalUsd,
        bankName: input.bankName,
        referenceNumber: input.referenceNumber,
        comprobanteUrl,
      },
    });

    return { order, payment };
  });

  broadcastOrderChange(
    result.order.id,
    result.order.orderCode,
    result.order.status,
    result.payment.status,
    'Depósito enviado a revisión de Caja'
  );

  sendManagerAlertEmail({
    templateType: 'DEPOSIT_PENDING_ALERT',
    subject: `Depósito por revisar: ${result.order.orderCode} (${input.bankName})`,
    title: `Nuevo comprobante bancario pendiente`,
    bodyHtml: `<p>El cliente <strong>${input.userName}</strong> subió el comprobante <strong>${input.referenceNumber}</strong> (${input.bankName}) por <strong>Bs. ${Number(result.order.totalBs).toFixed(2)}</strong>. Revisa en el Panel de Cajero.</p>`,
    relatedOrderId: result.order.id,
  }).catch(() => {});

  return {
    orderId: result.order.id,
    orderCode: result.order.orderCode,
    status: result.order.status,
    paymentId: result.payment.id,
    totalBs: Number(result.order.totalBs),
    totalUsd: Number(result.order.totalUsd),
    comprobanteUrl,
  };
}

export async function listDepositReviews(filterStatus?: PaymentStatus) {
  return prisma.payment.findMany({
    where: {
      method: PaymentMethod.DEPOSITO_BANCARIO,
      ...(filterStatus ? { status: filterStatus } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      verificadoPor: { select: { id: true, name: true } },
      order: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
        },
      },
    },
  });
}

export async function reviewDepositPayment(params: {
  paymentId: string;
  decision: 'APPROVE' | 'REJECT';
  notes: string;
  cashierId: string;
  cashierName: string;
  cashierRole: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: params.paymentId },
    include: { order: { include: { items: true } } },
  });

  if (!payment) {
    throw new AppError(404, 'Pago no encontrado');
  }
  if (payment.method !== PaymentMethod.DEPOSITO_BANCARIO) {
    throw new AppError(400, 'Solo los depósitos bancarios requieren revisión manual');
  }
  if (payment.status !== PaymentStatus.EN_REVISION) {
    throw new AppError(409, `Este pago ya fue procesado (${payment.status})`);
  }
  if (params.decision === 'REJECT' && (!params.notes || params.notes.trim().length < 4)) {
    throw new AppError(400, 'Debes indicar un motivo claro al rechazar un comprobante');
  }

  const result = await prisma.$transaction(async (tx) => {
    if (params.decision === 'APPROVE') {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETADO,
          verificadoPorId: params.cashierId,
          verifiedAt: new Date(),
          reviewNotes: params.notes || 'Comprobante bancario verificado por Caja',
        },
      });

      const updatedOrder = await transitionOrderStatusTx(tx, {
        orderId: payment.orderId,
        orderCode: payment.order.orderCode,
        fromStatus: payment.order.status,
        toStatus: OrderStatus.PAGO_CONFIRMADO,
        actorId: params.cashierId,
        actorName: params.cashierName,
        actorRole: params.cashierRole,
        reason: params.notes || `Depósito ${payment.referenceNumber} aprobado por Caja`,
      });

      await confirmStockTx(
        tx,
        payment.orderId,
        params.cashierId,
        payment.order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        `Depósito aprobado (${payment.order.orderCode})`
      );

      return { updatedOrder, updatedPayment };
    } else {
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.RECHAZADO,
          verificadoPorId: params.cashierId,
          verifiedAt: new Date(),
          reviewNotes: params.notes,
        },
      });

      const updatedOrder = await transitionOrderStatusTx(tx, {
        orderId: payment.orderId,
        orderCode: payment.order.orderCode,
        fromStatus: payment.order.status,
        toStatus: OrderStatus.RECHAZADO,
        actorId: params.cashierId,
        actorName: params.cashierName,
        actorRole: params.cashierRole,
        reason: `Depósito rechazado: ${params.notes}`,
      });

      await releaseStockTx(
        tx,
        payment.orderId,
        params.cashierId,
        payment.order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        `Devolución automática de stock por rechazo de depósito (${payment.order.orderCode})`
      );

      return { updatedOrder, updatedPayment };
    }
  });

  broadcastOrderChange(
    result.updatedOrder.id,
    result.updatedOrder.orderCode,
    result.updatedOrder.status,
    result.updatedPayment.status,
    params.decision === 'APPROVE' ? 'Depósito aprobado por Caja' : 'Depósito rechazado por Caja'
  );

  if (params.decision === 'APPROVE') {
    notifyConfirmedSaleAndStock(result.updatedOrder.id, 'Depósito Bancario').catch(() => {});
  }

  return result;
}

export async function releaseExpiredOrderById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });

  if (!order || order.status !== OrderStatus.PENDIENTE_PAGO) return;

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });
    if (!fresh || fresh.status !== OrderStatus.PENDIENTE_PAGO) return;

    await transitionOrderStatusTx(tx, {
      orderId: fresh.id,
      orderCode: fresh.orderCode,
      fromStatus: OrderStatus.PENDIENTE_PAGO,
      toStatus: OrderStatus.CANCELADO,
      actorId: null,
      actorName: 'Temporizador de Reserva',
      actorRole: 'SISTEMA',
      reason: 'Expiró la ventana de pago de 15 minutos; stock liberado automáticamente',
    });

    if (fresh.payment && fresh.payment.status === PaymentStatus.PENDIENTE) {
      await tx.payment.update({
        where: { id: fresh.payment.id },
        data: { status: PaymentStatus.EXPIRADO },
      });
    }

    await releaseStockTx(
      tx,
      fresh.id,
      null,
      fresh.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Liberación automática por expiración (${fresh.orderCode})`
    );
  });

  broadcastOrderChange(order.id, order.orderCode, OrderStatus.CANCELADO, PaymentStatus.EXPIRADO, 'Reserva expirada');
}

export async function releaseAllExpiredOrders() {
  const expired = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDIENTE_PAGO,
      expiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  for (const o of expired) {
    await releaseExpiredOrderById(o.id);
  }
  return expired.length;
}
