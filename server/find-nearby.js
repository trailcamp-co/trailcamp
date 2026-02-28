#!/usr/bin/env node
// Find Nearby Locations for TrailCamp
// Finds all locations within X miles of given coordinates

import Database from 'better-sqlite3';

const db = new Database('./trailcamp.db', { readonly: true });

// Haversine distance formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find nearby locations
function findNearby(lat, lon, radiusMiles, options = {}) {
  const { category, minScenery, maxResults } = options;
  
  // Build query
  let query = 'SELECT * FROM locations';
  const params = [];
  const conditions = [];
  
  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  
  if (minScenery) {
    conditions.push('scenery_rating >= ?');
    params.push(minScenery);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  const locations = db.prepare(query).all(...params);
  
  // Calculate distances
  const results = locations.map(loc => ({
    ...loc,
    distance: calculateDistance(lat, lon, loc.latitude, loc.longitude)
  }));
  
  // Filter by radius and sort by distance
  const nearby = results
    .filter(loc => loc.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
  
  // Limit results if specified
  return maxResults ? nearby.slice(0, maxResults) : nearby;
}

// Format output
function formatResults(results, center, radius) {
  console.log(`\nFound ${results.length} locations within ${radius} miles of (${center.lat}, ${center.lon})\n`);
  
  if (results.length === 0) {
    console.log('No locations found in this area.\n');
    return;
  }
  
  console.log('Distance | Category  | Scenery | Name');
  console.log('─'.repeat(80));
  
  for (const loc of results) {
    const dist = loc.distance.toFixed(1).padStart(6);
    const cat = (loc.category || 'N/A').padEnd(9);
    const scenery = (loc.scenery_rating || 'N/A').toString().padEnd(7);
    console.log(`${dist}mi | ${cat} | ${scenery} | ${loc.name}`);
  }
  
  console.log('');
}

// Format JSON output
function formatJSON(results) {
  console.log(JSON.stringify(results, null, 2));
}

// CLI
const args = process.argv.slice(2);

if (args.length < 3 || args.includes('--help')) {
  console.log(`
TrailCamp Nearby Location Finder

Usage:
  node find-nearby.js <latitude> <longitude> <radius-miles> [options]

Options:
  --category TYPE     Filter by category (riding, campsite, dump, water, scenic)
  --min-scenery N     Only show locations with scenery >= N
  --max-results N     Limit to N results
  --json              Output as JSON instead of table
  --help              Show this help

Examples:
  # Find all locations within 50 miles of Moab
  node find-nearby.js 38.5733 -109.5498 50

  # Find riding spots within 25 miles
  node find-nearby.js 40.7128 -105.9378 25 --category riding

  # Find top 10 scenic campsites within 30 miles
  node find-nearby.js 37.7749 -119.5194 30 --category campsite --min-scenery 8 --max-results 10

  # Output as JSON for programmatic use
  node find-nearby.js 38.5733 -109.5498 50 --json
  `);
  process.exit(0);
}

const lat = parseFloat(args[0]);
const lon = parseFloat(args[1]);
const radius = parseFloat(args[2]);

// Validate inputs
if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
  console.error('\n✗ Invalid coordinates or radius\n');
  process.exit(1);
}

if (lat < -90 || lat > 90) {
  console.error('\n✗ Latitude must be between -90 and 90\n');
  process.exit(1);
}

if (lon < -180 || lon > 180) {
  console.error('\n✗ Longitude must be between -180 and 180\n');
  process.exit(1);
}

if (radius <= 0) {
  console.error('\n✗ Radius must be positive\n');
  process.exit(1);
}

// Parse options
const options = {};

if (args.includes('--category')) {
  options.category = args[args.indexOf('--category') + 1];
}

if (args.includes('--min-scenery')) {
  options.minScenery = parseInt(args[args.indexOf('--min-scenery') + 1]);
}

if (args.includes('--max-results')) {
  options.maxResults = parseInt(args[args.indexOf('--max-results') + 1]);
}

const jsonOutput = args.includes('--json');

// Find nearby locations
try {
  const results = findNearby(lat, lon, radius, options);
  
  if (jsonOutput) {
    formatJSON(results);
  } else {
    formatResults(results, { lat, lon }, radius);
    
    // Show summary by category
    if (results.length > 0) {
      const byCat = {};
      for (const loc of results) {
        byCat[loc.category] = (byCat[loc.category] || 0) + 1;
      }
      
      console.log('Summary by category:');
      for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${cat}: ${count}`);
      }
      console.log('');
    }
  }
  
  process.exit(0);
} catch (err) {
  console.error(`\n✗ Error: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
