import { useState, useMemo, useCallback } from 'react';
import { Tent, X, Heart, MapPin } from 'lucide-react';
import type { Location, CampsiteSubType } from '../../types';
import { CAMPSITE_SUBTYPE_ICONS, CAMPSITE_SUBTYPE_LABELS } from '../../types';
import CampsiteCard from './CampsiteCard';

type CampsiteSortField = 'name' | 'cost' | 'scenery_rating' | 'distance_from' | 'riding_nearby';

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface CampsiteTabProps {
  locations: Location[];
  allLocations: Location[];
  onFlyTo: (lng: number, lat: number) => void;
  mapBounds: { north: number; south: number; east: number; west: number } | null;
  onLocationClick?: (location: Location) => void;
  onToggleFavorite?: (id: number) => void;
}

export default function CampsiteTab({ locations, allLocations, onFlyTo, mapBounds, onLocationClick, onToggleFavorite }: CampsiteTabProps) {
  const [sortField, setSortField] = useState<CampsiteSortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterSubType, setFilterSubType] = useState<CampsiteSubType | 'all'>('all');
  const [freeOnly, setFreeOnly] = useState(false);
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
        setDistanceFromCoords({ lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) });
        setDistanceFromLabel(`${parseFloat(coordMatch[1]).toFixed(2)}, ${parseFloat(coordMatch[2]).toFixed(2)}`);
        setSortField('distance_from');
        setGeocoding(false);
        return;
      }
      const tokenRes = await fetch('/api/mapbox-token');
      const { token } = await tokenRes.json();
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(distanceFromQuery)}.json?access_token=${token}&country=us&limit=1`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        setDistanceFromCoords({ lat, lng });
        setDistanceFromLabel(data.features[0].place_name?.split(',').slice(0, 2).join(',') || distanceFromQuery);
        setSortField('distance_from');
      }
    } catch { /* failed */ }
    setGeocoding(false);
  }, [distanceFromQuery]);

  const clearDistanceSort = useCallback(() => {
    setDistanceFromCoords(null); setDistanceFromLabel(''); setDistanceFromQuery('');
    if (sortField === 'distance_from') setSortField('name');
  }, [sortField]);

  const totalCampsites = useMemo(() => locations.filter(l => l.category === 'campsite').length, [locations]);

  const campsiteLocations = useMemo(() => {
    let filtered = locations.filter(l => l.category === 'campsite');

    if (viewportFilter && mapBounds) {
      filtered = filtered.filter(l =>
        l.latitude >= mapBounds.south && l.latitude <= mapBounds.north &&
        l.longitude >= mapBounds.west && l.longitude <= mapBounds.east
      );
    }

    if (filterSubType !== 'all') filtered = filtered.filter(l => l.sub_type === filterSubType);
    if (freeOnly) filtered = filtered.filter(l => l.cost_per_night != null && Number(l.cost_per_night) === 0);
    if (favoritesOnly) filtered = filtered.filter(l => l.favorited);

    if (distanceFromCoords) {
      filtered = filtered.map(l => ({
        ...l,
        distance_from: haversineDistance(distanceFromCoords.lat, distanceFromCoords.lng, l.latitude, l.longitude),
      }));
    }

    filtered.sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      switch (sortField) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'cost': return dir * ((a.cost_per_night ?? 999) - (b.cost_per_night ?? 999));
        case 'scenery_rating': return dir * ((a.scenery_rating ?? 0) - (b.scenery_rating ?? 0));
        case 'distance_from': return dir * ((a.distance_from ?? 999999) - (b.distance_from ?? 999999));
        default: return 0;
      }
    });

    return filtered;
  }, [locations, sortField, sortAsc, filterSubType, freeOnly, viewportFilter, mapBounds, favoritesOnly, distanceFromCoords]);

  const handleSortChange = (field: CampsiteSortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const boondockCount = useMemo(() => locations.filter(l => l.category === 'campsite' && l.sub_type === 'boondocking').length, [locations]);

  // Pre-compute nearby riding counts for campsites
  const ridingLocations = useMemo(() => allLocations.filter(l => l.category === 'riding'), [allLocations]);
  const nearbyRidingCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const camp of campsiteLocations.slice(0, 100)) { // limit to visible for perf
      let count = 0;
      for (const ride of ridingLocations) {
        const dLat = (ride.latitude - camp.latitude) * 69;
        const dLng = (ride.longitude - camp.longitude) * 69 * Math.cos(camp.latitude * Math.PI / 180);
        if (dLat * dLat + dLng * dLng < 400) count++; // ~20mi radius
      }
      counts[camp.id] = count;
    }
    return counts;
  }, [campsiteLocations, ridingLocations]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-2.5 py-2 border-b border-dark-700/50 space-y-1.5">
        {/* Sort from location */}
        <div className="flex items-center gap-1">
          <div className="flex-1 flex items-center bg-dark-800 border border-dark-700/50 rounded-lg overflow-hidden focus-within:border-orange-500 transition-colors">
            <MapPin size={14} className="text-orange-400 ml-2 flex-shrink-0" />
            <input type="text" value={distanceFromQuery}
              onChange={(e) => setDistanceFromQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(); }}
              placeholder="Sort from location..."
              className="flex-1 bg-transparent px-1.5 py-1 text-xs text-gray-300 placeholder-gray-600 focus:outline-none" />
          </div>
          {distanceFromCoords && (
            <button onClick={clearDistanceSort} className="p-1 text-gray-500 hover:text-gray-300 transition-colors"><X size={12} /></button>
          )}
        </div>
        {distanceFromLabel && <div className="text-[10px] text-orange-400 px-1">Sorting from: {distanceFromLabel}</div>}

        {/* Sort buttons */}
        <div className="rounded-lg bg-dark-800/50 p-1 flex items-center gap-0.5 flex-wrap">
          {([
            { field: 'name' as CampsiteSortField, label: 'Name' },
            { field: 'cost' as CampsiteSortField, label: 'Cost' },
            { field: 'riding_nearby' as CampsiteSortField, label: '🏍️ Rides' },
            { field: 'scenery_rating' as CampsiteSortField, label: 'Scenery' },
            ...(distanceFromCoords ? [{ field: 'distance_from' as CampsiteSortField, label: 'Distance' }] : []),
          ]).map(({ field, label }) => (
            <button key={field} onClick={() => handleSortChange(field)}
              className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${
                sortField === field ? 'bg-orange-500/20 text-orange-400' : 'text-gray-500 hover:text-gray-300 hover:bg-dark-700/50'
              }`}>
              {label}{sortField === field && (sortAsc ? ' ↑' : ' ↓')}
            </button>
          ))}
        </div>

        {/* Sub-type filter chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setFilterSubType('all')}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              filterSubType === 'all' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-500 border border-dark-700/50 hover:text-gray-300'
            }`}>All</button>
          {(['boondocking', 'campground', 'parking'] as CampsiteSubType[]).map(st => (
            <button key={st} onClick={() => setFilterSubType(filterSubType === st ? 'all' : st)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                filterSubType === st ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-500 border border-dark-700/50 hover:text-gray-300'
              }`}>
              {CAMPSITE_SUBTYPE_ICONS[st]} {CAMPSITE_SUBTYPE_LABELS[st]}
            </button>
          ))}
        </div>

        {/* Toggle row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button onClick={() => setFreeOnly(!freeOnly)}
              className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                freeOnly ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 border border-dark-700/50 hover:text-gray-300'
              }`}>
              💚 Free only
            </button>
            <button onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                favoritesOnly ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 border border-dark-700/50 hover:text-gray-300'
              }`}>
              <Heart size={10} className={favoritesOnly ? 'fill-red-400' : ''} /> Favs
            </button>
          </div>
          <button onClick={() => setViewportFilter(!viewportFilter)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
              viewportFilter ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-500 border border-dark-700/50 hover:text-gray-300'
            }`}>
            {viewportFilter ? 'In view' : 'Show all'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-3 py-1.5 text-[10px] text-gray-500 border-b border-dark-700/30 flex items-center justify-between">
        <span>Showing <span className="text-gray-300 font-medium">{campsiteLocations.length}</span> of {totalCampsites}</span>
        <span className="text-gray-600">{boondockCount} boondocking</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {campsiteLocations.length === 0 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800/50 flex items-center justify-center">
              <Tent size={28} className="text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">No campsites match</p>
            <p className="text-xs text-gray-600">Try zooming out or adjusting filters</p>
          </div>
        )}
        {(sortField === 'riding_nearby'
          ? [...campsiteLocations].sort((a, b) => (sortAsc ? 1 : -1) * ((nearbyRidingCounts[b.id] ?? 0) - (nearbyRidingCounts[a.id] ?? 0)))
          : campsiteLocations
        ).map(loc => (
          <CampsiteCard key={loc.id} location={loc} onFlyTo={onFlyTo} distanceFrom={loc.distance_from} onLocationClick={onLocationClick} onToggleFavorite={onToggleFavorite} nearbyRidingCount={nearbyRidingCounts[loc.id]} />
        ))}
      </div>
    </div>
  );
}
