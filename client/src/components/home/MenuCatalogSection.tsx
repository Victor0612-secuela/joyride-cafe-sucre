import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpDown,
  BookOpen,
  Check,
  Clock,
  Eye,
  Flame,
  Leaf,
  Plus,
  RotateCw,
  Search,
  Sparkles,
  Wine,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useI18n } from '../../context/I18nContext';
import { formatPrice } from '../../lib/format';
import { joySound } from '../../lib/sound';
import { Category, Product } from '../../types';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import { BrandWatermarkBg } from '../ui/BrandWatermarkBg';
import { ProbablyTagline } from '../ui/ProbablyTagline';

export type MenuSortOption = 'carta' | 'featured' | 'price_asc' | 'price_desc' | 'fast' | 'stock';

interface MenuCatalogSectionProps {
  loading: boolean;
  categories: Category[];
  products: Product[];
  allProducts?: Product[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  veganOnly: boolean;
  onToggleVegan: () => void;
  happyHourOnly: boolean;
  onToggleHappyHour: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: MenuSortOption;
  onSortChange: (s: MenuSortOption) => void;
  onQuickView: (product: Product) => void;
}

function getCardGlowClass(product: Product): string {
  if (product.enHappyHour) return 'card-glow-magenta';
  if (product.esVegano) return 'card-glow-emerald';
  if (product.esPicante) return 'card-glow-amber';
  return 'card-glow-cyan';
}

function MenuFlipCard({
  product,
  pairing,
  flipped,
  onToggleFlip,
  onAdd,
  onQuickView,
}: {
  product: Product;
  pairing?: Product;
  flipped: boolean;
  onToggleFlip: () => void;
  onAdd: (p: Product) => void;
  onQuickView: (p: Product) => void;
}) {
  const { t } = useI18n();
  const outOfStock = product.stockDisponible <= 0;
  const lowStock = !outOfStock && product.stockDisponible <= product.stockMinimoAlerta;
  const glowClass = getCardGlowClass(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="perspective-1200"
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="preserve-3d relative grid min-h-[465px] w-full"
      >
        {/* FRONT FACE */}
        <article
          onClick={() => {
            joySound.flip();
            onToggleFlip();
          }}
          className={`backface-hidden ${glowClass} group col-start-1 row-start-1 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-hairline bg-surface p-3.5 shadow-card hover:-translate-y-1`}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-obsidian">
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`photo-frame h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] ${
                outOfStock ? 'opacity-45 grayscale' : ''
              }`}
            />

            <div className="photo-overlay absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
              {product.enHappyHour && (
                <span className="inline-flex items-center gap-1 rounded-full bg-joymagenta px-2.5 py-0.5 text-[11px] font-bold text-white">
                  <Sparkles className="h-3 w-3" />
                  2x1
                </span>
              )}
              {product.esVegano && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/90 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
                  <Leaf className="h-3 w-3" />
                  {t('Vegano', 'Vegan')}
                </span>
              )}
              {product.esPicante && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ring-1 ring-amber-500/40">
                  <Flame className="h-3 w-3" />
                  {t('Picante', 'Spicy')}
                </span>
              )}
            </div>

            <div className="photo-overlay absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-joycyan backdrop-blur-md">
                <BookOpen className="h-3 w-3" />
                {t('Voltear Carta', 'Flip Card')}
              </span>
              {outOfStock ? (
                <span className="rounded-full border border-rose-500/50 bg-black/85 px-2.5 py-1 font-mono text-[11px] font-bold text-rose-300">
                  {t('AGOTADO', 'SOLD OUT')}
                </span>
              ) : lowStock ? (
                <span className="rounded-full border border-joymagenta/60 bg-black/85 px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums text-pink-300">
                  {t(`¡Últimas ${product.stockDisponible}!`, `Only ${product.stockDisponible} left`)}
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-black/80 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-200">
                  {product.stockDisponible} {t('disp.', 'avail.')}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between px-1.5 pb-1.5 pt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-joycyan">
                {product.category.name}
              </p>
              <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink sm:text-xl">
                {product.name}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                {product.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <div>
                <p className="font-mono text-lg font-bold text-ink sm:text-xl">
                  <AnimatedPrice bs={product.precioBs} usd={product.precioUsd} />
                </p>
                <p className="font-mono text-xs text-muted">
                  <AnimatedPrice bs={product.precioBs} usd={product.precioUsd} reverse />
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickView(product);
                  }}
                  aria-label={`Ver detalle de ${product.name}`}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-elevated text-muted transition-colors hover:border-joycyan/50 hover:text-ink active:scale-[0.96]"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={outOfStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(product);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-joycyan px-4 py-2.5 text-sm font-bold text-obsidian transition-colors hover:bg-joycyan-deep enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
                >
                  <Plus className="h-4 w-4" />
                  <span>{outOfStock ? t('Agotado', 'Out') : t('Agregar', 'Add')}</span>
                </button>
              </div>
            </div>
          </div>
        </article>

        {/* BACK FACE */}
        <article
          onClick={() => {
            joySound.flip();
            onToggleFlip();
          }}
          className="backface-hidden rotate-y-180 col-start-1 row-start-1 flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-joycyan/45 bg-gradient-to-b from-elevated via-surface to-obsidian p-5 shadow-elevated"
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-hairline pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-joymagenta">
                  {t('Cartilla Joy Ride', 'Joy Ride Booklet')} · {product.category.name}
                </span>
                <h3 className="mt-0.5 font-display text-lg font-extrabold text-ink sm:text-xl">
                  {product.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  joySound.flip();
                  onToggleFlip();
                }}
                aria-label="Volver al frente de la tarjeta"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-hairline bg-obsidian text-joycyan hover:border-joycyan"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm leading-relaxed text-ink/90">{product.description}</p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian px-2.5 py-1 font-mono text-joycyan">
                <Clock className="h-3.5 w-3.5" />
                {t(`Prep. ${product.tiempoPreparacionMin} min`, `${product.tiempoPreparacionMin} min prep`)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian px-2.5 py-1 font-mono text-muted">
                {t(`Disponibles: ${product.stockDisponible} u.`, `${product.stockDisponible} in stock`)}
              </span>
              {product.enHappyHour && (
                <span className="rounded-lg bg-joymagenta/15 px-2.5 py-1 font-bold text-joymagenta">
                  Happy Hour 2x1
                </span>
              )}
            </div>

            {pairing && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-joycyan/30 bg-obsidian/90 p-3"
              >
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-joycyan">
                  <Wine className="h-3.5 w-3.5 text-joymagenta" />
                  {t('Acompañamiento ideal', 'Suggested House Pairing')}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{pairing.name}</p>
                    <AnimatedPrice
                      bs={pairing.precioBs}
                      usd={pairing.precioUsd}
                      className="font-mono text-xs font-semibold text-joycyan"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={pairing.stockDisponible <= 0}
                    onClick={() => onAdd(pairing)}
                    className="shrink-0 rounded-lg bg-joycyan/15 px-3 py-1.5 text-xs font-bold text-joycyan hover:bg-joycyan hover:text-obsidian disabled:opacity-40"
                  >
                    + {t('Sumar', 'Add')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center justify-between gap-2 border-t border-hairline pt-3.5"
          >
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAdd(product)}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-joymagenta px-4 py-2.5 text-sm font-bold text-white hover:bg-joymagenta-deep disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span>
                {outOfStock ? (
                  t('Agotado', 'Sold out')
                ) : (
                  <>
                    {t('Agregar', 'Add')} (<AnimatedPrice bs={product.precioBs} usd={product.precioUsd} />)
                  </>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-hairline bg-obsidian px-3.5 py-2.5 text-xs font-semibold text-ink hover:border-joycyan"
            >
              {t('Ampliar', 'Expand')}
            </button>
          </div>
        </article>
      </motion.div>
    </motion.div>
  );
}

export function MenuCatalogSection({
  loading,
  categories,
  products,
  allProducts,
  selectedCategory,
  onSelectCategory,
  veganOnly,
  onToggleVegan,
  happyHourOnly,
  onToggleHappyHour,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onQuickView,
}: MenuCatalogSectionProps) {
  const { currency, addItem } = useCart();
  const { pushToast } = useToast();
  const { t } = useI18n();
  const [flippedId, setFlippedId] = useState<string | null>(null);

  const pool = allProducts && allProducts.length > 0 ? allProducts : products;

  const sortedProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === 'featured') {
      return list.sort((a, b) => Number(b.esDestacado) - Number(a.esDestacado) || a.name.localeCompare(b.name));
    }
    if (sortBy === 'price_asc') {
      return list.sort((a, b) => a.precioBs - b.precioBs);
    }
    if (sortBy === 'price_desc') {
      return list.sort((a, b) => b.precioBs - a.precioBs);
    }
    if (sortBy === 'fast') {
      return list.sort((a, b) => a.tiempoPreparacionMin - b.tiempoPreparacionMin);
    }
    if (sortBy === 'stock') {
      return list.sort((a, b) => b.stockDisponible - a.stockDisponible);
    }
    // Default 'carta': ordered cleanly by category sortOrder, destacados first, then A-Z
    const catOrder = new Map(categories.map((c, idx) => [c.slug, c.sortOrder ?? idx]));
    return list.sort((a, b) => {
      const ca = catOrder.get(a.category.slug) ?? 99;
      const cb = catOrder.get(b.category.slug) ?? 99;
      if (ca !== cb) return ca - cb;
      if (a.esDestacado !== b.esDestacado) return Number(b.esDestacado) - Number(a.esDestacado);
      return a.name.localeCompare(b.name);
    });
  }, [products, categories, sortBy]);

  const showGroupedSections =
    selectedCategory === 'all' &&
    sortBy === 'carta' &&
    !veganOnly &&
    !happyHourOnly &&
    !searchQuery.trim() &&
    categories.length > 0;

  const groupedSections = useMemo(() => {
    if (!showGroupedSections) return [];
    return categories
      .map((cat) => ({
        category: cat,
        items: sortedProducts.filter((p) => p.category.slug === cat.slug),
      }))
      .filter((g) => g.items.length > 0);
  }, [showGroupedSections, categories, sortedProducts]);

  const handleAdd = (product: Product) => {
    const res = addItem(product, 1);
    if (!res.ok) {
      pushToast(t('Límite de disponibilidad', 'Stock limit reached'), 'error', res.reason);
      return;
    }
    joySound.add();
    pushToast(
      t('Agregado a tu pedido', 'Added to order'),
      'success',
      `${product.name} · ${formatPrice(product.precioBs, currency, product.precioUsd)}`
    );
  };

  return (
    <section
      id="carta-joyride"
      className="relative overflow-hidden py-14 sm:py-20"
    >
      <BrandWatermarkBg variant="menu" />

      <div className="relative z-10 mx-auto max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <ProbablyTagline
              subject="Menu"
              accent="magenta"
              size="md"
              spanishHint={t('Calle Nicolás Ortiz N° 14 · Cocina & Barra Continua', 'Nicolás Ortiz N° 14 · Kitchen & Bar')}
            />
            <h1 className="mt-1.5 font-display text-4xl font-extrabold tracking-tight text-ink sm:text-5xl xl:text-6xl">
              {t('Carta de Platos, Barra & Café', 'Full Menu, Cocktails & Coffee')}
            </h1>
            <p className="mt-2.5 max-w-2xl text-base text-muted sm:text-lg">
              {t(
                'Toca cualquier tarjeta para voltearla como cartilla de bar, consultar maridaje y pedir al instante con disponibilidad verificada.',
                'Tap any card to flip open our bar booklet, explore pairings, and order with live availability.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[210px] flex-1 sm:w-64 sm:flex-none">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('Buscar pique, chuflay, burger…', 'Search dishes, cocktails…')}
                aria-label="Buscar en la carta"
                className="w-full rounded-xl border border-hairline bg-surface py-2.5 pl-10 pr-3 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none sm:text-sm"
              />
            </div>

            <div className="relative flex items-center">
              <ArrowUpDown className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-joycyan" />
              <select
                value={sortBy}
                onChange={(e) => {
                  joySound.tab();
                  onSortChange(e.target.value as MenuSortOption);
                }}
                aria-label="Ordenar carta"
                className="min-h-[42px] rounded-xl border border-hairline bg-surface py-2 pl-8 pr-3 text-xs font-semibold text-ink focus:border-joycyan focus:outline-none sm:text-sm"
              >
                <option value="carta">{t('Orden: Carta Joy Ride', 'Sort: By Section')}</option>
                <option value="featured">{t('Recomendados de la Casa', 'House Favorites')}</option>
                <option value="price_asc">{t('Precio: menor a mayor', 'Price: Low to High')}</option>
                <option value="price_desc">{t('Precio: mayor a menor', 'Price: High to Low')}</option>
                <option value="fast">{t('Preparación más rápida', 'Fastest Prep')}</option>
                <option value="stock">{t('Mayor disponibilidad', 'Most Available')}</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                joySound.tab();
                onToggleVegan();
              }}
              className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                veganOnly
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-500'
                  : 'border-hairline bg-surface text-muted hover:text-ink'
              }`}
            >
              <Leaf className="h-4 w-4" />
              <span>{t('Vegano', 'Vegan')}</span>
              {veganOnly && <Check className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                joySound.tab();
                onToggleHappyHour();
              }}
              className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                happyHourOnly
                  ? 'border-joymagenta bg-joymagenta/20 text-joymagenta'
                  : 'border-hairline bg-surface text-muted hover:text-ink'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>2x1 Happy Hour</span>
              {happyHourOnly && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-7 flex items-center gap-2.5 overflow-x-auto pb-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => {
              joySound.tab();
              onSelectCategory('all');
              setFlippedId(null);
            }}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
              selectedCategory === 'all'
                ? 'border-joycyan bg-joycyan text-obsidian'
                : 'border-hairline bg-surface text-muted hover:border-joycyan/40 hover:text-ink'
            }`}
          >
            {t('Toda la Carta', 'Full Menu')} ({allProducts?.length ?? products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={selectedCategory === cat.slug}
              onClick={() => {
                joySound.tab();
                onSelectCategory(cat.slug);
                setFlippedId(null);
              }}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                selectedCategory === cat.slug
                  ? 'border-joycyan bg-joycyan text-obsidian'
                  : 'border-hairline bg-surface text-muted hover:border-joycyan/40 hover:text-ink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Loading, Empty State, Organized Category Sections, or Sorted Grid */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-hairline bg-surface p-12 text-center">
            <p className="font-display text-xl font-bold text-ink">
              {t('No encontramos platos con esos filtros', 'No dishes match these filters')}
            </p>
            <p className="mt-2 text-sm text-muted">
              {t(
                'Prueba limpiando la búsqueda o seleccionando toda la carta.',
                'Try clearing your search or viewing the full menu.'
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onSearchChange('');
                onSortChange('carta');
                if (veganOnly) onToggleVegan();
                if (happyHourOnly) onToggleHappyHour();
              }}
              className="mt-5 rounded-xl bg-joycyan px-5 py-2.5 text-sm font-bold text-obsidian"
            >
              {t('Restablecer Carta', 'Reset Menu')}
            </button>
          </div>
        ) : showGroupedSections ? (
          <div className="mt-10 space-y-14">
            {groupedSections.map(({ category, items }) => (
              <div key={category.id} className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-3">
                  <div>
                    <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
                      {category.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{category.description}</p>
                  </div>
                  <span className="rounded-full border border-joycyan/40 bg-joycyan/10 px-3 py-1 font-mono text-xs font-bold text-joycyan">
                    {items.length} {t('opciones', 'items')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {items.map((product) => {
                    const pairing =
                      pool.find((p) => p.slug === product.maridajeSlug && p.id !== product.id) ||
                      pool.find((p) => p.id !== product.id && p.enHappyHour);
                    return (
                      <MenuFlipCard
                        key={product.id}
                        product={product}
                        pairing={pairing}
                        flipped={flippedId === product.id}
                        onToggleFlip={() =>
                          setFlippedId((prev) => (prev === product.id ? null : product.id))
                        }
                        onAdd={handleAdd}
                        onQuickView={onQuickView}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {sortedProducts.map((product) => {
                const pairing =
                  pool.find((p) => p.slug === product.maridajeSlug && p.id !== product.id) ||
                  pool.find((p) => p.id !== product.id && p.enHappyHour);
                return (
                  <MenuFlipCard
                    key={product.id}
                    product={product}
                    pairing={pairing}
                    flipped={flippedId === product.id}
                    onToggleFlip={() =>
                      setFlippedId((prev) => (prev === product.id ? null : product.id))
                    }
                    onAdd={handleAdd}
                    onQuickView={onQuickView}
                  />
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}
