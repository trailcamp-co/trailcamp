# Migration Rollback Guide

## Overview
Safe rollback system for database schema migrations in TrailCamp.

## How It Works

1. **Paired Migrations:** Each migration has an "up" and "down" file
   - `001_migration_name.sql` (up - applies changes)
   - `001_migration_name_down.sql` (down - reverses changes)

2. **Automatic Backup:** Creates backup before every rollback

3. **Integrity Check:** Verifies database health after rollback

## Quick Start

### Rollback a Migration
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./rollback-migration.sh 003
```

### List Available Migrations
```bash
ls -1 migrations/*.sql
```

## Creating Rollback Files

### Option 1: Write Down Migration Manually (Recommended)

When creating a new migration, always create both files:

**Up migration:** `004_add_new_field.sql`
```sql
-- Add user_rating field
ALTER TABLE locations ADD COLUMN user_rating INTEGER;
```

**Down migration:** `004_add_new_field_down.sql`
```sql
-- Remove user_rating field
ALTER TABLE locations DROP COLUMN user_rating;
```

### Option 2: Auto-Generate Template

If you forgot to create a down migration, the script will generate a template:

```bash
./rollback-migration.sh 004
# Creates 004_add_new_field_down.sql with TODO comments
# Edit the file, add rollback SQL, then run again
```

## Common Rollback Patterns

### Undo ALTER TABLE ADD COLUMN
```sql
-- Up migration
ALTER TABLE locations ADD COLUMN new_field TEXT;

-- Down migration
ALTER TABLE locations DROP COLUMN new_field;
```

### Undo CREATE INDEX
```sql
-- Up migration
CREATE INDEX idx_locations_state ON locations(state);

-- Down migration  
DROP INDEX idx_locations_state;
```

### Undo CREATE TABLE
```sql
-- Up migration
CREATE TABLE new_table (
  id INTEGER PRIMARY KEY,
  name TEXT
);

-- Down migration
DROP TABLE new_table;
```

### Undo CREATE TRIGGER
```sql
-- Up migration
CREATE TRIGGER update_timestamp 
AFTER UPDATE ON locations
BEGIN
  UPDATE locations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Down migration
DROP TRIGGER update_timestamp;
```

### Undo INSERT (Data Migration)
```sql
-- Up migration
INSERT INTO locations (name, latitude, longitude, category) 
VALUES ('Test Location', 40.0, -105.0, 'riding');

-- Down migration
DELETE FROM locations WHERE name = 'Test Location' AND category = 'riding';
```

### Undo UPDATE (Data Change)
```sql
-- Up migration
UPDATE locations SET category = 'campsite' WHERE id = 123;

-- Down migration (if you know the old value)
UPDATE locations SET category = 'riding' WHERE id = 123;
```

## Migration Naming Convention

```
migrations/
  001_initial_schema.sql
  001_initial_schema_down.sql (optional for initial)
  002_add_timestamp_triggers.sql
  002_add_timestamp_triggers_down.sql
  003_add_search_index.sql
  003_add_search_index_down.sql
```

## Safety Features

### 1. Automatic Backup
Before every rollback:
```
backups/pre-rollback-003-2026-02-28_21-45-30.sql
```

### 2. Confirmation Prompt
```
WARNING: This will rollback migration 003
This action modifies the database schema.

Continue with rollback? (yes/no):
```

### 3. Integrity Check
After rollback, runs `PRAGMA integrity_check` to verify database health.

### 4. Detailed Output
Shows exactly what's happening:
```
Creating backup before rollback...
✓ Backup created: pre-rollback-003-2026-02-28_21-45-30.sql (3.9M)

Executing rollback...

✓ Rollback completed successfully

✓ Database integrity check: OK

Rollback summary:
  Migration rolled back: 003
  Backup location: ./backups/pre-rollback-003-2026-02-28_21-45-30.sql
  Database status: OK
```

## When to Use Rollback

### Good Use Cases
✅ Testing new migrations in development  
✅ Fixing a bad migration immediately after applying  
✅ Reverting schema changes that caused issues  
✅ Rolling back to a known good state  

### Caution Required
⚠️ **Production databases** - Test rollback in staging first  
⚠️ **After data changes** - Rollback may lose data  
⚠️ **Multiple migrations** - Rollback in reverse order  

## Rollback Workflow

### 1. Identify Problem
```bash
# Something went wrong after migration 004
./check-data-quality.sh
# Shows errors
```

### 2. Rollback Migration
```bash
./rollback-migration.sh 004
# Confirm: yes
```

### 3. Verify Rollback
```bash
# Check database
sqlite3 trailcamp.db "PRAGMA integrity_check;"

# Run quality checks
./check-data-quality.sh

# Check schema
sqlite3 trailcamp.db ".schema"
```

### 4. Fix Migration
Edit `004_migration_name.sql` to fix the issue.

### 5. Re-apply Migration
```bash
sqlite3 trailcamp.db < migrations/004_migration_name.sql
```

## Multiple Migration Rollback

To rollback multiple migrations, **go in reverse order**:

```bash
# Applied: 003, 004, 005
# Need to rollback to 002

./rollback-migration.sh 005  # First
./rollback-migration.sh 004  # Second  
./rollback-migration.sh 003  # Third
```

## Complex Rollbacks

### Data Migrations
If migration inserted data, rollback must delete it:

```sql
-- Up: 005_seed_initial_data.sql
INSERT INTO locations (name, latitude, longitude, category)
SELECT * FROM temp_import;

-- Down: 005_seed_initial_data_down.sql
-- Option 1: Delete specific rows
DELETE FROM locations WHERE source = 'seed-2026-02-28';

-- Option 2: Restore from backup
-- (manual process, documented in migration)
```

### Non-Reversible Changes
Some changes cannot be safely reversed:

❌ **Dropping columns** - Data is lost  
❌ **Dropping tables** - All data lost  
❌ **Complex data transforms** - May not be reversible  

For these, document manual restoration steps:
```sql
-- 006_drop_old_field_down.sql
-- ⚠️ WARNING: Cannot automatically restore dropped data
-- 
-- Manual restoration process:
-- 1. Restore database from backup before this migration
-- 2. Export data from old_field column
-- 3. Re-apply migrations 001-005
-- 4. Re-import data into restored column
```

## Troubleshooting

### "Migration not found"
```bash
ls migrations/
# Check migration number and filename
```

### "No rollback file found"
```bash
# Auto-generates template
./rollback-migration.sh 003
# Edit 003_migration_name_down.sql
# Add rollback SQL
# Run again
```

### "Rollback failed"
```bash
# Check error message
# Restore from backup:
sqlite3 trailcamp.db < backups/pre-rollback-003-*.sql
```

### "Database integrity check FAILED"
```bash
# CRITICAL: Restore from backup immediately
cp backups/pre-rollback-003-*.sql trailcamp.db.backup
sqlite3 trailcamp.db < backups/pre-rollback-003-*.sql
```

## Best Practices

1. **Always create down migrations** when writing up migrations
2. **Test rollback** in development before applying to production
3. **Backup before migration** (script does this automatically)
4. **Document non-reversible changes** clearly in down migration
5. **Keep rollbacks simple** - one logical change per migration
6. **Version control migrations** - commit both up and down files

## Integration with Development Workflow

```bash
# 1. Create new migration
cat > migrations/006_add_feature.sql << 'EOF'
-- Add new feature
ALTER TABLE locations ADD COLUMN feature_enabled INTEGER DEFAULT 0;
EOF

# 2. Create rollback immediately
cat > migrations/006_add_feature_down.sql << 'EOF'
-- Rollback new feature
ALTER TABLE locations DROP COLUMN feature_enabled;
EOF

# 3. Test migration
sqlite3 trailcamp.db < migrations/006_add_feature.sql

# 4. Verify
./check-data-quality.sh

# 5. If problems, rollback
./rollback-migration.sh 006

# 6. Fix and re-apply
# (edit migration file)
sqlite3 trailcamp.db < migrations/006_add_feature.sql

# 7. Commit when working
git add migrations/006_*
git commit -m "Add feature_enabled field with rollback"
```

---

*Last updated: 2026-02-28*
*Script: rollback-migration.sh*
