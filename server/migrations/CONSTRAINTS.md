# Database Integrity Constraints

## Overview

This document describes all integrity constraints enforced on the TrailCamp database to maintain data quality and consistency.

## Constraint Types

### 1. Foreign Key Constraints

| Table | Column | References | ON DELETE |
|-------|--------|-----------|-----------|
| trip_stops | trip_id | trips(id) | CASCADE |
| trip_stops | location_id | locations(id) | — |
| trip_journal | trip_id | trips(id) | CASCADE |
| trip_journal | stop_id | trip_stops(id) | CASCADE |

**Behavior:**
- When a trip is deleted, all associated trip_stops and trip_journal entries are automatically deleted (CASCADE)
- When a location is deleted, trip_stops with that location_id will have a dangling reference (manually handle or set to NULL)

### 2. NOT NULL Constraints

#### trips table
- `id` - Primary key (auto-increment)
- `name` - Trip name required

#### trip_stops table
- `id` - Primary key
- `trip_id` - Must belong to a trip
- `sort_order` - Required for ordering stops

#### locations table
- `id` - Primary key
- `name` - Location name required
- `latitude` - Coordinate required
- `longitude` - Coordinate required
- `category` - Category required

### 3. CHECK Constraints (Enforced via Triggers)

The following constraints are enforced using database triggers since SQLite doesn't support CHECK constraints on existing tables without recreation.

#### Coordinate Validation
- **latitude:** Must be between -90 and 90 degrees
- **longitude:** Must be between -180 and 180 degrees
- **Triggers:** `validate_coordinates_insert`, `validate_coordinates_update`

#### Scenery Rating Validation
- **scenery_rating:** If not NULL, must be between 1 and 10
- **Triggers:** `validate_scenery_insert`, `validate_scenery_update`

#### Cost Validation
- **cost_per_night:** If not NULL, must be >= 0
- **Triggers:** `validate_cost_insert`, `validate_cost_update`

#### Category Validation
- **category:** Must be one of: `riding`, `campsite`, `dump`, `water`, `scenic`
- **Triggers:** `validate_category_insert`, `validate_category_update`

## Constraint Enforcement

### Active Triggers

```sql
-- View all triggers
SELECT name, tbl_name FROM sqlite_master WHERE type='trigger';
```

Current triggers:
1. `validate_coordinates_insert` - Validates lat/lon on INSERT
2. `validate_coordinates_update` - Validates lat/lon on UPDATE
3. `validate_scenery_insert` - Validates scenery_rating on INSERT
4. `validate_scenery_update` - Validates scenery_rating on UPDATE
5. `validate_cost_insert` - Validates cost_per_night on INSERT
6. `validate_cost_update` - Validates cost_per_night on UPDATE
7. `validate_category_insert` - Validates category on INSERT
8. `validate_category_update` - Validates category on UPDATE

### Testing Constraints

#### Test Invalid Coordinates
```sql
-- Should fail: latitude out of range
INSERT INTO locations (name, latitude, longitude, category) 
VALUES ('Test', 100.0, -105.0, 'riding');
-- Error: Invalid coordinates: latitude must be -90 to 90

-- Should fail: longitude out of range
INSERT INTO locations (name, latitude, longitude, category) 
VALUES ('Test', 40.0, -200.0, 'riding');
-- Error: Invalid coordinates: longitude must be -180 to 180
```

#### Test Invalid Scenery Rating
```sql
-- Should fail: scenery_rating too high
INSERT INTO locations (name, latitude, longitude, category, scenery_rating) 
VALUES ('Test', 40.0, -105.0, 'riding', 11);
-- Error: Invalid scenery_rating: must be between 1 and 10

-- Should pass: NULL scenery_rating is allowed
INSERT INTO locations (name, latitude, longitude, category, scenery_rating) 
VALUES ('Test', 40.0, -105.0, 'riding', NULL);
```

#### Test Invalid Cost
```sql
-- Should fail: negative cost
INSERT INTO locations (name, latitude, longitude, category, cost_per_night) 
VALUES ('Test', 40.0, -105.0, 'campsite', -10.0);
-- Error: Invalid cost_per_night: must be >= 0
```

#### Test Invalid Category
```sql
-- Should fail: invalid category
INSERT INTO locations (name, latitude, longitude, category) 
VALUES ('Test', 40.0, -105.0, 'invalid_category');
-- Error: Invalid category: must be riding, campsite, dump, water, or scenic
```

## Validation Queries

Run these queries to verify data integrity:

```sql
-- Check for invalid coordinates (should return 0)
SELECT COUNT(*) FROM locations 
WHERE latitude < -90 OR latitude > 90 
   OR longitude < -180 OR longitude > 180;

-- Check for invalid scenery ratings (should return 0)
SELECT COUNT(*) FROM locations 
WHERE scenery_rating IS NOT NULL 
  AND (scenery_rating < 1 OR scenery_rating > 10);

-- Check for invalid categories (should return 0)
SELECT COUNT(*) FROM locations 
WHERE category NOT IN ('riding', 'campsite', 'dump', 'water', 'scenic');

-- Check for orphaned trip stops (should return 0)
SELECT COUNT(*) FROM trip_stops 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Check for orphaned journal entries (should return 0)
SELECT COUNT(*) FROM trip_journal 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Check for negative costs (should return 0)
SELECT COUNT(*) FROM locations 
WHERE cost_per_night IS NOT NULL AND cost_per_night < 0;
```

## Migration Status

- **Migration File:** `migrations/001_add_integrity_constraints.sql`
- **Applied:** 2026-02-28
- **Triggers Created:** 8
- **Foreign Keys:** 4 (already existed)
- **Data Validation:** All passed ✓

## Rollback

To remove constraints (not recommended):

```sql
-- Drop all validation triggers
DROP TRIGGER IF EXISTS validate_coordinates_insert;
DROP TRIGGER IF EXISTS validate_coordinates_update;
DROP TRIGGER IF EXISTS validate_scenery_insert;
DROP TRIGGER IF EXISTS validate_scenery_update;
DROP TRIGGER IF EXISTS validate_cost_insert;
DROP TRIGGER IF EXISTS validate_cost_update;
DROP TRIGGER IF EXISTS validate_category_insert;
DROP TRIGGER IF EXISTS validate_category_update;
```

**Warning:** Removing constraints can lead to data quality issues. Only do this if absolutely necessary.

## Best Practices

### When Adding Data

1. **Always validate coordinates** before inserting
2. **Check scenery ratings** are 1-10
3. **Ensure category** is one of the allowed values
4. **Verify costs** are non-negative
5. **Test with small batch** before bulk imports

### When Updating Schema

1. **Test migrations** on a copy of the database first
2. **Verify existing data** meets new constraints before adding them
3. **Document all changes** in migration files
4. **Keep rollback procedures** ready

### Monitoring

- Run validation queries weekly
- Check trigger execution on insert/update failures
- Monitor foreign key violations in logs

---

*Last updated: 2026-02-28*
*Migration: 001_add_integrity_constraints.sql*
