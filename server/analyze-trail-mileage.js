// Trail Mileage Statistics for TrailCamp
// Analyzes total available trail miles by region, difficulty, and type

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Same region definitions
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

console.log('Analyzing trail mileage statistics...\n');

// Get all riding locations with distance data
const ridingLocations = db.prepare(`
  SELECT * FROM locations 
  WHERE category = 'riding' 
    AND distance_miles IS NOT NULL 
    AND distance_miles > 0
  ORDER BY distance_miles DESC
`).all();

console.log(`Found ${ridingLocations.length} riding locations with mileage data\n`);

const totalRidingLocations = db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding'").get().count;

// Statistics containers
const byRegion = {};
const byDifficulty = {};
const byTrailType = {};
const byRegionDifficulty = {};

let totalMiles = 0;

for (const loc of ridingLocations) {
  const region = getRegion(loc.latitude, loc.longitude);
  const difficulty = loc.difficulty || 'Unknown';
  const primaryType = loc.trail_types ? loc.trail_types.split(',')[0].trim() : 'Unknown';
  const miles = loc.distance_miles;
  
  totalMiles += miles;
  
  // By region
  if (!byRegion[region]) {
    byRegion[region] = {
      count: 0,
      totalMiles: 0,
      trails: []
    };
  }
  byRegion[region].count++;
  byRegion[region].totalMiles += miles;
  if (byRegion[region].trails.length < 5) {
    byRegion[region].trails.push({ name: loc.name, miles: loc.distance_miles });
  }
  
  // By difficulty
  if (!byDifficulty[difficulty]) {
    byDifficulty[difficulty] = {
      count: 0,
      totalMiles: 0
    };
  }
  byDifficulty[difficulty].count++;
  byDifficulty[difficulty].totalMiles += miles;
  
  // By trail type
  if (!byTrailType[primaryType]) {
    byTrailType[primaryType] = {
      count: 0,
      totalMiles: 0
    };
  }
  byTrailType[primaryType].count++;
  byTrailType[primaryType].totalMiles += miles;
  
  // By region + difficulty
  const key = `${region}|${difficulty}`;
  if (!byRegionDifficulty[key]) {
    byRegionDifficulty[key] = {
      region,
      difficulty,
      count: 0,
      totalMiles: 0
    };
  }
  byRegionDifficulty[key].count++;
  byRegionDifficulty[key].totalMiles += miles;
}

// Calculate averages
for (const stats of Object.values(byRegion)) {
  stats.avgMiles = Math.round(stats.totalMiles / stats.count);
  stats.totalMiles = Math.round(stats.totalMiles);
}

for (const stats of Object.values(byDifficulty)) {
  stats.avgMiles = Math.round(stats.totalMiles / stats.count);
  stats.totalMiles = Math.round(stats.totalMiles);
}

for (const stats of Object.values(byTrailType)) {
  stats.avgMiles = Math.round(stats.totalMiles / stats.count);
  stats.totalMiles = Math.round(stats.totalMiles);
}

for (const stats of Object.values(byRegionDifficulty)) {
  stats.avgMiles = Math.round(stats.totalMiles / stats.count);
  stats.totalMiles = Math.round(stats.totalMiles);
}

// Generate markdown report
let report = `# Trail Mileage Statistics Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total riding locations:** ${totalRidingLocations}
- **Locations with mileage data:** ${ridingLocations.length} (${Math.round((ridingLocations.length / totalRidingLocations) * 100)}%)
- **Total trail miles:** ${Math.round(totalMiles).toLocaleString()} miles
- **Average trail length:** ${Math.round(totalMiles / ridingLocations.length)} miles

---

## Total Miles by Region

| Region | Locations | Total Miles | Avg Miles/Trail |
|--------|-----------|-------------|----------------|
`;

const sortedRegions = Object.entries(byRegion).sort((a, b) => b[1].totalMiles - a[1].totalMiles);

for (const [region, stats] of sortedRegions) {
  report += `| ${region} | ${stats.count} | ${stats.totalMiles.toLocaleString()} | ${stats.avgMiles} |\n`;
}

report += `\n### Top Trails by Region\n\n`;

for (const [region, stats] of sortedRegions.slice(0, 5)) {
  report += `\n**${region}:**\n`;
  stats.trails.sort((a, b) => b.miles - a.miles);
  for (const trail of stats.trails) {
    report += `- ${trail.name} (${trail.miles}mi)\n`;
  }
}

report += `\n---\n\n## Total Miles by Difficulty\n\n`;
report += `| Difficulty | Locations | Total Miles | Avg Miles/Trail |\n`;
report += `|-----------|-----------|-------------|----------------|\n`;

const sortedDifficulty = Object.entries(byDifficulty).sort((a, b) => {
  const order = { 'Easy': 1, 'Beginner': 2, 'Moderate': 3, 'Intermediate': 4, 'Hard': 5, 'Advanced': 6, 'Expert': 7, 'Unknown': 99 };
  return (order[a[0]] || 99) - (order[b[0]] || 99);
});

for (const [diff, stats] of sortedDifficulty) {
  report += `| ${diff} | ${stats.count} | ${stats.totalMiles.toLocaleString()} | ${stats.avgMiles} |\n`;
}

report += `\n---\n\n## Total Miles by Trail Type\n\n`;
report += `| Trail Type | Locations | Total Miles | Avg Miles/Trail |\n`;
report += `|-----------|-----------|-------------|----------------|\n`;

const sortedTrailTypes = Object.entries(byTrailType).sort((a, b) => b[1].totalMiles - a[1].totalMiles);

for (const [type, stats] of sortedTrailTypes.slice(0, 15)) {
  report += `| ${type} | ${stats.count} | ${stats.totalMiles.toLocaleString()} | ${stats.avgMiles} |\n`;
}

report += `\n---\n\n## Mileage Distribution\n\n`;

const buckets = {
  '< 10 miles': 0,
  '10-25 miles': 0,
  '26-50 miles': 0,
  '51-100 miles': 0,
  '101-250 miles': 0,
  '251-500 miles': 0,
  '> 500 miles': 0
};

for (const loc of ridingLocations) {
  const miles = loc.distance_miles;
  if (miles < 10) buckets['< 10 miles']++;
  else if (miles <= 25) buckets['10-25 miles']++;
  else if (miles <= 50) buckets['26-50 miles']++;
  else if (miles <= 100) buckets['51-100 miles']++;
  else if (miles <= 250) buckets['101-250 miles']++;
  else if (miles <= 500) buckets['251-500 miles']++;
  else buckets['> 500 miles']++;
}

report += `| Trail Length | Count | Percentage |\n`;
report += `|-------------|-------|------------|\n`;

for (const [bucket, count] of Object.entries(buckets)) {
  const pct = Math.round((count / ridingLocations.length) * 100);
  report += `| ${bucket} | ${count} | ${pct}% |\n`;
}

report += `\n---\n\n## Regional Analysis\n\n`;

report += `### Regions with Most Trail Miles\n\n`;

for (const [region, stats] of sortedRegions.slice(0, 5)) {
  report += `${sortedRegions.indexOf([region, stats]) + 1}. **${region}** - ${stats.totalMiles.toLocaleString()} miles (${stats.count} locations)\n`;
}

report += `\n### Regions with Least Trail Miles (Expansion Opportunities)\n\n`;

for (const [region, stats] of sortedRegions.slice(-5).reverse()) {
  report += `- **${region}** - ${stats.totalMiles.toLocaleString()} miles (${stats.count} locations)\n`;
}

report += `\n---\n\n## Epic Trails (> 250 miles)\n\n`;

const epicTrails = ridingLocations.filter(loc => loc.distance_miles > 250).sort((a, b) => b.distance_miles - a.distance_miles);

if (epicTrails.length > 0) {
  report += `| Trail Name | Miles | Difficulty | Region |\n`;
  report += `|-----------|-------|------------|--------|\n`;
  
  for (const trail of epicTrails) {
    const region = getRegion(trail.latitude, trail.longitude);
    report += `| ${trail.name} | ${trail.distance_miles} | ${trail.difficulty || 'N/A'} | ${region} |\n`;
  }
} else {
  report += `No trails over 250 miles found.\n`;
}

report += `\n---\n\n## Data Quality Notes\n\n`;

const missingMileage = totalRidingLocations - ridingLocations.length;
const coveragePct = Math.round((ridingLocations.length / totalRidingLocations) * 100);

report += `- **Mileage data coverage:** ${coveragePct}% (${ridingLocations.length} of ${totalRidingLocations} riding locations)\n`;
report += `- **Missing mileage data:** ${missingMileage} locations\n`;
report += `- **Average trail length:** ${Math.round(totalMiles / ridingLocations.length)} miles\n`;
report += `- **Longest trail:** ${ridingLocations[0].name} (${ridingLocations[0].distance_miles}mi)\n\n`;

report += `### Recommendations\n\n`;

if (missingMileage > 100) {
  report += `1. Add mileage data to ${missingMileage} locations missing distance_miles\n`;
}

const lowMileageRegions = sortedRegions.filter(([_, s]) => s.totalMiles < 1000).map(([r]) => r);
if (lowMileageRegions.length > 0) {
  report += `2. Expand data in regions with limited mileage: ${lowMileageRegions.join(', ')}\n`;
}

report += `\n---\n\n*Report generated by analyze-trail-mileage.js*\n`;

// Save report
fs.writeFileSync('./TRAIL-MILEAGE.md', report);
console.log('✅ Trail mileage analysis complete!');
console.log(`📄 Report saved to: TRAIL-MILEAGE.md\n`);

// Print summary
console.log('📊 Summary:');
console.log(`  Total riding locations: ${totalRidingLocations}`);
console.log(`  With mileage data: ${ridingLocations.length} (${coveragePct}%)`);
console.log(`  Total trail miles: ${Math.round(totalMiles).toLocaleString()}`);
console.log(`  Average: ${Math.round(totalMiles / ridingLocations.length)} miles/trail`);

console.log(`\n🏔️  Top regions by mileage:`);
for (const [region, stats] of sortedRegions.slice(0, 3)) {
  console.log(`    ${region}: ${stats.totalMiles.toLocaleString()} miles`);
}

console.log(`\n🛤️  Longest trails: ${epicTrails.length} trails > 250 miles`);

db.close();
