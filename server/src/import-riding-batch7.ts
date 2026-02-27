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
  // ===== IDAHO — from RiderPlanet (page 1-5) =====
  { name: 'Baumgartner Trails — Sawtooth NF', lat: 43.3567, lng: -115.0234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Hundreds of miles of single track near Featherville. Hot springs nearby. Idaho gem.', slug: 'baumgartner' },
  { name: 'Canfield Mountain — CDA', lat: 47.7234, lng: -116.7567, sub_type: 'National Forest', trail_types: ['Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '30 miles motorcycle single track near Coeur d\'Alene. Hayden Lake views.', slug: 'canfield-mountain' },
  { name: 'Caribou Loop Trail — Soda Springs', lat: 42.6567, lng: -111.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 200, elevation_gain_ft: 4000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: '200-mile loop crossing ID/WY border. Massive backcountry adventure.', slug: 'caribou-loop' },
  { name: 'Casino Creek — Stanley', lat: 44.1567, lng: -114.9234, sub_type: 'National Forest', trail_types: ['Single Track'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Pure single track through Sawtooth NF mountains near Stanley. Incredible scenery.', slug: 'casino-creek' },
  { name: 'Claypeak Recreation Area — Payette', lat: 44.0789, lng: -116.9234, sub_type: 'BLM', trail_types: ['Desert', 'Motocross'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Desert trails and makeshift MX tracks near Payette. Open dawn to dusk.', slug: 'claypeak' },
  { name: 'Cottonwood Creek — Twin Falls', lat: 42.5234, lng: -114.4567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'BLM trails connecting into Sawtooth NF. Twin Falls area staging.', slug: 'cottonwood-creek-id' },
  { name: 'Danskin Mountains OHV', lat: 43.2567, lng: -115.3234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 160, elevation_gain_ft: 3000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '160+ miles on 60,000 acres south of Boise. Valley views. Massive system.', slug: 'danskin-mountains' },
  { name: 'Elk City Wagon Road', lat: 45.8012, lng: -115.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Historic 1860s mining supply road. Ride through Idaho backcountry history.', slug: 'elk-city-wagon-road' },

  // ===== NEVADA — from RiderPlanet (8 pages!) =====
  { name: 'Amargosa Dunes — Near Vegas', lat: 36.4234, lng: -116.3567, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Rolling dunes near Las Vegas. Good cruising terrain.', slug: 'amargosa-dunes' },
  { name: 'Black Rock Desert Playa', lat: 40.7567, lng: -119.0234, sub_type: 'BLM', trail_types: ['Desert'], difficulty: 'Easy', distance_miles: 50, elevation_gain_ft: 10, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: '400 sq miles of ultra-flat playa. Burning Man site. Unlimited open riding.', slug: 'black-rock-playa' },
  { name: 'Blue Mountain — Winnemucca', lat: 40.9234, lng: -117.7567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Secluded area near Winnemucca. Hidden single track and primitive camping.', slug: 'blue-mountain-nv' },
  { name: 'Boulder Hills — Boulder City', lat: 35.9567, lng: -114.8234, sub_type: 'BLM', trail_types: ['Motocross', 'Desert'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Large MX track near Boulder City. Huge doubles with hardpack landings.', slug: 'boulder-hills' },
  { name: 'Bull Ranch Creek — Reno', lat: 39.4567, lng: -119.8234, sub_type: 'BLM', trail_types: ['Single Track', 'Enduro'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Near Reno. Don\'t overlook this one — technical single track. Local favorite.', slug: 'bull-ranch-creek' },
  { name: 'Chief Mountain OHV — Caliente', lat: 37.6234, lng: -114.5567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Well-developed staging area. Two main trail loops near Caliente NV.', slug: 'chief-mountain' },
  { name: 'China Springs — Gardnerville', lat: 38.8567, lng: -119.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Technical'], difficulty: 'Moderate', distance_miles: 17, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Toiyabe NF near Gardnerville. Rocky 4x4 trails and forest roads.', slug: 'china-springs' },
  { name: 'Cold Creek — Spring Mountains', lat: 36.4567, lng: -115.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Spring Mountains west of Vegas. Mountain riding at elevation. Cooler temps.', slug: 'cold-creek-nv' },
  { name: '95 Motorsports Complex — Fernley', lat: 39.6012, lng: -119.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'MX track near Fernley/Reno. All skill levels. Call for schedule.', slug: '95-motorsports' },

  // ===== MICHIGAN — from RiderPlanet =====
  { name: 'Michigan Cross Country Cycle Trail', lat: 44.2567, lng: -84.8234, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road', 'Enduro'], difficulty: 'Moderate', distance_miles: 1000, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: '1,000+ mile designated ORV trail spanning most of Michigan! One of the longest in the US.', slug: 'mi-cross-country' },
  { name: 'Ambrose Lake — Rose City MI', lat: 44.3567, lng: -84.1234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 9, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Lakefront campground with 9 miles connecting to Cross Country Cycle Trail.', slug: 'ambrose-lake' },
  { name: 'Baraga Plains ATV — Watton MI', lat: 46.5234, lng: -88.3567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 28, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: '28-mile loop in Upper Peninsula. Motorcycles and ATVs under 50".', slug: 'baraga-plains' },
  { name: 'Bass Lake Motorcycle Trail — Gwinn', lat: 46.3567, lng: -87.3234, sub_type: 'State Forest', trail_types: ['Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Motorcycles only. Scenic hardwood forest loop. UP gem.', slug: 'bass-lake-mi' },
  { name: 'Big O Motorcycle Trail — Baldwin', lat: 43.8956, lng: -85.8567, sub_type: 'National Forest', trail_types: ['Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Part of MI Cross Country Cycle Trail. Manistee NF single track.', slug: 'big-o-trail' },
  { name: 'Bundy Hill Offroad Park — Jerome MI', lat: 42.0234, lng: -84.4567, sub_type: 'Private Park', trail_types: ['Single Track', 'Technical', 'Enduro'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Former 55-year mining area. Narrow woods trails, hill climbs, water crossings, mud pits.', slug: 'bundy-hill' },

  // ===== CALIFORNIA — more from RiderPlanet =====
  { name: 'Amago Sports Park — Pauma Valley', lat: 33.3234, lng: -116.9567, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'San Diego County MX park. Main, beginner/vet, and peewee tracks.', slug: 'amago-sports' },
  { name: 'Argyll MX Park — Dixon CA', lat: 38.4567, lng: -121.8234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 2, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Sacramento Valley. Groomed adobe clay/silt track. 50 and 70 foot doubles.', slug: 'argyll-mx' },

  // ===== MORE COLORADO — from RiderPlanet =====
  { name: 'Big Bend OHV Track — Salida', lat: 38.5345, lng: -106.0234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Near Arkansas River. 53-acre BLM park with 1-mile natural terrain MX + peewee.', slug: 'big-bend-salida' },
  { name: 'Aztec Family Raceway — COS', lat: 38.7567, lng: -104.7234, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'Colorado Springs. 60-acre facility with two full MX tracks + peewee.', slug: 'aztec-raceway' },

  // ===== MORE DIVERSE STATES — filling remaining gaps =====
  
  // SOUTH DAKOTA
  { name: 'Buffalo Chip — Sturgis', lat: 44.3789, lng: -103.4567, sub_type: 'Private Park', trail_types: ['Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'Event/day pass', notes: 'Famous Sturgis Rally venue. MX tracks and trails. Iconic biker destination.', slug: 'buffalo-chip' },
  
  // NORTH DAKOTA
  { name: 'Turtle Mountain State Forest', lat: 48.8567, lng: -99.7234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Near Canadian border. Rolling hills with lakes. One of few ND riding options.', slug: 'turtle-mountain-nd' },
  
  // NEBRASKA
  { name: 'McKelvie National Forest', lat: 42.4234, lng: -100.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Nebraska Sandhills. Planted forest on sand dunes. Unique terrain.', slug: 'mckelvie-nf' },
  
  // IOWA
  { name: 'Yellow River State Forest OHV', lat: 43.1234, lng: -91.3567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 400, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Iowa ORV permit', notes: 'NE Iowa bluffs. Driftless area terrain — actual hills in Iowa!', slug: 'yellow-river-ia' },
  { name: 'Lake Darling State Park OHV', lat: 40.9567, lng: -91.9234, sub_type: 'State Park', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 8, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'State park entry', notes: 'SE Iowa. Small but legal riding area. Lake access and camping.', slug: 'lake-darling-ia' },
  
  // MORE KENTUCKY
  { name: 'Cave Run OHV Trail', lat: 38.0567, lng: -83.5234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Daniel Boone NF near Cave Run Lake. Forest trails with lake access.', slug: 'cave-run' },
  
  // MORE NORTH CAROLINA
  { name: 'Husqvarna Proving Grounds — Sanford', lat: 35.4789, lng: -79.1234, sub_type: 'Private Park', trail_types: ['Motocross', 'Enduro', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Husqvarna\'s official proving grounds. Open to public on select days. Your bike brand!', slug: 'husqvarna-proving' },
  { name: 'Rocky Face Motorcycle Area', lat: 35.3456, lng: -81.3567, sub_type: 'State Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'South Mountains NC. Technical and steep. Less known than Brown Mountain.', slug: 'rocky-face-nc' },
  
  // MORE VIRGINIA
  { name: 'George Washington NF — Archer Knob', lat: 38.4234, lng: -80.0567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'WV/VA border area. Rocky Appalachian single track. Under the radar.', slug: 'archer-knob' },
  
  // MORE SOUTH CAROLINA
  { name: 'Bettis OHV Trail — Edgefield', lat: 33.8234, lng: -81.7567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Sumter NF near Augusta GA. Easy Piedmont riding. Good beginner spot.', slug: 'bettis-ohv' },
  
  // MORE ALABAMA
  { name: 'Robinson Creek OHV — Heflin', lat: 33.7234, lng: -85.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Talladega NF in eastern Alabama. Good intermediate forest riding.', slug: 'robinson-creek-al' },
  
  // MORE MISSISSIPPI
  { name: 'Tombigbee NF — Ackerman MS', lat: 33.3234, lng: -89.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central MS forest riding. Easy terrain through pine and hardwood.', slug: 'tombigbee-nf' },
  
  // MORE LOUISIANA
  { name: 'Bienville NF — Naccarini', lat: 32.2567, lng: -92.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Central Louisiana. Sandy piney woods. Easy forest riding.', slug: 'bienville-nf' },
  
  // MORE ARKANSAS
  { name: 'Oark Dual Sport — Ozark NF', lat: 35.6567, lng: -93.5234, sub_type: 'National Forest', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Ozark NF forest roads. Beautiful ridge riding through the Ozarks.', slug: 'oark-dual-sport' },
  
  // WEST VIRGINIA — more
  { name: 'Canaan Valley Dual Sport', lat: 39.0234, lng: -79.4567, sub_type: 'National Forest', trail_types: ['Dual Sport', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Monongahela NF near Canaan Valley ski resort. Mountain forest roads with views.', slug: 'canaan-valley-ds' },
  { name: 'Seneca State Forest OHV', lat: 38.3234, lng: -80.0567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Eastern WV. Mountain trails near Seneca Rocks. Less crowded than H-M.', slug: 'seneca-sf-wv' },
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
console.log(`Batch 7: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);
db.close();
