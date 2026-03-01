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
    echo -e "${RED}✗ Database not found at ${DB_PATH}${NC}\n"
    exit 1
fi

# Get database size before
SIZE_BEFORE=$(du -h "${DB_PATH}" | cut -f1)
SIZE_BEFORE_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

echo -e "${YELLOW}Database size before: ${SIZE_BEFORE}${NC}\n"

# Run integrity check first
echo -e "${BLUE}━━━ 1. Integrity Check ━━━${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")

if [ "${INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Database integrity OK${NC}\n"
else
    echo -e "${RED}✗ Database integrity check FAILED:${NC}"
    echo "${INTEGRITY}"
    echo -e "\n${RED}Aborting vacuum. Fix integrity issues first.${NC}\n"
    exit 1
fi

# Run VACUUM
echo -e "${BLUE}━━━ 2. Running VACUUM ━━━${NC}"
echo "Reclaiming unused space and defragmenting..."

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;"
END_TIME=$(date +%s)
VACUUM_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_TIME} seconds${NC}\n"

# Run ANALYZE
echo -e "${BLUE}━━━ 3. Running ANALYZE ━━━${NC}"
echo "Updating query planner statistics..."

sqlite3 "${DB_PATH}" "ANALYZE;"
echo -e "${GREEN}✓ ANALYZE completed${NC}\n"

# Get database size after
SIZE_AFTER=$(du -h "${DB_PATH}" | cut -f1)
SIZE_AFTER_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

# Calculate space saved
SPACE_SAVED=$((SIZE_BEFORE_BYTES - SIZE_AFTER_BYTES))
SPACE_SAVED_MB=$((SPACE_SAVED / 1048576))

if [ ${SPACE_SAVED} -gt 0 ]; then
    PERCENT_SAVED=$(echo "scale=1; ($SPACE_SAVED * 100) / $SIZE_BEFORE_BYTES" | bc)
    echo -e "${BLUE}━━━ Results ━━━${NC}"
    echo -e "Size before:  ${SIZE_BEFORE}"
    echo -e "Size after:   ${SIZE_AFTER}"
    echo -e "${GREEN}Space saved:  ${SPACE_SAVED_MB}MB (${PERCENT_SAVED}%)${NC}\n"
elif [ ${SPACE_SAVED} -lt 0 ]; then
    # Size increased slightly (normal due to page alignment)
    echo -e "${BLUE}━━━ Results ━━━${NC}"
    echo -e "Size before:  ${SIZE_BEFORE}"
    echo -e "Size after:   ${SIZE_AFTER}"
    echo -e "${YELLOW}Note: Slight size increase is normal after VACUUM (page alignment)${NC}\n"
else
    echo -e "${BLUE}━━━ Results ━━━${NC}"
    echo -e "Size before:  ${SIZE_BEFORE}"
    echo -e "Size after:   ${SIZE_AFTER}"
    echo -e "${GREEN}✓ No space to reclaim${NC}\n"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Database optimization complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Recommendations:"
echo "  • Run vacuum monthly or after large deletions"
echo "  • Query performance should be improved"
echo "  • Database is now defragmented"
echo ""

exit 0
