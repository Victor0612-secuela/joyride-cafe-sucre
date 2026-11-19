import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Crosshair,
  ExternalLink,
  Footprints,
  MapPin,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { JOYRIDE_LOCATION, SUCRE_TOURIST_SPOTS, SucreTouristSpot } from '../lib/constants';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useI18n } from '../context/I18nContext';
import { useToast } from '../context/ToastContext';
import { joySound } from '../lib/sound';
import { Navbar } from '../components/layout/Navbar';

const CATEGORY_FILTERS: Array<{
  id: 'ALL' | SucreTouristSpot['category'];
  labelEs: string;
  labelEn: string;
}> = [
  { id: 'ALL', labelEs: 'Todos los puntos', labelEn: 'All spots' },
  { id: 'JOYRIDE', labelEs: 'Joy Ride HQ', labelEn: 'Joy Ride HQ' },
  { id: 'BARES_NOCHE', labelEs: 'Bares & Terrazas', labelEn: 'Bars & Rooftops' },
  { id: 'CHOCOLATE_GASTRO', labelEs: 'Chocolates & Gastro', labelEn: 'Chocolates & Food' },
  { id: 'CULTURA', labelEs: 'Cultura & Museos', labelEn: 'Culture & Museums' },
  { id: 'MIRADOR', labelEs: 'Miradores', labelEn: 'Viewpoints' },
  { id: 'AVENTURA', labelEs: 'Aventura & Bike', labelEn: 'Adventure & Bike' },
];

export function SucreMapGuidePage() {
  useDocumentTitle('Probably the Best Map in Town — Joy Ride Café®');
  const { t } = useI18n();
  const { pushToast } = useToast();
  const [searchParams] = useSearchParams();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeHaloRef = useRef<L.Polyline | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const initialSpotParam = searchParams.get('spot');
  const initialSpot =
    SUCRE_TOURIST_SPOTS.find((s) => s.id === initialSpotParam) || SUCRE_TOURIST_SPOTS[0];

  const [filter, setFilter] = useState<'ALL' | SucreTouristSpot['category']>('ALL');
  const [selectedSpot, setSelectedSpot] = useState<SucreTouristSpot>(initialSpot);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; label: string } | null>(
    null
  );
  const [locating, setLocating] = useState(false);
  const [panelShimmer, setPanelShimmer] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [routeMetrics, setRouteMetrics] = useState<{ distanceKm: string; etaLabel: string } | null>(
    null
  );

  const visibleSpots = SUCRE_TOURIST_SPOTS.filter(
    (s) => filter === 'ALL' || s.category === filter || s.category === 'JOYRIDE'
  );

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [initialSpot.lat, initialSpot.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Terrain-relief World Topo Map styled in Obsidian Night / Alabaster Light via .joyride-leaflet-relief
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    ).addTo(map);

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    mapInstanceRef.current = map;

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
      userMarkerRef.current = null;
      routeHaloRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Render category-filtered spot pins
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    for (const spot of visibleSpots) {
      const isHQ = spot.category === 'JOYRIDE';
      const isSelected = spot.id === selectedSpot.id;
      const icon = L.divIcon({
        className: 'joyride-tour-pin',
        html: isHQ
          ? `<div style="display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:9999px;background:#0B0D12;border:3px solid #F20574;box-shadow:0 6px 20px rgba(242,5,116,0.6);overflow:hidden;"><img src="/logo-joyride.png" style="width:36px;height:36px;object-fit:contain;" /></div>`
          : `<div style="display:flex;align-items:center;justify-content:center;width:${isSelected ? 34 : 28}px;height:${isSelected ? 34 : 28}px;border-radius:9999px;background:${isSelected ? '#F20574' : '#00A0DF'};color:${isSelected ? '#F8FAFC' : '#0B0D12'};font-weight:800;font-size:12px;border:2px solid #F8FAFC;box-shadow:0 4px 14px rgba(0,160,223,0.5);">★</div>`,
        iconSize: isHQ ? [46, 46] : isSelected ? [34, 34] : [28, 28],
        iconAnchor: isHQ ? [23, 23] : isSelected ? [17, 17] : [14, 14],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${spot.name}</strong><br/>${spot.walkTimeFromJoyRide}`);

      marker.on('click', () => handleSelectSpot(spot));
      markersRef.current.set(spot.id, marker);
    }
  }, [filter, selectedSpot.id]);

  // Draw or clear User GPS Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userCoords) return;

    const gpsIcon = L.divIcon({
      className: 'joyride-user-gps-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#10B981;color:#0B0D12;font-weight:900;font-size:10px;border:3px solid #F8FAFC;box-shadow:0 0 0 6px rgba(16,185,129,0.28);">TÚ</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: gpsIcon })
      .addTo(map)
      .bindPopup(`<strong>Tu ubicación actual</strong><br/>${userCoords.label}`);
  }, [userCoords]);

  // Trace real OSRM street route whenever origin or selected spot changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeHaloRef.current) {
      routeHaloRef.current.remove();
      routeHaloRef.current = null;
    }
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    const originLat = userCoords?.lat ?? JOYRIDE_LOCATION.lat;
    const originLng = userCoords?.lng ?? JOYRIDE_LOCATION.lng;

    if (
      Math.abs(originLat - selectedSpot.lat) < 0.0002 &&
      Math.abs(originLng - selectedSpot.lng) < 0.0002
    ) {
      setRouteMetrics(null);
      return;
    }

    const routeColor = userCoords ? '#10B981' : '#00A0DF';
    const controller = new AbortController();
    fetch(
      `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${selectedSpot.lng},${selectedSpot.lat}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!mapInstanceRef.current) return;
        const route = data?.routes?.[0];
        if (route?.geometry?.coordinates) {
          const latLngs = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [
            lat,
            lng,
          ]);
          routeHaloRef.current = L.polyline(latLngs, {
            color: '#0B0D12',
            weight: 8,
            opacity: 0.35,
          }).addTo(map);
          routeLayerRef.current = L.polyline(latLngs, {
            color: routeColor,
            weight: 4.5,
            opacity: 0.95,
          }).addTo(map);
          const distKm = Number((route.distance || 500) / 1000);
          const etaLabel =
            distKm <= 2.2
              ? `~${Math.max(2, Math.round(distKm * 12))} min a pie`
              : `~${Math.max(4, Math.round(distKm * 3.5))} min en taxi`;
          setRouteMetrics({
            distanceKm: `${distKm.toFixed(2)} km`,
            etaLabel,
          });
        } else {
          const pts: L.LatLngExpression[] = [
            [originLat, originLng],
            [selectedSpot.lat, selectedSpot.lng],
          ];
          routeHaloRef.current = L.polyline(pts, {
            color: '#0B0D12',
            weight: 7,
            opacity: 0.35,
          }).addTo(map);
          routeLayerRef.current = L.polyline(pts, {
            color: routeColor,
            weight: 3.5,
            dashArray: '6 6',
          }).addTo(map);
        }
      })
      .catch(() => {
        if (!mapInstanceRef.current) return;
        const pts: L.LatLngExpression[] = [
          [originLat, originLng],
          [selectedSpot.lat, selectedSpot.lng],
        ];
        routeHaloRef.current = L.polyline(pts, {
          color: '#0B0D12',
          weight: 7,
          opacity: 0.35,
        }).addTo(map);
        routeLayerRef.current = L.polyline(pts, {
          color: routeColor,
          weight: 3.5,
          dashArray: '6 6',
        }).addTo(map);
      });

    return () => controller.abort();
  }, [selectedSpot.id, userCoords?.lat, userCoords?.lng]);

  // Auto-rotate selected spot's photo gallery every 4 seconds
  useEffect(() => {
    if (selectedSpot.images.length <= 1) return;
    const id = setInterval(() => {
      setPhotoIdx((i) => (i + 1) % selectedSpot.images.length);
    }, 4000);
    return () => clearInterval(id);
  }, [selectedSpot.id, selectedSpot.images.length]);

  const handleSelectSpot = (spot: SucreTouristSpot) => {
    setSelectedSpot(spot);
    setPhotoIdx(0);
    setPanelShimmer(true);
    setTimeout(() => setPanelShimmer(false), 260);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([spot.lat, spot.lng], 16, { duration: 0.6 });
      markersRef.current.get(spot.id)?.openPopup();
    }
  };

  const handleUseMyLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setUserCoords({
        lat: -19.0459,
        lng: -65.2607,
        label: 'Zona Facultades · Centro Histórico, Sucre',
      });
      setLocating(false);
      pushToast(
        t('Ubicación calibrada en Sucre', 'Location calibrated in Sucre'),
        'info',
        t('Mostrando rutas desde Centro Sucre', 'Showing routes from Central Sucre')
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextCoords = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          label: t('Tu ubicación en vivo', 'Your live location'),
        };
        setUserCoords(nextCoords);
        setLocating(false);
        mapInstanceRef.current?.flyTo([nextCoords.lat, nextCoords.lng], 15, { duration: 0.7 });
        pushToast(
          t('Tu ubicación GPS está activa', 'Your GPS location is active'),
          'success',
          t('Toca cualquier lugar para trazar tu ruta', 'Tap any spot to trace your walking route')
        );
      },
      () => {
        const fallback = {
          lat: -19.0459,
          lng: -65.2607,
          label: 'Centro Histórico, Sucre (Zona Facultades)',
        };
        setUserCoords(fallback);
        setLocating(false);
        mapInstanceRef.current?.flyTo([fallback.lat, fallback.lng], 15, { duration: 0.7 });
        pushToast(
          t('Punto referencial en Centro Sucre activado', 'Central Sucre reference point active'),
          'info',
          t(
            'GPS no autorizado en el navegador; trazando desde Zona Estudiantes',
            'Browser GPS unavailable; tracing from Zona Estudiantes'
          )
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const activeOriginLat = userCoords?.lat ?? JOYRIDE_LOCATION.lat;
  const activeOriginLng = userCoords?.lng ?? JOYRIDE_LOCATION.lng;
  const currentPhoto = selectedSpot.images[photoIdx % selectedSpot.images.length] || selectedSpot.imageUrl;

  return (
    <div className="min-h-screen bg-obsidian text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1640px] px-5 pb-20 pt-28 sm:px-8 lg:px-12 xl:px-14">
        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-joycyan hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('Volver a Joy Ride Café®', 'Back to Joy Ride Café®')}</span>
            </Link>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl xl:text-5xl">
              Probably the Best Map in Town
            </h1>
            <p className="mt-2.5 max-w-3xl text-base text-muted sm:text-lg">
              {t(
                'Guía interactiva de la Ciudad Blanca: ubica nuestra casona en Nicolás Ortiz N° 14, Chocolates Para Ti, El Purgatorium, Terraza 625 y traza rutas a pie desde tu ubicación.',
                'Interactive White City guide: locate our colonial house at Nicolás Ortiz N° 14, Chocolates Para Ti, El Purgatorium, Terraza 625 and trace walking routes from your location.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={locating}
              onClick={() => {
                joySound.click();
                handleUseMyLocation();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-60"
            >
              <Crosshair className="h-4 w-4" />
              <span>
                {locating
                  ? t('Localizando GPS…', 'Locating GPS…')
                  : userCoords
                  ? t('Actualizar mi GPS', 'Refresh my GPS')
                  : t('Usar mi Ubicación GPS', 'Use my GPS Location')}
              </span>
            </button>
            <a
              href={JOYRIDE_LOCATION.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-joymagenta px-4 py-2.5 text-sm font-bold text-white hover:bg-joymagenta-deep"
            >
              <Compass className="h-4 w-4" />
              <span>{t('Cómo llegar a Joy Ride', 'Directions to Joy Ride')}</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-6 flex items-center gap-2.5 overflow-x-auto pb-2">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                joySound.click();
                setFilter(cat.id);
              }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                filter === cat.id
                  ? 'border-joycyan bg-joycyan text-obsidian'
                  : 'border-hairline bg-surface text-muted hover:text-ink'
              }`}
            >
              {t(cat.labelEs, cat.labelEn)}
            </button>
          ))}
        </div>

        {/* Interactive Map + Shimmered Below-Map Detail Card | Directory List */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left 7 Cols: Interactive Leaflet Map + Dynamic Selected Spot Card below it */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="overflow-hidden rounded-3xl border border-hairline bg-surface shadow-elevated">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-elevated/80 px-4 py-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold text-ink">
                  <Navigation className="h-4 w-4 text-joycyan" />
                  <span>
                    {userCoords
                      ? t('Trazando ruta desde tu GPS', 'Tracing route from your GPS')
                      : t('Trazando desde Joy Ride Café®', 'Tracing from Joy Ride Café®')}{' '}
                    → <strong className="text-joycyan">{selectedSpot.name}</strong>
                  </span>
                </div>
                {routeMetrics && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-mono text-xs font-bold tabular-nums text-emerald-300">
                    <Clock className="h-3.5 w-3.5" />
                    {routeMetrics.distanceKm} · {routeMetrics.etaLabel}
                  </span>
                )}
              </div>
              <div ref={mapContainerRef} className="joyride-leaflet-relief h-[380px] w-full sm:h-[460px]" />
            </div>

            {/* Dynamic Place Detail Directly Below Map (No empty dark gap!) */}
            <div className="overflow-hidden rounded-3xl border border-joycyan/40 bg-surface p-5 shadow-card sm:p-6">
              {panelShimmer ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                  <div className="skeleton-shimmer h-56 rounded-2xl md:col-span-5" />
                  <div className="space-y-3 md:col-span-7">
                    <div className="skeleton-shimmer h-5 w-36 rounded-md" />
                    <div className="skeleton-shimmer h-7 w-3/4 rounded-md" />
                    <div className="skeleton-shimmer h-4 w-full rounded-md" />
                    <div className="skeleton-shimmer h-4 w-5/6 rounded-md" />
                    <div className="skeleton-shimmer h-16 w-full rounded-xl" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                  {/* Auto-rotating & User-Controllable Photo Gallery */}
                  <div className="flex flex-col gap-2.5 md:col-span-5">
                    <div className="relative h-56 overflow-hidden rounded-2xl bg-obsidian">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentPhoto}
                          src={currentPhoto}
                          alt={selectedSpot.name}
                          initial={{ opacity: 0.35, scale: 1.03 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0.35 }}
                          transition={{ duration: 0.35 }}
                          className="photo-frame h-full w-full object-cover"
                        />
                      </AnimatePresence>

                      {selectedSpot.images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoIdx(
                                (i) => (i - 1 + selectedSpot.images.length) % selectedSpot.images.length
                              )
                            }
                            aria-label="Foto anterior"
                            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-obsidian/75 p-1.5 text-ink hover:border-joycyan"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPhotoIdx((i) => (i + 1) % selectedSpot.images.length)}
                            aria-label="Siguiente foto"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-obsidian/75 p-1.5 text-ink hover:border-joycyan"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {selectedSpot.images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedSpot.images.map((img, i) => (
                          <button
                            key={`${selectedSpot.id}-thumb-${i}`}
                            type="button"
                            onClick={() => setPhotoIdx(i)}
                            className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                              photoIdx % selectedSpot.images.length === i
                                ? 'border-joycyan ring-1 ring-joycyan'
                                : 'border-hairline opacity-65 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Place Story, Address, Highlights & Route CTA */}
                  <div className="flex flex-col justify-between md:col-span-7">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-joycyan/15 px-3 py-1 text-xs font-bold text-joycyan">
                          {selectedSpot.category}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-joymagenta">
                          <Footprints className="h-3.5 w-3.5" />
                          {selectedSpot.walkTimeFromJoyRide}
                        </span>
                      </div>

                      <h2 className="mt-2.5 font-display text-2xl font-extrabold text-ink">
                        {selectedSpot.name}
                      </h2>
                      <p className="mt-1 font-mono text-xs text-muted">
                        {selectedSpot.address} · {selectedSpot.hours}
                      </p>

                      <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                        {selectedSpot.summary}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {selectedSpot.highlights.map((h) => (
                          <span
                            key={h}
                            className="inline-flex items-center gap-1 rounded-full border border-hairline bg-obsidian px-2.5 py-1 text-xs font-medium text-slate-200"
                          >
                            <Sparkles className="h-3 w-3 text-joycyan" />
                            {h}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-hairline bg-obsidian p-3 text-xs text-muted sm:text-sm">
                        <strong className="text-joycyan">Tip Joy Ride:</strong> {selectedSpot.tip}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (!userCoords) handleUseMyLocation();
                          mapInstanceRef.current?.flyTo([selectedSpot.lat, selectedSpot.lng], 16, {
                            duration: 0.6,
                          });
                        }}
                        className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 sm:text-sm"
                      >
                        <Navigation className="h-4 w-4" />
                        <span>Trazar desde mi GPS</span>
                      </button>

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&origin=${activeOriginLat},${activeOriginLng}&destination=${selectedSpot.lat},${selectedSpot.lng}&travelmode=walking`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-joycyan px-4 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep sm:text-sm"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Abrir en Google Maps</span>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Rich Categorized Spot Directory */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="rounded-3xl border border-hairline bg-surface p-5 shadow-card">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-ink sm:text-xl">
                    Lugares &amp; Bares Recomendados ({visibleSpots.length})
                  </h2>
                  <p className="text-xs text-muted">
                    Toca cualquier lugar para enfocar el mapa, ver galería y trazar ruta
                  </p>
                </div>
              </div>

              <div className="overscroll-contain mt-4 max-h-[680px] space-y-2.5 overflow-y-auto pr-1">
                {visibleSpots.map((spot) => {
                  const active = selectedSpot.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => handleSelectSpot(spot)}
                      className={`group flex w-full items-center gap-3.5 rounded-2xl border p-3 text-left transition-all ${
                        active
                          ? 'border-joycyan bg-joycyan/15 shadow-card'
                          : 'border-hairline bg-obsidian hover:border-white/25 hover:bg-elevated/60'
                      }`}
                    >
                      <img
                        src={spot.imageUrl}
                        alt={spot.name}
                        className="photo-frame h-16 w-20 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-joymagenta">
                            {spot.category}
                          </span>
                          <span className="truncate font-mono text-[11px] text-joycyan">
                            {spot.walkTimeFromJoyRide}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-bold text-ink sm:text-base">
                          {spot.name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted">{spot.address}</p>
                      </div>
                      <MapPin
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          active ? 'text-joymagenta' : 'text-joycyan'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
