#!/bin/bash
# TrailCamp Backup Verification Tool
# Tests backup integrity by restoring to temporary database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
DB_PATH="./trailcamp.db"
TEST_DB="./test-restore.db"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Backup Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if backup directory exists
if [ ! -d "${BACKUP_DIR}" ]; then
    echo -e "${RED}✗ Backup directory not found: ${BACKUP_DIR}${NC}\n"
    exit 1
fi

# Count backups
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | wc -l | xargs)

if [ "${BACKUP_COUNT}" -eq 0 ]; then
    echo -e "${RED}✗ No backups found in ${BACKUP_DIR}${NC}\n"
    exit 1
fi

echo -e "Found ${BACKUP_COUNT} backup(s) to verify\n"

# Get current database stats for comparison
if [ -f "${DB_PATH}" ]; then
    CURRENT_LOCATIONS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations" 2>/dev/null || echo "0")
    CURRENT_TRIPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips" 2>/dev/null || echo "0")
    CURRENT_STOPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trip_stops" 2>/dev/null || echo "0")
    
    echo -e "${BLUE}Current database:${NC}"
    echo -e "  Locations:   ${CURRENT_LOCATIONS}"
    echo -e "  Trips:       ${CURRENT_TRIPS}"
    echo -e "  Trip stops:  ${CURRENT_STOPS}\n"
else
    echo -e "${YELLOW}⚠ Current database not found - skipping comparison${NC}\n"
    CURRENT_LOCATIONS="N/A"
fi

# Test each backup
TOTAL_VERIFIED=0
TOTAL_FAILED=0

echo -e "${BLUE}━━━ Verifying Backups ━━━${NC}\n"

for backup in $(ls -t "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null); do
    backup_name=$(basename "${backup}")
    backup_size=$(du -h "${backup}" | cut -f1)
    
    echo -e "Testing: ${backup_name} (${backup_size})"
    
    # Remove old test database if exists
    rm -f "${TEST_DB}"
    
    # Try to restore backup
    if sqlite3 "${TEST_DB}" < "${backup}" 2>&1 | grep -qi "error"; then
        echo -e "  ${RED}✗ FAILED - Restore errors detected${NC}\n"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        rm -f "${TEST_DB}"
        continue
    fi
    
    # Verify database integrity
    INTEGRITY=$(sqlite3 "${TEST_DB}" "PRAGMA integrity_check;" 2>/dev/null || echo "damaged")
    
    if [ "${INTEGRITY}" != "ok" ]; then
        echo -e "  ${RED}✗ FAILED - Integrity check failed${NC}"
        echo -e "    ${INTEGRITY}\n"
        TOTAL_FAILED=$((TOTAL_FAILED + 1))
        rm -f "${TEST_DB}"
        continue
    fi
    
    # Get restored database stats
    RESTORED_LOCATIONS=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM locations" 2>/dev/null || echo "0")
    RESTORED_TRIPS=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM trips" 2>/dev/null || echo "0")
    RESTORED_STOPS=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM trip_stops" 2>/dev/null || echo "0")
    
    # Compare with current database
    MATCH="✓"
    if [ "${CURRENT_LOCATIONS}" != "N/A" ]; then
        LOCATION_DIFF=$((CURRENT_LOCATIONS - RESTORED_LOCATIONS))
        if [ ${LOCATION_DIFF#-} -gt 50 ]; then  # Allow 50 location difference
            MATCH="⚠ Significant difference"
        fi
    fi
    
    echo -e "  ${GREEN}✓ PASSED${NC} - Integrity: ok, Records: ${RESTORED_LOCATIONS} locations, ${RESTORED_TRIPS} trips"
    
    if [ "${MATCH}" != "✓" ]; then
        echo -e "    ${YELLOW}${MATCH} from current DB (${LOCATION_DIFF:+diff: ${LOCATION_DIFF}})${NC}"
    fi
    
    echo ""
    
    TOTAL_VERIFIED=$((TOTAL_VERIFIED + 1))
    
    # Clean up test database
    rm -f "${TEST_DB}"
done

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo -e "Total backups:    ${BACKUP_COUNT}"
echo -e "Verified:         ${GREEN}${TOTAL_VERIFIED}${NC}"

if [ ${TOTAL_FAILED} -gt 0 ]; then
    echo -e "Failed:           ${RED}${TOTAL_FAILED}${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

if [ ${TOTAL_FAILED} -eq 0 ] && [ ${TOTAL_VERIFIED} -gt 0 ]; then
    echo -e "${GREEN}✅ All backups verified successfully!${NC}\n"
    exit 0
elif [ ${TOTAL_FAILED} -gt 0 ]; then
    echo -e "${RED}❌ ${TOTAL_FAILED} backup(s) failed verification${NC}"
    echo -e "${YELLOW}Action: Review failed backups and re-run backup script${NC}\n"
    exit 1
else
    echo -e "${YELLOW}⚠️  No backups verified${NC}\n"
    exit 1
fi
