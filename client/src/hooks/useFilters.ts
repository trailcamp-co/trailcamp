import { useState, useCallback } from 'react';
import * as turf from '@turf/turf';
import type { Location, LocationCategory, CampsiteSubType, Filters } from '../types';
import { DEFAULT_FILTERS } from '../types';

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

    // Seasonal filter
    if (filters.hideOutOfSeason && l.seasonal_status === 'bad') return false;

    if (filters.nearRoute && routeGeoJSON) {
      try {
        const point = turf.point([l.longitude, l.latitude]);
        const geom = routeGeoJSON as GeoJSON.Geometry & { coordinates?: number[][] };
        const featureGeom = (routeGeoJSON as GeoJSON.Feature).geometry as GeoJSON.LineString | undefined;
        const coords = geom.coordinates || featureGeom?.coordinates || [];
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
