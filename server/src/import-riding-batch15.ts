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
  // ===== MONTANA — from RiderPlanet =====
  { name: '7R Guest Ranch — Wolf Creek MT', lat: 47.0567, lng: -112.1234, sub_type: 'Private Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 35, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'Guest ranch fee', notes: 'Central MT mountains. 1,500 private acres. 35 miles single/double track. Guided experience.', slug: '7r-ranch' },
  { name: 'Bitter Creek Trail System — Wilsall', lat: 46.0234, lng: -110.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Gallatin NF. 25 miles motorcycle single track. Mountain views and open meadows. Near Livingston.', slug: 'bitter-creek-mt' },
  { name: 'Blue Mountain Recreation Area — Missoula', lat: 46.8234, lng: -114.1567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Lolo NF near Missoula. 14.5 miles motorized for bikes. Accessible mountain riding.', slug: 'blue-mountain-mt' },
  { name: 'Camp Creek — Little Rocky Mountains', lat: 47.9567, lng: -108.8234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Remote central MT. Little Rocky Mountains. BLM trails with direct campground access.', slug: 'camp-creek-mt' },
  { name: 'Castle Mountains — White Sulphur Springs', lat: 46.3567, lng: -110.8234, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Remote 50 miles mostly single track through Castle Mountains. Central MT hidden gem.', slug: 'castle-mountains' },
  { name: 'Clancy OHV — Helena area', lat: 46.4567, lng: -112.0234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Helena. 10 miles woods trails. Open year-round. Good quick ride.', slug: 'clancy-ohv' },

  // ===== KENTUCKY — missing state =====
  { name: 'Daniel Boone NF — Redbird', lat: 37.1567, lng: -83.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SE Kentucky. Appalachian forest riding. Multiple trail systems through the NF.', slug: 'daniel-boone-nf' },
  { name: 'Turkey Bay OHV — Land Between the Lakes', lat: 36.8567, lng: -88.1234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'LBL permit', notes: '2,500 acres between Kentucky Lake and Lake Barkley. 100+ miles of trails. Popular.', slug: 'turkey-bay' },
  { name: 'Kingspoint MX — Bowling Green KY', lat: 36.9234, lng: -86.4567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'Bowling Green KY. Regional MX track. Regular practice and racing.', slug: 'kingspoint-mx' },

  // ===== VIRGINIA — missing state =====
  { name: 'Taskers Gap OHV — George Washington NF', lat: 38.7567, lng: -78.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Shenandoah Valley area. Mountain riding in GW National Forest. Appalachian terrain.', slug: 'taskers-gap' },
  { name: 'Peters Mill Run OHV — Edinburg VA', lat: 38.8234, lng: -78.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'GW NF. Shenandoah Valley. Mountain forest trails. VA mountain riding.', slug: 'peters-mill-run' },

  // ===== SOUTH CAROLINA — missing state =====
  { name: 'Brickyard Plantation MX — Walterboro SC', lat: 32.9234, lng: -80.6567, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Lowcountry SC. MX track plus woods trails. Regular racing.', slug: 'brickyard-sc' },
  { name: 'Sumter NF — Enoree District', lat: 34.4567, lng: -81.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central SC. Forest roads and trails through Piedmont. Easy riding.', slug: 'enoree-sumter' },

  // ===== NORTH CAROLINA — more =====
  { name: 'Uwharrie NF OHV — Troy NC', lat: 35.3567, lng: -79.9234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'USFS OHV permit', notes: 'Ancient mountains. 20+ miles of OHV trails. Rocky and technical. One of the best in NC.', slug: 'uwharrie-ohv' },
  { name: 'Brown Mountain OHV — Pisgah NF', lat: 35.8234, lng: -81.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 35, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Blue Ridge Mountains. 34+ miles of trails. Mountain scenery. Expert single track.', slug: 'brown-mountain-ohv' },

  // ===== ALABAMA — missing state =====
  { name: 'Stony Lonesome OHV — Bankhead NF', lat: 34.1567, lng: -87.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'USFS OHV fee', notes: 'NW Alabama. 60+ miles through Bankhead NF. Rock formations and forest trails.', slug: 'stony-lonesome' },
  { name: 'Choccolocco Mountain OHV — Heflin AL', lat: 33.6234, lng: -85.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'USFS OHV fee', notes: 'Talladega NF. 30+ miles of mountain and forest trails. NE Alabama.', slug: 'choccolocco' },

  // ===== MISSISSIPPI — missing state =====
  { name: 'Bienville NF OHV — Forest MS', lat: 32.3567, lng: -89.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central MS. Pine forest riding. Easy terrain. Good for beginners.', slug: 'bienville-nf' },

  // ===== ARKANSAS — missing state =====
  { name: 'Moccasin Gap — Ozark NF', lat: 35.5567, lng: -93.1234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Ozark Mountains. Rocky single track through hardwood forest. Technical riding.', slug: 'moccasin-gap' },
  { name: 'Wolf Pen Gap — Mena AR', lat: 34.6234, lng: -94.1567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Ouachita NF. Ridge riding with mountain views. Scenic forest trails. SW Arkansas.', slug: 'wolf-pen-gap' },

  // ===== LOUISIANA — missing state =====
  { name: 'Kisatchie NF — Longleaf Vista', lat: 31.3567, lng: -92.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Louisiana\'s only NF. Longleaf pine forest. Easy forest riding.', slug: 'kisatchie-nf' },

  // ===== SOUTH DAKOTA — missing state =====
  { name: 'Black Hills NF OHV — Sturgis', lat: 44.3567, lng: -103.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Black Hills area. Ponderosa pine forests and granite formations. Home of Sturgis rally.', slug: 'black-hills-ohv' },

  // ===== MORE HIDDEN GEMS =====
  { name: 'Maah Daah Hey Trail — Medora ND', lat: 46.9234, lng: -103.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 144, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '144-mile point-to-point trail! Badlands scenery. One of the best long-distance trails in America.', slug: 'maah-daah-hey' },
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
console.log(`Batch 15: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
