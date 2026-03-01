#!/bin/bash
# Database Vacuum Script for TrailCamp
# Runs VACUUM and ANALYZE to optimize SQLite database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

DB_PATH="./trailcamp.db"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Database Vacuum${NC}"
echo -e "${BLUE}    $(date +"%Y-%m-%d %H:%M:%S")${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# 1. Check database exists
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}✗ Database not found: $DB_PATH${NC}"
    exit 1
fi

# 2. Get initial size
BEFORE_SIZE=$(du -h "$DB_PATH" | cut -f1)
BEFORE_BYTES=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH" 2>/dev/null)

echo -e "${BLUE}━━━ 1. Database Status ━━━${NC}\n"
echo "Database: $DB_PATH"
echo "Size before: $BEFORE_SIZE"

# 3. Integrity check
echo -e "\n${BLUE}━━━ 2. Integrity Check ━━━${NC}\n"

INTEGRITY=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")

if [ "$INTEGRITY" = "ok" ]; then
    echo -e "${GREEN}✓ Integrity check passed${NC}"
else
    echo -e "${RED}✗ Integrity check FAILED:${NC}"
    echo "$INTEGRITY"
    echo -e "\n${RED}Aborting vacuum — fix integrity issues first${NC}"
    exit 1
fi

# 4. VACUUM
echo -e "\n${BLUE}━━━ 3. Running VACUUM ━━━${NC}\n"
echo "This may take a few seconds for large databases..."

START_TIME=$(date +%s)
sqlite3 "$DB_PATH" "VACUUM;"
END_TIME=$(date +%s)
VACUUM_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_DURATION}s${NC}"

# 5. ANALYZE
echo -e "\n${BLUE}━━━ 4. Running ANALYZE ━━━${NC}\n"
echo "Updating query planner statistics..."

START_TIME=$(date +%s)
sqlite3 "$DB_PATH" "ANALYZE;"
END_TIME=$(date +%s)
ANALYZE_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ ANALYZE completed in ${ANALYZE_DURATION}s${NC}"

# 6. Get final size
AFTER_SIZE=$(du -h "$DB_PATH" | cut -f1)
AFTER_BYTES=$(stat -f%z "$DB_PATH" 2>/dev/null || stat -c%s "$DB_PATH" 2>/dev/null)

# Calculate savings
SAVED_BYTES=$((BEFORE_BYTES - AFTER_BYTES))
SAVED_MB=$(echo "scale=2; $SAVED_BYTES / 1024 / 1024" | bc 2>/dev/null || echo "0")

# 7. Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Database Optimization Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Results:"
echo "  Size before:   $BEFORE_SIZE"
echo "  Size after:    $AFTER_SIZE"

if [ $SAVED_BYTES -gt 0 ]; then
    echo -e "  ${GREEN}Space saved:   ${SAVED_MB}MB${NC}"
elif [ $SAVED_BYTES -lt 0 ]; then
    ABS_SAVED=$(echo "$SAVED_BYTES" | tr -d '-')
    SAVED_MB=$(echo "scale=2; $ABS_SAVED / 1024 / 1024" | bc 2>/dev/null || echo "0")
    echo -e "  ${YELLOW}Size increased: ${SAVED_MB}MB (expected after ANALYZE)${NC}"
else
    echo "  No change"
fi

echo ""
echo "Performance:"
echo "  VACUUM:  ${VACUUM_DURATION}s"
echo "  ANALYZE: ${ANALYZE_DURATION}s"
echo ""

echo -e "${BLUE}Benefits:${NC}"
echo "  ✓ Reclaimed unused space from deleted records"
echo "  ✓ Defragmented database pages"
echo "  ✓ Updated query optimizer statistics"
echo "  ✓ Improved query performance"
echo ""
