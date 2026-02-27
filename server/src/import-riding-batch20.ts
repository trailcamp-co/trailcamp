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
  // ===== BACKCOUNTRY DISCOVERY ROUTES (BDRs) — Epic long-distance routes =====
  { name: 'Idaho BDR (IDBDR) — Jarbidge to Montana', lat: 44.5567, lng: -114.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 850, elevation_gain_ft: 50000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Epic BDR from Jarbidge NV to Montana. Magruder Corridor, Lolo Motorway, Burgdorf Hot Springs. Bucket list!', slug: 'idbdr' },
  { name: 'Colorado BDR (COBDR) — Durango to Wyoming', lat: 38.5567, lng: -106.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 680, elevation_gain_ft: 55000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Durango to Wyoming. Many 12,000+ ft passes. San Juan Mountains through entire state. Epic.', slug: 'cobdr' },
  { name: 'Utah BDR (UTBDR) — Kanab to Bear Lake', lat: 39.0567, lng: -111.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 650, elevation_gain_ft: 40000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Kanab to Bear Lake. Red rock country to alpine mountains. Diverse terrain.', slug: 'utbdr' },
  { name: 'Arizona BDR (AZBDR) — Mexico to Utah', lat: 34.0567, lng: -111.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 750, elevation_gain_ft: 35000, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Mexican border to Utah. Desert floor to alpine. Rim country, Apache Trail area. Year-round sections.', slug: 'azbdr' },
  { name: 'New Mexico BDR (NMBDR) — Mexico to Colorado', lat: 34.5567, lng: -107.0234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 700, elevation_gain_ft: 35000, scenery_rating: 5, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Mexican border to CO. Gila NF, Jemez Mountains, Ghost Ranch country. Diverse landscapes.', slug: 'nmbdr' },
  { name: 'Oregon BDR (ORBDR)', lat: 43.5567, lng: -121.0234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 620, elevation_gain_ft: 30000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'CA border to WA. Cascades and high desert. Volcanic landscapes. Beautiful PNW.', slug: 'orbdr' },
  { name: 'Washington BDR (WABDR)', lat: 47.0567, lng: -120.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Hard', distance_miles: 580, elevation_gain_ft: 35000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'OR border to Canada. Cascades and eastern WA. Alpine passes, volcanoes. Challenging.', slug: 'wabdr' },
  { name: 'Nevada BDR (NVBDR)', lat: 39.5567, lng: -117.0234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 750, elevation_gain_ft: 30000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Border to border through Great Basin. Hot springs, ghost towns, total isolation. Remote.', slug: 'nvbdr' },
  { name: 'Montana BDR (MTBDR)', lat: 46.5567, lng: -112.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 800, elevation_gain_ft: 45000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Big Sky Country end to end. Dramatic mountain terrain. Grizzly country. Wild Montana.', slug: 'mtbdr' },
  { name: 'Wyoming BDR (WYBDR)', lat: 43.5567, lng: -108.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 600, elevation_gain_ft: 35000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Through the Bighorns, Absarokas, and Wind Rivers. Vast open spaces and mountain passes.', slug: 'wybdr' },

  // ===== IDAHO — Reddit & forum hidden gems =====
  { name: 'Owyhee Backcountry Byway', lat: 42.7567, lng: -116.4234, sub_type: 'BLM', trail_types: ['Dual Sport', 'Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'SW Idaho. 100+ miles through Owyhee Canyon country. Remote desert canyons and hot springs. Epic.', slug: 'owyhee-byway' },
  { name: 'South Fork Boise River — Anderson Ranch', lat: 43.3234, lng: -115.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Boise area. Black\'s Creek Road to Anderson Ranch Reservoir. River canyon riding.', slug: 'south-fork-boise' },
  { name: 'Granite High Country — Idaho City', lat: 43.8567, lng: -115.7234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Boise NF. Alpine granite terrain near Idaho City. Technical high-elevation riding.', slug: 'granite-high-country' },
  { name: 'Magruder Corridor — Selway-Bitterroot', lat: 45.7567, lng: -114.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 100, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '100-mile corridor between 2 wilderness areas. One of the most remote roads in the lower 48. Epic.', slug: 'magruder-corridor' },
  { name: 'Burgdorf Hot Springs Area — McCall', lat: 45.1567, lng: -115.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Payette NF. Historic hot springs. Remote forest trails north of McCall. IDBDR highlight.', slug: 'burgdorf-hot-springs' },
  { name: 'Lolo Motorway — Nez Perce Trail', lat: 46.6567, lng: -115.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 100, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Lewis & Clark and Nez Perce historic route. 100 miles of remote ridge riding. N Idaho. Legendary.', slug: 'lolo-motorway' },

  // ===== MORE DIVERSE =====
  
  // More GA
  { name: 'Georgia Traverse — AT to coast route', lat: 33.5567, lng: -83.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 200, elevation_gain_ft: 5000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Mountains to coast dual sport route through Georgia. Mix of forest roads and rural highways.', slug: 'georgia-traverse' },

  // More TN
  { name: 'Chilhowee Mountain OHV — Tellico Plains', lat: 35.3567, lng: -84.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Cherokee NF. Mountain ridge riding. Views of Great Smoky Mountains. SE TN.', slug: 'chilhowee-mountain' },

  // More KY
  { name: 'Mine Made Adventure Trail — Hazard KY', lat: 37.2567, lng: -83.2234, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Trail pass', notes: 'Former coal mine land. 50+ miles. Growing trail system in eastern KY mountains.', slug: 'mine-made-ky' },
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
console.log(`Batch 20: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
