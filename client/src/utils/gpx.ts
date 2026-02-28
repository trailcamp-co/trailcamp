import type { Trip, TripStop } from '../types';

export function generateGPX(trip: Trip, stops: TripStop[]): string {
  const waypoints = stops
    .map(
      (stop, idx) => `
  <wpt lat="${stop.latitude}" lon="${stop.longitude}">
    <name>${idx + 1}. ${stop.name || stop.location_name || 'Stop'}</name>
    ${stop.notes ? `<desc>${escapeXML(stop.notes)}</desc>` : ''}
  </wpt>`
    )
    .join('');

  const trackpoints = stops
    .map(
      (stop) => `
      <trkpt lat="${stop.latitude}" lon="${stop.longitude}">
        <name>${stop.name || stop.location_name || 'Stop'}</name>
      </trkpt>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailCamp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXML(trip.name)}</name>
    <desc>TrailCamp trip itinerary</desc>
  </metadata>
${waypoints}
  <trk>
    <name>${escapeXML(trip.name)} Route</name>
    <trkseg>
${trackpoints}
    </trkseg>
  </trk>
</gpx>`;
}

function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function downloadGPX(trip: Trip, stops: TripStop[]) {
  const gpxContent = generateGPX(trip, stops);
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.name.replace(/[^a-z0-9]/gi, '_')}_trip.gpx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
