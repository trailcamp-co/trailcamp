#!/bin/bash
# TrailCamp Database Vacuum & Optimization Script
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
echo -e "${BLUE}    TrailCamp Database Vacuum & Optimization${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found at ${DB_PATH}${NC}"
    exit 1
fi

# Get initial size
INITIAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
INITIAL_BYTES=$(du -k "${DB_PATH}" | cut -f1)

echo -e "${YELLOW}Initial database size: ${INITIAL_SIZE}${NC}\n"

# Step 1: Integrity check
echo -e "${BLUE}━━━ Step 1: Integrity Check ━━━${NC}"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" 2>&1)

if [ "$INTEGRITY" = "ok" ]; then
    echo -e "${GREEN}✓ Database integrity: OK${NC}\n"
else
    echo -e "${RED}✗ Database integrity check failed!${NC}"
    echo -e "${RED}Result: ${INTEGRITY}${NC}"
    echo -e "${YELLOW}Aborting vacuum - fix integrity issues first${NC}\n"
    exit 1
fi

# Step 2: Page count before vacuum
echo -e "${BLUE}━━━ Step 2: Pre-Vacuum Statistics ━━━${NC}"
PAGE_SIZE=$(sqlite3 "${DB_PATH}" "PRAGMA page_size;")
PAGE_COUNT=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
FREELIST_COUNT=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

echo -e "Page size:       ${PAGE_SIZE} bytes"
echo -e "Total pages:     ${PAGE_COUNT}"
echo -e "Free pages:      ${FREELIST_COUNT}"
echo -e "Fragmentation:   $(echo "scale=1; $FREELIST_COUNT * 100 / $PAGE_COUNT" | bc)%\n"

# Step 3: Run VACUUM
echo -e "${BLUE}━━━ Step 3: Running VACUUM ━━━${NC}"
echo -e "${YELLOW}This may take a minute for large databases...${NC}"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;" 2>&1
END_TIME=$(date +%s)
VACUUM_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_DURATION} seconds${NC}\n"

# Step 4: Run ANALYZE
echo -e "${BLUE}━━━ Step 4: Running ANALYZE ━━━${NC}"
echo -e "${YELLOW}Updating query planner statistics...${NC}"

sqlite3 "${DB_PATH}" "ANALYZE;" 2>&1
echo -e "${GREEN}✓ ANALYZE completed${NC}\n"

# Step 5: Post-vacuum statistics
echo -e "${BLUE}━━━ Step 5: Post-Vacuum Statistics ━━━${NC}"
FINAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
FINAL_BYTES=$(du -k "${DB_PATH}" | cut -f1)
PAGE_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA page_count;")
FREELIST_COUNT_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA freelist_count;")

SAVED_BYTES=$((INITIAL_BYTES - FINAL_BYTES))
SAVED_KB=$((SAVED_BYTES))
SAVED_PERCENT=$(echo "scale=1; $SAVED_BYTES * 100 / $INITIAL_BYTES" | bc)

echo -e "Page size:       ${PAGE_SIZE} bytes"
echo -e "Total pages:     ${PAGE_COUNT_AFTER}"
echo -e "Free pages:      ${FREELIST_COUNT_AFTER}"
echo -e "Fragmentation:   0.0%\n"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo -e "Initial size:    ${INITIAL_SIZE}"
echo -e "Final size:      ${FINAL_SIZE}"
echo -e "Space reclaimed: ${SAVED_KB} KB (${SAVED_PERCENT}%)"
echo -e "Duration:        ${VACUUM_DURATION} seconds"

if [ ${SAVED_BYTES} -gt 0 ]; then
    echo -e "\n${GREEN}✓ Database optimized successfully!${NC}"
else
    echo -e "\n${GREEN}✓ Database was already optimized (no space to reclaim)${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Recommendations
echo -e "${BLUE}Maintenance Recommendations:${NC}\n"
echo -e "- Run vacuum monthly for active databases"
echo -e "- Run after large batch deletions or updates"
echo -e "- Run before backup for smaller backup files"
echo -e "- Schedule during low-usage periods\n"

exit 0
