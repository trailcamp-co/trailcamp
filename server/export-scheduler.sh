#!/bin/bash
# TrailCamp Data Export Scheduler
# Exports database to multiple formats with automatic cleanup

set -e

# Configuration
DB_PATH="./trailcamp.db"
EXPORT_DIR="./exports"
RETENTION_WEEKS=4
TIMESTAMP=$(date +"%Y-%m-%d")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Data Export Scheduler${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Create export directory structure
mkdir -p "${EXPORT_DIR}/csv"
mkdir -p "${EXPORT_DIR}/json"
mkdir -p "${EXPORT_DIR}/sql"

# Check database exists
if [ ! -f "${DB_PATH}" ]; then
    echo -e "${RED}✗ Database not found: ${DB_PATH}${NC}"
    exit 1
fi

echo -e "${YELLOW}Exporting data...${NC}\n"

# 1. SQL Dump
echo -e "📄 SQL dump..."
SQL_FILE="${EXPORT_DIR}/sql/trailcamp-${TIMESTAMP}.sql"
sqlite3 "${DB_PATH}" ".dump" > "${SQL_FILE}"
SQL_SIZE=$(du -h "${SQL_FILE}" | cut -f1)
echo -e "${GREEN}✓ ${SQL_FILE} (${SQL_SIZE})${NC}\n"

# 2. CSV Exports
echo -e "📊 CSV exports..."

# All locations
CSV_ALL="${EXPORT_DIR}/csv/locations-all-${TIMESTAMP}.csv"
sqlite3 -header -csv "${DB_PATH}" "SELECT * FROM locations ORDER BY id" > "${CSV_ALL}"
echo -e "${GREEN}✓ locations-all-${TIMESTAMP}.csv ($(du -h "${CSV_ALL}" | cut -f1))${NC}"

# Riding locations
CSV_RIDING="${EXPORT_DIR}/csv/locations-riding-${TIMESTAMP}.csv"
sqlite3 -header -csv "${DB_PATH}" "SELECT * FROM locations WHERE category = 'riding' ORDER BY id" > "${CSV_RIDING}"
echo -e "${GREEN}✓ locations-riding-${TIMESTAMP}.csv ($(du -h "${CSV_RIDING}" | cut -f1))${NC}"

# Boondocking
CSV_BOONDOCK="${EXPORT_DIR}/csv/locations-boondocking-${TIMESTAMP}.csv"
sqlite3 -header -csv "${DB_PATH}" "SELECT * FROM locations WHERE category = 'campsite' AND sub_type = 'boondocking' ORDER BY id" > "${CSV_BOONDOCK}"
echo -e "${GREEN}✓ locations-boondocking-${TIMESTAMP}.csv ($(du -h "${CSV_BOONDOCK}" | cut -f1))${NC}"

# Campgrounds
CSV_CAMPGROUNDS="${EXPORT_DIR}/csv/locations-campgrounds-${TIMESTAMP}.csv"
sqlite3 -header -csv "${DB_PATH}" "SELECT * FROM locations WHERE category = 'campsite' AND (sub_type != 'boondocking' OR sub_type IS NULL) ORDER BY id" > "${CSV_CAMPGROUNDS}"
echo -e "${GREEN}✓ locations-campgrounds-${TIMESTAMP}.csv ($(du -h "${CSV_CAMPGROUNDS}" | cut -f1))${NC}"

# Trips
CSV_TRIPS="${EXPORT_DIR}/csv/trips-${TIMESTAMP}.csv"
sqlite3 -header -csv "${DB_PATH}" "SELECT * FROM trips ORDER BY id" > "${CSV_TRIPS}"
echo -e "${GREEN}✓ trips-${TIMESTAMP}.csv ($(du -h "${CSV_TRIPS}" | cut -f1))${NC}\n"

# 3. JSON Exports
echo -e "🔗 JSON exports..."

# All locations
JSON_ALL="${EXPORT_DIR}/json/locations-all-${TIMESTAMP}.json"
sqlite3 "${DB_PATH}" << 'EOF' | jq '.' > "${JSON_ALL}"
.mode json
SELECT * FROM locations ORDER BY id;
EOF
echo -e "${GREEN}✓ locations-all-${TIMESTAMP}.json ($(du -h "${JSON_ALL}" | cut -f1))${NC}"

# Summary statistics
JSON_STATS="${EXPORT_DIR}/json/stats-${TIMESTAMP}.json"
sqlite3 "${DB_PATH}" << 'EOF' | jq '.' > "${JSON_STATS}"
.mode json
SELECT 
  (SELECT COUNT(*) FROM locations) as total_locations,
  (SELECT COUNT(*) FROM locations WHERE category = 'riding') as riding,
  (SELECT COUNT(*) FROM locations WHERE category = 'campsite') as campsites,
  (SELECT COUNT(*) FROM locations WHERE sub_type = 'boondocking') as boondocking,
  (SELECT COUNT(*) FROM trips) as trips,
  (SELECT COUNT(*) FROM trip_stops) as trip_stops,
  (SELECT SUM(distance_miles) FROM locations WHERE category = 'riding') as total_trail_miles,
  (SELECT COUNT(*) FROM locations WHERE scenery_rating >= 9) as excellent_scenery,
  (SELECT COUNT(*) FROM locations WHERE cost_per_night = 0) as free_camping;
EOF
echo -e "${GREEN}✓ stats-${TIMESTAMP}.json ($(du -h "${JSON_STATS}" | cut -f1))${NC}\n"

# 4. Cleanup old exports
echo -e "${YELLOW}Cleaning up exports older than ${RETENTION_WEEKS} weeks...${NC}"
RETENTION_DAYS=$((RETENTION_WEEKS * 7))
DELETED_COUNT=0

for dir in csv json sql; do
    while IFS= read -r -d '' old_file; do
        rm -f "${old_file}"
        DELETED_COUNT=$((DELETED_COUNT + 1))
        echo -e "  Deleted: $(basename "${old_file}")"
    done < <(find "${EXPORT_DIR}/${dir}" -type f -mtime +${RETENTION_DAYS} -print0)
done

if [ ${DELETED_COUNT} -eq 0 ]; then
    echo -e "  No old exports to delete"
fi

# 5. Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Export Summary${NC}\n"

TOTAL_SIZE=$(du -sh "${EXPORT_DIR}" | cut -f1)
FILE_COUNT=$(find "${EXPORT_DIR}" -type f | wc -l | xargs)

echo -e "Export directory: ${EXPORT_DIR}"
echo -e "Total size:       ${TOTAL_SIZE}"
echo -e "Total files:      ${FILE_COUNT}"
echo -e "Deleted old:      ${DELETED_COUNT} files"

echo -e "\n${GREEN}✅ Export complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# List exports by type
echo -e "${YELLOW}Latest exports:${NC}\n"

echo -e "SQL:"
ls -lh "${EXPORT_DIR}/sql/"*-${TIMESTAMP}.sql 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo -e "\nCSV:"
ls -lh "${EXPORT_DIR}/csv/"*-${TIMESTAMP}.csv 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo -e "\nJSON:"
ls -lh "${EXPORT_DIR}/json/"*-${TIMESTAMP}.json 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

echo ""

exit 0
