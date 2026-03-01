#!/usr/bin/env node
// Database Size Monitoring for TrailCamp
// Tracks growth trends over time

import Database from 'better-sqlite3';
import fs from 'fs';
import { execSync } from 'child_process';

const db = new Database('./trailcamp.db', { readonly: true });
const LOG_FILE = './size-monitoring.jsonl';

// Get current database stats
function getDatabaseStats() {
  const timestamp = new Date().toISOString();
  
  // File size
  let dbSizeBytes = 0;
  let dbSizeHuman = 'Unknown';
  try {
    const statInfo = fs.statSync('./trailcamp.db');
    dbSizeBytes = statInfo.size;
    dbSizeHuman = execSync('ls -lh ./trailcamp.db | awk \'{print $5}\'', { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error('Could not get file size:', err.message);
  }
  
  // Row counts
  const tables = {
    locations: db.prepare('SELECT COUNT(*) as count FROM locations').get().count,
    trips: db.prepare('SELECT COUNT(*) as count FROM trips').get().count,
    trip_stops: db.prepare('SELECT COUNT(*) as count FROM trip_stops').get().count
  };
  
  // Check if FTS table exists
  try {
    tables.locations_fts = db.prepare('SELECT COUNT(*) as count FROM locations_fts').get().count;
  } catch (err) {
    tables.locations_fts = 0;
  }
  
  // Category breakdown
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM locations 
    GROUP BY category
  `).all().reduce((acc, row) => {
    acc[row.category] = row.count;
    return acc;
  }, {});
  
  // Data completeness scores
  const totalLocations = tables.locations;
  const completeness = {
    scenery: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NOT NULL').get().count / totalLocations) * 100),
    difficulty: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE category = \'riding\' AND difficulty IS NOT NULL').get().count / Math.max(1, byCategory.riding || 1)) * 100),
    cost: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE cost_per_night IS NOT NULL').get().count / totalLocations) * 100),
    state: 0
  };
  
  // Check if state column exists
  try {
    completeness.state = Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE state IS NOT NULL AND state != \'\'').get().count / totalLocations) * 100);
  } catch (err) {
    completeness.state = 0;
  }
  
  return {
    timestamp,
    dbSizeBytes,
    dbSizeHuman,
    tables,
    byCategory,
    completeness
  };
}

// Load historical data
function loadHistory() {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(l => l);
  return lines.map(line => JSON.parse(line));
}

// Save current stats
function saveStats(stats) {
  const line = JSON.stringify(stats) + '\n';
  fs.appendFileSync(LOG_FILE, line);
}

// Calculate growth rates
function calculateGrowth(history) {
  if (history.length < 2) {
    return null;
  }
  
  const oldest = history[0];
  const newest = history[history.length - 1];
  
  const timeDiffMs = new Date(newest.timestamp) - new Date(oldest.timestamp);
  const daysDiff = timeDiffMs / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 1) {
    return null;
  }
  
  const locationGrowth = newest.tables.locations - oldest.tables.locations;
  const sizeGrowth = newest.dbSizeBytes - oldest.dbSizeBytes;
  
  return {
    periodDays: Math.round(daysDiff * 10) / 10,
    locationGrowth,
    locationsPerDay: Math.round((locationGrowth / daysDiff) * 10) / 10,
    sizeGrowthBytes: sizeGrowth,
    bytesPerDay: Math.round(sizeGrowth / daysDiff),
    sizeGrowthPct: Math.round((sizeGrowth / oldest.dbSizeBytes) * 100)
  };
}

// Generate report
function generateReport(stats, history, growth) {
  let report = `# Database Size Monitoring Report

*Generated: ${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0]}*

## Current State

- **Database size:** ${stats.dbSizeHuman} (${stats.dbSizeBytes.toLocaleString()} bytes)
- **Total locations:** ${stats.tables.locations.toLocaleString()}
- **Trips:** ${stats.tables.trips}
- **Trip stops:** ${stats.tables.trip_stops}

### Locations by Category

`;
  
  for (const [category, count] of Object.entries(stats.byCategory)) {
    const pct = Math.round((count / stats.tables.locations) * 100);
    report += `- **${category}:** ${count.toLocaleString()} (${pct}%)\n`;
  }
  
  report += `\n### Data Completeness\n\n`;
  report += `- **Scenery ratings:** ${stats.completeness.scenery}%\n`;
  report += `- **Difficulty (riding):** ${stats.completeness.difficulty}%\n`;
  report += `- **Cost data:** ${stats.completeness.cost}%\n`;
  report += `- **State data:** ${stats.completeness.state}%\n`;
  
  if (growth) {
    report += `\n---\n\n## Growth Trends\n\n`;
    report += `**Period:** ${growth.periodDays} days\n\n`;
    report += `### Locations\n`;
    report += `- Total growth: +${growth.locationGrowth.toLocaleString()} locations\n`;
    report += `- Average: ${growth.locationsPerDay} locations/day\n\n`;
    
    report += `### Database Size\n`;
    report += `- Total growth: +${(growth.sizeGrowthBytes / 1024 / 1024).toFixed(2)} MB (${growth.sizeGrowthPct}%)\n`;
    report += `- Average: ${(growth.bytesPerDay / 1024).toFixed(2)} KB/day\n\n`;
    
    // Projections
    const daysTo10k = growth.locationsPerDay > 0 ? Math.round((10000 - stats.tables.locations) / growth.locationsPerDay) : null;
    const sizeAt10k = growth.locationsPerDay > 0 ? stats.dbSizeBytes + (daysTo10k * growth.bytesPerDay) : null;
    
    if (daysTo10k && daysTo10k > 0) {
      report += `### Projections\n`;
      report += `- Days to 10,000 locations: ~${daysTo10k} days\n`;
      report += `- Estimated DB size at 10k: ~${(sizeAt10k / 1024 / 1024).toFixed(1)} MB\n\n`;
    }
  } else {
    report += `\n*Not enough historical data for growth analysis. Run this script periodically to track trends.*\n\n`;
  }
  
  if (history.length > 0) {
    report += `---\n\n## Historical Data\n\n`;
    report += `Monitoring since: ${history[0].timestamp.split('T')[0]}\n`;
    report += `Data points: ${history.length}\n\n`;
    
    report += `| Date | Locations | DB Size | Growth |\n`;
    report += `|------|-----------|---------|--------|\n`;
    
    for (let i = Math.max(0, history.length - 10); i < history.length; i++) {
      const entry = history[i];
      const prevEntry = i > 0 ? history[i - 1] : null;
      const growth = prevEntry ? entry.tables.locations - prevEntry.tables.locations : 0;
      const growthStr = growth > 0 ? `+${growth}` : (growth < 0 ? growth : '—');
      
      report += `| ${entry.timestamp.split('T')[0]} | ${entry.tables.locations.toLocaleString()} | ${entry.dbSizeHuman} | ${growthStr} |\n`;
    }
  }
  
  report += `\n---\n\n## Monitoring Setup\n\n`;
  report += `To track growth over time, run this script daily via cron:\n\n`;
  report += `\`\`\`cron\n`;
  report += `# Daily size monitoring at 11 PM\n`;
  report += `0 23 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && node monitor-size.js >> /dev/null 2>&1\n`;
  report += `\`\`\`\n\n`;
  
  report += `View report:\n`;
  report += `\`\`\`bash\n`;
  report += `node monitor-size.js --report\n`;
  report += `\`\`\`\n\n`;
  
  report += `View raw data:\n`;
  report += `\`\`\`bash\n`;
  report += `cat size-monitoring.jsonl\n`;
  report += `\`\`\`\n\n`;
  
  report += `*Data stored in: ${LOG_FILE}*\n`;
  
  return report;
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Database Size Monitoring

Usage:
  node monitor-size.js           Record current size (append to log)
  node monitor-size.js --report  Generate report from historical data
  node monitor-size.js --json    Output current stats as JSON
  node monitor-size.js --help    Show this help

Examples:
  node monitor-size.js
  node monitor-size.js --report > SIZE-REPORT.md

Notes:
  - Run regularly (e.g., daily via cron) to track growth trends
  - Data logged to: ${LOG_FILE}
  - Each run appends one line (JSONL format)
  `);
  process.exit(0);
}

const stats = getDatabaseStats();
const history = loadHistory();

if (args.includes('--json')) {
  console.log(JSON.stringify(stats, null, 2));
  db.close();
  process.exit(0);
}

if (args.includes('--report')) {
  const growth = calculateGrowth(history);
  const report = generateReport(stats, history, growth);
  console.log(report);
  db.close();
  process.exit(0);
}

// Default: record current stats
saveStats(stats);

console.log(`✓ Recorded database size stats`);
console.log(`  Locations: ${stats.tables.locations.toLocaleString()}`);
console.log(`  Size: ${stats.dbSizeHuman}`);
console.log(`  Log: ${LOG_FILE}\n`);

if (history.length > 1) {
  const growth = calculateGrowth(history);
  if (growth) {
    console.log(`Growth since ${history[0].timestamp.split('T')[0]}:`);
    console.log(`  +${growth.locationGrowth} locations (${growth.locationsPerDay}/day)`);
    console.log(`  +${(growth.sizeGrowthBytes / 1024 / 1024).toFixed(2)} MB (${growth.bytesPerDay / 1024} KB/day)`);
  }
}

console.log(`\nRun --report for full analysis\n`);

db.close();
