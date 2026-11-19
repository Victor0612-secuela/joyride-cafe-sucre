import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { joySound } from '../../lib/sound';

export function SessionTransitionOverlay({
  active,
  title = 'Cerrando sesión…',
  subtitle = '¡Hasta la próxima ronda en Nicolás Ortiz N° 14!',
}: {
  active: boolean;
  title?: string;
  subtitle?: string;
}) {
  useEffect(() => {
    if (active) joySound.transition();
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <div
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-auto"
        >
          {/* Left Split Shutter */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', duration: 0.48, bounce: 0 }}
            className="fixed inset-y-0 left-0 w-[50.5%] border-r border-joycyan/25 bg-obsidian"
          />
          {/* Right Split Shutter */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.48, bounce: 0 }}
            className="fixed inset-y-0 right-0 w-[50.5%] border-l border-joymagenta/25 bg-surface"
          />

          {/* Sculptural Brand Centerpiece */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-hairline bg-surface/95 px-10 py-10 text-center shadow-elevated backdrop-blur-xl mx-4"
          >
            <motion.img
              initial={{ rotate: -8 }}
              animate={{ rotate: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              src="/logo-joyride.png"
              alt="Joy Ride Café"
              className="h-36 w-36 rounded-full object-contain shadow-card ring-2 ring-joycyan/35"
            />
            <span className="mt-5 font-mono text-xs font-bold uppercase tracking-[0.22em] text-joymagenta">
              NO SOLO PARA GRINGOS
            </span>
            <p className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
              {title}
            </p>
            <p className="mt-2 text-sm text-muted sm:text-base">{subtitle}</p>
            <div className="mt-6 h-2 w-60 overflow-hidden rounded-full bg-elevated">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.55, ease: [0.2, 0, 0, 1] }}
                className="h-full w-full bg-gradient-to-r from-joycyan to-joymagenta"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
