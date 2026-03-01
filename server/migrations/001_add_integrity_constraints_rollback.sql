-- Rollback for 001_add_integrity_constraints.sql
-- Removes validation triggers

DROP TRIGGER IF EXISTS validate_coordinates_insert;
DROP TRIGGER IF EXISTS validate_coordinates_update;
DROP TRIGGER IF EXISTS validate_scenery_insert;
DROP TRIGGER IF EXISTS validate_scenery_update;
DROP TRIGGER IF EXISTS validate_cost_insert;
DROP TRIGGER IF EXISTS validate_cost_update;
DROP TRIGGER IF EXISTS validate_category_insert;
DROP TRIGGER IF EXISTS validate_category_update;
