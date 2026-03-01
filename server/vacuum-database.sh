#!/bin/bash
# TrailCamp Database Vacuum & Optimization
# Reclaims unused space and optimizes query performance

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
echo -e "${BLUE}    TrailCamp Database Vacuum & Optimization${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found: ${DB_PATH}${NC}\n"
    exit 1
fi

# Get initial size
INITIAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
echo -e "Initial database size: ${INITIAL_SIZE}\n"

# Step 1: Integrity check
echo -e "${BLUE}━━━ 1. Integrity Check ━━━${NC}\n"
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" | head -1)

if [ "${INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Database integrity: OK${NC}\n"
else
    echo -e "${RED}✗ Database integrity check FAILED${NC}"
    echo -e "${RED}Result: ${INTEGRITY}${NC}"
    echo -e "${YELLOW}⚠️  Do NOT vacuum a corrupted database!${NC}\n"
    exit 1
fi

# Step 2: VACUUM (reclaim space)
echo -e "${BLUE}━━━ 2. VACUUM (Reclaim Space) ━━━${NC}\n"
echo "Running VACUUM..."

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;" 2>&1
END_TIME=$(date +%s)
VACUUM_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed in ${VACUUM_TIME}s${NC}\n"

# Step 3: ANALYZE (update query planner statistics)
echo -e "${BLUE}━━━ 3. ANALYZE (Update Statistics) ━━━${NC}\n"
echo "Running ANALYZE..."

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "ANALYZE;" 2>&1
END_TIME=$(date +%s)
ANALYZE_TIME=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ ANALYZE completed in ${ANALYZE_TIME}s${NC}\n"

# Get final size
FINAL_SIZE=$(du -h "${DB_PATH}" | cut -f1)
FINAL_BYTES=$(du -b "${DB_PATH}" | cut -f1)
INITIAL_BYTES=$(du -b "${DB_PATH}.bak" 2>/dev/null | cut -f1 || echo "0")

# If we have a recent backup, calculate space saved
if [ -f "${DB_PATH}.bak" ]; then
    SAVED_BYTES=$((INITIAL_BYTES - FINAL_BYTES))
    SAVED_MB=$((SAVED_BYTES / 1048576))
    
    if [ ${SAVED_BYTES} -gt 0 ]; then
        SAVED_PCT=$((SAVED_BYTES * 100 / INITIAL_BYTES))
        echo -e "${GREEN}✓ Space reclaimed: ${SAVED_MB}MB (${SAVED_PCT}%)${NC}\n"
    else
        echo -e "${YELLOW}ℹ No space reclaimed (database was already optimized)${NC}\n"
    fi
    rm -f "${DB_PATH}.bak"
fi

# Step 4: Verify
echo -e "${BLUE}━━━ 4. Post-Vacuum Verification ━━━${NC}\n"

# Quick query test
LOCATION_COUNT=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations;")
echo -e "Location count: ${LOCATION_COUNT}"

# Re-check integrity
POST_INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" | head -1)
if [ "${POST_INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Post-vacuum integrity: OK${NC}\n"
else
    echo -e "${RED}✗ Post-vacuum integrity check FAILED${NC}\n"
    exit 1
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"
echo -e "  Initial size:     ${INITIAL_SIZE}"
echo -e "  Final size:       ${FINAL_SIZE}"
echo -e "  VACUUM time:      ${VACUUM_TIME}s"
echo -e "  ANALYZE time:     ${ANALYZE_TIME}s"
echo -e "\n${GREEN}✅ Database optimized successfully${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Recommendations:${NC}"
echo -e "  • Run VACUUM monthly or after large data changes"
echo -e "  • Run ANALYZE weekly or after schema changes"
echo -e "  • Always backup before VACUUM (vacuum-database.sh creates auto backup)\n"
