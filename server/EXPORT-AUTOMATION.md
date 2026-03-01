# Export Automation Guide

## Overview
Automates weekly exports of all TrailCamp data in multiple formats (CSV, JSON, SQL) for backups and external use.

## Quick Start

### Manual Export
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./export-all.sh
```

### Automated Weekly Exports

Add to crontab (`crontab -e`):
```cron
# TrailCamp weekly export - every Sunday at midnight
0 0 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-all.sh >> ./logs/exports.log 2>&1
```

## What Gets Exported

### CSV Files (3.1MB total)
- **all-locations.csv** - Complete database (6,148 locations)
- **riding-locations.csv** - All riding spots (1,554 locations)
- **boondocking-locations.csv** - Free camping (732 locations)
- **campgrounds.csv** - Developed campgrounds (2.3MB)
- **trips.csv** - All saved trips

### JSON Data (160KB total)
- **dashboard-data.json** - Complete dashboard metrics
- **health-metrics.json** - System health status
- **density-analysis.json** - Location density heatmap data

### Reports
- **trail-mileage-report.md** - Trail statistics by region/difficulty
- **cost-analysis-report.md** - Camping cost breakdown

### Backup
- **database-backup.sql** - Complete SQL dump (14MB)

### Summary
- **README.txt** - Export metadata and statistics

## Export Directory Structure

```
server/exports/
├── 2026-02-28/          # This week's export
│   ├── all-locations.csv
│   ├── riding-locations.csv
│   ├── boondocking-locations.csv
│   ├── campgrounds.csv
│   ├── trips.csv
│   ├── dashboard-data.json
│   ├── health-metrics.json
│   ├── density-analysis.json
│   ├── trail-mileage-report.md
│   ├── cost-analysis-report.md
│   ├── database-backup.sql
│   └── README.txt
├── 2026-02-21/          # Last week
└── 2026-02-14/          # 2 weeks ago
```

## Features

### ✅ Complete Data Export
- All database tables in CSV format
- Pre-generated analytics in JSON
- Statistics reports in Markdown
- Full SQL backup

### ✅ Automatic Cleanup
- Keeps 4 weeks of exports (28 days)
- Automatically deletes older exports
- Saves disk space

### ✅ Timestamped
- Each export in dated directory (YYYY-MM-DD)
- Easy to find specific dates
- No overwrites

### ✅ Summary Stats
- Location counts by category
- File sizes
- Export metadata

## Use Cases

### 1. Weekly Backups
Automated disaster recovery:
```bash
# Restore from weekly export
cd /Users/nicosstrnad/Projects/trailcamp/server
sqlite3 trailcamp.db < exports/2026-02-28/database-backup.sql
```

### 2. External Analysis
Share data with Excel/Google Sheets:
```bash
# Open CSV in spreadsheet
open exports/2026-02-28/riding-locations.csv
```

### 3. API Data Serving
Serve pre-generated JSON:
```javascript
// Serve latest dashboard data
app.get('/api/dashboard', (req, res) => {
  const latest = getLatestExport(); // Helper function
  res.sendFile(`exports/${latest}/dashboard-data.json`);
});
```

### 4. Offline Data Access
Keep local copies for offline work:
```bash
# Copy to USB drive
cp -r exports/2026-02-28 /Volumes/Backup/trailcamp/
```

### 5. Data Migration
Move data to new system:
```bash
# Export from old server, import to new
scp -r exports/2026-02-28 newserver:/data/
```

## Cron Schedule Options

### Weekly (Sunday midnight)
```cron
0 0 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-all.sh >> ./logs/exports.log 2>&1
```

### Daily (3 AM)
```cron
0 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-all.sh >> ./logs/exports.log 2>&1
```

### Monthly (1st of month)
```cron
0 0 1 * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-all.sh >> ./logs/exports.log 2>&1
```

## Monitoring

### Check Export Logs
```bash
tail -f /Users/nicosstrnad/Projects/trailcamp/server/logs/exports.log
```

### Verify Latest Export
```bash
# List exports
ls -lh /Users/nicosstrnad/Projects/trailcamp/server/exports/

# Check latest
ls -lh /Users/nicosstrnad/Projects/trailcamp/server/exports/$(ls -1 exports | tail -1)/
```

### Alert on Failure
Add to cron:
```cron
0 0 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./export-all.sh || echo "Export failed!" | mail -s "TrailCamp Export Error" you@example.com
```

## Performance

- **Export time:** ~10 seconds for 6,000+ locations
- **Total size:** ~20MB per export
- **Disk usage:** ~80MB for 4 weeks of exports
- **Database impact:** Read-only queries, no locks

## Customization

### Change Retention Period
Edit `export-all.sh`:
```bash
# Keep 8 weeks instead of 4
find "${EXPORT_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +56
```

### Add Custom Exports
Add to `export-all.sh`:
```bash
# Export featured locations
sqlite3 "${DB_PATH}" -header -csv \
  "SELECT * FROM locations WHERE featured = 1" \
  > "${WEEK_DIR}/featured-locations.csv"
```

### Compress Exports
Add compression:
```bash
# After all exports
tar -czf "${WEEK_DIR}.tar.gz" "${WEEK_DIR}"
rm -rf "${WEEK_DIR}"
```

## Troubleshooting

### "Permission denied"
```bash
chmod +x export-all.sh
```

### "No such file or directory"
```bash
# Create exports directory
mkdir -p exports
```

### Cron not running
```bash
# Check cron is enabled
sudo launchctl list | grep cron

# Check crontab syntax
crontab -l

# Check system logs
tail -f /var/log/system.log | grep cron
```

### Large export size
```bash
# Check file sizes
du -sh exports/*/

# Remove old manual exports
rm -rf exports/2026-01-*
```

## Best Practices

1. **Run weekly** - Balance between freshness and disk usage
2. **Monitor logs** - Check for failures regularly
3. **Test restores** - Verify backups are usable
4. **Keep offsite** - Copy to cloud/external drive monthly
5. **Version control** - Commit exports directory to .gitignore

---

*Last updated: 2026-02-28*
*Script: export-all.sh*
*Schedule: Weekly (Sundays at midnight)*
