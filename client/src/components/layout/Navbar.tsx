import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ChevronDown,
  Clock,
  Compass,
  Globe,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  User as UserIcon,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n } from '../../context/I18nContext';
import { isSoundEnabled, joySound, setSoundEnabled } from '../../lib/sound';
import { getSucreStatusInfo, ROLE_META } from '../../lib/format';
import { Category } from '../../types';

interface NavbarProps {
  categories?: Category[];
  onSelectCategory?: (slug: string) => void;
  onOpenReservation?: () => void;
}

export function Navbar({ categories = [], onSelectCategory, onOpenReservation }: NavbarProps) {
  const { user, logout } = useAuth();
  const { totalItems, setDrawerOpen, currency, setCurrency } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const navigate = useNavigate();

  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [sucreClock, setSucreClock] = useState(() => getSucreStatusInfo());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) joySound.toggle();
  };

  const catRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSucreClock(getSucreStatusInfo()), 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleCatClick = (slug: string) => {
    setCatOpen(false);
    setMobileOpen(false);
    if (onSelectCategory) {
      onSelectCategory(slug);
      document.getElementById('carta-joyride')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/?cat=${encodeURIComponent(slug)}#carta-joyride`);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-obsidian/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1640px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Brand */}
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2.5 focus-visible:rounded-lg sm:gap-3">
          <img
            src="/logo-joyride.png"
            alt="Joy Ride Café Sucre"
            className="h-10 w-10 shrink-0 rounded-full object-contain sm:h-11 sm:w-11"
          />
          <div className="min-w-0 leading-tight">
            <span className="block whitespace-nowrap font-display text-sm font-extrabold tracking-tight text-ink sm:text-base xl:text-lg">
              JOY RIDE<span className="hidden sm:inline"> CAFÉ</span>
              <span className="text-joycyan">®</span>
            </span>
            <span className="hidden whitespace-nowrap text-xs font-medium text-muted xl:block">
              Nicolás Ortiz N° 14 · Sucre
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap xl:flex 2xl:gap-2"
          aria-label="Navegación principal"
        >
          <div ref={catRef} className="relative">
            <button
              type="button"
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:bg-surface hover:text-joycyan xl:px-3 xl:text-[15px]"
            >
              <span>{t('Carta', 'Menu')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
            </button>

            {catOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl border border-hairline bg-surface p-2 shadow-elevated">
                <button
                  type="button"
                  onClick={() => handleCatClick('all')}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-elevated hover:text-joycyan"
                >
                  <span>Toda la Carta Joy Ride</span>
                  <Sparkles className="h-4 w-4 text-joymagenta" />
                </button>
                <div className="my-1 border-t border-hairline" />
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCatClick(cat.slug)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
                  >
                    <span>{cat.name}</span>
                    {cat._count && (
                      <span className="font-mono text-xs tabular-nums text-joycyan">
                        {cat._count.products}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href="/#happy-hour-bento"
            className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:bg-surface hover:text-joycyan xl:px-3 xl:text-[15px]"
          >
            {t('Promos', 'Promos')}
          </a>

          <button
            type="button"
            onClick={() => (onOpenReservation ? onOpenReservation() : navigate('/?reservar=1'))}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:bg-surface hover:text-joycyan xl:px-3 xl:text-[15px]"
          >
            <Calendar className="h-4 w-4 text-joycyan" />
            <span>{t('Reservas', 'Book')}</span>
          </button>

          <Link
            to="/mapa-sucre"
            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:bg-surface hover:text-joycyan xl:px-3 xl:text-[15px]"
          >
            <Compass className="h-4 w-4 text-joymagenta" />
            <span>{t('Mapa Sucre', 'Sucre Map')}</span>
          </Link>

          {user && (
            <Link
              to="/mis-pedidos"
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-ink/90 transition-colors hover:bg-surface hover:text-joycyan xl:px-3 xl:text-[15px]"
            >
              <Package className="h-4 w-4 text-joycyan" />
              <span>{t('Mis Pedidos', 'Orders')}</span>
            </Link>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Sucre Live Status Pill */}
          <div className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-hairline bg-surface/90 px-3 py-1.5 text-xs 2xl:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                sucreClock.isHappyHour
                  ? 'bg-joymagenta'
                  : sucreClock.isOpen
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <Clock className="h-3.5 w-3.5 text-muted" />
            <span className="font-mono tabular-nums text-ink">{sucreClock.sucreTimeStr} Sucre</span>
            {sucreClock.isHappyHour && (
              <span className="rounded bg-joymagenta/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-300">
                2x1 EN VIVO
              </span>
            )}
          </div>

          {/* Compact Theme / Language / Sound Controls (Desktop) */}
          <div className="hidden items-center gap-1 rounded-xl border border-hairline bg-surface p-0.5 lg:flex">
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                joySound.toggle();
              }}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-elevated hover:text-joycyan"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                toggleLang();
                joySound.toggle();
              }}
              aria-label="Cambiar idioma ES/EN"
              title="Idioma ES / EN"
              className="flex items-center gap-1 rounded-lg px-2 py-1 font-mono text-[11px] font-bold text-ink transition-colors hover:bg-elevated hover:text-joycyan"
            >
              <Globe className="h-3 w-3 text-joycyan" />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={soundOn ? 'Silenciar efectos' : 'Activar sonidos'}
              title={soundOn ? 'Sonidos activados' : 'Silenciado'}
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-elevated hover:text-joymagenta"
            >
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Currency Switcher (desktop/tablet in bar; inside menu drawer on mobile) */}
          <div
            className="hidden items-center rounded-xl border border-hairline bg-surface p-0.5 text-xs font-semibold sm:flex"
            role="group"
            aria-label="Selector de moneda"
          >
            <button
              type="button"
              onClick={() => {
                setCurrency('BOB');
                joySound.currency();
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                currency === 'BOB' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
              }`}
            >
              Bs.
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrency('USD');
                joySound.currency();
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                currency === 'USD' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
              }`}
            >
              USD
            </button>
          </div>

          {/* Cart Button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir carrito"
            className="relative flex items-center gap-2 rounded-xl border border-joycyan/40 bg-surface px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-joycyan hover:bg-elevated active:scale-[0.96]"
          >
            <ShoppingBag className="h-4 w-4 text-joycyan" />
            <span className="hidden sm:inline">Pedido</span>
            {totalItems > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-joymagenta px-1.5 font-mono text-[11px] font-bold tabular-nums text-white">
                {totalItems}
              </span>
            )}
          </button>

          {/* Auth / Role Menu */}
          {user ? (
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-hairline bg-surface px-2.5 py-1.5 text-sm transition-colors hover:border-joycyan/50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-joycyan/20 text-joycyan">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden max-w-[110px] truncate text-left text-xs font-semibold text-ink md:block">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-hairline bg-surface p-2 shadow-elevated">
                  <div className="border-b border-hairline px-3 py-2.5">
                    <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-joycyan/40 bg-joycyan/15 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                      <ShieldCheck className="h-3 w-3" />
                      {ROLE_META[user.role].label}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {user.role !== 'CLIENTE' && (
                      <Link
                        to={ROLE_META[user.role].route}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl bg-joycyan/15 px-3 py-2 text-sm font-semibold text-joycyan transition-colors hover:bg-joycyan/25"
                      >
                        <span>Ir a Panel Operativo</span>
                        <ShieldCheck className="h-4 w-4" />
                      </Link>
                    )}

                    <Link
                      to="/mis-pedidos"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink transition-colors hover:bg-elevated"
                    >
                      <Package className="h-4 w-4 text-muted" />
                      <span>Mis Pedidos & Reservas</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout(() => navigate('/login'));
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('Cerrar Sesión', 'Sign Out')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-xl bg-joycyan px-3.5 py-2 text-sm font-bold text-obsidian transition-colors hover:bg-joycyan-deep active:scale-[0.96]"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Ingresar</span>
            </Link>
          )}

          {/* Mobile / Tablet toggle (<1280px keeps zero header crowding) */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menú móvil"
            className="rounded-xl border border-hairline bg-surface p-2 text-ink xl:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Drawer */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-obsidian px-4 py-4 xl:hidden">
          <div className="flex flex-col gap-1.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-hairline bg-surface px-3 py-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    toggleTheme();
                    joySound.toggle();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian px-2.5 py-1 text-xs font-semibold text-ink"
                >
                  {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-joycyan" />}
                  <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleLang();
                    joySound.toggle();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-hairline bg-obsidian px-2.5 py-1 font-mono text-xs font-bold text-ink"
                >
                  <Globe className="h-3.5 w-3.5 text-joycyan" />
                  <span>{lang.toUpperCase()}</span>
                </button>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-obsidian p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('BOB');
                    joySound.currency();
                  }}
                  className={`rounded-md px-2.5 py-1 ${
                    currency === 'BOB' ? 'bg-joycyan text-obsidian' : 'text-muted'
                  }`}
                >
                  Bs.
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('USD');
                    joySound.currency();
                  }}
                  className={`rounded-md px-2.5 py-1 ${
                    currency === 'USD' ? 'bg-joycyan text-obsidian' : 'text-muted'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCatClick('all')}
              className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-ink hover:bg-surface"
            >
              Explorar Carta Completa
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                if (onOpenReservation) onOpenReservation();
                else navigate('/?reservar=1');
              }}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink hover:bg-surface"
            >
              <Calendar className="h-4 w-4 text-joycyan" />
              <span>Reservar Zona / Clases de Salsa</span>
            </button>
            <Link
              to="/mapa-sucre"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface"
            >
              <Compass className="h-4 w-4 text-joymagenta" />
              <span>Mapa Turístico de Sucre</span>
            </Link>
            {user && (
              <Link
                to="/mis-pedidos"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-surface"
              >
                <Package className="h-4 w-4 text-joycyan" />
                <span>Mis Pedidos & PIN de Entrega</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
