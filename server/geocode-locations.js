#!/usr/bin/env node
// Geocoding Helper Script for TrailCamp
// Reverse geocodes coordinates to get state/county names

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Nominatim API configuration
const NOMINATIM_URL = 'nominatim.openstreetmap.org';
const USER_AGENT = 'TrailCamp/1.0';
const RATE_LIMIT_MS = 1000; // 1 request per second (Nominatim policy)

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reverse geocode a single coordinate
async function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const path = `/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
    
    const options = {
      hostname: NOMINATIM_URL,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Extract state and county from geocoding result
function extractLocation(result) {
  const address = result.address || {};
  
  // Extract state (try multiple fields)
  let state = address.state || address['ISO3166-2-lvl4'] || null;
  
  // Convert full state names to abbreviations (common ones)
  const stateAbbr = {
    'California': 'CA', 'Oregon': 'OR', 'Washington': 'WA',
    'Arizona': 'AZ', 'Nevada': 'NV', 'Utah': 'UT',
    'Colorado': 'CO', 'Wyoming': 'WY', 'Montana': 'MT',
    'Idaho': 'ID', 'New Mexico': 'NM', 'Texas': 'TX',
    'Alaska': 'AK', 'Hawaii': 'HI',
    'North Dakota': 'ND', 'South Dakota': 'SD', 'Nebraska': 'NE',
    'Kansas': 'KS', 'Oklahoma': 'OK',
    'Minnesota': 'MN', 'Wisconsin': 'WI', 'Michigan': 'MI',
    'Illinois': 'IL', 'Indiana': 'IN', 'Ohio': 'OH',
    'Georgia': 'GA', 'Florida': 'FL', 'South Carolina': 'SC',
    'North Carolina': 'NC', 'Tennessee': 'TN', 'Kentucky': 'KY',
    'Alabama': 'AL', 'Mississippi': 'MS', 'Louisiana': 'LA',
    'Arkansas': 'AR', 'Missouri': 'MO', 'Iowa': 'IA',
    'New York': 'NY', 'Pennsylvania': 'PA', 'Vermont': 'VT',
    'New Hampshire': 'NH', 'Maine': 'ME', 'Massachusetts': 'MA',
    'Connecticut': 'CT', 'Rhode Island': 'RI',
    'New Jersey': 'NJ', 'Delaware': 'DE', 'Maryland': 'MD',
    'Virginia': 'VA', 'West Virginia': 'WV'
  };
  
  if (state && stateAbbr[state]) {
    state = stateAbbr[state];
  }
  
  // If state is ISO format like "US-CA", extract the state code
  if (state && state.includes('-')) {
    state = state.split('-')[1];
  }
  
  // Extract county
  const county = address.county || address.municipality || null;
  
  // Extract country
  const country = address.country_code ? address.country_code.toUpperCase() : 'US';
  
  return { state, county, country };
}

// Update location in database
function updateLocation(id, state, county, country) {
  const stmt = db.prepare(`
    UPDATE locations 
    SET state = ?, county = ?, country = ?
    WHERE id = ?
  `);
  
  stmt.run(state, county, country, id);
}

// Main geocoding function
async function geocodeLocations(limit = null, offset = 0) {
  // Get locations without state data
  let query = `
    SELECT id, name, latitude, longitude 
    FROM locations 
    WHERE state IS NULL 
    ORDER BY id
  `;
  
  if (limit) {
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }
  
  const locations = db.prepare(query).all();
  
  console.log(`\nGeocoding ${locations.length} locations...`);
  console.log(`Rate limit: 1 request per second\n`);
  
  const stats = {
    total: locations.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const progress = `[${i + 1}/${locations.length}]`;
    
    try {
      process.stdout.write(`${progress} Geocoding: ${loc.name}...`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      const { state, county, country } = extractLocation(result);
      
      if (state) {
        updateLocation(loc.id, state, county, country);
        stats.success++;
        console.log(` ✓ ${state}${county ? ', ' + county : ''}`);
      } else {
        stats.failed++;
        stats.errors.push({ id: loc.id, name: loc.name, error: 'No state found' });
        console.log(` ✗ No state found`);
      }
      
    } catch (err) {
      stats.failed++;
      stats.errors.push({ id: loc.id, name: loc.name, error: err.message });
      console.log(` ✗ ${err.message}`);
    }
    
    // Rate limit: wait 1 second between requests
    if (i < locations.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }
  
  return stats;
}

// Print summary report
function printReport(stats) {
  console.log('\n' + '='.repeat(60));
  console.log('GEOCODING REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal processed:  ${stats.total}`);
  console.log(`Successful:       ${stats.success}`);
  console.log(`Failed:           ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('ERRORS:\n');
    
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`ID ${err.id}: ${err.name}`);
      console.log(`  ✗ ${err.error}\n`);
    }
    
    if (stats.errors.length > 10) {
      console.log(`... and ${stats.errors.length - 10} more errors\n`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Show current state coverage
function showCoverage() {
  const total = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
  const withState = db.prepare('SELECT COUNT(*) as count FROM locations WHERE state IS NOT NULL').get().count;
  const pct = Math.round((withState / total) * 100);
  
  console.log('Current state coverage:');
  console.log(`  ${withState} / ${total} locations (${pct}%)\n`);
  
  if (withState > 0) {
    console.log('Locations by state:');
    const byState = db.prepare(`
      SELECT state, COUNT(*) as count 
      FROM locations 
      WHERE state IS NOT NULL 
      GROUP BY state 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    for (const row of byState) {
      console.log(`  ${row.state}: ${row.count}`);
    }
    console.log('');
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
TrailCamp Geocoding Helper

Usage:
  node geocode-locations.js [options]

Options:
  --limit N      Geocode only N locations (default: all missing)
  --offset N     Skip first N locations (default: 0)
  --coverage     Show current state coverage and exit
  --help, -h     Show this help

Examples:
  node geocode-locations.js --limit 10          # Geocode first 10
  node geocode-locations.js --limit 50 --offset 100  # Geocode 50, starting at #100
  node geocode-locations.js --coverage         # Check current coverage
  node geocode-locations.js                    # Geocode all missing

Notes:
  - Uses Nominatim (OpenStreetMap) API (free, 1 req/sec limit)
  - Large batches will take time: 1000 locations ≈ 17 minutes
  - Can be interrupted and resumed (only geocodes locations without state)
  - Respects Nominatim usage policy automatically
  `);
  process.exit(0);
}

if (args.includes('--coverage')) {
  showCoverage();
  process.exit(0);
}

const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1]) : null;

const offsetIdx = args.indexOf('--offset');
const offset = offsetIdx >= 0 ? parseInt(args[offsetIdx + 1]) : 0;

// Show current coverage first
showCoverage();

// Confirm before geocoding large batches
const missingCount = db.prepare('SELECT COUNT(*) as count FROM locations WHERE state IS NULL').get().count;

if (!limit && missingCount > 100) {
  console.log(`⚠️  About to geocode ${missingCount} locations (${Math.ceil(missingCount / 60)} minutes estimated)`);
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  await sleep(5000);
}

// Run geocoding
try {
  const stats = await geocodeLocations(limit, offset);
  printReport(stats);
  
  console.log('Updated coverage:');
  showCoverage();
  
  if (stats.success > 0) {
    console.log('✓ Geocoding complete!\n');
  }
  
  process.exit(stats.failed > 0 ? 1 : 0);
} catch (err) {
  console.error(`\n✗ Geocoding failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
