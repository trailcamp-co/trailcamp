# Database Vacuum & Optimization

## Overview
Regular database maintenance using SQLite's VACUUM and ANALYZE commands to optimize performance and reclaim space.

## Quick Start

### Manual Vacuum
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./vacuum-database.sh
```

### Automated Weekly Vacuum (Cron)
```bash
# Add to crontab (run `crontab -e`)
# Every Sunday at 4:00 AM (after backups)
0 4 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

## What It Does

### VACUUM
- **Rebuilds** the database file from scratch
- **Reclaims** unused space from deleted records
- **Defragments** database pages for better performance
- **Reduces** fragmentation from INSERT/UPDATE/DELETE operations

### ANALYZE
- **Gathers** statistics about table contents
- **Updates** query optimizer with current data distribution
- **Improves** query performance by helping SQLite choose better indexes

## When to Run

### Weekly (Recommended)
- Low to moderate activity databases
- Sunday mornings (low traffic)
- After backups complete

### Daily
- High activity databases with frequent writes
- If you notice query performance degrading

### After Major Changes
- Bulk data imports/deletions
- Schema migrations
- Large UPDATE operations

## Benefits

### Performance
- ✅ Faster queries (better query plans from ANALYZE)
- ✅ Reduced I/O (defragmented pages)
- ✅ Smaller database file (reclaimed space)

### Maintenance
- ✅ Prevents database bloat over time
- ✅ Keeps statistics up-to-date for optimizer
- ✅ Maintains consistent performance

## Expected Results

### Small Database (< 10MB)
- **VACUUM:** < 1 second
- **ANALYZE:** < 1 second
- **Space saved:** Minimal (database is compact)
- **Size may increase:** 0.1-0.5MB (from ANALYZE statistics)

### Medium Database (10-100MB)
- **VACUUM:** 1-5 seconds
- **ANALYZE:** 1-3 seconds
- **Space saved:** 1-10% typically
- **Size may increase:** 0.5-2MB (from ANALYZE statistics)

### Large Database (100MB+)
- **VACUUM:** 10-30 seconds
- **ANALYZE:** 5-10 seconds
- **Space saved:** 5-15% typically
- **Size may increase:** 2-5MB (from ANALYZE statistics)

## Safety

### Integrity Check
The script runs `PRAGMA integrity_check` before VACUUM:
- ✅ If pass: proceeds with vacuum
- ❌ If fail: aborts and reports errors

### Backup Recommendation
Always backup before vacuum:
```bash
# Create backup first
./backup-database.sh

# Then vacuum
./vacuum-database.sh
```

### Locking Behavior
⚠️ **VACUUM requires an exclusive lock:**
- All connections must be closed
- Write operations will be blocked
- Read operations will be blocked

**Best practice:** Run during low-traffic periods (night/early morning)

## Monitoring

### Check Vacuum Logs
```bash
tail -f server/logs/vacuum.log
```

### Measure Performance Impact
```bash
# Before vacuum
./run-benchmarks.sh > before.txt

# Run vacuum
./vacuum-database.sh

# After vacuum
./run-benchmarks.sh > after.txt

# Compare
diff before.txt after.txt
```

### Track Database Growth
```bash
# Add to monitoring script
du -h server/trailcamp.db
```

## Troubleshooting

### "Database is locked"
**Issue:** VACUUM cannot acquire exclusive lock

**Solutions:**
1. Stop dev server: `pkill -f "tsx watch"`
2. Close all database connections
3. Wait a few seconds and retry
4. Check for long-running queries

### "Insufficient space"
**Issue:** VACUUM needs temp space (2x database size)

**Check available space:**
```bash
df -h .
```

**Solutions:**
1. Free up disk space
2. Set temp directory to different disk: `TMPDIR=/other/disk ./vacuum-database.sh`

### "Integrity check failed"
**Issue:** Database corruption detected

**Fix:**
```bash
# Restore from latest backup
sqlite3 trailcamp.db < backups/trailcamp-backup-latest.sql

# Run integrity check
sqlite3 trailcamp.db "PRAGMA integrity_check;"
```

## Advanced Usage

### VACUUM INTO (SQLite 3.27+)
Create compacted copy without locks:
```bash
sqlite3 trailcamp.db "VACUUM INTO 'trailcamp-vacuumed.db';"
```

### Auto-Vacuum Mode
Enable incremental vacuuming:
```sql
PRAGMA auto_vacuum = INCREMENTAL;
VACUUM;  -- Apply setting
```

Note: Auto-vacuum has overhead; manual VACUUM is usually better.

### ANALYZE Specific Tables
```bash
# Analyze only locations table
sqlite3 trailcamp.db "ANALYZE locations;"

# Analyze only trips table
sqlite3 trailcamp.db "ANALYZE trips;"
```

## Integration

### With Backup Script
```bash
#!/bin/bash
# Combined backup + vacuum

# 1. Backup first
./backup-database.sh

# 2. Then vacuum
./vacuum-database.sh

# 3. Then rotate backups
./rotate-backups.sh
```

### Cron Schedule Example
```bash
# Sunday 3:00 AM - Backup
0 3 * * 0 cd ~/Projects/trailcamp/server && ./backup-database.sh

# Sunday 3:05 AM - Rotate backups
5 3 * * 0 cd ~/Projects/trailcamp/server && ./rotate-backups.sh

# Sunday 4:00 AM - Vacuum (after backups complete)
0 4 * * 0 cd ~/Projects/trailcamp/server && ./vacuum-database.sh >> ./logs/vacuum.log 2>&1
```

## Performance Tips

1. **Run weekly** - Prevents accumulation of issues
2. **Run during low traffic** - Minimize impact on users
3. **Monitor query performance** - Use benchmarks to track improvements
4. **Keep statistics current** - ANALYZE helps optimizer significantly
5. **Check logs** - Review vacuum logs for any warnings

## When NOT to Vacuum

- ❌ During production traffic
- ❌ Without a recent backup
- ❌ If disk space is < 2x database size
- ❌ During schema migrations (run after)
- ❌ If integrity check fails (fix corruption first)

---

*Last updated: 2026-02-28*
*Script: vacuum-database.sh*
*Recommended: Weekly on Sundays at 4:00 AM*
