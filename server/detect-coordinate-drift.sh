#!/bin/bash
# Coordinate Drift Detector for TrailCamp
# Finds locations with same/similar names at different coordinates

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Coordinate Drift Detector${NC}"
echo -e "${BLUE}    $(date +"%Y-%m-%d %H:%M:%S")${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Create reports directory
mkdir -p ./reports

# 1. Find exact duplicate names with different coordinates
echo -e "${BLUE}━━━ 1. Exact Name Duplicates ━━━${NC}\n"

EXACT_DUPS=$(sqlite3 -header -column "$DB_PATH" << 'EOF'
SELECT 
  name,
  COUNT(DISTINCT latitude || ',' || longitude) as coord_variations,
  COUNT(*) as total_count
FROM locations
GROUP BY name
HAVING coord_variations > 1
ORDER BY total_count DESC, name;
EOF
)

EXACT_COUNT=$(echo "$EXACT_DUPS" | tail -n +2 | wc -l | xargs)

if [ "$EXACT_COUNT" -gt 0 ]; then
    echo "$EXACT_DUPS"
    echo ""
    echo -e "${YELLOW}Found $EXACT_COUNT names with multiple coordinate sets${NC}"
else
    echo -e "${GREEN}✓ No exact name duplicates with different coordinates${NC}"
fi

# 2. Find near-duplicate names (normalized)
echo -e "\n${BLUE}━━━ 2. Similar Names at Different Locations ━━━${NC}\n"

# Get normalized duplicates (remove common suffixes, lowercase)
SIMILAR=$(sqlite3 -header -column "$DB_PATH" << 'EOF'
WITH normalized AS (
  SELECT 
    id,
    name,
    latitude,
    longitude,
    LOWER(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(name, ' OHV Area', ''),
          ' State Park', ''),
        ' National Forest', ''),
      ' Campground', '')
    ) as norm_name
  FROM locations
)
SELECT 
  norm_name as normalized_name,
  COUNT(DISTINCT latitude || ',' || longitude) as coord_variations,
  COUNT(*) as total_count,
  GROUP_CONCAT(name, ' | ') as variations
FROM normalized
GROUP BY norm_name
HAVING coord_variations > 1 AND total_count <= 5
ORDER BY total_count DESC
LIMIT 20;
EOF
)

SIMILAR_COUNT=$(echo "$SIMILAR" | tail -n +2 | wc -l | xargs)

if [ "$SIMILAR_COUNT" -gt 0 ]; then
    echo "$SIMILAR"
    echo ""
    echo -e "${YELLOW}Found $SIMILAR_COUNT normalized names with coordinate variations${NC}"
else
    echo "No similar name variations found"
fi

# 3. Generate detailed report
REPORT_FILE="./reports/coordinate-drift-$(date +%Y-%m-%d).txt"

{
  echo "Coordinate Drift Detection Report"
  echo "Generated: $(date)"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "Summary"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "Exact name duplicates:     $EXACT_COUNT"
  echo "Similar name variations:   $SIMILAR_COUNT"
  echo ""
  
  if [ "$EXACT_COUNT" -gt 0 ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "Exact Duplicates (Same name, different coordinates)"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    
    # Detailed list
    sqlite3 -header -column "$DB_PATH" << 'SQL'
WITH dups AS (
  SELECT name
  FROM locations
  GROUP BY name
  HAVING COUNT(DISTINCT latitude || ',' || longitude) > 1
)
SELECT 
  l.id,
  l.name,
  l.category,
  ROUND(l.latitude, 4) as lat,
  ROUND(l.longitude, 4) as lon,
  l.state
FROM locations l
INNER JOIN dups d ON l.name = d.name
ORDER BY l.name, l.id;
SQL
    
    echo ""
    echo "Recommendations:"
    echo "1. Review each duplicate set manually"
    echo "2. Determine if these are:"
    echo "   - Legitimate separate locations (add distinguishing info to names)"
    echo "   - Import errors (remove duplicates)"
    echo "   - Moved locations (update coordinates, mark old as outdated)"
    echo ""
  fi
  
  if [ "$EXACT_COUNT" -eq 0 ] && [ "$SIMILAR_COUNT" -eq 0 ]; then
    echo "✓ No coordinate drift detected"
    echo ""
    echo "All location names are unique or consistently placed."
  fi
  
  echo "═══════════════════════════════════════════════════════"
  echo "Notes"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "This report identifies potential issues:"
  echo "- Duplicate imports with slightly different coordinates"
  echo "- Locations that have moved (trailhead relocations, etc.)"
  echo "- Data entry errors"
  echo ""
  echo "Not all findings are errors - some locations legitimately"
  echo "share names (e.g., multiple 'Pine Creek Trail' in different states)"
  echo ""
  
} > "$REPORT_FILE"

echo -e "\n${GREEN}✓ Report saved to: $REPORT_FILE${NC}\n"

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ "$EXACT_COUNT" -eq 0 ] && [ "$SIMILAR_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ No coordinate drift detected${NC}"
elif [ "$EXACT_COUNT" -gt 10 ] || [ "$SIMILAR_COUNT" -gt 20 ]; then
    echo -e "${YELLOW}⚠️  Significant drift/duplicates detected${NC}"
    echo -e "Manual review recommended: $((EXACT_COUNT + SIMILAR_COUNT)) issues"
else
    echo -e "${YELLOW}ℹ️  Minor drift/duplicates detected${NC}"
    echo -e "Review when convenient: $((EXACT_COUNT + SIMILAR_COUNT)) issues"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
