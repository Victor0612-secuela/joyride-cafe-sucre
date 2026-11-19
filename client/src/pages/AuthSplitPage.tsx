import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getErrorMessage } from '../lib/api';
import { ROLE_META } from '../lib/format';
import { joySound } from '../lib/sound';
import { Role } from '../types';
import { BrandWatermarkBg } from '../components/ui/BrandWatermarkBg';
import { JoyRideHeritageLockup } from '../components/ui/JoyRideHeritageLockup';

const DEMO_ACCOUNTS: Array<{
  role: Role;
  label: string;
  email: string;
  desc: string;
}> = [
  { role: 'CLIENTE', label: 'Cliente', email: 'cliente@joyride.bo', desc: 'Comprar, QR/PayPal y PIN' },
  { role: 'CAJERO', label: 'Cajero', email: 'cajero@joyride.bo', desc: 'Aprobar/rechazar depósitos' },
  { role: 'EMPAQUETADOR', label: 'Empaquetador', email: 'empaque@joyride.bo', desc: 'Kanban y checklist 100%' },
  { role: 'REPARTIDOR', label: 'Repartidor', email: 'repartidor@joyride.bo', desc: 'Retiro y entrega con PIN' },
  { role: 'ADMIN', label: 'Admin', email: 'admin@joyride.bo', desc: 'KPIs, CRUD, Kardex y roles' },
];

export function AuthSplitPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  useDocumentTitle(
    initialMode === 'login' ? 'Ingresar — Joy Ride Café® Sucre' : 'Registro — Joy Ride Café® Sucre'
  );
  const { login, register } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoOpen, setDemoOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRouteAfterAuth = (role: Role) => {
    if (role === 'CLIENTE') {
      navigate('/');
    } else {
      navigate(ROLE_META[role].route);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register({ name, email, password, phone });
      joySound.login();
      pushToast(`Bienvenido, ${user.name}`, 'success', `Rol activo: ${ROLE_META[user.role].label}`);
      handleRouteAfterAuth(user.role);
    } catch (err) {
      joySound.error();
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const quickLoginDemo = async (demoEmail: string) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      const user = await login(demoEmail, 'JoyRide2026!');
      joySound.login();
      pushToast(`Sesión demo: ${user.name}`, 'success', `Panel ${ROLE_META[user.role].label}`);
      handleRouteAfterAuth(user.role);
    } catch (err) {
      joySound.error();
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen overflow-hidden bg-obsidian lg:grid-cols-2">
      {/* Left 50% Visual Brand Panel (Split-Screen Door Animation) */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', duration: 0.55, bounce: 0 }}
        className="relative hidden flex-col justify-between overflow-hidden border-r border-hairline bg-surface p-10 xl:p-16 2xl:p-20 lg:flex"
      >
        <img
          src="/images/venue-patio-night.webp"
          alt="Joy Ride Café Sucre patio colonial nocturno"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/80 to-obsidian/60" />

        <div className="relative z-10 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-obsidian/80 px-4 py-2.5 text-sm font-semibold text-ink backdrop-blur-md hover:border-joycyan"
          >
            <ArrowLeft className="h-4 w-4 text-joycyan" />
            <span>Volver a la Carta</span>
          </Link>
          <span className="font-mono text-sm text-joycyan">Calle Nicolás Ortiz N° 14</span>
        </div>

        <div className="relative z-10 my-auto max-w-2xl py-10">
          <div className="flex flex-wrap items-center gap-6">
            <img
              src="/logo-joyride.png"
              alt="Logo oficial Joy Ride Café"
              className="h-36 w-36 rounded-full object-contain ring-2 ring-joycyan/35 shadow-card"
            />
            <JoyRideHeritageLockup
              className="h-28 w-auto opacity-95 drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
            />
          </div>
          <h1 className="mt-7 font-display text-4xl font-extrabold leading-tight text-ink xl:text-5xl 2xl:text-6xl">
            NO SOLO PARA GRINGOS
            <span className="mt-1.5 block text-joycyan">PROBABLY THE BEST BAR IN TOWN</span>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-slate-300 xl:text-lg">
            Plataforma integral de pedidos, mesas, reservas y seguimiento paso a paso para el
            resto-bar más icónico de Sucre, Bolivia.
          </p>

          {/* Flow Summary */}
          <div className="mt-9 grid grid-cols-2 gap-4 text-sm">
            {[
              ['1. Pedido & Stock', 'Disponibilidad en tiempo real'],
              ['2. Pago Verificable', 'Simple QR BNB, Tarjeta, Depósito o PayPal'],
              ['3. Cocina & Empaque', 'Checklist 100% + PIN único'],
              ['4. Entrega Auditada', 'Validación estricta con PIN 4 dígitos'],
            ].map(([stepTitle, stepDesc]) => (
              <div
                key={stepTitle}
                className="rounded-2xl border border-white/10 bg-obsidian/75 p-4 backdrop-blur-md"
              >
                <p className="font-bold text-ink">{stepTitle}</p>
                <p className="mt-1 text-xs text-muted">{stepDesc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 font-mono text-sm text-muted">
          JOY RIDE CAFÉ® · Sucre, Chuquisaca, Bolivia · +591 76116875
        </p>
      </motion.div>

      {/* Right 50% Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', duration: 0.55, bounce: 0 }}
        className="relative flex flex-col justify-center overflow-hidden px-6 py-12 sm:px-12 lg:px-16"
      >
        <BrandWatermarkBg variant="split-form" />
        <div className="relative z-10 mx-auto w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-joycyan">
              <ArrowLeft className="h-4 w-4" />
              <span>Inicio</span>
            </Link>
            <img src="/logo-joyride.png" alt="Joy Ride Café" className="h-14 w-14 rounded-full object-contain ring-1 ring-joycyan/30" />
          </div>

          <div className="flex rounded-xl border border-hairline bg-surface p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors sm:text-base ${
                mode === 'login' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors sm:text-base ${
                mode === 'register' ? 'bg-joycyan text-obsidian' : 'text-muted hover:text-ink'
              }`}
            >
              Crear Cuenta
            </button>
          </div>

          <h2 className="mt-7 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {mode === 'login' ? 'Acceso a Joy Ride Café®' : 'Únete a la mesa de Joy Ride'}
          </h2>
          <p className="mt-2 text-base text-muted">
            {mode === 'login'
              ? 'Ingresa con tu cuenta de cliente o personal de Joy Ride Café®.'
              : 'Crea tu cuenta de cliente para ordenar, reservar y recibir tu PIN de entrega.'}
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-joymagenta/50 bg-joymagenta/15 px-4 py-3 text-xs font-medium text-pink-200"
            >
              {errorMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 16 : -16 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              onSubmit={onSubmit}
              className="mt-5 space-y-4"
            >
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-ink">
                  Nombre completo
                </label>
                <div className="relative mt-1.5">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Camila Mendoza"
                    autoComplete="name"
                    className="w-full rounded-xl border border-hairline bg-surface py-3.5 pl-11 pr-3 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-sm font-semibold text-ink">
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@joyride.bo"
                  autoComplete="email"
                  className="w-full rounded-xl border border-hairline bg-surface py-3.5 pl-11 pr-3 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-phone" className="block text-sm font-semibold text-ink">
                  WhatsApp / Celular (Sucre)
                </label>
                <div className="relative mt-1.5">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+591 71123456"
                    autoComplete="tel"
                    className="w-full rounded-xl border border-hairline bg-surface py-3.5 pl-11 pr-3 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-password" className="block text-sm font-semibold text-ink">
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl border border-hairline bg-surface py-3.5 pl-11 pr-3 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-joymagenta py-4 text-base font-bold text-white transition-colors hover:bg-joymagenta-deep active:scale-[0.96] disabled:opacity-60"
            >
              {submitting
                ? 'Validando credenciales…'
                : mode === 'login'
                ? 'Ingresar a la Plataforma'
                : 'Registrarme y Empezar'}
            </button>
            </motion.form>
          </AnimatePresence>

          {/* Collapsible 1-click Demo Access Drawer for Evaluation */}
          <div className="mt-8 rounded-2xl border border-hairline bg-surface">
            <button
              type="button"
              onClick={() => setDemoOpen((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-bold text-ink"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-joycyan" />
                Acceso Rápido por Rol (1 clic)
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted transition-transform ${demoOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {demoOpen && (
              <div className="border-t border-hairline p-4">
                <p className="mb-3 text-xs text-muted">
                  Clave de acceso rápido: <code className="font-mono text-joycyan">JoyRide2026!</code>
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role}
                      type="button"
                      disabled={submitting}
                      onClick={() => quickLoginDemo(acc.email)}
                      className="flex items-start gap-3 rounded-xl border border-hairline bg-elevated p-3.5 text-left transition-colors hover:border-joycyan/60 hover:bg-obsidian active:scale-[0.98]"
                    >
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-joycyan" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">{acc.label}</p>
                        <p className="truncate font-mono text-xs text-joycyan">{acc.email}</p>
                        <p className="truncate text-xs text-muted">{acc.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
