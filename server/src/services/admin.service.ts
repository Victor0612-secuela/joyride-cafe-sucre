import { OrderStatus, PaymentMethod, PaymentStatus, Role, StockMovementType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { roundUsd } from '../utils/hmac';

export async function getAdminAnalytics() {
  const [
    paidOrders,
    statusCounts,
    topItemsRaw,
    lowStockProducts,
    totalProducts,
    activeReservations,
  ] = await Promise.all([
    prisma.payment.findMany({
      where: { status: PaymentStatus.COMPLETADO },
      select: { method: true, amountBs: true, amountUsd: true, createdAt: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: { quantity: true, subtotalBs: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 6,
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { stockDisponible: 'asc' },
      include: { category: { select: { name: true } } },
    }),
    prisma.product.count({ where: { active: true } }),
    prisma.reservation.count({ where: { status: { not: 'CANCELADA' } } }),
  ]);

  let totalBs = 0;
  let totalUsd = 0;
  const byMethod: Record<PaymentMethod, { count: number; totalBs: number; totalUsd: number }> = {
    QR: { count: 0, totalBs: 0, totalUsd: 0 },
    DEPOSITO_BANCARIO: { count: 0, totalBs: 0, totalUsd: 0 },
    PAYPAL: { count: 0, totalBs: 0, totalUsd: 0 },
  };

  for (const p of paidOrders) {
    const bs = Number(p.amountBs);
    const usd = Number(p.amountUsd);
    totalBs += bs;
    totalUsd += usd;
    byMethod[p.method].count += 1;
    byMethod[p.method].totalBs = Number((byMethod[p.method].totalBs + bs).toFixed(2));
    byMethod[p.method].totalUsd = Number((byMethod[p.method].totalUsd + usd).toFixed(2));
  }

  const alerts = lowStockProducts.filter((p) => p.stockDisponible <= p.stockMinimoAlerta);

  return {
    summary: {
      totalRevenueBs: Number(totalBs.toFixed(2)),
      totalRevenueUsd: Number(totalUsd.toFixed(2)),
      completedPaymentsCount: paidOrders.length,
      totalProducts,
      lowStockCount: alerts.length,
      activeReservations,
    },
    revenueByMethod: [
      { method: 'QR', label: 'Simple QR', ...byMethod.QR },
      { method: 'DEPOSITO_BANCARIO', label: 'Depósito Bancario', ...byMethod.DEPOSITO_BANCARIO },
      { method: 'PAYPAL', label: 'PayPal API v2', ...byMethod.PAYPAL },
    ],
    ordersByStatus: statusCounts.map((s) => ({
      status: s.status,
      count: s._count._all,
    })),
    topProducts: topItemsRaw.map((t) => ({
      productId: t.productId,
      productName: t.productName,
      totalSold: t._sum.quantity || 0,
      revenueBs: Number(t._sum.subtotalBs || 0),
    })),
    lowStockAlerts: alerts.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category.name,
      stockDisponible: a.stockDisponible,
      stockReservado: a.stockReservado,
      stockMinimoAlerta: a.stockMinimoAlerta,
      imageUrl: a.imageUrl,
    })),
  };
}

export async function adjustProductStock(params: {
  productId: string;
  delta: number;
  reason: string;
  actorId: string;
}) {
  if (!params.reason || params.reason.trim().length < 4) {
    throw new AppError(400, 'Debes especificar un motivo para el ajuste de inventario');
  }
  if (params.delta === 0) {
    throw new AppError(400, 'El ajuste debe ser distinto de cero');
  }

  return prisma.$transaction(async (tx) => {
    const prod = await tx.product.findUnique({ where: { id: params.productId } });
    if (!prod) throw new AppError(404, 'Producto no encontrado');

    const newStock = prod.stockDisponible + params.delta;
    if (newStock < 0) {
      throw new AppError(400, `Stock disponible no puede quedar negativo (actual: ${prod.stockDisponible})`);
    }

    const updated = await tx.product.update({
      where: { id: prod.id },
      data: { stockDisponible: newStock },
    });

    await tx.stockMovement.create({
      data: {
        productId: prod.id,
        actorId: params.actorId,
        type: StockMovementType.AJUSTE_ADMIN,
        quantity: Math.abs(params.delta),
        previousStock: prod.stockDisponible,
        newStock,
        reason: `${params.delta > 0 ? '+' : ''}${params.delta} u. · ${params.reason.trim()}`,
      },
    });

    return updated;
  });
}

export async function listStockKardex(productId?: string) {
  return prisma.stockMovement.findMany({
    where: productId ? { productId } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      product: { select: { name: true, slug: true } },
      order: { select: { orderCode: true } },
      actor: { select: { name: true, role: true } },
    },
  });
}

export async function upsertProduct(
  id: string | null,
  data: {
    categoryId: string;
    name: string;
    description: string;
    precioBs: number;
    stockDisponible?: number;
    stockMinimoAlerta?: number;
    esVegano?: boolean;
    esPicante?: boolean;
    esDestacado?: boolean;
    enHappyHour?: boolean;
    tiempoPreparacionMin?: number;
    imageUrl?: string;
    maridajeSlug?: string | null;
    active?: boolean;
  },
  actorId: string
) {
  const precioUsd = roundUsd(data.precioBs);

  if (id) {
    return prisma.product.update({
      where: { id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        precioBs: data.precioBs,
        precioUsd,
        ...(data.stockMinimoAlerta !== undefined ? { stockMinimoAlerta: data.stockMinimoAlerta } : {}),
        ...(data.esVegano !== undefined ? { esVegano: data.esVegano } : {}),
        ...(data.esPicante !== undefined ? { esPicante: data.esPicante } : {}),
        ...(data.esDestacado !== undefined ? { esDestacado: data.esDestacado } : {}),
        ...(data.enHappyHour !== undefined ? { enHappyHour: data.enHappyHour } : {}),
        ...(data.tiempoPreparacionMin !== undefined ? { tiempoPreparacionMin: data.tiempoPreparacionMin } : {}),
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
        ...(data.maridajeSlug !== undefined ? { maridajeSlug: data.maridajeSlug } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: { category: true },
    });
  }

  const baseSlug = data.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
  const initialStock = data.stockDisponible ?? 10;

  return prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        categoryId: data.categoryId,
        slug,
        name: data.name,
        description: data.description,
        precioBs: data.precioBs,
        precioUsd,
        stockDisponible: initialStock,
        stockReservado: 0,
        stockMinimoAlerta: data.stockMinimoAlerta ?? 5,
        esVegano: data.esVegano ?? false,
        esPicante: data.esPicante ?? false,
        esDestacado: data.esDestacado ?? false,
        enHappyHour: data.enHappyHour ?? false,
        tiempoPreparacionMin: data.tiempoPreparacionMin ?? 15,
        imageUrl: data.imageUrl || '/images/dish-burger.webp',
        maridajeSlug: data.maridajeSlug || null,
        active: data.active ?? true,
      },
      include: { category: true },
    });

    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: created.id,
          actorId,
          type: StockMovementType.ENTRADA_INICIAL,
          quantity: initialStock,
          previousStock: 0,
          newStock: initialStock,
          reason: 'Creación de producto en catálogo Admin',
        },
      });
    }

    return created;
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function updateUserRole(userId: string, role: Role, active?: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      role,
      ...(active !== undefined ? { active } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      active: true,
    },
  });
}

export async function listAllOrdersAdmin(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { name: true, email: true } },
      items: true,
      payment: true,
      delivery: true,
    },
  });
}
