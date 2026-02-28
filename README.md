# 🏕️🏍️ TrailCamp

The ultimate trip planning platform for overlanders, dirt bike riders, and boondockers. Plan multi-stop camping trips with integrated riding area discovery, weather forecasts, route optimization, and more.

## Features

### Trip Planning
- **Multi-stop trip builder** with drag-and-drop reordering
- **Route optimization** (nearest-neighbor + 2-opt improvement)
- **Drive time & distance** between stops (Mapbox Directions API)
- **Weather forecasts** for each stop's dates
- **Trip journal** — notes linked to each stop
- **Packing checklist** — 5 pre-built categories with localStorage persistence
- **Export** — GPX (for GPS devices), Markdown, or copy-to-clipboard share text
- **Print-friendly** trip summary
- **Duplicate trips** for planning variations

### Discovery
- **1,041 riding areas** across all 50 states + Canada, Mexico
- **4,693 campsites** (404 boondocking, 4,285 campgrounds)
- **5,746 total locations** with descriptions, ratings, and seasonal data
- **Interactive map** with Mapbox GL JS, dark satellite default
- **BLM land overlay** — vector polygons showing public BLM land
- **National Forest overlay** — USFS boundary polygons
- **Region quick-jump** — 16 preset regions (Moab, PNW, Hatfield-McCoy, etc.)
- **Near-route filter** — find riding/camping within X miles of your route
- **Seasonal intelligence** — filter locations by current month's riding season

### Location Details
- Difficulty ratings with color coding (Easy/Moderate/Hard/Expert)
- Trail type tags (Single Track, Dual Sport, Enduro, Fire Road, Motocross)
- Scenery ratings (1-5)
- Water availability indicators
- Cost per night (Free! for boondocking)
- Personal notes, star ratings, visited tracking, favorites
- Nearby riding discovery (within 20mi of any campsite)
- Google Maps / Waze navigation links

### UX
- Dark mode (default) and light mode
- Mobile responsive sidebar
- Keyboard shortcuts (⌘K search, Esc close panels)
- Recent searches
- Error boundaries for crash recovery
- Map legend

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (better-sqlite3, WAL mode)
- **Maps:** Mapbox GL JS
- **Routing:** Mapbox Directions API
- **Weather:** Open-Meteo API (free, no key needed)

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Add: MAPBOX_SECRET_KEY, MAPBOX_PUBLIC_KEY, RECREATION_GOV_API_KEY (optional)

# Run development server
npm run dev
# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

## Data Sources

| Source | Records | Type |
|--------|---------|------|
| Agent-curated riding spots | 1,041 | Riding areas across all 50 states |
| iOverlander API | ~4,300 | Campgrounds and parking areas |
| Agent-curated boondocking | 404 | Dispersed/free camping spots |
| Recreation.gov API | ~200 | Federal campgrounds |
| PAD-US (USGS) | 308 polygons | BLM land boundaries |
| USDA Forest Service | 112 polygons | National Forest boundaries |

## Project Structure

```
client/
  src/
    components/
      map/          # MapContainer, LayerPanel, Legend, RegionQuickJump
      sidebar/      # LeftSidebar, TripTab, RidingTab, FiltersTab, PackingList
      ErrorBoundary, RightPanel, StatsPanel, TopBar
    hooks/          # useApi, useFilters, useSearch, useRoute, useWeather, useMapInteraction
    types/          # TypeScript interfaces (single source of truth)
    styles/         # Tailwind + custom CSS
  public/
    blm-land-v3.geojson     # BLM boundaries (179KB)
    usfs-boundaries.geojson  # USFS boundaries (145KB)
server/
  src/
    routes/     # trips, locations, stats API routes
    data/       # riding-spots.json consolidated data
    import-*.ts # Data import scripts
  trailcamp.db  # SQLite database
```

## License

Private — built for personal use.
