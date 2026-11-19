import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, MapPin, MessageSquarePlus, Plus, Sparkles, Star, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { api, getErrorMessage } from '../../lib/api';
import { formatPrice } from '../../lib/format';
import { Product, Review } from '../../types';

interface MasonryCommunityProps {
  products: Product[];
  onOpenReservation: () => void;
}

const SCATTER_ROTATIONS = [
  'md:-rotate-[1.6deg]',
  'md:rotate-[1.3deg] md:translate-y-3',
  'md:-rotate-[0.9deg]',
  'md:rotate-[1.8deg] md:-translate-y-1',
  'md:-rotate-[1.4deg] md:translate-y-2',
  'md:rotate-[1.1deg]',
];

const GLOW_CLASSES = [
  'card-glow-cyan',
  'card-glow-magenta',
  'card-glow-emerald',
  'card-glow-amber',
];

function GoogleBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function MasonryCommunity({ products, onOpenReservation }: MasonryCommunityProps) {
  const { user } = useAuth();
  const { currency, addItem } = useCart();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [verifiedVia, setVerifiedVia] = useState<'GOOGLE' | 'CUENTA_JOYRIDE'>(
    user ? 'CUENTA_JOYRIDE' : 'GOOGLE'
  );
  const [authorName, setAuthorName] = useState(user?.name || '');
  const [authorOrigin, setAuthorOrigin] = useState('Sucre, Bolivia');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await api.get<{ reviews: Review[] }>('/reviews');
      return res.data.reviews;
    },
  });

  const comboSalsa = products.find((p) => p.slug === 'combo-salsa-bachata');

  const quickAddCombo = (prod?: Product) => {
    if (!prod) return;
    const res = addItem(prod, 1);
    if (!res.ok) {
      pushToast('Stock insuficiente', 'error', res.reason);
      return;
    }
    pushToast('Añadido a tu pedido', 'success', prod.name);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        authorName: (user?.name || authorName || 'Viajero Sucre').trim(),
        authorOrigin: authorOrigin.trim() || 'Sucre, Bolivia',
        verifiedVia,
        rating,
        comment: comment.trim(),
      });
      pushToast('Reseña publicada en Joy Ride', 'success', '¡Gracias por compartir tu experiencia!');
      setComment('');
      setReviewModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    } catch (err) {
      pushToast('No se pudo publicar reseña', 'error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews = reviews || [];

  return (
    <section className="overflow-hidden border-t border-hairline bg-surface/35 py-16 sm:py-24">
      <div className="mx-auto max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
        <div className="mb-12 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-joymagenta/35 bg-joymagenta/10 px-3.5 py-1 text-xs font-bold text-pink-200">
              <Sparkles className="h-3.5 w-3.5 text-joymagenta" />
              <span>4.3 ★ EN GOOGLE · COMUNIDAD JOY RIDE</span>
            </div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl xl:text-5xl">
              Reseñas Reales &amp; Memorias en la Casona
            </h2>
            <p className="mt-2.5 max-w-2xl text-base text-muted sm:text-lg">
              Experiencias de sucrenses y viajeros que pasaron por Nicolás Ortiz N° 14. Deja tu
              reseña con tu cuenta Joy Ride o vinculada con Google.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  pushToast(
                    'Inicia sesión para publicar tu reseña',
                    'info',
                    'Solo cuentas verificadas pueden dejar comentarios en la casona'
                  );
                  navigate('/login');
                  return;
                }
                setAuthorName(user.name || '');
                setVerifiedVia('CUENTA_JOYRIDE');
                setReviewModalOpen(true);
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-joycyan px-5 py-2.5 text-sm font-bold text-obsidian transition-colors hover:bg-joycyan-deep active:scale-[0.96]"
            >
              <MessageSquarePlus className="h-4 w-4" />
              <span>Dejar Reseña</span>
            </button>
            <button
              type="button"
              onClick={onOpenReservation}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-joymagenta/45 bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-joymagenta hover:text-pink-200"
            >
              <span>Planificar Evento o Mesa</span>
            </button>
          </div>
        </div>

        {/* Organic Scattered Tilted Masonry Grid */}
        <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {displayReviews.map((rev, idx) => {
            const rotClass = SCATTER_ROTATIONS[idx % SCATTER_ROTATIONS.length];
            const glowClass = GLOW_CLASSES[idx % GLOW_CLASSES.length];
            const isGoogle = rev.verifiedVia === 'GOOGLE';

            return (
              <motion.article
                key={rev.id}
                initial={{ opacity: 0, y: 26, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.45,
                  delay: Math.min(idx * 0.06, 0.3),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`break-inside-avoid ${rotClass} ${glowClass} rounded-2xl border border-hairline bg-surface p-3.5 shadow-card hover:z-10 hover:-translate-y-1.5 hover:rotate-0`}
              >
                {rev.photoUrl && (
                  <div className="mb-3 overflow-hidden rounded-xl bg-obsidian">
                    <img
                      src={rev.photoUrl}
                      alt={`Memoria Joy Ride por ${rev.authorName}`}
                      className="photo-frame h-48 w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                    />
                  </div>
                )}

                <div className="px-1.5 pb-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, starIdx) => (
                        <Star key={starIdx} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    {isGoogle ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-obsidian px-2.5 py-0.5 text-[11px] font-semibold text-slate-200">
                        <GoogleBadgeIcon />
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-joycyan/40 bg-joycyan/10 px-2.5 py-0.5 text-[11px] font-semibold text-joycyan">
                        <CheckCircle2 className="h-3 w-3" />
                        Verificado
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-slate-200 sm:text-base">
                    &ldquo;{rev.comment}&rdquo;
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-hairline pt-2.5 text-xs">
                    <span className="font-bold text-ink">{rev.authorName}</span>
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-joycyan">
                      <MapPin className="h-3 w-3" />
                      {rev.authorOrigin}
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}

          {/* Highlight Combo Card Woven Into Organic Grid */}
          {comboSalsa && (
            <motion.article
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="card-glow-magenta break-inside-avoid overflow-hidden rounded-2xl border border-joymagenta/45 bg-surface p-3.5 shadow-card md:rotate-[1.4deg] hover:z-10 hover:rotate-0"
            >
              <img
                src={comboSalsa.imageUrl}
                alt={comboSalsa.name}
                className="photo-frame aspect-[4/3] w-full rounded-xl object-cover"
              />
              <div className="p-2">
                <span className="inline-block rounded-full bg-joymagenta/20 px-2.5 py-0.5 text-xs font-bold text-pink-300">
                  COMBO DESTACADO
                </span>
                <h3 className="mt-2 font-display text-lg font-bold text-ink">
                  {comboSalsa.name}
                </h3>
                <p className="mt-1 text-sm text-muted">{comboSalsa.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-base font-bold tabular-nums text-joycyan">
                    {formatPrice(comboSalsa.precioBs, currency, comboSalsa.precioUsd)}
                  </span>
                  <button
                    type="button"
                    disabled={comboSalsa.stockDisponible <= 0}
                    onClick={() => quickAddCombo(comboSalsa)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-joymagenta px-4 py-2 text-xs font-bold text-white hover:bg-joymagenta-deep active:scale-[0.96] disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Pedir Combo</span>
                  </button>
                </div>
              </div>
            </motion.article>
          )}
        </div>
      </div>

      {/* Review Modal with Google Account Linking Simulation / Joy Ride Account */}
      <AnimatePresence>
        {reviewModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Escribir reseña Joy Ride"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewModalOpen(false)}
              className="fixed inset-0 bg-obsidian/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', duration: 0.34, bounce: 0 }}
              className="relative z-10 w-full max-w-lg rounded-3xl border border-hairline bg-surface p-6 shadow-elevated sm:p-7"
            >
              <div className="flex items-center justify-between border-b border-hairline pb-4">
                <div>
                  <h3 className="font-display text-xl font-extrabold text-ink">
                    Compartir tu Reseña en Joy Ride
                  </h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Aparece al instante en el muro comunitario de Sucre
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  aria-label="Cerrar"
                  className="rounded-xl border border-hairline bg-elevated p-2 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedVia('GOOGLE');
                      if (!authorName) setAuthorName('Viajero Google Sucre');
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      verifiedVia === 'GOOGLE'
                        ? 'border-joycyan bg-joycyan/15 text-ink'
                        : 'border-hairline bg-obsidian text-muted hover:text-ink'
                    }`}
                  >
                    <GoogleBadgeIcon />
                    <span>Vincular con Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedVia('CUENTA_JOYRIDE');
                      if (user) setAuthorName(user.name);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                      verifiedVia === 'CUENTA_JOYRIDE'
                        ? 'border-joymagenta bg-joymagenta/15 text-pink-200'
                        : 'border-hairline bg-obsidian text-muted hover:text-ink'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-joymagenta" />
                    <span>Cuenta Joy Ride</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink">Tu Nombre</label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ej. Sofia Alvarez"
                      className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink">Ciudad / País</label>
                    <input
                      type="text"
                      required
                      value={authorOrigin}
                      onChange={(e) => setAuthorOrigin(e.target.value)}
                      placeholder="Sucre, Bolivia"
                      className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Calificación</label>
                  <div className="mt-1.5 flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className="rounded-lg border border-hairline bg-obsidian p-2 transition-transform hover:scale-105"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink">Tu experiencia</label>
                  <textarea
                    rows={3}
                    required
                    minLength={8}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="¿Qué plato, cóctel o noche de salsa recomendarias en Sucre?"
                    className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-joymagenta py-3.5 text-sm font-bold text-white hover:bg-joymagenta-deep disabled:opacity-50"
                >
                  {submitting ? 'Publicando reseña…' : 'Publicar Reseña Ahora'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
