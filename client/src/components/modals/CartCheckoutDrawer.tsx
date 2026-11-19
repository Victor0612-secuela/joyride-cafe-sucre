import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import {
  Bike,
  CheckCircle2,
  CreditCard,
  Crosshair,
  Minus,
  Plus,
  QrCode,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useI18n } from '../../context/I18nContext';
import { useToast } from '../../context/ToastContext';
import { api, getErrorMessage } from '../../lib/api';
import { SUCRE_DELIVERY_ZONES } from '../../lib/constants';
import { EXCHANGE_RATE } from '../../lib/format';
import { joySound } from '../../lib/sound';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import { QrSessionData } from './QrLivePaymentModal';

interface CartCheckoutDrawerProps {
  onQrStarted: (session: QrSessionData) => void;
  onOrderCreated: (orderId: string) => void;
}

interface PayPalConfig {
  configured: boolean;
  clientId: string | null;
  currency: string;
  mode: string;
  exchangeRate: number;
  expressSandboxReady?: boolean;
}

export function CartCheckoutDrawer({ onQrStarted, onOrderCreated }: CartCheckoutDrawerProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const {
    items,
    drawerOpen,
    setDrawerOpen,
    subtotalBs,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'RECOGER_LOCAL'>('DELIVERY');
  const [selectedZoneId, setSelectedZoneId] = useState(SUCRE_DELIVERY_ZONES[0].id);
  const [customCoords, setCustomCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(SUCRE_DELIVERY_ZONES[0].addressSample);
  const [deliveryReference, setDeliveryReference] = useState('');
  const [phoneContact, setPhoneContact] = useState(user?.phone || '+591 71123456');
  const [notes, setNotes] = useState('');
  const [splitCount, setSplitCount] = useState(1);

  const [paymentMethod, setPaymentMethod] = useState<'QR' | 'DEPOSITO_BANCARIO' | 'PAYPAL'>('QR');
  const [bankName, setBankName] = useState('Banco Nacional de Bolivia (BNB)');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [comprobanteBase64, setComprobanteBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig | null>(null);
  const [activePayPalOrderId, setActivePayPalOrderId] = useState<string | null>(null);
  const [paypalSandboxOrder, setPaypalSandboxOrder] = useState<{
    paypalOrderId: string;
    orderId: string;
    orderCode: string;
  } | null>(null);
  const [paypalBusy, setPaypalBusy] = useState(false);

  useEffect(() => {
    if (user?.phone) setPhoneContact(user.phone);
  }, [user?.phone]);

  useEffect(() => {
    if (!drawerOpen) {
      setPaypalSandboxOrder(null);
      return;
    }
    api
      .get<PayPalConfig>('/payments/paypal/config')
      .then((res) => setPaypalConfig(res.data))
      .catch(() =>
        setPaypalConfig({
          configured: false,
          clientId: null,
          currency: 'USD',
          mode: 'sandbox_express',
          exchangeRate: EXCHANGE_RATE,
          expressSandboxReady: true,
        })
      );
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, setDrawerOpen]);

  const deliveryFeeBs = items.length > 0 && deliveryType === 'DELIVERY' ? 8 : 0;
  const totalBs = Number((subtotalBs + deliveryFeeBs).toFixed(2));
  const totalUsd = Number((totalBs / EXCHANGE_RATE).toFixed(2));
  const perPersonBs = Number((totalBs / Math.max(1, splitCount)).toFixed(2));

  const selectedZone =
    SUCRE_DELIVERY_ZONES.find((z) => z.id === selectedZoneId) || SUCRE_DELIVERY_ZONES[0];

  const buildOrderPayload = () => ({
    items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    deliveryType,
    deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
    deliveryReference: deliveryReference || undefined,
    destLat: deliveryType === 'DELIVERY' ? (customCoords?.lat ?? selectedZone.lat) : -19.04804,
    destLng: deliveryType === 'DELIVERY' ? (customCoords?.lng ?? selectedZone.lng) : -65.25973,
    phoneContact,
    notes: notes || undefined,
    splitCount,
  });

  const requireAuthenticatedUser = () => {
    if (!user) {
      pushToast(
        t('Inicia sesión para confirmar tu pedido', 'Sign in to confirm your order'),
        'info',
        t(
          'Ingresa con tu cuenta o regístrate en segundos para seguir tu delivery',
          'Log in or create an account in seconds to track your order'
        )
      );
      setDrawerOpen(false);
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleUseMyGps = () => {
    joySound.click();
    setLocatingGps(true);
    if (!navigator.geolocation) {
      setCustomCoords({ lat: -19.0459, lng: -65.2607 });
      setDeliveryAddress('Zona Estudiantes / Centro Histórico, Sucre');
      setLocatingGps(false);
      pushToast(
        t('Ubicación referencial en Sucre aplicada', 'Reference Sucre location applied'),
        'info'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCustomCoords({ lat, lng });

        try {
          const revRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { signal: AbortSignal.timeout(5000) }
          );
          const geo = await revRes.json();
          const addr = geo?.address;
          const composed = [
            [addr?.road, addr?.house_number].filter(Boolean).join(' '),
            addr?.suburb || addr?.neighbourhood || addr?.city_district || addr?.city,
          ]
            .filter(Boolean)
            .join(', ');
          if (composed) {
            setDeliveryAddress(composed);
          } else if (geo?.display_name) {
            setDeliveryAddress(String(geo.display_name).split(',').slice(0, 3).join(','));
          } else {
            setDeliveryAddress(`Pin GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · Sucre`);
          }
        } catch {
          setDeliveryAddress(`Pin GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) · Sucre`);
        } finally {
          setLocatingGps(false);
          pushToast(
            t('Ubicación GPS capturada', 'GPS location captured'),
            'success',
            t('Dirección ajustada para el repartidor', 'Address updated for your rider')
          );
        }
      },
      () => {
        setCustomCoords({ lat: -19.0459, lng: -65.2607 });
        setLocatingGps(false);
        pushToast(
          t('Usando zona referencial del Centro', 'Using Downtown reference zone'),
          'info',
          t('Ajusta el texto si deseas más detalle para el rider', 'Refine the street details below if needed')
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      pushToast('Archivo muy pesado', 'error', 'El comprobante debe pesar menos de 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setComprobanteBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseDemoReceipt = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="240"><rect width="480" height="240" rx="14" fill="#F8FAFC"/><rect width="480" height="52" fill="#004B87"/><text x="20" y="33" fill="#FFF" font-family="Arial" font-size="16" font-weight="bold">COMPROBANTE TRANSFERENCIA QR/BNB</text><text x="20" y="95" fill="#0F172A" font-family="monospace" font-size="14">NRO OPERACION: ${referenceNumber || 'BNB-' + Math.floor(100000 + Math.random() * 900000)}</text><text x="20" y="130" fill="#0F172A" font-family="monospace" font-size="14">DESTINO: JOY RIDE CAFE SUCRE</text><text x="20" y="175" fill="#0082B8" font-family="Arial" font-size="22" font-weight="bold">MONTO: Bs. ${totalBs.toFixed(2)}</text></svg>`;
    setComprobanteBase64(`data:image/svg+xml;base64,${btoa(svg)}`);
    if (!referenceNumber) setReferenceNumber(`BNB-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handlePayPalExpressCreate = async () => {
    if (!requireAuthenticatedUser() || items.length === 0) return;
    setPaypalBusy(true);
    joySound.click();
    try {
      const res = await api.post<{
        paypalOrderId: string;
        orderId: string;
        orderCode: string;
      }>('/payments/paypal/create-order', buildOrderPayload());
      setPaypalSandboxOrder(res.data);
    } catch (err) {
      pushToast('No se pudo iniciar PayPal Express', 'error', getErrorMessage(err));
    } finally {
      setPaypalBusy(false);
    }
  };

  const handlePayPalExpressCapture = async () => {
    if (!paypalSandboxOrder) return;
    setPaypalBusy(true);
    try {
      const res = await api.post<{ orderId: string; orderCode: string }>(
        '/payments/paypal/capture-order',
        {
          paypalOrderId: paypalSandboxOrder.paypalOrderId,
          orderId: paypalSandboxOrder.orderId,
        }
      );
      joySound.success();
      setPaypalSandboxOrder(null);
      clearCart();
      setDrawerOpen(false);
      pushToast(
        t('Pago PayPal confirmado', 'PayPal payment confirmed'),
        'success',
        `${res.data.orderCode} · ${t('Enviado directo a cocina', 'Sent straight to kitchen')}`
      );
      onOrderCreated(res.data.orderId);
    } catch (err) {
      pushToast('Error confirmando PayPal', 'error', getErrorMessage(err));
    } finally {
      setPaypalBusy(false);
    }
  };

  const handlePayPalExpressCancel = async () => {
    if (!paypalSandboxOrder) return;
    setPaypalBusy(true);
    try {
      await api.post(`/payments/paypal/cancel-order/${paypalSandboxOrder.orderId}`);
      setPaypalSandboxOrder(null);
      pushToast(t('Pago cancelado', 'Payment canceled'), 'info', t('Pedido liberado', 'Reservation released'));
    } catch (err) {
      pushToast('No se pudo cancelar', 'error', getErrorMessage(err));
    } finally {
      setPaypalBusy(false);
    }
  };

  const handleSubmitCheckout = async () => {
    if (!requireAuthenticatedUser() || items.length === 0) return;

    setSubmitting(true);
    try {
      if (paymentMethod === 'QR') {
        const res = await api.post<QrSessionData>('/payments/qr/initiate', buildOrderPayload());
        clearCart();
        setDrawerOpen(false);
        onQrStarted(res.data);
      } else if (paymentMethod === 'DEPOSITO_BANCARIO') {
        if (!referenceNumber.trim() || !comprobanteBase64) {
          pushToast('Faltan datos del depósito', 'error', 'Ingresa el N° de operación y sube el comprobante');
          setSubmitting(false);
          return;
        }
        const res = await api.post<{ orderId: string; orderCode: string }>('/payments/deposit/submit', {
          ...buildOrderPayload(),
          bankName,
          referenceNumber,
          comprobanteBase64,
        });
        clearCart();
        setDrawerOpen(false);
        pushToast(
          'Comprobante enviado a Caja',
          'success',
          `Pedido ${res.data.orderCode} en revisión por el cajero`
        );
        onOrderCreated(res.data.orderId);
      }
    } catch (err) {
      pushToast('Error al procesar pedido', 'error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Tu Pedido">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-xl"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.42, bounce: 0 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-hairline bg-surface shadow-elevated"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-joycyan" />
                <div>
                  <h2 className="font-display text-lg font-extrabold text-ink">
                    {t('Tu Pedido Joy Ride', 'Your Joy Ride Order')}
                  </h2>
                  <p className="text-xs text-muted">
                    {t('Confirmación inmediata con cocina y barra', 'Instant kitchen & bar dispatch')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Cerrar carrito"
                className="rounded-lg border border-hairline bg-elevated p-2 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overscroll-contain flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-hairline bg-obsidian p-8 text-center">
                  <ShoppingBag className="mx-auto h-10 w-10 text-muted" />
                  <p className="mt-3 font-display text-lg font-bold text-ink">
                    Tu ronda está vacía
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Agrega un Super Pique a lo Macho, una Mountain Burger o unos Chuflays desde la carta.
                  </p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-3 rounded-xl border border-hairline bg-obsidian p-3"
                      >
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="photo-frame h-14 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{item.product.name}</p>
                          <AnimatedPrice
                            bs={item.product.precioBs * item.quantity}
                            className="font-mono text-xs text-joycyan"
                          />
                        </div>

                        <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface p-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              joySound.click();
                              updateQuantity(item.product.id, item.quantity - 1);
                            }}
                            aria-label="Restar"
                            className="rounded p-1.5 text-ink hover:bg-elevated"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center font-mono text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={item.quantity >= item.product.stockDisponible}
                            onClick={() => {
                              joySound.click();
                              updateQuantity(item.product.id, item.quantity + 1);
                            }}
                            aria-label="Sumar"
                            className="rounded p-1.5 text-ink hover:bg-elevated disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          aria-label="Eliminar producto"
                          className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Delivery Mode */}
                  <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      Modalidad de Entrega
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('DELIVERY')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                          deliveryType === 'DELIVERY'
                            ? 'border-joycyan bg-joycyan/15 text-joycyan'
                            : 'border-hairline bg-surface text-muted'
                        }`}
                      >
                        <Bike className="h-4 w-4" />
                        <span>Delivery Sucre (+Bs. 8)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('RECOGER_LOCAL')}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-colors ${
                          deliveryType === 'RECOGER_LOCAL'
                            ? 'border-joycyan bg-joycyan/15 text-joycyan'
                            : 'border-hairline bg-surface text-muted'
                        }`}
                      >
                        <Store className="h-4 w-4" />
                        <span>Recoger en Local</span>
                      </button>
                    </div>

                    {deliveryType === 'DELIVERY' && (
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label htmlFor="del-zone" className="block text-xs font-semibold text-muted">
                            {t('Zona en Sucre (para ruta en mapa)', 'Sucre Zone (for delivery route)')}
                          </label>
                          <button
                            type="button"
                            disabled={locatingGps}
                            onClick={handleUseMyGps}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-60"
                          >
                            <Crosshair className="h-3.5 w-3.5" />
                            <span>
                              {locatingGps
                                ? t('Localizando…', 'Locating…')
                                : t('Usar mi Ubicación GPS', 'Use my GPS Location')}
                            </span>
                          </button>
                        </div>
                        <div>
                          <select
                            id="del-zone"
                            value={selectedZoneId}
                            onChange={(e) => {
                              const z = SUCRE_DELIVERY_ZONES.find((item) => item.id === e.target.value);
                              setSelectedZoneId(e.target.value);
                              setCustomCoords(null);
                              if (z) setDeliveryAddress(z.addressSample);
                            }}
                            className="w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink focus:border-joycyan focus:outline-none sm:text-sm"
                          >
                            {SUCRE_DELIVERY_ZONES.map((z) => (
                              <option key={z.id} value={z.id}>
                                {z.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="del-addr" className="block text-xs font-semibold text-muted">
                            Dirección exacta en Sucre
                          </label>
                          <input
                            id="del-addr"
                            type="text"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink focus:border-joycyan focus:outline-none sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="del-ref" className="block text-[11px] font-semibold text-muted">
                            Referencia (opcional)
                          </label>
                          <input
                            id="del-ref"
                            type="text"
                            value={deliveryReference}
                            onChange={(e) => setDeliveryReference(e.target.value)}
                            placeholder="Ej. Portón café frente a la facultad"
                            className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none sm:text-sm"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="del-phone" className="block text-[11px] font-semibold text-muted">
                          WhatsApp / Celular
                        </label>
                        <input
                          id="del-phone"
                          type="tel"
                          value={phoneContact}
                          onChange={(e) => setPhoneContact(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink focus:border-joycyan focus:outline-none sm:text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="del-notes" className="block text-[11px] font-semibold text-muted">
                          Notas de cocina/barra
                        </label>
                        <input
                          id="del-notes"
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej. Llajwa aparte"
                          className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Creative Split-Bill Calculator */}
                  <div className="rounded-2xl border border-joycyan/30 bg-joycyan/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-joycyan" />
                        <span className="text-xs font-bold text-ink">
                          Dividir la Ronda (Split-Bill)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSplitCount((n) => Math.max(1, n - 1))}
                          className="rounded-md border border-hairline bg-surface px-2 py-0.5 text-xs font-bold text-ink"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold tabular-nums text-joycyan">
                          {splitCount} {splitCount === 1 ? 'persona' : 'amigos'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSplitCount((n) => Math.min(8, n + 1))}
                          className="rounded-md border border-hairline bg-surface px-2 py-0.5 text-xs font-bold text-ink"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    {splitCount > 1 && (
                      <p className="mt-2 font-mono text-xs text-sky-200">
                        {t('Cuota por amigo:', 'Share per person:')}{' '}
                        <strong>
                          <AnimatedPrice bs={perPersonBs} />
                        </strong>{' '}
                        (<AnimatedPrice bs={perPersonBs} reverse className="text-muted" />)
                      </p>
                    )}
                  </div>

                  {/* 3 Payment Methods */}
                  <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted">
                      {t('Método de Pago', 'Payment Method')}
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'QR' as const, label: 'Simple QR', icon: <QrCode className="h-4 w-4" /> },
                        { id: 'DEPOSITO_BANCARIO' as const, label: t('Depósito', 'Deposit'), icon: <Receipt className="h-4 w-4" /> },
                        { id: 'PAYPAL' as const, label: 'PayPal', icon: <CreditCard className="h-4 w-4" /> },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            joySound.click();
                            setPaymentMethod(m.id);
                          }}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-colors ${
                            paymentMethod === m.id
                              ? 'border-joymagenta bg-joymagenta/15 text-pink-200'
                              : 'border-hairline bg-surface text-muted hover:text-ink'
                          }`}
                        >
                          {m.icon}
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'QR' && (
                      <p className="text-xs leading-relaxed text-slate-300">
                        {t(
                          'Se genera un código QR BNB único válido por 15 minutos. Al confirmar la transferencia, tu pedido pasa directo a Cocina & Bar.',
                          'Generates a unique BNB QR valid for 15 minutes. Once confirmed, your order moves straight to Kitchen & Bar.'
                        )}
                      </p>
                    )}

                    {paymentMethod === 'DEPOSITO_BANCARIO' && (
                      <div className="space-y-3 pt-1">
                        <div className="rounded-xl border border-hairline bg-surface p-3 text-xs text-muted">
                          <p className="font-semibold text-ink">BNB Cuenta 1000-294810-44</p>
                          <p>Titular: Villarroel Molina Victor Manuel · JOY RIDE CAFÉ SUCRE</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div>
                            <label htmlFor="dep-bank" className="block text-[11px] text-muted">
                              Banco Origen
                            </label>
                            <select
                              id="dep-bank"
                              value={bankName}
                              onChange={(e) => setBankName(e.target.value)}
                              className="mt-1 w-full rounded-xl border border-hairline bg-surface px-2.5 py-2 text-base text-ink sm:text-xs"
                            >
                              <option>Banco Nacional de Bolivia (BNB)</option>
                              <option>Banco Unión S.A.</option>
                              <option>Banco Bisa</option>
                              <option>Banco Mercantil Santa Cruz</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="dep-ref" className="block text-[11px] text-muted">
                              N° Operación / Comprobante
                            </label>
                            <input
                              id="dep-ref"
                              type="text"
                              value={referenceNumber}
                              onChange={(e) => setReferenceNumber(e.target.value)}
                              placeholder="Ej. BNB-849201"
                              className="mt-1 w-full rounded-xl border border-hairline bg-surface px-2.5 py-2 text-base text-ink sm:text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 py-2 text-xs font-semibold text-ink hover:border-joycyan">
                            <Upload className="h-3.5 w-3.5 text-joycyan" />
                            <span>Subir Captura</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptFile}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleUseDemoReceipt}
                            className="rounded-xl border border-joycyan/40 bg-joycyan/10 px-3 py-2 text-xs font-semibold text-joycyan hover:bg-joycyan/20"
                          >
                            {t('Adjuntar Voucher Referencial', 'Attach Sample Voucher')}
                          </button>
                        </div>

                        {comprobanteBase64 && (
                          <img
                            src={comprobanteBase64}
                            alt="Vista previa del comprobante bancario"
                            className="photo-frame max-h-36 w-full rounded-xl object-contain bg-white p-1"
                          />
                        )}
                      </div>
                    )}

                    {paymentMethod === 'PAYPAL' && (
                      <div className="space-y-3 pt-1">
                        {paypalConfig?.configured && paypalConfig.clientId ? (
                          user ? (
                            <PayPalScriptProvider
                              options={{ clientId: paypalConfig.clientId, currency: 'USD', intent: 'capture' }}
                            >
                              <PayPalButtons
                                style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay' }}
                                createOrder={async () => {
                                  const res = await api.post<{ paypalOrderId: string; orderId: string }>(
                                    '/payments/paypal/create-order',
                                    buildOrderPayload()
                                  );
                                  setActivePayPalOrderId(res.data.orderId);
                                  return res.data.paypalOrderId;
                                }}
                                onApprove={async (data) => {
                                  const res = await api.post<{ orderId: string; orderCode: string }>(
                                    '/payments/paypal/capture-order',
                                    {
                                      paypalOrderId: data.orderID,
                                      orderId: activePayPalOrderId,
                                    }
                                  );
                                  joySound.success();
                                  clearCart();
                                  setDrawerOpen(false);
                                  pushToast('PayPal capturado con éxito', 'success', `Pedido ${res.data.orderCode}`);
                                  onOrderCreated(res.data.orderId);
                                }}
                                onCancel={async () => {
                                  if (activePayPalOrderId) {
                                    await api.post(`/payments/paypal/cancel-order/${activePayPalOrderId}`);
                                  }
                                  pushToast('Pago PayPal cancelado', 'info', 'Reserva liberada automáticamente');
                                }}
                              />
                            </PayPalScriptProvider>
                          ) : (
                            <button
                              type="button"
                              onClick={requireAuthenticatedUser}
                              className="w-full rounded-xl bg-joycyan py-3 text-xs font-bold text-obsidian"
                            >
                              {t(
                                `Inicia sesión para pagar con PayPal ($${totalUsd.toFixed(2)} USD)`,
                                `Sign in to pay with PayPal ($${totalUsd.toFixed(2)} USD)`
                              )}
                            </button>
                          )
                        ) : !user ? (
                          <button
                            type="button"
                            onClick={requireAuthenticatedUser}
                            className="w-full rounded-xl bg-[#0070BA] py-3 text-xs font-bold text-white hover:bg-[#005EA6]"
                          >
                            {t(
                              `Inicia sesión para pagar con PayPal ($${totalUsd.toFixed(2)} USD)`,
                              `Sign in to pay with PayPal ($${totalUsd.toFixed(2)} USD)`
                            )}
                          </button>
                        ) : !paypalSandboxOrder ? (
                          <div className="space-y-2.5 rounded-xl border border-[#0070BA]/50 bg-surface p-4">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-ink">PayPal Express Checkout</span>
                              <span className="font-mono font-bold text-joycyan">
                                ${totalUsd.toFixed(2)} USD
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-muted">
                              {t(
                                'Cargo protegido en USD (equivale a Bs. ' +
                                  totalBs.toFixed(2) +
                                  '). Confirmación automática directa a Cocina y Bar.',
                                'Protected USD checkout (approx. Bs. ' +
                                  totalBs.toFixed(2) +
                                  '). Instant confirmation straight to Kitchen & Bar.'
                              )}
                            </p>
                            <button
                              type="button"
                              disabled={paypalBusy}
                              onClick={handlePayPalExpressCreate}
                              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0070BA] px-4 py-3 text-sm font-extrabold text-white transition-colors hover:bg-[#005EA6] disabled:opacity-60"
                            >
                              <CreditCard className="h-4 w-4" />
                              <span>
                                {paypalBusy
                                  ? t('Conectando con PayPal…', 'Connecting to PayPal…')
                                  : `PayPal Express · $${totalUsd.toFixed(2)} USD`}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 rounded-xl border border-emerald-400/50 bg-surface p-4">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                <ShieldCheck className="h-4 w-4" />
                                PayPal Express Ready
                              </span>
                              <span className="font-mono text-xs text-joycyan">
                                {paypalSandboxOrder.orderCode}
                              </span>
                            </div>
                            <div className="rounded-lg border border-hairline bg-obsidian p-3 text-xs">
                              <p className="text-muted">Cuenta: {user.email}</p>
                              <p className="mt-1 font-mono text-base font-extrabold text-ink">
                                ${totalUsd.toFixed(2)} USD{' '}
                                <span className="text-xs font-normal text-muted">
                                  (Bs. {totalBs.toFixed(2)})
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <button
                                type="button"
                                disabled={paypalBusy}
                                onClick={handlePayPalExpressCapture}
                                className="flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#FFC439] px-4 py-2 text-xs font-extrabold text-slate-900 hover:bg-[#F5BA2E] disabled:opacity-60"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>
                                  {paypalBusy
                                    ? t('Procesando pago…', 'Processing…')
                                    : t('Autorizar & Pagar Ahora', 'Authorize & Pay Now')}
                                </span>
                              </button>
                              <button
                                type="button"
                                disabled={paypalBusy}
                                onClick={handlePayPalExpressCancel}
                                className="rounded-xl border border-hairline bg-elevated px-3 py-2 text-xs font-semibold text-muted hover:text-ink"
                              >
                                {t('Cancelar', 'Cancel')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Totals & Submit */}
            {items.length > 0 && (
              <div className="border-t border-hairline bg-obsidian px-5 py-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>{t('Subtotal productos', 'Items subtotal')}</span>
                    <AnimatedPrice bs={subtotalBs} className="font-mono" />
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>{t('Envío Sucre', 'Sucre Delivery')}</span>
                    <span className="font-mono tabular-nums">
                      {deliveryFeeBs === 0 ? t('Gratis (Local)', 'Free (Pickup)') : `Bs. ${deliveryFeeBs.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1.5 text-base font-bold text-ink">
                    <span>Total</span>
                    <div className="text-right">
                      <AnimatedPrice bs={totalBs} className="font-mono text-joycyan" />
                      <AnimatedPrice bs={totalBs} reverse className="ml-2 font-mono text-xs text-muted" />
                    </div>
                  </div>
                </div>

                {paymentMethod !== 'PAYPAL' && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitCheckout}
                    className="mt-4 w-full rounded-xl bg-joymagenta py-3.5 text-sm font-bold text-white transition-colors hover:bg-joymagenta-deep active:scale-[0.96] disabled:opacity-60"
                  >
                    {submitting
                      ? t('Confirmando disponibilidad en cocina…', 'Confirming kitchen availability…')
                      : paymentMethod === 'QR'
                      ? `${t('Generar QR de Pago', 'Generate Payment QR')} · Bs. ${totalBs.toFixed(2)}`
                      : `${t('Enviar Comprobante a Caja', 'Send Receipt to Cashier')} · Bs. ${totalBs.toFixed(2)}`}
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
