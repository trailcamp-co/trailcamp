# Orphaned Data Cleanup

## Overview
Finds and removes orphaned records that reference deleted parent records (e.g., trip_stops pointing to deleted trips or locations).

## Quick Start

### Check for Orphaned Data
```bash
node cleanup-orphaned-data.js
```

This runs in dry-run mode (reports only, no changes).

### Clean Up Orphaned Data
```bash
node cleanup-orphaned-data.js --cleanup
```

This deletes orphaned records.

### Verify Foreign Keys
```bash
node cleanup-orphaned-data.js --verify
```

Shows foreign key constraint configuration.

## What Gets Checked

### Trip Stops
- **Orphaned by trip:** trip_stops where trip_id references a deleted trip
- **Orphaned by location:** trip_stops where location_id references a deleted location

### Future Checks
Script can be extended to check:
- Orphaned relationships in other tables
- Dangling foreign key references
- Incomplete data relationships

## Example Output

### Dry Run (Default)
```
============================================================
ORPHANED DATA REPORT
============================================================

Generated: 2/28/2026, 8:30:54 PM
Mode: DRY RUN (no changes)

────────────────────────────────────────────────────────────
TRIP STOPS

Orphaned by deleted trip:     0
Orphaned by deleted location: 8
Total orphaned trip_stops:    8

⚠️  Orphaned records found!

Orphaned by location (location deleted):
  - Trip stop ID 1: location_id=null (location does not exist)
  - Trip stop ID 2: location_id=null (location does not exist)
  ...

============================================================

To clean up orphaned data, run:
  node cleanup-orphaned-data.js --cleanup
```

### Cleanup Mode
```
============================================================
ORPHANED DATA REPORT
============================================================

Generated: 2/28/2026, 8:31:12 PM
Mode: CLEANUP (deleting orphans)

────────────────────────────────────────────────────────────
TRIP STOPS

Orphaned by deleted trip:     0
Orphaned by deleted location: 0
Total orphaned trip_stops:    0

✅ No orphaned trip_stops found

============================================================

✓ Cleanup complete!
```

### No Orphans Found
```
============================================================
ORPHANED DATA REPORT
============================================================

...

✅ No orphaned trip_stops found

============================================================

✓ Database is clean - no orphaned data found
```

## Foreign Key Constraints

### Check Configuration
```bash
node cleanup-orphaned-data.js --verify
```

Example output:
```
Foreign key constraints on trip_stops:
  - trip_id → trips.id (ON DELETE CASCADE)
  - location_id → locations.id (ON DELETE CASCADE)

Foreign keys enabled: YES ✓
```

### Enabling Foreign Keys
If foreign keys are disabled:
```sql
-- Enable foreign keys (SQLite)
PRAGMA foreign_keys = ON;
```

For persistent enabling, configure in database connection:
```javascript
const db = new Database('./trailcamp.db');
db.pragma('foreign_keys = ON');
```

### Adding Foreign Key Constraints
If constraints don't exist, they should be added during schema creation:
```sql
CREATE TABLE trip_stops (
  id INTEGER PRIMARY KEY,
  trip_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  stop_order INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);
```

## Automation

### Scheduled Cleanup
Run weekly via cron:
```cron
# Weekly orphan cleanup (Sundays at 3am)
0 3 * * 0 cd /path/to/trailcamp/server && node cleanup-orphaned-data.js --cleanup >> logs/orphan-cleanup.log 2>&1
```

### Pre-Backup Check
Run before creating backups:
```bash
#!/bin/bash
# backup-with-cleanup.sh

echo "Checking for orphaned data..."
node cleanup-orphaned-data.js --cleanup

echo "Creating backup..."
./backup-database.sh
```

### Integration with Data Quality
Add to data quality checks:
```bash
#!/bin/bash
# comprehensive-check.sh

echo "1. Data quality..."
./check-data-quality.sh

echo "2. Orphaned data..."
node cleanup-orphaned-data.js --cleanup

echo "3. Duplicates..."
node find-duplicates.js
```

## JSON Output

For programmatic use:
```bash
node cleanup-orphaned-data.js --json > orphan-report.json
```

Output format:
```json
{
  "timestamp": "2026-02-28T20:30:54.123Z",
  "dryRun": true,
  "orphanedTripStops": {
    "byTrip": 0,
    "byLocation": 8,
    "total": 8
  },
  "details": {
    "tripStopsByTrip": [],
    "tripStopsByLocation": [
      { "id": 1, "trip_id": 1, "location_id": null, ... }
    ]
  }
}
```

## Prevention

### Best Practices
1. **Use foreign keys:** Enforce referential integrity at database level
2. **Enable CASCADE:** Use `ON DELETE CASCADE` for automatic cleanup
3. **Transaction safety:** Delete within transactions
4. **Regular checks:** Run cleanup script weekly

### Safe Deletion Pattern
When deleting trips or locations:
```javascript
// Good: Use transaction
db.transaction(() => {
  db.prepare('DELETE FROM trip_stops WHERE trip_id = ?').run(tripId);
  db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
})();

// Better: Let CASCADE handle it
db.pragma('foreign_keys = ON');
db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
// trip_stops automatically deleted via CASCADE
```

## Troubleshooting

### "No foreign key constraints found"
- Add foreign keys during schema creation
- Or create migration to add them to existing tables

### "Foreign keys enabled: NO"
```bash
# Check current setting
sqlite3 trailcamp.db "PRAGMA foreign_keys;"

# Enable
sqlite3 trailcamp.db "PRAGMA foreign_keys = ON;"
```

Note: Must be enabled per-connection (not persistent in file).

### Manual Cleanup
If you prefer SQL:
```sql
-- Find orphaned trip_stops
SELECT * FROM trip_stops ts
LEFT JOIN trips t ON ts.trip_id = t.id
WHERE t.id IS NULL;

-- Delete them
DELETE FROM trip_stops
WHERE id IN (
  SELECT ts.id FROM trip_stops ts
  LEFT JOIN trips t ON ts.trip_id = t.id
  WHERE t.id IS NULL
);
```

## Exit Codes

- `0` - Success (no orphans found or cleanup successful)
- `1` - Orphans found in dry-run mode (action needed)

Useful for scripting:
```bash
if ! node cleanup-orphaned-data.js; then
  echo "⚠️  Orphaned data found - running cleanup..."
  node cleanup-orphaned-data.js --cleanup
fi
```

---

*Last updated: 2026-02-28*
*Script: cleanup-orphaned-data.js*
