# Phase 1 Task: Backend Migration to Supabase PostgreSQL

READ SAAS-ROADMAP.md first for context.

## What you're doing
Restructuring TrailCamp from a local single-user SQLite app into a multi-tenant SaaS backend using Supabase PostgreSQL + Drizzle ORM.

## Steps

### 1. Install dependencies in server/
```
npm install drizzle-orm postgres @supabase/supabase-js zod helmet express-rate-limit
npm install -D drizzle-kit @types/express-rate-limit
npm uninstall better-sqlite3 @types/better-sqlite3
```

### 2. Create server/src/db/schema.ts (Drizzle schema)

Tables:
- **users**: id (uuid PK, default gen_random_uuid()), email (unique not null), display_name (text), avatar_url (text), home_lat (real), home_lon (real), home_address (text), units_preference (text default 'imperial'), theme (text default 'system'), tier (text default 'free'), created_at (timestamptz default now()), updated_at (timestamptz default now())
- **locations**: Keep ALL existing columns from current database.ts schema. Add: user_id (uuid nullable FK→users, NULL=community), visibility (text default 'public'). Change id to serial. Add featured (integer default 0), water_available (integer), cost_per_night (real), state (text), county (text), country (text) columns.
- **trips**: Keep ALL existing columns. Add user_id (uuid NOT NULL FK→users). Change id to serial.
- **trip_stops**: Keep ALL existing columns. Change id to serial. FK trip_id→trips CASCADE, location_id→locations SET NULL.
- **trip_journal**: id serial, trip_id FK, stop_id FK nullable, user_id FK, content text not null, created_at timestamptz.
- **user_favorites**: id serial, user_id uuid FK, location_id integer FK, created_at timestamptz. Unique(user_id, location_id).
- **user_settings**: user_id uuid PK FK, default_map_center_lat real, default_map_center_lon real, default_zoom integer default 4, sidebar_collapsed boolean default false.

### 3. Create server/drizzle.config.ts
Point to DATABASE_URL env var, schema path, PostgreSQL dialect.

### 4. Create server/src/db/index.ts
Connection using postgres.js driver with DATABASE_URL. Export drizzle db instance.

### 5. Create server/src/middleware/auth.ts
- Read `Authorization: Bearer <token>` header
- Use @supabase/supabase-js createClient with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
- Call supabase.auth.getUser(token) to validate
- Attach to req.user = { id, email }
- Export: requireAuth (401 if invalid), optionalAuth (attach if present, continue if not)
- Extend Express Request type to include user

### 6. Create server/src/middleware/validate.ts
Generic zod validation middleware for body/query/params.

### 7. Rewrite server/src/routes/locations.ts
- Use drizzle queries (no raw SQL)
- GET /: optionalAuth — public locations + user's private (if authed)
- GET /:id: optionalAuth — public OR owned
- POST /: requireAuth — create with user_id, visibility from body
- PUT /:id: requireAuth — only if owned
- DELETE /:id: requireAuth — only if owned
- GET /featured: public
- Zod validation on POST/PUT

### 8. Rewrite server/src/routes/trips.ts
- ALL require auth, scoped to req.user.id
- Full CRUD + trip stops management
- Drizzle queries

### 9. Create server/src/routes/users.ts
- GET /me: profile
- PUT /me: update profile
- DELETE /me: delete account + all data

### 10. Create server/src/routes/favorites.ts
- POST /:locationId: add
- DELETE /:locationId: remove
- GET /: list user's favorites with location data

### 11. Update server/src/index.ts
- Add helmet(), rate limiter, new routes (users, favorites)
- Request logging middleware
- Error handling middleware
- Validate env vars on startup: DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- Keep health check and mapbox-token public

### 12. Create server/.env.example
List all required env vars (no values).

### 13. Update server/package.json scripts
Add: db:generate, db:push, db:studio

## RULES
- Keep ALL existing location fields — drop nothing
- TypeScript strict — no 'any' types
- Every route: try/catch + meaningful errors
- Drizzle query builder only, no raw SQL
- User-scoped queries MUST check user_id
- Keep /api/directions and /api/import working (add optionalAuth)
- Backend only — NO frontend changes
- Git commit when done: "Phase 1: Backend migration to Supabase PostgreSQL + Drizzle ORM + Auth"
