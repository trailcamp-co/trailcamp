#!/bin/bash
# TrailCamp Database Backup Script
# Exports SQLite database to timestamped .sql file
# Usage: ./backup-database.sh

set -e  # Exit on error

# Configuration
DB_PATH="./trailcamp.db"
BACKUP_DIR="./backups"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/trailcamp-backup-${TIMESTAMP}.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}Error: Database not found at ${DB_PATH}${NC}"
    exit 1
fi

# Export database to SQL dump
echo -e "${YELLOW}Creating backup: ${BACKUP_FILE}${NC}"
sqlite3 "${DB_PATH}" ".dump" > "${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ Backup created successfully (${FILE_SIZE})${NC}"
else
    echo -e "${RED}Error: Backup file was not created${NC}"
    exit 1
fi

# Clean up old backups (older than RETENTION_DAYS)
echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
DELETED_COUNT=0

while IFS= read -r -d '' old_backup; do
    rm -f "${old_backup}"
    DELETED_COUNT=$((DELETED_COUNT + 1))
    echo -e "  Deleted: $(basename "${old_backup}")"
done < <(find "${BACKUP_DIR}" -name "trailcamp-backup-*.sql" -type f -mtime +${RETENTION_DAYS} -print0)

if [ ${DELETED_COUNT} -eq 0 ]; then
    echo -e "  No old backups to delete"
fi

# Show current backup count
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | wc -l | xargs)
echo -e "${GREEN}✓ Backup complete. Total backups: ${BACKUP_COUNT}${NC}"

# Optional: Show backup list
echo -e "\n${YELLOW}Recent backups:${NC}"
ls -lh "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | tail -5 || echo "  No backups found"

exit 0
