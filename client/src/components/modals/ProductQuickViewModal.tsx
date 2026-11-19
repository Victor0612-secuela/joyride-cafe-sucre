import React, { useEffect, useState } from 'react';
import { Clock, Flame, Leaf, Minus, Plus, Sparkles, Wine } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { joySound } from '../../lib/sound';
import { Product } from '../../types';
import { AnimatedPrice } from '../ui/AnimatedPrice';
import { EditorialSplitModal } from '../ui/EditorialSplitModal';

interface ProductQuickViewModalProps {
  product: Product | null;
  allProducts: Product[];
  onClose: () => void;
}

export function ProductQuickViewModal({
  product,
  allProducts,
  onClose,
}: ProductQuickViewModalProps) {
  const { addItem } = useCart();
  const { pushToast } = useToast();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [product?.id]);

  if (!product) return null;

  const maridaje = product.maridajeSlug
    ? allProducts.find((p) => p.slug === product.maridajeSlug && p.stockDisponible > 0)
    : undefined;

  const maxStock = Math.max(0, product.stockDisponible);
  const outOfStock = maxStock <= 0;

  const handleAddMain = () => {
    const res = addItem(product, qty);
    if (!res.ok) {
      pushToast('No se pudo agregar', 'error', res.reason);
      return;
    }
    joySound.add();
    pushToast('Añadido a tu pedido', 'success', `${qty}× ${product.name}`);
    onClose();
  };

  const handleAddPair = () => {
    if (!maridaje) return;
    const res = addItem(maridaje, 1);
    if (!res.ok) {
      pushToast('Stock insuficiente', 'error', res.reason);
      return;
    }
    joySound.add();
    pushToast('Maridaje añadido', 'success', maridaje.name);
  };

  const modalImages = [product.imageUrl];
  if (maridaje && maridaje.imageUrl !== product.imageUrl) {
    modalImages.push(maridaje.imageUrl);
  }

  return (
    <EditorialSplitModal
      open={Boolean(product)}
      onClose={onClose}
      title={product.name}
      subtitle={`${product.category.name} · ~${product.tiempoPreparacionMin} min`}
      badge={product.enHappyHour ? '2x1 HAPPY HOUR' : 'CARTA JOY RIDE'}
      accent={product.enHappyHour ? 'magenta' : 'cyan'}
      images={modalImages}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {product.esVegano && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-500">
              <Leaf className="h-3.5 w-3.5" />
              Vegano
            </span>
          )}
          {product.esPicante && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-500">
              <Flame className="h-3.5 w-3.5" />
              Picante Chuquisaqueño
            </span>
          )}
          {product.enHappyHour && (
            <span className="inline-flex items-center gap-1 rounded-full bg-joymagenta/15 px-3 py-1 text-xs font-bold text-joymagenta">
              <Sparkles className="h-3.5 w-3.5" />
              Aplica Happy Hour 2x1
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-obsidian px-3 py-1 font-mono text-xs text-muted">
            <Clock className="h-3.5 w-3.5 text-joycyan" />
            ~{product.tiempoPreparacionMin} min
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted sm:text-base">{product.description}</p>

        {/* Stock & Dual Animated Price Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-hairline bg-elevated p-4">
          <div>
            <p className="font-mono text-2xl font-bold text-ink">
              <AnimatedPrice bs={product.precioBs} usd={product.precioUsd} />
            </p>
            <p className="font-mono text-xs text-muted">
              Equivalente: <AnimatedPrice bs={product.precioBs} usd={product.precioUsd} reverse />
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-muted">Disponibilidad en cocina/barra</p>
            <p
              className={`font-mono text-sm font-bold tabular-nums ${
                outOfStock
                  ? 'text-rose-400'
                  : maxStock <= product.stockMinimoAlerta
                  ? 'text-joymagenta'
                  : 'text-emerald-500'
              }`}
            >
              {outOfStock ? 'Agotado' : `${maxStock} unidades disponibles`}
            </p>
          </div>
        </div>

        {/* House Pairing Suggestion */}
        {maridaje && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-joycyan/35 bg-joycyan/10 p-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={maridaje.imageUrl}
                alt={maridaje.name}
                className="photo-frame h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-joycyan">
                  <Wine className="h-3.5 w-3.5" />
                  Maridaje Sugerido Joy Ride
                </p>
                <p className="truncate text-sm font-semibold text-ink">{maridaje.name}</p>
                <p className="font-mono text-xs text-muted">
                  +<AnimatedPrice bs={maridaje.precioBs} usd={maridaje.precioUsd} />
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddPair}
              className="shrink-0 rounded-xl bg-joycyan px-3.5 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep active:scale-[0.96]"
            >
              + Combinar
            </button>
          </div>
        )}

        {/* Quantity & CTA */}
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center rounded-xl border border-hairline bg-elevated p-1">
            <button
              type="button"
              disabled={outOfStock || qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Disminuir cantidad"
              className="rounded-lg p-2.5 text-ink hover:bg-surface disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-mono text-sm font-bold tabular-nums text-ink">
              {outOfStock ? 0 : qty}
            </span>
            <button
              type="button"
              disabled={outOfStock || qty >= maxStock}
              onClick={() => setQty((q) => Math.min(maxStock, q + 1))}
              aria-label="Aumentar cantidad"
              className="rounded-lg p-2.5 text-ink hover:bg-surface disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAddMain}
            className="flex-1 rounded-xl bg-joymagenta py-3.5 text-sm font-bold text-white transition-colors hover:bg-joymagenta-deep enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-elevated disabled:text-muted"
          >
            {outOfStock ? (
              'Sin stock disponible'
            ) : (
              <>
                Agregar al Pedido · <AnimatedPrice bs={product.precioBs * qty} />
              </>
            )}
          </button>
        </div>
      </div>
    </EditorialSplitModal>
  );
}
