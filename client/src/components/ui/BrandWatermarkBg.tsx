import React from 'react';

export type BrandWatermarkVariant =
  | 'split-form'
  | 'editorial'
  | 'menu'
  | 'map'
  | 'orders'
  | 'admin'
  | 'subtle-emblem';

interface BrandWatermarkBgProps {
  variant?: BrandWatermarkVariant;
  bgImage?: string;
  emblemSide?: 'left' | 'right';
  className?: string;
}

interface VariantTheme {
  phrases: string[];
  rotateClass: string;
  textOpacityClass: string;
  emblemOpacityClass: string;
  topLeftGlow: string;
  bottomRightGlow: string;
}

const VARIANT_THEMES: Record<BrandWatermarkVariant, VariantTheme> = {
  editorial: {
    phrases: [
      'JOY RIDE CAFÉ®',
      'NO SOLO PARA GRINGOS',
      'PROBABLY THE BEST BAR IN TOWN',
      'SUCRE · EST. 2001',
    ],
    rotateClass: '-rotate-[14deg]',
    textOpacityClass: 'text-ink/[0.032]',
    emblemOpacityClass: 'opacity-[0.055]',
    topLeftGlow: 'radial-gradient(circle, rgba(0,160,223,0.065) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(242,5,116,0.055) 0%, transparent 70%)',
  },
  menu: {
    phrases: [
      'PROBABLY THE BEST MENU IN TOWN',
      'PIQUE · SINGANI · CAFÉ',
      'COCINA & BARRA',
      'JOY RIDE CAFÉ®',
    ],
    rotateClass: '-rotate-[11deg]',
    textOpacityClass: 'text-ink/[0.032]',
    emblemOpacityClass: 'opacity-[0.05]',
    topLeftGlow: 'radial-gradient(circle, rgba(242,5,116,0.065) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(0,160,223,0.058) 0%, transparent 70%)',
  },
  map: {
    phrases: [
      'PROBABLY THE BEST MAP IN TOWN',
      'NICOLÁS ORTIZ N° 14',
      'CIUDAD BLANCA · SUCRE',
      'MOUNTAIN BIKE & BARES',
    ],
    rotateClass: 'rotate-[10deg]',
    textOpacityClass: 'text-ink/[0.03]',
    emblemOpacityClass: 'opacity-[0.05]',
    topLeftGlow: 'radial-gradient(circle, rgba(16,185,129,0.065) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(0,160,223,0.06) 0%, transparent 70%)',
  },
  orders: {
    phrases: [
      'PROBABLY THE BEST NIGHTS IN TOWN',
      'SEGUIMIENTO EN VIVO · PIN',
      'COCINA → TU MESA',
      'JOY RIDE CAFÉ®',
    ],
    rotateClass: '-rotate-[12deg]',
    textOpacityClass: 'text-ink/[0.03]',
    emblemOpacityClass: 'opacity-[0.05]',
    topLeftGlow: 'radial-gradient(circle, rgba(0,160,223,0.065) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(242,5,116,0.055) 0%, transparent 70%)',
  },
  admin: {
    phrases: [
      'JOY RIDE HQ · EST. 2001',
      'CONTROL · KARDEX · AGENDA',
      'PROBABLY THE BEST OPS IN TOWN',
      'SUCRE · BOLIVIA',
    ],
    rotateClass: '-rotate-[16deg]',
    textOpacityClass: 'text-ink/[0.025]',
    emblemOpacityClass: 'opacity-[0.042]',
    topLeftGlow: 'radial-gradient(circle, rgba(0,160,223,0.05) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(242,5,116,0.045) 0%, transparent 70%)',
  },
  'split-form': {
    phrases: [
      'NO SOLO PARA GRINGOS',
      'BIENVENIDO A LA CASONA',
      'JOY RIDE CAFÉ®',
      'EST. 2001 · SUCRE',
    ],
    rotateClass: '-rotate-[14deg]',
    textOpacityClass: 'text-ink/[0.034]',
    emblemOpacityClass: 'opacity-[0.058]',
    topLeftGlow: 'radial-gradient(circle, rgba(0,160,223,0.07) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(242,5,116,0.06) 0%, transparent 70%)',
  },
  'subtle-emblem': {
    phrases: ['JOY RIDE CAFÉ®', 'SUCRE · EST. 2001', 'NO SOLO PARA GRINGOS', 'PROBABLY THE BEST BAR IN TOWN'],
    rotateClass: '-rotate-[14deg]',
    textOpacityClass: 'text-ink/[0.025]',
    emblemOpacityClass: 'opacity-[0.05]',
    topLeftGlow: 'radial-gradient(circle, rgba(0,160,223,0.05) 0%, transparent 70%)',
    bottomRightGlow: 'radial-gradient(circle, rgba(242,5,116,0.045) 0%, transparent 70%)',
  },
};

/**
 * Ambient Joy Ride background canvas tuned per section:
 * 1) Optional full-bleed faded venue photography blended cleanly top & bottom
 * 2) Section-tuned tilted diagonal repeating branded wallpaper text & palette depth
 * 3) One large monumental circular emblem softly anchored to left or right edge
 */
export function BrandWatermarkBg({
  variant = 'editorial',
  bgImage,
  emblemSide = 'right',
  className = '',
}: BrandWatermarkBgProps) {
  const cfg = VARIANT_THEMES[variant] || VARIANT_THEMES.editorial;
  const emblemPos =
    emblemSide === 'left'
      ? '-left-28 top-1/2 -translate-y-1/2'
      : '-right-28 top-1/2 -translate-y-1/2';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden select-none ${className}`}
    >
      {/* 1. Optional Full-Bleed Atmospheric Faded Photo */}
      {bgImage && (
        <>
          <img
            src={bgImage}
            alt=""
            loading="lazy"
            className="ambient-bleed-photo absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="ambient-bleed-scrim absolute inset-0" />
        </>
      )}

      {/* 2. Subtle Embossed Relief Micro-Grid + Dual-Tone Palette Depth */}
      <div className="bg-relief-pattern absolute inset-0 opacity-50" />
      <div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: cfg.topLeftGlow }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: cfg.bottomRightGlow }}
      />

      {/* 3. Tilted Diagonal Repeating Section Wallpaper */}
      {variant !== 'subtle-emblem' && (
        <div
          className={`absolute -inset-24 flex ${cfg.rotateClass} scale-125 flex-col justify-center gap-12 sm:gap-16`}
        >
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className={`flex items-center justify-around gap-10 whitespace-nowrap ${
                row % 2 === 1 ? '-translate-x-20' : ''
              }`}
            >
              {[0, 1, 2, 3].map((col) => {
                const phrase = cfg.phrases[(row + col) % cfg.phrases.length];
                return (
                  <span
                    key={`${row}-${col}`}
                    className={`font-display text-2xl font-extrabold uppercase tracking-[0.16em] ${cfg.textOpacityClass} sm:text-4xl lg:text-5xl`}
                  >
                    {phrase}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* 4. One Monumental Subtle Logo Anchored Along Edge */}
      <img
        src="/logo-joyride.png"
        alt=""
        className={`absolute h-[400px] w-[400px] rounded-full object-contain ${cfg.emblemOpacityClass} sm:h-[520px] sm:w-[520px] ${
          variant === 'subtle-emblem'
            ? '-bottom-16 right-4 h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]'
            : emblemPos
        }`}
      />
    </div>
  );
}
