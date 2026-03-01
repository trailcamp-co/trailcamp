#!/usr/bin/env node
// Database Size Monitoring for TrailCamp
// Tracks database growth trends over time

import Database from 'better-sqlite3';
import fs from 'fs';
import { execSync } from 'child_process';

const db = new Database('./trailcamp.db', { readonly: true });
const HISTORY_FILE = './database-size-history.json';

// Get database file size
function getDatabaseSize() {
  try {
    const stats = fs.statSync('./trailcamp.db');
    return stats.size;
  } catch (err) {
    return null;
  }
}

// Get table row counts
function getTableCounts() {
  const tables = ['locations', 'trips', 'trip_stops'];
  const counts = {};
  
  for (const table of tables) {
    try {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      counts[table] = result.count;
    } catch (err) {
      counts[table] = null;
    }
  }
  
  return counts;
}

// Get index sizes (approximate)
function getIndexInfo() {
  try {
    const indexes = db.prepare(`
      SELECT name, tbl_name 
      FROM sqlite_master 
      WHERE type = 'index' AND sql IS NOT NULL
      ORDER BY name
    `).all();
    
    return {
      count: indexes.length,
      list: indexes.map(idx => ({ name: idx.name, table: idx.tbl_name }))
    };
  } catch (err) {
    return { count: 0, list: [] };
  }
}

// Get category breakdown
function getCategoryBreakdown() {
  try {
    const breakdown = {};
    const categories = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM locations 
      GROUP BY category
    `).all();
    
    for (const cat of categories) {
      breakdown[cat.category] = cat.count;
    }
    
    return breakdown;
  } catch (err) {
    return {};
  }
}

// Collect current metrics
function collectMetrics() {
  const timestamp = new Date().toISOString();
  const size = getDatabaseSize();
  const counts = getTableCounts();
  const indexes = getIndexInfo();
  const categories = getCategoryBreakdown();
  
  return {
    timestamp,
    size: {
      bytes: size,
      megabytes: size ? Math.round((size / (1024 * 1024)) * 100) / 100 : null,
      human: size ? formatBytes(size) : null
    },
    tables: counts,
    indexes: indexes.count,
    categories,
    totals: {
      locations: counts.locations || 0,
      trips: counts.trips || 0,
      tripStops: counts.trip_stops || 0
    }
  };
}

// Format bytes to human readable
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Load history
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Could not load history:', err.message);
  }
  return { measurements: [] };
}

// Save history
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Calculate growth trends
function calculateTrends(history) {
  const measurements = history.measurements;
  
  if (measurements.length < 2) {
    return null;
  }
  
  const first = measurements[0];
  const last = measurements[measurements.length - 1];
  
  const timeDiff = new Date(last.timestamp) - new Date(first.timestamp);
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
  
  if (daysDiff === 0) {
    return null;
  }
  
  const sizeGrowth = last.size.bytes - first.size.bytes;
  const locationsGrowth = last.totals.locations - first.totals.locations;
  
  return {
    period: {
      start: first.timestamp,
      end: last.timestamp,
      days: Math.round(daysDiff * 10) / 10
    },
    size: {
      total: formatBytes(sizeGrowth),
      perDay: formatBytes(sizeGrowth / daysDiff),
      percentChange: Math.round(((sizeGrowth / first.size.bytes) * 100) * 10) / 10
    },
    locations: {
      total: locationsGrowth,
      perDay: Math.round((locationsGrowth / daysDiff) * 10) / 10,
      percentChange: Math.round(((locationsGrowth / first.totals.locations) * 100) * 10) / 10
    }
  };
}

// Generate report
function generateReport(current, history, trends) {
  let report = `# Database Size Monitoring Report\n\n`;
  report += `*Generated: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  report += `## Current Metrics\n\n`;
  report += `- **Database size:** ${current.size.human} (${current.size.megabytes} MB)\n`;
  report += `- **Total locations:** ${current.totals.locations.toLocaleString()}\n`;
  report += `- **Trips:** ${current.totals.trips}\n`;
  report += `- **Trip stops:** ${current.totals.tripStops}\n`;
  report += `- **Indexes:** ${current.indexes}\n\n`;
  
  report += `### Locations by Category\n\n`;
  for (const [cat, count] of Object.entries(current.categories)) {
    report += `- **${cat}:** ${count.toLocaleString()}\n`;
  }
  
  if (trends) {
    report += `\n## Growth Trends\n\n`;
    report += `*Period: ${trends.period.days} days*\n\n`;
    
    report += `### Database Size\n`;
    report += `- Growth: ${trends.size.total} (${trends.size.percentChange}%)\n`;
    report += `- Average per day: ${trends.size.perDay}\n\n`;
    
    report += `### Locations\n`;
    report += `- Growth: ${trends.locations.total} locations (${trends.locations.percentChange}%)\n`;
    report += `- Average per day: ${trends.locations.perDay} locations\n\n`;
    
    // Projections
    if (trends.locations.perDay > 0) {
      const days30 = Math.round(trends.locations.perDay * 30);
      const days90 = Math.round(trends.locations.perDay * 90);
      const days365 = Math.round(trends.locations.perDay * 365);
      
      report += `### Projections (if trend continues)\n\n`;
      report += `- **30 days:** +${days30} locations\n`;
      report += `- **90 days:** +${days90} locations\n`;
      report += `- **1 year:** +${days365} locations\n\n`;
    }
  }
  
  report += `## Historical Data\n\n`;
  report += `Total measurements: ${history.measurements.length}\n\n`;
  
  if (history.measurements.length > 1) {
    report += `### Recent Measurements\n\n`;
    report += `| Date | Size | Locations | Trips |\n`;
    report += `|------|------|-----------|-------|\n`;
    
    const recent = history.measurements.slice(-10).reverse();
    for (const m of recent) {
      const date = new Date(m.timestamp).toISOString().split('T')[0];
      report += `| ${date} | ${m.size.human} | ${m.totals.locations} | ${m.totals.trips} |\n`;
    }
  }
  
  report += `\n---\n\n*Monitoring script: monitor-database-size.js*\n`;
  
  return report;
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Database Size Monitoring

Usage:
  node monitor-database-size.js [options]

Options:
  --report         Generate markdown report only (no new measurement)
  --json           Output current metrics as JSON
  --history        Show full history
  --help           Show this help

Examples:
  node monitor-database-size.js              # Record new measurement
  node monitor-database-size.js --report     # Generate report
  node monitor-database-size.js --json       # JSON output

Cron:
  # Daily at 3am
  0 3 * * * cd /path/to/server && node monitor-database-size.js
  `);
  process.exit(0);
}

if (args.includes('--json')) {
  const metrics = collectMetrics();
  console.log(JSON.stringify(metrics, null, 2));
  db.close();
  process.exit(0);
}

if (args.includes('--history')) {
  const history = loadHistory();
  console.log(JSON.stringify(history, null, 2));
  db.close();
  process.exit(0);
}

// Collect current metrics
const current = collectMetrics();
console.log('\n📊 Database Size Monitoring\n');
console.log('─'.repeat(50));
console.log(`Current size: ${current.size.human}`);
console.log(`Locations:    ${current.totals.locations.toLocaleString()}`);
console.log(`Trips:        ${current.totals.trips}`);
console.log(`Trip stops:   ${current.totals.tripStops}`);
console.log('─'.repeat(50) + '\n');

if (!args.includes('--report')) {
  // Record new measurement
  const history = loadHistory();
  history.measurements.push(current);
  saveHistory(history);
  console.log(`✓ Measurement recorded (${history.measurements.length} total)\n`);
}

// Calculate trends and generate report
const history = loadHistory();
const trends = calculateTrends(history);

if (trends) {
  console.log('📈 Growth Trends\n');
  console.log(`Period: ${trends.period.days} days`);
  console.log(`Size growth: ${trends.size.total} (${trends.size.percentChange}%)`);
  console.log(`Location growth: ${trends.locations.total} (+${trends.locations.perDay}/day)`);
  console.log('');
}

// Save report
const report = generateReport(current, history, trends);
fs.writeFileSync('./DATABASE-SIZE-REPORT.md', report);
console.log('✓ Report saved: DATABASE-SIZE-REPORT.md\n');

db.close();
