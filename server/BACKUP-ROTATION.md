# Backup Rotation System

## Overview
Automated backup retention policy to keep backups organized and prevent disk space bloat.

## Retention Policy

| Type | Retention | Schedule |
|------|-----------|----------|
| **Daily** | 7 days | Every backup |
| **Weekly** | 4 weeks (28 days) | Sunday backups promoted |
| **Monthly** | 12 months (365 days) | 1st of month backups promoted |

## Quick Start

### Manual Rotation
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./rotate-backups.sh
```

### Automated Rotation (Cron)
```bash
# Add to crontab (run `crontab -e`)
# Run after daily backup (3:05 AM)
5 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./rotate-backups.sh >> ./logs/backup-rotation.log 2>&1
```

## How It Works

### 1. Promotion to Weekly
- **When:** Every Sunday
- **What:** Copies latest daily backup to `backups/weekly/`
- **Why:** Preserve weekly snapshots for month-long history

### 2. Promotion to Monthly
- **When:** 1st of each month
- **What:** Copies latest daily backup to `backups/monthly/`
- **Why:** Preserve monthly snapshots for year-long history

### 3. Cleanup Daily
- **When:** Every run
- **What:** Deletes backups in `backups/` older than 7 days
- **Why:** Keep recent daily snapshots only

### 4. Cleanup Weekly
- **When:** Every run
- **What:** Deletes backups in `backups/weekly/` older than 28 days
- **Why:** 4 weeks of weekly history is sufficient

### 5. Cleanup Monthly
- **When:** Every run
- **What:** Deletes backups in `backups/monthly/` older than 365 days
- **Why:** 12 months of monthly history

## Directory Structure

```
server/backups/
├── trailcamp-backup-2026-02-28_12-58-00.sql  # Daily (last 7 days)
├── trailcamp-backup-2026-02-27_03-00-00.sql
├── ...
├── weekly/
│   ├── trailcamp-backup-2026-02-23_03-00-00.sql  # Weekly (last 4 weeks)
│   ├── trailcamp-backup-2026-02-16_03-00-00.sql
│   └── ...
└── monthly/
    ├── trailcamp-backup-2026-02-01_03-00-00.sql  # Monthly (last 12 months)
    ├── trailcamp-backup-2026-01-01_03-00-00.sql
    └── ...
```

## Storage Estimates

### Current Database (~14MB per backup)

| Retention | Backups | Storage |
|-----------|---------|---------|
| Daily (7) | 7 | ~98MB |
| Weekly (4) | 4 | ~56MB |
| Monthly (12) | 12 | ~168MB |
| **Total** | **23** | **~322MB** |

### At 10,000 Locations (~25MB per backup)

| Retention | Backups | Storage |
|-----------|---------|---------|
| Daily (7) | 7 | ~175MB |
| Weekly (4) | 4 | ~100MB |
| Monthly (12) | 12 | ~300MB |
| **Total** | **23** | **~575MB** |

## Integration with Backup Script

### Recommended Cron Setup

```bash
# Daily backup at 3:00 AM
0 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./backup-database.sh >> ./logs/backup.log 2>&1

# Rotation at 3:05 AM (after backup)
5 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./rotate-backups.sh >> ./logs/backup-rotation.log 2>&1
```

This ensures:
1. Fresh backup created at 3:00 AM
2. Rotation runs at 3:05 AM (after backup completes)
3. Sunday backups promoted to weekly
4. 1st of month backups promoted to monthly
5. Old backups cleaned up

## Manual Operations

### List All Backups
```bash
cd server/backups

# Daily backups
ls -lh trailcamp-backup-*.sql

# Weekly backups
ls -lh weekly/

# Monthly backups
ls -lh monthly/
```

### Restore from Specific Tier
```bash
# Restore from daily
sqlite3 trailcamp.db < backups/trailcamp-backup-2026-02-28_12-58-00.sql

# Restore from weekly
sqlite3 trailcamp.db < backups/weekly/trailcamp-backup-2026-02-23_03-00-00.sql

# Restore from monthly
sqlite3 trailcamp.db < backups/monthly/trailcamp-backup-2026-02-01_03-00-00.sql
```

### Force Promotion
```bash
# Manually promote to weekly
cp backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql backups/weekly/

# Manually promote to monthly
cp backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql backups/monthly/
```

### Adjust Retention Periods
Edit `rotate-backups.sh`:
```bash
DAILY_RETENTION=7      # days
WEEKLY_RETENTION=28    # days (4 weeks)
MONTHLY_RETENTION=365  # days (12 months)
```

## Monitoring

### Check Rotation Logs
```bash
tail -f server/logs/backup-rotation.log
```

### Verify Backup Counts
```bash
cd server/backups

echo "Daily: $(ls -1 trailcamp-backup-*.sql 2>/dev/null | wc -l)"
echo "Weekly: $(ls -1 weekly/trailcamp-backup-*.sql 2>/dev/null | wc -l)"
echo "Monthly: $(ls -1 monthly/trailcamp-backup-*.sql 2>/dev/null | wc -l)"
```

### Alert on Missing Backups
```bash
#!/bin/bash
# Check if backups exist for each tier

DAILY_COUNT=$(ls -1 backups/trailcamp-backup-*.sql 2>/dev/null | wc -l)
WEEKLY_COUNT=$(ls -1 backups/weekly/trailcamp-backup-*.sql 2>/dev/null | wc -l)
MONTHLY_COUNT=$(ls -1 backups/monthly/trailcamp-backup-*.sql 2>/dev/null | wc -l)

if [ $DAILY_COUNT -eq 0 ]; then
  echo "⚠️ WARNING: No daily backups found!"
fi

if [ $WEEKLY_COUNT -eq 0 ] && [ "$(date +%u)" -eq 7 ]; then
  echo "⚠️ WARNING: No weekly backups (should have at least 1 after Sunday)"
fi

if [ $MONTHLY_COUNT -eq 0 ] && [ "$(date +%d)" -gt 7 ]; then
  echo "⚠️ WARNING: No monthly backups (should have at least 1 after 1st)"
fi
```

## Troubleshooting

### Script Not Promoting Backups
**Issue:** Backups not being promoted to weekly/monthly

**Check:**
```bash
# Is it Sunday?
date +%u  # Should return 7

# Is it 1st of month?
date +%d  # Should return 01

# Are there daily backups to promote?
ls -1 backups/trailcamp-backup-*.sql | wc -l
```

### Backups Growing Too Large
**Issue:** Disk space running low

**Solutions:**
1. Reduce retention periods
2. Compress old backups: `gzip backups/monthly/*.sql`
3. Move old backups to external storage

### Accidental Deletion
**Issue:** Important backup was deleted

**Prevention:**
- Test rotation on a copy first
- Keep backups off-site (cloud storage)
- Use `-i` flag for interactive deletion (not recommended for cron)

## Best Practices

1. **Test rotation before automation**
   ```bash
   # Create test backups
   touch backups/test-{1..10}.sql
   # Run rotation
   ./rotate-backups.sh
   # Verify behavior
   ```

2. **Monitor disk space**
   ```bash
   df -h /Users/nicosstrnad/Projects/trailcamp/server/backups
   ```

3. **Off-site backups**
   - Upload monthly backups to cloud storage
   - Keep critical backups on external drive
   - Use versioned cloud storage (S3, Dropbox, etc.)

4. **Document restore procedures**
   - Test restoring from each tier periodically
   - Document restore process in runbook

5. **Set up alerts**
   - Alert if rotation fails
   - Alert if backup count drops unexpectedly
   - Monitor disk space usage

---

*Last updated: 2026-02-28*
*Script: rotate-backups.sh*
*Retention: Daily (7d), Weekly (28d), Monthly (365d)*
