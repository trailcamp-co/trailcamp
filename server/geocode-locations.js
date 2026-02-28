#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocodes coordinates to get state/county information

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Rate limiting
const DELAY_MS = 1000; // 1 second between requests (Nominatim requirement)
let requestCount = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reverse geocode using Nominatim (OpenStreetMap)
async function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TrailCamp/1.0 (Motorcycle trail mapping app)'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          requestCount++;
          
          if (result.error) {
            resolve(null);
          } else {
            const address = result.address || {};
            resolve({
              state: address.state || address.province || null,
              county: address.county || null,
              country: address.country || null,
              display_name: result.display_name || null
            });
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Get US state abbreviation from full name
function getStateAbbr(stateName) {
  const stateMap = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  
  return stateMap[stateName] || stateName;
}

// Check if state and county columns exist, if not add them
function ensureColumns() {
  try {
    db.prepare('SELECT state FROM locations LIMIT 1').get();
  } catch (err) {
    console.log('Adding state column...');
    db.prepare('ALTER TABLE locations ADD COLUMN state TEXT').run();
  }
  
  try {
    db.prepare('SELECT county FROM locations LIMIT 1').get();
  } catch (err) {
    console.log('Adding county column...');
    db.prepare('ALTER TABLE locations ADD COLUMN county TEXT').run();
  }
}

// Main geocoding function
async function geocodeLocations(limit = null, skipExisting = true) {
  ensureColumns();
  
  let query = 'SELECT id, name, latitude, longitude, state, county FROM locations';
  
  if (skipExisting) {
    query += ' WHERE state IS NULL OR state = \'\'';
  }
  
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  
  const locations = db.prepare(query).all();
  
  console.log(`\nFound ${locations.length} locations to geocode\n`);
  
  if (locations.length === 0) {
    console.log('✓ All locations already geocoded!\n');
    return { processed: 0, success: 0, failed: 0 };
  }
  
  const stats = {
    processed: 0,
    success: 0,
    failed: 0,
    byState: {}
  };
  
  const updateStmt = db.prepare('UPDATE locations SET state = ?, county = ? WHERE id = ?');
  
  for (const loc of locations) {
    stats.processed++;
    
    try {
      console.log(`[${stats.processed}/${locations.length}] ${loc.name}...`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      
      if (result && result.state) {
        const stateAbbr = getStateAbbr(result.state);
        updateStmt.run(stateAbbr, result.county, loc.id);
        
        stats.success++;
        
        if (!stats.byState[stateAbbr]) {
          stats.byState[stateAbbr] = 0;
        }
        stats.byState[stateAbbr]++;
        
        console.log(`  ✓ ${stateAbbr}${result.county ? ', ' + result.county : ''}`);
      } else {
        stats.failed++;
        console.log(`  ✗ Could not geocode`);
      }
      
      // Rate limiting (required by Nominatim)
      if (stats.processed < locations.length) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      stats.failed++;
      console.log(`  ✗ Error: ${err.message}`);
    }
  }
  
  return stats;
}

// Generate state coverage report
function generateReport() {
  ensureColumns();
  
  const total = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
  const withState = db.prepare('SELECT COUNT(*) as count FROM locations WHERE state IS NOT NULL AND state != \'\'').get().count;
  const withoutState = total - withState;
  
  const byState = db.prepare(`
    SELECT state, COUNT(*) as count 
    FROM locations 
    WHERE state IS NOT NULL AND state != ''
    GROUP BY state 
    ORDER BY count DESC
  `).all();
  
  console.log('\n' + '='.repeat(60));
  console.log('GEOCODING COVERAGE REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal locations:      ${total}`);
  console.log(`With state data:      ${withState} (${Math.round((withState / total) * 100)}%)`);
  console.log(`Missing state data:   ${withoutState}`);
  
  if (byState.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('LOCATIONS BY STATE:\n');
    
    for (const row of byState) {
      console.log(`  ${row.state.padEnd(3)} ${row.count.toString().padStart(5)} locations`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Usage:
  node geocode-locations.js [options]

Options:
  --limit N        Process only N locations
  --all            Re-geocode all locations (including existing)
  --report         Show coverage report only
  --help           Show this help

Examples:
  node geocode-locations.js --limit 10
  node geocode-locations.js --report
  node geocode-locations.js

Notes:
  - Uses OpenStreetMap Nominatim (free, requires 1sec delay between requests)
  - Adds 'state' and 'county' columns to locations table
  - Skips locations that already have state data (use --all to re-geocode)
  - Rate limited to 1 request/second (Nominatim requirement)
  `);
  process.exit(0);
}

if (args.includes('--report')) {
  generateReport();
  db.close();
  process.exit(0);
}

const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : null;
const skipExisting = !args.includes('--all');

console.log('TrailCamp Geocoding Helper');
console.log('Using: OpenStreetMap Nominatim (free)');
console.log('Rate limit: 1 request/second\n');

if (limit) {
  console.log(`Processing limit: ${limit} locations`);
}

if (skipExisting) {
  console.log('Skipping locations with existing state data');
} else {
  console.log('Re-geocoding ALL locations');
}

(async () => {
  try {
    const stats = await geocodeLocations(limit, skipExisting);
    
    console.log('\n' + '='.repeat(60));
    console.log('GEOCODING COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nProcessed:  ${stats.processed}`);
    console.log(`Success:    ${stats.success}`);
    console.log(`Failed:     ${stats.failed}`);
    console.log(`Requests:   ${requestCount}`);
    
    if (Object.keys(stats.byState).length > 0) {
      console.log('\nLocations by state:');
      const sorted = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
      for (const [state, count] of sorted) {
        console.log(`  ${state}: ${count}`);
      }
    }
    
    console.log('='.repeat(60) + '\n');
    
    if (stats.success > 0) {
      console.log('Run --report to see full coverage:\n');
      console.log('  node geocode-locations.js --report\n');
    }
  } catch (err) {
    console.error(`\n✗ Geocoding failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
