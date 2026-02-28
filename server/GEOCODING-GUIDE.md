# Geocoding Guide

## Overview
The geocoding helper script reverse-geocodes coordinates to obtain state and county information for locations. Uses the free OpenStreetMap Nominatim API with proper rate limiting.

## Quick Start

### Test with Single Location
```bash
node geocode-locations.js 123
```

### Test with Small Batch
```bash
node geocode-locations.js --all --limit 10 --dry-run
```

### Geocode All Locations
```bash
node geocode-locations.js --all --limit 100 --export-csv
```

⚠️ **Warning:** Geocoding all 6,000+ locations takes ~2 hours due to API rate limits.

## Commands

### Single Location
```bash
node geocode-locations.js <location-id>
```

Geocodes a specific location by ID and prints the result.

**Example:**
```bash
node geocode-locations.js 123
# Output:
# Geocoding: Trail Name (40.1234, -105.6789)
#   → State: Colorado, County: Boulder County
```

### Batch Geocoding
```bash
node geocode-locations.js --all [options]
```

**Options:**
- `--limit N` - Process only first N locations (for testing)
- `--dry-run` - Validate without saving results
- `--export-csv` - Export results to CSV file

**Examples:**
```bash
# Test with 10 locations
node geocode-locations.js --all --limit 10

# Geocode first 100 and export CSV
node geocode-locations.js --all --limit 100 --export-csv

# Full geocoding (takes ~2 hours)
node geocode-locations.js --all --export-csv
```

## API Details

### Nominatim API
- **Provider:** OpenStreetMap
- **Cost:** Free
- **Rate Limit:** 1 request per second
- **Attribution:** Required for public use

### Returned Data
For each location, the API returns:
- **state** - US state name (e.g., "Arizona", "Colorado")
- **county** - County name (e.g., "Maricopa County", "Boulder County")
- **country** - Always "United States" for US locations
- **display_name** - Full formatted address

## Output Files

### geocoding-report.json
Detailed JSON report with:
```json
{
  "generatedAt": "2026-02-28T20:37:00.000Z",
  "totalLocations": 100,
  "successful": 98,
  "failed": 2,
  "byState": {
    "Arizona": {
      "count": 25,
      "counties": ["Maricopa County", "Yavapai County"],
      "locations": [...]
    },
    ...
  }
}
```

### locations-by-state.csv
Simple CSV export:
```csv
id,name,state,county
123,"Trail Name","Colorado","Boulder County"
124,"Camp Site","Arizona","Maricopa County"
```

## Performance

| Locations | Time (approx) | API Calls |
|-----------|--------------|-----------|
| 10 | 12 seconds | 10 |
| 100 | 2 minutes | 100 |
| 1,000 | 20 minutes | 1,000 |
| 6,000+ | 2 hours | 6,000+ |

**Rate limiting:** 1 request per 1.1 seconds (slightly slower than API limit for safety)

## Use Cases

### 1. State-Level Statistics
Generate location counts by state:
```bash
node geocode-locations.js --all --export-csv
# Then analyze CSV in Excel or with SQL
```

### 2. County Coverage Analysis
Identify which counties have locations:
```bash
node geocode-locations.js --all --limit 1000
# Check geocoding-report.json for county list
```

### 3. Add State Column to Database
After geocoding, you could add a state field:
```sql
ALTER TABLE locations ADD COLUMN state VARCHAR(50);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);

-- Then update based on geocoding results
```

### 4. Verify Location Accuracy
Check if locations are in expected states:
```bash
# Geocode suspicious locations
node geocode-locations.js 123
node geocode-locations.js 456
```

## Best Practices

### Start Small
Always test with `--limit` first:
```bash
node geocode-locations.js --all --limit 10 --dry-run
```

### Monitor Progress
The script shows real-time progress:
```
[1/100] Location Name
  → State, County
[2/100] Another Location
  → State, County
```

### Handle Failures
Failed geocodes are logged:
```
[50/100] Bad Location
  ✗ Error: Unable to geocode
```

Review the summary to see failed count.

### Respect Rate Limits
- Never remove the rate limiting code
- Don't run multiple instances simultaneously
- Consider running overnight for large batches

## Error Handling

### Common Errors

**"Unable to geocode"**
- Location coordinates are invalid
- Coordinates are in ocean/international waters
- API temporarily unavailable

**"Network error"**
- Check internet connection
- Nominatim API may be down
- Firewall blocking requests

**"Rate limit exceeded"**
- Script should handle this automatically
- If it occurs, increase RATE_LIMIT_MS value

## Adding State Field to Database

If you want to permanently store state/county data:

### 1. Create Migration
```sql
-- migrations/004_add_geographic_fields.sql
ALTER TABLE locations ADD COLUMN state VARCHAR(50);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);

CREATE INDEX idx_locations_state ON locations(state);
CREATE INDEX idx_locations_county ON locations(county);
```

### 2. Run Migration
```bash
sqlite3 trailcamp.db < migrations/004_add_geographic_fields.sql
```

### 3. Populate from Geocoding Results
```javascript
// After geocoding all locations
const results = JSON.parse(fs.readFileSync('./geocoding-report.json'));

for (const [state, data] of Object.entries(results.byState)) {
  for (const loc of data.locations) {
    db.prepare('UPDATE locations SET state = ?, county = ? WHERE id = ?')
      .run(state, loc.county, loc.id);
  }
}
```

### 4. Update Import Script
Add state/county columns to CSV import format.

## Alternative: Manual State Assignment

For faster results without API calls, you can use the existing regional analysis:

```javascript
// Map regions to states (approximate)
const REGION_TO_STATES = {
  'Pacific Northwest': ['OR', 'WA', 'ID'],
  'California': ['CA'],
  'Southwest Desert': ['AZ', 'NM', 'NV', 'UT'],
  // ... etc
};
```

This is less accurate but instant. Geocoding API gives precise county-level data.

## Troubleshooting

### Geocoding Takes Too Long
- Use `--limit` to process smaller batches
- Run overnight for full database
- Consider caching results and resuming

### API Returns Wrong State
- Verify coordinates are correct
- Some border locations may return neighboring state
- Check display_name for full address

### Memory Issues
- Script processes one location at a time
- Should handle 10,000+ locations without issue
- If problems occur, use --limit to batch

## Future Enhancements

Potential improvements:
- [ ] Cache results to avoid re-geocoding
- [ ] Resume interrupted batches
- [ ] Parallel requests (with careful rate limiting)
- [ ] Support other geocoding providers
- [ ] Auto-update database with results
- [ ] Batch API requests (if supported by provider)

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
