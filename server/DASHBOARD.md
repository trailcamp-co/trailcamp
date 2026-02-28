# Admin Dashboard Data

## Overview
Generates comprehensive monitoring data for TrailCamp in JSON format, suitable for admin dashboards, monitoring systems, or status pages.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
node generate-dashboard-data.js
```

**Output:** `dashboard-data.json` (updated with latest metrics)

## Data Structure

### 1. Summary
High-level overview metrics:
- Total locations (riding, campsites, boondocking)
- Trip count
- Data quality score (0-100%)
- System health status
- Total trail miles

### 2. Data Quality Scorecard
Individual scores for:
- **Coordinate validity** - All coordinates within valid ranges
- **Scenery ratings** - % of locations with scenery ratings
- **Permit info** - % of permit-required locations with details
- **Trail mileage** - % of riding locations with distance data

### 3. Regional Distribution
Location counts by region:
- Pacific Northwest
- California
- Southwest Desert
- Rocky Mountains
- Great Plains
- Great Lakes
- Southeast
- Northeast
- Alaska
- Hawaii
- Other

Breakdown by category (riding, boondocking, campgrounds) per region.

### 4. Content Statistics
- **Trail miles:** Total and average
- **Cost data:** Free camping count, average paid cost
- **Scenery:** World-class (10/10) count, excellent (8+) count, overall average
- **Difficulty:** Easy, moderate, hard counts

### 5. Coverage Metrics
Percentage of locations with complete data:
- Riding locations with mileage
- Riding locations with difficulty ratings
- Campsites with cost data
- All locations with scenery ratings

### 6. System Health
- Database size
- Backup count
- Last backup timestamp
- Integrity check status

### 7. Top Locations
20 highest-rated locations (9+ scenery rating) with:
- Name
- Category
- Scenery rating
- Region

### 8. Recent Activity
Last 10 trips created (would show creation dates if timestamps existed)

### 9. Alerts & Warnings
Automatically detected issues:
- Missing data (> 100 locations without scenery)
- Invalid coordinates
- Database integrity failures
- Missing backups

## Example Output

```json
{
  "generatedAt": "2026-02-28T20:03:45.678Z",
  "summary": {
    "totalLocations": 6236,
    "riding": 1394,
    "campsites": 4830,
    "boondocking": 639,
    "trips": 3,
    "tripStops": 0,
    "dataQualityScore": 99,
    "systemHealth": "OK",
    "totalTrailMiles": 84665
  },
  "dataQuality": {
    "scorecard": {
      "coordinateValidity": {
        "score": 100,
        "details": "All coordinates valid"
      },
      "sceneryRatings": {
        "score": 100,
        "details": "6236 of 6236 have ratings"
      },
      ...
    },
    "overallScore": 99
  },
  "regionalDistribution": { ... },
  "contentStats": { ... },
  "coverage": { ... },
  "systemHealth": { ... },
  "topLocations": [ ... ],
  "alerts": []
}
```

## Use Cases

### 1. Admin Dashboard Frontend
Load JSON and display key metrics:
```javascript
fetch('/api/dashboard')
  .then(r => r.json())
  .then(data => {
    document.getElementById('total-locations').textContent = data.summary.totalLocations;
    document.getElementById('quality-score').textContent = data.dataQuality.overallScore + '%';
    // ... render charts, alerts, etc.
  });
```

### 2. API Endpoint
Serve dashboard data via Express:
```javascript
// server/src/index.ts
app.get('/api/dashboard', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./dashboard-data.json', 'utf8'));
  res.json(data);
});
```

### 3. Monitoring Integration
Use for uptime monitoring, alerting:
```bash
# Check data quality score
score=$(node generate-dashboard-data.js | grep "Data Quality Score" | awk '{print $4}' | tr -d '%')
if [ $score -lt 95 ]; then
  echo "WARNING: Data quality below 95%"
  # Send alert
fi
```

### 4. Status Page
Generate public-facing status page:
- Overall system health
- Total locations available
- Recent updates
- No sensitive data exposed

## Automation

### Cron Job
Update dashboard data hourly:
```cron
0 * * * * cd /Users/nicosstrnad/Projects/trailcamp/server && node generate-dashboard-data.js > /dev/null 2>&1
```

### Post-Deployment Hook
Regenerate after deploying new data:
```bash
#!/bin/bash
# deploy.sh
cd server
node generate-dashboard-data.js
# Upload dashboard-data.json to CDN or serve via API
```

### Git Automation
Add to .gitignore to avoid committing generated files:
```
# .gitignore
server/dashboard-data.json
```

## Metrics Explained

### Data Quality Score
Calculated as average of individual scorecard items:
- 100% = Perfect data quality
- 95-99% = Excellent (minor gaps acceptable)
- 90-94% = Good (some missing data)
- < 90% = Needs improvement

### System Health
- **OK** - Database integrity check passed
- **FAILED** - Critical issue, restore from backup immediately

### Trail Miles
Sum of all `distance_miles` for riding locations. Represents total available riding across all trails in the database.

### Coverage Metrics
Percentage of locations with optional but valuable data. Higher coverage = better user experience.

## Alerts

Dashboard automatically generates alerts for:

| Alert | Level | Threshold | Action |
|-------|-------|-----------|--------|
| Missing scenery ratings | Warning | > 100 locations | Run data quality scripts |
| Invalid coordinates | Critical | > 0 locations | Fix immediately |
| DB integrity failure | Critical | Integrity check fails | Restore from backup |
| No backups | Warning | Backup count = 0 | Run backup-database.sh |

## Performance

- **Generation time:** < 2 seconds for 6,000+ locations
- **File size:** ~50-100KB JSON (gzip well for serving)
- **Database impact:** Read-only queries, no locks
- **Memory:** < 50MB

## Future Enhancements

Potential improvements:
- [ ] Historical trend data (track metrics over time)
- [ ] Growth rate calculations (new locations per week)
- [ ] User activity metrics (if auth is added)
- [ ] Search query analytics
- [ ] Map interaction heatmaps
- [ ] Popular routes/destinations
- [ ] Seasonal usage patterns
- [ ] Export to Prometheus/Grafana format

---

*Last updated: 2026-02-28*
*Script: generate-dashboard-data.js*
