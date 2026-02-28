#!/usr/bin/env node
// Geocoding Helper Script for TrailCamp
// Reverse geocodes coordinates to get state/county names

import Database from 'better-sqlite3';
import https from 'https';
import fs from 'fs';

const db = new Database('./trailcamp.db');

// Nominatim API (OpenStreetMap) - free but rate-limited
const RATE_LIMIT_MS = 1000; // 1 request per second
const USER_AGENT = 'TrailCamp-Geocoder/1.0';

// Simple sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Reverse geocode using Nominatim
async function reverseGeocode(lat, lon) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    
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
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse geocoding response: ${err.message}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Extract state and county from geocoding result
function extractLocationInfo(result) {
  if (!result || !result.address) {
    return { state: null, county: null, city: null, country: null };
  }
  
  const addr = result.address;
  
  return {
    state: addr.state || null,
    county: addr.county || null,
    city: addr.city || addr.town || addr.village || null,
    country: addr.country || null
  };
}

// Get state abbreviation from full name
const STATE_ABBREV = {
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

// Main geocoding function
async function geocodeLocations(limit = 10, dryRun = false) {
  console.log('TrailCamp Geocoding Helper\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit} locations\n`);
  
  // Get locations without state data (sample for testing)
  const locations = db.prepare(`
    SELECT id, name, latitude, longitude
    FROM locations
    ORDER BY id
    LIMIT ?
  `).all(limit);
  
  console.log(`Found ${locations.length} locations to geocode\n`);
  
  const results = {
    total: locations.length,
    success: 0,
    failed: 0,
    skipped: 0,
    locations: []
  };
  
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    console.log(`[${i + 1}/${locations.length}] Geocoding: ${loc.name}`);
    console.log(`  Coordinates: (${loc.latitude}, ${loc.longitude})`);
    
    try {
      // Respect rate limit
      if (i > 0) {
        await sleep(RATE_LIMIT_MS);
      }
      
      const geoResult = await reverseGeocode(loc.latitude, loc.longitude);
      const info = extractLocationInfo(geoResult);
      
      // Get state abbreviation if available
      const stateAbbrev = info.state && STATE_ABBREV[info.state] 
        ? STATE_ABBREV[info.state] 
        : info.state;
      
      console.log(`  State: ${info.state || 'Unknown'} (${stateAbbrev || 'N/A'})`);
      console.log(`  County: ${info.county || 'Unknown'}`);
      console.log(`  City: ${info.city || 'Unknown'}`);
      console.log(`  Country: ${info.country || 'Unknown'}`);
      
      results.locations.push({
        id: loc.id,
        name: loc.name,
        state: info.state,
        stateAbbrev,
        county: info.county,
        city: info.city,
        country: info.country
      });
      
      results.success++;
      
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
      results.failed++;
      
      results.locations.push({
        id: loc.id,
        name: loc.name,
        error: err.message
      });
    }
    
    console.log('');
  }
  
  return results;
}

// Generate report
function generateReport(results) {
  let report = `# Geocoding Results Report

*Generated: ${new Date().toISOString()}*

## Summary

- **Total locations processed:** ${results.total}
- **Successfully geocoded:** ${results.success}
- **Failed:** ${results.failed}
- **Skipped:** ${results.skipped}

---

## Results by State

`;

  // Group by state
  const byState = {};
  for (const loc of results.locations) {
    if (!loc.error && loc.state) {
      if (!byState[loc.state]) {
        byState[loc.state] = [];
      }
      byState[loc.state].push(loc);
    }
  }
  
  const sortedStates = Object.entries(byState).sort((a, b) => b[1].length - a[1].length);
  
  for (const [state, locs] of sortedStates) {
    const stateAbbrev = STATE_ABBREV[state] || state;
    report += `\n### ${state} (${stateAbbrev}) - ${locs.length} locations\n\n`;
    
    for (const loc of locs.slice(0, 10)) {
      report += `- **[${loc.id}]** ${loc.name} - ${loc.county || 'Unknown County'}`;
      if (loc.city) report += `, ${loc.city}`;
      report += `\n`;
    }
    
    if (locs.length > 10) {
      report += `\n*... and ${locs.length - 10} more*\n`;
    }
  }
  
  report += `\n---\n\n## Failed Geocoding\n\n`;
  
  const failed = results.locations.filter(l => l.error);
  
  if (failed.length > 0) {
    report += `| ID | Name | Error |\n`;
    report += `|----|------|-------|\n`;
    
    for (const loc of failed) {
      report += `| ${loc.id} | ${loc.name} | ${loc.error} |\n`;
    }
  } else {
    report += `✅ No failed geocoding attempts.\n`;
  }
  
  report += `\n---\n\n## Next Steps\n\n`;
  report += `1. Review geocoded data for accuracy\n`;
  report += `2. Add state/county columns to database if needed:\n\n`;
  report += `\`\`\`sql\n`;
  report += `ALTER TABLE locations ADD COLUMN state VARCHAR(2);\n`;
  report += `ALTER TABLE locations ADD COLUMN county VARCHAR(100);\n`;
  report += `\`\`\`\n\n`;
  report += `3. Update locations with geocoded data:\n\n`;
  report += `\`\`\`sql\n`;
  report += `UPDATE locations SET state = 'CA', county = 'Example County' WHERE id = 123;\n`;
  report += `\`\`\`\n\n`;
  report += `4. Consider caching results to avoid re-geocoding\n\n`;
  report += `---\n\n*Generated by geocode-locations.js*\n`;
  
  return report;
}

// Command-line interface
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Geocoding Helper

Reverse geocodes location coordinates to get state/county names.

Usage:
  node geocode-locations.js [options]

Options:
  --limit N      Process N locations (default: 10)
  --dry-run      Show what would be geocoded without making API calls
  --help         Show this help

Examples:
  node geocode-locations.js --limit 5
  node geocode-locations.js --limit 100 --dry-run

Notes:
  - Uses OpenStreetMap Nominatim API (free, rate-limited to 1 req/sec)
  - Respects rate limits automatically
  - Results saved to geocoding-results.md

Rate Limits:
  - 1 request per second maximum
  - Processing 100 locations takes ~2 minutes
  - For bulk geocoding, run in batches

API Attribution:
  Data © OpenStreetMap contributors
  `);
  process.exit(0);
}

const limitArg = args.find(a => a.startsWith('--limit'));
const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf(limitArg) + 1]) : 10;
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('DRY RUN mode - no API calls will be made\n');
  const locations = db.prepare('SELECT id, name, latitude, longitude FROM locations LIMIT ?').all(limit);
  console.log(`Would geocode ${locations.length} locations:\n`);
  for (const loc of locations.slice(0, 5)) {
    console.log(`- [${loc.id}] ${loc.name} (${loc.latitude}, ${loc.longitude})`);
  }
  if (locations.length > 5) {
    console.log(`... and ${locations.length - 5} more\n`);
  }
  console.log('Run without --dry-run to geocode.');
  db.close();
  process.exit(0);
}

// Run geocoding
try {
  const results = await geocodeLocations(limit, dryRun);
  
  console.log('='.repeat(60));
  console.log('GEOCODING COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nTotal: ${results.total}`);
  console.log(`Success: ${results.success}`);
  console.log(`Failed: ${results.failed}\n`);
  
  // Generate and save report
  const report = generateReport(results);
  const reportPath = './geocoding-results.md';
  fs.writeFileSync(reportPath, report);
  
  console.log(`📄 Report saved to: ${reportPath}\n`);
  
  // Save JSON results for programmatic use
  const jsonPath = './geocoding-results.json';
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`📄 JSON data saved to: ${jsonPath}\n`);
  
  db.close();
  process.exit(results.failed > 0 ? 1 : 0);
  
} catch (err) {
  console.error(`\n✗ Geocoding failed: ${err.message}\n`);
  db.close();
  process.exit(1);
}
