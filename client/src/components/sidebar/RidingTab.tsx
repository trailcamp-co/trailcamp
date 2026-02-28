import { useState, useMemo, useCallback } from 'react';
import { Bike, X, Heart } from 'lucide-react';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS } from '../../types';
import RidingCard from './RidingCard';

type RidingSortField = 'name' | 'distance_miles' | 'difficulty' | 'scenery_rating' | 'distance_from';

const DIFFICULTY_ORDER: Record<string, number> = {
  Easy: 1,
  Moderate: 2,
  Hard: 3,
  Expert: 4,
};

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface RidingTabProps {
  locations: Location[];
  onFlyTo: (lng: number, lat: number) => void;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  onLocationClick?: (location: Location) => void;
}

export default function RidingTab({ locations, onFlyTo, mapBounds, onLocationClick }: RidingTabProps) {
  const [sortField, setSortField] = useState<RidingSortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterTrailType, setFilterTrailType] = useState<string>('');
  const [viewportFilter, setViewportFilter] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [distanceFromQuery, setDistanceFromQuery] = useState('');
  const [distanceFromCoords, setDistanceFromCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFromLabel, setDistanceFromLabel] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = useCallback(async () => {
    if (!distanceFromQuery.trim()) return;
    setGeocoding(true);
    try {
      const coordMatch = distanceFromQuery.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        setDistanceFromCoords({ lat, lng });
        setDistanceFromLabel(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        setSortField('distance_from');
        setGeocoding(false);
        return;
      }
      const tokenRes = await fetch('/api/mapbox-token');
      const { token } = await tokenRes.json();
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(distanceFromQuery)}.json?access_token=${token}&country=us&limit=1`
      );
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        setDistanceFromCoords({ lat, lng });
        setDistanceFromLabel(data.features[0].place_name?.split(',').slice(0, 2).join(',') || distanceFromQuery);
        setSortField('distance_from');
      }
    } catch { /* geocoding failed */ }
    setGeocoding(false);
  }, [distanceFromQuery]);

  const clearDistanceSort = useCallback(() => {
    setDistanceFromCoords(null);
    setDistanceFromLabel('');
    setDistanceFromQuery('');
    if (sortField === 'distance_from') setSortField('name');
  }, [sortField]);

  const ridingLocations = useMemo(() => {
    let filtered = locations.filter((l) => l.category === 'riding');

    if (viewportFilter && mapBounds) {
      filtered = filtered.filter(
        (l) => l.latitude >= mapBounds.south && l.latitude <= mapBounds.north &&
               l.longitude >= mapBounds.west && l.longitude <= mapBounds.east
      );
    }

    if (filterDifficulty) filtered = filtered.filter((l) => l.difficulty === filterDifficulty);
    if (filterTrailType.trim()) {
      const term = filterTrailType.toLowerCase();
      filtered = filtered.filter((l) => l.trail_types && l.trail_types.toLowerCase().includes(term));
    }
    if (favoritesOnly) filtered = filtered.filter((l) => l.favorited);

    if (distanceFromCoords) {
      filtered = filtered.map((l) => ({
        ...l,
        distance_from: haversineDistance(distanceFromCoords.lat, distanceFromCoords.lng, l.latitude, l.longitude),
      }));
    }

    filtered.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      switch (sortField) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'distance_miles': return dir * ((a.distance_miles ?? 0) - (b.distance_miles ?? 0));
        case 'difficulty': return dir * ((DIFFICULTY_ORDER[a.difficulty ?? ''] ?? 0) - (DIFFICULTY_ORDER[b.difficulty ?? ''] ?? 0));
        case 'scenery_rating': return dir * ((a.scenery_rating ?? 0) - (b.scenery_rating ?? 0));
        case 'distance_from': return dir * ((a.distance_from ?? 999999) - (b.distance_from ?? 999999));
        default: return 0;
      }
    });

    return filtered;
  }, [locations, sortField, sortAsc, filterDifficulty, filterTrailType, viewportFilter, mapBounds, favoritesOnly, distanceFromCoords]);

  const handleSortChange = (field: RidingSortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-3 border-b border-gray-700/50 [.light_&]:border-gray-200 space-y-2">
        <div className="flex items-center gap-1">
          <input
            type="text" value={distanceFromQuery}
            onChange={(e) => setDistanceFromQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(); }}
            placeholder="Sort from location (zip, city, coords)..."
            className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors"
          />
          {distanceFromCoords && (
            <button onClick={clearDistanceSort} className="p-1 text-gray-500 hover:text-gray-300 transition-colors"><X size={12} /></button>
          )}
        </div>
        {distanceFromLabel && <div className="text-[10px] text-orange-400 px-1">📍 Sorting from: {distanceFromLabel}</div>}
        {geocoding && <div className="text-[10px] text-gray-500 px-1">Geocoding...</div>}

        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">Sort:</span>
          {([
            { field: 'name' as RidingSortField, label: 'Name' },
            { field: 'distance_miles' as RidingSortField, label: 'Miles' },
            { field: 'difficulty' as RidingSortField, label: 'Diff' },
            { field: 'scenery_rating' as RidingSortField, label: 'Scenery' },
            ...(distanceFromCoords ? [{ field: 'distance_from' as RidingSortField, label: 'Distance' }] : []),
          ]).map(({ field, label }) => (
            <button key={field} onClick={() => handleSortChange(field)}
              className={`text-[11px] px-1.5 py-0.5 rounded transition-colors ${
                sortField === field ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border border-transparent'
              }`}>
              {label}{sortField === field && (sortAsc ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select value={filterDifficulty ?? 'all'} onChange={(e) => setFilterDifficulty(e.target.value === 'all' ? null : e.target.value)}
            className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 focus:outline-none focus:border-orange-500 transition-colors">
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option><option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option><option value="Expert">Expert</option>
          </select>
          <input type="text" value={filterTrailType} onChange={(e) => setFilterTrailType(e.target.value)}
            placeholder="Trail type..."
            className="flex-1 bg-dark-800 [.light_&]:bg-white border border-gray-700 [.light_&]:border-gray-200 rounded px-1.5 py-1 text-xs text-gray-300 [.light_&]:text-gray-700 placeholder-gray-600 [.light_&]:placeholder-gray-400 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-gray-600">{ridingLocations.length} riding area{ridingLocations.length !== 1 ? 's' : ''}</div>
            <button onClick={() => setFavoritesOnly(!favoritesOnly)} title="Favorites only"
              className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors ${favoritesOnly ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-gray-300 border border-transparent'}`}>
              <Heart size={10} className={`inline ${favoritesOnly ? 'fill-red-400' : ''}`} /> Favs
            </button>
          </div>
          <button onClick={() => setViewportFilter(!viewportFilter)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              viewportFilter ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-500 hover:text-gray-300 [.light_&]:hover:text-gray-700 border border-transparent hover:border-gray-600 [.light_&]:hover:border-gray-300'
            }`}>
            {viewportFilter ? '📍 In view' : 'Show all'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {ridingLocations.length === 0 && (
          <div className="p-6 text-center text-gray-500 text-sm">
            <Bike size={32} className="mx-auto mb-2 opacity-40" /><p>No riding areas found.</p>
          </div>
        )}
        {ridingLocations.map((loc) => (
          <RidingCard key={loc.id} location={loc} onFlyTo={onFlyTo} distanceFrom={loc.distance_from} onLocationClick={onLocationClick} />
        ))}
      </div>
    </div>
  );
}
