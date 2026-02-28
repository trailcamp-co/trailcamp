import mapboxgl from 'mapbox-gl';
import type { TripStop } from '../../types';
import { EMOJI_MIN_ZOOM, STOP_MARKER_SIZE } from './constants';

/** Update emoji HTML markers for visible unclustered points */
export function updateEmojiMarkers(
  map: any,
  emojiMarkersRef: React.MutableRefObject<Record<number, any>>,
): void {
  if (!map.getLayer('unclustered-point')) return;

  const zoom = map.getZoom();
  if (zoom < EMOJI_MIN_ZOOM) {
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
      el.style.cssText = 'font-size:14px;line-height:1;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;width:24px;height:24px;';
      el.textContent = icon;
      const coords = f.geometry.type === 'Point' ? f.geometry.coordinates : null;
      if (coords) {
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(coords as [number, number])
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
}

/** Create numbered stop markers on the map */
export function createStopMarkers(
  map: any,
  stops: TripStop[],
): any[] {
  const markers: any[] = [];
  const sorted = [...stops].sort((a, b) => a.sort_order - b.sort_order);

  sorted.forEach((stop, index) => {
    const el = document.createElement('div');
    el.className = 'stop-marker';
    el.innerHTML = `
      <div style="
        width: ${STOP_MARKER_SIZE}px; height: ${STOP_MARKER_SIZE}px; border-radius: 50%;
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

    markers.push(marker);
  });

  return markers;
}
