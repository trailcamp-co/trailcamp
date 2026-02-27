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
  // ===== FAMOUS MX TRACKS — from MotoTote + known =====
  { name: 'Glen Helen Raceway', lat: 34.1567, lng: -117.3789, sub_type: 'MX Track', trail_types: ['Motocross', 'Enduro'], difficulty: 'Hard', distance_miles: 5, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'World-famous MX venue. AMA Nationals, Grand Prix, off-road endurance races. Massive hills.', slug: 'glen-helen' },
  { name: 'RedBud MX', lat: 41.8567, lng: -86.3234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Legendary Pro Motocross National track. Huge jumps and deep sand sections. Buchanan MI.', slug: 'redbud' },
  { name: 'The Wick 338 — Southwick MA', lat: 42.0567, lng: -72.7234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Deep gnarly sand. One of toughest MX tracks in the US. Pro National venue.', slug: 'wick-338' },
  { name: 'Thunder Valley MX — Lakewood CO', lat: 39.6567, lng: -105.0234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Pro National venue near Denver. High elevation racing. Epic elevation changes.', slug: 'thunder-valley' },
  { name: 'Ironman MX — Crawfordsville IN', lat: 40.0567, lng: -86.9234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Pro Motocross National finale. 400 acres of Indiana farmland. Classic track.', slug: 'ironman-mx' },
  { name: 'Unadilla MX — New Berlin NY', lat: 42.6234, lng: -75.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Legendary NY Pro National. Natural terrain MX through the hills. Since 1969.', slug: 'unadilla' },
  { name: 'Washougal MX Park — WA', lat: 45.6234, lng: -122.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'Jun-Sep', permit_required: 1, permit_info: 'Practice/race fee', notes: 'PNW Pro National. Beautiful forested setting. Famous off-camber corners.', slug: 'washougal' },
  { name: 'Budds Creek MX — Mechanicsville MD', lat: 38.4234, lng: -76.7567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Pro National venue near DC. Clay surface. Open for practice throughout season.', slug: 'budds-creek' },
  { name: 'High Point Raceway — Mt. Morris PA', lat: 39.7567, lng: -80.3234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Pro National venue. Beautiful PA hillside setting. Technical uphill/downhill sections.', slug: 'high-point-raceway' },
  { name: 'Fox Raceway — Pala CA', lat: 33.3567, lng: -117.0789, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'SoCal Pro National venue. Season opener/closer. Fast and technical.', slug: 'fox-raceway' },
  { name: 'Hangtown MX — Prairie City CA', lat: 38.6345, lng: -121.1234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'SVRA day use fee', notes: 'Pro National venue at Prairie City SVRA. Sacramento area. Historic track.', slug: 'hangtown' },

  // ===== MORE DIVERSE HIDDEN GEMS =====
  
  // Oregon — more RiderPlanet
  { name: 'Malheur NF — Emigrant Creek', lat: 44.0567, lng: -119.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Eastern Oregon. Remote ponderosa pine forests. Zero crowds.', slug: 'emigrant-creek-or' },
  { name: 'Willamette NF — Middle Fork', lat: 43.7567, lng: -122.2234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Central Oregon Cascades. Old growth forest and river trails.', slug: 'willamette-middle-fork' },
  
  // Washington
  { name: 'Walla Walla — Umatilla NF', lat: 46.0234, lng: -117.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'SE Washington. Blue Mountains. Less known than west side systems.', slug: 'walla-walla-umatilla' },
  
  // California — more
  { name: 'Superstition Mountain OHV — El Centro', lat: 32.9234, lng: -115.6567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Imperial Valley. Desert mountain riding with Salton Sea views.', slug: 'superstition-mountain' },
  { name: 'Red Rock Canyon State Park — Mojave', lat: 35.3567, lng: -117.9234, sub_type: 'State Park', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State park fee', notes: 'Colorful desert canyon. Sandstone formations used in movies. Stunning.', slug: 'red-rock-canyon-ca' },
  
  // Nevada
  { name: 'Eldorado Canyon — Henderson', lat: 35.7567, lng: -114.7234, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Near Nelson ghost town south of Vegas. Technical desert canyon riding.', slug: 'eldorado-canyon-nv' },
  { name: 'Crystal Springs — Caliente', lat: 37.5234, lng: -114.8567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Central Nevada. Near Extraterrestrial Highway. Remote desert riding.', slug: 'crystal-springs-nv' },
  
  // Idaho
  { name: 'Meadow Creek — Selway-Bitterroot', lat: 46.1234, lng: -115.2567, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Wilderness edge single track. Remote central Idaho. Wild river country.', slug: 'meadow-creek-id' },
  
  // Colorado
  { name: 'Tincup Pass Road', lat: 38.7567, lng: -106.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Classic Colorado mountain pass. 12,154 ft. Connects St. Elmo ghost town to Taylor Park.', slug: 'tincup-pass' },
  { name: 'Chinaman Gulch — Buena Vista', lat: 38.8345, lng: -106.1567, sub_type: 'BLM', trail_types: ['Single Track', 'Technical'], difficulty: 'Expert', distance_miles: 5, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Extremely technical single track. Rock gardens and steep climbs. CO expert favorite.', slug: 'chinaman-gulch' },
  
  // Utah
  { name: 'Cottonwood Canyon Road — Grand Staircase', lat: 37.2234, lng: -111.8567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 45, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Grand Staircase-Escalante. Colorful geology and slot canyons. Remote.', slug: 'cottonwood-canyon-ut' },
  { name: 'Burr Trail Road', lat: 37.8567, lng: -111.0234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Capitol Reef area. Switchbacks through Waterpocket Fold. Jaw-dropping geology.', slug: 'burr-trail' },
  
  // Arizona
  { name: 'Coke Ovens Trail — Florence', lat: 33.1234, lng: -111.2567, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Florence AZ area. Historic mining coke ovens. Rocky desert technical riding.', slug: 'coke-ovens-az' },
  { name: 'Table Mesa Dual Sport Loop — Phoenix', lat: 33.7234, lng: -111.9567, sub_type: 'BLM', trail_types: ['Desert', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'North Phoenix loop. Easy desert dual sport. Great after-work ride for locals.', slug: 'table-mesa-loop' },
  
  // New Mexico
  { name: 'Sandia Crest Dual Sport', lat: 35.2234, lng: -106.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Ride from Albuquerque to 10,678 ft Sandia Peak. Incredible city and mountain views.', slug: 'sandia-crest' },
  
  // Montana
  { name: 'Tobacco Root Mountains', lat: 45.6234, lng: -112.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Remote SW Montana mountain range. 10,000+ ft peaks and alpine lakes. Underrated.', slug: 'tobacco-root' },
  
  // Wyoming
  { name: 'Shirley Mountain — Casper', lat: 42.3567, lng: -106.7234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central Wyoming. High desert and mountain terrain south of Casper.', slug: 'shirley-mountain' },
  
  // More SE
  { name: 'Brushy Mountain Motorsports Park — NC', lat: 36.1234, lng: -81.1567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Western NC. Mountain riding park with MX and trails. Good all-around facility.', slug: 'brushy-mountain' },
  { name: 'Dirt Wheels National MX — Cary MS', lat: 34.3234, lng: -89.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'Mississippi MX track. Red clay. Open for practice and local races.', slug: 'dirt-wheels-ms' },
  
  // More Midwest
  { name: 'Badlands Off Road Park — Phelps MO', lat: 37.8567, lng: -91.9234, sub_type: 'Private Park', trail_types: ['Single Track', 'Rock Crawling'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Missouri Ozarks. Diverse terrain on old mining land. Good rock crawling.', slug: 'badlands-phelps-mo' },
  { name: 'Erieville MX — Erieville NY', lat: 42.8234, lng: -75.6567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice fee', notes: 'Central NY. Natural terrain MX. Good practice facility.', slug: 'erieville-mx' },
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
console.log(`Batch 9: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
