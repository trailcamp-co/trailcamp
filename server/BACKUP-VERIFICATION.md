# Backup Verification Guide

## Overview
The `verify-backup.sh` script automatically tests that database backups can be successfully restored and validates their integrity.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./verify-backup.sh
```

## What It Does

1. **Finds latest backup** in `./backups/` directory
2. **Restores to temporary database** (`/tmp/trailcamp-verify-*.db`)
3. **Runs integrity check** on restored database
4. **Compares row counts** with original database (locations, trips, trip_stops)
5. **Verifies schema** matches original
6. **Cleans up** temporary database
7. **Reports pass/fail** status

## Success Output

```
═══════════════════════════════════════════════════════
    TrailCamp Backup Verification
═══════════════════════════════════════════════════════

Testing backup: trailcamp-backup-2026-02-28_21-20-37.sql
Backup size:    14M

Restoring backup to test database...
✓ Backup restored successfully

Running integrity check...
✓ Integrity check passed

Comparing with original database...

✓ locations: 6148 rows (match)
✓ trips: 1 rows (match)
✓ trip_stops: 0 rows (match)

Verifying schema integrity...
✓ Schema matches

═══════════════════════════════════════════════════════
✅ BACKUP VERIFICATION PASSED
═══════════════════════════════════════════════════════

Backup: trailcamp-backup-2026-02-28_21-20-37.sql
Status: Valid and restorable
Date:   Sat Feb 28 21:20:45 EST 2026
```

## Failure Scenarios

### Row Count Mismatch
```
✗ locations: Original=6148, Restored=5597 (MISMATCH)
```

**Cause:** Backup is outdated or incomplete
**Solution:** Create fresh backup with `./backup-database.sh`

### Integrity Check Failed
```
✗ Integrity check failed: database disk image is malformed
```

**Cause:** Corrupted backup file
**Solution:** 
1. Delete corrupted backup
2. Create new backup: `./backup-database.sh`
3. Verify new backup: `./verify-backup.sh`

### Schema Mismatch
```
✗ Schema mismatch detected
```

**Cause:** Database schema changed since backup was created
**Solution:** Normal after migrations - create fresh backup

## Automated Verification

### After Each Backup
Add to backup script or run manually:
```bash
./backup-database.sh && ./verify-backup.sh
```

### Scheduled Verification (Cron)
Verify backups daily at 4:00 AM:
```cron
0 4 * * * cd /Users/nicosstrnad/Projects/trailcamp/server && ./verify-backup.sh >> ./backups/verify.log 2>&1
```

### CI/CD Integration
```bash
#!/bin/bash
# deploy.sh - verify backup before deployment

if ./verify-backup.sh; then
    echo "✓ Backup verified, proceeding with deployment"
    # ... deployment steps
else
    echo "✗ Backup verification failed, aborting deployment"
    exit 1
fi
```

## Exit Codes

- `0` - Backup verification passed
- `1` - Verification failed (missing backup, corruption, or mismatch)

## Technical Details

### Checks Performed

1. **File existence** - Backup file exists and is readable
2. **SQL restoration** - Backup can be imported to SQLite
3. **PRAGMA integrity_check** - Database structure is valid
4. **Row counts** - All tables have expected number of rows
5. **Schema comparison** - Table definitions match original

### Temporary Database

- Location: `/tmp/trailcamp-verify-[PID].db`
- Automatically cleaned up after verification
- Never writes to production database

### Performance

- Verification time: ~5-10 seconds for 6,000+ locations (14MB backup)
- No impact on production database (read-only)
- Safe to run during normal operation

## Troubleshooting

### "No backup files found"
```bash
# Check backups directory
ls -lh ./backups/

# Create first backup
./backup-database.sh
```

### "Backup restoration failed"
Possible causes:
- Corrupted backup file
- Disk full
- Permission issues

```bash
# Check disk space
df -h .

# Check file permissions
ls -l ./backups/

# Try manual restore
sqlite3 /tmp/test.db < ./backups/latest-backup.sql
```

### Row count mismatches after known changes
This is normal if:
- Backup was created before recent data additions
- Just ran import or bulk update
- Migrations added/removed data

**Solution:** Create fresh backup and verify again.

## Best Practices

1. **Verify after creation** - Always verify backups immediately after creating them
2. **Regular verification** - Schedule daily verification via cron
3. **Alert on failure** - Send notification if verification fails
4. **Keep multiple backups** - Verify that you have recent + historical backups
5. **Test restores manually** - Periodically do full manual restore to test database

## Manual Restore Test

To manually test a backup restore:
```bash
# Create test database
sqlite3 /tmp/test-restore.db < ./backups/trailcamp-backup-2026-02-28.sql

# Verify data
sqlite3 /tmp/test-restore.db "SELECT COUNT(*) FROM locations;"

# Check integrity
sqlite3 /tmp/test-restore.db "PRAGMA integrity_check;"

# Clean up
rm /tmp/test-restore.db
```

## Monitoring Integration

### Health Check Endpoint
```javascript
// server/src/index.ts
app.get('/api/backup/status', async (req, res) => {
  const { execSync } = require('child_process');
  try {
    execSync('./verify-backup.sh', { cwd: './server' });
    res.json({ status: 'ok', message: 'Latest backup is valid' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Backup verification failed' });
  }
});
```

### Alerting
```bash
#!/bin/bash
# verify-and-alert.sh

if ! ./verify-backup.sh; then
    # Send alert (email, Slack, etc.)
    echo "Backup verification failed" | mail -s "TrailCamp Backup Alert" admin@example.com
fi
```

---

*Last updated: 2026-02-28*
*Script: verify-backup.sh*
