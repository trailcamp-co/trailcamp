import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Location, TripStop, LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import { addCustomLayers, addOverlayLayers, buildLocationsGeoJSON, buildRouteGeoJSON } from './layers';
import { updateEmojiMarkers, createStopMarkers } from './markers';
import { setupHoverTooltip, setupClickPopup, setupClusterClick } from './popups';
import LayerPanel from './LayerPanel';
import MapLegend from './MapLegend';
import MapStats from './MapStats';
import RegionQuickJump from './RegionQuickJump';
import { DEFAULT_CENTER, DEFAULT_ZOOM, FLY_TO_ZOOM, FLY_TO_DURATION } from './constants';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapContainerProps {
  token: string;
  style: { id: string; name: string; url: string };
  locations: Location[];
  stops: TripStop[];
  routeGeoJSON: GeoJSON.GeoJsonObject | null;
  onLocationClick: (location: Location) => void;
  onMapClick: (e: { lng: number; lat: number }) => void;
  visibleLayers: Set<LocationCategory>;
  onToggleLayer: (category: LocationCategory) => void;
  flyToLocation: { lng: number; lat: number } | null;
  darkMode: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
  campsiteSubTypes?: Set<CampsiteSubType>;
  onToggleCampsiteSubType?: (subType: CampsiteSubType) => void;
  mapStyle?: { id: string; name: string; url: string };
  onChangeMapStyle?: (style: MapStyle) => void;
}

export default function MapContainer({
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
  campsiteSubTypes,
  onToggleCampsiteSubType,
  mapStyle,
  onChangeMapStyle,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const emojiMarkersRef = useRef<Record<number, any>>({});
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [blmVisible, setBlmVisible] = useState(false);
  const [usfsVisible, setUsfsVisible] = useState(false);
  const locationsRef = useRef<Location[]>(locations);
  const routeRef = useRef<GeoJSON.GeoJsonObject | null>(routeGeoJSON);
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
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      doubleClickZoom: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.addControl(new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserHeading: true,
    }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');
    map.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

    map.on('style.load', () => {
      // Add 3D terrain
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.3 });

      // Sky atmosphere
      if (!map.getLayer('sky')) {
        map.addLayer({
          id: 'sky',
          type: 'sky',
          paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 90.0],
            'sky-atmosphere-sun-intensity': 15,
          },
        });
      }

      addCustomLayers(map, locationsRef.current, routeRef.current);
      addOverlayLayers(map);
      setMapReady(true);
    });

    const hoverPopup = setupHoverTooltip(map);
    setupClickPopup(map, hoverPopup, locationsRef, onLocationClick);
    setupClusterClick(map);

    map.on('dblclick', (e: any) => {
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    const handleEmojiUpdate = () => updateEmojiMarkers(map, emojiMarkersRef);
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

    map.on('moveend', handleEmojiUpdate);
    map.on('moveend', reportBounds);
    map.on('zoomend', handleEmojiUpdate);
    map.on('sourcedata', (e: any) => {
      if (e.sourceId === 'locations' && e.isSourceLoaded) {
        setTimeout(handleEmojiUpdate, 100);
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (style.url !== styleUrlRef.current) {
      styleUrlRef.current = style.url;
      map.setStyle(style.url);
    }
  }, [style.url]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('locations') as any;
    if (source) source.setData(buildLocationsGeoJSON(locations));
  }, [locations, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource('route') as any;
    if (source) source.setData(buildRouteGeoJSON(routeGeoJSON));
  }, [routeGeoJSON, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = createStopMarkers(map, stops);
  }, [stops]);

  useEffect(() => {
    if (!flyToLocation || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyToLocation.lng, flyToLocation.lat],
      zoom: FLY_TO_ZOOM,
      duration: FLY_TO_DURATION,
    });
  }, [flyToLocation]);

  const handleToggleBlm = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const newVal = !blmVisible;
    setBlmVisible(newVal);
    if (map.getLayer('blm-land-fill')) {
      map.setPaintProperty('blm-land-fill', 'fill-opacity', newVal ? 0.2 : 0);
      map.setPaintProperty('blm-land-border', 'line-opacity', newVal ? 0.6 : 0);
    }
  }, [blmVisible]);

  const handleToggleUsfs = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const newVal = !usfsVisible;
    setUsfsVisible(newVal);
    if (map.getLayer('usfs-land-fill')) {
      map.setPaintProperty('usfs-land-fill', 'fill-opacity', newVal ? 0.12 : 0);
      map.setPaintProperty('usfs-land-border', 'line-opacity', newVal ? 0.7 : 0);
      map.setLayoutProperty('usfs-land-label', 'visibility', newVal ? 'visible' : 'none');
    }
  }, [usfsVisible]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      <LayerPanel
        isOpen={layerPanelOpen}
        onToggle={() => setLayerPanelOpen(!layerPanelOpen)}
        darkMode={darkMode}
        visibleLayers={visibleLayers}
        onToggleLayer={onToggleLayer}
        blmVisible={blmVisible}
        onToggleBlm={handleToggleBlm}
        usfsVisible={usfsVisible}
        onToggleUsfs={handleToggleUsfs}
        campsiteSubTypes={campsiteSubTypes}
        onToggleCampsiteSubType={onToggleCampsiteSubType}
        mapStyle={mapStyle || style}
        onChangeMapStyle={onChangeMapStyle || (() => {})}
      />
      <MapLegend />
      <MapStats
        ridingCount={locations.filter(l => l.category === 'riding').length}
        campsiteCount={locations.filter(l => l.category === 'campsite').length}
        boondockingCount={locations.filter(l => l.category === 'campsite' && l.sub_type === 'boondocking').length}
        totalCount={locations.length}
      />
      <RegionQuickJump mapRef={mapRef} />
      
      {/* Quick nav buttons */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.flyTo({ center: [-81.3612, 41.6031], zoom: 10, duration: 1500 });
            }
          }}
          className="px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Fly to Kirtland, OH"
        >
          🏠 Home
        </button>
        <button
          onClick={() => {
            const featured = locations.filter(l => l.featured);
            if (featured.length && mapRef.current) {
              const spot = featured[Math.floor(Math.random() * featured.length)];
              mapRef.current.flyTo({ center: [spot.longitude, spot.latitude], zoom: 12, duration: 2000 });
              onLocationClick?.(spot);
            }
          }}
          className="px-3 py-2 rounded-xl shadow-lg glass text-gray-200 hover:text-white transition-colors flex items-center gap-1.5 text-sm font-medium"
          title="Fly to a random epic spot"
        >
          🎲 Random Epic
        </button>
      </div>
    </div>
  );
}
