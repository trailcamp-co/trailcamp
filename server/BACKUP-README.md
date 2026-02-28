# Database Backup System

## Overview
Automated daily backup of the TrailCamp SQLite database to timestamped `.sql` dump files.

## Quick Start

### Manual Backup
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./backup-database.sh
```

### Automated Daily Backups (Cron)

Add to crontab (run `crontab -e`):
```cron
# Daily backup at 3:00 AM
0 3 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./backup-database.sh >> ./backups/backup.log 2>&1
```

Or for testing (every hour):
```cron
# Hourly backup (for testing)
0 * * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./backup-database.sh >> ./backups/backup.log 2>&1
```

## Configuration

Edit `backup-database.sh` to customize:
- `DB_PATH` - Path to database file (default: `./trailcamp.db`)
- `BACKUP_DIR` - Where to store backups (default: `./backups`)
- `RETENTION_DAYS` - How many days to keep backups (default: 7)

## Features

✅ **Timestamped backups** - Each backup includes date and time in filename
✅ **Automatic cleanup** - Deletes backups older than 7 days
✅ **Error handling** - Exits cleanly if database not found
✅ **Verification** - Confirms backup was created and shows file size
✅ **Summary output** - Shows backup count and recent backups

## Backup Format

Backups are stored as SQL dump files:
```
server/backups/trailcamp-backup-2026-02-28_12-57-30.sql
```

File naming: `trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql`

## Restore from Backup

To restore a backup:
```bash
# Stop the dev server first!
cd /Users/nicosstrnad/Projects/trailcamp/server

# Backup current database (just in case)
cp trailcamp.db trailcamp.db.before-restore

# Restore from backup
sqlite3 trailcamp.db < backups/trailcamp-backup-2026-02-28_12-57-30.sql
```

## Monitoring

Check backup logs (if using cron):
```bash
tail -f /Users/nicosstrnad/Projects/trailcamp/server/backups/backup.log
```

List all backups:
```bash
ls -lh /Users/nicosstrnad/Projects/trailcamp/server/backups/
```

## Storage

- Average backup size: ~3.6MB (5,597 locations)
- 7 days of daily backups: ~25MB total
- Backups stored in: `/Users/nicosstrnad/Projects/trailcamp/server/backups/`

## Security Note

⚠️ **Backups are NOT encrypted.** If deploying to production, consider:
- Encrypting backup files
- Storing backups in a secure location (cloud storage, external drive)
- Restricting file permissions: `chmod 600 backups/*.sql`

## Troubleshooting

**"Database not found" error:**
- Ensure you're running the script from `/Users/nicosstrnad/Projects/trailcamp/server/`
- Check that `trailcamp.db` exists in the same directory

**Backups not being deleted:**
- Check `RETENTION_DAYS` setting
- Verify file modification times: `ls -lt backups/`

**Cron job not running:**
- Check cron is enabled: `launchctl list | grep cron`
- Verify crontab syntax: `crontab -l`
- Check system logs: `log show --predicate 'process == "cron"' --last 1h`
