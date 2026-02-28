# Nearby Location Finder

## Overview
Find all locations within a specified radius of given coordinates using the Haversine distance formula.

## Quick Start

```bash
# Find all locations within 50 miles of Moab, UT
node find-nearby.js 38.5733 -109.5498 50

# Find riding spots within 25 miles
node find-nearby.js 40.7128 -105.9378 25 --category riding

# Find top 10 scenic campsites within 30 miles
node find-nearby.js 37.7749 -119.5194 30 --category campsite --min-scenery 8 --max-results 10
```

## Usage

```bash
node find-nearby.js <latitude> <longitude> <radius-miles> [options]
```

### Required Arguments
- **latitude** - Decimal degrees (-90 to 90)
- **longitude** - Decimal degrees (-180 to 180)
- **radius-miles** - Search radius in miles

### Options
- `--category TYPE` - Filter by category: riding, campsite, dump, water, scenic
- `--min-scenery N` - Only show locations with scenery rating >= N
- `--max-results N` - Limit to N closest results
- `--json` - Output as JSON instead of table format

## Examples

### Find All Locations Near Coordinates
```bash
node find-nearby.js 38.5733 -109.5498 50
```

Output:
```
Found 156 locations within 50 miles of (38.5733, -109.5498)

Distance | Category  | Scenery | Name
────────────────────────────────────────────────────────────────────────────────
   1.1mi | riding    | 5       | Moab — Slickrock Trail
   1.3mi | riding    | 10      | Moab Brand Trails
   2.1mi | campsite  | 8       | Sand Flats Recreation Area
   ...

Summary by category:
  campsite: 87
  riding: 64
  dump: 3
  water: 2
```

### Find Nearby Riding Spots
```bash
node find-nearby.js 40.7128 -105.9378 25 --category riding
```

### Find High-Scenery Campsites
```bash
node find-nearby.js 37.7749 -119.5194 30 --category campsite --min-scenery 8
```

### Get JSON Output
```bash
node find-nearby.js 38.5733 -109.5498 50 --json > nearby-moab.json
```

JSON format:
```json
[
  {
    "id": 123,
    "name": "Moab Brand Trails",
    "latitude": 38.5845,
    "longitude": -109.5612,
    "category": "riding",
    "scenery_rating": 10,
    "distance": 1.3
    ...
  }
]
```

## Use Cases

### Trip Planning
Find all riding and camping within X miles of a planned route stop:

```bash
# Find all locations near a planned camp
node find-nearby.js 40.1234 -105.6789 50

# Find riding near camp (< 10 miles)
node find-nearby.js 40.1234 -105.6789 10 --category riding

# Find boondocking near trailhead
node find-nearby.js 38.5733 -109.5498 15 --category campsite
```

### "Ride from Camp" Feature
Identify campsites with nearby riding:

```bash
# For each campsite, check if riding exists within 5 miles
# (This powers the "ride from camp" badge in the UI)
```

### Explore Area
Discover what's around a location of interest:

```bash
# All high-scenery locations within 30 miles of Yosemite
node find-nearby.js 37.7749 -119.5194 30 --min-scenery 8
```

### API Integration
Use in server endpoints:

```javascript
import { findNearby } from './find-nearby.js';

app.get('/api/locations/:id/nearby', (req, res) => {
  const location = getLocationById(req.params.id);
  const nearby = findNearby(
    location.latitude, 
    location.longitude, 
    50, // 50 mile radius
    { category: 'riding', maxResults: 20 }
  );
  res.json(nearby);
});
```

## Performance

- **Speed:** < 100ms for 6,000+ locations
- **Algorithm:** Haversine distance calculation
- **Database:** Read-only queries, no locks
- **Accuracy:** ±0.5% for distances < 100 miles

## Distance Calculation

Uses the **Haversine formula** for great-circle distance:

```
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- φ = latitude in radians
- λ = longitude in radians
- R = Earth's radius (3,959 miles)

### Accuracy Notes
- Assumes spherical Earth (good for < 1000 miles)
- Error increases at very high latitudes
- More accurate than simple lat/lon difference
- Less accurate than Vincenty formula but much faster

## Filtering

### By Category
```bash
# Only riding
--category riding

# Only campsites
--category campsite

# Only dump stations
--category dump
```

### By Scenery Rating
```bash
# Only 8+ scenery
--min-scenery 8

# Only 9+ scenery
--min-scenery 9
```

### Limit Results
```bash
# Top 10 closest
--max-results 10

# Top 20 closest
--max-results 20
```

### Combine Filters
```bash
# Top 5 high-scenery riding spots within 30 miles
node find-nearby.js 38.5733 -109.5498 30 \
  --category riding \
  --min-scenery 8 \
  --max-results 5
```

## Common Coordinates

### Popular Areas
```bash
# Moab, UT
38.5733, -109.5498

# Boulder, CO
40.0150, -105.2705

# Bend, OR
44.0582, -121.3153

# Flagstaff, AZ
35.1983, -111.6513

# Yosemite, CA
37.7749, -119.5194
```

### Get Coordinates
Use Google Maps, GPS device, or trail apps to find coordinates for any location.

## Output Formats

### Table (Default)
Human-readable table with distance, category, scenery, name:
```
   1.1mi | riding    | 5       | Moab — Slickrock Trail
   1.3mi | riding    | 10      | Moab Brand Trails
```

### JSON
Programmatic format with full location data:
```json
[{"id": 123, "distance": 1.3, ...}]
```

Use `--json` for:
- API endpoints
- Data processing pipelines
- Import into other tools
- Saving to file

## Troubleshooting

### "Invalid coordinates"
- Latitude must be -90 to 90
- Longitude must be -180 to 180
- Use negative for South/West

### "No locations found"
- Increase radius
- Remove filters (category, scenery)
- Check coordinates are correct

### Slow Performance
With 6,000+ locations, performance should still be < 1 second. If slow:
- Database may be locked (close other processes)
- Add index on category column (already exists)

---

*Last updated: 2026-02-28*
*Script: find-nearby.js*
*Algorithm: Haversine distance formula*
