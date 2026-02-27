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
  // ===== CA — more SoCal =====
  { name: 'Big Bear — Holcomb Creek', lat: 34.2567, lng: -116.8234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Big Bear area. Creek canyon trails. San Bernardino NF. Popular SoCal spot.', slug: 'holcomb-creek' },
  { name: 'Raton Saddle — Gorman', lat: 34.7234, lng: -118.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Los Padres NF. Ridge between Castaic and Gorman. Good views. Los Angeles area.', slug: 'raton-saddle' },
  { name: 'Nipton Road BLM — Searchlight NV/CA', lat: 35.4567, lng: -115.2234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'CA/NV border. Open desert riding. Near I-15. Good winter riding.', slug: 'nipton-road' },

  // ===== UT — more gems =====
  { name: 'Potash Road — Moab', lat: 38.5234, lng: -109.7567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 17, elevation_gain_ft: 100, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Colorado River canyon road. Petroglyphs and potash mine. Stunning cliff walls.', slug: 'potash-road' },
  { name: 'Onion Creek — Moab', lat: 38.6234, lng: -109.3567, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Multiple creek crossings. Technical canyon route. Fisher Towers area. Challenging.', slug: 'onion-creek' },
  { name: 'Notom-Bullfrog Road — Capitol Reef', lat: 37.9567, lng: -110.7234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 70, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: '70-mile scenic byway through Waterpocket Fold. Capitol Reef backcountry access.', slug: 'notom-bullfrog' },

  // ===== AZ — more Mogollon Rim area =====
  { name: 'Mogollon Rim Road — Payson to Flagstaff', lat: 34.5234, lng: -111.2567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 100, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '100+ mile forest road along the Rim. Ponderosa pine. 7,600 ft elevation. Classic AZ ride.', slug: 'mogollon-rim-road' },
  { name: 'General Springs Cabin — Mogollon Rim', lat: 34.3567, lng: -111.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Tonto NF. Historic cabin area on the Rim. Forest trails with views off the edge.', slug: 'general-springs' },
  { name: 'Woods Canyon Lake — Mogollon Rim', lat: 34.3234, lng: -110.9567, sub_type: 'National Forest', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Apache-Sitgreaves NF. Alpine lake on the Rim. Easy forest roads. Family-friendly.', slug: 'woods-canyon-lake' },

  // ===== NV — more remote spots =====
  { name: 'Walker Lake — Hawthorne', lat: 38.6567, lng: -118.7234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'West central NV. Desert lake riding. Open BLM land around lake.', slug: 'walker-lake-nv' },
  { name: 'Paradise Peak — Gabbs', lat: 38.8789, lng: -117.8234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Central NV. Desert peak climb. 9,000+ ft summit views. Remote.', slug: 'paradise-peak-nv' },

  // ===== CO — more alpine =====
  { name: 'Boreas Pass — Breckenridge to Como', lat: 39.4567, lng: -106.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: '11,481 ft. Old railroad grade. Easy pass with 360° views. Historic cabins.', slug: 'boreas-pass' },
  { name: 'Saints John — Montezuma', lat: 39.5567, lng: -105.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Hard', distance_miles: 8, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Ghost town above 11,000 ft near Keystone. Technical climb. Historic mining.', slug: 'saints-john' },
  { name: 'Rollins Pass East — Winter Park', lat: 39.9234, lng: -105.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Old railroad route. 11,660 ft. Continental Divide. Epic views. Winter Park area.', slug: 'rollins-pass-east' },

  // ===== OR — more coast/Cascades =====
  { name: 'Wilson River — Tillamook', lat: 45.6234, lng: -123.6567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'OR ATV permit', notes: 'Tillamook SF. Coast Range forest riding. Near the Pacific. Wet PNW trails.', slug: 'wilson-river-or' },
  { name: 'Three Sisters Wilderness Edge — Sisters', lat: 44.1567, lng: -121.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Oct', permit_required: 0, permit_info: null, notes: 'Deschutes NF. Ride edges of wilderness. Volcanic peaks. Central OR Cascades.', slug: 'three-sisters-edge' },

  // ===== WA — more Cascades =====
  { name: 'Bumping Lake — Chinook Pass', lat: 46.8567, lng: -121.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Mt. Rainier. Alpine lake and forest trails. William O. Douglas Wilderness edge.', slug: 'bumping-lake-wa' },

  // ===== ID — more backcountry =====
  { name: 'Stanley Lake — Sawtooth NRA', lat: 44.2567, lng: -115.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Stanley area. Alpine lake with Sawtooth Range backdrop. Stunning scenery.', slug: 'stanley-lake-id' },
  { name: 'Yankee Fork — Custer', lat: 44.3567, lng: -114.6234, sub_type: 'BLM', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Ghost towns and gold dredge. Salmon-Challis NF. Historic mining area. Scenic byway.', slug: 'yankee-fork' },

  // ===== NM — more =====
  { name: 'Manzano Mountains — Albuquerque', lat: 34.6567, lng: -106.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Cibola NF east of Albuquerque. Mountain riding with city views. 10,000+ ft peaks.', slug: 'manzano-mountains' },

  // ===== More midwest/east =====
  { name: 'Shawnee NF — Garden of the Gods', lat: 37.6234, lng: -88.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Southern Illinois. Sandstone formations. Forest trails. Ozark foothills.', slug: 'shawnee-garden-gods' },
  { name: 'Hoosier NF — Nebo Ridge', lat: 38.4567, lng: -86.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Indiana\'s only NF. Hardwood forest trails. South central Indiana.', slug: 'hoosier-nebo-ridge' },
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
console.log(`Batch 23: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
