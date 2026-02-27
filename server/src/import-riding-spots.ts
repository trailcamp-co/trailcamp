/**
 * Curated dirt bike / OHV riding areas across the US
 * Sourced from ThumperTalk, ADVRider, state OHV programs, and personal research
 */
import { getDb } from './database';

interface RidingSpot {
  name: string;
  lat: number;
  lng: number;
  state: string;
  trail_types: string[];
  difficulty: string;
  description: string;
  distance_miles?: number;
  best_season?: string;
  permit_required?: boolean;
  permit_info?: string;
  external_links?: string[];
}

const RIDING_SPOTS: RidingSpot[] = [
  // ========== ARIZONA ==========
  { name: 'Table Mesa Recreation Area', lat: 33.683, lng: -112.136, state: 'AZ', trail_types: ['Single Track', 'Fire Road', 'Desert'], difficulty: 'Moderate', description: 'Popular Phoenix-area OHV area with 100+ miles of trails. Sandy washes and rocky hills.', distance_miles: 100, best_season: 'Oct-Apr' },
  { name: 'Arizona Cycle Park', lat: 33.315, lng: -111.698, state: 'AZ', trail_types: ['Single Track', 'MX Track'], difficulty: 'Moderate', description: 'Dedicated dirt bike park near Mesa. MX tracks and trail riding.', best_season: 'Oct-Apr' },
  { name: 'Bulldog Canyon OHV Area', lat: 33.528, lng: -111.545, state: 'AZ', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', description: 'Free permit required. Scenic desert riding near Saguaro Lake.', permit_required: true, permit_info: 'Free permit from Tonto NF', best_season: 'Oct-Apr' },
  { name: 'Prescott National Forest Trails', lat: 34.540, lng: -112.469, state: 'AZ', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Vast trail network in ponderosa pine forest. #261, #396 are classics.', distance_miles: 200, best_season: 'Apr-Oct' },
  { name: 'Vulture Mine OHV', lat: 33.919, lng: -112.833, state: 'AZ', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'Near Wickenburg. Old mining roads and single track through desert hills.', best_season: 'Oct-Apr' },
  { name: 'Crown King Trail System', lat: 34.206, lng: -112.336, state: 'AZ', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', description: 'Historic mining trail to Crown King. Incredible ridge views, technical sections.', distance_miles: 60, best_season: 'Mar-Nov' },
  { name: 'Sedona OHV Trails', lat: 34.836, lng: -111.803, state: 'AZ', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: 'Broken Arrow, Schnebly Hill, Diamondback — red rock riding with stunning views.', best_season: 'Year-round' },
  { name: 'Cinder Hills OHV Area', lat: 35.367, lng: -111.440, state: 'AZ', trail_types: ['Single Track', 'Desert'], difficulty: 'Easy', description: 'Volcanic cinder riding near Flagstaff. Unique terrain, soft surface.', best_season: 'May-Oct' },

  // ========== UTAH ==========
  { name: 'Sand Hollow State Park OHV', lat: 37.105, lng: -113.389, state: 'UT', trail_types: ['Single Track', 'Desert', 'Rock Crawling'], difficulty: 'Moderate', description: 'Red sand dunes and slickrock near Hurricane. Street-legal bikes can ride to Zion views.', best_season: 'Year-round' },
  { name: 'Warner Valley / Fort Pierce', lat: 37.013, lng: -113.399, state: 'UT', trail_types: ['Single Track', 'Fire Road', 'Desert'], difficulty: 'Moderate', description: 'Huge BLM trail system. Cactus Loop, Fort Pierce Wash. Hidden gem near St. George.', distance_miles: 150, best_season: 'Year-round' },
  { name: 'Paiute ATV Trail System', lat: 38.556, lng: -112.237, state: 'UT', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: 'Largest ATV/OHV system in Utah. 2,000+ miles through mountains, forests, canyons.', distance_miles: 2000, best_season: 'May-Oct' },
  { name: 'Moab Slickrock Trail', lat: 38.579, lng: -109.538, state: 'UT', trail_types: ['Technical', 'Rock Crawling'], difficulty: 'Expert', description: 'Iconic slickrock riding. Petrified sand dunes. Not for beginners.', distance_miles: 12, best_season: 'Mar-Nov' },
  { name: 'Klondike Bluffs OHV', lat: 38.816, lng: -109.664, state: 'UT', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'Near Moab. Mix of slickrock, sand, and dirt single track.', distance_miles: 30, best_season: 'Mar-Nov' },
  { name: 'Five Mile Pass OHV Area', lat: 40.278, lng: -112.103, state: 'UT', trail_types: ['Single Track', 'Fire Road', 'MX'], difficulty: 'Easy', description: 'Popular Salt Lake area OHV park. Open desert, hills, MX tracks.', distance_miles: 50, best_season: 'Apr-Nov' },
  { name: 'Little Sahara Recreation Area', lat: 39.676, lng: -112.356, state: 'UT', trail_types: ['Desert', 'Sand Dunes'], difficulty: 'Moderate', description: '60,000 acres of sand dunes and desert. Massive riding area.', distance_miles: 100, best_season: 'Year-round' },

  // ========== CALIFORNIA ==========
  { name: 'Johnson Valley OHV Area', lat: 34.350, lng: -116.450, state: 'CA', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'Home of King of the Hammers. Juniper Flats single track, Bessemer Mine Road.', distance_miles: 200, best_season: 'Oct-Apr' },
  { name: 'Hungry Valley SVRA', lat: 34.789, lng: -118.847, state: 'CA', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: '19,000 acres, 137mi of trails. Ridge riding with Los Padres NF views. Near Gorman.', distance_miles: 137, best_season: 'Year-round', permit_required: true, permit_info: '$5 day use' },
  { name: 'Hollister Hills SVRA', lat: 36.780, lng: -121.421, state: 'CA', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Moderate', description: 'Green rolling hills, panoramic ridge trails. Best in spring when hills are green.', distance_miles: 80, best_season: 'Nov-May', permit_required: true, permit_info: '$5 day use' },
  { name: 'Carnegie SVRA', lat: 37.613, lng: -121.573, state: 'CA', trail_types: ['Single Track', 'MX Track'], difficulty: 'Moderate', description: 'Bay Area riding. Single track, MX tracks, and hill climbs.', distance_miles: 50, best_season: 'Year-round', permit_required: true, permit_info: '$5 day use' },
  { name: 'Glamis / Imperial Sand Dunes', lat: 32.979, lng: -115.138, state: 'CA', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Hard', description: 'Massive sand dune playground. Iconic off-road destination. 40 miles of dunes.', distance_miles: 40, best_season: 'Oct-Apr' },
  { name: 'Ocotillo Wells SVRA', lat: 33.141, lng: -116.131, state: 'CA', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', description: '85,000 acres of open desert. Blowsand area, Shell Reef, Gas Domes.', distance_miles: 100, best_season: 'Oct-Apr' },
  { name: 'Jawbone Canyon OHV', lat: 35.337, lng: -118.103, state: 'CA', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'Desert canyon riding near Mojave. Pacific Crest Trail crossing area.', distance_miles: 60, best_season: 'Oct-May' },
  { name: 'Stoddard Valley OHV', lat: 34.692, lng: -117.055, state: 'CA', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', description: 'High desert riding near Barstow. Open terrain, washes, hills.', distance_miles: 50, best_season: 'Oct-Apr' },
  { name: 'Rowher Flat OHV Area', lat: 34.463, lng: -118.375, state: 'CA', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Angeles National Forest. Technical single track through chaparral.', distance_miles: 40, best_season: 'Year-round' },
  { name: 'Frank Raines OHV Park', lat: 37.361, lng: -121.208, state: 'CA', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Moderate', description: 'Green hills west of Modesto. Ridge trail with panoramic valley views.', distance_miles: 45, best_season: 'Nov-May' },
  { name: 'Stonyford OHV Area', lat: 39.381, lng: -122.537, state: 'CA', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Mendocino National Forest. Mountain single track, creek crossings.', distance_miles: 80, best_season: 'Apr-Nov' },

  // ========== COLORADO ==========
  { name: 'Rampart Range Trail', lat: 39.057, lng: -104.940, state: 'CO', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: 'Classic Front Range riding. 60-mile ridge road with mountain views.', distance_miles: 60, best_season: 'May-Oct' },
  { name: 'Taylor Park / Tin Cup Pass', lat: 38.800, lng: -106.600, state: 'CO', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', description: 'Alpine riding above 10,000ft. Stunning mountain passes, wildflowers.', distance_miles: 100, best_season: 'Jul-Sep' },
  { name: 'Alpine Loop', lat: 37.926, lng: -107.595, state: 'CO', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', description: 'Engineer Pass, Cinnamon Pass. High alpine 4x4/moto loops at 12,000ft+.', distance_miles: 65, best_season: 'Jul-Sep' },
  { name: 'Rabbit Valley OHV', lat: 39.172, lng: -108.988, state: 'CO', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'Near Grand Junction. Desert single track and slickrock.', distance_miles: 30, best_season: 'Mar-Nov' },
  { name: 'Bangs Canyon OHV', lat: 38.934, lng: -108.663, state: 'CO', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: 'BLM land near Grand Junction. Ribbon Trail, Tabeguache system.', distance_miles: 40, best_season: 'Mar-Nov' },

  // ========== NEVADA ==========
  { name: 'Logandale Trails OHV', lat: 36.623, lng: -114.511, state: 'NV', trail_types: ['Single Track', 'Desert'], difficulty: 'Moderate', description: '20,000 acres near Valley of Fire. Red sandstone, washes, technical single track.', distance_miles: 80, best_season: 'Oct-Apr' },
  { name: 'Nellis Dunes OHV', lat: 36.344, lng: -115.012, state: 'NV', trail_types: ['Desert', 'Sand Dunes', 'MX'], difficulty: 'Easy', description: 'Popular Las Vegas area riding. Sand dunes, open desert, MX tracks.', distance_miles: 30, best_season: 'Oct-Apr' },
  { name: 'Jean Dry Lake OHV', lat: 35.786, lng: -115.359, state: 'NV', trail_types: ['Desert', 'MX'], difficulty: 'Easy', description: 'South of Las Vegas. Open desert, dry lake bed, MX tracks.', distance_miles: 20, best_season: 'Oct-Apr' },

  // ========== IDAHO ==========
  { name: 'Idaho City Trail System', lat: 43.830, lng: -115.830, state: 'ID', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: 'Boise National Forest. Mountain single track, ridgeline trails, creek crossings.', distance_miles: 200, best_season: 'Jun-Oct' },
  { name: 'Bruneau Sand Dunes', lat: 42.905, lng: -115.697, state: 'ID', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Moderate', description: 'Tallest single-structure sand dune in North America. OHV area nearby.', distance_miles: 15, best_season: 'Year-round' },
  { name: 'St. Anthony Sand Dunes', lat: 43.893, lng: -111.608, state: 'ID', trail_types: ['Sand Dunes'], difficulty: 'Moderate', description: '10,600 acres of white quartz sand dunes. Popular riding destination.', distance_miles: 30, best_season: 'May-Oct' },

  // ========== OREGON ==========
  { name: 'Oregon Dunes NRA', lat: 43.735, lng: -124.174, state: 'OR', trail_types: ['Sand Dunes'], difficulty: 'Moderate', description: 'Largest coastal sand dunes in North America. 40 miles of dunes along Pacific.', distance_miles: 40, best_season: 'Year-round' },
  { name: 'Cline Buttes OHV', lat: 44.247, lng: -121.318, state: 'OR', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', description: 'Central Oregon juniper forest riding. Easy to moderate trails.', distance_miles: 35, best_season: 'Apr-Nov' },
  { name: 'Shotgun OHV Complex', lat: 44.140, lng: -121.051, state: 'OR', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Deschutes National Forest. Pine forest single track.', distance_miles: 50, best_season: 'May-Oct' },

  // ========== WASHINGTON ==========
  { name: 'Reiter Foothills State Forest', lat: 47.838, lng: -121.560, state: 'WA', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Pacific NW mountain riding. Dense forest, mud, roots. Classic PNW.', distance_miles: 40, best_season: 'Jun-Oct' },
  { name: 'Tahuya State Forest', lat: 47.432, lng: -122.829, state: 'WA', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: '80+ miles of trails on Olympic Peninsula. Year-round access.', distance_miles: 80, best_season: 'Year-round' },
  { name: 'Ahtanum State Forest', lat: 46.550, lng: -120.910, state: 'WA', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Central WA forest riding. 200+ miles of trails.', distance_miles: 200, best_season: 'May-Oct' },

  // ========== NEW MEXICO ==========
  { name: 'Gordys Hill OHV Area', lat: 35.177, lng: -106.705, state: 'NM', trail_types: ['Single Track', 'Desert'], difficulty: 'Easy', description: 'Popular Albuquerque area riding. Arroyos and mesa trails.', distance_miles: 25, best_season: 'Year-round' },
  { name: 'Jemez Mountains Trail System', lat: 35.800, lng: -106.600, state: 'NM', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Hard', description: 'Mountain single track above 8,000ft. Technical, scenic, volcanic terrain.', distance_miles: 100, best_season: 'May-Oct' },

  // ========== MONTANA ==========
  { name: 'Garnet Ghost Town Trails', lat: 46.803, lng: -113.338, state: 'MT', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Mountain trail riding near historic ghost town. BLM land.', distance_miles: 40, best_season: 'Jun-Sep' },
  { name: 'Whitefish Trail System', lat: 48.393, lng: -114.353, state: 'MT', trail_types: ['Single Track'], difficulty: 'Moderate', description: 'Mountain single track with Glacier Park views. Limited moto access — check current regs.', distance_miles: 30, best_season: 'Jun-Sep' },

  // ========== WYOMING ==========
  { name: 'Killpecker Sand Dunes', lat: 42.644, lng: -109.092, state: 'WY', trail_types: ['Sand Dunes', 'Desert'], difficulty: 'Moderate', description: 'Second largest active dune field in the US. Remote, wild, free.', distance_miles: 50, best_season: 'May-Oct' },
  { name: 'South Pass OHV', lat: 42.530, lng: -108.780, state: 'WY', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', description: 'Historic gold mining area. Open BLM riding on old mining roads.', distance_miles: 60, best_season: 'May-Oct' },

  // ========== TENNESSEE / SOUTHEAST ==========
  { name: 'Windrock Park', lat: 36.127, lng: -84.352, state: 'TN', trail_types: ['Single Track', 'Ridge Riding', 'Technical'], difficulty: 'Hard', description: 'Largest private OHV park in the US. 73,000 acres, 300+ miles of trails.', distance_miles: 300, best_season: 'Year-round', permit_required: true, permit_info: 'Day passes $30-$40' },
  { name: 'Royal Blue WMA', lat: 36.405, lng: -83.854, state: 'TN', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: 'Free OHV riding in the Cumberland Mountains. 100+ miles.', distance_miles: 100, best_season: 'Year-round' },
  { name: 'Brimstone Recreation', lat: 36.343, lng: -84.690, state: 'TN', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Moderate', description: 'East TN mountain riding. Trail systems with mountain views.', distance_miles: 80, best_season: 'Year-round' },

  // ========== WEST VIRGINIA ==========
  { name: 'Hatfield-McCoy Trail System', lat: 37.800, lng: -81.800, state: 'WV', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', description: '700+ miles of trails across southern WV. Largest managed trail system east of the Mississippi.', distance_miles: 700, best_season: 'Year-round', permit_required: true, permit_info: '$26.50 annual' },

  // ========== MICHIGAN ==========
  { name: 'Silver Lake Sand Dunes', lat: 43.671, lng: -86.555, state: 'MI', trail_types: ['Sand Dunes'], difficulty: 'Moderate', description: 'Lake Michigan sand dune riding. 450 acres of open dunes.', distance_miles: 10, best_season: 'May-Oct' },

  // ========== TEXAS ==========
  { name: 'Hidden Falls Adventure Park', lat: 30.896, lng: -98.050, state: 'TX', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', description: 'Private OHV park near Austin. Rocky Texas Hill Country trails.', distance_miles: 50, best_season: 'Year-round', permit_required: true, permit_info: 'Day pass required' },
  { name: 'Barnwell Mountain Recreation Area', lat: 32.780, lng: -94.835, state: 'TX', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'East Texas riding. 20+ miles of trails through piney woods.', distance_miles: 20, best_season: 'Year-round' },

  // ========== ARKANSAS ==========
  { name: 'Byrds Adventure Center', lat: 35.697, lng: -93.537, state: 'AR', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Moderate', description: 'Ozark Mountain riding. 40+ miles of mountain single track with river views.', distance_miles: 40, best_season: 'Year-round' },

  // ========== NORTH CAROLINA ==========
  { name: 'Brown Mountain OHV Area', lat: 35.955, lng: -81.761, state: 'NC', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', description: 'Pisgah National Forest. Technical mountain single track. Roots, rocks, creek crossings.', distance_miles: 35, best_season: 'Apr-Nov' },

  // ========== KENTUCKY ==========
  { name: 'Daniel Boone National Forest OHV', lat: 37.800, lng: -83.700, state: 'KY', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', description: 'Multiple OHV areas in DBNF. S-Tree, Redbird, Stearns systems.', distance_miles: 150, best_season: 'Year-round' },
];

async function importRidingSpots() {
  const db = getDb();
  
  console.log(`Importing ${RIDING_SPOTS.length} curated riding areas...`);
  
  let imported = 0;
  let skipped = 0;

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO locations (
      name, description, latitude, longitude, category, sub_type, source, source_id,
      trail_types, difficulty, distance_miles, best_season, permit_required, permit_info,
      external_links, notes, visited, want_to_visit, scenery_rating
    ) VALUES (?, ?, ?, ?, 'riding', ?, 'agent_curated', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  `);

  for (const spot of RIDING_SPOTS) {
    try {
      insertStmt.run(
        spot.name,
        spot.description,
        spot.lat,
        spot.lng,
        spot.trail_types.join(', '),
        `ride-${spot.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        JSON.stringify(spot.trail_types),
        spot.difficulty,
        spot.distance_miles || null,
        spot.best_season || null,
        spot.permit_required ? 1 : 0,
        spot.permit_info || null,
        spot.external_links ? JSON.stringify(spot.external_links) : null,
        `State: ${spot.state}`,
        null,
      );
      imported++;
    } catch (err: any) {
      if (!err.message?.includes('UNIQUE')) {
        console.log(`  Error inserting ${spot.name}: ${err.message}`);
      }
      skipped++;
    }
  }

  console.log(`Riding Spots Import Complete: ${imported} imported, ${skipped} skipped`);
}

importRidingSpots().catch(console.error);
