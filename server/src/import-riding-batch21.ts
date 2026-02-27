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
  // ===== MORE BDRs =====
  { name: 'North Carolina BDR (NCBDR)', lat: 35.5567, lng: -82.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 445, elevation_gain_ft: 30000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'TN border to SC border through Blue Ridge Mountains. Appalachian forest roads and gravel.', slug: 'ncbdr' },
  { name: 'Virginia BDR (VABDR)', lat: 37.5567, lng: -79.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 500, elevation_gain_ft: 25000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Blue Ridge to Appalachian plateau. Shenandoah Valley and mountain forest roads.', slug: 'vabdr' },
  { name: 'Mid-Atlantic BDR (MABDR)', lat: 39.5567, lng: -78.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 1050, elevation_gain_ft: 50000, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Georgia to NY through Appalachian Mountains. 1,050 miles. Epic multi-week ride.', slug: 'mabdr' },
  { name: 'Appalachian BDR (APBDR)', lat: 36.5567, lng: -83.5234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 1500, elevation_gain_ft: 70000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Full Appalachian traverse. Alabama to Vermont. Multiple weeks. The ultimate eastern US ride.', slug: 'apbdr' },

  // ===== CA — NorCal depth =====
  { name: 'Shasta-Trinity NF — Scott Mountain', lat: 41.2567, lng: -122.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Northern CA. Mt. Shasta views. Remote NorCal forest riding.', slug: 'scott-mountain' },
  { name: 'Lassen NF — Caribou Wilderness Edge', lat: 40.5567, lng: -121.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Near Lassen Volcanic NP. Volcanic landscape and alpine forest. Unique terrain.', slug: 'lassen-caribou' },
  { name: 'Modoc NF — Devil\'s Garden', lat: 41.5567, lng: -121.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'NE California. Lava beds and high desert sage. Most remote NF in CA. Zero crowds.', slug: 'modoc-devils-garden' },
  { name: 'Klamath NF — Salmon River', lat: 41.2234, lng: -123.2567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'NW CA wilderness edge. Salmon River country. Old growth forest and mountain trails.', slug: 'klamath-salmon-river' },
  { name: 'Sierra NF — Dinkey Creek', lat: 37.1567, lng: -119.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Central Sierra. Granite country with alpine lakes. Less known than Mammoth area.', slug: 'dinkey-creek' },
  { name: 'Tahoe NF — Fordyce Creek', lat: 39.3567, lng: -120.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Near Truckee. High Sierra granite and forest. Lake Fordyce and alpine scenery.', slug: 'fordyce-creek' },

  // ===== AZ — more depth =====
  { name: 'Prescott NF — Lynx Lake Trails', lat: 34.5567, lng: -112.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Prescott. Pine forest riding at 5,500 ft. Easy access and scenic.', slug: 'prescott-lynx-lake' },
  { name: 'Apache Trail — Tonto NF', lat: 33.5567, lng: -111.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Historic highway east of Phoenix. Canyon Lake, Tortilla Flat, Fish Creek Hill. Stunning desert canyon.', slug: 'apache-trail' },
  { name: 'Dragoon Mountains — Cochise Stronghold', lat: 31.9234, lng: -109.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SE AZ sky island. Historic Chiricahua Apache territory. Granite spires and desert.', slug: 'cochise-stronghold' },

  // ===== UT — more depth =====
  { name: 'Skyline Drive — Manti-La Sal NF', lat: 39.2567, lng: -111.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 100, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '100-mile ridge road! 10,000+ ft. Views east to desert and west to valleys. One of UT\'s best.', slug: 'skyline-drive-ut' },
  { name: 'Hole in the Rock Road — Escalante', lat: 37.4567, lng: -111.4234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 57, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: '57-mile road through Grand Staircase to Lake Powell. Slot canyon access. Historic Mormon route.', slug: 'hole-in-the-rock' },

  // ===== NV — more =====
  { name: 'Mizpah Hotel Area — Tonopah', lat: 38.0567, lng: -117.1234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Central NV mining district. Old mine roads and desert mountains. Stargazing capital.', slug: 'tonopah-mining' },

  // ===== OR — more =====
  { name: 'Deschutes NF — Waldo Lake Area', lat: 43.7234, lng: -122.0567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jul-Oct', permit_required: 0, permit_info: null, notes: 'Cascades. One of the clearest lakes in the world. Forest trails and mountain views.', slug: 'waldo-lake' },

  // ===== WA — more =====
  { name: 'Colockum Pass — Ellensburg', lat: 47.1567, lng: -120.4234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central WA. Mountain pass with Columbia Basin views. Mix of forest and open.', slug: 'colockum-pass' },

  // ===== ID — more =====
  { name: 'Sawtooth Valley — Stanley', lat: 44.2234, lng: -114.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Sawtooth Mountains near Stanley. Iconic Idaho peaks. World-class alpine scenery.', slug: 'sawtooth-valley' },

  // ===== MT — more =====
  { name: 'Flathead NF — Jewel Basin', lat: 48.1567, lng: -113.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Kalispell. Alpine lakes and mountain riding near Glacier NP. Stunning.', slug: 'jewel-basin' },

  // ===== MORE EASTERN =====
  { name: 'Allegheny NF — Marienville OHV', lat: 41.4567, lng: -79.1234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'USFS OHV permit', notes: 'NW Pennsylvania. Only NF in PA. Hardwood forest trails.', slug: 'allegheny-marienville' },
  { name: 'Green Mountain NF — Vermont', lat: 43.5567, lng: -72.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Central Vermont. Mountain forest roads. Fall foliage riding is world-class.', slug: 'green-mountain-nf' },
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
console.log(`Batch 21: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
