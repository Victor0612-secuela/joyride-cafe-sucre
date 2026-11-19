import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CurrencyMode, Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  currency: CurrencyMode;
  setCurrency: (c: CurrencyMode) => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  totalItems: number;
  subtotalBs: number;
  addItem: (product: Product, qty?: number) => { ok: boolean; reason?: string };
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'joyride_cart_v1';
const CURRENCY_STORAGE_KEY = 'joyride_currency_v1';

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [currency, setCurrency] = useState<CurrencyMode>(() => {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return saved === 'USD' ? 'USD' : 'BOB';
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  }, [currency]);

  const addItem = useCallback((product: Product, qty = 1): { ok: boolean; reason?: string } => {
    if (product.stockDisponible <= 0) {
      return { ok: false, reason: 'Producto temporalmente agotado' };
    }
    let blocked = false;
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      const targetQty = currentQty + qty;
      if (targetQty > product.stockDisponible) {
        blocked = true;
        return prev;
      }
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { product, quantity: targetQty } : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    if (blocked) {
      return {
        ok: false,
        reason: `Solo quedan ${product.stockDisponible} unidades disponibles en cocina/barra`,
      };
    }
    return { ok: true };
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.product.id !== productId);
      return prev.map((i) => {
        if (i.product.id !== productId) return i;
        const clamped = Math.min(qty, Math.max(1, i.product.stockDisponible));
        return { ...i, quantity: clamped };
      });
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotalBs = useMemo(
    () => Number(items.reduce((sum, i) => sum + Number(i.product.precioBs) * i.quantity, 0).toFixed(2)),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        currency,
        setCurrency,
        drawerOpen,
        setDrawerOpen,
        totalItems,
        subtotalBs,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
