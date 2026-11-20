import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useOrderStream } from '../hooks/useOrderStream';
import { useI18n } from '../context/I18nContext';
import { Category, Product } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { MenuCatalogSection, MenuSortOption } from '../components/home/MenuCatalogSection';
import { ProductQuickViewModal } from '../components/modals/ProductQuickViewModal';
import { CartCheckoutDrawer } from '../components/modals/CartCheckoutDrawer';
import { QrLivePaymentModal, QrSessionData } from '../components/modals/QrLivePaymentModal';
import { OrderTimelineModal } from '../components/modals/OrderTimelineModal';
import { ReservationModal } from '../components/modals/ReservationModal';
import { PwaInstallButton } from '../components/ui/PwaInstallButton';
import { WhatsAppFloat } from '../components/ui/WhatsAppFloat';

export function MenuPage() {
  useDocumentTitle('Carta & Pedidos Online — Joy Ride Café® Sucre');
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('cat') || 'all');
  const [veganOnly, setVeganOnly] = useState(() => searchParams.get('vegan') === '1');
  const [happyHourOnly, setHappyHourOnly] = useState(() => searchParams.get('happyHour') === '1');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<MenuSortOption>('carta');

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [qrSession, setQrSession] = useState<QrSessionData | null>(null);
  const [timelineOrderId, setTimelineOrderId] = useState<string | null>(null);
  const [reservationOpen, setReservationOpen] = useState(false);

  useOrderStream({ enabled: true });

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setSelectedCategory(cat);
    if (searchParams.get('vegan') === '1') setVeganOnly(true);
    if (searchParams.get('happyHour') === '1') setHappyHourOnly(true);
  }, [searchParams]);

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

  const allProducts = allProductsData || [];
  const filteredProducts = allProducts.filter((p) => {
    if (selectedCategory !== 'all' && p.category.slug !== selectedCategory) return false;
    if (veganOnly && !p.esVegano) return false;
    if (happyHourOnly && !p.enHappyHour) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="relative min-h-screen overflow-x-clip bg-obsidian text-ink">
      <Navbar
        categories={categoriesData || []}
        onSelectCategory={(slug) => setSelectedCategory(slug)}
        onOpenReservation={() => setReservationOpen(true)}
      />

      <main className="pt-24">
        <div className="mx-auto max-w-[1640px] px-5 pt-4 sm:px-8 lg:px-12 xl:px-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-joycyan hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('Volver al Inicio', 'Back to Home')}</span>
          </Link>
        </div>

        <MenuCatalogSection
          loading={productsLoading}
          categories={categoriesData || []}
          products={filteredProducts}
          allProducts={allProducts}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          veganOnly={veganOnly}
          onToggleVegan={() => setVeganOnly((v) => !v)}
          happyHourOnly={happyHourOnly}
          onToggleHappyHour={() => setHappyHourOnly((v) => !v)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onQuickView={(prod) => setQuickViewProduct(prod)}
        />
      </main>

      <footer className="border-t border-hairline bg-obsidian px-5 py-10 sm:px-8 lg:px-12 xl:px-14">
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-joyride.png"
              alt="Joy Ride Café"
              className="h-14 w-14 rounded-full object-contain"
            />
            <div>
              <p className="font-display text-lg font-extrabold text-ink">
                JOY RIDE CAFÉ® <span className="text-joycyan">SUCRE</span>
              </p>
              <p className="text-xs text-muted">Calle Nicolás Ortiz N° 14 · 07:00 – 02:30 AM</p>
            </div>
          </div>
          <PwaInstallButton />
        </div>
      </footer>

      <WhatsAppFloat />

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
        defaultSalsa={false}
        onClose={() => setReservationOpen(false)}
      />
    </div>
  );
}
