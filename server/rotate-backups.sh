#!/bin/bash
# Backup Rotation Script for TrailCamp
# Retention: Daily (7 days), Weekly (4 weeks), Monthly (12 months)

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="./backups"
DAILY_RETENTION=7      # days
WEEKLY_RETENTION=28    # days (4 weeks)
MONTHLY_RETENTION=365  # days (12 months)

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Backup Rotation${NC}"
echo -e "${BLUE}    $(date +"%Y-%m-%d %H:%M:%S")${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}/daily"
mkdir -p "${BACKUP_DIR}/weekly"
mkdir -p "${BACKUP_DIR}/monthly"

# Stats
PROMOTED_WEEKLY=0
PROMOTED_MONTHLY=0
DELETED_DAILY=0
DELETED_WEEKLY=0
DELETED_MONTHLY=0

# 1. Promote daily backups to weekly (if today is Sunday)
echo -e "${BLUE}━━━ 1. Checking for Weekly Promotion ━━━${NC}\n"

if [ "$(date +%u)" -eq 7 ]; then
    echo "Today is Sunday — promoting latest daily backup to weekly"
    
    LATEST_DAILY=$(ls -t "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | head -1)
    
    if [ -n "$LATEST_DAILY" ]; then
        FILENAME=$(basename "$LATEST_DAILY")
        cp "$LATEST_DAILY" "${BACKUP_DIR}/weekly/$FILENAME"
        echo -e "${GREEN}✓ Promoted: $FILENAME${NC}"
        PROMOTED_WEEKLY=1
    else
        echo "No daily backups to promote"
    fi
else
    echo "Not Sunday — skipping weekly promotion"
fi

# 2. Promote daily backups to monthly (if today is 1st of month)
echo -e "\n${BLUE}━━━ 2. Checking for Monthly Promotion ━━━${NC}\n"

if [ "$(date +%d)" -eq 1 ]; then
    echo "Today is 1st of month — promoting latest daily backup to monthly"
    
    LATEST_DAILY=$(ls -t "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | head -1)
    
    if [ -n "$LATEST_DAILY" ]; then
        FILENAME=$(basename "$LATEST_DAILY")
        cp "$LATEST_DAILY" "${BACKUP_DIR}/monthly/$FILENAME"
        echo -e "${GREEN}✓ Promoted: $FILENAME${NC}"
        PROMOTED_MONTHLY=1
    else
        echo "No daily backups to promote"
    fi
else
    echo "Not 1st of month — skipping monthly promotion"
fi

# 3. Clean up old daily backups (older than 7 days)
echo -e "\n${BLUE}━━━ 3. Cleaning Daily Backups (>${DAILY_RETENTION} days) ━━━${NC}\n"

while IFS= read -r -d '' backup; do
    rm -f "$backup"
    echo "Deleted: $(basename "$backup")"
    DELETED_DAILY=$((DELETED_DAILY + 1))
done < <(find "${BACKUP_DIR}" -maxdepth 1 -name "trailcamp-backup-*.sql" -type f -mtime +${DAILY_RETENTION} -print0)

if [ $DELETED_DAILY -eq 0 ]; then
    echo "No old daily backups to delete"
fi

# 4. Clean up old weekly backups (older than 4 weeks)
echo -e "\n${BLUE}━━━ 4. Cleaning Weekly Backups (>${WEEKLY_RETENTION} days) ━━━${NC}\n"

while IFS= read -r -d '' backup; do
    rm -f "$backup"
    echo "Deleted: $(basename "$backup")"
    DELETED_WEEKLY=$((DELETED_WEEKLY + 1))
done < <(find "${BACKUP_DIR}/weekly" -name "trailcamp-backup-*.sql" -type f -mtime +${WEEKLY_RETENTION} -print0)

if [ $DELETED_WEEKLY -eq 0 ]; then
    echo "No old weekly backups to delete"
fi

# 5. Clean up old monthly backups (older than 12 months)
echo -e "\n${BLUE}━━━ 5. Cleaning Monthly Backups (>${MONTHLY_RETENTION} days) ━━━${NC}\n"

while IFS= read -r -d '' backup; do
    rm -f "$backup"
    echo "Deleted: $(basename "$backup")"
    DELETED_MONTHLY=$((DELETED_MONTHLY + 1))
done < <(find "${BACKUP_DIR}/monthly" -name "trailcamp-backup-*.sql" -type f -mtime +${MONTHLY_RETENTION} -print0)

if [ $DELETED_MONTHLY -eq 0 ]; then
    echo "No old monthly backups to delete"
fi

# 6. Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Backup Rotation Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Summary:"
echo "  Promoted to weekly:  $PROMOTED_WEEKLY"
echo "  Promoted to monthly: $PROMOTED_MONTHLY"
echo "  Deleted daily:       $DELETED_DAILY"
echo "  Deleted weekly:      $DELETED_WEEKLY"
echo "  Deleted monthly:     $DELETED_MONTHLY"

# Current backup counts
DAILY_COUNT=$(ls -1 "${BACKUP_DIR}"/trailcamp-backup-*.sql 2>/dev/null | wc -l | xargs)
WEEKLY_COUNT=$(ls -1 "${BACKUP_DIR}/weekly"/trailcamp-backup-*.sql 2>/dev/null | wc -l | xargs)
MONTHLY_COUNT=$(ls -1 "${BACKUP_DIR}/monthly"/trailcamp-backup-*.sql 2>/dev/null | wc -l | xargs)

echo ""
echo "Current backup counts:"
echo "  Daily:   ${DAILY_COUNT} (last ${DAILY_RETENTION} days)"
echo "  Weekly:  ${WEEKLY_COUNT} (last ${WEEKLY_RETENTION} days)"
echo "  Monthly: ${MONTHLY_COUNT} (last ${MONTHLY_RETENTION} days)"
echo ""
