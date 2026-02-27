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
  // ========== OREGON — BLM/State hidden gems ==========
  { name: 'Upper Nestucca OHV', lat: 45.1567, lng: -123.5234, sub_type: 'BLM', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'OHV permit', notes: 'Coast Range. 25 miles tight/twisty forest single track. Perfect for dirt bikes only. Hidden gem.', slug: 'upper-nestucca' },
  { name: 'Virtue Flat OHV — Baker City', lat: 44.7567, lng: -117.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Eastern OR high desert. 5,000 acres of multi-use trails near Baker City.', slug: 'virtue-flat' },
  { name: 'Millican Valley OHV', lat: 43.8789, lng: -120.8234, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central OR high desert east of Bend. Juniper and sage terrain.', slug: 'millican-valley' },
  { name: 'Cline Buttes OHV', lat: 44.2567, lng: -121.2234, sub_type: 'BLM', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Near Redmond OR. Volcanic terrain with views of Cascade peaks.', slug: 'cline-buttes' },
  { name: 'Blue Mountain Trail System — Sumpter', lat: 44.7456, lng: -118.2345, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Wallowa-Whitman NF. Mountain trails near historic mining town. ATVs can ride town streets!', slug: 'blue-mountain-sumpter' },
  { name: 'Medford BLM OHV', lat: 42.3234, lng: -122.8567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Southern Oregon BLM riding near Medford. Mixed forest and grassland.', slug: 'medford-blm' },

  // ========== WASHINGTON — hidden systems from WAATVA ==========
  { name: 'Yacolt Burn — Jones Creek', lat: 45.8789, lng: -122.3234, sub_type: 'State Forest', trail_types: ['Single Track', 'Enduro'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Premiere WA ORV trail in Western Yacolt Burn SF. Technical forest riding.', slug: 'yacolt-jones-creek' },
  { name: 'Cle Elum ORV Trails', lat: 47.1789, lng: -120.9234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'NW Forest Pass for parking', notes: 'Okanogan-Wenatchee NF. Mountain trails near Cle Elum. Cascade views.', slug: 'cle-elum-orv' },
  { name: 'Juniper Dunes OHV — Pasco', lat: 46.5234, lng: -118.8567, sub_type: 'BLM', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Unique desert dune system in eastern WA. 7,100 acres of sand.', slug: 'juniper-dunes' },
  { name: 'Beverly Dunes OHV', lat: 46.8234, lng: -119.9567, sub_type: 'BLM', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Sand dunes along the Columbia River. Easy access from I-90.', slug: 'beverly-dunes' },

  // ========== COLORADO — Stay The Trail hidden spots ==========
  { name: 'Flat Tops — White River NF', lat: 39.9567, lng: -107.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Flat Tops Wilderness edge. Primitive forest roads through alpine terrain.', slug: 'flat-tops' },
  { name: 'Gypsum Rock Crawl Trails', lat: 39.6567, lng: -106.9234, sub_type: 'BLM', trail_types: ['Rock Crawling', 'Technical'], difficulty: 'Expert', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '4 individual rock crawling trails north of Gypsum on BLM land.', slug: 'gypsum-rock-crawl' },
  { name: 'Kebler Pass', lat: 38.8567, lng: -107.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Near Crested Butte. Largest aspen grove in America. Spectacular fall colors.', slug: 'kebler-pass' },
  { name: 'Phantom Canyon Road', lat: 38.5789, lng: -105.2234, sub_type: 'BLM', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Gold Belt Scenic Byway near Cripple Creek. Narrow canyon with tunnels. Incredible.', slug: 'phantom-canyon' },
  { name: 'Shelf Road', lat: 38.5234, lng: -105.2567, sub_type: 'BLM', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Exposed shelf road above Arkansas River canyon. Heart-pumping views. Near Canon City.', slug: 'shelf-road' },
  { name: 'Old Monarch Pass', lat: 38.5012, lng: -106.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Original route over Monarch Pass before the highway. Easy mountain riding.', slug: 'old-monarch' },

  // ========== UTAH — more hidden gems ==========
  { name: 'Arch Canyon / Combs Wash', lat: 37.5567, lng: -109.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Near Blanding UT. Natural arch canyon and desert wash. Spectacular geology.', slug: 'arch-canyon' },
  { name: 'Mineral Bottom Road — Canyonlands', lat: 38.5345, lng: -109.8234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1200, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Descends into Canyonlands via switchbacks. Green River overlook. Iconic.', slug: 'mineral-bottom' },
  { name: 'Lockhart Basin', lat: 38.3012, lng: -109.6567, sub_type: 'BLM', trail_types: ['Fire Road', 'Technical', 'Desert'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: 'Remote Moab area. Descends to Colorado River through canyon country.', slug: 'lockhart-basin' },
  { name: 'Hole in the Rock Road', lat: 37.4234, lng: -111.2567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 55, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Escalante. 55 miles of desert road to Lake Powell. Slot canyons nearby.', slug: 'hole-in-rock' },
  { name: 'White Rim Trail — Canyonlands', lat: 38.4567, lng: -109.8012, sub_type: 'National Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 1, permit_info: 'NPS permit required', notes: '100-mile loop below Island in the Sky. One of America\'s most iconic desert rides.', slug: 'white-rim' },

  // ========== ARIZONA — more hidden gems ==========
  { name: 'Mingus Mountain — Prescott NF', lat: 34.7012, lng: -112.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Climb from Verde Valley to 7,815 ft. Panoramic views of Sedona red rocks.', slug: 'mingus-mountain' },
  { name: 'Bloody Basin Road', lat: 34.2567, lng: -111.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Remote road from I-17 to Verde River. Desert to forest transition.', slug: 'bloody-basin' },
  { name: 'Backway to Crown King — Prescott NF', lat: 34.1567, lng: -112.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Multiple routes to Crown King ghost town. One of AZ\'s best dual sport rides.', slug: 'backway-crown-king' },
  { name: 'Hualapai Mountains — Kingman', lat: 35.0567, lng: -113.9234, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Mountain island in the desert near Kingman. Pine forests at top, desert at base.', slug: 'hualapai-mountains' },
  { name: 'Redington Pass — Tucson', lat: 32.3234, lng: -110.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert', 'Technical'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'East of Tucson. Desert riding with Santa Catalina Mountain views. Very popular.', slug: 'redington-pass' },

  // ========== NEVADA — more hidden gems ==========
  { name: 'Emigrant Pass — Carlin', lat: 40.7234, lng: -116.1567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Remote northern Nevada. Expansive views, wild horses, zero traffic.', slug: 'emigrant-pass-nv' },
  { name: 'Tonopah Area Dual Sport', lat: 38.0678, lng: -117.2234, sub_type: 'BLM', trail_types: ['Desert', 'Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Central Nevada mining country. Ghost towns and endless desert views. Very remote.', slug: 'tonopah-ds' },
  { name: 'Austin — Toiyabe NF', lat: 39.4934, lng: -117.0678, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Loneliest highway town. Mountain riding in the Toiyabe Range. Total isolation.', slug: 'austin-toiyabe' },

  // ========== IDAHO — more hidden gems ==========
  { name: 'Payette NF — McCall Area', lat: 44.9234, lng: -115.9567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Mountain riding near McCall. Payette Lake and Frank Church Wilderness views.', slug: 'payette-mccall' },
  { name: 'Priest Lake — Kaniksu NF', lat: 48.5234, lng: -116.8567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Remote north Idaho lake country. Dense forest trails with lake views. Low crowds.', slug: 'priest-lake' },
  { name: 'Lemhi Pass — Lewis & Clark Route', lat: 44.9567, lng: -113.6234, sub_type: 'BLM', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Continental Divide crossing where Lewis & Clark first saw the Pacific watershed.', slug: 'lemhi-pass' },

  // ========== NEW MEXICO — more hidden gems ==========
  { name: 'Carson NF — Taos Area', lat: 36.5567, lng: -105.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Mountain riding near Taos. Sangre de Cristo Range views. High elevation aspens.', slug: 'carson-nf-taos' },
  { name: 'El Malpais — Grants', lat: 34.8567, lng: -107.9234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Lava flow terrain near Grants NM. Unique volcanic landscape.', slug: 'el-malpais' },
  { name: 'Cibola NF — Cedro Peak', lat: 35.0234, lng: -106.3567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Albuquerque. Manzano Mountain riding. Close to city but feels remote.', slug: 'cedro-peak' },

  // ========== MONTANA — more hidden gems ==========
  { name: 'Flathead NF — Swan Range', lat: 47.7234, lng: -113.7567, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Ridge riding with views of Glacier NP and Flathead Lake. Some of MT\'s best.', slug: 'swan-range' },
  { name: 'Deerlodge NF — Georgetown Lake', lat: 46.1567, lng: -113.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Mountain riding near Georgetown Lake. Easy forest roads through old mining district.', slug: 'deerlodge-georgetown' },

  // ========== WYOMING — more hidden gems ==========
  { name: 'Snowy Range — Medicine Bow', lat: 41.3456, lng: -106.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Alpine riding in the Snowy Range. Crystal clear lakes and alpine meadows.', slug: 'snowy-range' },
  { name: 'Red Desert — Killpecker Dunes', lat: 41.8567, lng: -109.2234, sub_type: 'BLM', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Largest living sand dune system in North America. Remote SW Wyoming.', slug: 'killpecker-dunes' },

  // ========== CALIFORNIA — more hidden gems ==========
  { name: 'Lassen NF — Bizz Johnson Trail Area', lat: 40.3234, lng: -121.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'NE California volcanic terrain. Rail trail and forest roads near Susanville.', slug: 'bizz-johnson' },
  { name: 'Modoc NF — Devil\'s Garden', lat: 41.5567, lng: -121.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Remote NE California. Volcanic lava beds and juniper forests. Zero crowds.', slug: 'devils-garden' },
  { name: 'Eldorado NF — Rock Creek OHV', lat: 38.7567, lng: -120.4234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Sierra Nevada foothills. Gold country riding with canyon views.', slug: 'rock-creek-ohv' },
  { name: 'Plumas NF — Quincy Area', lat: 39.9345, lng: -120.9567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Northern Sierra riding. Feather River Canyon area. Mountain town vibes.', slug: 'plumas-quincy' },
  { name: 'Death Valley — Titus Canyon', lat: 36.8234, lng: -117.0567, sub_type: 'National Park', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 27, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Nov-Mar', permit_required: 0, permit_info: null, notes: 'One-way road through spectacular narrow canyon. Ghost town of Leadfield enroute.', slug: 'titus-canyon' },
  { name: 'Saline Valley Road', lat: 36.7567, lng: -117.7234, sub_type: 'National Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Hard', distance_miles: 50, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Nov-Mar', permit_required: 0, permit_info: null, notes: 'Remote Death Valley backcountry. Mountain passes to desert valley. Hot springs.', slug: 'saline-valley' },

  // ========== MORE OHIO — local-knowledge hidden spots ==========
  { name: 'Zaleski State Forest OHV', lat: 39.3234, lng: -82.3567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 600, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Ohio APV tag', notes: 'Vinton County area. Less known than Monday Creek but solid riding.', slug: 'zaleski-sf' },
  { name: 'Richland Furnace State Forest', lat: 39.1567, lng: -82.5234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Ohio APV tag', notes: 'Small but fun SE Ohio forest trails. Less crowded than Wayne NF.', slug: 'richland-furnace' },
  { name: 'Woodbury Wildlife Area OHV', lat: 39.9234, lng: -81.4567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'Ohio APV tag', notes: 'East-central Ohio. Beginner-friendly wooded trails.', slug: 'woodbury-wildlife' },

  // ========== MORE MICHIGAN — UP gems ==========
  { name: 'Drummond Island ORV', lat: 46.0234, lng: -83.7567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Island in Lake Huron UP. Limestone and rock terrain. Remote and technical.', slug: 'drummond-island' },
  { name: 'Tomahawk Lake ORV Trail', lat: 46.1567, lng: -89.0234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 400, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'UP riding near Iron River. Wilderness forest with lakes and streams.', slug: 'tomahawk-lake' },

  // ========== MORE WEST VIRGINIA ==========
  { name: 'Kanawha State Forest OHV', lat: 38.3234, lng: -81.6567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Charleston WV. Quick access to mountain riding from the capital.', slug: 'kanawha-sf' },

  // ========== MORE KENTUCKY ==========
  { name: 'Carr Creek State Forest OHV', lat: 37.2789, lng: -82.8234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Eastern KY mountain riding. Less known than Daniel Boone but good trails.', slug: 'carr-creek' },

  // ========== MORE TENNESSEE ==========
  { name: 'Ocoee Area Dual Sport — Cherokee NF', lat: 35.0567, lng: -84.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Near Ocoee River. Mountain forest roads with ridge views. Near Brimstone.', slug: 'ocoee-ds' },

  // ========== MORE NORTH CAROLINA ==========
  { name: 'South Mountains State Park OHV', lat: 35.6234, lng: -81.6567, sub_type: 'State Park', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'NC foothills riding. Waterfall hikes nearby. Less known than Pisgah.', slug: 'south-mountains-nc' },

  // ========== MORE GEORGIA ==========  
  { name: 'Chattahoochee NF — Cohutta WMA', lat: 34.9567, lng: -84.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'North GA mountains. Cohutta Wilderness views. Some of the best GA riding.', slug: 'cohutta-wma' },

  // ========== MORE TEXAS ==========
  { name: 'Davis Mountains Dual Sport', lat: 30.6567, lng: -104.0234, sub_type: 'State Park', trail_types: ['Dual Sport', 'Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'West Texas mountain riding near Fort Davis. Observatory, mountains, desert. Remote.', slug: 'davis-mountains' },

  // ========== MORE SOUTH CENTRAL ==========
  { name: 'Pedernales Falls Dual Sport', lat: 30.3234, lng: -98.2567, sub_type: 'BLM', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Texas Hill Country near Pedernales Falls. Scenic ranch roads and river crossings.', slug: 'pedernales-ds' },

  // ========== MORE SOUTHEAST ==========
  { name: 'Sipsey Wilderness Edge — Bankhead NF', lat: 34.3234, lng: -87.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 600, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'NW Alabama. Forest roads near Sipsey Wilderness. Canyon views and waterfalls.', slug: 'bankhead-sipsey' },
  { name: 'Land Between The Lakes OHV — KY/TN', lat: 36.7234, lng: -88.0567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'LBL OHV permit', notes: 'Between Kentucky Lake and Lake Barkley. Unique peninsula riding with water views.', slug: 'lbl-ohv' },
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
console.log(`Batch 4: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);
db.close();
