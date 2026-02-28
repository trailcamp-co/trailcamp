# Database Vacuum & Optimization Guide

## Overview
The `vacuum-database.sh` script performs essential database maintenance: reclaiming unused space and updating query optimizer statistics.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

### 1. VACUUM
- **Purpose:** Reclaims space from deleted records
- **Effect:** Rebuilds database file without fragmentation
- **Benefit:** Smaller file size, faster queries

### 2. ANALYZE
- **Purpose:** Updates query optimizer statistics
- **Effect:** SQLite learns actual data distribution
- **Benefit:** Better query plans, improved performance

### 3. Safety Checks
- Integrity check before maintenance
- Automatic backup before operations
- Integrity verification after maintenance
- Record count validation
- Automatic rollback if issues detected

## When to Run

### Recommended Schedule
**Monthly** - 1st of month at 3:00 AM:
```cron
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### Run Manually When:
- Database file size grows significantly
- After bulk deletions
- After major data imports
- Query performance degrades
- Storage space is limited

### Don't Run When:
- Database is actively being written to
- During peak usage hours
- Without recent backup

## Performance Impact

### Execution Time
With 6,000+ locations:
- **VACUUM:** <1 second (small DB) to ~30 seconds (large DB with fragments)
- **ANALYZE:** <1 second
- **Total:** Typically 1-2 seconds

### Locks
- **VACUUM:** Exclusive lock (blocks all operations)
- **ANALYZE:** Shared lock (allows reads)
- **Recommendation:** Run during maintenance windows

## Space Reclamation

### How Much Space?
Depends on database fragmentation:
- **Light fragmentation** (<5% deletes): 0-100KB saved
- **Moderate fragmentation** (5-20% deletes): 100KB-1MB saved
- **Heavy fragmentation** (>20% deletes): 1MB+ saved

### Example Output
```
Current database size: 13M

Running VACUUM...
✓ VACUUM completed (1s)

Database size: 13M → 9.9M
✓ Reclaimed 3MB (23% reduction)
```

## Safety Features

### Automatic Backup
Before any maintenance:
```
✓ Backup created: trailcamp.db.pre-vacuum-20260228-181240
```

Backup is kept during operation and removed on success.

### Integrity Checks
**Before:**
```
Checking database integrity...
✓ Integrity check passed
```

**After:**
```
Verifying integrity after maintenance...
✓ Post-maintenance integrity check passed
✓ All record counts verified
```

### Automatic Rollback
If any check fails:
```
✗ Post-maintenance integrity check failed!

Restoring from backup...
✓ Database restored from backup
```

## Output Example

```bash
./vacuum-database.sh
```

```
═══════════════════════════════════════════════════════
    TrailCamp Database Maintenance
    2026-02-28 18:12:40
═══════════════════════════════════════════════════════

Running pre-maintenance checks...

Current database size: 13M

Checking database integrity...
✓ Integrity check passed

Record counts:
  Locations:   6148
  Trips:       1
  Trip stops:  8

Creating safety backup...
✓ Backup created: trailcamp.db.pre-vacuum-20260228-181240

Running VACUUM...
(This may take a few moments)
✓ VACUUM completed (0s)

Running ANALYZE...
(Updating query optimizer statistics)
✓ ANALYZE completed (0s)

Running post-maintenance checks...

Database size: 13M → 9.9M
✓ Reclaimed 3MB (23% reduction)

Verifying integrity after maintenance...
✓ Post-maintenance integrity check passed
✓ All record counts verified

Cleaning up...
✓ Safety backup removed

═══════════════════════════════════════════════════════
Maintenance Summary

Operations performed:
  ✓ VACUUM (0s)
  ✓ ANALYZE (0s)
  ✓ Integrity verification

Results:
  Space reclaimed: 3MB
  Database size:   9.9M
  Data integrity:  OK

✅ Database maintenance complete!
═══════════════════════════════════════════════════════

Recommendations:
  • Run this script monthly for optimal performance
  • Add to cron: 0 3 1 * * (1st of month at 3am)
  • Always backup before running (script does this automatically)
```

## Integration

### Automated Monthly Maintenance
```bash
# Add to crontab (run monthly)
crontab -e
```

Add:
```cron
# TrailCamp database maintenance - 1st of month at 3am
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### Check Maintenance Logs
```bash
tail -f /Users/nicosstrnad/Projects/trailcamp/server/logs/vacuum.log
```

### Combine with Backups
```bash
#!/bin/bash
# monthly-maintenance.sh

cd /Users/nicosstrnad/Projects/trailcamp/server

# 1. Backup first
./backup-database.sh

# 2. Run maintenance
./vacuum-database.sh

# 3. Generate fresh exports
./export-scheduler.sh

# 4. Update dashboard
node generate-dashboard-data.js
```

## Troubleshooting

### "Database is locked"
**Cause:** Another process is using the database

**Solution:**
```bash
# Check for active connections
lsof | grep trailcamp.db

# Stop dev server if running
pkill -f "tsx watch"
pkill -f vite

# Try again
./vacuum-database.sh
```

### "Integrity check failed"
**Cause:** Database corruption

**Solution:**
```bash
# Don't run VACUUM on corrupted database!
# Restore from backup instead
cp backups/trailcamp-backup-<date>.sql trailcamp.db
```

### "No space reclaimed"
**Cause:** No deleted records or fragmentation

**Solution:** This is normal! VACUUM only reclaims space from deleted/updated records.

### Script Fails Midway
**Cause:** Various (disk full, permissions, etc.)

**Solution:** Script automatically rolls back. Check:
```bash
# Verify rollback worked
sqlite3 trailcamp.db "PRAGMA integrity_check"

# Check disk space
df -h .
```

## Best Practices

1. **Schedule monthly** - Set cron job for off-hours
2. **Monitor logs** - Check monthly run results
3. **Combine with backups** - Always have recent backup
4. **Test rollback** - Verify restore process works
5. **Watch disk space** - VACUUM temporarily doubles disk usage
6. **Run during low traffic** - Minimize user impact

## Technical Details

### VACUUM Process
1. Creates temporary copy of database
2. Copies all data to new file
3. Rebuilds indexes
4. Swaps new file for old
5. Removes temporary file

### Disk Space Required
VACUUM needs ~2x current database size:
- 10MB database needs 20MB free space
- 100MB database needs 200MB free space

### Auto-Vacuum Alternative
SQLite supports auto-vacuum mode:
```sql
PRAGMA auto_vacuum = FULL;
VACUUM; -- Apply setting
```

**Trade-offs:**
- ✅ Automatic space reclamation
- ❌ Slower writes
- ❌ Still need occasional VACUUM for best results

## Monitoring

### Track Database Growth
```bash
# Log size over time
echo "$(date +%Y-%m-%d)  $(du -h trailcamp.db | cut -f1)" >> db-size.log
```

### Alert on Large Size
```bash
# Alert if > 100MB
SIZE=$(stat -f%z trailcamp.db)
if [ $SIZE -gt 104857600 ]; then
  echo "Database exceeds 100MB - consider maintenance"
fi
```

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
