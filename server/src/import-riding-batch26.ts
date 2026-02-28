import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

const spots = [
  // === FLORIDA (filling gap — currently only 10 spots) ===
  { name: 'Apalachicola National Forest OHV', lat: 30.275, lng: -84.875, diff: 'Moderate', miles: 100, elev: 50, trail: 'Single Track,Fire Road', scenery: 3, desc: '100+ miles of motorized trails through longleaf pine forest. Multiple loops with sandy terrain and small play areas. Popular panhandle riding destination.', season: 'Year-round' },
  { name: 'Ocala National Forest OHV System', lat: 29.185, lng: -81.635, diff: 'Moderate', miles: 80, elev: 100, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Ocala Adventure Trail is a 47-mile twisty loop through the largest sand scrub pine forest in the world. Multiple connecting trails total 80+ miles.', season: 'Year-round' },
  { name: 'Croom Motorcycle Area', lat: 28.584, lng: -82.294, diff: 'Moderate', miles: 30, elev: 50, trail: 'Single Track,Motocross', scenery: 3, desc: 'Sandy single-track trails with numerous berms through mixed longleaf pine and cypress forest. Popular locals spot in Withlacoochee State Forest.', season: 'Year-round' },
  { name: 'Bone Valley ATV Park', lat: 27.775, lng: -81.785, diff: 'Moderate', miles: 15, elev: 100, trail: 'Single Track,Enduro', scenery: 2, desc: '200 acre park with 15 miles of designated one-way trails, hill climbs, open play areas and training area. Rocky terrain unique to FL phosphate mining region.', season: 'Year-round' },
  { name: 'Clear Creek OHV Trails', lat: 30.715, lng: -87.025, diff: 'Easy', miles: 53, elev: 50, trail: 'Single Track,Fire Road', scenery: 3, desc: '53 miles of twisty woods trails in Blackwater River State Forest. Marked and looped with light elevation changes. Opened 2015.', season: 'Year-round' },
  { name: 'Tates Hell OHV Trail System', lat: 29.875, lng: -84.825, diff: 'Easy', miles: 150, elev: 25, trail: 'Fire Road,Dual Sport', scenery: 2, desc: 'Extensive 150+ mile network of designated routes through Tates Hell State Forest. Flat sandy terrain. Great for beginners and long-distance riding.', season: 'Year-round' },
  { name: 'Hard Rock Cycle Park', lat: 28.165, lng: -81.405, diff: 'Hard', miles: 15, elev: 150, trail: 'Motocross,Enduro', scenery: 2, desc: '300+ acres near Kissimmee with MX tracks, woods trails, and mini track. Hosts regional races. One of central Florida\'s premier riding facilities.', season: 'Year-round' },
  { name: 'Redneck Yacht Club', lat: 27.395, lng: -81.365, diff: 'Moderate', miles: 20, elev: 50, trail: 'Enduro,Single Track', scenery: 2, desc: '860 acres of trails, mud pits, and open riding areas near Punta Gorda. Mix of sand, clay and rocky terrain. Camping available on-site.', season: 'Year-round' },
  { name: 'Florida Cracker Ranch', lat: 29.525, lng: -81.255, diff: 'Easy', miles: 25, elev: 25, trail: 'Single Track,Fire Road', scenery: 2, desc: '1,000+ acres north of Daytona Beach with miles of ATV trails for all skill levels and mud bogs. Camping and events.', season: 'Year-round' },
  { name: 'Paisley Woods Bicycle Trail OHV', lat: 28.995, lng: -81.535, diff: 'Moderate', miles: 22, elev: 75, trail: 'Single Track', scenery: 3, desc: 'Singletrack through Ocala National Forest. Well-maintained trail with sand and root sections. Can combine with Ocala OHV for longer rides.', season: 'Year-round' },
  { name: 'Seminole State Forest OHV', lat: 28.865, lng: -81.425, diff: 'Easy', miles: 15, elev: 50, trail: 'Fire Road,Dual Sport', scenery: 3, desc: 'State forest riding area between Ocala and Orlando. Sandy fire roads and ATV trails through pine flatwoods.', season: 'Year-round' },
  { name: 'Miami Motocross Park', lat: 25.685, lng: -80.435, diff: 'Hard', miles: 3, elev: 25, trail: 'Motocross', scenery: 1, desc: 'Three-track motocross facility in southern Miami-Dade County. Supercross, outdoor MX, and vet track. Practice and race events year-round.', season: 'Year-round' },
  { name: 'Gatorback Cycle Park', lat: 29.785, lng: -82.425, diff: 'Hard', miles: 5, elev: 50, trail: 'Motocross,Enduro', scenery: 2, desc: 'Motocross facility in Alachua with supercross, vet, and hare scramble tracks. Open select dates. Hosted GNCC rounds.', season: 'Year-round' },

  // === MORE NORTHEAST (currently only 17 spots) ===
  { name: 'Anthracite Outdoor Adventure Area', lat: 40.855, lng: -76.015, diff: 'Moderate', miles: 115, elev: 800, trail: 'Single Track,Enduro,Fire Road', scenery: 4, desc: '7,500 acres in Pennsylvania coal country with 115 miles of rocky trails. Technical terrain with elevation changes. One of the largest OHV areas in the northeast.', season: 'Apr-Nov' },
  { name: 'Ride Royal Blue', lat: 36.395, lng: -84.175, diff: 'Hard', miles: 600, elev: 2500, trail: 'Single Track,Enduro,Fire Road', scenery: 5, desc: '600+ miles of trails in the Cumberland Mountains of TN. Extreme technical to beginner loops. Stunning mountain views. Premier east coast destination.', season: 'Mar-Nov' },
  { name: 'Brimstone Recreation', lat: 36.545, lng: -84.625, diff: 'Hard', miles: 300, elev: 2000, trail: 'Single Track,Enduro', scenery: 5, desc: '300+ miles of world-class trails in Big South Fork area, TN. Technical rock gardens, creek crossings, mountain ridges. Multiple difficulty levels.', season: 'Mar-Nov' },
  { name: 'Jericho ATV Park', lat: 38.725, lng: -80.175, diff: 'Moderate', miles: 150, elev: 1200, trail: 'Single Track,Fire Road', scenery: 4, desc: '150 miles of trails near Summersville, WV. Mountain terrain with creek crossings. Family-friendly with camping. Growing trail system.', season: 'Apr-Nov' },
  { name: 'Beartown Rocks', lat: 41.185, lng: -78.865, diff: 'Moderate', miles: 40, elev: 600, trail: 'Single Track,Enduro', scenery: 4, desc: 'Rocky technical trails in the PA Wilds. Unique rock formations and mountain views. Part of the Elk State Forest riding area.', season: 'Apr-Nov' },
  { name: 'Haspin Acres', lat: 38.825, lng: -85.115, diff: 'Moderate', miles: 30, elev: 300, trail: 'Enduro,Motocross', scenery: 2, desc: '1,000+ acres in Laurel, IN with trails, MX tracks, mud pits. Popular midwest destination. Camping on-site.', season: 'Apr-Nov' },
  { name: 'Badlands Off Road Park', lat: 39.215, lng: -85.575, diff: 'Hard', miles: 40, elev: 500, trail: 'Enduro,Single Track', scenery: 3, desc: '800 acres in Attica, IN with extreme technical terrain and easier loops. Clay and rock. One of Indiana\'s best riding destinations.', season: 'Apr-Nov' },
  { name: 'Redbird Crest Trail', lat: 37.215, lng: -83.585, diff: 'Moderate', miles: 65, elev: 1500, trail: 'Single Track,Fire Road', scenery: 5, desc: '65-mile trail through Daniel Boone National Forest, KY. Ridgeline riding with stunning mountain views. Remote backcountry riding.', season: 'Apr-Nov' },
  { name: 'Turkey Bay OHV Area', lat: 36.775, lng: -88.075, diff: 'Moderate', miles: 100, elev: 400, trail: 'Single Track,Fire Road,Enduro', scenery: 3, desc: '2,500 acres in Land Between the Lakes, KY/TN. Over 100 miles of trails from easy to expert. Lake views and forest riding. Camping available.', season: 'Year-round' },

  // === DEEP SOUTH (AL, MS, LA — currently 19 spots) ===
  { name: 'Stony Lonesome OHV', lat: 34.575, lng: -87.025, diff: 'Moderate', miles: 55, elev: 800, trail: 'Single Track,Enduro', scenery: 4, desc: '55 miles of trails in Bankhead National Forest, AL. Rocky terrain with creek crossings through scenic mountain forest. Well-maintained system.', season: 'Year-round' },
  { name: 'Choccolocco Mountain ORV', lat: 33.685, lng: -85.775, diff: 'Hard', miles: 48, elev: 1200, trail: 'Single Track,Enduro', scenery: 4, desc: '48 miles on Talladega National Forest, AL. Technical mountain trails with rocky climbs and descents. Ridge riding with long-range views.', season: 'Year-round' },
  { name: 'Holly Springs National Forest OHV', lat: 34.755, lng: -89.295, diff: 'Easy', miles: 35, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: '35 miles of trails in north Mississippi. Rolling hills through pine and hardwood forest. Good beginner-intermediate area.', season: 'Year-round' },
  { name: 'De Soto National Forest OHV', lat: 31.075, lng: -89.275, diff: 'Easy', miles: 25, elev: 200, trail: 'Fire Road,Dual Sport', scenery: 2, desc: 'Fire road and ATV trail riding in southern Mississippi pine forest. Flat to gently rolling terrain. Year-round access.', season: 'Year-round' },
  { name: 'Kisatchie National Forest Catahoula', lat: 31.625, lng: -92.625, diff: 'Moderate', miles: 30, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: '30 miles of trails in Kisatchie NF, LA. Sandy and clay terrain through pine hills. One of Louisiana\'s few legal riding areas.', season: 'Year-round' },
  { name: 'Indian Springs OHV', lat: 32.475, lng: -90.175, diff: 'Moderate', miles: 20, elev: 200, trail: 'Single Track,Enduro', scenery: 3, desc: 'OHV trails in Bienville National Forest, MS. Tight woods trails with hills. Popular local riding area.', season: 'Year-round' },

  // === MORE MIDWEST GAPS (MN, IA, WI) ===
  { name: 'Iron Range OHV State Recreation Area', lat: 47.525, lng: -92.875, diff: 'Moderate', miles: 75, elev: 500, trail: 'Single Track,Fire Road', scenery: 4, desc: '75 miles of trails in old mining country, MN. Unique terrain with rock faces, abandoned mines, and boreal forest. Camping on-site.', season: 'May-Oct' },
  { name: 'Spider Lake Trails', lat: 46.375, lng: -89.775, diff: 'Moderate', miles: 60, elev: 400, trail: 'Single Track,Fire Road', scenery: 4, desc: '60 miles of trails in Chequamegon-Nicolet NF, WI. Mixed hardwood forest with rolling terrain and lake views.', season: 'May-Oct' },
  { name: 'Brushy Creek SRA', lat: 42.175, lng: -93.425, diff: 'Moderate', miles: 35, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: '6,000 acres in central Iowa. 35 miles of rolling prairie trails with timber and creek crossings. Iowa\'s premier riding area.', season: 'Apr-Nov' },
  { name: 'Yellow River State Forest', lat: 43.125, lng: -91.375, diff: 'Moderate', miles: 25, elev: 500, trail: 'Single Track,Dual Sport', scenery: 4, desc: 'Bluffland riding in northeast Iowa. Scenic overlooks of the Mississippi River valley. Technical hillside trails.', season: 'Apr-Nov' },

  // === ALASKA EXPANSION (currently only 2 spots) ===
  { name: 'Knik Glacier Trail', lat: 61.685, lng: -148.925, diff: 'Moderate', miles: 30, elev: 500, trail: 'Dual Sport,Fire Road', scenery: 5, desc: 'Ride out to the face of Knik Glacier. River crossings, gravel bars, and glacier views. One of the most scenic rides in North America.', season: 'Jun-Sep' },
  { name: 'Denali Highway', lat: 63.125, lng: -147.625, diff: 'Easy', miles: 135, elev: 3000, trail: 'Dual Sport', scenery: 5, desc: '135-mile gravel highway with stunning views of Denali and the Alaska Range. Legal for street-legal bikes. Remote wilderness riding at its finest.', season: 'Jun-Sep' },
  { name: 'Matanuska Valley Trails', lat: 61.575, lng: -149.125, diff: 'Moderate', miles: 50, elev: 1000, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Network of trails in the Mat-Su Valley with mountain views. Mix of forest and alpine terrain. Bear country — ride prepared.', season: 'Jun-Sep' },
  { name: 'Copper River Valley OHV', lat: 61.975, lng: -145.475, diff: 'Moderate', miles: 40, elev: 800, trail: 'Fire Road,Dual Sport', scenery: 5, desc: 'Remote riding area east of Glennallen. Old mining roads and river valley trails with dramatic mountain scenery.', season: 'Jun-Sep' },
  { name: 'Jim Creek ATV Area', lat: 61.635, lng: -149.175, diff: 'Easy', miles: 20, elev: 300, trail: 'Fire Road,Single Track', scenery: 4, desc: 'Military recreation area open to public. Sandy trails through river valley with mountain backdrop. Good beginner area near Wasilla.', season: 'May-Oct' },

  // === HAWAII (currently 0 spots!) ===
  { name: 'Kaena Point Trail', lat: 21.575, lng: -158.275, diff: 'Moderate', miles: 5, elev: 200, trail: 'Dual Sport', scenery: 5, desc: 'Coastal dual sport trail on Oahu\'s northwest tip. Dramatic ocean cliff views. Technical rocky sections.', season: 'Year-round' },
  { name: 'Kahuku Ranch Trails', lat: 19.175, lng: -155.685, diff: 'Moderate', miles: 15, elev: 2000, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Ranch trails on the slopes of Mauna Loa, Big Island. Volcanic terrain with ocean and mountain views. Unique riding experience.', season: 'Year-round' },

  // === VERMONT / NEW HAMPSHIRE / MAINE (currently very thin) ===
  { name: 'Jericho Mountain State Park', lat: 44.525, lng: -71.375, diff: 'Moderate', miles: 80, elev: 1500, trail: 'Single Track,Fire Road', scenery: 5, desc: '80 miles of trails in northern NH with stunning White Mountain views. Rocky New England terrain. Part of Ride the Wilds network — 1,000+ mile connected system.', season: 'May-Oct' },
  { name: 'Ride the Wilds — Pittsburg', lat: 45.075, lng: -71.375, diff: 'Moderate', miles: 200, elev: 2000, trail: 'Single Track,Fire Road,Dual Sport', scenery: 5, desc: 'Part of NH\'s 1,000+ mile Ride the Wilds network. Pittsburg section offers 200 miles through remote north country. Lakes, mountains, moose. Epic.', season: 'Jun-Oct' },
  { name: 'Kingdom Trails ATV', lat: 44.625, lng: -71.975, diff: 'Moderate', miles: 45, elev: 1200, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Vermont\'s Northeast Kingdom. Rolling green mountains with stunning fall foliage. Mix of old logging roads and singletrack.', season: 'May-Oct' },
  { name: 'Maine ATV Trail Network', lat: 45.675, lng: -69.125, diff: 'Easy', miles: 300, elev: 1000, trail: 'Fire Road,Dual Sport', scenery: 4, desc: 'Maine\'s interconnected ATV trail system spans hundreds of miles through vast northern forest. Old logging roads connecting towns. True backcountry.', season: 'May-Oct' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO locations (
    name, latitude, longitude, category, difficulty,
    distance_miles, elevation_gain_ft, trail_types, scenery_rating,
    description, best_season, source, source_id
  ) VALUES (?, ?, ?, 'riding', ?, ?, ?, ?, ?, ?, ?, 'agent-curated', ?)
`);

let count = 0;
const tx = db.transaction(() => {
  for (const s of spots) {
    const result = insert.run(
      s.name, s.lat, s.lng, s.diff,
      s.miles, s.elev, s.trail, s.scenery,
      s.desc, s.season,
      `riding-b26-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Batch 26: Inserted ${count} of ${spots.length} riding spots`);
db.close();
