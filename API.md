# TrailCamp API Documentation

Base URL: `http://localhost:3001/api`

## Table of Contents
- [Health & Configuration](#health--configuration)
- [Locations](#locations)
- [Trips](#trips)
- [Trip Stops](#trip-stops)
- [Directions](#directions)

---

## Health & Configuration

### Get Health Status
```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-28T11:16:00.000Z"
}
```

### Get Mapbox Token
```
GET /api/mapbox-token
```

**Response:**
```json
{
  "token": "pk.xxxx..."
}
```

---

## Locations

### Get All Locations
```
GET /api/locations
```

**Query Parameters:**
- `category` (string) - Filter by category (riding|campsite|scenic|dump|water)
- `sub_type` (string) - Filter by sub-type (boondocking|campground|dirt-bike|etc)
- `difficulty` (string) - Filter by difficulty (Beginner|Intermediate|Advanced)
- `visited` (0|1) - Filter by visited status
- `want_to_visit` (0|1) - Filter by want_to_visit flag
- `favorited` (0|1) - Filter by favorited flag
- `min_rating` (number) - Minimum user rating
- `sw_lat`, `sw_lng`, `ne_lat`, `ne_lng` (numbers) - Bounding box filter
- `sort_by=distance` with `from_lat`, `from_lng` - Sort by distance from coordinates
- `trip_month` (1-12) - Add seasonal_status field based on month

**Response:**
```json
[
  {
    "id": 1,
    "name": "Custer State Park Area Trails",
    "description": "...",
    "latitude": 43.7644,
    "longitude": -103.4058,
    "category": "riding",
    "sub_type": "State Park",
    "trail_types": "Single Track,Dual Sport",
    "difficulty": "Intermediate",
    "distance_miles": 25.0,
    "scenery_rating": 10,
    "best_season": "Summer",
    "season": "May-Oct",
    "permit_required": 1,
    "notes": "...",
    "external_links": null,
    "featured": 1,
    "cost_per_night": null,
    "water_available": 0,
    "hours": "Dawn to Dusk"
  }
]
```

### Search Locations
```
GET /api/locations/search?q=searchterm
```

**Query Parameters:**
- `q` (string, required) - Search term

Searches across: name, description, notes, sub_type, trail_types, difficulty

**Response:** Array of matching locations (max 20), sorted by relevance

### Get Location by ID
```
GET /api/locations/:id
```

**Response:** Single location object or 404

### Get Nearby Riding Locations
```
GET /api/locations/nearby-riding
```

**Query Parameters:**
- `latitude` (number, required)
- `longitude` (number, required)
- `radius_miles` (number) - Default: 25

Finds riding locations within radius using Haversine formula.

**Response:** Array of nearby riding locations with distance_miles calculated

### Get Statistics
```
GET /api/locations/stats
```

**Response:**
```json
{
  "total": 5565,
  "by_category": {
    "riding": 1195,
    "campsite": 4358,
    "scenic": 8,
    "dump": 3,
    "water": 1
  },
  "by_sub_type": {
    "boondocking": 482,
    "campground": 3873,
    ...
  },
  "by_difficulty": {
    "Beginner": 156,
    "Intermediate": 789,
    "Advanced": 250
  },
  "by_scenery": {
    "10": 36,
    "9": 65,
    "8": 50,
    ...
  }
}
```

### Update Location
```
PUT /api/locations/:id
```

**Body:**
```json
{
  "visited": 1,
  "want_to_visit": 0,
  "favorited": 1,
  "user_rating": 9,
  "user_notes": "Amazing riding!",
  "visited_date": "2026-08-15"
}
```

Allowed fields: visited, want_to_visit, favorited, user_rating, user_notes, visited_date

**Response:** Updated location object

---

## Trips

### Get All Trips
```
GET /api/trips
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Summer Western Trip",
    "description": "Epic multi-state adventure",
    "status": "planning",
    "start_date": "2026-07-15",
    "end_date": "2026-07-30",
    "notes": "...",
    "created_at": "2026-02-28T10:00:00.000Z",
    "updated_at": "2026-02-28T10:00:00.000Z",
    "stop_count": 5,
    "total_nights": 12,
    "total_distance": 1200
  }
]
```

### Create Trip
```
POST /api/trips
```

**Body:**
```json
{
  "name": "Trip Name",
  "description": "Trip description",
  "status": "planning",
  "start_date": "2026-07-15",
  "end_date": "2026-07-30",
  "notes": "Optional notes"
}
```

**Response:** Created trip object (201)

### Update Trip
```
PUT /api/trips/:id
```

**Body:** Any combination of: name, description, status, start_date, end_date, notes

**Response:** Updated trip object

### Duplicate Trip
```
POST /api/trips/:id/duplicate
```

Creates a copy of the trip with all stops, status set to "planning", name appended with "(Copy)"

**Response:** New trip object (201)

### Delete Trip
```
DELETE /api/trips/:id
```

**Response:** 204 No Content

---

## Trip Stops

### Get Trip Stops
```
GET /api/trips/:id/stops
```

**Response:**
```json
[
  {
    "id": 1,
    "trip_id": 1,
    "location_id": 123,
    "name": "Stop Name",
    "latitude": 43.7644,
    "longitude": -103.4058,
    "sort_order": 0,
    "nights": 2,
    "notes": "...",
    "drive_distance_miles": 250.5,
    "drive_time_minutes": 300,
    "location_name": "Custer State Park",
    "location_category": "campsite"
  }
]
```

### Add Stop to Trip
```
POST /api/trips/:id/stops
```

**Body:**
```json
{
  "location_id": 123,
  "name": "Stop Name",
  "latitude": 43.7644,
  "longitude": -103.4058,
  "sort_order": 0,
  "nights": 2,
  "notes": "Optional stop notes"
}
```

**Response:** Created stop object (201)

### Update Stop
```
PUT /api/trips/:tripId/stops/:stopId
```

**Body:** Any combination of: name, latitude, longitude, sort_order, nights, notes, drive_distance_miles, drive_time_minutes

**Response:** Updated stop object

### Delete Stop
```
DELETE /api/trips/:tripId/stops/:stopId
```

**Response:** 204 No Content

### Reorder Stops
```
PUT /api/trips/:id/stops/reorder
```

**Body:**
```json
{
  "stops": [
    { "id": 1, "sort_order": 0 },
    { "id": 2, "sort_order": 1 },
    { "id": 3, "sort_order": 2 }
  ]
}
```

**Response:** { success: true }

---

## Directions

### Get Directions
```
POST /api/directions
```

**Body:**
```json
{
  "coordinates": [
    [-103.4058, 43.7644],
    [-105.2058, 44.1234]
  ]
}
```

Uses Mapbox Directions API to calculate driving route.

**Response:**
```json
{
  "routes": [...],
  "distance": 125.5,
  "duration": 7200
}
```

---

## Example Usage

### Get all riding locations in Colorado
```bash
curl "http://localhost:3001/api/locations?category=riding" | jq '.[] | select(.name | contains("CO"))'
```

### Search for boondocking spots
```bash
curl "http://localhost:3001/api/locations/search?q=boondocking"
```

### Create a new trip
```bash
curl -X POST http://localhost:3001/api/trips \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Adventure",
    "description": "Multi-state motorcycle trip",
    "status": "planning",
    "start_date": "2026-07-15",
    "end_date": "2026-07-30"
  }'
```

### Get featured locations
```bash
curl "http://localhost:3001/api/locations" | jq '.[] | select(.featured == 1)'
```

### Find riding within 50 miles of coordinates
```bash
curl "http://localhost:3001/api/locations/nearby-riding?latitude=43.7644&longitude=-103.4058&radius_miles=50"
```

---

## Error Responses

All endpoints return standard HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```
