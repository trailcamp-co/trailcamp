#!/bin/bash
# Migration Rollback System for TrailCamp
# Safely rollback database migrations

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
echo -e "${BLUE}    TrailCamp Migration Rollback System${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if migrations directory exists
if [ ! -d "${MIGRATIONS_DIR}" ]; then
    echo -e "${RED}✗ Migrations directory not found: ${MIGRATIONS_DIR}${NC}\n"
    exit 1
fi

# List available migrations
echo -e "${BLUE}Available migrations:${NC}\n"
ls -1 "${MIGRATIONS_DIR}"/*.sql 2>/dev/null | while read migration; do
    basename "$migration"
done

echo ""

# Get migration number to rollback
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./rollback-migration.sh <migration_number>${NC}"
    echo -e "Example: ./rollback-migration.sh 003\n"
    exit 1
fi

MIGRATION_NUM="$1"
UP_FILE="${MIGRATIONS_DIR}/${MIGRATION_NUM}_*.sql"
DOWN_FILE="${MIGRATIONS_DIR}/${MIGRATION_NUM}_*_down.sql"

# Find matching files
UP_FILES=$(ls ${UP_FILE} 2>/dev/null | grep -v "_down.sql" || true)
DOWN_FILES=$(ls ${DOWN_FILE} 2>/dev/null || true)

if [ -z "$UP_FILES" ]; then
    echo -e "${RED}✗ Migration ${MIGRATION_NUM} not found${NC}\n"
    exit 1
fi

UP_FILE_PATH=$(echo $UP_FILES | head -n 1)
UP_FILE_NAME=$(basename "$UP_FILE_PATH")

echo -e "${BLUE}Migration to rollback:${NC} ${UP_FILE_NAME}\n"

# Check if rollback file exists
if [ -n "$DOWN_FILES" ]; then
    # Use existing down migration
    DOWN_FILE_PATH=$(echo $DOWN_FILES | head -n 1)
    DOWN_FILE_NAME=$(basename "$DOWN_FILE_PATH")
    echo -e "${GREEN}✓ Found rollback file: ${DOWN_FILE_NAME}${NC}\n"
else
    # Try to generate rollback automatically
    echo -e "${YELLOW}⚠ No rollback file found${NC}"
    echo -e "${YELLOW}Attempting to auto-generate rollback SQL...${NC}\n"
    
    # Create down migration file
    DOWN_FILE_PATH="${UP_FILE_PATH%.sql}_down.sql"
    
    # Generate rollback SQL based on common patterns
    cat > "$DOWN_FILE_PATH" << 'ROLLBACK'
-- Auto-generated rollback for migration
-- REVIEW THIS FILE BEFORE RUNNING!

-- Common rollback patterns:
-- 
-- To undo ALTER TABLE ADD COLUMN:
-- ALTER TABLE table_name DROP COLUMN column_name;
--
-- To undo CREATE INDEX:
-- DROP INDEX index_name;
--
-- To undo CREATE TABLE:
-- DROP TABLE table_name;
--
-- To undo CREATE TRIGGER:
-- DROP TRIGGER trigger_name;
--
-- To undo INSERT:
-- DELETE FROM table_name WHERE <condition>;
--
-- To undo UPDATE:
-- UPDATE table_name SET column = old_value WHERE <condition>;

-- TODO: Add specific rollback commands for this migration
-- Review the up migration and write the inverse operations:

ROLLBACK
    
    # Append comments about the original migration
    echo "-- Original migration: ${UP_FILE_NAME}" >> "$DOWN_FILE_PATH"
    echo "-- " >> "$DOWN_FILE_PATH"
    echo "-- Review the original migration and add rollback SQL above" >> "$DOWN_FILE_PATH"
    
    echo -e "${YELLOW}✓ Created template rollback file: $(basename "$DOWN_FILE_PATH")${NC}"
    echo -e "${RED}⚠ MANUAL REVIEW REQUIRED${NC}\n"
    echo -e "Edit ${DOWN_FILE_PATH} and add the rollback SQL, then run again.\n"
    exit 1
fi

# Confirm with user
echo -e "${YELLOW}WARNING: This will rollback migration ${MIGRATION_NUM}${NC}"
echo -e "${YELLOW}This action modifies the database schema.${NC}\n"
echo -e "Rollback file: ${DOWN_FILE_NAME}\n"

read -p "Continue with rollback? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "\n${YELLOW}Rollback cancelled${NC}\n"
    exit 0
fi

# Create backup before rollback
echo -e "\n${BLUE}Creating backup before rollback...${NC}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/pre-rollback-${MIGRATION_NUM}-${TIMESTAMP}.sql"

mkdir -p "${BACKUP_DIR}"
sqlite3 "${DB_PATH}" ".dump" > "${BACKUP_FILE}"
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo -e "${GREEN}✓ Backup created: $(basename "$BACKUP_FILE") (${BACKUP_SIZE})${NC}\n"

# Run rollback
echo -e "${BLUE}Executing rollback...${NC}\n"

if sqlite3 "${DB_PATH}" < "${DOWN_FILE_PATH}"; then
    echo -e "\n${GREEN}✓ Rollback completed successfully${NC}\n"
    
    # Verify database integrity
    INTEGRITY=$(sqlite3 "${DB_PATH}" "PRAGMA integrity_check;")
    if [ "$INTEGRITY" = "ok" ]; then
        echo -e "${GREEN}✓ Database integrity check: OK${NC}\n"
    else
        echo -e "${RED}✗ Database integrity check FAILED${NC}"
        echo -e "${RED}Restore from backup: ${BACKUP_FILE}${NC}\n"
        exit 1
    fi
    
    echo -e "${BLUE}Rollback summary:${NC}"
    echo -e "  Migration rolled back: ${MIGRATION_NUM}"
    echo -e "  Backup location: ${BACKUP_FILE}"
    echo -e "  Database status: OK\n"
else
    echo -e "\n${RED}✗ Rollback failed${NC}"
    echo -e "${RED}Database may be in an inconsistent state${NC}"
    echo -e "${YELLOW}Restore from backup: ${BACKUP_FILE}${NC}\n"
    exit 1
fi
