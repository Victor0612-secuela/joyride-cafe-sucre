import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, ExternalLink, Mail, MapPin, Phone, Send } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { JOYRIDE_LOCATION } from '../lib/constants';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useOrderStream } from '../hooks/useOrderStream';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { Category, Product, Promotion } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { HeroFullBleed } from '../components/home/HeroFullBleed';
import { BentoPromotions } from '../components/home/BentoPromotions';
import { VenueShowcaseSection } from '../components/home/VenueShowcaseSection';
import { SucreEventsTourismCarousel } from '../components/home/SucreEventsTourismCarousel';
import { MasonryCommunity } from '../components/home/MasonryCommunity';
import { ProductQuickViewModal } from '../components/modals/ProductQuickViewModal';
import { CartCheckoutDrawer } from '../components/modals/CartCheckoutDrawer';
import { QrLivePaymentModal, QrSessionData } from '../components/modals/QrLivePaymentModal';
import { OrderTimelineModal } from '../components/modals/OrderTimelineModal';
import { ReservationModal } from '../components/modals/ReservationModal';
import { BrandWatermarkBg } from '../components/ui/BrandWatermarkBg';
import { JoyRideHeritageLockup } from '../components/ui/JoyRideHeritageLockup';
import { PwaInstallButton } from '../components/ui/PwaInstallButton';
import { WhatsAppFloat } from '../components/ui/WhatsAppFloat';
import { useCart } from '../context/CartContext';

export function HomePage() {
  useDocumentTitle('Joy Ride Café® — Sucre, Bolivia | No Solo Para Gringos');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setDrawerOpen } = useCart();

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [qrSession, setQrSession] = useState<QrSessionData | null>(null);
  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [reservationOpen, setReservationOpen] = useState(() => searchParams.get('reservar') === '1');
  const [reservationSalsa, setReservationSalsa] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subLoading, setSubLoading] = useState(false);
  const { t } = useI18n();
  const { pushToast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email: subEmail.trim() });
      pushToast(
        t('¡Suscrito a Novedades Joy Ride!', 'Subscribed to Joy Ride Updates!'),
        'success',
        t(
          'Recibirás promos 2x1, cartelera de Salsa y novedades en tu correo',
          'You will receive 2x1 promos, Salsa nights & updates by email'
        )
      );
      setSubEmail('');
    } catch (err) {
      pushToast(t('No se pudo suscribir', 'Subscription failed'), 'error', getErrorMessage(err));
    } finally {
      setSubLoading(false);
    }
  };

  useOrderStream({ enabled: true });

  useEffect(() => {
    if (searchParams.get('reservar') === '1') {
      setReservationOpen(true);
      searchParams.delete('reservar');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get<{ categories: Category[] }>('/categories');
      return res.data.categories;
    },
  });

  const { data: allProductsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get<{ products: Product[] }>('/products');
      return res.data.products;
    },
  });

  const { data: promotionsData } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await api.get<{ promotions: Promotion[] }>('/promotions');
      return res.data.promotions;
    },
  });

  const allProducts = allProductsData || [];
  const featuredProducts = allProducts.filter((p) => p.esDestacado);

  return (
    <div className="min-h-screen bg-obsidian text-ink">
      <Navbar
        categories={categoriesData || []}
        onOpenReservation={() => {
          setReservationSalsa(false);
          setReservationOpen(true);
        }}
      />

      <main>
        <HeroFullBleed
          onOpenCart={() => setDrawerOpen(true)}
          onOpenReservation={() => {
            setReservationSalsa(false);
            setReservationOpen(true);
          }}
        />

        <BentoPromotions
          loading={productsLoading}
          products={allProducts}
          promotions={promotionsData || []}
          onFilterHappyHour={() => navigate('/carta?happyHour=1')}
          onFilterVegan={() => navigate('/carta?vegan=1')}
          onQuickView={(prod) => setQuickViewProduct(prod)}
          onOpenSalsaReservation={() => {
            setReservationSalsa(true);
            setReservationOpen(true);
          }}
        />

        <VenueShowcaseSection
          featuredProducts={featuredProducts}
          loading={productsLoading}
          onQuickView={(prod) => setQuickViewProduct(prod)}
        />

        <SucreEventsTourismCarousel
          onOpenReservation={() => {
            setReservationSalsa(false);
            setReservationOpen(true);
          }}
        />

        <MasonryCommunity
          products={allProducts}
          onOpenReservation={() => {
            setReservationSalsa(false);
            setReservationOpen(true);
          }}
        />
      </main>

      <footer className="relative overflow-hidden border-t border-white/10 bg-obsidian pb-24 pt-16 sm:pt-20">
        <BrandWatermarkBg variant="subtle-emblem" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-joycyan/60 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
          <div className="grid grid-cols-1 gap-12 border-b border-hairline pb-12 lg:grid-cols-12">
            {/* Editorial Brand Statement */}
            <div className="space-y-5 lg:col-span-5">
              <div className="flex flex-wrap items-center gap-4">
                <img
                  src="/logo-joyride.png"
                  alt="Joy Ride Café"
                  className="h-20 w-20 rounded-full object-contain ring-2 ring-joycyan/30 sm:h-24 sm:w-24"
                />
                <JoyRideHeritageLockup className="h-16 w-auto opacity-90 sm:h-20" />
                <div>
                  <p className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                    JOY RIDE CAFÉ® <span className="text-joycyan">SUCRE</span>
                  </p>
                  <p className="text-sm text-muted">
                    &ldquo;No solo para gringos — Probably the best bar in town&rdquo;
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p className="flex items-center gap-2 text-joycyan">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{JOYRIDE_LOCATION.address}</span>
                </p>
                <p className="font-mono text-xs text-muted">
                  Lun–Dom 07:00 – 02:30 AM · Happy Hour 18:00 – 21:00 · Salsa Mar/Jue/Sáb
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
                <a
                  href={`https://wa.me/${JOYRIDE_LOCATION.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  <Phone className="h-4 w-4" />
                  <span>WhatsApp {JOYRIDE_LOCATION.whatsappDisplay}</span>
                </a>
                <span className="text-hairline">•</span>
                <Link
                  to="/mapa-sucre"
                  className="inline-flex items-center gap-1.5 font-semibold text-joycyan transition-colors hover:underline"
                >
                  <Compass className="h-4 w-4" />
                  <span>Guía &amp; Mapa Sucre</span>
                </Link>
              </div>

              <div className="pt-1">
                <PwaInstallButton />
              </div>
            </div>

            {/* Minimal Icon Social Presence */}
            <div className="space-y-4 lg:col-span-3">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted">
                Conecta con el Local
              </p>
              <ul className="space-y-2.5 text-sm font-semibold">
                <li>
                  <a
                    href={JOYRIDE_LOCATION.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 text-ink transition-colors hover:text-joymagenta"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-joymagenta" aria-hidden="true">
                      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
                    </svg>
                    <span>Instagram @joyridecafe</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  </a>
                </li>
                <li>
                  <a
                    href={JOYRIDE_LOCATION.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 text-ink transition-colors hover:text-joycyan"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-joycyan" aria-hidden="true">
                      <path d="M13.5 9H16V6h-2.5C11.57 6 10 7.57 10 9.5V11H8v3h2v7h3v-7h2.3l.7-3H13V9.5c0-.28.22-.5.5-.5Z" />
                    </svg>
                    <span>Facebook Joy Ride Sucre</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  </a>
                </li>
                <li>
                  <a
                    href={JOYRIDE_LOCATION.tiktokUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 text-ink transition-colors hover:text-joymagenta"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-pink-300" aria-hidden="true">
                      <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48Z" />
                    </svg>
                    <span>TikTok @joyridecafe</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  </a>
                </li>
                <li>
                  <a
                    href={JOYRIDE_LOCATION.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-3 text-ink transition-colors hover:text-joycyan"
                  >
                    <Compass className="h-4 w-4 text-joycyan" />
                    <span>www.joyridebol.com</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Editorial Newsletter Club */}
            <div className="space-y-4 lg:col-span-4">
              <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-joymagenta">
                <Mail className="h-4 w-4" />
                <span>{t('Club Nocturno & Happy Hour', 'Night Club & Happy Hour')}</span>
              </p>
              <p className="text-sm leading-relaxed text-muted">
                {t(
                  'Suscríbete para recibir cartelera semanal de Salsa & Bachata, cócteles de temporada y promos 2x1 directo a tu bandeja.',
                  'Subscribe for weekly Salsa & Bachata schedules, craft cocktails, and 2x1 promos delivered to your inbox.'
                )}
              </p>
              <form
                onSubmit={handleSubscribe}
                className="flex items-center overflow-hidden rounded-2xl border border-hairline bg-surface p-1.5 focus-within:border-joycyan"
              >
                <input
                  type="email"
                  required
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  aria-label="Correo para novedades Joy Ride"
                  className="min-w-0 flex-1 bg-transparent px-3.5 py-2 text-base text-ink placeholder:text-muted focus:outline-none sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-joymagenta px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-joymagenta-deep disabled:opacity-60 sm:text-sm"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{t('Unirme', 'Join')}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <p className="font-mono">
              © 2001 – 2026 JOY RIDE CAFÉ® · Sucre, Chuquisaca, Bolivia
            </p>
            <p className="font-mono">
              Calle Nicolás Ortiz N° 14 · Probably the best bar in town
            </p>
          </div>
        </div>
      </footer>

      <WhatsAppFloat />

      {/* Modals & Checkout Drawer */}
      <ProductQuickViewModal
        product={quickViewProduct}
        allProducts={allProducts}
        onClose={() => setQuickViewProduct(null)}
      />

      <CartCheckoutDrawer
        onQrStarted={(session) => setQrSession(session)}
        onOrderCreated={(orderId) => setTimelineOrderId(orderId)}
      />

      <QrLivePaymentModal
        session={qrSession}
        onClose={() => setQrSession(null)}
        onConfirmed={(orderId) => {
          setQrSession(null);
          setTimelineOrderId(orderId);
        }}
      />

      <OrderTimelineModal
        orderId={timelineOrderId}
        onClose={() => setTimelineOrderId(null)}
      />

      <ReservationModal
        open={reservationOpen}
        defaultSalsa={reservationSalsa}
        onClose={() => setReservationOpen(false)}
      />
    </div>
  );
}
