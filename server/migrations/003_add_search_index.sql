-- Migration: Add Full-Text Search Index
-- Date: 2026-02-28
-- Description: Creates FTS5 virtual table for fast location searches

-- =============================================================================
-- 1. Create FTS5 Virtual Table for Full-Text Search
-- =============================================================================

CREATE VIRTUAL TABLE IF NOT EXISTS locations_fts USING fts5(
  name,
  description,
  notes,
  trail_types,
  content='locations',
  content_rowid='id'
);

-- =============================================================================
-- 2. Populate FTS Table with Existing Data
-- =============================================================================

INSERT INTO locations_fts(rowid, name, description, notes, trail_types)
SELECT id, name, description, notes, trail_types
FROM locations;

-- =============================================================================
-- 3. Triggers to Keep FTS Table in Sync
-- =============================================================================

-- Trigger: INSERT new location into FTS
CREATE TRIGGER IF NOT EXISTS locations_fts_insert
AFTER INSERT ON locations
BEGIN
  INSERT INTO locations_fts(rowid, name, description, notes, trail_types)
  VALUES (NEW.id, NEW.name, NEW.description, NEW.notes, NEW.trail_types);
END;

-- Trigger: UPDATE location in FTS
CREATE TRIGGER IF NOT EXISTS locations_fts_update
AFTER UPDATE ON locations
BEGIN
  UPDATE locations_fts
  SET name = NEW.name,
      description = NEW.description,
      notes = NEW.notes,
      trail_types = NEW.trail_types
  WHERE rowid = NEW.id;
END;

-- Trigger: DELETE location from FTS
CREATE TRIGGER IF NOT EXISTS locations_fts_delete
AFTER DELETE ON locations
BEGIN
  DELETE FROM locations_fts WHERE rowid = OLD.id;
END;

-- =============================================================================
-- 4. Search Query Examples
-- =============================================================================

-- Basic search (matches any field)
-- SELECT l.* FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH 'moab'
-- ORDER BY rank;

-- Search with ranking (most relevant first)
-- SELECT l.*, rank FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH 'single track enduro'
-- ORDER BY rank
-- LIMIT 10;

-- Search specific field
-- SELECT l.* FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH 'name:moab';

-- Boolean operators
-- SELECT l.* FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH 'single AND track NOT beginner';

-- Phrase search
-- SELECT l.* FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH '"national forest"';

-- =============================================================================
-- 5. Verification
-- =============================================================================

-- Count indexed documents
-- SELECT COUNT(*) as indexed_count FROM locations_fts;

-- View all FTS triggers
-- SELECT name FROM sqlite_master 
-- WHERE type='trigger' AND name LIKE 'locations_fts_%';

-- Test search
-- SELECT COUNT(*) as matches FROM locations l
-- JOIN locations_fts fts ON l.id = fts.rowid
-- WHERE locations_fts MATCH 'trail';
