import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Eye,
  KeyRound,
  MapPin,
  Package,
  Printer,
  QrCode,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useOrderStream } from '../hooks/useOrderStream';
import { api, getErrorMessage } from '../lib/api';
import { formatDateTime, formatDualPrice, ZONE_META } from '../lib/format';
import { Order, Reservation } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { OrderTableSkeleton } from '../components/ui/Skeleton';
import { WhatsAppFloat } from '../components/ui/WhatsAppFloat';
import { OrderTimelineModal } from '../components/modals/OrderTimelineModal';
import { ReceiptPrintModal } from '../components/modals/ReceiptPrintModal';
import { QrLivePaymentModal, QrSessionData } from '../components/modals/QrLivePaymentModal';
import { BANK_INFO_FALLBACK } from '../lib/constants';
import { ProbablyTagline } from '../components/ui/ProbablyTagline';

export function MyOrdersPage() {
  useDocumentTitle('Mis Pedidos y Reservas — Joy Ride Café® Sucre');
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [resumeQrSession, setResumeQrSession] = useState<QrSessionData | null>(null);

  useOrderStream({ enabled: Boolean(user) });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => {
      const res = await api.get<{ orders: Order[] }>('/orders/mine');
      return res.data.orders;
    },
    enabled: Boolean(user),
    refetchInterval: 4000,
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: async () => {
      const res = await api.get<{ reservations: Reservation[] }>('/reservations');
      return res.data.reservations;
    },
    enabled: Boolean(user),
  });

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`);
      pushToast('Pedido cancelado', 'info', 'El stock reservado fue devuelto al catálogo');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      pushToast('No se pudo cancelar', 'error', getErrorMessage(err));
    }
  };

  const handleResumeQr = (order: Order) => {
    if (!order.payment?.qrToken) return;
    const qrPayUrl = `${window.location.origin}/pagar-qr/${order.payment.qrToken}`;
    setResumeQrSession({
      orderId: order.id,
      orderCode: order.orderCode,
      totalBs: Number(order.totalBs),
      totalUsd: Number(order.totalUsd),
      expiresAt: order.expiresAt || new Date(Date.now() + 10 * 60000).toISOString(),
      qrToken: order.payment.qrToken,
      qrPayUrl,
      qrPayload: qrPayUrl,
      bankInfo: BANK_INFO_FALLBACK,
    });
  };

  return (
    <div className="min-h-screen bg-obsidian text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1600px] px-4 pb-20 pt-28 sm:px-8 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-joycyan hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Volver al Inicio</span>
            </Link>
            <div className="mt-2">
              <ProbablyTagline subject="Delivery" accent="cyan" size="sm" spanishHint="Seguimiento en vivo con PIN" />
            </div>
            <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">
              Mis Pedidos &amp; Reservas
            </h1>
            <p className="mt-1 text-sm text-muted">
              Seguimiento en tiempo real desde Cocina/Bar hasta tu PIN de entrega.
            </p>
          </div>
          <Link
            to="/mapa-sucre"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-joycyan/40 bg-joycyan/10 px-4 py-2 text-xs font-bold text-joycyan transition-colors hover:bg-joycyan/20"
          >
            <MapPin className="h-4 w-4" />
            <span>Mapa Turístico Sucre</span>
          </Link>
        </div>

        {/* Orders Section */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Package className="h-5 w-5 text-joycyan" />
            <span>Historial de Pedidos</span>
          </h2>

          {ordersLoading ? (
            <OrderTableSkeleton rows={4} />
          ) : !orders || orders.length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-surface p-10 text-center">
              <p className="font-display text-lg font-bold text-ink">
                Aún no tienes pedidos registrados
              </p>
              <p className="mt-1 text-sm text-muted">
                Explora la carta y realiza tu primer pedido con QR, Depósito o PayPal.
              </p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-xl bg-joycyan px-5 py-2.5 text-sm font-bold text-obsidian"
              >
                Ir a la Carta
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-hairline bg-surface p-5 shadow-card lg:flex-row lg:items-center"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-base font-extrabold text-joycyan">
                        {order.orderCode}
                      </span>
                      <StatusBadge status={order.status} />
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-ink">
                      {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(' · ')}
                    </p>

                    <p className="text-xs text-muted">
                      {order.deliveryAddress} · Método: {order.payment?.method || 'N/A'}
                    </p>

                    {/* Highlight PIN directly on card when ready */}
                    {order.delivery?.deliveryPin &&
                      (order.status === 'EMPACADO' || order.status === 'EN_CAMINO') && (
                        <div className="inline-flex items-center gap-2.5 rounded-xl border border-joymagenta/50 bg-joymagenta/15 px-3.5 py-2">
                          <KeyRound className="h-4 w-4 text-joymagenta" />
                          <span className="text-xs font-semibold text-pink-200">
                            Tu PIN de entrega:
                          </span>
                          <span className="font-mono text-lg font-extrabold tracking-widest tabular-nums text-joymagenta">
                            {order.delivery.deliveryPin}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3 lg:justify-end lg:border-0 lg:pt-0">
                    <div className="text-left font-mono lg:text-right">
                      <p className="text-base font-bold tabular-nums text-ink">
                        {formatDualPrice(order.totalBs).bs}
                      </p>
                      <p className="text-xs tabular-nums text-muted">
                        {formatDualPrice(order.totalBs).usd}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {order.status === 'PENDIENTE_PAGO' && order.payment?.method === 'QR' && (
                        <button
                          type="button"
                          onClick={() => handleResumeQr(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-joymagenta px-3.5 py-2 text-xs font-bold text-white hover:bg-joymagenta-deep"
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Pagar QR</span>
                        </button>
                      )}

                      {order.status === 'PENDIENTE_PAGO' && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancelar</span>
                        </button>
                      )}

                      {order.status !== 'PENDIENTE_PAGO' &&
                        order.status !== 'CANCELADO' &&
                        order.status !== 'RECHAZADO' && (
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-joycyan/40 bg-joycyan/10 px-3.5 py-2 text-xs font-bold text-joycyan hover:bg-joycyan/20"
                          >
                            <Printer className="h-4 w-4" />
                            <span>Recibo</span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => setSelectedOrderId(order.id)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-hairline bg-elevated px-3.5 py-2 text-xs font-semibold text-ink hover:border-joycyan/60"
                      >
                        <Eye className="h-4 w-4 text-joycyan" />
                        <span>Auditoría en Vivo</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Reservations Section */}
        {reservations && reservations.length > 0 && (
          <section className="mt-12 space-y-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Calendar className="h-5 w-5 text-joymagenta" />
              <span>Mis Reservas de Mesa &amp; Salsa</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="rounded-2xl border border-hairline bg-surface p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-joycyan">{res.code}</span>
                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                      {res.status}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-base font-bold text-ink">
                    {ZONE_META[res.zone].label}
                  </p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                    {res.date} · {res.timeSlot} · {res.partySize} personas
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-joymagenta">
                    Pase QR: {res.qrPassToken}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <OrderTimelineModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />

      <QrLivePaymentModal
        session={resumeQrSession}
        onClose={() => setResumeQrSession(null)}
        onConfirmed={(id) => {
          setResumeQrSession(null);
          setSelectedOrderId(id);
        }}
      />

      <ReceiptPrintModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      <WhatsAppFloat />
    </div>
  );
}
