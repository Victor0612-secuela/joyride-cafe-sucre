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

const PAYPAL_BASE_URL =
  env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isPayPalConfigured(): boolean {
  return Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET);
}

export function getPayPalPublicConfig() {
  return {
    configured: isPayPalConfigured(),
    expressSandboxReady: true,
    clientId: env.PAYPAL_CLIENT_ID || null,
    currency: 'USD',
    mode: env.PAYPAL_MODE,
    exchangeRate: env.USD_EXCHANGE_RATE,
  };
}

async function getPayPalAccessToken(): Promise<string> {
  if (!isPayPalConfigured()) {
    throw new AppError(
      503,
      'PayPal no está configurado en el servidor (faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en .env)'
    );
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.token;
  }

  const creds = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new AppError(502, `Error autenticando con PayPal OAuth2: ${res.status}`, errText);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function createPayPalOrder(input: CreateOrderInput) {
  const deliveryFeeBs = computeDeliveryFeeBs(input.deliveryType);
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

  // Reserve inventory inside PostgreSQL transaction
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
            reason: 'Orden iniciada con PayPal',
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
      `Reserva temporal para orden PayPal ${order.orderCode}`
    );

    return order;
  });

  // Express Sandbox flow when PAYPAL_CLIENT_ID / SECRET are not set yet
  if (!isPayPalConfigured()) {
    const expressId = `PP-SBX-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
    await prisma.payment.create({
      data: {
        orderId: reserved.id,
        method: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDIENTE,
        amountBs: reserved.totalBs,
        amountUsd: reserved.totalUsd,
        paypalOrderId: expressId,
      },
    });
    return {
      paypalOrderId: expressId,
      orderId: reserved.id,
      orderCode: reserved.orderCode,
      totalBs: Number(reserved.totalBs),
      totalUsd: Number(reserved.totalUsd),
      mode: 'sandbox_express' as const,
    };
  }

  // Call Official PayPal REST API when real client credentials exist
  try {
    const accessToken = await getPayPalAccessToken();
    const ppRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: reserved.orderCode,
            description: `Joy Ride Café Sucre - Pedido ${reserved.orderCode}`,
            amount: {
              currency_code: 'USD',
              value: Number(reserved.totalUsd).toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: 'Joy Ride Café Sucre',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    if (!ppRes.ok) {
      const errBody = await ppRes.text();
      throw new Error(`PayPal Create Order HTTP ${ppRes.status}: ${errBody}`);
    }

    const ppOrder = (await ppRes.json()) as { id: string; status: string };

    await prisma.payment.create({
      data: {
        orderId: reserved.id,
        method: PaymentMethod.PAYPAL,
        status: PaymentStatus.PENDIENTE,
        amountBs: reserved.totalBs,
        amountUsd: reserved.totalUsd,
        paypalOrderId: ppOrder.id,
      },
    });

    return {
      paypalOrderId: ppOrder.id,
      orderId: reserved.id,
      orderCode: reserved.orderCode,
      totalBs: Number(reserved.totalBs),
      totalUsd: Number(reserved.totalUsd),
      mode: 'live_sdk' as const,
    };
  } catch (err) {
    await cancelPayPalOrder(reserved.id, input.userId, 'Fallo al crear orden en PayPal');
    throw new AppError(502, err instanceof Error ? err.message : 'Error creando orden PayPal');
  }
}

export async function capturePayPalOrder(params: {
  paypalOrderId: string;
  orderId: string;
  userId: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { paypalOrderId: params.paypalOrderId },
    include: { order: { include: { items: true } } },
  });

  if (!payment || payment.orderId !== params.orderId) {
    throw new AppError(404, 'Orden PayPal no encontrada en el sistema');
  }
  if (payment.order.userId !== params.userId) {
    throw new AppError(403, 'No tienes autorización sobre esta orden PayPal');
  }

  if (payment.status === PaymentStatus.COMPLETADO) {
    return {
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      status: payment.order.status,
      paypalCaptureId: payment.paypalCaptureId,
    };
  }

  let captureId: string;
  let payerEmail: string | null = null;

  if (!isPayPalConfigured() && params.paypalOrderId.startsWith('PP-SBX-')) {
    captureId = `CAP-SBX-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const u = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true } });
    payerEmail = u?.email || 'paypal-express@joyride.bo';
  } else {
    const accessToken = await getPayPalAccessToken();
    const capRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${params.paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capData = (await capRes.json()) as {
      id?: string;
      status?: string;
      payer?: { email_address?: string };
      purchase_units?: Array<{
        payments?: {
          captures?: Array<{ id: string; status: string }>;
        };
      }>;
    };

    if (!capRes.ok || capData.status !== 'COMPLETED') {
      throw new AppError(402, 'La captura de PayPal no fue completada', capData);
    }

    captureId = capData.purchase_units?.[0]?.payments?.captures?.[0]?.id || capData.id || params.paypalOrderId;
    payerEmail = capData.payer?.email_address || null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETADO,
        paypalCaptureId: captureId,
        paypalPayerEmail: payerEmail,
        verifiedAt: new Date(),
        reviewNotes: `Capturado vía PayPal (${captureId})`,
      },
    });

    const updatedOrder = await transitionOrderStatusTx(tx, {
      orderId: payment.orderId,
      orderCode: payment.order.orderCode,
      fromStatus: payment.order.status,
      toStatus: OrderStatus.PAGO_CONFIRMADO,
      actorId: params.userId,
      actorName: 'Pasarela PayPal',
      actorRole: 'SISTEMA',
      reason: `Pago PayPal capturado (${captureId})`,
    });

    await confirmStockTx(
      tx,
      payment.orderId,
      params.userId,
      payment.order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Venta PayPal confirmada (${payment.order.orderCode})`
    );

    return { updatedOrder, updatedPayment };
  });

  broadcastOrderChange(
    updated.updatedOrder.id,
    updated.updatedOrder.orderCode,
    updated.updatedOrder.status,
    updated.updatedPayment.status,
    'Pago PayPal confirmado y capturado'
  );

  prisma.order
    .findUnique({
      where: { id: updated.updatedOrder.id },
      include: { user: { select: { name: true, email: true } }, items: true },
    })
    .then((o) => {
      if (o?.user?.email) {
        sendOrderConfirmedEmail({
          toEmail: o.user.email,
          customerName: o.user.name,
          orderId: o.id,
          orderCode: o.orderCode,
          paymentMethod: 'PayPal',
          totalBs: Number(o.totalBs),
          totalUsd: Number(o.totalUsd),
          items: o.items,
        }).catch(() => {});
        sendManagerAlertEmail({
          templateType: 'MANAGER_NEW_ORDER',
          subject: `Venta PayPal ${o.orderCode} — $ ${Number(o.totalUsd).toFixed(2)} USD`,
          title: `Pago PayPal capturado: ${o.orderCode}`,
          bodyHtml: `<p>Orden PayPal <strong>${captureId}</strong> capturada por $ ${Number(o.totalUsd).toFixed(2)} USD (Bs. ${Number(o.totalBs).toFixed(2)}).</p>`,
          relatedOrderId: o.id,
        }).catch(() => {});
      }
    })
    .catch(() => {});

  return {
    orderId: updated.updatedOrder.id,
    orderCode: updated.updatedOrder.orderCode,
    status: updated.updatedOrder.status,
    paypalCaptureId: captureId,
  };
}

export async function cancelPayPalOrder(orderId: string, actorId: string | null, reason = 'Pago PayPal cancelado por el usuario') {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payment: true },
  });
  if (!order || order.status !== OrderStatus.PENDIENTE_PAGO) {
    return null;
  }

  await prisma.$transaction(async (tx) => {
    await transitionOrderStatusTx(tx, {
      orderId: order.id,
      orderCode: order.orderCode,
      fromStatus: order.status,
      toStatus: OrderStatus.CANCELADO,
      actorId,
      actorName: 'Checkout PayPal',
      actorRole: 'CLIENTE',
      reason,
    });

    if (order.payment) {
      await tx.payment.update({
        where: { id: order.payment.id },
        data: { status: PaymentStatus.RECHAZADO, reviewNotes: reason },
      });
    }

    await releaseStockTx(
      tx,
      order.id,
      actorId,
      order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      `Liberación de stock por cancelación PayPal (${order.orderCode})`
    );
  });

  broadcastOrderChange(order.id, order.orderCode, OrderStatus.CANCELADO, PaymentStatus.RECHAZADO, reason);
  return { cancelled: true, orderId: order.id };
}
