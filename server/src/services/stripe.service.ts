import { DeliveryType, OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import {
  computeDeliveryFeeBs,
  confirmStockTx,
  recordReservationMovementsTx,
  releaseStockTx,
  reserveStockTx,
} from './inventory.service';
import { CreateOrderInput } from './payment.service';
import { broadcastOrderChange, transitionOrderStatusTx } from './order-state.service';
import { generateOrderCode, roundUsd } from '../utils/hmac';
import { sendManagerAlertEmail, sendOrderConfirmedEmail } from './email.service';

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripePublicConfig() {
  return {
    configured: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY),
    expressReady: true,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY || null,
    currency: 'USD',
    mode: env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test',
    exchangeRate: env.USD_EXCHANGE_RATE,
  };
}

export async function createStripePaymentIntent(input: CreateOrderInput) {
  const deliveryFeeBs = computeDeliveryFeeBs(input.deliveryType);
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

  // Compute totals STRICTLY from PostgreSQL Product prices (ignores any client totals)
  const reserved = await prisma.$transaction(async (tx) => {
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
        items: { create: resolvedItems },
        history: {
          create: {
            actorId: input.userId,
            actorName: input.userName,
            actorRole: 'CLIENTE',
            fromStatus: null,
            toStatus: OrderStatus.PENDIENTE_PAGO,
            reason: 'Pago con tarjeta iniciado (Stripe)',
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
      `Reserva temporal para tarjeta ${order.orderCode}`
    );

    return order;
  });

  if (!isStripeConfigured()) {
    const intentId = `pi_test_${crypto.randomUUID().replace(/-/g, '').slice(0, 18)}`;
    const clientSecret = `${intentId}_secret_${crypto.randomUUID().slice(0, 10)}`;

    await prisma.payment.create({
      data: {
        orderId: reserved.id,
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDIENTE,
        amountBs: reserved.totalBs,
        amountUsd: reserved.totalUsd,
        stripePaymentIntentId: intentId,
      },
    });

    return {
      orderId: reserved.id,
      orderCode: reserved.orderCode,
      paymentIntentId: intentId,
      clientSecret,
      totalBs: Number(reserved.totalBs),
      totalUsd: Number(reserved.totalUsd),
      mode: 'test_express' as const,
    };
  }

  try {
    const amountCents = Math.max(50, Math.round(Number(reserved.totalUsd) * 100));
    const form = new URLSearchParams({
      amount: String(amountCents),
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      description: `Joy Ride Cafe Sucre - ${reserved.orderCode}`,
      'metadata[orderId]': reserved.id,
      'metadata[orderCode]': reserved.orderCode,
    });

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });

    const intent = (await stripeRes.json()) as {
      id?: string;
      client_secret?: string;
      error?: { message?: string };
    };

    if (!stripeRes.ok || !intent.id || !intent.client_secret) {
      throw new Error(intent.error?.message || `Stripe HTTP ${stripeRes.status}`);
    }

    await prisma.payment.create({
      data: {
        orderId: reserved.id,
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDIENTE,
        amountBs: reserved.totalBs,
        amountUsd: reserved.totalUsd,
        stripePaymentIntentId: intent.id,
      },
    });

    return {
      orderId: reserved.id,
      orderCode: reserved.orderCode,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      totalBs: Number(reserved.totalBs),
      totalUsd: Number(reserved.totalUsd),
      mode: 'stripe_live_api' as const,
    };
  } catch (err) {
    await cancelStripePaymentIntent(reserved.id, input.userId, 'Error creando PaymentIntent en Stripe');
    throw new AppError(502, err instanceof Error ? err.message : 'No se pudo iniciar el cobro con tarjeta');
  }
}

export async function confirmStripePaymentIntent(params: {
  orderId: string;
  paymentIntentId: string;
  cardBrand?: string;
  cardLast4?: string;
  userId: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { stripePaymentIntentId: params.paymentIntentId },
    include: { order: { include: { items: { include: { product: true } } } } },
  });

  if (!payment || payment.orderId !== params.orderId) {
    throw new AppError(404, 'Intento de pago con tarjeta no encontrado');
  }
  if (payment.order.userId !== params.userId) {
    throw new AppError(403, 'No tienes autorización sobre este pago con tarjeta');
  }

  if (payment.status === PaymentStatus.COMPLETADO) {
    return {
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      status: payment.order.status,
      paymentIntentId: payment.stripePaymentIntentId,
    };
  }

  let verifiedBrand = (params.cardBrand || 'VISA').toUpperCase().slice(0, 20);
  let verifiedLast4 = params.cardLast4 || '4242';

  if (isStripeConfigured() && !params.paymentIntentId.startsWith('pi_test_')) {
    const verifyRes = await fetch(
      `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(params.paymentIntentId)}?expand[]=latest_charge`,
      {
        headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    const verified = (await verifyRes.json()) as {
      status?: string;
      latest_charge?: {
        payment_method_details?: { card?: { brand?: string; last4?: string } };
      };
    };
    if (!verifyRes.ok || verified.status !== 'succeeded') {
      throw new AppError(402, 'El pago con tarjeta aún no fue confirmado por Stripe');
    }
    const cardDetails = verified.latest_charge?.payment_method_details?.card;
    if (cardDetails?.brand) verifiedBrand = cardDetails.brand.toUpperCase();
    if (cardDetails?.last4) verifiedLast4 = cardDetails.last4;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETADO,
        cardBrand: verifiedBrand,
        cardLast4: verifiedLast4,
        verifiedAt: new Date(),
        reviewNotes: `Cobro tarjeta ${verifiedBrand} •••• ${verifiedLast4} (${params.paymentIntentId})`,
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      fromStatus: payment.order.status,
      toStatus: OrderStatus.PAGO_CONFIRMADO,
      actorId: params.userId,
      actorName: 'Pasarela Tarjeta / Stripe',
      actorRole: 'SISTEMA',
      reason: `Pago con tarjeta ${verifiedBrand} terminación ${verifiedLast4} aprobado`,
    });

    await confirmStockTx(
      tx,
      payment.orderId,
      params.userId,
      payment.order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Venta tarjeta confirmada (${payment.order.orderCode})`
    );

    return { updatedOrder, updatedPayment };
  });

  broadcastOrderChange(
    updated.updatedOrder.id,
    updated.updatedOrder.orderCode,
    updated.updatedOrder.status,
    updated.updatedPayment.status,
    'Pago con tarjeta confirmado'
  );

  prisma.order
    .findUnique({
      where: { id: updated.updatedOrder.id },
      include: { user: { select: { name: true, email: true } }, items: { include: { product: true } } },
    })
    .then((o) => {
      if (!o) return;
      if (o.user?.email) {
        sendOrderConfirmedEmail({
          toEmail: o.user.email,
          customerName: o.user.name,
          orderId: o.id,
          orderCode: o.orderCode,
          paymentMethod: `Tarjeta ${verifiedBrand} •••• ${verifiedLast4}`,
          totalBs: Number(o.totalBs),
          totalUsd: Number(o.totalUsd),
          items: o.items,
        }).catch(() => {});
      }
      sendManagerAlertEmail({
        templateType: 'MANAGER_NEW_ORDER',
        subject: `Nueva venta ${o.orderCode} (Tarjeta ${verifiedBrand}) — Bs. ${Number(o.totalBs).toFixed(2)}`,
        title: `Ingreso tarjeta confirmado: ${o.orderCode}`,
        bodyHtml: `<p>Pago aprobado con tarjeta <strong>${verifiedBrand}</strong> terminación <strong>${verifiedLast4}</strong> por <strong>Bs. ${Number(o.totalBs).toFixed(2)}</strong> ($ ${Number(o.totalUsd).toFixed(2)} USD).</p>`,
        relatedOrderId: o.id,
      }).catch(() => {});
      for (const item of o.items) {
        if (item.product.stockDisponible <= item.product.stockMinimoAlerta) {
          sendManagerAlertEmail({
            templateType: 'LOW_STOCK_ALERT',
            subject: `Alerta Stock Bajo: ${item.product.name} (${item.product.stockDisponible} u.)`,
            title: `Stock crítico: ${item.product.name}`,
            bodyHtml: `<p>Quedan solamente <strong>${item.product.stockDisponible}</strong> unidades disponibles (mínimo: ${item.product.stockMinimoAlerta}).</p>`,
            relatedOrderId: o.id,
          }).catch(() => {});
        }
      }
    })
    .catch(() => {});

  return {
    orderId: updated.updatedOrder.id,
    orderCode: updated.updatedOrder.orderCode,
    status: updated.updatedOrder.status,
    paymentIntentId: params.paymentIntentId,
    cardBrand: verifiedBrand,
    cardLast4: verifiedLast4,
  };
}

export async function cancelStripePaymentIntent(
  orderId: string,
  userId: string,
  reason = 'Pago con tarjeta cancelado'
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order) return null;
  if (order.userId !== userId) {
    throw new AppError(403, 'No autorizado sobre esta orden');
  }
  if (order.status !== OrderStatus.PENDIENTE_PAGO) {
    return { cancelled: false, status: order.status };
  }

  await prisma.$transaction(async (tx) => {
    await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.CANCELADO,
      actorId: userId,
      actorName: 'Cliente',
      actorRole: 'CLIENTE',
      reason,
    });
    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.EXPIRADO, reviewNotes: reason },
      });
    }
    await releaseStockTx(
      tx,
      order.id,
      userId,
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Stock liberado tras cancelación tarjeta (${order.orderCode})`
    );
  });

  broadcastOrderChange(order.id, order.orderCode, OrderStatus.CANCELADO, 'EXPIRADO', reason);
  return { cancelled: true };
}
