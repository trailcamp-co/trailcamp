# Geocoding Guide

## Overview
The geocoding helper script reverse-geocodes location coordinates to add state and county information, improving search and regional organization.

## Quick Start

### Test Mode (Dry Run)
```bash
node geocode-locations.js --limit 10 --dry-run
```

### Live Mode (Updates Database)
```bash
# Always backup first!
./backup-database.sh

node geocode-locations.js --limit 50
```

## How It Works

### Reverse Geocoding
- Takes latitude/longitude coordinates
- Queries OpenStreetMap Nominatim API
- Returns: state, county, country information
- Appends geographic data to location notes field

### Example Output
```
Input:  33.8703, -111.9487
Output: Maricopa County, Arizona
```

### Data Storage
Geographic information is added to the `notes` field:
```
Original notes: "Best ridden clockwise from north trailhead"
Updated notes:  "Best ridden clockwise from north trailhead; Location: Maricopa County, Arizona"
```

## Usage

### Basic Usage
```bash
# Geocode 100 locations (default)
node geocode-locations.js

# Geocode specific number
node geocode-locations.js --limit 50

# Test without updating database
node geocode-locations.js --limit 10 --dry-run
```

### Options
- `--limit N` - Process up to N locations (default: 100)
- `--dry-run` - Validate without updating database
- `--help` - Show help message

## Rate Limiting

### Nominatim Usage Policy
- **Free service** from OpenStreetMap
- **Rate limit:** 1 request per second
- **User-Agent required** (automatically set)
- **Fair use:** Don't abuse the free service

### Time Estimates
| Locations | Time Required |
|-----------|---------------|
| 10 | ~12 seconds |
| 50 | ~1 minute |
| 100 | ~2 minutes |
| 500 | ~10 minutes |
| 1,000 | ~20 minutes |

### Large Batches
For geocoding entire database (6,000+ locations):
```bash
# Run multiple batches
node geocode-locations.js --limit 500
# Wait for completion
node geocode-locations.js --limit 500
# Repeat as needed
```

## Use Cases

### 1. State/County Filters
Add geographic metadata for filtering:
- "Show all Arizona locations"
- "Find campsites in Maricopa County"

### 2. Regional Analysis
Improved statistics and reporting:
- Locations per state
- County-level coverage
- Regional gap analysis

### 3. Search Enhancement
Better search results:
- "Moab, Utah" matches county/state
- Regional name variations
- Local area references

### 4. Data Validation
Verify coordinate accuracy:
- Check if location name matches geocoded region
- Identify coordinate errors
- Flag misplaced locations

## Best Practices

### Before Geocoding

1. **Backup database:**
   ```bash
   ./backup-database.sh
   ```

2. **Test with dry-run:**
   ```bash
   node geocode-locations.js --limit 10 --dry-run
   ```

3. **Check sample results:**
   - Verify state/county accuracy
   - Ensure data format looks correct

### During Geocoding

1. **Start small:**
   - First run: 50-100 locations
   - Verify results look good
   - Then scale up

2. **Monitor output:**
   - Watch for API errors
   - Check for "No data found" warnings
   - Note any failed requests

3. **Be patient:**
   - Rate limiting means it's slow
   - Don't interrupt the process
   - Let it complete fully

### After Geocoding

1. **Verify updates:**
   ```bash
   sqlite3 trailcamp.db "SELECT name, notes FROM locations WHERE notes LIKE '%Location:%' LIMIT 10"
   ```

2. **Check statistics:**
   ```bash
   sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE notes LIKE '%Location:%'"
   ```

3. **Run quality check:**
   ```bash
   ./check-data-quality.sh
   ```

## Limitations

### Geographic Coverage
- **US locations:** Excellent coverage
- **Canada:** Good coverage
- **International:** Variable quality
- **Remote areas:** May lack county data

### Data Accuracy
- **State:** Usually 100% accurate
- **County:** ~95% accurate
- **Small territories:** May be misidentified
- **Border areas:** Can be ambiguous

### API Limitations
- **Free tier:** 1 request/second
- **No bulk geocoding:** Must rate-limit
- **Occasional outages:** OSM infrastructure
- **Data freshness:** May lag real-world changes

## Troubleshooting

### "No data found" Warnings
- Location is in remote area
- Coordinates are in water
- OSM has no data for that region
- **Action:** Manual review needed

### API Errors
- Rate limit exceeded (wait longer between requests)
- Network timeout (retry failed locations)
- Invalid coordinates (check data quality)

### Incorrect Results
- Verify coordinates are correct
- Check if location is near state/county border
- Consider updating manually if clearly wrong

## Advanced Usage

### Selective Geocoding
Geocode only locations missing data:
```javascript
// Modify query in geocode-locations.js:
const locations = db.prepare(`
  SELECT id, name, latitude, longitude 
  FROM locations 
  WHERE notes NOT LIKE '%Location:%'
  LIMIT ?
`).all(limit);
```

### Custom Output Fields
To store in dedicated columns (requires schema changes):
```sql
-- Add columns
ALTER TABLE locations ADD COLUMN state VARCHAR(2);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);

-- Update script to use columns instead of notes
```

### Batch Processing Script
```bash
#!/bin/bash
# geocode-all.sh - Process entire database in batches

BATCH_SIZE=500
TOTAL=6000

for i in $(seq 0 $BATCH_SIZE $TOTAL); do
  echo "Processing batch starting at $i..."
  node geocode-locations.js --limit $BATCH_SIZE
  echo "Batch complete. Waiting 60 seconds..."
  sleep 60
done

echo "All batches complete!"
```

## Alternative Services

### Other Geocoding APIs
If Nominatim is too slow, consider:

| Service | Rate Limit | Cost | Coverage |
|---------|-----------|------|----------|
| Nominatim | 1/sec | Free | Good |
| Google Maps | 50/sec | Pay per use | Excellent |
| Mapbox | 100,000/mo | Free tier | Excellent |
| Here | 250,000/mo | Free tier | Good |

**Note:** Paid APIs require API keys and billing setup.

## Schema Recommendations

### Future Enhancement
Consider adding dedicated geographic columns:
```sql
ALTER TABLE locations ADD COLUMN state VARCHAR(2);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);
ALTER TABLE locations ADD COLUMN country VARCHAR(3);

CREATE INDEX idx_locations_state ON locations(state);
CREATE INDEX idx_locations_county ON locations(county);
```

Benefits:
- Faster filtering by state
- Cleaner data structure
- Better analytics capabilities
- No parsing required

## Examples

### Sample Success Output
```
[1/5] Geocoding: Moab OHV Area...
  ✓ Grand County, Utah

[2/5] Geocoding: Pikes Peak Trail...
  ✓ El Paso County, Colorado

[3/5] Geocoding: Death Valley Racetrack...
  ✓ Inyo County, California
```

### Sample Error Handling
```
[4/5] Geocoding: Ocean Coordinates...
  ⚠ No address data available

[5/5] Geocoding: Invalid Location...
  ✗ Error: Invalid response from API
```

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
*API: OpenStreetMap Nominatim*
