import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarDays,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  Info,
  Mail,
  MapPin,
  Package,
  Plus,
  Printer,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useOrderStream } from '../../hooks/useOrderStream';
import { api, getErrorMessage } from '../../lib/api';
import { SUCRE_TOURIST_SPOTS } from '../../lib/constants';
import { formatDateTime, formatDualPrice, ZONE_META } from '../../lib/format';
import {
  AdminAnalytics,
  Category,
  EmailLog,
  JoyRideEvent,
  MapSpotRecord,
  Order,
  Product,
  Promotion,
  Reservation,
  Role,
  User,
} from '../../types';
import { OperationsLayout } from '../../components/layout/OperationsLayout';
import { AdminLocationPicker } from '../../components/maps/AdminLocationPicker';
import { Modal } from '../../components/ui/Modal';
import { OrderTableSkeleton, StatsKpiSkeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { OrderTimelineModal } from '../../components/modals/OrderTimelineModal';
import { ReceiptPrintModal } from '../../components/modals/ReceiptPrintModal';

const MEDIA_PRESETS = [
  '/images/dish-burger.webp',
  '/images/dish-pique-macho.webp',
  '/images/dish-pizza.webp',
  '/images/dish-chuflay.webp',
  '/images/dish-the-hulk.webp',
  '/images/dish-mojito.webp',
  '/images/dish-daiquiri.webp',
  '/images/dish-brownie-2x1.webp',
  '/images/evento-salsa.webp',
  '/images/venue-patio-night.webp',
  '/images/venue-lounge-lights.webp',
  '/images/sucre-rooftop-terraza.webp',
  '/images/sucre-mirador-sunset.webp',
  '/images/sucre-chocolates.webp',
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
    reader.readAsDataURL(file);
  });
}

function AdminMediaPicker({
  label,
  imageUrl,
  uploading,
  onUploadFile,
  onChangeUrl,
  videoUrl,
  onUploadVideo,
  onClearVideo,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  onUploadFile: (file?: File | null) => void;
  onChangeUrl: (url: string) => void;
  videoUrl?: string;
  onUploadVideo?: (file?: File | null) => void;
  onClearVideo?: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-ink">{label}</p>
        <span className="font-mono text-[10px] text-muted">PNG / JPG / WEBP (máx 5 MB)</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <img
          src={imageUrl || '/images/dish-burger.webp'}
          alt="Vista previa multimedia"
          className="photo-frame h-20 w-28 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-joycyan/50 bg-joycyan/15 px-3.5 py-2 text-xs font-bold text-joycyan transition-colors hover:bg-joycyan/25">
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? 'Subiendo archivo…' : 'Subir Foto desde PC / Celular'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploading}
                onChange={(e) => {
                  onUploadFile(e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="sr-only"
              />
            </label>

            {onUploadVideo && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-joymagenta/50 bg-joymagenta/10 px-3.5 py-2 text-xs font-bold text-pink-200 transition-colors hover:bg-joymagenta/20">
                <Film className="h-3.5 w-3.5 text-joymagenta" />
                <span>{uploading ? 'Subiendo…' : 'Video MP4/WEBM (12MB)'}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm"
                  disabled={uploading}
                  onChange={(e) => {
                    onUploadVideo(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          <input
            type="text"
            value={imageUrl}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="/images/... o URL https://..."
            className="w-full rounded-xl border border-hairline bg-surface px-3 py-1.5 font-mono text-xs text-ink"
          />
        </div>
      </div>

      {videoUrl && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs">
          <span className="truncate font-mono text-emerald-300">Video activo: {videoUrl}</span>
          {onClearVideo && (
            <button
              type="button"
              onClick={onClearVideo}
              className="shrink-0 font-semibold text-rose-400 hover:underline"
            >
              Quitar video
            </button>
          )}
        </div>
      )}

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted">
          <ImageIcon className="h-3 w-3 text-joymagenta" />
          <span>O elige rápido de la galería Joy Ride:</span>
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MEDIA_PRESETS.map((presetUrl) => (
            <button
              key={presetUrl}
              type="button"
              onClick={() => onChangeUrl(presetUrl)}
              className={`h-11 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                imageUrl === presetUrl
                  ? 'border-joymagenta ring-2 ring-joymagenta/40'
                  : 'border-hairline opacity-70 hover:opacity-100'
              }`}
            >
              <img src={presetUrl} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StockMovementRow {
  id: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdAt: string;
  product: { name: string; slug: string };
  order?: { orderCode: string } | null;
  actor?: { name: string; role: string } | null;
}

const CHART_COLORS = ['#00A0DF', '#F59E0B', '#F20574', '#8B5CF6'];

export function AdminPanel() {
  useDocumentTitle('Panel Administrador — Joy Ride Café® Sucre');
  useOrderStream({ enabled: true });

  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<
    'analytics' | 'catalog' | 'promos' | 'events' | 'map' | 'orders' | 'users' | 'emails'
  >('analytics');

  // Stock Adjust Modal
  const [stockTarget, setStockTarget] = useState<Product | null>(null);
  const [stockDelta, setStockDelta] = useState(10);
  const [stockReason, setStockReason] = useState('Reposición de cocina/barra');

  // Product Upsert Modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pCatId, setPCatId] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pPrice, setPPrice] = useState('55');
  const [pStock, setPStock] = useState('15');
  const [pMinAlert, setPMinAlert] = useState('5');
  const [pPrepMin, setPPrepMin] = useState('15');
  const [pImage, setPImage] = useState('/images/dish-burger.webp');
  const [pVegan, setPVegan] = useState(false);
  const [pSpicy, setPSpicy] = useState(false);
  const [pFeatured, setPFeatured] = useState(false);
  const [pHappyHour, setPHappyHour] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Emails & Newsletter State
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [campSubject, setCampSubject] = useState('');
  const [campHeadline, setCampHeadline] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campPromo, setCampPromo] = useState('HAPPY2X1SUCRE');
  const [campTestEmail, setCampTestEmail] = useState('');
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [suiteEmail, setSuiteEmail] = useState('victor2004612@gmail.com');
  const [sendingSuite, setSendingSuite] = useState(false);

  // Promotions (Ritmo Joy Ride + Promociones Dinámicas) State
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [prTitle, setPrTitle] = useState('');
  const [prSubtitle, setPrSubtitle] = useState('');
  const [prDesc, setPrDesc] = useState('');
  const [prBadge, setPrBadge] = useState('PROMO JOY RIDE');
  const [prSchedule, setPrSchedule] = useState('Todos los días · 18:00 – 21:00');
  const [prDiscount, setPrDiscount] = useState('25');
  const [prImageUrl, setPrImageUrl] = useState('/images/experiencia-bar.webp');
  const [prActive, setPrActive] = useState(true);
  const [uploadingPromoImg, setUploadingPromoImg] = useState(false);
  const [savingPromo, setSavingPromo] = useState(false);

  // Sucre Tourist Map Spots State
  const [mapSpotModalOpen, setMapSpotModalOpen] = useState(false);
  const [editingSpot, setEditingSpot] = useState<MapSpotRecord | null>(null);
  const [spName, setSpName] = useState('');
  const [spCat, setSpCat] = useState<'JOYRIDE' | 'BARES_NOCHE' | 'CHOCOLATE_GASTRO' | 'CULTURA' | 'MIRADOR' | 'AVENTURA'>('BARES_NOCHE');
  const [spLat, setSpLat] = useState(-19.04804);
  const [spLng, setSpLng] = useState(-65.25973);
  const [spAddress, setSpAddress] = useState('');
  const [spHours, setSpHours] = useState('17:00 – 01:30');
  const [spWalkTime, setSpWalkTime] = useState('4 min a pie');
  const [spSummary, setSpSummary] = useState('');
  const [spTip, setSpTip] = useState('');
  const [spHighlightsText, setSpHighlightsText] = useState('Centro Histórico, Ambiente Nocturno');
  const [spImageUrl, setSpImageUrl] = useState('/images/venue-patio-night.webp');
  const [uploadingSpotImg, setUploadingSpotImg] = useState(false);
  const [savingSpot, setSavingSpot] = useState(false);

  // Events & Agenda State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<JoyRideEvent | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evSubtitle, setEvSubtitle] = useState('');
  const [evDesc, setEvDesc] = useState('');
  const [evBadge, setEvBadge] = useState('EVENTO JOY RIDE');
  const [evAccent, setEvAccent] = useState<'cyan' | 'magenta' | 'amber' | 'emerald'>('magenta');
  const [evLocation, setEvLocation] = useState('Calle Nicolás Ortiz N° 14');
  const [evSchedule, setEvSchedule] = useState('Viernes y Sábado · 20:00 – 02:30');
  const [evSpotId, setEvSpotId] = useState(SUCRE_TOURIST_SPOTS[0].id);
  const [evImageUrl, setEvImageUrl] = useState('/images/evento-salsa.webp');
  const [evVideoUrl, setEvVideoUrl] = useState('');
  const [evNotify, setEvNotify] = useState(true);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await api.get<AdminAnalytics>('/admin/analytics');
      return res.data;
    },
    refetchInterval: 6000,
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: async () => {
      const res = await api.get<{ products: Product[] }>('/products?includeInactive=true');
      return res.data.products;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<{ categories: Category[] }>('/categories');
      return res.data.categories;
    },
  });

  const { data: kardex, isLoading: kardexLoading } = useQuery({
    queryKey: ['admin', 'kardex'],
    queryFn: async () => {
      const res = await api.get<{ movements: StockMovementRow[] }>('/admin/kardex');
      return res.data.movements;
    },
    enabled: tab === 'catalog' || tab === 'analytics',
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      const res = await api.get<{ orders: Order[] }>('/admin/orders');
      return res.data.orders;
    },
    enabled: tab === 'orders',
  });

  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'admin'],
    queryFn: async () => {
      const res = await api.get<{ reservations: Reservation[] }>('/reservations');
      return res.data.reservations;
    },
    enabled: tab === 'orders',
  });

  const { data: users } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<{ users: User[] }>('/admin/users');
      return res.data.users;
    },
    enabled: tab === 'users',
  });

  const { data: emailData, isLoading: emailsLoading } = useQuery({
    queryKey: ['admin', 'emails'],
    queryFn: async () => {
      const res = await api.get<{
        emails: EmailLog[];
        subscribersCount: number;
        deliveryMode?: 'SMTP' | 'RESEND' | 'PREVIEW_ONLY';
        managerEmail?: string;
      }>('/admin/emails');
      return res.data;
    },
    enabled: tab === 'emails',
    refetchInterval: 6000,
  });

  const { data: eventsList, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const res = await api.get<{ events: JoyRideEvent[] }>('/admin/events');
      return res.data.events;
    },
    enabled: tab === 'events',
  });

  const { data: promotionsList, isLoading: promosLoading } = useQuery({
    queryKey: ['admin', 'promotions'],
    queryFn: async () => {
      const res = await api.get<{ promotions: Promotion[] }>('/admin/promotions');
      return res.data.promotions;
    },
    enabled: tab === 'promos',
  });

  const { data: mapSpotsList, isLoading: spotsLoading } = useQuery({
    queryKey: ['admin', 'map-spots'],
    queryFn: async () => {
      const res = await api.get<{ spots: MapSpotRecord[] }>('/admin/map-spots');
      return res.data.spots;
    },
    enabled: tab === 'map' || tab === 'events',
  });

  const handleSendEmailSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteEmail.trim()) return;
    setSendingSuite(true);
    try {
      const res = await api.post<{
        count: number;
        sentReal: number;
        storedPreview: number;
        deliveryMode: string;
      }>('/admin/emails/send-suite', { email: suiteEmail.trim() });
      pushToast(
        `${res.data.count} plantillas generadas para ${suiteEmail.trim()}`,
        'success',
        res.data.sentReal > 0
          ? `Enviados en vivo (${res.data.sentReal}) vía ${res.data.deliveryMode}`
          : 'Guardados en bandeja de vista previa (sin SMTP/Resend configurado en .env)'
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
    } catch (err) {
      pushToast('Error enviando paquete de correos', 'error', getErrorMessage(err));
    } finally {
      setSendingSuite(false);
    }
  };

  const uploadMediaViaApi = async (
    file: File,
    kind: 'image' | 'video' = 'image',
    onStart?: () => void,
    onDone?: () => void
  ): Promise<string | null> => {
    const isVid = kind === 'video';
    if (!isVid && !/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      pushToast('Formato no soportado', 'error', 'Usa imagen PNG, JPG o WEBP');
      return null;
    }
    if (isVid && !/^video\/(mp4|webm)$/.test(file.type)) {
      pushToast('Formato no soportado', 'error', 'Usa video MP4 o WEBM');
      return null;
    }
    const maxBytes = isVid ? 12 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      pushToast(
        'Archivo muy pesado',
        'error',
        isVid ? 'El video no debe superar 12 MB' : 'La imagen no debe superar 5 MB'
      );
      return null;
    }
    onStart?.();
    try {
      const base64 = await readFileAsDataUrl(file);
      const res = await api.post<{ mediaUrl: string }>('/admin/media/upload', {
        mediaBase64: base64,
        fileName: file.name,
      });
      pushToast(
        isVid ? 'Video guardado en base de datos' : 'Imagen guardada en base de datos',
        'success',
        res.data.mediaUrl
      );
      return res.data.mediaUrl;
    } catch (err) {
      pushToast('Error subiendo archivo', 'error', getErrorMessage(err));
      return null;
    } finally {
      onDone?.();
    }
  };

  const openNewPromo = () => {
    setEditingPromo(null);
    setPrTitle('');
    setPrSubtitle('');
    setPrDesc('');
    setPrBadge('PROMO ESPECIAL');
    setPrSchedule('Jueves a Sábado · 18:00 – 22:00');
    setPrDiscount('20');
    setPrImageUrl('/images/experiencia-bar.webp');
    setPrActive(true);
    setPromoModalOpen(true);
  };

  const openEditPromo = (promo: Promotion) => {
    setEditingPromo(promo);
    setPrTitle(promo.title);
    setPrSubtitle(promo.subtitle);
    setPrDesc(promo.description);
    setPrBadge(promo.badgeText);
    setPrSchedule(promo.scheduleText);
    setPrDiscount(String(promo.discountPercent ?? 0));
    setPrImageUrl(promo.imageUrl);
    setPrActive(promo.active !== false);
    setPromoModalOpen(true);
  };

  const handlePromoImgUpload = async (file?: File | null) => {
    if (!file) return;
    const url = await uploadMediaViaApi(
      file,
      'image',
      () => setUploadingPromoImg(true),
      () => setUploadingPromoImg(false)
    );
    if (url) setPrImageUrl(url);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPromo(true);
    try {
      const payload = {
        title: prTitle.trim(),
        subtitle: prSubtitle.trim(),
        description: prDesc.trim(),
        badgeText: prBadge.trim(),
        scheduleText: prSchedule.trim(),
        discountPercent: Number(prDiscount) || 0,
        imageUrl: prImageUrl.trim(),
        active: prActive,
      };
      if (editingPromo) {
        await api.put(`/admin/promotions/${editingPromo.id}`, payload);
        pushToast('Promoción actualizada', 'success', prTitle);
      } else {
        await api.post('/admin/promotions', payload);
        pushToast('Nueva promoción publicada', 'success', prTitle);
      }
      setPromoModalOpen(false);
      setEditingPromo(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch (err) {
      pushToast('Error guardando promoción', 'error', getErrorMessage(err));
    } finally {
      setSavingPromo(false);
    }
  };

  const handleTogglePromo = async (promo: Promotion) => {
    try {
      await api.patch(`/admin/promotions/${promo.id}/toggle`);
      pushToast('Visibilidad de promoción actualizada', 'info', promo.title);
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch (err) {
      pushToast('No se pudo cambiar estado', 'error', getErrorMessage(err));
    }
  };

  const handleDeletePromo = async (promo: Promotion) => {
    try {
      await api.delete(`/admin/promotions/${promo.id}`);
      pushToast('Promoción eliminada', 'info', promo.title);
      queryClient.invalidateQueries({ queryKey: ['admin', 'promotions'] });
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch (err) {
      pushToast('No se pudo eliminar la promoción', 'error', getErrorMessage(err));
    }
  };

  const openNewSpot = () => {
    setEditingSpot(null);
    setSpName('');
    setSpCat('BARES_NOCHE');
    setSpLat(-19.04804);
    setSpLng(-65.25973);
    setSpAddress('Centro Histórico, Sucre');
    setSpHours('17:00 – 01:30');
    setSpWalkTime('4 min a pie');
    setSpSummary('');
    setSpTip('Recomendado combinar con Happy Hour 2x1 en Joy Ride Café.');
    setSpHighlightsText('Centro Histórico, Ambiente Nocturno');
    setSpImageUrl('/images/venue-patio-night.webp');
    setMapSpotModalOpen(true);
  };

  const openEditSpot = (spot: MapSpotRecord) => {
    setEditingSpot(spot);
    setSpName(spot.name);
    const validCat = (
      ['JOYRIDE', 'BARES_NOCHE', 'CHOCOLATE_GASTRO', 'CULTURA', 'MIRADOR', 'AVENTURA'] as const
    ).includes(spot.category as 'JOYRIDE')
      ? (spot.category as typeof spCat)
      : 'CULTURA';
    setSpCat(validCat);
    setSpLat(Number(spot.lat));
    setSpLng(Number(spot.lng));
    setSpAddress(spot.address);
    setSpHours(spot.hours);
    setSpWalkTime(spot.walkTimeFromJoyRide);
    setSpSummary(spot.summary);
    setSpTip(spot.tip || '');
    const hl = Array.isArray(spot.highlightsJson) ? spot.highlightsJson.map(String).join(', ') : '';
    setSpHighlightsText(hl);
    setSpImageUrl(spot.imageUrl);
    setMapSpotModalOpen(true);
  };

  const handleSpotImgUpload = async (file?: File | null) => {
    if (!file) return;
    const url = await uploadMediaViaApi(
      file,
      'image',
      () => setUploadingSpotImg(true),
      () => setUploadingSpotImg(false)
    );
    if (url) setSpImageUrl(url);
  };

  const handleSaveMapSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSpot(true);
    try {
      const highlightsJson = spHighlightsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: spName.trim(),
        category: spCat,
        lat: Number(spLat),
        lng: Number(spLng),
        address: spAddress.trim(),
        hours: spHours.trim(),
        walkTimeFromJoyRide: spWalkTime.trim(),
        summary: spSummary.trim(),
        tip: spTip.trim(),
        highlightsJson: highlightsJson.length > 0 ? highlightsJson : ['Sucre · Bolivia'],
        imageUrl: spImageUrl.trim(),
        imagesJson: [spImageUrl.trim()],
        isActive: editingSpot ? editingSpot.isActive : true,
        sortOrder: editingSpot?.sortOrder ?? ((mapSpotsList?.length ?? 0) + 1),
      };
      if (editingSpot) {
        await api.put(`/admin/map-spots/${editingSpot.id}`, payload);
        pushToast('Punto de mapa actualizado', 'success', spName);
      } else {
        await api.post('/admin/map-spots', payload);
        pushToast('Nuevo lugar publicado en Mapa Sucre', 'success', spName);
      }
      setMapSpotModalOpen(false);
      setEditingSpot(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'map-spots'] });
      queryClient.invalidateQueries({ queryKey: ['map-spots'] });
    } catch (err) {
      pushToast('Error guardando lugar en mapa', 'error', getErrorMessage(err));
    } finally {
      setSavingSpot(false);
    }
  };

  const handleToggleMapSpot = async (spot: MapSpotRecord) => {
    try {
      await api.patch(`/admin/map-spots/${spot.id}/toggle`);
      pushToast('Visibilidad en mapa actualizada', 'info', spot.name);
      queryClient.invalidateQueries({ queryKey: ['admin', 'map-spots'] });
      queryClient.invalidateQueries({ queryKey: ['map-spots'] });
    } catch (err) {
      pushToast('No se pudo cambiar estado', 'error', getErrorMessage(err));
    }
  };

  const handleDeleteMapSpot = async (spot: MapSpotRecord) => {
    try {
      await api.delete(`/admin/map-spots/${spot.id}`);
      pushToast('Lugar eliminado del mapa', 'info', spot.name);
      queryClient.invalidateQueries({ queryKey: ['admin', 'map-spots'] });
      queryClient.invalidateQueries({ queryKey: ['map-spots'] });
    } catch (err) {
      pushToast('No se pudo eliminar', 'error', getErrorMessage(err));
    }
  };

  const activeEmail = selectedEmail || emailData?.emails?.[0] || null;

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campSubject.trim() || !campHeadline.trim() || !campBody.trim()) return;
    setSendingCampaign(true);
    try {
      const res = await api.post<{ count?: number; sentCount?: number }>('/admin/emails/campaign', {
        subject: campSubject.trim(),
        headline: campHeadline.trim(),
        bodyText: campBody.trim(),
        promoCode: campPromo.trim() || undefined,
        testEmail: campTestEmail.trim() || undefined,
      });
      const sentTotal = res.data.sentCount ?? res.data.count ?? 0;
      pushToast(
        'Campaña de novedades enviada',
        'success',
        `Se enviaron ${sentTotal} correos a suscriptores`
      );
      setCampSubject('');
      setCampHeadline('');
      setCampBody('');
      setCampTestEmail('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
    } catch (err) {
      pushToast('Error al enviar campaña', 'error', getErrorMessage(err));
    } finally {
      setSendingCampaign(false);
    }
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setPName('');
    setPCatId(categories?.[0]?.id || '');
    setPDesc('');
    setPPrice('58');
    setPStock('15');
    setPMinAlert('5');
    setPPrepMin('15');
    setPImage('/images/dish-burger.webp');
    setPVegan(false);
    setPSpicy(false);
    setPFeatured(false);
    setPHappyHour(false);
    setProductModalOpen(true);
  };

  const handleProductImageUpload = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(file.type)) {
      pushToast('Formato no soportado', 'error', 'Sube una imagen PNG, JPG o WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      pushToast('Archivo muy pesado', 'error', 'La imagen debe pesar máximo 5 MB');
      return;
    }

    setUploadingImage(true);
    try {
      const base64 = await readFileAsDataUrl(file);
      const res = await api.post<{ imageUrl: string }>('/admin/products/upload-image', {
        imageBase64: base64,
        fileName: file.name,
      });
      setPImage(res.data.imageUrl);
      pushToast('Imagen guardada en base de datos', 'success', res.data.imageUrl);
    } catch (err) {
      pushToast('Error subiendo imagen', 'error', getErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPCatId(prod.categoryId);
    setPDesc(prod.description);
    setPPrice(String(prod.precioBs));
    setPStock(String(prod.stockDisponible));
    setPMinAlert(String(prod.stockMinimoAlerta));
    setPPrepMin(String(prod.tiempoPreparacionMin ?? 15));
    setPImage(prod.imageUrl);
    setPVegan(prod.esVegano);
    setPSpicy(prod.esPicante);
    setPFeatured(prod.esDestacado);
    setPHappyHour(prod.enHappyHour);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        categoryId: pCatId,
        name: pName.trim(),
        description: pDesc.trim(),
        precioBs: Number(pPrice),
        stockDisponible: editingProduct ? undefined : Number(pStock),
        stockMinimoAlerta: Number(pMinAlert),
        tiempoPreparacionMin: Number(pPrepMin) || 15,
        imageUrl: pImage.trim(),
        esVegano: pVegan,
        esPicante: pSpicy,
        esDestacado: pFeatured,
        enHappyHour: pHappyHour,
      };
      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload);
        pushToast('Producto actualizado', 'success', pName);
      } else {
        await api.post('/admin/products', payload);
        pushToast('Producto creado en catálogo', 'success', pName);
      }
      setProductModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      pushToast('Error guardando producto', 'error', getErrorMessage(err));
    }
  };

  const handleToggleProduct = async (prod: Product) => {
    try {
      await api.patch(`/admin/products/${prod.id}/toggle`);
      pushToast(
        prod.active ? 'Producto ocultado de la carta' : 'Producto activado en la carta',
        'info',
        prod.name
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      pushToast('No se pudo cambiar estado', 'error', getErrorMessage(err));
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    try {
      const res = await api.delete<{ deleted: boolean; archived?: boolean; message?: string }>(
        `/admin/products/${prod.id}`
      );
      if (res.data.archived) {
        pushToast('Producto archivado (oculto)', 'info', res.data.message || prod.name);
      } else {
        pushToast('Producto eliminado del catálogo', 'info', prod.name);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      pushToast('No se pudo eliminar', 'error', getErrorMessage(err));
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockTarget) return;
    try {
      await api.post(`/admin/products/${stockTarget.id}/stock`, {
        delta: Number(stockDelta),
        reason: stockReason,
      });
      pushToast('Stock actualizado en Kardex', 'success', stockTarget.name);
      setStockTarget(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    } catch (err) {
      pushToast('No se pudo ajustar stock', 'error', getErrorMessage(err));
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await api.patch(`/admin/users/${userId}`, { role });
      pushToast('Rol actualizado', 'success', `Nuevo rol: ${role}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err) {
      pushToast('Error actualizando rol', 'error', getErrorMessage(err));
    }
  };

  const openNewEvent = () => {
    setEditingEvent(null);
    setEvTitle('');
    setEvSubtitle('Noche temática en Nicolás Ortiz 14');
    setEvDesc('');
    setEvBadge('EVENTO JOY RIDE');
    setEvAccent('magenta');
    setEvLocation('Calle Nicolás Ortiz N° 14');
    setEvSchedule('Viernes y Sábado · 20:00 – 02:30');
    setEvSpotId(SUCRE_TOURIST_SPOTS[0].id);
    setEvImageUrl('/images/evento-salsa.webp');
    setEvVideoUrl('');
    setEvNotify(true);
    setEventModalOpen(true);
  };

  const openEditEvent = (ev: JoyRideEvent) => {
    setEditingEvent(ev);
    setEvTitle(ev.title);
    setEvSubtitle(ev.subtitle);
    setEvDesc(ev.description);
    setEvBadge(ev.badge);
    const acc = ev.accent === 'cyan' || ev.accent === 'amber' || ev.accent === 'emerald' ? ev.accent : 'magenta';
    setEvAccent(acc);
    setEvLocation(ev.locationLabel);
    setEvSchedule(ev.scheduleLabel);
    setEvSpotId(ev.spotId || SUCRE_TOURIST_SPOTS[0].id);
    setEvImageUrl(ev.imageUrl);
    setEvVideoUrl(ev.videoUrl || '');
    setEvNotify(false);
    setEventModalOpen(true);
  };

  const handleEventMediaUpload = async (file?: File | null, kind: 'image' | 'video' = 'image') => {
    if (!file) return;
    const url = await uploadMediaViaApi(
      file,
      kind,
      () => setUploadingMedia(true),
      () => setUploadingMedia(false)
    );
    if (!url) return;
    if (kind === 'video') setEvVideoUrl(url);
    else setEvImageUrl(url);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEvent(true);
    try {
      const payload = {
        title: evTitle.trim(),
        subtitle: evSubtitle.trim(),
        description: evDesc.trim(),
        badge: evBadge.trim(),
        accent: evAccent,
        locationLabel: evLocation.trim(),
        scheduleLabel: evSchedule.trim(),
        imageUrl: evImageUrl.trim(),
        imagesJson: [evImageUrl.trim()],
        videoUrl: evVideoUrl.trim() ? evVideoUrl.trim() : null,
        spotId: evSpotId,
        isActive: editingEvent ? editingEvent.isActive : true,
        isFeatured: true,
        sortOrder: editingEvent?.sortOrder ?? 0,
        notifySubscribers: evNotify,
      };
      if (editingEvent) {
        await api.put(`/admin/events/${editingEvent.id}`, payload);
        pushToast('Evento actualizado', 'success', evTitle);
      } else {
        await api.post('/admin/events', payload);
        pushToast(
          'Evento publicado en cartelera',
          'success',
          evNotify ? 'Notificación enviada al Club de Suscriptores' : evTitle
        );
      }
      setEventModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
    } catch (err) {
      pushToast('Error guardando evento', 'error', getErrorMessage(err));
    } finally {
      setSavingEvent(false);
    }
  };

  const handleToggleEvent = async (ev: JoyRideEvent) => {
    try {
      const res = await api.patch<{ event: JoyRideEvent; notifiedCount: number }>(
        `/admin/events/${ev.id}/toggle`,
        { notifySubscribers: true }
      );
      if (res.data.event.isActive) {
        pushToast(
          'Evento activado en vivo',
          'success',
          res.data.notifiedCount > 0
            ? `Se notificó por correo a ${res.data.notifiedCount} suscriptores`
            : `${ev.title} ya es visible en portada`
        );
      } else {
        pushToast('Evento ocultado de portada', 'info', ev.title);
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'public'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'emails'] });
    } catch (err) {
      pushToast('No se pudo cambiar estado', 'error', getErrorMessage(err));
    }
  };

  const handleDeleteEvent = async (ev: JoyRideEvent) => {
    try {
      await api.delete(`/admin/events/${ev.id}`);
      pushToast('Evento eliminado', 'info', ev.title);
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      queryClient.invalidateQueries({ queryKey: ['events', 'public'] });
    } catch (err) {
      pushToast('No se pudo eliminar', 'error', getErrorMessage(err));
    }
  };

  return (
    <OperationsLayout
      title="Administración, KPIs & Kardex"
      subtitle="Analítica financiera por método de pago, inventario atómico, cartelera de eventos y usuarios"
    >
      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { id: 'analytics' as const, label: 'KPIs & Finanzas', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'catalog' as const, label: 'Catálogo & Kardex', icon: <Boxes className="h-4 w-4" /> },
          { id: 'promos' as const, label: 'Promociones', icon: <Sparkles className="h-4 w-4" /> },
          { id: 'events' as const, label: 'Eventos & Agenda', icon: <CalendarDays className="h-4 w-4" /> },
          { id: 'map' as const, label: 'Mapa de Sucre', icon: <Compass className="h-4 w-4" /> },
          { id: 'orders' as const, label: 'Pedidos & Reservas', icon: <Package className="h-4 w-4" /> },
          { id: 'users' as const, label: 'Usuarios & Roles', icon: <Users className="h-4 w-4" /> },
          { id: 'emails' as const, label: 'Correos & Novedades', icon: <Mail className="h-4 w-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-colors ${
              tab === t.id
                ? 'border-joycyan bg-joycyan text-obsidian'
                : 'border-hairline bg-surface text-muted hover:text-ink'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: Analytics */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          {analyticsLoading || !analytics ? (
            <StatsKpiSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-hairline bg-surface p-5">
                  <p className="text-xs font-medium text-muted">Ingresos Confirmados</p>
                  <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-joycyan">
                    Bs. {analytics.summary.totalRevenueBs.toFixed(2)}
                  </p>
                  <p className="mt-1 font-mono text-xs tabular-nums text-muted">
                    $ {analytics.summary.totalRevenueUsd.toFixed(2)} USD ·{' '}
                    {analytics.summary.completedPaymentsCount} pagos
                  </p>
                </div>

                <div className="rounded-xl border border-hairline bg-surface p-5">
                  <p className="text-xs font-medium text-muted">Alertas de Stock Bajo</p>
                  <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-joymagenta">
                    {analytics.summary.lowStockCount}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    De {analytics.summary.totalProducts} productos activos
                  </p>
                </div>

                <div className="rounded-xl border border-hairline bg-surface p-5">
                  <p className="text-xs font-medium text-muted">Reservas Vigentes</p>
                  <p className="mt-2 font-mono text-2xl font-extrabold tabular-nums text-ink">
                    {analytics.summary.activeReservations}
                  </p>
                  <p className="mt-1 text-xs text-muted">Mesas y pista Salsa/Bachata</p>
                </div>

                <div className="rounded-xl border border-hairline bg-surface p-5">
                  <p className="text-xs font-medium text-muted">Canal Líder</p>
                  <p className="mt-2 font-display text-2xl font-extrabold text-emerald-400">
                    {
                      [...analytics.revenueByMethod].sort((a, b) => b.totalBs - a.totalBs)[0]
                        ?.label
                    }
                  </p>
                  <p className="mt-1 text-xs text-muted">Mayor recaudación acumulada</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Payment Methods Chart */}
                <div className="rounded-2xl border border-hairline bg-surface p-5 lg:col-span-7">
                  <h2 className="font-display text-base font-bold text-ink">
                    Ingresos por Pasarela (QR, Depósito, PayPal y Tarjeta)
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">Totales confirmados en Bolivianos (Bs.)</p>

                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.revenueByMethod}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262C3A" />
                        <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} />
                        <YAxis stroke="#94A3B8" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#141821',
                            border: '1px solid #262C3A',
                            borderRadius: '12px',
                            color: '#F8FAFC',
                          }}
                        />
                        <Bar
                          dataKey="totalBs"
                          name="Ingresos (Bs.)"
                          radius={[8, 8, 0, 0]}
                          isAnimationActive={false}
                        >
                          {analytics.revenueByMethod.map((_entry, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Products */}
                <div className="rounded-2xl border border-hairline bg-surface p-5 lg:col-span-5">
                  <h2 className="font-display text-base font-bold text-ink">
                    Platos &amp; Tragos Más Pedidos
                  </h2>
                  <div className="mt-4 space-y-2.5">
                    {analytics.topProducts.map((tp, idx) => (
                      <div
                        key={tp.productId}
                        className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-obsidian px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="font-mono font-bold text-joycyan">#{idx + 1}</span>
                          <span className="truncate font-semibold text-ink">{tp.productName}</span>
                        </div>
                        <div className="shrink-0 text-right font-mono tabular-nums">
                          <p className="font-bold text-ink">{tp.totalSold} u.</p>
                          <p className="text-[11px] text-muted">Bs. {tp.revenueBs.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              {analytics.lowStockAlerts.length > 0 && (
                <div className="rounded-2xl border border-joymagenta/45 bg-joymagenta/10 p-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-pink-200">
                    <AlertTriangle className="h-4 w-4 text-joymagenta" />
                    <span>Alertas de Stock Crítico (≤ Mínimo Configurado)</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {analytics.lowStockAlerts.map((alert) => {
                      const prod = products?.find((p) => p.id === alert.id);
                      return (
                        <div
                          key={alert.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-obsidian p-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-bold text-ink">{alert.name}</p>
                            <p className="font-mono text-joymagenta tabular-nums">
                              Disp: {alert.stockDisponible} · Mín: {alert.stockMinimoAlerta}
                            </p>
                          </div>
                          {prod && (
                            <button
                              type="button"
                              onClick={() => {
                                setStockTarget(prod);
                                setStockDelta(12);
                              }}
                              className="shrink-0 rounded-lg bg-joycyan px-2.5 py-1.5 text-[11px] font-bold text-obsidian"
                            >
                              + Reponer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: Catalog & Kardex */}
      {tab === 'catalog' && (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-ink">
              Catálogo e Inventario en Vivo
            </h2>
            <button
              type="button"
              onClick={openCreateProduct}
              className="inline-flex items-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-xs font-bold text-white hover:bg-joymagenta-deep"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hairline bg-elevated text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold">Precio</th>
                  <th className="px-4 py-3 font-semibold">Disponible</th>
                  <th className="px-4 py-3 font-semibold">Reservado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {(products || []).map((prod) => (
                  <tr key={prod.id} className="hover:bg-elevated/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="photo-frame h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-ink">{prod.name}</p>
                            {!prod.active && (
                              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                                OCULTO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted">{prod.category.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-ink">
                      Bs. {Number(prod.precioBs).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums">
                      <span
                        className={
                          prod.stockDisponible <= prod.stockMinimoAlerta
                            ? 'text-joymagenta'
                            : 'text-emerald-400'
                        }
                      >
                        {prod.stockDisponible}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-amber-300">
                      {prod.stockReservado}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex shrink-0 items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setStockTarget(prod);
                            setStockDelta(10);
                          }}
                          className="shrink-0 whitespace-nowrap rounded-lg border border-joycyan/40 bg-joycyan/10 px-3 py-1.5 font-semibold text-joycyan hover:bg-joycyan/20"
                        >
                          Ajustar Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditProduct(prod)}
                          aria-label={`Editar ${prod.name}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-hairline bg-elevated px-2.5 py-1.5 text-muted hover:border-joycyan/50 hover:text-ink"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod)}
                          title={prod.active ? 'Ocultar de la carta' : 'Activar en la carta'}
                          aria-label={prod.active ? `Ocultar ${prod.name}` : `Activar ${prod.name}`}
                          className="rounded-lg border border-hairline bg-elevated p-1.5 text-amber-300 hover:border-amber-400/50"
                        >
                          {prod.active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-emerald-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod)}
                          title="Eliminar producto"
                          aria-label={`Eliminar ${prod.name}`}
                          className="rounded-lg border border-hairline bg-elevated p-1.5 text-rose-400 hover:border-rose-400/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kardex Table */}
          <div>
            <h3 className="mb-3 font-display text-lg font-bold text-ink">
              Kardex de Movimientos de Stock (Últimos 100)
            </h3>
            {kardexLoading ? (
              <OrderTableSkeleton rows={3} />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-hairline bg-elevated text-muted">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Producto</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Cant.</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3">Motivo / Pedido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {(kardex || []).map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono tabular-nums text-muted">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-ink">{m.product.name}</td>
                        <td className="px-4 py-2.5 font-mono text-joycyan">{m.type}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-ink">{m.quantity}</td>
                        <td className="px-4 py-2.5 font-mono tabular-nums text-muted">
                          {m.previousStock} → {m.newStock}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          {m.order?.orderCode ? `[${m.order.orderCode}] ` : ''}
                          {m.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Orders & Reservations */}
      {tab === 'orders' && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 font-display text-xl font-bold text-ink">Todos los Pedidos</h2>
            {ordersLoading ? (
              <OrderTableSkeleton rows={4} />
            ) : (
              <div className="space-y-2.5">
                {(orders || []).map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface p-4 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-joycyan">
                          {o.orderCode}
                        </span>
                        <StatusBadge status={o.status} />
                        <span className="font-mono text-muted">{o.payment?.method}</span>
                      </div>
                      <p className="text-ink">
                        {o.user?.name} · {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-bold tabular-nums text-ink">
                        {formatDualPrice(o.totalBs).bs}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptOrder(o)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-joycyan/40 bg-joycyan/10 px-3 py-1.5 font-semibold text-joycyan hover:bg-joycyan/20"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Recibo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineOrderId(o.id)}
                        className="rounded-lg border border-hairline bg-elevated px-3 py-1.5 font-semibold text-ink hover:border-joycyan"
                      >
                        Ver Auditoría
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reservations && reservations.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-lg font-bold text-ink">Reservas de Mesa</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {reservations.map((r) => (
                  <div key={r.id} className="rounded-xl border border-hairline bg-surface p-4 text-xs">
                    <div className="flex justify-between">
                      <span className="font-mono font-bold text-joycyan">{r.code}</span>
                      <span className="font-mono text-emerald-300">{r.status}</span>
                    </div>
                    <p className="mt-1 font-bold text-ink">
                      {r.guestName} · {ZONE_META[r.zone].label}
                    </p>
                    <p className="font-mono text-muted">
                      {r.date} {r.timeSlot} · {r.partySize} pers.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Users & Roles */}
      {tab === 'users' && (
        <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hairline bg-elevated text-muted">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(users || []).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold text-ink">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-joycyan" />
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        className="rounded-lg border border-hairline bg-obsidian px-2.5 py-1.5 text-xs font-semibold text-ink"
                      >
                        <option value="CLIENTE">CLIENTE</option>
                        <option value="CAJERO">CAJERO</option>
                        <option value="EMPAQUETADOR">EMPAQUETADOR</option>
                        <option value="REPARTIDOR">REPARTIDOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: Emails HTML & Newsletter */}
      {tab === 'emails' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface p-5">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Centro de Correos &amp; Novedades
              </h2>
              <p className="mt-1 text-xs text-muted">
                Recibos oficiales, PIN de entrega, pases de reserva, alertas a gerencia ({emailData?.managerEmail || 'victor2004612@gmail.com'}) y boletines.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
              <span
                className={`rounded-full border px-3 py-1.5 font-bold ${
                  emailData?.deliveryMode === 'SMTP' || emailData?.deliveryMode === 'RESEND'
                    ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                }`}
              >
                {emailData?.deliveryMode === 'SMTP'
                  ? 'SMTP Real Activo'
                  : emailData?.deliveryMode === 'RESEND'
                  ? 'Resend API Activa'
                  : 'Modo Vista Previa Local (Agrega SMTP o Resend para bandeja Gmail)'}
              </span>
              <span className="rounded-full border border-joycyan/40 bg-joycyan/10 px-3 py-1.5 font-bold text-joycyan">
                Suscriptores: {emailData?.subscribersCount ?? 0}
              </span>
              <span className="rounded-full border border-joymagenta/40 bg-joymagenta/10 px-3 py-1.5 font-bold text-joymagenta">
                Correos: {emailData?.emails.length ?? 0}
              </span>
            </div>
          </div>

          {/* Automatic Email Triggers Map */}
          <div className="rounded-2xl border border-hairline bg-surface p-4 shadow-card">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-joycyan">
              <Info className="h-4 w-4" />
              <span>Disparadores Automáticos de Correo (Qué envía correo &amp; a quién)</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  trigger: 'Pago confirmado (QR, PayPal, Tarjeta o Depósito aprobado)',
                  dest: 'Cliente (Recibo HTML) + Gerencia (' + (emailData?.managerEmail || 'victor2004612@gmail.com') + ')',
                },
                {
                  trigger: 'Depósito bancario subido con comprobante',
                  dest: 'Gerencia (' + (emailData?.managerEmail || 'victor2004612@gmail.com') + ') · Alerta de revisión',
                },
                {
                  trigger: 'Cocina/Empaque sella pedido (EMPACADO)',
                  dest: 'Cliente · Envío automático del PIN de 4 dígitos',
                },
                {
                  trigger: 'Stock cae ≤ mínimo configurado al vender',
                  dest: 'Gerencia · Alerta de reposición urgente',
                },
                {
                  trigger: 'Nueva reserva de mesa / Salsa & Bachata',
                  dest: 'Cliente (Pase QR) + Gerencia (Ingreso programado)',
                },
                {
                  trigger: 'Admin activa evento o envía Campaña Novedades',
                  dest: 'Todos los suscriptores activos en Newsletter',
                },
              ].map((row) => (
                <div
                  key={row.trigger}
                  className="rounded-xl border border-hairline bg-obsidian/70 px-3.5 py-2.5"
                >
                  <p className="font-bold text-ink">{row.trigger}</p>
                  <p className="mt-1 text-[11px] text-muted">{row.dest}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Template Verification Suite Sender */}
          <form
            onSubmit={handleSendEmailSuite}
            className="flex flex-col gap-3 rounded-2xl border border-joycyan/35 bg-surface p-4 shadow-card sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="suite-email" className="block text-xs font-bold text-ink">
                Enviar Paquete de Prueba (5 Plantillas: Recibo, PIN, Reserva, Gerencia y Evento)
              </label>
              <input
                id="suite-email"
                type="email"
                required
                value={suiteEmail}
                onChange={(e) => setSuiteEmail(e.target.value)}
                placeholder="victor2004612@gmail.com"
                className="mt-1.5 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={sendingSuite}
              className="inline-flex min-h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-joycyan px-5 py-2.5 text-xs font-extrabold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
            >
              <Mail className="h-4 w-4" />
              <span>
                {sendingSuite ? 'Generando 5 plantillas…' : 'Enviar Paquete de Prueba (5 Plantillas)'}
              </span>
            </button>
          </form>

          {/* Newsletter Campaign Sender */}
          <form
            onSubmit={handleSendCampaign}
            className="rounded-2xl border border-hairline bg-surface p-5 shadow-card space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Send className="h-4 w-4 text-joymagenta" />
              <span>Enviar Campaña / Novedad HTML a Clientes y Suscriptores</span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Asunto del Correo</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={campSubject}
                  onChange={(e) => setCampSubject(e.target.value)}
                  placeholder="Ej. Noche de Salsa 2x1 este Viernes en Joy Ride"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Titular Principal</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={campHeadline}
                  onChange={(e) => setCampHeadline(e.target.value)}
                  placeholder="Ej. Happy Hour Extendido + Clases de Bachata"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Mensaje / Detalles</label>
              <textarea
                rows={3}
                required
                minLength={5}
                value={campBody}
                onChange={(e) => setCampBody(e.target.value)}
                placeholder="Describe promociones, nuevos cócteles o eventos en Calle Nicolás Ortiz 14..."
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-muted">
                  Código Promo (opcional)
                </label>
                <input
                  type="text"
                  value={campPromo}
                  onChange={(e) => setCampPromo(e.target.value)}
                  placeholder="HAPPY2X1SUCRE"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-joycyan sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted">
                  Correo de Prueba (opcional)
                </label>
                <input
                  type="email"
                  value={campTestEmail}
                  onChange={(e) => setCampTestEmail(e.target.value)}
                  placeholder="Si se llena, solo envía a ese correo"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={sendingCampaign}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-xs font-bold text-white hover:bg-joymagenta-deep disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{sendingCampaign ? 'Enviando…' : 'Enviar Campaña de Novedades'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* EmailLog List & Live HTML Iframe Preview */}
          {emailsLoading ? (
            <OrderTableSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="space-y-2.5 lg:col-span-5">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
                  Bandeja de Salida &amp; Alertas (Últimos 50)
                </h3>
                <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1">
                  {(emailData?.emails || []).map((em) => {
                    const isSelected = activeEmail?.id === em.id;
                    return (
                      <button
                        key={em.id}
                        type="button"
                        onClick={() => setSelectedEmail(em)}
                        className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                          isSelected
                            ? 'border-joycyan bg-joycyan/10'
                            : 'border-hairline bg-surface hover:border-white/25'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="rounded bg-elevated px-2 py-0.5 font-bold text-joycyan">
                            {em.templateType}
                          </span>
                          <span className="text-muted">{em.recipientRole}</span>
                        </div>
                        <p className="mt-1.5 line-clamp-1 text-sm font-bold text-ink">
                          {em.subject}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
                          <span className="truncate font-mono">{em.toEmail}</span>
                          <span className="shrink-0 font-mono text-[11px] text-emerald-300">
                            {em.status}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] tabular-nums text-muted">
                          {formatDateTime(em.createdAt)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7">
                {activeEmail ? (
                  <div className="rounded-2xl border border-hairline bg-surface p-4 space-y-3">
                    <div className="border-b border-hairline pb-3 text-xs space-y-1">
                      <p className="font-bold text-sm text-ink">{activeEmail.subject}</p>
                      <p className="text-muted">
                        Para: <span className="font-mono text-joycyan">{activeEmail.toEmail}</span>{' '}
                        ({activeEmail.recipientRole}) · Estado:{' '}
                        <span className="font-mono text-emerald-300">{activeEmail.status}</span>
                      </p>
                    </div>
                    <iframe
                      title={`Email HTML Preview ${activeEmail.id}`}
                      sandbox=""
                      srcDoc={activeEmail.htmlBody}
                      className="h-[520px] w-full rounded-xl border border-hairline bg-white"
                    />
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl border border-hairline bg-surface text-sm text-muted">
                    Selecciona un correo enviado para ver su vista previa.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: Promotions (Bento + Extra Dynamic Promos) */}
      {tab === 'promos' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-joycyan/35 bg-surface p-5">
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink">
                Promociones &amp; Tarjetas Ritmo Joy Ride
              </h2>
              <p className="text-xs text-muted">
                Crea nuevas promociones o edita las tarjetas Bento principales (Happy Hour 2x1, Clases de Salsa y tarjetas extra en portada).
              </p>
            </div>
            <button
              type="button"
              onClick={openNewPromo}
              className="inline-flex items-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-xs font-bold text-white hover:bg-joymagenta-deep"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Promoción</span>
            </button>
          </div>

          {promosLoading ? (
            <OrderTableSkeleton rows={3} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(promotionsList || []).map((promo) => (
                <div
                  key={promo.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card sm:flex-row"
                >
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="h-48 w-full shrink-0 object-cover sm:h-auto sm:w-44"
                  />
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-joymagenta/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-joymagenta">
                          {promo.badgeText}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {promo.discountPercent > 0 && (
                            <span className="rounded-full bg-joycyan/15 px-2 py-0.5 font-mono text-[10px] font-bold text-joycyan">
                              -{promo.discountPercent}%
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              promo.active !== false
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {promo.active !== false ? 'VISIBLE' : 'OCULTA'}
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-2 font-display text-base font-extrabold text-ink">
                        {promo.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-[11px] text-joycyan">
                        {promo.scheduleText}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted">{promo.description}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                      <button
                        type="button"
                        onClick={() => openEditPromo(promo)}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-joycyan px-3 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePromo(promo)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-obsidian px-3 py-2 text-xs font-semibold text-ink hover:border-amber-400/60"
                      >
                        {promo.active !== false ? (
                          <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>{promo.active !== false ? 'Ocultar' : 'Activar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePromo(promo)}
                        aria-label={`Eliminar ${promo.title}`}
                        className="rounded-xl border border-hairline bg-obsidian p-2 text-rose-400 hover:border-rose-400/60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Events & Agenda Management (Dedicated Carousel & Activities CRUD) */}
      {tab === 'events' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-joymagenta/35 bg-surface p-5">
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink">
                Cartelera Dinámica &amp; Eventos (Carrusel + Guía)
              </h2>
              <p className="text-xs text-muted">
                Añade, edita o activa eventos con foto y video MP4/WEBM; al activar un evento se notifica por correo a tus suscriptores.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewEvent}
              className="inline-flex items-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-xs font-bold text-white hover:bg-joymagenta-deep"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Evento / Actividad</span>
            </button>
          </div>

          {eventsLoading ? (
            <OrderTableSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(eventsList || []).map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card"
                >
                  <div>
                    <div className="relative h-44 overflow-hidden bg-obsidian">
                      {ev.videoUrl ? (
                        <video
                          src={ev.videoUrl}
                          poster={ev.imageUrl}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={ev.imageUrl}
                          alt={ev.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                      <div className="photo-overlay absolute inset-x-0 top-0 flex items-center justify-between p-3">
                        <span className="rounded-full bg-black/70 px-2.5 py-0.5 font-mono text-[10px] font-bold text-joycyan backdrop-blur-md">
                          {ev.badge}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            ev.isActive
                              ? 'bg-emerald-500 text-obsidian'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {ev.isActive ? 'ACTIVO EN VIVO' : 'OCULTO'}
                        </span>
                      </div>
                      {ev.videoUrl && (
                        <span className="photo-overlay absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-joymagenta px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                          <Film className="h-3 w-3" />
                          VIDEO
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-1 font-display text-base font-extrabold text-ink">
                        {ev.title}
                      </h3>
                      <p className="mt-0.5 font-mono text-[11px] text-joycyan">{ev.scheduleLabel}</p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted">{ev.description}</p>
                      <p className="mt-2 truncate font-mono text-[11px] text-muted">
                        Lugar: {ev.locationLabel}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-hairline bg-elevated/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleEvent(ev)}
                      className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                        ev.isActive
                          ? 'border border-amber-400/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'bg-emerald-500 text-obsidian hover:bg-emerald-400'
                      }`}
                    >
                      {ev.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{ev.isActive ? 'Ocultar' : 'Activar & Notificar'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditEvent(ev)}
                      aria-label={`Editar ${ev.title}`}
                      className="rounded-xl border border-hairline bg-surface p-2 text-ink hover:border-joycyan"
                    >
                      <Edit3 className="h-4 w-4 text-joycyan" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(ev)}
                      aria-label={`Eliminar ${ev.title}`}
                      className="rounded-xl border border-hairline bg-surface p-2 text-rose-400 hover:border-rose-400/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Sucre Interactive Map Spots CRUD */}
      {tab === 'map' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/35 bg-surface p-5">
            <div>
              <h2 className="font-display text-lg font-extrabold text-ink">
                Puntos Turísticos &amp; Bares en Mapa Sucre
              </h2>
              <p className="text-xs text-muted">
                Ubica pines reales haciendo clic o buscando calles sobre el mapa interactivo de Sucre; el cálculo de distancia desde Joy Ride es automático.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewSpot}
              className="inline-flex items-center gap-2 rounded-xl bg-joycyan px-4 py-2.5 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Punto en el Mapa</span>
            </button>
          </div>

          {spotsLoading ? (
            <OrderTableSkeleton rows={4} />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(mapSpotsList || []).map((spot) => (
                <div
                  key={spot.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card"
                >
                  <div>
                    <div className="relative h-40 overflow-hidden bg-obsidian">
                      <img
                        src={spot.imageUrl}
                        alt={spot.name}
                        className="h-full w-full object-cover"
                      />
                      <div className="photo-overlay absolute inset-x-0 top-0 flex items-center justify-between p-3">
                        <span className="rounded-full bg-black/75 px-2.5 py-0.5 font-mono text-[10px] font-bold text-joycyan backdrop-blur-md">
                          {spot.category}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            spot.isActive
                              ? 'bg-emerald-500 text-obsidian'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {spot.isActive ? 'VISIBLE' : 'OCULTO'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="line-clamp-1 font-display text-base font-extrabold text-ink">
                        {spot.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 font-mono text-[11px] text-joymagenta">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{spot.walkTimeFromJoyRide} · {spot.address}</span>
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs text-muted">{spot.summary}</p>
                      <p className="mt-2 font-mono text-[10px] text-muted">
                        GPS: {Number(spot.lat).toFixed(5)}, {Number(spot.lng).toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-hairline bg-elevated/40 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openEditSpot(spot)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-joycyan px-3 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar Ubicación</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleMapSpot(spot)}
                      className="rounded-xl border border-hairline bg-surface p-2 text-amber-300 hover:border-amber-400/50"
                      title={spot.isActive ? 'Ocultar punto' : 'Activar punto'}
                    >
                      {spot.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMapSpot(spot)}
                      aria-label={`Eliminar ${spot.name}`}
                      className="rounded-xl border border-hairline bg-surface p-2 text-rose-400 hover:border-rose-400/60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Adjust Stock Modal */}
      <Modal
        open={Boolean(stockTarget)}
        onClose={() => setStockTarget(null)}
        title={stockTarget ? `Ajustar Stock · ${stockTarget.name}` : ''}
        subtitle="Cada ajuste queda registrado en el Kardex con motivo obligatorio"
        maxWidthClass="max-w-md"
      >
        {stockTarget && (
          <form onSubmit={handleAdjustStock} className="space-y-4">
            <div className="rounded-xl border border-hairline bg-elevated p-3 text-xs">
              Stock actual:{' '}
              <strong className="font-mono text-joycyan">{stockTarget.stockDisponible}</strong> u.
              (Reservado: {stockTarget.stockReservado})
            </div>

            <div>
              <label htmlFor="stk-delta" className="block text-xs font-semibold text-ink">
                Cantidad a sumar o restar (ej. 10 ó -2)
              </label>
              <input
                id="stk-delta"
                type="number"
                required
                value={stockDelta}
                onChange={(e) => setStockDelta(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="stk-reason" className="block text-xs font-semibold text-ink">
                Motivo del movimiento
              </label>
              <input
                id="stk-reason"
                type="text"
                required
                minLength={4}
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-joycyan py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
            >
              Registrar Ajuste en Kardex
            </button>
          </form>
        )}
      </Modal>

      {/* Product Create/Edit Modal (Spacious Grouped Sections) */}
      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Editar: ${editingProduct.name}` : 'Nuevo Producto en Carta'}
        subtitle="Organiza nombre, precio, stock en tiempo real y fotografía optimizada"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joycyan">
              1. Identidad del Plato o Bebida
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Nombre</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="Ej. Chuflay Maracuyá Especial"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Categoría</label>
                <select
                  value={pCatId}
                  onChange={(e) => setPCatId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                >
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink">Descripción en Carta</label>
              <textarea
                rows={2}
                required
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Describe ingredientes clave, acompañamiento y presentación…"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joymagenta">
              2. Precio, Stock &amp; Etiquetas
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-ink">Precio (Bs.)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
                />
              </div>
              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-ink">Stock Inicial</label>
                  <input
                    type="number"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-ink">Alerta Mín.</label>
                <input
                  type="number"
                  required
                  value={pMinAlert}
                  onChange={(e) => setPMinAlert(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Prep. (min)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={pPrepMin}
                  onChange={(e) => setPPrepMin(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                  className="accent-joycyan"
                />
                <span>Destacado en Portada</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pHappyHour}
                  onChange={(e) => setPHappyHour(e.target.checked)}
                  className="accent-joymagenta"
                />
                <span>Aplica Happy Hour 2x1</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pVegan}
                  onChange={(e) => setPVegan(e.target.checked)}
                  className="accent-emerald-400"
                />
                <span>Opción Vegana</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pSpicy}
                  onChange={(e) => setPSpicy(e.target.checked)}
                  className="accent-amber-400"
                />
                <span>Picante</span>
              </label>
            </div>
          </div>

          <AdminMediaPicker
            label="3. Fotografía del Plato / Bebida"
            imageUrl={pImage}
            uploading={uploadingImage}
            onUploadFile={handleProductImageUpload}
            onChangeUrl={setPImage}
          />

          <button
            type="submit"
            disabled={uploadingImage}
            className="w-full rounded-xl bg-joymagenta py-3 text-sm font-bold text-white hover:bg-joymagenta-deep disabled:opacity-50"
          >
            {editingProduct ? 'Guardar Cambios del Producto' : 'Crear Producto en Carta'}
          </button>
        </form>
      </Modal>

      {/* Event Create / Edit Modal with Real Photo + Video Upload */}
      <Modal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title={editingEvent ? `Editar Evento · ${editingEvent.title}` : 'Nuevo Evento / Actividad Joy Ride'}
        subtitle="Paso a paso: datos de cartelera, punto en mapa y fotos/video MP4"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joycyan">
              1. Información del Evento
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Título del Evento</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={evTitle}
                  onChange={(e) => setEvTitle(e.target.value)}
                  placeholder="Ej. Noche de Rock & Chuflay 2x1"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Subtítulo corto</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={evSubtitle}
                  onChange={(e) => setEvSubtitle(e.target.value)}
                  placeholder="Ej. Música en vivo + Barra libre 2x1"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink">Descripción completa</label>
              <textarea
                rows={3}
                required
                minLength={8}
                value={evDesc}
                onChange={(e) => setEvDesc(e.target.value)}
                placeholder="Detalla qué incluye la actividad, horarios, beneficios y recomendaciones…"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joymagenta">
              2. Horario, Punto en Mapa &amp; Estilo
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Badge / Etiqueta</label>
                <input
                  type="text"
                  required
                  value={evBadge}
                  onChange={(e) => setEvBadge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Color acento</label>
                <select
                  value={evAccent}
                  onChange={(e) => setEvAccent(e.target.value as 'cyan' | 'magenta' | 'amber' | 'emerald')}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                >
                  <option value="magenta">Magenta Joy Ride</option>
                  <option value="cyan">Cian Eléctrico</option>
                  <option value="amber">Ámbar Happy Hour</option>
                  <option value="emerald">Esmeralda Sucre</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Punto Mapa Sucre</label>
                <select
                  value={evSpotId}
                  onChange={(e) => setEvSpotId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                >
                  {(mapSpotsList && mapSpotsList.length > 0
                    ? mapSpotsList.map((s) => ({ id: s.slug, name: s.name }))
                    : SUCRE_TOURIST_SPOTS
                  ).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Horario / Días</label>
                <input
                  type="text"
                  required
                  value={evSchedule}
                  onChange={(e) => setEvSchedule(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Ubicación visible</label>
                <input
                  type="text"
                  required
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
            </div>
          </div>

          <AdminMediaPicker
            label="3. Portada y Video Corto del Evento (opcional)"
            imageUrl={evImageUrl}
            uploading={uploadingMedia}
            onUploadFile={(f) => handleEventMediaUpload(f, 'image')}
            onChangeUrl={setEvImageUrl}
            videoUrl={evVideoUrl}
            onUploadVideo={(f) => handleEventMediaUpload(f, 'video')}
            onClearVideo={() => setEvVideoUrl('')}
          />

          <label className="flex items-center gap-2 rounded-xl border border-hairline bg-obsidian/55 px-3.5 py-2.5 text-xs text-ink">
            <input
              type="checkbox"
              checked={evNotify}
              onChange={(e) => setEvNotify(e.target.checked)}
              className="accent-joymagenta"
            />
            <span>Notificar por correo al Club de Suscriptores al publicar/activar</span>
          </label>

          <button
            type="submit"
            disabled={savingEvent || uploadingMedia}
            className="w-full rounded-xl bg-joymagenta py-3 text-sm font-bold text-white hover:bg-joymagenta-deep disabled:opacity-50"
          >
            {savingEvent
              ? 'Guardando…'
              : editingEvent
              ? 'Guardar Cambios del Evento'
              : 'Publicar Evento en Vivo'}
          </button>
        </form>
      </Modal>

      {/* Promotion Create / Edit Modal */}
      <Modal
        open={promoModalOpen}
        onClose={() => {
          setPromoModalOpen(false);
          setEditingPromo(null);
        }}
        title={editingPromo ? `Editar Promoción · ${editingPromo.title}` : 'Nueva Promoción Joy Ride'}
        subtitle="Aparece en Ritmo Joy Ride en Sucre al instante desde base de datos"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSavePromo} className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joycyan">
              1. Textos de la Promoción
            </p>
            <div>
              <label className="block text-xs font-semibold text-ink">Título</label>
              <input
                type="text"
                required
                minLength={3}
                value={prTitle}
                onChange={(e) => setPrTitle(e.target.value)}
                placeholder="Ej. Miércoles de Chuflay & Alitas BBQ"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink">Subtítulo corto</label>
              <input
                type="text"
                required
                minLength={3}
                value={prSubtitle}
                onChange={(e) => setPrSubtitle(e.target.value)}
                placeholder="Ej. 2x1 en Chuflays + Porción de alitas a precio especial"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink">Descripción completa</label>
              <textarea
                rows={3}
                required
                minLength={8}
                value={prDesc}
                onChange={(e) => setPrDesc(e.target.value)}
                placeholder="Condiciones, tragos incluidos, horario en local y pedidos online…"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joymagenta">
              2. Etiqueta, Horario &amp; Descuento
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-ink">Badge</label>
                <input
                  type="text"
                  required
                  value={prBadge}
                  onChange={(e) => setPrBadge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Horario</label>
                <input
                  type="text"
                  required
                  value={prSchedule}
                  onChange={(e) => setPrSchedule(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Descuento (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={prDiscount}
                  onChange={(e) => setPrDiscount(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-ink sm:text-sm"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 pt-1 text-xs text-ink">
              <input
                type="checkbox"
                checked={prActive}
                onChange={(e) => setPrActive(e.target.checked)}
                className="accent-joycyan"
              />
              <span>Visible en la portada pública</span>
            </label>
          </div>

          <AdminMediaPicker
            label="3. Fotografía de la Promoción"
            imageUrl={prImageUrl}
            uploading={uploadingPromoImg}
            onUploadFile={handlePromoImgUpload}
            onChangeUrl={setPrImageUrl}
          />

          <button
            type="submit"
            disabled={savingPromo || uploadingPromoImg}
            className="w-full rounded-xl bg-joycyan py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
          >
            {savingPromo
              ? 'Guardando…'
              : editingPromo
              ? 'Guardar Cambios de Promoción'
              : 'Publicar Promoción en Portada'}
          </button>
        </form>
      </Modal>

      {/* Map Spot Create / Edit Modal with Real Interactive Leaflet Picker */}
      <Modal
        open={mapSpotModalOpen}
        onClose={() => {
          setMapSpotModalOpen(false);
          setEditingSpot(null);
        }}
        title={editingSpot ? `Editar Punto Mapa · ${editingSpot.name}` : 'Nuevo Punto en Mapa Sucre'}
        subtitle="Ubica el marcador directamente en el mapa real de Sucre y personaliza su ficha turística"
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleSaveMapSpot} className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joycyan">
              1. Nombre &amp; Categoría en Guía Sucre
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Nombre del Lugar</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={spName}
                  onChange={(e) => setSpName(e.target.value)}
                  placeholder="Ej. Café Mirador San Lázaro"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Categoría</label>
                <select
                  value={spCat}
                  onChange={(e) => setSpCat(e.target.value as typeof spCat)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                >
                  <option value="JOYRIDE">JOYRIDE (Punto Base)</option>
                  <option value="BARES_NOCHE">BARES_NOCHE (Bares &amp; Terrazas)</option>
                  <option value="CHOCOLATE_GASTRO">CHOCOLATE_GASTRO (Chocolates &amp; Comida)</option>
                  <option value="CULTURA">CULTURA (Museos &amp; Iglesias)</option>
                  <option value="MIRADOR">MIRADOR (Miradores &amp; Parques)</option>
                  <option value="AVENTURA">AVENTURA (Bike &amp; Tours)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Real Interactive Leaflet Map Location Picker */}
          <AdminLocationPicker
            lat={spLat}
            lng={spLng}
            onChange={(picked) => {
              setSpLat(picked.lat);
              setSpLng(picked.lng);
              if (picked.suggestedAddress && !editingSpot) {
                setSpAddress(picked.suggestedAddress);
              } else if (picked.suggestedAddress && (!spAddress.trim() || spAddress === 'Centro Histórico, Sucre')) {
                setSpAddress(picked.suggestedAddress);
              }
              if (picked.suggestedWalkTime) {
                setSpWalkTime(picked.suggestedWalkTime);
              }
            }}
          />

          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian/55 p-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-joymagenta">
              2. Dirección, Horarios &amp; Detalles
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-ink">Dirección en Sucre</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={spAddress}
                  onChange={(e) => setSpAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Distancia / Tiempo</label>
                <input
                  type="text"
                  required
                  value={spWalkTime}
                  onChange={(e) => setSpWalkTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base font-mono text-joycyan sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink">Horario de atención</label>
                <input
                  type="text"
                  required
                  value={spHours}
                  onChange={(e) => setSpHours(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  value={spHighlightsText}
                  onChange={(e) => setSpHighlightsText(e.target.value)}
                  placeholder="Vista 360, Café Artesanal, Ruta Nocturna"
                  className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Descripción / Historia</label>
              <textarea
                rows={2}
                required
                minLength={8}
                value={spSummary}
                onChange={(e) => setSpSummary(e.target.value)}
                placeholder="Qué encuentra el visitante o turista en este punto de Sucre…"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink">Tip Joy Ride</label>
              <input
                type="text"
                value={spTip}
                onChange={(e) => setSpTip(e.target.value)}
                placeholder="Ej. Pasa antes del sunset y baja a Nicolás Ortiz 14."
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <AdminMediaPicker
            label="3. Fotografía del Lugar"
            imageUrl={spImageUrl}
            uploading={uploadingSpotImg}
            onUploadFile={handleSpotImgUpload}
            onChangeUrl={setSpImageUrl}
          />

          <button
            type="submit"
            disabled={savingSpot || uploadingSpotImg}
            className="w-full rounded-xl bg-joycyan py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
          >
            {savingSpot
              ? 'Guardando punto…'
              : editingSpot
              ? 'Guardar Cambios en Mapa'
              : 'Publicar Punto en Mapa Sucre'}
          </button>
        </form>
      </Modal>

      <OrderTimelineModal
        orderId={timelineOrderId}
        onClose={() => setTimelineOrderId(null)}
      />

      <ReceiptPrintModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </OperationsLayout>
  );
}
