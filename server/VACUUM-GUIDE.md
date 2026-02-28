# Database Vacuum & Optimization Guide

## Overview
The `vacuum-database.sh` script optimizes the SQLite database by reclaiming unused space and updating query optimizer statistics.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

### 1. VACUUM
Rebuilds the database file to:
- **Reclaim space** from deleted records
- **Defragment** the database
- **Reduce file size** by removing free pages
- **Improve performance** by optimizing page layout

### 2. ANALYZE
Updates query optimizer statistics to:
- **Improve query plans** based on actual data distribution
- **Speed up queries** by choosing better indexes
- **Optimize joins** and filters

## When to Run

### After Large Deletions
```bash
# After removing duplicates, cleaning up data
./vacuum-database.sh
```

### After Bulk Imports
```bash
# After importing thousands of new locations
node import-locations.js data.csv
./vacuum-database.sh
```

### Regular Maintenance
```bash
# Monthly or quarterly maintenance
./vacuum-database.sh
```

### When Performance Degrades
```bash
# If queries seem slower than usual
./vacuum-database.sh
```

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum & Optimization
    2026-02-28 18:30:33
═══════════════════════════════════════════════════════

📊 Measuring database before optimization...

Database size: 9.9M
Locations: 6148
Trips: 1

🔍 Running integrity check...
✓ Integrity check: OK

Pages: 2538
Free pages: 0

🗜️  Running VACUUM (this may take a moment)...
✓ VACUUM completed in 3s

📈 Running ANALYZE to update query optimizer statistics...
✓ ANALYZE completed

📊 Measuring database after optimization...

═══════════════════════════════════════════════════════
Summary

Before:  9.9M (2538 pages, 0 free)
After:   8.7M (2230 pages, 0 free)

Space reclaimed: 1.2 MB (12.1% reduction)

✓ Query optimizer statistics updated
✓ Database optimized successfully
═══════════════════════════════════════════════════════
```

## Safety Features

### Pre-Vacuum Checks
✅ **Database exists** - Verifies file before proceeding  
✅ **Integrity check** - Runs `PRAGMA integrity_check` first  
✅ **Aborts if corrupted** - Won't vacuum a damaged database

### Post-Vacuum Verification
✅ **Size comparison** - Shows before/after metrics  
✅ **Page analysis** - Reports page count and free pages  
✅ **Success confirmation** - Clear status messages

## Performance Impact

### Small Databases (< 100MB)
- **Duration:** < 1 second
- **Impact:** Minimal, safe to run anytime

### Medium Databases (100MB - 1GB)
- **Duration:** 1-10 seconds
- **Impact:** Low, brief lock during vacuum

### Large Databases (> 1GB)
- **Duration:** 10-60+ seconds
- **Impact:** Database locked during operation
- **Recommendation:** Run during low-traffic periods

## Automation

### Cron Job (Weekly)
```cron
# Run vacuum every Sunday at 3 AM
0 3 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### Cron Job (Monthly)
```cron
# Run vacuum on 1st of each month at 3 AM
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### Post-Deployment Hook
```bash
#!/bin/bash
# After deploying data updates
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## Expected Results

### After Large Deletions
- **Space reclaimed:** 10-50% reduction
- **Free pages:** Reduced to 0
- **Query speed:** 5-20% faster

### After Bulk Imports
- **Space reclaimed:** 5-15% reduction
- **Query optimizer:** Updated with new data distribution
- **Index usage:** More efficient

### Regular Maintenance
- **Space reclaimed:** 0-5% (if already optimized)
- **Query plans:** Refreshed
- **Consistent performance** maintained

## Troubleshooting

### "Database not found"
**Cause:** Running from wrong directory  
**Solution:** 
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

### "Integrity check FAILED"
**Cause:** Database corruption  
**Solution:** 
```bash
# Restore from backup
cp ./backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql restored.db
# Or restore to main database
sqlite3 trailcamp.db < ./backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql
```

### "No space reclaimed"
**Cause:** Database already optimized  
**This is normal!** ANALYZE still ran and updated statistics.

### Very Long Duration
**Cause:** Large database or slow disk  
**Solution:** Be patient, or run during off-hours

## Technical Details

### SQLite VACUUM
- Creates a new copy of the database
- Copies all data in optimal order
- Replaces original with optimized copy
- **Requires:** Free disk space = 2x database size

### SQLite ANALYZE
- Scans table contents
- Updates `sqlite_stat1` table
- Helps query planner choose best indexes
- **Minimal overhead:** < 1 second typically

## Comparison to Other Databases

| Database | Equivalent Command |
|----------|-------------------|
| SQLite | `VACUUM; ANALYZE;` |
| PostgreSQL | `VACUUM FULL; ANALYZE;` |
| MySQL | `OPTIMIZE TABLE` |
| MongoDB | `db.collection.compact()` |

## Best Practices

1. **Backup first** - Run `./backup-database.sh` before vacuum
2. **Check integrity** - Script does this automatically
3. **Run during low traffic** - Minimizes impact
4. **Monitor results** - Watch for space reclaimed
5. **Schedule regularly** - Monthly or quarterly maintenance

## Integration

### Pre-Deployment Checklist
```bash
# 1. Backup
./backup-database.sh

# 2. Vacuum
./vacuum-database.sh

# 3. Data quality check
./check-data-quality.sh

# 4. Performance test
./test-performance.sh
```

### Monitoring Script
```bash
#!/bin/bash
# Check if vacuum is needed
FREE_PAGES=$(sqlite3 trailcamp.db "PRAGMA freelist_count;")

if [ ${FREE_PAGES} -gt 100 ]; then
    echo "Vacuum recommended: ${FREE_PAGES} free pages"
    ./vacuum-database.sh
fi
```

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
*Commands: VACUUM, ANALYZE*
