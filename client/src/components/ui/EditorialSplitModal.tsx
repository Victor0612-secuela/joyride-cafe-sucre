import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { joySound } from '../../lib/sound';

interface EditorialSplitModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  accent?: 'cyan' | 'magenta' | 'amber' | 'emerald';
  images: string[];
  videoUrl?: string | null;
  containImage?: boolean;
  children: React.ReactNode;
}

const ACCENT_BG = {
  cyan: 'bg-joycyan text-obsidian',
  magenta: 'bg-joymagenta text-white',
  amber: 'bg-amber-400 text-obsidian',
  emerald: 'bg-emerald-500 text-obsidian',
};

export function EditorialSplitModal({
  open,
  onClose,
  title,
  subtitle,
  badge,
  accent = 'cyan',
  images,
  videoUrl,
  containImage = false,
  children,
}: EditorialSplitModalProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const [shimmering, setShimmering] = useState(false);

  const safeImages = images.length > 0 ? images : ['/images/venue-patio-night.webp'];

  useEffect(() => {
    if (!open) return;
    setImgIdx(0);
    setShimmering(true);
    joySound.modalOpen();
    const t = setTimeout(() => setShimmering(false), 240);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, title]);

  useEffect(() => {
    if (!open || videoUrl || safeImages.length <= 1) return;
    const id = setInterval(() => {
      setImgIdx((i) => (i + 1) % safeImages.length);
    }, 3400);
    return () => clearInterval(id);
  }, [open, videoUrl, safeImages.length]);

  const currentImg = safeImages[imgIdx % safeImages.length];

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Deep Blur Cinema Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-obsidian/80 backdrop-blur-xl"
          />

          {/* Spacious 2-Column Editorial Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', duration: 0.36, bounce: 0 }}
            className="relative z-10 grid max-h-[92vh] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-hairline bg-surface shadow-elevated lg:grid-cols-12"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="photo-overlay absolute right-4 top-4 z-30 rounded-xl border border-white/20 bg-obsidian/85 p-2.5 text-ink backdrop-blur-md transition-colors hover:border-joycyan hover:text-joycyan"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left 50% Visual Stage (Auto-rotating gallery or video) */}
            <div className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden bg-black sm:min-h-[340px] lg:col-span-6 lg:min-h-[540px]">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <AnimatePresence mode="sync" initial={false}>
                  <motion.img
                    key={currentImg}
                    src={currentImg}
                    alt={title}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.04] ${
                      containImage ? 'object-contain p-4' : 'object-cover'
                    }`}
                  />
                </AnimatePresence>
              )}

              <div className="photo-overlay pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

              <div className="photo-overlay relative z-10 flex items-start justify-between p-5">
                {badge && (
                  <span className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold shadow-card ${ACCENT_BG[accent]}`}>
                    {badge}
                  </span>
                )}
              </div>

              {!videoUrl && safeImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i - 1 + safeImages.length) % safeImages.length)}
                    aria-label="Foto anterior"
                    className="photo-overlay absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md hover:border-joycyan"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgIdx((i) => (i + 1) % safeImages.length)}
                    aria-label="Siguiente foto"
                    className="photo-overlay absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur-md hover:border-joycyan"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <div className="relative z-10 flex items-center gap-2 p-4">
                    {safeImages.map((img, i) => (
                      <button
                        key={`${img}-${i}`}
                        type="button"
                        onClick={() => setImgIdx(i)}
                        className={`h-12 w-16 overflow-hidden rounded-lg border transition-all ${
                          imgIdx % safeImages.length === i
                            ? 'border-joycyan ring-2 ring-joycyan/50'
                            : 'border-white/25 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right 50% Content Stage with Skeleton Shimmer Text Reveal */}
            <div className="overscroll-contain flex max-h-[62vh] flex-col overflow-y-auto p-6 sm:p-8 lg:col-span-6 lg:max-h-[92vh]">
              {shimmering ? (
                <div className="space-y-4 pt-2">
                  <div className="skeleton-shimmer h-5 w-32 rounded-md" />
                  <div className="skeleton-shimmer h-9 w-4/5 rounded-md" />
                  <div className="skeleton-shimmer h-4 w-full rounded-md" />
                  <div className="skeleton-shimmer h-4 w-11/12 rounded-md" />
                  <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
                  <div className="skeleton-shimmer h-28 w-full rounded-2xl" />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-1 flex-col justify-between space-y-5 pr-4"
                >
                  <div>
                    {subtitle && (
                      <p className="font-mono text-xs font-bold uppercase tracking-wider text-joycyan">
                        {subtitle}
                      </p>
                    )}
                    <h3 className="mt-1.5 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
                      {title}
                    </h3>
                  </div>

                  <div className="flex-1 space-y-5">{children}</div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
