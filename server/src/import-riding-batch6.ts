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
  // ===== TEXAS — BADLY NEEDS MORE =====
  { name: 'Possum Kingdom OHV', lat: 32.8567, lng: -98.4234, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Near Possum Kingdom Lake. Hill Country terrain west of DFW.', slug: 'possum-kingdom' },
  { name: 'Lake Georgetown Good Water Loop', lat: 30.6789, lng: -97.7234, sub_type: 'BLM', trail_types: ['Single Track', 'Dual Sport'], difficulty: 'Easy', distance_miles: 26, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central TX near Georgetown. Dual sport trail around the lake.', slug: 'lake-georgetown' },
  { name: 'Red River Motorcycle Trails', lat: 33.8234, lng: -97.2567, sub_type: 'BLM', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'North TX near Gainesville. Red clay and sand. Fast enduro trails.', slug: 'red-river-mx-tx' },
  { name: 'Lake Whitney — McCown Valley', lat: 31.9567, lng: -97.3234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central TX. Lakeside riding with some rocky sections.', slug: 'lake-whitney' },
  { name: 'Franklin Mountains State Park DS', lat: 31.9012, lng: -106.4567, sub_type: 'State Park', trail_types: ['Dual Sport', 'Desert'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State park entry', notes: 'El Paso mountain island. Desert mountain riding with city views.', slug: 'franklin-mountains' },
  { name: 'Cross Bar Ranch OHV', lat: 31.3567, lng: -97.6234, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central TX private OHV park. MX track and woods trails.', slug: 'cross-bar-ranch' },
  { name: 'Sandy Creek OHV — Granbury', lat: 32.4234, lng: -97.7567, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 12, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Granbury TX. Easy riding close to DFW metro.', slug: 'sandy-creek-tx' },

  // ===== MORE WA/OR =====
  { name: 'Mount Adams Dual Sport', lat: 46.2234, lng: -121.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Gifford Pinchot NF. Forest roads around Mt. Adams. Volcanic terrain and meadows.', slug: 'mt-adams-ds' },
  { name: 'Okanogan NF — Loomis Area', lat: 48.8234, lng: -119.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Remote north-central WA. Near Canadian border. Mountain and valley riding.', slug: 'okanogan-loomis' },
  { name: 'Wenas Creek — Selah', lat: 46.6234, lng: -120.6567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Near Yakima. Dry side riding. Less mud than west side WA.', slug: 'wenas-creek' },
  { name: 'Lookout Mountain — Hood River', lat: 45.4567, lng: -121.5234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Mt. Hood NF. Ridge riding with views of Hood, Adams, St. Helens. PNW gem.', slug: 'lookout-mountain-or' },
  { name: 'Waldport — Siuslaw NF', lat: 44.4234, lng: -123.9567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Oregon coast range. Forest trails with occasional ocean glimpses.', slug: 'waldport-siuslaw' },
  { name: 'Sand Lake OHV — Pacific City OR', lat: 45.2567, lng: -123.9234, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 100, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'OHV permit', notes: 'Coastal dune riding near Pacific City. Pacific views from dune tops.', slug: 'sand-lake-or' },

  // ===== MORE MIDWEST =====
  { name: 'Ride Free — Chandlerville IL', lat: 39.9234, lng: -90.1567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central IL private park. MX tracks and trail riding on farmland.', slug: 'ride-free-il' },
  { name: 'Atkinson Motorsports Park — WI', lat: 42.9234, lng: -88.6567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 200, scenery_rating: 2, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'SE Wisconsin. 200+ acres of diverse terrain. Near Milwaukee/Chicago.', slug: 'atkinson-wi' },
  { name: 'Copper Country Trail — MI UP', lat: 47.2567, lng: -88.3234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 600, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Keweenaw Peninsula. Historic mining country trails. Lake Superior views.', slug: 'copper-country' },
  { name: 'Lincoln Hills State Forest — IN', lat: 38.1234, lng: -86.5567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'IN ORV permit', notes: 'Southern Indiana forest. Scenic ridges and hollows.', slug: 'lincoln-hills-in' },

  // ===== MORE MN/IA/MO =====
  { name: 'Jay Cooke State Park OHV — MN', lat: 46.6567, lng: -92.3789, sub_type: 'State Park', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'MN OHV registration', notes: 'Near Duluth. Rocky basalt terrain. Technical riding through boreal forest.', slug: 'jay-cooke' },
  { name: 'St. Joe State Park OHV — MO', lat: 37.8234, lng: -90.5567, sub_type: 'State Park', trail_types: ['Sand Dunes', 'Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'SE Missouri. Unique sand terrain from old lead mining. Popular MO riding.', slug: 'st-joe-sp-mo' },
  { name: 'General Burnside State Park OHV — MO', lat: 36.5234, lng: -91.8567, sub_type: 'State Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'Southern MO Ozarks. Forest trails with spring-fed creeks.', slug: 'general-burnside-mo' },

  // ===== NEW ENGLAND — filling remaining gaps =====
  { name: 'Errol — Millsfield Pond ATV — NH', lat: 44.7567, lng: -71.1234, sub_type: 'Trail System', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'NH OHV registration', notes: 'Great North Woods of NH. Part of Ride the Wilds system. Very remote.', slug: 'errol-millsfield' },
  { name: 'Aroostook County ATV — ME', lat: 46.6234, lng: -68.0567, sub_type: 'Trail System', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 80, elevation_gain_ft: 400, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'Maine ATV registration', notes: 'Northern Maine potato country trails. Flat but scenic farmland and forest.', slug: 'aroostook' },
  { name: 'Pachaug State Forest OHV — CT', lat: 41.5789, lng: -71.8234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'CT OHV registration', notes: 'Largest state forest in CT. Limited but legal OHV trails. Better than nothing!', slug: 'pachaug' },

  // ===== MORE SOUTH — filling gaps =====
  { name: 'Talladega Superspeedway OHV Park — AL', lat: 33.5678, lng: -86.0567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Near the famous speedway. Private OHV park with trails and MX.', slug: 'talladega-ohv-park' },
  { name: 'Black Warrior WMA — AL', lat: 33.6234, lng: -87.4567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'NW Alabama. Wildlife management area forest roads. Low traffic.', slug: 'black-warrior-wma' },
  { name: 'Noxubee NF — MS', lat: 33.3234, lng: -88.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'East Mississippi forest riding. Pine and hardwood forests.', slug: 'noxubee-nf' },
  { name: 'Pine Log State Forest — FL', lat: 30.4567, lng: -85.8234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State forest permit', notes: 'FL panhandle. Sand pine scrub riding. Longleaf pine flatwoods.', slug: 'pine-log-fl' },
  { name: 'Sumter NF — Long Cane OHV — SC', lat: 34.0567, lng: -82.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Western SC. Piedmont forest with some rocky technical sections.', slug: 'long-cane' },
  { name: 'Ocoee NF — Cherokee NF — TN', lat: 35.0789, lng: -84.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Ocoee River gorge area. Mountain forest roads. Incredible scenery near Brimstone.', slug: 'ocoee-cherokee' },
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
console.log(`Batch 6: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);

// Print final summary
const regions = db.prepare(`
  SELECT sub_type, COUNT(*) as cnt FROM locations WHERE category='riding' GROUP BY sub_type ORDER BY cnt DESC
`).all() as any[];
console.log('\nBy type:');
regions.forEach((r: any) => console.log(`  ${r.sub_type}: ${r.cnt}`));

db.close();
