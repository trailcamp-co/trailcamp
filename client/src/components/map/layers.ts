import type { Location } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, DIFFICULTY_COLORS } from '../../types';
import {
  CLUSTER_MAX_ZOOM,
  CLUSTER_RADIUS,
  BLM_FILL_COLOR,
  BLM_BORDER_COLOR,
  USFS_FILL_COLOR,
} from './constants';

/** Build GeoJSON FeatureCollection from locations array */
export function buildLocationsGeoJSON(locations: Location[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => {
      const color = loc.category === 'riding' && loc.difficulty
        ? DIFFICULTY_COLORS[loc.difficulty] ?? '#6b7280'
        : CATEGORY_COLORS[loc.category] ?? '#6b7280';
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
        properties: {
          locationId: loc.id,
          name: loc.name,
          category: loc.category,
          difficulty: loc.difficulty ?? '',
          color,
          icon: CATEGORY_ICONS[loc.category] ?? '📍',
          scenery_rating: loc.scenery_rating ?? 0,
          distance_miles: loc.distance_miles ?? '',
          elevation_gain_ft: loc.elevation_gain_ft ?? '',
          trail_types: loc.trail_types ?? '',
        },
      };
    }),
  };
}

/** Build GeoJSON FeatureCollection from route geometry */
export function buildRouteGeoJSON(routeGeoJSON: GeoJSON.GeoJsonObject | null): GeoJSON.FeatureCollection {
  if (!routeGeoJSON) return { type: 'FeatureCollection', features: [] };
  if ((routeGeoJSON as GeoJSON.FeatureCollection).type === 'FeatureCollection')
    return routeGeoJSON as GeoJSON.FeatureCollection;
  if ((routeGeoJSON as GeoJSON.Feature).type === 'Feature')
    return { type: 'FeatureCollection', features: [routeGeoJSON as GeoJSON.Feature] };
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: routeGeoJSON as GeoJSON.Geometry, properties: {} }],
  };
}

/** Add all custom sources and layers to the map (idempotent) */
export function addCustomLayers(
  map: any,
  locations: Location[],
  routeGeoJSON: GeoJSON.GeoJsonObject | null,
): void {
  // Remove existing if present
  ['unclustered-point', 'cluster-count', 'clusters', 'route-line-outline', 'route-line'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  ['locations', 'route'].forEach(id => {
    if (map.getSource(id)) map.removeSource(id);
  });

  // Location pins with clustering
  map.addSource('locations', {
    type: 'geojson',
    data: buildLocationsGeoJSON(locations),
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_RADIUS,
  });

  // Clusters
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': 'rgba(30, 41, 59, 0.75)',
      'circle-radius': ['step', ['get', 'point_count'],
        10, 10, 12, 50, 15, 100, 18, 500, 22,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': 'rgba(255,255,255,0.4)',
    },
  });

  // Cluster count
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'locations',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
      'text-size': ['step', ['get', 'point_count'], 9, 10, 10, 100, 11],
    },
    paint: { 'text-color': '#ffffff' },
  });

  // Individual location dots
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        5, 4, 8, 7, 10, 10, 12, 14, 14, 18, 16, 22,
      ],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'],
        5, 1, 10, 1.5, 14, 2.5,
      ],
      'circle-stroke-color': 'rgba(255,255,255,0.8)',
      'circle-opacity': ['interpolate', ['linear'], ['zoom'],
        5, 0.7, 8, 0.85, 12, 1.0,
      ],
    },
  });

  // Route line
  map.addSource('route', {
    type: 'geojson',
    data: buildRouteGeoJSON(routeGeoJSON),
  });

  // Route outline
  map.addLayer({
    id: 'route-line-outline',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#1e3a5f', 'line-width': 6, 'line-opacity': 0.6 },
  });

  // Route main line
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3b82f6', 'line-width': 3 },
  });
}

/** Add BLM and USFS overlay sources and layers */
export function addOverlayLayers(map: mapboxgl.Map): void {
  // BLM land ownership
  if (!map.getSource('blm-land')) {
    map.addSource('blm-land', { type: 'geojson', data: '/blm-land-v3.geojson' });
    map.addLayer({
      id: 'blm-land-fill',
      type: 'fill',
      source: 'blm-land',
      paint: { 'fill-color': BLM_FILL_COLOR, 'fill-opacity': 0 },
    }, 'clusters');
    map.addLayer({
      id: 'blm-land-border',
      type: 'line',
      source: 'blm-land',
      paint: { 'line-color': BLM_BORDER_COLOR, 'line-width': 0.8, 'line-opacity': 0 },
    }, 'clusters');
  }

  // USFS National Forest boundaries
  if (!map.getSource('usfs-land')) {
    map.addSource('usfs-land', { type: 'geojson', data: '/usfs-boundaries.geojson' });
    map.addLayer({
      id: 'usfs-land-fill',
      type: 'fill',
      source: 'usfs-land',
      paint: { 'fill-color': USFS_FILL_COLOR, 'fill-opacity': 0 },
    }, 'clusters');
    map.addLayer({
      id: 'usfs-land-border',
      type: 'line',
      source: 'usfs-land',
      paint: { 'line-color': USFS_FILL_COLOR, 'line-width': 1.5, 'line-opacity': 0 },
    }, 'clusters');
    map.addLayer({
      id: 'usfs-land-label',
      type: 'symbol',
      source: 'usfs-land',
      layout: {
        'text-field': ['get', 'FORESTNAME'],
        'text-size': 11,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.05,
        'text-max-width': 8,
        visibility: 'none',
      },
      paint: {
        'text-color': '#86EFAC',
        'text-halo-color': 'rgba(0,0,0,0.8)',
        'text-halo-width': 1.5,
      },
    });
  }
}
