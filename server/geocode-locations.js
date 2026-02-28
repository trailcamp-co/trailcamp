#!/usr/bin/env node
// Geocoding Helper for TrailCamp
// Reverse geocodes coordinates to get state/county information

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// US State boundaries (approximate - for offline geocoding)
// Format: [minLat, maxLat, minLon, maxLon, state code, state name]
const STATE_BOUNDARIES = [
  [30.2, 35.0, -88.5, -84.9, 'AL', 'Alabama'],
  [51.2, 71.5, -179.0, -129.0, 'AK', 'Alaska'],
  [31.3, 37.0, -114.8, -109.0, 'AZ', 'Arizona'],
  [33.0, 36.5, -94.6, -89.6, 'AR', 'Arkansas'],
  [32.5, 42.0, -124.5, -114.1, 'CA', 'California'],
  [37.0, 41.0, -109.1, -102.0, 'CO', 'Colorado'],
  [40.9, 42.1, -73.7, -71.8, 'CT', 'Connecticut'],
  [38.4, 39.8, -75.8, -75.0, 'DE', 'Delaware'],
  [24.5, 31.0, -87.6, -80.0, 'FL', 'Florida'],
  [30.4, 35.0, -85.6, -80.8, 'GA', 'Georgia'],
  [18.9, 22.2, -160.3, -154.8, 'HI', 'Hawaii'],
  [42.0, 49.0, -117.2, -111.0, 'ID', 'Idaho'],
  [37.0, 42.5, -91.5, -87.5, 'IL', 'Illinois'],
  [37.8, 41.8, -88.1, -84.8, 'IN', 'Indiana'],
  [40.4, 43.5, -96.6, -90.1, 'IA', 'Iowa'],
  [37.0, 40.0, -102.1, -94.6, 'KS', 'Kansas'],
  [36.5, 39.1, -89.6, -81.9, 'KY', 'Kentucky'],
  [28.9, 33.0, -94.0, -88.8, 'LA', 'Louisiana'],
  [43.1, 47.5, -71.1, -66.9, 'ME', 'Maine'],
  [37.9, 39.7, -79.5, -75.0, 'MD', 'Maryland'],
  [41.2, 42.9, -73.5, -69.9, 'MA', 'Massachusetts'],
  [41.7, 48.3, -90.4, -82.4, 'MI', 'Michigan'],
  [43.5, 49.4, -97.2, -89.5, 'MN', 'Minnesota'],
  [30.2, 35.0, -91.7, -88.1, 'MS', 'Mississippi'],
  [36.0, 40.6, -95.8, -89.1, 'MO', 'Missouri'],
  [45.0, 49.0, -116.1, -104.0, 'MT', 'Montana'],
  [40.0, 43.0, -104.1, -95.3, 'NE', 'Nebraska'],
  [35.0, 42.0, -120.0, -114.0, 'NV', 'Nevada'],
  [42.7, 45.3, -72.6, -70.6, 'NH', 'New Hampshire'],
  [38.9, 41.4, -75.6, -73.9, 'NJ', 'New Jersey'],
  [31.3, 37.0, -109.1, -103.0, 'NM', 'New Mexico'],
  [40.5, 45.0, -79.8, -71.9, 'NY', 'New York'],
  [34.0, 36.6, -84.3, -75.5, 'NC', 'North Carolina'],
  [45.9, 49.0, -104.1, -96.6, 'ND', 'North Dakota'],
  [38.4, 42.3, -84.8, -80.5, 'OH', 'Ohio'],
  [33.6, 37.0, -103.0, -94.4, 'OK', 'Oklahoma'],
  [42.0, 46.3, -124.6, -116.5, 'OR', 'Oregon'],
  [39.7, 42.3, -80.5, -74.7, 'PA', 'Pennsylvania'],
  [41.1, 42.0, -71.9, -71.1, 'RI', 'Rhode Island'],
  [32.0, 35.2, -83.4, -78.5, 'SC', 'South Carolina'],
  [42.5, 46.0, -104.1, -96.4, 'SD', 'South Dakota'],
  [35.0, 36.7, -90.3, -81.6, 'TN', 'Tennessee'],
  [25.8, 36.5, -106.7, -93.5, 'TX', 'Texas'],
  [37.0, 42.0, -114.1, -109.0, 'UT', 'Utah'],
  [42.7, 45.0, -73.4, -71.5, 'VT', 'Vermont'],
  [36.5, 39.5, -83.7, -75.2, 'VA', 'Virginia'],
  [45.5, 49.0, -124.8, -116.9, 'WA', 'Washington'],
  [37.2, 40.6, -82.7, -77.7, 'WV', 'West Virginia'],
  [42.5, 47.1, -92.9, -86.2, 'WI', 'Wisconsin'],
  [41.0, 45.0, -111.1, -104.0, 'WY', 'Wyoming'],
  [38.8, 39.0, -77.1, -76.9, 'DC', 'Washington DC']
];

/**
 * Get state from coordinates using boundary lookup
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {object|null} - {code, name} or null
 */
function getStateFromCoordinates(lat, lon) {
  for (const [minLat, maxLat, minLon, maxLon, code, name] of STATE_BOUNDARIES) {
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
      return { code, name };
    }
  }
  return null;
}

/**
 * Main geocoding function
 */
function geocodeLocations() {
  console.log('Geocoding all locations...\n');
  
  const locations = db.prepare('SELECT id, name, latitude, longitude, category FROM locations ORDER BY id').all();
  
  console.log(`Processing ${locations.length} locations...\n`);
  
  const byState = {};
  const noState = [];
  
  for (const loc of locations) {
    const state = getStateFromCoordinates(loc.latitude, loc.longitude);
    
    if (state) {
      if (!byState[state.code]) {
        byState[state.code] = {
          code: state.code,
          name: state.name,
          total: 0,
          riding: 0,
          campsites: 0,
          locations: []
        };
      }
      
      byState[state.code].total++;
      if (loc.category === 'riding') {
        byState[state.code].riding++;
      } else if (loc.category === 'campsite') {
        byState[state.code].campsites++;
      }
      
      // Store first 5 locations per state as examples
      if (byState[state.code].locations.length < 5) {
        byState[state.code].locations.push({
          id: loc.id,
          name: loc.name,
          category: loc.category
        });
      }
    } else {
      noState.push({
        id: loc.id,
        name: loc.name,
        lat: loc.latitude,
        lon: loc.longitude
      });
    }
  }
  
  return { byState, noState, total: locations.length };
}

/**
 * Generate markdown report
 */
function generateReport(results) {
  const { byState, noState, total } = results;
  
  let report = `# Location Geocoding Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total locations:** ${total.toLocaleString()}
- **Successfully geocoded:** ${(total - noState.length).toLocaleString()} (${Math.round(((total - noState.length) / total) * 100)}%)
- **Unable to geocode:** ${noState.length}
- **States covered:** ${Object.keys(byState).length}

---

## Locations by State

| State | Code | Total | Riding | Campsites |
|-------|------|-------|--------|-----------|
`;
  
  const sortedStates = Object.values(byState).sort((a, b) => b.total - a.total);
  
  for (const state of sortedStates) {
    report += `| ${state.name} | ${state.code} | ${state.total} | ${state.riding} | ${state.campsites} |\n`;
  }
  
  report += `\n---\n\n## Top 10 States by Location Count\n\n`;
  
  for (let i = 0; i < Math.min(10, sortedStates.length); i++) {
    const state = sortedStates[i];
    report += `${i + 1}. **${state.name}** - ${state.total} locations (${state.riding} riding, ${state.campsites} campsites)\n`;
  }
  
  if (noState.length > 0) {
    report += `\n---\n\n## Unable to Geocode (${noState.length} locations)\n\n`;
    report += `These locations fall outside known state boundaries:\n\n`;
    report += `| ID | Name | Latitude | Longitude |\n`;
    report += `|----|------|----------|----------|\n`;
    
    for (const loc of noState.slice(0, 20)) {
      report += `| ${loc.id} | ${loc.name} | ${loc.lat.toFixed(4)} | ${loc.lon.toFixed(4)} |\n`;
    }
    
    if (noState.length > 20) {
      report += `\n*... and ${noState.length - 20} more*\n`;
    }
  }
  
  report += `\n---\n\n## Example Locations by State\n\n`;
  
  for (const state of sortedStates.slice(0, 15)) {
    report += `\n### ${state.name} (${state.code})\n\n`;
    for (const loc of state.locations) {
      report += `- **[${loc.id}]** ${loc.name} (${loc.category})\n`;
    }
  }
  
  report += `\n---\n\n## Usage\n\n`;
  report += `This geocoding uses offline state boundary lookup for fast processing.\n\n`;
  report += `**To add state column to database:**\n\`\`\`sql\n`;
  report += `ALTER TABLE locations ADD COLUMN state VARCHAR(2);\n`;
  report += `CREATE INDEX idx_locations_state ON locations(state);\n`;
  report += `\`\`\`\n\n`;
  report += `**To populate state column** (would require running update query for each location):\n`;
  report += `See geocode-locations.js script for bulk update capability.\n\n`;
  report += `---\n\n*Report generated by geocode-locations.js*\n`;
  
  return report;
}

/**
 * Export state data as JSON
 */
function exportJSON(results) {
  const { byState, noState, total } = results;
  
  const data = {
    generatedAt: new Date().toISOString(),
    summary: {
      total,
      geocoded: total - noState.length,
      failed: noState.length,
      stateCount: Object.keys(byState).length
    },
    states: Object.values(byState).map(s => ({
      code: s.code,
      name: s.name,
      total: s.total,
      riding: s.riding,
      campsites: s.campsites
    })).sort((a, b) => b.total - a.total),
    failed: noState
  };
  
  fs.writeFileSync('./geocoding-results.json', JSON.stringify(data, null, 2));
  console.log('📄 JSON data saved to: geocoding-results.json\n');
}

// Main
try {
  const results = geocodeLocations();
  const report = generateReport(results);
  
  fs.writeFileSync('./GEOCODING-REPORT.md', report);
  console.log('✅ Geocoding complete!');
  console.log(`📄 Report saved to: GEOCODING-REPORT.md\n`);
  
  exportJSON(results);
  
  console.log('📊 Summary:');
  console.log(`  Total locations: ${results.total.toLocaleString()}`);
  console.log(`  Geocoded: ${(results.total - results.noState.length).toLocaleString()} (${Math.round(((results.total - results.noState.length) / results.total) * 100)}%)`);
  console.log(`  States covered: ${Object.keys(results.byState).length}`);
  
  const topStates = Object.values(results.byState)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  
  console.log(`\n🗺️  Top 5 states:`);
  for (const state of topStates) {
    console.log(`    ${state.code}: ${state.total} locations`);
  }
  
  if (results.noState.length > 0) {
    console.log(`\n⚠️  ${results.noState.length} locations could not be geocoded`);
  }
  
  process.exit(0);
} catch (err) {
  console.error(`\n✗ Geocoding failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
