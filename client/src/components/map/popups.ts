import mapboxgl from 'mapbox-gl';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes } from '../../types';

/** Set up hover tooltip on unclustered points */
export function setupHoverTooltip(
  map: any,
): any {
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
        .setHTML(`<div style="font-size:12px;font-weight:600;">${p?.icon || ''} ${p?.name || ''}</div><div style="font-size:10px;color:#64748b;text-transform:capitalize;margin-top:2px;">${p?.category || ''}</div>`)
        .addTo(map);
    }
  });
  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });

  return popup;
}

/** Build HTML for the click popup */
export function buildClickPopupHTML(properties: Record<string, string | number>, locationId: number, lat: number, lng: number): string {
  const p = properties;
  const diffColor = DIFFICULTY_COLORS[String(p.difficulty)] || '#6b7280';
  const trailTypes = parseTrailTypes(String(p.trail_types));

  const descriptionHtml = p.description
    ? `<div style="font-size:12px;color:#94a3b8;margin-top:6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;">${p.description}</div>`
    : '';

  const trailChipsHtml = trailTypes.slice(0, 4).map(tt => {
    const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' };
    return `<span style="font-size:9px;font-weight:500;padding:2px 8px;border-radius:9999px;background:${colors.bg};color:${colors.text};white-space:nowrap;">${tt}</span>`;
  }).join('');

  const sceneryRating = Number(p.scenery_rating) || 0;
  const sceneryHtml = sceneryRating > 0
    ? `<div style="margin-top:6px;">${Array.from({length: 5}, (_, i) => `<span style="color:${i < sceneryRating ? '#facc15' : '#283548'};font-size:12px;">★</span>`).join('')}</div>`
    : '';

  const statsHtml = [
    p.distance_miles ? `<span style="font-size:11px;color:#94a3b8;">📏 ${Math.round(Number(p.distance_miles))} mi</span>` : '',
    p.elevation_gain_ft ? `<span style="font-size:11px;color:#94a3b8;">⛰️ ${Number(p.elevation_gain_ft).toLocaleString()} ft</span>` : '',
  ].filter(Boolean).join('<span style="color:#283548;margin:0 6px;">·</span>');

  const stateHtml = p.state ? `<span style="font-size:10px;color:#64748b;margin-left:4px;">${p.state}</span>` : '';

  return `
    <div style="font-family:Inter,system-ui,-apple-system,sans-serif;min-width:200px;max-width:280px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <div style="font-size:15px;font-weight:700;color:#f3f4f6;line-height:1.3;">${p.icon || ''} ${p.name}${stateHtml}</div>
      </div>
      ${p.difficulty ? `<span style="font-size:10px;font-weight:600;padding:2px 10px;border-radius:9999px;background:${diffColor}22;color:${diffColor};">${p.difficulty}</span>` : ''}
      ${sceneryHtml}
      ${descriptionHtml}
      ${trailChipsHtml ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">${trailChipsHtml}</div>` : ''}
      ${statsHtml ? `<div style="margin-top:8px;">${statsHtml}</div>` : ''}
      <div style="margin-top:10px;display:flex;gap:8px;">
        <button onclick="window.__tcPopupOpenDetail && window.__tcPopupOpenDetail(${locationId})" style="font-size:11px;font-weight:600;padding:6px 14px;border-radius:8px;background:rgba(249,115,22,0.9);color:#fff;border:none;cursor:pointer;transition:background 0.15s;">View Details</button>
        <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}','_blank')" style="font-size:11px;font-weight:600;padding:6px 14px;border-radius:8px;background:rgba(40,53,72,0.8);color:#d1d5db;border:1px solid rgba(40,53,72,0.5);cursor:pointer;transition:background 0.15s;">Directions</button>
      </div>
    </div>
  `;
}

/** Set up click popup on unclustered points */
export function setupClickPopup(
  map: any,
  hoverPopup: any,
  locationsRef: React.MutableRefObject<Location[]>,
  onLocationClick: (location: Location) => void,
): any {
  const clickPopup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true,
    maxWidth: '300px',
    className: 'location-click-popup',
    offset: 12,
  });

  map.on('click', 'unclustered-point', (e: any) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
    if (!features.length) return;
    const p = features[0].properties!;
    const geo = features[0].geometry;
    const locationId = p.locationId as number;
    const loc = locationsRef.current.find((l) => l.id === locationId);

    if (loc && geo.type === 'Point') {
      const html = buildClickPopupHTML(
        p as Record<string, string | number>,
        locationId,
        loc.latitude,
        loc.longitude,
      );
      hoverPopup.remove();
      clickPopup.setLngLat(geo.coordinates as [number, number]).setHTML(html).addTo(map);
      onLocationClick(loc);
    }
  });

  // Global handler for popup "View Details" button
  (window as unknown as Record<string, unknown>).__tcPopupOpenDetail = (id: number) => {
    const loc = locationsRef.current.find(l => l.id === id);
    if (loc) onLocationClick(loc);
    clickPopup.remove();
  };

  return clickPopup;
}

/** Set up cluster click-to-zoom behavior */
export function setupClusterClick(map: any): void {
  map.on('click', 'clusters', (e: any) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    if (!features.length) return;
    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('locations') as any;
    (source as unknown as { getClusterExpansionZoom: (id: number, cb: (err: Error | null, zoom: number | null) => void) => void })
      .getClusterExpansionZoom(clusterId, (err: Error | null, zoom: number | null) => {
        if (err) return;
        const geo = features[0].geometry;
        if (geo.type === 'Point') {
          map.easeTo({ center: geo.coordinates as [number, number], zoom: zoom ?? undefined });
        }
      });
  });

  map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
}
