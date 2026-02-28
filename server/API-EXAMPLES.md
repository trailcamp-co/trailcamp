# TrailCamp API Usage Examples

Practical examples for interacting with the TrailCamp API using curl, fetch, and axios.

## Base URL

Development: `http://localhost:3001/api`

---

## Health Check

### curl
```bash
curl http://localhost:3001/api/health
```

### fetch
```javascript
const health = await fetch('http://localhost:3001/api/health')
  .then(r => r.json());
console.log(health);
// { status: "ok", timestamp: "2026-02-28T..." }
```

---

## Get All Locations

### curl
```bash
# Get all locations
curl http://localhost:3001/api/locations

# Get first 50 locations
curl http://localhost:3001/api/locations?limit=50

# Get next 50 (pagination)
curl http://localhost:3001/api/locations?limit=50&offset=50
```

### fetch
```javascript
// Get all locations
const locations = await fetch('http://localhost:3001/api/locations')
  .then(r => r.json());

console.log(`Found ${locations.length} locations`);
```

### axios
```javascript
import axios from 'axios';

const { data } = await axios.get('http://localhost:3001/api/locations');
console.log(`Found ${data.length} locations`);
```

---

## Filter Locations by Category

### curl
```bash
# Get all riding locations
curl "http://localhost:3001/api/locations?category=riding"

# Get all campsites
curl "http://localhost:3001/api/locations?category=campsite"

# Get dump stations
curl "http://localhost:3001/api/locations?category=dump"
```

### fetch
```javascript
// Get riding locations
const riding = await fetch('http://localhost:3001/api/locations?category=riding')
  .then(r => r.json());

console.log(`Found ${riding.length} riding spots`);
```

---

## Filter by Sub-Type

### curl
```bash
# Get boondocking spots
curl "http://localhost:3001/api/locations?category=campsite&sub_type=boondocking"

# Get developed campgrounds
curl "http://localhost:3001/api/locations?category=campsite&sub_type=campground"
```

### fetch
```javascript
const boondocking = await fetch(
  'http://localhost:3001/api/locations?category=campsite&sub_type=boondocking'
).then(r => r.json());

console.log(`Found ${boondocking.length} boondocking spots`);
```

---

## Filter by Scenery Rating

### curl
```bash
# Get locations with scenery >= 8
curl "http://localhost:3001/api/locations?scenery_min=8"

# Get locations with scenery >= 9
curl "http://localhost:3001/api/locations?scenery_min=9"

# Get epic riding (category=riding AND scenery >= 9)
curl "http://localhost:3001/api/locations?category=riding&scenery_min=9"
```

### fetch
```javascript
// Get epic riding spots (9+ scenery)
const epicRiding = await fetch(
  'http://localhost:3001/api/locations?category=riding&scenery_min=9'
).then(r => r.json());

console.log(`Found ${epicRiding.length} epic riding locations`);
```

---

## Filter by Difficulty

### curl
```bash
# Get easy trails
curl "http://localhost:3001/api/locations?difficulty=Easy"

# Get hard trails
curl "http://localhost:3001/api/locations?difficulty=Hard"

# Get expert-level trails
curl "http://localhost:3001/api/locations?difficulty=Expert"
```

### fetch
```javascript
const easyTrails = await fetch(
  'http://localhost:3001/api/locations?difficulty=Easy'
).then(r => r.json());
```

---

## Filter by Season

### curl
```bash
# Get summer riding
curl "http://localhost:3001/api/locations?best_season=Summer"

# Get winter camping
curl "http://localhost:3001/api/locations?best_season=Winter"

# Get year-round locations
curl "http://localhost:3001/api/locations?best_season=Year-round"
```

### fetch
```javascript
const summerRiding = await fetch(
  'http://localhost:3001/api/locations?best_season=Summer'
).then(r => r.json());
```

---

## Get Single Location by ID

### curl
```bash
# Get location with ID 123
curl http://localhost:3001/api/locations/123
```

### fetch
```javascript
const locationId = 123;
const location = await fetch(`http://localhost:3001/api/locations/${locationId}`)
  .then(r => r.json());

console.log(location.name);
```

---

## Get All Trips

### curl
```bash
curl http://localhost:3001/api/trips
```

### fetch
```javascript
const trips = await fetch('http://localhost:3001/api/trips')
  .then(r => r.json());

console.log(`You have ${trips.length} saved trips`);
```

---

## Get Single Trip with Stops

### curl
```bash
# Get trip with ID 5 (includes all stops with full location data)
curl http://localhost:3001/api/trips/5
```

### fetch
```javascript
const tripId = 5;
const trip = await fetch(`http://localhost:3001/api/trips/${tripId}`)
  .then(r => r.json());

console.log(`${trip.name} has ${trip.stops.length} stops`);

// Access stop details
trip.stops.forEach((stop, index) => {
  console.log(`Stop ${index + 1}: ${stop.location.name}`);
});
```

---

## Create a New Trip

### curl
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colorado Adventure",
    "description": "Epic mountain riding",
    "start_date": "2026-07-15",
    "end_date": "2026-07-22"
  }'
```

### fetch
```javascript
const newTrip = await fetch('http://localhost:3001/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Colorado Adventure',
    description: 'Epic mountain riding',
    start_date: '2026-07-15',
    end_date: '2026-07-22'
  })
}).then(r => r.json());

console.log(`Created trip with ID: ${newTrip.id}`);
```

### axios
```javascript
const newTrip = await axios.post('http://localhost:3001/api/trips', {
  name: 'Colorado Adventure',
  description: 'Epic mountain riding',
  start_date: '2026-07-15',
  end_date: '2026-07-22'
});

console.log(`Created trip with ID: ${newTrip.data.id}`);
```

---

## Add Stop to Trip

### curl
```bash
# Add location 456 to trip 5 at position 1
curl -X POST http://localhost:3001/api/trips/5/stops \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 456,
    "order_index": 1
  }'
```

### fetch
```javascript
const tripId = 5;
const locationId = 456;

const stop = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location_id: locationId,
    order_index: 1
  })
}).then(r => r.json());

console.log(`Added stop with ID: ${stop.id}`);
```

---

## Update Trip

### curl
```bash
curl -X PUT http://localhost:3001/api/trips/5 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colorado Summer Ride",
    "description": "Updated description"
  }'
```

### fetch
```javascript
const tripId = 5;

const updated = await fetch(`http://localhost:3001/api/trips/${tripId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Colorado Summer Ride',
    description: 'Updated description'
  })
}).then(r => r.json());
```

---

## Delete Trip Stop

### curl
```bash
# Delete stop with ID 123
curl -X DELETE http://localhost:3001/api/trip-stops/123
```

### fetch
```javascript
const stopId = 123;

await fetch(`http://localhost:3001/api/trip-stops/${stopId}`, {
  method: 'DELETE'
});

console.log('Stop deleted');
```

---

## Delete Trip

### curl
```bash
# Delete trip with ID 5
curl -X DELETE http://localhost:3001/api/trips/5
```

### fetch
```javascript
const tripId = 5;

await fetch(`http://localhost:3001/api/trips/${tripId}`, {
  method: 'DELETE'
});

console.log('Trip deleted');
```

---

## Get Mapbox Directions

### curl
```bash
# Get driving route between two coordinates
curl "http://localhost:3001/api/directions?waypoints=-105.2705,40.0150;-106.8175,39.5501"
```

### fetch
```javascript
// Get route between two waypoints
const waypoints = '-105.2705,40.0150;-106.8175,39.5501';

const route = await fetch(
  `http://localhost:3001/api/directions?waypoints=${waypoints}`
).then(r => r.json());

console.log(`Distance: ${route.distance} miles`);
console.log(`Duration: ${route.duration} hours`);
```

---

## Common Use Case Examples

### 1. Find Epic Boondocking in Colorado

```javascript
// Get high-scenery boondocking spots
const epicBoondocking = await fetch(
  'http://localhost:3001/api/locations?' +
  'category=campsite&' +
  'sub_type=boondocking&' +
  'scenery_min=8'
).then(r => r.json());

// Filter for Colorado (latitude ~37-41, longitude ~-109 to -102)
const colorado = epicBoondocking.filter(loc =>
  loc.latitude >= 37 && loc.latitude <= 41 &&
  loc.longitude >= -109 && loc.longitude <= -102
);

console.log(`Found ${colorado.length} epic boondocking spots in Colorado`);
```

### 2. Build a Trip Itinerary

```javascript
// Create new trip
const trip = await fetch('http://localhost:3001/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Utah Adventure',
    start_date: '2026-09-01',
    end_date: '2026-09-07'
  })
}).then(r => r.json());

// Add stops
const stops = [345, 678, 912];  // location IDs

for (let i = 0; i < stops.length; i++) {
  await fetch(`http://localhost:3001/api/trips/${trip.id}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location_id: stops[i],
      order_index: i
    })
  });
}

console.log('Trip created with', stops.length, 'stops');
```

### 3. Find Summer Riding Near a Location

```javascript
// Get summer riding spots
const summerRiding = await fetch(
  'http://localhost:3001/api/locations?category=riding&best_season=Summer'
).then(r => r.json());

// Filter within radius of target (simple lat/lon box)
const targetLat = 40.0;
const targetLon = -105.0;
const radius = 1.0;  // degrees (~70 miles)

const nearby = summerRiding.filter(loc =>
  Math.abs(loc.latitude - targetLat) < radius &&
  Math.abs(loc.longitude - targetLon) < radius
);

console.log(`Found ${nearby.length} summer riding spots nearby`);
```

### 4. Get Free Camping Options

```javascript
// Get all free campsites
const freeCamping = await fetch(
  'http://localhost:3001/api/locations?category=campsite&cost_per_night=0'
).then(r => r.json());

// Or get boondocking (usually free)
const boondocking = await fetch(
  'http://localhost:3001/api/locations?category=campsite&sub_type=boondocking'
).then(r => r.json());

console.log(`${freeCamping.length} free campsites`);
console.log(`${boondocking.length} boondocking spots`);
```

---

## Error Handling

### Best Practice
```javascript
async function getLocations() {
  try {
    const response = await fetch('http://localhost:3001/api/locations');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}
```

### With axios
```javascript
import axios from 'axios';

try {
  const { data } = await axios.get('http://localhost:3001/api/locations');
  return data;
} catch (error) {
  if (error.response) {
    console.error('Server error:', error.response.status);
  } else if (error.request) {
    console.error('Network error');
  } else {
    console.error('Error:', error.message);
  }
  return [];
}
```

---

## Query Parameter Reference

| Parameter | Type | Example | Description |
|-----------|------|---------|-------------|
| `category` | string | `riding`, `campsite` | Filter by location type |
| `sub_type` | string | `boondocking`, `campground` | Filter by sub-type |
| `difficulty` | string | `Easy`, `Moderate`, `Hard` | Filter riding by difficulty |
| `best_season` | string | `Summer`, `Winter` | Filter by best season |
| `scenery_min` | integer | `8`, `9` | Minimum scenery rating |
| `limit` | integer | `50`, `100` | Limit results (pagination) |
| `offset` | integer | `50`, `100` | Skip N results (pagination) |

---

## Response Formats

### Location Object
```json
{
  "id": 123,
  "name": "Trail Name",
  "description": "Description...",
  "latitude": 40.1234,
  "longitude": -105.6789,
  "category": "riding",
  "sub_type": null,
  "trail_types": "Single Track,Enduro",
  "difficulty": "Moderate",
  "distance_miles": 25,
  "scenery_rating": 8,
  "best_season": "Summer",
  "cell_signal": "None",
  "permit_required": 1,
  "permit_info": "USFS pass required",
  "cost_per_night": null,
  "notes": "Trailhead at mile 12",
  "external_links": "https://...",
  "source": "manual"
}
```

### Trip Object (with stops)
```json
{
  "id": 5,
  "name": "Colorado Adventure",
  "description": "Epic mountain riding",
  "start_date": "2026-07-15",
  "end_date": "2026-07-22",
  "stops": [
    {
      "id": 45,
      "trip_id": 5,
      "location_id": 123,
      "order_index": 0,
      "location": {
        "id": 123,
        "name": "Location Name",
        ...
      }
    }
  ]
}
```

---

*See API.md for complete endpoint documentation*
