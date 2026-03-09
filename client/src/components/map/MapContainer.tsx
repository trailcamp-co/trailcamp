import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { LocateFixed, Compass, Loader2 } from 'lucide-react';
import type { Location, TripStop, LocationCategory, CampsiteSubType, MapStyle } from '../../types';
import { addCustomLayers, addOverlayLayers, buildLocationsGeoJSON, buildRouteGeoJSON } from './layers';
import { createStopMarkers } from './markers';
import { setupHoverTooltip, setupClickPopup, setupClusterClick } from './popups';
import LayerPanel from './LayerPanel';

// Legend removed — Layers panel is open by default and serves as the legend
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
  onMapBackgroundTap?: () => void;
  visibleLayers: Set<LocationCategory>;
  onToggleLayer: (category: LocationCategory) => void;
  flyToLocation: { lng: number; lat: number } | null;
  darkMode: boolean;
  onBoundsChange?: (bounds: MapBounds) => void;
  campsiteSubTypes?: Set<CampsiteSubType>;
  onToggleCampsiteSubType?: (subType: CampsiteSubType) => void;
  mapStyle?: { id: string; name: string; url: string };
  onChangeMapStyle?: (style: MapStyle) => void;
  homeLat?: number | null;
  homeLon?: number | null;
  forceCloseLayerPanel?: number;
}

export default function MapContainer({
  token,
  style,
  locations,
  stops,
  routeGeoJSON,
  onLocationClick,
  onMapClick,
  onMapBackgroundTap,
  visibleLayers,
  onToggleLayer,
  flyToLocation,
  darkMode,
  onBoundsChange,
  campsiteSubTypes,
  onToggleCampsiteSubType,
  mapStyle,
  onChangeMapStyle,
  homeLat,
  homeLon,
  forceCloseLayerPanel,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const stopMarkersRef = useRef<any[]>([]);
  const homeMarkerRef = useRef<any>(null);
  // Emoji markers removed — native Mapbox circle layers handle all location rendering
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [visibleLands, setVisibleLands] = useState<Set<string>>(new Set());
  const locationsRef = useRef<Location[]>(locations);
  const routeRef = useRef<GeoJSON.GeoJsonObject | null>(routeGeoJSON);
  const styleUrlRef = useRef(style.url);
  const [mapReady, setMapReady] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lng: number; lat: number } | null>(null);
  const [gpsState, setGpsState] = useState<'idle' | 'loading' | 'active'>('idle');
  const [compassBearing, setCompassBearing] = useState(0);
  const [compassTracking, setCompassTracking] = useState(false);
  const gpsMarkerRef = useRef<any>(null);

  useEffect(() => { locationsRef.current = locations; }, [locations]);
  useEffect(() => { routeRef.current = routeGeoJSON; }, [routeGeoJSON]);

  // Close layer panel when triggered externally (e.g. mobile search expands)
  useEffect(() => {
    if (forceCloseLayerPanel) setLayerPanelOpen(false);
  }, [forceCloseLayerPanel]);

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

    // Disable rotation on mobile to prevent accidental rotation during pinch zoom
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100 }), 'bottom-left');


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

    // Right-click context menu
    map.on('contextmenu', (e: any) => {
      e.preventDefault();
      const { lng, lat } = e.lngLat;
      setContextMenu({ x: e.point.x, y: e.point.y, lng, lat });
    });

    // Close context menu on click + notify parent for mobile bottom sheet
    map.on('click', (e: any) => {
      setContextMenu(null);
      // Check if the click was on a pin/cluster — if not, it's a background tap
      const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point', 'clusters'] });
      if (features.length === 0) {
        onMapBackgroundTap?.();
      }
    });

    // Emoji markers removed — dots render natively via Mapbox layers
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

    map.on('moveend', reportBounds);
    map.on('load', reportBounds); // Report initial bounds for viewport fetch

    mapRef.current = map;

    return () => {
      // (emoji markers removed)
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

  // Home pin marker
  useEffect(() => {
    const map = mapRef.current;
    if (homeMarkerRef.current) {
      homeMarkerRef.current.remove();
      homeMarkerRef.current = null;
    }
    if (!map || homeLat == null || homeLon == null) return;

    const el = document.createElement('div');
    el.className = 'home-marker';
    el.innerHTML = `<div style="width:34px;height:34px;background:white;border:3px solid #8b5cf6;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(139,92,246,0.4),0 1px 4px rgba(0,0,0,0.3);cursor:pointer;" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#8b5cf6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    </div>`;

    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat([homeLon, homeLat])
      .addTo(map);

    homeMarkerRef.current = marker;

    return () => {
      marker.remove();
      homeMarkerRef.current = null;
    };
  }, [homeLat, homeLon]);

  // Track map bearing for compass icon rotation
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onRotate = () => setCompassBearing(map.getBearing());
    map.on('rotate', onRotate);
    return () => { map.off('rotate', onRotate); };
  }, [mapReady]);

  // GPS: locate user and fly to position
  const handleGpsClick = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (gpsState === 'active') {
      // Remove marker, deactivate
      gpsMarkerRef.current?.remove();
      gpsMarkerRef.current = null;
      setGpsState('idle');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Remove old marker
        gpsMarkerRef.current?.remove();

        // Create pulsing blue dot
        const el = document.createElement('div');
        el.className = 'gps-dot';

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .addTo(map);
        gpsMarkerRef.current = marker;

        map.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1200,
        });

        setGpsState('active');
      },
      (err) => {
        setGpsState('idle');
        if (err.code === err.PERMISSION_DENIED) {
          alert('Location access was denied. Please enable location permissions in your browser settings.');
        } else {
          alert('Unable to retrieve your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [gpsState]);

  // Compass: toggle device orientation tracking or reset bearing to north
  const handleCompassClick = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (compassTracking) {
      setCompassTracking(false);
      map.easeTo({ bearing: 0, duration: 500 });
      return;
    }

    // Check if DeviceOrientationEvent is available
    const hasOrientation = typeof DeviceOrientationEvent !== 'undefined';
    if (!hasOrientation) {
      // Just reset bearing to north
      map.easeTo({ bearing: 0, duration: 500 });
      return;
    }

    // On iOS 13+, need to request permission
    const DOE = DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission().then((state: string) => {
        if (state === 'granted') {
          setCompassTracking(true);
        } else {
          // Permission denied, just reset north
          map.easeTo({ bearing: 0, duration: 500 });
        }
      }).catch(() => {
        map.easeTo({ bearing: 0, duration: 500 });
      });
    } else {
      setCompassTracking(true);
    }
  }, [compassTracking]);

  // Device orientation listener for compass mode
  useEffect(() => {
    if (!compassTracking) return;
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS, alpha for Android
      const heading = (e as any).webkitCompassHeading ?? (e.alpha != null ? 360 - e.alpha : null);
      if (heading != null) {
        map.easeTo({ bearing: heading, duration: 100 });
      }
    };

    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }, [compassTracking]);

  const handleToggleLand = useCallback((agency: string) => {
    const map = mapRef.current;
    if (!map) return;
    setVisibleLands(prev => {
      const next = new Set(prev);
      const fillId = `public-land-${agency}-fill`;
      const lineId = `public-land-${agency}-line`;
      if (next.has(agency)) {
        next.delete(agency);
        if (map.getLayer(fillId)) map.setPaintProperty(fillId, 'fill-opacity', 0);
        if (map.getLayer(lineId)) map.setPaintProperty(lineId, 'line-opacity', 0);
      } else {
        next.add(agency);
        if (map.getLayer(fillId)) map.setPaintProperty(fillId, 'fill-opacity', 0.3);
        if (map.getLayer(lineId)) map.setPaintProperty(lineId, 'line-opacity', 0.7);
      }
      return next;
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      <LayerPanel
        isOpen={layerPanelOpen}
        onToggle={() => setLayerPanelOpen(!layerPanelOpen)}
        darkMode={darkMode}
        visibleLayers={visibleLayers}
        onToggleLayer={onToggleLayer}
        visibleLands={visibleLands}
        onToggleLand={handleToggleLand}
        campsiteSubTypes={campsiteSubTypes}
        onToggleCampsiteSubType={onToggleCampsiteSubType}
        mapStyle={mapStyle || style}
        onChangeMapStyle={onChangeMapStyle || (() => {})}
      />
      {/* MapStylePicker moved into LayerPanel top bar */}

      <RegionQuickJump mapRef={mapRef} />

      {/* GPS + Compass buttons — bottom-left on desktop, above tabs on mobile */}
      <div className="absolute z-30 flex flex-col gap-2 left-[10px] map-controls-bottom">
        <button
          onClick={handleCompassClick}
          className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all touch-manipulation ${
            compassTracking
              ? 'bg-blue-500 text-white'
              : 'bg-dark-800/90 backdrop-blur-sm border border-dark-700/50 text-gray-300 hover:text-white hover:bg-dark-700'
          }`}
          title={compassTracking ? 'Stop compass tracking' : 'Reset north / compass mode'}
        >
          <Compass
            size={20}
            style={{ transform: `rotate(${-compassBearing}deg)`, transition: 'transform 0.1s ease-out' }}
          />
        </button>
        <button
          onClick={handleGpsClick}
          className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all touch-manipulation ${
            gpsState === 'active'
              ? 'bg-blue-500 text-white'
              : 'bg-dark-800/90 backdrop-blur-sm border border-dark-700/50 text-gray-300 hover:text-white hover:bg-dark-700'
          }`}
          title="My location"
        >
          {gpsState === 'loading' ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LocateFixed size={20} />
          )}
        </button>
      </div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-dark-900 border border-dark-700 rounded-xl shadow-2xl py-1.5 min-w-[180px] text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              onMapClick({ lng: contextMenu.lng, lat: contextMenu.lat });
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-dark-800 text-gray-300 flex items-center gap-2"
          >
            📍 Add Stop Here
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${contextMenu.lat.toFixed(6)}, ${contextMenu.lng.toFixed(6)}`);
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-dark-800 text-gray-300 flex items-center gap-2"
          >
            📋 Copy Coordinates
          </button>
          <button
            onClick={() => {
              window.open(`https://www.google.com/maps/@${contextMenu.lat},${contextMenu.lng},15z`, '_blank');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-dark-800 text-gray-300 flex items-center gap-2"
          >
            🗺️ View in Google Maps
          </button>
          <button
            onClick={() => {
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${contextMenu.lat},${contextMenu.lng}`, '_blank');
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-dark-800 text-gray-300 flex items-center gap-2"
          >
            🚗 Navigate Here
          </button>
          <div className="mx-3 my-1 border-t border-dark-700" />
          <div className="px-4 py-1 text-[10px] text-gray-500 font-mono">
            {contextMenu.lat.toFixed(5)}, {contextMenu.lng.toFixed(5)}
          </div>
        </div>
      )}

      {/* Legend removed — Layers panel open by default */}
    </div>
  );
}
