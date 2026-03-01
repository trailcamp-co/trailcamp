# Usage Statistics Tracking

## Overview
Automatic logging and analysis of API endpoint usage, query patterns, and performance metrics.

## Setup

### 1. Run Migration
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
sqlite3 trailcamp.db < migrations/005_add_usage_stats.sql
```

### 2. Add Middleware to Express
Edit `server/src/index.ts`:
```typescript
import { usageLogger } from './middleware/usage-logger';

// Add after other middleware, before routes
app.use(usageLogger);
```

### 3. Restart Dev Server
```bash
npm run dev
```

## Usage Statistics Table

### Schema
```sql
CREATE TABLE usage_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    query_params TEXT,
    response_time_ms INTEGER,
    status_code INTEGER,
    user_agent TEXT,
    ip_address TEXT
);
```

### Indexes
- `idx_usage_timestamp` - For time-based queries
- `idx_usage_endpoint` - For endpoint analysis
- `idx_usage_status` - For status code filtering

## Analyzing Usage

### Manual Analysis
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
node analyze-usage.js
```

### Automated Weekly Report (Cron)
```bash
# Add to crontab (run `crontab -e`)
# Every Monday at 9:00 AM
0 9 * * 1 cd /Users/nicosstrnad/Projects/trailcamp/server && node analyze-usage.js >> ./logs/usage-analysis.log 2>&1
```

## Reports Generated

### Console Output
- Top 10 endpoints by request count
- Slowest endpoints (>100ms avg)
- Popular query parameters
- Status code distribution
- Activity by hour (last 24h)

### Markdown Report
Saved to: `reports/usage-stats-YYYY-MM-DD.md`

Contains:
- Summary statistics
- Top endpoints table
- Performance analysis
- Status code breakdown

## Insights You Can Gain

### Popular Features
```sql
-- Most used endpoints
SELECT endpoint, COUNT(*) as requests
FROM usage_stats
GROUP BY endpoint
ORDER BY requests DESC
LIMIT 10;
```

### Search Patterns
```sql
-- Common query parameters
SELECT query_params, COUNT(*) as count
FROM usage_stats
WHERE query_params IS NOT NULL
GROUP BY query_params
ORDER BY count DESC;
```

### Performance Monitoring
```sql
-- Find slow queries
SELECT 
  endpoint,
  AVG(response_time_ms) as avg_ms,
  MAX(response_time_ms) as max_ms
FROM usage_stats
GROUP BY endpoint
HAVING avg_ms > 200
ORDER BY avg_ms DESC;
```

### Usage Trends
```sql
-- Requests per day (last 30 days)
SELECT 
  DATE(timestamp) as day,
  COUNT(*) as requests
FROM usage_stats
WHERE datetime(timestamp) > datetime('now', '-30 days')
GROUP BY day
ORDER BY day DESC;
```

### Error Tracking
```sql
-- 4xx/5xx errors
SELECT 
  endpoint,
  status_code,
  COUNT(*) as errors
FROM usage_stats
WHERE status_code >= 400
GROUP BY endpoint, status_code
ORDER BY errors DESC;
```

## Privacy & Storage

### Data Retention
Consider cleaning old logs periodically:
```sql
-- Delete logs older than 90 days
DELETE FROM usage_stats 
WHERE datetime(timestamp) < datetime('now', '-90 days');
```

### Automated Cleanup Script
```bash
#!/bin/bash
# cleanup-usage-stats.sh

sqlite3 trailcamp.db << 'SQL'
DELETE FROM usage_stats 
WHERE datetime(timestamp) < datetime('now', '-90 days');

SELECT 'Deleted ' || changes() || ' old usage records';
SQL
```

### Privacy Considerations
- IP addresses are logged (for debugging, not analytics)
- No personal data is logged
- User-agent strings may contain device info
- Consider anonymizing IPs for production

## Integration

### Dashboard Data
Include usage stats in dashboard:
```javascript
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_requests,
    COUNT(DISTINCT endpoint) as unique_endpoints,
    ROUND(AVG(response_time_ms), 0) as avg_response_time
  FROM usage_stats
  WHERE datetime(timestamp) > datetime('now', '-7 days')
`).get();
```

### Real-time Monitoring
```javascript
// Get requests in last hour
const recentRequests = db.prepare(`
  SELECT COUNT(*) as count
  FROM usage_stats
  WHERE datetime(timestamp) > datetime('now', '-1 hour')
`).get().count;

if (recentRequests > 1000) {
  console.log('⚠️ High traffic detected');
}
```

## Performance Impact

### Minimal Overhead
- Uses `setImmediate` to avoid blocking responses
- Prepared statements for fast inserts
- Indexes on common query patterns

### Expected Impact
- < 1ms added to response time
- ~100 bytes per request logged
- 1 million requests ≈ 100MB database growth

## Troubleshooting

### "Table does not exist"
**Fix:** Run migration first:
```bash
sqlite3 trailcamp.db < migrations/005_add_usage_stats.sql
```

### Middleware not logging
**Check:**
1. Middleware is imported and added to Express
2. Middleware is before route handlers
3. Database path is correct

### Database growing too large
**Solution:**
```bash
# Run cleanup script monthly
./cleanup-usage-stats.sh

# Or set up cron
0 0 1 * * /path/to/cleanup-usage-stats.sh
```

## Example Queries

### Busiest Hours
```sql
SELECT 
  strftime('%H:00', timestamp) as hour,
  COUNT(*) as requests
FROM usage_stats
GROUP BY hour
ORDER BY requests DESC;
```

### Most Common Filters
```sql
SELECT 
  json_extract(query_params, '$.category') as category,
  COUNT(*) as uses
FROM usage_stats
WHERE query_params LIKE '%category%'
GROUP BY category
ORDER BY uses DESC;
```

### Response Time Percentiles
```sql
SELECT 
  endpoint,
  MIN(response_time_ms) as min,
  MAX(response_time_ms) as max,
  AVG(response_time_ms) as avg
FROM usage_stats
GROUP BY endpoint;
```

---

*Last updated: 2026-02-28*
*Migration: 005_add_usage_stats.sql*
*Middleware: src/middleware/usage-logger.ts*
