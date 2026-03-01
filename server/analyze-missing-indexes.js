// Missing Indexes Analysis for TrailCamp
// Analyzes common queries and suggests missing indexes

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db');

console.log('Analyzing query performance for missing indexes...\n');

// Common query patterns to analyze
const queries = [
  {
    name: 'Filter by category',
    sql: 'SELECT * FROM locations WHERE category = ?',
    params: ['riding']
  },
  {
    name: 'Filter by sub_type',
    sql: 'SELECT * FROM locations WHERE sub_type = ?',
    params: ['boondocking']
  },
  {
    name: 'Filter by difficulty',
    sql: 'SELECT * FROM locations WHERE difficulty = ?',
    params: ['Hard']
  },
  {
    name: 'Filter by best_season',
    sql: 'SELECT * FROM locations WHERE best_season = ?',
    params: ['Summer']
  },
  {
    name: 'Filter by scenery rating',
    sql: 'SELECT * FROM locations WHERE scenery_rating >= ?',
    params: [8]
  },
  {
    name: 'Filter by featured',
    sql: 'SELECT * FROM locations WHERE featured = ?',
    params: [1]
  },
  {
    name: 'Filter by state',
    sql: 'SELECT * FROM locations WHERE state = ?',
    params: ['CA']
  },
  {
    name: 'Filter by permit_required',
    sql: 'SELECT * FROM locations WHERE permit_required = ?',
    params: [1]
  },
  {
    name: 'Compound: category + sub_type',
    sql: 'SELECT * FROM locations WHERE category = ? AND sub_type = ?',
    params: ['campsite', 'boondocking']
  },
  {
    name: 'Compound: category + difficulty',
    sql: 'SELECT * FROM locations WHERE category = ? AND difficulty = ?',
    params: ['riding', 'Hard']
  },
  {
    name: 'Compound: category + state',
    sql: 'SELECT * FROM locations WHERE category = ? AND state = ?',
    params: ['riding', 'CA']
  },
  {
    name: 'Order by scenery rating DESC',
    sql: 'SELECT * FROM locations ORDER BY scenery_rating DESC LIMIT 50',
    params: []
  },
  {
    name: 'Order by name ASC',
    sql: 'SELECT * FROM locations ORDER BY name ASC LIMIT 50',
    params: []
  },
  {
    name: 'Trip stops by trip_id',
    sql: 'SELECT * FROM trip_stops WHERE trip_id = ?',
    params: [1]
  },
  {
    name: 'Trip stops by location_id',
    sql: 'SELECT * FROM trip_stops WHERE location_id = ?',
    params: [100]
  },
  {
    name: 'Full-text search (if FTS enabled)',
    sql: 'SELECT * FROM locations_fts WHERE locations_fts MATCH ?',
    params: ['moab']
  }
];

// Get existing indexes
const existingIndexes = db.prepare(`
  SELECT name, tbl_name, sql 
  FROM sqlite_master 
  WHERE type = 'index' AND tbl_name IN ('locations', 'trip_stops', 'trips')
  ORDER BY tbl_name, name
`).all();

console.log('📊 Existing Indexes:\n');
for (const idx of existingIndexes) {
  if (idx.sql) {
    console.log(`  ${idx.name} on ${idx.tbl_name}`);
  }
}
console.log('');

// Analyze each query
const analysis = [];

for (const query of queries) {
  try {
    const plan = db.prepare(`EXPLAIN QUERY PLAN ${query.sql}`).all(...query.params);
    
    const hasScan = plan.some(row => 
      row.detail?.toLowerCase().includes('scan') && 
      !row.detail?.toLowerCase().includes('index')
    );
    
    const hasIndexScan = plan.some(row => 
      row.detail?.toLowerCase().includes('using index') ||
      row.detail?.toLowerCase().includes('search using')
    );
    
    analysis.push({
      name: query.name,
      sql: query.sql,
      hasScan,
      hasIndexScan,
      plan: plan.map(p => p.detail).join(' | '),
      status: hasIndexScan ? 'OPTIMIZED' : (hasScan ? 'NEEDS_INDEX' : 'CHECK')
    });
  } catch (err) {
    // Query might fail if FTS table doesn't exist, etc.
    analysis.push({
      name: query.name,
      sql: query.sql,
      error: err.message,
      status: 'ERROR'
    });
  }
}

// Categorize results
const needsIndex = analysis.filter(a => a.status === 'NEEDS_INDEX');
const optimized = analysis.filter(a => a.status === 'OPTIMIZED');
const errors = analysis.filter(a => a.status === 'ERROR');

// Generate recommendations
const recommendations = [];

// Check for missing indexes based on query patterns
const indexChecks = [
  {
    column: 'state',
    table: 'locations',
    reason: 'State filtering is common for regional searches'
  },
  {
    column: 'permit_required',
    table: 'locations',
    reason: 'Users filter by permit requirements'
  },
  {
    column: 'water_available',
    table: 'locations',
    reason: 'Water availability is a key filter for camping'
  },
  {
    column: 'cost_per_night',
    table: 'locations',
    reason: 'Cost filtering for budget planning'
  },
  {
    column: 'distance_miles',
    table: 'locations',
    reason: 'Sorting/filtering by trail length'
  }
];

for (const check of indexChecks) {
  const indexExists = existingIndexes.some(idx => 
    idx.tbl_name === check.table && 
    idx.sql?.includes(check.column)
  );
  
  if (!indexExists) {
    recommendations.push({
      table: check.table,
      column: check.column,
      reason: check.reason,
      priority: 'MEDIUM',
      sql: `CREATE INDEX idx_${check.table}_${check.column} ON ${check.table}(${check.column});`
    });
  }
}

// Generate markdown report
let report = `# Missing Indexes Analysis Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total queries analyzed:** ${analysis.length}
- **Optimized (using indexes):** ${optimized.length}
- **Needs optimization (table scans):** ${needsIndex.length}
- **Errors/Not applicable:** ${errors.length}
- **Recommendations:** ${recommendations.length} new indexes suggested

---

## Query Performance Analysis

### ✅ Optimized Queries (${optimized.length})

These queries are already using indexes efficiently:

`;

for (const q of optimized) {
  report += `\n**${q.name}**\n`;
  report += `\`\`\`sql\n${q.sql}\n\`\`\`\n`;
  report += `Plan: ${q.plan}\n`;
}

report += `\n---\n\n### ⚠️ Queries Needing Optimization (${needsIndex.length})\n\n`;
report += `These queries perform table scans and could benefit from indexes:\n\n`;

for (const q of needsIndex) {
  report += `\n**${q.name}**\n`;
  report += `\`\`\`sql\n${q.sql}\n\`\`\`\n`;
  report += `Plan: ${q.plan}\n`;
  report += `**Issue:** Full table scan - no index used\n`;
}

if (errors.length > 0) {
  report += `\n---\n\n### ❌ Queries with Errors (${errors.length})\n\n`;
  
  for (const q of errors) {
    report += `\n**${q.name}**\n`;
    report += `Error: ${q.error}\n`;
  }
}

report += `\n---\n\n## Recommended Indexes\n\n`;

if (recommendations.length > 0) {
  report += `### Priority: MEDIUM\n\n`;
  report += `These indexes would improve query performance for common use cases:\n\n`;
  
  for (const rec of recommendations) {
    report += `\n**${rec.table}.${rec.column}**\n`;
    report += `- Reason: ${rec.reason}\n`;
    report += `- SQL:\n  \`\`\`sql\n  ${rec.sql}\n  \`\`\`\n`;
  }
  
  report += `\n### Apply All Recommended Indexes\n\n`;
  report += `\`\`\`sql\n`;
  for (const rec of recommendations) {
    report += `${rec.sql}\n`;
  }
  report += `\`\`\`\n`;
} else {
  report += `✅ No missing indexes detected. Current index coverage is good!\n`;
}

report += `\n---\n\n## Index Maintenance Tips\n\n`;
report += `1. **Run ANALYZE regularly** - Updates query planner statistics\n`;
report += `   \`\`\`sql\n   ANALYZE;\n   \`\`\`\n\n`;
report += `2. **Monitor query performance** - Use EXPLAIN QUERY PLAN for slow queries\n`;
report += `3. **Avoid over-indexing** - Too many indexes slow down INSERTs/UPDATEs\n`;
report += `4. **Compound indexes** - Consider multi-column indexes for common filter combinations\n`;
report += `5. **Index selectivity** - Indexes work best on columns with high cardinality\n\n`;

report += `---\n\n## Current Index Coverage\n\n`;
report += `**Locations table:** ${existingIndexes.filter(i => i.tbl_name === 'locations').length} indexes\n`;
report += `**Trip_stops table:** ${existingIndexes.filter(i => i.tbl_name === 'trip_stops').length} indexes\n`;
report += `**Trips table:** ${existingIndexes.filter(i => i.tbl_name === 'trips').length} indexes\n\n`;

report += `### All Existing Indexes\n\n`;
for (const idx of existingIndexes) {
  if (idx.sql) {
    report += `- \`${idx.name}\` on \`${idx.tbl_name}\`\n`;
  }
}

report += `\n---\n\n*Report generated by analyze-missing-indexes.js*\n`;

// Save report
fs.writeFileSync('./MISSING-INDEXES-REPORT.md', report);
console.log('✅ Analysis complete!');
console.log(`📄 Report saved to: MISSING-INDEXES-REPORT.md\n`);

// Print summary
console.log('📊 Summary:');
console.log(`  Queries analyzed: ${analysis.length}`);
console.log(`  Optimized: ${optimized.length}`);
console.log(`  Needs optimization: ${needsIndex.length}`);
console.log(`  Recommended indexes: ${recommendations.length}`);

if (recommendations.length > 0) {
  console.log(`\n💡 Recommended indexes:`);
  for (const rec of recommendations) {
    console.log(`  - ${rec.table}.${rec.column} (${rec.reason})`);
  }
  
  console.log(`\nTo apply all recommended indexes:`);
  console.log(`  Check MISSING-INDEXES-REPORT.md for SQL statements\n`);
}

db.close();
