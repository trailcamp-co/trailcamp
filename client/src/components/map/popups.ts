import mapboxgl from 'mapbox-gl';
import type { Location } from '../../types';
import { DIFFICULTY_COLORS, TRAIL_TYPE_COLORS, parseTrailTypes, CATEGORY_ICONS } from '../../types';

/** Set up hover tooltip on unclustered points */
export function setupHoverTooltip(map: any): any {
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 10,
    className: 'location-tooltip',
    maxWidth: '260px',
  });

  map.on('mouseenter', 'unclustered-point', (e: any) => {
    map.getCanvas().style.cursor = 'pointer';
    const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
    if (!features.length) return;
    const p = features[0].properties;
    const geo = features[0].geometry;
    if (geo.type === 'Point') {
      const diffColor = DIFFICULTY_COLORS[String(p?.difficulty)] || '';
      const diffBadge = p?.difficulty
        ? `<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:4px;background:${diffColor}20;color:${diffColor};margin-left:6px;">${p.difficulty}</span>`
        : '';
      popup
        .setLngLat(geo.coordinates as [number, number])
        .setHTML(`
          <div style="font-family:Inter,system-ui,sans-serif;">
            <div style="font-size:13px;font-weight:700;color:#f1f5f9;display:flex;align-items:center;gap:2px;">
              ${p?.icon || ''} ${p?.name || ''}${diffBadge}
            </div>
            <div style="font-size:10px;color:#64748b;text-transform:capitalize;margin-top:3px;display:flex;align-items:center;gap:6px;">
              <span>${p?.category || ''}</span>
              ${p?.distance_miles ? `<span>· ${Math.round(Number(p.distance_miles))} mi</span>` : ''}
              ${p?.best_season ? `<span>· ${p.best_season}</span>` : ''}
            </div>
          </div>
        `)
        .addTo(map);
    }
  });
  map.on('mouseleave', 'unclustered-point', () => {
    map.getCanvas().style.cursor = '';
    popup.remove();
  });
  return popup;
}

/** Build HTML for click popup */
export function buildClickPopupHTML(properties: Record<string, string | number>, locationId: number, lat: number, lng: number): string {
  const p = properties;
  const diffColor = DIFFICULTY_COLORS[String(p.difficulty)] || '#6b7280';
  const trailTypes = parseTrailTypes(String(p.trail_types));
  const category = String(p.category || 'riding');
  const icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '📍';
  const subType = String(p.sub_type || '');

  // Description (truncated)
  const desc = p.description
    ? `<p style="font-size:11px;color:#94a3b8;margin:8px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;">${p.description}</p>`
    : '';

  // Difficulty badge
  const diffBadge = p.difficulty
    ? `<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:${diffColor}18;color:${diffColor};border:1px solid ${diffColor}30;">${p.difficulty}</span>`
    : '';

  // Trail type chips
  const trailChips = trailTypes.slice(0, 3).map(tt => {
    const colors = TRAIL_TYPE_COLORS[tt] || { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' };
    return `<span style="font-size:9px;font-weight:500;padding:2px 7px;border-radius:6px;background:${colors.bg};color:${colors.text};">${tt}</span>`;
  }).join('');

  // Stats line
  const stats: string[] = [];
  if (p.distance_miles) stats.push(`${Math.round(Number(p.distance_miles))} mi`);
  if (p.elevation_gain_ft) stats.push(`${Number(p.elevation_gain_ft).toLocaleString()} ft ↑`);
  if (p.cost_per_night != null) {
    const cost = Number(p.cost_per_night);
    stats.push(cost === 0 ? '💚 Free' : `$${cost}/night`);
  }
  const statsHtml = stats.length > 0
    ? `<div style="font-size:10px;color:#64748b;margin-top:6px;display:flex;gap:8px;">${stats.map(s => `<span>${s}</span>`).join('')}</div>`
    : '';

  // Season badge
  const seasonHtml = p.best_season
    ? `<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(34,197,94,0.1);color:#4ade80;border:1px solid rgba(34,197,94,0.15);">📅 ${p.best_season}</span>`
    : '';

  // Campsite-specific info
  const campsiteInfo = category === 'campsite' ? `
    <div style="font-size:10px;color:#64748b;margin-top:4px;display:flex;gap:6px;">
      ${subType ? `<span style="text-transform:capitalize;">🏕️ ${subType}</span>` : ''}
      ${p.water_available ? '<span>💧 Water</span>' : ''}
    </div>
  ` : '';

  const starsHtml = '';

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:220px;max-width:290px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
        <div style="font-size:14px;font-weight:700;color:#f1f5f9;line-height:1.3;flex:1;">${p.name}</div>
        <span style="font-size:18px;flex-shrink:0;">${icon}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;align-items:center;">
        ${diffBadge}${trailChips}${seasonHtml}${
          Number(p.group_count) > 1
            ? `<span style="font-size:9px;padding:2px 6px;border-radius:4px;background:rgba(100,116,139,0.2);color:#94a3b8;border:1px solid rgba(100,116,139,0.2);">📍 ${p.group_count} spots</span>`
            : ''
        }
      </div>
      ${starsHtml}
      ${campsiteInfo}
      ${desc}
      ${statsHtml}
      <div style="margin-top:10px;display:flex;gap:6px;">
        <button onclick="window.__tcPopupOpenDetail && window.__tcPopupOpenDetail(${locationId})"
          style="flex:1;font-size:11px;font-weight:600;padding:7px 0;border-radius:8px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;border:none;cursor:pointer;transition:opacity 0.15s;"
          onmouseover="this.style.opacity='0.85'" onmouseout="this.style.opacity='1'">
          View Details
        </button>
        <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}','_blank')"
          style="font-size:11px;font-weight:600;padding:7px 14px;border-radius:8px;background:rgba(30,41,59,0.8);color:#cbd5e1;border:1px solid rgba(51,65,85,0.5);cursor:pointer;transition:background 0.15s;"
          onmouseover="this.style.background='rgba(30,41,59,1)'" onmouseout="this.style.background='rgba(30,41,59,0.8)'">
          📍 Go
        </button>
      </div>
    </div>
  `;
}

/** Set up click popup */
export function setupClickPopup(
  map: any, hoverPopup: any,
  locationsRef: React.MutableRefObject<Location[]>,
  onLocationClick: (location: Location) => void,
): any {
  const clickPopup = new mapboxgl.Popup({
    closeButton: true, closeOnClick: true, maxWidth: '320px',
    className: 'location-click-popup', offset: 12,
  });

  map.on('click', 'unclustered-point', (e: any) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
    if (!features.length) return;
    const p = features[0].properties!;
    const geo = features[0].geometry;
    const locationId = p.locationId as number;
    const loc = locationsRef.current.find((l) => l.id === locationId);
    if (loc && geo.type === 'Point') {
      hoverPopup.remove();
      // On mobile, skip the popup — the bottom sheet handles details
      if (window.innerWidth < 1024) {
        onLocationClick(loc);
        return;
      }
      clickPopup
        .setLngLat(geo.coordinates as [number, number])
        .setHTML(buildClickPopupHTML(p as Record<string, string | number>, locationId, loc.latitude, loc.longitude))
        .addTo(map);
      onLocationClick(loc);
    }
  });

  (window as unknown as Record<string, unknown>).__tcPopupOpenDetail = (id: number) => {
    const loc = locationsRef.current.find(l => l.id === id);
    if (loc) onLocationClick(loc);
    clickPopup.remove();
  };

  return clickPopup;
}

/** Set up cluster click-to-zoom */
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
