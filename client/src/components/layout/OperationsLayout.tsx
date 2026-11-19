import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bike,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_META } from '../../lib/format';
import { Role } from '../../types';
import { StaffOpsChat } from '../chat/StaffOpsChat';

interface NavLinkItem {
  to: string;
  label: string;
  roles: Role[];
  icon: React.ReactNode;
}

const PANEL_LINKS: NavLinkItem[] = [
  {
    to: '/panel/cajero',
    label: 'Caja & Depósitos',
    roles: ['CAJERO', 'ADMIN'],
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    to: '/panel/empaque',
    label: 'Cocina & Empaque',
    roles: ['EMPAQUETADOR', 'ADMIN'],
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    to: '/panel/repartidor',
    label: 'Entregas & PIN',
    roles: ['REPARTIDOR', 'ADMIN'],
    icon: <Bike className="h-4 w-4" />,
  },
  {
    to: '/panel/admin',
    label: 'Administración & Kardex',
    roles: ['ADMIN'],
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

export function OperationsLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allowedLinks = PANEL_LINKS.filter((l) => user && l.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-obsidian text-ink">
      {/* Desktop Sidebar (Operate Mode) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
          <img src="/logo-joyride.png" alt="Joy Ride Café" className="h-12 w-12 rounded-full object-contain" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-ink">JOY RIDE OPS</p>
            <p className="truncate text-xs text-muted">Sucre, Bolivia</p>
          </div>
        </div>

        <div className="flex-1 space-y-1 px-3 py-4">
          {allowedLinks.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border border-joycyan/40 bg-joycyan/15 text-joycyan'
                    : 'text-muted hover:bg-elevated hover:text-ink'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="space-y-2 border-t border-hairline p-4">
          {user && (
            <div className="rounded-xl border border-hairline bg-elevated p-3">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-joycyan">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ROLE_META[user.role].label}
              </span>
            </div>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-elevated"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-joycyan" />
            <span>Volver a Tienda Pública</span>
          </Link>

          <button
            type="button"
            onClick={() => logout(() => navigate('/login'))}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Cambiar Cuenta / Salir</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex w-72 flex-col border-r border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div className="flex items-center gap-2.5">
                <img src="/logo-joyride.png" alt="Joy Ride Café" className="h-11 w-11 rounded-full object-contain" />
                <span className="font-display text-sm font-bold">JOY RIDE OPS</span>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-1.5 text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 space-y-1 p-3">
              {allowedLinks.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active
                        ? 'border border-joycyan/40 bg-joycyan/15 text-joycyan'
                        : 'text-muted hover:bg-elevated hover:text-ink'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="space-y-2 border-t border-hairline p-4">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-ink"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-joycyan" />
                <span>Volver a Tienda</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  logout(() => navigate('/login'));
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-hairline bg-obsidian/90 px-4 py-3.5 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir navegación"
              className="rounded-lg border border-hairline bg-surface p-2 text-ink lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-ink sm:text-xl">
                {title}
              </h1>
              <p className="text-xs text-muted sm:text-sm">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg border border-hairline bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-joycyan/50 lg:hidden"
            >
              Tienda
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 pb-24 sm:p-8 sm:pb-24 lg:px-10">
          {children}
        </main>
      </div>
      <StaffOpsChat />
    </div>
  );
}
