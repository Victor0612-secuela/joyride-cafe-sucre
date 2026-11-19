import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckSquare, ChefHat, PackageCheck, Play, Printer, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrderStream } from '../../hooks/useOrderStream';
import { api, getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { ChecklistItem, Order } from '../../types';
import { OperationsLayout } from '../../components/layout/OperationsLayout';
import { Modal } from '../../components/ui/Modal';
import { OrderTableSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function PackerPanel() {
  useDocumentTitle('Cocina, Bar & Empaque — Joy Ride Café® Sucre');
  useOrderStream({ enabled: true });

  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [packNotes, setPackNotes] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [labelPreview, setLabelPreview] = useState<{
    orderCode: string;
    packageLabelCode: string;
    sealCode: string;
  } | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['packer', 'orders'],
    queryFn: async () => {
      const res = await api.get<{ orders: Order[] }>('/empaque/orders');
      return res.data.orders;
    },
    refetchInterval: 3500,
  });

  useEffect(() => {
    if (activeOrder?.packaging?.items) {
      setChecklist(activeOrder.packaging.items);
      setPackNotes(activeOrder.packaging.notes || '');
    }
  }, [activeOrder]);

  const handleStartPrep = async (order: Order) => {
    setBusyId(order.id);
    try {
      const res = await api.patch<{ updatedOrder: Order; packaging: Order['packaging'] }>(
        `/empaque/orders/${order.id}/start`
      );
      pushToast('Preparación iniciada', 'info', `${order.orderCode} pasó a Cocina/Bar`);
      await queryClient.invalidateQueries({ queryKey: ['packer'] });
      setActiveOrder({
        ...order,
        status: 'EN_PREPARACION',
        packaging: res.data.packaging,
      });
    } catch (err) {
      pushToast('Error al iniciar', 'error', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!activeOrder) return;
    const nextList = checklist.map((it) =>
      it.id === itemId ? { ...it, checked: !it.checked } : it
    );
    setChecklist(nextList);

    try {
      await api.patch(`/empaque/orders/${activeOrder.id}/checklist`, {
        items: nextList,
        notes: packNotes || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ['packer'] });
    } catch (err) {
      pushToast('Error guardando checklist', 'error', getErrorMessage(err));
    }
  };

  const handleFinishPacking = async () => {
    if (!activeOrder) return;
    setBusyId(activeOrder.id);
    try {
      const res = await api.patch<{
        orderCode: string;
        packageLabelCode: string;
        sealCode: string;
      }>(`/empaque/orders/${activeOrder.id}/finish-packing`, {
        notes: packNotes || undefined,
      });
      pushToast(
        'Empaque sellado y verificado',
        'success',
        `Etiqueta ${res.data.packageLabelCode} lista para repartidor`
      );
      setActiveOrder(null);
      setLabelPreview({
        orderCode: res.data.orderCode,
        packageLabelCode: res.data.packageLabelCode,
        sealCode: res.data.sealCode,
      });
      queryClient.invalidateQueries({ queryKey: ['packer'] });
      queryClient.invalidateQueries({ queryKey: ['delivery'] });
    } catch (err) {
      pushToast('Falta completar verificación', 'error', getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const porPreparar = (orders || []).filter((o) => o.status === 'PAGO_CONFIRMADO');
  const enPreparacion = (orders || []).filter((o) => o.status === 'EN_PREPARACION');
  const empacados = (orders || []).filter((o) => o.status === 'EMPACADO');

  const allChecked = checklist.length > 0 && checklist.every((i) => i.checked);
  const checkedCount = checklist.filter((i) => i.checked).length;

  return (
    <OperationsLayout
      title="Tablero Kanban — Cocina, Bar & Empaque"
      subtitle="Verifica el 100% de cada pedido antes de sellar; al empacar se genera el PIN del cliente"
    >
      {isLoading ? (
        <OrderTableSkeleton rows={5} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Column 1: Por Preparar */}
          <section className="rounded-2xl border border-hairline bg-surface p-4">
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-joycyan" />
                <h2 className="font-display text-sm font-bold text-ink">Por Preparar</h2>
              </div>
              <span className="rounded-full bg-joycyan/15 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-joycyan">
                {porPreparar.length}
              </span>
            </div>

            <div className="space-y-3">
              {porPreparar.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">Sin comandas nuevas</p>
              ) : (
                porPreparar.map((o) => (
                  <div key={o.id} className="rounded-xl border border-hairline bg-obsidian p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-joycyan">{o.orderCode}</span>
                      <span className="font-mono text-[11px] text-muted">
                        {formatDateTime(o.createdAt)}
                      </span>
                    </div>
                    <ul className="mt-2 space-y-1 text-xs text-ink">
                      {o.items.map((it) => (
                        <li key={it.id}>
                          <strong className="font-mono text-joymagenta">{it.quantity}×</strong>{' '}
                          {it.productName}
                        </li>
                      ))}
                    </ul>
                    {o.notes && (
                      <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">
                        Nota: {o.notes}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => handleStartPrep(o)}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-joycyan py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>Tomar Comanda</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Column 2: En Preparación */}
          <section className="rounded-2xl border border-hairline bg-surface p-4">
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-amber-400" />
                <h2 className="font-display text-sm font-bold text-ink">En Preparación</h2>
              </div>
              <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-amber-300">
                {enPreparacion.length}
              </span>
            </div>

            <div className="space-y-3">
              {enPreparacion.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">Ninguno en cocina ahora</p>
              ) : (
                enPreparacion.map((o) => {
                  const totalChk = o.packaging?.items?.length || 0;
                  const doneChk = o.packaging?.items?.filter((i) => i.checked).length || 0;
                  return (
                    <div key={o.id} className="rounded-xl border border-amber-500/35 bg-obsidian p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-joycyan">{o.orderCode}</span>
                        <span className="font-mono text-xs tabular-nums text-amber-300">
                          {doneChk}/{totalChk} ítems
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {o.items.map((it) => (
                          <li key={it.id}>
                            {it.quantity}× {it.productName}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => setActiveOrder(o)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-joymagenta py-2 text-xs font-bold text-white hover:bg-joymagenta-deep"
                      >
                        <CheckSquare className="h-3.5 w-3.5" />
                        <span>Abrir Checklist de Empaque</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Column 3: Empacados */}
          <section className="rounded-2xl border border-hairline bg-surface p-4">
            <div className="mb-4 flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-joymagenta" />
                <h2 className="font-display text-sm font-bold text-ink">Empacados (Listos)</h2>
              </div>
              <span className="rounded-full bg-joymagenta/15 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-pink-300">
                {empacados.length}
              </span>
            </div>

            <div className="space-y-3">
              {empacados.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">Sin paquetes en espera</p>
              ) : (
                empacados.map((o) => (
                  <div key={o.id} className="rounded-xl border border-joymagenta/40 bg-obsidian p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-ink">{o.orderCode}</span>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="mt-2 font-mono text-xs text-joycyan">
                      Etiqueta: {o.delivery?.packageLabelCode || o.packaging?.sealCode}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Destino: {o.delivery?.deliveryAddress || o.deliveryAddress}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setLabelPreview({
                          orderCode: o.orderCode,
                          packageLabelCode: o.delivery?.packageLabelCode || 'JR-PKG',
                          sealCode: o.packaging?.sealCode || 'JR-SEAL',
                        })
                      }
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-hairline bg-elevated py-2 text-xs font-semibold text-ink hover:border-joycyan"
                    >
                      <Printer className="h-3.5 w-3.5 text-joycyan" />
                      <span>Ver Etiqueta Térmica</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* Interactive Checklist Modal */}
      <Modal
        open={Boolean(activeOrder)}
        onClose={() => setActiveOrder(null)}
        title={activeOrder ? `Checklist de Empaque · ${activeOrder.orderCode}` : ''}
        subtitle="Marca el 100% de verificaciones para sellar y generar el PIN de entrega del cliente"
        maxWidthClass="max-w-lg"
      >
        {activeOrder && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-hairline bg-elevated px-4 py-2.5 text-xs">
              <span className="text-muted">Progreso de verificación</span>
              <span className="font-mono font-bold tabular-nums text-joycyan">
                {checkedCount} / {checklist.length} ({checklist.length ? Math.round((checkedCount / checklist.length) * 100) : 0}%)
              </span>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${
                    item.checked
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-ink'
                      : 'border-hairline bg-obsidian text-slate-300 hover:border-white/25'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => handleToggleItem(item.id)}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label htmlFor="pack-notes" className="block text-xs font-semibold text-muted">
                Nota de empaque (opcional)
              </label>
              <input
                id="pack-notes"
                type="text"
                value={packNotes}
                onChange={(e) => setPackNotes(e.target.value)}
                placeholder="Ej. Bebidas separadas en portavasos doble"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <button
              type="button"
              disabled={!allChecked || busyId === activeOrder.id}
              onClick={handleFinishPacking}
              className="w-full rounded-xl bg-joymagenta py-3.5 text-sm font-bold text-white transition-colors hover:bg-joymagenta-deep disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
            >
              {allChecked
                ? 'Sellar Paquete y Generar PIN de Entrega'
                : `Marca los ${checklist.length - checkedCount} ítems restantes para sellar`}
            </button>
          </div>
        )}
      </Modal>

      {/* Thermal Package Label Modal */}
      <Modal
        open={Boolean(labelPreview)}
        onClose={() => setLabelPreview(null)}
        title="Etiqueta Térmica de Empaque"
        maxWidthClass="max-w-sm"
      >
        {labelPreview && (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-dashed border-slate-400 bg-white p-5 text-center text-slate-900">
              <img src="/logo-joyride.png" alt="Joy Ride" className="mx-auto h-14 w-14 rounded-full object-contain" />
              <p className="mt-2 font-display text-base font-extrabold">JOY RIDE CAFÉ® SUCRE</p>
              <p className="text-[11px] text-slate-600">Calle Nicolás Ortiz N° 14</p>
              <div className="my-3 border-y border-slate-300 py-2 font-mono">
                <p className="text-xs text-slate-500">ORDEN / ETIQUETA</p>
                <p className="text-lg font-extrabold">{labelPreview.orderCode}</p>
                <p className="text-xs font-bold text-sky-700">{labelPreview.packageLabelCode}</p>
              </div>
              <p className="font-mono text-[11px] text-slate-600">
                SELLO DE SEGURIDAD: {labelPreview.sealCode}
              </p>
              <p className="mt-2 text-[10px] font-bold uppercase text-pink-600">
                Entrega protegida con PIN de 4 dígitos
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLabelPreview(null)}
              className="w-full rounded-xl bg-joycyan py-2.5 text-sm font-bold text-obsidian"
            >
              Cerrar Vista Previa
            </button>
          </div>
        )}
      </Modal>
    </OperationsLayout>
  );
}
