-- Rollback for 003_add_search_index.sql
-- Removes FTS index and sync triggers

DROP TRIGGER IF EXISTS locations_fts_insert;
DROP TRIGGER IF EXISTS locations_fts_update;
DROP TRIGGER IF EXISTS locations_fts_delete;
DROP TABLE IF EXISTS locations_fts;
