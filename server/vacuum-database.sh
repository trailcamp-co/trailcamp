#!/bin/bash
# TrailCamp Database Vacuum & Optimization Script
# Reclaims space and optimizes performance

set -e

# Configuration
DB_PATH="./trailcamp.db"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Database Maintenance${NC}"
echo -e "${BLUE}    $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found: ${DB_PATH}${NC}"
    exit 1
fi

# 1. Pre-maintenance checks
echo -e "${YELLOW}Running pre-maintenance checks...${NC}\n"

# Database size before
SIZE_BEFORE=$(du -h "${DB_PATH}" | cut -f1)
SIZE_BEFORE_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null || echo "0")
echo -e "Current database size: ${BLUE}${SIZE_BEFORE}${NC}"

# Integrity check
echo -e "\nChecking database integrity..."
INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" 2>&1)

if [ "$INTEGRITY" = "ok" ]; then
    echo -e "${GREEN}✓ Integrity check passed${NC}"
else
    echo -e "${RED}✗ Integrity check failed:${NC}"
    echo "$INTEGRITY"
    echo -e "\n${RED}Aborting maintenance. Fix integrity issues first.${NC}"
    exit 1
fi

# Record counts
LOCATIONS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations;")
TRIPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips;")
TRIP_STOPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trip_stops;")

echo -e "\nRecord counts:"
echo -e "  Locations:   ${LOCATIONS}"
echo -e "  Trips:       ${TRIPS}"
echo -e "  Trip stops:  ${TRIP_STOPS}"

# 2. Backup before maintenance
echo -e "\n${YELLOW}Creating safety backup...${NC}"
BACKUP_FILE="${DB_PATH}.pre-vacuum-$(date +%Y%m%d-%H%M%S)"
cp "${DB_PATH}" "${BACKUP_FILE}"
echo -e "${GREEN}✓ Backup created: $(basename ${BACKUP_FILE})${NC}"

# 3. Run VACUUM
echo -e "\n${YELLOW}Running VACUUM...${NC}"
echo -e "(This may take a few moments)"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "VACUUM;" 2>&1
END_TIME=$(date +%s)
VACUUM_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ VACUUM completed (${VACUUM_DURATION}s)${NC}"

# 4. Run ANALYZE
echo -e "\n${YELLOW}Running ANALYZE...${NC}"
echo -e "(Updating query optimizer statistics)"

START_TIME=$(date +%s)
sqlite3 "${DB_PATH}" "ANALYZE;" 2>&1
END_TIME=$(date +%s)
ANALYZE_DURATION=$((END_TIME - START_TIME))

echo -e "${GREEN}✓ ANALYZE completed (${ANALYZE_DURATION}s)${NC}"

# 5. Post-maintenance checks
echo -e "\n${YELLOW}Running post-maintenance checks...${NC}\n"

# Database size after
SIZE_AFTER=$(du -h "${DB_PATH}" | cut -f1)
SIZE_AFTER_BYTES=$(stat -f%z "${DB_PATH}" 2>/dev/null || stat -c%s "${DB_PATH}" 2>/dev/null || echo "0")
SAVED_BYTES=$((SIZE_BEFORE_BYTES - SIZE_AFTER_BYTES))
SAVED_MB=$((SAVED_BYTES / 1024 / 1024))

if [ $SAVED_BYTES -gt 0 ]; then
    PERCENT_SAVED=$((SAVED_BYTES * 100 / SIZE_BEFORE_BYTES))
    echo -e "Database size: ${SIZE_BEFORE} → ${BLUE}${SIZE_AFTER}${NC}"
    echo -e "${GREEN}✓ Reclaimed ${SAVED_MB}MB (${PERCENT_SAVED}% reduction)${NC}"
elif [ $SAVED_BYTES -lt 0 ]; then
    GROWTH_BYTES=$((-SAVED_BYTES))
    GROWTH_MB=$((GROWTH_BYTES / 1024 / 1024))
    echo -e "Database size: ${SIZE_BEFORE} → ${BLUE}${SIZE_AFTER}${NC}"
    echo -e "${YELLOW}⚠ Database grew by ${GROWTH_MB}MB (normal after VACUUM)${NC}"
else
    echo -e "Database size: ${BLUE}${SIZE_AFTER}${NC} (no change)"
fi

# Verify integrity after
echo -e "\nVerifying integrity after maintenance..."
INTEGRITY_AFTER=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;" 2>&1)

if [ "$INTEGRITY_AFTER" = "ok" ]; then
    echo -e "${GREEN}✓ Post-maintenance integrity check passed${NC}"
else
    echo -e "${RED}✗ Post-maintenance integrity check failed!${NC}"
    echo "$INTEGRITY_AFTER"
    echo -e "\n${YELLOW}Restoring from backup...${NC}"
    cp "${BACKUP_FILE}" "${DB_PATH}"
    echo -e "${GREEN}✓ Database restored from backup${NC}"
    exit 1
fi

# Verify record counts unchanged
LOCATIONS_AFTER=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations;")
TRIPS_AFTER=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips;")
TRIP_STOPS_AFTER=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trip_stops;")

if [ "$LOCATIONS" = "$LOCATIONS_AFTER" ] && [ "$TRIPS" = "$TRIPS_AFTER" ] && [ "$TRIP_STOPS" = "$TRIP_STOPS_AFTER" ]; then
    echo -e "${GREEN}✓ All record counts verified${NC}"
else
    echo -e "${RED}✗ Record count mismatch after maintenance!${NC}"
    echo -e "  Locations: ${LOCATIONS} → ${LOCATIONS_AFTER}"
    echo -e "  Trips: ${TRIPS} → ${TRIPS_AFTER}"
    echo -e "  Trip stops: ${TRIP_STOPS} → ${TRIP_STOPS_AFTER}"
    echo -e "\n${YELLOW}Restoring from backup...${NC}"
    cp "${BACKUP_FILE}" "${DB_PATH}"
    echo -e "${GREEN}✓ Database restored from backup${NC}"
    exit 1
fi

# 6. Cleanup backup
echo -e "\n${YELLOW}Cleaning up...${NC}"
rm "${BACKUP_FILE}"
echo -e "${GREEN}✓ Safety backup removed${NC}"

# 7. Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Maintenance Summary${NC}\n"

echo -e "Operations performed:"
echo -e "  ${GREEN}✓${NC} VACUUM (${VACUUM_DURATION}s)"
echo -e "  ${GREEN}✓${NC} ANALYZE (${ANALYZE_DURATION}s)"
echo -e "  ${GREEN}✓${NC} Integrity verification"

echo -e "\nResults:"
if [ $SAVED_BYTES -gt 0 ]; then
    echo -e "  Space reclaimed: ${GREEN}${SAVED_MB}MB${NC}"
else
    echo -e "  Space reclaimed: 0MB"
fi
echo -e "  Database size:   ${SIZE_AFTER}"
echo -e "  Data integrity:  ${GREEN}OK${NC}"

echo -e "\n${GREEN}✅ Database maintenance complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Recommendations
echo -e "${YELLOW}Recommendations:${NC}"
echo -e "  • Run this script monthly for optimal performance"
echo -e "  • Add to cron: 0 3 1 * * (1st of month at 3am)"
echo -e "  • Always backup before running (script does this automatically)"
echo ""

exit 0
