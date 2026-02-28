# TrailCamp API Usage Examples

Practical examples for interacting with the TrailCamp API using curl and JavaScript fetch.

## Base URL

```
http://localhost:3001/api
```

*(Production: update with deployed URL)*

---

## Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/locations` | GET | List all locations (with filters) |
| `/locations/:id` | GET | Get single location |
| `/trips` | GET | List all trips |
| `/trips` | POST | Create new trip |
| `/trips/:id` | GET | Get single trip |
| `/trips/:id` | PUT | Update trip |
| `/trips/:id` | DELETE | Delete trip |
| `/trips/:id/stops` | GET | Get trip stops |
| `/trips/:id/stops` | POST | Add stop to trip |
| `/trips/:id/stops/:stopId` | DELETE | Remove stop from trip |
| `/directions` | POST | Get driving directions |

---

## Health Check

Check if API is running:

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T19:12:00.000Z"
}
```

---

## Locations

### Get All Locations

```bash
curl http://localhost:3001/api/locations
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/locations');
const locations = await response.json();
console.log(`Found ${locations.length} locations`);
```

### Filter by Category

Get only riding locations:

```bash
curl "http://localhost:3001/api/locations?category=riding"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/locations?category=riding');
const ridingSpots = await response.json();
```

**Available categories:** `riding`, `campsite`, `dump`, `water`, `scenic`

### Filter by Scenery Rating

Get locations with scenery rating ≥ 8:

```bash
curl "http://localhost:3001/api/locations?scenery_min=8"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/locations?scenery_min=8');
const scenicLocations = await response.json();
```

### Filter by Sub-Type

Get only boondocking campsites:

```bash
curl "http://localhost:3001/api/locations?category=campsite&sub_type=boondocking"
```

### Filter by Difficulty

Get hard riding trails:

```bash
curl "http://localhost:3001/api/locations?difficulty=Hard"
```

**Available difficulties:** `Easy`, `Beginner`, `Moderate`, `Intermediate`, `Hard`, `Advanced`, `Expert`

### Filter by Season

Get summer riding spots:

```bash
curl "http://localhost:3001/api/locations?best_season=Summer"
```

**Available seasons:** `Summer`, `Winter`, `Spring`, `Fall`, `Year-round`

### Combine Multiple Filters

Get moderate difficulty riding spots with high scenery:

```bash
curl "http://localhost:3001/api/locations?category=riding&difficulty=Moderate&scenery_min=8"
```

### Pagination

Get first 50 locations:

```bash
curl "http://localhost:3001/api/locations?limit=50"
```

**JavaScript with pagination:**
```javascript
async function getAllLocations() {
  const limit = 100;
  let offset = 0;
  let allLocations = [];
  
  while (true) {
    const response = await fetch(
      `http://localhost:3001/api/locations?limit=${limit}&offset=${offset}`
    );
    const locations = await response.json();
    
    if (locations.length === 0) break;
    
    allLocations = allLocations.concat(locations);
    offset += limit;
  }
  
  return allLocations;
}
```

### Get Single Location

```bash
curl http://localhost:3001/api/locations/123
```

**JavaScript:**
```javascript
const locationId = 123;
const response = await fetch(`http://localhost:3001/api/locations/${locationId}`);
const location = await response.json();
console.log(location.name);
```

### Get Featured Locations

Get bucket-list / featured locations:

```bash
curl "http://localhost:3001/api/locations/featured"
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/locations/featured');
const featured = await response.json();
```

---

## Trips

### Get All Trips

```bash
curl http://localhost:3001/api/trips
```

**JavaScript:**
```javascript
const response = await fetch('http://localhost:3001/api/trips');
const trips = await response.json();
```

### Get Single Trip

```bash
curl http://localhost:3001/api/trips/1
```

### Create New Trip

```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Southwest Desert Adventure",
    "notes": "7-day trip exploring Arizona and Utah"
  }'
```

**JavaScript:**
```javascript
const newTrip = {
  name: "Southwest Desert Adventure",
  notes: "7-day trip exploring Arizona and Utah"
};

const response = await fetch('http://localhost:3001/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newTrip)
});

const trip = await response.json();
console.log(`Created trip #${trip.id}`);
```

### Update Trip

```bash
curl -X PUT http://localhost:3001/api/trips/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Trip Name",
    "notes": "Modified notes"
  }'
```

**JavaScript:**
```javascript
const tripId = 1;
const updates = {
  name: "Updated Trip Name",
  notes: "Modified notes"
};

await fetch(`http://localhost:3001/api/trips/${tripId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
```

### Delete Trip

```bash
curl -X DELETE http://localhost:3001/api/trips/1
```

**JavaScript:**
```javascript
const tripId = 1;
await fetch(`http://localhost:3001/api/trips/${tripId}`, {
  method: 'DELETE'
});
```

---

## Trip Stops

### Get Trip Stops

Get all stops for a trip (with location details):

```bash
curl http://localhost:3001/api/trips/1/stops
```

**JavaScript:**
```javascript
const tripId = 1;
const response = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`);
const stops = await response.json();

stops.forEach((stop, i) => {
  console.log(`Stop ${i + 1}: ${stop.location.name}`);
});
```

### Add Stop to Trip

```bash
curl -X POST http://localhost:3001/api/trips/1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 456,
    "order_index": 0
  }'
```

**JavaScript:**
```javascript
const tripId = 1;
const locationId = 456;
const orderIndex = 0;  // First stop

const response = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ location_id: locationId, order_index: orderIndex })
});

const newStop = await response.json();
```

### Remove Stop from Trip

```bash
curl -X DELETE http://localhost:3001/api/trips/1/stops/5
```

**JavaScript:**
```javascript
const tripId = 1;
const stopId = 5;

await fetch(`http://localhost:3001/api/trips/${tripId}/stops/${stopId}`, {
  method: 'DELETE'
});
```

---

## Directions

### Get Driving Route

Get driving directions between two locations:

```bash
curl -X POST http://localhost:3001/api/directions \
  -H "Content-Type: application/json" \
  -d '{
    "waypoints": [
      {"latitude": 40.7128, "longitude": -74.0060},
      {"latitude": 34.0522, "longitude": -118.2437}
    ]
  }'
```

**JavaScript:**
```javascript
const waypoints = [
  { latitude: 40.7128, longitude: -74.0060 },  // NYC
  { latitude: 34.0522, longitude: -118.2437 }  // LA
];

const response = await fetch('http://localhost:3001/api/directions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ waypoints })
});

const route = await response.json();
console.log(`Distance: ${route.distance} miles`);
console.log(`Duration: ${route.duration} hours`);
```

### Get Route for Entire Trip

```javascript
async function getTripRoute(tripId) {
  // Get trip stops
  const stopsResponse = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`);
  const stops = await stopsResponse.json();
  
  // Build waypoints array
  const waypoints = stops.map(stop => ({
    latitude: stop.location.latitude,
    longitude: stop.location.longitude
  }));
  
  // Get directions
  const directionsResponse = await fetch('http://localhost:3001/api/directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waypoints })
  });
  
  return await directionsResponse.json();
}

const route = await getTripRoute(1);
console.log(`Total trip: ${route.distance} miles, ${route.duration} hours`);
```

---

## Advanced Examples

### Find Nearby Locations

Find campsites within 50 miles of a riding location:

```javascript
function distance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearbyCamping(ridingLocationId, maxDistance = 50) {
  // Get riding location
  const ridingResponse = await fetch(
    `http://localhost:3001/api/locations/${ridingLocationId}`
  );
  const riding = await ridingResponse.json();
  
  // Get all campsites
  const campsitesResponse = await fetch(
    'http://localhost:3001/api/locations?category=campsite'
  );
  const campsites = await campsitesResponse.json();
  
  // Filter by distance
  const nearby = campsites
    .map(camp => ({
      ...camp,
      distance: distance(
        riding.latitude, riding.longitude,
        camp.latitude, camp.longitude
      )
    }))
    .filter(camp => camp.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance);
  
  return nearby;
}

const nearbyCamping = await findNearbyCamping(123, 50);
console.log(`Found ${nearbyCamping.length} campsites within 50 miles`);
```

### Build Complete Trip Itinerary

```javascript
async function buildTripItinerary(tripId) {
  // Get trip
  const tripResponse = await fetch(`http://localhost:3001/api/trips/${tripId}`);
  const trip = await tripResponse.json();
  
  // Get stops
  const stopsResponse = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`);
  const stops = await stopsResponse.json();
  
  // Get route
  const waypoints = stops.map(s => ({
    latitude: s.location.latitude,
    longitude: s.location.longitude
  }));
  
  const routeResponse = await fetch('http://localhost:3001/api/directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ waypoints })
  });
  const route = await routeResponse.json();
  
  return {
    trip,
    stops,
    route,
    summary: {
      totalDistance: route.distance,
      totalDuration: route.duration,
      stopCount: stops.length
    }
  };
}
```

---

## Error Handling

### JavaScript with Error Handling

```javascript
async function safeApiFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Usage
try {
  const locations = await safeApiFetch('http://localhost:3001/api/locations');
  console.log(`Loaded ${locations.length} locations`);
} catch (error) {
  console.error('Failed to load locations');
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (invalid data)
- `404` - Not Found
- `500` - Internal Server Error

---

## Performance Tips

1. **Use pagination** for large datasets (limit + offset)
2. **Filter server-side** instead of fetching all and filtering client-side
3. **Cache frequently-used data** (like all locations) in localStorage
4. **Debounce search inputs** to reduce API calls during typing

### Caching Example

```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedLocations() {
  const cached = localStorage.getItem('locations');
  const timestamp = localStorage.getItem('locations_timestamp');
  
  if (cached && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  }
  
  // Fetch fresh data
  const response = await fetch('http://localhost:3001/api/locations');
  const locations = await response.json();
  
  // Cache it
  localStorage.setItem('locations', JSON.stringify(locations));
  localStorage.setItem('locations_timestamp', Date.now().toString());
  
  return locations;
}
```

---

## Rate Limiting

*(Currently no rate limiting enforced - update if added)*

For production use, implement reasonable rate limits:
- Max 100 requests per minute per IP
- Use caching to minimize repeated requests
- Batch operations when possible

---

*For more details, see API.md for full endpoint documentation*
