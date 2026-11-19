import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../../context/I18nContext';
import { joySound } from '../../lib/sound';
import { JoyRideHeritageLockup } from './JoyRideHeritageLockup';

export function SessionTransitionOverlay({
  active,
  title = 'Cerrando sesión…',
  subtitle = '¡Hasta la próxima ronda en Nicolás Ortiz N° 14!',
}: {
  active: boolean;
  title?: string;
  subtitle?: string;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (active) joySound.logout();
  }, [active]);

  const resolvedTitle = t(title, title);
  const resolvedSubtitle = t(subtitle, subtitle);

  return (
    <AnimatePresence>
      {active && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-auto"
        >
          {/* Left Split Shutter with Atmospheric Bar Photo & Tilted Watermark */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', duration: 0.48, bounce: 0 }}
            className="fixed inset-y-0 left-0 w-[50.5%] overflow-hidden border-r border-joycyan/35 bg-obsidian"
          >
            <img
              src="/images/joyride-official-portada.webp"
              alt=""
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-obsidian/85 via-obsidian/55 to-obsidian/90" />
            <div className="absolute inset-0 flex -rotate-12 scale-125 flex-col justify-around opacity-[0.06] select-none">
              {[0, 1, 2].map((i) => (
                <p
                  key={i}
                  className="whitespace-nowrap font-display text-4xl font-extrabold uppercase tracking-[0.2em] text-joycyan sm:text-6xl"
                >
                  NO SOLO PARA GRINGOS® · SUCRE
                </p>
              ))}
            </div>
          </motion.div>

          {/* Right Split Shutter with Atmospheric Patio Photo & Tilted Watermark */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.48, bounce: 0 }}
            className="fixed inset-y-0 right-0 w-[50.5%] overflow-hidden border-l border-joymagenta/35 bg-surface"
          >
            <img
              src="/images/venue-patio-night.webp"
              alt=""
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-bl from-obsidian/85 via-obsidian/55 to-obsidian/90" />
            <div className="absolute inset-0 flex -rotate-12 scale-125 flex-col justify-around opacity-[0.06] select-none">
              {[0, 1, 2].map((i) => (
                <p
                  key={i}
                  className="whitespace-nowrap font-display text-4xl font-extrabold uppercase tracking-[0.2em] text-joymagenta sm:text-6xl"
                >
                  PROBABLY THE BEST BAR IN TOWN®
                </p>
              ))}
            </div>
          </motion.div>

          {/* Spacious Sculptural Brand Centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 mx-4 flex w-full max-w-xl flex-col items-center rounded-3xl border border-white/15 bg-surface/95 px-8 py-10 text-center shadow-elevated backdrop-blur-2xl sm:px-14 sm:py-12"
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              <motion.img
                initial={{ rotate: -8, scale: 0.95 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                src="/logo-joyride.png"
                alt="Joy Ride Café"
                className="h-36 w-36 rounded-full object-contain shadow-card ring-2 ring-joycyan/40 sm:h-44 sm:w-44"
              />
              <JoyRideHeritageLockup className="h-24 w-auto opacity-95 sm:h-32" />
            </div>

            <span className="mt-6 font-mono text-xs font-bold uppercase tracking-[0.24em] text-joymagenta">
              NO SOLO PARA GRINGOS · PROBABLY THE BEST BAR IN TOWN®
            </span>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink sm:text-4xl">
              {resolvedTitle}
            </p>
            <p className="mt-2 max-w-md text-sm text-muted sm:text-base">{resolvedSubtitle}</p>

            <div className="mt-6 h-2 w-72 overflow-hidden rounded-full bg-elevated">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.65, ease: [0.2, 0, 0, 1] }}
                className="h-full w-full bg-gradient-to-r from-joycyan via-joyamber to-joymagenta"
              />
            </div>

            {/* Atmospheric Memories Strip */}
            <div className="mt-7 grid w-full grid-cols-3 gap-2.5">
              {[
                ['/images/joyride-friends-night.webp', 'Coctelería'],
                ['/images/salsa-bachata.webp', 'Salsa & Bachata'],
                ['/images/sucre-catedral.webp', 'Nicolás Ortiz 14'],
              ].map(([src, label]) => (
                <div key={label} className="relative h-16 overflow-hidden rounded-xl border border-hairline sm:h-20">
                  <img src={src} alt={label} className="h-full w-full object-cover opacity-85" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
                  <span className="absolute bottom-1.5 left-2 font-mono text-[10px] font-bold text-white">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
