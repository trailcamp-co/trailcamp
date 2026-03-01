#!/bin/bash
# Generate Weekly Data Quality Report for TrailCamp

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPORT_DIR="./reports"
TIMESTAMP=$(date +"%Y-%m-%d")
REPORT_FILE="${REPORT_DIR}/quality-report-${TIMESTAMP}.txt"
HTML_FILE="${REPORT_DIR}/quality-report-${TIMESTAMP}.html"

mkdir -p "${REPORT_DIR}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Data Quality Report${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Run data quality check and capture output
echo "Running comprehensive data quality checks..."
./check-data-quality.sh > /tmp/quality-check.txt 2>&1
QUALITY_EXIT=$?

# Generate text report
cat > "${REPORT_FILE}" << EOF
═══════════════════════════════════════════════════════════════════
TrailCamp Weekly Data Quality Report
Generated: ${TIMESTAMP} $(date +"%H:%M:%S %Z")
═══════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────

Database Status: $(if [ $QUALITY_EXIT -eq 0 ]; then echo "✓ HEALTHY"; else echo "✗ ISSUES DETECTED"; fi)

EOF

# Add database statistics
sqlite3 trailcamp.db << 'SQL' >> "${REPORT_FILE}"
SELECT 'Total Locations: ' || COUNT(*) FROM locations
UNION ALL
SELECT 'Riding Locations: ' || COUNT(*) FROM locations WHERE category = 'riding'
UNION ALL
SELECT 'Campsites: ' || COUNT(*) FROM locations WHERE category = 'campsite'
UNION ALL
SELECT 'Boondocking: ' || COUNT(*) FROM locations WHERE sub_type = 'boondocking';
SQL

cat >> "${REPORT_FILE}" << 'EOF'

═══════════════════════════════════════════════════════════════════
DATA QUALITY CHECKS
═══════════════════════════════════════════════════════════════════

EOF

# Include quality check results
cat /tmp/quality-check.txt >> "${REPORT_FILE}"

# Add data completeness section
cat >> "${REPORT_FILE}" << 'EOF'

═══════════════════════════════════════════════════════════════════
DATA COMPLETENESS ANALYSIS
═══════════════════════════════════════════════════════════════════

EOF

sqlite3 trailcamp.db << 'SQL' >> "${REPORT_FILE}"
SELECT 'Scenery Ratings: ' || 
  ROUND(COUNT(CASE WHEN scenery_rating IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '% (' ||
  COUNT(CASE WHEN scenery_rating IS NOT NULL THEN 1 END) || '/' || COUNT(*) || ')'
FROM locations
UNION ALL
SELECT 'State Data: ' || 
  ROUND(COUNT(CASE WHEN state IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '% (' ||
  COUNT(CASE WHEN state IS NOT NULL THEN 1 END) || '/' || COUNT(*) || ')'
FROM locations
UNION ALL
SELECT 'Trail Mileage (riding): ' || 
  ROUND(COUNT(CASE WHEN distance_miles IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '% (' ||
  COUNT(CASE WHEN distance_miles IS NOT NULL THEN 1 END) || '/' || COUNT(*) || ')'
FROM locations WHERE category = 'riding'
UNION ALL
SELECT 'Cost Data (campsites): ' || 
  ROUND(COUNT(CASE WHEN cost_per_night IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '% (' ||
  COUNT(CASE WHEN cost_per_night IS NOT NULL THEN 1 END) || '/' || COUNT(*) || ')'
FROM locations WHERE category = 'campsite'
UNION ALL
SELECT 'Permit Info (when required): ' || 
  ROUND(COUNT(CASE WHEN permit_info IS NOT NULL AND permit_info != '' THEN 1 END) * 100.0 / COUNT(*), 1) || '% (' ||
  COUNT(CASE WHEN permit_info IS NOT NULL AND permit_info != '' THEN 1 END) || '/' || COUNT(*) || ')'
FROM locations WHERE permit_required = 1;
SQL

# Add top states
cat >> "${REPORT_FILE}" << 'EOF'

═══════════════════════════════════════════════════════════════════
TOP 10 STATES BY LOCATION COUNT
═══════════════════════════════════════════════════════════════════

EOF

sqlite3 trailcamp.db << 'SQL' >> "${REPORT_FILE}"
SELECT printf('%2d. %-3s %5d locations', 
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC),
  state, 
  COUNT(*)
)
FROM locations
WHERE state IS NOT NULL
GROUP BY state
ORDER BY COUNT(*) DESC
LIMIT 10;
SQL

# Add recent changes (if any)
cat >> "${REPORT_FILE}" << 'EOF'

═══════════════════════════════════════════════════════════════════
DATA INTEGRITY ISSUES (if any)
═══════════════════════════════════════════════════════════════════

EOF

# Check for common issues
ISSUES_FOUND=0

# Missing permit info
MISSING_PERMIT=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE permit_required = 1 AND (permit_info IS NULL OR permit_info = '')")
if [ "$MISSING_PERMIT" -gt 0 ]; then
    echo "⚠ ${MISSING_PERMIT} locations have permit_required=1 but missing permit_info" >> "${REPORT_FILE}"
    ISSUES_FOUND=1
fi

# Invalid coordinates
INVALID_COORDS=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180")
if [ "$INVALID_COORDS" -gt 0 ]; then
    echo "✗ ${INVALID_COORDS} locations have invalid coordinates" >> "${REPORT_FILE}"
    ISSUES_FOUND=1
fi

# Missing scenery ratings
MISSING_SCENERY=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE scenery_rating IS NULL")
if [ "$MISSING_SCENERY" -gt 0 ]; then
    echo "ℹ ${MISSING_SCENERY} locations missing scenery ratings" >> "${REPORT_FILE}"
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✓ No critical data integrity issues found" >> "${REPORT_FILE}"
fi

# Add footer
cat >> "${REPORT_FILE}" << 'EOF'

═══════════════════════════════════════════════════════════════════
RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════

EOF

if [ $QUALITY_EXIT -ne 0 ]; then
    echo "• Review and fix issues identified in quality checks above" >> "${REPORT_FILE}"
fi

if [ "$MISSING_PERMIT" -gt 0 ]; then
    echo "• Add permit information for ${MISSING_PERMIT} locations with permit_required=1" >> "${REPORT_FILE}"
fi

if [ "$MISSING_SCENERY" -gt 100 ]; then
    echo "• Add scenery ratings to improve user experience (${MISSING_SCENERY} locations)" >> "${REPORT_FILE}"
fi

cat >> "${REPORT_FILE}" << 'EOF'

For detailed analysis:
  • Data quality: ./check-data-quality.sh
  • Performance: ./run-benchmarks.sh  
  • Health: ./generate-health-metrics.sh

═══════════════════════════════════════════════════════════════════
Report generated by generate-quality-report.sh
═══════════════════════════════════════════════════════════════════
EOF

# Generate HTML version
cat > "${HTML_FILE}" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>TrailCamp Data Quality Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; }
        h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
        h2 { color: #1e40af; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
        .status-ok { color: #059669; font-weight: bold; }
        .status-warning { color: #d97706; font-weight: bold; }
        .status-error { color: #dc2626; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { text-align: left; padding: 10px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f3f4f6; font-weight: 600; }
        .metric { display: inline-block; padding: 8px 16px; margin: 5px; background: #f3f4f6; border-radius: 6px; }
        pre { background: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
HTMLEOF

echo "<h1>TrailCamp Data Quality Report</h1>" >> "${HTML_FILE}"
echo "<p><strong>Generated:</strong> ${TIMESTAMP} $(date +"%H:%M:%S %Z")</p>" >> "${HTML_FILE}"

if [ $QUALITY_EXIT -eq 0 ]; then
    echo "<p class=\"status-ok\">✓ Database Status: HEALTHY</p>" >> "${HTML_FILE}"
else
    echo "<p class=\"status-warning\">⚠ Database Status: ISSUES DETECTED</p>" >> "${HTML_FILE}"
fi

# Add statistics
echo "<h2>Database Statistics</h2><div>" >> "${HTML_FILE}"
sqlite3 trailcamp.db << 'SQL' | while read line; do echo "<div class=\"metric\">$line</div>"; done >> "${HTML_FILE}"
SELECT 'Total: ' || COUNT(*) FROM locations
UNION ALL
SELECT 'Riding: ' || COUNT(*) FROM locations WHERE category = 'riding'
UNION ALL
SELECT 'Campsites: ' || COUNT(*) FROM locations WHERE category = 'campsite'
UNION ALL
SELECT 'Boondocking: ' || COUNT(*) FROM locations WHERE sub_type = 'boondocking';
SQL
echo "</div>" >> "${HTML_FILE}"

# Add completeness
echo "<h2>Data Completeness</h2><table><tr><th>Field</th><th>Coverage</th></tr>" >> "${HTML_FILE}"
sqlite3 trailcamp.db << 'SQL' | sed 's/|/<\/td><td>/g' | sed 's/^/<tr><td>/' | sed 's/$/<\/td><\/tr>/' >> "${HTML_FILE}"
.mode list
SELECT 'Scenery Ratings', 
  ROUND(COUNT(CASE WHEN scenery_rating IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '%'
FROM locations
UNION ALL
SELECT 'State Data',
  ROUND(COUNT(CASE WHEN state IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '%'
FROM locations
UNION ALL  
SELECT 'Trail Mileage',
  ROUND(COUNT(CASE WHEN distance_miles IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 1) || '%'
FROM locations WHERE category = 'riding';
SQL
echo "</table>" >> "${HTML_FILE}"

echo "<div class=\"footer\">Report generated by generate-quality-report.sh</div>" >> "${HTML_FILE}"
echo "</body></html>" >> "${HTML_FILE}"

# Print summary
echo -e "\n${GREEN}✓ Quality report generated!${NC}"
echo -e "  Text: ${REPORT_FILE}"
echo -e "  HTML: ${HTML_FILE}"

if [ $QUALITY_EXIT -eq 0 ]; then
    echo -e "\n${GREEN}✓ All quality checks passed${NC}"
else
    echo -e "\n${YELLOW}⚠ Some issues detected - review report for details${NC}"
fi

# Optionally send email (if configured)
if command -v mail &> /dev/null && [ -n "${QUALITY_REPORT_EMAIL}" ]; then
    echo -e "\n${BLUE}Sending email to ${QUALITY_REPORT_EMAIL}...${NC}"
    cat "${REPORT_FILE}" | mail -s "TrailCamp Quality Report - ${TIMESTAMP}" "${QUALITY_REPORT_EMAIL}"
    echo -e "${GREEN}✓ Email sent${NC}"
fi

echo ""
