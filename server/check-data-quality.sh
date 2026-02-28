#!/bin/bash
# TrailCamp Data Quality Monitoring Script
# Runs automated checks for common data issues

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Data Quality Check${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

TOTAL_ISSUES=0
TOTAL_CHECKS=0

# Helper function to run a check
run_check() {
    local name="$1"
    local query="$2"
    local critical="$3"  # "CRITICAL" or "WARNING"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    result=$(sqlite3 "${DB_PATH}" "${query}")
    
    if [ "${result}" = "0" ]; then
        echo -e "${GREEN}✓${NC} ${name}"
    else
        TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
        
        if [ "${critical}" = "CRITICAL" ]; then
            echo -e "${RED}✗ ${name}: ${result} issues found${NC}"
        else
            echo -e "${YELLOW}⚠ ${name}: ${result} issues found${NC}"
        fi
    fi
}

# 1. Required Fields
echo -e "${BLUE}━━━ 1. Required Fields ━━━${NC}"

run_check "Names not null" \
    "SELECT COUNT(*) FROM locations WHERE name IS NULL OR name = '';" \
    "CRITICAL"

run_check "Coordinates not null" \
    "SELECT COUNT(*) FROM locations WHERE latitude IS NULL OR longitude IS NULL;" \
    "CRITICAL"

run_check "Categories not null" \
    "SELECT COUNT(*) FROM locations WHERE category IS NULL OR category = '';" \
    "CRITICAL"

# 2. Coordinate Validation
echo -e "\n${BLUE}━━━ 2. Coordinate Validation ━━━${NC}"

run_check "Latitudes in valid range (-90 to 90)" \
    "SELECT COUNT(*) FROM locations WHERE latitude < -90 OR latitude > 90;" \
    "CRITICAL"

run_check "Longitudes in valid range (-180 to 180)" \
    "SELECT COUNT(*) FROM locations WHERE longitude < -180 OR longitude > 180;" \
    "CRITICAL"

run_check "Coordinates not (0, 0)" \
    "SELECT COUNT(*) FROM locations WHERE latitude = 0 AND longitude = 0;" \
    "CRITICAL"

# 3. Data Integrity
echo -e "\n${BLUE}━━━ 3. Data Integrity ━━━${NC}"

run_check "Scenery ratings in valid range (1-10)" \
    "SELECT COUNT(*) FROM locations WHERE scenery_rating IS NOT NULL AND (scenery_rating < 1 OR scenery_rating > 10);" \
    "WARNING"

run_check "Distance values reasonable (< 10,000 miles)" \
    "SELECT COUNT(*) FROM locations WHERE distance_miles IS NOT NULL AND distance_miles > 10000;" \
    "WARNING"

run_check "Stay limits reasonable (< 365 days)" \
    "SELECT COUNT(*) FROM locations WHERE stay_limit_days IS NOT NULL AND stay_limit_days > 365;" \
    "WARNING"

run_check "Cost per night reasonable (< \$500)" \
    "SELECT COUNT(*) FROM locations WHERE cost_per_night IS NOT NULL AND cost_per_night > 500;" \
    "WARNING"

# 4. Category-Specific Checks
echo -e "\n${BLUE}━━━ 4. Category-Specific Validation ━━━${NC}"

run_check "Riding locations have trail_types or difficulty" \
    "SELECT COUNT(*) FROM locations WHERE category = 'riding' AND (trail_types IS NULL OR trail_types = '') AND (difficulty IS NULL OR difficulty = '');" \
    "WARNING"

run_check "Campsites have sub_type" \
    "SELECT COUNT(*) FROM locations WHERE category = 'campsite' AND (sub_type IS NULL OR sub_type = '');" \
    "WARNING"

# 5. Foreign Key Integrity (trips)
echo -e "\n${BLUE}━━━ 5. Foreign Key Integrity ━━━${NC}"

run_check "No orphaned trip stops" \
    "SELECT COUNT(*) FROM trip_stops WHERE trip_id NOT IN (SELECT id FROM trips);" \
    "CRITICAL"

run_check "No orphaned trip stop locations" \
    "SELECT COUNT(*) FROM trip_stops WHERE location_id NOT IN (SELECT id FROM locations);" \
    "CRITICAL"

# 6. Duplicate Detection
echo -e "\n${BLUE}━━━ 6. Duplicate Detection ━━━${NC}"

run_check "No exact coordinate duplicates with same name" \
    "SELECT COUNT(*) - COUNT(DISTINCT latitude || ',' || longitude || ',' || name) FROM locations;" \
    "WARNING"

# 7. Completeness Checks
echo -e "\n${BLUE}━━━ 7. Data Completeness ━━━${NC}"

riding_total=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE category = 'riding';")
riding_with_scenery=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE category = 'riding' AND scenery_rating IS NOT NULL;")
riding_pct=$((riding_with_scenery * 100 / riding_total))

if [ ${riding_pct} -ge 95 ]; then
    echo -e "${GREEN}✓${NC} Riding locations with scenery ratings: ${riding_with_scenery}/${riding_total} (${riding_pct}%)"
else
    echo -e "${YELLOW}⚠${NC} Riding locations with scenery ratings: ${riding_with_scenery}/${riding_total} (${riding_pct}%)"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi

campsite_total=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE category = 'campsite';")
campsite_with_season=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE category = 'campsite' AND best_season IS NOT NULL;")
campsite_pct=$((campsite_with_season * 100 / campsite_total))

if [ ${campsite_pct} -ge 95 ]; then
    echo -e "${GREEN}✓${NC} Campsites with best_season: ${campsite_with_season}/${campsite_total} (${campsite_pct}%)"
else
    echo -e "${YELLOW}⚠${NC} Campsites with best_season: ${campsite_with_season}/${campsite_total} (${campsite_pct}%)"
    TOTAL_ISSUES=$((TOTAL_ISSUES + 1))
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ ${TOTAL_ISSUES} -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC} (${TOTAL_CHECKS} checks run)"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    exit 0
else
    echo -e "${YELLOW}⚠️  ${TOTAL_ISSUES} ISSUES FOUND${NC} (${TOTAL_CHECKS} checks run)"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    exit 1
fi
