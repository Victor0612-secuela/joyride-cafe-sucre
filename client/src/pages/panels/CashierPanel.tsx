import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, Printer, Receipt, ShieldCheck, XCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrderStream } from '../../hooks/useOrderStream';
import { api, getErrorMessage } from '../../lib/api';
import { formatDateTime, formatDualPrice } from '../../lib/format';
import { Order, Payment } from '../../types';
import { OperationsLayout } from '../../components/layout/OperationsLayout';
import { ReceiptPrintModal } from '../../components/modals/ReceiptPrintModal';
import { Modal } from '../../components/ui/Modal';
import { OrderTableSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';

type CashierPaymentRow = Payment & {
  order: Order & {
    user: { id: string; name: string; email: string; phone?: string | null };
  };
};

export function CashierPanel() {
  useDocumentTitle('Panel Cajero — Joy Ride Café® Sucre');
  useOrderStream({ enabled: true });

  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<'EN_REVISION' | 'ALL'>('EN_REVISION');
  const [inspecting, setInspecting] = useState<CashierPaymentRow | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['cashier', 'payments', filterStatus],
    queryFn: async () => {
      const qs = filterStatus === 'EN_REVISION' ? '?status=EN_REVISION' : '';
      const res = await api.get<{ payments: CashierPaymentRow[] }>(`/cajero/payments${qs}`);
      return res.data.payments;
    },
    refetchInterval: 4000,
  });

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!inspecting) return;
    if (decision === 'REJECT' && reviewNotes.trim().length < 4) {
      pushToast('Motivo obligatorio', 'error', 'Explica por qué rechazas el comprobante');
      return;
    }

    setSubmitting(true);
    try {
      await api.patch(`/cajero/payments/${inspecting.id}/review`, {
        decision,
        notes: reviewNotes.trim() || 'Verificado en extracto bancario por Caja',
      });
      pushToast(
        decision === 'APPROVE' ? 'Depósito aprobado' : 'Depósito rechazado',
        decision === 'APPROVE' ? 'success' : 'info',
        decision === 'APPROVE'
          ? `Pedido ${inspecting.order.orderCode} enviado a Cocina/Bar`
          : `Stock del pedido ${inspecting.order.orderCode} restituido automáticamente`
      );
      setInspecting(null);
      setReviewNotes('');
      queryClient.invalidateQueries({ queryKey: ['cashier'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      pushToast('Error al procesar revisión', 'error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OperationsLayout
      title="Caja & Revisión de Depósitos"
      subtitle="Audita comprobantes bancarios, aprueba hacia Cocina o rechaza restituyendo stock"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-hairline bg-surface p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilterStatus('EN_REVISION')}
            className={`rounded-lg px-3.5 py-2 transition-colors ${
              filterStatus === 'EN_REVISION' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
            }`}
          >
            Pendientes de Revisión
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('ALL')}
            className={`rounded-lg px-3.5 py-2 transition-colors ${
              filterStatus === 'ALL' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
            }`}
          >
            Historial Completo
          </button>
        </div>

        <span className="font-mono text-xs tabular-nums text-muted">
          Registros: {payments?.length ?? 0}
        </span>
      </div>

      {isLoading ? (
        <OrderTableSkeleton rows={4} />
      ) : !payments || payments.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-surface p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-display text-lg font-bold text-ink">
            No hay comprobantes pendientes
          </p>
          <p className="mt-1 text-sm text-muted">
            Cuando un cliente envíe un depósito bancario aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((pay) => (
            <div
              key={pay.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-joycyan">
                    {pay.order.orderCode}
                  </span>
                  <StatusBadge status={pay.order.status} />
                  <span className="font-mono text-xs text-muted">
                    Ref: {pay.referenceNumber || 'Sin ref'}
                  </span>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {pay.order.user.name} · {pay.bankName}
                </p>
                <p className="text-xs text-muted">
                  {pay.order.items.map((i) => `${i.quantity}× ${i.productName}`).join(' · ')}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-left font-mono sm:text-right">
                  <p className="text-base font-bold tabular-nums text-ink">
                    {formatDualPrice(pay.amountBs).bs}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {formatDateTime(pay.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pay.status === 'COMPLETADO' && (
                    <button
                      type="button"
                      onClick={() => setReceiptOrder({ ...pay.order, payment: pay } as Order)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-joycyan/40 bg-joycyan/10 px-3 py-2 text-xs font-bold text-joycyan hover:bg-joycyan/20"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Recibo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setInspecting(pay);
                      setReviewNotes(pay.reviewNotes || '');
                    }}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-joycyan px-3.5 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
                  >
                    <Eye className="h-4 w-4" />
                    <span>{pay.status === 'EN_REVISION' ? 'Auditar' : 'Ver Voucher'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspection Modal */}
      <Modal
        open={Boolean(inspecting)}
        onClose={() => setInspecting(null)}
        title={inspecting ? `Inspección de Comprobante · ${inspecting.order.orderCode}` : ''}
        subtitle={inspecting ? `${inspecting.bankName} · Operación ${inspecting.referenceNumber}` : ''}
        maxWidthClass="max-w-xl"
      >
        {inspecting && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-hairline bg-elevated p-3.5">
              <div>
                <p className="text-xs text-muted">Cliente</p>
                <p className="text-sm font-bold text-ink">{inspecting.order.user.name}</p>
                <p className="text-xs text-muted">{inspecting.order.user.email}</p>
              </div>
              <div className="text-right font-mono">
                <p className="text-xl font-extrabold tabular-nums text-joycyan">
                  {formatDualPrice(inspecting.amountBs).bs}
                </p>
                <p className="text-xs tabular-nums text-muted">
                  {formatDualPrice(inspecting.amountBs).usd}
                </p>
              </div>
            </div>

            {inspecting.comprobanteUrl && (
              <div className="overflow-hidden rounded-xl border border-hairline bg-white p-2">
                <img
                  src={inspecting.comprobanteUrl}
                  alt="Comprobante bancario adjunto"
                  className="max-h-72 w-full object-contain"
                />
              </div>
            )}

            {inspecting.status === 'EN_REVISION' ? (
              <div className="space-y-3 border-t border-hairline pt-4">
                <div>
                  <label htmlFor="cashier-notes" className="block text-xs font-semibold text-ink">
                    Observación de Caja (obligatoria si rechazas)
                  </label>
                  <input
                    id="cashier-notes"
                    type="text"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Ej. Transferencia verificada en BNB / Monto no coincide"
                    className="mt-1.5 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDecision('REJECT')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/50 bg-rose-500/15 py-3 text-xs font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rechazar y Liberar Stock</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDecision('APPROVE')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-obsidian hover:bg-emerald-400 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Aprobar y Enviar a Cocina</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline bg-elevated p-3 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-joycyan" />
                  <span>
                    Revisado ({inspecting.status}) · {inspecting.reviewNotes || 'Sin notas'}
                  </span>
                </div>
                {inspecting.status === 'COMPLETADO' && (
                  <button
                    type="button"
                    onClick={() =>
                      setReceiptOrder({ ...inspecting.order, payment: inspecting } as Order)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-joycyan/40 bg-joycyan/10 px-3 py-1.5 font-bold text-joycyan hover:bg-joycyan/20"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Recibo Oficial</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ReceiptPrintModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </OperationsLayout>
  );
}
