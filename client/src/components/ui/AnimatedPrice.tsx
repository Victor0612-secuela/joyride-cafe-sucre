import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../lib/format';

export function AnimatedPrice({
  bs,
  usd,
  className = '',
  reverse = false,
}: {
  bs: number | string;
  usd?: number | string;
  className?: string;
  reverse?: boolean;
}) {
  const { currency } = useCart();
  const displayCurrency = reverse ? (currency === 'BOB' ? 'USD' : 'BOB') : currency;
  const text = formatPrice(bs, displayCurrency, usd);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={`${displayCurrency}-${text}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className={`inline-block tabular-nums ${className}`}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
