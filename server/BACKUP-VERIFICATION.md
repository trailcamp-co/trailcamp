# Backup Verification Guide

## Overview
The `verify-backup.sh` script tests that backup files can be successfully restored and validates database integrity.

## Quick Start

### Verify Latest Backup
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./verify-backup.sh
```

or explicitly:
```bash
./verify-backup.sh --latest
```

### Verify All Backups
```bash
./verify-backup.sh --all
```

### Verify Specific Backup
```bash
./verify-backup.sh backups/trailcamp-backup-2026-02-28_12-58-09.sql
```

## What It Tests

### 1. Restore Success
✅ Backup file can be imported into SQLite  
✅ No SQL errors during restore

### 2. Database Integrity
✅ `PRAGMA integrity_check` passes  
✅ Database structure is valid

### 3. Record Counts
✅ Locations table has records  
✅ Trips table exists and is queryable  
✅ Counts are logged for reference

### 4. Schema Validation
✅ Expected tables exist (minimum 3: locations, trips, trip_stops)  
✅ Schema structure is intact

### 5. Comparison with Original
✅ Compares record counts with current database  
⚠️ Warns if difference is > 100 records (likely newer data)  
ℹ️ Shows how many locations have been added since backup

### 6. Query Functionality
✅ Tests a sample SELECT query  
✅ Verifies data can be retrieved

## Example Output

```
═══════════════════════════════════════════════════════
    TrailCamp Backup Verification
    2026-02-28 21:10:44
═══════════════════════════════════════════════════════

Found 1 backup(s) in ./backups

Testing latest backup: trailcamp-backup-2026-02-28_12-58-09.sql

━━━ Testing: trailcamp-backup-2026-02-28_12-58-09.sql ━━━
  Restoring backup... ✓
  Checking integrity... ✓
  Counting records... ✓
    Locations: 5597
    Trips: 1
  Checking schema... ✓ 6 tables
  Comparing with original... ⚠ Large difference: 551 locations
  Testing sample query... ✓
    Sample: Ghost Town Road Dispersed
  ✓ BACKUP VALID
    File size: 3.7M
    Created: 2026-02-28 12:58

═══════════════════════════════════════════════════════
Verification Summary

Total tested:  1
Passed:        1
Failed:        0

✅ ALL BACKUPS VERIFIED
═══════════════════════════════════════════════════════
```

## Exit Codes

- `0` - All backups verified successfully
- `1` - One or more backups failed verification

## Use Cases

### After Creating Backup
Verify immediately:
```bash
./backup-database.sh
./verify-backup.sh --latest
```

### Scheduled Verification
Add to cron (daily at 4:00 AM, after backup):
```cron
0 4 * * * cd /path/to/trailcamp/server && ./backup-database.sh >> backups/backup.log 2>&1
5 4 * * * cd /path/to/trailcamp/server && ./verify-backup.sh --latest >> backups/verify.log 2>&1
```

### Before Deployment
Verify all backups before deploying changes:
```bash
./verify-backup.sh --all
```

### Restore Testing
Before attempting actual restore, verify backup is good:
```bash
./verify-backup.sh backups/trailcamp-backup-2026-02-20_03-00-00.sql
```

## What Gets Tested

The script creates a temporary test database (`test-restore.db`) and:

1. Imports the backup SQL file
2. Runs integrity checks
3. Counts records in key tables
4. Verifies schema structure
5. Tests sample queries
6. Compares with production database
7. Cleans up test database

**No production data is affected.**

## Interpreting Results

### ✓ BACKUP VALID
All tests passed. Backup can be restored if needed.

### ✗ Restore failed
Backup file is corrupted or has SQL errors.  
**Action:** Delete this backup and create a new one.

### ✗ Integrity check failed
Database structure is damaged.  
**Action:** Delete this backup, investigate source database issues.

### ⚠ Large difference: X locations
Current database has significantly more data than backup.  
**Normal:** If backup is old or database is actively growing.  
**Investigate:** If difference is unexpected.

### ✗ Could not count records
Tables don't exist or query failed.  
**Action:** Backup may be from wrong database or corrupted.

## Automation

### Post-Backup Hook
Add to backup script:
```bash
#!/bin/bash
# enhanced-backup.sh

./backup-database.sh

if [ $? -eq 0 ]; then
    echo "Verifying backup..."
    ./verify-backup.sh --latest
    
    if [ $? -eq 0 ]; then
        echo "✓ Backup created and verified"
    else
        echo "✗ Backup verification failed!"
        # Send alert
    fi
fi
```

### Monitoring Integration
```bash
# Check verification status for monitoring
if ! ./verify-backup.sh --latest > /dev/null 2>&1; then
    echo "CRITICAL: Backup verification failed"
    # Trigger alert (email, Slack, etc.)
    exit 1
fi
```

### Weekly Full Verification
```cron
# Every Sunday at 3 AM, verify all backups
0 3 * * 0 cd /path/to/trailcamp/server && ./verify-backup.sh --all >> backups/weekly-verify.log 2>&1
```

## Troubleshooting

### "No backups found"
**Solution:** Run `./backup-database.sh` to create first backup.

### "Restore failed"
**Causes:**
- Corrupted backup file
- Disk full
- SQLite version mismatch

**Solution:**
1. Check disk space: `df -h`
2. Try restoring manually: `sqlite3 test.db < backup.sql`
3. Create new backup: `./backup-database.sh`

### "Large difference" warning when expected
This is normal if:
- Backup is several hours/days old
- Database is actively growing
- Recent data imports occurred

**Action:** Note the difference for records. Create new backup if desired.

### Verification very slow
**Cause:** Large backup files (>100MB)

**Solution:**
- Verify only latest: `./verify-backup.sh --latest`
- Don't verify all backups frequently

## Best Practices

1. **Verify after every backup** - Ensure backup is usable
2. **Keep verification logs** - Track backup health over time
3. **Test restore procedure** - Periodically do a full restore test
4. **Monitor disk space** - Ensure room for test database
5. **Alert on failures** - Never ignore verification failures

## Real Restore Process

When you actually need to restore:

```bash
# 1. Stop the application
pm2 stop trailcamp

# 2. Backup current database (just in case)
cp trailcamp.db trailcamp.db.before-restore

# 3. Verify the backup you're restoring from
./verify-backup.sh backups/trailcamp-backup-2026-02-28_12-58-09.sql

# 4. If verification passes, restore
sqlite3 trailcamp.db < backups/trailcamp-backup-2026-02-28_12-58-09.sql

# 5. Verify restored database
./verify-backup.sh --latest

# 6. Restart application
pm2 start trailcamp
```

---

*Last updated: 2026-02-28*
*Script: verify-backup.sh*
