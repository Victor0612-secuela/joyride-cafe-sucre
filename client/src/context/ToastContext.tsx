import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  pushToast: (title: string, tone?: ToastTone, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (title: string, tone: ToastTone = 'info', description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, tone, description }]);
      if (tone !== 'error') {
        setTimeout(() => dismiss(id), 4200);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-elevated backdrop-blur-md ${
                t.tone === 'success'
                  ? 'border-emerald-500/40 bg-surface/95 text-ink'
                  : t.tone === 'error'
                  ? 'border-joymagenta/50 bg-surface/95 text-ink'
                  : 'border-joycyan/40 bg-surface/95 text-ink'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {t.tone === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {t.tone === 'error' && <AlertCircle className="h-4 w-4 text-joymagenta" />}
                {t.tone === 'info' && <Info className="h-4 w-4 text-joycyan" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-ink">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Cerrar notificación"
                className="rounded-md p-1 text-muted transition-colors hover:bg-elevated hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
