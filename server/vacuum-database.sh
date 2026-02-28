#!/bin/bash
# TrailCamp Database Vacuum Script
# Reclaims unused space and optimizes performance

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
    echo -e "${RED}✗ Database not found: ${DB_PATH}${NC}"
    exit 1
fi

# Get initial size
INITIAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
INITIAL_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

echo -e "${BLUE}1. Pre-Vacuum Status${NC}"
echo -e "   Database size: ${INITIAL_SIZE}"

# Run integrity check first
echo -e "\n${BLUE}2. Integrity Check${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" 2>&1)

if [ "$INTEGRITY" = "ok" ]; then
    echo -e "   ${GREEN}✓ Database integrity: OK${NC}"
else
    echo -e "   ${RED}✗ Integrity check failed:${NC}"
    echo "$INTEGRITY"
    echo -e "\n${YELLOW}WARNING: Not safe to vacuum. Fix integrity issues first.${NC}"
    exit 1
fi

# Get database stats before vacuum
echo -e "\n${BLUE}3. Pre-Vacuum Statistics${NC}"
PAGE_COUNT=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
PAGE_SIZE=$(sqlite3 "${DB_PATH}" "PRAGMA page_size;")
FREELIST_COUNT=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

echo -e "   Total pages: ${PAGE_COUNT}"
echo -e "   Page size: ${PAGE_SIZE} bytes"
echo -e "   Free pages: ${FREELIST_COUNT}"

if [ "$FREELIST_COUNT" -gt 0 ]; then
    WASTED_BYTES=$((FREELIST_COUNT * PAGE_SIZE))
    WASTED_MB=$((WASTED_BYTES / 1024 / 1024))
    echo -e "   ${YELLOW}Wasted space: ~${WASTED_MB}MB (${FREELIST_COUNT} free pages)${NC}"
else
    echo -e "   ${GREEN}No wasted space detected${NC}"
fi

# Run VACUUM
echo -e "\n${BLUE}4. Running VACUUM${NC}"
echo -e "   This may take a few seconds..."

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;" 2>&1
VACUUM_STATUS=$?
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ $VACUUM_STATUS -eq 0 ]; then
    echo -e "   ${GREEN}✓ VACUUM completed (${DURATION}s)${NC}"
else
    echo -e "   ${RED}✗ VACUUM failed${NC}"
    exit 1
fi

# Run ANALYZE to update statistics
echo -e "\n${BLUE}5. Running ANALYZE${NC}"
echo -e "   Updating query planner statistics..."

sqlite3 "${DB_PATH}" "ANALYZE;" 2>&1
ANALYZE_STATUS=$?

if [ $ANALYZE_STATUS -eq 0 ]; then
    echo -e "   ${GREEN}✓ ANALYZE completed${NC}"
else
    echo -e "   ${YELLOW}⚠ ANALYZE had issues (non-critical)${NC}"
fi

# Get final size
FINAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
FINAL_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null)

# Calculate savings
SAVED_BYTES=$((INITIAL_BYTES - FINAL_BYTES))
SAVED_MB=$((SAVED_BYTES / 1024 / 1024))

if [ $SAVED_BYTES -gt 0 ]; then
    PERCENT_SAVED=$((SAVED_BYTES * 100 / INITIAL_BYTES))
else
    PERCENT_SAVED=0
fi

# Get post-vacuum stats
echo -e "\n${BLUE}6. Post-Vacuum Statistics${NC}"
PAGE_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
FREELIST_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

echo -e "   Total pages: ${PAGE_COUNT_AFTER}"
echo -e "   Free pages: ${FREELIST_COUNT_AFTER}"

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo -e "   Before:  ${INITIAL_SIZE}"
echo -e "   After:   ${FINAL_SIZE}"

if [ $SAVED_BYTES -gt 0 ]; then
    if [ $SAVED_MB -gt 0 ]; then
        echo -e "   ${GREEN}Saved:   ${SAVED_MB}MB (${PERCENT_SAVED}%)${NC}"
    else
        SAVED_KB=$((SAVED_BYTES / 1024))
        echo -e "   ${GREEN}Saved:   ${SAVED_KB}KB${NC}"
    fi
else
    echo -e "   ${YELLOW}No space reclaimed (database was already compact)${NC}"
fi

echo -e "\n   ${GREEN}✅ Database optimization complete!${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Recommendations
if [ $SAVED_MB -gt 5 ] || [ $FREELIST_COUNT -gt 100 ]; then
    echo -e "${YELLOW}💡 Recommendation:${NC} Schedule regular vacuums (weekly or monthly)"
    echo -e "   Add to cron: 0 3 * * 0 cd $(pwd) && ./vacuum-database.sh\n"
fi

exit 0
