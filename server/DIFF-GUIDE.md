# Database Diff Tool Guide

## Overview
The `db-diff.js` tool creates snapshots of your database and compares them to track changes over time. Perfect for:
- Verifying data import results
- Auditing bulk updates
- Tracking database evolution
- Debugging unexpected changes

## Quick Start

### 1. Create "Before" Snapshot
```bash
node db-diff.js snapshot before.json
```

### 2. Make Changes
Perform your database operations (imports, updates, etc.)

### 3. Create "After" Snapshot
```bash
node db-diff.js snapshot after.json
```

### 4. Compare & Generate Report
```bash
node db-diff.js compare before.json after.json --report diff-report.md
```

## Usage Examples

### Track Data Import
```bash
# Before import
node db-diff.js snapshot before-import.json

# Import locations
node import-locations.js new-locations.csv

# After import
node db-diff.js snapshot after-import.json

# Generate report
node db-diff.js compare before-import.json after-import.json --report import-changes.md
```

### Verify Bulk Update
```bash
# Before update
node db-diff.js snapshot before-update.json

# Bulk update
node bulk-update.js --where "state = 'CA'" --set "best_season=Year-round"

# After update
node db-diff.js snapshot after-update.json

# Compare
node db-diff.js compare before-update.json after-update.json
```

### Track Daily Changes
```bash
# Daily snapshot (add to cron)
node db-diff.js snapshot daily-$(date +%Y-%m-%d).json

# Compare with yesterday
node db-diff.js compare daily-2026-02-27.json daily-2026-02-28.json
```

## Snapshot Format

Snapshots are JSON files containing:
- Timestamp
- Full database state
- MD5 hash of each row for quick comparison

Example:
```json
{
  "timestamp": "2026-02-28T22:20:40.114Z",
  "dbPath": "./trailcamp.db",
  "tables": {
    "locations": {
      "count": 6236,
      "rows": [
        {
          "id": 1,
          "name": "Example Trail",
          "latitude": 40.1234,
          ...
          "_hash": "a1b2c3d4..."
        }
      ]
    }
  }
}
```

## Diff Report Format

Reports show:
- Summary of changes per table
- Added locations (with IDs and names)
- Deleted locations
- Modified locations (with field-level changes)

Example report:
```markdown
# Database Diff Report

**Before:** 2026-02-28T10:00:00.000Z
**After:** 2026-02-28T15:00:00.000Z

## Summary

- **locations:** +15 / ~23 / -2
- **trips:** UNCHANGED

**Total Changes:** +15 added, ~23 modified, -2 deleted

## locations

### Added (15)
- **[6237]** New Trail Name
- **[6238]** Another Trail
...

### Modified (23)
**ID 123:**
  - `scenery_rating`: "7" → "9"
  - `best_season`: "Summer" → "Summer,Fall"

**ID 456:**
  - `cost_per_night`: "null" → "25"
...

### Deleted (2)
- **[999]** Duplicate Trail
- **[1000]** Old Trail
```

## Best Practices

### 1. Snapshot Before Major Changes
Always create a snapshot before:
- Bulk imports
- Bulk updates
- Schema changes
- Data migrations

### 2. Use Descriptive Names
```bash
# Good
node db-diff.js snapshot 2026-02-28-before-california-import.json

# Not as good
node db-diff.js snapshot snapshot1.json
```

### 3. Keep Recent Snapshots
- Daily snapshots for active development
- Weekly snapshots for production
- Keep before/after pairs for major changes

### 4. Store Snapshots Safely
```bash
# Create snapshots directory
mkdir -p snapshots

# Use full paths
node db-diff.js snapshot snapshots/before-import.json
```

### 5. Review Reports Before Committing
```bash
# Generate report
node db-diff.js compare before.json after.json --report CHANGES.md

# Review report
cat CHANGES.md

# If good, commit both database and report
git add trailcamp.db CHANGES.md
git commit -m "Import: Added 50 Colorado trails (see CHANGES.md)"
```

## Common Workflows

### Import Verification
```bash
#!/bin/bash
# Before import
node db-diff.js snapshot before-import.json

# Import
node import-locations.js new-data.csv

# After import
node db-diff.js snapshot after-import.json

# Compare
node db-diff.js compare before-import.json after-import.json --report import-report.md

# Show summary
echo "Changes:"
grep "Total Changes" import-report.md
```

### Rollback Detection
```bash
# If import went wrong, compare with known-good snapshot
node db-diff.js compare snapshots/last-good.json after-bad-import.json

# Review what changed
cat diff-report.md

# If needed, restore from backup
cp backups/trailcamp-backup-2026-02-28.sql trailcamp.db.backup
# ... restore process
```

### Change Auditing
```bash
# Weekly comparison
node db-diff.js compare snapshots/2026-02-21.json snapshots/2026-02-28.json --report weekly-changes.md

# Email report or store in docs
cp weekly-changes.md docs/changelog/week-$(date +%W).md
```

## Performance

- **Snapshot creation:** ~2 seconds for 6,000 locations
- **Comparison:** <1 second for 6,000 locations
- **Snapshot file size:** ~15-20MB for full database
- **Memory usage:** ~50MB

## Limitations

- Only tracks data changes, not schema changes
- Large databases (>100k rows) may be slow
- Snapshots can be large (compress if storing long-term)

## Tips

### Compress Old Snapshots
```bash
gzip snapshots/2026-01-*.json
```

### Quick Row Count
```bash
# Check how many rows in snapshot
cat snapshot.json | grep '"count":' | head -5
```

### Find Specific Changes
```bash
# Search diff report
grep "scenery_rating" diff-report.md
```

### Cleanup Old Snapshots
```bash
# Delete snapshots older than 30 days
find snapshots/ -name "*.json" -mtime +30 -delete
```

## Integration

### Git Pre-Commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

# If database changed, require a diff report
if git diff --cached --name-only | grep -q "trailcamp.db"; then
  if [ ! -f "CHANGES.md" ]; then
    echo "ERROR: Database changed but no CHANGES.md found"
    echo "Run: node db-diff.js compare before.json after.json --report CHANGES.md"
    exit 1
  fi
fi
```

### Automated Daily Snapshots
```bash
# Cron: daily at 2am
0 2 * * * cd /path/to/trailcamp/server && node db-diff.js snapshot snapshots/daily-$(date +\%Y-\%m-\%d).json
```

---

*Last updated: 2026-02-28*
*Script: db-diff.js*
