import type { Location, CampsiteSubType } from '../../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, CAMPSITE_SUBTYPE_COLORS, CAMPSITE_SUBTYPE_ICONS } from '../../types';
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
      let color: string;
      let icon: string;
      if (loc.category === 'campsite' && loc.sub_type) {
        color = CAMPSITE_SUBTYPE_COLORS[loc.sub_type as CampsiteSubType] ?? CATEGORY_COLORS[loc.category] ?? '#6b7280';
        icon = CAMPSITE_SUBTYPE_ICONS[loc.sub_type as CampsiteSubType] ?? CATEGORY_ICONS[loc.category] ?? '📍';
      } else {
        color = CATEGORY_COLORS[loc.category] ?? '#6b7280';
        icon = CATEGORY_ICONS[loc.category] ?? '📍';
      }
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
        properties: {
          locationId: loc.id,
          name: loc.name,
          category: loc.category,
          sub_type: loc.sub_type ?? '',
          difficulty: loc.difficulty ?? '',
          color,
          icon,
          scenery_rating: loc.scenery_rating ?? 0,
          distance_miles: loc.distance_miles ?? '',
          elevation_gain_ft: loc.elevation_gain_ft ?? '',
          trail_types: loc.trail_types ?? '',
          best_season: loc.best_season ?? '',
          cost_per_night: loc.cost_per_night ?? '',
          water_available: loc.water_available ?? 0,
          description: (loc.description ?? '').slice(0, 200),
          featured: loc.featured ?? 0,
          group_id: loc.group_id ?? 0,
          group_count: loc.group_count ?? 1,
          google_rating: loc.google_rating ?? '',
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
      'circle-color': [
        'step', ['get', 'point_count'],
        'rgba(100, 116, 139, 0.8)',   // slate-500 for small
        50, 'rgba(71, 85, 105, 0.85)',  // slate-600 for medium
        200, 'rgba(51, 65, 85, 0.9)',   // slate-700 for large
        1000, 'rgba(30, 41, 59, 0.92)', // slate-800 for huge
      ],
      'circle-radius': ['step', ['get', 'point_count'],
        14, 10, 16, 50, 20, 100, 24, 500, 28,
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': 'rgba(255,255,255,0.5)',
      'circle-blur': 0,
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
      'text-size': ['step', ['get', 'point_count'], 10, 10, 11, 100, 12],
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
        4, 5, 6, 7, 8, 11, 10, 14, 12, 18, 14, 22, 16, 26,
      ],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'],
        5, 1, 10, 1.5, 14, 2.5,
      ],
      'circle-stroke-color': 'rgba(255,255,255,0.9)',
      'circle-opacity': ['interpolate', ['linear'], ['zoom'],
        5, 0.8, 8, 0.9, 12, 1.0,
      ],
      'circle-blur': ['interpolate', ['linear'], ['zoom'],
        4, 0.3, 10, 0.1, 14, 0,
      ],
    },
  });

  // Emoji icons rendered as Mapbox image sprites (perfectly bound to coordinates)
  const emojiMap: Record<string, string> = {
    '🏍️': 'emoji-riding',
    '🏕️': 'emoji-campground', 
    '⛺': 'emoji-boondocking',
    '🅿️': 'emoji-parking',
    '💧': 'emoji-water',
    '🚽': 'emoji-dump',
    '📍': 'emoji-default',
    '🏔️': 'emoji-scenic',
  };

  // Generate emoji images from canvas
  for (const [emoji, imgId] of Object.entries(emojiMap)) {
    if (!map.hasImage(imgId)) {
      const size = 48;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.font = `${size - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, size / 2, size / 2 + 2);
      const imageData = ctx.getImageData(0, 0, size, size);
      map.addImage(imgId, imageData, { pixelRatio: 2 });
    }
  }

  // Build icon-image expression to map emoji text → sprite id
  const iconImageExpr: any[] = ['match', ['get', 'icon']];
  for (const [emoji, imgId] of Object.entries(emojiMap)) {
    iconImageExpr.push(emoji, imgId);
  }
  iconImageExpr.push('emoji-default'); // fallback

  map.addLayer({
    id: 'unclustered-emoji',
    type: 'symbol',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    minzoom: 8,
    layout: {
      'icon-image': iconImageExpr as any,
      'icon-size': ['interpolate', ['linear'], ['zoom'],
        8, 0.35, 10, 0.5, 12, 0.7, 14, 0.9,
      ],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-anchor': 'center',
    },
    paint: {
      'icon-opacity': ['interpolate', ['linear'], ['zoom'],
        8, 0.7, 10, 0.9, 12, 1.0,
      ],
    },
  });

  // Route line
  map.addSource('route', {
    type: 'geojson',
    data: buildRouteGeoJSON(routeGeoJSON),
  });

  // Route glow (outer)
  map.addLayer({
    id: 'route-line-outline',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#06b6d4', 'line-width': 8, 'line-opacity': 0.2, 'line-blur': 3 },
  });

  // Route main line
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#06b6d4',
      'line-width': 3.5,
      'line-opacity': 0.9,
    },
  });
}

/** Add public land overlay sources and layers (vector tiles from PADUS/SMA) */
export function addOverlayLayers(map: mapboxgl.Map): void {
  if (!map.getSource('public-land')) {
    map.addSource('public-land', {
      type: 'vector',
      url: 'mapbox://nstrnad26.public-lands',
    });

    // Per-agency fill layers — each can be toggled independently
    const agencies: [string, string, string][] = [
      // [id, filter value, fill color]
      ['blm', 'BLM', '#d4a017'],       // gold
      ['usfs', 'USFS', '#228B22'],      // forest green
      ['nps', 'NPS', '#8B4513'],        // saddle brown
      ['fws', 'FWS', '#008B8B'],        // dark cyan
      ['state', 'ST', '#4169E1'],       // royal blue
      ['usbr', 'USBR', '#C71585'],     // medium violet red
      ['bia', 'BIA', '#D2691E'],        // chocolate
      ['dod', 'DOD', '#DC143C'],        // crimson
    ];

    for (const [id, code, color] of agencies) {
      map.addLayer({
        id: `public-land-${id}-fill`,
        type: 'fill',
        source: 'public-land',
        'source-layer': 'public_land',
        filter: ['==', ['get', 'agency'], code],
        paint: {
          'fill-color': color,
          'fill-opacity': 0,
        },
      }, 'clusters');

      map.addLayer({
        id: `public-land-${id}-line`,
        type: 'line',
        source: 'public-land',
        'source-layer': 'public_land',
        filter: ['==', ['get', 'agency'], code],
        paint: {
          'line-color': color,
          'line-width': 1,
          'line-opacity': 0,
        },
      }, 'clusters');
    }
  }
}
