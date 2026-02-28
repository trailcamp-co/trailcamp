# Data Quality Monitoring

## Overview
Automated data quality checks for the TrailCamp database to ensure integrity, completeness, and consistency.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./check-data-quality.sh
```

## Checks Performed

### 1. Required Fields (CRITICAL)
- ✓ All locations have names
- ✓ All locations have coordinates (latitude, longitude)
- ✓ All locations have categories

### 2. Coordinate Validation (CRITICAL)
- ✓ Latitudes within valid range (-90° to 90°)
- ✓ Longitudes within valid range (-180° to 180°)
- ✓ No locations at (0, 0) coordinates

### 3. Data Integrity (WARNING)
- ✓ Scenery ratings between 1-10
- ✓ Distance values reasonable (< 10,000 miles)
- ✓ Stay limits reasonable (< 365 days)
- ✓ Cost per night reasonable (< $500)

### 4. Category-Specific Validation (WARNING)
- ✓ Riding locations have trail_types or difficulty ratings
- ✓ Campsites have sub_type (boondocking/campground/etc.)

### 5. Foreign Key Integrity (CRITICAL)
- ✓ No orphaned trip stops (trip_stops pointing to non-existent trips)
- ✓ No orphaned locations (trip_stops pointing to deleted locations)

### 6. Duplicate Detection (WARNING)
- ✓ No exact duplicate coordinates with same name

### 7. Data Completeness (INFO)
- ✓ Riding locations with scenery ratings: 100%
- ✓ Campsites with best_season data: 100%

## Output Levels

| Symbol | Level | Meaning |
|--------|-------|---------|
| ✓ | PASS | Check passed, no issues |
| ⚠ | WARNING | Minor issues found, not critical |
| ✗ | CRITICAL | Serious data integrity issue |

## Exit Codes

- `0` - All checks passed
- `1` - One or more issues found

## Automated Monitoring

### Cron Setup

Run daily at 4:00 AM:
```cron
0 4 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./check-data-quality.sh >> ./logs/data-quality.log 2>&1
```

Run after every data import:
```bash
# After adding new locations
./check-data-quality.sh || echo "WARNING: Data quality issues detected"
```

### CI/CD Integration

Add to pre-commit hook or CI pipeline:
```bash
#!/bin/bash
# .git/hooks/pre-commit

cd server
if ! ./check-data-quality.sh; then
    echo "❌ Data quality checks failed. Fix issues before committing."
    exit 1
fi
```

## Common Issues & Fixes

### Issue: Locations missing scenery ratings

**Fix:**
```sql
-- Find locations without scenery ratings
SELECT id, name, category FROM locations 
WHERE scenery_rating IS NULL 
ORDER BY category, name;

-- Update with estimated rating
UPDATE locations 
SET scenery_rating = 6 
WHERE scenery_rating IS NULL AND category = 'campsite';
```

### Issue: Invalid coordinates

**Fix:**
```sql
-- Find invalid coordinates
SELECT id, name, latitude, longitude FROM locations 
WHERE latitude < -90 OR latitude > 90 
   OR longitude < -180 OR longitude > 180;

-- Manually correct based on location name
UPDATE locations 
SET latitude = XX.XXX, longitude = -XX.XXX 
WHERE id = <bad_id>;
```

### Issue: Orphaned trip stops

**Fix:**
```sql
-- Find orphaned trip stops
SELECT * FROM trip_stops 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Delete orphaned stops
DELETE FROM trip_stops 
WHERE trip_id NOT IN (SELECT id FROM trips);
```

### Issue: Duplicate locations

**Fix:**
```sql
-- Find exact duplicates (same name + coordinates)
SELECT name, latitude, longitude, COUNT(*) as count
FROM locations
GROUP BY name, latitude, longitude
HAVING COUNT(*) > 1;

-- Keep the one with most complete data, delete others
DELETE FROM locations 
WHERE id IN (
    -- Complex query to identify duplicates to remove
);
```

## Adding New Checks

To add a new check, edit `check-data-quality.sh`:

```bash
# Add to appropriate section
run_check "Description of check" \
    "SELECT COUNT(*) FROM locations WHERE <condition>;" \
    "CRITICAL"  # or "WARNING"
```

## Integration with Development Workflow

### Before Data Import
1. Run backup: `./backup-database.sh`
2. Import new data
3. Run quality check: `./check-data-quality.sh`
4. Fix any issues
5. Re-run check until all pass
6. Commit changes

### During Development
- Run checks before committing database schema changes
- Run checks after bulk updates
- Add checks for new fields/constraints

### Monitoring Production
- Schedule daily cron job
- Alert on failures (email, Slack, etc.)
- Track trend of issues over time

## Performance

- **Speed:** <1 second for 5,600+ locations
- **Database impact:** Read-only queries, no locks
- **Resource usage:** Minimal (bash + SQLite)

## Future Enhancements

Potential improvements:
- [ ] JSON output mode for programmatic parsing
- [ ] Trend tracking (log issues over time to file)
- [ ] Email/Slack alerts on failure
- [ ] Web dashboard showing health metrics
- [ ] More sophisticated duplicate detection (fuzzy name matching)
- [ ] Seasonal data validation (check best_season against coordinates)
- [ ] External link validation (check URLs return 200 OK)

---

*Last updated: 2026-02-28*
*Script: check-data-quality.sh*
