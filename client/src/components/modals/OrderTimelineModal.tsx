import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, CheckCircle2, KeyRound, PackageCheck, Printer, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDateTime, formatDualPrice } from '../../lib/format';
import { useOrderStream } from '../../hooks/useOrderStream';
import { Order, OrderStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { ModalDetailSkeleton } from '../ui/Skeleton';
import { StatusBadge } from '../ui/StatusBadge';
import { LiveDeliveryMap } from '../maps/LiveDeliveryMap';
import { OrderDeliveryChat } from '../chat/OrderDeliveryChat';
import { ReceiptPrintModal } from './ReceiptPrintModal';

const PIPELINE_STEPS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'PENDIENTE_PAGO', label: 'Pago Iniciado' },
  { key: 'PAGO_CONFIRMADO', label: 'Pago Confirmado' },
  { key: 'EN_PREPARACION', label: 'Cocina & Bar' },
  { key: 'EMPACADO', label: 'Empacado + Sello' },
  { key: 'EN_CAMINO', label: 'En Camino' },
  { key: 'ENTREGADO', label: 'Entregado' },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'PAGO_EN_REVISION') return 0;
  return PIPELINE_STEPS.findIndex((s) => s.key === status);
}

export function OrderTimelineModal({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const [receiptOpen, setReceiptOpen] = useState(false);

  useOrderStream({ orderId: orderId || undefined, enabled: Boolean(orderId) });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const res = await api.get<{ order: Order }>(`/orders/${orderId}`);
      return res.data.order;
    },
    enabled: Boolean(orderId),
    refetchInterval: 3500,
  });

  if (!orderId) return null;

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isTerminalError = order?.status === 'CANCELADO' || order?.status === 'RECHAZADO';
  const showDeliveryMapAndChat =
    order &&
    ['PAGO_CONFIRMADO', 'EN_PREPARACION', 'EMPACADO', 'EN_CAMINO', 'ENTREGADO'].includes(
      order.status
    );

  return (
    <>
      <Modal
        open={Boolean(orderId)}
        onClose={onClose}
        title={order ? `Rastreo en Vivo · ${order.orderCode}` : 'Cargando trazabilidad…'}
        subtitle={order ? `${order.deliveryAddress || 'Sucre, Bolivia'}` : undefined}
        maxWidthClass="max-w-3xl"
      >
        {isLoading || !order ? (
          <ModalDetailSkeleton />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-elevated p-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-joycyan/40 bg-joycyan/10 px-3 py-1.5 text-xs font-bold text-joycyan hover:bg-joycyan/20"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Imprimir Recibo</span>
                </button>
              </div>
              <div className="text-right font-mono">
                <p className="text-base font-bold tabular-nums text-ink">
                  {formatDualPrice(order.totalBs).bs}
                </p>
                <p className="text-xs tabular-nums text-muted">
                  {formatDualPrice(order.totalBs).usd}
                </p>
              </div>
            </div>

            {/* Highlighted Delivery PIN Card when Packed or On the Way */}
            {order.delivery?.deliveryPin &&
              (order.status === 'EMPACADO' || order.status === 'EN_CAMINO') && (
                <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-joymagenta/50 bg-joymagenta/15 p-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-200">
                      <KeyRound className="h-4 w-4 text-joymagenta" />
                      PIN de Entrega Exclusivo para el Cliente
                    </p>
                    <p className="mt-1 text-sm text-pink-100/85">
                      Dicta este código al repartidor únicamente al recibir tu paquete{' '}
                      <strong className="font-mono">{order.delivery.packageLabelCode}</strong>.
                    </p>
                  </div>
                  <div className="rounded-xl border border-joymagenta/60 bg-obsidian px-5 py-3 text-center">
                    <span className="font-mono text-3xl font-extrabold tracking-[0.25em] tabular-nums text-joymagenta">
                      {order.delivery.deliveryPin}
                    </span>
                  </div>
                </div>
              )}

            {/* 6-Step Progress Stepper */}
            {!isTerminalError && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                {PIPELINE_STEPS.map((step, idx) => {
                  const done = currentStep >= idx;
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center rounded-xl border p-2.5 text-center ${
                        done
                          ? 'border-joycyan/50 bg-joycyan/15 text-ink'
                          : 'border-hairline bg-obsidian text-muted'
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          done ? 'bg-joycyan text-obsidian' : 'bg-elevated text-muted'
                        }`}
                      >
                        {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                      </span>
                      <span className="mt-1.5 text-xs font-semibold leading-tight">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live PedidosYa-Style Map & Direct Chat */}
            {showDeliveryMapAndChat && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <LiveDeliveryMap
                  status={order.status}
                  destLat={order.delivery?.destLat}
                  destLng={order.delivery?.destLng}
                  riderLat={order.delivery?.riderLat}
                  riderLng={order.delivery?.riderLng}
                  etaMinutes={order.delivery?.etaMinutes}
                  deliveryAddress={order.deliveryAddress}
                />
                <OrderDeliveryChat orderId={order.id} />
              </div>
            )}

            {/* Packaging Verification Status */}
            {order.packaging && (
              <div className="rounded-xl border border-hairline bg-obsidian p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    <PackageCheck className="h-4 w-4 text-joycyan" />
                    Checklist de Cocina/Bar &amp; Empaque
                  </p>
                  {order.packaging.sealCode && (
                    <span className="font-mono text-xs text-joycyan">
                      Sello: {order.packaging.sealCode}
                    </span>
                  )}
                </div>
                <ul className="mt-3 space-y-1.5 text-xs sm:text-sm">
                  {order.packaging.items.map((chk) => (
                    <li key={chk.id} className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          chk.checked ? 'text-emerald-400' : 'text-hairline'
                        }`}
                      />
                      <span>{chk.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Immutable Audit History */}
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <ShieldCheck className="h-4 w-4 text-joycyan" />
                Historial de Seguimiento en Vivo
              </h4>
              <ol className="space-y-2.5 border-l-2 border-hairline pl-4">
                {order.history?.map((h) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-joycyan" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-xs font-bold text-ink sm:text-sm">
                        {h.toStatus} ·{' '}
                        <span className="font-normal text-joycyan">
                          {h.actorName} ({h.actorRole})
                        </span>
                      </p>
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {formatDateTime(h.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted sm:text-sm">{h.reason}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>

      <ReceiptPrintModal
        order={receiptOpen && order ? order : null}
        onClose={() => setReceiptOpen(false)}
      />
    </>
  );
}
