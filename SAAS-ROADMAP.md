# 🏔️ TrailCamp SaaS — Master Build Roadmap

> **Goal:** Transform TrailCamp from a local single-user app into a production-grade, mobile-first SaaS where users can plan off-road trips, save private locations, journal their adventures, and discover riding/camping spots.

> **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
> **Frontend:** React 18 + Vite + Tailwind CSS + Mapbox GL JS
> **Backend:** Express + TypeScript + Drizzle ORM → Supabase PostgreSQL
> **Deployment:** Vercel (frontend) + Railway (backend API) + Supabase (DB/Auth/Storage)
> **Launch Mode:** Free beta (Stripe/premium deferred until post-launch)

---

## PHASE 1: Foundation (Auth + Database + Deploy)
*Everything depends on this. No shortcuts.*

### 1.1 — Supabase Project Setup
- [ ] Create Supabase project
- [ ] Configure connection pooling (Supavisor)
- [ ] Set up environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, DATABASE_URL)
- [ ] Test connection from local dev

### 1.2 — PostgreSQL Schema Design
- [ ] Design `users` table (id UUID, email, display_name, avatar_url, home_lat, home_lon, home_address, units_preference, theme, created_at, updated_at)
- [ ] Design `locations` table with `user_id` nullable (NULL = community/public data)
- [ ] Design `locations` visibility column (public/private)
- [ ] Design `trips` table with `user_id` required
- [ ] Design `trip_stops` table (unchanged structure, FK to trips)
- [ ] Design `trip_journal_entries` table (trip_id, stop_id, user_id, date, content, photos[], created_at)
- [ ] Design `user_favorites` table (user_id, location_id, created_at)
- [ ] Design `user_settings` table (user_id, default_map_center, default_zoom, sidebar_collapsed, etc.)
- [ ] Write complete SQL migration with all tables, indexes, constraints
- [ ] Add Row Level Security (RLS) policies on every table
- [ ] Seed community locations (existing 6,148 locations as public data)

### 1.3 — Backend Migration (SQLite → Supabase PostgreSQL)
- [ ] Replace better-sqlite3 with Drizzle ORM + PostgreSQL driver (drizzle-orm + postgres.js)
- [ ] Define Drizzle schema matching all tables
- [ ] Rewrite database.ts connection layer
- [ ] Rewrite locations routes (support public + private + user-scoped queries)
- [ ] Rewrite trips routes (fully user-scoped)
- [ ] Rewrite trip_stops routes (scoped through trip ownership)
- [ ] Add new user routes (profile CRUD, settings, home address)
- [ ] Add new favorites routes (add/remove/list)
- [ ] Add new journal routes (CRUD per trip)
- [ ] Remove all raw SQL — use Drizzle query builder everywhere
- [ ] Add proper TypeScript types for all DB models

### 1.4 — Authentication System
- [ ] Install @supabase/supabase-js on backend + frontend
- [ ] Configure Supabase Auth (email/password enabled)
- [ ] Configure Google OAuth provider in Supabase dashboard
- [ ] Configure Apple OAuth provider in Supabase dashboard
- [ ] Create auth middleware for Express (validate Supabase JWT on every request)
- [ ] Add auth middleware to ALL existing routes
- [ ] Create user profile auto-creation on first login (DB trigger or API hook)
- [ ] Email verification flow (Supabase handles email sending)
- [ ] Password reset flow (Supabase handles email sending)
- [ ] Rate limiting on auth-adjacent endpoints

### 1.5 — API Security & Validation
- [ ] Install zod for input validation
- [ ] Add zod schemas for every API endpoint (request body + query params)
- [ ] Standardized error response format: `{ error: string, code: string, details?: any }`
- [ ] Add helmet.js for security headers
- [ ] Configure CORS (whitelist production domain only in prod, allow localhost in dev)
- [ ] Add express-rate-limit (global + per-endpoint where needed)
- [ ] Input sanitization on all user-generated text fields
- [ ] Request logging middleware (method, path, status, duration, user_id)
- [ ] Environment variable validation on startup (fail fast if missing)

### 1.6 — Frontend Auth Flows
- [ ] Install @supabase/supabase-js on frontend
- [ ] Create Supabase client singleton
- [ ] Create AuthContext/AuthProvider (session state, user object, loading state)
- [ ] Login page — email/password + "Sign in with Google" + "Sign in with Apple"
- [ ] Signup page — email/password + OAuth + "Check your email to verify" prompt
- [ ] Forgot password page — email input → sends reset link
- [ ] Reset password page — new password form (from reset link)
- [ ] Protected route wrapper — redirect to /login if not authenticated
- [ ] Navbar updates: user avatar, display name, dropdown (settings, logout)
- [ ] Auto-attach Supabase auth token to all API requests
- [ ] Handle session refresh (token expiry)
- [ ] Onboarding flow: prompt for display name + home address on first login

### 1.7 — Initial Deployment
- [ ] Set up Vercel project for frontend (connect GitHub repo)
- [ ] Set up Railway project for backend API
- [ ] Configure environment variables on both platforms
- [ ] Set up CI/CD: push to main → auto-deploy
- [ ] Health check endpoint accessible publicly
- [ ] Test full auth flow in production
- [ ] Set up basic uptime monitoring (UptimeRobot or similar, free tier)

---

## PHASE 2: Core User Features
*Make it worth signing up for.*

### 2.1 — User-Owned Trips
- [ ] "My Trips" dashboard page (grid of trip cards)
- [ ] Trip cards: name, status badge, dates, stop count, mini-map thumbnail
- [ ] Create new trip flow
- [ ] Edit trip details
- [ ] Duplicate trip button
- [ ] Delete trip (soft delete, 30-day recovery window)
- [ ] Trip status workflow: Planning → Active → Completed

### 2.2 — Private Locations ("Hidden Gems")
- [ ] "Add Location" modal: all fields + visibility toggle (Public/Private)
- [ ] Private locations visible ONLY to the owner on the map
- [ ] Private location pins: distinct style (lock icon or special color)
- [ ] "My Locations" section in sidebar
- [ ] Edit own locations
- [ ] Delete own locations
- [ ] Community locations remain read-only for all users

### 2.3 — Favorites System
- [ ] Heart/star button on every location card, map popup, and detail panel
- [ ] "Favorites" tab in sidebar with saved locations list
- [ ] Filter map: "Show only my favorites" toggle
- [ ] Favorites count on user profile

### 2.4 — Home Address & Distance
- [ ] Home address input in settings (geocoded to lat/lon)
- [ ] "X hours / X miles from home" badge on every location
- [ ] Sort locations by distance from home
- [ ] Filter: "Within X hours of home"
- [ ] Home pin on map (house icon)

### 2.5 — Trip Journals
- [ ] Journal tab within trip view
- [ ] Add entry per stop: rich text + date + multiple photos
- [ ] Photo upload to Supabase Storage (with resize/optimization)
- [ ] Timeline view of journal entries
- [ ] Edit/delete journal entries

### 2.6 — User Settings & Profile
- [ ] Settings page: display name, avatar upload, email, password change
- [ ] Home address management
- [ ] Map preferences: default center, default zoom, map style
- [ ] Unit preferences: miles/km
- [ ] Theme: light/dark/system
- [ ] Delete account (GDPR compliant — removes all user data)

---

## PHASE 3: Mobile-First Experience ⭐ CRITICAL
*Most users will be on their phones while on trips. This is non-negotiable.*

### 3.1 — Mobile Navigation & Layout
- [ ] Bottom tab navigation (Map, Trips, Favorites, Profile) replacing desktop sidebar on mobile
- [ ] Swipe-up bottom sheet for location details (like Google Maps)
- [ ] Collapsible/draggable bottom sheet with snap points (peek, half, full)
- [ ] Full-screen map as the default mobile view
- [ ] Floating action button (FAB) for "Add Location" on mobile
- [ ] Swipe gestures: swipe between trip stops, swipe to dismiss panels

### 3.2 — Mobile Map Experience
- [ ] Touch-optimized: larger tap targets for pins (minimum 44px)
- [ ] Cluster tap: expand to show locations, not just zoom
- [ ] Single-tap popup → swipe-up sheet for full details
- [ ] GPS "My Location" button (use device GPS)
- [ ] Offline-capable map tiles (Mapbox offline packs for active trip area)
- [ ] Compass orientation mode for in-the-field use

### 3.3 — Mobile Trip Experience
- [ ] Trip cards optimized for thumb reach
- [ ] Stop-by-stop navigation view (like turn-by-turn but for trip stops)
- [ ] "Navigate" button: open in Apple Maps / Google Maps
- [ ] Quick journal entry: snap photo + one-tap save with GPS location
- [ ] Pull-to-refresh on all lists

### 3.4 — Mobile Performance
- [ ] Touch delay elimination (no 300ms delay)
- [ ] Smooth 60fps scrolling on all lists
- [ ] Lazy load images with blur-up placeholders
- [ ] Reduce initial JS bundle (code split aggressively)
- [ ] Service worker for offline support (at minimum: cached app shell)
- [ ] viewport meta tag, safe area insets for notched phones

### 3.5 — Mobile Polish
- [ ] All inputs: proper input types (email, tel, number) for correct mobile keyboards
- [ ] No horizontal scrolling anywhere
- [ ] Pinch-to-zoom disabled on UI (only on map)
- [ ] Haptic feedback on key actions (if supported)
- [ ] iOS Safari: fix bounce scrolling, address bar issues
- [ ] Android: fix soft keyboard pushing layout
- [ ] Test on iPhone SE (small), iPhone 16 (Nicos's phone), Pixel, Samsung Galaxy

---

## PHASE 4: Production Polish
*The "a professional team built this" feel.*

### 4.1 — Design System & UI
- [ ] Define color palette, typography scale, spacing scale, border radius
- [ ] Component library: Button, Input, Select, Modal, Card, Badge, Toast, Dropdown
- [ ] Consistent hover/active/focus states on EVERYTHING
- [ ] Smooth animations (Framer Motion): page transitions, panel open/close, list item enter/exit
- [ ] Skeleton loading states on every data-dependent component
- [ ] Empty states with helpful illustrations + CTAs
- [ ] Error states with retry buttons
- [ ] Toast notifications for all user actions
- [ ] 404 page, 500 page, maintenance page

### 4.2 — Landing Page
- [ ] Hero section: compelling headline, map preview, CTA
- [ ] Feature highlights (3-4 cards with icons)
- [ ] "How it works" section
- [ ] Social proof section (testimonials, stats)
- [ ] Footer: links, legal, social
- [ ] SEO: meta tags, OG images, structured data
- [ ] Responsive: looks great on all screen sizes

### 4.3 — Map Experience Upgrades
- [ ] Cluster markers with count + category breakdown on hover
- [ ] Smooth fly-to animation on location select
- [ ] Pulsing ring on selected/active location
- [ ] Redesigned popups: difficulty badge, trail type chips, quick-add-to-trip, favorite button
- [ ] Draw route between trip stops (Mapbox Directions API)
- [ ] Map style switcher (outdoors, satellite, terrain, streets)
- [ ] Heat map toggle (location density visualization)

### 4.4 — Performance Optimization
- [ ] React Query (TanStack Query) for all API calls — caching, deduplication, background refresh
- [ ] Code splitting: lazy load heavy components (MapContainer, RightPanel, TripTab)
- [ ] Virtualized lists (react-window) for the 6K+ location list
- [ ] Debounced search input (300ms)
- [ ] Image optimization: WebP format, responsive sizes, CDN delivery via Supabase Storage
- [ ] Lighthouse audit: target 90+ on Performance, Accessibility, Best Practices, SEO
- [ ] Database: connection pooling, query optimization, proper indexes
- [ ] API response compression (gzip)

### 4.5 — Security Hardening
- [ ] helmet.js security headers (CSP, HSTS, X-Frame-Options, etc.)
- [ ] All user input sanitized (DOMPurify for HTML, parameterized queries via Drizzle)
- [ ] XSS audit: no dangerouslySetInnerHTML without sanitization
- [ ] CORS locked to production domain
- [ ] Rate limiting on all endpoints
- [ ] File upload validation: type whitelist, max size, dimensions
- [ ] npm audit clean (zero high/critical vulnerabilities)
- [ ] Supabase RLS policies tested (can't access other users' data)
- [ ] Environment variable validation on startup

---

## PHASE 5: Growth & Community Features
*Post-launch. What makes users stick.*

### 5.1 — Sharing & Export
- [ ] Share trip as public read-only link (unique URL)
- [ ] Generate trip overview card (OG image for social sharing)
- [ ] Export trip as PDF itinerary
- [ ] Export trip as GPX (for GPS devices)
- [ ] Export favorite locations as GPX

### 5.2 — Community Locations
- [ ] Users can submit locations to the public database
- [ ] Moderation queue for submitted locations
- [ ] Upvote/downvote on community locations
- [ ] User reviews + star ratings
- [ ] "Verified" badge for quality submissions
- [ ] Contributor leaderboard

### 5.3 — Smart Features
- [ ] Auto-suggest stops between long trip legs
- [ ] "Explore nearby" — find riding + camping within 30mi of any point
- [ ] Weather forecast for trip dates (Open-Meteo API)
- [ ] Sunrise/sunset times at each stop
- [ ] Nearby town info (resupply, gas, services)
- [ ] Seasonal recommendations

### 5.4 — Notifications & Engagement
- [ ] Welcome email series (onboarding drip)
- [ ] "New locations added near your favorites" email digest
- [ ] Trip departure reminders
- [ ] In-app notification bell

---

## PHASE 6: Monetization & Scale
*When ready to charge.*

### 6.1 — Stripe Integration
- [ ] Stripe account + products/prices
- [ ] Checkout flow: upgrade button → Stripe Checkout → redirect back
- [ ] Webhook handler (subscription lifecycle events)
- [ ] Billing portal link (manage subscription)
- [ ] Free vs Premium tier definitions
- [ ] Feature flag middleware (check tier before allowing gated actions)
- [ ] Pricing page with comparison table

### 6.2 — Monitoring & Ops
- [ ] Sentry error tracking (frontend + backend)
- [ ] Application performance monitoring
- [ ] Database monitoring (slow queries, pool usage)
- [ ] Uptime monitoring + alerting
- [ ] User analytics (PostHog or Plausible)
- [ ] Staging environment

### 6.3 — Legal & Compliance
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie consent banner
- [ ] GDPR: data export + account deletion
- [ ] Stripe PCI compliance (handled by Stripe)

---

## Execution Priority

| Phase | What | Tasks | Priority |
|-------|------|-------|----------|
| **1** | Auth + Postgres + Deploy | ~40 | 🔴 FIRST |
| **2** | User features (trips, private locs, favs, journals) | ~30 | 🔴 CORE |
| **3** | Mobile-first experience | ~25 | 🔴 CRITICAL |
| **4** | Production polish & performance | ~35 | 🟡 LAUNCH |
| **5** | Community & growth features | ~20 | 🟢 POST-LAUNCH |
| **6** | Monetization & scale | ~20 | 🟢 WHEN READY |

**Total: ~170 tasks**

---

## Key Decisions
- **Database:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **ORM:** Drizzle ORM (type-safe, lightweight, great DX)
- **Auth:** Supabase Auth (built-in email, Google, Apple OAuth)
- **File Storage:** Supabase Storage (trip photos, avatars)
- **Frontend Deploy:** Vercel
- **Backend Deploy:** Railway
- **Launch Mode:** Free beta (no payments initially)
- **Domain:** TBD (Nicos to register)
- **Mobile:** Mobile-first design priority throughout all phases

---

## PHASE 7: AI Trip Planner (Premium Feature)
*Natural language trip planning powered by AI + TrailCamp's location database.*

### 7.1 — Chat Interface
- [ ] Chat UI component in Trips tab
- [ ] Message history per trip
- [ ] Typing indicators, error states

### 7.2 — AI Backend
- [ ] `/api/chat` endpoint with streaming responses
- [ ] Model: GPT-4o-mini or Claude Haiku (cost: ~$0.01-0.05/conversation)
- [ ] System prompt with TrailCamp context + tool definitions
- [ ] Tool functions: `search_locations`, `get_route_distance`, `get_weather_forecast`
- [ ] Rate limiting per user (free: 2/month, premium: unlimited)

### 7.3 — Trip Generation
- [ ] AI generates structured trip with stops, dates, daily plans
- [ ] One-click "Save as Trip" pushes to trip planner with all stops on map
- [ ] Follow-up refinement via conversation
- [ ] Considers driving distance, riding difficulty, boondocking vs campgrounds, dump/water proximity

---

## PHASE 8: Multi-Hobby Platform ("One App for Every Adventure")
*Expand from dirt bike + camping to ALL outdoor recreation hobbies.*

### 8.1 — User Hobby Preferences
- [ ] `user_preferences` table (hobbies array, default filters)
- [ ] Onboarding screen after signup: "What do you enjoy?"
- [ ] Hobby options: Hiking, Mountain Biking, Dirt Bikes, ATVs/UTVs, Fishing, Boating, Rock Climbing, Hunting, Kayaking/Canoeing, Horseback Riding
- [ ] App defaults to showing only selected hobbies + universal (camps, boondocking, water, dumps)
- [ ] Can always toggle others on/off in layers panel

### 8.2 — New Location Categories
- [ ] 🥾 Hiking trails (OpenStreetMap, USFS trail data)
- [ ] 🚵 Mountain biking trails (OpenStreetMap, MTB Project API)
- [ ] 🎣 Fishing spots (state fish & wildlife public access, boat ramps)
- [ ] 🛶 Kayaking/Canoeing (public water access points, put-ins)
- [ ] 🧗 Rock climbing (OpenBeta open source DB)
- [ ] 🏹 Hunting areas (public land overlays — BLM/USFS already partial)
- [ ] 🐎 Horseback riding trails

### 8.3 — Hobby-Specific Features
- [ ] Hobby-specific card designs per category
- [ ] Hobby-specific filters (e.g., fish species, rapid class, route grade)
- [ ] Hobby-specific detail fields per location type
- [ ] Category-aware API filtering based on user preferences
- [ ] Smart defaults: new users see campgrounds + their hobbies, nothing else

### 8.4 — Performance at Scale
- [ ] Server-side filtering by user hobby preferences (don't load what you don't use)
- [ ] Mapbox clustering handles density at any zoom level
- [ ] Slim endpoint already strips unnecessary fields
- [ ] Adding 50K+ locations per hobby won't impact users who don't select that hobby
