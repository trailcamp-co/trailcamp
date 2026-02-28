-- Migration 004: Add state and county columns
-- Enables state-level filtering and analytics

-- Add state column (2-letter code)
ALTER TABLE locations ADD COLUMN state TEXT;

-- Add county column
ALTER TABLE locations ADD COLUMN county TEXT;

-- Create index for state filtering
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);

-- Create index for county filtering  
CREATE INDEX IF NOT EXISTS idx_locations_county ON locations(county);

-- Migration complete
-- Run geocode-locations.js to populate these fields
