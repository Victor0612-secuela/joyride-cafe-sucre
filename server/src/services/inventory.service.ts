import { DeliveryType, Prisma, StockMovementType } from '@prisma/client';
import { StockConflictError } from '../middleware/error.middleware';

export interface RequestedItem {
  productId: string;
  quantity: number;
}

export interface ResolvedOrderItem {
  productId: string;
  productName: string;
  unitPriceBs: number;
  quantity: number;
  subtotalBs: number;
}

export async function reserveStockTx(
  tx: Prisma.TransactionClient,
  items: RequestedItem[],
  orderId: string | null,
  actorId: string,
  reason = 'Reserva de inventario al crear pedido'
): Promise<{ resolvedItems: ResolvedOrderItem[]; subtotalBs: number }> {
  // Merge duplicate productIds
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.productId, (merged.get(item.productId) || 0) + item.quantity);
  }

  const normalized = Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  const productRows = await tx.product.findMany({
    where: { id: { in: normalized.map((i) => i.productId) } },
  });
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  const conflicts: Array<{ productId: string; productName: string; requested: number; available: number }> = [];
  const resolvedItems: ResolvedOrderItem[] = [];
  let subtotalBs = 0;

  for (const reqItem of normalized) {
    const product = productMap.get(reqItem.productId);
    if (!product || !product.active) {
      conflicts.push({
        productId: reqItem.productId,
        productName: product?.name || 'Producto no disponible',
        requested: reqItem.quantity,
        available: 0,
      });
      continue;
    }

    const updated = await tx.product.updateMany({
      where: {
        id: product.id,
        active: true,
        stockDisponible: { gte: reqItem.quantity },
      },
      data: {
        stockDisponible: { decrement: reqItem.quantity },
        stockReservado: { increment: reqItem.quantity },
      },
    });

    if (updated.count !== 1) {
      const fresh = await tx.product.findUnique({ where: { id: product.id } });
      conflicts.push({
        productId: product.id,
        productName: product.name,
        requested: reqItem.quantity,
        available: fresh?.stockDisponible ?? 0,
      });
      continue;
    }

    const unitPriceBs = Number(product.precioBs);
    const itemSubtotal = Number((unitPriceBs * reqItem.quantity).toFixed(2));
    subtotalBs = Number((subtotalBs + itemSubtotal).toFixed(2));

    resolvedItems.push({
      productId: product.id,
      productName: product.name,
      unitPriceBs,
      quantity: reqItem.quantity,
      subtotalBs: itemSubtotal,
    });
  }

  if (conflicts.length > 0) {
    throw new StockConflictError(
      `Stock insuficiente para ${conflicts.map((c) => `${c.productName} (disp: ${c.available}, ped: ${c.requested})`).join(', ')}`,
      conflicts
    );
  }

  // Record stock movements once orderId is known (or pass orderId directly after order creation)
  if (orderId) {
    for (const item of resolvedItems) {
      const prod = productMap.get(item.productId)!;
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          orderId,
          actorId,
          type: StockMovementType.RESERVA_PEDIDO,
          quantity: item.quantity,
          previousStock: prod.stockDisponible,
          newStock: prod.stockDisponible - item.quantity,
          reason,
        },
      });
    }
  }

  return { resolvedItems, subtotalBs };
}

export async function recordReservationMovementsTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string,
  items: ResolvedOrderItem[],
  reason = 'Reserva atómica de stock al generar pedido'
) {
  for (const item of items) {
    const current = await tx.product.findUnique({ where: { id: item.productId } });
    if (!current) continue;
    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        orderId,
        actorId,
        type: StockMovementType.RESERVA_PEDIDO,
        quantity: item.quantity,
        previousStock: current.stockDisponible + item.quantity,
        newStock: current.stockDisponible,
        reason,
      },
    });
  }
}

export async function confirmStockTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string | null,
  items: Array<{ productId: string; quantity: number }>,
  reason = 'Consolidación de venta tras pago confirmado'
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const decReserved = Math.min(product.stockReservado, item.quantity);
    if (decReserved > 0) {
      await tx.product.update({
        where: { id: product.id },
        data: { stockReservado: { decrement: decReserved } },
      });
    }
    await tx.stockMovement.create({
      data: {
        productId: product.id,
        orderId,
        actorId,
        type: StockMovementType.VENTA_CONFIRMADA,
        quantity: item.quantity,
        previousStock: product.stockDisponible,
        newStock: product.stockDisponible,
        reason,
      },
    });
  }
}

export async function releaseStockTx(
  tx: Prisma.TransactionClient,
  orderId: string,
  actorId: string | null,
  items: Array<{ productId: string; quantity: number }>,
  reason = 'Liberación de stock reservado'
) {
  for (const item of items) {
    const product = await tx.product.findUnique({ where: { id: item.productId } });
    if (!product) continue;
    const releaseQty = Math.min(product.stockReservado, item.quantity);
    if (releaseQty > 0) {
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockReservado: { decrement: releaseQty },
          stockDisponible: { increment: releaseQty },
        },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          orderId,
          actorId,
          type: StockMovementType.LIBERACION_STOCK,
          quantity: releaseQty,
          previousStock: product.stockDisponible,
          newStock: product.stockDisponible + releaseQty,
          reason,
        },
      });
    }
  }
}

export function computeDeliveryFeeBs(deliveryType: DeliveryType): number {
  return deliveryType === DeliveryType.DELIVERY ? 8 : 0;
}
