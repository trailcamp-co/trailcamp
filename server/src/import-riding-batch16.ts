import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'trailcamp.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

interface Spot {
  name: string; lat: number; lng: number; sub_type: string;
  trail_types: string[]; difficulty: string; distance_miles: number | null;
  elevation_gain_ft: number | null; scenery_rating: number; best_season: string;
  permit_required: number; permit_info: string | null; notes: string; slug: string;
}

const spots: Spot[] = [
  // ===== PENNSYLVANIA (only 2!) =====
  { name: 'Anthracite Outdoor Adventure Area — Shamokin PA', lat: 40.7567, lng: -76.5234, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 60, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Former coal mine land. 7,500 acres. 60+ miles. Rocky, technical, diverse terrain. Major PA destination.', slug: 'aoaa-shamokin' },
  { name: 'Paragon Adventure Park — Marion Center PA', lat: 40.7789, lng: -79.0234, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro', 'Motocross'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Western PA. 6,000 acres. 120+ miles of trails. Woods and MX. Major facility.', slug: 'paragon-pa' },
  { name: 'Ride Royal Blue — Pioneer TN/KY border', lat: 36.4567, lng: -83.9234, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 600, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Trail pass', notes: '600+ miles on reclaimed coal land! TN/KY border. Massive system. Mountain views. Hidden gem.', slug: 'royal-blue' },
  { name: 'State Game Lands 75 — Schuylkill County PA', lat: 40.6234, lng: -76.2567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'PA Game Commission permit', notes: 'Coal region PA. Open trails through game lands. Rocky terrain.', slug: 'sgl-75' },
  { name: 'Bald Eagle State Forest — Centre County PA', lat: 40.9234, lng: -77.3567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central PA. Mountain and forest trails. Beautiful Appalachian scenery.', slug: 'bald-eagle-sf' },

  // ===== TENNESSEE (only 4) =====
  { name: 'Adventure Trail Riders Park — Dunlap TN', lat: 35.3234, lng: -85.3567, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro', 'Technical'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Cumberland Plateau. 6,000 acres. Technical mountain trails. Major TN riding destination.', slug: 'atrp-dunlap' },
  { name: 'North Cumberland OHV — Huntsville TN', lat: 36.3234, lng: -84.4567, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 150, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'TN OHV permit', notes: 'Huge system! 150+ miles on state land. Cumberland Mountains. Recently expanded.', slug: 'north-cumberland' },
  { name: 'Coal Creek OHV — LaFollette TN', lat: 36.4234, lng: -84.1567, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'TN OHV permit', notes: 'NE Tennessee. Coal country trails. Former mine land. Good intermediate riding.', slug: 'coal-creek-tn' },

  // ===== MISSOURI (only 6) =====
  { name: 'Chadwick ATV Trails — Mark Twain NF', lat: 36.9234, lng: -93.0567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SW Missouri Ozarks. 60+ miles of trails. Hardwood forest. Creek crossings.', slug: 'chadwick-mo' },
  { name: 'Finger Lakes OHV — Columbia MO', lat: 39.0234, lng: -91.9567, sub_type: 'State Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 70, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'MO OHV registration', notes: 'Central MO. 70+ miles of trails. Located on Army Corps of Engineers land. Popular.', slug: 'finger-lakes-mo' },
  { name: 'Lead Belt OHV — Potosi MO', lat: 37.9234, lng: -90.8567, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Old lead mining area. Rocky technical terrain. Mark Twain NF.', slug: 'lead-belt-mo' },

  // ===== WISCONSIN (in MN count) — adding more =====
  { name: 'Black River State Forest — BRF WI', lat: 44.2567, lng: -90.7234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'WI ATV/UTV registration', notes: 'Central WI. 30+ miles in pine and hardwood forest. Sandy soil. Good for beginners.', slug: 'black-river-sf' },
  { name: 'Dyracuse OHV Park — Tomahawk WI', lat: 45.4567, lng: -89.7234, sub_type: 'Private Park', trail_types: ['Single Track', 'Technical', 'Motocross'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'N Central WI. 800 acres. Technical woods and MX. Hilly terrain for Wisconsin.', slug: 'dyracuse' },

  // ===== IOWA (only 2) =====
  { name: 'Brushy Creek SRA — Lehigh IA', lat: 42.3234, lng: -94.0567, sub_type: 'State Park', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'IA ATV reg', notes: 'Central Iowa. 6,500 acres. Rolling terrain and timber. Good for Midwest riders.', slug: 'brushy-creek-ia' },

  // ===== KANSAS (only 2) =====
  { name: 'Fall River Lake OHV — Fall River KS', lat: 37.6234, lng: -96.0567, sub_type: 'OHV Area', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SE Kansas. Army Corps land. Rolling Flint Hills terrain with lake access.', slug: 'fall-river-ks' },
  { name: 'Wilson State Park OHV — Sylvan Grove KS', lat: 38.9567, lng: -98.5234, sub_type: 'State Park', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'KS state park fee', notes: 'Central KS. Unique Dakota sandstone bluffs. Lake Wilson access. Surprising scenery for KS.', slug: 'wilson-sp-ks' },

  // ===== NEBRASKA (only 3) =====
  { name: 'Pine Ridge — Chadron NE', lat: 42.8234, lng: -103.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Nebraska NF. Pine-covered ridges in NW NE. Surprisingly scenic for Nebraska.', slug: 'pine-ridge-ne' },

  // ===== CONNECTICUT (only 3) =====
  { name: 'Thomaston Dam — Thomaston CT', lat: 41.6567, lng: -73.0234, sub_type: 'OHV Area', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'CT ATV reg', notes: 'Army Corps land. 15+ miles of rocky New England single track. Technical riding.', slug: 'thomaston-dam' },

  // ===== NEW JERSEY (only 1) =====
  { name: 'Wharton State Forest — Atsion', lat: 39.7234, lng: -74.7567, sub_type: 'State Forest', trail_types: ['Sand', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'NJ forest OHV permit', notes: 'Pine Barrens. Sandy terrain. 120,000 acre forest. Designated sand roads and trails.', slug: 'wharton-sf' },
  { name: 'Millville OHV — Millville NJ', lat: 39.3567, lng: -75.0234, sub_type: 'OHV Area', trail_types: ['Sand', 'Single Track'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 20, scenery_rating: 2, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'South NJ. Sandy OHV riding near Delaware Bay. Easy terrain.', slug: 'millville-ohv' },

  // ===== VERMONT — missing =====
  { name: 'VAST Trails — Statewide VT', lat: 44.2567, lng: -72.5234, sub_type: 'Trail System', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 800, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'VAST membership + TMA', notes: 'Vermont ATV Sportsman\'s Association. 800+ miles statewide. Green Mountain scenery.', slug: 'vast-vt' },

  // ===== RHODE ISLAND — missing =====
  { name: 'Big River Management Area — West Greenwich RI', lat: 41.6234, lng: -71.6567, sub_type: 'OHV Area', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 5, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'RI ATV reg', notes: 'One of the few legal riding areas in RI. Small but accessible.', slug: 'big-river-ri' },
];

const stmt = db.prepare(`
  INSERT OR IGNORE INTO locations (
    name, latitude, longitude, category, sub_type, source, source_id,
    trail_types, difficulty, distance_miles, elevation_gain_ft,
    scenery_rating, best_season, permit_required, permit_info, notes
  ) VALUES (
    ?, ?, ?, 'riding', ?, 'curated', ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?
  )
`);

const insertMany = db.transaction(() => {
  let inserted = 0;
  for (const s of spots) {
    const result = stmt.run(
      s.name, s.lat, s.lng, s.sub_type, `riding-${s.slug}`,
      JSON.stringify(s.trail_types), s.difficulty, s.distance_miles, s.elevation_gain_ft,
      s.scenery_rating, s.best_season, s.permit_required, s.permit_info, s.notes
    );
    if (result.changes > 0) inserted++;
  }
  return inserted;
});

const inserted = insertMany();
const total = db.prepare("SELECT COUNT(*) as cnt FROM locations WHERE category='riding'").get() as any;
const grandTotal = db.prepare("SELECT COUNT(*) as cnt FROM locations").get() as any;
console.log(`Batch 16: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
