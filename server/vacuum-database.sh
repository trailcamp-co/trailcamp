#!/bin/bash
# TrailCamp Database Vacuum Script
# Reclaims space and optimizes database performance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Database Vacuum${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}Error: Database not found at ${DB_PATH}${NC}"
    exit 1
fi

# Get database size before
SIZE_BEFORE=$(du -h "${DB_PATH}" | cut -f1)
SIZE_BEFORE_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

echo -e "${YELLOW}Database size before: ${SIZE_BEFORE}${NC}\n"

# Check integrity first
echo -e "${BLUE}━━━ 1. Checking Database Integrity ━━━${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")

if [ "${INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Database integrity: OK${NC}\n"
else
    echo -e "${RED}✗ Database integrity check FAILED:${NC}"
    echo "${INTEGRITY}"
    echo -e "\n${RED}Aborting vacuum. Fix integrity issues first.${NC}\n"
    exit 1
fi

# Run VACUUM
echo -e "${BLUE}━━━ 2. Running VACUUM ━━━${NC}"
echo -e "${YELLOW}Reclaiming unused space and defragmenting...${NC}"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;"
END_TIME=$(date +%s)
VACUUM_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_TIME} seconds${NC}\n"

# Run ANALYZE
echo -e "${BLUE}━━━ 3. Running ANALYZE ━━━${NC}"
echo -e "${YELLOW}Updating query planner statistics...${NC}"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "ANALYZE;"
END_TIME=$(date +%s)
ANALYZE_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ ANALYZE completed in ${ANALYZE_TIME} seconds${NC}\n"

# Get database size after
SIZE_AFTER=$(du -h "${DB_PATH}" | cut -f1)
SIZE_AFTER_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

# Calculate space reclaimed
SPACE_RECLAIMED_BYTES=$((SIZE_BEFORE_BYTES - SIZE_AFTER_BYTES))
SPACE_RECLAIMED_MB=$((SPACE_RECLAIMED_BYTES / 1024 / 1024))
PERCENT_CHANGE=$(awk "BEGIN {printf \"%.1f\", (($SIZE_BEFORE_BYTES - $SIZE_AFTER_BYTES) / $SIZE_BEFORE_BYTES) * 100}")

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo -e "Size before:      ${SIZE_BEFORE}"
echo -e "Size after:       ${SIZE_AFTER}"

if [ ${SPACE_RECLAIMED_BYTES} -gt 0 ]; then
    echo -e "Space reclaimed:  ${SPACE_RECLAIMED_MB}MB (${PERCENT_CHANGE}%)"
    echo -e "\n${GREEN}✅ Database optimized successfully!${NC}"
elif [ ${SPACE_RECLAIMED_BYTES} -lt 0 ]; then
    # Database grew (expected on first vacuum)
    SPACE_ADDED_BYTES=$((SIZE_AFTER_BYTES - SIZE_BEFORE_BYTES))
    SPACE_ADDED_MB=$((SPACE_ADDED_BYTES / 1024 / 1024))
    echo -e "Size increased:   ${SPACE_ADDED_MB}MB"
    echo -e "\n${YELLOW}ℹ️  Database grew (expected on first vacuum after adding indexes/triggers)${NC}"
else
    echo -e "Space reclaimed:  0MB"
    echo -e "\n${GREEN}✅ Database already optimized!${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Statistics
echo -e "${BLUE}Database Statistics:${NC}"
sqlite3 "${DB_PATH}" << 'EOF'
SELECT 
    'Locations: ' || COUNT(*) as stat FROM locations
UNION ALL
SELECT 
    'Trips: ' || COUNT(*) FROM trips
UNION ALL
SELECT 
    'Trip Stops: ' || COUNT(*) FROM trip_stops;
EOF

echo ""
