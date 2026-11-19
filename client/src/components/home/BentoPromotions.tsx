import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Clock,
  Compass,
  Flame,
  Leaf,
  Maximize2,
  Music,
  Package,
  Plus,
  Sparkles,
} from 'lucide-react';
import { getSucreStatusInfo } from '../../lib/format';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../context/I18nContext';
import { joySound } from '../../lib/sound';
import { Product, Promotion } from '../../types';
import { BentoGridSkeleton } from '../ui/Skeleton';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import { EditorialSplitModal } from '../ui/EditorialSplitModal';

interface BentoPromotionsProps {
  loading: boolean;
  products: Product[];
  promotions: Promotion[];
  onFilterHappyHour: () => void;
  onFilterVegan: () => void;
  onQuickView: (product: Product) => void;
  onOpenSalsaReservation: () => void;
}

type SpotlightTileId = 'happyhour' | 'salsa' | 'vegan';

function formatCountdown(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function BentoPromotions({
  loading,
  products,
  promotions,
  onFilterHappyHour,
  onFilterVegan,
  onQuickView,
  onOpenSalsaReservation,
}: BentoPromotionsProps) {
  const { addItem } = useCart();
  const { pushToast } = useToast();
  const { t } = useI18n();
  const [clock, setClock] = useState(() => getSucreStatusInfo());
  const [expandedTile, setExpandedTile] = useState<SpotlightTileId | null>(null);

  useEffect(() => {
    const id = setInterval(() => setClock(getSucreStatusInfo()), 1000);
    return () => clearInterval(id);
  }, []);

  const featuredHouse =
    products.find((p) => p.slug === 'picante-mixto-joyride') ||
    products.find((p) => p.esDestacado) ||
    products[0];

  const lowStockSpecial = products.find((p) => p.slug === 'filete-trucha-quinua');
  const dessert2x1 = products.find((p) => p.slug === 'brownie-volcan-2x1');

  const happyHourItems = products.filter((p) => p.enHappyHour && p.stockDisponible > 0);
  const veganItems = products.filter((p) => p.esVegano && p.stockDisponible > 0);
  const salsaCombo = products.find((p) => p.slug === 'combo-salsa-bachata');

  const promoHappy = promotions.find((p) => p.slug.includes('happy') || p.discountPercent >= 40);
  const promoSalsa = promotions.find((p) => p.slug.includes('salsa'));

  const handleQuickAdd = (prod: Product) => {
    const res = addItem(prod, 1);
    if (!res.ok) {
      pushToast(t('Sin más unidades disponibles', 'No more units available'), 'error', res.reason);
      return;
    }
    joySound.add();
    pushToast(t('Añadido a tu pedido', 'Added to order'), 'success', prod.name);
  };

  return (
    <section
      id="happy-hour-bento"
      className="mx-auto max-w-[1640px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12 xl:px-14"
    >
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl xl:text-5xl">
            {t('Ritmo Joy Ride en Sucre', 'Joy Ride Rhythm in Sucre')}
          </h2>
          <p className="mt-2.5 max-w-2xl text-base text-muted sm:text-lg">
            {t(
              'Promociones vivas desde nuestra cocina y barra, eventos nocturnos y disponibilidad al instante.',
              'Live promotions straight from kitchen and bar, nightly dance events, and real-time availability.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/mapa-sucre"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-joymagenta/45 bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-joymagenta hover:text-joymagenta"
          >
            <Compass className="h-4 w-4 text-joymagenta" />
            <span>{t('Mapa Turístico Sucre', 'Sucre City Map')}</span>
          </Link>
          <Link
            to="/mis-pedidos"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-joycyan/60 hover:text-joycyan"
          >
            <Package className="h-4 w-4 text-joycyan" />
            <span>{t('Rastrear mi Pedido', 'Track My Order')}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <BentoGridSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
          className="grid grid-cols-1 gap-5 lg:grid-cols-12"
        >
          {/* Card 1: Happy Hour 2x1 Tile */}
          <div
            onClick={() => setExpandedTile('happyhour')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setExpandedTile('happyhour');
            }}
            className="photo-overlay card-glow-magenta group relative flex min-h-[340px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-black p-6 shadow-card hover:-translate-y-1 sm:p-8 lg:col-span-6 lg:row-span-2"
          >
            <img
              src={promoHappy?.imageUrl || '/images/experiencia-bar.webp'}
              alt="Barra y cócteles Happy Hour 2x1 en Joy Ride Café"
              className="photo-frame absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/60 to-black/35" />

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-joymagenta px-3.5 py-1.5 text-xs font-bold text-white shadow-card">
                <Sparkles className="h-3.5 w-3.5" />
                {promoHappy?.badgeText || 'HAPPY HOUR 2x1'}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/75 px-3 py-1.5 font-mono text-xs tabular-nums text-joycyan">
                  <Clock className="h-3.5 w-3.5" />
                  {clock.isHappyHour ? t('Termina en ', 'Ends in ') : t('Comienza en ', 'Starts in ')}
                  {formatCountdown(clock.happyHourCountdownSeconds)}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/65 text-slate-200 transition-colors group-hover:border-joymagenta group-hover:text-joymagenta">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

            <div className="relative z-10 mt-12">
              <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl xl:text-4xl">
                {promoHappy?.title || 'Cervezas Artesanales, Chuflays & Mojitos al 2x1'}
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-200 sm:text-base">
                {promoHappy?.description ||
                  'Todos los días de 18:00 a 21:00 en nuestra casona de Nicolás Ortiz N° 14 y directo en tu carrito digital.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterHappyHour();
                    document.getElementById('carta-joyride')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-joymagenta px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-joymagenta-deep active:scale-[0.96]"
                >
                  <span>{t('Ver Ítems 2x1 en Carta', 'Filter 2x1 Items')}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
                <span className="text-xs font-semibold text-joycyan group-hover:underline">
                  {t('Ver catálogo 2x1 →', 'View 2x1 selection →')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Live Stock Featured Dish */}
          {featuredHouse && (
            <div
              onClick={() => onQuickView(featuredHouse)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onQuickView(featuredHouse);
              }}
              className="card-glow-cyan group cursor-pointer overflow-hidden rounded-2xl border border-hairline bg-surface p-5 shadow-card hover:-translate-y-1 lg:col-span-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-joycyan">
                  <Flame className="h-3.5 w-3.5" />
                  {t('Disponible hoy', 'Fresh Today')}
                </span>
                <span className="rounded-full border border-joycyan/40 bg-joycyan/15 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-joycyan">
                  {t(`Quedan ${featuredHouse.stockDisponible}`, `${featuredHouse.stockDisponible} left`)}
                </span>
              </div>

              <div className="mt-3 overflow-hidden rounded-xl">
                <img
                  src={featuredHouse.imageUrl}
                  alt={featuredHouse.name}
                  className="photo-frame h-40 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>

              <h3 className="mt-3.5 font-display text-lg font-bold text-ink sm:text-xl">
                {featuredHouse.name}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <AnimatedPrice
                  bs={featuredHouse.precioBs}
                  usd={featuredHouse.precioUsd}
                  className="font-mono text-base font-bold text-joycyan"
                />
                <span className="text-xs font-semibold text-muted group-hover:text-joycyan">
                  {t('Ver detalle →', 'View dish →')}
                </span>
              </div>
            </div>
          )}

          {/* Card 3: Tall Salsa & Bachata Tile */}
          <div
            onClick={() => setExpandedTile('salsa')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setExpandedTile('salsa');
            }}
            className="photo-overlay card-glow-cyan group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-hairline bg-black p-6 shadow-card hover:-translate-y-1 lg:col-span-3 lg:row-span-2"
          >
            <img
              src={promoSalsa?.imageUrl || '/images/salsa-bachata.webp'}
              alt="Noches de Salsa y Bachata gratis en Joy Ride Café"
              className="photo-frame absolute inset-0 h-full w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/60 to-black/30" />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-joycyan/45 bg-black/80 px-3 py-1 text-xs font-semibold text-joycyan">
                <Music className="h-3.5 w-3.5" />
                {promoSalsa?.scheduleText || 'Mar · Jue · Sáb'}
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/70 text-slate-200 transition-colors group-hover:border-joycyan group-hover:text-joycyan">
                <Maximize2 className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="relative z-10 mt-40 lg:mt-0">
              <h3 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                {promoSalsa?.title || 'Clases Gratis de Salsa & Bachata'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {promoSalsa?.subtitle ||
                  '18:00 a 21:00 en nuestra pista con bola de espejos y fiesta social después.'}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSalsaReservation();
                }}
                className="mt-4 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-joycyan px-4 py-2.5 text-xs font-bold text-obsidian transition-colors hover:bg-joycyan-deep active:scale-[0.96] sm:text-sm"
              >
                <span>{t('Reservar Pista + Pase QR', 'Book Dance Floor')}</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center text-xs font-semibold text-joycyan group-hover:underline">
                {t('Explorar horarios y combos →', 'Explore schedule & combos →')}
              </p>
            </div>
          </div>

          {/* Card 4: Vegan & Desserts 2x1 Tile */}
          <div
            onClick={() => setExpandedTile('vegan')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setExpandedTile('vegan');
            }}
            className="card-glow-emerald group flex cursor-pointer flex-col justify-between rounded-2xl border border-hairline bg-surface p-5 shadow-card hover:-translate-y-1 lg:col-span-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
                  <Leaf className="h-4 w-4" />
                  {t('Vegano & 2x1 Postres', 'Vegan & 2x1 Sweets')}
                </span>
                {lowStockSpecial && (
                  <span className="font-mono text-xs tabular-nums text-joymagenta">
                    Trucha: {lowStockSpecial.stockDisponible} u.
                  </span>
                )}
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-ink sm:text-xl">
                Brownie 2x1 &amp; Bowls Andinos
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {dessert2x1 ? (
                  <>
                    {dessert2x1.name} ·{' '}
                    <AnimatedPrice
                      bs={dessert2x1.precioBs}
                      usd={dessert2x1.precioUsd}
                      className="font-mono font-bold text-joycyan"
                    />
                  </>
                ) : (
                  'Opciones plant-based con quinua real y postres tibios.'
                )}
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterVegan();
                  document.getElementById('carta-joyride')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="min-h-[40px] flex-1 rounded-xl border border-hairline bg-elevated px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-emerald-400/50 hover:text-emerald-500"
              >
                {t('Filtrar Veganos', 'Filter Vegan')}
              </button>
              {dessert2x1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(dessert2x1);
                  }}
                  className="min-h-[40px] rounded-xl bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-500 hover:bg-emerald-500/25"
                >
                  Ver 2x1
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Wide 2-Column Editorial Split Modal fed directly by DB products & promotions */}
      <EditorialSplitModal
        open={expandedTile === 'happyhour'}
        onClose={() => setExpandedTile(null)}
        title={promoHappy?.title || 'Happy Hour 2x1 en Barra & Cócteles'}
        subtitle={promoHappy?.scheduleText || 'Todos los días · 18:00 – 21:00 · Nicolás Ortiz N° 14'}
        badge={promoHappy?.badgeText || 'HAPPY HOUR 2x1'}
        accent="magenta"
        images={[
          '/images/experiencia-bar.webp',
          '/images/venue-bar-cocktails.webp',
          '/images/dish-chuflay.webp',
          '/images/dish-the-hulk.webp',
        ]}
      >
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          {promoHappy?.description ||
            'Disfruta 2x1 en Chuflays de Singani, Mojitos frutales, Daiquiris, The Hulk y chopp artesanal tanto en barra como pidiendo directo en línea.'}
        </p>

        <div className="space-y-2.5">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-joymagenta">
            {t(`Disponibles ahora en 2x1 (${happyHourItems.length})`, `Available 2x1 Items (${happyHourItems.length})`)}
          </p>
          <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
            {happyHourItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-obsidian p-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="photo-frame h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink sm:text-sm">{item.name}</p>
                    <p className="font-mono text-xs text-joycyan">
                      <AnimatedPrice bs={item.precioBs} usd={item.precioUsd} /> · {item.stockDisponible} u.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuickAdd(item)}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-joymagenta px-3 py-1.5 text-xs font-bold text-white hover:bg-joymagenta-deep"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t('Pedir', 'Add')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setExpandedTile(null);
            onFilterHappyHour();
            document.getElementById('carta-joyride')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-joymagenta px-5 py-3 text-sm font-bold text-white hover:bg-joymagenta-deep"
        >
          <span>{t('Filtrar Todos los 2x1 en Carta', 'Filter All 2x1 on Menu')}</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </EditorialSplitModal>

      <EditorialSplitModal
        open={expandedTile === 'salsa'}
        onClose={() => setExpandedTile(null)}
        title={promoSalsa?.title || 'Clases Gratis de Salsa & Bachata + Fiesta Social'}
        subtitle={promoSalsa?.scheduleText || 'Martes · Jueves · Sábados · Desde 18:00'}
        badge={promoSalsa?.badgeText || 'ENTRADA LIBRE'}
        accent="cyan"
        images={[
          '/images/salsa-bachata.webp',
          '/images/venue-lounge-lights.webp',
          '/images/fiesta-amigos.webp',
        ]}
      >
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          {promoSalsa?.description ||
            'Aprende Salsa Cubana y Bachata desde cero con instructores en Sucre, sin costo de entrada ni pareja obligatoria. Luego la pista sigue encendida hasta las 02:30.'}
        </p>

        {salsaCombo && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-joycyan/40 bg-joycyan/10 p-3.5">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-bold uppercase text-joycyan">
                {t('Combo Recomendado en Pista', 'Suggested Table Combo')}
              </p>
              <p className="truncate text-sm font-bold text-ink">{salsaCombo.name}</p>
              <AnimatedPrice
                bs={salsaCombo.precioBs}
                usd={salsaCombo.precioUsd}
                className="font-mono text-xs font-bold text-joymagenta"
              />
            </div>
            <button
              type="button"
              onClick={() => handleQuickAdd(salsaCombo)}
              className="shrink-0 rounded-xl bg-joycyan px-3.5 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep"
            >
              + {t('Sumar Combo', 'Add Combo')}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setExpandedTile(null);
            onOpenSalsaReservation();
          }}
          className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-joycyan px-5 py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
        >
          <span>{t('Reservar Pista + Pase QR', 'Reserve Dance Floor + QR Pass')}</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </EditorialSplitModal>

      <EditorialSplitModal
        open={expandedTile === 'vegan'}
        onClose={() => setExpandedTile(null)}
        title={t('Opciones Veganas, Quinua Real & Postres 2x1', 'Vegan Bowls, Andean Quinoa & 2x1 Desserts')}
        subtitle="Cocina Viva · Nicolás Ortiz N° 14"
        badge="PLANT-BASED & SWEET"
        accent="emerald"
        images={[
          '/images/dish-brownie-2x1.webp',
          '/images/dish-desayuno-saludable.webp',
          '/images/dish-ensalada-joy.webp',
        ]}
      >
        <p className="text-sm leading-relaxed text-muted sm:text-base">
          {t(
            'Ingredientes frescos del valle chuquisaqueño, bowls 100% plant-based y postres artesanales al 2x1 disponibles ahora mismo.',
            'Fresh valley produce, 100% plant-based Andean bowls and handcrafted 2x1 desserts ready in kitchen right now.'
          )}
        </p>

        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {veganItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-obsidian p-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <img src={item.imageUrl} alt={item.name} className="photo-frame h-11 w-11 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink sm:text-sm">{item.name}</p>
                  <p className="font-mono text-xs text-emerald-500">
                    <AnimatedPrice bs={item.precioBs} usd={item.precioUsd} /> · {item.stockDisponible} u.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleQuickAdd(item)}
                className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-obsidian hover:bg-emerald-400"
              >
                + {t('Pedir', 'Add')}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setExpandedTile(null);
            onFilterVegan();
            document.getElementById('carta-joyride')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-obsidian hover:bg-emerald-400"
        >
          <span>{t('Filtrar Platos Veganos en Carta', 'Filter Vegan Menu Items')}</span>
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </EditorialSplitModal>
    </section>
  );
}
