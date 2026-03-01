# Broken Link Checker

## Overview
Verifies external_links in the database are still accessible and working.

## Quick Start

### Manual Check
```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
node check-links.js
```

### Automated Monthly Check (Cron)
```bash
# Add to crontab (run `crontab -e`)
# 15th of each month at 10:00 AM
0 10 15 * * cd /Users/nicosstrnad/Projects/trailcamp/server && node check-links.js >> ./logs/link-checker.log 2>&1
```

## How It Works

1. **Queries database** for all locations with external_links
2. **Checks each URL** using HTTP HEAD requests
3. **Follows redirects** (up to 3 hops)
4. **Reports status:**
   - ✓ 200 OK - Link works
   - ✗ 404 - Not found
   - ✗ 403 - Forbidden (may be blocking automation)
   - ✗ Timeout - No response within 10 seconds
5. **Generates report** in `reports/broken-links-YYYY-MM-DD.md`

## Rate Limiting

- **500ms delay** between requests
- **10 second timeout** per request
- **Respectful User-Agent** header

This prevents overwhelming external sites and getting blocked.

## Common Issues

### 403 Forbidden (USFS, BLM, State Sites)
**Why:** Many government sites block automated requests

**Solutions:**
1. URLs are likely still valid for human visitors
2. Consider these "soft failures" - may not need fixing
3. Manually verify a few if concerned

### 404 Not Found (ridebdr.com links)
**Why:** URLs may have changed or need specific formatting

**Fix:**
```sql
-- Update to correct ridebdr.com URL format
-- Check their site for current URL structure
UPDATE locations 
SET external_links = 'https://ridebdr.com/routes/idaho-bdr' 
WHERE external_links LIKE '%ridebdr.com/idaho-bdr%';
```

### Domain Not Found
**Why:** Website no longer exists

**Fix:**
```sql
-- Remove dead link
UPDATE locations 
SET external_links = '' 
WHERE id = <location_id>;
```

## Report Format

### Summary
- Total links checked
- Working count and percentage
- Broken count and percentage

### Broken Links Table
| Location ID | Name | Category | URL | Error |
|-------------|------|----------|-----|-------|
| 123 | Trail Name | riding | https://... | HTTP 404 |

### SQL Fix Templates
Pre-written SQL for common fixes.

## Current Results (2026-03-01)

- **Total:** 68 links
- **Working:** 20 (29%)
- **Broken:** 48 (71%)

### Breakdown of Issues:
- **ridebdr.com:** 18 broken (404) - URL format likely changed
- **USFS (fs.usda.gov):** 10 broken (403) - blocking automation
- **BLM (blm.gov):** 5 broken (404) - pages moved
- **State sites:** 4 broken (404) - pages moved
- **Other:** 11 broken (various)

## Fixing Broken Links

### Priority 1: ridebdr.com Links
These are all BDR routes - likely just need URL correction.

**Research:**
1. Visit ridebdr.com
2. Find correct URL format for routes
3. Bulk update

### Priority 2: 404 Links
These pages truly don't exist anymore.

**Options:**
1. Search for new URL (site may have moved page)
2. Remove link if resource is gone
3. Find alternative resource

### Priority 3: 403 Links
Government sites blocking automation - likely still work for humans.

**Action:** Manual spot-check a few, probably leave as-is.

## Automation

### Monthly Check
```bash
# Cron: 15th of month
0 10 15 * * cd ~/Projects/trailcamp/server && node check-links.js
```

### Email Alerts
```bash
#!/bin/bash
# Add to cron script

BROKEN=$(node check-links.js | grep "Broken:" | awk '{print $2}')

if [ $BROKEN -gt 30 ]; then
  echo "⚠️ $BROKEN broken links found - review needed"
  # Send email/Slack notification
fi
```

### Dashboard Integration
```javascript
// Add to dashboard-data.json
links: {
  total: 68,
  working: 20,
  broken: 48,
  health: 29  // % working
}
```

## Best Practices

1. **Run monthly** - Catch link rot early
2. **Prioritize user-facing** - Fix popular location links first
3. **Don't stress 403s** - Many govt sites block bots but work fine
4. **Verify before removing** - Check if URL just moved
5. **Document sources** - Note where you found working URLs

## Advanced Usage

### Check Specific Location
```javascript
// check-single-link.js
const url = 'https://example.com';
const result = await checkUrl(url);
console.log(result);
```

### Custom Timeout
Edit `check-links.js`:
```javascript
const TIMEOUT_MS = 15000;  // 15 seconds for slow sites
```

### Skip Rate Limiting (Local Testing Only)
```javascript
const DELAY_MS = 0;  // No delay - use carefully!
```

## Troubleshooting

### Script Hangs
**Issue:** Checking a slow/dead site

**Fix:** Lower timeout or kill process:
```bash
pkill -f check-links.js
```

### Too Many 403s
**Issue:** Your IP is getting blocked

**Workaround:**
1. Run less frequently
2. Increase delay between requests
3. Check manually instead

### Memory Issues
**Issue:** Too many locations

**Fix:** Check in batches:
```javascript
// Limit to 50 locations at a time
const locations = db.prepare(`
  SELECT * FROM locations 
  WHERE external_links IS NOT NULL 
  LIMIT 50 OFFSET ?
`).all(offset);
```

---

*Last updated: 2026-03-01*
*Script: check-links.js*
*Recommended: Monthly on 15th*
