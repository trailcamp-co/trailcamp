# Backup Verification Guide

## Overview
The `verify-backups.sh` script tests backup integrity by restoring each backup to a temporary database and verifying the data.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./verify-backups.sh
```

## What It Tests

### 1. Restore Success
- Attempts to restore each `.sql` backup file
- Detects SQL errors during restore process
- Fails if restore produces errors

### 2. Database Integrity
- Runs `PRAGMA integrity_check` on restored database
- Verifies internal database structure is valid
- Fails if integrity check returns anything other than "ok"

### 3. Record Counts
- Counts locations, trips, and trip_stops in restored database
- Compares with current production database
- Warns if difference exceeds 50 locations (significant divergence)

### 4. Cleanup
- Creates temporary test database for each backup
- Automatically removes test database after verification
- No impact on production database

## Output Example

```
═══════════════════════════════════════════════════════
    TrailCamp Backup Verification
═══════════════════════════════════════════════════════

Found 7 backup(s) to verify

Current database:
  Locations:   6148
  Trips:       1
  Trip stops:  0

━━━ Verifying Backups ━━━

Testing: trailcamp-backup-2026-02-28_12-58-09.sql (3.7M)
  ✓ PASSED - Integrity: ok, Records: 5597 locations, 1 trips

Testing: trailcamp-backup-2026-02-27_03-00-15.sql (3.5M)
  ✓ PASSED - Integrity: ok, Records: 5234 locations, 0 trips

...

═══════════════════════════════════════════════════════
Summary

Total backups:    7
Verified:         7
═══════════════════════════════════════════════════════

✅ All backups verified successfully!
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All backups verified successfully |
| 1 | One or more backups failed OR no backups found |

## Common Scenarios

### ✅ All Backups Valid
```
Total backups:    7
Verified:         7

✅ All backups verified successfully!
```

**Action:** None needed. Backups are healthy.

### ❌ Corrupted Backup
```
Testing: trailcamp-backup-2026-02-25_03-00-00.sql (3.2M)
  ✗ FAILED - Restore errors detected

Total backups:    7
Verified:         6
Failed:           1

❌ 1 backup(s) failed verification
Action: Review failed backups and re-run backup script
```

**Action:**
1. Delete corrupted backup
2. Run `./backup-database.sh` to create fresh backup

### ⚠️ Significant Divergence
```
Testing: trailcamp-backup-2026-02-20_03-00-00.sql (2.8M)
  ✓ PASSED - Integrity: ok, Records: 4500 locations, 0 trips
    ⚠ Significant difference from current DB (diff: 1648)
```

**Meaning:** Backup is valid but from much earlier (1,648 fewer locations).

**Action:** Normal for old backups. Ensure recent backups don't show this.

### 📦 No Backups Found
```
✗ No backups found in ./backups

(Script exits)
```

**Action:** Run `./backup-database.sh` to create first backup.

## Automated Verification

### Cron Job (Weekly)
Verify backups every Sunday at 4am:
```cron
0 4 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./verify-backups.sh >> ./backups/verify.log 2>&1
```

### Post-Backup Hook
Verify immediately after creating backup:
```bash
#!/bin/bash
# In backup-database.sh, add at the end:
./verify-backups.sh > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️  Backup verification failed - check ./backups/verify.log"
fi
```

### CI/CD Integration
Add to deployment pipeline:
```yaml
# .github/workflows/backup-check.yml
- name: Verify Backups
  run: |
    cd server
    ./verify-backups.sh
```

## Troubleshooting

### "Restore errors detected"
**Cause:** Backup file is corrupted or incomplete

**Solution:**
1. Check backup file size (should be ~3-4MB for current DB)
2. Try opening manually: `sqlite3 test.db < backup.sql`
3. If corrupted, delete and create new backup

### "Integrity check failed"
**Cause:** Database structure is damaged

**Solution:**
1. Backup is likely useless - delete it
2. Investigate when/how it was created
3. Fix backup process if needed

### "Significant difference"
**Cause:** Backup is from much earlier OR current DB has issues

**Solution:**
1. Check backup timestamp - old backups are expected to differ
2. If recent backup differs significantly, investigate data changes
3. Ensure backup is being run regularly

### "No backups found"
**Cause:** Backup directory empty OR wrong path

**Solution:**
1. Check `BACKUP_DIR` variable in script (default: `./backups`)
2. Run `./backup-database.sh` to create backups
3. Verify backups exist: `ls -lh ./backups/`

## Best Practices

### 1. Regular Verification
Run verification weekly or monthly:
- Catches corruption early
- Ensures restore process works
- Validates backup automation

### 2. Before Critical Operations
Verify backups before:
- Schema migrations
- Bulk data changes
- Production deployments

### 3. Test Restores
Occasionally test full restore process:
```bash
# Backup current database
cp trailcamp.db trailcamp.db.backup

# Restore from backup
sqlite3 trailcamp.db < backups/trailcamp-backup-latest.sql

# Verify application still works
npm run dev

# Restore original if needed
mv trailcamp.db.backup trailcamp.db
```

### 4. Monitor Backup Age
Alert if newest backup is too old:
```bash
NEWEST=$(ls -t backups/trailcamp-backup-*.sql | head -1)
AGE_HOURS=$(( ($(date +%s) - $(stat -f %m "$NEWEST")) / 3600 ))

if [ $AGE_HOURS -gt 48 ]; then
    echo "⚠️  Newest backup is $AGE_HOURS hours old"
fi
```

## Performance

- **Speed:** ~2 seconds per backup (restore + verify)
- **Disk:** Creates temporary database (~4MB per test)
- **Impact:** Read-only, no effect on production database

## Security

### Backup Encryption
Consider encrypting backups:
```bash
# Encrypt
gpg --symmetric --cipher-algo AES256 backup.sql

# Decrypt for verification
gpg --decrypt backup.sql.gpg | sqlite3 test.db
```

### Backup Storage
Store verified backups off-site:
- Cloud storage (S3, Google Drive, Dropbox)
- External drive
- Remote server

---

*Last updated: 2026-02-28*
*Script: verify-backups.sh*
*Backup directory: ./backups*
