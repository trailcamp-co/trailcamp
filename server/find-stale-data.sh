#!/bin/bash
# Stale Data Detector for TrailCamp
# Finds locations that haven't been updated in 6+ months

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
STALE_MONTHS=6

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Stale Data Detector${NC}"
echo -e "${BLUE}    Threshold: ${STALE_MONTHS} months${NC}"
echo -e "${BLUE}    $(date +"%Y-%m-%d %H:%M:%S")${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database has updated_at column
HAS_UPDATED=$(sqlite3 "$DB_PATH" "PRAGMA table_info(locations);" | grep -c "updated_at" || echo "0")

if [ "$HAS_UPDATED" -eq 0 ]; then
    echo -e "${RED}✗ Database does not have updated_at column${NC}"
    echo "Run migrations to add timestamp tracking."
    exit 1
fi

echo -e "${GREEN}✓ Database has updated_at column${NC}\n"

# Find stale locations
echo -e "${BLUE}━━━ Analyzing Locations ━━━${NC}\n"

# Total locations
TOTAL=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM locations;")

# Locations with NULL updated_at (never updated)
NEVER_UPDATED=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM locations WHERE updated_at IS NULL;")

# Stale locations (older than 6 months)
STALE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM locations WHERE updated_at IS NOT NULL AND datetime(updated_at) < datetime('now', '-${STALE_MONTHS} months');")

# Recent locations (updated within 6 months)
RECENT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM locations WHERE updated_at IS NOT NULL AND datetime(updated_at) >= datetime('now', '-${STALE_MONTHS} months');")

echo "Total locations:       $TOTAL"
echo "Never updated:         $NEVER_UPDATED"
echo "Stale (>${STALE_MONTHS}mo):       $STALE_COUNT"
echo "Recent (<${STALE_MONTHS}mo):      $RECENT"

# Stale breakdown by category
echo -e "\n${BLUE}━━━ Stale Locations by Category ━━━${NC}\n"

sqlite3 -header -column "$DB_PATH" << 'EOF'
SELECT 
  category,
  COUNT(*) as stale_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM locations WHERE datetime(updated_at) < datetime('now', '-6 months')), 1) as pct
FROM locations 
WHERE datetime(updated_at) < datetime('now', '-6 months')
GROUP BY category
ORDER BY stale_count DESC;
EOF

# Generate detailed report
REPORT_FILE="./reports/stale-locations-$(date +%Y-%m-%d).txt"
mkdir -p ./reports

{
  echo "Stale Locations Report"
  echo "Generated: $(date)"
  echo "Threshold: ${STALE_MONTHS} months"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "Summary"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  echo "Total locations:       $TOTAL"
  echo "Never updated:         $NEVER_UPDATED"
  echo "Stale (>${STALE_MONTHS}mo):       $STALE_COUNT"
  echo "Recent (<${STALE_MONTHS}mo):      $RECENT"
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "Stale Locations (Top 50)"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  
  sqlite3 -header -column "$DB_PATH" << 'SQL'
SELECT 
  id,
  name,
  category,
  COALESCE(updated_at, 'Never') as last_updated,
  CASE 
    WHEN updated_at IS NULL THEN 'Never'
    ELSE CAST((julianday('now') - julianday(updated_at)) / 30 AS INT) || ' months ago'
  END as age
FROM locations 
WHERE updated_at IS NULL OR datetime(updated_at) < datetime('now', '-6 months')
ORDER BY 
  CASE WHEN updated_at IS NULL THEN 1 ELSE 0 END,
  updated_at ASC
LIMIT 50;
SQL

  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "Recommendations"
  echo "═══════════════════════════════════════════════════════"
  echo ""
  
  if [ "$STALE_COUNT" -gt 0 ] || [ "$NEVER_UPDATED" -gt 0 ]; then
    echo "1. Review stale locations for accuracy"
    echo "2. Verify coordinates and details are still correct"
    echo "3. Update or remove outdated locations"
    echo "4. Consider adding 'verified_date' field for manual checks"
  else
    echo "✓ No stale data found - all locations recently updated"
  fi
  
} > "$REPORT_FILE"

echo -e "\n${GREEN}✓ Report saved to: $REPORT_FILE${NC}\n"

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$STALE_COUNT" -eq 0 ] && [ "$NEVER_UPDATED" -eq 0 ]; then
    echo -e "${GREEN}✓ All locations are up-to-date${NC}"
elif [ "$STALE_COUNT" -gt 100 ] || [ "$NEVER_UPDATED" -gt 100 ]; then
    echo -e "${RED}⚠️  Significant stale data detected${NC}"
    echo -e "${YELLOW}Action needed: Review $((STALE_COUNT + NEVER_UPDATED)) locations${NC}"
else
    echo -e "${YELLOW}ℹ️  Some stale data found${NC}"
    echo -e "Review $((STALE_COUNT + NEVER_UPDATED)) locations when possible"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
