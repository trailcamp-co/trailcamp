#!/bin/bash
# Weekly Export Scheduler for TrailCamp
# Generates all export formats for backups and external use

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DB_PATH="./trailcamp.db"
EXPORT_DIR="./exports"
TIMESTAMP=$(date +"%Y-%m-%d")
WEEK_DIR="${EXPORT_DIR}/${TIMESTAMP}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Weekly Export${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Create week directory
mkdir -p "${WEEK_DIR}"

echo -e "${YELLOW}Creating exports in: ${WEEK_DIR}${NC}\n"

# 1. CSV Exports
echo -e "${YELLOW}━━━ CSV Exports ━━━${NC}"

echo "Exporting all locations..."
sqlite3 "${DB_PATH}" -header -csv "SELECT * FROM locations ORDER BY id" > "${WEEK_DIR}/all-locations.csv"
SIZE=$(du -h "${WEEK_DIR}/all-locations.csv" | cut -f1)
echo -e "${GREEN}✓${NC} all-locations.csv (${SIZE})"

echo "Exporting riding locations..."
sqlite3 "${DB_PATH}" -header -csv "SELECT * FROM locations WHERE category = 'riding' ORDER BY id" > "${WEEK_DIR}/riding-locations.csv"
SIZE=$(du -h "${WEEK_DIR}/riding-locations.csv" | cut -f1)
echo -e "${GREEN}✓${NC} riding-locations.csv (${SIZE})"

echo "Exporting boondocking locations..."
sqlite3 "${DB_PATH}" -header -csv "SELECT * FROM locations WHERE category = 'campsite' AND sub_type = 'boondocking' ORDER BY id" > "${WEEK_DIR}/boondocking-locations.csv"
SIZE=$(du -h "${WEEK_DIR}/boondocking-locations.csv" | cut -f1)
echo -e "${GREEN}✓${NC} boondocking-locations.csv (${SIZE})"

echo "Exporting campgrounds..."
sqlite3 "${DB_PATH}" -header -csv "SELECT * FROM locations WHERE category = 'campsite' AND sub_type != 'boondocking' ORDER BY id" > "${WEEK_DIR}/campgrounds.csv"
SIZE=$(du -h "${WEEK_DIR}/campgrounds.csv" | cut -f1)
echo -e "${GREEN}✓${NC} campgrounds.csv (${SIZE})"

echo "Exporting trips..."
sqlite3 "${DB_PATH}" -header -csv "SELECT * FROM trips ORDER BY id" > "${WEEK_DIR}/trips.csv"
SIZE=$(du -h "${WEEK_DIR}/trips.csv" | cut -f1)
echo -e "${GREEN}✓${NC} trips.csv (${SIZE})"

# 2. JSON Exports
echo -e "\n${YELLOW}━━━ JSON Exports ━━━${NC}"

echo "Generating dashboard data..."
node generate-dashboard-data.js > /dev/null 2>&1
cp dashboard-data.json "${WEEK_DIR}/dashboard-data.json"
SIZE=$(du -h "${WEEK_DIR}/dashboard-data.json" | cut -f1)
echo -e "${GREEN}✓${NC} dashboard-data.json (${SIZE})"

echo "Generating health metrics..."
node generate-health-metrics.js > /dev/null 2>&1
cp health-metrics.json "${WEEK_DIR}/health-metrics.json"
SIZE=$(du -h "${WEEK_DIR}/health-metrics.json" | cut -f1)
echo -e "${GREEN}✓${NC} health-metrics.json (${SIZE})"

echo "Generating density analysis..."
node analyze-density.js > /dev/null 2>&1
cp location-density-analysis.json "${WEEK_DIR}/density-analysis.json"
SIZE=$(du -h "${WEEK_DIR}/density-analysis.json" | cut -f1)
echo -e "${GREEN}✓${NC} density-analysis.json (${SIZE})"

# 3. Statistics Reports
echo -e "\n${YELLOW}━━━ Statistics Reports ━━━${NC}"

echo "Generating trail mileage statistics..."
node analyze-trail-mileage.js > /dev/null 2>&1
cp TRAIL-MILEAGE.md "${WEEK_DIR}/trail-mileage-report.md"
echo -e "${GREEN}✓${NC} trail-mileage-report.md"

echo "Generating cost analysis..."
node analyze-costs.js > /dev/null 2>&1
cp COST-ANALYSIS.md "${WEEK_DIR}/cost-analysis-report.md"
echo -e "${GREEN}✓${NC} cost-analysis-report.md"

# 4. Database Backup
echo -e "\n${YELLOW}━━━ Database Backup ━━━${NC}"

echo "Creating SQL dump..."
sqlite3 "${DB_PATH}" .dump > "${WEEK_DIR}/database-backup.sql"
SIZE=$(du -h "${WEEK_DIR}/database-backup.sql" | cut -f1)
echo -e "${GREEN}✓${NC} database-backup.sql (${SIZE})"

# 5. Summary Stats
echo -e "\n${YELLOW}━━━ Summary ━━━${NC}"

TOTAL_LOCATIONS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations")
RIDING=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE category = 'riding'")
BOONDOCKING=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations WHERE sub_type = 'boondocking'")
TRIPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips")

cat > "${WEEK_DIR}/README.txt" << EOF
TrailCamp Export - ${TIMESTAMP}
═══════════════════════════════════════════════════════

Database Statistics:
  Total Locations: ${TOTAL_LOCATIONS}
  Riding: ${RIDING}
  Boondocking: ${BOONDOCKING}
  Trips: ${TRIPS}

Files Included:
  CSV Exports:
    - all-locations.csv
    - riding-locations.csv
    - boondocking-locations.csv
    - campgrounds.csv
    - trips.csv
  
  JSON Data:
    - dashboard-data.json
    - health-metrics.json
    - density-analysis.json
  
  Reports:
    - trail-mileage-report.md
    - cost-analysis-report.md
  
  Backup:
    - database-backup.sql

Generated: $(date)
EOF

echo -e "Total Locations: ${TOTAL_LOCATIONS}"
echo -e "Riding: ${RIDING}"
echo -e "Boondocking: ${BOONDOCKING}"
echo -e "Trips: ${TRIPS}"

# 6. Cleanup old exports (keep 4 weeks)
echo -e "\n${YELLOW}━━━ Cleanup ━━━${NC}"

DELETED=0
while IFS= read -r old_export; do
  rm -rf "${old_export}"
  DELETED=$((DELETED + 1))
  echo -e "Deleted: $(basename "${old_export}")"
done < <(find "${EXPORT_DIR}" -mindepth 1 -maxdepth 1 -type d -mtime +28)

if [ ${DELETED} -eq 0 ]; then
  echo "No old exports to delete (keeping 4 weeks)"
fi

# 7. Final Summary
EXPORT_COUNT=$(ls -1 "${WEEK_DIR}" | wc -l | xargs)
TOTAL_SIZE=$(du -sh "${WEEK_DIR}" | cut -f1)

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Export Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo -e "Location: ${WEEK_DIR}"
echo -e "Files: ${EXPORT_COUNT}"
echo -e "Total Size: ${TOTAL_SIZE}"
echo -e ""
