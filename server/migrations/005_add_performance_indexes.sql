-- Migration 005: Add Performance Indexes
-- Addresses missing indexes identified by analyze-missing-indexes.sh

-- Cost range queries (BETWEEN queries)
CREATE INDEX IF NOT EXISTS idx_locations_cost ON locations(cost_per_night);

-- Permit filtering
CREATE INDEX IF NOT EXISTS idx_locations_permit ON locations(permit_required);

-- Water availability filtering
CREATE INDEX IF NOT EXISTS idx_locations_water_avail ON locations(water_available);
CREATE INDEX IF NOT EXISTS idx_locations_water_nearby ON locations(water_nearby);

-- Category + difficulty composite (common query pattern)
CREATE INDEX IF NOT EXISTS idx_locations_category_difficulty ON locations(category, difficulty);

-- Difficulty alone (for riding-only difficulty filters)
CREATE INDEX IF NOT EXISTS idx_locations_difficulty ON locations(difficulty);
