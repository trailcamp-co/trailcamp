# TrailCamp Database Schema

SQLite database: `server/trailcamp.db`

## Overview

The database consists of 4 main tables supporting trip planning and location management:
- **locations** - All riding spots, campsites, and services (5,565 records)
- **trips** - User-created trip plans
- **trip_stops** - Individual stops within trips
- **trip_journal** - Trip notes and memories

---

## Tables

### `locations`

Primary table containing all riding locations, campsites, and services.

**Total Records:** 5,565 (1,195 riding, 482 boondocking, 3,873 campgrounds, 15 other)

#### Core Fields

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique identifier |
| `name` | TEXT | NOT NULL | Location name |
| `description` | TEXT | | Detailed description |
| `latitude` | REAL | NOT NULL | Decimal latitude (-90 to +90) |
| `longitude` | REAL | NOT NULL | Decimal longitude (-180 to +180) |
| `category` | TEXT | NOT NULL | Location type: riding, campsite, scenic, dump, water |
| `sub_type` | TEXT | | Subcategory (see values below) |
| `source` | TEXT | | Data source (recreation_gov, agent research, etc) |
| `source_id` | TEXT | | External identifier from source system |

#### Camping-Specific Fields

| Column | Type | Description |
|--------|------|-------------|
| `cell_signal` | TEXT | Cell coverage: Good, Limited, None |
| `shade` | INTEGER | Boolean: 1 = shaded sites, 0 = open |
| `level_ground` | INTEGER | Boolean: 1 = level, 0 = sloped |
| `water_nearby` | INTEGER | Boolean: 1 = water source nearby |
| `water_available` | INTEGER | Boolean: 1 = water available at site |
| `dump_nearby` | INTEGER | Boolean: dump station nearby |
| `max_vehicle_length` | INTEGER | Maximum RV/camper length in feet |
| `stay_limit_days` | INTEGER | Maximum stay duration (14, 180, etc) |
| `season` | TEXT | When location is open/accessible |
| `crowding` | TEXT | Expected crowding level |
| `cost_per_night` | REAL | Camping cost per night ($0 = free) |

#### Riding-Specific Fields

| Column | Type | Description |
|--------|------|-------------|
| `trail_types` | TEXT | Comma-separated: Dual Sport, Single Track, Enduro, Fire Road, Motocross, Sand Dunes, Desert, Ridge Riding, etc |
| `difficulty` | TEXT | Beginner, Intermediate, Advanced |
| `distance_miles` | REAL | Trail/route distance in miles |
| `elevation_gain_ft` | INTEGER | Elevation gain in feet |
| `permit_required` | INTEGER | Boolean: 1 = permit needed |
| `permit_info` | TEXT | Details about required permits |

#### Quality & Planning Fields

| Column | Type | Description |
|--------|------|-------------|
| `scenery_rating` | INTEGER | 1-10 scenic quality rating |
| `best_season` | TEXT | Optimal season: Summer, Winter, Spring/Fall, Year-round |
| `hours` | TEXT | Operating hours: 24/7, Dawn to Dusk, etc |
| `photos` | TEXT | JSON array of photo URLs |
| `external_links` | TEXT | Official website or route info URL |
| `notes` | TEXT | Rich detailed notes (300+ chars for featured spots) |
| `featured` | INTEGER | Boolean: 1 = bucket-list destination (10/10 scenery, BDRs, etc) |

#### User Fields

| Column | Type | Description |
|--------|------|-------------|
| `user_rating` | INTEGER | User's personal rating |
| `user_notes` | TEXT | User's personal notes |
| `visited` | INTEGER | Boolean: 1 = user has been here |
| `visited_date` | TEXT | Date visited (ISO 8601) |
| `want_to_visit` | INTEGER | Boolean: 1 = on user's wishlist |
| `favorited` | INTEGER | Boolean: 1 = user favorite |

#### Metadata

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `created_at` | TEXT | datetime('now') | Record creation timestamp |
| `updated_at` | TEXT | datetime('now') | Last update timestamp |

#### Indexes

```sql
CREATE INDEX idx_locations_category ON locations(category);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_locations_source ON locations(source, source_id);
```

#### Category Values

- `riding` - Dirt bike/dual sport trails and riding areas
- `campsite` - Camping locations
- `scenic` - Scenic overlooks and viewpoints
- `dump` - RV dump stations
- `water` - Water fill stations

#### Common sub_type Values

**For category='riding':**
- `dirt-bike` - General dirt bike riding
- `National Forest` - USFS riding areas
- `BLM` - Bureau of Land Management areas
- `State Forest` - State forest riding
- `State Park` - State park OHV areas
- `Private Park` - Private riding parks
- `MX Track` - Motocross tracks
- `OHV Area` - Designated OHV areas
- `Sand Dunes` - Sand dune riding
- `Trail System` - Named trail systems

**For category='campsite':**
- `boondocking` - Dispersed/free camping
- `campground` - Developed campgrounds
- `parking` - Parking/overnight areas

---

### `trips`

User-created trip plans.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY | | Unique trip identifier |
| `name` | TEXT | NOT NULL | | Trip name |
| `description` | TEXT | | | Trip description/overview |
| `status` | TEXT | | 'planning' | Trip status: planning, active, completed |
| `start_date` | TEXT | | | Planned start date (ISO 8601) |
| `end_date` | TEXT | | | Planned end date (ISO 8601) |
| `notes` | TEXT | | | Freeform trip notes |
| `created_at` | TEXT | | datetime('now') | Creation timestamp |
| `updated_at` | TEXT | | datetime('now') | Last update timestamp |

---

### `trip_stops`

Individual stops within a trip, ordered sequence.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Stop identifier |
| `trip_id` | INTEGER | NOT NULL, FK trips(id) ON DELETE CASCADE | Parent trip |
| `location_id` | INTEGER | FK locations(id) | Reference to locations table (NULL if custom) |
| `name` | TEXT | | Stop name (for custom stops without location_id) |
| `latitude` | REAL | | Stop latitude (for custom stops) |
| `longitude` | REAL | | Stop longitude (for custom stops) |
| `sort_order` | INTEGER | NOT NULL | Display order within trip |
| `planned_arrival` | TEXT | | Planned arrival date/time |
| `planned_departure` | TEXT | | Planned departure date/time |
| `actual_arrival` | TEXT | | Actual arrival (for tracking) |
| `actual_departure` | TEXT | | Actual departure (for tracking) |
| `nights` | INTEGER | | Number of nights at this stop |
| `notes` | TEXT | | Stop-specific notes |
| `drive_time_mins` | INTEGER | | Calculated drive time to this stop (from previous) |
| `drive_distance_miles` | REAL | | Calculated distance to this stop (from previous) |

#### Indexes

```sql
CREATE INDEX idx_trip_stops_trip ON trip_stops(trip_id);
```

**Note:** Stops can either reference a `location_id` from the locations table OR be custom stops with `name`, `latitude`, `longitude` filled in directly.

---

### `trip_journal`

Journal entries and memories from trips.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| `id` | INTEGER | PRIMARY KEY | | Entry identifier |
| `trip_id` | INTEGER | NOT NULL, FK trips(id) | | Parent trip |
| `stop_id` | INTEGER | FK trip_stops(id) | | Optional: associate with specific stop |
| `content` | TEXT | NOT NULL | | Journal entry content |
| `created_at` | DATETIME | | CURRENT_TIMESTAMP | Entry timestamp |

---

## Relationships

```
trips (1) ─────< (many) trip_stops
  │                        │
  │                        │ (optional)
  │                        ↓
  │                    locations
  │
  └─────< (many) trip_journal
              │
              │ (optional)
              ↓
          trip_stops
```

- Each **trip** can have many **trip_stops** (CASCADE DELETE)
- Each **trip_stop** can optionally reference a **location**
- Each **trip** can have many **trip_journal** entries
- Each **trip_journal** entry can optionally reference a **trip_stop**

---

## Data Statistics

### Locations Breakdown

- **Total:** 5,565
- **Riding:** 1,195
  - National Forest: 358
  - BLM: 212
  - State Forest: 78
  - State Park: 40
  - Private Parks: 57
  - MX Tracks: 54
  - Other: 396
- **Boondocking:** 482 (all free dispersed camping)
- **Campgrounds:** 3,873 (developed camping)
- **Other:** 15 (dump stations, water, scenic)

### Data Quality

- **Scenery Ratings:** All 5,565 locations rated (1-10 scale)
- **Featured Locations:** 70+ bucket-list destinations (10/10 scenery, BDR routes)
- **Seasonal Data:** 100% coverage (Year-round, Summer, Spring/Fall, Winter)
- **Cost Data:** 610 locations with pricing ($0-35/night range)
- **Trail Types:** 111 distinct combinations, all standardized
- **Permit Info:** Populated for all permit-required locations
- **External Links:** 67 locations (all BDR routes + major trails)
- **Enhanced Notes:** 30 high-value locations with 300+ character rich descriptions

---

## Query Examples

### Find all boondocking in Colorado

```sql
SELECT * FROM locations 
WHERE sub_type = 'boondocking' 
  AND name LIKE '%CO%' 
  OR notes LIKE '%Colorado%';
```

### Get all featured bucket-list riding spots

```sql
SELECT name, scenery_rating, trail_types, difficulty, notes
FROM locations
WHERE featured = 1 AND category = 'riding'
ORDER BY scenery_rating DESC, distance_miles DESC;
```

### Find free camping with water available

```sql
SELECT name, latitude, longitude, notes
FROM locations
WHERE sub_type = 'boondocking' 
  AND cost_per_night = 0
  AND water_available = 1
ORDER BY scenery_rating DESC;
```

### Summer riding in National Forests

```sql
SELECT name, trail_types, difficulty, distance_miles
FROM locations
WHERE category = 'riding'
  AND sub_type = 'National Forest'
  AND (best_season = 'Summer' OR season LIKE '%Jun%')
ORDER BY scenery_rating DESC;
```

### Get a trip with all stops

```sql
SELECT 
  t.name as trip_name,
  ts.sort_order,
  COALESCE(l.name, ts.name) as stop_name,
  ts.nights,
  ts.drive_distance_miles
FROM trips t
JOIN trip_stops ts ON ts.trip_id = t.id
LEFT JOIN locations l ON l.id = ts.location_id
WHERE t.id = ?
ORDER BY ts.sort_order;
```

---

## Maintenance

### Vacuum Database

```bash
sqlite3 server/trailcamp.db "VACUUM;"
```

### Analyze for Query Optimization

```bash
sqlite3 server/trailcamp.db "ANALYZE;"
```

### Backup

```bash
sqlite3 server/trailcamp.db ".dump" > backup.sql
```

### Integrity Check

```bash
sqlite3 server/trailcamp.db "PRAGMA integrity_check;"
```

---

## Version History

- **2026-02-28:** Overnight build - expanded from 5,698 to 5,565 locations (after deduplication)
  - Added 195+ riding locations (D8-D17)
  - Enhanced data quality (DQ11-DQ20)
  - Added `featured` column
  - Standardized trail_types
  - Populated cost_per_night, water_available, hours, external_links
  - Added detailed notes to top 30 locations
