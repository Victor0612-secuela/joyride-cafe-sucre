import React from 'react';

interface ProbablyTaglineProps {
  subject: string;
  accent?: 'cyan' | 'magenta' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  spanishHint?: string;
  className?: string;
}

const ACCENT_MAP = {
  cyan: 'text-joycyan',
  magenta: 'text-joymagenta',
  amber: 'text-amber-400',
};

const SIZE_MAP = {
  sm: {
    main: 'text-xs sm:text-sm',
    hint: 'text-[11px]',
  },
  md: {
    main: 'text-sm sm:text-base',
    hint: 'text-xs',
  },
  lg: {
    main: 'text-base sm:text-lg',
    hint: 'text-xs sm:text-sm',
  },
};

export function ProbablyTagline({
  subject,
  accent = 'cyan',
  size = 'sm',
  spanishHint,
  className = '',
}: ProbablyTaglineProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <p
        className={`inline-flex flex-wrap items-baseline gap-1 font-display font-extrabold tracking-tight text-ink ${s.main}`}
      >
        <span className="opacity-80">Probably</span>
        <span className="text-[0.82em] font-semibold opacity-70">the</span>
        <span className={`${ACCENT_MAP[accent]} font-extrabold tracking-[-0.02em]`}>
          Best {subject}
        </span>
        <span className="opacity-90">
          in Town<sup className="ml-0.5 text-[0.62em] font-mono opacity-80">®</sup>
        </span>
      </p>

      {spanishHint && (
        <span className={`font-mono font-semibold text-muted ${s.hint}`}>
          · {spanishHint}
        </span>
      )}
    </div>
  );
}
