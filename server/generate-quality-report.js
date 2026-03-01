#!/usr/bin/env node
// Automated Data Quality Report Generator for TrailCamp
// Generates weekly quality metrics with trend tracking

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });
const REPORT_DIR = './reports';
const TIMESTAMP = new Date().toISOString().split('T')[0];

// Ensure reports directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

console.log('Generating data quality report...\n');

// Run quality checks
function runChecks() {
  const checks = [];

  // 1. Required fields
  checks.push({
    name: 'All locations have names',
    category: 'required',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE name IS NULL OR name = ''").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  checks.push({
    name: 'All locations have coordinates',
    category: 'required',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE latitude IS NULL OR longitude IS NULL").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  checks.push({
    name: 'All locations have categories',
    category: 'required',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE category IS NULL OR category = ''").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  // 2. Coordinate validity
  checks.push({
    name: 'Latitudes in valid range',
    category: 'integrity',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE latitude < -90 OR latitude > 90").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  checks.push({
    name: 'Longitudes in valid range',
    category: 'integrity',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE longitude < -180 OR longitude > 180").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  // 3. Data completeness
  const total = db.prepare("SELECT COUNT(*) as c FROM locations").get().c;
  const ridingTotal = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'riding'").get().c;
  const campsiteTotal = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'campsite'").get().c;

  const sceneryCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE scenery_rating IS NOT NULL").get().c;
  const stateCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE state IS NOT NULL AND state != ''").get().c;
  const trailTypesCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'riding' AND trail_types IS NOT NULL AND trail_types != ''").get().c;
  const difficultyCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'riding' AND difficulty IS NOT NULL AND difficulty != ''").get().c;
  const mileageCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL").get().c;
  const costCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE category = 'campsite' AND cost_per_night IS NOT NULL").get().c;
  const seasonCount = db.prepare("SELECT COUNT(*) as c FROM locations WHERE best_season IS NOT NULL AND best_season != ''").get().c;

  // 4. Referential integrity
  checks.push({
    name: 'No orphaned trip stops',
    category: 'integrity',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM trip_stops WHERE trip_id NOT IN (SELECT id FROM trips)").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  checks.push({
    name: 'No orphaned trip stop locations',
    category: 'integrity',
    severity: 'critical',
    count: db.prepare("SELECT COUNT(*) as c FROM trip_stops WHERE location_id NOT IN (SELECT id FROM locations)").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  // 5. Scenery range
  checks.push({
    name: 'Scenery ratings in valid range (1-10)',
    category: 'integrity',
    severity: 'warning',
    count: db.prepare("SELECT COUNT(*) as c FROM locations WHERE scenery_rating IS NOT NULL AND (scenery_rating < 1 OR scenery_rating > 10)").get().c,
    pass: true
  });
  checks[checks.length - 1].pass = checks[checks.length - 1].count === 0;

  // Calculate completeness scores
  const completeness = {
    scenery: Math.round((sceneryCount / total) * 100),
    state: Math.round((stateCount / total) * 100),
    trailTypes: ridingTotal > 0 ? Math.round((trailTypesCount / ridingTotal) * 100) : 100,
    difficulty: ridingTotal > 0 ? Math.round((difficultyCount / ridingTotal) * 100) : 100,
    mileage: ridingTotal > 0 ? Math.round((mileageCount / ridingTotal) * 100) : 100,
    cost: campsiteTotal > 0 ? Math.round((costCount / campsiteTotal) * 100) : 100,
    season: Math.round((seasonCount / total) * 100)
  };

  const passedChecks = checks.filter(c => c.pass).length;
  const totalChecks = checks.length;
  const criticalFails = checks.filter(c => !c.pass && c.severity === 'critical').length;
  const overallScore = Math.round((passedChecks / totalChecks) * 100);

  return {
    timestamp: new Date().toISOString(),
    database: {
      total,
      riding: ridingTotal,
      campsites: campsiteTotal,
      boondocking: db.prepare("SELECT COUNT(*) as c FROM locations WHERE sub_type = 'boondocking'").get().c,
      trips: db.prepare("SELECT COUNT(*) as c FROM trips").get().c
    },
    checks,
    summary: {
      totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks,
      criticalFails,
      overallScore
    },
    completeness,
    overallQualityScore: Math.round(
      (overallScore * 0.4) +
      (Object.values(completeness).reduce((a, b) => a + b, 0) / Object.keys(completeness).length * 0.6)
    )
  };
}

// Load previous report for comparison
function loadPreviousReport() {
  const files = fs.readdirSync(REPORT_DIR)
    .filter(f => f.startsWith('quality-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length > 0) {
    try {
      return JSON.parse(fs.readFileSync(`${REPORT_DIR}/${files[0]}`, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Generate markdown report
function generateMarkdown(report, previous) {
  let md = `# Data Quality Report\n\n`;
  md += `*Generated: ${TIMESTAMP}*\n\n`;

  // Overall score
  md += `## Overall Quality Score: ${report.overallQualityScore}%\n\n`;

  if (previous) {
    const diff = report.overallQualityScore - previous.overallQualityScore;
    if (diff > 0) md += `📈 **+${diff}%** from previous report\n\n`;
    else if (diff < 0) md += `📉 **${diff}%** from previous report\n\n`;
    else md += `➡️ No change from previous report\n\n`;
  }

  // Database overview
  md += `## Database Overview\n\n`;
  md += `| Metric | Count |\n|--------|-------|\n`;
  md += `| Total Locations | ${report.database.total.toLocaleString()} |\n`;
  md += `| Riding | ${report.database.riding.toLocaleString()} |\n`;
  md += `| Campsites | ${report.database.campsites.toLocaleString()} |\n`;
  md += `| Boondocking | ${report.database.boondocking.toLocaleString()} |\n`;
  md += `| Trips | ${report.database.trips} |\n`;

  if (previous) {
    const locDiff = report.database.total - previous.database.total;
    if (locDiff !== 0) {
      md += `\n*${locDiff > 0 ? '+' : ''}${locDiff} locations since last report*\n`;
    }
  }

  // Checks
  md += `\n## Quality Checks (${report.summary.passed}/${report.summary.totalChecks} passed)\n\n`;
  md += `| Check | Status | Issues |\n|-------|--------|--------|\n`;

  for (const check of report.checks) {
    const icon = check.pass ? '✅' : (check.severity === 'critical' ? '❌' : '⚠️');
    md += `| ${check.name} | ${icon} | ${check.count} |\n`;
  }

  // Completeness
  md += `\n## Data Completeness\n\n`;
  md += `| Field | Coverage | Status |\n|-------|----------|--------|\n`;

  for (const [field, pct] of Object.entries(report.completeness)) {
    const icon = pct >= 95 ? '✅' : pct >= 80 ? '⚠️' : '❌';
    md += `| ${field} | ${pct}% | ${icon} |\n`;
  }

  // Recommendations
  md += `\n## Recommendations\n\n`;

  if (report.summary.criticalFails > 0) {
    md += `🚨 **${report.summary.criticalFails} critical issues** need immediate attention\n\n`;
  }

  const lowCompleteness = Object.entries(report.completeness)
    .filter(([_, pct]) => pct < 90)
    .sort((a, b) => a[1] - b[1]);

  if (lowCompleteness.length > 0) {
    md += `### Improve Data Completeness\n\n`;
    for (const [field, pct] of lowCompleteness) {
      md += `- **${field}**: ${pct}% — needs improvement\n`;
    }
  } else {
    md += `✅ All completeness metrics above 90%. Database is in good shape.\n`;
  }

  md += `\n---\n*Generated by generate-quality-report.js*\n`;

  return md;
}

// Main
const report = runChecks();
const previous = loadPreviousReport();
const markdown = generateMarkdown(report, previous);

// Save JSON report
const jsonPath = `${REPORT_DIR}/quality-report-${TIMESTAMP}.json`;
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

// Save markdown report
const mdPath = `${REPORT_DIR}/quality-report-${TIMESTAMP}.md`;
fs.writeFileSync(mdPath, markdown);

// Save latest (overwrite)
fs.writeFileSync(`${REPORT_DIR}/quality-report-latest.json`, JSON.stringify(report, null, 2));
fs.writeFileSync(`${REPORT_DIR}/quality-report-latest.md`, markdown);

console.log('✅ Quality report generated!');
console.log(`📄 JSON: ${jsonPath}`);
console.log(`📄 Markdown: ${mdPath}\n`);

// Print summary
console.log(`📊 Quality Score: ${report.overallQualityScore}%`);
console.log(`✓ Checks: ${report.summary.passed}/${report.summary.totalChecks} passed`);
console.log(`📍 Locations: ${report.database.total.toLocaleString()}`);

if (previous) {
  const diff = report.overallQualityScore - previous.overallQualityScore;
  console.log(`📈 Trend: ${diff >= 0 ? '+' : ''}${diff}% from previous`);
}

const lowFields = Object.entries(report.completeness).filter(([_, p]) => p < 90);
if (lowFields.length > 0) {
  console.log(`\n⚠️  Low completeness: ${lowFields.map(([f, p]) => `${f}(${p}%)`).join(', ')}`);
} else {
  console.log(`\n✅ All completeness metrics ≥90%`);
}

db.close();
