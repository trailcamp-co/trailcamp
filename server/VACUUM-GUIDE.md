# Database Vacuum & Optimization Guide

## Overview
The `vacuum-database.sh` script optimizes the SQLite database by reclaiming unused space and updating query planner statistics.

## What It Does

### 1. VACUUM
- Rebuilds the database file
- Reclaims space from deleted records
- Defragments the database
- Reduces file size

### 2. ANALYZE
- Updates query optimizer statistics
- Improves query performance
- Helps SQLite choose better query plans

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## When to Run

### Recommended Schedule
- **Monthly:** Routine maintenance (1st of each month)
- **After large imports:** When adding 1000+ locations
- **After deletions:** When removing significant data
- **Before backups:** Ensures backup is optimized

### Automated (Cron)
Add to crontab for monthly execution:
```cron
# Run on 1st of each month at 3 AM
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

## How It Works

### Safety Features
1. **Backup first** - Creates temporary backup before optimization
2. **Integrity check** - Verifies database health before proceeding
3. **Abort on errors** - Stops if any issues detected
4. **Cleanup** - Removes backup after successful completion

### Performance
- **Small DB (< 10 MB):** < 1 second
- **Medium DB (10-100 MB):** 1-5 seconds
- **Large DB (100 MB-1 GB):** 5-30 seconds
- **Very large (> 1 GB):** 30+ seconds

### Space Savings
Typical savings depend on database activity:
- **New database:** 0-5% (already optimized)
- **After imports:** 5-15%
- **After deletions:** 10-30%
- **Fragmented DB:** 20-50%

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum & Optimize
    2026-02-28 18:40:28
═══════════════════════════════════════════════════════

Database size before: 9.9M

Creating safety backup...
✓ Backup created: ./trailcamp.db.vacuum-backup

Running integrity check...
✓ Integrity check passed

Running VACUUM...
(This may take a while for large databases)

✓ VACUUM completed in 2 seconds

Running ANALYZE...
(Updates query planner statistics)

✓ ANALYZE completed in 1 seconds

═══════════════════════════════════════════════════════
Results

Size before:     9.9M
Size after:      8.6M
Space saved:     1.30 MB (13.1%)
Vacuum time:     2s
Analyze time:    1s
Total time:      3s

═══════════════════════════════════════════════════════

✓ Optimization complete!
```

## Benefits

### Performance Improvements
- ✅ **Faster queries** - Better query plans from updated statistics
- ✅ **Reduced I/O** - Smaller, defragmented database
- ✅ **Better caching** - Smaller size = more fits in memory
- ✅ **Consistent performance** - Prevents gradual degradation

### Storage Savings
- ✅ **Reclaimed space** - Removes deleted record overhead
- ✅ **Smaller backups** - Optimized database = smaller backup files
- ✅ **Efficient disk usage** - No wasted fragmentation

## Troubleshooting

### "Integrity check FAILED"
**Problem:** Database has corruption or issues

**Solution:**
1. Restore from most recent backup
2. Run integrity check manually:
   ```bash
   sqlite3 trailcamp.db "PRAGMA integrity_check;"
   ```
3. If issues persist, restore from older backup

### Script Takes Too Long
**Problem:** Large database or slow disk

**Normal:** For 10 MB database, should complete in < 5 seconds

**If slower:**
- Check disk space (needs 2x database size free)
- Check disk I/O (other processes using disk)
- Consider running during off-hours

### No Space Saved
**Problem:** Shows "0 KB" or minimal savings

**This is normal if:**
- Database is already optimized
- Recently created or vacuumed
- No deletions or large imports recently

### Permission Denied
**Problem:** Cannot write to database or create backup

**Solution:**
```bash
# Check permissions
ls -l trailcamp.db

# Fix if needed
chmod 644 trailcamp.db
```

## Integration

### Pre-Deployment
Include in deployment checklist:
```bash
#!/bin/bash
# deploy.sh
./vacuum-database.sh
./backup-database.sh
# ... deploy
```

### Monitoring
Track vacuum metrics over time:
```bash
# Log vacuum results
./vacuum-database.sh >> vacuum-history.log
```

Parse log for trends:
```bash
grep "Space saved" vacuum-history.log
```

### CI/CD Pipeline
Add as pre-backup step:
```yaml
# .github/workflows/backup.yml
steps:
  - name: Optimize database
    run: |
      cd server
      ./vacuum-database.sh
  - name: Backup database
    run: |
      cd server
      ./backup-database.sh
```

## Best Practices

### ✅ Do
- Run monthly on a schedule
- Run after bulk deletions
- Run before creating backups
- Monitor space savings over time
- Keep a backup before vacuuming

### ❌ Don't
- Run during peak usage
- Run if database is corrupted
- Run with insufficient disk space
- Interrupt the vacuum process
- Skip integrity checks

## Technical Details

### VACUUM
SQLite VACUUM command:
- Copies data to temporary database
- Rebuilds in optimal layout
- Replaces original with optimized version
- Requires free space = database size

### ANALYZE
SQLite ANALYZE command:
- Scans table and index statistics
- Updates `sqlite_stat` tables
- Helps query planner make better decisions
- Very fast (< 1 second typically)

### File Size
Database file size is affected by:
- Number of records
- Deleted records (not immediately removed)
- Index overhead
- Fragmentation
- Page size (default 4KB)

## See Also
- **backup-database.sh** - Create database backups
- **check-data-quality.sh** - Validate database integrity
- **DATABASE-SCHEMA.md** - Database structure documentation

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
