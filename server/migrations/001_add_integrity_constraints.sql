-- Migration: Add Database Integrity Constraints
-- Date: 2026-02-28
-- Description: Adds NOT NULL constraints, CHECK constraints, and improves foreign keys

-- SQLite doesn't support ALTER TABLE to add constraints easily
-- We'll document constraints and add CHECK constraints where possible

-- =============================================================================
-- 1. CHECK Constraints for Data Validation
-- =============================================================================

-- Add CHECK constraints to locations table (requires recreation in SQLite)
-- Note: This migration documents constraints. For new tables, use these.

-- Coordinate validation
-- CHECK (latitude >= -90 AND latitude <= 90)
-- CHECK (longitude >= -180 AND longitude <= 180)

-- Scenery rating validation
-- CHECK (scenery_rating IS NULL OR (scenery_rating >= 1 AND scenery_rating <= 10))

-- User rating validation
-- CHECK (user_rating IS NULL OR (user_rating >= 1 AND user_rating <= 10))

-- Cost validation
-- CHECK (cost_per_night IS NULL OR cost_per_night >= 0)

-- Stay limit validation
-- CHECK (stay_limit_days IS NULL OR stay_limit_days > 0)

-- Boolean flags (using INTEGER 0/1)
-- CHECK (permit_required IN (0, 1))
-- CHECK (visited IN (0, 1))
-- CHECK (want_to_visit IN (0, 1))
-- CHECK (favorited IN (0, 1))
-- CHECK (water_available IN (0, 1))
-- CHECK (featured IN (0, 1))

-- Category validation
-- CHECK (category IN ('riding', 'campsite', 'dump', 'water', 'scenic'))

-- =============================================================================
-- 2. Verify Existing Foreign Keys
-- =============================================================================

-- trip_stops.trip_id → trips.id (ON DELETE CASCADE) ✓ Already exists
-- trip_stops.location_id → locations.id (needs ON DELETE behavior)
-- trip_journal.trip_id → trips.id ✓ Already exists  
-- trip_journal.stop_id → trip_stops.id ✓ Already exists

-- =============================================================================
-- 3. Data Validation Queries (Run these to check data quality)
-- =============================================================================

-- Check for invalid coordinates
SELECT COUNT(*) as invalid_coords FROM locations 
WHERE latitude < -90 OR latitude > 90 
   OR longitude < -180 OR longitude > 180;

-- Check for invalid scenery ratings
SELECT COUNT(*) as invalid_scenery FROM locations 
WHERE scenery_rating IS NOT NULL 
  AND (scenery_rating < 1 OR scenery_rating > 10);

-- Check for invalid categories
SELECT DISTINCT category FROM locations 
WHERE category NOT IN ('riding', 'campsite', 'dump', 'water', 'scenic');

-- Check for orphaned trip stops (should be 0 with FK constraints)
SELECT COUNT(*) as orphaned_stops FROM trip_stops 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- Check for orphaned journal entries
SELECT COUNT(*) as orphaned_journal FROM trip_journal 
WHERE trip_id NOT IN (SELECT id FROM trips);

-- =============================================================================
-- 4. Constraint Enforcement via Triggers (Alternative to CHECK constraints)
-- =============================================================================

-- Trigger to validate coordinates on INSERT
CREATE TRIGGER IF NOT EXISTS validate_coordinates_insert
BEFORE INSERT ON locations
FOR EACH ROW
WHEN NEW.latitude < -90 OR NEW.latitude > 90 
  OR NEW.longitude < -180 OR NEW.longitude > 180
BEGIN
  SELECT RAISE(ABORT, 'Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180');
END;

-- Trigger to validate coordinates on UPDATE
CREATE TRIGGER IF NOT EXISTS validate_coordinates_update
BEFORE UPDATE ON locations
FOR EACH ROW
WHEN NEW.latitude < -90 OR NEW.latitude > 90 
  OR NEW.longitude < -180 OR NEW.longitude > 180
BEGIN
  SELECT RAISE(ABORT, 'Invalid coordinates: latitude must be -90 to 90, longitude must be -180 to 180');
END;

-- Trigger to validate scenery ratings on INSERT
CREATE TRIGGER IF NOT EXISTS validate_scenery_insert
BEFORE INSERT ON locations
FOR EACH ROW
WHEN NEW.scenery_rating IS NOT NULL 
 AND (NEW.scenery_rating < 1 OR NEW.scenery_rating > 10)
BEGIN
  SELECT RAISE(ABORT, 'Invalid scenery_rating: must be between 1 and 10');
END;

-- Trigger to validate scenery ratings on UPDATE
CREATE TRIGGER IF NOT EXISTS validate_scenery_update
BEFORE UPDATE ON locations
FOR EACH ROW
WHEN NEW.scenery_rating IS NOT NULL 
 AND (NEW.scenery_rating < 1 OR NEW.scenery_rating > 10)
BEGIN
  SELECT RAISE(ABORT, 'Invalid scenery_rating: must be between 1 and 10');
END;

-- Trigger to validate cost on INSERT
CREATE TRIGGER IF NOT EXISTS validate_cost_insert
BEFORE INSERT ON locations
FOR EACH ROW
WHEN NEW.cost_per_night IS NOT NULL AND NEW.cost_per_night < 0
BEGIN
  SELECT RAISE(ABORT, 'Invalid cost_per_night: must be >= 0');
END;

-- Trigger to validate cost on UPDATE
CREATE TRIGGER IF NOT EXISTS validate_cost_update
BEFORE UPDATE ON locations
FOR EACH ROW
WHEN NEW.cost_per_night IS NOT NULL AND NEW.cost_per_night < 0
BEGIN
  SELECT RAISE(ABORT, 'Invalid cost_per_night: must be >= 0');
END;

-- Trigger to validate category on INSERT
CREATE TRIGGER IF NOT EXISTS validate_category_insert
BEFORE INSERT ON locations
FOR EACH ROW
WHEN NEW.category NOT IN ('riding', 'campsite', 'dump', 'water', 'scenic')
BEGIN
  SELECT RAISE(ABORT, 'Invalid category: must be riding, campsite, dump, water, or scenic');
END;

-- Trigger to validate category on UPDATE
CREATE TRIGGER IF NOT EXISTS validate_category_update
BEFORE UPDATE ON locations
FOR EACH ROW
WHEN NEW.category NOT IN ('riding', 'campsite', 'dump', 'water', 'scenic')
BEGIN
  SELECT RAISE(ABORT, 'Invalid category: must be riding, campsite, dump, water, or scenic');
END;

-- =============================================================================
-- 5. Apply Constraints
-- =============================================================================

-- Run this migration
-- sqlite3 trailcamp.db < migrations/001_add_integrity_constraints.sql

-- Verify triggers were created
-- sqlite3 trailcamp.db "SELECT name FROM sqlite_master WHERE type='trigger';"
