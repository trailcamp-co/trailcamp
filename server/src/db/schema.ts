import {
  pgTable,
  uuid,
  text,
  serial,
  integer,
  real,
  boolean,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  homeLat: real('home_lat'),
  homeLon: real('home_lon'),
  homeAddress: text('home_address'),
  unitsPreference: text('units_preference').notNull().default('imperial'),
  theme: text('theme').notNull().default('system'),
  tier: text('tier').notNull().default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Locations ───────────────────────────────────────────────────────────────

export const locations = pgTable(
  'locations',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    latitude: real('latitude').notNull(),
    longitude: real('longitude').notNull(),
    category: text('category').notNull(),
    subType: text('sub_type'),
    source: text('source'),
    sourceId: text('source_id'),

    // Campsite attributes
    cellSignal: text('cell_signal'),
    shade: integer('shade'),
    levelGround: integer('level_ground'),
    waterNearby: integer('water_nearby'),
    waterAvailable: integer('water_available'),
    dumpNearby: integer('dump_nearby'),
    maxVehicleLength: integer('max_vehicle_length'),
    stayLimitDays: integer('stay_limit_days'),
    season: text('season'),
    crowding: text('crowding'),
    costPerNight: real('cost_per_night'),

    // Riding attributes
    trailTypes: text('trail_types'),
    difficulty: text('difficulty'),
    distanceMiles: real('distance_miles'),
    elevationGainFt: integer('elevation_gain_ft'),
    permitRequired: integer('permit_required'),
    permitInfo: text('permit_info'),

    // General attributes
    sceneryRating: integer('scenery_rating'),
    bestSeason: text('best_season'),
    photos: text('photos'),
    externalLinks: text('external_links'),
    notes: text('notes'),
    hours: text('hours'),
    featured: integer('featured').notNull().default(0),

    // User interaction (legacy single-user — kept for migration compat)
    // LEGACY: migrate to user_location_data table
    userRating: integer('user_rating'),
    // LEGACY: migrate to user_location_data table
    userNotes: text('user_notes'),
    // LEGACY: migrate to user_location_data table
    visited: integer('visited').notNull().default(0),
    // LEGACY: migrate to user_location_data table
    visitedDate: text('visited_date'),
    wantToVisit: integer('want_to_visit').notNull().default(0),
    favorited: integer('favorited').notNull().default(0),

    // Geo enrichment
    city: text('city'),
    state: text('state'),
    county: text('county'),
    country: text('country'),

    // Grouping (nearby locations clustered together)
    groupId: integer('group_id'),
    isGroupPrimary: integer('is_group_primary').notNull().default(0),

    // Multi-tenant fields
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    visibility: text('visibility').notNull().default('public'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_locations_category').on(table.category),
    index('idx_locations_coords').on(table.latitude, table.longitude),
    index('idx_locations_user').on(table.userId),
    index('idx_locations_visibility').on(table.visibility),
    index('idx_locations_featured').on(table.featured),
    index('idx_locations_scenery').on(table.sceneryRating),
    index('idx_locations_state').on(table.state),
    index('idx_locations_difficulty').on(table.difficulty),
    index('idx_locations_sub_type').on(table.subType),
    index('idx_locations_best_season').on(table.bestSeason),
  ]
);

// ─── Trips ───────────────────────────────────────────────────────────────────

export const trips = pgTable(
  'trips',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('planning'),
    startDate: text('start_date'),
    endDate: text('end_date'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_trips_user').on(table.userId),
  ]
);

// ─── Trip Stops ──────────────────────────────────────────────────────────────

export const tripStops = pgTable(
  'trip_stops',
  {
    id: serial('id').primaryKey(),
    tripId: integer('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    locationId: integer('location_id').references(() => locations.id, {
      onDelete: 'set null',
    }),
    name: text('name'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    sortOrder: integer('sort_order').notNull(),
    plannedArrival: text('planned_arrival'),
    plannedDeparture: text('planned_departure'),
    actualArrival: text('actual_arrival'),
    actualDeparture: text('actual_departure'),
    nights: integer('nights'),
    notes: text('notes'),
    driveTimeMins: integer('drive_time_mins'),
    driveDistanceMiles: real('drive_distance_miles'),
  },
  (table) => [
    index('idx_trip_stops_trip').on(table.tripId),
    index('idx_trip_stops_location').on(table.locationId),
  ]
);

// ─── Trip Journal ────────────────────────────────────────────────────────────

export const tripJournal = pgTable(
  'trip_journal',
  {
    id: serial('id').primaryKey(),
    tripId: integer('trip_id')
      .notNull()
      .references(() => trips.id, { onDelete: 'cascade' }),
    stopId: integer('stop_id').references(() => tripStops.id, {
      onDelete: 'set null',
    }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    entryDate: text('entry_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_journal_trip').on(table.tripId),
    index('idx_journal_user').on(table.userId),
  ]
);

// ─── User Favorites ──────────────────────────────────────────────────────────

export const userFavorites = pgTable(
  'user_favorites',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('uq_user_favorites').on(table.userId, table.locationId),
    index('idx_favorites_user').on(table.userId),
  ]
);

// ─── Location Reviews (public, visible to all) ──────────────────────────────

export const locationReviews = pgTable(
  'location_reviews',
  {
    id: serial('id').primaryKey(),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(), // 1-5 stars
    title: text('title'),
    content: text('content'),
    visitedDate: text('visited_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('uq_review_user_location').on(table.userId, table.locationId),
    index('idx_reviews_location').on(table.locationId),
    index('idx_reviews_user').on(table.userId),
  ]
);

// ─── User Location Data (per-user annotations on any location) ───────────────

export const userLocationData = pgTable(
  'user_location_data',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    visited: integer('visited').notNull().default(0),
    visitedDate: text('visited_date'),
    wantToVisit: integer('want_to_visit').notNull().default(0),
    // LEGACY: migrate to user_location_data table
    userRating: integer('user_rating'),
    // LEGACY: migrate to user_location_data table
    userNotes: text('user_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('uq_user_location').on(table.userId, table.locationId),
    index('idx_user_location_user').on(table.userId),
    index('idx_user_location_location').on(table.locationId),
  ]
);

// ─── Location Photos ─────────────────────────────────────────────────────

export const locationPhotos = pgTable(
  'location_photos',
  {
    id: serial('id').primaryKey(),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    caption: text('caption'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_photos_location').on(table.locationId),
    index('idx_photos_user').on(table.userId),
  ]
);

// ─── Condition Reports ───────────────────────────────────────────────────

export const conditionReports = pgTable(
  'condition_reports',
  {
    id: serial('id').primaryKey(),
    locationId: integer('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    conditionType: text('condition_type').notNull(),
    severity: text('severity').notNull().default('info'),
    description: text('description'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_conditions_location_expires').on(table.locationId, table.expiresAt),
    index('idx_conditions_user').on(table.userId),
  ]
);

// ─── User Settings ───────────────────────────────────────────────────────────

export const userSettings = pgTable('user_settings', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  defaultMapCenterLat: real('default_map_center_lat'),
  defaultMapCenterLon: real('default_map_center_lon'),
  defaultZoom: integer('default_zoom').notNull().default(4),
  sidebarCollapsed: boolean('sidebar_collapsed').notNull().default(false),
});

