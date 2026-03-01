// Query Performance Logger Middleware
// Tracks slow queries and generates performance reports

import fs from 'fs';
import path from 'path';

interface QueryLog {
  timestamp: string;
  method: string;
  path: string;
  duration: number;
  statusCode?: number;
}

const SLOW_QUERY_THRESHOLD_MS = 100; // Log queries slower than this
const LOG_FILE = path.join(__dirname, '../../logs/slow-queries.json');
const STATS_FILE = path.join(__dirname, '../../logs/query-stats.json');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// In-memory query stats
const queryStats = {
  totalRequests: 0,
  slowQueries: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  byEndpoint: {} as Record<string, { count: number; totalTime: number; avgTime: number; maxTime: number; minTime: number }>,
  slowestQueries: [] as QueryLog[]
};

// Load existing stats if available
if (fs.existsSync(STATS_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    Object.assign(queryStats, data);
  } catch (err) {
    console.error('Failed to load query stats:', err);
  }
}

export function queryLogger(req: any, res: any, next: any) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // Override res.send to capture response time
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.path}`;
    
    // Update global stats
    queryStats.totalRequests++;
    queryStats.totalResponseTime += duration;
    queryStats.averageResponseTime = Math.round(queryStats.totalResponseTime / queryStats.totalRequests);
    
    // Update endpoint-specific stats
    if (!queryStats.byEndpoint[endpoint]) {
      queryStats.byEndpoint[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      };
    }
    
    const endpointStats = queryStats.byEndpoint[endpoint];
    endpointStats.count++;
    endpointStats.totalTime += duration;
    endpointStats.avgTime = Math.round(endpointStats.totalTime / endpointStats.count);
    endpointStats.maxTime = Math.max(endpointStats.maxTime, duration);
    endpointStats.minTime = Math.min(endpointStats.minTime, duration);
    
    // Log slow queries
    if (duration > SLOW_QUERY_THRESHOLD_MS) {
      queryStats.slowQueries++;
      
      const logEntry: QueryLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        duration,
        statusCode: res.statusCode
      };
      
      // Append to slow query log
      const logs = loadSlowQueryLog();
      logs.push(logEntry);
      
      // Keep only last 1000 slow queries
      if (logs.length > 1000) {
        logs.shift();
      }
      
      fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
      
      // Update slowest queries (top 20)
      queryStats.slowestQueries.push(logEntry);
      queryStats.slowestQueries.sort((a, b) => b.duration - a.duration);
      queryStats.slowestQueries = queryStats.slowestQueries.slice(0, 20);
      
      console.log(`[SLOW QUERY] ${endpoint} - ${duration}ms`);
    }
    
    // Save stats periodically (every 100 requests)
    if (queryStats.totalRequests % 100 === 0) {
      saveStats();
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

function loadSlowQueryLog(): QueryLog[] {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
  } catch (err) {
    console.error('Failed to load slow query log:', err);
    return [];
  }
}

function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(queryStats, null, 2));
  } catch (err) {
    console.error('Failed to save query stats:', err);
  }
}

// Generate performance report
export function generatePerformanceReport(): string {
  const sortedEndpoints = Object.entries(queryStats.byEndpoint)
    .map(([endpoint, stats]) => ({ endpoint, ...stats }))
    .sort((a, b) => b.avgTime - a.avgTime);
  
  let report = '# Query Performance Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += '## Summary\n\n';
  report += `- Total Requests: ${queryStats.totalRequests}\n`;
  report += `- Average Response Time: ${queryStats.averageResponseTime}ms\n`;
  report += `- Slow Queries (>${SLOW_QUERY_THRESHOLD_MS}ms): ${queryStats.slowQueries} (${Math.round((queryStats.slowQueries / queryStats.totalRequests) * 100)}%)\n\n`;
  
  report += '## Slowest Endpoints (by average)\n\n';
  report += '| Endpoint | Avg | Min | Max | Count |\n';
  report += '|----------|-----|-----|-----|-------|\n';
  
  for (const ep of sortedEndpoints.slice(0, 20)) {
    report += `| ${ep.endpoint} | ${ep.avgTime}ms | ${ep.minTime}ms | ${ep.maxTime}ms | ${ep.count} |\n`;
  }
  
  if (queryStats.slowestQueries.length > 0) {
    report += '\n## Top 10 Slowest Individual Queries\n\n';
    report += '| Time | Method | Path | Duration |\n';
    report += '|------|--------|------|----------|\n';
    
    for (const query of queryStats.slowestQueries.slice(0, 10)) {
      const time = new Date(query.timestamp).toLocaleTimeString();
      report += `| ${time} | ${query.method} | ${query.path} | ${query.duration}ms |\n`;
    }
  }
  
  report += '\n## Recommendations\n\n';
  
  const highAvgEndpoints = sortedEndpoints.filter(ep => ep.avgTime > SLOW_QUERY_THRESHOLD_MS);
  if (highAvgEndpoints.length > 0) {
    report += `⚠️ **${highAvgEndpoints.length} endpoints averaging >${SLOW_QUERY_THRESHOLD_MS}ms:**\n\n`;
    for (const ep of highAvgEndpoints.slice(0, 5)) {
      report += `- ${ep.endpoint} (${ep.avgTime}ms avg, ${ep.count} requests)\n`;
    }
    report += '\nConsider:\n';
    report += '- Adding database indexes\n';
    report += '- Implementing caching\n';
    report += '- Optimizing query logic\n';
    report += '- Paginating results\n\n';
  } else {
    report += '✅ All endpoints performing well (average <100ms)\n\n';
  }
  
  return report;
}

// Reset stats (for testing or periodic reset)
export function resetQueryStats() {
  queryStats.totalRequests = 0;
  queryStats.slowQueries = 0;
  queryStats.averageResponseTime = 0;
  queryStats.totalResponseTime = 0;
  queryStats.byEndpoint = {};
  queryStats.slowestQueries = [];
  saveStats();
}

// Export current stats
export function getQueryStats() {
  return queryStats;
}

// Graceful shutdown - save stats
process.on('SIGTERM', saveStats);
process.on('SIGINT', saveStats);
process.on('exit', saveStats);
