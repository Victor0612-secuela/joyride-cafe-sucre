import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  Footprints,
  MapPin,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { JOYRIDE_LOCATION } from '../../lib/constants';
import { usePublicMapSpots } from '../../lib/mapSpots';
import { useI18n } from '../../context/I18nContext';
import { joySound } from '../../lib/sound';
import { JoyRideEvent } from '../../types';
import { BrandWatermarkBg } from '../ui/BrandWatermarkBg';
import { EditorialSplitModal } from '../ui/EditorialSplitModal';
import { ProbablyTagline } from '../ui/ProbablyTagline';

function normalizeAccent(accent: string): 'cyan' | 'magenta' | 'amber' | 'emerald' {
  if (accent === 'magenta' || accent === 'amber' || accent === 'emerald') return accent;
  return 'cyan';
}

export function SucreEventsTourismCarousel({
  onOpenReservation,
}: {
  onOpenReservation?: () => void;
}) {
  const { t } = useI18n();
  const { spots: dynamicSpots } = usePublicMapSpots();
  const { data: apiEvents, isLoading } = useQuery({
    queryKey: ['events', 'public'],
    queryFn: async () => {
      const res = await api.get<{ events: JoyRideEvent[] }>('/events');
      return res.data.events;
    },
    refetchInterval: 20000,
  });

  const events: JoyRideEvent[] = useMemo(() => {
    if (apiEvents && apiEvents.length > 0) return apiEvents;
    if (isLoading) return [];
    // Graceful static fallback only if DB returned empty
    return dynamicSpots.slice(0, 6).map((spot, idx) => ({
      id: spot.id,
      slug: spot.id,
      title: spot.name,
      subtitle: spot.walkTimeFromJoyRide,
      description: spot.summary,
      badge: spot.category.replace('_', ' '),
      accent: idx % 2 === 0 ? 'magenta' : 'cyan',
      locationLabel: spot.address,
      scheduleLabel: spot.hours,
      imageUrl: spot.imageUrl,
      imagesJson: spot.images,
      videoUrl: null,
      spotId: spot.id,
      isActive: true,
      isFeatured: true,
      sortOrder: idx,
      createdAt: '',
    }));
  }, [apiEvents, isLoading]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [modalEvent, setModalEvent] = useState<JoyRideEvent | null>(null);

  useEffect(() => {
    if (activeIndex >= events.length && events.length > 0) {
      setActiveIndex(0);
    }
  }, [events.length, activeIndex]);

  useEffect(() => {
    if (paused || modalEvent || events.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % events.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [paused, modalEvent, events.length]);

  const current = events[activeIndex] || events[0];

  const handleStep = (delta: number) => {
    if (events.length === 0) return;
    joySound.slide();
    setActiveIndex((prev) => (prev + delta + events.length) % events.length);
  };

  const modalSpot = useMemo(() => {
    if (!modalEvent) return null;
    return (
      dynamicSpots.find((s) => s.id === modalEvent.spotId) || dynamicSpots[0]
    );
  }, [modalEvent, dynamicSpots]);

  const modalImages = useMemo(() => {
    if (!modalEvent) return [];
    const list = [
      modalEvent.imageUrl,
      ...(Array.isArray(modalEvent.imagesJson) ? modalEvent.imagesJson : []),
      ...(modalSpot?.images || []),
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [modalEvent, modalSpot]);

  return (
    <section
      id="turismo"
      className="relative overflow-hidden py-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <BrandWatermarkBg
        variant="editorial"
        bgImage="/images/sucre-mirador-sunset.webp"
        emblemSide="right"
      />
      <div className="relative z-10 mx-auto max-w-[1640px] px-5 sm:px-8 lg:px-12 xl:px-14">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <ProbablyTagline
            subject="Events"
            accent="cyan"
            size="sm"
            spanishHint={t('Probablemente los mejores eventos en Sucre', 'Live Agenda & White City Route')}
          />
          <h2 className="mt-1.5 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl xl:text-5xl">
            {t('Eventos del Local & Ruta Turística Sucre', 'Venue Events & Sucre Tourist Route')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
            {t(
              'Noches en Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 y miradores coloniales conectados directo con nuestra ruta interactiva.',
              'Nights at Nicolás Ortiz 14, Chocolates Para Ti, El Purgatorium, Terraza 625 and colonial viewpoints linked directly to our interactive map.'
            )}
          </p>
        </div>

        <Link
          to="/mapa-sucre"
          onClick={() => joySound.click()}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-joycyan/50 bg-joycyan/10 px-5 py-2.5 text-sm font-bold text-joycyan transition-colors hover:bg-joycyan/20"
        >
          <Compass className="h-4 w-4" />
          <span>{t('Probably the Best Map in Town®', 'Probably the Best Map in Town®')}</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      {/* Main Dynamic Event & Tourism Stage */}
      {isLoading || !current ? (
        <div className="skeleton-shimmer h-[460px] w-full rounded-3xl border border-hairline" />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-elevated">
          <div className="relative h-[430px] w-full overflow-hidden bg-black sm:h-[490px] xl:h-[530px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0.25, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0.25, x: -24 }}
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="photo-overlay relative h-full w-full cursor-pointer"
                onClick={() => setModalEvent(current)}
              >
                {current.videoUrl ? (
                  <video
                    src={current.videoUrl}
                    poster={current.imageUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="h-full w-full object-cover object-center brightness-95"
                  />
                ) : (
                  <img
                    src={current.imageUrl}
                    alt={current.title}
                    className="h-full w-full object-cover object-center brightness-100 transition-transform duration-700 hover:scale-[1.03]"
                  />
                )}

                {/* Luminous bottom-to-top editorial gradient scrim so photography pops cleanly */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/20" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 lg:p-12">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-joycyan/25 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-joycyan backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5" />
                        {current.badge}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/55 px-3 py-1 font-mono text-xs text-white backdrop-blur-md">
                        <MapPin className="h-3.5 w-3.5 text-joymagenta" />
                        {current.locationLabel}
                      </span>
                      {current.videoUrl && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-joymagenta px-2.5 py-1 font-mono text-[11px] font-bold text-white">
                          <PlayCircle className="h-3.5 w-3.5" />
                          VIDEO
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl xl:text-5xl">
                      {current.title}
                    </h3>
                    <p className="mt-1.5 font-mono text-xs font-semibold text-joycyan sm:text-sm">
                      {current.subtitle} · {current.scheduleLabel}
                    </p>
                    <p className="mt-2.5 line-clamp-2 max-w-2xl text-sm text-slate-200 sm:text-base">
                      {current.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalEvent(current);
                        }}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-joycyan px-5 py-2.5 text-xs font-bold text-obsidian transition-transform hover:scale-[1.02] hover:bg-joycyan-deep sm:text-sm"
                      >
                        <span>{t('Ver Info, Galería y Ruta', 'See Info, Gallery & Route')}</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>

                      <Link
                        to={`/mapa-sucre?spot=${encodeURIComponent(current.spotId)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          joySound.click();
                        }}
                        className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/30 bg-black/55 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:border-joycyan sm:text-sm"
                      >
                        <Compass className="h-4 w-4 text-joycyan" />
                        <span>{t('Ubicar en Mapa Sucre', 'Pin on Sucre Map')}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Left / Right Manual Navigation Arrows */}
            {events.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => handleStep(-1)}
                  aria-label={t('Evento anterior', 'Previous event')}
                  className="photo-overlay absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-joycyan sm:left-5"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStep(1)}
                  aria-label={t('Siguiente evento', 'Next event')}
                  className="photo-overlay absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white backdrop-blur-md transition-all hover:scale-105 hover:border-joycyan sm:right-5"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Interactive Bottom Selector Rail */}
          <div className="flex items-center gap-2.5 overflow-x-auto border-t border-hairline bg-elevated/60 px-4 py-3">
            {events.map((ev, idx) => {
              const active = idx === activeIndex;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    joySound.slide();
                    setActiveIndex(idx);
                  }}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-all ${
                    active
                      ? 'border-joycyan bg-surface shadow-card'
                      : 'border-transparent opacity-70 hover:border-hairline hover:bg-surface/60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={ev.imageUrl}
                    alt=""
                    className="photo-frame h-10 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 max-w-[190px]">
                    <p className="truncate text-xs font-bold text-ink">{ev.title}</p>
                    <p className="truncate font-mono text-[10px] text-joycyan">
                      {ev.scheduleLabel}
                    </p>
                  </div>
                </button>
              );
            })}
            <span className="ml-auto shrink-0 pl-2 font-mono text-xs text-muted">
              {activeIndex + 1} / {events.length}
            </span>
          </div>
        </div>
      )}
      </div>

      {/* Wide 2-Column Split Modal (Auto-rotating Left Photos/Video + Right Dynamic Info) */}
      <EditorialSplitModal
        open={Boolean(modalEvent)}
        onClose={() => setModalEvent(null)}
        title={modalEvent?.title || ''}
        subtitle={`${modalEvent?.subtitle || ''} · ${modalEvent?.scheduleLabel || ''}`}
        badge={modalEvent?.badge}
        accent={normalizeAccent(modalEvent?.accent || 'cyan')}
        images={modalImages}
        videoUrl={modalEvent?.videoUrl}
      >
        {modalEvent && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-joycyan/40 bg-joycyan/10 px-3 py-1 font-medium text-joycyan">
                <MapPin className="h-3.5 w-3.5" />
                {modalEvent.locationLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-elevated px-3 py-1 font-mono text-muted">
                <CalendarClock className="h-3.5 w-3.5 text-joymagenta" />
                {modalEvent.scheduleLabel}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ink/90 sm:text-base">
              {modalEvent.description}
            </p>

            {modalSpot && (
              <div className="space-y-3 rounded-2xl border border-hairline bg-elevated/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-ink">{modalSpot.name}</span>
                  <span className="inline-flex items-center gap-1 font-mono text-joycyan">
                    <Footprints className="h-3.5 w-3.5" />
                    {modalSpot.walkTimeFromJoyRide}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted">{modalSpot.tip}</p>
                <div className="flex flex-wrap gap-1.5">
                  {modalSpot.highlights.map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-[11px] font-medium text-ink"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
              <Link
                to={`/mapa-sucre?spot=${encodeURIComponent(modalEvent.spotId)}`}
                onClick={() => {
                  joySound.click();
                  setModalEvent(null);
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-joycyan px-4 py-2.5 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
              >
                <Compass className="h-4 w-4" />
                <span>{t('Ver Ruta en Mapa Sucre', 'View Route on Sucre Map')}</span>
              </Link>

              {modalEvent.spotId === 'joyride-hq' && onOpenReservation ? (
                <button
                  type="button"
                  onClick={() => {
                    joySound.click();
                    setModalEvent(null);
                    onOpenReservation();
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-sm font-bold text-white hover:bg-joymagenta-deep"
                >
                  <span>{t('Reservar Mesa / Pista', 'Reserve Table / Dancefloor')}</span>
                </button>
              ) : (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${
                    modalSpot?.lat ?? JOYRIDE_LOCATION.lat
                  },${modalSpot?.lng ?? JOYRIDE_LOCATION.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-hairline bg-elevated px-4 py-2.5 text-sm font-semibold text-ink hover:border-joycyan"
                >
                  <MapPin className="h-4 w-4 text-joymagenta" />
                  <span>Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </EditorialSplitModal>
    </section>
  );
}
