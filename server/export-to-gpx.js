#!/usr/bin/env node
// GPX Export Tool for TrailCamp
// Exports locations or trips to GPX format for GPS devices

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Generate GPX XML
function generateGPX(locations, metadata = {}) {
  const timestamp = new Date().toISOString();
  const { name = 'TrailCamp Export', description = '', author = 'TrailCamp' } = metadata;
  
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" 
     creator="${author}"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(name)}</name>
    ${description ? `<desc>${escapeXml(description)}</desc>` : ''}
    <author>
      <name>${escapeXml(author)}</name>
    </author>
    <time>${timestamp}</time>
  </metadata>
`;

  // Add waypoints
  for (const loc of locations) {
    gpx += `  <wpt lat="${loc.latitude}" lon="${loc.longitude}">
    <name>${escapeXml(loc.name)}</name>
`;
    
    if (loc.description) {
      gpx += `    <desc>${escapeXml(loc.description)}</desc>\n`;
    }
    
    // Add type/category
    const type = loc.category === 'riding' ? 'Trail' : 
                 loc.sub_type === 'boondocking' ? 'Camping' : 
                 'Campground';
    gpx += `    <type>${type}</type>\n`;
    
    // Add symbol for GPS display
    const symbol = loc.category === 'riding' ? 'Trail Head' : 'Campground';
    gpx += `    <sym>${symbol}</sym>\n`;
    
    // Extensions for additional data
    if (loc.difficulty || loc.scenery_rating || loc.trail_types) {
      gpx += `    <extensions>\n`;
      
      if (loc.difficulty) {
        gpx += `      <difficulty>${escapeXml(loc.difficulty)}</difficulty>\n`;
      }
      
      if (loc.scenery_rating) {
        gpx += `      <scenery>${loc.scenery_rating}</scenery>\n`;
      }
      
      if (loc.trail_types) {
        gpx += `      <trail_types>${escapeXml(loc.trail_types)}</trail_types>\n`;
      }
      
      if (loc.distance_miles) {
        gpx += `      <distance_miles>${loc.distance_miles}</distance_miles>\n`;
      }
      
      gpx += `    </extensions>\n`;
    }
    
    gpx += `  </wpt>\n`;
  }
  
  gpx += `</gpx>`;
  
  return gpx;
}

// Escape XML special characters
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Export all riding locations
function exportRidingLocations(outputPath) {
  const locations = db.prepare(`
    SELECT * FROM locations 
    WHERE category = 'riding' 
    ORDER BY name
  `).all();
  
  console.log(`Exporting ${locations.length} riding locations...\n`);
  
  const gpx = generateGPX(locations, {
    name: 'TrailCamp - All Riding Locations',
    description: `${locations.length} motorcycle trails and riding areas`,
    author: 'TrailCamp'
  });
  
  fs.writeFileSync(outputPath, gpx);
  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`  ${locations.length} waypoints\n`);
}

// Export all camping locations
function exportCampingLocations(outputPath) {
  const locations = db.prepare(`
    SELECT * FROM locations 
    WHERE category = 'campsite' 
    ORDER BY name
  `).all();
  
  console.log(`Exporting ${locations.length} camping locations...\n`);
  
  const gpx = generateGPX(locations, {
    name: 'TrailCamp - All Camping Locations',
    description: `${locations.length} campgrounds and boondocking spots`,
    author: 'TrailCamp'
  });
  
  fs.writeFileSync(outputPath, gpx);
  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`  ${locations.length} waypoints\n`);
}

// Export specific trip
function exportTrip(tripId, outputPath) {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId);
  
  if (!trip) {
    console.error(`✗ Trip ID ${tripId} not found\n`);
    process.exit(1);
  }
  
  const stops = db.prepare(`
    SELECT l.* 
    FROM trip_stops ts
    JOIN locations l ON ts.location_id = l.id
    WHERE ts.trip_id = ?
    ORDER BY ts.stop_order
  `).all(tripId);
  
  console.log(`Exporting trip: ${trip.name}`);
  console.log(`${stops.length} stops\n`);
  
  const gpx = generateGPX(stops, {
    name: trip.name,
    description: trip.notes || `Trip with ${stops.length} stops`,
    author: 'TrailCamp'
  });
  
  fs.writeFileSync(outputPath, gpx);
  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`  ${stops.length} waypoints\n`);
}

// Export by region/state
function exportByState(state, outputPath) {
  const locations = db.prepare(`
    SELECT * FROM locations 
    WHERE state = ?
    ORDER BY name
  `).all(state);
  
  if (locations.length === 0) {
    console.error(`✗ No locations found for state: ${state}\n`);
    process.exit(1);
  }
  
  console.log(`Exporting ${locations.length} locations in ${state}...\n`);
  
  const gpx = generateGPX(locations, {
    name: `TrailCamp - ${state} Locations`,
    description: `${locations.length} locations in ${state}`,
    author: 'TrailCamp'
  });
  
  fs.writeFileSync(outputPath, gpx);
  console.log(`✓ Exported to: ${outputPath}`);
  console.log(`  ${locations.length} waypoints\n`);
}

// CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
TrailCamp GPX Export Tool

Usage:
  node export-to-gpx.js --riding <output.gpx>
  node export-to-gpx.js --camping <output.gpx>
  node export-to-gpx.js --trip <trip-id> <output.gpx>
  node export-to-gpx.js --state <STATE> <output.gpx>

Options:
  --riding         Export all riding locations
  --camping        Export all camping locations
  --trip ID        Export specific trip by ID
  --state XX       Export all locations in state (e.g., CA, UT, CO)
  --help           Show this help

Examples:
  node export-to-gpx.js --riding all-trails.gpx
  node export-to-gpx.js --camping all-camps.gpx
  node export-to-gpx.js --trip 1 my-trip.gpx
  node export-to-gpx.js --state CA california.gpx

Output:
  Standard GPX 1.1 format compatible with:
  - Garmin GPS devices
  - BaseCamp, Gaia GPS, AllTrails
  - Google Earth, QGIS
  - Most GPS mapping software
  `);
  process.exit(0);
}

try {
  if (args[0] === '--riding') {
    const output = args[1] || 'trailcamp-riding.gpx';
    exportRidingLocations(output);
  } else if (args[0] === '--camping') {
    const output = args[1] || 'trailcamp-camping.gpx';
    exportCampingLocations(output);
  } else if (args[0] === '--trip') {
    const tripId = parseInt(args[1]);
    const output = args[2] || `trip-${tripId}.gpx`;
    if (!tripId) {
      console.error('✗ Trip ID required\n');
      process.exit(1);
    }
    exportTrip(tripId, output);
  } else if (args[0] === '--state') {
    const state = args[1];
    const output = args[2] || `${state.toLowerCase()}-locations.gpx`;
    if (!state) {
      console.error('✗ State code required (e.g., CA, UT, CO)\n');
      process.exit(1);
    }
    exportByState(state.toUpperCase(), output);
  } else {
    console.error('✗ Invalid option. Use --help for usage.\n');
    process.exit(1);
  }
} catch (err) {
  console.error(`\n✗ Export failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
