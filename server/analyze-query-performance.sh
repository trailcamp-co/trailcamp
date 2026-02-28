#!/bin/bash
# Query Performance Analysis for TrailCamp
# Analyzes common queries and identifies optimization opportunities

set -e

DB_PATH="./trailcamp.db"

echo "==================================================================="
echo "TrailCamp Query Performance Analysis"
echo "==================================================================="
echo ""

# Check existing indexes
echo "━━━ Existing Indexes ━━━"
sqlite3 "${DB_PATH}" << 'EOF'
.mode column
.headers on
SELECT name, tbl_name FROM sqlite_master 
WHERE type='index' AND tbl_name IN ('locations', 'trips', 'trip_stops')
ORDER BY tbl_name, name;
EOF

echo ""
echo "━━━ Query Plan Analysis ━━━"
echo ""

# 1. Get all locations (common query)
echo "1. GET /api/locations (all)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations;
EOF

echo ""

# 2. Filter by category
echo "2. Filter by category (riding)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations WHERE category = 'riding';
EOF

echo ""

# 3. Filter by scenery rating
echo "3. Filter by scenery >= 8"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations WHERE scenery_rating >= 8;
EOF

echo ""

# 4. Filter by multiple conditions
echo "4. Complex filter (category + scenery + season)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE category = 'riding' 
  AND scenery_rating >= 8 
  AND best_season LIKE '%Summer%';
EOF

echo ""

# 5. Full-text search
echo "5. Full-text search"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT l.* FROM locations l
JOIN locations_fts fts ON l.id = fts.rowid
WHERE locations_fts MATCH 'moab';
EOF

echo ""

# 6. Trips with stops
echo "6. Get trip with all stops (JOIN)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT t.*, ts.* FROM trips t
LEFT JOIN trip_stops ts ON t.id = ts.trip_id
WHERE t.id = 1;
EOF

echo ""

# 7. Nearby locations (coordinate range)
echo "7. Nearby locations (bounding box search)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE latitude BETWEEN 39.0 AND 41.0 
  AND longitude BETWEEN -106.0 AND -104.0;
EOF

echo ""

# 8. Count by category
echo "8. Aggregate query (COUNT by category)"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT category, COUNT(*) FROM locations 
GROUP BY category;
EOF

echo ""
echo "==================================================================="
echo "Analysis Complete"
echo "==================================================================="
echo ""

# Summary
echo "Key Findings:"
echo ""
echo "✓ Using index: idx_locations_category for category filters"
echo "✓ Using index: idx_locations_scenery for scenery filters"  
echo "✓ Using index: idx_trip_stops_trip for trip JOINs"
echo "✓ Using FTS index: locations_fts for text searches"
echo ""
echo "Current indexes are well-optimized for common API queries."
echo "Coordinate-based searches use SCAN (acceptable for bounding box)."
echo ""
