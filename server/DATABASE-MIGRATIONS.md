# Database Migration Guide

## Overview

This guide covers safe database schema changes for TrailCamp's SQLite database. Follow these procedures to avoid data loss and minimize downtime.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Process](#migration-process)
3. [Common Migration Patterns](#common-migration-patterns)
4. [Rollback Procedures](#rollback-procedures)
5. [Testing Migrations](#testing-migrations)

---

## Pre-Migration Checklist

Before making any schema changes:

### 1. Backup the Database

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server

# Run backup script
./backup-database.sh

# Or manual backup
cp trailcamp.db trailcamp.db.backup-$(date +%Y%m%d-%H%M%S)
```

### 2. Test on a Copy

```bash
# Create test copy
cp trailcamp.db trailcamp-test.db

# Run migration on test database
sqlite3 trailcamp-test.db < migration.sql

# Verify with data quality checks
sqlite3 trailcamp-test.db "PRAGMA integrity_check;"
./check-data-quality.sh  # (after updating DB path)
```

### 3. Document the Change

Create a migration file:

```bash
# migrations/2026-02-28-add-elevation-field.sql
-- Migration: Add elevation field to locations
-- Author: Your Name
-- Date: 2026-02-28
-- Reason: Store elevation data for trail planning

BEGIN TRANSACTION;

-- Migration SQL here

COMMIT;
```

### 4. Plan Rollback

Always have a rollback script ready:

```bash
# migrations/2026-02-28-add-elevation-field-rollback.sql
BEGIN TRANSACTION;

-- Rollback SQL here

COMMIT;
```

---

## Migration Process

### Step-by-Step Procedure

#### 1. Stop the Application

```bash
# Stop dev server
pkill -f "tsx watch"
pkill -f vite

# Or in production
pm2 stop trailcamp-server
pm2 stop trailcamp-client
```

#### 2. Create Backup

```bash
./backup-database.sh

# Verify backup was created
ls -lh backups/trailcamp-backup-*.sql
```

#### 3. Run Migration

```bash
# Apply migration
sqlite3 trailcamp.db < migrations/2026-02-28-add-elevation-field.sql

# Check for errors
echo $?  # Should be 0 if successful
```

#### 4. Verify Migration

```bash
# Check schema
sqlite3 trailcamp.db ".schema locations"

# Run data quality checks
./check-data-quality.sh

# Test critical queries
sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations;"
```

#### 5. Restart Application

```bash
# Dev environment
npm run dev

# Or production
pm2 start trailcamp-server
pm2 start trailcamp-client
```

#### 6. Test Functionality

- Load application in browser
- Test affected features
- Check API endpoints
- Verify data display

---

## Common Migration Patterns

### Adding a Column

```sql
-- migrations/add-column.sql
BEGIN TRANSACTION;

-- Add new column with default value
ALTER TABLE locations 
ADD COLUMN elevation_ft INTEGER;

-- Optional: Populate with data
UPDATE locations 
SET elevation_ft = 5000 
WHERE name LIKE '%Mountain%';

COMMIT;
```

**Rollback:**
SQLite doesn't support DROP COLUMN directly. Options:
1. Set column to NULL (soft rollback)
2. Recreate table without the column (hard rollback)

```sql
-- migrations/add-column-rollback.sql
BEGIN TRANSACTION;

-- Soft rollback: nullify the column
UPDATE locations SET elevation_ft = NULL;

COMMIT;
```

### Renaming a Column

```sql
-- migrations/rename-column.sql
BEGIN TRANSACTION;

-- SQLite: Create new table with new column name
CREATE TABLE locations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  new_column_name TEXT,  -- Renamed column
  -- ... all other columns
);

-- Copy data
INSERT INTO locations_new 
SELECT id, name, old_column_name, ... 
FROM locations;

-- Drop old table
DROP TABLE locations;

-- Rename new table
ALTER TABLE locations_new RENAME TO locations;

COMMIT;
```

### Adding an Index

```sql
-- migrations/add-index.sql
BEGIN TRANSACTION;

-- Create index
CREATE INDEX idx_locations_elevation 
ON locations(elevation_ft);

-- Verify
SELECT name FROM sqlite_master 
WHERE type='index' AND tbl_name='locations';

COMMIT;
```

**Rollback:**

```sql
-- migrations/add-index-rollback.sql
BEGIN TRANSACTION;

DROP INDEX IF EXISTS idx_locations_elevation;

COMMIT;
```

### Adding a Foreign Key Constraint

⚠️ **Note:** SQLite foreign key constraints must be created when the table is created.

To add FK to existing table:

```sql
-- migrations/add-foreign-key.sql
BEGIN TRANSACTION;

PRAGMA foreign_keys=OFF;

-- Create new table with FK
CREATE TABLE trip_stops_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  location_id INTEGER NOT NULL,
  stop_order INTEGER NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- Copy data
INSERT INTO trip_stops_new 
SELECT * FROM trip_stops;

-- Drop old, rename new
DROP TABLE trip_stops;
ALTER TABLE trip_stops_new RENAME TO trip_stops;

PRAGMA foreign_keys=ON;

COMMIT;
```

### Changing Column Type

```sql
-- migrations/change-column-type.sql
BEGIN TRANSACTION;

-- Create new table with correct type
CREATE TABLE locations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cost_per_night REAL,  -- Changed from INTEGER
  -- ... all other columns
);

-- Copy data (with type conversion if needed)
INSERT INTO locations_new 
SELECT id, name, CAST(cost_per_night AS REAL), ... 
FROM locations;

-- Swap tables
DROP TABLE locations;
ALTER TABLE locations_new RENAME TO locations;

COMMIT;
```

### Adding NOT NULL Constraint

```sql
-- migrations/add-not-null.sql
BEGIN TRANSACTION;

-- First, populate NULL values
UPDATE locations 
SET best_season = 'Year-round' 
WHERE best_season IS NULL;

-- Then recreate table with NOT NULL
CREATE TABLE locations_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  best_season TEXT NOT NULL,  -- Added NOT NULL
  -- ... all other columns
);

INSERT INTO locations_new SELECT * FROM locations;
DROP TABLE locations;
ALTER TABLE locations_new RENAME TO locations;

COMMIT;
```

---

## Rollback Procedures

### Simple Rollback (Column Addition)

```bash
# Run rollback script
sqlite3 trailcamp.db < migrations/add-column-rollback.sql
```

### Full Database Restore

If migration fails catastrophically:

```bash
# Stop application
pm2 stop all

# Restore from backup
cp trailcamp.db trailcamp.db.failed-migration
sqlite3 trailcamp.db < backups/trailcamp-backup-2026-02-28_13-00-00.sql

# Or if using .db backup
cp trailcamp.db.backup-20260228-130000 trailcamp.db

# Restart application
pm2 start all

# Verify restoration
./check-data-quality.sh
```

### Partial Rollback

If only specific data needs reverting:

```sql
-- Restore specific records from backup
BEGIN TRANSACTION;

-- Example: Restore locations that were modified
DELETE FROM locations WHERE id IN (123, 456, 789);

INSERT INTO locations 
SELECT * FROM backup_locations 
WHERE id IN (123, 456, 789);

COMMIT;
```

---

## Testing Migrations

### 1. Test on Development Copy

```bash
# Create isolated test environment
mkdir migration-test
cd migration-test

# Copy database
cp ../trailcamp.db test.db

# Apply migration
sqlite3 test.db < ../migrations/new-migration.sql

# Run tests
sqlite3 test.db "SELECT COUNT(*) FROM locations;"
```

### 2. Verify Data Integrity

```bash
# Run data quality checks
./check-data-quality.sh

# Check specific constraints
sqlite3 trailcamp.db "
  SELECT COUNT(*) FROM locations 
  WHERE latitude IS NULL OR longitude IS NULL;
"

# Verify foreign keys
sqlite3 trailcamp.db "PRAGMA foreign_key_check;"
```

### 3. Performance Testing

```bash
# Test query performance before/after
sqlite3 trailcamp.db "
  EXPLAIN QUERY PLAN 
  SELECT * FROM locations WHERE elevation_ft > 10000;
"

# Run performance tests
./test-performance.sh
```

### 4. Application Testing

- Start dev server with migrated database
- Test all CRUD operations
- Verify API responses
- Check frontend rendering
- Test edge cases

---

## Migration File Organization

```
server/migrations/
├── README.md
├── 2026-01-15-initial-schema.sql
├── 2026-02-01-add-featured-flag.sql
├── 2026-02-01-add-featured-flag-rollback.sql
├── 2026-02-15-add-indexes.sql
├── 2026-02-15-add-indexes-rollback.sql
└── 2026-02-28-add-elevation-field.sql
```

### Migration File Template

```sql
-- Migration: [Short description]
-- Author: [Your name]
-- Date: [YYYY-MM-DD]
-- Ticket: [Issue/PR number if applicable]
-- 
-- Description:
-- [Detailed description of what this migration does and why]
--
-- Dependencies:
-- [Any required prior migrations or setup]
--
-- Rollback:
-- See: [filename]-rollback.sql

BEGIN TRANSACTION;

-- Pre-migration validation
SELECT 'Running pre-migration checks...' AS status;

-- Migration SQL
[Your migration SQL here]

-- Post-migration validation
SELECT 'Verifying migration...' AS status;
SELECT COUNT(*) AS total_locations FROM locations;

COMMIT;

-- End of migration
SELECT 'Migration complete!' AS status;
```

---

## Best Practices

### DO:
- ✅ Always backup before migrations
- ✅ Test migrations on a copy first
- ✅ Use transactions (BEGIN/COMMIT)
- ✅ Write rollback scripts
- ✅ Document migrations clearly
- ✅ Test extensively before production
- ✅ Schedule migrations during low-traffic periods
- ✅ Monitor application after migration

### DON'T:
- ❌ Skip backups
- ❌ Run migrations directly in production without testing
- ❌ Forget rollback plans
- ❌ Make multiple unrelated changes in one migration
- ❌ Delete old migration files
- ❌ Ignore warning messages

---

## Emergency Procedures

### If Migration Fails Mid-Transaction

SQLite automatically rolls back failed transactions. Verify with:

```bash
# Check if transaction was rolled back
sqlite3 trailcamp.db "SELECT * FROM sqlite_master LIMIT 1;"

# If database is corrupted
sqlite3 trailcamp.db "PRAGMA integrity_check;"
```

### If Database is Corrupted

```bash
# Restore from most recent backup
cp backups/trailcamp-backup-[latest].sql restored.sql
sqlite3 trailcamp.db < restored.sql

# Or from .db backup
cp trailcamp.db.backup-[latest] trailcamp.db
```

### If Application Won't Start

```bash
# Check schema matches expected
sqlite3 trailcamp.db ".schema"

# Verify all required tables exist
sqlite3 trailcamp.db ".tables"

# Check for syntax errors in schema
sqlite3 trailcamp.db "PRAGMA integrity_check;"
```

---

## Production Migration Checklist

- [ ] Backup created and verified
- [ ] Migration tested on dev copy
- [ ] Rollback script prepared
- [ ] Data quality checks pass
- [ ] Performance impact assessed
- [ ] Downtime window scheduled
- [ ] Team notified
- [ ] Application stopped
- [ ] Migration applied
- [ ] Post-migration verification passed
- [ ] Application restarted
- [ ] Functionality tested
- [ ] Monitoring for errors
- [ ] Migration documented

---

## Resources

- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [SQLite Foreign Keys](https://www.sqlite.org/foreignkeys.html)
- [SQLite PRAGMA Statements](https://www.sqlite.org/pragma.html)

---

*Last updated: 2026-02-28*
