#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocodes coordinates to get state/county information

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Simple state mapping from coordinates (faster than API calls for bulk processing)
const STATE_BOUNDARIES = {
  'AL': { latMin: 30.2, latMax: 35.0, lonMin: -88.5, lonMax: -84.9 },
  'AK': { latMin: 51.2, latMax: 71.5, lonMin: -179.0, lonMax: -129.0 },
  'AZ': { latMin: 31.3, latMax: 37.0, lonMin: -114.8, lonMax: -109.0 },
  'AR': { latMin: 33.0, latMax: 36.5, lonMin: -94.6, lonMax: -89.6 },
  'CA': { latMin: 32.5, latMax: 42.0, lonMin: -124.5, lonMax: -114.1 },
  'CO': { latMin: 37.0, latMax: 41.0, lonMin: -109.1, lonMax: -102.0 },
  'CT': { latMin: 41.0, latMax: 42.1, lonMin: -73.7, lonMax: -71.8 },
  'DE': { latMin: 38.5, latMax: 39.8, lonMin: -75.8, lonMax: -75.0 },
  'FL': { latMin: 24.5, latMax: 31.0, lonMin: -87.6, lonMax: -80.0 },
  'GA': { latMin: 30.4, latMax: 35.0, lonMin: -85.6, lonMax: -80.8 },
  'HI': { latMin: 18.9, latMax: 22.2, lonMin: -160.0, lonMax: -154.8 },
  'ID': { latMin: 42.0, latMax: 49.0, lonMin: -117.2, lonMax: -111.0 },
  'IL': { latMin: 37.0, latMax: 42.5, lonMin: -91.5, lonMax: -87.5 },
  'IN': { latMin: 37.8, latMax: 41.8, lonMin: -88.1, lonMax: -84.8 },
  'IA': { latMin: 40.4, latMax: 43.5, lonMin: -96.6, lonMax: -90.1 },
  'KS': { latMin: 37.0, latMax: 40.0, lonMin: -102.1, lonMax: -94.6 },
  'KY': { latMin: 36.5, latMax: 39.1, lonMin: -89.6, lonMax: -81.9 },
  'LA': { latMin: 29.0, latMax: 33.0, lonMin: -94.0, lonMax: -89.0 },
  'ME': { latMin: 43.1, latMax: 47.5, lonMin: -71.1, lonMax: -66.9 },
  'MD': { latMin: 37.9, latMax: 39.7, lonMin: -79.5, lonMax: -75.0 },
  'MA': { latMin: 41.2, latMax: 42.9, lonMin: -73.5, lonMax: -69.9 },
  'MI': { latMin: 41.7, latMax: 48.3, lonMin: -90.4, lonMax: -82.4 },
  'MN': { latMin: 43.5, latMax: 49.4, lonMin: -97.2, lonMax: -89.5 },
  'MS': { latMin: 30.2, latMax: 35.0, lonMin: -91.7, lonMax: -88.1 },
  'MO': { latMin: 36.0, latMax: 40.6, lonMin: -95.8, lonMax: -89.1 },
  'MT': { latMin: 45.0, latMax: 49.0, lonMin: -116.1, lonMax: -104.0 },
  'NE': { latMin: 40.0, latMax: 43.0, lonMin: -104.1, lonMax: -95.3 },
  'NV': { latMin: 35.0, latMax: 42.0, lonMin: -120.0, lonMax: -114.0 },
  'NH': { latMin: 42.7, latMax: 45.3, lonMin: -72.6, lonMax: -70.6 },
  'NJ': { latMin: 38.9, latMax: 41.4, lonMin: -75.6, lonMax: -73.9 },
  'NM': { latMin: 31.3, latMax: 37.0, lonMin: -109.1, lonMax: -103.0 },
  'NY': { latMin: 40.5, latMax: 45.0, lonMin: -79.8, lonMax: -71.9 },
  'NC': { latMin: 33.8, latMax: 36.6, lonMin: -84.3, lonMax: -75.5 },
  'ND': { latMin: 45.9, latMax: 49.0, lonMin: -104.1, lonMax: -96.6 },
  'OH': { latMin: 38.4, latMax: 42.0, lonMin: -84.8, lonMax: -80.5 },
  'OK': { latMin: 33.6, latMax: 37.0, lonMin: -103.0, lonMax: -94.4 },
  'OR': { latMin: 42.0, latMax: 46.3, lonMin: -124.6, lonMax: -116.5 },
  'PA': { latMin: 39.7, latMax: 42.3, lonMin: -80.5, lonMax: -74.7 },
  'RI': { latMin: 41.1, latMax: 42.0, lonMin: -71.9, lonMax: -71.1 },
  'SC': { latMin: 32.0, latMax: 35.2, lonMin: -83.4, lonMax: -78.5 },
  'SD': { latMin: 42.5, latMax: 46.0, lonMin: -104.1, lonMax: -96.4 },
  'TN': { latMin: 35.0, latMax: 36.7, lonMin: -90.3, lonMax: -81.6 },
  'TX': { latMin: 25.8, latMax: 36.5, lonMin: -106.6, lonMax: -93.5 },
  'UT': { latMin: 37.0, latMax: 42.0, lonMin: -114.1, lonMax: -109.0 },
  'VT': { latMin: 42.7, latMax: 45.0, lonMin: -73.4, lonMax: -71.5 },
  'VA': { latMin: 36.5, latMax: 39.5, lonMin: -83.7, lonMax: -75.2 },
  'WA': { latMin: 45.5, latMax: 49.0, lonMin: -124.8, lonMax: -116.9 },
  'WV': { latMin: 37.2, latMax: 40.6, lonMin: -82.6, lonMax: -77.7 },
  'WI': { latMin: 42.5, latMax: 47.1, lonMin: -92.9, lonMax: -86.8 },
  'WY': { latMin: 41.0, latMax: 45.0, lonMin: -111.1, lonMax: -104.0 }
};

function getStateFromCoords(lat, lon) {
  for (const [state, bounds] of Object.entries(STATE_BOUNDARIES)) {
    if (lat >= bounds.latMin && lat <= bounds.latMax &&
        lon >= bounds.lonMin && lon <= bounds.lonMax) {
      return state;
    }
  }
  return null;
}

// Check if state column exists, add if not
function ensureStateColumn() {
  const tableInfo = db.prepare("PRAGMA table_info(locations)").all();
  const hasState = tableInfo.some(col => col.name === 'state');
  
  if (!hasState) {
    console.log('Adding state column to locations table...');
    db.prepare('ALTER TABLE locations ADD COLUMN state VARCHAR(2)').run();
    console.log('✓ State column added\n');
  } else {
    console.log('✓ State column already exists\n');
  }
}

// Geocode all locations
function geocodeAllLocations() {
  console.log('Geocoding all locations...\n');
  
  const locations = db.prepare('SELECT id, name, latitude, longitude, state FROM locations').all();
  console.log(`Found ${locations.length} locations\n`);
  
  const stats = {
    total: locations.length,
    alreadyHaveState: 0,
    geocoded: 0,
    unknown: 0,
    byState: {}
  };
  
  const updateStmt = db.prepare('UPDATE locations SET state = ? WHERE id = ?');
  
  for (const loc of locations) {
    if (loc.state) {
      stats.alreadyHaveState++;
      stats.byState[loc.state] = (stats.byState[loc.state] || 0) + 1;
      continue;
    }
    
    const state = getStateFromCoords(loc.latitude, loc.longitude);
    
    if (state) {
      updateStmt.run(state, loc.id);
      stats.geocoded++;
      stats.byState[state] = (stats.byState[state] || 0) + 1;
    } else {
      stats.unknown++;
    }
  }
  
  return stats;
}

// Generate state summary report
function generateStateSummary() {
  const summary = db.prepare(`
    SELECT 
      state,
      COUNT(*) as total,
      SUM(CASE WHEN category = 'riding' THEN 1 ELSE 0 END) as riding,
      SUM(CASE WHEN category = 'campsite' THEN 1 ELSE 0 END) as campsites,
      SUM(CASE WHEN category = 'campsite' AND sub_type = 'boondocking' THEN 1 ELSE 0 END) as boondocking
    FROM locations
    WHERE state IS NOT NULL
    GROUP BY state
    ORDER BY total DESC
  `).all();
  
  return summary;
}

// Main execution
console.log('TrailCamp Geocoding Helper\n');
console.log('='.repeat(60) + '\n');

try {
  // Ensure state column exists
  ensureStateColumn();
  
  // Geocode locations
  const stats = geocodeAllLocations();
  
  // Print results
  console.log('='.repeat(60));
  console.log('GEOCODING RESULTS\n');
  console.log(`Total locations:        ${stats.total}`);
  console.log(`Already had state:      ${stats.alreadyHaveState}`);
  console.log(`Newly geocoded:         ${stats.geocoded}`);
  console.log(`Unknown (out of US):    ${stats.unknown}`);
  console.log('='.repeat(60) + '\n');
  
  // Generate and print state summary
  const summary = generateStateSummary();
  
  console.log('Locations by State:\n');
  console.log('State | Total | Riding | Campsites | Boondocking');
  console.log('-'.repeat(60));
  
  for (const row of summary) {
    console.log(
      `${row.state.padEnd(5)} | ` +
      `${row.total.toString().padStart(5)} | ` +
      `${row.riding.toString().padStart(6)} | ` +
      `${row.campsites.toString().padStart(9)} | ` +
      `${row.boondocking.toString().padStart(11)}`
    );
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✓ Geocoding complete! ${stats.geocoded} locations updated.\n`);
  
  if (stats.unknown > 0) {
    console.log(`⚠️  ${stats.unknown} locations could not be geocoded (outside US boundaries)`);
    console.log('These are likely in territories, Canada, or have invalid coordinates.\n');
  }
  
} catch (err) {
  console.error(`✗ Error: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
