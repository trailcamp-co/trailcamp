import mapboxgl from 'mapbox-gl';

const EMOJI_MIN_ZOOM = 4;

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

  // Don't update during active zoom/move animations — positions can be stale
  if (map.isMoving() || map.isZooming()) return;

  const features = map.queryRenderedFeatures(undefined, { layers: ['unclustered-point'] });
  const visibleIds = new Set<number>();

  features.forEach((f: any) => {
    const id = f.properties?.locationId;
    if (!id) return;

    // Deduplicate — queryRenderedFeatures can return same feature from multiple tiles
    if (visibleIds.has(id)) return;
    visibleIds.add(id);

    // Use the actual source coordinates (geometry), not projected screen coords
    const coords = f.geometry?.type === 'Point' ? f.geometry.coordinates : null;
    if (!coords || coords.length < 2) return;
    const lng = coords[0];
    const lat = coords[1];

    // Sanity check: skip features with obviously wrong coordinates (cluster centroids leak through)
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

    if (emojiMarkersRef.current[id]) {
      // Update position of existing marker (fixes drift during zoom)
      emojiMarkersRef.current[id].setLngLat([lng, lat]);
    } else {
      const icon = f.properties?.icon || '📍';
      const groupCount = f.properties?.group_count || 1;
      const el = document.createElement('div');
      el.className = 'emoji-pin';
      el.style.cssText = 'font-size:14px;line-height:1;pointer-events:none;text-shadow:0 1px 4px rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;width:24px;height:24px;position:relative;';
      el.textContent = icon;
      if (groupCount > 1) {
        const badge = document.createElement('span');
        badge.textContent = String(groupCount);
        badge.style.cssText = 'position:absolute;top:-4px;right:-6px;background:#64748b;color:white;font-size:8px;font-weight:700;min-width:14px;height:14px;border-radius:7px;display:flex;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid rgba(0,0,0,0.5);pointer-events:none;';
        el.appendChild(badge);
      }
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lng, lat])
        .addTo(map);
      emojiMarkersRef.current[id] = marker;
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
  stops: { id: number; latitude: number; longitude: number; name?: string; order_index: number }[],
): any[] {
  const markers: any[] = [];
  for (const stop of stops) {
    const el = document.createElement('div');
    el.className = 'stop-marker';
    el.innerHTML = `
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:13px;box-shadow:0 2px 8px rgba(6,182,212,0.4),0 0 0 3px rgba(6,182,212,0.15);border:2px solid white;">
        ${stop.order_index + 1}
      </div>
    `;
    const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat([stop.longitude, stop.latitude])
      .addTo(map);
    markers.push(marker);
  }
  return markers;
}
