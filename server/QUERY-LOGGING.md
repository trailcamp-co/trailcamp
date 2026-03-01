# Query Performance Logging

## Overview
Automatically logs slow queries and tracks API performance metrics for optimization and monitoring.

## Features

### ✅ Automatic Slow Query Detection
- Logs queries exceeding threshold (default: 100ms)
- Captures timestamp, endpoint, duration
- Stores last 1000 slow queries

### ✅ Performance Statistics
- Tracks all API requests
- Per-endpoint averages, min, max
- Response time distribution
- Identifies optimization opportunities

### ✅ Performance Reports
- Generate markdown reports on demand
- View slowest endpoints
- Track trends over time
- Export data as JSON

## Setup

### 1. Add Middleware to Express App

Edit `server/src/index.ts`:

```typescript
import { queryLogger } from './middleware/queryLogger';

const app = express();

// Add query logger middleware (before routes)
app.use(queryLogger);

// Your routes here
app.get('/api/locations', ...);
```

### 2. Create Logs Directory

```bash
mkdir -p server/logs
```

### 3. Add to .gitignore

```
# server/.gitignore
logs/
*.log
```

## Usage

### View Current Stats

Stats are automatically saved to `server/logs/query-stats.json`:

```bash
cat server/logs/query-stats.json
```

### Generate Performance Report

```bash
cd server
node generate-performance-report.js
```

Output: `server/logs/PERFORMANCE-REPORT.md`

### View Slow Query Log

```bash
cat server/logs/slow-queries.json | jq '.'
```

## Configuration

### Change Slow Query Threshold

Edit `server/src/middleware/queryLogger.ts`:

```typescript
const SLOW_QUERY_THRESHOLD_MS = 200; // Change from 100ms to 200ms
```

### Log Retention

Slow query log keeps last 1000 entries automatically. To change:

```typescript
// In queryLogger.ts
if (logs.length > 2000) {  // Change from 1000
  logs.shift();
}
```

## Performance Report

Example report structure:

```markdown
# Query Performance Report

## Summary
- Total Requests: 15,432
- Average Response Time: 45ms
- Slow Queries (>100ms): 127 (0.8%)

## Performance by Endpoint

| Endpoint | Avg Time | Min | Max | Requests |
|----------|----------|-----|-----|----------|
| GET /api/locations | 78ms | 12ms | 245ms | 8,234 |
| GET /api/trips | 23ms | 8ms | 67ms | 1,456 |
...

## Top 20 Slowest Individual Queries

| Timestamp | Method | Path | Duration |
|-----------|--------|------|----------|
| 2026-02-28T... | GET | /api/locations?category=riding | 245ms |
...

## Analysis & Recommendations

### ⚠️ 3 Endpoints Averaging >100ms

**GET /api/locations** - 135ms avg
- Recommendation: Add index on category column
- Consider pagination for large result sets
```

## Monitoring

### Check Performance Regularly

```bash
# Weekly performance check
cd server
node generate-performance-report.js

# Review report
cat logs/PERFORMANCE-REPORT.md
```

### Set Up Alerts

Monitor for degrading performance:

```bash
#!/bin/bash
# check-performance.sh

avg=$(cat logs/query-stats.json | jq '.averageResponseTime')

if [ "$avg" -gt 200 ]; then
  echo "WARNING: Average response time is ${avg}ms"
  # Send alert (email, Slack, etc.)
fi
```

### Cron Job

```cron
# Generate weekly performance report
0 0 * * 0 cd /path/to/trailcamp/server && node generate-performance-report.js
```

## Data Files

### query-stats.json

Cumulative statistics:

```json
{
  "totalRequests": 15432,
  "slowQueries": 127,
  "averageResponseTime": 45,
  "totalResponseTime": 694440,
  "byEndpoint": {
    "GET /api/locations": {
      "count": 8234,
      "totalTime": 642252,
      "avgTime": 78,
      "maxTime": 245,
      "minTime": 12
    }
  },
  "slowestQueries": [...]
}
```

### slow-queries.json

Individual slow query logs:

```json
[
  {
    "timestamp": "2026-02-28T19:45:23.456Z",
    "method": "GET",
    "path": "/api/locations",
    "duration": 245,
    "statusCode": 200
  }
]
```

## Best Practices

### 1. Regular Monitoring
- Generate weekly reports
- Track trends over time
- Act on performance degradation early

### 2. Optimization Workflow
1. Identify slow endpoints in report
2. Run EXPLAIN QUERY PLAN on database queries
3. Add indexes or optimize queries
4. Re-test and verify improvement
5. Document changes

### 3. Performance Targets
- **Excellent:** < 50ms average
- **Good:** 50-100ms average
- **Acceptable:** 100-200ms average
- **Needs optimization:** > 200ms average

### 4. Reset Stats Periodically
After major optimizations, reset to get clean baseline:

```typescript
import { resetQueryStats } from './middleware/queryLogger';

// Reset stats (removes all historical data)
resetQueryStats();
```

## Troubleshooting

### Stats Not Saving
- Ensure `logs/` directory exists with write permissions
- Check server logs for errors
- Verify middleware is loaded before routes

### Report Shows No Data
- Middleware must be active and receiving requests
- Generate traffic to API endpoints
- Check that stats file exists: `ls -la server/logs/`

### High Memory Usage
- Slow query log limited to 1000 entries automatically
- Stats saved every 100 requests (configurable)
- Consider external logging service for high-traffic apps

## Integration with External Tools

### Export to Prometheus
```typescript
// Add metrics endpoint
app.get('/metrics', (req, res) => {
  const stats = getQueryStats();
  res.send(`
# HELP api_requests_total Total API requests
# TYPE api_requests_total counter
api_requests_total ${stats.totalRequests}

# HELP api_response_time_avg Average response time
# TYPE api_response_time_avg gauge
api_response_time_avg ${stats.averageResponseTime}
  `);
});
```

### Send to Datadog/New Relic
```typescript
// In queryLogger middleware
if (duration > SLOW_QUERY_THRESHOLD_MS) {
  // Send to APM service
  datadogClient.timing('api.response_time', duration, [`endpoint:${endpoint}`]);
}
```

---

*Last updated: 2026-02-28*
*Middleware: queryLogger.ts*
*Report generator: generate-performance-report.js*
