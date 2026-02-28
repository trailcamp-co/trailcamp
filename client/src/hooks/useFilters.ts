import { useState, useCallback } from 'react';
import type { Location, LocationCategory, CampsiteSubType, Filters } from '../types';
import { DEFAULT_FILTERS } from '../types';

function computeSeasonalStatus(loc: Location, month: number): 'great' | 'shoulder' | 'bad' | null {
  if (!loc.best_season) return null; // no data — don't guess

  const bs = loc.best_season.toLowerCase();
  if (bs.includes('year-round') || bs.includes('all year') || bs.includes('all season')) return 'great';

  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  if (bs.includes(monthNames[month - 1])) return 'great';

  // Season name matching
  const seasonMonths: Record<string, number[]> = {
    spring: [3, 4, 5], summer: [6, 7, 8], fall: [9, 10, 11], autumn: [9, 10, 11], winter: [12, 1, 2],
  };
  const shoulderMap: Record<string, number[]> = {
    spring: [2, 6], summer: [5, 9], fall: [8, 12], autumn: [8, 12], winter: [11, 3],
  };

  for (const [season, months] of Object.entries(seasonMonths)) {
    if (bs.includes(season)) {
      if (months.includes(month)) return 'great';
      if (shoulderMap[season]?.includes(month)) return 'shoulder';
      return 'bad';
    }
  }

  // Try month range patterns like "Mar-Nov", "Oct-Apr"
  const rangeMatch = bs.match(/(\w{3})\s*[-–to]+\s*(\w{3})/);
  if (rangeMatch) {
    const startIdx = monthNames.indexOf(rangeMatch[1].toLowerCase().slice(0, 3));
    const endIdx = monthNames.indexOf(rangeMatch[2].toLowerCase().slice(0, 3));
    if (startIdx >= 0 && endIdx >= 0) {
      const m = month - 1; // 0-indexed
      const inRange = startIdx <= endIdx
        ? m >= startIdx && m <= endIdx
        : m >= startIdx || m <= endIdx; // wraps around (e.g., Oct-Apr)
      return inRange ? 'great' : 'bad';
    }
  }

  return null; // couldn't determine
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
        // Sample every Nth point to keep checks fast (max ~500 points for better accuracy)
        const step = Math.max(1, Math.floor(coords.length / 500));
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

    // Seasonal filter — only filters locations that have best_season data
    if (filters.hideOutOfSeason) {
      const month = filters.seasonMonth || (new Date().getMonth() + 1);
      const status = computeSeasonalStatus(l, month);
      if (status === 'bad') return false; // null = no data = keep showing
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
