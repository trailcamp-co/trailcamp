# Database Vacuum Guide

## Overview
The `vacuum-database.sh` script optimizes the SQLite database by reclaiming unused space and updating query planner statistics.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

### 1. Integrity Check
Runs `PRAGMA integrity_check` to ensure database is healthy before vacuum.

### 2. VACUUM
Rebuilds the database file, reclaiming space from:
- Deleted records
- Fragmentation
- Free pages from UPDATE/DELETE operations

### 3. ANALYZE
Updates SQLite query planner statistics for optimal query performance.

## When to Run

### Manual
- After deleting many locations
- After bulk updates
- When database feels slow
- Before deployment

### Scheduled (Recommended)
```cron
# Weekly vacuum on Sundays at 3am
0 3 * * 0 cd /path/to/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum
    2026-02-28 18:20:33
═══════════════════════════════════════════════════════

1. Pre-Vacuum Status
   Database size: 9.9M

2. Integrity Check
   ✓ Database integrity: OK

3. Pre-Vacuum Statistics
   Total pages: 2538
   Page size: 4096 bytes
   Free pages: 124
   Wasted space: ~0MB (124 free pages)

4. Running VACUUM
   This may take a few seconds...
   ✓ VACUUM completed (2s)

5. Running ANALYZE
   Updating query planner statistics...
   ✓ ANALYZE completed

6. Post-Vacuum Statistics
   Total pages: 2414
   Free pages: 0

═══════════════════════════════════════════════════════
Summary

   Before:  9.9M
   After:   9.4M
   Saved:   0MB (5%)

   ✅ Database optimization complete!
═══════════════════════════════════════════════════════
```

## Benefits

### Space Reclamation
- Removes deleted/fragmented data
- Reduces file size
- Frees up disk space

### Performance Improvement
- Defragments database pages
- Updates query statistics (ANALYZE)
- Improves query planning

### Database Health
- Verifies integrity before optimizing
- Rebuilds indexes
- Cleans up internal structures

## When NOT to Run

❌ **During active use** - Vacuum requires exclusive lock  
❌ **If integrity check fails** - Fix corruption first  
❌ **On very large databases** - May take significant time (hours)

## Safety

### Automatic Safeguards
✅ Integrity check before vacuum  
✅ Fails if database is corrupt  
✅ Atomic operation (all or nothing)  
✅ Won't corrupt existing data

### Best Practices
1. **Backup first** (especially for large databases):
   ```bash
   ./backup-database.sh
   ./vacuum-database.sh
   ```

2. **Run during low-traffic** (scheduled at night)

3. **Monitor performance** after vacuum

## Technical Details

### How VACUUM Works
1. Creates temporary database file
2. Copies all data to temp file (omits free space)
3. Replaces original with optimized version
4. Updates internal structures

### Disk Space Required
- Temporary space: ~same size as database
- Example: 10MB database needs 10MB temp space
- Temp space freed after completion

### Performance Impact
- Duration: Seconds to minutes (depending on size)
- Locks database during operation
- No concurrent writes allowed
- Reads may be blocked

## Troubleshooting

### "Database not found"
Ensure you're in the correct directory:
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

### "Integrity check failed"
Database is corrupt. Restore from backup:
```bash
cp backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql trailcamp.db
```

### "No space reclaimed"
This is normal if:
- Database was recently created
- No deletions/updates occurred
- Already optimized recently

### "VACUUM failed"
Possible causes:
- Insufficient disk space
- Database locked by another process
- File system issues

## Monitoring

### Check if Vacuum is Needed
```bash
sqlite3 trailcamp.db "PRAGMA freelist_count;"
```

Output:
- `0` = No free space, vacuum not needed
- `> 100` = Consider vacuum
- `> 1000` = Vacuum recommended

### Estimate Reclaimable Space
```bash
sqlite3 trailcamp.db << 'EOF'
SELECT 
  page_count * page_size / 1024 / 1024 as total_mb,
  freelist_count * page_size / 1024 / 1024 as wasted_mb
FROM pragma_page_count(), pragma_page_size(), pragma_freelist_count();
EOF
```

## Integration

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
- name: Optimize Database
  run: |
    cd server
    ./vacuum-database.sh
```

### Monitoring Alerts
```bash
# Check if vacuum is needed
FREELIST=$(sqlite3 trailcamp.db "PRAGMA freelist_count;")
if [ $FREELIST -gt 500 ]; then
  echo "WARNING: Database needs vacuum ($FREELIST free pages)"
  # Send alert
fi
```

## Comparison to Other Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| VACUUM | Reclaim space, defragment | After bulk deletes/updates |
| ANALYZE | Update statistics | After schema changes, data imports |
| REINDEX | Rebuild indexes | After corruption, schema changes |
| PRAGMA optimize | Quick stats update | Before queries, lightweight |

## Alternatives

### Manual VACUUM
```bash
sqlite3 trailcamp.db "VACUUM;"
```

### VACUUM with ANALYZE
```bash
sqlite3 trailcamp.db "VACUUM; ANALYZE;"
```

### Auto-VACUUM (Not Recommended for Production)
```sql
PRAGMA auto_vacuum = FULL;
```
⚠️ Slower writes, less efficient than manual vacuum

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
