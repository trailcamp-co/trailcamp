// Seasonal Coverage Gap Analysis for TrailCamp
// Identifies underrepresented seasons/regions

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Region definitions (same as density analysis)
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

// Get all locations with season data
const locations = db.prepare(`
  SELECT id, name, latitude, longitude, category, sub_type, best_season 
  FROM locations 
  WHERE best_season IS NOT NULL
`).all();

console.log(`Analyzing seasonal coverage for ${locations.length} locations...\n`);

// Initialize data structures
const seasonalCoverage = {};
const regionalSeasons = {};
const categorySeason = {};

const seasons = ['Winter', 'Spring', 'Summer', 'Fall', 'Year-round', 'Spring/Fall'];

for (const season of seasons) {
  seasonalCoverage[season] = 0;
  categorySeason[season] = { riding: 0, boondocking: 0, campgrounds: 0 };
}

for (const region of Object.keys(REGIONS).concat(['Other'])) {
  regionalSeasons[region] = {};
  for (const season of seasons) {
    regionalSeasons[region][season] = 0;
  }
}

// Analyze each location
for (const loc of locations) {
  const region = getRegion(loc.latitude, loc.longitude);
  const season = loc.best_season || 'Unknown';
  
  // Overall season count
  if (seasonalCoverage[season] !== undefined) {
    seasonalCoverage[season]++;
  }
  
  // Regional breakdown
  if (regionalSeasons[region] && regionalSeasons[region][season] !== undefined) {
    regionalSeasons[region][season]++;
  }
  
  // Category breakdown
  if (categorySeason[season]) {
    if (loc.category === 'riding') {
      categorySeason[season].riding++;
    } else if (loc.sub_type === 'boondocking') {
      categorySeason[season].boondocking++;
    } else if (loc.category === 'campsite') {
      categorySeason[season].campgrounds++;
    }
  }
}

// Calculate total per region
const regionTotals = {};
for (const region of Object.keys(regionalSeasons)) {
  regionTotals[region] = Object.values(regionalSeasons[region]).reduce((a, b) => a + b, 0);
}

// Generate markdown report
let report = `# Seasonal Coverage Gap Analysis

*Generated: ${new Date().toISOString().split('T')[0]}*

## Overview

Total locations analyzed: **${locations.length}**

## 1. Overall Seasonal Distribution

| Season | Count | Percentage | Riding | Boondocking | Campgrounds |
|--------|-------|-----------|--------|-------------|-------------|
`;

const sortedSeasons = Object.entries(seasonalCoverage).sort((a, b) => b[1] - a[1]);

for (const [season, count] of sortedSeasons) {
  const pct = ((count / locations.length) * 100).toFixed(1);
  const cat = categorySeason[season] || { riding: 0, boondocking: 0, campgrounds: 0 };
  report += `| ${season} | ${count} | ${pct}% | ${cat.riding} | ${cat.boondocking} | ${cat.campgrounds} |\n`;
}

report += `\n---\n\n## 2. Regional Seasonal Coverage\n\n`;

// Sort regions by total locations
const sortedRegions = Object.entries(regionTotals)
  .sort((a, b) => b[1] - a[1])
  .map(([region]) => region);

report += `| Region | Total | Winter | Spring | Summer | Fall | Year-round | Spring/Fall |\n`;
report += `|--------|-------|--------|--------|--------|------|------------|-------------|\n`;

for (const region of sortedRegions) {
  const seasons = regionalSeasons[region];
  const total = regionTotals[region];
  
  if (total === 0) continue;
  
  report += `| ${region} | ${total} | `;
  report += `${seasons.Winter || 0} | `;
  report += `${seasons.Spring || 0} | `;
  report += `${seasons.Summer || 0} | `;
  report += `${seasons.Fall || 0} | `;
  report += `${seasons['Year-round'] || 0} | `;
  report += `${seasons['Spring/Fall'] || 0} |\n`;
}

report += `\n---\n\n## 3. Gap Analysis\n\n### Regions with Poor Winter Coverage\n\n`;

const winterGaps = [];
for (const region of sortedRegions) {
  const total = regionTotals[region];
  const winter = regionalSeasons[region].Winter || 0;
  const winterPct = total > 0 ? (winter / total) * 100 : 0;
  
  // Flag if <10% winter coverage and region has >100 locations
  if (winterPct < 10 && total > 100) {
    winterGaps.push({ region, total, winter, winterPct: winterPct.toFixed(1) });
  }
}

if (winterGaps.length > 0) {
  report += `| Region | Total Locations | Winter Locations | Winter % |\n`;
  report += `|--------|----------------|-----------------|----------|\n`;
  
  for (const gap of winterGaps) {
    report += `| ${gap.region} | ${gap.total} | ${gap.winter} | ${gap.winterPct}% |\n`;
  }
  
  report += `\n**Recommendation:** Add winter-friendly locations (desert, southern, low-elevation) in these regions.\n\n`;
} else {
  report += `✅ No significant winter coverage gaps found.\n\n`;
}

report += `### Regions with Poor Summer Coverage\n\n`;

const summerGaps = [];
for (const region of sortedRegions) {
  const total = regionTotals[region];
  const summer = regionalSeasons[region].Summer || 0;
  const summerPct = total > 0 ? (summer / total) * 100 : 0;
  
  // Flag if <10% summer coverage and region has >100 locations
  if (summerPct < 10 && total > 100) {
    summerGaps.push({ region, total, summer, summerPct: summerPct.toFixed(1) });
  }
}

if (summerGaps.length > 0) {
  report += `| Region | Total Locations | Summer Locations | Summer % |\n`;
  report += `|--------|----------------|-----------------|----------|\n`;
  
  for (const gap of summerGaps) {
    report += `| ${gap.region} | ${gap.total} | ${gap.summer} | ${gap.summerPct}% |\n`;
  }
  
  report += `\n**Recommendation:** Add summer locations (high-elevation, northern, coastal) in these regions.\n\n`;
} else {
  report += `✅ No significant summer coverage gaps found.\n\n`;
}

report += `---\n\n## 4. Seasonal Balance by Category\n\n### Riding Locations\n\n`;

const ridingSeasons = Object.entries(categorySeason)
  .map(([season, counts]) => ({ season, count: counts.riding }))
  .filter(item => item.count > 0)
  .sort((a, b) => b.count - a.count);

const totalRiding = ridingSeasons.reduce((sum, item) => sum + item.count, 0);

report += `| Season | Count | Percentage |\n`;
report += `|--------|-------|------------|\n`;

for (const { season, count } of ridingSeasons) {
  const pct = ((count / totalRiding) * 100).toFixed(1);
  report += `| ${season} | ${count} | ${pct}% |\n`;
}

report += `\n### Boondocking Locations\n\n`;

const boondockingSeasons = Object.entries(categorySeason)
  .map(([season, counts]) => ({ season, count: counts.boondocking }))
  .filter(item => item.count > 0)
  .sort((a, b) => b.count - a.count);

const totalBoondocking = boondockingSeasons.reduce((sum, item) => sum + item.count, 0);

report += `| Season | Count | Percentage |\n`;
report += `|--------|-------|------------|\n`;

for (const { season, count } of boondockingSeasons) {
  const pct = ((count / totalBoondocking) * 100).toFixed(1);
  report += `| ${season} | ${pct}% |\n`;
}

report += `\n---\n\n## 5. Recommendations for Data Expansion\n\n`;

// Generate specific recommendations
const recommendations = [];

// Check for winter riding gaps
const winterRiding = categorySeason.Winter?.riding || 0;
const totalRidingCount = Object.values(categorySeason).reduce((sum, cat) => sum + cat.riding, 0);
const winterRidingPct = (winterRiding / totalRidingCount) * 100;

if (winterRidingPct < 15) {
  recommendations.push({
    priority: 'HIGH',
    category: 'Riding',
    season: 'Winter',
    current: winterRiding,
    recommendation: 'Add desert riding locations in AZ, NM, Southern CA, NV for winter riding season'
  });
}

// Check for summer boondocking
const summerBoondocking = categorySeason.Summer?.boondocking || 0;
const totalBoondockingCount = Object.values(categorySeason).reduce((sum, cat) => sum + cat.boondocking, 0);
const summerBoondockingPct = (summerBoondocking / totalBoondockingCount) * 100;

if (summerBoondockingPct < 20) {
  recommendations.push({
    priority: 'MEDIUM',
    category: 'Boondocking',
    season: 'Summer',
    current: summerBoondocking,
    recommendation: 'Add high-elevation boondocking in CO, WY, MT, ID for summer season'
  });
}

// Regional gaps
for (const gap of winterGaps) {
  recommendations.push({
    priority: 'MEDIUM',
    category: 'All',
    season: 'Winter',
    current: gap.winter,
    recommendation: `Add winter-season locations in ${gap.region} (currently ${gap.winterPct}% coverage)`
  });
}

if (recommendations.length > 0) {
  report += `| Priority | Category | Season | Current Count | Recommendation |\n`;
  report += `|----------|----------|--------|--------------|----------------|\n`;
  
  for (const rec of recommendations) {
    report += `| ${rec.priority} | ${rec.category} | ${rec.season} | ${rec.current} | ${rec.recommendation} |\n`;
  }
} else {
  report += `✅ Seasonal coverage is well-balanced across all categories and regions.\n`;
}

report += `\n---\n\n## 6. Data Quality Notes\n\n`;

const totalLocations = db.prepare('SELECT COUNT(*) as count FROM locations').get().count;
const withSeason = locations.length;
const withoutSeason = totalLocations - withSeason;

if (withoutSeason > 0) {
  report += `⚠️ **${withoutSeason} locations missing best_season data** (${((withoutSeason / totalLocations) * 100).toFixed(1)}%)\n\n`;
} else {
  report += `✅ All ${totalLocations} locations have best_season data\n\n`;
}

report += `---\n\n*Report generated by analyze-seasonal-coverage.js*\n`;

// Save report
fs.writeFileSync('./SEASONAL-COVERAGE.md', report);
console.log('✅ Seasonal coverage gap analysis complete!');
console.log('📄 Saved to: SEASONAL-COVERAGE.md\n');

// Print summary
console.log('📊 Key Findings:');
console.log('─'.repeat(60));
console.log(`Most common season: ${sortedSeasons[0][0]} (${sortedSeasons[0][1]} locations)`);
console.log(`Winter coverage gaps: ${winterGaps.length} regions`);
console.log(`Summer coverage gaps: ${summerGaps.length} regions`);
console.log(`Recommendations: ${recommendations.length} priority areas for expansion`);

db.close();
