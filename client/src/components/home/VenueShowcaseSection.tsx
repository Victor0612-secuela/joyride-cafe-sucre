import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bike,
  ChevronLeft,
  ChevronRight,
  Eye,
  Images,
  MapPin,
  Pause,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../../lib/format';
import { joySound } from '../../lib/sound';
import { Product } from '../../types';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import { BrandWatermarkBg } from '../ui/BrandWatermarkBg';
import { EditorialSplitModal } from '../ui/EditorialSplitModal';
import { JoyRideHeritageLockup } from '../ui/JoyRideHeritageLockup';
import { ProbablyTagline } from '../ui/ProbablyTagline';

interface VenuePhotoSlide {
  src: string;
  tag: string;
  title: string;
  caption: string;
}

const VENUE_REEL: VenuePhotoSlide[] = [
  {
    src: '/images/joyride-official-portada.webp',
    tag: 'SALÓN & CHIMENEA',
    title: 'La casona histórica frente a la Catedral Metropolitana',
    caption:
      'Más de 25 años de mesas cálidas, cuadros históricos y nuestro icónico letrero de bicicleta en Nicolás Ortiz N° 14.',
  },
  {
    src: '/images/venue-patio-night.webp',
    tag: 'PATIO COLONIAL',
    title: 'Noches cálidas frente a la Catedral Metropolitana',
    caption:
      'Faroles coloniales, casona de dos niveles y barra de patio abierta hasta las 02:30 AM.',
  },
  {
    src: '/images/joyride-friends-night.webp',
    tag: 'COCTELERÍA & BAR',
    title: 'Singani Chuflay, The Hulk, Cucarachas y Chopps bien fríos',
    caption:
      'Barra clásica en Nicolás Ortiz N° 14 con Happy Hour 2x1 todos los días de 18:00 a 21:00.',
  },
  {
    src: '/images/musica-vivo.webp',
    tag: 'MÚSICA EN VIVO',
    title: 'Rock, DJs invitados y vibra internacional en Sucre',
    caption:
      'Locales, universitarios y viajeros de todo el mundo compartiendo mesa desde 2001.',
  },
  {
    src: '/images/venue-lounge-lights.webp',
    tag: 'PISTA & MEZZANINE',
    title: 'Clases gratis de Salsa & Bachata bajo bola de espejos',
    caption:
      'Martes, jueves y sábados desde las 18:00: ven a aprender desde cero y quédate a la fiesta.',
  },
  {
    src: '/images/joyride-evento-3.webp',
    tag: 'BRINDIS & AMIGOS',
    title: 'Tu punto de encuentro en el centro histórico',
    caption:
      'Tablas para compartir, pizzas artesanales, picadas de bar y la mejor energía de la Ciudad Blanca.',
  },
  {
    src: '/images/joyride-evento-2.webp',
    tag: 'CELEBRACIONES',
    title: 'Cumpleaños, postres flambeados y noches memorables',
    caption:
      'Arma tu reserva para grupos y celebra en nuestro patio colonial o mezzanine.',
  },
  {
    src: '/images/evento-tours.webp',
    tag: 'BIKE & AVENTURA',
    title: 'Punto de partida hacia Maragua y Cordillera de los Frailes',
    caption:
      'Desayuna temprano antes de salir con tu grupo de trekking o mountain bike.',
  },
];

interface VenueShowcaseSectionProps {
  featuredProducts: Product[];
  loading: boolean;
  onQuickView: (product: Product) => void;
}

export function VenueShowcaseSection({
  featuredProducts,
  loading,
  onQuickView,
}: VenueShowcaseSectionProps) {
  const { t } = useI18n();
  const { currency, addItem } = useCart();
  const { pushToast } = useToast();

  const [reelIndex, setReelIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    if (!autoPlay || galleryOpen) return;
    const timer = setInterval(() => {
      setReelIndex((prev) => (prev + 1) % VENUE_REEL.length);
    }, 3400);
    return () => clearInterval(timer);
  }, [autoPlay, galleryOpen]);

  const currentSlide = VENUE_REEL[reelIndex];

  const handleQuickAdd = (prod: Product) => {
    const res = addItem(prod, 1);
    if (!res.ok) {
      pushToast(t('Límite de stock alcanzado', 'Stock limit reached'), 'error', res.reason);
      return;
    }
    joySound.add();
    pushToast(
      t('Agregado a tu pedido', 'Added to your order'),
      'success',
      `${prod.name} · ${formatPrice(prod.precioBs, currency, prod.precioUsd)}`
    );
  };

  return (
    <section className="relative overflow-hidden border-y border-hairline bg-surface/45 py-16 sm:py-24">
      <BrandWatermarkBg
        variant="editorial"
        bgImage="/images/joyride-official-portada.webp"
        emblemSide="left"
      />

      <div className="relative z-10 mx-auto max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
        {/* Historia + Letrero Catedral sin recortes + Patio */}
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
            className="lg:col-span-5"
          >
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl xl:text-5xl">
              {t(
                '25 años de chimenea, montaña y noches en Sucre',
                '25 years of hearth, mountains & Sucre nights'
              )}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted sm:text-lg">
              {t(
                'Nacido en 2001 a media cuadra de la Plaza 25 de Mayo, Joy Ride Café® reunió en una sola casona colonial los desayunos de viajeros, descensos en mountain bike por la Cordillera de los Frailes, gastronomía boliviana y una pista multicultural.',
                'Born in 2001 half a block from Plaza 25 de Mayo, Joy Ride Café® brings together traveler breakfasts, mountain bike descents in Cordillera de los Frailes, Bolivian cuisine and a vibrant multicultural dance floor.'
              )}
            </p>

            <div className="mt-7 space-y-3.5 border-t border-hairline pt-6 text-sm sm:text-base">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-joycyan" />
                <div>
                  <p className="font-semibold text-ink">Calle Nicolás Ortiz N° 14, Sucre</p>
                  <p className="text-sm text-muted">Frente a la Catedral Metropolitana · Tel. 4 6425544</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Bike className="mt-0.5 h-5 w-5 shrink-0 text-joymagenta" />
                <div>
                  <p className="font-semibold text-ink">Mountain Bike &amp; Adventure Hub</p>
                  <p className="text-sm text-muted">
                    {t(
                      'Desayunos energéticos desde las 07:00 AM y rutas a Maragua',
                      'Early rider breakfasts from 07:00 AM and Maragua bike tours'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-hairline bg-obsidian/55 p-4">
              <JoyRideHeritageLockup className="h-16 w-auto shrink-0 sm:h-20" />
              <div className="text-xs leading-relaxed text-muted">
                <p className="font-display text-sm font-bold text-ink">
                  Sello Original Desde 2001
                </p>
                <p className="mt-0.5">
                  &ldquo;No solo para gringos — Probably the Best Bar in Town®&rdquo; en el corazón de Sucre.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
            className="grid grid-cols-12 gap-5 lg:col-span-7"
          >
            <div className="col-span-12 overflow-hidden rounded-2xl border border-hairline bg-black sm:col-span-7">
              <img
                src="/images/sucre-catedral.webp"
                alt="Letrero oficial [NO SOLO PARA GRINGOS ®] de Joy Ride Café frente a la Catedral de Sucre"
                className="photo-frame h-56 w-full object-contain bg-black sm:h-64"
              />
              <div className="border-t border-white/10 bg-surface p-4">
                <p className="font-mono text-xs font-bold text-joycyan">
                  [NO SOLO PARA GRINGOS ®] · NICOLÁS ORTIZ N° 14
                </p>
                <p className="mt-1 text-xs text-muted">
                  “El único lugar donde puedes empezar el día con un Desayuno de Cha&apos;ki y
                  terminar bailando bachata bajo la bola de espejos.”
                </p>
              </div>
            </div>
            <div className="col-span-12 flex flex-col gap-5 sm:col-span-5">
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/images/venue-patio-night.webp"
                  alt="Patio colonial nocturno en Joy Ride Café Sucre"
                  className="photo-frame h-48 w-full object-cover sm:h-52"
                />
              </div>
              <div className="overflow-hidden rounded-2xl">
                <img
                  src="/images/venue-bar-cocktails.webp"
                  alt="Barra y cócteles de Joy Ride Café Sucre"
                  className="photo-frame h-40 w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Galería en Movimiento del Local (Reproductor de Fotos + Mosaico) */}
        <div className="mt-14 rounded-3xl border border-hairline bg-surface p-5 shadow-elevated sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <ProbablyTagline
                subject="Patio"
                accent="cyan"
                size="sm"
                spanishHint={t('Recorrido visual por la casona', 'Visual tour inside the venue')}
              />
              <h3 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                {t('Así se vive Joy Ride por dentro', 'Life Inside Joy Ride Café®')}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  joySound.click();
                  setAutoPlay((p) => !p);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-obsidian px-3.5 py-2 text-xs font-semibold text-ink hover:border-joycyan"
              >
                {autoPlay ? <Pause className="h-3.5 w-3.5 text-joymagenta" /> : <Play className="h-3.5 w-3.5 text-joycyan" />}
                <span>{autoPlay ? t('Pausar pase', 'Pause reel') : t('Reproducir', 'Play reel')}</span>
              </button>
              <button
                type="button"
                onClick={() => setGalleryOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-joycyan px-3.5 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
              >
                <Images className="h-3.5 w-3.5" />
                <span>{t('Ver Galería Completa', 'Full Gallery')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Active Auto-Playing Stage (Left 7 Cols) */}
            <div
              onClick={() => setGalleryOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setGalleryOpen(true);
              }}
              className="photo-overlay group relative h-[320px] cursor-pointer overflow-hidden rounded-2xl bg-black sm:h-[380px] lg:col-span-7"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSlide.src}
                  src={currentSlide.src}
                  alt={currentSlide.title}
                  initial={{ opacity: 0.35, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.35 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full object-cover"
                />
              </AnimatePresence>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 px-14 pb-5 pt-5 sm:px-16 sm:pb-7">
                <span className="inline-block rounded-full bg-joymagenta px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                  {currentSlide.tag}
                </span>
                <h4 className="mt-2 font-display text-xl font-extrabold text-white sm:text-2xl">
                  {currentSlide.title}
                </h4>
                <p className="mt-1 max-w-xl text-xs text-slate-200 sm:text-sm">
                  {currentSlide.caption}
                </p>
              </div>

              <button
                type="button"
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation();
                  joySound.slide();
                  setReelIndex((i) => (i - 1 + VENUE_REEL.length) % VENUE_REEL.length);
                }}
                className="absolute left-3 top-[38%] -translate-y-1/2 rounded-full border border-white/25 bg-black/65 p-2 text-white backdrop-blur-md hover:border-joycyan"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Siguiente foto"
                onClick={(e) => {
                  e.stopPropagation();
                  joySound.slide();
                  setReelIndex((i) => (i + 1) % VENUE_REEL.length);
                }}
                className="absolute right-3 top-[38%] -translate-y-1/2 rounded-full border border-white/25 bg-black/65 p-2 text-white backdrop-blur-md hover:border-joycyan"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 2x4 Visual Thumbnail Grid of Real Venue Spaces (Right 5 Cols) */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-5 lg:grid-cols-2">
              {VENUE_REEL.map((slide, idx) => {
                const active = idx === reelIndex;
                return (
                  <button
                    key={slide.src}
                    type="button"
                    onClick={() => {
                      joySound.slide();
                      setReelIndex(idx);
                    }}
                    className={`photo-overlay group relative h-24 overflow-hidden rounded-xl border text-left transition-all sm:h-28 ${
                      active
                        ? 'border-joycyan ring-2 ring-joycyan/45'
                        : 'border-hairline opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={slide.src}
                      alt={slide.tag}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <span className="absolute bottom-2 left-2.5 right-2 truncate font-mono text-[10px] font-bold text-white">
                      {slide.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Favoritos de la Casa (Compact 4-card teaser — full menu lives in /carta!) */}
        <div className="mt-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <ProbablyTagline
                subject="Combos"
                accent="magenta"
                size="sm"
                spanishHint={t('Favoritos de Cocina & Barra', 'Kitchen & Bar Favorites')}
              />
              <h3 className="mt-1 font-display text-2xl font-extrabold text-ink sm:text-3xl">
                {t('Favoritos listos para pedir ahora', 'House Picks Ready to Order')}
              </h3>
            </div>

            <Link
              to="/carta"
              onClick={() => joySound.click()}
              className="inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-joymagenta px-6 py-3 text-sm font-extrabold text-white shadow-card transition-transform hover:scale-[1.02] hover:bg-joymagenta-deep"
            >
              <span>{t('Ver Carta Completa (Platos y Barra)', 'Explore Full Menu')}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {!loading && featuredProducts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.slice(0, 4).map((prod) => (
                <div
                  key={prod.id}
                  className="card-glow-cyan group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-surface p-3.5 shadow-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-obsidian">
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="photo-frame h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                    <span className="photo-overlay absolute bottom-2 right-2 rounded-md bg-black/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-white backdrop-blur-md">
                      {prod.stockDisponible} {t('disp.', 'left')}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-1 flex-col justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-joycyan">
                        {prod.category.name}
                      </p>
                      <h4 className="mt-1 line-clamp-1 font-display text-base font-bold text-ink">
                        {prod.name}
                      </h4>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{prod.description}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3">
                      <AnimatedPrice
                        bs={prod.precioBs}
                        usd={prod.precioUsd}
                        className="font-mono text-base font-extrabold text-ink"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onQuickView(prod)}
                          aria-label={`Ver ${prod.name}`}
                          className="rounded-lg border border-hairline bg-obsidian p-2 text-ink hover:border-joycyan"
                        >
                          <Eye className="h-4 w-4 text-joycyan" />
                        </button>
                        <button
                          type="button"
                          disabled={prod.stockDisponible <= 0}
                          onClick={() => handleQuickAdd(prod)}
                          className="inline-flex items-center gap-1 rounded-lg bg-joycyan px-3 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-45"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>{t('Pedir', 'Add')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Split de Galería Completa del Local */}
      <EditorialSplitModal
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="Joy Ride Café® — Nicolás Ortiz N° 14"
        subtitle={t(
          'Patio colonial, barra de coctelería, chimenea, Salsa & Bachata y montaña',
          'Colonial patio, cocktail bar, hearth, Salsa & Bachata nights & adventure hub'
        )}
        badge="AMBIENTE REAL EN SUCRE"
        accent="magenta"
        images={VENUE_REEL.map((v) => v.src)}
      >
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-ink/90 sm:text-base">
            Desde 2001 frente a la Catedral Metropolitana de Sucre, nuestra casona combina patio
            abierto con faroles, salón interior con chimenea, mezzanine panorámico y pista con bola
            de espejos hasta las 02:30 AM.
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {VENUE_REEL.slice(0, 4).map((v) => (
              <div key={v.tag} className="rounded-xl border border-hairline bg-obsidian p-3 text-xs">
                <p className="font-mono font-bold text-joycyan">{v.tag}</p>
                <p className="mt-1 text-muted">{v.title}</p>
              </div>
            ))}
          </div>
          <Link
            to="/carta"
            onClick={() => {
              joySound.click();
              setGalleryOpen(false);
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-sm font-bold text-white hover:bg-joymagenta-deep"
          >
            <span>{t('Ir a la Carta Completa', 'Explore Full Menu')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </EditorialSplitModal>
    </section>
  );
}
