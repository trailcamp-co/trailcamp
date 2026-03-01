# Weekly Export Automation

## Overview
Automated weekly exports of TrailCamp data in multiple formats (CSV, JSON, SQL) for backup, distribution, and analysis.

## Quick Start

### Manual Export
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./weekly-exports.sh
```

### Automated Weekly Export (Cron)
```bash
# Add to crontab (run `crontab -e`)
# Every Sunday at 2:00 AM
0 2 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./weekly-exports.sh >> ./logs/weekly-export.log 2>&1
```

## What Gets Exported

### 1. CSV Exports
- **all-locations.csv** - Complete database (all categories)
- **riding-locations.csv** - Riding spots only, sorted by state
- **camping-locations.csv** - All campsites, sorted by state/type
- **boondocking-locations.csv** - Boondocking spots only

### 2. JSON Exports
- **dashboard-metrics.json** - Dashboard data (quality score, stats)
- **health-metrics.json** - System health monitoring data
- **density-analysis.json** - Location density heatmap data

### 3. Database Backup
- **database-backup.sql** - Full SQL dump (~14MB)

### 4. Summary Report
- **export-summary.txt** - Statistics and file list

## Output Structure

```
server/exports/
├── weekly-2026-02-28/
│   ├── all-locations.csv
│   ├── riding-locations.csv
│   ├── camping-locations.csv
│   ├── boondocking-locations.csv
│   ├── dashboard-metrics.json
│   ├── health-metrics.json
│   ├── density-analysis.json
│   ├── database-backup.sql
│   └── export-summary.txt
└── weekly-2026-02-28.tar.gz (5.3MB archive)
```

## Archive Format

All exports are packaged into a timestamped `.tar.gz` archive for easy distribution and storage.

### Extract Archive
```bash
cd server/exports
tar -xzf weekly-2026-02-28.tar.gz
```

## Retention Policy

- **Keeps:** Last 8 weeks of exports (56 days)
- **Auto-deletes:** Exports older than 8 weeks
- **Storage:** ~5-6MB per week = ~40MB for 8 weeks

### Manual Cleanup
```bash
# Delete all exports older than 30 days
find ./exports -name "weekly-*.tar.gz" -mtime +30 -delete

# List all exports with dates
ls -lh ./exports/weekly-*.tar.gz
```

## Automation Setup

### Cron Job (Recommended)
```bash
# Edit crontab
crontab -e

# Add this line for weekly Sunday 2 AM export
0 2 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./weekly-exports.sh >> ./logs/weekly-export.log 2>&1

# Alternative schedules:
# Daily at 3 AM:  0 3 * * *
# Monthly 1st:    0 2 1 * *
```

### Verify Cron Job
```bash
# List cron jobs
crontab -l

# Check recent exports
ls -lt server/exports/

# View export log
tail -f server/logs/weekly-export.log
```

### macOS Specific
On macOS, cron may require permissions:
1. System Settings → Privacy & Security → Full Disk Access
2. Add Terminal or cron to allowed apps

## Export Statistics

### Current Export Contents (Example)
```
Total Locations: 6,148
Riding Locations: 1,394
Campsites: 4,742
Boondocking: 639
Trips: 3

Quality Metrics:
- With Scenery Ratings: 6,148 (100%)
- With State Data: 6,131 (99.7%)
- With Coordinates: 6,148 (100%)

Top 5 States:
  CA: 978 locations
  ID: 736 locations
  OR: 479 locations
  UT: 434 locations
  CO: 362 locations

Total Trail Miles: 84,665
```

## Use Cases

### 1. Backup & Disaster Recovery
- Weekly SQL dumps for point-in-time restore
- Off-site storage of archives
- Version control for data changes

### 2. Data Distribution
- Share CSV files with contributors
- Publish JSON APIs for external apps
- Distribute offline datasets

### 3. Analysis & Reporting
- Import CSVs into Excel/Google Sheets
- Load JSON into analytics tools
- Track growth trends over time

### 4. External Integration
- Feed data to mapping services
- Sync with mobile apps
- Power external dashboards

## Advanced Usage

### Custom Export Schedule
```bash
# Modify EXPORT_DIR in weekly-exports.sh
EXPORT_DIR="/path/to/network/storage/exports"

# Or use environment variable
EXPORT_DIR="/backups" ./weekly-exports.sh
```

### Upload to Cloud Storage
```bash
#!/bin/bash
# Add to end of weekly-exports.sh or separate script

# Upload to S3 (example)
aws s3 cp ./exports/weekly-$(date +%Y-%m-%d).tar.gz \
  s3://trailcamp-backups/weekly/

# Upload to Dropbox (example)
cp ./exports/weekly-$(date +%Y-%m-%d).tar.gz \
  ~/Dropbox/TrailCamp-Backups/
```

### Email Export Summary
```bash
#!/bin/bash
# Email weekly stats

SUMMARY_FILE="./exports/weekly-$(date +%Y-%m-%d)/export-summary.txt"

mail -s "TrailCamp Weekly Export - $(date +%Y-%m-%d)" \
  your-email@example.com < "$SUMMARY_FILE"
```

### Slack Notification
```bash
#!/bin/bash
# Post export completion to Slack

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"TrailCamp weekly export completed: $(date)\"}" \
  "$WEBHOOK_URL"
```

## Monitoring

### Check Last Export
```bash
# Find most recent export
ls -lt server/exports/weekly-*.tar.gz | head -1

# Verify archive contents
tar -tzf server/exports/weekly-2026-02-28.tar.gz

# Check export summary
cat server/exports/weekly-2026-02-28/export-summary.txt
```

### Automated Monitoring
```bash
#!/bin/bash
# Check if export ran this week

LATEST_EXPORT=$(ls -t server/exports/weekly-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LATEST_EXPORT" ]; then
  echo "ERROR: No exports found!"
  exit 1
fi

AGE_DAYS=$(find "$LATEST_EXPORT" -mtime +7 | wc -l)

if [ $AGE_DAYS -gt 0 ]; then
  echo "WARNING: Latest export is older than 7 days"
  exit 1
fi

echo "OK: Export is current"
```

## Troubleshooting

### Export Script Fails
```bash
# Check disk space
df -h

# Verify database exists
ls -lh server/trailcamp.db

# Test manually
cd server && ./weekly-exports.sh
```

### Cron Job Not Running
```bash
# Check cron is enabled (macOS)
sudo launchctl list | grep cron

# View cron logs (macOS)
log show --predicate 'processImagePath contains "cron"' --last 1d

# Test cron environment
* * * * * echo "Cron test $(date)" >> /tmp/cron-test.log
```

### Large Export Size
If exports grow too large:
- Enable gzip compression (already done)
- Exclude large fields if not needed
- Split into multiple smaller exports
- Adjust retention policy (fewer weeks)

### Missing Files in Export
If some files are missing:
- Check script output for errors
- Verify prerequisite scripts exist (generate-dashboard-data.js, etc.)
- Run generation scripts manually first
- Check file permissions

## Performance

- **Export time:** ~10-15 seconds for 6,000 locations
- **Archive size:** ~5-6MB (gzipped)
- **Uncompressed:** ~25-30MB
- **Disk I/O:** Minimal (mostly sequential writes)

## Integration with Other Systems

### Import to Google Sheets
1. Upload CSV to Google Drive
2. Open with Google Sheets
3. Data → Import

### Power BI / Tableau
1. Use CSV exports as data source
2. Schedule refresh to match export schedule
3. Connect directly to JSON for dashboards

### Mobile App Sync
1. Upload JSON exports to CDN
2. Mobile app downloads weekly snapshot
3. Offline-first architecture

---

*Last updated: 2026-02-28*
*Script: weekly-exports.sh*
*Retention: 8 weeks*
