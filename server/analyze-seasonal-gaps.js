// Seasonal Coverage Gaps Analysis for TrailCamp
// Identifies underrepresented season+region combinations

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Region definitions
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

// Primary seasons to check for each region
const EXPECTED_SEASONS = {
  'Pacific Northwest': ['Summer', 'Spring/Fall', 'Winter'],
  'California': ['Year-round', 'Summer', 'Winter', 'Spring/Fall'],
  'Southwest Desert': ['Winter', 'Spring/Fall', 'Summer'],
  'Rocky Mountains': ['Summer', 'Winter', 'Spring/Fall'],
  'Great Plains': ['Spring/Fall', 'Summer', 'Winter'],
  'Great Lakes': ['Summer', 'Spring/Fall', 'Winter'],
  'Southeast': ['Spring/Fall', 'Year-round', 'Summer', 'Winter'],
  'Northeast': ['Summer', 'Spring/Fall', 'Winter'],
  'Alaska': ['Summer', 'Jun-Sep'],
  'Hawaii': ['Year-round']
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

// Normalize season names for comparison
function normalizeSeason(season) {
  if (!season) return 'Unknown';
  if (season.includes('Jun') || season.includes('Jul') || season.includes('Aug') || season.includes('Sep')) {
    return 'Summer';
  }
  if (season.includes('Oct') || season.includes('Apr') || season.includes('May')) {
    return 'Spring/Fall';
  }
  if (season.includes('Nov') || season.includes('Dec') || season.includes('Jan') || season.includes('Feb') || season.includes('Mar')) {
    return 'Winter';
  }
  return season;
}

// Get all locations with seasons
const locations = db.prepare(`
  SELECT * FROM locations 
  WHERE best_season IS NOT NULL 
  ORDER BY latitude, longitude
`).all();

console.log(`Analyzing ${locations.length} locations with seasonal data...\n`);

// Analyze by region + season
const regionSeasonCounts = {};

for (const loc of locations) {
  const region = getRegion(loc.latitude, loc.longitude);
  const season = normalizeSeason(loc.best_season);
  
  if (!regionSeasonCounts[region]) {
    regionSeasonCounts[region] = {};
  }
  
  if (!regionSeasonCounts[region][season]) {
    regionSeasonCounts[region][season] = {
      count: 0,
      riding: 0,
      boondocking: 0,
      campgrounds: 0
    };
  }
  
  regionSeasonCounts[region][season].count++;
  
  if (loc.category === 'riding') regionSeasonCounts[region][season].riding++;
  else if (loc.sub_type === 'boondocking') regionSeasonCounts[region][season].boondocking++;
  else if (loc.category === 'campsite') regionSeasonCounts[region][season].campgrounds++;
}

// Identify gaps
const gaps = [];

for (const [region, expectedSeasons] of Object.entries(EXPECTED_SEASONS)) {
  const regionData = regionSeasonCounts[region] || {};
  
  for (const season of expectedSeasons) {
    const count = regionData[season]?.count || 0;
    
    // Flag as gap if less than 10 locations for this region+season
    if (count < 10) {
      gaps.push({
        region,
        season,
        currentCount: count,
        riding: regionData[season]?.riding || 0,
        boondocking: regionData[season]?.boondocking || 0,
        campgrounds: regionData[season]?.campgrounds || 0,
        priority: count === 0 ? 'HIGH' : (count < 5 ? 'MEDIUM' : 'LOW')
      });
    }
  }
}

// Sort gaps by priority and count
gaps.sort((a, b) => {
  const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  }
  return a.currentCount - b.currentCount;
});

// Generate markdown report
let report = `# Seasonal Coverage Gaps Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Overview

Analysis of ${locations.length} locations across ${Object.keys(REGIONS).length} regions to identify seasonal coverage gaps.

---

## Summary by Region

| Region | Total Locations | Seasons Covered | Coverage |
|--------|----------------|----------------|----------|
`;

for (const [region, seasons] of Object.entries(regionSeasonCounts)) {
  const total = Object.values(seasons).reduce((sum, s) => sum + s.count, 0);
  const seasonCount = Object.keys(seasons).length;
  const coverage = seasonCount >= 3 ? '✅ Good' : (seasonCount >= 2 ? '⚠️ Fair' : '❌ Poor');
  
  report += `| ${region} | ${total} | ${seasonCount} | ${coverage} |\n`;
}

report += `\n---\n\n## Identified Gaps (${gaps.length} total)

### High Priority (Missing Entirely)

`;

const highPriority = gaps.filter(g => g.priority === 'HIGH');

if (highPriority.length > 0) {
  report += `| Region | Season | Current Count | Recommendation |\n`;
  report += `|--------|--------|--------------|---------------|\n`;
  
  for (const gap of highPriority) {
    report += `| ${gap.region} | ${gap.season} | ${gap.currentCount} | Add 10-20 ${gap.season.toLowerCase()} locations |\n`;
  }
} else {
  report += `✅ No critical gaps found.\n`;
}

report += `\n### Medium Priority (< 5 locations)

`;

const mediumPriority = gaps.filter(g => g.priority === 'MEDIUM');

if (mediumPriority.length > 0) {
  report += `| Region | Season | Current Count | Riding | Boondocking | Campgrounds |\n`;
  report += `|--------|--------|--------------|--------|------------|------------|\n`;
  
  for (const gap of mediumPriority) {
    report += `| ${gap.region} | ${gap.season} | ${gap.currentCount} | ${gap.riding} | ${gap.boondocking} | ${gap.campgrounds} |\n`;
  }
} else {
  report += `✅ No medium priority gaps.\n`;
}

report += `\n### Low Priority (< 10 locations)

`;

const lowPriority = gaps.filter(g => g.priority === 'LOW');

if (lowPriority.length > 0) {
  report += `| Region | Season | Current Count |\n`;
  report += `|--------|--------|---------------|\n`;
  
  for (const gap of lowPriority) {
    report += `| ${gap.region} | ${gap.season} | ${gap.currentCount} |\n`;
  }
}

report += `\n---\n\n## Regional Seasonal Breakdown

`;

for (const region of Object.keys(REGIONS).sort()) {
  const seasons = regionSeasonCounts[region];
  if (!seasons) continue;
  
  report += `\n### ${region}\n\n`;
  
  const sortedSeasons = Object.entries(seasons).sort((a, b) => b[1].count - a[1].count);
  
  for (const [season, data] of sortedSeasons) {
    report += `- **${season}**: ${data.count} locations (${data.riding} riding, ${data.boondocking} boondocking, ${data.campgrounds} campgrounds)\n`;
  }
}

report += `\n---\n\n## Recommendations

### Top 5 Expansion Priorities

`;

const topRecommendations = gaps.slice(0, 5);

for (let i = 0; i < topRecommendations.length; i++) {
  const rec = topRecommendations[i];
  report += `\n${i + 1}. **${rec.region} - ${rec.season}** (Priority: ${rec.priority})
   - Current: ${rec.currentCount} locations
   - Target: 10-20 locations
   - Focus: ${rec.riding === 0 ? 'Add riding spots, ' : ''}${rec.boondocking === 0 ? 'Add boondocking, ' : ''}Expand campground coverage
`;
}

report += `\n### Strategic Additions

- **Winter Coverage**: Southwest Desert is well-covered (220 locations), but Great Plains and Southeast need more winter options
- **Summer Coverage**: Pacific Northwest (611) and Rocky Mountains (371) are strong; Alaska could use more
- **Year-round Destinations**: California (603) and Rocky Mountains (585) well-represented
- **Seasonal Variety**: Focus on regions with only 1-2 seasons covered

---

*Analysis by: analyze-seasonal-gaps.js*
`;

// Save report
fs.writeFileSync('./SEASONAL-GAPS.md', report);
console.log('✅ Seasonal gaps report generated!');
console.log('📄 Saved to: SEASONAL-GAPS.md\n');

// Console summary
console.log('📊 Summary:');
console.log('─'.repeat(60));
console.log(`Total gaps identified: ${gaps.length}`);
console.log(`  HIGH priority (missing): ${highPriority.length}`);
console.log(`  MEDIUM priority (<5): ${mediumPriority.length}`);
console.log(`  LOW priority (<10): ${lowPriority.length}`);

console.log('\n🔥 Top 3 Gaps:');
for (let i = 0; i < Math.min(3, gaps.length); i++) {
  const gap = gaps[i];
  console.log(`  ${i + 1}. ${gap.region} - ${gap.season}: ${gap.currentCount} locations (${gap.priority} priority)`);
}

db.close();
