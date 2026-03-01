#!/bin/bash
# Migration Rollback Script for TrailCamp
# Safely rolls back database migrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
MIGRATIONS_DIR="./migrations"
BACKUP_DIR="./backups"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Migration Rollback${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found: ${DB_PATH}${NC}\n"
    exit 1
fi

# Show available migrations
echo -e "${BLUE}Available migrations:${NC}\n"

migration_files=($(ls -1 ${MIGRATIONS_DIR}/*.sql 2>/dev/null | sort -r))

if [ ${#migration_files[@]} -eq 0 ]; then
    echo -e "${YELLOW}No migration files found in ${MIGRATIONS_DIR}${NC}\n"
    exit 1
fi

for i in "${!migration_files[@]}"; do
    migration_file=$(basename "${migration_files[$i]}")
    echo -e "  $((i+1)). ${migration_file}"
done

echo ""

# Get migration to rollback
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./rollback-migration.sh <migration-number>${NC}"
    echo -e "${YELLOW}Example: ./rollback-migration.sh 004${NC}\n"
    exit 1
fi

MIGRATION_NUM="$1"
MIGRATION_FILE="${MIGRATIONS_DIR}/${MIGRATION_NUM}_*.sql"

# Find matching migration
matching_files=($(ls ${MIGRATION_FILE} 2>/dev/null))

if [ ${#matching_files[@]} -eq 0 ]; then
    echo -e "${RED}✗ Migration ${MIGRATION_NUM} not found${NC}\n"
    exit 1
fi

MIGRATION_PATH="${matching_files[0]}"
MIGRATION_NAME=$(basename "${MIGRATION_PATH}")

echo -e "${YELLOW}Rolling back migration: ${MIGRATION_NAME}${NC}\n"

# Look for rollback SQL
ROLLBACK_FILE="${MIGRATION_PATH%.sql}_rollback.sql"

if [ ! -f "${ROLLBACK_FILE}" ]; then
    echo -e "${RED}✗ Rollback file not found: $(basename ${ROLLBACK_FILE})${NC}"
    echo -e "${YELLOW}ℹ  Create rollback SQL file to enable safe rollback${NC}\n"
    exit 1
fi

# Show rollback SQL
echo -e "${BLUE}Rollback SQL:${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}"
cat "${ROLLBACK_FILE}"
echo -e "${BLUE}─────────────────────────────────────────────────────${NC}\n"

# Confirm
read -p "Do you want to proceed with rollback? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "\n${YELLOW}Rollback cancelled${NC}\n"
    exit 0
fi

# Create backup first
echo -e "\n${YELLOW}Creating backup before rollback...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/pre-rollback-${MIGRATION_NUM}-${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"
sqlite3 "${DB_PATH}" ".dump" > "${BACKUP_FILE}"

if [ -f "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE} (${FILE_SIZE})${NC}\n"
else
    echo -e "${RED}✗ Backup failed${NC}\n"
    exit 1
fi

# Execute rollback
echo -e "${YELLOW}Executing rollback...${NC}\n"

if sqlite3 "${DB_PATH}" < "${ROLLBACK_FILE}"; then
    echo -e "\n${GREEN}✓ Rollback successful${NC}\n"
    
    # Verify database integrity
    echo -e "${YELLOW}Verifying database integrity...${NC}"
    INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check")
    
    if [ "$INTEGRITY" = "ok" ]; then
        echo -e "${GREEN}✓ Database integrity: OK${NC}\n"
    else
        echo -e "${RED}✗ Database integrity check failed: ${INTEGRITY}${NC}"
        echo -e "${YELLOW}Restore from backup: ${BACKUP_FILE}${NC}\n"
        exit 1
    fi
    
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Rollback Complete${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
    
    echo -e "Migration ${MIGRATION_NUM} rolled back successfully"
    echo -e "Backup saved: ${BACKUP_FILE}\n"
else
    echo -e "\n${RED}✗ Rollback failed${NC}"
    echo -e "${YELLOW}Database may be in inconsistent state${NC}"
    echo -e "${YELLOW}Restore from backup: ${BACKUP_FILE}${NC}\n"
    exit 1
fi
