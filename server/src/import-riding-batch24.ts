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
  // ===== Final CA depth — filling remaining gaps =====
  { name: 'Caliente Bodfish Road — Kern County', lat: 35.3789, lng: -118.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Southern Sierra foothills. Easy desert and scrub riding. Bakersfield area.', slug: 'caliente-bodfish' },
  { name: 'Azusa Canyon — San Gabriel Mountains', lat: 34.1789, lng: -117.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Oct-May', permit_required: 1, permit_info: 'ANF Adventure Pass', notes: 'Angeles NF. Canyon riding north of LA. Mountain views.', slug: 'azusa-canyon' },
  { name: 'Sand Hollow — Imperial Valley', lat: 33.0567, lng: -115.5234, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'East of El Centro. Small dune area. Easy desert riding.', slug: 'sand-hollow-ca' },

  // ===== Final UT depth =====
  { name: 'Cedar Mesa — Bears Ears', lat: 37.4567, lng: -109.8234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Bears Ears National Monument. Ancient ruins and canyons. Remote SE Utah.', slug: 'cedar-mesa' },
  { name: 'La Sal Mountains Loop — Moab', lat: 38.4567, lng: -109.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 60, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Classic Moab area loop. Desert to 10,000+ ft alpine. Aspen groves and mountain meadows.', slug: 'la-sal-loop' },
  { name: 'Factory Butte — Hanksville', lat: 38.3234, lng: -110.8567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Remote badlands near Hanksville. Mars-like terrain. Open BLM riding around iconic butte.', slug: 'factory-butte' },

  // ===== Final AZ depth =====
  { name: 'Black Canyon Trail — New River', lat: 34.0567, lng: -112.1234, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 80, elevation_gain_ft: 5000, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: '80-mile single track from New River to Prescott. Technical desert and forest. Epic long ride.', slug: 'black-canyon-trail' },
  { name: 'Florence Junction — Legends of Superior Trail', lat: 33.2567, lng: -111.3234, sub_type: 'BLM', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'SE of Phoenix. Rocky technical single track. Sonoran Desert. Challenging.', slug: 'legends-superior' },

  // ===== Final CO depth =====
  { name: 'Lake Como Road — Pikes Peak', lat: 38.7234, lng: -105.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Expert', distance_miles: 7, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Pikes Peak access. Highest OHV road in North America to 13,800+ ft! Extreme rocky shelf road.', slug: 'lake-como-pikes' },
  { name: 'Corkscrew Gulch — Silverton', lat: 37.8789, lng: -107.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Technical'], difficulty: 'Expert', distance_miles: 5, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Connects Silverton to California Gulch. Extremely steep and technical. San Juans. Expert only.', slug: 'corkscrew-gulch' },
  { name: 'Montezuma Basin — Ouray', lat: 37.9567, lng: -107.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Above Ouray. 12,000+ ft basin with alpine lakes. San Juan Mountains. Stunning.', slug: 'montezuma-basin' },

  // ===== Final ID depth =====
  { name: 'White Clouds — Ketchum area', lat: 44.0567, lng: -114.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'White Cloud Mountains. Alpine lakes and granite peaks. Remote central Idaho.', slug: 'white-clouds-id' },
  { name: 'Craters of the Moon — Arco BLM', lat: 43.3567, lng: -113.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Volcanic lava fields. BLM lands around the national monument. Unique landscape.', slug: 'craters-moon-blm' },

  // ===== Final NV depth =====
  { name: 'Nellis Dunes — Las Vegas', lat: 36.2567, lng: -115.0234, sub_type: 'BLM', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'NE Las Vegas. Sand dunes near Nellis AFB. Popular Vegas local spot.', slug: 'nellis-dunes' },

  // ===== Final OR depth =====
  { name: 'Wallowa Mountains — Enterprise', lat: 45.4234, lng: -117.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'NE Oregon. "Alps of Oregon." 10,000 ft peaks and glacial valleys. Remote and stunning.', slug: 'wallowa-mountains' },

  // ===== Final WA depth =====
  { name: 'Wenatchee NF — Mission Ridge', lat: 47.2567, lng: -120.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Central WA Cascades. Mountain riding above Wenatchee. Eastern slopes.', slug: 'mission-ridge-wa' },

  // ===== Final MT depth =====
  { name: 'Cabinet Mountains — Libby', lat: 48.0567, lng: -115.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'NW Montana. Cabinet Mountains Wilderness edge. Grizzly and mountain goat country.', slug: 'cabinet-mountains' },

  // ===== Final WY depth =====
  { name: 'Medicine Bow NF — Snowy Range', lat: 41.3234, lng: -106.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'SE Wyoming. 12,000+ ft peaks. Alpine lakes and tundra. Snowy Range Scenic Byway area.', slug: 'snowy-range-wy' },

  // ===== Final NM depth =====
  { name: 'White Sands Missile Range Edge', lat: 32.7567, lng: -106.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'S NM desert. Ride BLM lands around White Sands. Organ Mountains views. Unique gypsum dunes nearby.', slug: 'white-sands-edge' },

  // ===== Final misc additions =====
  { name: 'Chiricahua NM Edge — Arizona', lat: 31.9567, lng: -109.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SE AZ sky island. Coronado NF roads around Chiricahua. Rock formations and desert mountains.', slug: 'chiricahua-edge' },
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
console.log(`Batch 24: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
