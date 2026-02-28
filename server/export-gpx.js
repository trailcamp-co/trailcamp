#!/usr/bin/env node
// GPX Export Tool for TrailCamp
// Exports riding locations or trips to GPX format for GPS devices

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Generate GPX header
function gpxHeader() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" 
     creator="TrailCamp"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>TrailCamp Export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;
}

function gpxFooter() {
  return `</gpx>`;
}

// Escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate waypoint for a location
function generateWaypoint(loc) {
  const name = escapeXml(loc.name);
  const desc = escapeXml(loc.description || '');
  const type = loc.category === 'riding' ? 'Trail' : 'Campsite';
  
  let cmt = '';
  if (loc.difficulty) cmt += `Difficulty: ${loc.difficulty}. `;
  if (loc.distance_miles) cmt += `Distance: ${loc.distance_miles}mi. `;
  if (loc.scenery_rating) cmt += `Scenery: ${loc.scenery_rating}/10. `;
  
  return `  <wpt lat="${loc.latitude}" lon="${loc.longitude}">
    <name>${name}</name>
    <desc>${desc}</desc>
    <cmt>${escapeXml(cmt)}</cmt>
    <type>${type}</type>
    <sym>${loc.category === 'riding' ? 'Trail Head' : 'Campground'}</sym>
  </wpt>
`;
}

// Export riding locations to GPX
function exportRidingLocations(options = {}) {
  let query = `SELECT * FROM locations WHERE category = 'riding'`;
  const params = [];
  
  if (options.state) {
    query += ` AND state = ?`;
    params.push(options.state);
  }
  
  if (options.difficulty) {
    query += ` AND difficulty = ?`;
    params.push(options.difficulty);
  }
  
  if (options.minScenery) {
    query += ` AND scenery_rating >= ?`;
    params.push(options.minScenery);
  }
  
  query += ` ORDER BY name`;
  
  if (options.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
  }
  
  const locations = db.prepare(query).all(...params);
  
  console.log(`Found ${locations.length} riding locations\n`);
  
  let gpx = gpxHeader();
  
  for (const loc of locations) {
    gpx += generateWaypoint(loc);
  }
  
  gpx += gpxFooter();
  
  return { gpx, count: locations.length };
}

// Export trip to GPX with route and waypoints
function exportTrip(tripId) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  
  if (!trip) {
    throw new Error(`Trip ${tripId} not found`);
  }
  
  const stops = db.prepare(`
    SELECT ts.*, l.* 
    FROM trip_stops ts
    JOIN locations l ON ts.location_id = l.id
    WHERE ts.trip_id = ?
    ORDER BY ts.stop_order
  `).all(tripId);
  
  console.log(`Exporting trip: ${trip.name}`);
  console.log(`Stops: ${stops.length}\n`);
  
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" 
     creator="TrailCamp"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(trip.name)}</name>
    <desc>${escapeXml(trip.notes || '')}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;
  
  // Add route
  if (stops.length > 0) {
    gpx += `  <rte>
    <name>${escapeXml(trip.name)} - Route</name>
`;
    
    for (const stop of stops) {
      gpx += `    <rtept lat="${stop.latitude}" lon="${stop.longitude}">
      <name>Stop ${stop.stop_order}: ${escapeXml(stop.name)}</name>
      <desc>${escapeXml(stop.description || '')}</desc>
    </rtept>
`;
    }
    
    gpx += `  </rte>
`;
  }
  
  // Add waypoints for each stop
  for (const stop of stops) {
    gpx += generateWaypoint(stop);
  }
  
  gpx += gpxFooter();
  
  return { gpx, count: stops.length };
}

// Export campsites/boondocking to GPX
function exportCampsites(options = {}) {
  let query = `SELECT * FROM locations WHERE category = 'campsite'`;
  const params = [];
  
  if (options.subType) {
    query += ` AND sub_type = ?`;
    params.push(options.subType);
  }
  
  if (options.state) {
    query += ` AND state = ?`;
    params.push(options.state);
  }
  
  if (options.minScenery) {
    query += ` AND scenery_rating >= ?`;
    params.push(options.minScenery);
  }
  
  query += ` ORDER BY name`;
  
  if (options.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
  }
  
  const locations = db.prepare(query).all(...params);
  
  console.log(`Found ${locations.length} campsites\n`);
  
  let gpx = gpxHeader();
  
  for (const loc of locations) {
    gpx += generateWaypoint(loc);
  }
  
  gpx += gpxFooter();
  
  return { gpx, count: locations.length };
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
TrailCamp GPX Export Tool

Usage:
  node export-gpx.js <command> [options]

Commands:
  riding              Export riding locations
  campsites           Export campsites
  trip <id>           Export specific trip

Options:
  --state <code>      Filter by state (e.g., CA, UT, CO)
  --difficulty <lvl>  Filter by difficulty (Easy, Moderate, Hard, etc.)
  --scenery <min>     Filter by min scenery rating (1-10)
  --limit <n>         Limit results to N locations
  --output <file>     Output file (default: export.gpx)
  --subtype <type>    For campsites: boondocking, campground, etc.

Examples:
  # Export all California riding locations
  node export-gpx.js riding --state CA --output ca-riding.gpx
  
  # Export hard difficulty trails
  node export-gpx.js riding --difficulty Hard --output hard-trails.gpx
  
  # Export top scenery boondocking spots
  node export-gpx.js campsites --subtype boondocking --scenery 8 --output boondocking-epic.gpx
  
  # Export trip #1
  node export-gpx.js trip 1 --output my-trip.gpx
  
  # Export 50 riding locations
  node export-gpx.js riding --limit 50 --output sample.gpx
  `);
  process.exit(0);
}

const command = args[0];
const outputFile = args.includes('--output') ? args[args.indexOf('--output') + 1] : 'export.gpx';

const options = {
  state: args.includes('--state') ? args[args.indexOf('--state') + 1] : null,
  difficulty: args.includes('--difficulty') ? args[args.indexOf('--difficulty') + 1] : null,
  minScenery: args.includes('--scenery') ? parseInt(args[args.indexOf('--scenery') + 1]) : null,
  limit: args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null,
  subType: args.includes('--subtype') ? args[args.indexOf('--subtype') + 1] : null
};

try {
  let result;
  
  if (command === 'riding') {
    result = exportRidingLocations(options);
  } else if (command === 'campsites') {
    result = exportCampsites(options);
  } else if (command === 'trip') {
    const tripId = parseInt(args[1]);
    if (isNaN(tripId)) {
      throw new Error('Trip ID must be a number');
    }
    result = exportTrip(tripId);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
  
  fs.writeFileSync(outputFile, result.gpx);
  
  console.log(`✓ Exported ${result.count} locations to ${outputFile}`);
  console.log(`  File size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB\n`);
  
} catch (err) {
  console.error(`\n✗ Export failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
