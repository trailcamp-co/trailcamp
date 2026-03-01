#!/usr/bin/env node
// Generate Performance Report from Query Logs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATS_FILE = path.join(__dirname, 'logs/query-stats.json');
const SLOW_LOG_FILE = path.join(__dirname, 'logs/slow-queries.json');
const REPORT_FILE = path.join(__dirname, 'logs/PERFORMANCE-REPORT.md');

const SLOW_QUERY_THRESHOLD_MS = 100;

// Load stats
let stats = null;
if (fs.existsSync(STATS_FILE)) {
  stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
} else {
  console.log('⚠️  No query stats found. Enable query logger middleware first.\n');
  process.exit(1);
}

// Load slow queries
let slowQueries = [];
if (fs.existsSync(SLOW_LOG_FILE)) {
  slowQueries = JSON.parse(fs.readFileSync(SLOW_LOG_FILE, 'utf8'));
}

// Generate report
let report = `# Query Performance Report

*Generated: ${new Date().toISOString()}*

## Summary

- **Total Requests:** ${stats.totalRequests.toLocaleString()}
- **Average Response Time:** ${stats.averageResponseTime}ms
- **Slow Queries (>${SLOW_QUERY_THRESHOLD_MS}ms):** ${stats.slowQueries} (${Math.round((stats.slowQueries / stats.totalRequests) * 100)}%)

---

## Performance by Endpoint

`;

const sortedEndpoints = Object.entries(stats.byEndpoint)
  .map(([endpoint, epStats]) => ({ endpoint, ...epStats }))
  .sort((a, b) => b.avgTime - a.avgTime);

report += '| Endpoint | Avg Time | Min | Max | Requests |\n';
report += '|----------|----------|-----|-----|----------|\n';

for (const ep of sortedEndpoints) {
  report += `| ${ep.endpoint} | ${ep.avgTime}ms | ${ep.minTime}ms | ${ep.maxTime}ms | ${ep.count} |\n`;
}

// Slowest individual queries
if (stats.slowestQueries && stats.slowestQueries.length > 0) {
  report += '\n---\n\n## Top 20 Slowest Individual Queries\n\n';
  report += '| Timestamp | Method | Path | Duration |\n';
  report += '|-----------|--------|------|----------|\n';
  
  for (const query of stats.slowestQueries) {
    const time = new Date(query.timestamp).toISOString();
    report += `| ${time} | ${query.method} | ${query.path} | ${query.duration}ms |\n`;
  }
}

// Recent slow queries
if (slowQueries.length > 0) {
  report += '\n---\n\n## Recent Slow Queries (Last 20)\n\n';
  report += '| Timestamp | Method | Path | Duration |\n';
  report += '|-----------|--------|------|----------|\n`;
  
  const recent = slowQueries.slice(-20).reverse();
  for (const query of recent) {
    const time = new Date(query.timestamp).toISOString();
    report += `| ${time} | ${query.method} | ${query.path} | ${query.duration}ms |\n`;
  }
}

// Analysis & Recommendations
report += '\n---\n\n## Analysis & Recommendations\n\n';

const highAvgEndpoints = sortedEndpoints.filter(ep => ep.avgTime > SLOW_QUERY_THRESHOLD_MS);

if (highAvgEndpoints.length > 0) {
  report += `### ⚠️ ${highAvgEndpoints.length} Endpoints Averaging >${SLOW_QUERY_THRESHOLD_MS}ms\n\n`;
  
  for (const ep of highAvgEndpoints.slice(0, 10)) {
    report += `**${ep.endpoint}** - ${ep.avgTime}ms avg (${ep.count} requests)\n`;
    report += `- Min: ${ep.minTime}ms, Max: ${ep.maxTime}ms\n`;
    
    if (ep.avgTime > 500) {
      report += `- 🚨 **CRITICAL**: Consistently slow, immediate optimization needed\n`;
    } else if (ep.avgTime > 200) {
      report += `- ⚠️ **WARNING**: Above target, should be optimized\n`;
    } else {
      report += `- ℹ️ Minor optimization could improve performance\n`;
    }
    report += '\n';
  }
  
  report += '### Optimization Strategies\n\n';
  report += '1. **Database Indexes**\n';
  report += '   - Add indexes on frequently queried columns\n';
  report += '   - Check EXPLAIN QUERY PLAN for missing indexes\n\n';
  
  report += '2. **Caching**\n';
  report += '   - Implement Redis or in-memory cache for frequently accessed data\n';
  report += '   - Cache static/rarely-changing data (locations, trips)\n\n';
  
  report += '3. **Query Optimization**\n';
  report += '   - Limit result sets with pagination\n';
  report += '   - Avoid SELECT * when possible\n';
  report += '   - Use prepared statements\n\n';
  
  report += '4. **Database Connection Pooling**\n';
  report += '   - Reuse database connections\n';
  report += '   - Reduce connection overhead\n\n';
} else {
  report += '### ✅ Performance Excellent\n\n';
  report += 'All endpoints are performing well with average response times under 100ms.\n\n';
  report += 'Maintain current optimization strategies:\n';
  report += '- Continue using database indexes\n';
  report += '- Monitor as data grows\n';
  report += '- Regular performance testing\n\n';
}

// Stats by response time buckets
const buckets = {
  'under_50ms': 0,
  '50_100ms': 0,
  '100_200ms': 0,
  '200_500ms': 0,
  'over_500ms': 0
};

for (const ep of sortedEndpoints) {
  if (ep.avgTime < 50) buckets['under_50ms'] += ep.count;
  else if (ep.avgTime < 100) buckets['50_100ms'] += ep.count;
  else if (ep.avgTime < 200) buckets['100_200ms'] += ep.count;
  else if (ep.avgTime < 500) buckets['200_500ms'] += ep.count;
  else buckets['over_500ms'] += ep.count;
}

report += '### Response Time Distribution\n\n';
report += '| Response Time | Requests | Percentage |\n';
report += '|--------------|----------|------------|\n';
report += `| < 50ms | ${buckets['under_50ms']} | ${Math.round((buckets['under_50ms'] / stats.totalRequests) * 100)}% |\n`;
report += `| 50-100ms | ${buckets['50_100ms']} | ${Math.round((buckets['50_100ms'] / stats.totalRequests) * 100)}% |\n`;
report += `| 100-200ms | ${buckets['100_200ms']} | ${Math.round((buckets['100_200ms'] / stats.totalRequests) * 100)}% |\n`;
report += `| 200-500ms | ${buckets['200_500ms']} | ${Math.round((buckets['200_500ms'] / stats.totalRequests) * 100)}% |\n`;
report += `| > 500ms | ${buckets['over_500ms']} | ${Math.round((buckets['over_500ms'] / stats.totalRequests) * 100)}% |\n`;

report += '\n---\n\n*Report generated by generate-performance-report.js*\n';

// Save report
fs.writeFileSync(REPORT_FILE, report);

console.log('✅ Performance report generated!\n');
console.log(`📄 Saved to: ${REPORT_FILE}\n`);
console.log('📊 Summary:');
console.log(`  Total requests: ${stats.totalRequests.toLocaleString()}`);
console.log(`  Average response time: ${stats.averageResponseTime}ms`);
console.log(`  Slow queries: ${stats.slowQueries} (${Math.round((stats.slowQueries / stats.totalRequests) * 100)}%)`);

if (highAvgEndpoints.length > 0) {
  console.log(`\n⚠️  ${highAvgEndpoints.length} endpoints need optimization`);
} else {
  console.log('\n✅ All endpoints performing well');
}

console.log('');
