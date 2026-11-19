import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bike,
  CheckCircle2,
  KeyRound,
  MapPin,
  MessageSquare,
  Navigation,
  PackageCheck,
  Phone,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrderStream } from '../../hooks/useOrderStream';
import { api, getErrorMessage } from '../../lib/api';
import { JOYRIDE_LOCATION } from '../../lib/constants';
import { formatDateTime, formatDualPrice } from '../../lib/format';
import { Order } from '../../types';
import { OperationsLayout } from '../../components/layout/OperationsLayout';
import { LiveDeliveryMap } from '../../components/maps/LiveDeliveryMap';
import { OrderDeliveryChat } from '../../components/chat/OrderDeliveryChat';
import { Modal } from '../../components/ui/Modal';
import { OrderTableSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function RiderPanel() {
  useDocumentTitle('Repartidor & Entregas — Joy Ride Café® Sucre');
  useOrderStream({ enabled: true });

  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'EMPACADO' | 'EN_CAMINO' | 'ENTREGADO'>('EMPACADO');
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [mapChatOrderId, setMapChatOrderId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['delivery', 'orders'],
    queryFn: async () => {
      const res = await api.get<{ orders: Order[] }>('/delivery/orders');
      return res.data.orders;
    },
    refetchInterval: 4000,
  });

  const handlePickup = async (order: Order) => {
    setBusyId(order.id);
    try {
      await api.patch(`/delivery/orders/${order.id}/pickup`);
      pushToast('Pedido retirado', 'info', `${order.orderCode} ahora está EN_CAMINO`);
      setTab('EN_CAMINO');
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    } catch (err) {
      pushToast('No se pudo retirar', 'error', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringOrder) return;
    setBusyId(deliveringOrder.id);
    try {
      await api.patch(`/delivery/orders/${deliveringOrder.id}/deliver`, {
        pin: pin.trim(),
        receiverName: receiverName.trim(),
        notes: deliveryNotes.trim() || undefined,
      });
      pushToast(
        '¡Entrega finalizada con PIN!',
        'success',
        `Pedido ${deliveringOrder.orderCode} cerrado en ENTREGADO`
      );
      setDeliveringOrder(null);
      setPin('');
      setReceiverName('');
      setDeliveryNotes('');
      setTab('ENTREGADO');
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    } catch (err) {
      pushToast('PIN inválido o error al entregar', 'error', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvanceGps = async (order: Order) => {
    setBusyId(order.id);
    try {
      const curLat = order.delivery?.riderLat ?? JOYRIDE_LOCATION.lat;
      const curLng = order.delivery?.riderLng ?? JOYRIDE_LOCATION.lng;
      const dLat = order.delivery?.destLat ?? -19.0442;
      const dLng = order.delivery?.destLng ?? -65.2618;
      const nextLat = Number((curLat + (dLat - curLat) * 0.35).toFixed(6));
      const nextLng = Number((curLng + (dLng - curLng) * 0.35).toFixed(6));
      const nextEta = Math.max(2, (order.delivery?.etaMinutes ?? 14) - 3);
      await api.patch(`/delivery/orders/${order.id}/location`, {
        riderLat: nextLat,
        riderLng: nextLng,
        etaMinutes: nextEta,
      });
      pushToast('Ubicación GPS actualizada', 'success', `ETA estimado: ${nextEta} min`);
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    } catch (err) {
      pushToast('No se pudo actualizar GPS', 'error', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const activeMapOrder = (orders || []).find((o) => o.id === mapChatOrderId) || null;
  const filtered = (orders || []).filter((o) => o.status === tab);
  const countBy = (s: 'EMPACADO' | 'EN_CAMINO' | 'ENTREGADO') =>
    (orders || []).filter((o) => o.status === s).length;

  return (
    <OperationsLayout
      title="Despacho & Entregas por PIN"
      subtitle="Retira paquetes sellados en Calle Nicolás Ortiz 14 y cierra la entrega validando el PIN del cliente"
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: 'EMPACADO' as const, label: 'Listos para Retiro' },
          { key: 'EN_CAMINO' as const, label: 'En Camino' },
          { key: 'ENTREGADO' as const, label: 'Entregados' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
              tab === t.key
                ? 'border-joycyan bg-joycyan text-obsidian'
                : 'border-hairline bg-surface text-muted hover:text-ink'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums ${
                tab === t.key ? 'bg-obsidian/20 text-obsidian' : 'bg-elevated text-ink'
              }`}
            >
              {countBy(t.key)}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <OrderTableSkeleton rows={4} />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center">
          <Bike className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-display text-lg font-bold text-ink">
            No hay pedidos en esta bandeja
          </p>
          <p className="mt-1 text-sm text-muted">
            Revisa la pestaña de paquetes listos o en camino.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="flex flex-col justify-between rounded-2xl border border-hairline bg-surface p-5 shadow-card"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-base font-extrabold text-joycyan">
                    {order.orderCode}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="font-mono font-semibold text-joymagenta">
                    Etiqueta: {order.delivery?.packageLabelCode || 'JR-PKG'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatDualPrice(order.totalBs).bs}
                  </span>
                </div>

                <div className="rounded-xl border border-hairline bg-obsidian p-3 text-xs space-y-1.5">
                  <p className="font-bold text-ink">{order.user?.name || 'Cliente'}</p>
                  <p className="flex items-start gap-1.5 text-slate-300">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-joycyan" />
                    <span>
                      {order.delivery?.deliveryAddress || order.deliveryAddress}
                      {order.delivery?.deliveryReference
                        ? ` (${order.delivery.deliveryReference})`
                        : ''}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5 font-mono text-joycyan">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{order.phoneContact}</span>
                  </p>
                </div>

                <p className="text-xs text-muted">
                  {order.items.map((i) => `${i.quantity}× ${i.productName}`).join(' · ')}
                </p>
              </div>

              <div className="mt-4 border-t border-hairline pt-3">
                {order.status === 'EMPACADO' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => handlePickup(order)}
                      className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-joycyan py-2.5 text-xs font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
                    >
                      <PackageCheck className="h-4 w-4" />
                      <span>Retirar Paquete y Salir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapChatOrderId(order.id)}
                      className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl border border-hairline bg-elevated py-2 text-xs font-semibold text-ink hover:border-joycyan/50"
                    >
                      <MessageSquare className="h-4 w-4 text-joycyan" />
                      <span>Ver Ruta &amp; Chat con Cliente</span>
                    </button>
                  </div>
                )}

                {order.status === 'EN_CAMINO' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => handleAdvanceGps(order)}
                        className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-joycyan/50 bg-joycyan/15 px-3 py-2 text-xs font-bold text-joycyan hover:bg-joycyan/25 disabled:opacity-50"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Actualizar Ubicación en Ruta</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMapChatOrderId(order.id)}
                        className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-hairline bg-elevated px-3 py-2 text-xs font-bold text-ink hover:border-joycyan/60"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-joycyan" />
                        <span>Mapa &amp; Chat con Cliente</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveringOrder(order);
                        setReceiverName(order.user?.name || '');
                        setPin('');
                      }}
                      className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-joymagenta py-2.5 text-xs font-bold text-white hover:bg-joymagenta-deep"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Validar PIN y Finalizar Entrega</span>
                    </button>
                  </div>
                )}

                {order.status === 'ENTREGADO' && (
                  <div className="flex items-center justify-between text-xs text-emerald-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Recibió: {order.delivery?.receiverName || 'Cliente'}
                    </span>
                    <span className="font-mono tabular-nums text-muted">
                      {order.delivery?.deliveredAt
                        ? formatDateTime(order.delivery.deliveredAt)
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PIN Delivery Verification Modal */}
      <Modal
        open={Boolean(deliveringOrder)}
        onClose={() => setDeliveringOrder(null)}
        title={deliveringOrder ? `Finalizar Entrega · ${deliveringOrder.orderCode}` : ''}
        subtitle="Solicita el PIN de 4 dígitos al cliente para cerrar la trazabilidad del pedido"
        maxWidthClass="max-w-md"
      >
        {deliveringOrder && (
          <form onSubmit={handleDeliverSubmit} className="space-y-4">
            <div className="rounded-xl border border-hairline bg-elevated p-3.5 text-xs">
              <p className="text-muted">Destino</p>
              <p className="mt-0.5 font-semibold text-ink">
                {deliveringOrder.delivery?.deliveryAddress || deliveringOrder.deliveryAddress}
              </p>
            </div>

            <div>
              <label htmlFor="deliv-pin" className="block text-xs font-bold text-ink">
                PIN de Entrega (4 dígitos del cliente)
              </label>
              <input
                id="deliv-pin"
                type="text"
                inputMode="numeric"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Ej. 4829"
                className="mt-1.5 w-full rounded-xl border border-hairline bg-obsidian px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.4em] tabular-nums text-joymagenta focus:border-joycyan focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="deliv-rec" className="block text-xs font-semibold text-ink">
                Nombre de quien recibe
              </label>
              <input
                id="deliv-rec"
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="deliv-notes" className="block text-xs font-semibold text-muted">
                Observación (opcional)
              </label>
              <input
                id="deliv-notes"
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Ej. Entregado en puerta principal"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={pin.length !== 4 || busyId === deliveringOrder.id}
              className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-obsidian transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
            >
              Confirmar Entrega Exitosa
            </button>
          </form>
        )}
      </Modal>

      {/* Live Delivery Map & Direct Client Chat Modal */}
      <Modal
        open={Boolean(activeMapOrder)}
        onClose={() => setMapChatOrderId(null)}
        title={activeMapOrder ? `Ruta GPS & Chat · ${activeMapOrder.orderCode}` : ''}
        subtitle={
          activeMapOrder
            ? `${activeMapOrder.delivery?.deliveryAddress || activeMapOrder.deliveryAddress} · ${activeMapOrder.phoneContact}`
            : ''
        }
        maxWidthClass="max-w-3xl"
      >
        {activeMapOrder && (
          <div className="space-y-5">
            {activeMapOrder.status === 'EN_CAMINO' && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-joycyan/30 bg-joycyan/10 p-3 text-xs">
                <span className="font-semibold text-ink">
                  ETA actual:{' '}
                  <strong className="font-mono text-joycyan">
                    {activeMapOrder.delivery?.etaMinutes ?? 12} min
                  </strong>
                </span>
                <button
                  type="button"
                  disabled={busyId === activeMapOrder.id}
                  onClick={() => handleAdvanceGps(activeMapOrder)}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-joycyan px-3.5 py-2 font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Actualizar Ubicación en Ruta</span>
                </button>
              </div>
            )}

            <LiveDeliveryMap
              status={activeMapOrder.status}
              destLat={activeMapOrder.delivery?.destLat}
              destLng={activeMapOrder.delivery?.destLng}
              riderLat={activeMapOrder.delivery?.riderLat}
              riderLng={activeMapOrder.delivery?.riderLng}
              etaMinutes={activeMapOrder.delivery?.etaMinutes}
              deliveryAddress={
                activeMapOrder.delivery?.deliveryAddress || activeMapOrder.deliveryAddress
              }
            />

            <OrderDeliveryChat orderId={activeMapOrder.id} />
          </div>
        )}
      </Modal>
    </OperationsLayout>
  );
}
