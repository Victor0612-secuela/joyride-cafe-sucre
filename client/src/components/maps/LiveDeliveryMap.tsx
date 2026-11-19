import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, Clock, ExternalLink, MapPin } from 'lucide-react';
import { JOYRIDE_LOCATION } from '../../lib/constants';
import { useI18n } from '../../context/I18nContext';
import { OrderStatus } from '../../types';

interface LiveDeliveryMapProps {
  status: OrderStatus;
  destLat?: number | null;
  destLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;
  etaMinutes?: number | null;
  deliveryAddress?: string | null;
}

export function LiveDeliveryMap({
  status,
  destLat,
  destLng,
  riderLat,
  riderLng,
  etaMinutes,
  deliveryAddress,
}: LiveDeliveryMapProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const [routeDistanceKm, setRouteDistanceKm] = useState<string>('1.1 km');

  const dLat = destLat ?? -19.0442;
  const dLng = destLng ?? -65.2618;
  const rLat = riderLat ?? JOYRIDE_LOCATION.lat;
  const rLng = riderLng ?? JOYRIDE_LOCATION.lng;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [(JOYRIDE_LOCATION.lat + dLat) / 2, (JOYRIDE_LOCATION.lng + dLng) / 2],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // Terrain-relief World Topo Map styled for both obsidian night & alabaster light themes
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    ).addTo(map);

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 280);

    const storeIcon = L.divIcon({
      className: 'joyride-map-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#0B0D12;border:2px solid #00A0DF;box-shadow:0 4px 14px rgba(0,160,223,0.45);overflow:hidden;"><img src="/logo-joyride.png" style="width:28px;height:28px;object-fit:contain;" /></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const destIcon = L.divIcon({
      className: 'joyride-dest-pin',
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:#F20574;border:3px solid #F8FAFC;box-shadow:0 4px 14px rgba(242,5,116,0.5);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    const riderIcon = L.divIcon({
      className: 'joyride-rider-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#00A0DF;color:#0B0D12;font-weight:800;font-size:11px;border:2px solid #F8FAFC;box-shadow:0 4px 16px rgba(0,160,223,0.65);">JR</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng], { icon: storeIcon })
      .addTo(map)
      .bindPopup('<strong>Joy Ride Café®</strong><br/>Calle Nicolás Ortiz N° 14');

    L.marker([dLat, dLng], { icon: destIcon })
      .addTo(map)
      .bindPopup(`<strong>Destino de entrega</strong><br/>${deliveryAddress || 'Sucre'}`);

    const riderMarker = L.marker([rLat, rLng], { icon: riderIcon }).addTo(map);
    riderMarkerRef.current = riderMarker;

    const bounds = L.latLngBounds([
      [JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng],
      [dLat, dLng],
      [rLat, rLng],
    ]);
    map.fitBounds(bounds, { padding: [42, 42] });

    // Street route with double-layered contrast halo + cyan core
    fetch(
      `https://router.project-osrm.org/route/v1/driving/${JOYRIDE_LOCATION.lng},${JOYRIDE_LOCATION.lat};${dLng},${dLat}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(5000) }
    )
      .then((res) => res.json())
      .then((data) => {
        const route = data?.routes?.[0];
        if (route?.geometry?.coordinates) {
          const latLngs = route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
          L.polyline(latLngs, { color: '#0B0D12', weight: 8, opacity: 0.35 }).addTo(map);
          L.polyline(latLngs, { color: '#00A0DF', weight: 4.5, opacity: 0.95 }).addTo(map);
          if (route.distance) {
            setRouteDistanceKm(`${(route.distance / 1000).toFixed(1)} km`);
          }
        } else {
          const fallbackPts: L.LatLngExpression[] = [
            [JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng],
            [dLat, dLng],
          ];
          L.polyline(fallbackPts, { color: '#0B0D12', weight: 7, opacity: 0.35 }).addTo(map);
          L.polyline(fallbackPts, { color: '#00A0DF', weight: 3.5, dashArray: '6 6' }).addTo(map);
        }
      })
      .catch(() => {
        const fallbackPts: L.LatLngExpression[] = [
          [JOYRIDE_LOCATION.lat, JOYRIDE_LOCATION.lng],
          [dLat, dLng],
        ];
        L.polyline(fallbackPts, { color: '#0B0D12', weight: 7, opacity: 0.35 }).addTo(map);
        L.polyline(fallbackPts, { color: '#00A0DF', weight: 3.5, dashArray: '6 6' }).addTo(map);
      });

    mapRef.current = map;

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
    };
  }, [dLat, dLng, deliveryAddress]);

  useEffect(() => {
    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([rLat, rLng]);
    }
  }, [rLat, rLng]);

  const gmapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${JOYRIDE_LOCATION.lat},${JOYRIDE_LOCATION.lng}&destination=${dLat},${dLng}&travelmode=driving`;

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-obsidian">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-elevated px-4 py-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Bike className="h-4 w-4 text-joycyan" />
          <span>
            {status === 'ENTREGADO'
              ? t('Ruta completada en Sucre', 'Route completed in Sucre')
              : status === 'EN_CAMINO'
              ? t('Repartidor en camino hacia tu punto', 'Rider on the way to your location')
              : t('Ruta preparada desde Joy Ride Café®', 'Route ready from Joy Ride Café®')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-mono text-joymagenta tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            ETA ~{etaMinutes ?? 12} min ({routeDistanceKm})
          </span>
          <a
            href={gmapsDirectionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-joycyan/40 bg-joycyan/10 px-2.5 py-1 text-[11px] font-bold text-joycyan hover:bg-joycyan/20"
          >
            <MapPin className="h-3 w-3" />
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div ref={containerRef} className="joyride-leaflet-relief h-56 w-full sm:h-64" />
    </div>
  );
}
