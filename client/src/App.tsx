import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { ROLE_META } from './lib/format';
import { Role } from './types';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { AuthSplitPage } from './pages/AuthSplitPage';
import { QrMobileGatewayPage } from './pages/QrMobileGatewayPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { SucreMapGuidePage } from './pages/SucreMapGuidePage';
import { CashierPanel } from './pages/panels/CashierPanel';
import { PackerPanel } from './pages/panels/PackerPanel';
import { RiderPanel } from './pages/panels/RiderPanel';
import { AdminPanel } from './pages/panels/AdminPanel';
import { OrderTableSkeleton } from './components/ui/Skeleton';

function RouteProgressBar() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 380);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={`bar-${pathname}`}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-joycyan via-joyamber to-joymagenta shadow-[0_0_12px_rgba(0,160,223,0.7)]"
        />
      )}
    </AnimatePresence>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/carta" element={<MenuPage />} />
          <Route path="/login" element={<AuthSplitPage initialMode="login" />} />
          <Route path="/registro" element={<AuthSplitPage initialMode="register" />} />
          <Route path="/mapa-sucre" element={<SucreMapGuidePage />} />
          <Route path="/pagar-qr/:qrToken" element={<QrMobileGatewayPage />} />

          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel/cajero"
            element={
              <ProtectedRoute allowedRoles={['CAJERO', 'ADMIN']}>
                <CashierPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel/empaque"
            element={
              <ProtectedRoute allowedRoles={['EMPAQUETADOR', 'ADMIN']}>
                <PackerPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel/repartidor"
            element={
              <ProtectedRoute allowedRoles={['REPARTIDOR', 'ADMIN']}>
                <RiderPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24">
        <OrderTableSkeleton rows={4} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_META[user.role].route} replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <RouteProgressBar />
        <AnimatedRoutes />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
