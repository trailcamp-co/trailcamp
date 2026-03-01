#!/usr/bin/env node
// Advanced Data Integrity Validator for TrailCamp
// Goes beyond basic checks to validate business logic and relationships

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Running advanced data integrity validation...\n');

const results = {
  critical: [],
  warning: [],
  info: [],
  passed: []
};

function addResult(level, check, message, count = null, sql = null) {
  const result = { check, message, count, sql };
  results[level].push(result);
}

// 1. Cross-Reference Validation
console.log('━━━ 1. Cross-Reference Validation ━━━');

// Trip stops with invalid location IDs
const orphanedStops = db.prepare(`
  SELECT COUNT(*) as count FROM trip_stops 
  WHERE location_id NOT IN (SELECT id FROM locations)
`).get();

if (orphanedStops.count > 0) {
  addResult('critical', 'Trip Stops → Locations', 
    `${orphanedStops.count} trip stops point to non-existent locations`,
    orphanedStops.count,
    'DELETE FROM trip_stops WHERE location_id NOT IN (SELECT id FROM locations);'
  );
} else {
  addResult('passed', 'Trip Stops → Locations', 'All trip stops reference valid locations');
}

// Trip stops with invalid trip IDs
const orphanedTrips = db.prepare(`
  SELECT COUNT(*) as count FROM trip_stops 
  WHERE trip_id NOT IN (SELECT id FROM trips)
`).get();

if (orphanedTrips.count > 0) {
  addResult('critical', 'Trip Stops → Trips',
    `${orphanedTrips.count} trip stops point to non-existent trips`,
    orphanedTrips.count,
    'DELETE FROM trip_stops WHERE trip_id NOT IN (SELECT id FROM trips);'
  );
} else {
  addResult('passed', 'Trip Stops → Trips', 'All trip stops reference valid trips');
}

// 2. Business Logic Validation
console.log('━━━ 2. Business Logic Validation ━━━');

// Riding locations without trail types or difficulty
const ridingMissingData = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE category = 'riding' 
    AND (trail_types IS NULL OR trail_types = '')
    AND (difficulty IS NULL OR difficulty = '')
`).get();

if (ridingMissingData.count > 0) {
  addResult('warning', 'Riding Data Completeness',
    `${ridingMissingData.count} riding locations missing both trail types AND difficulty`,
    ridingMissingData.count,
    "SELECT id, name FROM locations WHERE category = 'riding' AND (trail_types IS NULL OR trail_types = '') AND (difficulty IS NULL OR difficulty = '');"
  );
} else {
  addResult('passed', 'Riding Data Completeness', 'All riding locations have trail types or difficulty');
}

// Campsites with cost but missing sub_type
const campsiteMissingSubtype = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE category = 'campsite' 
    AND cost_per_night IS NOT NULL
    AND (sub_type IS NULL OR sub_type = '')
`).get();

if (campsiteMissingSubtype.count > 0) {
  addResult('warning', 'Campsite Categorization',
    `${campsiteMissingSubtype.count} campsites have cost data but missing sub_type`,
    campsiteMissingSubtype.count
  );
} else {
  addResult('passed', 'Campsite Categorization', 'All campsites with costs have sub_type');
}

// Boondocking with cost > $50 (likely data error)
const expensiveBoondocking = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE category = 'campsite' 
    AND sub_type = 'boondocking'
    AND cost_per_night > 50
`).get();

if (expensiveBoondocking.count > 0) {
  addResult('warning', 'Suspicious Boondocking Costs',
    `${expensiveBoondocking.count} boondocking sites cost >$50/night (suspicious)`,
    expensiveBoondocking.count,
    "SELECT id, name, cost_per_night FROM locations WHERE category = 'campsite' AND sub_type = 'boondocking' AND cost_per_night > 50;"
  );
} else {
  addResult('passed', 'Boondocking Costs', 'All boondocking costs are reasonable');
}

// Trails with distance but no difficulty
const trailsNoDifficulty = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE category = 'riding' 
    AND distance_miles > 0
    AND (difficulty IS NULL OR difficulty = '')
`).get();

if (trailsNoDifficulty.count > 0) {
  addResult('info', 'Trail Difficulty Missing',
    `${trailsNoDifficulty.count} riding locations have distance but no difficulty rating`,
    trailsNoDifficulty.count
  );
} else {
  addResult('passed', 'Trail Difficulty', 'All trails with distance have difficulty ratings');
}

// 3. Data Consistency
console.log('━━━ 3. Data Consistency Checks ━━━');

// Negative values where they shouldn't exist
const negativeValues = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE distance_miles < 0 
     OR cost_per_night < 0 
     OR stay_limit_days < 0
     OR scenery_rating < 0
`).get();

if (negativeValues.count > 0) {
  addResult('critical', 'Negative Values',
    `${negativeValues.count} locations have negative values in numeric fields`,
    negativeValues.count,
    "SELECT id, name, distance_miles, cost_per_night, stay_limit_days, scenery_rating FROM locations WHERE distance_miles < 0 OR cost_per_night < 0 OR stay_limit_days < 0 OR scenery_rating < 0;"
  );
} else {
  addResult('passed', 'Negative Values', 'No negative values in numeric fields');
}

// Scenery ratings outside 1-10 range
const invalidScenery = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE scenery_rating IS NOT NULL 
    AND (scenery_rating < 1 OR scenery_rating > 10)
`).get();

if (invalidScenery.count > 0) {
  addResult('warning', 'Scenery Rating Range',
    `${invalidScenery.count} locations have scenery ratings outside 1-10`,
    invalidScenery.count,
    "UPDATE locations SET scenery_rating = CASE WHEN scenery_rating < 1 THEN 1 WHEN scenery_rating > 10 THEN 10 END WHERE scenery_rating < 1 OR scenery_rating > 10;"
  );
} else {
  addResult('passed', 'Scenery Rating Range', 'All scenery ratings are 1-10');
}

// Stay limits > 1 year (365 days)
const longStayLimits = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE stay_limit_days > 365
`).get();

if (longStayLimits.count > 0) {
  addResult('warning', 'Stay Limit Duration',
    `${longStayLimits.count} locations have stay limits > 365 days (suspicious)`,
    longStayLimits.count
  );
} else {
  addResult('passed', 'Stay Limit Duration', 'All stay limits are <= 365 days');
}

// 4. Required Field Combinations
console.log('━━━ 4. Required Field Combinations ━━━');

// Permit required but no permit info
const permitMissingInfo = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE permit_required = 1 
    AND (permit_info IS NULL OR permit_info = '')
`).get();

if (permitMissingInfo.count > 0) {
  addResult('warning', 'Permit Information',
    `${permitMissingInfo.count} locations require permits but missing permit_info`,
    permitMissingInfo.count,
    "SELECT id, name FROM locations WHERE permit_required = 1 AND (permit_info IS NULL OR permit_info = '');"
  );
} else {
  addResult('passed', 'Permit Information', 'All permit-required locations have permit details');
}

// Water nearby but not on-site (should have water_nearby = 1)
const waterLogic = db.prepare(`
  SELECT COUNT(*) as count FROM locations 
  WHERE water_available = 0 
    AND water_nearby = 0
    AND category = 'campsite'
    AND sub_type != 'boondocking'
`).get();

if (waterLogic.count > 0) {
  addResult('info', 'Water Availability',
    `${waterLogic.count} non-boondocking campsites have no water info`,
    waterLogic.count
  );
} else {
  addResult('passed', 'Water Availability', 'Water info is logical');
}

// 5. Duplicate Detection (Advanced)
console.log('━━━ 5. Advanced Duplicate Detection ━━━');

// Exact same name + coordinates
const exactDuplicates = db.prepare(`
  SELECT name, latitude, longitude, COUNT(*) as count
  FROM locations
  GROUP BY name, latitude, longitude
  HAVING COUNT(*) > 1
`).all();

if (exactDuplicates.length > 0) {
  addResult('critical', 'Exact Duplicates',
    `${exactDuplicates.length} groups of locations with identical name + coordinates`,
    exactDuplicates.length,
    `-- Review these duplicates:\n` + exactDuplicates.map(d => 
      `SELECT id, name FROM locations WHERE name = '${d.name.replace(/'/g, "''")}' AND latitude = ${d.latitude} AND longitude = ${d.longitude};`
    ).join('\n')
  );
} else {
  addResult('passed', 'Exact Duplicates', 'No exact duplicates (same name + coordinates)');
}

// Very close coordinates with similar names (within 0.001 degrees ~ 300ft)
const nearDuplicates = db.prepare(`
  SELECT 
    l1.id as id1, 
    l1.name as name1,
    l2.id as id2,
    l2.name as name2,
    ABS(l1.latitude - l2.latitude) + ABS(l1.longitude - l2.longitude) as distance
  FROM locations l1
  JOIN locations l2 ON l1.id < l2.id
  WHERE ABS(l1.latitude - l2.latitude) < 0.001
    AND ABS(l1.longitude - l2.longitude) < 0.001
    AND l1.category = l2.category
  ORDER BY distance
  LIMIT 20
`).all();

if (nearDuplicates.length > 0) {
  addResult('info', 'Potential Near-Duplicates',
    `${nearDuplicates.length} pairs of locations within ~300 feet (may be legitimate)`,
    nearDuplicates.length
  );
} else {
  addResult('passed', 'Near-Duplicates', 'No suspicious near-duplicate locations');
}

// 6. Database Integrity
console.log('━━━ 6. Database Integrity ━━━');

const integrityCheck = db.prepare('PRAGMA integrity_check').get();
if (integrityCheck.integrity_check === 'ok') {
  addResult('passed', 'SQLite Integrity', 'Database integrity check passed');
} else {
  addResult('critical', 'SQLite Integrity',
    'Database integrity check FAILED - database may be corrupted',
    null,
    'Run: sqlite3 trailcamp.db ".recover" > recovered.sql'
  );
}

// Foreign key check
const foreignKeyCheck = db.prepare('PRAGMA foreign_key_check').all();
if (foreignKeyCheck.length === 0) {
  addResult('passed', 'Foreign Keys', 'All foreign key constraints valid');
} else {
  addResult('critical', 'Foreign Keys',
    `${foreignKeyCheck.length} foreign key constraint violations`,
    foreignKeyCheck.length
  );
}

// Generate report
console.log('\n' + '='.repeat(70));
console.log('VALIDATION REPORT');
console.log('='.repeat(70));

const totalIssues = results.critical.length + results.warning.length;
const totalChecks = results.critical.length + results.warning.length + results.info.length + results.passed.length;

console.log(`\nTotal checks: ${totalChecks}`);
console.log(`Passed: ${results.passed.length}`);
console.log(`Info: ${results.info.length}`);
console.log(`Warnings: ${results.warning.length}`);
console.log(`Critical: ${results.critical.length}`);

if (results.critical.length > 0) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log('🚨 CRITICAL ISSUES:\n');
  for (const r of results.critical) {
    console.log(`✗ ${r.check}: ${r.message}`);
    if (r.sql) {
      console.log(`  Fix: ${r.sql.split('\n')[0]}`);
    }
    console.log('');
  }
}

if (results.warning.length > 0) {
  console.log(`${'─'.repeat(70)}`);
  console.log('⚠️  WARNINGS:\n');
  for (const r of results.warning) {
    console.log(`⚠ ${r.check}: ${r.message}`);
    if (r.sql && r.sql.length < 200) {
      console.log(`  Check: ${r.sql.split('\n')[0]}`);
    }
    console.log('');
  }
}

if (results.info.length > 0) {
  console.log(`${'─'.repeat(70)}`);
  console.log('ℹ️  INFORMATION:\n');
  for (const r of results.info) {
    console.log(`ℹ ${r.check}: ${r.message}`);
    console.log('');
  }
}

console.log('='.repeat(70));

if (totalIssues === 0) {
  console.log('\n✅ ALL VALIDATION CHECKS PASSED\n');
} else {
  console.log(`\n⚠️  Found ${totalIssues} issues that need attention\n`);
}

// Save detailed report
const reportPath = './integrity-validation-report.json';
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(`📄 Detailed report saved to: ${reportPath}\n`);

db.close();
process.exit(totalIssues > 0 ? 1 : 0);
