#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocodes coordinates to add state/county information

import Database from 'better-sqlite3';
import https from 'https';

const db = new Database('./trailcamp.db');

// Nominatim reverse geocoding (free, rate-limited to 1 req/sec)
async function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TrailCamp/1.0 (geocoding helper script)'
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
          
          if (result.address) {
            resolve({
              state: result.address.state || null,
              county: result.address.county || null,
              country: result.address.country || null
            });
          } else {
            resolve({ state: null, county: null, country: null });
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// Sleep function for rate limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main geocoding function
async function geocodeLocations(limit = 100, dryRun = false) {
  console.log(`Geocoding up to ${limit} locations...\n`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no database updates)' : 'LIVE (will update database)'}\n`);
  
  // Get locations without state info (or all if testing)
  const locations = db.prepare(`
    SELECT id, name, latitude, longitude 
    FROM locations 
    ORDER BY id ASC
    LIMIT ?
  `).all(limit);
  
  console.log(`Found ${locations.length} locations to geocode\n`);
  
  const stats = {
    total: locations.length,
    success: 0,
    failed: 0,
    noData: 0,
    results: []
  };
  
  const updateStmt = dryRun ? null : db.prepare(`
    UPDATE locations 
    SET notes = CASE 
      WHEN notes IS NULL OR notes = '' THEN ? 
      ELSE notes || '; ' || ? 
    END
    WHERE id = ?
  `);
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    try {
      console.log(`[${i + 1}/${locations.length}] Geocoding: ${loc.name}...`);
      
      const result = await reverseGeocode(loc.latitude, loc.longitude);
      
      if (result.state || result.county) {
        stats.success++;
        
        const parts = [];
        if (result.county) parts.push(result.county);
        if (result.state) parts.push(result.state);
        if (result.country && result.country !== 'United States') parts.push(result.country);
        
        const locationString = parts.join(', ');
        
        console.log(`  ✓ ${locationString}`);
        
        stats.results.push({
          id: loc.id,
          name: loc.name,
          state: result.state,
          county: result.county,
          locationString
        });
        
        if (!dryRun && locationString) {
          const noteText = `Location: ${locationString}`;
          updateStmt.run(noteText, noteText, loc.id);
        }
      } else {
        stats.noData++;
        console.log(`  ⚠ No address data available`);
      }
      
      // Rate limit: 1 request per second
      if (i < locations.length - 1) {
        await sleep(1100);
      }
      
    } catch (err) {
      stats.failed++;
      console.log(`  ✗ Error: ${err.message}`);
    }
  }
  
  return stats;
}

// Print summary
function printSummary(stats, dryRun) {
  console.log('\n' + '='.repeat(60));
  console.log(dryRun ? 'GEOCODING DRY RUN SUMMARY' : 'GEOCODING SUMMARY');
  console.log('='.repeat(60));
  console.log(`\nTotal locations: ${stats.total}`);
  console.log(`Successful:      ${stats.success}`);
  console.log(`No data found:   ${stats.noData}`);
  console.log(`Failed:          ${stats.failed}`);
  
  if (stats.results.length > 0) {
    console.log(`\nSample results:\n`);
    for (const result of stats.results.slice(0, 10)) {
      console.log(`  ${result.name}`);
      console.log(`    → ${result.locationString}\n`);
    }
    
    if (stats.results.length > 10) {
      console.log(`  ... and ${stats.results.length - 10} more`);
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  if (dryRun && stats.success > 0) {
    console.log('✓ Dry run complete! Run without --dry-run to update database.\n');
  } else if (!dryRun && stats.success > 0) {
    console.log(`✓ Updated ${stats.success} locations with geographic data.\n`);
  }
  
  console.log('Note: Nominatim rate limit is 1 request/second.');
  console.log('For large batches, run multiple times with different limits.\n');
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Reverse geocodes location coordinates to add state/county information.

Usage:
  node geocode-locations.js [--limit N] [--dry-run]

Options:
  --limit N    Geocode up to N locations (default: 100)
  --dry-run    Test without updating database
  --help       Show this help

Examples:
  node geocode-locations.js --limit 10 --dry-run
  node geocode-locations.js --limit 50

Notes:
  - Uses OpenStreetMap Nominatim (free, rate-limited to 1 req/sec)
  - Geographic data is appended to location notes field
  - Respectful rate limiting: ~100 locations = ~2 minutes
  - For full database: run multiple batches

Warning:
  This script modifies the database. Always backup first:
    ./backup-database.sh
  `);
  process.exit(0);
}

const limitIndex = args.indexOf('--limit');
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : 100;
const dryRun = args.includes('--dry-run');

if (isNaN(limit) || limit < 1) {
  console.error('✗ Invalid limit value\n');
  process.exit(1);
}

(async () => {
  try {
    const stats = await geocodeLocations(limit, dryRun);
    printSummary(stats, dryRun);
    
    process.exit(stats.failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(`\n✗ Geocoding failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
