# TrailCamp API Usage Examples

Quick reference for using the TrailCamp API with curl, fetch, and axios.

**Base URL:** `http://localhost:3001/api` (development)

---

## Table of Contents

1. [Health Check](#health-check)
2. [Get All Locations](#get-all-locations)
3. [Filter Locations](#filter-locations)
4. [Get Single Location](#get-single-location)
5. [Trip Management](#trip-management)
6. [Advanced Queries](#advanced-queries)
7. [Error Handling](#error-handling)

---

## Health Check

### Check API Status

**Endpoint:** `GET /api/health`

**curl:**
```bash
curl http://localhost:3001/api/health
```

**fetch (JavaScript):**
```javascript
const health = await fetch('http://localhost:3001/api/health')
  .then(res => res.json());
console.log(health);
// { status: "ok", timestamp: "2026-02-28T18:52:00.000Z" }
```

**axios:**
```javascript
import axios from 'axios';

const { data } = await axios.get('http://localhost:3001/api/health');
console.log(data);
```

---

## Get All Locations

### Get All Locations (No Filter)

**Endpoint:** `GET /api/locations`

**curl:**
```bash
curl http://localhost:3001/api/locations
```

**fetch:**
```javascript
const locations = await fetch('http://localhost:3001/api/locations')
  .then(res => res.json());
console.log(`Found ${locations.length} locations`);
```

**axios:**
```javascript
const { data: locations } = await axios.get('http://localhost:3001/api/locations');
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Moab Brand Trails",
    "description": "World-class single track...",
    "latitude": 38.5733,
    "longitude": -109.5498,
    "category": "riding",
    "trail_types": "Single Track,Technical",
    "difficulty": "Hard",
    "distance_miles": 30,
    "scenery_rating": 10,
    "best_season": "Spring,Fall",
    ...
  },
  ...
]
```

---

## Filter Locations

### By Category

Get only riding locations:

**curl:**
```bash
curl "http://localhost:3001/api/locations?category=riding"
```

**fetch:**
```javascript
const riding = await fetch('http://localhost:3001/api/locations?category=riding')
  .then(res => res.json());
```

Get only campsites:

**curl:**
```bash
curl "http://localhost:3001/api/locations?category=campsite"
```

---

### By Scenery Rating

Get locations with scenery >= 8:

**curl:**
```bash
curl "http://localhost:3001/api/locations?scenery_min=8"
```

**fetch:**
```javascript
const scenic = await fetch('http://localhost:3001/api/locations?scenery_min=8')
  .then(res => res.json());
console.log(`Found ${scenic.length} highly scenic locations`);
```

Get locations with exact scenery rating:

**curl:**
```bash
curl "http://localhost:3001/api/locations?scenery_rating=10"
```

---

### By Difficulty

Get hard trails only:

**curl:**
```bash
curl "http://localhost:3001/api/locations?difficulty=Hard"
```

**fetch:**
```javascript
const hardTrails = await fetch('http://localhost:3001/api/locations?difficulty=Hard')
  .then(res => res.json());
```

Valid difficulty values: `Easy`, `Beginner`, `Moderate`, `Intermediate`, `Hard`, `Advanced`, `Expert`

---

### By Sub-Type

Get boondocking spots only:

**curl:**
```bash
curl "http://localhost:3001/api/locations?category=campsite&sub_type=boondocking"
```

**fetch:**
```javascript
const boondocking = await fetch(
  'http://localhost:3001/api/locations?category=campsite&sub_type=boondocking'
).then(res => res.json());
```

---

### By Season

Get summer riding locations:

**curl:**
```bash
curl "http://localhost:3001/api/locations?best_season=Summer"
```

**fetch:**
```javascript
const summerRides = await fetch(
  'http://localhost:3001/api/locations?best_season=Summer'
).then(res => res.json());
```

---

### Pagination

Limit results:

**curl:**
```bash
# Get first 50 results
curl "http://localhost:3001/api/locations?limit=50"

# Get results 51-100 (offset + limit)
curl "http://localhost:3001/api/locations?offset=50&limit=50"
```

**fetch:**
```javascript
// Page 1 (first 50)
const page1 = await fetch('http://localhost:3001/api/locations?limit=50')
  .then(res => res.json());

// Page 2 (next 50)
const page2 = await fetch('http://localhost:3001/api/locations?offset=50&limit=50')
  .then(res => res.json());
```

---

### Multiple Filters

Combine multiple filters:

**curl:**
```bash
# Hard trails with high scenery in summer
curl "http://localhost:3001/api/locations?category=riding&difficulty=Hard&scenery_min=8&best_season=Summer"
```

**fetch:**
```javascript
const params = new URLSearchParams({
  category: 'riding',
  difficulty: 'Hard',
  scenery_min: '8',
  best_season: 'Summer'
});

const results = await fetch(`http://localhost:3001/api/locations?${params}`)
  .then(res => res.json());
```

**axios:**
```javascript
const { data } = await axios.get('http://localhost:3001/api/locations', {
  params: {
    category: 'riding',
    difficulty: 'Hard',
    scenery_min: 8,
    best_season: 'Summer'
  }
});
```

---

## Get Single Location

### By ID

**Endpoint:** `GET /api/locations/:id`

**curl:**
```bash
curl http://localhost:3001/api/locations/123
```

**fetch:**
```javascript
const locationId = 123;
const location = await fetch(`http://localhost:3001/api/locations/${locationId}`)
  .then(res => res.json());
```

**axios:**
```javascript
const { data: location } = await axios.get(`http://localhost:3001/api/locations/123`);
```

---

## Trip Management

### Get All Trips

**Endpoint:** `GET /api/trips`

**curl:**
```bash
curl http://localhost:3001/api/trips
```

**fetch:**
```javascript
const trips = await fetch('http://localhost:3001/api/trips')
  .then(res => res.json());
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Utah Desert Adventure",
    "start_date": "2026-04-15",
    "end_date": "2026-04-22",
    "notes": "Spring break trip",
    "created_at": "2026-02-28T12:00:00.000Z"
  },
  ...
]
```

---

### Get Single Trip with Stops

**Endpoint:** `GET /api/trips/:id`

**curl:**
```bash
curl http://localhost:3001/api/trips/1
```

**fetch:**
```javascript
const trip = await fetch('http://localhost:3001/api/trips/1')
  .then(res => res.json());
console.log(trip.stops); // Array of trip stops with location details
```

**Response:**
```json
{
  "id": 1,
  "name": "Utah Desert Adventure",
  "start_date": "2026-04-15",
  "end_date": "2026-04-22",
  "notes": "Spring break trip",
  "stops": [
    {
      "id": 1,
      "trip_id": 1,
      "location_id": 123,
      "order_index": 0,
      "arrival_date": "2026-04-15",
      "departure_date": "2026-04-17",
      "notes": "Base camp for Moab riding",
      "location": {
        "id": 123,
        "name": "Sand Flats Recreation Area",
        ...
      }
    },
    ...
  ]
}
```

---

### Create a Trip

**Endpoint:** `POST /api/trips`

**curl:**
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "California Coast Trip",
    "start_date": "2026-06-01",
    "end_date": "2026-06-10",
    "notes": "PCH + Big Sur riding"
  }'
```

**fetch:**
```javascript
const newTrip = await fetch('http://localhost:3001/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'California Coast Trip',
    start_date: '2026-06-01',
    end_date: '2026-06-10',
    notes: 'PCH + Big Sur riding'
  })
}).then(res => res.json());

console.log(`Created trip ID: ${newTrip.id}`);
```

**axios:**
```javascript
const { data: newTrip } = await axios.post('http://localhost:3001/api/trips', {
  name: 'California Coast Trip',
  start_date: '2026-06-01',
  end_date: '2026-06-10',
  notes: 'PCH + Big Sur riding'
});
```

---

### Add Stop to Trip

**Endpoint:** `POST /api/trips/:tripId/stops`

**curl:**
```bash
curl -X POST http://localhost:3001/api/trips/1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 456,
    "order_index": 0,
    "arrival_date": "2026-06-01",
    "departure_date": "2026-06-03",
    "notes": "First stop - explore Big Sur"
  }'
```

**fetch:**
```javascript
const stop = await fetch('http://localhost:3001/api/trips/1/stops', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location_id: 456,
    order_index: 0,
    arrival_date: '2026-06-01',
    departure_date: '2026-06-03',
    notes: 'First stop - explore Big Sur'
  })
}).then(res => res.json());
```

---

### Delete a Trip

**Endpoint:** `DELETE /api/trips/:id`

**curl:**
```bash
curl -X DELETE http://localhost:3001/api/trips/1
```

**fetch:**
```javascript
await fetch('http://localhost:3001/api/trips/1', {
  method: 'DELETE'
});
```

---

## Advanced Queries

### Search by Name (if implemented)

**curl:**
```bash
curl "http://localhost:3001/api/locations?search=moab"
```

---

### Get Featured/Bucket-List Locations

**Endpoint:** `GET /api/locations/featured`

**curl:**
```bash
curl http://localhost:3001/api/locations/featured
```

**fetch:**
```javascript
const bucketList = await fetch('http://localhost:3001/api/locations/featured')
  .then(res => res.json());
```

Filter featured by category:

**curl:**
```bash
curl "http://localhost:3001/api/locations/featured?category=riding"
```

---

### Get Nearby Locations (if implemented)

**curl:**
```bash
# Get locations within 50 miles of coordinates
curl "http://localhost:3001/api/locations/nearby?lat=38.5733&lon=-109.5498&radius=50"
```

---

## Error Handling

### Handle HTTP Errors

**fetch with error handling:**
```javascript
try {
  const response = await fetch('http://localhost:3001/api/locations/999999');
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const location = await response.json();
  console.log(location);
} catch (error) {
  console.error('Failed to fetch location:', error);
}
```

**axios with error handling:**
```javascript
try {
  const { data } = await axios.get('http://localhost:3001/api/locations/999999');
  console.log(data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error(`Error ${error.response.status}:`, error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

### Common Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 200 | OK | Success |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Location/trip doesn't exist |
| 500 | Internal Server Error | Database or server issue |

---

## Complete Examples

### Build a Trip Planner

```javascript
// 1. Find high-scenery boondocking in Utah
const campsites = await fetch(
  'http://localhost:3001/api/locations?' + new URLSearchParams({
    category: 'campsite',
    sub_type: 'boondocking',
    scenery_min: 8,
    best_season: 'Spring'
  })
).then(res => res.json());

// 2. Find nearby hard trails
const trails = await fetch(
  'http://localhost:3001/api/locations?' + new URLSearchParams({
    category: 'riding',
    difficulty: 'Hard',
    scenery_min: 8
  })
).then(res => res.json());

// 3. Create a trip
const trip = await fetch('http://localhost:3001/api/trips', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Utah Spring Adventure',
    start_date: '2026-04-15',
    end_date: '2026-04-22'
  })
}).then(res => res.json());

// 4. Add stops
for (let i = 0; i < campsites.slice(0, 3).length; i++) {
  await fetch(`http://localhost:3001/api/trips/${trip.id}/stops`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location_id: campsites[i].id,
      order_index: i,
      arrival_date: `2026-04-${15 + (i * 2)}`,
      departure_date: `2026-04-${17 + (i * 2)}`
    })
  });
}

console.log(`Created trip with ${campsites.slice(0, 3).length} stops!`);
```

---

### Filter and Export

```javascript
// Get all 10/10 scenery locations and save to JSON
const epicLocations = await fetch(
  'http://localhost:3001/api/locations?scenery_rating=10'
).then(res => res.json());

// Save to file (Node.js)
const fs = require('fs');
fs.writeFileSync('epic-locations.json', JSON.stringify(epicLocations, null, 2));
console.log(`Saved ${epicLocations.length} epic locations to epic-locations.json`);
```

---

## Query Parameters Reference

### Locations Endpoint

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `category` | string | Filter by category | `riding`, `campsite` |
| `sub_type` | string | Filter by sub-type | `boondocking`, `campground` |
| `difficulty` | string | Filter by difficulty | `Hard`, `Moderate` |
| `trail_types` | string | Filter by trail type | `Single Track` |
| `scenery_rating` | number | Exact scenery rating | `10` |
| `scenery_min` | number | Minimum scenery rating | `8` |
| `best_season` | string | Filter by season | `Summer`, `Winter` |
| `limit` | number | Max results to return | `50` |
| `offset` | number | Skip first N results | `50` |
| `search` | string | Search by name | `moab` |

---

**For more details, see [API.md](./API.md) for complete endpoint documentation.**
