import { getDb } from './database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

interface SeedLocation {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  category: string;
  sub_type?: string;
  source: string;
  cell_signal?: string;
  difficulty?: string;
  distance_miles?: number;
  trail_types?: string;
  scenery_rating?: number;
  stay_limit_days?: number;
  crowding?: string;
  season?: string;
  permit_required?: number;
  permit_info?: string;
  notes?: string;
  best_season?: string;
  water_nearby?: number;
  dump_nearby?: number;
  external_links?: string;
  want_to_visit?: number;
  hours?: string;
}

const seedLocations: SeedLocation[] = [
  // === ARIZONA CAMPSITES ===
  {
    name: 'Ghost Town Road Dispersed',
    description: 'Free BLM dispersed camping near Congress, AZ. Drive past the main entrance for more secluded spots. Verizon 5G, T-Mobile 5G, AT&T 4G coverage. Gas station, dollar store, grocery 5 min away in Congress.',
    latitude: 33.9488,
    longitude: -112.8294,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    cell_signal: 'Good',
    stay_limit_days: 14,
    crowding: 'Medium',
    season: 'Oct-Apr',
    scenery_rating: 4,
    notes: 'Drive further back for privacy. Avoid after heavy rain (silty mud). Some homeless camps near entrance.',
    want_to_visit: 1,
  },
  {
    name: 'Vulture Peak State Trust Land',
    description: 'Requires $15/year AZ State Trust Land permit. Verizon cell tower across the street — excellent signal. Tons of room, easy to level, great sunsets.',
    latitude: 33.8358,
    longitude: -112.8134,
    category: 'campsite',
    sub_type: 'State',
    source: 'agent_curated',
    cell_signal: 'Excellent',
    season: 'Oct-Apr',
    scenery_rating: 4,
    permit_required: 1,
    permit_info: 'AZ State Trust Land permit $15/year — https://land.az.gov/recreational-permits',
    notes: 'Road in is rutted/rough but doable with any truck. Some trash in spots.',
    want_to_visit: 1,
  },
  {
    name: 'Boulders OHV Area Camping',
    description: 'Free dispersed camping within the OHV area. Camp right in the trail network. Weekdays are quiet, weekends busy with Phoenix day-trippers.',
    latitude: 33.8798,
    longitude: -112.3055,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    cell_signal: 'Fair',
    crowding: 'High',
    season: 'Oct-May',
    scenery_rating: 3,
    notes: 'Can be packed on weekends. Camp further from staging area for privacy.',
    want_to_visit: 1,
  },
  {
    name: 'Rincon Road BLM',
    description: 'Free BLM dispersed camping near Wickenburg. Less known, good Verizon signal.',
    latitude: 33.90,
    longitude: -112.67,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    cell_signal: 'Good',
    season: 'Oct-Apr',
    scenery_rating: 3,
    want_to_visit: 1,
  },
  // === UTAH CAMPSITES ===
  {
    name: 'Moon Rocks — Warner Valley',
    description: 'THE perfect ride-from-camp spot. Free BLM dispersed camping among grey rock formations. Central to all three Warner Valley trail loops. Quiet, feels remote despite being 20 min from Hurricane.',
    latitude: 37.0130,
    longitude: -113.3990,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    cell_signal: 'Fair',
    crowding: 'Low',
    season: 'Year-round',
    scenery_rating: 5,
    notes: 'Access from Hurricane side — not St. George (sand drifts on that road). GPS essential.',
    want_to_visit: 1,
  },
  {
    name: 'Hurricane Cliffs BLM',
    description: '56 designated dispersed sites between Hurricane and Virgin, UT. Fire rings provided. Free, first-come first-served.',
    latitude: 37.15,
    longitude: -113.35,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    crowding: 'Medium',
    season: 'Year-round',
    scenery_rating: 4,
    want_to_visit: 1,
  },
  // === CALIFORNIA CAMPSITES ===
  {
    name: 'Hungry Valley Campgrounds',
    description: '11 semi-developed campgrounds, 200+ sites in Hungry Valley SVRA. Shade ramadas, picnic tables, fire rings, vault toilets. First-come first-served.',
    latitude: 34.7889,
    longitude: -118.8472,
    category: 'campsite',
    sub_type: 'State',
    source: 'agent_curated',
    crowding: 'Medium',
    season: 'Year-round',
    scenery_rating: 4,
    notes: 'Weekdays are quiet. Not free but cheap. Dump facilities in-park.',
    dump_nearby: 1,
    want_to_visit: 1,
  },
  {
    name: 'Alabama Hills — Movie Flat',
    description: 'Most epic boondocking backdrop in America. Massive boulder formations with Mt. Whitney and the Sierras as backdrop. Free dispersed camping (free permit required).',
    latitude: 36.6083,
    longitude: -118.1131,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    crowding: 'Medium',
    season: 'Year-round',
    scenery_rating: 5,
    permit_required: 1,
    permit_info: 'Free permit required — get online or at Eastern Sierra Visitor Center in Lone Pine',
    notes: 'Stunning for photos, sunsets, stargazing. Rest day basecamp between SoCal and NorCal.',
    want_to_visit: 1,
  },
  {
    name: 'Johnson Valley BLM Dispersed',
    description: 'Free dispersed camping throughout BLM land in Johnson Valley. Massive area — very secluded spots easily found. Joshua Tree National Park nearby for rest days.',
    latitude: 34.35,
    longitude: -116.45,
    category: 'campsite',
    sub_type: 'BLM',
    source: 'agent_curated',
    crowding: 'Low',
    season: 'Oct-May',
    scenery_rating: 3,
    notes: 'GPS mandatory — people get lost here. Open mine shafts in area.',
    want_to_visit: 1,
  },
  // === TRANSIT OVERNIGHT STOPS ===
  {
    name: 'Meriwether Lewis Campsite — Natchez Trace',
    description: 'Free primitive camping on the Natchez Trace Parkway south of Nashville. Gorgeous wooded pulloffs, very safe, almost nobody there at night. Vault toilets.',
    latitude: 35.5206,
    longitude: -87.4615,
    category: 'campsite',
    sub_type: 'National Forest',
    source: 'agent_curated',
    crowding: 'Low',
    season: 'Year-round',
    scenery_rating: 4,
    notes: 'Great overnight stop on the drive out west. Free, first-come.',
    want_to_visit: 1,
  },
  // === ARIZONA RIDING AREAS ===
  {
    name: 'Vulture Mine Road BLM Network',
    description: 'Unmarked single track carved by decades of local riders through Sonoran desert. Rocky, technical, rolling hills with saguaros everywhere. Trails are NOT on any map — find them by exploring.',
    latitude: 33.8645,
    longitude: -112.7812,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Hard',
    trail_types: JSON.stringify(['Single Track', 'Desert', 'Technical']),
    scenery_rating: 4,
    best_season: 'Oct-Apr',
    notes: 'Ride the ridgelines heading west toward Prescott NF boundary. OnX Offroad shows some as unnamed trails.',
    want_to_visit: 1,
  },
  {
    name: 'Prescott NF — West Side MVUM Single Track',
    description: 'Hidden gem — every dotted line on the MVUM = legal single track for motorcycles. Transitions from desert to chaparral to pine forest. Remote, GPS mandatory.',
    latitude: 34.15,
    longitude: -112.60,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Hard',
    trail_types: JSON.stringify(['Single Track', 'Fire Road', 'Ridge Riding']),
    scenery_rating: 5,
    best_season: 'Oct-Apr',
    notes: 'REMOTE. GPS mandatory. Spotty cell service. Bring water, tools, spare tube. Access from US-89 toward Yarnell/Congress.',
    external_links: JSON.stringify(['https://www.fs.usda.gov/detailfull/prescott/maps-pubs/?cid=fseprd585923']),
    want_to_visit: 1,
  },
  {
    name: 'Ghost Town Road Network',
    description: 'Mix of old mining roads and trails near Congress, AZ. Less crowded than Vulture Mine area. Interesting abandoned mine structures.',
    latitude: 33.95,
    longitude: -112.75,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    trail_types: JSON.stringify(['Single Track', 'Fire Road']),
    scenery_rating: 3,
    best_season: 'Oct-Apr',
    want_to_visit: 1,
  },
  {
    name: 'Boulders OHV / Mile Markers',
    description: 'Over 200 miles of trails through Upper Sonoran Desert. Width-restricted single track sections throughout. Rolling hills, washes, boulder fields, saguaros.',
    latitude: 33.8798,
    longitude: -112.3055,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 200,
    trail_types: JSON.stringify(['Single Track', 'Desert', 'Fire Road']),
    scenery_rating: 4,
    best_season: 'Oct-May',
    notes: 'Look for "width restricted" signs = single track only. Easy to advanced sections.',
    want_to_visit: 1,
  },
  {
    name: 'Wildcat Pass Area',
    description: 'Nice flowy hardpack sections, mix of singletrack, width-restricted, and single lane dirt roads. Less crowded than Boulders.',
    latitude: 33.80,
    longitude: -111.78,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    trail_types: JSON.stringify(['Single Track', 'Fire Road']),
    scenery_rating: 3,
    best_season: 'Oct-May',
    want_to_visit: 1,
  },
  // === UTAH RIDING AREAS ===
  {
    name: 'Cactus Loop — Warner Valley',
    description: '17.1 miles, local favorite in Warner Valley. Sand washes, rocky single track, red rock scenery. 1-2 hours ride time.',
    latitude: 37.0139,
    longitude: -113.39644,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 17.1,
    trail_types: JSON.stringify(['Single Track', 'Desert']),
    scenery_rating: 5,
    best_season: 'Oct-Apr',
    notes: 'Come from Hurricane side. GPS essential — easy to get lost in washes. 50-65°F in Feb/March.',
    want_to_visit: 1,
  },
  {
    name: 'Fort Pierce Loop — Warner Valley',
    description: '19 miles, starts near Fort Pierce ruins (old stone fort). Mix of washes, single track, desert terrain.',
    latitude: 37.0136,
    longitude: -113.4094,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 19,
    trail_types: JSON.stringify(['Single Track', 'Desert']),
    scenery_rating: 4,
    best_season: 'Oct-Apr',
    notes: 'Fort ruins are cool to explore. Can be linked with Cactus Loop and Dino.',
    want_to_visit: 1,
  },
  {
    name: 'Dino Single Track — Warner Valley',
    description: '11 miles near actual dinosaur tracks site. Good intermediate single track.',
    latitude: 37.014067,
    longitude: -113.398315,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 11,
    trail_types: JSON.stringify(['Single Track']),
    scenery_rating: 4,
    best_season: 'Oct-Apr',
    want_to_visit: 1,
  },
  // === CALIFORNIA RIDING AREAS ===
  {
    name: 'Hungry Valley SVRA',
    description: '19,000 acres, 137 miles of OHV trails. Terrain ranges from 2,600 ft to over 8,000 ft — rolling hills, arroyos, scrubland, AND steep pine-forested mountains.',
    latitude: 34.7889,
    longitude: -118.8472,
    category: 'riding',
    sub_type: 'Fire Road',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 137,
    trail_types: JSON.stringify(['Single Track', 'Fire Road', 'Ridge Riding']),
    scenery_rating: 5,
    best_season: 'Year-round',
    permit_required: 1,
    permit_info: 'Day use fee ~$5',
    notes: 'Connects to Los Padres NF with 150+ additional miles. Trails rated by difficulty for motorcycles.',
    want_to_visit: 1,
  },
  {
    name: 'Los Padres NF — Mt. Pinos East',
    description: 'Epic if you love open country and rugged terrain. Hill climbs, tight switchbacks, views for days. Fire roads along ridgelines with panoramic views of the valleys below.',
    latitude: 34.8139,
    longitude: -119.1428,
    category: 'riding',
    sub_type: 'Ridge Riding',
    source: 'agent_curated',
    difficulty: 'Hard',
    distance_miles: 160,
    trail_types: JSON.stringify(['Fire Road', 'Ridge Riding']),
    scenery_rating: 5,
    best_season: 'Apr-Nov',
    notes: '160+ miles of dirt roads and trails. This is THE ridgeline riding destination.',
    want_to_visit: 1,
  },
  {
    name: 'Rowher Flat OHV — Angeles NF',
    description: 'Ridgeline riding with high desert views. Trails follow ridgelines from 2,500 ft to 4,000+ ft. Mix of single track, fire roads, and rocky hill climbs.',
    latitude: 34.4350,
    longitude: -118.3980,
    category: 'riding',
    sub_type: 'Ridge Riding',
    source: 'agent_curated',
    difficulty: 'Moderate',
    trail_types: JSON.stringify(['Single Track', 'Fire Road', 'Ridge Riding']),
    scenery_rating: 4,
    best_season: 'Year-round',
    notes: 'No plate needed in OHV area. Key trails: Rowher Trail (3N24), Lookout Trail, East Walker Canyon Loop.',
    want_to_visit: 1,
  },
  {
    name: 'Hollister Hills SVRA',
    description: '6,800 acres, nearly 200 miles of trails. Rolling green hills with ridgeline trails and oak groves. GREEN in late winter/spring (Feb-April) — incredible.',
    latitude: 36.7796,
    longitude: -121.4214,
    category: 'riding',
    sub_type: 'Ridge Riding',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 200,
    trail_types: JSON.stringify(['Single Track', 'Fire Road', 'Ridge Riding']),
    scenery_rating: 5,
    best_season: 'Feb-Apr',
    permit_required: 1,
    permit_info: 'Day use fee ~$5',
    notes: 'High Trail — open ridgeline with panoramic views. Harmony Gate Trail — climbs past oak forests to ridgeline. 1 hour south of San Jose.',
    want_to_visit: 1,
  },
  {
    name: 'Johnson Valley / Juniper Flats',
    description: 'Massive BLM riding area. Single track networks at Juniper Flats. Desert hills, varied terrain.',
    latitude: 34.35,
    longitude: -116.45,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    trail_types: JSON.stringify(['Single Track', 'Desert']),
    scenery_rating: 3,
    best_season: 'Oct-May',
    notes: 'GPS MANDATORY — people get lost frequently. Open mine shafts. Rim locks recommended.',
    want_to_visit: 1,
  },
  {
    name: 'Corral Canyon / McCain Valley',
    description: 'Cleveland National Forest, 45 min east of San Diego. Single track + fire roads through chaparral-covered hills. Rock obstacles, pick your line carefully.',
    latitude: 32.70,
    longitude: -116.35,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Hard',
    trail_types: JSON.stringify(['Single Track', 'Fire Road', 'Technical']),
    scenery_rating: 4,
    best_season: 'Year-round',
    notes: 'Winter temps: 60-70°F. McCain Valley has loops and sand tracks.',
    want_to_visit: 1,
  },
  {
    name: 'Browns Camp — Tillamook State Forest',
    description: '250+ miles of trails through lush green coastal forest. Dense canopy, ferns, towering trees. Diamond Mill area has motorcycle-only technical single track. Free day use.',
    latitude: 45.58,
    longitude: -123.48,
    category: 'riding',
    sub_type: 'Single Track',
    source: 'agent_curated',
    difficulty: 'Moderate',
    distance_miles: 250,
    trail_types: JSON.stringify(['Single Track', 'Technical']),
    scenery_rating: 5,
    best_season: 'May-Oct',
    notes: 'Top tier riding per Reddit riders. PNW extension for April/May when weather warms.',
    want_to_visit: 1,
  },
  // === SCENIC VIEWPOINTS ===
  {
    name: 'Mammoth Cave National Park',
    description: "World's longest known cave system. Quick self-guided tour takes 1-2 hours. Free to enter park, cave tours $6-60.",
    latitude: 37.1870,
    longitude: -86.1008,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 4,
    notes: '30 min off I-65. Worth the detour on the drive out west.',
    want_to_visit: 1,
  },
  {
    name: 'Palo Duro Canyon State Park',
    description: 'Second largest canyon in the US. Stunning red rock walls. Lighthouse Trail is an easy hike with incredible views.',
    latitude: 34.9425,
    longitude: -101.6712,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 5,
    notes: '20 min off I-27 near Amarillo. Quick stop, great hike.',
    want_to_visit: 1,
  },
  {
    name: 'Petrified Forest National Park',
    description: 'Drive-through park with fossilized ancient redwood trees. Painted desert views. 45 min drive-through or 2 hours with hikes.',
    latitude: 34.8198,
    longitude: -109.7825,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 4,
    permit_required: 1,
    permit_info: '$25 vehicle entry (National Park pass works)',
    notes: 'Right off I-40. Quick stop on the drive to AZ.',
    want_to_visit: 1,
  },
  {
    name: 'Meteor Crater',
    description: 'Mile-wide meteor impact crater right off I-40.',
    latitude: 35.0275,
    longitude: -111.0228,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 4,
    permit_required: 1,
    permit_info: '~$25 entry',
    notes: 'Exit 233 off I-40. Quick stop, 30-60 min.',
    want_to_visit: 1,
  },
  {
    name: 'Walnut Canyon National Monument',
    description: 'Ancient cliff dwellings near Flagstaff. Beautiful canyon hike. 1 hour visit.',
    latitude: 35.1717,
    longitude: -111.5106,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 4,
    notes: '10 min off I-40 near Flagstaff.',
    want_to_visit: 1,
  },
  {
    name: 'Valley of Fire State Park',
    description: 'Insane red sandstone formations. One of the most photogenic spots in the US. Quick 1-hour drive through + short hikes.',
    latitude: 36.4414,
    longitude: -114.5135,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 5,
    permit_required: 1,
    permit_info: '$10 entry',
    notes: '30 min off I-15 near Las Vegas. On the route from UT to CA.',
    want_to_visit: 1,
  },
  {
    name: 'Zion National Park',
    description: "Pa'rus Trail is an easy 3.5 mile paved walk along the Virgin River in the canyon. Jaw-dropping scenery.",
    latitude: 37.2982,
    longitude: -113.0263,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 5,
    notes: '45 min from Hurricane. Perfect rest day destination.',
    want_to_visit: 1,
  },
  {
    name: 'Snow Canyon State Park',
    description: 'Red/white sandstone formations. Less crowded than Zion. Beautiful hiking.',
    latitude: 37.1829,
    longitude: -113.6382,
    category: 'scenic',
    source: 'agent_curated',
    scenery_rating: 5,
    notes: '30 min from St. George.',
    want_to_visit: 1,
  },
  // === SERVICES ===
  {
    name: 'Nielson RV — St. George (Dump + Water)',
    description: 'Free dump station and water fill, open 24/7. 341 E Sunland Dr, St. George.',
    latitude: 37.0961,
    longitude: -113.5603,
    category: 'dump',
    source: 'agent_curated',
    hours: '24/7',
    notes: 'FREE. Best dump/water option in the St. George/Hurricane area.',
  },
  {
    name: 'Desert Hills RV Park — Wickenburg',
    description: 'Dump station and water fill available for a small fee.',
    latitude: 33.97,
    longitude: -112.73,
    category: 'dump',
    source: 'agent_curated',
    notes: 'Small fee for dump and water fill.',
  },
  {
    name: 'Safeway Water Station — Wickenburg',
    description: 'Potable water vending machines in Safeway parking lot. Bring jugs for drinking water.',
    latitude: 33.9686,
    longitude: -112.7312,
    category: 'water',
    source: 'agent_curated',
    notes: 'Self-serve water vending. Good for drinking water jugs.',
  },
  {
    name: 'Flying J — Gorman',
    description: 'Truck stop with dump station facilities near Hungry Valley SVRA.',
    latitude: 34.7954,
    longitude: -118.8540,
    category: 'dump',
    source: 'agent_curated',
    notes: 'Right off I-5 in Gorman.',
  },
  {
    name: 'Safeway — Wickenburg',
    description: 'Full grocery store for resupply. 15-20 min from Ghost Town Road BLM.',
    latitude: 33.9686,
    longitude: -112.7312,
    category: 'grocery',
    source: 'agent_curated',
  },
  {
    name: 'Dollar General — Congress',
    description: 'Quick stop for basics, 5 min from Ghost Town Road BLM.',
    latitude: 33.9361,
    longitude: -112.8516,
    category: 'grocery',
    source: 'agent_curated',
  },
  {
    name: 'Walmart — Hurricane, UT',
    description: 'Full Walmart for major resupply. 15-20 min from Moon Rocks.',
    latitude: 37.1753,
    longitude: -113.2898,
    category: 'grocery',
    source: 'agent_curated',
  },
  {
    name: "Smith's — St. George, UT",
    description: 'Grocery store in St. George, 25 min from Moon Rocks.',
    latitude: 37.1041,
    longitude: -113.5684,
    category: 'grocery',
    source: 'agent_curated',
  },
];

const seedTrip = {
  name: 'Western Trip — Spring 2026',
  description: 'Open-ended trip (3+ weeks, possibly months) out west. Single track + ridgeline/open hill riding + boondocking. Ohio → AZ → UT → CA → PNW.',
  status: 'planning',
  start_date: '2026-03-10',
  end_date: null,
  notes: 'Priorities: Safety, seclusion, single track + ridgeline riding, incredible scenery. Bikes: Stark Varg EX (single track), Husqvarna FE 501S (long adventure rides).',
};

export function seedDatabase(): void {
  const db = getDb();

  const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
  if (locationCount.count > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  const insertLocation = db.prepare(`
    INSERT INTO locations (name, description, latitude, longitude, category, sub_type, source,
      cell_signal, difficulty, distance_miles, trail_types, scenery_rating, stay_limit_days,
      crowding, season, permit_required, permit_info, notes, best_season, water_nearby,
      dump_nearby, external_links, want_to_visit, hours)
    VALUES (@name, @description, @latitude, @longitude, @category, @sub_type, @source,
      @cell_signal, @difficulty, @distance_miles, @trail_types, @scenery_rating, @stay_limit_days,
      @crowding, @season, @permit_required, @permit_info, @notes, @best_season, @water_nearby,
      @dump_nearby, @external_links, @want_to_visit, @hours)
  `);

  const insertMany = db.transaction((locations: SeedLocation[]) => {
    for (const loc of locations) {
      insertLocation.run({
        name: loc.name,
        description: loc.description || null,
        latitude: loc.latitude,
        longitude: loc.longitude,
        category: loc.category,
        sub_type: loc.sub_type || null,
        source: loc.source,
        cell_signal: loc.cell_signal || null,
        difficulty: loc.difficulty || null,
        distance_miles: loc.distance_miles || null,
        trail_types: loc.trail_types || null,
        scenery_rating: loc.scenery_rating || null,
        stay_limit_days: loc.stay_limit_days || null,
        crowding: loc.crowding || null,
        season: loc.season || null,
        permit_required: loc.permit_required || null,
        permit_info: loc.permit_info || null,
        notes: loc.notes || null,
        best_season: loc.best_season || null,
        water_nearby: loc.water_nearby || null,
        dump_nearby: loc.dump_nearby || null,
        external_links: loc.external_links || null,
        want_to_visit: loc.want_to_visit || 0,
        hours: loc.hours || null,
      });
    }
  });

  insertMany(seedLocations);
  console.log(`Seeded ${seedLocations.length} locations`);

  // Seed the trip
  const insertTrip = db.prepare(`
    INSERT INTO trips (name, description, status, start_date, end_date, notes)
    VALUES (@name, @description, @status, @start_date, @end_date, @notes)
  `);

  const tripResult = insertTrip.run({
    name: seedTrip.name,
    description: seedTrip.description,
    status: seedTrip.status,
    start_date: seedTrip.start_date,
    end_date: seedTrip.end_date,
    notes: seedTrip.notes,
  });

  const tripId = tripResult.lastInsertRowid;

  // Add key basecamps as trip stops
  const basecampStops = [
    { name: 'Meriwether Lewis — Natchez Trace', lat: 35.5206, lng: -87.4615, nights: 1, notes: 'Transit overnight stop. Free camping on Natchez Trace Parkway south of Nashville.' },
    { name: 'Ghost Town Road BLM — Wickenburg', lat: 33.9488, lng: -112.8294, nights: 10, notes: 'Phase 1: Arizona basecamp. Ride Vulture Mine, Prescott NF, Ghost Town Road network.' },
    { name: 'Boulders OHV Area', lat: 33.8798, lng: -112.3055, nights: 4, notes: 'Phase 1B: Camp in OHV area. 200+ miles of trails, width-restricted single track.' },
    { name: 'Moon Rocks — Warner Valley, UT', lat: 37.0130, lng: -113.3990, nights: 10, notes: 'Phase 2: Utah basecamp. Ride Cactus Loop, Fort Pierce, Dino. Rest day: Zion.' },
    { name: 'Johnson Valley BLM — SoCal Desert', lat: 34.35, lng: -116.45, nights: 4, notes: 'Phase 3A: Desert riding at Juniper Flats single track. Near Joshua Tree.' },
    { name: 'Hungry Valley SVRA — Gorman', lat: 34.7889, lng: -118.8472, nights: 6, notes: 'Phase 3B: Ridgeline riding in Los Padres NF + Mt. Pinos East. 137mi of trails.' },
    { name: 'Alabama Hills — Lone Pine', lat: 36.6083, lng: -118.1131, nights: 3, notes: 'Scenic basecamp. Mt. Whitney backdrop. Photos, sunsets, stargazing. Rest days.' },
    { name: 'Hollister Hills SVRA — Central CA', lat: 36.7796, lng: -121.4214, nights: 4, notes: 'Phase 4: Green hills ridgeline riding. High Trail panoramic views. Best Feb-April.' },
  ];

  const insertStop = db.prepare(`
    INSERT INTO trip_stops (trip_id, name, latitude, longitude, sort_order, nights, notes)
    VALUES (@trip_id, @name, @latitude, @longitude, @sort_order, @nights, @notes)
  `);

  basecampStops.forEach((stop, index) => {
    // Try to link to existing location
    const location = db.prepare('SELECT id FROM locations WHERE ABS(latitude - ?) < 0.01 AND ABS(longitude - ?) < 0.01 LIMIT 1').get(stop.lat, stop.lng) as { id: number } | undefined;

    insertStop.run({
      trip_id: tripId,
      name: stop.name,
      latitude: stop.lat,
      longitude: stop.lng,
      sort_order: index,
      nights: stop.nights,
      notes: stop.notes,
    });
  });

  console.log(`Seeded trip with ${basecampStops.length} stops`);
  console.log('Seed complete!');
}

// Allow running directly
if (require.main === module) {
  seedDatabase();
  console.log('Done.');
}
