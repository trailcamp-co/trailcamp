# Geocoding Guide

## Overview
The geocoding helper adds state and county data to locations by reverse geocoding their coordinates using OpenStreetMap's Nominatim API.

## Quick Start

### Test with 10 Locations
```bash
node geocode-locations.js --limit 10 --dry-run
```

### Geocode 100 Locations
```bash
node geocode-locations.js --limit 100
```

### Geocode All Missing Data
```bash
node geocode-locations.js
```

⚠️ **Warning:** Full geocoding of 6,000+ locations takes ~2 hours due to API rate limits

### View State Coverage Report
```bash
node geocode-locations.js --report
```

## Features

✅ **Reverse Geocoding** - Converts lat/lon to state/county names  
✅ **US State Codes** - Automatically converts state names to 2-letter codes  
✅ **Rate Limiting** - Respects Nominatim's 1 request/second limit  
✅ **Dry Run Mode** - Test without updating database  
✅ **Progress Tracking** - Shows real-time progress  
✅ **Error Handling** - Continues on failures, tracks errors  
✅ **Batch Processing** - Process N locations at a time

## Usage

### Basic Commands

```bash
# Dry run (no database changes)
node geocode-locations.js --limit 10 --dry-run

# Geocode first 100 locations
node geocode-locations.js --limit 100

# Geocode all locations missing state data
node geocode-locations.js

# Show current state coverage
node geocode-locations.js --report
```

### Options

| Option | Description |
|--------|-------------|
| `--limit N` | Geocode only N locations |
| `--dry-run` | Test without updating database |
| `--report` | Show state coverage report only |
| `--help` | Show help message |

## Database Schema

### Added Columns

```sql
state VARCHAR(2)    -- US 2-letter state code (e.g., 'CA', 'TX')
county VARCHAR(100) -- County name without "County" suffix
```

### Indexes

```sql
CREATE INDEX idx_locations_state ON locations(state);
CREATE INDEX idx_locations_county ON locations(county);
```

## API Details

### Nominatim (OpenStreetMap)

- **Endpoint:** `https://nominatim.openstreetmap.org/reverse`
- **Rate Limit:** 1 request per second
- **Authentication:** None required
- **Terms:** Must include User-Agent header

### Request Format

```
GET https://nominatim.openstreetmap.org/reverse
  ?format=json
  &lat=40.7128
  &lon=-74.0060
  &addressdetails=1
```

### Response Format

```json
{
  "address": {
    "state": "New York",
    "county": "New York County",
    "country": "United States",
    ...
  },
  ...
}
```

## Performance

### Timing Estimates

| Locations | Time |
|-----------|------|
| 10 | ~11 seconds |
| 100 | ~2 minutes |
| 1,000 | ~17 minutes |
| 6,000+ | ~2 hours |

### Rate Limiting

Script enforces 1.1 second delay between requests to comply with Nominatim's usage policy.

**Why so slow?**
- Free tier limit: 1 request/second
- No bulk geocoding endpoint available
- Respectful of free service resources

## State Coverage

### After Geocoding

Run report to see coverage:
```bash
node geocode-locations.js --report
```

Example output:
```
STATE COVERAGE REPORT
============================================================

Total locations:      6236
With state data:      5892 (94%)
Missing state data:   344

Locations by state:

  CA   1012  ████████████████████████
  CO    876  ████████████████████
  WA    542  ████████████
  ...
```

### State Codes

US 2-letter codes automatically assigned:
- California → CA
- Colorado → CO
- Washington → WA
- etc.

## Filtering by State

Once geocoded, use state data for:

### SQL Queries
```sql
SELECT * FROM locations WHERE state = 'CA';
SELECT state, COUNT(*) FROM locations GROUP BY state;
```

### API Endpoints (Future)
```
GET /api/locations?state=CA
GET /api/locations?state=CO&category=riding
```

### Analytics
- Regional statistics
- State-level coverage reports
- Trip planning by state

## International Locations

### Current Behavior
- Script attempts to geocode all locations
- International locations get full state/province names (not 2-letter codes)
- Examples: "British Columbia", "Baja California"

### Recommendations
- Focus on US locations first
- International locations can be geocoded separately
- Consider adding country column for better filtering

## Error Handling

### Common Errors

**"Could not determine state"**
- Coordinates in remote/ocean areas
- API couldn't find administrative boundaries
- Location outside any state/province

**"Rate limit exceeded"**
- Too many requests too quickly
- Wait and retry
- Script should handle automatically

**"Network error"**
- Internet connection issues
- Nominatim server down
- Retry later

### Recovery

If geocoding is interrupted:
```bash
# Resume - only processes locations without state data
node geocode-locations.js
```

## Best Practices

### 1. Test First
Always dry-run with small batch:
```bash
node geocode-locations.js --limit 10 --dry-run
```

### 2. Batch Process
Process in chunks rather than all at once:
```bash
node geocode-locations.js --limit 500
# Wait a bit, then:
node geocode-locations.js --limit 500
```

### 3. Monitor Progress
Watch output for errors:
- ✓ = Success
- ✗ = Failed (note the location)

### 4. Verify Results
Check coverage report after:
```bash
node geocode-locations.js --report
```

### 5. Backup First
Before mass geocoding:
```bash
./backup-database.sh
```

## Troubleshooting

### No Locations to Geocode
```
Found 0 locations to geocode
✓ All locations already have state data!
```
All locations have been geocoded. Use `--report` to view coverage.

### Many Failures
If >10% fail:
1. Check internet connection
2. Verify Nominatim service status
3. Examine failed coordinates (may be invalid)
4. Retry failed locations manually

### Slow Performance
Normal! Free API has strict rate limits. To speed up:
- Use paid geocoding service (Google, Mapbox)
- Process overnight
- Cache results

## Future Enhancements

Potential improvements:
- [ ] Support multiple geocoding providers
- [ ] Bulk API option (if available)
- [ ] Country code detection
- [ ] City/town names
- [ ] Elevation data from coordinates
- [ ] Time zone detection
- [ ] Manual overrides for corrections

---

*Last updated: 2026-02-28*
*Script: geocode-locations.js*
