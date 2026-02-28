# Geocoding Guide

## Overview
The `geocode-locations.js` script adds state and county information to locations by reverse geocoding their coordinates using the free OpenStreetMap Nominatim API.

## Quick Start

### Test with 10 Locations
```bash
node geocode-locations.js --limit 10 --dry-run
```

### Geocode 50 Locations
```bash
node geocode-locations.js --limit 50
```

### Geocode All Locations
```bash
node geocode-locations.js
```

⚠️ **Warning:** Processing all 6,000+ locations takes ~2 hours due to API rate limits (1 request/second).

## Features

- **Automatic column creation** - Adds `state` and `county` columns if they don't exist
- **Rate limiting** - Respects Nominatim's 1 req/sec limit
- **Error handling** - Continues on failures, reports errors at end
- **Progress tracking** - Shows real-time progress during geocoding
- **Dry run mode** - Test without updating database
- **Incremental updates** - Only processes locations missing state/county data

## Database Schema

### Added Columns
```sql
ALTER TABLE locations ADD COLUMN state VARCHAR(2);      -- US state code (CA, TX, etc.)
ALTER TABLE locations ADD COLUMN county VARCHAR(100);   -- County name
```

## Rate Limiting

- **API:** OpenStreetMap Nominatim
- **Rate limit:** 1 request per second (enforced)
- **Processing speed:** ~3,600 locations/hour max
- **6,236 locations:** ~1 hour 45 minutes total

## Usage Examples

### Test First 10
```bash
node geocode-locations.js --limit 10 --dry-run
```

**Output:**
```
DRY RUN - Starting geocoding process...
Found 10 locations to geocode

[1/10] Geocoding: Mammoth Cave National Park
  ✓ KY, Edmonson County
[2/10] Geocoding: Palo Duro Canyon State Park
  ✓ TX, Randall County
...
```

### Process in Batches
Recommended for large databases:

```bash
# Batch 1: First 500
node geocode-locations.js --limit 500

# Batch 2: Next 500
node geocode-locations.js --limit 500

# Continue until all processed
node geocode-locations.js
```

### Check Coverage
```bash
sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE state IS NOT NULL"
sqlite3 trailcamp.db "SELECT state, COUNT(*) FROM locations WHERE state IS NOT NULL GROUP BY state ORDER BY COUNT(*) DESC"
```

## Output Format

### Success
```
[1/100] Geocoding: Example Trail
  ✓ CA, Mono County
```

### Failure
```
[2/100] Geocoding: Invalid Location
  ✗ No state found
```

### Report
```
============================================================
GEOCODING REPORT
============================================================

Total processed:  100
Successful:       98
Failed:           2

────────────────────────────────────────────────────────────
ERRORS:

[123] Location Name
  ✗ No state found in geocoding result

============================================================

✓ Successfully geocoded 98 locations!

Top states by location count:
  CA: 1012
  CO: 856
  OR: 542
  WA: 498
  ...
```

## Geocoding Data Source

**API:** OpenStreetMap Nominatim  
**Endpoint:** `https://nominatim.openstreetmap.org/reverse`  
**License:** ODbL (Open Database License)  
**Attribution:** Data © OpenStreetMap contributors

## State Code Mapping

US states are converted to 2-letter codes:
- California → CA
- Texas → TX
- New York → NY
- etc.

Non-US locations retain full state/province name.

## Error Handling

### Common Errors

**"No state found in geocoding result"**
- Location may be in international waters
- Coordinates may be imprecise
- Manual review needed

**"Request timeout"**
- Network issue
- Script will retry remaining locations
- Run again to process failed locations

**"Failed to parse response"**
- API returned invalid JSON
- Temporary API issue
- Wait a few minutes and retry

### Recovery

Script only processes locations with NULL state/county, so it's safe to run multiple times:

```bash
# First run fails partway through
node geocode-locations.js

# Run again - picks up where it left off
node geocode-locations.js
```

## Performance

### Processing Time

| Locations | Time | Notes |
|-----------|------|-------|
| 10 | ~12 seconds | Testing |
| 50 | ~1 minute | Small batch |
| 500 | ~10 minutes | Medium batch |
| 1,000 | ~20 minutes | Large batch |
| 6,000+ | ~2 hours | Full database |

### Recommendations

**For testing:**
- Use `--limit 10 --dry-run`

**For production:**
- Process in batches of 500-1000
- Run during off-hours (overnight)
- Monitor progress (script shows real-time updates)

**For updates:**
- New locations only: script auto-skips existing data
- Full refresh: Clear state/county columns first

## Querying Geocoded Data

### Locations by State
```sql
SELECT state, COUNT(*) as count
FROM locations
WHERE state IS NOT NULL
GROUP BY state
ORDER BY count DESC;
```

### Locations by County
```sql
SELECT state, county, COUNT(*) as count
FROM locations
WHERE county IS NOT NULL
GROUP BY state, county
ORDER BY count DESC
LIMIT 20;
```

### Coverage Report
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN state IS NOT NULL THEN 1 ELSE 0 END) as with_state,
  ROUND(100.0 * SUM(CASE WHEN state IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 1) as pct_coverage
FROM locations;
```

### Find Missing Data
```sql
SELECT id, name, latitude, longitude
FROM locations
WHERE state IS NULL
LIMIT 20;
```

## Integration with Other Features

### Regional Filters
Once geocoded, add state-based filtering:
```sql
SELECT * FROM locations WHERE state = 'CA' AND category = 'riding';
```

### State Statistics
```sql
SELECT 
  state,
  COUNT(*) as total_locations,
  SUM(CASE WHEN category = 'riding' THEN 1 ELSE 0 END) as riding,
  SUM(CASE WHEN category = 'campsite' THEN 1 ELSE 0 END) as camping
FROM locations
WHERE state IS NOT NULL
GROUP BY state
ORDER BY total_locations DESC;
```

### County-Level Analysis
```sql
SELECT county, state, COUNT(*) as count
FROM locations
WHERE county IS NOT NULL
GROUP BY county, state
HAVING count > 10
ORDER BY count DESC;
```

## API Compliance

### Nominatim Usage Policy
✅ **Rate limit:** 1 request/second (script enforces 1.1s delay)  
✅ **User-Agent:** Set to `TrailCamp/1.0`  
✅ **Attribution:** Required if displaying data publicly  
✅ **Caching:** Results stored in database (no repeated requests)

### Fair Use
- Don't run multiple instances simultaneously
- Don't circumvent rate limiting
- Consider using local Nominatim instance for very large datasets

## Troubleshooting

### Script Stops Mid-Run
- Check network connection
- Check if API is down: https://nominatim.openstreetmap.org/status
- Run again - script resumes from NULL locations

### Incorrect State/County
- Verify coordinates are accurate
- Check OSM data for that location
- Manually update if needed:
  ```sql
  UPDATE locations SET state = 'CA', county = 'Mono County' WHERE id = 123;
  ```

### Too Slow
- Use `--limit` to process in smaller batches
- Run overnight for full database
- Consider local Nominatim instance for frequent updates

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
*API: OpenStreetMap Nominatim*
