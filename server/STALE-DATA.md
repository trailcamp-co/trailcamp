# Stale Data Detection

## Overview
Identifies locations that haven't been updated in 6+ months to help maintain data quality and freshness.

## Quick Start

### Manual Check
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./find-stale-data.sh
```

### Automated Monthly Check (Cron)
```bash
# Add to crontab (run `crontab -e`)
# 1st of each month at 9:00 AM
0 9 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./find-stale-data.sh >> ./logs/stale-data.log 2>&1
```

## What It Detects

### Stale Locations
- **Definition:** Locations not updated in the last 6 months
- **Why it matters:** Trail conditions, campground closures, road changes
- **Action:** Review and verify or update details

### Never Updated
- **Definition:** Locations with NULL `updated_at` timestamp
- **Why it matters:** May be imported data never verified
- **Action:** Manually verify and mark as updated

## Report Contents

### Summary Statistics
- Total locations count
- Never updated count
- Stale (> 6 months) count
- Recent (< 6 months) count

### Breakdown by Category
- Stale riding locations
- Stale campsites
- Stale other categories

### Top 50 Stale Locations
- ID, name, category
- Last updated timestamp
- Age in months

## Output Location

```
server/reports/stale-locations-YYYY-MM-DD.txt
```

## Adjusting Threshold

Edit `find-stale-data.sh`:
```bash
STALE_MONTHS=6  # Change to 3, 9, 12, etc.
```

## Use Cases

### Quarterly Data Review
1. Run stale data detector
2. Review top 20 oldest locations
3. Verify details are still accurate
4. Update `updated_at` for verified locations

### Pre-Trip Planning
Check if trip destination data is fresh:
```sql
SELECT name, updated_at 
FROM locations 
WHERE id IN (trip_stop_location_ids)
  AND datetime(updated_at) < datetime('now', '-6 months');
```

### Data Quality Metrics
Track freshness over time:
```bash
# Monthly tracking
echo "$(date +%Y-%m): $(sqlite3 trailcamp.db 'SELECT COUNT(*) FROM locations WHERE datetime(updated_at) < datetime(\"now\", \"-6 months\");')" >> data-freshness.log
```

## Marking Locations as Updated

### Manual Update
```sql
-- Mark specific location as updated
UPDATE locations 
SET updated_at = datetime('now') 
WHERE id = 123;

-- Mark all locations in a state as updated
UPDATE locations 
SET updated_at = datetime('now') 
WHERE state = 'CA';
```

### Batch Verification
```sql
-- Mark all verified locations as updated
UPDATE locations 
SET updated_at = datetime('now') 
WHERE id IN (1, 2, 3, 4, 5);
```

## Integration

### With Verification Workflow
```bash
#!/bin/bash
# Verification script

# 1. Find stale data
./find-stale-data.sh

# 2. Extract IDs for review
sqlite3 trailcamp.db "SELECT id FROM locations WHERE datetime(updated_at) < datetime('now', '-6 months') LIMIT 10;" > review-list.txt

# 3. Manual review process (external tool)

# 4. Mark verified as updated
# (Manual SQL after verification)
```

### With Quality Reports
Include stale data count in weekly quality report:
```javascript
const staleCount = db.prepare(`
  SELECT COUNT(*) as count 
  FROM locations 
  WHERE datetime(updated_at) < datetime('now', '-6 months')
`).get().count;

report.staleness = {
  staleCount,
  threshold: '6 months',
  needsReview: staleCount > 50
};
```

## Monitoring

### Check Last Run
```bash
ls -lt server/reports/stale-locations-*.txt | head -1
```

### Track Trends
```bash
# Count stale locations over time
for file in reports/stale-locations-*.txt; do
  date=$(echo $file | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
  count=$(grep "Stale (>6mo):" $file | awk '{print $3}')
  echo "$date: $count"
done
```

## Expected Results

### Healthy Database
```
Total locations:       6148
Never updated:         0
Stale (>6mo):         0-50
Recent (<6mo):        6100+
```

### Needs Attention
```
Total locations:       6148
Never updated:         500+
Stale (>6mo):         200+
Recent (<6mo):        5400
```

**Action:** Schedule data review sessions

## Best Practices

1. **Run monthly** - Catch staleness early
2. **Prioritize high-traffic locations** - Review popular spots first
3. **Use source verification** - Check official websites for changes
4. **Document changes** - Note what was updated in `notes` field
5. **Set reminders** - Review seasonal locations before season starts

## Troubleshooting

### "All locations show as stale"
**Issue:** Database was recently imported without timestamps

**Fix:**
```sql
-- Set initial updated_at for all locations
UPDATE locations 
SET updated_at = datetime('now') 
WHERE updated_at IS NULL;
```

### "Never updated count increasing"
**Issue:** New imports don't set `updated_at`

**Fix:** Update import scripts to set timestamp:
```javascript
// In import-locations.js
insertStmt.run(
  // ... other fields
  new Date().toISOString()  // updated_at
);
```

## Automation Ideas

### Auto-notify stale locations
```bash
#!/bin/bash
# Monthly stale data alert

STALE_COUNT=$(sqlite3 trailcamp.db 'SELECT COUNT(*) FROM locations WHERE datetime(updated_at) < datetime("now", "-6 months");')

if [ $STALE_COUNT -gt 100 ]; then
  # Send notification (email, Slack, etc.)
  echo "⚠️ $STALE_COUNT stale locations need review"
fi
```

### Dashboard integration
```javascript
// Add to dashboard-data.json
staleness: {
  total: 6148,
  stale: 23,
  neverUpdated: 0,
  freshness: 99.6  // % fresh
}
```

---

*Last updated: 2026-02-28*
*Script: find-stale-data.sh*
*Threshold: 6 months*
