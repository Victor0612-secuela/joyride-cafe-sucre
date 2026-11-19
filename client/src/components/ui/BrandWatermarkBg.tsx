import React from 'react';

interface BrandWatermarkBgProps {
  variant?: 'split-form' | 'editorial' | 'menu' | 'subtle-emblem';
  bgImage?: string;
  emblemSide?: 'left' | 'right';
  className?: string;
}

const WALLPAPER_CELLS = [
  'JOY RIDE CAFÉ®',
  'NO SOLO PARA GRINGOS',
  'PROBABLY THE BEST',
  'SUCRE · EST. 2001',
];

/**
 * Ambient Joy Ride background canvas:
 * 1) Optional full-bleed faded venue photography blended cleanly top & bottom
 * 2) Subtle tilted diagonal repeating branded wallpaper text
 * 3) One large monumental emblem softly anchored to the left or right edge
 */
export function BrandWatermarkBg({
  variant = 'editorial',
  bgImage,
  emblemSide = 'right',
  className = '',
}: BrandWatermarkBgProps) {
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

      {/* 2. Subtle Embossed Relief Micro-Grid + Radial Cyan/Magenta Depth */}
      <div className="bg-relief-pattern absolute inset-0 opacity-50" />
      <div
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,160,223,0.06) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(242,5,116,0.055) 0%, transparent 70%)' }}
      />

      {/* 3. Tilted Diagonal Repeating Branded Wallpaper */}
      {variant !== 'subtle-emblem' && (
        <div className="absolute -inset-24 flex -rotate-[14deg] scale-125 flex-col justify-center gap-12 sm:gap-16">
          {[0, 1, 2, 3, 4].map((row) => (
            <div
              key={row}
              className={`flex items-center justify-around gap-10 whitespace-nowrap ${
                row % 2 === 1 ? '-translate-x-20' : ''
              }`}
            >
              {[0, 1, 2, 3].map((col) => {
                const phrase = WALLPAPER_CELLS[(row + col) % WALLPAPER_CELLS.length];
                return (
                  <span
                    key={`${row}-${col}`}
                    className="font-display text-2xl font-extrabold uppercase tracking-[0.16em] text-ink/[0.032] sm:text-4xl lg:text-5xl"
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
        className={`absolute h-[400px] w-[400px] rounded-full object-contain opacity-[0.055] sm:h-[520px] sm:w-[520px] ${
          variant === 'subtle-emblem'
            ? '-bottom-16 right-4 h-[280px] w-[280px] sm:h-[340px] sm:w-[340px]'
            : emblemPos
        }`}
      />
    </div>
  );
}
