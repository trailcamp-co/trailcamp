# Database Size Monitoring

## Overview
Track database growth trends over time for capacity planning and optimization.

## Quick Start

### Take Snapshot
```bash
node track-db-size.js
```

### View Report Only
```bash
node track-db-size.js --report
```

### Reset History
```bash
node track-db-size.js --reset
```

## How It Works

1. **Takes snapshot** of current database state:
   - Total database file size
   - Row counts per table
   - Index count
   - Timestamp

2. **Stores history** in `db-size-history.json`
   - Keeps last 90 snapshots (3 months if run daily)
   - JSON format for easy parsing/analysis

3. **Generates report** with:
   - Current status
   - Recent growth (since last snapshot)
   - Total growth (since first snapshot)
   - Table size breakdown
   - Growth projections (30/90 days)

## Example Output

```
══════════════════════════════════════════════════════════════════════
DATABASE SIZE MONITORING REPORT
══════════════════════════════════════════════════════════════════════

📊 Current Status

  Database size:    9.91 MB
  Total rows:       20,882
  Tables:           9
  Indexes:          18
  Last snapshot:    2/28/2026, 8:00 PM

📈 Recent Growth

  Since last check: +125 KB increase (1.28%)
  Days elapsed:     1

📊 Total Growth

  Since first snap: +2.3 MB increase (30.2%)
  Days tracked:     30
  Snapshots taken:  30

📋 Table Sizes

  locations_fts_docsize       6,238 rows
  locations                   6,148 rows (+12)
  locations_fts               6,148 rows (+12)
  trip_stops                      8 rows (+1)
  trips                           1 rows

📈 Growth Trend

  Average growth:   76 KB/day
  Projected (30d):  12.1 MB
  Projected (90d):  16.7 MB
```

## Automation

### Daily Cron Job
Run every night at 2:00 AM:
```cron
0 2 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && node track-db-size.js >> logs/db-size.log 2>&1
```

### After Major Operations
Take snapshot after:
- Bulk data imports
- Database migrations
- Cleanup operations
- Schema changes

```bash
# Before operation
node track-db-size.js

# Do operation
node import-locations.js large-import.csv

# After operation
node track-db-size.js
```

## Use Cases

### 1. Capacity Planning
Monitor growth rate to predict when you'll need more storage:
```bash
# Check current trends
node track-db-size.js --report

# Look at "Projected (90d)" to plan ahead
```

### 2. Optimization Targets
Identify largest tables for optimization:
```bash
node track-db-size.js --report | grep "rows"
```

Tables growing fastest might need:
- Archiving old data
- Indexes review
- Partitioning (if SQLite supports)

### 3. Regression Detection
Spot unexpected growth:
- Large daily increases might indicate:
  - Duplicate data
  - Logging issues
  - Inefficient operations

### 4. Post-Cleanup Verification
Verify cleanup operations worked:
```bash
# Before cleanup
node track-db-size.js

# Run cleanup
sqlite3 trailcamp.db "DELETE FROM old_data WHERE ..."

# After cleanup
node track-db-size.js

# Should show size decrease
```

## Interpreting Results

### Healthy Growth Patterns
- **Steady increase:** Normal as locations added
- **<1% daily growth:** Stable, predictable
- **Proportional to data:** More locations = more size

### Warning Signs
- **Sudden spikes:** Investigate what changed
- **Disproportionate growth:** Table growing faster than data suggests
- **Negative growth without cleanup:** Possible corruption

### Table Size Analysis

**Large FTS tables are normal:**
- `locations_fts*` tables for full-text search
- These can be 2-3x the size of the main table
- Necessary for fast search performance

**Trip tables should be small:**
- Few trips = few rows
- If trip_stops is huge, might have orphaned data

## History File

### Location
`server/db-size-history.json`

### Format
```json
{
  "snapshots": [
    {
      "timestamp": "2026-02-28T20:00:00.000Z",
      "totalSize": 10390528,
      "totalSizeFormatted": "9.91 MB",
      "tables": {
        "locations": 6148,
        "locations_fts": 6148,
        "trip_stops": 8,
        "trips": 1
      },
      "indexCount": 18,
      "totalRows": 20882
    }
  ]
}
```

### Retention
- Keeps last 90 snapshots automatically
- Older snapshots are dropped
- Reset with `--reset` to start fresh

## Integration

### Dashboard
Include in admin dashboard:
```javascript
const history = JSON.parse(fs.readFileSync('db-size-history.json'));
const current = history.snapshots[history.snapshots.length - 1];

dashboard.databaseSize = current.totalSizeFormatted;
dashboard.totalRows = current.totalRows;
```

### Monitoring Alerts
Alert on unusual growth:
```bash
#!/bin/bash
current=$(node track-db-size.js --report | grep "Projected (30d)" | awk '{print $3}')
threshold="50 MB"

if [[ "$current" > "$threshold" ]]; then
  echo "WARNING: Database projected to exceed $threshold in 30 days"
  # Send alert
fi
```

### API Endpoint
Expose size metrics:
```javascript
app.get('/api/admin/database/size', (req, res) => {
  const history = JSON.parse(fs.readFileSync('db-size-history.json'));
  res.json(history);
});
```

## Troubleshooting

### "No historical data available"
First run creates the history file. Run again tomorrow to see trends.

### Incorrect sizes
- Ensure running in server/ directory
- Check that trailcamp.db exists
- File permissions correct

### Growth projections unrealistic
- Need at least 2 snapshots for trends
- More snapshots = more accurate projections
- Daily snapshots recommended

## Best Practices

1. **Run daily** via cron for consistent tracking
2. **Before/after snapshots** for major operations
3. **Keep history file** in version control (.gitignore)
4. **Review monthly** to spot trends
5. **Set alerts** for unexpected growth

---

*Last updated: 2026-02-28*
*Script: track-db-size.js*
*History file: db-size-history.json*
