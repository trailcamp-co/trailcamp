# Coordinate Drift Detection

## Overview
Identifies locations with identical or similar names at different coordinates, which may indicate duplicates, data entry errors, or legitimate multiple locations needing clarification.

## Quick Start

### Manual Check
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./detect-coordinate-drift.sh
```

### Automated Quarterly Check (Cron)
```bash
# Add to crontab (run `crontab -e`)
# 1st day of Jan, Apr, Jul, Oct at 11:00 AM
0 11 1 1,4,7,10 * cd /Users/nicosstrnad/Projects/trailcamp/server && ./detect-coordinate-drift.sh >> ./logs/drift.log 2>&1
```

## What It Detects

### Exact Name Duplicates
Locations with identical names but different coordinates:
- Same spelling
- Different lat/lon combinations
- May be legitimate or errors

### Similar Name Variations
Names that normalize to the same value:
- "Pine Creek Campground" vs "Pine Creek"
- "State Park" suffix variations
- Case differences

## Current Results (2026-02-28)

- **Exact duplicates:** 61 locations
- **Similar variations:** 21 patterns
- **Total issues:** 82 locations need review

### Common Patterns Found

**BDR Routes (duplicated):**
- Mid-Atlantic BDR, Nevada BDR, Oregon BDR, Washington BDR
- Likely: riding location + campsite for same route

**Recreation Areas (duplicated):**
- Multiple OHV parks, campgrounds
- Likely: riding area + camping area at same location

**Mountain Passes (duplicated):**
- Weston Pass, Schofield Pass, Stony Pass, etc.
- Likely: trail location + camping/parking area

## How to Review

### 1. Check the Report
```bash
cat server/reports/coordinate-drift-YYYY-MM-DD.txt
```

### 2. Query Details
```sql
-- Get all locations with a specific name
SELECT id, name, category, latitude, longitude, state 
FROM locations 
WHERE name = 'Weston Pass'
ORDER BY id;
```

### 3. Determine Action

For each duplicate set, decide:

**A) Legitimate Separate Locations**
- Different trailheads for same area
- Riding location vs camping location
- North vs South access points

**Fix:** Add distinguishing info to names:
```sql
UPDATE locations 
SET name = 'Weston Pass — North Approach' 
WHERE id = 123;

UPDATE locations 
SET name = 'Weston Pass — South Trailhead' 
WHERE id = 456;
```

**B) Import Errors / True Duplicates**
- Same location entered twice
- Slightly different coordinates (GPS error)

**Fix:** Delete duplicate, keep best one:
```sql
-- Keep the one with more complete data
DELETE FROM locations WHERE id = 456;
```

**C) Moved Locations**
- Trailhead relocated
- Coordinates updated over time

**Fix:** Update coordinates, note in description:
```sql
UPDATE locations 
SET latitude = 39.1234, 
    longitude = -106.5678,
    notes = 'Coordinates updated 2026-02 - trailhead moved'
WHERE id = 123;

-- Remove old entry
DELETE FROM locations WHERE id = 456;
```

## Automated Fixes

### Bulk Rename Pattern
```bash
#!/bin/bash
# Add " — Riding" suffix to riding duplicates

sqlite3 trailcamp.db << 'SQL'
UPDATE locations 
SET name = name || ' — Riding'
WHERE category = 'riding' 
  AND name IN (
    SELECT name FROM locations 
    GROUP BY name 
    HAVING COUNT(DISTINCT category) > 1
  );
SQL
```

### State-Based Disambiguation
```sql
-- Add state to duplicates in different states
UPDATE locations 
SET name = name || ' (' || state || ')'
WHERE name IN (
  SELECT name FROM locations 
  GROUP BY name 
  HAVING COUNT(DISTINCT state) > 1
);
```

## Best Practices

1. **Review quarterly** - Catch new duplicates from imports
2. **Check before imports** - Prevent duplicates at source
3. **Use consistent naming** - Establish conventions
4. **Document decisions** - Note why duplicates exist in `notes`
5. **Test changes** - Query before/after bulk updates

## Common Causes

### Import Duplicates
- Multiple data sources (Recreation.gov, Manual, etc.)
- Same location entered with slight name variations
- Coordinate precision differences

**Prevention:**
- Check for existing name before import
- Normalize coordinates to 4 decimal places
- Use import `source` field to track origins

### Category Overlaps
- Location has both riding and camping
- Entered as separate locations for each category

**Solution:**
- Keep as separate if genuinely different points
- Add clarifying suffix: "— Riding", "— Camping"

### Regional Variations
- Common names used in multiple states
- "Pine Creek" exists in CO, CA, MT, etc.

**Solution:**
- Add state or region to name
- Example: "Pine Creek Trail (CO)"

## Integration

### With Duplicate Detector
```bash
# Run both checks together
./find-duplicates.js  # Fuzzy name matching
./detect-coordinate-drift.sh  # Exact name matching
```

### With Quality Reports
Include drift count in weekly reports:
```javascript
const driftCount = db.prepare(`
  SELECT COUNT(*) 
  FROM (
    SELECT name 
    FROM locations 
    GROUP BY name 
    HAVING COUNT(DISTINCT latitude || ',' || longitude) > 1
  )
`).get();
```

## Monitoring

### Track Over Time
```bash
# Monthly drift count
echo "$(date +%Y-%m): $(./detect-coordinate-drift.sh | grep 'Exact duplicates' | awk '{print $3}')" >> drift-history.log
```

### Alert on Increase
```bash
#!/bin/bash
DRIFT_COUNT=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM (SELECT name FROM locations GROUP BY name HAVING COUNT(DISTINCT latitude || ',' || longitude) > 1)")

if [ $DRIFT_COUNT -gt 70 ]; then
  echo "⚠️ Drift count increased: $DRIFT_COUNT duplicates"
fi
```

## Expected Results

### Healthy Database
- < 20 exact duplicates
- < 10 similar variations
- Mostly legitimate regional names

### Needs Attention
- > 50 exact duplicates
- > 20 similar variations
- Many import errors

**Current state:** 82 issues → needs review session

---

*Last updated: 2026-02-28*
*Script: detect-coordinate-drift.sh*
*Recommended: Quarterly review*
