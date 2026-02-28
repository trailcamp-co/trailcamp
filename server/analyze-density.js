// Location Density Analysis for TrailCamp
// Generates heatmap data and regional statistics

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Configuration
const GRID_SIZE = 2; // degrees (approx 140 miles at mid-latitudes)

// Region definitions (simplified)
const REGIONS = {
  'Pacific Northwest': { latMin: 42, latMax: 49, lonMin: -125, lonMax: -116 },
  'California': { latMin: 32, latMax: 42, lonMin: -125, lonMax: -114 },
  'Southwest Desert': { latMin: 31, latMax: 37, lonMin: -115, lonMax: -103 },
  'Rocky Mountains': { latMin: 37, latMax: 49, lonMin: -115, lonMax: -102 },
  'Great Plains': { latMin: 35, latMax: 49, lonMin: -105, lonMax: -95 },
  'Great Lakes': { latMin: 41, latMax: 48, lonMin: -93, lonMax: -76 },
  'Southeast': { latMin: 24, latMax: 37, lonMin: -90, lonMax: -75 },
  'Northeast': { latMin: 37, latMax: 48, lonMin: -80, lonMax: -67 },
  'Alaska': { latMin: 52, latMax: 72, lonMin: -170, lonMax: -130 },
  'Hawaii': { latMin: 18, latMax: 23, lonMin: -161, lonMax: -154 }
};

function getRegion(lat, lon) {
  for (const [name, bounds] of Object.entries(REGIONS)) {
    if (lat >= bounds.latMin && lat <= bounds.latMax &&
        lon >= bounds.lonMin && lon <= bounds.lonMax) {
      return name;
    }
  }
  return 'Other';
}

// Get all locations
const locations = db.prepare('SELECT id, name, latitude, longitude, category, sub_type, scenery_rating FROM locations').all();

console.log(`Analyzing ${locations.length} locations...\n`);

// 1. Regional Summary
const regionalStats = {};
for (const loc of locations) {
  const region = getRegion(loc.latitude, loc.longitude);
  if (!regionalStats[region]) {
    regionalStats[region] = {
      region,
      total: 0,
      riding: 0,
      boondocking: 0,
      campgrounds: 0,
      avgScenery: 0,
      scenerySum: 0,
      bounds: {
        latMin: loc.latitude,
        latMax: loc.latitude,
        lonMin: loc.longitude,
        lonMax: loc.longitude
      }
    };
  }
  
  const stats = regionalStats[region];
  stats.total++;
  
  if (loc.category === 'riding') stats.riding++;
  else if (loc.sub_type === 'boondocking') stats.boondocking++;
  else if (loc.category === 'campsite') stats.campgrounds++;
  
  stats.scenerySum += loc.scenery_rating || 0;
  stats.bounds.latMin = Math.min(stats.bounds.latMin, loc.latitude);
  stats.bounds.latMax = Math.max(stats.bounds.latMax, loc.latitude);
  stats.bounds.lonMin = Math.min(stats.bounds.lonMin, loc.longitude);
  stats.bounds.lonMax = Math.max(stats.bounds.lonMax, loc.longitude);
}

// Calculate averages
for (const stats of Object.values(regionalStats)) {
  stats.avgScenery = Math.round((stats.scenerySum / stats.total) * 10) / 10;
  delete stats.scenerySum;
}

// 2. Grid-based density (for heatmap)
const gridCells = new Map();

for (const loc of locations) {
  const gridLat = Math.floor(loc.latitude / GRID_SIZE) * GRID_SIZE;
  const gridLon = Math.floor(loc.longitude / GRID_SIZE) * GRID_SIZE;
  const key = `${gridLat},${gridLon}`;
  
  if (!gridCells.has(key)) {
    gridCells.set(key, {
      lat: gridLat + GRID_SIZE / 2,  // center point
      lon: gridLon + GRID_SIZE / 2,
      count: 0,
      riding: 0,
      boondocking: 0,
      campgrounds: 0,
      avgScenery: 0,
      scenerySum: 0,
      locations: []
    });
  }
  
  const cell = gridCells.get(key);
  cell.count++;
  cell.scenerySum += loc.scenery_rating || 0;
  
  if (loc.category === 'riding') cell.riding++;
  else if (loc.sub_type === 'boondocking') cell.boondocking++;
  else if (loc.category === 'campsite') cell.campgrounds++;
  
  // Store top locations in high-density cells
  if (cell.count <= 5) {
    cell.locations.push({ id: loc.id, name: loc.name, scenery: loc.scenery_rating });
  }
}

// Calculate grid averages
const heatmapData = Array.from(gridCells.values()).map(cell => {
  cell.avgScenery = Math.round((cell.scenerySum / cell.count) * 10) / 10;
  delete cell.scenerySum;
  
  // Sort and keep top 3 locations
  cell.locations.sort((a, b) => (b.scenery || 0) - (a.scenery || 0));
  cell.locations = cell.locations.slice(0, 3);
  
  return cell;
});

// Sort by density
heatmapData.sort((a, b) => b.count - a.count);

// 3. Category breakdown
const categoryStats = db.prepare(`
  SELECT 
    category,
    COUNT(*) as count,
    ROUND(AVG(scenery_rating), 1) as avg_scenery,
    MIN(latitude) as lat_min,
    MAX(latitude) as lat_max,
    MIN(longitude) as lon_min,
    MAX(longitude) as lon_max
  FROM locations
  GROUP BY category
  ORDER BY count DESC
`).all();

// 4. Top density hotspots
const hotspots = heatmapData.slice(0, 20).map((cell, i) => ({
  rank: i + 1,
  lat: cell.lat,
  lon: cell.lon,
  count: cell.count,
  riding: cell.riding,
  boondocking: cell.boondocking,
  campgrounds: cell.campgrounds,
  avgScenery: cell.avgScenery,
  topLocations: cell.locations
}));

// Generate output
const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalLocations: locations.length,
    gridSize: GRID_SIZE,
    gridCells: gridCells.size
  },
  regional: Object.values(regionalStats).sort((a, b) => b.total - a.total),
  category: categoryStats,
  heatmap: heatmapData,
  hotspots
};

// Save to JSON
const outputPath = './location-density-analysis.json';
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`✅ Analysis complete!`);
console.log(`📊 Output saved to: ${outputPath}`);
console.log(`\n📍 Grid cells: ${gridCells.size}`);
console.log(`🔥 Top hotspot: ${hotspots[0].count} locations near (${hotspots[0].lat.toFixed(1)}, ${hotspots[0].lon.toFixed(1)})`);

// Print summary table
console.log('\n📊 Regional Summary:');
console.log('─'.repeat(90));
console.log('Region                  Total    Riding  Boondock  Campgrounds  Avg Scenery');
console.log('─'.repeat(90));

for (const region of Object.values(regionalStats).sort((a, b) => b.total - a.total)) {
  console.log(
    region.region.padEnd(22) +
    region.total.toString().padStart(6) +
    region.riding.toString().padStart(9) +
    region.boondocking.toString().padStart(10) +
    region.campgrounds.toString().padStart(13) +
    region.avgScenery.toString().padStart(13)
  );
}

console.log('\n🔥 Top 10 Density Hotspots:');
console.log('─'.repeat(80));
console.log('Rank  Lat      Lon       Total  Riding  Boondock  Camp  Scenery');
console.log('─'.repeat(80));

for (const spot of hotspots.slice(0, 10)) {
  console.log(
    `#${spot.rank}`.padStart(4) +
    spot.lat.toFixed(1).padStart(9) +
    spot.lon.toFixed(1).padStart(10) +
    spot.count.toString().padStart(7) +
    spot.riding.toString().padStart(8) +
    spot.boondocking.toString().padStart(10) +
    spot.campgrounds.toString().padStart(6) +
    spot.avgScenery.toString().padStart(9)
  );
}

db.close();
