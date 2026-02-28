// Advanced Duplicate Detection for TrailCamp
// Uses fuzzy string matching to find potential near-duplicates

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Levenshtein distance implementation
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

// Calculate similarity ratio (0-1, higher is more similar)
function similarityRatio(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - (distance / maxLength);
}

// Calculate distance between two coordinates in miles
function distanceMiles(lat1, lon1, lat2, lon2) {
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

// Normalize location names for comparison
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\b(state park|sp|national forest|nf|ohv area|recreation area|campground|cg)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

console.log('Finding potential duplicate locations...\n');

const locations = db.prepare('SELECT * FROM locations ORDER BY name').all();

console.log(`Analyzing ${locations.length} locations...\n`);

const duplicateSets = [];
const exactCoordDuplicates = [];
const sameName = [];
const fuzzyMatches = [];

// 1. Find exact coordinate duplicates
console.log('━━━ 1. Exact Coordinate Duplicates ━━━');
const coordMap = new Map();

for (const loc of locations) {
  const key = `${loc.latitude.toFixed(6)},${loc.longitude.toFixed(6)}`;
  if (!coordMap.has(key)) {
    coordMap.set(key, []);
  }
  coordMap.get(key).push(loc);
}

for (const [coords, locs] of coordMap.entries()) {
  if (locs.length > 1) {
    exactCoordDuplicates.push({
      coords,
      count: locs.length,
      locations: locs.map(l => ({ id: l.id, name: l.name, category: l.category }))
    });
  }
}

console.log(`Found ${exactCoordDuplicates.length} coordinate groups with multiple locations\n`);

// 2. Find same name, different coordinates
console.log('━━━ 2. Same Name, Different Coordinates ━━━');
const nameMap = new Map();

for (const loc of locations) {
  const normalized = normalizeName(loc.name);
  if (!nameMap.has(normalized)) {
    nameMap.set(normalized, []);
  }
  nameMap.get(normalized).push(loc);
}

for (const [name, locs] of nameMap.entries()) {
  if (locs.length > 1) {
    // Check if coordinates are different
    const coords = locs.map(l => `${l.latitude},${l.longitude}`);
    const uniqueCoords = new Set(coords);
    
    if (uniqueCoords.size > 1) {
      sameName.push({
        normalizedName: name,
        count: locs.length,
        locations: locs.map(l => ({
          id: l.id,
          name: l.name,
          category: l.category,
          lat: l.latitude.toFixed(4),
          lon: l.longitude.toFixed(4)
        }))
      });
    }
  }
}

console.log(`Found ${sameName.length} name groups with different coordinates\n`);

// 3. Fuzzy name matching (similar names + nearby coordinates)
console.log('━━━ 3. Fuzzy Name Matching (Similar Names + Nearby) ━━━');

const SIMILARITY_THRESHOLD = 0.85;  // 85% similar
const DISTANCE_THRESHOLD = 5;  // Within 5 miles

for (let i = 0; i < locations.length; i++) {
  for (let j = i + 1; j < locations.length; j++) {
    const loc1 = locations[i];
    const loc2 = locations[j];
    
    const similarity = similarityRatio(loc1.name, loc2.name);
    const distance = distanceMiles(loc1.latitude, loc1.longitude, loc2.latitude, loc2.longitude);
    
    if (similarity >= SIMILARITY_THRESHOLD && distance <= DISTANCE_THRESHOLD && loc1.id !== loc2.id) {
      fuzzyMatches.push({
        similarity: Math.round(similarity * 100),
        distance: Math.round(distance * 10) / 10,
        location1: {
          id: loc1.id,
          name: loc1.name,
          category: loc1.category,
          coords: `${loc1.latitude.toFixed(4)}, ${loc1.longitude.toFixed(4)}`
        },
        location2: {
          id: loc2.id,
          name: loc2.name,
          category: loc2.category,
          coords: `${loc2.latitude.toFixed(4)}, ${loc2.longitude.toFixed(4)}`
        }
      });
    }
  }
}

console.log(`Found ${fuzzyMatches.length} fuzzy matches (>${SIMILARITY_THRESHOLD * 100}% similar, <${DISTANCE_THRESHOLD}mi apart)\n`);

// Generate markdown report
let report = `# Duplicate Detection Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total locations analyzed:** ${locations.length}
- **Exact coordinate duplicates:** ${exactCoordDuplicates.length} groups
- **Same name, different coordinates:** ${sameName.length} groups
- **Fuzzy name matches:** ${fuzzyMatches.length} pairs

---

## 1. Exact Coordinate Duplicates

Locations with identical coordinates (likely legitimate co-located facilities):

`;

if (exactCoordDuplicates.length > 0) {
  exactCoordDuplicates.sort((a, b) => b.count - a.count);
  
  for (const dup of exactCoordDuplicates.slice(0, 20)) {
    report += `\n### Coordinates: ${dup.coords} (${dup.count} locations)\n\n`;
    for (const loc of dup.locations) {
      report += `- **[${loc.id}]** ${loc.name} (${loc.category})\n`;
    }
  }
  
  report += `\n**Analysis:** These are likely legitimate (e.g., multiple campgrounds in same park complex). Review if names are identical.\n`;
} else {
  report += `✅ No exact coordinate duplicates found.\n`;
}

report += `\n---\n\n## 2. Same Name, Different Coordinates\n\n`;
report += `Locations with similar normalized names but different coordinates (potential duplicates):\n\n`;

if (sameName.length > 0) {
  sameName.sort((a, b) => b.count - a.count);
  
  for (const dup of sameName.slice(0, 20)) {
    report += `\n### "${dup.normalizedName}" (${dup.count} locations)\n\n`;
    for (const loc of dup.locations) {
      report += `- **[${loc.id}]** ${loc.name} - (${loc.lat}, ${loc.lon}) - ${loc.category}\n`;
    }
  }
  
  report += `\n⚠️ **Action Required:** Review these manually. Likely represent:\n`;
  report += `- Different trailheads/areas within same park\n`;
  report += `- Legitimate separate locations with similar names\n`;
  report += `- True duplicates that should be merged\n`;
} else {
  report += `✅ No same-name groups found.\n`;
}

report += `\n---\n\n## 3. Fuzzy Name Matches\n\n`;
report += `Locations with similar names (>${SIMILARITY_THRESHOLD * 100}% match) within ${DISTANCE_THRESHOLD} miles:\n\n`;

if (fuzzyMatches.length > 0) {
  fuzzyMatches.sort((a, b) => b.similarity - a.similarity);
  
  report += `| Similarity | Distance | Location 1 | Location 2 |\n`;
  report += `|-----------|----------|------------|------------|\n`;
  
  for (const match of fuzzyMatches.slice(0, 30)) {
    report += `| ${match.similarity}% | ${match.distance}mi | `;
    report += `**[${match.location1.id}]** ${match.location1.name}<br>(${match.location1.coords}) | `;
    report += `**[${match.location2.id}]** ${match.location2.name}<br>(${match.location2.coords}) |\n`;
  }
  
  report += `\n⚠️ **Action Required:** High-priority review. These are likely duplicates or near-duplicates.\n`;
} else {
  report += `✅ No fuzzy matches found.\n`;
}

report += `\n---\n\n## Recommendations\n\n`;

if (fuzzyMatches.length > 0) {
  report += `### High Priority\n`;
  report += `1. Review fuzzy matches (${fuzzyMatches.length} pairs) - these are most likely true duplicates\n`;
  report += `2. For each pair, determine:\n`;
  report += `   - Are they the same location? → Merge (keep better data)\n`;
  report += `   - Different trailheads/areas? → Update names to differentiate\n\n`;
}

if (sameName.length > 10) {
  report += `### Medium Priority\n`;
  report += `1. Review same-name groups (${sameName.length} groups)\n`;
  report += `2. Add clarifying details to names (e.g., "North" vs "South" campground)\n\n`;
}

report += `### Cleanup SQL Template\n\n`;
report += `\`\`\`sql\n`;
report += `-- Delete duplicate (keep ID with better data)\n`;
report += `DELETE FROM locations WHERE id = <duplicate_id>;\n\n`;
report += `-- Update name to differentiate\n`;
report += `UPDATE locations SET name = 'Name - Clarification' WHERE id = <location_id>;\n`;
report += `\`\`\`\n\n`;

report += `---\n\n## Data Quality Notes\n\n`;
report += `- **Exact coordinate duplicates** are usually legitimate (multiple facilities at same location)\n`;
report += `- **Same name, different coordinates** need case-by-case review\n`;
report += `- **Fuzzy matches** with high similarity (>90%) are prime duplicate candidates\n`;
report += `- Consider distance + name similarity + category match when deciding\n\n`;

report += `*Report generated by find-duplicates.js*\n`;

// Save report
fs.writeFileSync('./DUPLICATE-DETECTION.md', report);
console.log('✅ Duplicate detection complete!');
console.log(`📄 Report saved to: DUPLICATE-DETECTION.md\n`);

console.log('📊 Summary:');
console.log(`  Exact coordinate duplicates: ${exactCoordDuplicates.length}`);
console.log(`  Same name groups: ${sameName.length}`);
console.log(`  Fuzzy matches: ${fuzzyMatches.length}`);

if (fuzzyMatches.length > 0) {
  console.log(`\n⚠️  ${fuzzyMatches.length} fuzzy matches found - manual review recommended`);
}

db.close();
