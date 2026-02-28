# Route Distance Calculator

## Overview
Calculate driving distances between locations or for entire trip routes. Uses straight-line (Haversine) distance by default, with option to integrate road routing APIs for accurate driving distances.

## Quick Start

### Calculate Trip Distance
```bash
node calculate-distances.js --trip 1
```

### Distance Between Two Locations
```bash
node calculate-distances.js --between 100 200
```

### All Trips Summary
```bash
node calculate-distances.js --all-trips
```

## Usage Examples

### Single Trip Analysis
```bash
$ node calculate-distances.js --trip 1

Trip: Western Adventure (ID: 1)
============================================================

Stops: 5

Route Segments:
────────────────────────────────────────────────────────────
1. Moab Slickrock Trail
   ↓ 145.3 miles
2. Canyonlands Campground
   ↓ 89.2 miles
3. Arches National Park
   ↓ 203.7 miles
4. Capitol Reef Riding Area
   ↓ 156.8 miles
5. Bryce Canyon Trailhead

============================================================
Total Distance: 595.0 miles (straight-line)
Estimated Driving: 774 miles (+30% for roads)
============================================================
```

### Location to Location
```bash
$ node calculate-distances.js --between 100 200

Distance Between Locations
============================================================
From: Moab Brand Trails (ID: 100)
To:   Fruita OHV Area (ID: 200)
────────────────────────────────────────────────────────────
Straight-line: 142.3 miles
Est. driving:  185 miles (+30%)
============================================================
```

### JSON Output
```bash
node calculate-distances.js --trip 1 --json
```

Returns structured JSON for programmatic use:
```json
{
  "trip_id": 1,
  "trip_name": "Western Adventure",
  "stops": [
    {
      "order": 1,
      "name": "Moab Slickrock Trail",
      "coords": [38.5733, -109.5498]
    },
    ...
  ],
  "segments": [
    {
      "from": "Moab Slickrock Trail",
      "to": "Canyonlands Campground",
      "distance": 145.3,
      "from_coords": [38.5733, -109.5498],
      "to_coords": [38.1234, -109.8765]
    },
    ...
  ],
  "total_distance": 595.0
}
```

## Distance Calculation Methods

### Current: Straight-Line (Haversine)
- **Pros:** Fast, no API required, works offline
- **Cons:** Underestimates actual driving distance
- **Accuracy:** Typically 70-80% of actual driving distance
- **Use case:** Quick estimates, planning

The script applies a +30% multiplier to estimate actual driving distance.

### Future: Road Routing APIs

For accurate driving distances, integrate one of these APIs:

#### Mapbox Directions API
```javascript
// Add to calculate-distances.js
async function mapboxDistance(lat1, lon1, lat2, lon2) {
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${lon1},${lat1};${lon2},${lat2}?access_token=${MAPBOX_TOKEN}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.routes[0].distance * 0.000621371; // meters to miles
}
```

#### Google Directions API
```javascript
async function googleDistance(lat1, lon1, lat2, lon2) {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lon1}&destination=${lat2},${lon2}&key=${GOOGLE_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.routes[0].legs[0].distance.value * 0.000621371; // meters to miles
}
```

**API Comparison:**

| API | Cost | Accuracy | Speed |
|-----|------|----------|-------|
| Haversine (current) | Free | ±30% | Instant |
| Mapbox Directions | $0.50/1000 | Exact | ~200ms |
| Google Directions | $5.00/1000 | Exact | ~300ms |
| OSRM (self-hosted) | Free | Exact | ~100ms |

## Use Cases

### Trip Planning
```bash
# Calculate total distance for a planned trip
node calculate-distances.js --trip 5 --json > trip-5-distances.json

# Use in budgeting (fuel costs)
# Example: 800 miles ÷ 12 mpg × $4/gal = $267 fuel cost
```

### Proximity Analysis
```bash
# Check if two locations are close enough for a day trip
node calculate-distances.js --between 100 101

# If < 50 miles, they could be combined
```

### Route Optimization
```bash
# Calculate all trips to find longest/shortest
node calculate-distances.js --all-trips | grep "Distance:"

# Identify trips that need optimization (too long between stops)
```

## Integration Examples

### API Endpoint
```javascript
// Add to server/src/index.ts
app.get('/api/trips/:id/distance', (req, res) => {
  const { stdout } = execSync(
    `node calculate-distances.js --trip ${req.params.id} --json`,
    { encoding: 'utf8' }
  );
  res.json(JSON.parse(stdout));
});
```

### Frontend Display
```javascript
// Fetch trip distance
const distance = await fetch(`/api/trips/${tripId}/distance`).then(r => r.json());

// Display in UI
<TripCard>
  <h3>{trip.name}</h3>
  <p>{distance.total_distance} miles straight-line</p>
  <p>Est. driving: {Math.round(distance.total_distance * 1.3)} miles</p>
</TripCard>
```

### Pre-calculate and Store
```sql
-- Add distance column to trips table
ALTER TABLE trips ADD COLUMN total_distance_miles REAL;

-- Update with calculated values
-- (run calculate-distances.js and update database)
```

## Performance

- **Single trip:** < 10ms
- **100 trips:** < 100ms
- **Database queries:** Minimal (1-2 per trip)
- **Memory:** < 10MB

With API routing:
- **Single segment:** ~200-300ms
- **10-stop trip:** ~2-3 seconds
- **Rate limits:** Check API documentation

## Limitations

### Current Implementation
- ❌ No turn-by-turn directions
- ❌ No traffic consideration
- ❌ No road restrictions (one-way, private roads)
- ❌ No route preferences (avoid highways, scenic routes)

### Straight-Line Distance
- Underestimates mountain roads (switchbacks)
- Underestimates ferry crossings
- Doesn't account for road closures

**Recommendation:** Use for initial planning, verify with actual routing before trips.

## Troubleshooting

### "Trip X not found"
- Check trip ID exists: `sqlite3 trailcamp.db "SELECT id, name FROM trips"`
- Trip IDs must be integers

### "Location X not found"
- Check location ID: `sqlite3 trailcamp.db "SELECT id, name FROM locations WHERE id = X"`

### "No route" for trip with stops
- Trips with 0 or 1 stops have no segments
- Add at least 2 stops for a route

### Distance seems wrong
- Straight-line is always shorter than driving
- Apply +30% multiplier for estimate
- For accuracy, integrate road routing API

## Future Enhancements

- [ ] Integrate Mapbox/Google Directions API
- [ ] Cache calculated distances in database
- [ ] Support multiple route profiles (driving, motorcycle-friendly, scenic)
- [ ] Export route to GPX for GPS devices
- [ ] Calculate fuel costs based on distance
- [ ] Suggest overnight stops for long segments (>300 miles)
- [ ] Elevation gain calculation (important for motorcycles)

---

*Last updated: 2026-02-28*
*Script: calculate-distances.js*
*Method: Haversine formula (straight-line)*
