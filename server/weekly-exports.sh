#!/bin/bash
# Weekly Export Scheduler for TrailCamp
# Generates all export formats for backup and distribution

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
EXPORT_DIR="./exports"
TIMESTAMP=$(date +"%Y-%m-%d")
WEEKLY_DIR="${EXPORT_DIR}/weekly-${TIMESTAMP}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Weekly Export${NC}"
echo -e "${BLUE}    Date: ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Create export directory
mkdir -p "${WEEKLY_DIR}"
echo -e "${YELLOW}Export directory: ${WEEKLY_DIR}${NC}\n"

# 1. CSV Exports
echo -e "${BLUE}━━━ 1. CSV Exports ━━━${NC}\n"

echo "Exporting all locations..."
sqlite3 trailcamp.db << 'EOF' > "${WEEKLY_DIR}/all-locations.csv"
.mode csv
.headers on
SELECT * FROM locations ORDER BY category, name;
EOF
echo -e "${GREEN}✓ all-locations.csv${NC}"

echo "Exporting riding locations..."
sqlite3 trailcamp.db << 'EOF' > "${WEEKLY_DIR}/riding-locations.csv"
.mode csv
.headers on
SELECT * FROM locations WHERE category = 'riding' ORDER BY state, name;
EOF
echo -e "${GREEN}✓ riding-locations.csv${NC}"

echo "Exporting camping locations..."
sqlite3 trailcamp.db << 'EOF' > "${WEEKLY_DIR}/camping-locations.csv"
.mode csv
.headers on
SELECT * FROM locations WHERE category = 'campsite' ORDER BY state, sub_type, name;
EOF
echo -e "${GREEN}✓ camping-locations.csv${NC}"

echo "Exporting boondocking spots..."
sqlite3 trailcamp.db << 'EOF' > "${WEEKLY_DIR}/boondocking-locations.csv"
.mode csv
.headers on
SELECT * FROM locations WHERE sub_type = 'boondocking' ORDER BY state, name;
EOF
echo -e "${GREEN}✓ boondocking-locations.csv${NC}"

# 2. JSON Exports
echo -e "\n${BLUE}━━━ 2. JSON Exports ━━━${NC}\n"

echo "Generating dashboard metrics..."
node generate-dashboard-data.js > /dev/null 2>&1
cp dashboard-data.json "${WEEKLY_DIR}/dashboard-metrics.json"
echo -e "${GREEN}✓ dashboard-metrics.json${NC}"

echo "Generating health metrics..."
node generate-health-metrics.js > /dev/null 2>&1
cp health-metrics.json "${WEEKLY_DIR}/health-metrics.json"
echo -e "${GREEN}✓ health-metrics.json${NC}"

echo "Generating density analysis..."
node analyze-density.js > /dev/null 2>&1
cp location-density-analysis.json "${WEEKLY_DIR}/density-analysis.json"
echo -e "${GREEN}✓ density-analysis.json${NC}"

# 3. Database Backup
echo -e "\n${BLUE}━━━ 3. Database Backup ━━━${NC}\n"

echo "Creating SQL dump..."
sqlite3 trailcamp.db ".dump" > "${WEEKLY_DIR}/database-backup.sql"
DB_SIZE=$(du -h "${WEEKLY_DIR}/database-backup.sql" | cut -f1)
echo -e "${GREEN}✓ database-backup.sql (${DB_SIZE})${NC}"

# 4. Statistics Report
echo -e "\n${BLUE}━━━ 4. Statistics Report ━━━${NC}\n"

echo "Generating statistics..."
cat > "${WEEKLY_DIR}/export-summary.txt" << EOF
TrailCamp Weekly Export Summary
Generated: ${TIMESTAMP} $(date +"%H:%M:%S %Z")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE STATISTICS:

$(sqlite3 trailcamp.db << 'SQL'
SELECT 'Total Locations: ' || COUNT(*) FROM locations
UNION ALL
SELECT 'Riding Locations: ' || COUNT(*) FROM locations WHERE category = 'riding'
UNION ALL
SELECT 'Campsites: ' || COUNT(*) FROM locations WHERE category = 'campsite'
UNION ALL
SELECT 'Boondocking: ' || COUNT(*) FROM locations WHERE sub_type = 'boondocking'
UNION ALL
SELECT 'Trips: ' || COUNT(*) FROM trips;
SQL
)

QUALITY METRICS:
$(sqlite3 trailcamp.db << 'SQL'
SELECT 'With Scenery Ratings: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM locations), 1) || '%)' FROM locations WHERE scenery_rating IS NOT NULL
UNION ALL
SELECT 'With State Data: ' || COUNT(*) || ' (' || ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM locations), 1) || '%)' FROM locations WHERE state IS NOT NULL
UNION ALL
SELECT 'With Coordinates: ' || COUNT(*) || ' (100%)' FROM locations WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
SQL
)

TOP 5 STATES BY LOCATION COUNT:
$(sqlite3 trailcamp.db << 'SQL'
SELECT '  ' || state || ': ' || COUNT(*) || ' locations'
FROM locations
WHERE state IS NOT NULL
GROUP BY state
ORDER BY COUNT(*) DESC
LIMIT 5;
SQL
)

TRAIL MILEAGE:
$(sqlite3 trailcamp.db << 'SQL'
SELECT 'Total Trail Miles: ' || printf('%.0f', COALESCE(SUM(distance_miles), 0))
FROM locations
WHERE category = 'riding';
SQL
)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXPORTED FILES:

CSV Exports:
  - all-locations.csv
  - riding-locations.csv
  - camping-locations.csv
  - boondocking-locations.csv

JSON Exports:
  - dashboard-metrics.json
  - health-metrics.json
  - density-analysis.json

Database:
  - database-backup.sql

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For more details:
  - Data Quality: run ./check-data-quality.sh
  - Performance: run ./run-benchmarks.sh
  - Health: cat health-metrics.json

EOF

echo -e "${GREEN}✓ export-summary.txt${NC}"

# 5. Create archive
echo -e "\n${BLUE}━━━ 5. Creating Archive ━━━${NC}\n"

cd "${EXPORT_DIR}"
tar -czf "weekly-${TIMESTAMP}.tar.gz" "weekly-${TIMESTAMP}"
ARCHIVE_SIZE=$(du -h "weekly-${TIMESTAMP}.tar.gz" | cut -f1)
cd - > /dev/null

echo -e "${GREEN}✓ weekly-${TIMESTAMP}.tar.gz (${ARCHIVE_SIZE})${NC}"

# 6. Cleanup old exports (keep last 8 weeks)
echo -e "\n${BLUE}━━━ 6. Cleanup Old Exports ━━━${NC}\n"

DELETED=0
find "${EXPORT_DIR}" -name "weekly-*.tar.gz" -type f -mtime +56 -print0 | while IFS= read -r -d '' old_export; do
    echo "Deleting: $(basename ${old_export})"
    rm -f "${old_export}"
    # Also delete the directory if it exists
    dir_name=$(basename "${old_export}" .tar.gz)
    if [ -d "${EXPORT_DIR}/${dir_name}" ]; then
        rm -rf "${EXPORT_DIR}/${dir_name}"
    fi
    DELETED=$((DELETED + 1))
done

if [ ${DELETED} -eq 0 ]; then
    echo "No old exports to delete"
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Weekly Export Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

echo "Export location: ${WEEKLY_DIR}"
echo "Archive: ${EXPORT_DIR}/weekly-${TIMESTAMP}.tar.gz (${ARCHIVE_SIZE})"
echo ""
echo "View summary:"
echo "  cat ${WEEKLY_DIR}/export-summary.txt"
echo ""
