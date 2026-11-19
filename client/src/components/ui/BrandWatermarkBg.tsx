import React from 'react';

interface BrandWatermarkBgProps {
  variant?: 'split-form' | 'editorial' | 'menu' | 'subtle-emblem';
  className?: string;
}

/**
 * Ambient Joy Ride background accents: ultra-subtle radial glows, fine embossed grid,
 * whisper-soft typography and circular emblem silhouettes — zero visual clutter.
 */
export function BrandWatermarkBg({
  variant = 'editorial',
  className = '',
}: BrandWatermarkBgProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    >
      {/* Subtle Embossed Relief Grid */}
      <div className="bg-relief-pattern absolute inset-0 opacity-60" />

      {/* Soft Brand Radial Depth (Cyan & Magenta 4-6%) */}
      <div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,160,223,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(242,5,116,0.055) 0%, transparent 70%)' }}
      />

      {variant === 'split-form' && (
        <>
          <img
            src="/logo-joyride.png"
            alt=""
            className="absolute -bottom-16 -right-14 h-72 w-72 rounded-full object-contain opacity-[0.045]"
          />
          <p className="absolute left-6 top-8 font-display text-5xl font-extrabold tracking-tighter text-ink/[0.03] sm:text-7xl">
            JOY RIDE
          </p>
          <p className="absolute bottom-8 left-6 font-mono text-xs font-bold uppercase tracking-[0.28em] text-ink/[0.04]">
            #PROBABLY THE BEST
          </p>
        </>
      )}

      {variant === 'editorial' && (
        <>
          <img
            src="/logo-joyride.png"
            alt=""
            className="absolute -right-20 top-10 h-80 w-80 rounded-full object-contain opacity-[0.04]"
          />
          <p className="absolute -left-4 bottom-4 font-display text-6xl font-extrabold uppercase tracking-tight text-ink/[0.025] sm:text-8xl">
            NO SOLO PARA GRINGOS
          </p>
        </>
      )}

      {variant === 'menu' && (
        <>
          <img
            src="/logo-joyride.png"
            alt=""
            className="absolute right-6 top-20 h-64 w-64 rounded-full object-contain opacity-[0.04]"
          />
          <p className="absolute left-8 top-28 font-display text-6xl font-extrabold uppercase tracking-tighter text-ink/[0.03] sm:text-8xl">
            PROBABLY THE BEST
          </p>
        </>
      )}

      {variant === 'subtle-emblem' && (
        <img
          src="/logo-joyride.png"
          alt=""
          className="absolute -bottom-12 right-6 h-56 w-56 rounded-full object-contain opacity-[0.04]"
        />
      )}
    </div>
  );
}
