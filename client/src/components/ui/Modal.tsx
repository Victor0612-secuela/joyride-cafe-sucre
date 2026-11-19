import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidthClass = 'max-w-2xl',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Ventana modal'}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: 6 }}
            transition={{ type: 'spring', duration: 0.34, bounce: 0 }}
            className={`relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-elevated ${maxWidthClass}`}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  {title && <h3 className="font-display text-lg font-bold text-ink sm:text-xl">{title}</h3>}
                  {subtitle && <p className="mt-0.5 text-xs text-muted sm:text-sm">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="rounded-lg border border-hairline bg-elevated p-2 text-muted transition-colors hover:border-joycyan/50 hover:text-ink active:scale-[0.96]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {!title && !subtitle && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-3 top-3 z-20 rounded-lg border border-white/15 bg-black/60 p-2 text-ink backdrop-blur-md transition-colors hover:bg-black/80 active:scale-[0.96]"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <div className="overscroll-contain overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
