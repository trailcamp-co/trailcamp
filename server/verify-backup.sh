#!/bin/bash
# TrailCamp Backup Verification Tool
# Tests that backup files can be successfully restored

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
TEST_DB="./test-restore.db"
ORIGINAL_DB="./trailcamp.db"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Backup Verification${NC}"
echo -e "${BLUE}    $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if backups exist
if [ ! -d "${BACKUP_DIR}" ] || [ -z "$(ls -A ${BACKUP_DIR}/trailcamp-backup-*.sql 2>/dev/null)" ]; then
    echo -e "${RED}✗ No backups found in ${BACKUP_DIR}${NC}\n"
    echo -e "Run backup-database.sh to create backups first.\n"
    exit 1
fi

# Get list of backups
BACKUPS=($(ls -t ${BACKUP_DIR}/trailcamp-backup-*.sql))
BACKUP_COUNT=${#BACKUPS[@]}

echo -e "Found ${BACKUP_COUNT} backup(s) in ${BACKUP_DIR}\n"

# Test which backup to verify
BACKUP_TO_TEST=""

if [ "$1" = "--latest" ] || [ "$1" = "" ]; then
    BACKUP_TO_TEST="${BACKUPS[0]}"
    echo -e "${YELLOW}Testing latest backup: $(basename ${BACKUP_TO_TEST})${NC}\n"
elif [ "$1" = "--all" ]; then
    echo -e "${YELLOW}Testing all ${BACKUP_COUNT} backups...${NC}\n"
else
    BACKUP_TO_TEST="$1"
    if [ ! -f "${BACKUP_TO_TEST}" ]; then
        echo -e "${RED}✗ Backup file not found: ${BACKUP_TO_TEST}${NC}\n"
        exit 1
    fi
    echo -e "${YELLOW}Testing specified backup: $(basename ${BACKUP_TO_TEST})${NC}\n"
fi

# Function to test a single backup
test_backup() {
    local backup_file="$1"
    local backup_name=$(basename "${backup_file}")
    
    echo -e "${BLUE}━━━ Testing: ${backup_name} ━━━${NC}"
    
    # Clean up any existing test database
    rm -f "${TEST_DB}"
    
    # Restore backup to test database
    echo -n "  Restoring backup... "
    if sqlite3 "${TEST_DB}" < "${backup_file}" 2>/dev/null; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Restore failed${NC}"
        return 1
    fi
    
    # Verify database integrity
    echo -n "  Checking integrity... "
    integrity=$(sqlite3 "${TEST_DB}" "PRAGMA integrity_check;" 2>/dev/null)
    if [ "$integrity" = "ok" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}✗ Integrity check failed${NC}"
        echo -e "    ${integrity}"
        return 1
    fi
    
    # Count records in key tables
    echo -n "  Counting records... "
    locations_count=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM locations;" 2>/dev/null)
    trips_count=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM trips;" 2>/dev/null)
    
    if [ ! -z "$locations_count" ] && [ ! -z "$trips_count" ]; then
        echo -e "${GREEN}✓${NC}"
        echo -e "    Locations: ${locations_count}"
        echo -e "    Trips: ${trips_count}"
    else
        echo -e "${RED}✗ Could not count records${NC}"
        return 1
    fi
    
    # Verify schema
    echo -n "  Checking schema... "
    tables=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null)
    if [ "$tables" -ge "3" ]; then
        echo -e "${GREEN}✓ ${tables} tables${NC}"
    else
        echo -e "${RED}✗ Only ${tables} tables found${NC}"
        return 1
    fi
    
    # Compare with original database if it exists
    if [ -f "${ORIGINAL_DB}" ]; then
        echo -n "  Comparing with original... "
        orig_locations=$(sqlite3 "${ORIGINAL_DB}" "SELECT COUNT(*) FROM locations;" 2>/dev/null)
        orig_trips=$(sqlite3 "${ORIGINAL_DB}" "SELECT COUNT(*) FROM trips;" 2>/dev/null)
        
        # Check if counts are close (allow for recent additions)
        loc_diff=$((orig_locations - locations_count))
        
        if [ ${loc_diff#-} -le 100 ]; then  # Within 100 records is acceptable
            echo -e "${GREEN}✓${NC}"
            if [ "$loc_diff" -gt 0 ]; then
                echo -e "    ${YELLOW}Note: ${loc_diff} newer locations in current DB${NC}"
            fi
        else
            echo -e "${YELLOW}⚠ Large difference: ${loc_diff} locations${NC}"
        fi
    fi
    
    # Test a sample query
    echo -n "  Testing sample query... "
    sample=$(sqlite3 "${TEST_DB}" "SELECT name FROM locations LIMIT 1;" 2>/dev/null)
    if [ ! -z "$sample" ]; then
        echo -e "${GREEN}✓${NC}"
        echo -e "    Sample: ${sample}"
    else
        echo -e "${RED}✗ Query failed${NC}"
        return 1
    fi
    
    # Get backup file info
    backup_size=$(du -h "${backup_file}" | cut -f1)
    backup_date=$(date -r "${backup_file}" "+%Y-%m-%d %H:%M")
    
    echo -e "  ${GREEN}✓ BACKUP VALID${NC}"
    echo -e "    File size: ${backup_size}"
    echo -e "    Created: ${backup_date}"
    echo -e ""
    
    return 0
}

# Test backup(s)
TOTAL_TESTED=0
PASSED=0
FAILED=0

if [ "$1" = "--all" ]; then
    # Test all backups
    for backup in "${BACKUPS[@]}"; do
        TOTAL_TESTED=$((TOTAL_TESTED + 1))
        if test_backup "$backup"; then
            PASSED=$((PASSED + 1))
        else
            FAILED=$((FAILED + 1))
        fi
    done
else
    # Test single backup
    TOTAL_TESTED=1
    if test_backup "${BACKUP_TO_TEST}"; then
        PASSED=1
    else
        FAILED=1
    fi
fi

# Clean up test database
rm -f "${TEST_DB}"

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Verification Summary${NC}\n"

echo -e "Total tested:  ${TOTAL_TESTED}"
echo -e "Passed:        ${GREEN}${PASSED}${NC}"
echo -e "Failed:        ${FAILED}"

if [ ${FAILED} -eq 0 ]; then
    echo -e "\n${GREEN}✅ ALL BACKUPS VERIFIED${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    exit 0
else
    echo -e "\n${RED}⚠️  ${FAILED} BACKUP(S) FAILED VERIFICATION${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    exit 1
fi
