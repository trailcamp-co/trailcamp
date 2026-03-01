#!/usr/bin/env node
// Advanced Data Integrity Validator for TrailCamp
// Goes beyond basic validation with semantic and cross-reference checks

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

const issues = {
  critical: [],
  warning: [],
  info: []
};

console.log('Running advanced data integrity validation...\n');

// 1. Semantic Consistency Checks
console.log('━━━ Semantic Consistency ━━━');

// Check: Riding locations should have trail_types
const ridingNoTypes = db.prepare(`
  SELECT id, name FROM locations 
  WHERE category = 'riding' 
    AND (trail_types IS NULL OR trail_types = '')
`).all();

if (ridingNoTypes.length > 0) {
  issues.warning.push({
    check: 'Riding locations missing trail_types',
    count: ridingNoTypes.length,
    examples: ridingNoTypes.slice(0, 5).map(l => `[${l.id}] ${l.name}`)
  });
}

// Check: High scenery (9-10) but generic/missing description
const highSceneryNoDesc = db.prepare(`
  SELECT id, name, scenery_rating, description FROM locations 
  WHERE scenery_rating >= 9 
    AND (description IS NULL OR LENGTH(description) < 50)
`).all();

if (highSceneryNoDesc.length > 0) {
  issues.info.push({
    check: 'High scenery locations with minimal description',
    count: highSceneryNoDesc.length,
    examples: highSceneryNoDesc.slice(0, 5).map(l => `[${l.id}] ${l.name} (${l.scenery_rating}/10)`)
  });
}

// Check: Campsites without sub_type
const campsiteNoSubtype = db.prepare(`
  SELECT id, name FROM locations 
  WHERE category = 'campsite' 
    AND (sub_type IS NULL OR sub_type = '')
`).all();

if (campsiteNoSubtype.length > 0) {
  issues.warning.push({
    check: 'Campsites missing sub_type',
    count: campsiteNoSubtype.length,
    examples: campsiteNoSubtype.slice(0, 5).map(l => `[${l.id}] ${l.name}`)
  });
}

// 2. Cross-Reference Integrity
console.log('━━━ Cross-Reference Integrity ━━━');

// Check: Orphaned trip stops
const orphanedStops = db.prepare(`
  SELECT ts.id, ts.trip_id, ts.location_id 
  FROM trip_stops ts
  LEFT JOIN trips t ON ts.trip_id = t.id
  WHERE t.id IS NULL
`).all();

if (orphanedStops.length > 0) {
  issues.critical.push({
    check: 'Orphaned trip stops (trip does not exist)',
    count: orphanedStops.length,
    examples: orphanedStops.slice(0, 5).map(s => `Stop ${s.id} references missing trip ${s.trip_id}`)
  });
}

// Check: Trip stops with invalid location IDs
const invalidLocationStops = db.prepare(`
  SELECT ts.id, ts.location_id 
  FROM trip_stops ts
  LEFT JOIN locations l ON ts.location_id = l.id
  WHERE l.id IS NULL
`).all();

if (invalidLocationStops.length > 0) {
  issues.critical.push({
    check: 'Trip stops referencing non-existent locations',
    count: invalidLocationStops.length,
    examples: invalidLocationStops.slice(0, 5).map(s => `Stop ${s.id} references missing location ${s.location_id}`)
  });
}

// 3. Logical Consistency
console.log('━━━ Logical Consistency ━━━');

// Check: Free camping (cost = 0) marked as campground instead of boondocking
const freeCampgrounds = db.prepare(`
  SELECT id, name, sub_type, cost_per_night FROM locations 
  WHERE category = 'campsite' 
    AND cost_per_night = 0 
    AND sub_type != 'boondocking'
    AND sub_type IS NOT NULL
`).all();

if (freeCampgrounds.length > 0) {
  issues.info.push({
    check: 'Free campsites not marked as boondocking',
    count: freeCampgrounds.length,
    examples: freeCampgrounds.slice(0, 5).map(l => `[${l.id}] ${l.name} (${l.sub_type}, $0)`)
  });
}

// Check: Permit required but no permit_info
const permitNoInfo = db.prepare(`
  SELECT id, name FROM locations 
  WHERE permit_required = 1 
    AND (permit_info IS NULL OR permit_info = '')
`).all();

if (permitNoInfo.length > 0) {
  issues.warning.push({
    check: 'Permit required but missing permit_info',
    count: permitNoInfo.length,
    examples: permitNoInfo.slice(0, 5).map(l => `[${l.id}] ${l.name}`)
  });
}

// Check: Very long distances (> 1000 miles) - possible data entry error
const extremeDistances = db.prepare(`
  SELECT id, name, distance_miles FROM locations 
  WHERE distance_miles > 1000
`).all();

if (extremeDistances.length > 0) {
  issues.info.push({
    check: 'Trails with extreme distances (> 1000 miles)',
    count: extremeDistances.length,
    examples: extremeDistances.map(l => `[${l.id}] ${l.name} (${l.distance_miles}mi)`)
  });
}

// Check: Very high costs (> $200/night) - possible error
const extremeCosts = db.prepare(`
  SELECT id, name, cost_per_night FROM locations 
  WHERE cost_per_night > 200
`).all();

if (extremeCosts.length > 0) {
  issues.warning.push({
    check: 'Extreme camping costs (> $200/night)',
    count: extremeCosts.length,
    examples: extremeCosts.map(l => `[${l.id}] ${l.name} ($${l.cost_per_night})`)
  });
}

// 4. Data Completeness
console.log('━━━ Data Completeness ━━━');

// Check: Riding locations missing difficulty
const ridingNoDifficulty = db.prepare(`
  SELECT id, name FROM locations 
  WHERE category = 'riding' 
    AND (difficulty IS NULL OR difficulty = '')
`).all();

if (ridingNoDifficulty.length > 0) {
  issues.info.push({
    check: 'Riding locations missing difficulty rating',
    count: ridingNoDifficulty.length,
    examples: ridingNoDifficulty.slice(0, 5).map(l => `[${l.id}] ${l.name}`)
  });
}

// Check: Locations missing scenery ratings
const noScenery = db.prepare(`
  SELECT id, name, category FROM locations 
  WHERE scenery_rating IS NULL
`).all();

if (noScenery.length > 0) {
  issues.warning.push({
    check: 'Locations missing scenery ratings',
    count: noScenery.length,
    examples: noScenery.slice(0, 5).map(l => `[${l.id}] ${l.name} (${l.category})`)
  });
}

// Check: Riding locations missing distance
const ridingNoDistance = db.prepare(`
  SELECT id, name FROM locations 
  WHERE category = 'riding' 
    AND (distance_miles IS NULL OR distance_miles = 0)
`).all();

if (ridingNoDistance.length > 0) {
  issues.info.push({
    check: 'Riding locations missing distance',
    count: ridingNoDistance.length,
    examples: ridingNoDistance.slice(0, 5).map(l => `[${l.id}] ${l.name}`)
  });
}

// 5. Pattern Anomalies
console.log('━━━ Pattern Anomalies ━━━');

// Check: Boondocking with high costs (should be free or low)
const expensiveBoondocking = db.prepare(`
  SELECT id, name, cost_per_night FROM locations 
  WHERE sub_type = 'boondocking' 
    AND cost_per_night > 20
`).all();

if (expensiveBoondocking.length > 0) {
  issues.warning.push({
    check: 'Expensive boondocking (> $20/night)',
    count: expensiveBoondocking.length,
    examples: expensiveBoondocking.map(l => `[${l.id}] ${l.name} ($${l.cost_per_night})`)
  });
}

// Check: Locations with identical names (potential duplicates)
const duplicateNames = db.prepare(`
  SELECT name, COUNT(*) as count 
  FROM locations 
  GROUP BY name 
  HAVING count > 1
  ORDER BY count DESC
`).all();

if (duplicateNames.length > 0) {
  issues.info.push({
    check: 'Locations with identical names',
    count: duplicateNames.length,
    examples: duplicateNames.slice(0, 5).map(d => `"${d.name}" (${d.count} instances)`)
  });
}

// Print results
console.log('\n' + '='.repeat(70));
console.log('DATA INTEGRITY VALIDATION REPORT');
console.log('='.repeat(70));

const totalIssues = issues.critical.length + issues.warning.length + issues.info.length;

console.log(`\n🚨 Critical: ${issues.critical.length}`);
console.log(`⚠️  Warning:  ${issues.warning.length}`);
console.log(`ℹ️  Info:     ${issues.info.length}`);
console.log(`━━ Total:    ${totalIssues}\n`);

if (issues.critical.length > 0) {
  console.log('🚨 CRITICAL ISSUES:\n');
  for (const issue of issues.critical) {
    console.log(`  ${issue.check} (${issue.count})`);
    for (const ex of issue.examples) {
      console.log(`    - ${ex}`);
    }
    console.log('');
  }
}

if (issues.warning.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  for (const issue of issues.warning) {
    console.log(`  ${issue.check} (${issue.count})`);
    for (const ex of issue.examples.slice(0, 3)) {
      console.log(`    - ${ex}`);
    }
    if (issue.count > 3) {
      console.log(`    ... and ${issue.count - 3} more`);
    }
    console.log('');
  }
}

if (issues.info.length > 0) {
  console.log('ℹ️  INFORMATIONAL:\n');
  for (const issue of issues.info) {
    console.log(`  ${issue.check} (${issue.count})`);
    if (issue.count <= 10) {
      for (const ex of issue.examples) {
        console.log(`    - ${ex}`);
      }
    } else {
      for (const ex of issue.examples.slice(0, 3)) {
        console.log(`    - ${ex}`);
      }
      console.log(`    ... and ${issue.count - 3} more`);
    }
    console.log('');
  }
}

console.log('='.repeat(70));

if (totalIssues === 0) {
  console.log('\n✅ No integrity issues found! Database is in excellent shape.\n');
} else {
  console.log(`\n📋 ${totalIssues} issues found. Review and address as needed.\n`);
}

// Generate detailed JSON report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    critical: issues.critical.length,
    warning: issues.warning.length,
    info: issues.info.length,
    total: totalIssues
  },
  issues: {
    critical: issues.critical,
    warning: issues.warning,
    info: issues.info
  }
};

fs.writeFileSync('./integrity-report.json', JSON.stringify(report, null, 2));
console.log('📄 Detailed report saved to: integrity-report.json\n');

db.close();

process.exit(totalIssues > 0 ? 1 : 0);
