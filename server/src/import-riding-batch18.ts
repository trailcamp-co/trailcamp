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
  // ===== MOAB SPECIFIC TRAILS — from Dirt Legal =====
  { name: 'Poison Spider Mesa — Moab', lat: 38.5789, lng: -109.6234, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Expert', distance_miles: 14, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Legendary Moab trail. Expert slickrock and cliff edges. Colorado River views. Iconic.', slug: 'poison-spider-mesa' },
  { name: 'Hell\'s Revenge — Moab', lat: 38.5567, lng: -109.5234, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Expert', distance_miles: 6, elevation_gain_ft: 400, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Extreme slickrock trail. Steep climbs and descents on red rock. Not for beginners.', slug: 'hells-revenge' },
  { name: 'Hidden Valley — Moab', lat: 38.5567, lng: -109.5789, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 8, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Easy Moab ride with great views. Behind the Rocks views. Good intro to Moab.', slug: 'hidden-valley-moab' },
  { name: 'Kane Creek Canyon — Moab', lat: 38.5234, lng: -109.6234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Colorado River canyon road. Petroglyphs, cliff faces, river access. Scenic Moab ride.', slug: 'kane-creek' },
  { name: 'Hurrah Pass — Moab', lat: 38.4789, lng: -109.6567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 600, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Easy Moab pass with spectacular views. Dead Horse Point and Colorado River overlooks.', slug: 'hurrah-pass' },
  { name: 'Pritchett Canyon — Moab', lat: 38.5234, lng: -109.5567, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Expert', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Extreme technical trail. Rock ledges and obstacles. For experts only. Moab classic.', slug: 'pritchett-canyon' },

  // ===== RED RIVER TX — from Dirt Legal =====
  { name: 'Red River Motorcycle Trails — Muenster TX', lat: 33.6567, lng: -97.3234, sub_type: 'Private Park', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: '2,500 acres motorcycle/ATV. No easy trails. Sand, rocks, clay, dirt. N Texas near Oklahoma.', slug: 'red-river-mx-tx' },

  // ===== CHATTAHOOCHEE NF — from ThumperTalk =====
  { name: 'Chattahoochee NF — Suches GA', lat: 34.7234, lng: -84.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'N Georgia mountains. Forest roads and hidden trails. Great dual sport loops. Near Atlanta.', slug: 'chattahoochee-nf' },

  // ===== MORE DEPTH IN KEY AREAS =====
  
  // CA — more
  { name: 'Plaster City OHV — Ocotillo', lat: 32.7567, lng: -115.8234, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Imperial County. Open desert and dunes south of Anza-Borrego. Easy desert riding.', slug: 'plaster-city' },
  { name: 'Stoddard Valley OHV — Barstow', lat: 34.7234, lng: -117.1567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'High desert near Barstow. 40,000 acres. Easy open desert riding.', slug: 'stoddard-valley' },
  { name: 'El Mirage OHV — Adelanto', lat: 34.6567, lng: -117.6234, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Dry lakebed near Victorville. Open flat and dunes. SoCal local spot.', slug: 'el-mirage' },
  { name: 'Corral Canyon OHV — Lake Elsinore', lat: 33.6789, lng: -117.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Oct-May', permit_required: 1, permit_info: 'Cleveland NF Adventure Pass', notes: 'SoCal mountains. Technical single track in Cleveland NF. Lake Elsinore area.', slug: 'corral-canyon' },
  
  // OR — more
  { name: 'Siuslaw NF — Florence Dunes', lat: 43.9567, lng: -124.0234, sub_type: 'National Forest', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'USFS pass', notes: 'Oregon Coast dunes near Florence. Massive sand riding area. Pacific Ocean views.', slug: 'siuslaw-dunes' },
  { name: 'Tillamook State Forest — OHV Area', lat: 45.5567, lng: -123.5234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'OR ATV permit', notes: 'Coast Range west of Portland. Dense PNW forest riding. Multiple trail systems.', slug: 'tillamook-sf' },

  // WA — more
  { name: 'Reiter Foothills OHV — Gold Bar', lat: 47.8234, lng: -121.6567, sub_type: 'State Forest', trail_types: ['Single Track', 'Technical', 'Fire Road'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Near Gold Bar. Cascades foothills. Technical PNW riding. Popular Seattle area spot.', slug: 'reiter-foothills' },
  { name: 'Elbe Hills OHV — Elbe WA', lat: 46.7234, lng: -122.2567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Near Mt. Rainier. Forest trails with mountain views. Intermediate riding.', slug: 'elbe-hills' },

  // ID — more
  { name: 'St. Anthony Sand Dunes', lat: 43.9567, lng: -111.6234, sub_type: 'BLM', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Eastern Idaho. 10,600 acres of white quartz sand. Teton Range backdrop. Popular dune riding.', slug: 'st-anthony-dunes' },

  // NV — more
  { name: 'Jean OHV — Jean NV', lat: 35.7789, lng: -115.3234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'South of Las Vegas on I-15. Easy desert riding. Convenient Vegas-area spot.', slug: 'jean-ohv' },

  // More GA/SE
  { name: 'River Creek WMA — Ellijay GA', lat: 34.7234, lng: -84.5567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'N Georgia mountains. Wildlife management area with forest roads. Good dual sport.', slug: 'river-creek-ga' },

  // More NC
  { name: 'Nantahala NF — Standing Indian', lat: 35.0567, lng: -83.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SW NC mountains. Beautiful mountain riding along the AT corridor. Appalachian scenery.', slug: 'nantahala-standing-indian' },

  // More FL
  { name: 'Hard Rock Cycle Park — Ocala FL', lat: 29.2567, lng: -82.1234, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central FL. 700 acres. MX track, single track, hare scramble. Good all-around facility.', slug: 'hard-rock-ocala' },
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
console.log(`Batch 18: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
