#!/usr/bin/env node
// Geocoding Helper Script for TrailCamp
// Reverse geocodes coordinates to get state/county names

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Nominatim API (OpenStreetMap) - free, rate limited to 1 req/sec
function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TrailCamp/1.0 (motorcycle trail database)'
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
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Extract state and county from Nominatim response
function extractLocationInfo(result) {
  if (!result || !result.address) {
    return { state: null, county: null, country: null };
  }
  
  const addr = result.address;
  
  // State (varies by country)
  const state = addr.state || addr.province || addr.region || null;
  
  // County
  const county = addr.county || null;
  
  // Country
  const country = addr.country || null;
  
  return { state, county, country };
}

// Main geocoding function
async function geocodeLocations(limit = 50, dryRun = false) {
  console.log(`Geocoding locations (limit: ${limit}, dry run: ${dryRun})\n`);
  
  // Get locations without state/county info
  // Since we don't have these columns yet, we'll just sample some locations
  const locations = db.prepare(`
    SELECT id, name, latitude, longitude 
    FROM locations 
    ORDER BY id 
    LIMIT ?
  `).all(limit);
  
  console.log(`Found ${locations.length} locations to process\n`);
  
  const results = [];
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  
  for (const loc of locations) {
    processed++;
    
    try {
      console.log(`[${processed}/${locations.length}] ${loc.name}...`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      const info = extractLocationInfo(result);
      
      if (info.state) {
        results.push({
          id: loc.id,
          name: loc.name,
          state: info.state,
          county: info.county,
          country: info.country
        });
        
        console.log(`  ✓ ${info.state}${info.county ? ', ' + info.county : ''} ${info.country ? '(' + info.country + ')' : ''}`);
        succeeded++;
      } else {
        console.log(`  ⚠ No state info found`);
        failed++;
      }
      
      // Rate limiting: 1 request per second (Nominatim requirement)
      await new Promise(resolve => setTimeout(resolve, 1100));
      
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      failed++;
      
      // Wait longer on error
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('GEOCODING SUMMARY');
  console.log('='.repeat(60));
  console.log(`Processed: ${processed}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');
  
  if (!dryRun && results.length > 0) {
    console.log('NOTE: Database does not have state/county columns yet.');
    console.log('To add these columns, run the following SQL:\n');
    console.log('ALTER TABLE locations ADD COLUMN state VARCHAR(100);');
    console.log('ALTER TABLE locations ADD COLUMN county VARCHAR(100);');
    console.log('ALTER TABLE locations ADD COLUMN country VARCHAR(100);\n');
  }
  
  // Generate report
  if (results.length > 0) {
    console.log('State distribution:');
    const stateCounts = {};
    for (const r of results) {
      stateCounts[r.state] = (stateCounts[r.state] || 0) + 1;
    }
    
    const sorted = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]);
    for (const [state, count] of sorted.slice(0, 10)) {
      console.log(`  ${state}: ${count}`);
    }
    
    if (sorted.length > 10) {
      console.log(`  ... and ${sorted.length - 10} more states\n`);
    } else {
      console.log('');
    }
  }
  
  return results;
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Usage:
  node geocode-locations.js [--limit=N] [--dry-run]

Options:
  --limit=N    Process only N locations (default: 50)
  --dry-run    Test without updating database
  --help       Show this help

Example:
  node geocode-locations.js --limit=10 --dry-run
  node geocode-locations.js --limit=100

Notes:
  - Uses OpenStreetMap Nominatim API (free, 1 req/sec limit)
  - Processes slowly to respect rate limits (~1 location/sec)
  - Database schema update required to store state/county data

Rate Limits:
  - 50 locations: ~1 minute
  - 100 locations: ~2 minutes
  - 500 locations: ~10 minutes
  - 1000 locations: ~20 minutes

For bulk geocoding, run in smaller batches.
  `);
  process.exit(0);
}

const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;
const dryRun = args.includes('--dry-run');

if (limit > 1000) {
  console.error('⚠️  Warning: Large batches may take very long (1 req/sec limit)');
  console.error('Consider processing in chunks of 100-500 locations.\n');
}

console.log('TrailCamp Geocoding Helper\n');
console.log('⚠️  This uses OpenStreetMap Nominatim API (free, 1 req/sec limit)');
console.log('Processing will be SLOW to respect rate limits.\n');

if (!dryRun) {
  console.log('⚠️  This is a LIVE run - results would be saved to database');
  console.log('(But database schema needs state/county columns first)\n');
}

geocodeLocations(limit, dryRun)
  .then(() => {
    console.log('✓ Geocoding complete\n');
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error(`\n✗ Geocoding failed: ${err.message}\n`);
    db.close();
    process.exit(1);
  });
