# Database Vacuum Guide

## Overview
The VACUUM operation reclaims unused space, defragments the database file, and can improve query performance. This script automates the process with safety checks.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

## What It Does

1. **Integrity Check** - Verifies database health before proceeding
2. **VACUUM** - Reclaims space from deleted records and defragments
3. **ANALYZE** - Updates query planner statistics for better performance
4. **Results** - Shows before/after size and space saved

## When to Run

### Recommended Schedule
- **Monthly** - Regular maintenance
- **After large deletions** - Removed 100+ locations
- **After bulk imports** - Added 1000+ locations
- **Performance issues** - Queries slower than expected

### Signs You Need VACUUM
- Database file keeps growing despite deletions
- Queries getting slower over time  
- Disk space concerns
- After migration or schema changes

## What VACUUM Does

### Space Reclamation
- Removes deleted/updated row fragments
- Reclaims unused pages
- Reduces database file size

### Defragmentation
- Reorganizes data for sequential access
- Improves cache locality
- Faster table scans

### No Changes ANALYZE
- Updates statistics used by query planner
- Helps SQLite choose optimal query plans
- Should run after VACUUM

## Safety

### ✅ Safe Operations
- **Read-only during check** - Integrity check doesn't modify data
- **Atomic operation** - VACUUM completes or rolls back entirely
- **No data loss** - Only removes unused space, not actual data
- **Automatic rollback** - Aborts if integrity issues detected

### ⚠️ During VACUUM
- Database is **locked for writes**
- Reads may be slower
- Temporary disk space needed (~2x database size)
- Takes 1-10 seconds for typical database size

### 🚫 When NOT to Run
- During active user sessions (production)
- When disk space is critically low
- If database integrity check fails
- During backups or migrations

## Performance Impact

### Typical Results
- **Small databases** (< 100MB): 1-2 seconds
- **Medium databases** (100MB - 1GB): 5-10 seconds
- **Large databases** (> 1GB): 30+ seconds

### Space Savings
- **After deletions**: 10-30% size reduction common
- **Regular use**: 0-5% (maintenance)
- **After bulk operations**: Up to 50% possible

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Database Vacuum
    2026-02-28 19:00:28
═══════════════════════════════════════════════════════

Database size before: 9.9M

━━━ 1. Integrity Check ━━━
✓ Database integrity OK

━━━ 2. Running VACUUM ━━━
Reclaiming unused space and defragmenting...
✓ VACUUM completed in 0 seconds

━━━ 3. Running ANALYZE ━━━
Updating query planner statistics...
✓ ANALYZE completed

━━━ Results ━━━
Size before:  9.9M
Size after:   9.3M
Space saved:  0.6MB (6%)

═══════════════════════════════════════════════════════
✅ Database optimization complete
═══════════════════════════════════════════════════════
```

## Automation

### Cron Job (Monthly)
```cron
# Run vacuum on 1st of each month at 3am
0 3 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

### After Bulk Operations
```bash
# Import data
node import-locations.js large-dataset.csv

# Optimize after import
./vacuum-database.sh
```

### CI/CD Integration
```bash
# In deployment script
./backup-database.sh          # Backup first
./vacuum-database.sh          # Optimize
./check-data-quality.sh       # Verify
```

## Troubleshooting

### "Database integrity check FAILED"
**Cause:** Database corruption detected  
**Action:** Restore from backup immediately
```bash
# List backups
ls -lh backups/

# Restore latest backup
cp backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql restore.sql
sqlite3 trailcamp.db < restore.sql
```

### "Disk space is critically low"
**Cause:** VACUUM needs temp space (~2x DB size)  
**Action:** Free up disk space first
```bash
# Check disk space
df -h .

# Clean up old backups if needed
cd backups && rm trailcamp-backup-YYYY-MM-DD*.sql
```

### VACUUM Takes Too Long
**Cause:** Large database or slow disk  
**Action:** Run during maintenance window
- Expect ~1 minute per GB
- Consider running overnight
- Warn users of potential slowness

### No Space Reclaimed
**Cause:** No deletions since last vacuum  
**Action:** This is normal! VACUUM still helps by:
- Defragmenting data
- Updating statistics
- Reorganizing pages

## Advanced Usage

### Manual VACUUM (SQLite CLI)
```bash
sqlite3 trailcamp.db "VACUUM;"
```

### Check If VACUUM Is Needed
```bash
# Compare page count to file size
sqlite3 trailcamp.db << 'EOF'
.mode column
SELECT 
  page_count * page_size / 1024 / 1024 as used_mb,
  (SELECT size FROM pragma_database_list) / 1024 / 1024 as file_mb
FROM pragma_page_count(), pragma_page_size();
EOF
```

### VACUUM Specific Table (Not Possible)
SQLite VACUUM operates on entire database. Cannot vacuum individual tables.

## Best Practices

1. **Backup first** - Always run `./backup-database.sh` before VACUUM
2. **Off-peak hours** - Run when traffic is low
3. **Check integrity** - Script does this automatically
4. **Monitor results** - Track space saved over time
5. **Regular schedule** - Monthly maintenance prevents buildup

## Integration with Other Tools

### After Large Deletions
```bash
# Delete old locations
sqlite3 trailcamp.db "DELETE FROM locations WHERE ..."

# Reclaim space
./vacuum-database.sh

# Verify
./check-data-quality.sh
```

### With Performance Monitoring
```bash
# Before optimization
./test-performance.sh > before.log

# Optimize
./vacuum-database.sh

# After optimization
./test-performance.sh > after.log

# Compare
diff before.log after.log
```

## FAQ

**Q: Will VACUUM delete my data?**  
A: No. VACUUM only removes unused space from deleted records.

**Q: How often should I run it?**  
A: Monthly is recommended. More often after bulk changes.

**Q: Does it improve performance?**  
A: Usually yes, especially after deletions or on fragmented databases.

**Q: Can I run it on production?**  
A: Yes, but database will be locked briefly. Run during low-traffic periods.

**Q: What if it fails?**  
A: Changes are rolled back automatically. Database remains unchanged.

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
*SQLite version: 3.x*
