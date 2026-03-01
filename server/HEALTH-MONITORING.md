# Database Health Monitoring

## Overview
Real-time health metrics for TrailCamp database monitoring and alerting.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
node generate-health-metrics.js
```

**Output:** `health-metrics.json` (updated with latest metrics)

## Metrics Collected

### 1. Health Status
- **Overall status:** healthy, degraded, or critical
- **Quality score:** 0-100% based on data completeness
- **Integrity check:** Database PRAGMA integrity_check result
- **Issues:** Critical problems requiring immediate action
- **Warnings:** Non-critical concerns

### 2. Database Stats
- Total locations (riding, campsites, trips)
- Database file size (bytes and human-readable)
- Trip and trip stop counts

### 3. Data Quality
- Missing coordinates
- Missing scenery ratings
- Missing names
- Invalid coordinate ranges
- Orphaned trip stops

### 4. Performance
- Recent benchmark results (if available)
- Average query time
- Slowest and fastest queries

### 5. Backup Status
- Backup count
- Latest backup timestamp
- Oldest backup age (for retention tracking)

## Health Status Levels

### Healthy ✅
- No critical issues
- Data quality >95%
- Database integrity OK
- Recent backups exist

### Degraded ⚠️
- Minor data quality issues
- Old backups (>48 hours)
- Missing scenery ratings (>100)
- Orphaned records

### Critical 🚨
- Invalid coordinates exist
- Database integrity FAILED
- No backups
- Orphaned trip stops

## Example Output

```json
{
  "generatedAt": "2026-02-28T22:16:00.000Z",
  "health": {
    "status": "healthy",
    "qualityScore": 100,
    "integrityCheck": "ok",
    "issues": [],
    "warnings": []
  },
  "database": {
    "sizeBytes": 10383360,
    "sizeHuman": "9.9MB",
    "totalLocations": 6148,
    "riding": 1394,
    "campsites": 4742,
    "trips": 3,
    "tripStops": 0
  },
  "dataQuality": {
    "score": 100,
    "missingCoordinates": 0,
    "missingScenery": 0,
    "missingNames": 0,
    "invalidCoordinates": 0,
    "orphanedTripStops": 0
  },
  "performance": {
    "timestamp": "2026-02-28 22:11:45",
    "avgMs": 7,
    "slowestMs": 25,
    "fastestMs": 3
  },
  "backups": {
    "count": 2,
    "latest": "2026-03-01T02:20:37.758Z",
    "oldestDays": 0
  }
}
```

## API Integration

### Serve via Express
```javascript
// server/src/index.ts
app.get('/api/health', (req, res) => {
  const metrics = JSON.parse(fs.readFileSync('./health-metrics.json', 'utf8'));
  res.json(metrics);
});
```

### Frontend Dashboard
```javascript
const response = await fetch('/api/health');
const health = await response.json();

// Display status
document.getElementById('status').textContent = health.health.status;
document.getElementById('quality').textContent = health.health.qualityScore + '%';

// Show alerts
if (health.health.issues.length > 0) {
  showCriticalAlert(health.health.issues);
}
```

## Automated Monitoring

### Cron Job (Hourly Updates)
```bash
# Update health metrics every hour
0 * * * * cd /Users/nicosstrnad/Projects/trailcamp/server && node generate-health-metrics.js > /dev/null 2>&1
```

### Alert on Issues
```bash
#!/bin/bash
# health-check.sh

cd /Users/nicosstrnad/Projects/trailcamp/server
node generate-health-metrics.js

status=$(cat health-metrics.json | jq -r '.health.status')

if [ "$status" = "critical" ]; then
    # Send alert (email, Slack, PagerDuty, etc.)
    echo "CRITICAL: Database health check failed" | mail -s "TrailCamp Alert" admin@example.com
fi

if [ "$status" = "degraded" ]; then
    # Send warning
    echo "WARNING: Database health degraded" | mail -s "TrailCamp Warning" admin@example.com
fi
```

### Prometheus Integration
```bash
# Export metrics in Prometheus format
cat health-metrics.json | jq -r '
  "trailcamp_locations_total \(.database.totalLocations)",
  "trailcamp_quality_score \(.dataQuality.score)",
  "trailcamp_performance_avg_ms \(.performance.avgMs // 0)",
  "trailcamp_backup_count \(.backups.count)"
'
```

## Dashboard Widgets

### Status Badge
```html
<div class="status-badge status-${health.health.status}">
  ${health.health.status.toUpperCase()}
</div>
```

### Quality Score
```html
<div class="quality-score">
  <div class="score-value">${health.health.qualityScore}%</div>
  <div class="score-label">Data Quality</div>
</div>
```

### Recent Issues
```html
<ul class="issues-list">
  ${health.health.issues.map(issue => `<li class="issue">${issue}</li>`).join('')}
  ${health.health.warnings.map(warn => `<li class="warning">${warn}</li>`).join('')}
</ul>
```

### Database Stats
```html
<div class="stats-grid">
  <div class="stat">
    <span class="stat-value">${health.database.totalLocations}</span>
    <span class="stat-label">Locations</span>
  </div>
  <div class="stat">
    <span class="stat-value">${health.database.sizeHuman}</span>
    <span class="stat-label">Database Size</span>
  </div>
  <div class="stat">
    <span class="stat-value">${health.performance?.avgMs || 'N/A'}ms</span>
    <span class="stat-label">Avg Query Time</span>
  </div>
</div>
```

## Alerting Rules

### Critical (Immediate Action)
- `health.status === 'critical'`
- `health.integrityCheck === 'failed'`
- `dataQuality.invalidCoordinates > 0`

### Warning (Action Needed)
- `health.status === 'degraded'`
- `dataQuality.score < 95`
- `backups.count === 0`
- Backup older than 48 hours

### Info (Monitor)
- `dataQuality.missingScenery > 100`
- `performance.avgMs > 50`
- Database size growth >20% in 24 hours

## Troubleshooting

### Metrics Generation Fails
```bash
# Check database exists
ls -lh trailcamp.db

# Check permissions
chmod 644 trailcamp.db

# Run with error output
node generate-health-metrics.js
```

### Status Shows Degraded
1. Check `issues` and `warnings` arrays
2. Run data quality check: `./check-data-quality.sh`
3. Review recent changes in git log
4. Check disk space: `df -h`

### Performance Metrics Missing
Run benchmarks first:
```bash
./run-benchmarks.sh
node generate-health-metrics.js
```

### Backup Warnings
```bash
# Create initial backup
./backup-database.sh

# Verify backup
./verify-backup.sh backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql
```

## Integration Examples

### Status Page
```html
<!DOCTYPE html>
<html>
<head>
  <title>TrailCamp Status</title>
  <style>
    .healthy { color: #22c55e; }
    .degraded { color: #f59e0b; }
    .critical { color: #ef4444; }
  </style>
</head>
<body>
  <h1>TrailCamp System Status</h1>
  <div id="status"></div>
  
  <script>
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        document.getElementById('status').innerHTML = `
          <h2 class="${data.health.status}">${data.health.status.toUpperCase()}</h2>
          <p>Quality Score: ${data.health.qualityScore}%</p>
          <p>Database: ${data.database.totalLocations} locations (${data.database.sizeHuman})</p>
          <p>Performance: ${data.performance?.avgMs || 'N/A'}ms avg</p>
        `;
      });
  </script>
</body>
</html>
```

### Slack Webhook
```bash
#!/bin/bash
# slack-alert.sh

metrics=$(cat health-metrics.json)
status=$(echo "$metrics" | jq -r '.health.status')
quality=$(echo "$metrics" | jq -r '.health.qualityScore')

if [ "$status" != "healthy" ]; then
  curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"⚠️ TrailCamp Health: $status (Quality: $quality%)\"}"
fi
```

---

*Last updated: 2026-02-28*
*Script: generate-health-metrics.js*
*Current status: HEALTHY (100% quality)*
