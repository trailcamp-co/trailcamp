# Database Vacuum & Optimization Guide

## Overview
The `vacuum-database.sh` script optimizes the SQLite database by:
- Reclaiming unused space from deleted records
- Defragmenting the database file
- Updating query planner statistics

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What is VACUUM?

SQLite's VACUUM command:
1. **Rebuilds** the database file from scratch
2. **Reclaims** space from deleted/updated records
3. **Defragments** data for better performance
4. **Compacts** the file to minimum size

### When to Run VACUUM

✅ **After large deletions** - Removed 100+ locations  
✅ **After bulk updates** - Updated many records  
✅ **Monthly maintenance** - Keep database optimized  
✅ **Before backups** - Smaller backup files  
✅ **Performance issues** - Slow queries, high fragmentation

❌ **Don't run during:**
- High traffic periods
- While other processes access the database
- If disk space is critically low

## Script Output

### Example Run
```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum & Optimization
    2026-02-28 19:10:30
═══════════════════════════════════════════════════════

Initial database size: 9.9M

━━━ Step 1: Integrity Check ━━━
✓ Database integrity: OK

━━━ Step 2: Pre-Vacuum Statistics ━━━
Page size:       4096 bytes
Total pages:     2538
Free pages:      0
Fragmentation:   0%

━━━ Step 3: Running VACUUM ━━━
This may take a minute for large databases...
✓ VACUUM completed in 0 seconds

━━━ Step 4: Running ANALYZE ━━━
Updating query planner statistics...
✓ ANALYZE completed

━━━ Step 5: Post-Vacuum Statistics ━━━
Page size:       4096 bytes
Total pages:     2538
Free pages:      0
Fragmentation:   0.0%

═══════════════════════════════════════════════════════
Summary

Initial size:    9.9M
Final size:      9.9M
Space reclaimed: 0 KB (0%)
Duration:        0 seconds

✓ Database was already optimized (no space to reclaim)
═══════════════════════════════════════════════════════
```

## Safety Features

### 1. Integrity Check
Before vacuuming, the script runs `PRAGMA integrity_check`:
- If OK → proceeds with vacuum
- If FAILED → aborts (fix corruption first)

### 2. Size Tracking
Measures database size before and after:
- Shows space reclaimed
- Calculates percentage reduction

### 3. Statistics Update
Runs `ANALYZE` after VACUUM to update query planner stats for optimal performance.

## Performance

### Timing
- Small DB (< 10 MB): < 1 second
- Medium DB (10-100 MB): 1-5 seconds
- Large DB (100 MB - 1 GB): 5-30 seconds

### Space Savings
Depends on database fragmentation:
- 0-5%: Already well optimized
- 5-15%: Normal fragmentation
- 15-30%: Significant fragmentation (needs vacuum)
- 30%+: Heavy fragmentation (urgent)

## Automation

### Cron Schedule

**Monthly (recommended):**
```cron
# First day of month at 3 AM
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

**Weekly (for active databases):**
```cron
# Sunday at 3 AM
0 3 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

**After data imports:**
```bash
# In your import script
./import-locations.js data.csv
./vacuum-database.sh
```

### Integration

**Git hook (post-merge):**
```bash
#!/bin/bash
# .git/hooks/post-merge

if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep "server/.*\.sql$"; then
  echo "Database schema changed, running vacuum..."
  cd server && ./vacuum-database.sh
fi
```

## Technical Details

### What VACUUM Does
```sql
-- Internally, VACUUM:
1. Creates a new database file
2. Copies all data from old to new
3. Removes deleted/updated space
4. Defragments pages
5. Replaces old file with new
6. Updates internal statistics
```

### Page Statistics

**page_size** - Size of each database page (4096 bytes default)  
**page_count** - Total pages in database file  
**freelist_count** - Pages marked for reuse (fragmentation)  
**Fragmentation %** - (freelist_count / page_count) × 100

### ANALYZE

After VACUUM, the script runs ANALYZE to:
- Update table statistics
- Improve query planner decisions
- Optimize index usage

## Troubleshooting

### "No space to reclaim"
✅ Normal! Database is already optimized.
- Run after deletions/updates to see space savings

### "Integrity check failed"
🚨 **Stop!** Database corruption detected.
1. Restore from backup
2. Investigate cause of corruption
3. Fix underlying issue before vacuuming

### "Disk full" during vacuum
- VACUUM needs temporary space equal to database size
- Free up space before running
- Or vacuum on a machine with more disk space

### Slow vacuum (> 1 minute for < 100 MB DB)
- Check disk I/O performance
- Ensure no other processes accessing DB
- Consider running during off-hours

## Advanced Usage

### Manual VACUUM
```bash
sqlite3 trailcamp.db "VACUUM;"
```

### VACUUM specific table (not supported in SQLite)
SQLite vacuums entire database - cannot vacuum individual tables.

### Check fragmentation
```bash
# Without running vacuum
sqlite3 trailcamp.db << 'EOF'
SELECT 
  page_count,
  freelist_count,
  ROUND(freelist_count * 100.0 / page_count, 1) as fragmentation_pct
FROM (
  SELECT 
    (SELECT * FROM pragma_page_count()) as page_count,
    (SELECT * FROM pragma_freelist_count()) as freelist_count
);
EOF
```

### Size comparison
```bash
# Before vacuum
ls -lh trailcamp.db

# Run vacuum
./vacuum-database.sh

# Check new size
ls -lh trailcamp.db
```

## Best Practices

1. **Backup first** - Always backup before vacuuming
   ```bash
   ./backup-database.sh
   ./vacuum-database.sh
   ```

2. **Run during off-hours** - Minimizes user impact

3. **Monitor results** - Track space savings over time

4. **Schedule regularly** - Monthly for active databases

5. **After bulk operations** - Always vacuum after large deletions

6. **Before backups** - Smaller, more efficient backups

## Comparison with Other Operations

| Operation | Purpose | Frequency |
|-----------|---------|-----------|
| VACUUM | Reclaim space, defragment | Monthly |
| ANALYZE | Update statistics | After schema changes |
| REINDEX | Rebuild indexes | Rarely (corruption) |
| Backup | Save database copy | Daily |
| Integrity Check | Detect corruption | Weekly |

## Production Considerations

### Load Balancing
If using multiple database instances:
- Vacuum one instance at a time
- Rotate through instances
- Monitor query performance

### Monitoring
Track vacuum effectiveness:
- Log space savings
- Monitor query performance before/after
- Alert if fragmentation > 20%

### Rollback
VACUUM is not transactional - cannot be rolled back.
- Always backup first
- Test on development copy if uncertain

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
