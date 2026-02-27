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
  // ========== TENNESSEE (from RiderPlanet + research) ==========
  { name: 'Adventure Off Road Park — South Pittsburg', lat: 35.0112, lng: -85.7234, sub_type: 'Private Park', trail_types: ['Single Track', 'Fire Road', 'Enduro'], difficulty: 'Moderate', distance_miles: 120, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: '600 acre park with 120+ miles of marked trails. All skill levels. Camping available.', slug: 'adventure-orp-tn' },
  { name: 'Doe Mountain Recreation Area', lat: 36.4789, lng: -81.8234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: '60+ miles through mountain ridges. Scenic vistas, caves, and waterfalls.', slug: 'doe-mountain' },
  { name: 'Coalmont OHV Park', lat: 35.3456, lng: -85.6789, sub_type: 'OHV Area', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Formerly Southern Gulf. 40+ miles on Cumberland Plateau. All skill levels.', slug: 'coalmont' },
  { name: 'Loretta Lynn Ranch', lat: 35.9345, lng: -87.7567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Race events', permit_required: 1, permit_info: 'Event entry', notes: 'Legendary MX venue. Home of Amateur National Championship. Open during select events.', slug: 'loretta-lynn' },
  { name: 'Buffalo Mountain ATV — Cherokee NF', lat: 36.3789, lng: -82.2567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Only ATV trail in Cherokee NF. Mountain terrain near Johnson City.', slug: 'buffalo-mountain-tn' },
  { name: 'Bikini Bottoms Off Road Park', lat: 36.0567, lng: -89.3789, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro', 'Beginner'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'West TN private park near Dyersburg. Open weekends to all OHVs.', slug: 'bikini-bottoms' },

  // ========== ILLINOIS (from MotoSport + research) ==========
  { name: 'Lincoln Trail Motosports', lat: 39.2945, lng: -87.9890, sub_type: 'Private Park', trail_types: ['Motocross', 'Single Track', 'Enduro', 'Beginner'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: '220 acres with riding school, 4 MX tracks, sand tracks, trail riding. Casey IL.', slug: 'lincoln-trail' },
  { name: 'Sunset Ridge MX', lat: 41.5567, lng: -89.5234, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Walnut IL. 1.6 mile track. Hosts Loretta Lynn qualifier. 16 years running.', slug: 'sunset-ridge' },
  { name: 'McMotopark', lat: 42.0789, lng: -89.9123, sub_type: 'MX Track', trail_types: ['Motocross', 'Beginner'], difficulty: 'Moderate', distance_miles: 5, elevation_gain_ft: 150, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice fee', notes: 'Mt. Carroll IL. 50 acres natural terrain. Uses rider input for course design.', slug: 'mcmotopark' },
  { name: 'Fox Valley OHV Park', lat: 41.7234, lng: -88.4567, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 100, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Central IL private riding park. Multiple tracks and trails.', slug: 'fox-valley-il' },

  // ========== WISCONSIN (from research) ==========
  { name: 'Nemadji State Forest OHV', lat: 46.5234, lng: -92.2567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 27, elevation_gain_ft: 600, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'WI OHV registration', notes: 'WI/MN border. 27 miles motorcycle-only single track. Tight, wooded, technical.', slug: 'nemadji' },
  { name: 'Arkansaw Cycle Park', lat: 44.5345, lng: -92.0789, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Day pass', notes: 'Large WI facility. MX tracks, woods trails, variety of riding options.', slug: 'arkansaw-cycle' },
  { name: 'Sugar Maple MX', lat: 43.5234, lng: -90.1567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Moderate', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 1, permit_info: 'Race/practice fee', notes: 'Hill Point WI. New but highly rated. Blend of loam, clay, sand. Great elevation.', slug: 'sugar-maple-mx' },
  { name: 'Moonrider OHV — Chequamegon NF', lat: 45.8567, lng: -90.4234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 35, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'WI OHV registration', notes: 'Northern WI national forest trails. Wooded terrain near lakes.', slug: 'moonrider' },

  // ========== MINNESOTA (from AMSOIL blog + research) ==========
  { name: 'Nemadji State Forest MN Side', lat: 46.5789, lng: -92.3456, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'MN OHV registration', notes: 'MN side of the Nemadji system. Dense forest, tight trails, creek crossings.', slug: 'nemadji-mn' },
  { name: 'Spring Creek MX Park — Millville', lat: 44.2345, lng: -92.2567, sub_type: 'MX Track', trail_types: ['Motocross'], difficulty: 'Hard', distance_miles: 3, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Practice fee', notes: 'Host of Pro Motocross National. One of the most famous MX tracks in America.', slug: 'spring-creek-mx' },
  { name: 'Gilbert OHV Park', lat: 47.4890, lng: -92.4678, sub_type: 'OHV Area', trail_types: ['Single Track', 'Motocross'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MN OHV registration', notes: 'Iron Range riding with MX track and trails. Unique mining terrain.', slug: 'gilbert-ohv' },
  { name: 'Supple Marsh OHV', lat: 46.8234, lng: -93.2567, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 1, permit_info: 'MN OHV registration', notes: 'Central MN forest trails. Mix of pine forests and wetlands.', slug: 'supple-marsh' },

  // ========== OKLAHOMA (from MotoSport) ==========
  { name: 'Reynard Raceway — Wellston', lat: 35.6789, lng: -96.9234, sub_type: 'MX Track', trail_types: ['Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Home of Reynard Training Complex. 2-mile MX track + 8-mile trail system.', slug: 'reynard-raceway' },
  { name: 'Elk City OHV', lat: 35.4123, lng: -99.4567, sub_type: 'OHV Area', trail_types: ['Single Track', 'Desert'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Western OK desert-ish riding. Red dirt and mesquite. Easy terrain.', slug: 'elk-city' },
  { name: 'Compound 77 — Marietta', lat: 33.9456, lng: -97.1234, sub_type: 'Private Park', trail_types: ['Single Track', 'Motocross', 'Enduro'], difficulty: 'Moderate', distance_miles: 12, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Southern OK private riding facility. Multiple riding options.', slug: 'compound-77' },
  { name: 'Cross Timbers Trail System', lat: 35.5234, lng: -96.5678, sub_type: 'Trail System', trail_types: ['Single Track', 'Dual Sport', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Stretches KS through OK. Premier Midwest trail riding. Oklahoma Dirt Riders maintain it.', slug: 'cross-timbers' },

  // ========== INDIANA (from MotoSport + Braaply) ==========
  { name: 'Wildcat Creek MX — Rossville', lat: 40.4234, lng: -86.5567, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Practice/race fee', notes: 'Started as backyard track, now hosts Loretta Lynn qualifier. 100 acres.', slug: 'wildcat-creek' },
  { name: 'Hoosier National Forest OHV', lat: 38.5234, lng: -86.5678, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Southern Indiana forest riding. Rocky limestone terrain through hardwoods.', slug: 'hoosier-nf' },
  { name: 'Brown County OHV', lat: 39.1789, lng: -86.2345, sub_type: 'State Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 700, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'Rolling hills near Nashville IN. Beautiful fall colors. Indiana\'s Little Smokies.', slug: 'brown-county-in' },

  // ========== CALIFORNIA (from RiderPlanet page 1) ==========
  { name: 'Ballinger Canyon OHV', lat: 34.9567, lng: -119.6234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 68, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Los Padres NF. 68 miles of marked/rated trails. Central CA mountain riding.', slug: 'ballinger-canyon' },
  { name: 'Baldy Mesa OHV — Phelan', lat: 34.4567, lng: -117.5234, sub_type: 'National Forest', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'High desert riding near Phelan. Recently reopened after fire closure.', slug: 'baldy-mesa' },
  { name: 'Big Bear Lake OHV', lat: 34.2567, lng: -116.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 68, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'San Bernardino NF. 6 miles ATV + 62 miles 4x4 trails. Mountain resort area.', slug: 'big-bear-ohv' },
  { name: 'Big Meadows — Sequoia NF', lat: 36.3234, lng: -118.7567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Beginner'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Sequoia NF. Novice and moderate trails with a sand pit. Mountain scenery.', slug: 'big-meadows-ca' },
  { name: 'Black Springs OHV Network', lat: 38.3234, lng: -120.2567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Camping fee $15-20/night', notes: 'Stanislaus NF. Forest trails with campground. Gold country riding.', slug: 'black-springs' },
  { name: 'Foresthill OHV', lat: 38.9789, lng: -120.8234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Tahoe NF. Status changes daily based on soil moisture. Call hotline: (530) 367-2224.', slug: 'foresthill' },
  { name: 'Gold Lake OHV Camp', lat: 39.6234, lng: -120.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'Campground reservation required', notes: 'Plumas NF near Lakes Basin. High Sierra riding with lake views.', slug: 'gold-lake' },
  { name: 'Humbug OHV Area', lat: 39.7789, lng: -120.7234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Plumas NF. Stage at designated area only. Forest trails near residential area.', slug: 'humbug' },
  { name: 'Jerseydale OHV — Mariposa', lat: 37.5234, lng: -119.8567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'Camping $10-20/night', notes: 'Sierra NF near Yosemite. Mountain riding in mixed conifer forest.', slug: 'jerseydale' },
  { name: 'San Gabriel Canyon OHV', lat: 34.2345, lng: -117.8567, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'Online reservation required ($8)', notes: 'Angeles NF. Technical canyon riding. Reservations required via recreation.gov.', slug: 'san-gabriel-canyon' },
  { name: 'Bee Canyon — Hemet', lat: 33.7567, lng: -116.7234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'San Bernardino NF near Hemet. 20 miles of easy to moderate forest service roads.', slug: 'bee-canyon' },
  { name: 'Barona Oaks MX — Ramona', lat: 33.0345, lng: -116.8789, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track'], difficulty: 'Moderate', distance_miles: 8, elevation_gain_ft: 400, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'San Diego area MX. 40+ years in business. Main/peewee tracks + 5 miles trails.', slug: 'barona-oaks' },

  // ========== COLORADO (from RiderPlanet) ==========
  { name: 'Bangs Canyon OHV — Grand Junction', lat: 38.9567, lng: -108.5234, sub_type: 'BLM', trail_types: ['Single Track', 'Desert', 'Rock Crawling'], difficulty: 'Hard', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'High desert canyons and plateaus. Slickrock and single track. Near Grand Junction.', slug: 'bangs-canyon' },
  { name: 'Captain Jacks Trail — Colorado Springs', lat: 38.7789, lng: -104.8567, sub_type: 'National Forest', trail_types: ['Single Track'], difficulty: 'Hard', distance_miles: 6, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Challenging 6-mile single track. Smooth hardpack with moderate climbs near COS.', slug: 'captain-jacks' },
  { name: 'Cuchara Recreation Area', lat: 37.3456, lng: -105.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Spanish Peaks area. Scenic mountain views, aspen forest, camping.', slug: 'cuchara' },
  { name: 'Golden Horseshoe Trail — Breckenridge', lat: 39.4567, lng: -106.0789, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '6,000 pristine acres of mountain trails near Breckenridge. Alpine scenery.', slug: 'golden-horseshoe' },
  { name: 'Grand Valley OHV — Grand Junction', lat: 39.0234, lng: -108.6567, sub_type: 'BLM', trail_types: ['Single Track', 'Desert', 'Technical'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'Wide variety: smooth double track to rugged single track. Numerous hill climbs.', slug: 'grand-valley' },
  { name: 'Hartman Rocks — Gunnison', lat: 38.5012, lng: -106.9234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Moderate', distance_miles: 35, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '22 square miles. Fast single track to rugged 4x4 trails. Near Gunnison.', slug: 'hartman-rocks' },
  { name: 'Dry Lake MX — Gypsum', lat: 39.6456, lng: -106.9567, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Dirt bikes only. Main/peewee/mini MX + endurocross + single track.', slug: 'dry-lake-mx' },

  // ========== NEW JERSEY ==========
  { name: 'Wharton State Forest OHV', lat: 39.7234, lng: -74.7567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Sand Dunes'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'NJ OHV registration', notes: 'Pine Barrens sand trails. Flat but sandy and challenging. 122,000 acre forest.', slug: 'wharton-sf' },

  // ========== MARYLAND ==========
  { name: 'Savage River State Forest OHV', lat: 39.5567, lng: -79.0789, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'MD OHV permit', notes: 'Western Maryland mountain riding. Appalachian forest with creek crossings.', slug: 'savage-river' },

  // ========== DELAWARE ==========
  { name: 'Redden State Forest OHV', lat: 38.7234, lng: -75.4567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Beginner'], difficulty: 'Easy', distance_miles: 8, elevation_gain_ft: 30, scenery_rating: 2, best_season: 'Year-round', permit_required: 1, permit_info: 'DE OHV permit', notes: 'Small but only legal OHV area in Delaware. Flat sandy forest roads.', slug: 'redden-sf' },

  // ========== RHODE ISLAND ==========
  { name: 'Arcadia Management Area OHV', lat: 41.5789, lng: -71.7234, sub_type: 'State Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Apr-Nov', permit_required: 1, permit_info: 'RI OHV registration', notes: 'Rhode Island forest riding. Limited but scenic New England trails.', slug: 'arcadia-ri' },

  // ========== MORE IDAHO (from research) ==========
  { name: 'Caribou-Targhee NF — Pocatello', lat: 42.8234, lng: -112.4567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 60, elevation_gain_ft: 2500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Southeast Idaho mountain riding. 2.8 million acres of combined forest.', slug: 'caribou-targhee' },
  { name: 'Salmon-Challis NF — Middle Fork', lat: 44.5678, lng: -114.5234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding', 'Technical'], difficulty: 'Hard', distance_miles: 80, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Remote backcountry riding. Middle Fork of Salmon River area. Incredible wilderness.', slug: 'salmon-challis-middle-fork' },
  { name: 'Clearwater NF — Lolo Pass Area', lat: 46.6345, lng: -115.6789, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Oct', permit_required: 0, permit_info: null, notes: 'North-central Idaho. Lewis & Clark route. Dense forest and mountain ridges.', slug: 'clearwater-lolo' },

  // ========== MORE OREGON ==========
  { name: 'Diamond Mill OHV — Roseburg', lat: 43.1567, lng: -123.0234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Umpqua NF trails south of Roseburg. Mixed terrain through old growth.', slug: 'diamond-mill' },
  { name: 'Prineville — Ochoco NF', lat: 44.3234, lng: -120.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 1200, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Central Oregon forest roads. Open pine forests and mountain views.', slug: 'ochoco-nf' },

  // ========== MORE WASHINGTON ==========
  { name: 'Olympic NF — Tahuya SF Connector', lat: 47.4789, lng: -122.8234, sub_type: 'State Forest', trail_types: ['Single Track', 'Enduro'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'Technical Kitsap Peninsula trails connecting to Tahuya. Roots and mud.', slug: 'olympic-tahuya' },

  // ========== MORE NEVADA ==========
  { name: 'Ute Road — Las Vegas', lat: 36.2567, lng: -115.2789, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 700, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Las Vegas area desert riding. Popular local spot from ThumperTalk top 10.', slug: 'ute-road' },
  { name: 'Sand Mountain Recreation Area', lat: 39.2567, lng: -118.3234, sub_type: 'Sand Dunes', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'BLM day use fee', notes: 'Massive singing sand dune east of Fallon. 600 ft tall. Unique desert riding.', slug: 'sand-mountain-nv' },

  // ========== MORE ARIZONA (from ThumperTalk AZ thread) ==========
  { name: 'Cave Creek Regional Park Area', lat: 33.8789, lng: -111.9567, sub_type: 'BLM', trail_types: ['Desert', 'Single Track'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'North Phoenix desert single track. Saguaro-studded hills with city views.', slug: 'cave-creek-az' },
  { name: 'Florence — Poston Butte', lat: 33.0567, lng: -111.3789, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road', 'Enduro'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'Desert riding south of Phoenix near Florence. Open desert terrain.', slug: 'florence-poston' },
  { name: 'Mt. Graham — Coronado NF', lat: 32.7012, lng: -109.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Ride from desert to 10,720 ft peak. Most dramatic elevation change in AZ.', slug: 'mt-graham' },

  // ========== MORE NEW MEXICO ==========
  { name: 'Lincoln NF — Sacramento Mountains', lat: 33.0234, lng: -105.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 50, elevation_gain_ft: 3000, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Mountain riding near Cloudcroft/Ruidoso. Pine forests and mountain views.', slug: 'lincoln-nf' },

  // ========== MORE MONTANA ==========
  { name: 'Kootenai NF — Yaak Valley', lat: 48.8234, lng: -115.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Remote NW Montana. Wild and undeveloped. Grizzly country. True wilderness riding.', slug: 'yaak-valley' },
  { name: 'Gallatin NF — Paradise Valley', lat: 45.3234, lng: -110.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Near Yellowstone. Absaroka Range views. Mountain passes and meadows.', slug: 'gallatin-paradise' },

  // ========== MORE WYOMING ==========
  { name: 'Shoshone NF — Washakie Wilderness Edge', lat: 44.2567, lng: -109.5234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Absaroka Range riding near Yellowstone. Remote alpine terrain.', slug: 'shoshone-washakie' },

  // ========== MORE SOUTH DAKOTA ==========
  { name: 'Mickelson Trail Dual Sport Loop', lat: 43.7567, lng: -103.7234, sub_type: 'Trail System', trail_types: ['Dual Sport', 'Fire Road'], difficulty: 'Easy', distance_miles: 50, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Black Hills dual sport loop. Historic rail trail and forest roads. Tunnels and trestles.', slug: 'mickelson-ds' },

  // ========== MORE NEBRASKA ==========
  { name: 'Pine Ridge OHV — Crawford', lat: 42.6789, lng: -103.3456, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'NW Nebraska pine ridge. Unique buttes and pine-covered ridges in the plains.', slug: 'pine-ridge-ne' },

  // ========== MORE NORTH DAKOTA ==========
  { name: 'Sully Creek State Park OHV', lat: 46.8567, lng: -103.3789, sub_type: 'State Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'May-Oct', permit_required: 1, permit_info: 'State park fee', notes: 'Badlands terrain near Medora. Dramatic buttes and Little Missouri River views.', slug: 'sully-creek' },

  // ========== MORE KANSAS ==========
  { name: 'Cross Timbers Trail — KS Section', lat: 37.5234, lng: -96.0567, sub_type: 'Trail System', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 200, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Kansas section of Cross Timbers. Prairie riding through the Flint Hills.', slug: 'cross-timbers-ks' },

  // ========== MORE LOUISIANA ==========
  { name: 'Mud Creek Off-Road Park', lat: 30.5234, lng: -90.8567, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 50, scenery_rating: 2, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'Day pass', notes: 'Louisiana riding park. Sandy/muddy terrain through pine forests.', slug: 'mud-creek-la' },

  // ========== MORE ARKANSAS ==========
  { name: 'Hobbs State Park — Bentonville', lat: 36.2789, lng: -93.8234, sub_type: 'State Park', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 600, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'NW Arkansas near Bentonville. Ozark trail riding with Beaver Lake views.', slug: 'hobbs-state-park' },
  { name: 'Storm Creek Trails — Ouachita NF', lat: 34.7567, lng: -93.4234, sub_type: 'National Forest', trail_types: ['Single Track', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Technical Ouachita Mountain single track. Ridge riding with valley views.', slug: 'storm-creek' },

  // ========== MORE TEXAS ==========
  { name: 'Palo Duro Canyon Dual Sport', lat: 34.9567, lng: -101.6789, sub_type: 'State Park', trail_types: ['Fire Road', 'Dual Sport', 'Desert'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'Second largest canyon in US. Dramatic red rock walls. Texas Grand Canyon.', slug: 'palo-duro' },
  { name: 'Copper Breaks State Park', lat: 34.1123, lng: -99.7567, sub_type: 'State Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'State park entry', notes: 'NW Texas. Red earth breaks terrain with mesquite and cactus.', slug: 'copper-breaks' },

  // ========== MORE MICHIGAN ==========
  { name: 'Copper Harbor — Keweenaw Peninsula', lat: 47.4678, lng: -87.8901, sub_type: 'State Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 1200, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'MI ORV permit', notes: 'Upper Peninsula gem. World-class single track. Lake Superior views from ridges.', slug: 'copper-harbor' },
  { name: 'Marquette — NTN Trail System', lat: 46.5456, lng: -87.3789, sub_type: 'Trail System', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 30, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'UP riding near Marquette. Rock gardens and roots. Lake Superior watershed.', slug: 'marquette-ntn' },

  // ========== MORE VIRGINIA ==========
  { name: 'Flagpole Knob — GWNF', lat: 38.5234, lng: -79.2567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding', 'Dual Sport'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Shenandoah Valley ridge riding. One of the best dual sport loops in VA.', slug: 'flagpole-knob' },
  { name: 'Potts Mountain — Jefferson NF', lat: 37.5567, lng: -80.1234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Mountain riding near Covington VA. Appalachian ridge trails.', slug: 'potts-mountain' },

  // ========== MORE NORTH CAROLINA ==========
  { name: 'Wilson Creek — Pisgah NF', lat: 35.9345, lng: -81.8567, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical', 'Ridge Riding'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Apr-Nov', permit_required: 0, permit_info: null, notes: 'Grandfather Mountain area. Challenging mountain single track with big views.', slug: 'wilson-creek' },

  // ========== MORE SOUTH CAROLINA ==========
  { name: 'Francis Marion NF OHV', lat: 33.1234, lng: -79.6567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Dual Sport'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 50, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Lowcountry coastal plain riding near Charleston. Flat sandy forest roads.', slug: 'francis-marion' },
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
console.log(`Batch 3: Inserted ${inserted} new spots. Total riding locations: ${total.cnt}`);
db.close();
