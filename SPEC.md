# TrailCamp — Personal Trip Planning App

## Overview
All-in-one trip planning app for truck camper boondocking + dirt bike riding trips across the US. Dark-mode-first, full app experience. Built for a single user (Nicos) who travels with a 2023 F350 DRW + Northern Lite 10-2 truck camper and rides a Stark Varg EX + Husqvarna FE 501S (both street legal).

## Tech Stack
- **Frontend**: React 18 + Vite, TypeScript
- **Maps**: Mapbox GL JS (satellite, topo, hybrid, street — toggleable)
- **Backend**: Node.js + Express, TypeScript
- **Database**: SQLite via better-sqlite3
- **Routing**: Mapbox Directions API for drive time/distance between stops
- **Styling**: Tailwind CSS, dark mode default with light mode toggle
- **Icons**: Lucide React

## Environment Variables (.env already exists)
- `MAPBOX_SECRET_KEY` — for server-side Mapbox API calls
- `MAPBOX_PUBLIC_KEY` — for frontend map rendering (placeholder for now, use secret key temporarily for dev)
- `RECREATION_GOV_API_KEY` — for Recreation.gov RIDB API

## Layout
- **Left sidebar** (~320px): Trip list, trip details, stop list with drag-and-drop reordering
- **Main area**: Full-screen Mapbox map
- **Right panel** (slides out ~400px): Location details when clicking a pin — shows all info, ratings, notes, photos, navigate button
- **Top bar**: Trip selector dropdown, map style toggle (Satellite/Topo/Hybrid/Street), search bar, dark/light mode toggle
- Dark mode by default. Beautiful, polished UI. This should look like a $20/month SaaS product.

## Core Features

### 1. Interactive Map
- Mapbox GL JS with 4 map styles: Satellite, Topographic, Hybrid, Street
- Toggleable map layers:
  - 🏕️ Boondocking / dispersed camping (orange pins)
  - ⛺ Established campgrounds (green pins)
  - 🏍️ Dirt bike trails / OHV areas (red pins)
  - 💧 Water fill stations (blue pins)
  - 🚽 Dump stations (brown pins)
  - 🛒 Grocery / resupply (yellow pins)
  - ⛽ Gas stations (gray pins)
  - 📸 Scenic viewpoints (purple pins)
- Layer toggle panel in top-right corner of map
- Clustered pins that expand on zoom
- Click any pin → right panel slides out with full details
- "Navigate Here" button on every location → opens Google Maps directions

### 2. Trip Management
- Create/edit/delete trips with: name, dates, description, status (Planning/Active/Completed)
- Each trip has an ordered list of stops
- Stops displayed as numbered markers connected by a route line on map
- Drag-and-drop to reorder stops in sidebar
- Drive time and distance calculated between consecutive stops (Mapbox Directions API)
- Total trip distance and drive time shown
- Per-stop fields: planned arrival, planned departure, nights, notes, actual dates (post-trip)
- Trip journal: overall notes field for reflections
- "Suggest stops along the way" between two basecamps: show interesting POIs, scenic views, towns near the route
- Toggle trips on/off on the map
- View past completed trips

### 3. Location Database

#### Campsites / Boondocking
Fields:
- name, description, GPS (lat/lng)
- type: BLM, National Forest, State, Private, Other
- source: iOverlander, Recreation.gov, FreeCampsites, User-added, Agent-curated
- cell_signal: None/Weak/Fair/Good/Excellent (carrier if known)
- shade: boolean
- level_ground: boolean
- scenery_rating: 1-5
- water_nearby: boolean
- dump_nearby: boolean
- max_vehicle_length: number (feet)
- photos: array of URLs
- stay_limit_days: number
- season: string (e.g., "Year-round", "May-Oct")
- crowding: Low/Medium/High
- notes: text
- user_rating: 1-5 (Nicos's personal rating)
- user_notes: text
- visited: boolean
- visited_date: date

#### Riding Areas / Trails
Fields:
- name, description, GPS (lat/lng)
- trail_types: array (Single Track, Fire Road, Ridge Riding, Desert, Technical, Beginner)
- difficulty: Easy/Moderate/Hard/Expert
- distance_miles: number
- elevation_gain_ft: number
- scenery_rating: 1-5
- best_season: string
- permit_required: boolean
- permit_info: text
- nearby_camping_ids: array (linked to campsite records)
- photos: array of URLs
- external_links: array (OHV websites, trail maps)
- user_rating: 1-5
- user_notes: text
- visited: boolean
- visited_date: date

#### Services (Water, Dump, Gas, Grocery)
Fields:
- name, GPS (lat/lng), type (water/dump/gas/grocery/laundromat/scenic)
- source: iOverlander, curated
- notes, hours (if known)

### 4. Rating & Review System
- Click any visited location → rate 1-5 stars, add notes
- Mark as "Visited ✅" or "Want to Visit ⭐"
- Filter map: Show All / Visited Only / Want to Visit / Highly Rated (4+)

### 5. Search
- Search bar: search locations by name, type, or area
- Filter sidebar: filter by type, rating, land type, amenities

### 6. Data Sources to Integrate

#### iOverlander API
- Base URL: https://www.ioverlander.com/api/places
- Fetch boondocking spots, water, dump stations
- No API key needed
- Import on first run + periodic refresh

#### Recreation.gov RIDB API  
- Base URL: https://ridb.recreation.gov/api/v1
- API key in .env
- Fetch federal campgrounds (NPS, USFS, BLM, Army Corps)
- Import campgrounds with GPS, amenities, descriptions

#### Agent-Curated Data
- Pre-loaded from seed-data/ folder (markdown files with GPS coords, riding areas, campsites from trip research)
- Parse TRIP-RESEARCH-WEST-2026.md and TRIP-PLAN-WEST-2026.md for initial data

### 7. Stats Dashboard (secondary page/panel)
- Total trips, nights camped, miles driven
- States visited (highlighted on mini US map)
- Favorite spots (highest rated)
- Riding areas visited count

## API Endpoints

### Trips
- GET /api/trips — list all trips
- POST /api/trips — create trip
- PUT /api/trips/:id — update trip
- DELETE /api/trips/:id — delete trip
- GET /api/trips/:id/stops — list stops for trip
- POST /api/trips/:id/stops — add stop
- PUT /api/trips/:id/stops/:stopId — update stop (including reorder)
- DELETE /api/trips/:id/stops/:stopId — remove stop
- GET /api/trips/:id/route — get Mapbox route between all stops

### Locations
- GET /api/locations — list/filter locations (type, bounds, rating, visited)
- POST /api/locations — add location
- PUT /api/locations/:id — update location (rating, notes, visited)
- DELETE /api/locations/:id — delete location
- GET /api/locations/search?q=query — search locations

### Data Import
- POST /api/import/ioverlander — fetch and import iOverlander data for given bounds
- POST /api/import/recreation — fetch and import Recreation.gov data for given state/area
- GET /api/import/status — check import progress

### Directions
- GET /api/directions?stops=lat1,lng1;lat2,lng2;... — get route with drive times

## Database Schema (SQLite)

```sql
CREATE TABLE trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning', -- planning, active, completed
  start_date TEXT,
  end_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE trip_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES locations(id),
  sort_order INTEGER NOT NULL,
  planned_arrival TEXT,
  planned_departure TEXT,
  actual_arrival TEXT,
  actual_departure TEXT,
  nights INTEGER,
  notes TEXT,
  drive_time_mins INTEGER, -- from previous stop
  drive_distance_miles REAL -- from previous stop
);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  category TEXT NOT NULL, -- campsite, riding, water, dump, gas, grocery, scenic, laundromat
  sub_type TEXT, -- BLM, National Forest, State, Private, Single Track, Fire Road, etc.
  source TEXT, -- ioverlander, recreation_gov, freecampsites, user, agent_curated
  source_id TEXT, -- external ID from source
  
  -- Campsite fields
  cell_signal TEXT,
  shade INTEGER,
  level_ground INTEGER,
  water_nearby INTEGER,
  dump_nearby INTEGER,
  max_vehicle_length INTEGER,
  stay_limit_days INTEGER,
  season TEXT,
  crowding TEXT,
  
  -- Riding fields
  trail_types TEXT, -- JSON array
  difficulty TEXT,
  distance_miles REAL,
  elevation_gain_ft INTEGER,
  permit_required INTEGER,
  permit_info TEXT,
  
  -- Shared
  scenery_rating INTEGER,
  best_season TEXT,
  photos TEXT, -- JSON array of URLs
  external_links TEXT, -- JSON array
  notes TEXT,
  hours TEXT,
  
  -- User fields
  user_rating INTEGER,
  user_notes TEXT,
  visited INTEGER DEFAULT 0,
  visited_date TEXT,
  want_to_visit INTEGER DEFAULT 0,
  
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_locations_source ON locations(source, source_id);
CREATE INDEX idx_trip_stops_trip ON trip_stops(trip_id);
```

## Seed Data
Parse the markdown files in seed-data/ folder to pre-populate locations:
- TRIP-RESEARCH-WEST-2026.md has riding areas with GPS coords
- TRIP-PLAN-WEST-2026.md has basecamps and route info
Extract GPS coordinates, names, descriptions, and categorize them.

## Design Guidelines
- Dark mode primary (#0f172a background, #1e293b cards, #f8fafc text)
- Accent color: warm orange (#f97316) for boondocking, blue for water, red for trails
- Smooth animations on panel slide-in/out
- Map takes priority — should feel like a map app, not a dashboard with a map widget
- Clean, modern, minimal — no clutter
- Responsive but optimized for desktop (1440px+)
- Beautiful hover states, transitions, micro-interactions

## Running
- `npm run dev` starts both frontend (Vite on port 5173) and backend (Express on port 3001)
- Frontend proxies API calls to backend
- Access on local network via machine's IP:5173

## Phase 1 Scope (BUILD THIS NOW)
Build the complete working app with:
1. ✅ Full map with 4 styles + layer toggles
2. ✅ Trip CRUD + stop management with drag-and-drop
3. ✅ Route visualization between stops
4. ✅ Location database with all fields
5. ✅ Add/edit/rate locations
6. ✅ Right panel with full location details
7. ✅ Navigate Here buttons
8. ✅ Dark/light mode
9. ✅ Search + filters
10. ✅ Seed data pre-loaded
11. ✅ iOverlander API integration
12. ✅ Recreation.gov API integration
13. ✅ Drive time/distance between stops
14. ✅ Visited/Want to Visit tracking
15. ✅ Stats dashboard

Build everything. Make it production quality. Make it beautiful.
