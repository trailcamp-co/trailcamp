import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'trailcamp.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'planning',
      start_date TEXT,
      end_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS trip_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      location_id INTEGER REFERENCES locations(id),
      name TEXT,
      latitude REAL,
      longitude REAL,
      sort_order INTEGER NOT NULL,
      planned_arrival TEXT,
      planned_departure TEXT,
      actual_arrival TEXT,
      actual_departure TEXT,
      nights INTEGER,
      notes TEXT,
      drive_time_mins INTEGER,
      drive_distance_miles REAL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      category TEXT NOT NULL,
      sub_type TEXT,
      source TEXT,
      source_id TEXT,

      cell_signal TEXT,
      shade INTEGER,
      level_ground INTEGER,
      water_nearby INTEGER,
      dump_nearby INTEGER,
      max_vehicle_length INTEGER,
      stay_limit_days INTEGER,
      season TEXT,
      crowding TEXT,

      trail_types TEXT,
      difficulty TEXT,
      distance_miles REAL,
      elevation_gain_ft INTEGER,
      permit_required INTEGER,
      permit_info TEXT,

      scenery_rating INTEGER,
      best_season TEXT,
      photos TEXT,
      external_links TEXT,
      notes TEXT,
      hours TEXT,

      user_rating INTEGER,
      user_notes TEXT,
      visited INTEGER DEFAULT 0,
      visited_date TEXT,
      want_to_visit INTEGER DEFAULT 0,

      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
    CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_source ON locations(source, source_id);
    CREATE INDEX IF NOT EXISTS idx_trip_stops_trip ON trip_stops(trip_id);

    CREATE TABLE IF NOT EXISTS trip_journal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      stop_id INTEGER,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id),
      FOREIGN KEY (stop_id) REFERENCES trip_stops(id)
    );
  `);

  // Add favorited column if it doesn't exist
  const cols = db.prepare("PRAGMA table_info(locations)").all() as { name: string }[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('favorited')) {
    db.exec('ALTER TABLE locations ADD COLUMN favorited INTEGER DEFAULT 0');
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}
