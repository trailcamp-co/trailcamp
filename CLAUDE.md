# TrailCamp — Project Context for AI Agents

## What is TrailCamp?
A mobile-first SaaS app for overlanding, camping, and dirt bike riders to discover locations, plan trips, and journal adventures. Multi-tenant with Supabase auth.

## Stack
- **Frontend:** React 18 + Vite + Tailwind CSS (dark mode default) + Mapbox GL JS — `client/`
- **Backend:** Express + TypeScript + Drizzle ORM + PostgreSQL (Supabase) — `server/`
- **Dev server:** `npm run dev` → Vite on :5173, Express on :3001 (tsx watch auto-restarts)
- **DB:** Supabase PostgreSQL at `db.iagfjotzcuazdowksxwy.supabase.co`

## Key Conventions
- **Dark mode colors:** bg-dark-950 (darkest), bg-dark-900, bg-dark-800, text-gray-100/300/400, accent orange-500
- **API responses:** All use `toSnakeCase()` transform — routes return snake_case JSON
- **Auth middleware:** `requireAuth` and `optionalAuth` in `server/src/middleware/auth.ts`
- **Mobile breakpoint:** `< 1024px` (Tailwind `lg:` = desktop, default = mobile)
- **Single-page app** with React Router (login/signup/forgot-password/settings routes + main app)
- **Bottom tabs on mobile:** Map, Explore, Trips, Saved, Profile (64px tall bar)
- **Category system:** campsite (sub-types: boondocking/campground/parking/other), riding, water, dump, scenic
- **Category colors/icons:** Defined in `client/src/types/index.ts` (CATEGORY_COLORS, CATEGORY_ICONS, CAMPSITE_SUBTYPE_COLORS, etc.)

## File Layout

### Frontend (`client/src/`)
```
App.tsx                          — Main layout: desktop sidebar + mobile tabs/bottom sheet
main.tsx                         — Entry point with AuthProvider + Router
types/index.ts                   — All types, interfaces, category constants, map styles
contexts/AuthContext.tsx          — Supabase auth context

components/
  map/MapContainer.tsx           — Mapbox GL JS map with layers, GPS, compass
  map/layers.ts                  — Map layer definitions (clusters, pins)
  map/popups.ts                  — Popup templates
  map/LayerPanel.tsx             — Category toggle panel on map
  map/RegionQuickJump.tsx        — Region navigation
  sidebar/LeftSidebar.tsx        — Tab container (Trip, Rides, Camp, Filters, Pack)
  sidebar/TripTab.tsx            — Trip details + stop list
  sidebar/CampsiteTab.tsx        — Campsite listing
  sidebar/RidingTab.tsx          — Riding areas listing
  sidebar/FiltersTab.tsx         — Filter controls
  sidebar/StopCard.tsx           — Individual trip stop card
  sidebar/CampsiteCard.tsx       — Campsite list item
  TopBar.tsx                     — Desktop top bar (hidden on mobile)
  RightPanel.tsx                 — Desktop location detail panel (hidden on mobile)
  MobileLocationDetail.tsx       — Mobile location detail (in bottom sheet)
  BottomSheet.tsx                — Draggable bottom sheet (peek/half/full snap points)
  MobileBottomTabs.tsx           — Bottom navigation tabs
  MobileFAB.tsx                  — Floating action button for Add Location
  MobileSearchBar.tsx            — Mobile search overlay
  AddLocationModal.tsx           — Add new location form
  ReviewsSection.tsx             — Public reviews display + form
  StatsPanel.tsx                 — Trip/location statistics

hooks/
  useApi.ts                      — API calls (locations, trips, stops, mapbox token)
  useFilters.ts                  — Filter state + filteredLocations logic
  useSearch.ts                   — Search state
  useUserData.ts                 — Per-user location data (visited, notes, rating)
  useFavorites.ts                — Favorite toggling
  useProfile.ts                  — User profile + home address
  useRoute.ts                    — Route calculation between stops
  useWeather.ts                  — Weather data fetching
```

### Backend (`server/src/`)
```
index.ts                         — Express app setup (helmet, cors, rate limit, routes)
db/schema.ts                     — Drizzle schema (9 tables: users, locations, trips, trip_stops, trip_journal, user_favorites, user_settings, user_location_data, location_reviews)
db/index.ts                      — DB connection (lazy init pattern)
middleware/auth.ts               — requireAuth + optionalAuth (Supabase JWT)
middleware/validate.ts           — Zod validation middleware
routes/locations.ts              — CRUD + search + nearby + group counts
routes/trips.ts                  — Trip + stop + journal CRUD
routes/users.ts                  — Auth endpoints
routes/favorites.ts              — Favorite toggle
routes/userdata.ts               — Per-user location annotations
routes/reviews.ts                — Public review system
routes/import.ts                 — Location import
routes/directions.ts             — Mapbox directions proxy
```

## API Routes
- `GET/POST /api/locations` — list (with group counts) / create
- `GET/PUT/DELETE /api/locations/:id` — single location CRUD
- `GET/POST /api/trips` — list / create trips
- `PUT/DELETE /api/trips/:id` — update / delete trip
- `GET/POST /api/trips/:tripId/stops` — list / add stops
- `GET/POST/PUT/DELETE /api/trips/:tripId/journal` — journal entries
- `POST /api/favorites/toggle` — toggle favorite
- `GET/PUT /api/userdata/:locationId` — per-user location data
- `GET/POST/DELETE /api/reviews/:locationId` — public reviews
- `GET /api/mapbox-token` — client mapbox token
- `GET /api/health` — health check

## Data
- ~11,146 total locations (3,846 campgrounds, 732 boondocking, 2,641 overnight parking, 1,673 dump stations, 692 water stations, riding areas, scenic viewpoints)
- Location `sub_type` (snake_case in DB) maps to Drizzle `subType` (camelCase)

## Known Gotchas
- **Drizzle returns camelCase**, API expects snake_case → `toSnakeCase()` in route handlers
- **Module-level env reads fail** — dotenv hasn't loaded yet → use lazy init proxy pattern
- **Vite cache issues** — clear with `rm -rf client/node_modules/.vite` + hard refresh
- **Pre-existing TS warnings:** MapContainer.tsx (TripStop name type), RegionQuickJump.tsx (mapbox-gl Map type), RidingCard.tsx (missing 'bad' key)
- **navigator.clipboard** fails on non-HTTPS (LAN IP) → need fallback

## Git
- Commit messages: `"Phase XY: Description"` format
- Always `git add -A && git commit -m "..."` after changes
