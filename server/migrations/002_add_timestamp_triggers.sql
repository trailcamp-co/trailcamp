-- Migration: Add Timestamp Update Triggers
-- Date: 2026-02-28
-- Description: Auto-update updated_at timestamps when records are modified

-- =============================================================================
-- Auto-update Triggers for updated_at columns
-- =============================================================================

-- Trigger for trips table
CREATE TRIGGER IF NOT EXISTS update_trips_timestamp
AFTER UPDATE ON trips
FOR EACH ROW
BEGIN
  UPDATE trips SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger for locations table
CREATE TRIGGER IF NOT EXISTS update_locations_timestamp
AFTER UPDATE ON locations
FOR EACH ROW
BEGIN
  UPDATE locations SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- =============================================================================
-- Verification Queries
-- =============================================================================

-- Test trips timestamp update
-- UPDATE trips SET name = name WHERE id = 1;
-- SELECT name, updated_at FROM trips WHERE id = 1;

-- Test locations timestamp update
-- UPDATE locations SET notes = 'Updated note' WHERE id = 1;
-- SELECT name, updated_at FROM locations WHERE id = 1;

-- View all triggers
-- SELECT name, tbl_name FROM sqlite_master WHERE type='trigger';
