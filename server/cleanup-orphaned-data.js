#!/usr/bin/env node
// Orphaned Data Cleanup for TrailCamp
// Finds and optionally removes orphaned records

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db');

console.log('TrailCamp Orphaned Data Cleanup\n');

// Check for orphaned trip_stops
function findOrphanedTripStops() {
  const orphanedByTrip = db.prepare(`
    SELECT ts.* 
    FROM trip_stops ts 
    LEFT JOIN trips t ON ts.trip_id = t.id 
    WHERE t.id IS NULL
  `).all();
  
  const orphanedByLocation = db.prepare(`
    SELECT ts.* 
    FROM trip_stops ts 
    LEFT JOIN locations l ON ts.location_id = l.id 
    WHERE l.id IS NULL
  `).all();
  
  return {
    byTrip: orphanedByTrip,
    byLocation: orphanedByLocation
  };
}

// Check for locations with invalid foreign key references (if any exist)
function findInvalidLocations() {
  // Check if any location references don't exist
  // Currently locations table doesn't have FK references, but check anyway
  const invalidRefs = [];
  
  return invalidRefs;
}

// Generate cleanup report
function generateReport(orphaned, dryRun = true) {
  const report = {
    timestamp: new Date().toISOString(),
    dryRun,
    orphanedTripStops: {
      byTrip: orphaned.byTrip.length,
      byLocation: orphaned.byLocation.length,
      total: orphaned.byTrip.length + orphaned.byLocation.length
    },
    details: {
      tripStopsByTrip: orphaned.byTrip,
      tripStopsByLocation: orphaned.byLocation
    }
  };
  
  return report;
}

// Print report
function printReport(report) {
  console.log('='.repeat(60));
  console.log('ORPHANED DATA REPORT');
  console.log('='.repeat(60));
  console.log(`\nGenerated: ${new Date(report.timestamp).toLocaleString()}`);
  console.log(`Mode: ${report.dryRun ? 'DRY RUN (no changes)' : 'CLEANUP (deleting orphans)'}`);
  
  console.log('\n' + '─'.repeat(60));
  console.log('TRIP STOPS\n');
  
  console.log(`Orphaned by deleted trip:     ${report.orphanedTripStops.byTrip}`);
  console.log(`Orphaned by deleted location: ${report.orphanedTripStops.byLocation}`);
  console.log(`Total orphaned trip_stops:    ${report.orphanedTripStops.total}`);
  
  if (report.orphanedTripStops.total > 0) {
    console.log('\n⚠️  Orphaned records found!');
    
    if (report.details.tripStopsByTrip.length > 0) {
      console.log('\nOrphaned by trip (trip deleted):');
      for (const stop of report.details.tripStopsByTrip.slice(0, 5)) {
        console.log(`  - Trip stop ID ${stop.id}: trip_id=${stop.trip_id} (trip does not exist)`);
      }
      if (report.details.tripStopsByTrip.length > 5) {
        console.log(`  ... and ${report.details.tripStopsByTrip.length - 5} more`);
      }
    }
    
    if (report.details.tripStopsByLocation.length > 0) {
      console.log('\nOrphaned by location (location deleted):');
      for (const stop of report.details.tripStopsByLocation.slice(0, 5)) {
        console.log(`  - Trip stop ID ${stop.id}: location_id=${stop.location_id} (location does not exist)`);
      }
      if (report.details.tripStopsByLocation.length > 5) {
        console.log(`  ... and ${report.details.tripStopsByLocation.length - 5} more`);
      }
    }
  } else {
    console.log('\n✅ No orphaned trip_stops found');
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (report.orphanedTripStops.total > 0) {
    if (report.dryRun) {
      console.log('\nTo clean up orphaned data, run:');
      console.log('  node cleanup-orphaned-data.js --cleanup\n');
    } else {
      console.log('\n✓ Cleanup complete!\n');
    }
  } else {
    console.log('\n✓ Database is clean - no orphaned data found\n');
  }
}

// Cleanup orphaned data
function cleanupOrphans(orphaned) {
  let deleted = 0;
  
  // Delete orphaned trip_stops
  const allOrphaned = [...new Set([
    ...orphaned.byTrip.map(s => s.id),
    ...orphaned.byLocation.map(s => s.id)
  ])];
  
  if (allOrphaned.length > 0) {
    const deleteStmt = db.prepare('DELETE FROM trip_stops WHERE id = ?');
    
    for (const id of allOrphaned) {
      deleteStmt.run(id);
      deleted++;
    }
  }
  
  return deleted;
}

// Verify foreign key constraints
function verifyForeignKeys() {
  console.log('Checking foreign key constraints...\n');
  
  // Get foreign key info
  const fkInfo = db.prepare("PRAGMA foreign_key_list('trip_stops')").all();
  
  if (fkInfo.length > 0) {
    console.log('Foreign key constraints on trip_stops:');
    for (const fk of fkInfo) {
      console.log(`  - ${fk.from} → ${fk.table}.${fk.to} (ON DELETE ${fk.on_delete || 'NO ACTION'})`);
    }
  } else {
    console.log('⚠️  No foreign key constraints found on trip_stops');
    console.log('   Consider adding FK constraints for data integrity\n');
  }
  
  // Check if foreign keys are enabled
  const fkEnabled = db.prepare('PRAGMA foreign_keys').get();
  console.log(`\nForeign keys enabled: ${fkEnabled.foreign_keys === 1 ? 'YES ✓' : 'NO ✗'}`);
  
  console.log('');
}

// Main
const args = process.argv.slice(2);

if (args.includes('--help')) {
  console.log(`
Usage:
  node cleanup-orphaned-data.js [options]

Options:
  --cleanup    Delete orphaned data (default: dry run)
  --verify     Check foreign key constraints
  --json       Output report as JSON
  --help       Show this help

Examples:
  node cleanup-orphaned-data.js              # Dry run (report only)
  node cleanup-orphaned-data.js --cleanup    # Delete orphaned data
  node cleanup-orphaned-data.js --verify     # Check FK constraints
  `);
  process.exit(0);
}

if (args.includes('--verify')) {
  verifyForeignKeys();
  db.close();
  process.exit(0);
}

const dryRun = !args.includes('--cleanup');
const jsonOutput = args.includes('--json');

// Find orphaned data
const orphaned = {
  byTrip: findOrphanedTripStops().byTrip,
  byLocation: findOrphanedTripStops().byLocation
};

// Generate report
const report = generateReport(orphaned, dryRun);

// Cleanup if requested
if (!dryRun) {
  const deleted = cleanupOrphans(orphaned);
  report.deleted = deleted;
}

// Output
if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

// Save report
const reportPath = './orphaned-data-report.json';
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

if (!jsonOutput) {
  console.log(`Report saved to: ${reportPath}\n`);
}

db.close();

process.exit(report.orphanedTripStops.total > 0 && dryRun ? 1 : 0);
