# Data Export Scheduler

## Overview
Automated export system that generates database exports in multiple formats (SQL, CSV, JSON) with automatic cleanup of old exports.

## Quick Start

### Manual Export
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./export-scheduler.sh
```

### Automated Weekly Exports
Add to crontab:
```bash
# Run every Sunday at 2:00 AM
0 2 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-scheduler.sh >> ./exports/scheduler.log 2>&1
```

## Exports Generated

### SQL Dump (Full Database)
- **File:** `exports/sql/trailcamp-YYYY-MM-DD.sql`
- **Size:** ~14MB
- **Contains:** Complete database schema + all data
- **Use for:** Backup, restoration, migration

### CSV Exports
All exports include headers and are sorted by ID:

| File | Description | Size |
|------|-------------|------|
| `locations-all-YYYY-MM-DD.csv` | All locations | ~3.1MB |
| `locations-riding-YYYY-MM-DD.csv` | Riding locations only | ~500KB |
| `locations-boondocking-YYYY-MM-DD.csv` | Boondocking spots only | ~300KB |
| `locations-campgrounds-YYYY-MM-DD.csv` | Campgrounds only | ~2.3MB |
| `trips-YYYY-MM-DD.csv` | All trips | ~4KB |

### JSON Exports
| File | Description | Size |
|------|-------------|------|
| `locations-all-YYYY-MM-DD.json` | All locations as JSON array | ~9MB |
| `stats-YYYY-MM-DD.json` | Summary statistics | ~4KB |

## Statistics JSON Format

```json
{
  "total_locations": 6238,
  "riding": 1394,
  "campsites": 4832,
  "boondocking": 639,
  "trips": 3,
  "trip_stops": 0,
  "total_trail_miles": 84665,
  "excellent_scenery": 1425,
  "free_camping": 639
}
```

## Automatic Cleanup

- **Retention:** 4 weeks (28 days)
- **Frequency:** Runs during each export
- **Behavior:** Deletes files older than retention period
- **Safety:** Only deletes files in `exports/` subdirectories

### Customize Retention
Edit `export-scheduler.sh`:
```bash
RETENTION_WEEKS=4  # Change to desired number of weeks
```

## Directory Structure

```
server/
└── exports/
    ├── csv/
    │   ├── locations-all-2026-02-28.csv
    │   ├── locations-riding-2026-02-28.csv
    │   └── ...
    ├── json/
    │   ├── locations-all-2026-02-28.json
    │   └── stats-2026-02-28.json
    └── sql/
        └── trailcamp-2026-02-28.sql
```

## Scheduling Options

### Weekly (Recommended)
Sunday at 2 AM:
```cron
0 2 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-scheduler.sh >> ./exports/scheduler.log 2>&1
```

### Daily
Every day at 3 AM:
```cron
0 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-scheduler.sh >> ./exports/scheduler.log 2>&1
```

### Monthly
First day of month at 1 AM:
```cron
0 1 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-scheduler.sh >> ./exports/scheduler.log 2>&1
```

## Use Cases

### 1. Data Backup
- Automatic SQL dumps for disaster recovery
- Keep 4 weeks of backups automatically
- Restore any version within retention window

### 2. Analytics & Reporting
- Import CSV files into Excel/Google Sheets
- Analyze trends over time
- Generate custom reports

### 3. Data Sharing
- Share CSV/JSON exports with collaborators
- Import into other systems
- API-less data access

### 4. Testing
- Use exports to populate test databases
- Compare data before/after migrations
- Validate data transformations

### 5. Archival
- Long-term storage in cloud (S3, Google Drive)
- Compliance/audit requirements
- Historical snapshots

## Integration Examples

### Upload to Cloud Storage
```bash
#!/bin/bash
# upload-exports.sh

cd /Users/nicosstrnad/Projects/trailcamp/server
./export-scheduler.sh

# Upload to AWS S3
aws s3 sync ./exports/ s3://my-bucket/trailcamp-exports/

# Or Google Drive
rclone sync ./exports/ gdrive:TrailCamp/Exports/
```

### Email Weekly Report
```bash
#!/bin/bash
# weekly-report.sh

cd /Users/nicosstrnad/Projects/trailcamp/server
./export-scheduler.sh

# Email stats
cat ./exports/json/stats-$(date +%Y-%m-%d).json | \
  mail -s "TrailCamp Weekly Stats" admin@example.com
```

### Sync to Remote Server
```bash
#!/bin/bash
# sync-exports.sh

cd /Users/nicosstrnad/Projects/trailcamp/server
./export-scheduler.sh

# Rsync to backup server
rsync -avz ./exports/ backup-server:/backups/trailcamp/
```

## Monitoring

### Check Export Status
```bash
# View scheduler log
tail -f /Users/nicosstrnad/Projects/trailcamp/server/exports/scheduler.log

# List recent exports
ls -lht /Users/nicosstrnad/Projects/trailcamp/server/exports/sql/ | head
```

### Verify Export Sizes
Normal sizes (as of Feb 2026):
- SQL dump: ~14MB
- All locations CSV: ~3.1MB
- All locations JSON: ~9MB

**Alert if:**
- File size drops > 50% (possible corruption)
- Export fails to create
- Exports older than 1 week missing

### Test Restoration
Periodically test SQL dump restoration:
```bash
# Create test database from export
sqlite3 test.db < exports/sql/trailcamp-2026-02-28.sql

# Verify record counts
sqlite3 test.db "SELECT COUNT(*) FROM locations"

# Clean up
rm test.db
```

## Troubleshooting

### "Database not found" Error
- Ensure script runs from `/Users/nicosstrnad/Projects/trailcamp/server/`
- Check `DB_PATH` variable in script

### Exports Not Being Deleted
- Check file modification times: `ls -lt exports/csv/`
- Verify `RETENTION_WEEKS` setting
- Ensure script has write permissions

### Cron Job Not Running
```bash
# Check cron service
launchctl list | grep cron

# Verify crontab
crontab -l

# Check system logs
log show --predicate 'process == "cron"' --last 1h
```

### Large Export Sizes
If exports grow too large:
- Increase retention to reduce frequency
- Compress exports: `gzip exports/sql/*.sql`
- Archive to external storage

## Performance

### Export Times
With 6,238 locations:
- SQL dump: ~2 seconds
- CSV exports: ~3 seconds total
- JSON exports: ~2 seconds
- **Total:** ~10 seconds

### Storage Requirements
- Daily exports (4 weeks): ~800MB
- Weekly exports (4 weeks): ~120MB
- Monthly exports (12 months): ~350MB

## Best Practices

1. **Run during off-hours** - Minimize impact on production
2. **Monitor disk space** - Ensure sufficient storage for retention period
3. **Test restores** - Verify exports are valid
4. **Secure exports** - Restrict permissions (chmod 600)
5. **Encrypt sensitive data** - If exporting to cloud
6. **Version exports** - Date-stamped filenames enable rollback

## .gitignore

Add to `.gitignore`:
```
server/exports/
```

Exports should NOT be committed to git (too large, changes daily).

---

*Last updated: 2026-02-28*
*Script: export-scheduler.sh*
