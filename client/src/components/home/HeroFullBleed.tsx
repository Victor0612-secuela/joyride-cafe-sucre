import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDownRight, Calendar, MapPin, ShoppingBag, Sparkles } from 'lucide-react';
import { getSucreStatusInfo } from '../../lib/format';
import { useI18n } from '../../context/I18nContext';
import { joySound } from '../../lib/sound';

interface HeroFullBleedProps {
  onOpenReservation: () => void;
  onOpenCart: () => void;
}

export function HeroFullBleed({ onOpenReservation, onOpenCart }: HeroFullBleedProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState(() => getSucreStatusInfo());

  useEffect(() => {
    const id = setInterval(() => setStatus(getSucreStatusInfo()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      data-enter
      className="relative flex min-h-screen w-full items-end overflow-hidden bg-obsidian pb-14 pt-24 sm:items-center sm:pb-20 sm:pt-28"
    >
      {/* Full-bleed atmospheric real Joy Ride photography with subtle entrance settle */}
      <motion.div
        initial={{ scale: 1.05, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.2, 0, 0, 1] }}
        className="absolute inset-0"
      >
        <img
          src="/images/musica-vivo.webp"
          alt="Ambiente nocturno y música en vivo dentro de Joy Ride Café Sucre"
          className="h-full w-full object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/75 to-obsidian/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/95 via-obsidian/65 to-transparent" />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
            className="lg:col-span-8"
          >
            {/* Brand Pill & Live Sucre State */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/85 px-4 py-2 text-xs font-medium text-ink backdrop-blur-md sm:text-sm">
                <MapPin className="h-4 w-4 text-joycyan" />
                <span>Calle Nicolás Ortiz N° 14 • Centro Histórico, Sucre</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-joymagenta/40 bg-joymagenta/15 px-4 py-2 text-xs font-semibold text-pink-200 backdrop-blur-md sm:text-sm">
                <Sparkles className="h-4 w-4 text-joymagenta" />
                <span>
                  {status.isHappyHour
                    ? t('Happy Hour 2x1 activo ahora', '2x1 Happy Hour Live Now')
                    : status.isOpen
                    ? t('Abierto hoy hasta las 02:30', 'Open Tonight Until 02:30')
                    : t('Reservas y pedidos programados', 'Scheduled Orders & Table Bookings')}
                </span>
              </div>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.03] tracking-[-0.03em] text-ink sm:text-6xl lg:text-7xl 2xl:text-[5.25rem]">
              NO SOLO PARA GRINGOS
              <span className="mt-2 block text-joycyan">PROBABLY THE BEST BAR IN TOWN</span>
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg xl:text-xl">
              {t(
                'Desde 2001 frente a la Catedral Metropolitana de Sucre. Pique a lo Macho, Singani Chuflay, cervezas bien frías, café boliviano de altura y noches de Salsa & Bachata. Pide al instante con QR, Tarjeta o PayPal y sigue cada paso hasta tu puerta con PIN.',
                'Facing Sucre’s Metropolitan Cathedral since 2001. Pique a lo Macho, Singani Chuflay, ice-cold craft beers, high-altitude Bolivian coffee, and Salsa & Bachata nights. Order live with QR, Card or PayPal and track every step to your door with your personal PIN.'
              )}
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                to="/carta"
                onClick={() => joySound.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-joymagenta px-7 py-4 text-sm font-bold text-white shadow-elevated transition-transform hover:bg-joymagenta-deep active:scale-[0.96] sm:text-base"
              >
                <span>{t('Explorar la Carta', 'Explore Menu')}</span>
                <ArrowDownRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  joySound.click();
                  onOpenCart();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-joycyan px-7 py-4 text-sm font-bold text-obsidian transition-colors hover:bg-joycyan-deep active:scale-[0.96] sm:text-base"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{t('Pedir con Delivery / QR', 'Order Delivery / QR')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  joySound.click();
                  onOpenReservation();
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-surface/75 px-6 py-4 text-sm font-semibold text-ink backdrop-blur-md transition-colors hover:border-joycyan/60 hover:bg-elevated active:scale-[0.96] sm:text-base"
              >
                <Calendar className="h-4 w-4 text-joycyan" />
                <span>{t('Reservar Zona', 'Book a Table')}</span>
              </button>
            </div>
          </motion.div>

          {/* Right Brand Focal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.2, 0, 0, 1] }}
            className="hidden lg:col-span-4 lg:flex lg:justify-end"
          >
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-surface/85 p-7 shadow-elevated backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <img
                  src="/logo-joyride.png"
                  alt="Emblema oficial Joy Ride Café"
                  className="h-28 w-28 shrink-0 rounded-full object-contain sm:h-32 sm:w-32 ring-2 ring-joycyan/30"
                />
                <div>
                  <p className="font-display text-2xl font-extrabold text-ink">JOY RIDE CAFÉ®</p>
                  <p className="mt-1 text-sm text-muted">Resto-Bar · Café · Adventure Hub</p>
                  <p className="mt-2 font-mono text-sm tabular-nums text-joycyan">
                    4.3 ★ · 25+ años en Sucre
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3.5 border-t border-hairline pt-5 text-sm">
                <div className="rounded-xl border border-hairline bg-obsidian/70 p-3.5">
                  <p className="text-xs text-muted">Horarios Sucre</p>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums text-ink">07:00 – 02:30</p>
                </div>
                <div className="rounded-xl border border-hairline bg-obsidian/70 p-3.5">
                  <p className="text-xs text-muted">Happy Hour 2x1</p>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums text-joymagenta">
                    18:00 – 21:00
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
