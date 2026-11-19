import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Landmark,
  QrCode,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { formatDualPrice } from '../../lib/format';
import { useOrderStream } from '../../hooks/useOrderStream';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { ModalDetailSkeleton } from '../ui/Skeleton';

export interface QrSessionData {
  orderId: string;
  orderCode: string;
  totalBs: number;
  totalUsd: number;
  expiresAt: string;
  qrToken: string;
  qrPayUrl: string;
  qrPayload: string;
  bankInfo: {
    bankName: string;
    secondaryBank: string;
    accountNumber: string;
    accountHolder: string;
    qrValidUntil?: string;
    realQrImageUrl?: string;
    nit: string;
  };
}

interface QrLivePaymentModalProps {
  session: QrSessionData | null;
  onClose: () => void;
  onConfirmed: (orderId: string) => void;
}

export function QrLivePaymentModal({ session, onClose, onConfirmed }: QrLivePaymentModalProps) {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [qrTab, setQrTab] = useState<'REAL_BNB' | 'LIVE_SIM'>('REAL_BNB');
  const [confirmingReal, setConfirmingReal] = useState(false);
  const confirmedOrderIdRef = useRef<string | null>(null);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  useOrderStream({
    orderId: session?.orderId,
    enabled: Boolean(session),
  });

  // Live AJAX Polling every 2.5s
  const { data: liveInfo, isLoading, refetch } = useQuery({
    queryKey: ['qr-live', session?.qrToken],
    queryFn: async () => {
      const res = await api.get<{
        paymentStatus: string;
        orderStatus: string;
        amountBs: number;
        expiresAt: string;
      }>(`/payments/qr/info/${session!.qrToken}`);
      return res.data;
    },
    enabled: Boolean(session?.qrToken),
    refetchInterval: (query) => {
      const status = query.state.data?.paymentStatus;
      if (status === 'COMPLETADO' || status === 'EXPIRADO') return false;
      return 2500;
    },
  });

  useEffect(() => {
    if (!session?.expiresAt) return;
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    updateTimer();
    const id = setInterval(updateTimer, 1000);
    return () => clearInterval(id);
  }, [session?.expiresAt]);

  useEffect(() => {
    if (
      liveInfo?.paymentStatus === 'COMPLETADO' &&
      session &&
      confirmedOrderIdRef.current !== session.orderId
    ) {
      confirmedOrderIdRef.current = session.orderId;
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      pushToast(
        '¡Pago QR confirmado al instante!',
        'success',
        `Pedido ${session.orderCode} enviado a Cocina/Bar`
      );
      const timer = setTimeout(() => {
        onConfirmedRef.current(session.orderId);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [liveInfo?.paymentStatus, session?.orderId, session?.orderCode, queryClient, pushToast]);

  if (!session) return null;

  const isPaid = liveInfo?.paymentStatus === 'COMPLETADO';
  const isExpired = liveInfo?.paymentStatus === 'EXPIRADO' || secondsLeft === 0;
  const dual = formatDualPrice(session.totalBs);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  const localGatewayPath = `/pagar-qr/${session.qrToken}`;
  const realQrSrc = session.bankInfo.realQrImageUrl || '/assets/brand/qr-bnb-cropped.png';

  const copyValue = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const handleConfirmRealBnb = async () => {
    setConfirmingReal(true);
    try {
      await api.post(`/payments/qr/confirm/${session.qrToken}`);
      await refetch();
    } catch (err) {
      pushToast('No se pudo confirmar', 'error', getErrorMessage(err));
    } finally {
      setConfirmingReal(false);
    }
  };

  return (
    <Modal
      open={Boolean(session)}
      onClose={onClose}
      title={`Pago QR Instantáneo · ${session.orderCode}`}
      subtitle="Paga con el QR Real BNB o usa el QR verificable en vivo"
      maxWidthClass="max-w-lg"
    >
      {isLoading ? (
        <ModalDetailSkeleton />
      ) : isPaid ? (
        <div className="flex flex-col items-center py-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h4 className="mt-4 font-display text-2xl font-extrabold text-ink">
            ¡Pago Confirmado!
          </h4>
          <p className="mt-2 max-w-sm text-sm text-muted">
            Tu orden <span className="font-mono font-bold text-joycyan">{session.orderCode}</span>{' '}
            pasó automáticamente a Cocina &amp; Bar y enviamos el recibo de confirmación a tu correo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Amount & Countdown */}
          <div className="flex items-center justify-between rounded-xl border border-hairline bg-elevated px-4 py-3">
            <div>
              <p className="text-xs text-muted">Monto exacto a transferir</p>
              <p className="font-mono text-2xl font-bold tabular-nums text-ink">{dual.bs}</p>
              <p className="font-mono text-xs tabular-nums text-muted">{dual.usd}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1 text-xs text-muted">
                <Clock className="h-3.5 w-3.5 text-joymagenta" />
                Reserva de stock
              </p>
              <p
                className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                  isExpired ? 'text-rose-400' : 'text-joymagenta'
                }`}
              >
                {isExpired ? 'EXPIRADO' : `${mm}:${ss}`}
              </p>
            </div>
          </div>

          {/* QR Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-hairline bg-obsidian p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setQrTab('REAL_BNB')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                qrTab === 'REAL_BNB' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
              }`}
            >
              <Landmark className="h-3.5 w-3.5" />
              <span>QR Real BNB (Oficial)</span>
            </button>
            <button
              type="button"
              onClick={() => setQrTab('LIVE_SIM')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-colors ${
                qrTab === 'LIVE_SIM' ? 'bg-joymagenta text-white' : 'text-muted hover:text-ink'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Dinámico en Vivo</span>
            </button>
          </div>

          {qrTab === 'REAL_BNB' ? (
            <div className="flex flex-col items-center rounded-2xl border border-joycyan/35 bg-obsidian p-4 text-center">
              <p className="text-xs font-semibold text-joycyan">
                Escanea desde tu app bancaria en Bolivia (BNB / Simple QR)
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl bg-white p-3 shadow-card">
                <img
                  src={realQrSrc}
                  alt="QR Real BNB Joy Ride Café Sucre"
                  className="h-60 w-60 object-contain sm:h-64 sm:w-64"
                />
              </div>
              <div className="mt-3 w-full rounded-xl border border-hairline bg-surface p-3 text-left text-xs">
                <p className="font-semibold text-ink">
                  Titular: {session.bankInfo.accountHolder || 'Villarroel Molina Victor Manuel'}
                </p>
                <p className="text-muted">
                  Banco: {session.bankInfo.bankName} · Válido hasta{' '}
                  {session.bankInfo.qrValidUntil || '26 de septiembre de 2027'}
                </p>
                <p className="mt-1 font-mono text-joycyan">
                  Glosa / Ref: {session.orderCode} · Monto: {dual.bs}
                </p>
              </div>

              <button
                type="button"
                disabled={confirmingReal || isExpired}
                onClick={handleConfirmRealBnb}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-obsidian transition-colors hover:bg-emerald-400 active:scale-[0.96] disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {confirmingReal
                    ? 'Acreditando pago…'
                    : 'Ya transferí por QR BNB — Confirmar Pedido'}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-joymagenta/35 bg-obsidian p-5">
              <div className="flex items-center gap-2.5 pb-3">
                <img src="/logo-joyride.png" alt="Joy Ride" className="h-8 w-8 rounded-full" />
                <div className="text-left">
                  <p className="font-display text-sm font-bold text-ink">JOY RIDE CAFÉ® SUCRE</p>
                  <p className="text-[11px] text-joycyan">Simple QR Verificable en Vivo</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-card">
                <QRCodeSVG
                  value={session.qrPayload}
                  size={200}
                  level="M"
                  includeMargin={false}
                  fgColor="#0B0D12"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-full border border-joycyan/30 bg-joycyan/10 px-3.5 py-1.5 text-xs font-medium text-sky-300">
                <Sparkles className="h-3.5 w-3.5 text-joycyan" />
                <span>Esperando confirmación bancaria en tiempo real…</span>
              </div>

              <a
                href={localGatewayPath}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-joymagenta px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-joymagenta-deep active:scale-[0.96]"
              >
                <Smartphone className="h-4 w-4" />
                <span>Abrir Pasarela de Pago Móvil</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Copyable Reference */}
          <div className="flex items-center justify-between rounded-xl border border-hairline bg-elevated px-4 py-2.5 text-xs">
            <span className="font-mono text-muted">Ref: {session.orderCode}</span>
            <button
              type="button"
              onClick={() => copyValue('code', session.orderCode)}
              className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2.5 py-1 text-ink hover:border-joycyan"
            >
              {copiedKey === 'code' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedKey === 'code' ? 'Copiado' : 'Copiar código'}</span>
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
