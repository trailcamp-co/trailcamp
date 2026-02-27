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
  // ===== ARIZONA — from RiderPlanet page 1 deep dive =====
  { name: 'Agua Caliente OHV — Arlington', lat: 33.3234, lng: -112.7567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Nov-Mar', permit_required: 0, permit_info: null, notes: 'Desert riding SW of Phoenix. Very hot — winter only. Open terrain.', slug: 'agua-caliente-az' },
  { name: 'Alto Pit OHV — Prescott', lat: 34.5789, lng: -112.4234, sub_type: 'National Forest', trail_types: ['Single Track', 'Beginner'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Granite pit near Prescott. Beginner to intermediate trails. Good practice spot.', slug: 'alto-pit' },
  { name: 'Antelope Valley — Heber-Overgaard', lat: 34.4234, lng: -110.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Apache-Sitgreaves NF. Forest service roads and ATV trails at elevation. Cool summer riding.', slug: 'antelope-valley-az' },
  { name: 'Black Hills Box Canyon — Wickenburg', lat: 33.9567, lng: -112.5234, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Alternative to Florence Box Canyon. Desert box canyon near Wickenburg.', slug: 'black-hills-box-canyon' },
  { name: 'Florence — Box Canyon', lat: 33.1567, lng: -111.3234, sub_type: 'BLM', trail_types: ['Desert', 'Technical', 'Rock Crawling'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Famous AZ box canyon. Narrow desert canyon with rock obstacles. Iconic ride.', slug: 'florence-box-canyon' },
  { name: 'Four Peaks Wilderness Edge', lat: 33.6789, lng: -111.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Tonto NF. Forest roads to elevation with valley views. Near Roosevelt Lake.', slug: 'four-peaks-edge' },
  { name: 'Red Mountain Motocross — Mesa', lat: 33.4234, lng: -111.6567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'Day pass', notes: 'Mesa AZ area MX park. Multiple tracks for all levels.', slug: 'red-mountain-mx' },
  { name: 'Wickenburg — Hassayampa River Area', lat: 33.9234, lng: -112.7567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert riding west of Wickenburg. Hassayampa River wash and desert hills.', slug: 'hassayampa-river' },

  // ===== WASHINGTON — from RiderPlanet page 1 =====
  { name: 'Airway MX Park — Spokane', lat: 47.5567, lng: -117.4234, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Spokane county MX park. Multiple tracks including peewee. All skill levels.', slug: 'airway-mx' },
  { name: 'Batey Bould Motorcycle Trails — Cusick', lat: 48.3234, lng: -117.3567, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Colville NF. 40 miles technical single track through meadows to mountain peaks.', slug: 'batey-bould' },
  { name: 'BBQ Flats — Yakima', lat: 46.7234, lng: -120.8567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Yakima area. Logging roads through pine/fir/spruce forest and meadows.', slug: 'bbq-flats' },
  { name: 'Bradley Hills ORV — Cathlamet', lat: 46.2234, lng: -123.4567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'SW Washington. 8 miles of ATV trails and single track. Small but fun.', slug: 'bradley-hills' },
  { name: 'Community MX — Quincy WA', lat: 47.2234, lng: -119.8567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central WA. Two tracks to choose from. Open practice schedule.', slug: 'community-mx-wa' },

  // ===== TEXAS — even more =====
  { name: 'Motocross Country Club — Dallas', lat: 33.0567, lng: -97.0234, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 5, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'DFW metro area MX. Multiple tracks for all levels.', slug: 'mx-country-club-tx' },
  { name: 'Axton MX Park — Alvin TX', lat: 29.4234, lng: -95.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 30, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Houston area MX facility. Good for practice.', slug: 'axton-mx' },
  { name: 'Mineral Wells Fossil Park OHV', lat: 32.8012, lng: -98.1234, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Mineral Wells. Easy trails with some fossil hunting terrain.', slug: 'mineral-wells-fossil' },

  // ===== MORE CALIFORNIA — from RiderPlanet =====
  { name: 'Adelanto GP Course', lat: 34.5789, lng: -117.4234, sub_type: 'BLM', trail_types: ['Desert', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'High desert near Adelanto. Grand Prix course and open desert. Victor Valley.', slug: 'adelanto-gp' },
  { name: 'Bear Valley / Holcomb Valley', lat: 34.2789, lng: -116.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'San Bernardino Mountains. Gold Rush history. Forest roads near Big Bear Lake.', slug: 'holcomb-valley' },
  { name: 'Cal City — California City OHV', lat: 34.9567, lng: -117.8234, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes', 'Motocross'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert riding near Cal City. Open desert, dunes, and tracks. Popular SoCal spot.', slug: 'cal-city' },
  { name: 'Camp Far West OHV', lat: 39.0567, lng: -121.2234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Camp Far West Reservoir. Gold country foothills trails.', slug: 'camp-far-west' },
  { name: 'Coyote Lake — Barstow', lat: 35.0789, lng: -116.7234, sub_type: 'BLM', trail_types: ['Desert'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Dry lake bed and surrounding desert near Barstow. Open riding.', slug: 'coyote-lake' },

  // ===== MORE OREGON — additional =====
  { name: 'Sumpter — Blue Mountain OHV', lat: 44.7234, lng: -118.1567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Wallowa-Whitman NF. Town streets open to ATVs. Historic dredge and gold mining.', slug: 'sumpter-ohv' },
  { name: 'Lakeview — Fremont-Winema NF', lat: 42.1567, lng: -120.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'South-central Oregon. Remote forest and desert mix. Near Goose Lake.', slug: 'lakeview-fremont' },
  { name: 'Prineville — Skull Hollow', lat: 44.2567, lng: -121.0234, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Near Smith Rock. Volcanic desert terrain with mountain views.', slug: 'skull-hollow' },

  // ===== MORE MICHIGAN — page 1 continued =====
  { name: 'Battle Creek MC Club', lat: 42.3234, lng: -85.1567, sub_type: 'MX Track', trail_types: ['Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Membership', notes: 'Founded 1928! 1.3 mi MX + .5 mi peewee + 8-mile hare scramble. Historic.', slug: 'battle-creek-mc' },

  // ===== MORE GEORGIA =====
  { name: 'Lynnville Off-Road Park', lat: 33.3234, lng: -83.6567, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central GA private park. Woods trails and open riding areas.', slug: 'lynnville-ga' },
  
  // ===== MORE SOUTH CAROLINA =====
  { name: 'Carolina Adventure World — Winnsboro', lat: 34.3567, lng: -81.0234, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro', 'Motocross'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass $25', notes: '2,500 acre SC riding park. Woods trails, MX, enduro. Major facility.', slug: 'carolina-adventure' },

  // ===== MORE VIRGINIA =====
  { name: 'Briery Branch Gap — GWNF', lat: 38.5567, lng: -79.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Shenandoah Mountain area. Remote ridge riding with amazing valley views.', slug: 'briery-branch' },

  // ===== MORE NEW MEXICO =====
  { name: 'Angel Fire — Carson NF', lat: 36.3567, lng: -105.2234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Near Angel Fire ski resort. Mountain riding at 8,000+ ft. Aspen and spruce forests.', slug: 'angel-fire-nf' },
  { name: 'Cosmic Campground — Gila Area', lat: 33.4567, lng: -108.9234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Near first International Dark Sky Sanctuary. Remote NM mountains. Incredible star gazing.', slug: 'cosmic-campground' },
  
  // ===== MORE MONTANA =====
  { name: 'Pioneer Mountains — Wise River', lat: 45.8234, lng: -113.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Beaverhead NF. Remote mountain riding. Pioneer Mountains Scenic Byway access.', slug: 'pioneer-mountains' },
  
  // ===== MORE WYOMING =====
  { name: 'Thunder Basin — Gillette Area', lat: 44.2567, lng: -105.4234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'NE Wyoming grasslands. Open prairie and buttes terrain. Coal country.', slug: 'thunder-basin' },
  
  // ===== MORE COLORADO =====
  { name: 'Redcone / Webster Pass — Montezuma', lat: 39.5234, lng: -105.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Montezuma ghost town. Technical rocky pass with incredible mountain views.', slug: 'redcone-webster' },
  { name: 'Spring Creek Pass / Slumgullion', lat: 37.9567, lng: -107.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Between Lake City and Creede. Continental Divide views. Easy forest roads.', slug: 'spring-creek-co' },
  
  // ===== MORE UTAH =====
  { name: 'Warner Valley / Navajo Sandstone', lat: 37.1567, lng: -113.6234, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near St. George. Red sandstone terrain. Warm year-round riding.', slug: 'warner-valley-ut' },
  { name: 'Temple Mountain — Goblin Valley Area', lat: 38.6789, lng: -110.7234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Near Goblin Valley SP. Unique geology. Desert riding with otherworldly formations.', slug: 'temple-mountain' },
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
console.log(`Batch 8: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total locations: ${grandTotal.cnt}`);
db.close();
