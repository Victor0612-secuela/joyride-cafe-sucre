import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface JoyRideHeritageLockupProps {
  forceTone?: 'white' | 'dark';
  className?: string;
  alt?: string;
}

export function JoyRideHeritageLockup({
  forceTone,
  className = 'h-16 sm:h-20 w-auto',
  alt = 'Joy Ride Café — No Solo Para Gringos · Probably the Best Bar in Town®',
}: JoyRideHeritageLockupProps) {
  const { theme } = useTheme();
  const useDarkInk = forceTone ? forceTone === 'dark' : theme === 'light';

  const src = useDarkInk
    ? '/assets/brand/joyride-emblem-probably-dark.png'
    : '/assets/brand/joyride-emblem-probably-white.png';

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`select-none object-contain ${className}`}
    />
  );
}
