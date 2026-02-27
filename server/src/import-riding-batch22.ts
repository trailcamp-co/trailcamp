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
  // ===== COLORADO — deep fill =====
  { name: 'Georgia Pass — Breckenridge', lat: 39.4234, lng: -105.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 12, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: '11,598 ft. Easy pass near Breckenridge. Continental Divide. Tenmile Range views.', slug: 'georgia-pass' },
  { name: 'Webster Pass — Montezuma', lat: 39.5789, lng: -105.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '12,096 ft pass near Keystone. Ghost town of Montezuma. Steep shelf road sections.', slug: 'webster-pass' },
  { name: 'Radical Hill — Pitkin County', lat: 39.1567, lng: -106.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Aspen. High alpine trail with 360° views. Elk Mountains.', slug: 'radical-hill' },
  { name: 'Kennebec Pass — La Plata Mountains', lat: 37.4567, lng: -108.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 12, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '11,600 ft. SW Colorado. La Plata Mountains near Durango. Technical rocky sections.', slug: 'kennebec-pass' },
  { name: 'Medano Pass — Great Sand Dunes', lat: 37.7789, lng: -105.5234, sub_type: 'National Forest', trail_types: ['Sand', 'Fire Road'], difficulty: 'Hard', distance_miles: 22, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Access to Great Sand Dunes NP from the east. Deep sand creek crossings. Unique terrain.', slug: 'medano-pass' },

  // ===== CA — SoCal enduro/single track =====
  { name: 'Rowher Flats OHV — Santa Clarita', lat: 34.4567, lng: -118.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 1500, scenery_rating: 3, best_season: 'Oct-May', permit_required: 1, permit_info: 'ANF Adventure Pass', notes: 'Close to LA. Technical single track. Angeles NF. Popular SoCal enduro spot.', slug: 'rowher-flats' },
  { name: 'Drinkwater Flat — Frazier Park', lat: 34.7789, lng: -119.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Los Padres NF. Mountain meadows and pine forests above LA. Easy forest roads.', slug: 'drinkwater-flat' },

  // ===== UT — San Rafael Swell area =====
  { name: 'Wedge Overlook — San Rafael Swell', lat: 38.9567, lng: -110.3234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Little Grand Canyon overlook. 1,000-ft drop to San Rafael River. Jaw-dropping views.', slug: 'wedge-overlook' },
  { name: 'Mexican Mountain — San Rafael Swell', lat: 38.8234, lng: -110.5567, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'San Rafael Swell. Technical desert riding through slot canyons and mesas.', slug: 'mexican-mountain' },

  // ===== AZ — more depth =====
  { name: 'Broken Arrow Trail — Sedona', lat: 34.8234, lng: -111.7567, sub_type: 'National Forest', trail_types: ['Technical', 'Desert'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Red Rock Pass', notes: 'Iconic Sedona slickrock. Short but stunning. Technical red rock riding.', slug: 'broken-arrow-sedona' },
  { name: 'Soldier Trail — Sedona', lat: 34.8567, lng: -111.7234, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 6, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Red Rock Pass', notes: 'Sedona single track. Exposed red rock with panoramic views. Technical but rewarding.', slug: 'soldier-trail-sedona' },
  { name: 'Chino Valley OHV — Prescott area', lat: 34.7567, lng: -112.4234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'North of Prescott. Open BLM desert riding. Easy access.', slug: 'chino-valley' },

  // ===== NM — more =====
  { name: 'Gila NF — Pinos Altos Range', lat: 32.8567, lng: -108.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Silver City area. Gila NF mountain riding. Pinos Altos Range. 9,000+ ft peaks.', slug: 'pinos-altos' },
  { name: 'Rio Grande Del Norte — Taos Plateau', lat: 36.7567, lng: -105.7234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'High desert plateau near Taos. Rio Grande Gorge views. Open sagebrush riding.', slug: 'rio-grande-del-norte' },

  // ===== WY — more =====
  { name: 'Wind River Range — Lander Area', lat: 42.8234, lng: -108.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Shoshone NF. Wind River Range riding near Lander. Some of the best in WY.', slug: 'wind-river-lander' },
  { name: 'Cloud Peak Wilderness Edge — Bighorns', lat: 44.3567, lng: -107.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Bighorn NF. Ride the edge of Cloud Peak Wilderness. Alpine meadows and 13,000 ft peaks.', slug: 'cloud-peak-edge' },

  // ===== MT — more =====
  { name: 'Bob Marshall Wilderness Edge — Augusta', lat: 47.5234, lng: -112.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Lewis & Clark NF. Edge of "The Bob." Montana\'s most iconic wilderness. Grizzly country.', slug: 'bob-marshall-edge' },
  { name: 'Pioneer Mountains — Wise River', lat: 45.8234, lng: -113.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'SW Montana. Pioneer Mountains Scenic Byway. 10,000 ft peaks. Hot springs.', slug: 'pioneer-mountains' },

  // ===== ID — more =====
  { name: 'Salmon River Mountains — Challis', lat: 44.5234, lng: -114.2567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Salmon-Challis NF. River of No Return country. Wild and remote central Idaho.', slug: 'salmon-river-mtns' },

  // ===== More eastern =====
  { name: 'Pisgah NF — Bent Creek', lat: 35.4567, lng: -82.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Asheville NC. Mountain forest trails. Good mix of difficulty.', slug: 'pisgah-bent-creek' },
  { name: 'Cherokee NF — Tellico River', lat: 35.3234, lng: -84.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SE TN. Tellico River valley. Cherohala Skyway area. Mountain forest riding.', slug: 'cherokee-tellico' },
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
console.log(`Batch 22: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
