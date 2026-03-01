#!/usr/bin/env node
// Database Health Dashboard Metrics Generator
// Creates comprehensive health metrics JSON for monitoring

import Database from 'better-sqlite3';
import fs from 'fs';
import { execSync } from 'child_process';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Generating database health metrics...\n');

// 1. Database Stats
const stats = {
  locations: db.prepare('SELECT COUNT(*) as count FROM locations').get().count,
  riding: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding'").get().count,
  campsites: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite'").get().count,
  trips: db.prepare('SELECT COUNT(*) as count FROM trips').get().count,
  tripStops: db.prepare('SELECT COUNT(*) as count FROM trip_stops').get().count
};

// 2. Data Quality Checks
const quality = {
  missingCoordinates: db.prepare('SELECT COUNT(*) as count FROM locations WHERE latitude IS NULL OR longitude IS NULL').get().count,
  missingScenery: db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NULL').get().count,
  missingNames: db.prepare('SELECT COUNT(*) as count FROM locations WHERE name IS NULL OR name = \'\'').get().count,
  invalidCoordinates: db.prepare('SELECT COUNT(*) as count FROM locations WHERE latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180').get().count,
  orphanedTripStops: db.prepare('SELECT COUNT(*) as count FROM trip_stops WHERE trip_id NOT IN (SELECT id FROM trips)').get().count
};

const qualityScore = Math.round(((stats.locations - quality.missingCoordinates - quality.invalidCoordinates - quality.missingNames) / stats.locations) * 100);

// 3. Database Size & Performance
let dbSize = 0;
let dbSizeHuman = 'Unknown';
try {
  const sizeBytes = execSync('stat -f%z ./trailcamp.db 2>/dev/null || stat -c%s ./trailcamp.db 2>/dev/null', { encoding: 'utf8' }).trim();
  dbSize = parseInt(sizeBytes);
  dbSizeHuman = (dbSize / (1024 * 1024)).toFixed(1) + 'MB';
} catch (e) {
  // Fallback
}

// 4. Recent Performance (from benchmark history if exists)
let recentPerformance = null;
try {
  const history = fs.readFileSync('./benchmark-history.csv', 'utf8').trim().split('\n');
  const latest = history[history.length - 1].split(',');
  recentPerformance = {
    timestamp: latest[0],
    avgMs: parseInt(latest[1]),
    slowestMs: parseInt(latest[2]),
    fastestMs: parseInt(latest[3])
  };
} catch (e) {
  // No history yet
}

// 5. Backup Status
let backupStatus = {
  count: 0,
  latest: null,
  oldestDays: null
};

try {
  const backups = execSync('ls -t backups/trailcamp-backup-*.sql 2>/dev/null || true', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
  backupStatus.count = backups.length;
  
  if (backups.length > 0) {
    const latestBackup = backups[0];
    const stats = fs.statSync(latestBackup);
    backupStatus.latest = stats.mtime.toISOString();
    
    const oldestBackup = backups[backups.length - 1];
    const oldestStats = fs.statSync(oldestBackup);
    const ageMs = Date.now() - oldestStats.mtime.getTime();
    backupStatus.oldestDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  }
} catch (e) {
  // No backups
}

// 6. Growth Metrics (if we had created_at timestamps)
// For now, just show totals

// 7. System Health Status
const health = {
  status: 'healthy',
  issues: [],
  warnings: []
};

// Check for issues
if (quality.invalidCoordinates > 0) {
  health.status = 'degraded';
  health.issues.push(`${quality.invalidCoordinates} locations with invalid coordinates`);
}

if (quality.orphanedTripStops > 0) {
  health.status = 'degraded';
  health.issues.push(`${quality.orphanedTripStops} orphaned trip stops`);
}

if (backupStatus.count === 0) {
  health.warnings.push('No database backups found');
}

if (backupStatus.latest) {
  const latestBackupAge = Date.now() - new Date(backupStatus.latest).getTime();
  const hoursSinceBackup = latestBackupAge / (1000 * 60 * 60);
  
  if (hoursSinceBackup > 48) {
    health.warnings.push(`Latest backup is ${Math.round(hoursSinceBackup)} hours old`);
  }
}

if (quality.missingScenery > 100) {
  health.warnings.push(`${quality.missingScenery} locations missing scenery ratings`);
}

// 8. Integrity Check
let integrityCheck = 'unknown';
try {
  const result = db.prepare('PRAGMA integrity_check').get();
  integrityCheck = result.integrity_check === 'ok' ? 'ok' : 'failed';
  
  if (integrityCheck === 'failed') {
    health.status = 'critical';
    health.issues.push('Database integrity check FAILED');
  }
} catch (e) {
  integrityCheck = 'error';
}

// Compile metrics
const metrics = {
  generatedAt: new Date().toISOString(),
  health: {
    status: health.status,
    qualityScore: qualityScore,
    integrityCheck: integrityCheck,
    issues: health.issues,
    warnings: health.warnings
  },
  database: {
    sizeBytes: dbSize,
    sizeHuman: dbSizeHuman,
    totalLocations: stats.locations,
    riding: stats.riding,
    campsites: stats.campsites,
    trips: stats.trips,
    tripStops: stats.tripStops
  },
  dataQuality: {
    score: qualityScore,
    missingCoordinates: quality.missingCoordinates,
    missingScenery: quality.missingScenery,
    missingNames: quality.missingNames,
    invalidCoordinates: quality.invalidCoordinates,
    orphanedTripStops: quality.orphanedTripStops
  },
  performance: recentPerformance,
  backups: backupStatus
};

// Save metrics
const outputPath = './health-metrics.json';
fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));

console.log('✅ Health metrics generated!');
console.log(`📄 Saved to: ${outputPath}\n`);

// Print summary
console.log('📊 Health Summary:');
console.log(`  Status: ${metrics.health.status.toUpperCase()}`);
console.log(`  Quality Score: ${metrics.health.qualityScore}%`);
console.log(`  Database Size: ${metrics.database.sizeHuman}`);
console.log(`  Total Locations: ${metrics.database.totalLocations}`);
console.log(`  Integrity: ${metrics.health.integrityCheck}`);

if (metrics.backups.count > 0) {
  console.log(`  Backups: ${metrics.backups.count} (latest: ${metrics.backups.latest})`);
} else {
  console.log(`  Backups: None`);
}

if (metrics.performance) {
  console.log(`  Avg Query Time: ${metrics.performance.avgMs}ms`);
}

if (metrics.health.issues.length > 0) {
  console.log(`\n🚨 Issues:`);
  for (const issue of metrics.health.issues) {
    console.log(`  - ${issue}`);
  }
}

if (metrics.health.warnings.length > 0) {
  console.log(`\n⚠️  Warnings:`);
  for (const warning of metrics.health.warnings) {
    console.log(`  - ${warning}`);
  }
}

console.log('');

db.close();
