# Geocoding Helper

## Overview
Reverse geocode location coordinates to determine state, county, and country information using the free OpenStreetMap Nominatim API.

## Quick Start

```bash
# Test with 5 locations (dry run)
node geocode-locations.js --limit=5 --dry-run

# Process 50 locations (default)
node geocode-locations.js

# Process 100 locations
node geocode-locations.js --limit=100
```

## Features

✅ **Free API** - Uses OpenStreetMap Nominatim (no API key required)  
✅ **Rate limiting** - Automatically respects 1 req/sec limit  
✅ **Batch processing** - Process locations in manageable chunks  
✅ **Progress tracking** - Shows real-time progress and results  
✅ **Error handling** - Continues on failures, reports at end  

## Use Cases

### 1. Add State/County Data to Locations
Enrich location data with geographic context for better organization and filtering.

### 2. Validate Coordinates
Reverse geocode to verify coordinates are in expected state/region.

### 3. Generate Regional Reports
Group locations by state or county for analysis.

### 4. Improve Search
Enable users to search by state name ("show me all locations in Colorado").

## Database Schema

To store geocoded data, add columns to the locations table:

```sql
ALTER TABLE locations ADD COLUMN state VARCHAR(100);
ALTER TABLE locations ADD COLUMN county VARCHAR(100);
ALTER TABLE locations ADD COLUMN country VARCHAR(100);

-- Add index for state-based queries
CREATE INDEX idx_locations_state ON locations(state);
```

Then update the geocode script to actually save the data (currently it just reports).

## Processing Times

Rate limit: **1 request per second**

| Locations | Time Required |
|-----------|---------------|
| 10 | ~11 seconds |
| 50 | ~55 seconds |
| 100 | ~2 minutes |
| 500 | ~10 minutes |
| 1,000 | ~20 minutes |
| 5,000 | ~90 minutes |

**Recommendation:** Process in batches of 100-500 locations.

## Nominatim API

### Usage Policy
- Maximum 1 request per second
- Provide User-Agent header (done)
- Free for reasonable use
- See: https://operations.osmfoundation.org/policies/nominatim/

### Response Format
```json
{
  "address": {
    "state": "Arizona",
    "county": "Maricopa County",
    "country": "United States",
    "country_code": "us"
  },
  "lat": "33.12345",
  "lon": "-112.23456"
}
```

### Accuracy
- ✅ **US locations:** Excellent (state + county)
- ✅ **Canada:** Good (province + county/region)
- ⚠️ **Remote areas:** May lack county info
- ⚠️ **International:** Varies by country

## Batch Workflow

### Process All Locations

```bash
#!/bin/bash
# geocode-all.sh - Process entire database in chunks

total=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations")
batch_size=100

for ((i=0; i<total; i+=batch_size)); do
  echo "Processing batch $((i/batch_size + 1))..."
  node geocode-locations.js --limit=$batch_size --offset=$i
  
  # Optional: backup after each batch
  ./backup-database.sh
  
  echo "Batch complete. Sleeping 5 seconds..."
  sleep 5
done

echo "All locations geocoded!"
```

### Selective Geocoding

Geocode only locations missing state info:

```bash
# First, add the columns
sqlite3 trailcamp.db "ALTER TABLE locations ADD COLUMN state VARCHAR(100);"

# Then modify geocode script to:
# WHERE state IS NULL OR state = ''
```

## Sample Output

```
TrailCamp Geocoding Helper

⚠️  This uses OpenStreetMap Nominatim API (free, 1 req/sec limit)
Processing will be SLOW to respect rate limits.

Geocoding locations (limit: 5, dry run: false)

Found 5 locations to process

[1/5] Ghost Town Road Dispersed...
  ✓ Arizona, Maricopa County (United States)
[2/5] Vulture Peak State Trust Land...
  ✓ Arizona, Maricopa County (United States)
[3/5] Boulders OHV Area Camping...
  ✓ Arizona, Maricopa County (United States)
[4/5] Rincon Road BLM...
  ✓ Arizona, Maricopa County (United States)
[5/5] Moon Rocks — Warner Valley...
  ✓ Utah, Washington County (United States)

============================================================
GEOCODING SUMMARY
============================================================
Processed: 5
Succeeded: 5
Failed: 0
============================================================

State distribution:
  Arizona: 4
  Utah: 1

✓ Geocoding complete
```

## Alternative APIs

If Nominatim is too slow or rate-limited, consider:

### Google Geocoding API
- **Cost:** $5 per 1,000 requests (first $200/month free)
- **Rate limit:** 50 requests per second
- **Accuracy:** Excellent
- **Setup:** Requires API key

### Mapbox Geocoding API
- **Cost:** 100,000 free requests/month, then $0.50/1,000
- **Rate limit:** 600 requests per minute
- **Accuracy:** Excellent
- **Setup:** Requires API key (same as map token)

### HERE Geocoding API
- **Cost:** 250,000 free requests/month
- **Rate limit:** 5 requests per second (free tier)
- **Accuracy:** Good
- **Setup:** Requires API key

## Future Enhancements

Potential improvements:
- [ ] Add `--offset` parameter for resumable processing
- [ ] Store results to database (add schema first)
- [ ] Retry failed geocodes with exponential backoff
- [ ] Support multiple geocoding APIs (fallback)
- [ ] Add progress bar for long batches
- [ ] Export results to CSV/JSON
- [ ] Validate against known state boundaries
- [ ] Auto-detect and fix invalid coordinates

## Troubleshooting

### "Failed: Too many requests"
- You're exceeding 1 req/sec
- Increase sleep time in script (currently 1100ms)

### "No state info found"
- Location may be in ocean or remote area
- Coordinates may be invalid
- API may be temporarily unavailable

### Slow Processing
- This is expected (1 req/sec = 3,600 per hour max)
- Consider paid API for bulk processing
- Process overnight for large batches

### API Errors
- Check internet connection
- Verify coordinates are valid
- Try again later (API may be down)

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
