// Trail Difficulty Distribution Analysis for TrailCamp
// Analyzes difficulty ratings across trail types

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Get all riding locations with difficulty and trail types
const ridingLocations = db.prepare(`
  SELECT * FROM locations 
  WHERE category = 'riding' 
    AND trail_types IS NOT NULL 
    AND trail_types != ''
  ORDER BY difficulty, trail_types
`).all();

console.log(`Analyzing ${ridingLocations.length} riding locations...\n`);

// Extract unique trail type combinations
const trailTypeSet = new Set();
const difficultySet = new Set();

for (const loc of ridingLocations) {
  const types = loc.trail_types.split(',').map(t => t.trim());
  types.forEach(t => trailTypeSet.add(t));
  if (loc.difficulty) difficultySet.add(loc.difficulty);
}

const uniqueTrailTypes = Array.from(trailTypeSet).sort();
const difficulties = Array.from(difficultySet).sort();

// Analyze primary trail type (first in the list)
const byPrimaryType = {};
const byDifficulty = {};
const byDifficultyAndType = {};

for (const loc of ridingLocations) {
  const primaryType = loc.trail_types.split(',')[0].trim();
  const diff = loc.difficulty || 'Unknown';
  
  // By primary type
  if (!byPrimaryType[primaryType]) {
    byPrimaryType[primaryType] = {
      count: 0,
      difficulties: {},
      avgDistance: 0,
      avgScenery: 0,
      totalDistance: 0,
      totalScenery: 0
    };
  }
  
  byPrimaryType[primaryType].count++;
  byPrimaryType[primaryType].difficulties[diff] = (byPrimaryType[primaryType].difficulties[diff] || 0) + 1;
  byPrimaryType[primaryType].totalDistance += loc.distance_miles || 0;
  byPrimaryType[primaryType].totalScenery += loc.scenery_rating || 0;
  
  // By difficulty
  if (!byDifficulty[diff]) {
    byDifficulty[diff] = {
      count: 0,
      types: {},
      avgDistance: 0,
      avgScenery: 0,
      totalDistance: 0,
      totalScenery: 0
    };
  }
  
  byDifficulty[diff].count++;
  byDifficulty[diff].types[primaryType] = (byDifficulty[diff].types[primaryType] || 0) + 1;
  byDifficulty[diff].totalDistance += loc.distance_miles || 0;
  byDifficulty[diff].totalScenery += loc.scenery_rating || 0;
  
  // Combined
  const key = `${diff}|${primaryType}`;
  if (!byDifficultyAndType[key]) {
    byDifficultyAndType[key] = {
      difficulty: diff,
      primaryType,
      count: 0,
      avgDistance: 0,
      avgScenery: 0,
      totalDistance: 0,
      totalScenery: 0,
      examples: []
    };
  }
  
  byDifficultyAndType[key].count++;
  byDifficultyAndType[key].totalDistance += loc.distance_miles || 0;
  byDifficultyAndType[key].totalScenery += loc.scenery_rating || 0;
  
  if (byDifficultyAndType[key].examples.length < 3) {
    byDifficultyAndType[key].examples.push({
      id: loc.id,
      name: loc.name,
      distance: loc.distance_miles,
      scenery: loc.scenery_rating
    });
  }
}

// Calculate averages
for (const type of Object.values(byPrimaryType)) {
  type.avgDistance = Math.round((type.totalDistance / type.count) * 10) / 10;
  type.avgScenery = Math.round((type.totalScenery / type.count) * 10) / 10;
  delete type.totalDistance;
  delete type.totalScenery;
}

for (const diff of Object.values(byDifficulty)) {
  diff.avgDistance = Math.round((diff.totalDistance / diff.count) * 10) / 10;
  diff.avgScenery = Math.round((diff.totalScenery / diff.count) * 10) / 10;
  delete diff.totalDistance;
  delete diff.totalScenery;
}

for (const combo of Object.values(byDifficultyAndType)) {
  combo.avgDistance = Math.round((combo.totalDistance / combo.count) * 10) / 10;
  combo.avgScenery = Math.round((combo.totalScenery / combo.count) * 10) / 10;
  delete combo.totalDistance;
  delete combo.totalScenery;
}

// Generate markdown report
let report = `# Trail Difficulty Distribution Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total Riding Locations:** ${ridingLocations.length}
- **Unique Trail Types:** ${uniqueTrailTypes.length}
- **Difficulty Levels:** ${difficulties.join(', ')}

---

## 1. Distribution by Primary Trail Type

| Trail Type | Count | Avg Distance | Avg Scenery | Difficulties |
|------------|-------|-------------|-------------|--------------|
`;

const sortedTypes = Object.entries(byPrimaryType).sort((a, b) => b[1].count - a[1].count);

for (const [type, stats] of sortedTypes) {
  const diffCounts = Object.entries(stats.difficulties)
    .sort((a, b) => b[1] - a[1])
    .map(([d, c]) => `${d}(${c})`)
    .join(', ');
  
  report += `| ${type} | ${stats.count} | ${stats.avgDistance}mi | ${stats.avgScenery}/10 | ${diffCounts} |\n`;
}

report += `\n---\n\n## 2. Distribution by Difficulty

| Difficulty | Count | Avg Distance | Avg Scenery | Top Trail Types |
|------------|-------|-------------|-------------|-----------------|
`;

const sortedDiffs = Object.entries(byDifficulty).sort((a, b) => {
  const order = { 'Easy': 1, 'Beginner': 2, 'Moderate': 3, 'Intermediate': 4, 'Hard': 5, 'Advanced': 6, 'Expert': 7 };
  return (order[a[0]] || 99) - (order[b[0]] || 99);
});

for (const [diff, stats] of sortedDiffs) {
  const topTypes = Object.entries(stats.types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, c]) => `${t}(${c})`)
    .join(', ');
  
  report += `| ${diff} | ${stats.count} | ${stats.avgDistance}mi | ${stats.avgScenery}/10 | ${topTypes} |\n`;
}

report += `\n---\n\n## 3. Coverage Matrix

Showing count of trails for each Difficulty × Trail Type combination:

| Trail Type | Easy | Beginner | Moderate | Intermediate | Hard | Advanced | Expert |
|------------|------|----------|----------|-------------|------|----------|--------|
`;

for (const type of sortedTypes.map(([t]) => t).slice(0, 15)) {
  const row = [type];
  for (const diff of ['Easy', 'Beginner', 'Moderate', 'Intermediate', 'Hard', 'Advanced', 'Expert']) {
    const key = `${diff}|${type}`;
    const count = byDifficultyAndType[key]?.count || 0;
    row.push(count === 0 ? '-' : count.toString());
  }
  report += `| ${row.join(' | ')} |\n`;
}

report += `\n---\n\n## 4. Gap Analysis

### Trail Types with Limited Difficulty Variety

`;

const gaps = [];

for (const [type, stats] of sortedTypes) {
  const diffCount = Object.keys(stats.difficulties).length;
  if (stats.count >= 10 && diffCount <= 2) {
    gaps.push({
      type,
      count: stats.count,
      difficultyVariety: diffCount,
      difficulties: Object.keys(stats.difficulties).join(', ')
    });
  }
}

if (gaps.length > 0) {
  report += `| Trail Type | Count | Difficulty Variety | Current Difficulties |\n`;
  report += `|------------|-------|-------------------|---------------------|\n`;
  
  for (const gap of gaps) {
    report += `| ${gap.type} | ${gap.count} | ${gap.difficultyVariety} levels | ${gap.difficulties} |\n`;
  }
  
  report += `\n**Recommendation:** Add more difficulty variety to these popular trail types.\n`;
} else {
  report += `✅ No significant gaps found. Most trail types have good difficulty variety.\n`;
}

report += `\n### Underrepresented Combinations

Top trail types that could use more locations at specific difficulty levels:

`;

// Find combinations that should exist but have low counts
const recommendations = [];

for (const type of sortedTypes.slice(0, 10).map(([t]) => t)) {
  for (const diff of ['Easy', 'Moderate', 'Hard']) {
    const key = `${diff}|${type}`;
    const count = byDifficultyAndType[key]?.count || 0;
    
    if (count < 5 && byPrimaryType[type].count >= 20) {
      recommendations.push({
        type,
        difficulty: diff,
        currentCount: count,
        totalTypeCount: byPrimaryType[type].count
      });
    }
  }
}

if (recommendations.length > 0) {
  recommendations.sort((a, b) => a.currentCount - b.currentCount);
  
  report += `| Trail Type | Difficulty | Current Count | Total ${' '.repeat(10)}|\n`;
  report += `|------------|------------|--------------|-------|\n`;
  
  for (const rec of recommendations.slice(0, 10)) {
    report += `| ${rec.type} | ${rec.difficulty} | ${rec.currentCount} | ${rec.totalTypeCount} |\n`;
  }
  
  report += `\n**Recommendation:** Add ${recommendations.slice(0, 5).map(r => `${r.difficulty} ${r.type}`).join(', ')} locations.\n`;
}

report += `\n---\n\n## 5. Quality Metrics

### Highest Scenery by Difficulty

`;

for (const diff of ['Easy', 'Moderate', 'Hard', 'Expert']) {
  const trails = ridingLocations
    .filter(l => l.difficulty === diff && l.scenery_rating >= 8)
    .sort((a, b) => b.scenery_rating - a.scenery_rating)
    .slice(0, 3);
  
  if (trails.length > 0) {
    report += `\n**${diff}:**\n`;
    for (const trail of trails) {
      report += `- ${trail.name} (${trail.scenery_rating}/10) - ${trail.trail_types}\n`;
    }
  }
}

report += `\n---\n\n## 6. Data Quality Notes

`;

// Check for locations missing difficulty
const missingDifficulty = db.prepare(`
  SELECT COUNT(*) as count 
  FROM locations 
  WHERE category = 'riding' 
    AND (difficulty IS NULL OR difficulty = '')
`).get();

if (missingDifficulty.count > 0) {
  report += `⚠️ **${missingDifficulty.count} riding locations missing difficulty rating**\n\n`;
} else {
  report += `✅ All riding locations have difficulty ratings\n\n`;
}

// Check for trail_types consistency
const withTypes = db.prepare(`SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND trail_types IS NOT NULL AND trail_types != ''`).get();
const total = db.prepare(`SELECT COUNT(*) as count FROM locations WHERE category = 'riding'`).get();

report += `✅ ${withTypes.count} / ${total.count} riding locations have trail types (${Math.round((withTypes.count / total.count) * 100)}%)\n`;

report += `\n---\n\n*Report generated by analyze-difficulty.js*\n`;

// Save report
fs.writeFileSync('./DIFFICULTY-REPORT.md', report);
console.log('✅ Difficulty distribution report generated!');
console.log('📄 Saved to: DIFFICULTY-REPORT.md\n');

// Print summary to console
console.log('📊 Quick Summary:');
console.log('─'.repeat(60));
console.log(`Top 5 Trail Types (by count):`);
sortedTypes.slice(0, 5).forEach(([type, stats], i) => {
  console.log(`  ${i + 1}. ${type}: ${stats.count} trails, ${stats.avgDistance}mi avg, ${stats.avgScenery}/10 scenery`);
});

console.log(`\nDifficulty Distribution:`);
sortedDiffs.forEach(([diff, stats]) => {
  console.log(`  ${diff}: ${stats.count} trails (${Math.round((stats.count / ridingLocations.length) * 100)}%)`);
});

console.log(`\nGaps found: ${gaps.length} trail types with limited difficulty variety`);
console.log(`Recommendations: ${recommendations.length} underrepresented combinations`);

db.close();
