import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { Layers, Eye, EyeOff } from 'lucide-react';
import type { Location, TripStop, LocationCategory } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../types';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProps {
  token: string;
  style: { id: string; name: string; url: string };
  locations: Location[];
  stops: TripStop[];
  routeGeoJSON: any;
  onLocationClick: (location: Location) => void;
  onMapClick: (e: { lng: number; lat: number }) => void;
  visibleLayers: Set<LocationCategory>;
  onToggleLayer: (category: LocationCategory) => void;
  flyToLocation: { lng: number; lat: number } | null;
  darkMode: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
}

const ALL_CATEGORIES: LocationCategory[] = [
  'campsite', 'riding', 'water', 'dump', 'scenic',
];

// Centralized function to add all custom sources and layers
function addCustomLayers(map: any, locations: Location[], routeGeoJSON: any) {
  // Remove existing if present (idempotent)
  ['unclustered-point', 'cluster-count', 'clusters', 'route-line-outline', 'route-line'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  ['locations', 'route'].forEach(id => {
    if (map.getSource(id)) map.removeSource(id);
  });

  // Location pins with clustering — MORE aggressive at low zoom
  map.addSource('locations', {
    type: 'geojson',
    data: buildLocationsGeoJSON(locations),
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 15,
  });

  // Clusters — subtle, dark, semi-transparent. NOT orange.
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': 'rgba(30, 41, 59, 0.75)',
      'circle-radius': ['step', ['get', 'point_count'],
        12,   // < 10
        10, 14,  // 10-49
        50, 17,  // 50-99
        100, 20, // 100+
      ],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': 'rgba(255,255,255,0.6)',
    },
  });

  // Cluster count — white text, readable
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

  // Individual location dots — small, color-coded
  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'],
        5, 5,
        8, 7,
        10, 9,
        13, 12,
        16, 16,
      ],
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'],
        5, 1,
        10, 1.5,
        14, 2,
      ],
      'circle-stroke-color': 'rgba(255,255,255,0.8)',
      'circle-opacity': ['interpolate', ['linear'], ['zoom'],
        5, 0.6,
        8, 0.75,
        12, 0.9,
      ],
    },
  });

  // (emoji rendered via HTML markers in updateEmojiMarkers)

  // Route line — outlined for visibility on any map style
  map.addSource('route', {
    type: 'geojson',
    data: buildRouteGeoJSON(routeGeoJSON),
  });

  // Route outline (dark border)
  map.addLayer({
    id: 'route-line-outline',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#1e3a5f', 'line-width': 6, 'line-opacity': 0.6 },
  });

  // Route main line (bright blue)
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3b82f6', 'line-width': 3 },
  });
}

export default function Map({
  token,
  style,
  locations,
  stops,
  routeGeoJSON,
  onLocationClick,
  onMapClick,
  visibleLayers,
  onToggleLayer,
  flyToLocation,
  darkMode,
  onBoundsChange,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const emojiMarkersRef = useRef<{ [id: number]: any }>({});
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [publicLandVisible, setPublicLandVisible] = useState(false);
  const [mvumVisible, setMvumVisible] = useState(false);
  const locationsRef = useRef<Location[]>(locations);
  const routeRef = useRef<any>(routeGeoJSON);
  const styleUrlRef = useRef(style.url);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => { locationsRef.current = locations; }, [locations]);
  useEffect(() => { routeRef.current = routeGeoJSON; }, [routeGeoJSON]);

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: style.url,
      center: [-98, 39],
      zoom: 4,
      doubleClickZoom: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // On EVERY style load, re-add layers
    map.on('style.load', () => {
      addCustomLayers(map, locationsRef.current, routeRef.current);

      // BLM / Public Land overlay
      if (!map.getSource('public-land')) {
        map.addSource('public-land', {
          type: 'raster',
          tiles: [
            'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Landscape_poly/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image'
          ],
          tileSize: 512,
        });
        map.addLayer({
          id: 'public-land-layer',
          type: 'raster',
          source: 'public-land',
          paint: { 'raster-opacity': 0 },
        }, 'clusters');
      }

      // USFS MVUM trail overlay
      if (!map.getSource('mvum-trails')) {
        map.addSource('mvum-trails', {
          type: 'raster',
          tiles: [
            'https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_MVUM_01/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&format=png32&transparent=true&f=image'
          ],
          tileSize: 512,
        });
        map.addLayer({
          id: 'mvum-trails-layer',
          type: 'raster',
          source: 'mvum-trails',
          paint: { 'raster-opacity': 0 },
        }, 'clusters');
      }

      setMapReady(true);
    });

    // Hover tooltip
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'location-tooltip',
      maxWidth: '240px',
    });

    map.on('mouseenter', 'unclustered-point', (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
      if (!features.length) return;
      const p = features[0].properties;
      const geo = features[0].geometry;
      if (geo.type === 'Point') {
        popup
          .setLngLat(geo.coordinates as [number, number])
          .setHTML(`<div style="font-size:12px;font-weight:600;">${p?.icon || ''} ${p?.name || ''}</div><div style="font-size:10px;color:#94a3b8;text-transform:capitalize;margin-top:2px;">${p?.category || ''}</div>`)
          .addTo(map);
      }
    });
    map.on('mouseleave', 'unclustered-point', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

    // Click cluster to zoom
    map.on('click', 'clusters', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id;
      (map.getSource('locations') as any).getClusterExpansionZoom(clusterId, (err: any, zoom: any) => {
        if (err) return;
        const geo = features[0].geometry;
        if (geo.type === 'Point') {
          map.easeTo({ center: geo.coordinates as [number, number], zoom: zoom ?? undefined });
        }
      });
    });

    // Click popup
    const clickPopup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '300px',
      className: 'location-click-popup',
      offset: 12,
    });

    // Click location pin
    map.on('click', 'unclustered-point', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
      if (!features.length) return;
      const p = features[0].properties!;
      const geo = features[0].geometry;
      const locationId = p.locationId;
      const loc = locationsRef.current.find((l) => l.id === locationId);

      if (loc && geo.type === 'Point') {
        // Build popup HTML
        const diffColor = DIFFICULTY_COLORS[p.difficulty] || '#6b7280';
        const trailTypes = parseTrailTypes(p.trail_types);
        const trailChipsHtml = trailTypes.map(tt => {
          const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
          return `<span style="font-size:9px;font-weight:500;padding:1px 6px;border-radius:9999px;background:${colors.bg};color:${colors.text};white-space:nowrap;">${tt}</span>`;
        }).join('');
        const sceneryHtml = p.scenery_rating > 0
          ? `<div style="margin-top:4px;">${Array.from({length: 5}, (_, i) => `<span style="color:${i < p.scenery_rating ? '#facc15' : '#374151'};font-size:11px;">★</span>`).join('')}</div>`
          : '';
        const statsHtml = [
          p.distance_miles ? `<span style="font-size:10px;color:#9ca3af;">📏 ${Math.round(Number(p.distance_miles))} mi</span>` : '',
          p.elevation_gain_ft ? `<span style="font-size:10px;color:#9ca3af;">⛰️ ${Number(p.elevation_gain_ft).toLocaleString()} ft</span>` : '',
        ].filter(Boolean).join('<span style="color:#4b5563;margin:0 4px;">·</span>');

        const html = `
          <div style="font-family:system-ui,-apple-system,sans-serif;min-width:180px;">
            <div style="font-size:14px;font-weight:700;color:#f3f4f6;margin-bottom:4px;">${p.icon || ''} ${p.name}</div>
            ${p.difficulty ? `<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:9999px;background:${diffColor}22;color:${diffColor};">${p.difficulty}</span>` : ''}
            ${sceneryHtml}
            ${trailChipsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;">${trailChipsHtml}</div>` : ''}
            ${statsHtml ? `<div style="margin-top:6px;">${statsHtml}</div>` : ''}
            <div style="margin-top:8px;display:flex;gap:6px;">
              <button onclick="window.__tcPopupOpenDetail && window.__tcPopupOpenDetail(${locationId})" style="font-size:10px;font-weight:600;padding:4px 10px;border-radius:6px;background:rgba(249,115,22,0.9);color:#fff;border:none;cursor:pointer;">View Details</button>
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}','_blank')" style="font-size:10px;font-weight:600;padding:4px 10px;border-radius:6px;background:rgba(55,65,81,0.8);color:#d1d5db;border:1px solid rgba(75,85,99,0.5);cursor:pointer;">Navigate</button>
            </div>
          </div>
        `;

        popup.remove(); // remove hover tooltip
        clickPopup.setLngLat(geo.coordinates as [number, number]).setHTML(html).addTo(map);
        onLocationClick(loc);
      }
    });

    // Global handler for popup "View Details" button
    (window as any).__tcPopupOpenDetail = (id: number) => {
      const loc = locationsRef.current.find(l => l.id === id);
      if (loc) onLocationClick(loc);
      clickPopup.remove();
    };

    // Double-click to add location
    map.on('dblclick', (e: any) => {
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

    // Emoji HTML markers — render for visible unclustered points only
    const updateEmojiMarkers = () => {
      if (!map.getLayer('unclustered-point')) return;
      const zoom = map.getZoom();
      // Only show emoji at zoom 7+
      if (zoom < 4) {
        Object.values(emojiMarkersRef.current).forEach(m => m.remove());
        emojiMarkersRef.current = {};
        return;
      }
      const features = map.queryRenderedFeatures(undefined, { layers: ['unclustered-point'] });
      const visibleIds = new Set<number>();
      features.forEach((f: any) => {
        const id = f.properties?.locationId;
        if (!id) return;
        visibleIds.add(id);
        if (!emojiMarkersRef.current[id]) {
          const icon = f.properties?.icon || '📍';
          const el = document.createElement('div');
          el.className = 'emoji-pin';
          el.style.cssText = `font-size:18px;line-height:1;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,0.8);`;
          el.textContent = icon;
          const coords = f.geometry.type === 'Point' ? f.geometry.coordinates : null;
          if (coords) {
            const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat(coords as [number, number])
              .setOffset([0, -6])
              .addTo(map);
            emojiMarkersRef.current[id] = marker;
          }
        }
      });
      // Remove markers no longer visible
      Object.keys(emojiMarkersRef.current).forEach((idStr) => {
        const id = Number(idStr);
        if (!visibleIds.has(id)) {
          emojiMarkersRef.current[id].remove();
          delete emojiMarkersRef.current[id];
        }
      });
    };

    // Report bounds to parent
    const reportBounds = () => {
      if (!onBoundsChange) return;
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    map.on('moveend', updateEmojiMarkers);
    map.on('moveend', reportBounds);
    map.on('zoomend', updateEmojiMarkers);
    map.on('sourcedata', (e: any) => {
      if (e.sourceId === 'locations' && e.isSourceLoaded) {
        setTimeout(updateEmojiMarkers, 100);
      }
    });

    mapRef.current = map;

    return () => {
      Object.values(emojiMarkersRef.current).forEach(m => m.remove());
      emojiMarkersRef.current = {};
      stopMarkersRef.current.forEach((m) => m.remove());
      stopMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Style changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (style.url !== styleUrlRef.current) {
      styleUrlRef.current = style.url;
      map.setStyle(style.url);
    }
  }, [style.url]);

  // Update locations data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('locations') as any;
    if (source) source.setData(buildLocationsGeoJSON(locations));
  }, [locations, mapReady]);

  // Update route data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('route') as any;
    if (source) source.setData(buildRouteGeoJSON(routeGeoJSON));
  }, [routeGeoJSON, mapReady]);

  // Update stop markers — bigger, bolder, with labels
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    const sorted = [...stops].sort((a, b) => a.sort_order - b.sort_order);
    sorted.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = 'stop-marker';
      el.innerHTML = `
        <div style="
          width: 28px; height: 28px; border-radius: 50%;
          background: #2563eb; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
          z-index: 20; position: relative;
        ">${index + 1}</div>
      `;

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map);

      stopMarkersRef.current.push(marker);
    });
  }, [stops]);

  // Fly to location
  useEffect(() => {
    if (!flyToLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: 13,
      duration: 1500,
    });
  }, [flyToLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Layer toggle panel */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={() => setLayerPanelOpen(!layerPanelOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm transition-colors ${
            darkMode
              ? 'bg-dark-800/90 text-gray-200 hover:bg-dark-700/90 border border-dark-600/50'
              : 'bg-white/90 text-gray-700 hover:bg-gray-50/90 border border-gray-200/50'
          }`}
        >
          <Layers size={16} />
          <span className="text-sm font-medium">Layers</span>
        </button>

        {layerPanelOpen && (
          <div className={`mt-2 rounded-lg shadow-xl border overflow-hidden backdrop-blur-sm ${
            darkMode ? 'bg-dark-800/95 border-dark-600/50' : 'bg-white/95 border-gray-200/50'
          }`}>
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b ${
              darkMode ? 'text-gray-400 border-dark-600/50' : 'text-gray-500 border-gray-200'
            }`}>
              Overlays
            </div>
            <div className="py-1">
              {/* Public Land Toggle */}
              <button
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  const newVal = !publicLandVisible;
                  setPublicLandVisible(newVal);
                  if (map.getLayer('public-land-layer')) {
                    map.setPaintProperty('public-land-layer', 'raster-opacity', newVal ? 0.45 : 0);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                } ${!publicLandVisible ? 'opacity-50' : ''}`}
              >
                <span className="text-base">🏛️</span>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#d4a017' }} />
                <span className="flex-1 text-left">Public Land (BLM/USFS)</span>
                {publicLandVisible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                  : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
              </button>

              {/* MVUM Trails Toggle */}
              <button
                onClick={() => {
                  const map = mapRef.current;
                  if (!map) return;
                  const newVal = !mvumVisible;
                  setMvumVisible(newVal);
                  if (map.getLayer('mvum-trails-layer')) {
                    map.setPaintProperty('mvum-trails-layer', 'raster-opacity', newVal ? 0.7 : 0);
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                } ${!mvumVisible ? 'opacity-50' : ''}`}
              >
                <span className="text-base">🏍️</span>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#16a34a' }} />
                <span className="flex-1 text-left">MVUM Trails (USFS)</span>
                {mvumVisible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                  : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
              </button>
            </div>
            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider border-t border-b ${
              darkMode ? 'text-gray-400 border-dark-600/50' : 'text-gray-500 border-gray-200'
            }`}>
              Categories
            </div>
            <div className="py-1">
              {ALL_CATEGORIES.map((category) => {
                const visible = visibleLayers.has(category);
                return (
                  <button
                    key={category}
                    onClick={() => onToggleLayer(category)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      darkMode ? 'hover:bg-dark-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'
                    } ${!visible ? 'opacity-40' : ''}`}
                  >
                    <span className="text-base">{CATEGORY_ICONS[category]}</span>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[category] }} />
                    <span className="flex-1 text-left">{CATEGORY_LABELS[category]}</span>
                    {visible ? <Eye size={14} className="text-green-400 flex-shrink-0" />
                      : <EyeOff size={14} className="text-gray-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- helpers ----------

function buildLocationsGeoJSON(locations: Location[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => {
      // Riding locations get colored by difficulty, others by category
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

function buildRouteGeoJSON(routeGeoJSON: any): GeoJSON.FeatureCollection {
  if (!routeGeoJSON) return { type: 'FeatureCollection', features: [] };
  if (routeGeoJSON.type === 'FeatureCollection') return routeGeoJSON;
  if (routeGeoJSON.type === 'Feature') return { type: 'FeatureCollection', features: [routeGeoJSON] };
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', geometry: routeGeoJSON, properties: {} }],
  };
}
