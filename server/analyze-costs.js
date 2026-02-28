// Cost Analysis by Region for TrailCamp
// Analyzes campground costs across regions and categories

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Same region definitions as density analysis
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

console.log('Analyzing campground costs by region...\n');

// Get all locations with cost data
const locations = db.prepare(`
  SELECT id, name, latitude, longitude, category, sub_type, cost_per_night 
  FROM locations 
  WHERE cost_per_night IS NOT NULL
  ORDER BY cost_per_night
`).all();

console.log(`Found ${locations.length} locations with cost data\n`);

// Analyze by region
const byRegion = {};
const byCategoryRegion = {};
const allCosts = [];

for (const loc of locations) {
  const region = getRegion(loc.latitude, loc.longitude);
  const isFree = loc.cost_per_night === 0;
  const category = isFree ? 'free' : (loc.sub_type === 'boondocking' ? 'boondocking' : 'campground');
  
  // By region
  if (!byRegion[region]) {
    byRegion[region] = {
      total: 0,
      free: 0,
      paid: 0,
      sum: 0,
      costs: []
    };
  }
  
  byRegion[region].total++;
  if (isFree) {
    byRegion[region].free++;
  } else {
    byRegion[region].paid++;
    byRegion[region].sum += loc.cost_per_night;
    byRegion[region].costs.push(loc.cost_per_night);
  }
  
  // By category + region
  const key = `${region}|${category}`;
  if (!byCategoryRegion[key]) {
    byCategoryRegion[key] = {
      region,
      category,
      count: 0,
      sum: 0,
      costs: []
    };
  }
  
  byCategoryRegion[key].count++;
  if (!isFree) {
    byCategoryRegion[key].sum += loc.cost_per_night;
    byCategoryRegion[key].costs.push(loc.cost_per_night);
  }
  
  allCosts.push(loc.cost_per_night);
}

// Calculate statistics
for (const region of Object.values(byRegion)) {
  if (region.costs.length > 0) {
    region.costs.sort((a, b) => a - b);
    region.avg = Math.round((region.sum / region.paid) * 100) / 100;
    region.median = region.costs[Math.floor(region.costs.length / 2)];
    region.min = region.costs[0];
    region.max = region.costs[region.costs.length - 1];
  }
}

for (const cat of Object.values(byCategoryRegion)) {
  if (cat.costs.length > 0) {
    cat.costs.sort((a, b) => a - b);
    cat.avg = Math.round((cat.sum / cat.count) * 100) / 100;
    cat.median = cat.costs[Math.floor(cat.costs.length / 2)];
    cat.min = cat.costs[0];
    cat.max = cat.costs[cat.costs.length - 1];
  }
}

// Overall statistics
allCosts.sort((a, b) => a - b);
const freeCount = allCosts.filter(c => c === 0).length;
const paidCosts = allCosts.filter(c => c > 0);
const overallAvg = paidCosts.length > 0 ? Math.round((paidCosts.reduce((a, b) => a + b, 0) / paidCosts.length) * 100) / 100 : 0;
const overallMedian = paidCosts.length > 0 ? paidCosts[Math.floor(paidCosts.length / 2)] : 0;

// Generate markdown report
let report = `# Cost Analysis Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total locations with cost data:** ${locations.length}
- **Free locations:** ${freeCount} (${Math.round((freeCount / locations.length) * 100)}%)
- **Paid locations:** ${paidCosts.length} (${Math.round((paidCosts.length / locations.length) * 100)}%)
- **Average cost (paid only):** $${overallAvg}/night
- **Median cost (paid only):** $${overallMedian}/night
- **Range:** $${allCosts[0]} - $${allCosts[allCosts.length - 1]}/night

---

## Cost by Region

| Region | Total | Free | Paid | Avg Cost | Median | Min | Max |
|--------|-------|------|------|----------|--------|-----|-----|
`;

const sortedRegions = Object.entries(byRegion).sort((a, b) => (b[1].avg || 0) - (a[1].avg || 0));

for (const [region, stats] of sortedRegions) {
  const avg = stats.avg ? `$${stats.avg}` : 'N/A';
  const median = stats.median ? `$${stats.median}` : 'N/A';
  const min = stats.min !== undefined ? `$${stats.min}` : 'N/A';
  const max = stats.max !== undefined ? `$${stats.max}` : 'N/A';
  
  report += `| ${region} | ${stats.total} | ${stats.free} | ${stats.paid} | ${avg} | ${median} | ${min} | ${max} |\n`;
}

report += `\n---\n\n## Cost by Category & Region\n\n`;
report += `### Free Locations\n\n`;

const freeLocations = Object.values(byCategoryRegion)
  .filter(c => c.category === 'free')
  .sort((a, b) => b.count - a.count);

if (freeLocations.length > 0) {
  report += `| Region | Count |\n`;
  report += `|--------|-------|\n`;
  for (const loc of freeLocations) {
    report += `| ${loc.region} | ${loc.count} |\n`;
  }
} else {
  report += `No free locations found.\n`;
}

report += `\n### Paid Campgrounds by Region\n\n`;
report += `| Region | Count | Avg Cost | Median | Min | Max |\n`;
report += `|--------|-------|----------|--------|-----|-----|\n`;

const paidCampgrounds = Object.values(byCategoryRegion)
  .filter(c => c.category === 'campground' && c.avg)
  .sort((a, b) => (b.avg || 0) - (a.avg || 0));

for (const cg of paidCampgrounds) {
  report += `| ${cg.region} | ${cg.count} | $${cg.avg} | $${cg.median} | $${cg.min} | $${cg.max} |\n`;
}

report += `\n---\n\n## Budget-Friendly Regions\n\n`;
report += `Best regions for budget camping (lowest average paid costs):\n\n`;

const budgetRegions = sortedRegions
  .filter(([_, s]) => s.avg && s.paid >= 5)  // At least 5 paid locations
  .slice(-5)  // Bottom 5 (cheapest)
  .reverse();

let rank = 1;
for (const [region, stats] of budgetRegions) {
  report += `${rank}. **${region}** - $${stats.avg}/night avg (${stats.paid} locations)\n`;
  rank++;
}

report += `\n---\n\n## Most Expensive Regions\n\n`;
report += `Regions with highest average costs:\n\n`;

const expensiveRegions = sortedRegions
  .filter(([_, s]) => s.avg && s.paid >= 5)
  .slice(0, 5);  // Top 5 (most expensive)

rank = 1;
for (const [region, stats] of expensiveRegions) {
  report += `${rank}. **${region}** - $${stats.avg}/night avg (${stats.paid} locations)\n`;
  rank++;
}

report += `\n---\n\n## Trip Budgeting Insights\n\n`;

const freePct = Math.round((freeCount / locations.length) * 100);
report += `### Free Camping Availability\n`;
report += `- **${freePct}%** of locations with cost data are FREE\n`;
report += `- Highest free camping: ${freeLocations[0]?.region || 'N/A'} (${freeLocations[0]?.count || 0} locations)\n\n`;

report += `### Cost Planning Guidelines\n\n`;
report += `**Budget trip (mostly free camping):**\n`;
report += `- Focus on boondocking and dispersed camping\n`;
report += `- Target regions: ${freeLocations.slice(0, 3).map(r => r.region).join(', ')}\n`;
report += `- Expected avg: $0-5/night\n\n`;

report += `**Mid-range trip (mix of free + campgrounds):**\n`;
report += `- Mix of boondocking and campgrounds\n`;
report += `- Expected avg: $10-20/night\n`;
report += `- Budget ${Math.round(overallAvg * 0.7)}-${Math.round(overallAvg * 1.3)}/night\n\n`;

report += `**Developed campgrounds:**\n`;
report += `- State/National park campgrounds\n`;
report += `- Expected avg: $${overallAvg}/night\n`;
report += `- Budget $20-40/night for most regions\n\n`;

report += `### Regional Cost Estimates (7-day trip)\n\n`;
report += `Estimated camping costs for a week-long trip:\n\n`;

for (const [region, stats] of sortedRegions.slice(0, 8)) {
  if (stats.avg) {
    const weekCost = Math.round(stats.avg * 7);
    report += `- **${region}**: $${weekCost}/week ($${stats.avg}/night avg)\n`;
  }
}

report += `\n---\n\n## Data Quality Notes\n\n`;

const totalLocations = db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite'").get().count;
const coveragePct = Math.round((locations.length / totalLocations) * 100);

report += `- Cost data available for **${locations.length}** of ${totalLocations} campsites (${coveragePct}%)\n`;
report += `- ${locations.length - freeCount} paid locations analyzed\n`;
report += `- Cost range: $${allCosts[0]} - $${allCosts[allCosts.length - 1]}/night\n\n`;

report += `**Missing cost data:** ${totalLocations - locations.length} locations\n\n`;

report += `---\n\n*Report generated by analyze-costs.js*\n`;

// Save report
fs.writeFileSync('./COST-ANALYSIS.md', report);
console.log('✅ Cost analysis complete!');
console.log(`📄 Report saved to: COST-ANALYSIS.md\n`);

// Print summary
console.log('📊 Summary:');
console.log(`  Total with cost data: ${locations.length}`);
console.log(`  Free locations: ${freeCount} (${freePct}%)`);
console.log(`  Paid locations: ${paidCosts.length}`);
console.log(`  Average paid cost: $${overallAvg}/night`);
console.log(`  Median paid cost: $${overallMedian}/night`);

if (budgetRegions.length > 0) {
  console.log(`\n💰 Budget-friendly regions:`);
  for (const [region, stats] of budgetRegions.slice(0, 3)) {
    console.log(`    ${region}: $${stats.avg}/night avg`);
  }
}

db.close();
