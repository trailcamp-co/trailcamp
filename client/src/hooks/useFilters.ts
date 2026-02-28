import { useState, useCallback } from 'react';
import type { Location, LocationCategory, CampsiteSubType, Filters } from '../types';
import { DEFAULT_FILTERS } from '../types';

function computeSeasonalStatus(loc: Location, month: number): 'great' | 'shoulder' | 'bad' {
  if (loc.best_season) {
    const bs = loc.best_season.toLowerCase();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    if (bs.includes(monthNames[month - 1]) || bs.includes('year-round') || bs.includes('all year')) return 'great';
    if (bs.includes('spring') && [3, 4, 5].includes(month)) return 'great';
    if (bs.includes('summer') && [6, 7, 8].includes(month)) return 'great';
    if (bs.includes('fall') && [9, 10, 11].includes(month)) return 'great';
    if (bs.includes('winter') && [12, 1, 2].includes(month)) return 'great';
    if (bs.includes('spring') && [2, 6].includes(month)) return 'shoulder';
    if (bs.includes('summer') && [5, 9].includes(month)) return 'shoulder';
    if (bs.includes('fall') && [8, 12].includes(month)) return 'shoulder';
    if (bs.includes('winter') && [11, 3].includes(month)) return 'shoulder';
    return 'bad';
  }
  // Heuristic based on latitude and elevation
  const lat = loc.latitude || 0;
  const elev = loc.elevation_gain_ft || 0;

  // High elevation anywhere: snow risk Nov-Apr
  if (elev > 7000) {
    if (month >= 6 && month <= 9) return 'great';
    if (month === 5 || month === 10) return 'shoulder';
    return 'bad';
  }
  // Northern states (lat > 39 = roughly PA, OH, IN, northern tier)
  if (lat > 39) {
    if (month >= 5 && month <= 10) return 'great';
    if (month === 4 || month === 11) return 'shoulder';
    return 'bad'; // Dec, Jan, Feb, Mar = bad
  }
  // Mid-latitude (33-39 = TN, NC, AZ, NM, southern CO)
  if (lat >= 33) {
    if (month >= 3 && month <= 11) return 'great';
    if (month === 2 || month === 12) return 'shoulder';
    return 'bad'; // only Jan is bad
  }
  // Southern (< 33 = TX, FL, SoCal, deep south desert)
  if (month >= 10 || month <= 4) return 'great';
  if (month === 5 || month === 9) return 'shoulder';
  return 'bad'; // Jun-Aug too hot in desert
}

export function useFilters(locations: Location[], routeGeoJSON: GeoJSON.GeoJsonObject | null) {
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    categories: new Set(DEFAULT_FILTERS.categories),
    campsiteSubTypes: new Set(DEFAULT_FILTERS.campsiteSubTypes),
  });

  const handleToggleLayer = useCallback((category: LocationCategory) => {
    setFilters(prev => {
      const nextCategories = new Set(prev.categories);
      if (nextCategories.has(category)) nextCategories.delete(category);
      else nextCategories.add(category);
      return { ...prev, categories: nextCategories };
    });
  }, []);

  const handleToggleCampsiteSubType = useCallback((subType: CampsiteSubType) => {
    setFilters(prev => {
      const next = new Set(prev.campsiteSubTypes);
      if (next.has(subType)) next.delete(subType);
      else next.add(subType);
      return { ...prev, campsiteSubTypes: next };
    });
  }, []);

  // Extract and sample route coordinates once for near-route filter (not per-location)
  let routeCoords: number[][] | null = null;
  if (filters.nearRoute && routeGeoJSON) {
    try {
      const gj = routeGeoJSON as any;
      let coords: number[][] | undefined;
      if (gj.type === 'LineString') coords = gj.coordinates;
      else if (gj.type === 'Feature' && gj.geometry?.type === 'LineString') coords = gj.geometry.coordinates;
      else if (gj.type === 'FeatureCollection' && gj.features?.length > 0) {
        const lineFeature = gj.features.find((f: any) => f.geometry?.type === 'LineString');
        coords = lineFeature?.geometry?.coordinates;
      }
      if (coords && coords.length >= 2) {
        // Sample every Nth point to keep checks fast (max ~200 points)
        const step = Math.max(1, Math.floor(coords.length / 200));
        routeCoords = [];
        for (let i = 0; i < coords.length; i += step) routeCoords.push(coords[i]);
        if (routeCoords[routeCoords.length - 1] !== coords[coords.length - 1]) {
          routeCoords.push(coords[coords.length - 1]);
        }
      }
    } catch { /* invalid route geometry */ }
  }

  const filteredLocations = locations.filter(l => {
    if (!filters.categories.has(l.category)) return false;

    // Campsite sub-type filtering
    if (l.category === 'campsite' && l.sub_type) {
      if (!filters.campsiteSubTypes.has(l.sub_type as CampsiteSubType)) return false;
    }

    if (filters.visitedStatus === 'visited' && !l.visited) return false;
    if (filters.visitedStatus === 'want_to_visit' && !l.want_to_visit) return false;
    if (filters.visitedStatus === 'highly_rated' && (!l.user_rating || l.user_rating < 4)) return false;
    if (filters.visitedStatus === 'favorites' && !l.favorited) return false;
    if (filters.waterNearby && !l.water_nearby) return false;
    if (filters.dumpNearby && !l.dump_nearby) return false;
    if (filters.shade && !l.shade) return false;
    if (filters.levelGround && !l.level_ground) return false;
    if (filters.difficulty && l.category === 'riding' && l.difficulty !== filters.difficulty) return false;
    if (filters.minScenery > 0 && (!l.scenery_rating || l.scenery_rating < filters.minScenery)) return false;

    // Seasonal filter — compute client-side
    if (filters.hideOutOfSeason) {
      const month = filters.seasonMonth || (new Date().getMonth() + 1);
      const status = computeSeasonalStatus(l, month);
      if (status === 'bad') return false;
    }

    if (filters.nearRoute && routeCoords) {
      // Fast haversine check against sampled route points
      const maxDist = filters.nearRouteDistance;
      let withinRange = false;
      for (let i = 0; i < routeCoords.length; i++) {
        const dlat = (l.latitude - routeCoords[i][1]) * 69; // ~69 mi per degree lat
        const dlng = (l.longitude - routeCoords[i][0]) * 69 * Math.cos(l.latitude * Math.PI / 180);
        const approxDist = Math.sqrt(dlat * dlat + dlng * dlng);
        if (approxDist <= maxDist) { withinRange = true; break; }
      }
      if (!withinRange) return false;
    }

    return true;
  });

  return { filters, setFilters, filteredLocations, handleToggleLayer, handleToggleCampsiteSubType };
}
