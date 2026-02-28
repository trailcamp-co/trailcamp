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
echo -e "${BLUE}    TrailCamp Database Vacuum & Optimize${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}Error: Database not found at ${DB_PATH}${NC}"
    exit 1
fi

# Get size before optimization
SIZE_BEFORE=$(du -h "${DB_PATH}" | cut -f1)
SIZE_BEFORE_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

echo -e "${YELLOW}Database size before: ${SIZE_BEFORE}${NC}\n"

# Backup database first
echo -e "${BLUE}Creating safety backup...${NC}"
cp "${DB_PATH}" "${DB_PATH}.vacuum-backup"
echo -e "${GREEN}✓ Backup created: ${DB_PATH}.vacuum-backup${NC}\n"

# Run integrity check
echo -e "${BLUE}Running integrity check...${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")

if [ "${INTEGRITY}" != "ok" ]; then
    echo -e "${RED}✗ Integrity check FAILED: ${INTEGRITY}${NC}"
    echo -e "${YELLOW}Database has issues. Aborting vacuum.${NC}\n"
    rm -f "${DB_PATH}.vacuum-backup"
    exit 1
fi

echo -e "${GREEN}✓ Integrity check passed${NC}\n"

# Run VACUUM
echo -e "${BLUE}Running VACUUM...${NC}"
echo -e "${YELLOW}(This may take a while for large databases)${NC}\n"

VACUUM_START=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;"
VACUUM_END=$(date +%s)
VACUUM_TIME=$((VACUUM_END - VACUUM_START))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_TIME} seconds${NC}\n"

# Run ANALYZE
echo -e "${BLUE}Running ANALYZE...${NC}"
echo -e "${YELLOW}(Updates query planner statistics)${NC}\n"

ANALYZE_START=$(date +%s)
sqlite3 "${DB_PATH}" "ANALYZE;"
ANALYZE_END=$(date +%s)
ANALYZE_TIME=$((ANALYZE_END - ANALYZE_START))

echo -e "${GREEN}✓ ANALYZE completed in ${ANALYZE_TIME} seconds${NC}\n"

# Get size after optimization
SIZE_AFTER=$(du -h "${DB_PATH}" | cut -f1)
SIZE_AFTER_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

# Calculate savings
BYTES_SAVED=$((SIZE_BEFORE_BYTES - SIZE_AFTER_BYTES))
if [ ${SIZE_BEFORE_BYTES} -gt 0 ]; then
    PERCENT_SAVED=$(echo "scale=1; (${BYTES_SAVED} * 100) / ${SIZE_BEFORE_BYTES}" | bc)
else
    PERCENT_SAVED=0
fi

# Display results
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Results${NC}\n"

echo -e "Size before:     ${SIZE_BEFORE}"
echo -e "Size after:      ${SIZE_AFTER}"

if [ ${BYTES_SAVED} -gt 0 ]; then
    SAVED_MB=$(echo "scale=2; ${BYTES_SAVED} / 1024 / 1024" | bc)
    echo -e "Space saved:     ${GREEN}${SAVED_MB} MB (${PERCENT_SAVED}%)${NC}"
else
    SAVED_KB=$(echo "scale=2; ${BYTES_SAVED} / 1024" | bc)
    echo -e "Space change:    ${SAVED_KB} KB"
fi

echo -e "Vacuum time:     ${VACUUM_TIME}s"
echo -e "Analyze time:    ${ANALYZE_TIME}s"
echo -e "Total time:      $((VACUUM_TIME + ANALYZE_TIME))s"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Clean up backup
rm -f "${DB_PATH}.vacuum-backup"
echo -e "${GREEN}✓ Optimization complete!${NC}\n"

# Recommendations
echo -e "${BLUE}Recommendations:${NC}"
echo -e "  • Run this monthly for best performance"
echo -e "  • Run after large data imports or deletions"
echo -e "  • Add to cron: ${YELLOW}0 3 1 * * cd /path/to/server && ./vacuum-database.sh${NC}"
echo -e ""

exit 0
