import { useState, useCallback } from 'react';
import * as turf from '@turf/turf';
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
  const lat = loc.latitude || 0;
  const elev = loc.elevation_gain_ft || 0;
  if (lat > 42 || elev > 7000) {
    if (month >= 5 && month <= 10) return 'great';
    if (month === 4 || month === 11) return 'shoulder';
    return 'bad';
  }
  if (lat < 33) {
    if (month >= 10 || month <= 4) return 'great';
    if (month === 5 || month === 9) return 'shoulder';
    return 'bad';
  }
  return 'great'; // temperate zone, year-round ok
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

    if (filters.nearRoute && routeGeoJSON) {
      try {
        const point = turf.point([l.longitude, l.latitude]);
        // Extract coordinates from various GeoJSON structures
        let coords: number[][] | undefined;
        const gj = routeGeoJSON as any;
        if (gj.type === 'LineString') {
          coords = gj.coordinates;
        } else if (gj.type === 'Feature' && gj.geometry?.type === 'LineString') {
          coords = gj.geometry.coordinates;
        } else if (gj.type === 'FeatureCollection' && gj.features?.length > 0) {
          const lineFeature = gj.features.find((f: any) => f.geometry?.type === 'LineString');
          coords = lineFeature?.geometry?.coordinates;
        }
        if (!coords || coords.length < 2) return true; // can't filter without valid route
        const line = turf.lineString(coords);
        const nearest = turf.nearestPointOnLine(line, point);
        const dist = turf.distance(point, nearest, { units: 'miles' });
        if (dist > filters.nearRouteDistance) return false;
      } catch {
        // If route geometry is invalid, skip this filter
      }
    }

    return true;
  });

  return { filters, setFilters, filteredLocations, handleToggleLayer, handleToggleCampsiteSubType };
}
