# Geocoding Guide

## Overview
The geocoding helper script reverse geocodes coordinates to get state and county names for locations in the TrailCamp database.

## Quick Start

### Check Current Coverage
```bash
node geocode-locations.js --coverage
```

### Geocode Sample (10 locations)
```bash
node geocode-locations.js --limit 10
```

### Geocode All Missing Locations
```bash
node geocode-locations.js
```

**⚠️ Note:** Geocoding all 6,000+ locations takes ~1.7 hours due to API rate limits (1 request/second).

## Usage

```bash
node geocode-locations.js [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--limit N` | Geocode only N locations (good for testing) |
| `--offset N` | Skip first N locations (for resuming batches) |
| `--coverage` | Show current state coverage and exit |
| `--help, -h` | Show help message |

### Examples

```bash
# Test with 10 locations
node geocode-locations.js --limit 10

# Geocode first 100 locations
node geocode-locations.js --limit 100

# Resume from location #500, geocode next 100
node geocode-locations.js --limit 100 --offset 500

# Check progress
node geocode-locations.js --coverage
```

## How It Works

### 1. API Service
Uses **Nominatim** (OpenStreetMap's free reverse geocoding service):
- Free to use
- No API key required  
- Rate limit: 1 request per second (automatically enforced)
- Returns detailed address information

### 2. Data Extracted
For each coordinate, extracts:
- **State** - 2-letter state code (e.g., CA, UT, AZ)
- **County** - County name (e.g., "Maricopa County")
- **Country** - 2-letter country code (defaults to US)

### 3. Database Updates
Adds extracted data to `locations` table:
```sql
ALTER TABLE locations ADD COLUMN state VARCHAR(2);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);
ALTER TABLE locations ADD COLUMN country VARCHAR(2) DEFAULT 'US';
```

Indexes created for fast state-based queries:
```sql
CREATE INDEX idx_locations_state ON locations(state);
CREATE INDEX idx_locations_country ON locations(country);
```

## Performance

| Locations | Time | Notes |
|-----------|------|-------|
| 10 | ~10 seconds | Good for testing |
| 100 | ~1.7 minutes | Small batch |
| 1,000 | ~17 minutes | Medium batch |
| 6,000+ | ~1.7 hours | Full database |

**Rate Limit:** 1 request per second (Nominatim policy, strictly enforced)

## Batch Processing Strategy

### For Large Databases

Process in manageable batches:

```bash
# Batch 1: First 500
node geocode-locations.js --limit 500

# Batch 2: Next 500
node geocode-locations.js --limit 500 --offset 500

# Batch 3: Next 500
node geocode-locations.js --limit 500 --offset 1000

# Continue until all done...
```

### Overnight Processing

Run full geocoding overnight:
```bash
nohup node geocode-locations.js > geocoding.log 2>&1 &
```

Monitor progress:
```bash
tail -f geocoding.log
```

### Resume After Interruption

If interrupted, just re-run:
```bash
node geocode-locations.js
```

Script only geocodes locations where `state IS NULL`, so it automatically resumes from where it left off.

## Error Handling

### Common Errors

**"No state found"**
- Coordinate may be in water/ocean
- Very remote location with limited OSM data
- Manually update if needed:
  ```sql
  UPDATE locations SET state = 'CA', county = 'Known County' WHERE id = 123;
  ```

**"Request timeout"**
- Network issue or API slow
- Script will continue with next location
- Re-run to retry failed locations

**"Too Many Requests"**
- Rate limit exceeded (shouldn't happen with built-in delays)
- Wait a few minutes and retry

### View Failed Locations

After geocoding, check which failed:
```sql
SELECT id, name, latitude, longitude 
FROM locations 
WHERE state IS NULL 
LIMIT 20;
```

## Querying Geocoded Data

### Locations by State
```sql
SELECT state, COUNT(*) as count 
FROM locations 
WHERE state IS NOT NULL 
GROUP BY state 
ORDER BY count DESC;
```

### Riding Locations in California
```sql
SELECT name, county, scenery_rating 
FROM locations 
WHERE category = 'riding' AND state = 'CA' 
ORDER BY scenery_rating DESC;
```

### Boondocking by County
```sql
SELECT county, COUNT(*) as count 
FROM locations 
WHERE sub_type = 'boondocking' AND state = 'AZ'
GROUP BY county 
ORDER BY count DESC;
```

## Integration with Other Tools

### State-Level Statistics
After geocoding, generate state-level breakdowns:
```bash
sqlite3 trailcamp.db "SELECT state, 
  COUNT(*) as total,
  SUM(CASE WHEN category='riding' THEN 1 ELSE 0 END) as riding,
  SUM(CASE WHEN sub_type='boondocking' THEN 1 ELSE 0 END) as boondocking
FROM locations 
WHERE state IS NOT NULL
GROUP BY state 
ORDER BY total DESC"
```

### Export by State
```bash
sqlite3 trailcamp.db -header -csv \
  "SELECT * FROM locations WHERE state = 'CA'" \
  > california-locations.csv
```

### Dashboard Enhancement
Update dashboard to show state coverage:
```javascript
// In generate-dashboard-data.js
const byState = db.prepare(`
  SELECT state, COUNT(*) as count 
  FROM locations 
  WHERE state IS NOT NULL 
  GROUP BY state 
  ORDER BY count DESC
`).all();
```

## Nominatim Usage Policy

**Must comply with:**
✅ Maximum 1 request per second (enforced in script)  
✅ Provide User-Agent header (set to "TrailCamp/1.0")  
✅ Cache results (don't re-geocode same coordinates)  
✅ Use for valid purposes (location data enhancement)

**Do NOT:**
❌ Exceed 1 request/second rate limit  
❌ Make bulk requests without delays  
❌ Use for commercial purposes without proper setup

For high-volume or commercial use, consider:
- Setting up your own Nominatim instance
- Using a commercial geocoding API (Google, Mapbox, etc.)

## Troubleshooting

### Script Hangs
- Check internet connection
- Verify Nominatim API is accessible: `curl https://nominatim.openstreetmap.org/status`
- Kill and restart: `pkill -f geocode-locations`

### Incomplete Results
- Some locations may not have state data in OSM
- Manually add state for critical locations
- Consider alternative geocoding services for problem areas

### Database Locked
- Stop dev server if running: `pkill -f "tsx watch"`
- Ensure no other processes accessing database
- Wait and retry

## Future Enhancements

Potential improvements:
- [ ] Support multiple geocoding providers (Google, Mapbox)
- [ ] Cache geocoding results to avoid re-querying
- [ ] Batch API requests where supported
- [ ] Add timezone detection
- [ ] Add elevation data from geocoding
- [ ] Parallel processing (respecting rate limits)

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
*Migration: 004_add_location_fields.sql*
