import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { SUCRE_TOURIST_SPOTS, SucreTouristSpot } from './constants';
import { MapSpotRecord } from '../types';

const VALID_CATEGORIES = new Set<SucreTouristSpot['category']>([
  'JOYRIDE',
  'BARES_NOCHE',
  'CHOCOLATE_GASTRO',
  'CULTURA',
  'MIRADOR',
  'AVENTURA',
]);

export function mapDbSpotToTouristSpot(db: MapSpotRecord): SucreTouristSpot {
  const category = VALID_CATEGORIES.has(db.category as SucreTouristSpot['category'])
    ? (db.category as SucreTouristSpot['category'])
    : 'CULTURA';

  const highlights = Array.isArray(db.highlightsJson)
    ? db.highlightsJson.map(String).filter(Boolean)
    : [];

  const images =
    Array.isArray(db.imagesJson) && db.imagesJson.length > 0
      ? db.imagesJson.map(String).filter(Boolean)
      : [db.imageUrl];

  return {
    id: db.slug || db.id,
    name: db.name,
    category,
    lat: Number(db.lat),
    lng: Number(db.lng),
    address: db.address,
    hours: db.hours,
    walkTimeFromJoyRide: db.walkTimeFromJoyRide,
    summary: db.summary,
    tip: db.tip || '',
    highlights: highlights.length > 0 ? highlights : ['Sucre · Bolivia'],
    imageUrl: db.imageUrl,
    images,
  };
}

export function usePublicMapSpots() {
  const query = useQuery({
    queryKey: ['map-spots', 'public'],
    queryFn: async () => {
      const res = await api.get<{ spots: MapSpotRecord[] }>('/map-spots');
      return (res.data.spots || []).map(mapDbSpotToTouristSpot);
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const spots =
    query.data && query.data.length > 0 ? query.data : SUCRE_TOURIST_SPOTS;

  return {
    spots,
    isLoading: query.isLoading,
  };
}
