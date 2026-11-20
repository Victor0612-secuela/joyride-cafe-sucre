import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import { JOYRIDE_LOCATION } from '../../lib/constants';

export interface LocationPickPayload {
  lat: number;
  lng: number;
  suggestedAddress?: string;
  suggestedWalkTime?: string;
}

interface NominatimHit {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface AdminLocationPickerProps {
  lat: number;
  lng: number;
  onChange: (next: LocationPickPayload) => void;
}

function estimateWalkTimeFromJoyRide(lat: number, lng: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat - JOYRIDE_LOCATION.lat);
  const dLng = toRad(lng - JOYRIDE_LOCATION.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(JOYRIDE_LOCATION.lat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLng / 2) ** 2;
  const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const streetKm = straightKm * 1.25;

  if (streetKm < 0.08) return '0 min (Frente a Joy Ride)';
  if (streetKm <= 2.4) {
    const mins = Math.max(1, Math.round(streetKm * 12));
    return `${mins} min a pie`;
  }
  const taxiMins = Math.max(5, Math.round(streetKm * 3.5));
  return `${taxiMins} min en taxi (${streetKm.toFixed(1)} km)`;
}

export function AdminLocationPicker({ lat, lng, onChange }: AdminLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimHit[]>([]);
  const [locatingGps, setLocatingGps] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<string>('');

  const reverseLookup = async (nextLat: number, nextLng: number) => {
    const walkTime = estimateWalkTimeFromJoyRide(nextLat, nextLng);
    setLookupStatus('Obteniendo dirección en Sucre…');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextLat}&lon=${nextLng}&zoom=18&addressdetails=1`
      );
      const data = (await res.json()) as {
        address?: {
          road?: string;
          pedestrian?: string;
          neighbourhood?: string;
          suburb?: string;
          city?: string;
        };
        display_name?: string;
      };
      const road = data.address?.road || data.address?.pedestrian;
      const area = data.address?.neighbourhood || data.address?.suburb || 'Sucre';
      const concise = road
        ? `${road} · ${area}, Sucre`
        : data.display_name?.split(',').slice(0, 2).join(',').trim() || '';
      onChangeRef.current({
        lat: nextLat,
        lng: nextLng,
        suggestedAddress: concise || undefined,
        suggestedWalkTime: walkTime,
      });
      setLookupStatus(concise ? `Detectado: ${concise}` : '');
    } catch {
      onChangeRef.current({
        lat: nextLat,
        lng: nextLng,
        suggestedWalkTime: walkTime,
      });
      setLookupStatus('');
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat || JOYRIDE_LOCATION.lat, lng || JOYRIDE_LOCATION.lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(map);

    // Reference anchor for Joy Ride HQ
    const hqIcon = L.divIcon({
      className: 'joyride-hq-ref',
      html: `<div style="width:24px;height:24px;border-radius:9999px;background:#0B0D12;border:2px solid #00A0DF;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,160,223,0.45);"><img src="/logo-joyride.png" style="width:18px;height:18px;object-fit:contain;" /></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng], {
      icon: hqIcon,
      interactive: false,
    }).addTo(map);

    const pickIcon = L.divIcon({
      className: 'joyride-admin-pick-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#F20574;color:#FFFFFF;font-weight:900;font-size:16px;border:3px solid #F8FAFC;box-shadow:0 6px 18px rgba(242,5,116,0.65);cursor:grab;">★</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const marker = L.marker([lat || JOYRIDE_LOCATION.lat, lng || JOYRIDE_LOCATION.lng], {
      icon: pickIcon,
      draggable: true,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      const nextLat = Number(pos.lat.toFixed(6));
      const nextLng = Number(pos.lng.toFixed(6));
      onChangeRef.current({
        lat: nextLat,
        lng: nextLng,
        suggestedWalkTime: estimateWalkTimeFromJoyRide(nextLat, nextLng),
      });
      reverseLookup(nextLat, nextLng);
    });

    map.on('click', (ev: L.LeafletMouseEvent) => {
      const nextLat = Number(ev.latlng.lat.toFixed(6));
      const nextLng = Number(ev.latlng.lng.toFixed(6));
      marker.setLatLng([nextLat, nextLng]);
      onChangeRef.current({
        lat: nextLat,
        lng: nextLng,
        suggestedWalkTime: estimateWalkTimeFromJoyRide(nextLat, nextLng),
      });
      reverseLookup(nextLat, nextLng);
    });

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 260);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Keep pin synced when external lat/lng inputs change
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    try {
      const q = encodeURIComponent(`${query.trim()}, Sucre, Bolivia`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${q}&viewbox=-65.33,-19.09,-65.20,-18.99&bounded=0&limit=5`
      );
      const hits = (await res.json()) as NominatimHit[];
      setResults(Array.isArray(hits) ? hits : []);
      if (!hits || hits.length === 0) {
        setLookupStatus('Sin coincidencias exactas — haz clic directo en el mapa.');
      }
    } catch {
      setLookupStatus('No se pudo buscar en línea; haz clic en el mapa para fijar el pin.');
    } finally {
      setSearching(false);
    }
  };

  const applyHit = (hit: NominatimHit) => {
    const nextLat = Number(Number(hit.lat).toFixed(6));
    const nextLng = Number(Number(hit.lon).toFixed(6));
    const concise = hit.display_name.split(',').slice(0, 2).join(',').trim();
    markerRef.current?.setLatLng([nextLat, nextLng]);
    mapRef.current?.flyTo([nextLat, nextLng], 17, { duration: 0.5 });
    setResults([]);
    setLookupStatus(`Seleccionado: ${concise}`);
    onChange({
      lat: nextLat,
      lng: nextLng,
      suggestedAddress: concise,
      suggestedWalkTime: estimateWalkTimeFromJoyRide(nextLat, nextLng),
    });
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) return;
    setLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLat = Number(pos.coords.latitude.toFixed(6));
        const nextLng = Number(pos.coords.longitude.toFixed(6));
        markerRef.current?.setLatLng([nextLat, nextLng]);
        mapRef.current?.flyTo([nextLat, nextLng], 17, { duration: 0.6 });
        setLocatingGps(false);
        reverseLookup(nextLat, nextLng);
      },
      () => {
        setLocatingGps(false);
        setLookupStatus('GPS del navegador bloqueado; toca el mapa para fijar el punto.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-3 rounded-2xl border border-joycyan/35 bg-obsidian/90 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <MapPin className="h-3.5 w-3.5 text-joymagenta" />
          <span>Selector Interactivo en Mapa de Sucre (Toca o arrastra la estrella ★)</span>
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={locatingGps}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
          >
            <Crosshair className="h-3 w-3" />
            <span>{locatingGps ? 'GPS…' : 'Mi GPS'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              markerRef.current?.setLatLng([JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng]);
              mapRef.current?.flyTo([JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng], 16, { duration: 0.4 });
              onChange({
                lat: JOYRIDE_LOCATION.lat,
                lng: JOYRIDE_LOCATION.lng,
                suggestedAddress: JOYRIDE_LOCATION.address,
                suggestedWalkTime: '0 min (Frente a Joy Ride)',
              });
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-joycyan/40 bg-joycyan/10 px-2.5 py-1 text-[11px] font-bold text-joycyan hover:bg-joycyan/20"
          >
            <Compass className="h-3 w-3" />
            <span>Centro HQ</span>
          </button>
        </div>
      </div>

      {/* Sucre Address Search */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="Buscar calle, plaza, café o barrio en Sucre (ej. La Recoleta)…"
            className="w-full rounded-xl border border-hairline bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-muted"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-joycyan px-3.5 py-2 text-xs font-bold text-obsidian hover:bg-joycyan-deep disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          <span>Buscar</span>
        </button>
      </div>

      {results.length > 0 && (
        <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-hairline bg-surface p-1.5">
          {results.map((hit) => (
            <button
              key={hit.place_id}
              type="button"
              onClick={() => applyHit(hit)}
              className="flex w-full items-start gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-ink hover:bg-elevated"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-joymagenta" />
              <span className="line-clamp-2">{hit.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Leaflet Map Canvas */}
      <div
        ref={containerRef}
        className="joyride-leaflet-relief h-60 w-full overflow-hidden rounded-xl border border-hairline"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="font-mono text-joycyan">
          Lat: {Number(lat).toFixed(5)} · Lng: {Number(lng).toFixed(5)}
        </span>
        {lookupStatus && <span className="truncate text-muted">{lookupStatus}</span>}
      </div>
    </div>
  );
}
