#!/usr/bin/env node
// Seasonal Distribution Analyzer for TrailCamp
// Analyzes locations by month availability

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Month mapping
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Parse best_season to determine available months
function getAvailableMonths(bestSeason) {
  if (!bestSeason || bestSeason.trim() === '') return [];
  
  const season = bestSeason.toLowerCase().trim();
  
  // Year-round
  if (season.includes('year') || season.includes('all')) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  }
  
  const months = [];
  
  // Spring (March, April, May)
  if (season.includes('spring')) {
    months.push(2, 3, 4);
  }
  
  // Summer (June, July, August)
  if (season.includes('summer')) {
    months.push(5, 6, 7);
  }
  
  // Fall/Autumn (September, October, November)
  if (season.includes('fall') || season.includes('autumn')) {
    months.push(8, 9, 10);
  }
  
  // Winter (December, January, February)
  if (season.includes('winter')) {
    months.push(11, 0, 1);
  }
  
  return [...new Set(months)].sort((a, b) => a - b);
}

console.log('Analyzing seasonal distribution...\n');

// Get all locations
const locations = db.prepare('SELECT id, name, latitude, longitude, category, sub_type, best_season, state FROM locations').all();

console.log(`Analyzing ${locations.length} locations\n`);

// Analysis containers
const byMonth = {};
const byMonthCategory = {};
const byMonthRegion = {};
const seasonCounts = {};

// Initialize month containers
for (let i = 0; i < 12; i++) {
  byMonth[i] = {
    month: MONTH_NAMES[i],
    monthAbbr: MONTHS[i],
    total: 0,
    riding: 0,
    boondocking: 0,
    campgrounds: 0,
    locations: []
  };
}

// Process each location
for (const loc of locations) {
  const months = getAvailableMonths(loc.best_season);
  
  // Track season counts
  const season = (loc.best_season || 'Unknown').trim();
  seasonCounts[season] = (seasonCounts[season] || 0) + 1;
  
  // Add to each available month
  for (const monthIdx of months) {
    byMonth[monthIdx].total++;
    
    if (loc.category === 'riding') {
      byMonth[monthIdx].riding++;
    } else if (loc.sub_type === 'boondocking') {
      byMonth[monthIdx].boondocking++;
    } else if (loc.category === 'campsite') {
      byMonth[monthIdx].campgrounds++;
    }
    
    // Store top locations per month
    if (byMonth[monthIdx].locations.length < 10) {
      byMonth[monthIdx].locations.push({
        id: loc.id,
        name: loc.name,
        category: loc.category,
        state: loc.state || 'Unknown'
      });
    }
  }
}

// Generate report
let report = `# Seasonal Distribution Analysis

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

Analyzed **${locations.length}** locations for seasonal availability.

---

## Monthly Availability

| Month | Total | Riding | Boondocking | Campgrounds |
|-------|-------|--------|-------------|-------------|
`;

const monthData = Object.values(byMonth);

for (const month of monthData) {
  report += `| ${month.month} | ${month.total} | ${month.riding} | ${month.boondocking} | ${month.campgrounds} |\n`;
}

// Peak months
const sorted = monthData.slice().sort((a, b) => b.total - a.total);

report += `\n---\n\n## Peak Months\n\n`;
report += `Best availability:\n\n`;

for (let i = 0; i < 5; i++) {
  const month = sorted[i];
  report += `${i + 1}. **${month.month}** - ${month.total.toLocaleString()} locations (${month.riding} riding, ${month.campgrounds} campgrounds)\n`;
}

report += `\n---\n\n## Off-Season Months\n\n`;
report += `Lowest availability:\n\n`;

for (let i = 0; i < 5; i++) {
  const month = sorted[sorted.length - 1 - i];
  report += `${i + 1}. **${month.month}** - ${month.total.toLocaleString()} locations\n`;
}

report += `\n---\n\n## Season Distribution\n\n`;
report += `| Season | Locations | Percentage |\n`;
report += `|--------|-----------|------------|\n`;

const sortedSeasons = Object.entries(seasonCounts).sort((a, b) => b[1] - a[1]);

for (const [season, count] of sortedSeasons) {
  const pct = Math.round((count / locations.length) * 100);
  report += `| ${season} | ${count.toLocaleString()} | ${pct}% |\n`;
}

report += `\n---\n\n## Monthly Details\n\n`;

for (const month of monthData) {
  report += `### ${month.month} (${month.total.toLocaleString()} locations)\n\n`;
  report += `- **Riding:** ${month.riding}\n`;
  report += `- **Boondocking:** ${month.boondocking}\n`;
  report += `- **Campgrounds:** ${month.campgrounds}\n\n`;
  
  if (month.locations.length > 0) {
    report += `**Sample locations:**\n`;
    for (const loc of month.locations.slice(0, 5)) {
      report += `- ${loc.name} (${loc.category}${loc.state !== 'Unknown' ? ', ' + loc.state : ''})\n`;
    }
    report += `\n`;
  }
}

report += `---\n\n## Trip Planning Insights\n\n`;

// Best months for each activity
const ridingBest = monthData.slice().sort((a, b) => b.riding - a.riding)[0];
const campingBest = monthData.slice().sort((a, b) => (b.boondocking + b.campgrounds) - (a.boondocking + a.campgrounds))[0];

report += `### Best Months by Activity\n\n`;
report += `**Riding:**\n`;
report += `- ${ridingBest.month}: ${ridingBest.riding.toLocaleString()} riding locations available\n\n`;

report += `**Camping:**\n`;
report += `- ${campingBest.month}: ${(campingBest.boondocking + campingBest.campgrounds).toLocaleString()} camping locations available\n\n`;

report += `### Seasonal Trip Recommendations\n\n`;

report += `**Spring (Mar-May):**\n`;
const springTotal = byMonth[2].total + byMonth[3].total + byMonth[4].total;
report += `- ${springTotal.toLocaleString()} locations available\n`;
report += `- Best for: Desert Southwest, Southern states, low-elevation trails\n\n`;

report += `**Summer (Jun-Aug):**\n`;
const summerTotal = byMonth[5].total + byMonth[6].total + byMonth[7].total;
report += `- ${summerTotal.toLocaleString()} locations available (peak season)\n`;
report += `- Best for: High elevation, Pacific Northwest, Alaska, New England\n\n`;

report += `**Fall (Sep-Nov):**\n`;
const fallTotal = byMonth[8].total + byMonth[9].total + byMonth[10].total;
report += `- ${fallTotal.toLocaleString()} locations available\n`;
report += `- Best for: Shoulder season everywhere, ideal temps in desert\n\n`;

report += `**Winter (Dec-Feb):**\n`;
const winterTotal = byMonth[11].total + byMonth[0].total + byMonth[1].total;
report += `- ${winterTotal.toLocaleString()} locations available\n`;
report += `- Best for: Desert Southwest (AZ, NM, CA), Southern states, low elevations\n\n`;

report += `---\n\n## Data Quality Notes\n\n`;

const withSeason = db.prepare("SELECT COUNT(*) as count FROM locations WHERE best_season IS NOT NULL AND best_season != ''").get().count;
const coverage = Math.round((withSeason / locations.length) * 100);

report += `- **${coverage}%** of locations have seasonal data (${withSeason} of ${locations.length})\n`;
report += `- Most common: ${sortedSeasons[0][0]} (${sortedSeasons[0][1]} locations)\n`;

if (coverage < 100) {
  const missing = locations.length - withSeason;
  report += `- **${missing} locations** missing seasonal information\n\n`;
  report += `### Recommendations\n\n`;
  report += `1. Add best_season data to ${missing} locations\n`;
  report += `2. Review "Year-round" classifications - verify they're truly accessible year-round\n`;
}

report += `\n---\n\n*Report generated by analyze-seasonal-distribution.js*\n`;

// Save report
fs.writeFileSync('./SEASONAL-DISTRIBUTION.md', report);

// Generate JSON for visualization
const visualization = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalLocations: locations.length,
    coverage: coverage,
    peakMonth: sorted[0].month,
    peakMonthCount: sorted[0].total
  },
  byMonth: monthData.map(m => ({
    month: m.month,
    monthAbbr: m.monthAbbr,
    monthIndex: MONTH_NAMES.indexOf(m.month),
    total: m.total,
    riding: m.riding,
    boondocking: m.boondocking,
    campgrounds: m.campgrounds
  })),
  seasons: {
    spring: springTotal,
    summer: summerTotal,
    fall: fallTotal,
    winter: winterTotal
  }
};

fs.writeFileSync('./seasonal-distribution.json', JSON.stringify(visualization, null, 2));

console.log('✅ Seasonal distribution analysis complete!\n');
console.log(`📄 Report: SEASONAL-DISTRIBUTION.md`);
console.log(`📊 Data: seasonal-distribution.json\n`);

// Print summary
console.log('📊 Monthly Summary:');
console.log('─'.repeat(60));

for (const month of monthData) {
  const bar = '█'.repeat(Math.floor(month.total / 100));
  console.log(`${month.monthAbbr.padEnd(4)} ${month.total.toString().padStart(5)} ${bar}`);
}

console.log(`\n🎯 Peak month: ${sorted[0].month} (${sorted[0].total.toLocaleString()} locations)`);
console.log(`📉 Low month:  ${sorted[11].month} (${sorted[11].total.toLocaleString()} locations)`);
console.log(`🌍 Coverage: ${coverage}% of locations have seasonal data\n`);

db.close();
