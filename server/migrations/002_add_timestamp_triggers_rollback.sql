-- Rollback for 002_add_timestamp_triggers.sql
-- Removes auto-update timestamp triggers

DROP TRIGGER IF EXISTS update_trips_timestamp;
DROP TRIGGER IF EXISTS update_locations_timestamp;
