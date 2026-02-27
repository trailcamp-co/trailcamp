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
  // ========== MORE OHIO (from RiderPlanet + forums) ==========
  { name: 'Maumee State Forest OHV', lat: 41.5234, lng: -84.2567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 18, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Ohio APV tag required', notes: 'Northwest Ohio forest trails. Flat but fun wooded riding.', slug: 'maumee-state-forest' },
  { name: 'Pike State Forest OHV', lat: 39.0567, lng: -83.1234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 22, elevation_gain_ft: 700, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Ohio APV tag', notes: 'Southern Ohio rolling hills. Mix of easy and moderate terrain.', slug: 'pike-state-forest' },
  { name: 'Beans Bike Park', lat: 40.4789, lng: -81.3456, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Beginner'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: '100 acres with MX track, peewee track, and woods trails. Great for families.', slug: 'beans-bike-park' },
  { name: 'Happy Hollow Dirtpark', lat: 39.8234, lng: -82.6567, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Central Ohio private OHV park. Woods trails and open riding areas.', slug: 'happy-hollow' },
  { name: 'Black Rock Adventure Park', lat: 41.9234, lng: -80.5678, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Northeast Ohio. 200+ acres of woods trails, mud pits, and obstacle courses.', slug: 'black-rock-oh' },
  { name: 'Action Sports Moto Park', lat: 39.3678, lng: -82.1234, sub_type: 'MX Track', trail_types: ['Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 5, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Race/practice fee', notes: 'Athens OH. Natural terrain MX track with GP events and hare scrambles.', slug: 'action-sports-oh' },
  { name: 'Battlesburg Motocross Park', lat: 40.6567, lng: -81.2678, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track', 'Beginner'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Waynesburg OH. MX tracks plus 6.5-mile hare scramble loop.', slug: 'battlesburg-mx' },
  { name: 'The Wilds OHV — Zanesville', lat: 39.8456, lng: -81.7234, sub_type: 'Private Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Central Ohio riding near The Wilds conservation center. Rolling terrain.', slug: 'the-wilds-oh' },

  // ========== MORE WEST VIRGINIA ==========
  { name: 'Hatfield-McCoy — Ivy Branch', lat: 37.6234, lng: -81.8567, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Trail permit $26.50/day', notes: 'Newest Hatfield-McCoy system. Well-maintained connector trails.', slug: 'hatfield-ivy-branch' },
  { name: 'Hatfield-McCoy — Cabwaylingo', lat: 38.0234, lng: -82.2567, sub_type: 'Trail System', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Trail permit $26.50/day', notes: 'Remote HM section near state forest. Less crowded, more challenging.', slug: 'hatfield-cabwaylingo' },
  { name: 'Burning Rock Outdoor Adventure Park', lat: 37.8567, lng: -81.5234, sub_type: 'Private Park', trail_types: ['Single Track', 'Ridge Riding', 'Enduro'], difficulty: 'Moderate', distance_miles: 80, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Private WV riding park on a mountaintop. Zip lines and lodging too.', slug: 'burning-rock' },

  // ========== MORE TENNESSEE ==========
  { name: 'Coal Creek OHV', lat: 36.2567, lng: -84.2234, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Former coal mining area near Windrock. Good intermediate riding.', slug: 'coal-creek-tn' },
  { name: 'Frozen Head State Park Dual Sport', lat: 36.1234, lng: -84.4567, sub_type: 'State Park', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Mountain riding near Wartburg. Beautiful ridges and waterfalls.', slug: 'frozen-head' },
  { name: 'Cherokee NF — Tellico OHV', lat: 35.3567, lng: -84.2234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 60, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Southern Appalachian mountain riding. Incredible fall colors and mountain streams.', slug: 'tellico-ohv' },

  // ========== MORE KENTUCKY ==========
  { name: 'Muir Valley / Red River Gorge Area', lat: 37.8012, lng: -83.6789, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 1200, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Forest roads near Red River Gorge. Stunning cliff views and arches.', slug: 'red-river-gorge' },
  { name: 'Mine Made Adventure Park — Harlan', lat: 36.8456, lng: -83.3234, sub_type: 'Private Park', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Reclaimed mining land in eastern KY mountains. Rocky and technical.', slug: 'mine-made-ky' },

  // ========== MORE NORTH CAROLINA ==========
  { name: 'Tsali Recreation Area', lat: 35.3456, lng: -83.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Nantahala NF trails on Fontana Lake peninsula. World-class mountain scenery.', slug: 'tsali' },
  { name: 'DuPont State Forest', lat: 35.2123, lng: -82.6234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Brevard NC. Waterfalls, mountain trails, and forest roads.', slug: 'dupont-sf' },

  // ========== MORE GEORGIA ==========
  { name: 'Highland Park — West GA', lat: 33.8234, lng: -85.2567, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Western GA private riding park. Better single track than Durhamtown per Reddit locals.', slug: 'highland-park-ga' },
  { name: 'River Creek Campground & Trails', lat: 34.6567, lng: -83.5234, sub_type: 'Private Park', trail_types: ['Single Track', 'Beginner'], difficulty: 'Easy', distance_miles: 12, elevation_gain_ft: 400, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass/camping', notes: 'North Georgia mountain trails with camping. Family-friendly.', slug: 'river-creek-ga' },

  // ========== MORE FLORIDA ==========
  { name: 'WW Ranch MX Park', lat: 29.4567, lng: -82.1234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 5, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'Day pass', notes: 'Professional MX facility in Jacksonville. AMA sanctioned races.', slug: 'ww-ranch' },
  { name: 'Tampa MX', lat: 28.0678, lng: -82.4234, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 30, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'Tampa area MX track. Good practice facility.', slug: 'tampa-mx' },

  // ========== MORE MICHIGAN ==========
  { name: 'Pipestone ORV Trail', lat: 46.2345, lng: -89.1567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 35, elevation_gain_ft: 600, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Upper Peninsula riding. Remote northern Michigan wilderness trails.', slug: 'pipestone' },
  { name: 'Baja OHV Area — Lake County', lat: 44.0567, lng: -85.7234, sub_type: 'State Forest', trail_types: ['Sand Dunes', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Northern lower MI. Sandy terrain through jack pine forests.', slug: 'baja-ohv-mi' },

  // ========== MORE PENNSYLVANIA ==========
  { name: 'Majestic Trails — Rew PA', lat: 41.9234, lng: -78.4567, sub_type: 'Private Park', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Day pass', notes: 'Hidden gem from Reddit. Steep hill climbs and technical single track. Worth the trip.', slug: 'majestic-trails' },
  { name: 'Tall Pines ATV Park', lat: 41.4567, lng: -76.3234, sub_type: 'Private Park', trail_types: ['Single Track', 'Fire Road', 'Beginner'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Day pass', notes: 'Family-friendly PA riding with camping. Good variety of trails.', slug: 'tall-pines-pa' },

  // ========== MORE COLORADO ==========
  { name: 'Cinnamon Pass / American Basin', lat: 37.9234, lng: -107.5567, sub_type: 'BLM', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'San Juan Mountains 12,000+ ft pass. Wildflower meadows and mining ruins.', slug: 'cinnamon-pass' },
  { name: 'Georgia Pass / Boreas Pass', lat: 39.4234, lng: -105.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Summit County passes near Breckenridge. Historic railroad grade and mountain views.', slug: 'georgia-boreas-pass' },
  { name: 'Rollins Pass', lat: 39.9234, lng: -105.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Historic railroad grade to 11,671 ft. Continental Divide views. Near Winter Park.', slug: 'rollins-pass' },
  { name: 'Weston Pass', lat: 39.1234, lng: -106.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Easy mountain pass near Fairplay. Good intro to Colorado pass riding.', slug: 'weston-pass' },
  { name: 'Medano Pass — Great Sand Dunes', lat: 37.7567, lng: -105.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Ride past the Great Sand Dunes to a mountain pass. Unique scenery.', slug: 'medano-pass' },

  // ========== MORE UTAH ==========
  { name: 'Cherry Creek — West Jordan', lat: 40.5567, lng: -111.9234, sub_type: 'BLM', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Popular local riding near SLC. Quick access to good single track.', slug: 'cherry-creek-ut' },
  { name: 'Little Sahara Sand Dunes', lat: 39.6789, lng: -112.3456, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'BLM day use fee', notes: 'Utah\'s premier sand dune riding area. 60,000 acres of dunes and desert.', slug: 'little-sahara-ut' },
  { name: 'Knolls OHV Area', lat: 40.7567, lng: -113.2234, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Western Utah salt flat and dune riding near Bonneville. Open desert.', slug: 'knolls-ut' },

  // ========== MORE ARIZONA ==========
  { name: 'Crown King / Bradshaw Mountains', lat: 34.2012, lng: -112.3456, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Prescott NF backcountry roads to historic mining town. Mountain views and ponderosa forests.', slug: 'crown-king' },
  { name: 'Flagstaff — Lake Mary Road Area', lat: 35.0789, lng: -111.5567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Coconino NF trails south of Flagstaff. Ponderosa pine forests at 7,000 ft.', slug: 'flagstaff-lake-mary' },
  { name: 'Arizona Cycle Park', lat: 33.3234, lng: -112.5678, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 2, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'Day pass', notes: 'West of Phoenix. MX tracks and desert single track.', slug: 'arizona-cycle-park' },
  { name: 'Charouleau Gap — Oracle', lat: 32.6234, lng: -110.7567, sub_type: 'National Forest', trail_types: ['Technical', 'Rock Crawling', 'Desert'], difficulty: 'Expert', distance_miles: 10, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'One of AZ\'s hardest trails. Boulder crawling from desert floor to Mt. Lemmon.', slug: 'charouleau-gap' },

  // ========== MORE NEVADA ==========
  { name: 'Mercury — Southern NV', lat: 36.6567, lng: -116.0234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert riding south of NTS. Remote and rugged terrain.', slug: 'mercury-nv' },
  { name: 'Nelson Hills', lat: 35.7234, lng: -114.8567, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert hills near Eldorado Canyon south of Las Vegas. Ghost town nearby.', slug: 'nelson-hills' },
  { name: 'Good Springs / Sandy Valley', lat: 35.8345, lng: -115.4567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Open desert riding southwest of Las Vegas. Wide valleys and mining roads.', slug: 'good-springs' },
  { name: 'Knob Hill OHV', lat: 36.1234, lng: -115.2567, sub_type: 'BLM', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Close-in Las Vegas OHV area. Easy desert terrain.', slug: 'knob-hill' },
  { name: 'Dutchmans Pass — Alamo', lat: 37.3567, lng: -115.1234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Remote central Nevada desert. Near Extraterrestrial Highway.', slug: 'dutchmans-pass' },
  { name: 'Hells Half Acre — Alamo', lat: 37.2234, lng: -115.0678, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Technical desert riding near Alamo. Rocky washes and steep terrain.', slug: 'hells-half-acre' },
  { name: 'North Apex OHV', lat: 36.3567, lng: -115.0234, sub_type: 'BLM', trail_types: ['Desert', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'North Las Vegas desert riding. Close to the city, quick access.', slug: 'north-apex' },

  // ========== MORE CALIFORNIA ==========
  { name: 'Downieville — Sierra Buttes', lat: 39.5567, lng: -120.8234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding', 'Technical'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'World-famous mountain bike/dual sport trails. Epic ridgeline riding with Sierra views.', slug: 'downieville' },
  { name: 'Alabama Hills — Lone Pine', lat: 36.6234, lng: -118.1567, sub_type: 'BLM', trail_types: ['Desert', 'Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Iconic rock formations with Mt. Whitney backdrop. Movie location for countless westerns.', slug: 'alabama-hills' },
  { name: 'Cleghorn Ridge Trail', lat: 34.2567, lng: -117.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'San Bernardino NF ridgeline trail. SoCal mountain views.', slug: 'cleghorn-ridge' },
  { name: 'Corral Canyon OHV', lat: 34.3567, lng: -117.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Motocross'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Angeles NF OHV area. Multiple trails and an MX track.', slug: 'corral-canyon' },
  { name: 'Rowher Flat OHV', lat: 34.4789, lng: -118.3456, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Angeles NF trails north of LA. Good after-work riding for SoCal locals.', slug: 'rowher-flat' },
  { name: 'King City / Indians OHV', lat: 36.2234, lng: -121.0567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road', 'Enduro'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central Coast backcountry. Technical riding through oak grasslands.', slug: 'king-city-indians' },
  { name: 'Spangler Hills OHV', lat: 35.4567, lng: -117.5234, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Mojave desert riding near Ridgecrest. Rocky desert hills.', slug: 'spangler-hills' },
  { name: 'Dove Springs OHV', lat: 35.2678, lng: -118.0789, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert riding near Jawbone Canyon. Open area with washes.', slug: 'dove-springs' },

  // ========== MORE IDAHO ==========
  { name: 'Coeur d\'Alene NF — 4th of July Pass', lat: 47.4567, lng: -116.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'North Idaho mountain riding near CDA. Lake views and forests.', slug: 'cda-4th-july' },
  { name: 'Owyhee Backcountry', lat: 42.7567, lng: -116.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Remote SW Idaho desert canyons. Hot springs, canyonlands, and desert plateaus.', slug: 'owyhee' },
  { name: 'Idaho City — Mores Creek Summit', lat: 43.8567, lng: -115.7234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Technical mountain riding above Idaho City. Alpine meadows and ridge trails.', slug: 'mores-creek' },

  // ========== MORE OREGON ==========
  { name: 'Coos Bay — Winchester Bay Dunes', lat: 43.6789, lng: -124.2234, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 100, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'OHV permit', notes: 'Coastal dune riding north of Coos Bay. Pacific views from the tops.', slug: 'winchester-bay' },
  { name: 'Post Canyon — Hood River', lat: 45.6789, lng: -121.5234, sub_type: 'BLM', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Columbia Gorge area. Technical riding with Mt. Hood views.', slug: 'post-canyon' },
  { name: 'Evans Creek OHV', lat: 42.6234, lng: -123.1567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Southern Oregon riding near Rogue River. Mixed terrain.', slug: 'evans-creek' },

  // ========== MORE WASHINGTON ==========
  { name: 'Walker Valley ORV', lat: 48.4567, lng: -122.0234, sub_type: 'State Forest', trail_types: ['Single Track', 'Enduro'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Northern WA riding near Burlington. Technical forest trails.', slug: 'walker-valley' },
  { name: 'Elbe Hills ORV', lat: 46.7567, lng: -122.3234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'South Cascades riding near Mt. Rainier. Mountain views from clearcuts.', slug: 'elbe-hills' },
  { name: 'Manastash Ridge — Ellensburg', lat: 46.9567, lng: -120.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central WA ridge riding with Cascade views. Dry side = longer season.', slug: 'manastash-ridge' },

  // ========== NEW MEXICO ==========
  { name: 'Magdalena Dual Sport Loop', lat: 34.1234, lng: -107.2567, sub_type: 'BLM', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 80, elevation_gain_ft: 3000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Central NM dual sport loop. Desert mountains and old mining roads.', slug: 'magdalena' },
  { name: 'El Paso — Otero Mesa', lat: 32.4567, lng: -105.8234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Open desert riding near El Paso. Wide valleys and desert grasslands.', slug: 'otero-mesa' },

  // ========== MORE TEXAS ==========
  { name: 'Big Bend Ranch Dual Sport', lat: 29.5567, lng: -103.8234, sub_type: 'State Park', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Hard', distance_miles: 60, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State park entry', notes: 'Remote west Texas desert and mountain riding. Rio Grande canyon views.', slug: 'big-bend-ranch' },
  { name: 'Terlingua / Study Butte', lat: 29.3234, lng: -103.5567, sub_type: 'BLM', trail_types: ['Desert', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Ghost town desert riding near Big Bend. Chisos Mountain views.', slug: 'terlingua' },

  // ========== MORE MONTANA ==========
  { name: 'Whitefish Range — Flathead NF', lat: 48.4234, lng: -114.3567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Mountain riding near Whitefish with Glacier Park views. Incredible scenery.', slug: 'whitefish-range' },
  { name: 'Skalkaho Pass', lat: 46.2567, lng: -113.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Mountain pass between Hamilton and Anaconda. Sapphire Range scenery.', slug: 'skalkaho-pass' },

  // ========== MORE WYOMING ==========
  { name: 'South Pass — Atlantic City', lat: 42.3567, lng: -108.7234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert', 'Dual Sport'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Historic Oregon Trail crossing. Mining ghost towns and Wind River Range views.', slug: 'south-pass-wy' },
  { name: 'Bighorn NF — Medicine Wheel Area', lat: 44.8234, lng: -107.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Bighorn Mountain ridge riding. Dramatic cliffs and alpine meadows.', slug: 'bighorn-medicine-wheel' },

  // ========== ALASKA ==========
  { name: 'Knik Glacier Trail', lat: 61.5234, lng: -148.8567, sub_type: 'BLM', trail_types: ['Fire Road', 'Enduro'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Ride to a massive glacier outside Anchorage. Glacial rivers and mountain views.', slug: 'knik-glacier' },
  { name: 'Nelchina — Glenn Highway', lat: 62.0567, lng: -147.2234, sub_type: 'BLM', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 50, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Alaska Range riding. Remote backcountry with glacier and mountain views.', slug: 'nelchina' },

  // ========== HAWAII ==========
  { name: 'Kahuku Ranch — Big Island', lat: 19.0567, lng: -155.6234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Access permit', notes: 'Volcanic terrain riding on the Big Island. Lava fields and tropical forests.', slug: 'kahuku-ranch' },

  // ========== ADDITIONAL MIDWEST ==========
  { name: 'Badlands Off Road Park — Attica IN', lat: 40.3234, lng: -87.2567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Rock Crawling'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Western Indiana private OHV park. Diverse terrain on reclaimed mine land.', slug: 'badlands-attica' },
  { name: 'Supercross Dunes — Kimmswick MO', lat: 38.3567, lng: -90.3234, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes', 'Motocross'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'River bluff sand riding south of St. Louis.', slug: 'supercross-dunes-mo' },
  { name: 'Mounds ORV Area — Flint MI', lat: 42.8234, lng: -83.7567, sub_type: 'OHV Area', trail_types: ['Single Track', 'Motocross'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 200, scenery_rating: 2, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Urban ORV area near Flint. Closest riding to Detroit metro area.', slug: 'mounds-mi' },

  // ========== ADDITIONAL SOUTHEAST ==========
  { name: 'Bama Motorsports Park — Selma AL', lat: 32.4234, lng: -86.9567, sub_type: 'Private Park', trail_types: ['Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central Alabama riding facility with MX and trails.', slug: 'bama-motorsports' },
  { name: 'Hollydale Off-Road Park — GA', lat: 31.5567, lng: -83.2234, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro', 'Sand Dunes'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'South Georgia riding park. Sandy trails through pine forests.', slug: 'hollydale' },
  { name: 'Apalachicola NF OHV — Tallahassee', lat: 30.2345, lng: -84.5678, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Florida panhandle forest riding. Flat sandy terrain through longleaf pine.', slug: 'apalachicola' },
  { name: 'Desoto NF — Mississippi', lat: 30.5567, lng: -89.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Southern Mississippi pine forest riding. Good winter destination.', slug: 'desoto-nf-ms' },
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
console.log(`Batch 2: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);
db.close();
