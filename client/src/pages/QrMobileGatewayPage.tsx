import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ShieldCheck, Smartphone, Store } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { formatDualPrice } from '../lib/format';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ModalDetailSkeleton } from '../components/ui/Skeleton';

interface QrPublicInfo {
  merchant: string;
  address: string;
  qrToken: string;
  orderId: string;
  orderCode: string;
  customerName: string;
  orderStatus: string;
  paymentStatus: string;
  amountBs: number;
  amountUsd: number;
  expiresAt: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    unitPriceBs: number;
    subtotalBs: number;
  }>;
}

export function QrMobileGatewayPage() {
  const { qrToken } = useParams<{ qrToken: string }>();
  const queryClient = useQueryClient();
  useDocumentTitle('Pasarela Simple QR — Joy Ride Café® Sucre');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['qr-gateway', qrToken],
    queryFn: async () => {
      const res = await api.get<QrPublicInfo>(`/payments/qr/info/${qrToken}`);
      return res.data;
    },
    enabled: Boolean(qrToken),
  });

  const handleConfirm = async () => {
    if (!qrToken) return;
    setConfirmError('');
    setConfirming(true);
    try {
      await api.post(`/payments/qr/confirm/${qrToken}`);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-obsidian px-4 py-8 text-ink">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-hairline bg-surface shadow-elevated">
        {/* Mobile Wallet Header */}
        <div className="border-b border-hairline bg-elevated px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-joyride.png" alt="Joy Ride Café" className="h-12 w-12 rounded-full object-contain" />
              <div>
                <p className="font-display text-sm font-extrabold text-ink">SIMPLE QR BOLIVIA</p>
                <p className="text-xs text-joycyan">Billetera Bancaria Móvil</p>
              </div>
            </div>
            <Smartphone className="h-5 w-5 text-joycyan" />
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {isLoading ? (
            <ModalDetailSkeleton />
          ) : error || !data ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-joymagenta" />
              <h1 className="mt-3 font-display text-xl font-bold text-ink">QR Inválido</h1>
              <p className="mt-1 text-sm text-muted">
                {getErrorMessage(error, 'No se encontró este token de pago.')}
              </p>
              <Link
                to="/"
                className="mt-5 inline-block rounded-xl bg-joycyan px-5 py-2.5 text-sm font-bold text-obsidian"
              >
                Ir a Joy Ride Café®
              </Link>
            </div>
          ) : data.paymentStatus === 'COMPLETADO' ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
                Pago Confirmado
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Transferencia exitosa a <strong className="text-ink">{data.merchant}</strong>
              </p>
              <div className="mt-5 rounded-2xl border border-hairline bg-elevated p-4 text-left text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted">Pedido</span>
                  <span className="font-mono font-bold text-joycyan">{data.orderCode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Monto debitado</span>
                  <span className="font-mono font-bold tabular-nums text-ink">
                    Bs. {data.amountBs.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Estado actual</span>
                  <span className="font-semibold text-emerald-400">EN COCINA / BAR</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">
                La pantalla principal ya recibió la confirmación en vivo. Puedes cerrar esta ventana.
              </p>
            </div>
          ) : data.paymentStatus === 'EXPIRADO' || data.orderStatus === 'CANCELADO' ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
              <h1 className="mt-3 font-display text-xl font-bold text-ink">Código QR Expirado</h1>
              <p className="mt-1 text-sm text-muted">
                La reserva de 15 minutos venció y el stock fue liberado. Genera un nuevo pedido en
                la tienda.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-hairline bg-obsidian p-4">
                <div className="flex items-center gap-2 text-xs text-joycyan">
                  <Store className="h-4 w-4" />
                  <span>Comercio destino verificado</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-ink">{data.merchant}</p>
                <p className="text-xs text-muted">{data.address}</p>

                <div className="mt-4 border-t border-hairline pt-3">
                  <p className="text-xs text-muted">Total a pagar</p>
                  <p className="font-mono text-3xl font-extrabold tabular-nums text-ink">
                    {formatDualPrice(data.amountBs).bs}
                  </p>
                  <p className="font-mono text-xs tabular-nums text-muted">
                    {formatDualPrice(data.amountBs).usd} · Pedido {data.orderCode}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  Resumen del consumo ({data.customerName})
                </p>
                <ul className="space-y-1.5 rounded-xl border border-hairline bg-elevated p-3 text-xs">
                  {data.items.map((it, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-2">
                      <span className="text-ink">
                        <strong className="font-mono text-joycyan">{it.quantity}×</strong>{' '}
                        {it.productName}
                      </span>
                      <span className="font-mono tabular-nums text-muted">
                        Bs. {it.subtotalBs.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {confirmError && (
                <div
                  role="alert"
                  className="rounded-xl border border-joymagenta/50 bg-joymagenta/15 p-3 text-xs text-pink-200"
                >
                  {confirmError}
                </div>
              )}

              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-joymagenta py-4 text-base font-extrabold text-white shadow-elevated transition-colors hover:bg-joymagenta-deep active:scale-[0.96] disabled:opacity-60"
              >
                <ShieldCheck className="h-5 w-5" />
                <span>{confirming ? 'Procesando pago…' : 'Confirmar Pago QR Ahora'}</span>
              </button>

              <p className="text-center text-[11px] text-muted">
                Transacción verificada · {data.bankInfo.bankName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
