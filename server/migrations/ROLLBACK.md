# Migration Rollback Guide

## Overview
This guide documents how to safely rollback database schema changes if issues occur after applying migrations.

## Migration History

| Migration | Applied | Rollback SQL | Notes |
|-----------|---------|--------------|-------|
| 001_add_integrity_constraints.sql | 2026-02-28 | See below | Validation triggers |
| 002_add_timestamp_triggers.sql | 2026-02-28 | See below | Auto-update timestamps |
| 003_add_search_index.sql | 2026-02-28 | See below | Full-text search (FTS5) |
| 004_add_location_fields.sql | 2026-02-28 | See below | State/county columns |

---

## Rollback Procedures

### 001_add_integrity_constraints.sql

**What it added:**
- 8 validation triggers (coordinates, scenery, cost, category)

**Rollback:**
```sql
-- Remove validation triggers
DROP TRIGGER IF EXISTS validate_coordinates_insert;
DROP TRIGGER IF EXISTS validate_coordinates_update;
DROP TRIGGER IF EXISTS validate_scenery_insert;
DROP TRIGGER IF EXISTS validate_scenery_update;
DROP TRIGGER IF EXISTS validate_cost_insert;
DROP TRIGGER IF EXISTS validate_cost_update;
DROP TRIGGER IF EXISTS validate_category_insert;
DROP TRIGGER IF EXISTS validate_category_update;
```

**Risk level:** LOW - Only removes validation (data remains intact)

---

### 002_add_timestamp_triggers.sql

**What it added:**
- Auto-update triggers for `updated_at` column on trips and locations

**Rollback:**
```sql
-- Remove timestamp triggers
DROP TRIGGER IF EXISTS update_trips_timestamp;
DROP TRIGGER IF EXISTS update_locations_timestamp;
```

**Risk level:** LOW - Timestamps won't auto-update, but can be done manually

---

### 003_add_search_index.sql

**What it added:**
- FTS5 virtual table `locations_fts`
- 3 sync triggers (insert, update, delete)

**Rollback:**
```sql
-- Remove FTS sync triggers
DROP TRIGGER IF EXISTS locations_fts_insert;
DROP TRIGGER IF EXISTS locations_fts_update;
DROP TRIGGER IF EXISTS locations_fts_delete;

-- Drop FTS virtual table
DROP TABLE IF EXISTS locations_fts;
```

**Risk level:** LOW - Only removes search functionality (original data intact)

---

### 004_add_location_fields.sql

**What it added:**
- `state TEXT` column
- `county TEXT` column  
- `country TEXT` column

**Rollback:**
```sql
-- Note: SQLite doesn't support DROP COLUMN directly
-- Options:
-- 1. Leave columns (they're just NULL, harmless)
-- 2. Recreate table without columns (complex, data loss risk)

-- OPTION 1 (Recommended): Do nothing
-- Columns remain but unused - no impact on performance

-- OPTION 2 (Advanced): Recreate table
-- WARNING: High risk, requires careful data migration
-- See: https://www.sqlite.org/lang_altertable.html
```

**Risk level:** MEDIUM - Cannot easily remove columns in SQLite

**Recommended approach:** Leave columns in place (no harm if unused)

---

## Migration Tracking Table

Create a table to track applied migrations:

```sql
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rollback_sql TEXT,
    notes TEXT
);

-- Record existing migrations
INSERT INTO schema_migrations (migration_name, applied_at, notes) VALUES
('001_add_integrity_constraints.sql', '2026-02-28 14:54:00', 'Validation triggers'),
('002_add_timestamp_triggers.sql', '2026-02-28 14:56:00', 'Auto-update timestamps'),
('003_add_search_index.sql', '2026-02-28 14:58:00', 'Full-text search (FTS5)'),
('004_add_location_fields.sql', '2026-02-28 15:14:00', 'State/county/country columns');
```

---

## Rollback Script

Create `rollback-migration.sh`:

```bash
#!/bin/bash
# Rollback a database migration

set -e

DB_PATH="./trailcamp.db"
MIGRATION_NAME=$1

if [ -z "$MIGRATION_NAME" ]; then
    echo "Usage: ./rollback-migration.sh <migration_name>"
    echo ""
    echo "Available migrations:"
    sqlite3 "$DB_PATH" "SELECT migration_name FROM schema_migrations ORDER BY applied_at;"
    exit 1
fi

echo "Rolling back migration: $MIGRATION_NAME"
echo ""
echo "⚠️  This will modify the database schema!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Backup first
echo "Creating backup..."
./backup-database.sh

case "$MIGRATION_NAME" in
    "001_add_integrity_constraints.sql")
        echo "Removing validation triggers..."
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS validate_coordinates_insert;
DROP TRIGGER IF EXISTS validate_coordinates_update;
DROP TRIGGER IF EXISTS validate_scenery_insert;
DROP TRIGGER IF EXISTS validate_scenery_update;
DROP TRIGGER IF EXISTS validate_cost_insert;
DROP TRIGGER IF EXISTS validate_cost_update;
DROP TRIGGER IF EXISTS validate_category_insert;
DROP TRIGGER IF EXISTS validate_category_update;
EOF
        ;;
        
    "002_add_timestamp_triggers.sql")
        echo "Removing timestamp triggers..."
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS update_trips_timestamp;
DROP TRIGGER IF EXISTS update_locations_timestamp;
EOF
        ;;
        
    "003_add_search_index.sql")
        echo "Removing FTS search index..."
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS locations_fts_insert;
DROP TRIGGER IF EXISTS locations_fts_update;
DROP TRIGGER IF EXISTS locations_fts_delete;
DROP TABLE IF EXISTS locations_fts;
EOF
        ;;
        
    "004_add_location_fields.sql")
        echo "Cannot rollback column additions in SQLite"
        echo "Columns will remain but can be ignored"
        exit 1
        ;;
        
    *)
        echo "Unknown migration: $MIGRATION_NAME"
        exit 1
        ;;
esac

# Mark as rolled back in tracking table
sqlite3 "$DB_PATH" "UPDATE schema_migrations SET notes = notes || ' [ROLLED BACK]' WHERE migration_name = '$MIGRATION_NAME';"

echo ""
echo "✓ Rollback complete!"
echo ""
echo "Verify database:"
echo "  ./check-data-quality.sh"
```

---

## Best Practices

### Before Applying Migrations
1. **Backup:** Always run `./backup-database.sh` first
2. **Test:** Apply to test database first if possible
3. **Review:** Read migration SQL carefully
4. **Document:** Update ROLLBACK.md with rollback steps

### If Migration Fails
1. **Don't panic:** Database likely rolled back automatically
2. **Check integrity:** Run `PRAGMA integrity_check`
3. **Restore backup:** Use most recent backup if needed
4. **Fix migration:** Correct SQL and try again

### Rollback Safety
1. **Recent migrations:** Easier to rollback (< 24 hours)
2. **Dependent data:** Check if data depends on schema change
3. **Triggers:** Usually safe to drop (can reapply)
4. **Columns:** Hard to remove in SQLite (leave in place)
5. **Indexes:** Safe to drop and recreate

### Testing Rollback
```bash
# Test rollback on backup database
cp trailcamp.db trailcamp-test.db

# Apply rollback to test DB
DB_PATH=trailcamp-test.db ./rollback-migration.sh 003_add_search_index.sql

# Verify test DB still works
./check-data-quality.sh
```

---

## Emergency Procedures

### Complete Database Restore
If schema is completely broken:

```bash
# 1. Find most recent backup
ls -lt backups/

# 2. Stop dev server
pkill -f "tsx watch"

# 3. Backup current (broken) DB
mv trailcamp.db trailcamp-broken-$(date +%Y%m%d-%H%M%S).db

# 4. Restore from backup
sqlite3 trailcamp.db < backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql

# 5. Verify
./check-data-quality.sh

# 6. Restart dev server
npm run dev
```

### Partial Rollback
If only specific data is affected:

```sql
-- Example: Remove all locations added after migration
DELETE FROM locations 
WHERE id > (SELECT MAX(id) FROM locations WHERE created_at < '2026-02-28 15:00:00');

-- Example: Reset column values
UPDATE locations SET state = NULL WHERE state IS NOT NULL;
```

---

## SQLite Limitations

### Cannot Drop Columns
SQLite does not support `ALTER TABLE DROP COLUMN`.

**Workaround:**
1. Leave column in place (recommended)
2. Set to NULL to clear data
3. Recreate entire table (risky)

### Cannot Modify Column Types
SQLite does not support `ALTER TABLE MODIFY COLUMN`.

**Workaround:**
1. Recreate table with new schema
2. Copy data
3. Drop old table
4. Rename new table

### Transaction Limitations
- DDL statements (CREATE, ALTER, DROP) are not always transactional
- Some schema changes cannot be rolled back automatically

---

## Migration Checklist

Before applying any migration:

- [ ] Created backup (`./backup-database.sh`)
- [ ] Reviewed migration SQL
- [ ] Documented rollback steps in ROLLBACK.md
- [ ] Tested on copy of database if high-risk
- [ ] Noted migration in schema_migrations table
- [ ] Committed migration files to git

After applying migration:

- [ ] Verified schema with `PRAGMA table_info(locations)`
- [ ] Ran data quality checks (`./check-data-quality.sh`)
- [ ] Tested affected features
- [ ] Documented any issues
- [ ] Created backup of migrated database

---

*Last updated: 2026-02-28*
*Migrations directory: server/migrations/*
