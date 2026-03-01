#!/usr/bin/env node
// Usage Statistics Analyzer for TrailCamp

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Analyzing API usage statistics...\n');

// Check if usage_stats table exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='usage_stats'
`).get();

if (!tableExists) {
  console.log('⚠️  Usage statistics table does not exist yet.');
  console.log('Run migration: sqlite3 trailcamp.db < migrations/005_add_usage_stats.sql\n');
  process.exit(1);
}

// Get total requests
const total = db.prepare('SELECT COUNT(*) as count FROM usage_stats').get().count;

if (total === 0) {
  console.log('No usage data collected yet.');
  console.log('Start logging by adding usageLogger middleware to Express app.\n');
  process.exit(0);
}

console.log(`Total requests logged: ${total.toLocaleString()}\n`);

// 1. Most popular endpoints
console.log('━━━ Top 10 Endpoints ━━━\n');
const topEndpoints = db.prepare(`
  SELECT 
    endpoint,
    COUNT(*) as requests,
    ROUND(AVG(response_time_ms), 0) as avg_ms,
    ROUND(COUNT(*) * 100.0 / ?, 1) as pct
  FROM usage_stats
  GROUP BY endpoint
  ORDER BY requests DESC
  LIMIT 10
`).all(total);

for (const row of topEndpoints) {
  console.log(`${row.endpoint.padEnd(40)} ${row.requests.toString().padStart(6)} (${row.pct}%) — ${row.avg_ms}ms avg`);
}

// 2. Slowest endpoints
console.log('\n━━━ Slowest Endpoints (avg > 100ms) ━━━\n');
const slowEndpoints = db.prepare(`
  SELECT 
    endpoint,
    ROUND(AVG(response_time_ms), 0) as avg_ms,
    MAX(response_time_ms) as max_ms,
    COUNT(*) as requests
  FROM usage_stats
  GROUP BY endpoint
  HAVING avg_ms > 100
  ORDER BY avg_ms DESC
  LIMIT 10
`).all();

if (slowEndpoints.length > 0) {
  for (const row of slowEndpoints) {
    console.log(`${row.endpoint.padEnd(40)} ${row.avg_ms}ms avg (max: ${row.max_ms}ms) — ${row.requests} requests`);
  }
} else {
  console.log('✓ All endpoints < 100ms average');
}

// 3. Popular query parameters
console.log('\n━━━ Popular Search Filters ━━━\n');
const queries = db.prepare(`
  SELECT query_params, COUNT(*) as count
  FROM usage_stats
  WHERE query_params IS NOT NULL
  GROUP BY query_params
  ORDER BY count DESC
  LIMIT 10
`).all();

for (const row of queries) {
  const params = JSON.parse(row.query_params);
  const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(', ');
  console.log(`${paramStr.substring(0, 50).padEnd(50)} ${row.count.toString().padStart(6)} requests`);
}

// 4. Status codes
console.log('\n━━━ Response Status Codes ━━━\n');
const statusCodes = db.prepare(`
  SELECT 
    status_code,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / ?, 1) as pct
  FROM usage_stats
  GROUP BY status_code
  ORDER BY count DESC
`).all(total);

for (const row of statusCodes) {
  const icon = row.status_code === 200 ? '✓' : row.status_code >= 400 ? '✗' : '➜';
  console.log(`${icon} ${row.status_code.toString().padStart(3)} ${row.count.toString().padStart(6)} (${row.pct}%)`);
}

// 5. Time series (requests per hour)
console.log('\n━━━ Activity by Hour (last 24h) ━━━\n');
const hourly = db.prepare(`
  SELECT 
    strftime('%H:00', timestamp) as hour,
    COUNT(*) as requests
  FROM usage_stats
  WHERE datetime(timestamp) > datetime('now', '-24 hours')
  GROUP BY hour
  ORDER BY hour DESC
  LIMIT 24
`).all();

if (hourly.length > 0) {
  for (const row of hourly) {
    const bar = '█'.repeat(Math.min(50, Math.round(row.requests / 2)));
    console.log(`${row.hour} ${bar} ${row.requests}`);
  }
} else {
  console.log('No data in last 24 hours');
}

// Generate report
const reportPath = `./reports/usage-stats-${new Date().toISOString().split('T')[0]}.md`;
let report = `# API Usage Statistics Report\n\n`;
report += `*Generated: ${new Date().toISOString()}*\n\n`;
report += `## Summary\n\n`;
report += `- **Total requests:** ${total.toLocaleString()}\n`;
report += `- **Unique endpoints:** ${topEndpoints.length}\n\n`;

report += `## Top Endpoints\n\n`;
report += `| Endpoint | Requests | % | Avg Response Time |\n`;
report += `|----------|----------|---|-------------------|\n`;
for (const row of topEndpoints) {
  report += `| ${row.endpoint} | ${row.requests} | ${row.pct}% | ${row.avg_ms}ms |\n`;
}

report += `\n## Performance\n\n`;
if (slowEndpoints.length > 0) {
  report += `### Slow Endpoints (> 100ms avg)\n\n`;
  report += `| Endpoint | Avg | Max | Requests |\n`;
  report += `|----------|-----|-----|----------|\n`;
  for (const row of slowEndpoints) {
    report += `| ${row.endpoint} | ${row.avg_ms}ms | ${row.max_ms}ms | ${row.requests} |\n`;
  }
} else {
  report += `✓ All endpoints performing well (< 100ms avg)\n`;
}

report += `\n## Status Codes\n\n`;
report += `| Code | Count | % |\n`;
report += `|------|-------|---|\n`;
for (const row of statusCodes) {
  report += `| ${row.status_code} | ${row.count} | ${row.pct}% |\n`;
}

report += `\n---\n*Generated by analyze-usage.js*\n`;

fs.mkdirSync('./reports', { recursive: true });
fs.writeFileSync(reportPath, report);

console.log(`\n✓ Report saved: ${reportPath}\n`);

db.close();
