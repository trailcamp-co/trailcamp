#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocode coordinates to get state/county information

import Database from 'better-sqlite3';
import https from 'https';
import fs from 'fs';

const db = new Database('./trailcamp.db');

// Nominatim API (free, respects rate limits)
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'TrailCamp/1.0';
const RATE_LIMIT_MS = 1100; // 1 request per second + buffer

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reverse geocode a single coordinate
async function reverseGeocode(lat, lon) {
  const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': USER_AGENT
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
          
          if (result.error) {
            reject(new Error(result.error));
            return;
          }
          
          const address = result.address || {};
          
          resolve({
            state: address.state || null,
            county: address.county || null,
            country: address.country || null,
            display_name: result.display_name || null
          });
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Geocode a single location by ID
async function geocodeLocation(locationId) {
  const location = db.prepare('SELECT id, name, latitude, longitude FROM locations WHERE id = ?').get(locationId);
  
  if (!location) {
    console.error(`Location ID ${locationId} not found`);
    return null;
  }
  
  console.log(`Geocoding: ${location.name} (${location.latitude}, ${location.longitude})`);
  
  try {
    const result = await reverseGeocode(location.latitude, location.longitude);
    
    console.log(`  → State: ${result.state || 'Unknown'}, County: ${result.county || 'Unknown'}`);
    
    return {
      ...location,
      ...result
    };
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    return null;
  }
}

// Geocode all locations (batch with rate limiting)
async function geocodeAll(limit = null, dryRun = false) {
  let query = 'SELECT id, name, latitude, longitude FROM locations ORDER BY id';
  if (limit) {
    query += ` LIMIT ${limit}`;
  }
  
  const locations = db.prepare(query).all();
  
  console.log(`${dryRun ? 'DRY RUN - ' : ''}Geocoding ${locations.length} locations...\n`);
  console.log(`Rate limit: 1 request per ${RATE_LIMIT_MS}ms\n`);
  
  const results = [];
  let successful = 0;
  let failed = 0;
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const progress = `[${i + 1}/${locations.length}]`;
    
    console.log(`${progress} ${loc.name}`);
    
    try {
      const geo = await reverseGeocode(loc.latitude, loc.longitude);
      
      console.log(`  → ${geo.state || 'Unknown'}, ${geo.county || 'Unknown'}`);
      
      results.push({
        id: loc.id,
        name: loc.name,
        state: geo.state,
        county: geo.county,
        country: geo.country
      });
      
      successful++;
    } catch (err) {
      console.error(`  ✗ ${err.message}`);
      failed++;
    }
    
    // Rate limiting
    if (i < locations.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }
  
  // Generate report
  const stateMap = {};
  for (const result of results) {
    const state = result.state || 'Unknown';
    if (!stateMap[state]) {
      stateMap[state] = {
        count: 0,
        counties: new Set(),
        locations: []
      };
    }
    stateMap[state].count++;
    if (result.county) {
      stateMap[state].counties.add(result.county);
    }
    stateMap[state].locations.push({
      id: result.id,
      name: result.name,
      county: result.county
    });
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('GEOCODING SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal locations: ${locations.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nLocations by state:\n`);
  
  const sortedStates = Object.entries(stateMap).sort((a, b) => b[1].count - a[1].count);
  
  for (const [state, data] of sortedStates) {
    console.log(`  ${state}: ${data.count} locations (${data.counties.size} counties)`);
  }
  
  // Save detailed report
  if (!dryRun) {
    const reportPath = './geocoding-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalLocations: locations.length,
      successful,
      failed,
      byState: Object.fromEntries(
        Object.entries(stateMap).map(([state, data]) => [
          state,
          {
            count: data.count,
            counties: Array.from(data.counties).sort(),
            locations: data.locations.slice(0, 10) // First 10 for each state
          }
        ])
      )
    }, null, 2));
    
    console.log(`\n✓ Detailed report saved to: ${reportPath}`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  return results;
}

// Export state data to CSV
function exportStateCSV(results) {
  const csvPath = './locations-by-state.csv';
  
  let csv = 'id,name,state,county\n';
  
  for (const result of results) {
    csv += `${result.id},"${result.name}","${result.state || ''}","${result.county || ''}"\n`;
  }
  
  fs.writeFileSync(csvPath, csv);
  console.log(`✓ Exported to: ${csvPath}\n`);
}

// Main CLI
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Usage:
  node geocode-locations.js <location-id>              # Geocode single location
  node geocode-locations.js --all [--limit N]          # Geocode all locations
  node geocode-locations.js --all --dry-run            # Test without saving
  node geocode-locations.js --stats                    # Show current state coverage

Options:
  --all           Geocode all locations (respects rate limits)
  --limit N       Limit to N locations (for testing)
  --dry-run       Test mode, don't save results
  --stats         Show locations by state (from database)
  --export-csv    Export results to CSV
  --help          Show this help

Examples:
  node geocode-locations.js 123                        # Geocode location ID 123
  node geocode-locations.js --all --limit 10           # Test with first 10 locations
  node geocode-locations.js --all --export-csv         # Geocode all and export CSV

Note:
  - Uses OpenStreetMap Nominatim API (free, rate-limited)
  - Respects 1 request/second limit
  - Large batches will take time (6000 locations = ~2 hours)
  - Consider using --limit for testing first
  `);
  process.exit(0);
}

if (args.includes('--stats')) {
  console.log('Current geographic distribution:\n');
  console.log('(Based on regional analysis - database has no state field)\n');
  console.log('Run --all to get precise state/county data via geocoding.\n');
  process.exit(0);
}

const locationId = parseInt(args[0]);
const all = args.includes('--all');
const dryRun = args.includes('--dry-run');
const exportCSV = args.includes('--export-csv');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;

(async () => {
  try {
    if (all) {
      console.log('⚠️  WARNING: This will make many API requests.');
      console.log('            Geocoding 6000+ locations will take ~2 hours.');
      console.log('            Consider using --limit for testing first.\n');
      
      if (!dryRun && !limit) {
        console.log('Use --limit 10 to test with 10 locations first.\n');
        process.exit(0);
      }
      
      const results = await geocodeAll(limit, dryRun);
      
      if (exportCSV && !dryRun) {
        exportStateCSV(results);
      }
    } else if (!isNaN(locationId)) {
      await geocodeLocation(locationId);
    } else {
      console.error('Invalid arguments. Use --help for usage information.');
      process.exit(1);
    }
  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
