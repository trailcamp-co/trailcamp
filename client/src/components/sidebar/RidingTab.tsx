import { useState, useMemo, useCallback } from 'react';
import { Bike, X, Heart, MapPin } from 'lucide-react';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS } from '../../types';
import RidingCard from './RidingCard';
import EmptyState from '../EmptyState';

type RidingSortField = 'name' | 'distance_miles' | 'difficulty' | 'distance_from' | 'featured' | 'distance_from_home';

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
  onToggleFavorite?: (id: number) => void;
  isFavorited?: (id: number) => boolean;
  homeLat?: number | null;
  homeLon?: number | null;
}

export default function RidingTab({ locations, onFlyTo, mapBounds, onLocationClick, onToggleFavorite, isFavorited, homeLat, homeLon }: RidingTabProps) {
  const [sortField, setSortField] = useState<RidingSortField>('name');
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterTrailType, setFilterTrailType] = useState<string>('');
  const [viewportFilter, setViewportFilter] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
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

  const totalRiding = useMemo(() => locations.filter(l => l.category === 'riding').length, [locations]);

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
    if (featuredOnly) filtered = filtered.filter((l) => l.featured);

    if (distanceFromCoords) {
      filtered = filtered.map((l) => ({
        ...l,
        distance_from: haversineDistance(distanceFromCoords.lat, distanceFromCoords.lng, l.latitude, l.longitude),
      }));
    }

    // Compute distance from home for each location
    if (homeLat != null && homeLon != null) {
      filtered = filtered.map(l => ({
        ...l,
        _distanceFromHome: haversineDistance(homeLat, homeLon, l.latitude, l.longitude),
      }));
    }

    filtered.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      switch (sortField) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'distance_miles': return dir * ((a.distance_miles ?? 0) - (b.distance_miles ?? 0));
        case 'difficulty': return dir * ((DIFFICULTY_ORDER[a.difficulty ?? ''] ?? 0) - (DIFFICULTY_ORDER[b.difficulty ?? ''] ?? 0));
        case 'distance_from': return dir * ((a.distance_from ?? 999999) - (b.distance_from ?? 999999));
        case 'distance_from_home': return dir * (((a as any)._distanceFromHome ?? 999999) - ((b as any)._distanceFromHome ?? 999999));
        case 'featured': return dir * ((b.featured ?? 0) - (a.featured ?? 0));
        default: return 0;
      }
    });

    return filtered;
  }, [locations, sortField, sortAsc, filterDifficulty, filterTrailType, viewportFilter, mapBounds, favoritesOnly, featuredOnly, distanceFromCoords, homeLat, homeLon]);

  const handleSortChange = (field: RidingSortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-2.5 py-2 border-b border-dark-700/50 space-y-1.5">
        {/* Sort from location input */}
        <div className="flex items-center gap-1">
          <div className="flex-1 flex items-center bg-dark-800 border border-dark-700/50 rounded-lg overflow-hidden focus-within:border-orange-500 transition-colors">
            <MapPin size={14} className="text-orange-400 ml-2 flex-shrink-0" />
            <input
              type="text" value={distanceFromQuery}
              onChange={(e) => setDistanceFromQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(); }}
              placeholder="Sort from location (zip, city, coords)..."
              className="flex-1 bg-transparent px-1.5 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none"
            />
          </div>
          {distanceFromCoords && (
            <button onClick={clearDistanceSort} className="p-1 text-gray-500 hover:text-gray-300 transition-colors"><X size={12} /></button>
          )}
        </div>
        {distanceFromLabel && <div className="text-[10px] text-orange-400 px-1">Sorting from: {distanceFromLabel}</div>}
        {geocoding && <div className="text-[10px] text-gray-500 px-1">Geocoding...</div>}

        {/* Sort buttons - pill toggle group */}
        <div className="rounded-lg bg-dark-800/50 p-1 flex items-center gap-0.5 flex-wrap">
          {([
            { field: 'name' as RidingSortField, label: 'Name' },
            { field: 'featured' as RidingSortField, label: '⭐ Epic' },
            { field: 'distance_miles' as RidingSortField, label: 'Miles' },
            { field: 'difficulty' as RidingSortField, label: 'Diff' },

            ...(homeLat != null ? [{ field: 'distance_from_home' as RidingSortField, label: 'From Home' }] : []),
            ...(distanceFromCoords ? [{ field: 'distance_from' as RidingSortField, label: 'Distance' }] : []),
          ]).map(({ field, label }) => (
            <button key={field} onClick={() => handleSortChange(field)}
              className={`text-[10px] px-3 py-2 lg:px-2 lg:py-0.5 min-h-[36px] lg:min-h-0 rounded-md transition-colors ${
                sortField === field ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700/50'
              }`}>
              {label}{sortField === field && (sortAsc ? ' \u2191' : ' \u2193')}
            </button>
          ))}
        </div>

        {/* Difficulty + trail type in one row */}
        <div className="flex items-center gap-1.5">
          <select value={filterDifficulty ?? 'all'} onChange={(e) => setFilterDifficulty(e.target.value === 'all' ? null : e.target.value)}
            className="flex-1 bg-dark-800 border border-dark-700/50 rounded-lg px-1.5 py-1 text-[11px] text-gray-300 focus:outline-none focus:border-orange-500 transition-colors">
            <option value="all">All Difficulty</option>
            <option value="Easy">Easy</option><option value="Moderate">Moderate</option>
            <option value="Hard">Hard</option><option value="Expert">Expert</option>
          </select>
          <input type="text" value={filterTrailType} onChange={(e) => setFilterTrailType(e.target.value)}
            placeholder="Trail type..."
            className="flex-1 bg-dark-800 border border-dark-700/50 rounded-lg px-1.5 py-1 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500 transition-colors" />
        </div>

        {/* Favorites + viewport pills */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFavoritesOnly(!favoritesOnly)} title="Favorites only"
              className={`text-[10px] px-3 py-2 lg:px-2 lg:py-0.5 min-h-[36px] lg:min-h-0 rounded-full flex items-center gap-1 transition-colors ${favoritesOnly ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-gray-300 border border-dark-700/50'}`}>
              <Heart size={10} className={favoritesOnly ? 'fill-red-400' : ''} /> Favs
            </button>
            <button onClick={() => setFeaturedOnly(!featuredOnly)} title="Featured epic spots only"
              className={`text-[10px] px-3 py-2 lg:px-2 lg:py-0.5 min-h-[36px] lg:min-h-0 rounded-full flex items-center gap-1 transition-colors ${featuredOnly ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300 border border-dark-700/50'}`}>
              ⭐ Epic
            </button>
          </div>
          <button onClick={() => setViewportFilter(!viewportFilter)}
            className={`text-[10px] px-3 py-2 lg:px-2 lg:py-0.5 min-h-[36px] lg:min-h-0 rounded-full transition-colors ${
              viewportFilter ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-gray-500 hover:text-gray-300 border border-dark-700/50'
            }`}>
            {viewportFilter ? 'In view' : 'Show all'}
          </button>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="px-3 py-1.5 text-[10px] text-gray-500 [.light_&]:text-gray-400 border-b border-dark-700/30 [.light_&]:border-gray-100 flex items-center justify-between">
        <span>Showing <span className="text-gray-300 [.light_&]:text-gray-600 font-medium">{ridingLocations.length}</span> of {totalRiding} riding areas</span>
        {ridingLocations.length > 0 && (
          <span className="text-gray-600">
            {ridingLocations.reduce((sum, l) => sum + (l.distance_miles || 0), 0).toLocaleString()} total trail mi
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {ridingLocations.length === 0 && (
          <EmptyState
            icon="🏍️"
            title="No locations match your filters"
            description="Try adjusting your filters or zooming out on the map"
          />
        )}
        {ridingLocations.slice(0, visibleCount).map((loc) => (
          <RidingCard key={loc.id} location={loc} onFlyTo={onFlyTo} distanceFrom={loc.distance_from} distanceFromHome={(loc as any)._distanceFromHome ?? null} onLocationClick={onLocationClick} onToggleFavorite={onToggleFavorite} isFavorited={isFavorited?.(loc.id)} />
        ))}
        {visibleCount < ridingLocations.length && (
          <button
            onClick={() => setVisibleCount(c => c + 50)}
            className="w-full py-3 text-sm text-orange-400 hover:text-orange-300 font-medium"
          >
            Show more ({'{'}(ridingLocations.length - visibleCount).toLocaleString(){'}'} remaining)
          </button>
        )}
      </div>
    </div>
  );
}
