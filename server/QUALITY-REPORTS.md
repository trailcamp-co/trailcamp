# Automated Data Quality Reports

## Overview
Automated weekly data quality reports with comprehensive metrics, issue detection, and optional email notifications.

## Quick Start

### Generate Report
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./generate-quality-report.sh
```

### View Reports
```bash
# View latest text report
cat ./reports/quality-report-$(date +%Y-%m-%d).txt

# Open HTML report in browser
open ./reports/quality-report-$(date +%Y-%m-%d).html
```

## Report Contents

### 1. Executive Summary
- Database health status (HEALTHY / ISSUES DETECTED)
- Total location counts by category
- Overall quality score

### 2. Data Quality Checks
Complete results from `check-data-quality.sh`:
- Required fields validation
- Coordinate validation  
- Data integrity checks
- Foreign key integrity
- Duplicate detection
- Completeness metrics

### 3. Data Completeness Analysis
Coverage percentages for key fields:
- Scenery ratings
- State/county data
- Trail mileage (riding locations)
- Cost data (campsites)
- Permit information

### 4. Top States
Top 10 states by location count with distribution stats.

### 5. Data Integrity Issues
Automatic detection of:
- Missing permit info (when required)
- Invalid coordinates
- Missing critical fields
- Data inconsistencies

### 6. Recommendations
Actionable suggestions based on detected issues and trends.

## Output Formats

### Text Report
- Plain text format
- Perfect for email, logs, command-line viewing
- Location: `./reports/quality-report-YYYY-MM-DD.txt`

### HTML Report
- Styled HTML with tables and metrics
- Open in any web browser
- Great for sharing with team
- Location: `./reports/quality-report-YYYY-MM-DD.html`

## Example Report

```
═══════════════════════════════════════════════════════════════════
TrailCamp Weekly Data Quality Report
Generated: 2026-02-28 22:50:15 EST
═══════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────────────────────────────────────────────────────────

Database Status: ✓ HEALTHY

Total Locations: 6148
Riding Locations: 1394
Campsites: 4742
Boondocking: 639

═══════════════════════════════════════════════════════════════════
DATA QUALITY CHECKS
═══════════════════════════════════════════════════════════════════

✓ Names not null
✓ Coordinates not null
✓ Categories not null
✓ Latitudes in valid range (-90 to 90)
...
✅ ALL CHECKS PASSED (15 checks run)

═══════════════════════════════════════════════════════════════════
DATA COMPLETENESS ANALYSIS
═══════════════════════════════════════════════════════════════════

Scenery Ratings: 100.0% (6148/6148)
State Data: 99.7% (6131/6148)
Trail Mileage (riding): 100.0% (1394/1394)
Cost Data (campsites): 13.1% (622/4742)
Permit Info (when required): 95.0% (38/40)
```

## Automation

### Weekly Cron Job
```bash
# Edit crontab
crontab -e

# Add weekly quality report (Sundays at 8 AM)
0 8 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./generate-quality-report.sh >> ./logs/quality-reports.log 2>&1
```

### Email Notifications
Set environment variable to enable email:
```bash
export QUALITY_REPORT_EMAIL="your-email@example.com"

# Then run report
./generate-quality-report.sh
```

For permanent email setup, add to `~/.zshrc` or `~/.bashrc`:
```bash
echo 'export QUALITY_REPORT_EMAIL="your-email@example.com"' >> ~/.zshrc
```

### Slack Integration
Add to end of script or create wrapper:
```bash
#!/bin/bash
# send-quality-report-to-slack.sh

./generate-quality-report.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
REPORT_FILE="./reports/quality-report-$(date +%Y-%m-%d).txt"

# Extract summary
SUMMARY=$(head -20 "$REPORT_FILE" | tail -10)

curl -X POST -H 'Content-type: application/json' \
  --data "{\"text\":\"📊 Weekly Quality Report\n\`\`\`${SUMMARY}\`\`\`\"}" \
  "$WEBHOOK_URL"
```

## Monitoring Trends

### Compare Weekly Reports
```bash
# View reports from last 4 weeks
ls -lt ./reports/quality-report-*.txt | head -4

# Compare location counts over time
for file in $(ls -t ./reports/quality-report-*.txt | head -4); do
  echo "=== $(basename $file .txt) ==="
  grep "Total Locations:" "$file"
done
```

### Track Quality Score
```bash
# Extract quality metrics over time
for file in $(ls -t ./reports/quality-report-*.txt | head -8); do
  date=$(basename "$file" .txt | cut -d'-' -f3-)
  passed=$(grep -c "✓" "$file" || echo 0)
  echo "$date: $passed checks passed"
done
```

## Integration with CI/CD

### Pre-Deployment Check
```bash
#!/bin/bash
# .github/workflows/quality-check.yml

- name: Run Quality Report
  run: |
    cd server
    ./generate-quality-report.sh
    if [ $? -ne 0 ]; then
      echo "Quality checks failed - blocking deployment"
      exit 1
    fi
```

### Automated PR Comments
```yaml
# Post quality report to PR comments
- name: Post Quality Report
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('./server/reports/quality-report-*.txt', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        body: '## Quality Report\n```\n' + report + '\n```'
      });
```

## Use Cases

### 1. Weekly Team Updates
- Email report to team every Monday
- Review trends and plan improvements
- Celebrate quality improvements

### 2. Data Quality Monitoring
- Track completeness over time
- Detect regressions early
- Identify data gaps

### 3. Compliance Documentation
- Generate reports for audits
- Demonstrate data governance
- Track quality improvements

### 4. Onboarding New Contributors
- Show current data quality state
- Identify areas needing help
- Provide clear improvement targets

## Troubleshooting

### Email Not Sending
```bash
# Check if mail command exists
command -v mail

# Test email manually
echo "Test" | mail -s "Test Subject" your-email@example.com

# Check QUALITY_REPORT_EMAIL is set
echo $QUALITY_REPORT_EMAIL
```

### HTML Report Not Rendering
- Open in different browser
- Check file permissions
- Verify file isn't corrupted: `cat report.html | head`

### Old Reports Accumulating
Add cleanup to script or cron:
```bash
# Keep only last 12 weeks of reports
find ./reports -name "quality-report-*.txt" -mtime +84 -delete
find ./reports -name "quality-report-*.html" -mtime +84 -delete
```

## Customization

### Add Custom Checks
Edit `generate-quality-report.sh` and add to the integrity section:
```bash
# Custom check example
CUSTOM_ISSUE=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE ...")
if [ "$CUSTOM_ISSUE" -gt 0 ]; then
    echo "⚠ ${CUSTOM_ISSUE} locations have custom issue" >> "${REPORT_FILE}"
fi
```

### Modify Email Template
Edit the report generation section to customize format:
```bash
# Shorter email version
cat > "${REPORT_FILE}" << EOF
Quality Report $(date +%Y-%m-%d)
Status: $(if [ $QUALITY_EXIT -eq 0 ]; then echo "OK"; else echo "ISSUES"; fi)
Total: $(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations")
Issues: ${ISSUES_FOUND}
EOF
```

### Change Report Frequency
- Daily: `0 8 * * *` (every day 8 AM)
- Bi-weekly: `0 8 */14 * *` (every 14 days)
- Monthly: `0 8 1 * *` (1st of month)

---

*Last updated: 2026-02-28*
*Script: generate-quality-report.sh*
*Report directory: server/reports/*
