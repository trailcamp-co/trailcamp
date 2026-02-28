# Database Vacuum Guide

## Overview
The `vacuum-database.sh` script optimizes the TrailCamp database by reclaiming unused space and updating query planner statistics.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

### 1. Integrity Check
Runs `PRAGMA integrity_check` to ensure database is healthy before vacuuming.

### 2. VACUUM
- Reclaims space from deleted records
- Defragments the database file
- Rebuilds database to optimal structure
- Reduces file size (typically)

### 3. ANALYZE
- Updates internal statistics about data distribution
- Helps SQLite query planner make better decisions
- Improves query performance

## When to Run

### Recommended Schedule

**Monthly:** For active development/data additions
```cron
# First day of month at 3 AM
0 3 1 * * cd /path/to/trailcamp/server && ./vacuum-database.sh >> logs/vacuum.log 2>&1
```

**Weekly:** If making frequent bulk changes
```cron
# Every Sunday at 3 AM
0 3 * * 0 cd /path/to/trailcamp/server && ./vacuum-database.sh >> logs/vacuum.log 2>&1
```

**After Major Changes:**
- After deleting many locations
- After bulk imports
- After schema migrations
- After removing duplicates

### Signs You Should Run VACUUM

- Database file size seems larger than expected
- Queries getting slower over time
- After deleting 10%+ of records
- After adding/removing indexes or triggers

## Expected Results

### First Run After Schema Changes
Database may **grow** slightly due to:
- New indexes being created
- Triggers being added
- Internal optimizations

This is **normal and expected**.

### Typical Vacuum Run
```
Size before:      4.5M
Size after:       4.2M
Space reclaimed:  0.3MB (6.7%)
```

### Already Optimized
```
Size before:      9.9M
Size after:       9.9M
Space reclaimed:  0MB
✅ Database already optimized!
```

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum
    2026-02-28 18:50:33
═══════════════════════════════════════════════════════

Database size before: 9.9M

━━━ 1. Checking Database Integrity ━━━
✓ Database integrity: OK

━━━ 2. Running VACUUM ━━━
Reclaiming unused space and defragmenting...
✓ VACUUM completed in 0 seconds

━━━ 3. Running ANALYZE ━━━
Updating query planner statistics...
✓ ANALYZE completed in 0 seconds

═══════════════════════════════════════════════════════
Summary

Size before:      9.9M
Size after:       9.9M
Space reclaimed:  0MB

✅ Database already optimized!
═══════════════════════════════════════════════════════

Database Statistics:
Locations: 6148
Trips: 1
Trip Stops: 8
```

## Performance Impact

### Small Database (< 10MB)
- **Duration:** < 1 second
- **Downtime:** Negligible
- **Safe to run:** Anytime

### Medium Database (10-100MB)
- **Duration:** 1-5 seconds
- **Downtime:** Minimal
- **Safe to run:** During low traffic

### Large Database (> 100MB)
- **Duration:** 5-30 seconds
- **Downtime:** Noticeable
- **Safe to run:** Off-peak hours only

**Note:** VACUUM locks the database exclusively during operation.

## Safety

### Built-in Protections
✅ **Integrity check first** - Aborts if database is corrupted  
✅ **Non-destructive** - Only reorganizes, never deletes data  
✅ **Atomic operation** - Either completes fully or rolls back  

### Best Practices
1. **Backup first** - Run `./backup-database.sh` before vacuum
2. **Off-peak hours** - Schedule during low usage
3. **Monitor first run** - Watch the first automated run
4. **Check logs** - Review cron logs after automated runs

## Troubleshooting

### "Database integrity check FAILED"
**Do NOT run VACUUM.** Database is corrupted.

**Solution:**
1. Restore from latest backup
2. Investigate cause of corruption
3. Fix underlying issue before vacuuming

### VACUUM Takes Too Long
**Normal for large databases.** Let it complete.

**If it hangs:**
1. Check disk space (needs ~2x current DB size)
2. Check for locks: `lsof trailcamp.db`
3. Kill if necessary, database will be fine

### Database Size Increased
**Normal on first run after:**
- Adding indexes
- Adding triggers
- Schema migrations

The increase is **overhead for performance**, not a problem.

### No Space Reclaimed
**Database is already optimized.** This is good!

**Reasons:**
- Recent vacuum ran
- No deleted records
- Database already compact

## Automation Examples

### Simple Cron
```bash
# Run monthly
0 3 1 * * /Users/nicosstrnad/Projects/trailcamp/server/vacuum-database.sh
```

### With Logging
```bash
# Run weekly with rotating logs
0 3 * * 0 /Users/nicosstrnad/Projects/trailcamp/server/vacuum-database.sh >> /var/log/trailcamp-vacuum.log 2>&1
```

### With Slack Notification
```bash
#!/bin/bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh > /tmp/vacuum-output.txt 2>&1

if [ $? -eq 0 ]; then
    # Success
    grep "Space reclaimed" /tmp/vacuum-output.txt | curl -X POST -H 'Content-type: application/json' --data '{"text":"'"$(cat)"'"}' YOUR_SLACK_WEBHOOK
else
    # Failure
    curl -X POST -H 'Content-type: application/json' --data '{"text":"❌ Database vacuum failed!"}' YOUR_SLACK_WEBHOOK
fi
```

## Manual VACUUM (Advanced)

If you need to run VACUUM manually:

```bash
sqlite3 trailcamp.db "VACUUM;"
sqlite3 trailcamp.db "ANALYZE;"
```

**Or interactive:**
```sql
sqlite> PRAGMA integrity_check;
ok
sqlite> VACUUM;
sqlite> ANALYZE;
```

## Related Commands

### Check Database Size
```bash
du -h trailcamp.db
```

### Check Page Statistics
```sql
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;
```

### Check Fragmentation
```sql
SELECT 
    (page_count - freelist_count) as used_pages,
    page_count,
    freelist_count,
    ROUND((freelist_count * 100.0) / page_count, 2) as fragmentation_pct
FROM pragma_page_count(), pragma_freelist_count();
```

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
