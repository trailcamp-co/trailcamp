#!/bin/bash
# TrailCamp Database Vacuum & Optimization Script
# Reclaims space and optimizes SQLite database performance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Database Vacuum & Optimization${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found at ${DB_PATH}${NC}\n"
    exit 1
fi

# Get initial stats
echo -e "${YELLOW}📊 Measuring database before optimization...${NC}\n"

BEFORE_SIZE=$(ls -lh "${DB_PATH}" | awk '{print $5}')
BEFORE_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

echo "Database size: ${BEFORE_SIZE}"

# Count records
LOCATION_COUNT=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations;")
TRIP_COUNT=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips;")

echo "Locations: ${LOCATION_COUNT}"
echo "Trips: ${TRIP_COUNT}"

# Integrity check
echo -e "\n${YELLOW}🔍 Running integrity check...${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")

if [ "${INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Integrity check: OK${NC}"
else
    echo -e "${RED}✗ Integrity check FAILED:${NC}"
    echo "${INTEGRITY}"
    echo -e "\n${RED}Aborting vacuum - database may be corrupted${NC}\n"
    exit 1
fi

# Page count before
PAGE_COUNT_BEFORE=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
FREELIST_COUNT_BEFORE=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

echo -e "\nPages: ${PAGE_COUNT_BEFORE}"
echo "Free pages: ${FREELIST_COUNT_BEFORE}"

# Run VACUUM
echo -e "\n${YELLOW}🗜️  Running VACUUM (this may take a moment)...${NC}"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;"
END_TIME=$(date +%s)

VACUUM_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_DURATION}s${NC}"

# Run ANALYZE
echo -e "\n${YELLOW}📈 Running ANALYZE to update query optimizer statistics...${NC}"

sqlite3 "${DB_PATH}" "ANALYZE;"

echo -e "${GREEN}✓ ANALYZE completed${NC}"

# Get final stats
echo -e "\n${YELLOW}📊 Measuring database after optimization...${NC}\n"

AFTER_SIZE=$(ls -lh "${DB_PATH}" | awk '{print $5}')
AFTER_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

PAGE_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
FREELIST_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

# Calculate space reclaimed
SPACE_RECLAIMED=$((BEFORE_BYTES - AFTER_BYTES))
SPACE_RECLAIMED_MB=$(echo "scale=2; ${SPACE_RECLAIMED} / 1024 / 1024" | bc)

if [ ${SPACE_RECLAIMED} -lt 0 ]; then
    SPACE_RECLAIMED=0
    SPACE_RECLAIMED_MB="0.00"
fi

PERCENT_REDUCTION=0
if [ ${BEFORE_BYTES} -gt 0 ]; then
    PERCENT_REDUCTION=$(echo "scale=1; (${SPACE_RECLAIMED} * 100) / ${BEFORE_BYTES}" | bc)
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo "Before:  ${BEFORE_SIZE} (${PAGE_COUNT_BEFORE} pages, ${FREELIST_COUNT_BEFORE} free)"
echo "After:   ${AFTER_SIZE} (${PAGE_COUNT_AFTER} pages, ${FREELIST_COUNT_AFTER} free)"

if [ ${SPACE_RECLAIMED} -gt 0 ]; then
    echo -e "\n${GREEN}Space reclaimed: ${SPACE_RECLAIMED_MB} MB (${PERCENT_REDUCTION}% reduction)${NC}"
else
    echo -e "\n${YELLOW}No space reclaimed (database was already optimized)${NC}"
fi

echo -e "\n${GREEN}✓ Query optimizer statistics updated${NC}"
echo -e "${GREEN}✓ Database optimized successfully${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Recommendations
if [ ${FREELIST_COUNT_AFTER} -gt 100 ]; then
    echo -e "${YELLOW}💡 Note: ${FREELIST_COUNT_AFTER} free pages remaining${NC}"
    echo -e "${YELLOW}   Run vacuum again after large deletes${NC}\n"
fi

exit 0
