#!/usr/bin/env node
// Database Size Monitoring for TrailCamp
// Tracks database growth trends over time

import Database from 'better-sqlite3';
import fs from 'fs';
import { execSync } from 'child_process';

const db = new Database('./trailcamp.db', { readonly: true });
const HISTORY_FILE = './db-size-history.json';

// Get database file size
function getDatabaseSize() {
  try {
    const stats = fs.statSync('./trailcamp.db');
    return stats.size;
  } catch (err) {
    return 0;
  }
}

// Get table sizes
function getTableSizes() {
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type = 'table' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  const tableSizes = {};
  
  for (const table of tables) {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
    tableSizes[table.name] = count;
  }
  
  return tableSizes;
}

// Get index information
function getIndexInfo() {
  const indexes = db.prepare(`
    SELECT name, tbl_name 
    FROM sqlite_master 
    WHERE type = 'index' 
    AND name NOT LIKE 'sqlite_%'
    ORDER BY tbl_name, name
  `).all();
  
  return indexes.length;
}

// Load history
function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  }
  return { snapshots: [] };
}

// Save history
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

// Calculate growth
function calculateGrowth(current, previous) {
  if (!previous) return null;
  
  const sizeDiff = current.totalSize - previous.totalSize;
  const pctGrowth = ((sizeDiff / previous.totalSize) * 100).toFixed(2);
  
  return {
    bytes: sizeDiff,
    percentage: parseFloat(pctGrowth),
    days: Math.round((new Date(current.timestamp) - new Date(previous.timestamp)) / (1000 * 60 * 60 * 24))
  };
}

// Format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Take snapshot
function takeSnapshot() {
  const totalSize = getDatabaseSize();
  const tableSizes = getTableSizes();
  const indexCount = getIndexInfo();
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    tables: tableSizes,
    indexCount,
    totalRows: Object.values(tableSizes).reduce((a, b) => a + b, 0)
  };
  
  return snapshot;
}

// Generate report
function generateReport(history) {
  const snapshots = history.snapshots;
  
  if (snapshots.length === 0) {
    console.log('No historical data available. Run this script regularly to track growth.\n');
    return;
  }
  
  const current = snapshots[snapshots.length - 1];
  const previous = snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  const first = snapshots[0];
  
  console.log('═'.repeat(70));
  console.log('DATABASE SIZE MONITORING REPORT');
  console.log('═'.repeat(70));
  
  console.log('\n📊 Current Status\n');
  console.log(`  Database size:    ${current.totalSizeFormatted}`);
  console.log(`  Total rows:       ${current.totalRows.toLocaleString()}`);
  console.log(`  Tables:           ${Object.keys(current.tables).length}`);
  console.log(`  Indexes:          ${current.indexCount}`);
  console.log(`  Last snapshot:    ${new Date(current.timestamp).toLocaleString()}`);
  
  if (previous) {
    const growth = calculateGrowth(current, previous);
    console.log('\n📈 Recent Growth\n');
    console.log(`  Since last check: ${formatBytes(Math.abs(growth.bytes))} ${growth.bytes >= 0 ? 'increase' : 'decrease'} (${growth.percentage}%)`);
    console.log(`  Days elapsed:     ${growth.days}`);
  }
  
  if (snapshots.length > 1) {
    const totalGrowth = calculateGrowth(current, first);
    console.log('\n📊 Total Growth\n');
    console.log(`  Since first snap: ${formatBytes(Math.abs(totalGrowth.bytes))} ${totalGrowth.bytes >= 0 ? 'increase' : 'decrease'} (${totalGrowth.percentage}%)`);
    console.log(`  Days tracked:     ${totalGrowth.days}`);
    console.log(`  Snapshots taken:  ${snapshots.length}`);
  }
  
  console.log('\n📋 Table Sizes\n');
  const sortedTables = Object.entries(current.tables).sort((a, b) => b[1] - a[1]);
  
  for (const [table, count] of sortedTables) {
    const previousCount = previous ? (previous.tables[table] || 0) : count;
    const diff = count - previousCount;
    const diffStr = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : '';
    console.log(`  ${table.padEnd(25)} ${count.toLocaleString().padStart(7)} rows${diffStr}`);
  }
  
  if (snapshots.length >= 2) {
    console.log('\n📈 Growth Trend\n');
    
    const recentSnapshots = snapshots.slice(-7); // Last 7 snapshots
    const growthRates = [];
    
    for (let i = 1; i < recentSnapshots.length; i++) {
      const growth = calculateGrowth(recentSnapshots[i], recentSnapshots[i - 1]);
      if (growth && growth.days > 0) {
        growthRates.push(growth.bytes / growth.days); // bytes per day
      }
    }
    
    if (growthRates.length > 0) {
      const avgGrowthPerDay = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      console.log(`  Average growth:   ${formatBytes(avgGrowthPerDay)}/day`);
      
      // Project future size
      const daysTo30 = 30;
      const daysTo90 = 90;
      const projected30 = current.totalSize + (avgGrowthPerDay * daysTo30);
      const projected90 = current.totalSize + (avgGrowthPerDay * daysTo90);
      
      console.log(`  Projected (30d):  ${formatBytes(projected30)}`);
      console.log(`  Projected (90d):  ${formatBytes(projected90)}`);
    }
  }
  
  console.log('\n' + '═'.repeat(70) + '\n');
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
TrailCamp Database Size Monitoring

Usage:
  node track-db-size.js [--report] [--reset]

Options:
  --report    Show report without taking new snapshot
  --reset     Clear history and start fresh
  --help      Show this help

Examples:
  node track-db-size.js          # Take snapshot and show report
  node track-db-size.js --report # Show report only
  node track-db-size.js --reset  # Clear history

Recommended:
  Run daily via cron to track growth over time:
  
  0 2 * * * cd /path/to/server && node track-db-size.js >> logs/db-size.log 2>&1
  `);
  process.exit(0);
}

if (args.includes('--reset')) {
  if (fs.existsSync(HISTORY_FILE)) {
    fs.unlinkSync(HISTORY_FILE);
    console.log('✓ History cleared\n');
  } else {
    console.log('No history file found\n');
  }
  process.exit(0);
}

const history = loadHistory();

if (!args.includes('--report')) {
  console.log('Taking snapshot...\n');
  const snapshot = takeSnapshot();
  history.snapshots.push(snapshot);
  
  // Keep last 90 snapshots (3 months if daily)
  if (history.snapshots.length > 90) {
    history.snapshots = history.snapshots.slice(-90);
  }
  
  saveHistory(history);
  console.log(`✓ Snapshot saved (${history.snapshots.length} total)\n`);
}

generateReport(history);

db.close();
