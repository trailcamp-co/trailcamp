#!/usr/bin/env node
// Reverse Geocoding for TrailCamp
// Adds state and county information to locations using Nominatim

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Nominatim API (free, rate-limited to 1 req/sec)
const NOMINATIM_URL = 'nominatim.openstreetmap.org';
const USER_AGENT = 'TrailCamp/1.0';

// Rate limiting
const DELAY_MS = 1100; // Slightly over 1 second to be safe

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reverse geocode coordinates
function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const path = `/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    
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
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Extract state from geocoding result
function extractState(result) {
  if (!result.address) return null;
  
  // Try various fields for state
  return result.address.state ||
         result.address.province ||
         result.address.region ||
         null;
}

// Extract county from geocoding result
function extractCounty(result) {
  if (!result.address) return null;
  
  return result.address.county ||
         result.address.district ||
         null;
}

// Main geocoding process
async function geocodeLocations(limit = null, dryRun = false) {
  console.log(`${dryRun ? 'DRY RUN - ' : ''}Starting geocoding process...\n`);
  
  // Check if state/county columns exist
  const tableInfo = db.prepare("PRAGMA table_info(locations)").all();
  const hasState = tableInfo.some(col => col.name === 'state');
  const hasCounty = tableInfo.some(col => col.name === 'county');
  
  if (!hasState || !hasCounty) {
    console.log('Adding state and county columns to database...');
    if (!dryRun) {
      if (!hasState) {
        db.prepare('ALTER TABLE locations ADD COLUMN state VARCHAR(2)').run();
      }
      if (!hasCounty) {
        db.prepare('ALTER TABLE locations ADD COLUMN county VARCHAR(100)').run();
      }
    }
    console.log('✓ Columns added\n');
  }
  
  // Get locations without state/county
  const query = `
    SELECT id, name, latitude, longitude 
    FROM locations 
    WHERE state IS NULL OR county IS NULL
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  
  const locations = db.prepare(query).all();
  
  console.log(`Found ${locations.length} locations to geocode\n`);
  
  if (locations.length === 0) {
    console.log('✓ All locations already have state/county data');
    return { total: 0, success: 0, failed: 0, errors: [] };
  }
  
  const stats = {
    total: locations.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  const updateStmt = db.prepare(`
    UPDATE locations 
    SET state = ?, county = ? 
    WHERE id = ?
  `);
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const progress = `[${i + 1}/${locations.length}]`;
    
    try {
      console.log(`${progress} Geocoding: ${loc.name}`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      const state = extractState(result);
      const county = extractCounty(result);
      
      if (state) {
        // Convert full state names to 2-letter codes (US states only)
        const stateCode = getStateCode(state);
        
        if (!dryRun) {
          updateStmt.run(stateCode, county, loc.id);
        }
        
        stats.success++;
        console.log(`  ✓ ${stateCode || state}${county ? ', ' + county : ''}`);
      } else {
        stats.failed++;
        stats.errors.push({
          id: loc.id,
          name: loc.name,
          error: 'No state found in geocoding result'
        });
        console.log(`  ✗ No state found`);
      }
      
      // Rate limiting
      if (i < locations.length - 1) {
        await sleep(DELAY_MS);
      }
      
    } catch (err) {
      stats.failed++;
      stats.errors.push({
        id: loc.id,
        name: loc.name,
        error: err.message
      });
      console.log(`  ✗ Error: ${err.message}`);
      
      // Continue after error with rate limiting
      if (i < locations.length - 1) {
        await sleep(DELAY_MS);
      }
    }
  }
  
  return stats;
}

// US State name to code mapping
function getStateCode(stateName) {
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

// Print report
function printReport(stats, dryRun) {
  console.log('\n' + '='.repeat(60));
  console.log(dryRun ? 'DRY RUN REPORT' : 'GEOCODING REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal processed:  ${stats.total}`);
  console.log(`Successful:       ${stats.success}`);
  console.log(`Failed:           ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('ERRORS:\n');
    
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`[${err.id}] ${err.name}`);
      console.log(`  ✗ ${err.error}\n`);
    }
    
    if (stats.errors.length > 10) {
      console.log(`... and ${stats.errors.length - 10} more errors\n`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
  
  if (!dryRun && stats.success > 0) {
    console.log(`✓ Successfully geocoded ${stats.success} locations!\n`);
    
    // Show state distribution
    const stateCounts = db.prepare(`
      SELECT state, COUNT(*) as count 
      FROM locations 
      WHERE state IS NOT NULL 
      GROUP BY state 
      ORDER BY count DESC 
      LIMIT 15
    `).all();
    
    if (stateCounts.length > 0) {
      console.log('Top states by location count:');
      for (const row of stateCounts) {
        console.log(`  ${row.state}: ${row.count}`);
      }
      console.log('');
    }
  }
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Tool

Usage:
  node geocode-locations.js [--limit N] [--dry-run]

Options:
  --limit N    Process only N locations (for testing)
  --dry-run    Test without updating database
  --help       Show this help

Examples:
  node geocode-locations.js --limit 10 --dry-run
  node geocode-locations.js --limit 50
  node geocode-locations.js

Note:
  Uses OpenStreetMap Nominatim API (free, 1 req/sec limit)
  Processes ~3600 locations per hour max
  For 6000+ locations, expect ~2 hours runtime
  `);
  process.exit(0);
}

const limitMatch = args.find(a => a.startsWith('--limit'));
const limit = limitMatch ? parseInt(args[args.indexOf(limitMatch) + 1]) : null;
const dryRun = args.includes('--dry-run');

(async () => {
  try {
    const stats = await geocodeLocations(limit, dryRun);
    printReport(stats, dryRun);
    
    process.exit(stats.failed === stats.total ? 1 : 0);
  } catch (err) {
    console.error(`\n✗ Geocoding failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
