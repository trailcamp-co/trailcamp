# Migration Guide

## Overview
TrailCamp uses SQL migration files for database schema changes. Each migration can be safely rolled back using the rollback system.

## Migration Files

### Structure
```
server/migrations/
├── 001_add_integrity_constraints.sql
├── 001_add_integrity_constraints_rollback.sql
├── 002_add_timestamp_triggers.sql
├── 002_add_timestamp_triggers_rollback.sql
├── 003_add_search_index.sql
├── 003_add_search_index_rollback.sql
└── ...
```

### Naming Convention
- **Forward migration:** `NNN_description.sql`
- **Rollback migration:** `NNN_description_rollback.sql`

Where `NNN` is a 3-digit number (001, 002, 003, etc.)

## Creating Migrations

### 1. Create Forward Migration
```sql
-- migrations/004_add_new_field.sql
ALTER TABLE locations ADD COLUMN new_field TEXT;
CREATE INDEX idx_locations_new_field ON locations(new_field);
```

### 2. Create Rollback Migration
```sql
-- migrations/004_add_new_field_rollback.sql
DROP INDEX IF EXISTS idx_locations_new_field;
ALTER TABLE locations DROP COLUMN new_field;
```

**Note:** SQLite has limitations on `DROP COLUMN` (only available in SQLite 3.35.0+). For older versions, you may need to:
1. Create new table without the column
2. Copy data
3. Drop old table
4. Rename new table

### 3. Test Both Directions
```bash
# Apply migration
sqlite3 trailcamp.db < migrations/004_add_new_field.sql

# Test rollback
./rollback-migration.sh 004

# Re-apply if needed
sqlite3 trailcamp.db < migrations/004_add_new_field.sql
```

## Applying Migrations

### Manual Application
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
sqlite3 trailcamp.db < migrations/001_add_integrity_constraints.sql
```

### Batch Application
```bash
# Apply all migrations in order
for migration in migrations/[0-9][0-9][0-9]_*.sql; do
  # Skip rollback files
  if [[ ! $migration =~ _rollback\.sql$ ]]; then
    echo "Applying $migration..."
    sqlite3 trailcamp.db < "$migration"
  fi
done
```

## Rolling Back Migrations

### Using Rollback Script (Recommended)
```bash
./rollback-migration.sh 003
```

**Features:**
- Shows rollback SQL before executing
- Requires confirmation
- Creates backup automatically
- Verifies database integrity after rollback

### Manual Rollback
```bash
# Create backup first!
./backup-database.sh

# Apply rollback
sqlite3 trailcamp.db < migrations/003_add_search_index_rollback.sql

# Verify integrity
sqlite3 trailcamp.db "PRAGMA integrity_check"
```

## Rollback Script Usage

### List Available Migrations
```bash
./rollback-migration.sh
```

Shows all migrations with numbers.

### Roll Back Specific Migration
```bash
./rollback-migration.sh 003
```

Rolls back migration #003 and creates a backup.

### Example Session
```
$ ./rollback-migration.sh 003

═══════════════════════════════════════════════════════
    TrailCamp Migration Rollback
═══════════════════════════════════════════════════════

Available migrations:

  1. 003_add_search_index.sql
  2. 002_add_timestamp_triggers.sql
  3. 001_add_integrity_constraints.sql

Rolling back migration: 003_add_search_index.sql

Rollback SQL:
─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS locations_fts_insert;
DROP TRIGGER IF EXISTS locations_fts_update;
DROP TRIGGER IF EXISTS locations_fts_delete;
DROP TABLE IF EXISTS locations_fts;
─────────────────────────────────────────────────────

Do you want to proceed with rollback? (yes/no): yes

Creating backup before rollback...
✓ Backup created: ./backups/pre-rollback-003-2026-02-28_21-30-00.sql (3.8M)

Executing rollback...

✓ Rollback successful

Verifying database integrity...
✓ Database integrity: OK

═══════════════════════════════════════════════════════
Rollback Complete
═══════════════════════════════════════════════════════

Migration 003 rolled back successfully
Backup saved: ./backups/pre-rollback-003-2026-02-28_21-30-00.sql
```

## Migration Best Practices

### 1. Always Create Rollback
Every forward migration must have a rollback migration.

**Why?** Enables safe experimentation and quick recovery from issues.

### 2. Test Rollback Before Production
```bash
# Test on copy of database
cp trailcamp.db trailcamp-test.db
sqlite3 trailcamp-test.db < migrations/004_new_feature.sql
# Verify it works
./rollback-migration.sh 004  # (on test DB)
# Verify rollback works
```

### 3. Backup Before Major Changes
```bash
./backup-database.sh
```

Always backup before:
- Dropping tables or columns
- Complex data transformations
- Production deployments

### 4. Keep Migrations Small
Each migration should be focused:
✅ Good: Add one table, or one index, or one trigger
❌ Bad: Add 5 tables + 10 indexes + change existing data

**Benefit:** Easier to roll back specific changes.

### 5. Never Edit Applied Migrations
Once a migration is applied to production:
- Never modify the SQL file
- Create a new migration to make changes
- Keep migration history immutable

### 6. Document Complex Migrations
Add comments explaining:
- Why the change is needed
- What data is affected
- Special considerations

```sql
-- Migration 005: Add featured locations table
-- Purpose: Track manually curated "bucket list" locations
-- Affects: No existing data (new table)
-- Note: Populated via separate data import
CREATE TABLE featured_locations (...);
```

## Troubleshooting

### Rollback File Not Found
```
✗ Rollback file not found: 003_add_search_index_rollback.sql
```

**Solution:** Create the rollback file:
```sql
-- Write SQL to undo the forward migration
-- Save as migrations/003_add_search_index_rollback.sql
```

### Database Integrity Failed After Rollback
```
✗ Database integrity check failed
```

**Solution:**
1. Restore from the automatic backup created before rollback
2. Investigate why rollback failed (check rollback SQL)
3. Fix rollback SQL and try again on test database

### SQLite Version Limitations
Some operations require newer SQLite versions:
- `DROP COLUMN` requires SQLite 3.35.0+
- `RENAME COLUMN` requires SQLite 3.25.0+

**Workaround for DROP COLUMN on older SQLite:**
```sql
-- Create new table without the column
CREATE TABLE locations_new AS 
SELECT id, name, latitude, longitude /* omit dropped column */
FROM locations;

-- Drop old table
DROP TABLE locations;

-- Rename new table
ALTER TABLE locations_new RENAME TO locations;

-- Recreate indexes
CREATE INDEX idx_locations_category ON locations(category);
```

## Migration Checklist

Before applying a migration:
- [ ] Forward migration tested on dev database
- [ ] Rollback migration created
- [ ] Rollback tested on dev database
- [ ] Backup created (`./backup-database.sh`)
- [ ] Database integrity verified after forward migration
- [ ] Database integrity verified after rollback

## Advanced: Migration Tracking

To track which migrations have been applied:

### Create Migrations Table
```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY,
  migration TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Track Application
```sql
INSERT INTO migrations (migration) VALUES ('003_add_search_index');
```

### Check Applied Migrations
```sql
SELECT * FROM migrations ORDER BY id;
```

---

*Last updated: 2026-02-28*
*Rollback script: rollback-migration.sh*
