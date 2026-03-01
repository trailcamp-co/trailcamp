#!/bin/bash
# Missing Indexes Analysis for TrailCamp
# Identifies potential missing indexes by analyzing query patterns

set -e

DB_PATH="./trailcamp.db"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Missing Indexes Analysis${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check existing indexes
echo -e "${BLUE}━━━ Existing Indexes ━━━${NC}\n"

sqlite3 "${DB_PATH}" << 'EOF'
SELECT 
  name as index_name,
  tbl_name as table_name,
  sql
FROM sqlite_master 
WHERE type = 'index' 
  AND sql IS NOT NULL
ORDER BY tbl_name, name;
EOF

echo ""

# Analyze common query patterns
echo -e "${BLUE}━━━ Query Pattern Analysis ━━━${NC}\n"

# Pattern 1: Filter by multiple columns
echo -e "${YELLOW}1. Locations filtered by category + sub_type${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE category = 'campsite' AND sub_type = 'boondocking';
EOF

echo ""

# Pattern 2: Filter by state (new column from geocoding)
echo -e "${YELLOW}2. Locations filtered by state${NC}"
sqlite3 "${DB_PATH}" << 'EOF' 2>/dev/null || echo "  ⚠️  State column doesn't exist yet"
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE state = 'CA';
EOF

echo ""

# Pattern 3: Best season filtering
echo -e "${YELLOW}3. Locations filtered by best_season${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE best_season LIKE '%Summer%';
EOF

echo ""

# Pattern 4: Cost range queries
echo -e "${YELLOW}4. Campsites filtered by cost range${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE cost_per_night BETWEEN 0 AND 20;
EOF

echo ""

# Pattern 5: Difficulty + category
echo -e "${YELLOW}5. Riding locations by difficulty${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE category = 'riding' AND difficulty = 'Hard';
EOF

echo ""

# Pattern 6: Permit required
echo -e "${YELLOW}6. Locations requiring permits${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE permit_required = 1;
EOF

echo ""

# Pattern 7: Water availability
echo -e "${YELLOW}7. Campsites with water${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
EXPLAIN QUERY PLAN
SELECT * FROM locations 
WHERE category = 'campsite' AND (water_available = 1 OR water_nearby = 1);
EOF

echo ""

# Recommendations
echo -e "${BLUE}━━━ Index Recommendations ━━━${NC}\n"

RECOMMENDATIONS=""

# Check if indexes are being used efficiently
SCAN_COUNT=$(sqlite3 "${DB_PATH}" << 'EOF' | grep -c "SCAN" || echo "0"
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE category = 'campsite' AND sub_type = 'boondocking';
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE best_season LIKE '%Summer%';
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE cost_per_night BETWEEN 0 AND 20;
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE permit_required = 1;
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE water_available = 1;
EOF
)

if [ "$SCAN_COUNT" -gt 2 ]; then
    echo -e "${YELLOW}⚠️  Found $SCAN_COUNT full table scans${NC}\n"
    
    echo "Suggested indexes to improve performance:"
    echo ""
    
    # Check if best_season index exists
    if ! sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_locations_season'" | grep -q "idx_locations_season"; then
        echo "  CREATE INDEX idx_locations_season ON locations(best_season);"
        echo "  -- Improves: Seasonal filtering queries"
        echo ""
    fi
    
    # Check if cost index exists
    if ! sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_locations_cost'" | grep -q "idx_locations_cost"; then
        echo "  CREATE INDEX idx_locations_cost ON locations(cost_per_night);"
        echo "  -- Improves: Cost range queries"
        echo ""
    fi
    
    # Check if permit index exists
    if ! sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_locations_permit'" | grep -q "idx_locations_permit"; then
        echo "  CREATE INDEX idx_locations_permit ON locations(permit_required);"
        echo "  -- Improves: Permit filtering"
        echo ""
    fi
    
    # Check if water indexes exist
    if ! sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_locations_water_avail'" | grep -q "idx_locations_water_avail"; then
        echo "  CREATE INDEX idx_locations_water_avail ON locations(water_available);"
        echo "  CREATE INDEX idx_locations_water_nearby ON locations(water_nearby);"
        echo "  -- Improves: Water availability queries"
        echo ""
    fi
    
    # Check if state index exists (if column exists)
    if sqlite3 "${DB_PATH}" "PRAGMA table_info(locations)" | grep -q "state"; then
        if ! sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_locations_state'" | grep -q "idx_locations_state"; then
            echo "  CREATE INDEX idx_locations_state ON locations(state);"
            echo "  -- Improves: State-based filtering"
            echo ""
        fi
    fi
    
    # Composite indexes
    echo "  -- Optional composite indexes for common multi-column queries:"
    echo "  CREATE INDEX idx_locations_category_difficulty ON locations(category, difficulty);"
    echo "  -- Improves: Category + difficulty queries"
    echo ""
    
else
    echo -e "${GREEN}✓ Query performance looks good!${NC}"
    echo -e "  Most queries are using indexes efficiently.\n"
fi

# Table statistics
echo -e "${BLUE}━━━ Table Statistics ━━━${NC}\n"

sqlite3 "${DB_PATH}" << 'EOF'
SELECT 
  'Total locations' as metric,
  COUNT(*) as value
FROM locations
UNION ALL
SELECT 
  'Locations missing scenery',
  COUNT(*)
FROM locations
WHERE scenery_rating IS NULL
UNION ALL
SELECT
  'Locations with permits',
  COUNT(*)
FROM locations  
WHERE permit_required = 1;
EOF

echo ""

# Database size
DB_SIZE=$(ls -lh "${DB_PATH}" | awk '{print $5}')
echo -e "Database size: ${DB_SIZE}"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Analysis Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Next steps:"
echo "  1. Review EXPLAIN QUERY PLAN output above"
echo "  2. Apply recommended indexes if needed"
echo "  3. Run ./test-performance.sh to verify improvements"
echo ""
