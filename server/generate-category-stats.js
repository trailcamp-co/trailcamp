#!/usr/bin/env node
// Category Statistics Generator for TrailCamp
// Generates detailed breakdowns by sub_type, trail_types, and other categories

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Generating category statistics...\n');

// Helper to format percentages
function pct(count, total) {
  return Math.round((count / total) * 100);
}

// 1. Overall Category Distribution
const overall = db.prepare(`
  SELECT category, COUNT(*) as count 
  FROM locations 
  GROUP BY category 
  ORDER BY count DESC
`).all();

const totalLocations = overall.reduce((sum, row) => sum + row.count, 0);

// 2. Campsite Sub-Type Breakdown
const campsiteSubTypes = db.prepare(`
  SELECT sub_type, COUNT(*) as count 
  FROM locations 
  WHERE category = 'campsite'
  GROUP BY sub_type 
  ORDER BY count DESC
`).all();

// 3. Trail Types Distribution (for riding)
const trailTypesRaw = db.prepare(`
  SELECT trail_types, COUNT(*) as count 
  FROM locations 
  WHERE category = 'riding' AND trail_types IS NOT NULL
  GROUP BY trail_types 
  ORDER BY count DESC
`).all();

// Parse individual trail types (they're comma-separated)
const individualTrailTypes = {};
for (const row of trailTypesRaw) {
  const types = row.trail_types.split(',').map(t => t.trim());
  for (const type of types) {
    individualTrailTypes[type] = (individualTrailTypes[type] || 0) + row.count;
  }
}

// 4. Difficulty Distribution
const difficulties = db.prepare(`
  SELECT difficulty, COUNT(*) as count 
  FROM locations 
  WHERE category = 'riding' AND difficulty IS NOT NULL
  GROUP BY difficulty 
  ORDER BY 
    CASE difficulty
      WHEN 'Easy' THEN 1
      WHEN 'Beginner' THEN 2
      WHEN 'Moderate' THEN 3
      WHEN 'Intermediate' THEN 4
      WHEN 'Hard' THEN 5
      WHEN 'Advanced' THEN 6
      WHEN 'Expert' THEN 7
      ELSE 99
    END
`).all();

// 5. Best Season Distribution
const seasons = db.prepare(`
  SELECT best_season, COUNT(*) as count 
  FROM locations 
  WHERE best_season IS NOT NULL
  GROUP BY best_season 
  ORDER BY count DESC
`).all();

// 6. Cell Signal Distribution
const cellSignal = db.prepare(`
  SELECT cell_signal, COUNT(*) as count 
  FROM locations 
  WHERE cell_signal IS NOT NULL AND cell_signal != ''
  GROUP BY cell_signal 
  ORDER BY count DESC
`).all();

// 7. Cost Distribution
const costRanges = {
  'Free': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night = 0").get().count,
  '$1-10': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night > 0 AND cost_per_night <= 10").get().count,
  '$11-20': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night > 10 AND cost_per_night <= 20").get().count,
  '$21-30': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night > 20 AND cost_per_night <= 30").get().count,
  '$31-50': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night > 30 AND cost_per_night <= 50").get().count,
  '$50+': db.prepare("SELECT COUNT(*) as count FROM locations WHERE cost_per_night > 50").get().count
};

// 8. Scenery Rating Distribution
const sceneryDistribution = db.prepare(`
  SELECT scenery_rating, COUNT(*) as count 
  FROM locations 
  WHERE scenery_rating IS NOT NULL
  GROUP BY scenery_rating 
  ORDER BY scenery_rating DESC
`).all();

// 9. Permit Requirements
const permitStats = {
  required: db.prepare("SELECT COUNT(*) as count FROM locations WHERE permit_required = 1").get().count,
  notRequired: db.prepare("SELECT COUNT(*) as count FROM locations WHERE permit_required = 0 OR permit_required IS NULL").get().count,
  withInfo: db.prepare("SELECT COUNT(*) as count FROM locations WHERE permit_required = 1 AND permit_info IS NOT NULL AND permit_info != ''").get().count
};

// 10. Water Availability (campgrounds)
const waterStats = {
  onSite: db.prepare("SELECT COUNT(*) as count FROM locations WHERE water_available = 1").get().count,
  nearby: db.prepare("SELECT COUNT(*) as count FROM locations WHERE water_available = 0 AND water_nearby = 1").get().count,
  none: db.prepare("SELECT COUNT(*) as count FROM locations WHERE water_available = 0 AND water_nearby = 0").get().count
};

// Generate markdown report
let report = `# Category Statistics Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

**Total Locations:** ${totalLocations.toLocaleString()}

---

## 1. Category Distribution

| Category | Count | Percentage |
|----------|-------|------------|
`;

for (const row of overall) {
  report += `| ${row.category} | ${row.count.toLocaleString()} | ${pct(row.count, totalLocations)}% |\n`;
}

report += `\n---\n\n## 2. Campsite Sub-Types\n\n`;
report += `| Sub-Type | Count | Percentage of Campsites |\n`;
report += `|----------|-------|------------------------|\n`;

const totalCampsites = campsiteSubTypes.reduce((sum, row) => sum + row.count, 0);

for (const row of campsiteSubTypes) {
  report += `| ${row.sub_type || '(not specified)'} | ${row.count.toLocaleString()} | ${pct(row.count, totalCampsites)}% |\n`;
}

report += `\n---\n\n## 3. Trail Types (Riding Locations)\n\n`;
report += `### Individual Trail Types\n\n`;
report += `| Trail Type | Occurrences |\n`;
report += `|-----------|-------------|\n`;

const sortedTypes = Object.entries(individualTrailTypes).sort((a, b) => b[1] - a[1]);

for (const [type, count] of sortedTypes) {
  report += `| ${type} | ${count.toLocaleString()} |\n`;
}

report += `\n### Trail Type Combinations (Top 20)\n\n`;
report += `| Combination | Count |\n`;
report += `|-------------|-------|\n`;

for (const row of trailTypesRaw.slice(0, 20)) {
  report += `| ${row.trail_types} | ${row.count} |\n`;
}

if (trailTypesRaw.length > 20) {
  report += `\n*... and ${trailTypesRaw.length - 20} more combinations*\n`;
}

report += `\n---\n\n## 4. Difficulty Distribution (Riding)\n\n`;
report += `| Difficulty | Count | Percentage |\n`;
report += `|-----------|-------|------------|\n`;

const totalDifficulty = difficulties.reduce((sum, row) => sum + row.count, 0);

for (const row of difficulties) {
  report += `| ${row.difficulty} | ${row.count.toLocaleString()} | ${pct(row.count, totalDifficulty)}% |\n`;
}

report += `\n---\n\n## 5. Best Season Distribution\n\n`;
report += `| Season | Count | Percentage |\n`;
report += `|--------|-------|------------|\n`;

const totalSeasons = seasons.reduce((sum, row) => sum + row.count, 0);

for (const row of seasons.slice(0, 15)) {
  report += `| ${row.best_season} | ${row.count.toLocaleString()} | ${pct(row.count, totalSeasons)}% |\n`;
}

report += `\n---\n\n## 6. Cell Signal Availability\n\n`;
report += `| Signal Level | Count | Percentage |\n`;
report += `|-------------|-------|------------|\n`;

const totalSignal = cellSignal.reduce((sum, row) => sum + row.count, 0);

for (const row of cellSignal) {
  report += `| ${row.cell_signal} | ${row.count.toLocaleString()} | ${pct(row.count, totalSignal)}% |\n`;
}

report += `\n---\n\n## 7. Cost Distribution\n\n`;
report += `| Cost Range | Count |\n`;
report += `|-----------|-------|\n`;

for (const [range, count] of Object.entries(costRanges)) {
  if (count > 0) {
    report += `| ${range} | ${count.toLocaleString()} |\n`;
  }
}

const withCost = Object.values(costRanges).reduce((sum, count) => sum + count, 0);
const missingCost = totalLocations - withCost;

report += `\n**Coverage:** ${withCost.toLocaleString()} locations with cost data (${pct(withCost, totalLocations)}%)\n`;
report += `**Missing:** ${missingCost.toLocaleString()} locations without cost data\n`;

report += `\n---\n\n## 8. Scenery Rating Distribution\n\n`;
report += `| Rating | Count | Percentage |\n`;
report += `|--------|-------|------------|\n`;

const totalScenery = sceneryDistribution.reduce((sum, row) => sum + row.count, 0);

for (const row of sceneryDistribution) {
  const bar = '█'.repeat(Math.round((row.count / totalScenery) * 20));
  report += `| ${row.scenery_rating}/10 | ${row.count.toLocaleString()} | ${pct(row.count, totalScenery)}% ${bar} |\n`;
}

const avgScenery = db.prepare('SELECT AVG(scenery_rating) as avg FROM locations WHERE scenery_rating IS NOT NULL').get().avg;
report += `\n**Average Scenery Rating:** ${Math.round(avgScenery * 10) / 10}/10\n`;

report += `\n---\n\n## 9. Permit Requirements\n\n`;
report += `| Status | Count | Percentage |\n`;
report += `|--------|-------|------------|\n`;
report += `| Permit Required | ${permitStats.required.toLocaleString()} | ${pct(permitStats.required, totalLocations)}% |\n`;
report += `| No Permit | ${permitStats.notRequired.toLocaleString()} | ${pct(permitStats.notRequired, totalLocations)}% |\n`;

if (permitStats.required > 0) {
  report += `\n**Permit Info Completeness:** ${permitStats.withInfo} of ${permitStats.required} permit-required locations have details (${pct(permitStats.withInfo, permitStats.required)}%)\n`;
}

report += `\n---\n\n## 10. Water Availability (Campgrounds)\n\n`;
report += `| Availability | Count |\n`;
report += `|-------------|-------|\n`;
report += `| Water On-Site | ${waterStats.onSite.toLocaleString()} |\n`;
report += `| Water Nearby | ${waterStats.nearby.toLocaleString()} |\n`;
report += `| No Water | ${waterStats.none.toLocaleString()} |\n`;

const totalWater = waterStats.onSite + waterStats.nearby + waterStats.none;
report += `\n**Total with water data:** ${totalWater.toLocaleString()}\n`;

report += `\n---\n\n## Key Insights\n\n`;

// Auto-generate insights
const ridingPct = pct(overall.find(r => r.category === 'riding')?.count || 0, totalLocations);
const campsitePct = pct(overall.find(r => r.category === 'campsite')?.count || 0, totalLocations);

report += `### Category Balance\n`;
report += `- **${ridingPct}%** riding locations, **${campsitePct}%** campsites\n`;
report += `- Balanced for trip planning (both riding and camping options)\n\n`;

const topTrailType = sortedTypes[0];
report += `### Popular Trail Types\n`;
report += `- **${topTrailType[0]}** is most common (${topTrailType[1]} occurrences)\n`;
report += `- Mix of technical and beginner-friendly options available\n\n`;

const freeCampingPct = pct(costRanges['Free'], withCost);
report += `### Cost-Effective Options\n`;
report += `- **${freeCampingPct}%** of locations with cost data are FREE\n`;
report += `- Budget-friendly trip planning is very feasible\n\n`;

const highScenery = sceneryDistribution.filter(r => r.scenery_rating >= 8).reduce((sum, r) => sum + r.count, 0);
const highSceneryPct = pct(highScenery, totalScenery);
report += `### Scenic Quality\n`;
report += `- **${highSceneryPct}%** of locations rated 8+ scenery (excellent+)\n`;
report += `- Average rating: ${Math.round(avgScenery * 10) / 10}/10 (solid quality across database)\n`;

report += `\n---\n\n*Report generated by generate-category-stats.js*\n`;

// Save markdown report
fs.writeFileSync('./CATEGORY-STATS.md', report);

// Export JSON data
const jsonData = {
  generatedAt: new Date().toISOString(),
  summary: { totalLocations },
  categories: overall,
  campsiteSubTypes,
  trailTypes: {
    individual: individualTrailTypes,
    combinations: trailTypesRaw.slice(0, 50)
  },
  difficulties,
  seasons,
  cellSignal,
  costRanges,
  sceneryDistribution,
  permits: permitStats,
  water: waterStats,
  insights: {
    ridingPercentage: ridingPct,
    campsitePercentage: campsitePct,
    freeCampingPercentage: freeCampingPct,
    highSceneryPercentage: highSceneryPct,
    averageScenery: Math.round(avgScenery * 10) / 10
  }
};

fs.writeFileSync('./category-stats.json', JSON.stringify(jsonData, null, 2));

console.log('✅ Category statistics generated!');
console.log('📄 Markdown report: CATEGORY-STATS.md');
console.log('📊 JSON data: category-stats.json\n');

// Print summary
console.log('📊 Quick Summary:');
console.log(`  Total locations: ${totalLocations.toLocaleString()}`);
console.log(`  Categories: ${overall.length}`);
console.log(`  Trail type combinations: ${trailTypesRaw.length}`);
console.log(`  Individual trail types: ${sortedTypes.length}`);
console.log(`  Average scenery: ${Math.round(avgScenery * 10) / 10}/10`);
console.log(`  Free camping: ${freeCampingPct}%`);

db.close();
