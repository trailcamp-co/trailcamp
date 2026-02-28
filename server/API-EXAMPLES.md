# TrailCamp API Usage Examples

Complete examples for all TrailCamp API endpoints with `curl` and JavaScript `fetch`.

## Base URL

```
http://localhost:3001/api
```

Production: Replace with your deployed API URL.

---

## Table of Contents

1. [Health Check](#health-check)
2. [Locations Endpoints](#locations-endpoints)
3. [Trips Endpoints](#trips-endpoints)
4. [Filtering & Searching](#filtering--searching)
5. [Error Handling](#error-handling)

---

## Health Check

### GET /api/health

Check if the API is running.

**curl:**
```bash
curl http://localhost:3001/api/health
```

**fetch:**
```javascript
const response = await fetch('http://localhost:3001/api/health');
const data = await response.json();
console.log(data);
// { "status": "ok", "timestamp": "2026-02-28T19:42:00.000Z" }
```

---

## Locations Endpoints

### GET /api/locations

Get all locations (or filtered subset).

**curl:**
```bash
# Get all locations
curl http://localhost:3001/api/locations

# Get first 50 locations
curl "http://localhost:3001/api/locations?limit=50"

# Get locations 51-100 (pagination)
curl "http://localhost:3001/api/locations?limit=50&offset=50"
```

**fetch:**
```javascript
// Get all riding locations
const response = await fetch('http://localhost:3001/api/locations?category=riding');
const locations = await response.json();
console.log(`Found ${locations.length} riding locations`);

// Paginated request
async function getLocationPage(page = 0, pageSize = 50) {
  const offset = page * pageSize;
  const response = await fetch(
    `http://localhost:3001/api/locations?limit=${pageSize}&offset=${offset}`
  );
  return response.json();
}

const firstPage = await getLocationPage(0);
const secondPage = await getLocationPage(1);
```

### GET /api/locations/:id

Get a single location by ID.

**curl:**
```bash
curl http://localhost:3001/api/locations/123
```

**fetch:**
```javascript
async function getLocation(id) {
  const response = await fetch(`http://localhost:3001/api/locations/${id}`);
  if (!response.ok) {
    throw new Error(`Location ${id} not found`);
  }
  return response.json();
}

const location = await getLocation(123);
console.log(location.name, location.category);
```

### POST /api/locations

Create a new location.

**curl:**
```bash
curl -X POST http://localhost:3001/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Trail",
    "description": "Amazing single track",
    "latitude": 40.1234,
    "longitude": -105.6789,
    "category": "riding",
    "trail_types": "Single Track,Enduro",
    "difficulty": "Moderate",
    "distance_miles": 15,
    "scenery_rating": 8
  }'
```

**fetch:**
```javascript
async function createLocation(locationData) {
  const response = await fetch('http://localhost:3001/api/locations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create location');
  }
  
  return response.json();
}

const newLocation = await createLocation({
  name: 'Epic Trail',
  latitude: 39.5,
  longitude: -106.2,
  category: 'riding',
  trail_types: 'Single Track',
  difficulty: 'Hard',
  distance_miles: 25,
  scenery_rating: 9,
});

console.log('Created location:', newLocation.id);
```

### PUT /api/locations/:id

Update an existing location.

**curl:**
```bash
curl -X PUT http://localhost:3001/api/locations/123 \
  -H "Content-Type: application/json" \
  -d '{
    "scenery_rating": 9,
    "notes": "Updated with better trail info"
  }'
```

**fetch:**
```javascript
async function updateLocation(id, updates) {
  const response = await fetch(`http://localhost:3001/api/locations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update location');
  }
  
  return response.json();
}

await updateLocation(123, {
  scenery_rating: 10,
  permit_info: 'USFS pass required',
});
```

### DELETE /api/locations/:id

Delete a location.

**curl:**
```bash
curl -X DELETE http://localhost:3001/api/locations/123
```

**fetch:**
```javascript
async function deleteLocation(id) {
  const response = await fetch(`http://localhost:3001/api/locations/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete location');
  }
  
  return response.json();
}

await deleteLocation(123);
```

---

## Trips Endpoints

### GET /api/trips

Get all trips.

**curl:**
```bash
curl http://localhost:3001/api/trips
```

**fetch:**
```javascript
const response = await fetch('http://localhost:3001/api/trips');
const trips = await response.json();
console.log(`You have ${trips.length} trips`);
```

### GET /api/trips/:id

Get a single trip with all stops.

**curl:**
```bash
curl http://localhost:3001/api/trips/1
```

**fetch:**
```javascript
async function getTrip(id) {
  const response = await fetch(`http://localhost:3001/api/trips/${id}`);
  return response.json();
}

const trip = await getTrip(1);
console.log(`${trip.name}: ${trip.stops.length} stops`);
```

### POST /api/trips

Create a new trip.

**curl:**
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colorado Adventure",
    "start_date": "2026-07-01",
    "end_date": "2026-07-07",
    "notes": "Week-long riding trip"
  }'
```

**fetch:**
```javascript
async function createTrip(tripData) {
  const response = await fetch('http://localhost:3001/api/trips', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tripData),
  });
  return response.json();
}

const trip = await createTrip({
  name: 'Utah Summer Ride',
  start_date: '2026-08-15',
  end_date: '2026-08-22',
});
```

### POST /api/trips/:id/stops

Add a stop to a trip.

**curl:**
```bash
curl -X POST http://localhost:3001/api/trips/1/stops \
  -H "Content-Type: application/json" \
  -d '{
    "location_id": 456,
    "order_index": 0,
    "arrival_date": "2026-07-01",
    "departure_date": "2026-07-02"
  }'
```

**fetch:**
```javascript
async function addStopToTrip(tripId, stopData) {
  const response = await fetch(`http://localhost:3001/api/trips/${tripId}/stops`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stopData),
  });
  return response.json();
}

await addStopToTrip(1, {
  location_id: 456,
  order_index: 0,
  arrival_date: '2026-07-01',
});
```

### DELETE /api/trips/:id

Delete a trip.

**curl:**
```bash
curl -X DELETE http://localhost:3001/api/trips/1
```

**fetch:**
```javascript
async function deleteTrip(id) {
  const response = await fetch(`http://localhost:3001/api/trips/${id}`, {
    method: 'DELETE',
  });
  return response.json();
}

await deleteTrip(1);
```

---

## Filtering & Searching

### Filter by Category

**curl:**
```bash
# Get all riding locations
curl "http://localhost:3001/api/locations?category=riding"

# Get all campsites
curl "http://localhost:3001/api/locations?category=campsite"
```

**fetch:**
```javascript
// Get boondocking spots
const response = await fetch(
  'http://localhost:3001/api/locations?category=campsite&sub_type=boondocking'
);
const boondocking = await response.json();
```

### Filter by Difficulty

**curl:**
```bash
# Get hard trails
curl "http://localhost:3001/api/locations?difficulty=Hard"
```

**fetch:**
```javascript
const response = await fetch('http://localhost:3001/api/locations?difficulty=Moderate');
const moderateTrails = await response.json();
```

### Filter by Scenery Rating

**curl:**
```bash
# Get locations with scenery 8+
curl "http://localhost:3001/api/locations?scenery_min=8"

# Get locations with scenery 9+
curl "http://localhost:3001/api/locations?scenery_min=9"
```

**fetch:**
```javascript
// Get bucket-list scenery locations
const response = await fetch('http://localhost:3001/api/locations?scenery_min=9');
const epicLocations = await response.json();
console.log(`Found ${epicLocations.length} epic locations`);
```

### Filter by Season

**curl:**
```bash
# Get summer locations
curl "http://localhost:3001/api/locations?best_season=Summer"
```

**fetch:**
```javascript
const response = await fetch('http://localhost:3001/api/locations?best_season=Winter');
const winterLocations = await response.json();
```

### Multiple Filters

**curl:**
```bash
# Hard trails with high scenery in summer
curl "http://localhost:3001/api/locations?category=riding&difficulty=Hard&scenery_min=8&best_season=Summer"
```

**fetch:**
```javascript
// Build query dynamically
const params = new URLSearchParams({
  category: 'riding',
  difficulty: 'Moderate',
  scenery_min: '7',
  limit: '50',
});

const response = await fetch(`http://localhost:3001/api/locations?${params}`);
const results = await response.json();
```

### Search by Name (if implemented)

**curl:**
```bash
# Search for "Moab" in name
curl "http://localhost:3001/api/locations?search=Moab"
```

**fetch:**
```javascript
async function searchLocations(query) {
  const params = new URLSearchParams({ search: query });
  const response = await fetch(`http://localhost:3001/api/locations?${params}`);
  return response.json();
}

const results = await searchLocations('national park');
```

---

## Error Handling

### Handling HTTP Errors

**fetch:**
```javascript
async function safeApiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API call failed:', error.message);
    throw error;
  }
}

// Usage
try {
  const location = await safeApiCall('http://localhost:3001/api/locations/999');
} catch (error) {
  console.error('Failed to fetch location:', error.message);
  // Handle error (show user message, retry, etc.)
}
```

### Common HTTP Status Codes

- **200 OK** - Successful GET, PUT, DELETE
- **201 Created** - Successful POST (new resource created)
- **400 Bad Request** - Invalid data (missing required fields, invalid values)
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error (check logs)

### Validation Errors

**Example response (400 Bad Request):**
```json
{
  "error": "Validation failed: latitude is required"
}
```

**Handling:**
```javascript
try {
  await createLocation({ name: 'Test' }); // Missing required latitude/longitude
} catch (error) {
  if (error.message.includes('Validation failed')) {
    console.error('Please provide all required fields:', error.message);
  }
}
```

---

## Advanced Examples

### Batch Operations

```javascript
// Add multiple locations
async function batchCreateLocations(locations) {
  const results = [];
  for (const loc of locations) {
    try {
      const created = await createLocation(loc);
      results.push({ success: true, id: created.id });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  return results;
}

const locations = [
  { name: 'Trail 1', latitude: 40.1, longitude: -105.1, category: 'riding' },
  { name: 'Trail 2', latitude: 40.2, longitude: -105.2, category: 'riding' },
];

const results = await batchCreateLocations(locations);
console.log(`Created ${results.filter(r => r.success).length} locations`);
```

### Building a Location Search UI

```javascript
// Debounced search function
let searchTimeout;

function searchWithDebounce(query, callback, delay = 300) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const results = await searchLocations(query);
    callback(results);
  }, delay);
}

// Usage in a search input handler
searchInput.addEventListener('input', (e) => {
  const query = e.target.value;
  if (query.length >= 3) {
    searchWithDebounce(query, (results) => {
      displaySearchResults(results);
    });
  }
});
```

### Nearby Locations

```javascript
// Find locations near coordinates (client-side filtering)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearbyLocations(lat, lon, radiusMiles = 50) {
  const allLocations = await fetch('http://localhost:3001/api/locations').then(r => r.json());
  
  return allLocations
    .map(loc => ({
      ...loc,
      distance: haversineDistance(lat, lon, loc.latitude, loc.longitude)
    }))
    .filter(loc => loc.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}

// Find riding within 30 miles of a campsite
const nearby = await findNearbyLocations(39.5, -106.0, 30);
console.log(`Found ${nearby.length} locations within 30 miles`);
```

---

## Testing API Locally

### Using curl for Quick Tests

```bash
# Health check
curl -s http://localhost:3001/api/health | jq

# Pretty-print JSON response with jq
curl -s "http://localhost:3001/api/locations?limit=5" | jq '.[:2]'

# Save response to file
curl -s http://localhost:3001/api/locations > locations.json

# Check response time
curl -w "\nTime: %{time_total}s\n" -s -o /dev/null http://localhost:3001/api/locations
```

### Browser Developer Tools

```javascript
// Paste in browser console (with dev server running)
fetch('http://localhost:3001/api/locations?category=riding&limit=10')
  .then(r => r.json())
  .then(data => console.table(data));
```

---

## Rate Limiting & Best Practices

### Best Practices

1. **Cache responses** when data doesn't change frequently
2. **Use pagination** for large datasets (limit + offset)
3. **Debounce search** to avoid excessive requests
4. **Handle errors gracefully** with user-friendly messages
5. **Validate data client-side** before sending to API

### Performance Tips

- Request only the data you need (use filters)
- Use `limit` parameter to reduce payload size
- Cache static data (categories, difficulty levels, etc.)
- Implement retry logic for failed requests

---

*Last updated: 2026-02-28*
*API Version: 1.0*
