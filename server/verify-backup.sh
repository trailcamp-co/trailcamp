#!/bin/bash
# TrailCamp Backup Verification Tool
# Tests that backups can be successfully restored

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
BACKUP_DIR="./backups"
TEST_DB="/tmp/trailcamp-verify-$$.db"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Backup Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Find most recent backup
LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | head -1)

if [ -z "${LATEST_BACKUP}" ]; then
    echo -e "${RED}✗ No backup files found in ${BACKUP_DIR}${NC}\n"
    exit 1
fi

BACKUP_NAME=$(basename "${LATEST_BACKUP}")
BACKUP_SIZE=$(du -h "${LATEST_BACKUP}" | cut -f1)

echo -e "Testing backup: ${BACKUP_NAME}"
echo -e "Backup size:    ${BACKUP_SIZE}\n"

# Clean up any previous test database
rm -f "${TEST_DB}"

# Restore backup to test database
echo -e "${YELLOW}Restoring backup to test database...${NC}"

if sqlite3 "${TEST_DB}" < "${LATEST_BACKUP}" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup restored successfully${NC}\n"
else
    echo -e "${RED}✗ Backup restoration failed${NC}\n"
    rm -f "${TEST_DB}"
    exit 1
fi

# Run integrity check on restored database
echo -e "${YELLOW}Running integrity check...${NC}"
INTEGRITY=$(sqlite3 "${TEST_DB}" "PRAGMA integrity_check;" 2>/dev/null || echo "FAILED")

if [ "${INTEGRITY}" = "ok" ]; then
    echo -e "${GREEN}✓ Integrity check passed${NC}\n"
else
    echo -e "${RED}✗ Integrity check failed: ${INTEGRITY}${NC}\n"
    rm -f "${TEST_DB}"
    exit 1
fi

# Compare row counts with original database
echo -e "${YELLOW}Comparing with original database...${NC}\n"

TABLES="locations trips trip_stops"
ALL_MATCH=true

for TABLE in ${TABLES}; do
    ORIGINAL_COUNT=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null || echo "0")
    RESTORED_COUNT=$(sqlite3 "${TEST_DB}" "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null || echo "0")
    
    if [ "${ORIGINAL_COUNT}" = "${RESTORED_COUNT}" ]; then
        echo -e "${GREEN}✓${NC} ${TABLE}: ${ORIGINAL_COUNT} rows (match)"
    else
        echo -e "${RED}✗${NC} ${TABLE}: Original=${ORIGINAL_COUNT}, Restored=${RESTORED_COUNT} (MISMATCH)"
        ALL_MATCH=false
    fi
done

echo ""

# Compare schema
echo -e "${YELLOW}Verifying schema integrity...${NC}"

ORIGINAL_SCHEMA=$(sqlite3 "${DB_PATH}" ".schema locations" 2>/dev/null | shasum)
RESTORED_SCHEMA=$(sqlite3 "${TEST_DB}" ".schema locations" 2>/dev/null | shasum)

if [ "${ORIGINAL_SCHEMA}" = "${RESTORED_SCHEMA}" ]; then
    echo -e "${GREEN}✓ Schema matches${NC}\n"
else
    echo -e "${RED}✗ Schema mismatch detected${NC}\n"
    ALL_MATCH=false
fi

# Clean up test database
rm -f "${TEST_DB}"

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

if [ "${ALL_MATCH}" = true ]; then
    echo -e "${GREEN}✅ BACKUP VERIFICATION PASSED${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    echo -e "Backup: ${BACKUP_NAME}"
    echo -e "Status: Valid and restorable"
    echo -e "Date:   $(date)\n"
    exit 0
else
    echo -e "${RED}❌ BACKUP VERIFICATION FAILED${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    echo -e "${YELLOW}Warning: Backup may be corrupted or incomplete${NC}"
    echo -e "Recommend creating a fresh backup:\n"
    echo -e "  ./backup-database.sh\n"
    exit 1
fi
