# Database Vacuum & Optimization Guide

## Overview
The `vacuum-database.sh` script optimizes the TrailCamp SQLite database by reclaiming unused space and updating query planner statistics.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

### 1. VACUUM
- **Reclaims disk space** from deleted records
- **Defragments** the database file
- **Rebuilds** indexes for better performance
- **Reduces** database file size

### 2. ANALYZE
- **Updates** query planner statistics
- **Improves** query performance
- **Optimizes** index usage

### 3. Integrity Checks
- **Before:** Ensures database is healthy before vacuum
- **After:** Verifies database integrity post-optimization

## When to Run

### Monthly Maintenance
```bash
# Good practice: run once a month
./vacuum-database.sh
```

### After Large Changes
Run after:
- Bulk data imports (1000+ locations)
- Mass deletions or updates
- Schema migrations
- Large duplicate removals

### Weekly ANALYZE
For busy databases, run ANALYZE weekly:
```bash
sqlite3 trailcamp.db "ANALYZE;"
```

## Performance Impact

### Database Size
- Typically reduces size by 5-30% after deletions
- Well-maintained databases: minimal change
- After large deletions: significant space reclaimed

### Speed
- VACUUM time: 1-5 seconds for 6,000 locations
- ANALYZE time: <1 second
- **Total downtime:** ~5 seconds

### Query Performance
- **Before ANALYZE:** Query planner uses outdated statistics
- **After ANALYZE:** Optimal query plans, faster queries

## Automation

### Cron Job (Monthly)
```cron
# Run on 1st of each month at 3 AM
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### Manual Schedule
```bash
# First Sunday of each month
./vacuum-database.sh
```

## Safety

### Auto Backup
The script checks integrity BEFORE vacuum. If integrity fails, it aborts.

### Safe to Run
- ✅ **Safe on live database** (brief lock during vacuum)
- ✅ **Read-only operations** during integrity checks
- ✅ **Automatic verification** after completion

### Not Safe If
- ❌ Database is corrupted (integrity check will catch this)
- ❌ Disk is full (VACUUM needs temporary space)
- ❌ Database is in use by write-heavy process (will wait for lock)

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum & Optimization
    2026-02-28 19:20:38
═══════════════════════════════════════════════════════

Initial database size: 9.9M

━━━ 1. Integrity Check ━━━

✓ Database integrity: OK

━━━ 2. VACUUM (Reclaim Space) ━━━

Running VACUUM...
✓ VACUUM completed in 2s

━━━ 3. ANALYZE (Update Statistics) ━━━

Running ANALYZE...
✓ ANALYZE completed in 0s

━━━ 4. Post-Vacuum Verification ━━━

Location count: 6148
✓ Post-vacuum integrity: OK

═══════════════════════════════════════════════════════
Summary

  Initial size:     9.9M
  Final size:       9.2M
  VACUUM time:      2s
  ANALYZE time:     0s

✅ Database optimized successfully
═══════════════════════════════════════════════════════

Recommendations:
  • Run VACUUM monthly or after large data changes
  • Run ANALYZE weekly or after schema changes
```

## Troubleshooting

### "Database not found"
**Problem:** Script can't find trailcamp.db  
**Solution:** Run from server/ directory

### "Database integrity check FAILED"
**Problem:** Database is corrupted  
**Solution:** Restore from backup immediately
```bash
cp backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql trailcamp.db.corrupt
sqlite3 trailcamp.db < backups/trailcamp-backup-latest.sql
```

### VACUUM takes too long (> 30 seconds)
**Problem:** Very large database or slow disk  
**Solution:** Run during off-hours, consider upgrading to SSD

### No space reclaimed
**Problem:** Database already optimized  
**Solution:** This is normal! Only run VACUUM when needed

## Advanced Usage

### VACUUM Only
```bash
sqlite3 trailcamp.db "VACUUM;"
```

### ANALYZE Only
```bash
sqlite3 trailcamp.db "ANALYZE;"
```

### Check Fragmentation
```bash
# Shows page count and free pages
sqlite3 trailcamp.db "PRAGMA page_count; PRAGMA freelist_count;"
```

### Incremental VACUUM (Future)
For very large databases:
```sql
-- Enable auto-vacuum mode
PRAGMA auto_vacuum = INCREMENTAL;
```

## Benefits

### Space Savings
- Reclaimed space from:
  - Deleted locations
  - Removed duplicates
  - Updated records
  - Dropped indexes

### Performance Gains
- **Faster queries:** Optimized indexes
- **Better plans:** Updated statistics
- **Sequential I/O:** Defragmented pages

### Maintenance
- **Healthier database:** Fewer fragmented pages
- **Consistent performance:** Regular optimization prevents degradation

## Integration

### After Bulk Operations
```bash
# After import
./import-locations.js data.csv
./vacuum-database.sh

# After cleanup
./find-duplicates.js --remove
./vacuum-database.sh
```

### CI/CD Pipeline
```bash
# In deployment script
npm run build
./backup-database.sh
./vacuum-database.sh
./check-data-quality.sh
```

## Monitoring

### Track Size Over Time
```bash
# Log database size
du -h trailcamp.db >> db-size-log.txt
date >> db-size-log.txt
```

### Watch Query Performance
```bash
# Enable query logging (during vacuum)
sqlite3 trailcamp.db ".timer on"
```

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
*Database: SQLite 3.x*
