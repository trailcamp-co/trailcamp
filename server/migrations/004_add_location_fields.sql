-- Migration 004: Add State and County Fields
-- Adds geographic administrative fields to locations table

-- Add state column (2-letter state code)
ALTER TABLE locations ADD COLUMN state VARCHAR(2);

-- Add county column
ALTER TABLE locations ADD COLUMN county VARCHAR(100);

-- Add country column (for future international support)
ALTER TABLE locations ADD COLUMN country VARCHAR(2) DEFAULT 'US';

-- Create index for state queries
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);

-- Create index for country queries  
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);

-- Migration complete
-- Run: sqlite3 trailcamp.db < migrations/004_add_location_fields.sql
