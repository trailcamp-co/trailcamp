import Database from 'better-sqlite3';
import path from 'path';
import { readFileSync } from 'fs';

const DB_PATH = path.join(__dirname, '..', 'trailcamp.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

interface RidingSpot {
  name: string;
  lat: number;
  lng: number;
  sub_type: string;
  trail_types: string[];
  difficulty: string;
  distance_miles: number | null;
  elevation_gain_ft: number | null;
  scenery_rating: number;
  best_season: string;
  permit_required: number;
  permit_info: string | null;
  notes: string;
  slug: string;
}

const spotsPath = path.join(__dirname, 'data', 'riding-spots.json');
const spots: RidingSpot[] = JSON.parse(readFileSync(spotsPath, 'utf-8'));

const insert = db.prepare(`
  INSERT OR IGNORE INTO locations (
    name, latitude, longitude, category, sub_type, source, source_id,
    trail_types, difficulty, distance_miles, elevation_gain_ft,
    scenery_rating, best_season, permit_required, permit_info,
    notes, description
  ) VALUES (
    @name, @lat, @lng, 'riding', @sub_type, 'riding-spots', @slug,
    @trail_types, @difficulty, @distance_miles, @elevation_gain_ft,
    @scenery_rating, @best_season, @permit_required, @permit_info,
    @notes, @notes
  )
`);

const tx = db.transaction(() => {
  for (const spot of spots) {
    insert.run({
      ...spot,
      trail_types: JSON.stringify(spot.trail_types),
    });
  }
});

tx();
console.log(`Imported ${spots.length} riding spots from consolidated JSON`);
db.close();
