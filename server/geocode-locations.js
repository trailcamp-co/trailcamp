#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocodes coordinates to get state/county names

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// US State mappings (for validation)
const US_STATES = {
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

// Reverse geocode using Nominatim (OSM)
function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TrailCamp-Geocoder/1.0'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.error) {
            reject(new Error(json.error));
            return;
          }
          
          const address = json.address || {};
          
          // Extract state
          let state = address.state || null;
          if (state && US_STATES[state]) {
            state = US_STATES[state]; // Convert to 2-letter code
          }
          
          // Extract county
          let county = address.county || null;
          if (county) {
            county = county.replace(/ County$/, ''); // Remove " County" suffix
          }
          
          resolve({ state, county });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Sleep helper (respect rate limits: 1 req/sec for Nominatim)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Geocode locations
async function geocodeLocations(limit = null, dryRun = false) {
  const query = limit 
    ? `SELECT id, name, latitude, longitude FROM locations WHERE state IS NULL LIMIT ${limit}`
    : 'SELECT id, name, latitude, longitude FROM locations WHERE state IS NULL';
  
  const locations = db.prepare(query).all();
  
  console.log(`${dryRun ? 'DRY RUN - ' : ''}Found ${locations.length} locations to geocode\n`);
  
  if (locations.length === 0) {
    console.log('✓ All locations already have state data!\n');
    return { total: 0, success: 0, failed: 0 };
  }
  
  const stats = {
    total: locations.length,
    success: 0,
    failed: 0,
    byState: {}
  };
  
  const updateStmt = db.prepare('UPDATE locations SET state = ?, county = ? WHERE id = ?');
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const progress = `[${i + 1}/${locations.length}]`;
    
    try {
      console.log(`${progress} Geocoding: ${loc.name.substring(0, 50)}...`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      
      if (result.state) {
        stats.success++;
        stats.byState[result.state] = (stats.byState[result.state] || 0) + 1;
        
        if (!dryRun) {
          updateStmt.run(result.state, result.county, loc.id);
        }
        
        console.log(`  ✓ ${result.state}${result.county ? ', ' + result.county : ''}`);
      } else {
        stats.failed++;
        console.log(`  ✗ Could not determine state`);
      }
      
      // Rate limit: 1 request per second
      if (i < locations.length - 1) {
        await sleep(1100);
      }
    } catch (err) {
      stats.failed++;
      console.log(`  ✗ Error: ${err.message}`);
      
      // Back off on errors
      await sleep(2000);
    }
  }
  
  return stats;
}

// Generate state coverage report
function generateReport() {
  const total = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
  const withState = db.prepare('SELECT COUNT(*) as count FROM locations WHERE state IS NOT NULL').get().count;
  const byState = db.prepare(`
    SELECT state, COUNT(*) as count 
    FROM locations 
    WHERE state IS NOT NULL 
    GROUP BY state 
    ORDER BY count DESC
  `).all();
  
  console.log('\n' + '='.repeat(60));
  console.log('STATE COVERAGE REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal locations:      ${total}`);
  console.log(`With state data:      ${withState} (${Math.round((withState / total) * 100)}%)`);
  console.log(`Missing state data:   ${total - withState}\n`);
  
  if (byState.length > 0) {
    console.log('Locations by state:\n');
    
    for (const row of byState) {
      const bar = '█'.repeat(Math.round((row.count / withState) * 40));
      console.log(`  ${row.state.padEnd(3)} ${String(row.count).padStart(5)}  ${bar}`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Usage:
  node geocode-locations.js [options]

Options:
  --limit N     Geocode only N locations (for testing)
  --dry-run     Test without updating database
  --report      Show state coverage report only
  --help        Show this help

Examples:
  node geocode-locations.js --limit 10 --dry-run
  node geocode-locations.js --limit 100
  node geocode-locations.js
  node geocode-locations.js --report

Note: Uses OpenStreetMap Nominatim API (1 request/second limit)
      Full geocoding of 6000+ locations takes ~2 hours
  `);
  process.exit(0);
}

if (args.includes('--report')) {
  generateReport();
  db.close();
  process.exit(0);
}

const limit = args.find(a => a.startsWith('--limit'))
  ? parseInt(args[args.indexOf('--limit') + 1])
  : null;

const dryRun = args.includes('--dry-run');

console.log('TrailCamp Geocoding Helper\n');
console.log('='.repeat(60) + '\n');

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No database updates\n');
}

if (limit) {
  console.log(`📍 Limit: ${limit} locations\n`);
}

console.log('Using OpenStreetMap Nominatim API');
console.log('Rate limit: 1 request per second');
console.log('Estimated time: ~' + Math.round((limit || 6000) / 60) + ' minutes\n');
console.log('='.repeat(60) + '\n');

(async () => {
  try {
    const stats = await geocodeLocations(limit, dryRun);
    
    console.log('\n' + '='.repeat(60));
    console.log(dryRun ? 'DRY RUN SUMMARY' : 'GEOCODING SUMMARY');
    console.log('='.repeat(60));
    console.log(`\nTotal processed:  ${stats.total}`);
    console.log(`Successful:       ${stats.success}`);
    console.log(`Failed:           ${stats.failed}`);
    
    if (Object.keys(stats.byState).length > 0) {
      console.log('\nLocations by state:');
      const sorted = Object.entries(stats.byState).sort((a, b) => b[1] - a[1]);
      for (const [state, count] of sorted) {
        console.log(`  ${state}: ${count}`);
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    if (!dryRun && stats.success > 0) {
      console.log('✓ Database updated successfully!\n');
      console.log('Run with --report to see full state coverage\n');
    }
    
    if (dryRun && stats.success > 0) {
      console.log('✓ Dry run successful! Remove --dry-run to update database\n');
    }
  } catch (err) {
    console.error(`\n✗ Geocoding failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
