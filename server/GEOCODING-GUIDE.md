# Geocoding Guide

## Overview
The `geocode-locations.js` script adds state and county information to locations by reverse geocoding their coordinates using OpenStreetMap's Nominatim service (free).

## Quick Start

### Add State/County Data
```bash
# Geocode all locations missing state data (recommended)
node geocode-locations.js

# Test with 10 locations first
node geocode-locations.js --limit 10

# Re-geocode everything (including existing)
node geocode-locations.js --all
```

### Check Coverage
```bash
node geocode-locations.js --report
```

## How It Works

1. **Adds columns** (if they don't exist): `state`, `county`
2. **Reverse geocodes** coordinates using OpenStreetMap Nominatim API
3. **Updates database** with state abbreviation and county name
4. **Rate limits** to 1 request/second (Nominatim requirement)

## Features

### ✅ Free Service
- Uses OpenStreetMap Nominatim (no API key required)
- Public service, respects usage policy (1 req/sec)

### ✅ Smart Processing
- Skips locations with existing state data by default
- Use `--all` to re-geocode everything
- Use `--limit N` to test or process in batches

### ✅ US State Abbreviations
- Converts full state names to 2-letter codes
- Example: "California" → "CA"
- Works for all 50 US states

### ✅ International Support
- Also works for international locations
- Stores full state/province names for non-US
- Example: "British Columbia", "Baja California"

## Usage Examples

### Initial Geocoding
First time adding state/county data:
```bash
node geocode-locations.js
```

**Expected time:** ~1.7 hours for 6,000 locations (1 req/sec rate limit)

### Batch Processing
Process in smaller batches:
```bash
# Process 100 at a time
node geocode-locations.js --limit 100

# Wait, then run again (it will skip the first 100)
node geocode-locations.js --limit 100
```

### Fix Missing Data
Some locations might fail to geocode. Re-run to try again:
```bash
# Shows how many still need geocoding
node geocode-locations.js --report

# Try to geocode them again
node geocode-locations.js
```

### Update Existing Data
If you need to refresh state/county information:
```bash
node geocode-locations.js --all --limit 10  # Test 10 first
node geocode-locations.js --all              # Re-geocode everything
```

## Output Example

```
TrailCamp Geocoding Helper
Using: OpenStreetMap Nominatim (free)
Rate limit: 1 request/second

Found 6236 locations to geocode

[1/6236] Example Trail...
  ✓ CO, Boulder County
[2/6236] Example Campground...
  ✓ UT, Grand County
...

============================================================
GEOCODING COMPLETE
============================================================

Processed:  6236
Success:    6180
Failed:     56
Requests:   6236

Locations by state:
  CA: 1012
  CO: 845
  UT: 623
  ...
============================================================
```

## Coverage Report

```bash
node geocode-locations.js --report
```

Shows:
- Total locations
- How many have state data
- Count by state

Example output:
```
============================================================
GEOCODING COVERAGE REPORT
============================================================

Total locations:      6236
With state data:      6180 (99%)
Missing state data:   56

────────────────────────────────────────────────────────────
LOCATIONS BY STATE:

  CA   1012 locations
  CO    845 locations
  UT    623 locations
  ...
============================================================
```

## Rate Limiting

**Important:** Nominatim requires 1 request per second maximum.

- Script enforces 1000ms delay between requests
- **Do NOT** modify this delay or you may be blocked
- For 6,000 locations: ~1.7 hours total time

### Faster Alternatives (Future)

For faster geocoding, consider:
- Google Geocoding API (paid, 50 req/sec)
- Mapbox Geocoding API (paid, higher limits)
- Local Nominatim instance (no rate limits)

## Database Schema

### Columns Added
```sql
ALTER TABLE locations ADD COLUMN state TEXT;
ALTER TABLE locations ADD COLUMN county TEXT;
```

### Example Data
```
name: "Moab Brand Trails"
latitude: 38.5733
longitude: -109.5498
state: "UT"
county: "Grand County"
```

## Troubleshooting

### "Could not geocode"
Some locations fail due to:
- Remote coordinates (ocean, wilderness)
- Invalid coordinates
- API temporary issues

**Solution:** Re-run the script later, or manually set state for these locations:
```sql
UPDATE locations SET state = 'AK' WHERE id = 123;
```

### Script is Slow
This is normal! Nominatim rate limit = 1 req/sec.

- 100 locations = 100 seconds (~2 minutes)
- 1,000 locations = 1,000 seconds (~17 minutes)
- 6,000 locations = 6,000 seconds (~1.7 hours)

**Recommendation:** Run overnight or in batches.

### Missing State Column Error
Script automatically adds columns if they don't exist. If you see errors:
```bash
# Manually add columns
sqlite3 trailcamp.db << 'EOF'
ALTER TABLE locations ADD COLUMN state TEXT;
ALTER TABLE locations ADD COLUMN county TEXT;
EOF
```

## Using State Data

### Query Locations by State
```sql
SELECT * FROM locations WHERE state = 'CA';
SELECT * FROM locations WHERE state IN ('UT', 'CO', 'AZ');
```

### Count by State
```sql
SELECT state, COUNT(*) as count 
FROM locations 
WHERE state IS NOT NULL
GROUP BY state 
ORDER BY count DESC;
```

### Find Locations Missing State
```sql
SELECT id, name, latitude, longitude 
FROM locations 
WHERE state IS NULL OR state = '';
```

## Best Practices

1. **Test first:** Use `--limit 10` to verify it works
2. **Run overnight:** For large datasets, run during off-hours
3. **Check report:** Use `--report` before and after to verify coverage
4. **Backup first:** Run `./backup-database.sh` before bulk geocoding
5. **Respect rate limits:** Do not modify delay or run multiple instances

## Integration

### API Endpoint
Expose state data via API:
```javascript
app.get('/api/locations/:id', (req, res) => {
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  // location.state is now available
  res.json(location);
});
```

### Frontend Filters
Add state filter to UI:
```javascript
// Filter by state
const californiaLocations = locations.filter(loc => loc.state === 'CA');

// Group by state for dropdown
const states = [...new Set(locations.map(loc => loc.state))].sort();
```

### Trip Planning
Show state info in trip stops:
```javascript
<TripStop>
  <h3>{stop.name}</h3>
  <p>{stop.state}, {stop.county}</p>
</TripStop>
```

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
*API: OpenStreetMap Nominatim (free)*
