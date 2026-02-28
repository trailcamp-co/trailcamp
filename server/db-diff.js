#!/usr/bin/env node
// Database Diff Tool for TrailCamp
// Compare database states before/after changes

import Database from 'better-sqlite3';
import fs from 'fs';
import crypto from 'crypto';

function generateSnapshot(dbPath, outputPath) {
  const db = new Database(dbPath, { readonly: true });
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    dbPath: dbPath,
    tables: {}
  };
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '%_fts%'").all();
  
  for (const table of tables) {
    const tableName = table.name;
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    
    snapshot.tables[tableName] = {
      count: rows.length,
      rows: rows.map(row => {
        // Calculate hash for quick comparison
        const hash = crypto.createHash('md5').update(JSON.stringify(row)).digest('hex');
        return { ...row, _hash: hash };
      })
    };
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(snapshot, null, 2));
  db.close();
  
  return snapshot;
}

function compareSnapshots(snapshot1, snapshot2) {
  const diff = {
    summary: {
      tables: {}
    },
    changes: {}
  };
  
  // Compare each table
  const allTables = new Set([...Object.keys(snapshot1.tables), ...Object.keys(snapshot2.tables)]);
  
  for (const tableName of allTables) {
    const table1 = snapshot1.tables[tableName];
    const table2 = snapshot2.tables[tableName];
    
    if (!table1) {
      diff.summary.tables[tableName] = 'ADDED';
      continue;
    }
    
    if (!table2) {
      diff.summary.tables[tableName] = 'DELETED';
      continue;
    }
    
    // Build ID maps
    const map1 = new Map(table1.rows.map(r => [r.id, r]));
    const map2 = new Map(table2.rows.map(r => [r.id, r]));
    
    const added = [];
    const deleted = [];
    const modified = [];
    
    // Find added and modified
    for (const [id, row2] of map2) {
      const row1 = map1.get(id);
      
      if (!row1) {
        added.push(row2);
      } else if (row1._hash !== row2._hash) {
        // Find specific field changes
        const changes = {};
        for (const key of Object.keys(row2)) {
          if (key === '_hash') continue;
          if (row1[key] !== row2[key]) {
            changes[key] = { old: row1[key], new: row2[key] };
          }
        }
        modified.push({ id, changes });
      }
    }
    
    // Find deleted
    for (const [id, row1] of map1) {
      if (!map2.has(id)) {
        deleted.push(row1);
      }
    }
    
    if (added.length > 0 || deleted.length > 0 || modified.length > 0) {
      diff.changes[tableName] = {
        added: added.map(r => ({ id: r.id, name: r.name || r.id })),
        deleted: deleted.map(r => ({ id: r.id, name: r.name || r.id })),
        modified: modified
      };
      
      diff.summary.tables[tableName] = {
        added: added.length,
        deleted: deleted.length,
        modified: modified.length
      };
    } else {
      diff.summary.tables[tableName] = 'UNCHANGED';
    }
  }
  
  return diff;
}

function generateReport(diff, snapshot1, snapshot2) {
  let report = `# Database Diff Report

**Before:** ${snapshot1.timestamp}
**After:** ${snapshot2.timestamp}

---

## Summary

`;
  
  let totalAdded = 0;
  let totalDeleted = 0;
  let totalModified = 0;
  
  for (const [tableName, status] of Object.entries(diff.summary.tables)) {
    if (typeof status === 'string') {
      report += `- **${tableName}:** ${status}\n`;
    } else {
      report += `- **${tableName}:** +${status.added} / ~${status.modified} / -${status.deleted}\n`;
      totalAdded += status.added;
      totalModified += status.modified;
      totalDeleted += status.deleted;
    }
  }
  
  report += `\n**Total Changes:** +${totalAdded} added, ~${totalModified} modified, -${totalDeleted} deleted\n`;
  
  report += `\n---\n\n`;
  
  // Detailed changes
  for (const [tableName, changes] of Object.entries(diff.changes)) {
    report += `## ${tableName}\n\n`;
    
    if (changes.added.length > 0) {
      report += `### Added (${changes.added.length})\n\n`;
      for (const item of changes.added.slice(0, 20)) {
        report += `- **[${item.id}]** ${item.name}\n`;
      }
      if (changes.added.length > 20) {
        report += `\n*... and ${changes.added.length - 20} more*\n`;
      }
      report += `\n`;
    }
    
    if (changes.deleted.length > 0) {
      report += `### Deleted (${changes.deleted.length})\n\n`;
      for (const item of changes.deleted.slice(0, 20)) {
        report += `- **[${item.id}]** ${item.name}\n`;
      }
      if (changes.deleted.length > 20) {
        report += `\n*... and ${changes.deleted.length - 20} more*\n`;
      }
      report += `\n`;
    }
    
    if (changes.modified.length > 0) {
      report += `### Modified (${changes.modified.length})\n\n`;
      for (const item of changes.modified.slice(0, 10)) {
        report += `**ID ${item.id}:**\n`;
        for (const [field, change] of Object.entries(item.changes)) {
          report += `  - \`${field}\`: "${change.old}" → "${change.new}"\n`;
        }
        report += `\n`;
      }
      if (changes.modified.length > 10) {
        report += `*... and ${changes.modified.length - 10} more modified*\n\n`;
      }
    }
    
    report += `---\n\n`;
  }
  
  return report;
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--help') || args.length === 0) {
  console.log(`
TrailCamp Database Diff Tool

Usage:
  # Create snapshot
  node db-diff.js snapshot [output-file]
  
  # Compare snapshots
  node db-diff.js compare <before.json> <after.json> [--report output.md]

Examples:
  # Before making changes
  node db-diff.js snapshot before.json
  
  # After making changes
  node db-diff.js snapshot after.json
  
  # Compare
  node db-diff.js compare before.json after.json --report diff-report.md

Options:
  --help       Show this help
  --report     Save diff report to file (markdown)
  `);
  process.exit(0);
}

const command = args[0];

if (command === 'snapshot') {
  const outputPath = args[1] || `snapshot-${Date.now()}.json`;
  const dbPath = './trailcamp.db';
  
  if (!fs.existsSync(dbPath)) {
    console.error(`✗ Database not found: ${dbPath}\n`);
    process.exit(1);
  }
  
  console.log(`Creating snapshot of ${dbPath}...`);
  
  const snapshot = generateSnapshot(dbPath, outputPath);
  
  const tableCount = Object.keys(snapshot.tables).length;
  const totalRows = Object.values(snapshot.tables).reduce((sum, t) => sum + t.count, 0);
  
  console.log(`✓ Snapshot saved to: ${outputPath}`);
  console.log(`  Tables: ${tableCount}`);
  console.log(`  Total rows: ${totalRows}`);
  console.log(`  Timestamp: ${snapshot.timestamp}\n`);
  
} else if (command === 'compare') {
  const beforePath = args[1];
  const afterPath = args[2];
  const reportPath = args.includes('--report') ? args[args.indexOf('--report') + 1] : null;
  
  if (!beforePath || !afterPath) {
    console.error('✗ Must provide both before and after snapshot files\n');
    process.exit(1);
  }
  
  if (!fs.existsSync(beforePath)) {
    console.error(`✗ Before snapshot not found: ${beforePath}\n`);
    process.exit(1);
  }
  
  if (!fs.existsSync(afterPath)) {
    console.error(`✗ After snapshot not found: ${afterPath}\n`);
    process.exit(1);
  }
  
  console.log(`Comparing snapshots...\n`);
  
  const snapshot1 = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
  const snapshot2 = JSON.parse(fs.readFileSync(afterPath, 'utf8'));
  
  const diff = compareSnapshots(snapshot1, snapshot2);
  const report = generateReport(diff, snapshot1, snapshot2);
  
  if (reportPath) {
    fs.writeFileSync(reportPath, report);
    console.log(`✓ Diff report saved to: ${reportPath}\n`);
  } else {
    console.log(report);
  }
  
} else {
  console.error(`✗ Unknown command: ${command}\n`);
  console.error('Use --help for usage information\n');
  process.exit(1);
}
