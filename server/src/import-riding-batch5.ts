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
  // ===== FLORIDA — deep dive (offroadingpro) =====
  { name: 'Apalachicola NF — Silver Lake', lat: 30.1456, lng: -84.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: '100+ miles in the Apalachicola NF. Silver Lake trailhead most popular. Sandy terrain.', slug: 'apalachicola-silver-lake' },
  { name: 'Big Cypress Swamp Trails', lat: 25.8567, lng: -81.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Enduro'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 10, scenery_rating: 4, best_season: 'Dec-Mar', permit_required: 1, permit_info: 'Permit required', notes: 'Everglades swamp riding. Wet season = underwater trails. Alligators and pythons.', slug: 'big-cypress' },
  { name: 'Goethe State Forest OHV', lat: 29.2234, lng: -82.5567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State forest fee', notes: 'Central FL. Sandy pine flatwoods riding. 53,000 acres of state forest.', slug: 'goethe-sf' },
  { name: 'Spyder MX — Tampa', lat: 28.1345, lng: -82.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 30, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Tampa Bay area MX track. Well-maintained. Popular practice facility.', slug: 'spyder-mx' },

  // ===== TEXAS — deep dive =====
  { name: 'Four C\'s Trail — Davy Crockett NF', lat: 31.3234, lng: -95.0567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'East TX piney woods. Easy forest trails. Good winter riding destination.', slug: 'four-cs' },
  { name: 'Lake Mineral Wells State Trailway', lat: 32.8234, lng: -98.0567, sub_type: 'State Park', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'DFW area. Rail trail and park roads. Easy dual sport loop.', slug: 'mineral-wells-tx' },
  { name: 'Guadalupe Mountains Backcountry', lat: 31.9234, lng: -104.8567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert', 'Dual Sport'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'West TX near Guadalupe Peak. Remote mountain and desert riding.', slug: 'guadalupe-mtn-backcountry' },

  // ===== PENNSYLVANIA — more hidden gems =====
  { name: 'Willow Creek Trail — Sproul SF', lat: 41.2345, lng: -77.7567, sub_type: 'State Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'PA OHV permit', notes: 'One-way technical trail. Not crowded due to difficulty. Central PA gem.', slug: 'willow-creek-pa' },
  { name: 'Tiadaghton State Forest OHV', lat: 41.3567, lng: -77.3234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'PA OHV permit', notes: 'PA Grand Canyon area. Mountain riding with Pine Creek Gorge views.', slug: 'tiadaghton' },
  { name: 'Michaux State Forest OHV', lat: 39.8567, lng: -77.4234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'PA OHV permit', notes: 'South-central PA. Near Gettysburg. Appalachian Trail area forest roads.', slug: 'michaux' },

  // ===== NEW ENGLAND — filling gaps =====
  { name: 'Kingdom Trails Dual Sport — VT', lat: 44.6234, lng: -71.9567, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Northeast Kingdom VT. Forest roads near famous mountain bike network.', slug: 'kingdom-trails-ds' },
  { name: 'Umbagog NF — NH/ME Border', lat: 44.8234, lng: -71.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'White Mountain NF forest roads near Lake Umbagog. Moose territory.', slug: 'umbagog' },
  { name: 'KI Jo-Mary Multiple Use Forest', lat: 45.7567, lng: -69.2234, sub_type: 'Private Park', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 50, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'Access fee at checkpoints', notes: 'Maine private timberland. Vast network of logging roads. Lake country. Very remote.', slug: 'ki-jo-mary' },

  // ===== CALIFORNIA — more NF hidden spots =====
  { name: 'Shasta-Trinity NF — Coffee Creek', lat: 41.1234, lng: -122.7567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Trinity Alps area. Mountain streams and forest trails. Low crowds. NorCal gem.', slug: 'coffee-creek' },
  { name: 'Klamath NF — Horse Range', lat: 41.5234, lng: -123.1567, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Remote NW California. Marble Mountains area. Wild and beautiful.', slug: 'klamath-horse-range' },
  { name: 'Los Padres NF — Big Sur Backcountry', lat: 36.1234, lng: -121.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Above Big Sur coast. Ridge riding with Pacific Ocean views. Spectacular.', slug: 'big-sur-backcountry' },
  { name: 'Sierra NF — Bald Mountain', lat: 37.2567, lng: -119.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central Sierra above Bass Lake. Mountain lookout with 360-degree views.', slug: 'bald-mountain-ca' },

  // ===== COLORADO — more passes and hidden spots =====
  { name: 'Mosquito Pass', lat: 39.2789, lng: -106.1789, sub_type: 'BLM', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Expert', distance_miles: 12, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Highest pass in Colorado at 13,186 ft. Between Leadville and Fairplay. Extreme altitude.', slug: 'mosquito-pass' },
  { name: 'Pearl Pass — Aspen to Crested Butte', lat: 38.9567, lng: -106.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Classic CO pass connecting Aspen to Crested Butte. Rocky at the top. 12,705 ft.', slug: 'pearl-pass' },
  { name: 'Schofield Pass', lat: 38.9789, lng: -107.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Technical'], difficulty: 'Expert', distance_miles: 10, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Crested Butte. Crystal Mill (most photographed spot in CO) accessible here.', slug: 'schofield-pass' },
  { name: 'Hagerman Pass', lat: 39.2234, lng: -106.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Leadville. Historic railroad grade to 11,925 ft. Turquoise Lake views.', slug: 'hagerman-pass' },
  { name: 'Black Bear Pass — Telluride', lat: 37.9234, lng: -107.7567, sub_type: 'BLM', trail_types: ['Fire Road', 'Technical'], difficulty: 'Expert', distance_miles: 8, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'One of CO\'s most extreme passes. Bridal Veil Falls. One-way down. Expert only.', slug: 'black-bear-pass' },
  { name: 'Stony Pass', lat: 37.8012, lng: -107.5234, sub_type: 'BLM', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Near Silverton. Continental Divide at 12,588 ft. Rio Grande headwaters.', slug: 'stony-pass' },

  // ===== UTAH — more backcountry =====
  { name: 'Shafer Trail — Canyonlands', lat: 38.4234, lng: -109.8567, sub_type: 'National Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Switchbacks carved into canyon walls. Connects to White Rim. Vertigo-inducing views.', slug: 'shafer-trail' },
  { name: 'Cathedral Valley — Capitol Reef', lat: 38.3567, lng: -111.2234, sub_type: 'National Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Remote Capitol Reef backcountry. Temple of the Sun/Moon monoliths. Stunning.', slug: 'cathedral-valley' },
  { name: 'Notom-Bullfrog Road — Capitol Reef', lat: 38.0567, lng: -110.8234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 55, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Run along the Waterpocket Fold east side. Spectacular geology. Remote.', slug: 'notom-bullfrog' },

  // ===== ARIZONA — more backcountry =====
  { name: 'Prescott NF — Senator Highway', lat: 34.5234, lng: -112.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Historic road from Prescott to Crown King. Through pine forests and mining ruins.', slug: 'senator-highway' },
  { name: 'Coconino NF — Soldier Pass/Broken Arrow', lat: 34.8234, lng: -111.7890, sub_type: 'National Forest', trail_types: ['Technical', 'Rock Crawling'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Red Rock Pass', notes: 'Sedona OHV trails. Red rock slickrock riding. Some of the most scenic in the US.', slug: 'sedona-broken-arrow' },
  { name: 'Sycamore Canyon Backcountry', lat: 34.9567, lng: -111.9234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Between Sedona and Williams. Wilderness edge riding with canyon views.', slug: 'sycamore-canyon' },

  // ===== NEVADA — more remote spots =====
  { name: 'Pony Express Trail — NV Section', lat: 39.7567, lng: -116.0234, sub_type: 'BLM', trail_types: ['Desert', 'Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Historic Pony Express route across central Nevada. Total isolation. Ghost towns.', slug: 'pony-express-nv' },
  { name: 'Soldier Meadows — Black Rock Desert Edge', lat: 41.3234, lng: -119.1567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Near Black Rock Desert/Burning Man playa. Hot springs, desert, total wilderness.', slug: 'soldier-meadows' },

  // ===== IDAHO — more hidden spots =====
  { name: 'Nez Perce-Clearwater NF — Elk City', lat: 45.8234, lng: -115.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Remote central Idaho. Gospel Hump Wilderness edge. Some of the most remote riding in lower 48.', slug: 'elk-city-id' },
  { name: 'Camas Prairie Centennial Trail', lat: 43.4567, lng: -114.8234, sub_type: 'BLM', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Between Fairfield and Ketchum. Ranch roads through camas lily prairie.', slug: 'camas-prairie' },

  // ===== MONTANA — more hidden spots =====
  { name: 'Lewis & Clark NF — Kings Hill', lat: 46.8567, lng: -110.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Little Belt Mountains. Forest roads through meadows. Easy mountain riding.', slug: 'kings-hill' },
  { name: 'Custer Gallatin NF — Beartooth', lat: 45.0567, lng: -109.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Beartooth Mountains south of Red Lodge. Alpine terrain and glacier lakes.', slug: 'beartooth-mt' },

  // ===== MORE MIDWEST hidden gems =====
  { name: 'Pine Ridge Indian Reservation Trails', lat: 43.1234, lng: -102.5567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Tribal permit may be required', notes: 'South Dakota badlands terrain. Unique landscape. Respect tribal land rules.', slug: 'pine-ridge-sd-tribal' },

  // ===== WASHINGTON — more hidden spots =====
  { name: 'Colockum Road — Wenatchee', lat: 47.3234, lng: -120.3567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Connects Ellensburg to Wenatchee. Mountain pass road. Elk herds common.', slug: 'colockum' },
  { name: 'Methow Valley Dual Sport', lat: 48.5234, lng: -120.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'North Cascades area. Mountain passes and pine forests. Incredible PNW scenery.', slug: 'methow-valley' },
  { name: 'Olympic NF — Wynoochee Valley', lat: 47.4234, lng: -123.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Olympic Peninsula. Temperate rainforest riding. Old growth and river valleys.', slug: 'wynoochee' },
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
console.log(`Batch 5: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);
db.close();
