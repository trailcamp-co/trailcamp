# TrailCamp

A comprehensive motorcycle adventure trip planning application for dual sport and dirt bike riders.

## Overview

TrailCamp helps riders discover, plan, and navigate motorcycle adventures across North America with:
- **1,195 riding locations** - trails, OHV areas, BDR routes, scenic byways
- **482 boondocking spots** - dispersed camping, remote locations
- **3,873 campgrounds** - developed camping across all 50 states
- **5,565 total locations** covering riding, camping, services

## Features

- 🗺️ Interactive map with location clustering
- 🏕️ Trip planning with multi-stop routing
- 🏍️ Riding spot discovery by terrain type, difficulty, season
- 📊 Location filtering by category, scenery, cost, permits
- 📝 Detailed location info: terrain, difficulty, seasons, permits, nearby services
- 🔗 External links to official BDR routes and major trails
- ⭐ Featured flag for bucket-list destinations

## Tech Stack

### Frontend
- **React** with **Vite** - Fast, modern build tooling
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Mapbox GL JS** - Interactive mapping
- **Lucide React** - Icon library

### Backend
- **Express.js** - RESTful API server
- **SQLite** - Embedded database
- **Node.js** - Runtime environment

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

```bash
# Clone repository
git clone <repository-url>
cd trailcamp

# Install dependencies
npm install

# Start development servers
npm run dev
```

This starts:
- **Frontend dev server**: http://localhost:5173
- **Backend API server**: http://localhost:3001

## Project Structure

```
trailcamp/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── index.html
├── server/           # Express backend
│   ├── index.ts      # API server
│   └── trailcamp.db  # SQLite database
├── package.json
└── README.md
```

## Database

**SQLite database**: `server/trailcamp.db`

### Key Tables

- `locations` - All riding spots, campsites, services (5,565 records)
- `trips` - User-created trip plans
- `trip_stops` - Individual stops within trips
- `trip_journal` - Trip notes and memories

### Location Schema Highlights

```sql
- id, name, description, latitude, longitude
- category (riding|campsite|scenic|dump|water)
- sub_type (boondocking|campground|dirt-bike|National Forest|etc)
- trail_types (Dual Sport, Single Track, Enduro, etc)
- difficulty, distance_miles, scenery_rating (1-10)
- best_season, season, permit_required, permit_info
- cost_per_night, water_available, hours
- notes, external_links
- featured (bucket-list flag)
```

## Data Sources

- **recreation.gov** - 4,121 campgrounds and recreation areas
- **Backcountry Discovery Routes** - All major BDR routes (WA, OR, ID, CO, UT, AZ, NM, CA, NV, TX, TN, MN, Mid-Atlantic)
- **Trans America Trail** - Coast-to-coast off-road route
- **National Parks** - Major scenic routes (Going-to-the-Sun, Trail Ridge, etc)
- **State Forests & OHV Areas** - Riding locations across all 50 states
- **Agent Research** - 200+ curated riding and boondocking locations

## Geographic Coverage

All 50 US states represented, with strong coverage in:
- **Western States**: CA, OR, WA, ID, MT, WY, CO, UT, AZ, NM
- **Alaska & Hawaii**: Unique bucket-list destinations
- **Upper Midwest**: MI, WI, MN
- **New England**: VT, NH, ME, MA, CT
- **Southeast**: GA, FL, SC, NC, TN, KY
- **Mid-Atlantic**: MD, PA, NJ, DE, NY
- **Plains**: KS, NE, ND, SD, OK
- **Texas**: Big Bend, Hill Country, East TX

## Statistics

- **1,195 riding locations**
  - National Forest: 358
  - BLM: 212
  - State Forest: 78
  - State Park: 40
  - Private Parks: 57
  - MX Tracks: 54
  
- **Trail Types**: Dual Sport, Single Track, Enduro, Fire Road, Motocross, Sand Dunes, Desert, Ridge Riding

- **Scenery Ratings**: All locations rated 1-10, with 70+ featured 10/10 bucket-list destinations

- **Seasonal Coverage**: Year-round (1,930), Summer (1,353), Spring/Fall (1,019), Winter (490)

- **Cost Data**: 455 free boondocking, 153 paid campgrounds ($15-35/night avg)

## Development

### Available Scripts

- `npm run dev` - Start both frontend and backend dev servers
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Database Backup

Full SQL dump available at: `~/.openclaw/workspace/trailcamp-backup.sql`

CSV exports available for analysis:
- `trailcamp-all-locations.csv` (2.8MB)
- `trailcamp-riding.csv` (371KB)
- `trailcamp-boondocking.csv` (234KB)
- `trailcamp-campgrounds.csv` (2.2MB)

## API Endpoints

```
GET /api/locations - Get all locations
GET /api/locations/:id - Get specific location
GET /api/trips - Get all trips
POST /api/trips - Create new trip
GET /api/trips/:id - Get specific trip
PUT /api/trips/:id - Update trip
DELETE /api/trips/:id - Delete trip
```

## Contributing

This project was built during an overnight autonomous build session, expanding from 5,698 to 5,565 locations (after deduplication) with comprehensive data quality enhancements.

## License

[Add license information]

## Contact

[Add contact information]
