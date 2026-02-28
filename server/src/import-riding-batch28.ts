import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

// Hidden gems + depth additions from web research
const spots = [
  // === CALIFORNIA HIDDEN GEMS ===
  { name: 'Tenaja Truck Trail — Cleveland NF', lat: 33.525, lng: -117.375, diff: 'Moderate', miles: 18, elev: 1200, trail: 'Dual Sport,Fire Road', scenery: 4, desc: 'Hidden fire road ride in Cleveland NF south of Lake Elsinore. Rolling hills, oak woodland. Good fall-spring ride. Less crowded than nearby SVRAs.', season: 'Oct-May' },
  { name: 'Big Meadows — Sequoia NF', lat: 36.425, lng: -118.675, diff: 'Moderate', miles: 25, elev: 1000, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Alpine meadow riding in Sequoia NF at 7,600ft. Mix of beginner loops and intermediate single track through giant sequoia terrain.', season: 'Jun-Oct' },
  { name: 'Corral Canyon OHV — San Bernardino', lat: 34.175, lng: -117.375, diff: 'Hard', miles: 30, elev: 2000, trail: 'Single Track,Enduro', scenery: 4, desc: 'Technical single track in San Bernardino NF. Rocky terrain with significant elevation changes. Popular SoCal enduro spot.', season: 'Year-round' },
  { name: 'Big Bear — Gold Mountain Trail', lat: 34.275, lng: -116.875, diff: 'Moderate', miles: 15, elev: 800, trail: 'Single Track,Dual Sport', scenery: 5, desc: 'Mountain single track near Big Bear Lake at 7,000ft. Pine forest with lake views. Can combine with other Big Bear trails.', season: 'May-Oct' },
  { name: 'Cleghorn Ridge — San Bernardino', lat: 34.275, lng: -117.325, diff: 'Hard', miles: 12, elev: 1500, trail: 'Single Track,Enduro', scenery: 4, desc: 'Technical ridge riding above Cajon Pass. Rocky, narrow single track with exposure. Experienced riders. Views of High Desert.', season: 'Oct-May' },
  { name: 'Plumas NF — Beckwourth District', lat: 39.825, lng: -120.375, diff: 'Moderate', miles: 40, elev: 1200, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Northern Sierra riding in Plumas NF. Pine forest trails with mountain meadows. Less crowded than Tahoe area. Good intermediate riding.', season: 'Jun-Oct' },
  { name: 'Eldorado NF — Georgetown', lat: 38.925, lng: -120.825, diff: 'Moderate', miles: 35, elev: 1500, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Sierra foothills riding near Georgetown. Mixed forest with creek crossings. Close to Auburn SRA. Good NorCal hidden gem.', season: 'Apr-Nov' },

  // === COLORADO DEPTH ===
  { name: 'Rampart Range Road', lat: 39.075, lng: -105.075, diff: 'Easy', miles: 60, elev: 2000, trail: 'Fire Road,Dual Sport', scenery: 4, desc: '60-mile dirt road from Sedalia to Woodland Park through Pike NF. Easy but scenic ridge riding with Pikes Peak views.', season: 'May-Oct' },
  { name: 'Gold Camp Road — Colorado Springs', lat: 38.775, lng: -104.925, diff: 'Easy', miles: 20, elev: 800, trail: 'Dual Sport,Fire Road', scenery: 4, desc: 'Historic railroad grade converted to dirt road. Tunnels, mountain views, easy riding. Above Colorado Springs.', season: 'May-Oct' },
  { name: 'Weston Pass', lat: 39.125, lng: -106.175, diff: 'Moderate', miles: 22, elev: 2500, trail: 'Dual Sport', scenery: 5, desc: 'Mountain pass road to 11,900ft between Leadville and Fairplay. Stunning alpine scenery. Part of larger loop options.', season: 'Jun-Sep' },
  { name: 'Webster Pass', lat: 39.575, lng: -105.825, diff: 'Hard', miles: 8, elev: 1500, trail: 'Dual Sport,Enduro', scenery: 5, desc: 'Technical mountain pass to 12,100ft. Rocky switchbacks with exposure. One of Colorado\'s classic dual sport passes. Near Montezuma.', season: 'Jul-Sep' },
  { name: 'Peru Creek — Montezuma', lat: 39.575, lng: -105.875, diff: 'Moderate', miles: 10, elev: 1200, trail: 'Dual Sport', scenery: 5, desc: 'Mining road to old mine ruins above 11,000ft near Montezuma. Can connect to Webster Pass for a loop. Alpine tundra riding.', season: 'Jul-Sep' },

  // === IDAHO DEPTH ===
  { name: 'Warren Wagon Road', lat: 45.275, lng: -115.425, diff: 'Moderate', miles: 35, elev: 3000, trail: 'Dual Sport,Fire Road', scenery: 5, desc: 'Historic wagon road through Payette NF to ghost town of Warren, ID. Remote backcountry with river crossings. Classic Idaho adventure.', season: 'Jun-Oct' },
  { name: 'Magruder Corridor', lat: 45.575, lng: -114.875, diff: 'Hard', miles: 100, elev: 5000, trail: 'Dual Sport', scenery: 5, desc: '100-mile remote dirt road from Red River to Darby, MT through Selway-Bitterroot Wilderness corridor. Multi-day adventure. Incredible scenery.', season: 'Jul-Sep' },
  { name: 'Lolo Motorway — NF Road 500', lat: 46.575, lng: -115.575, diff: 'Moderate', miles: 100, elev: 4000, trail: 'Dual Sport,Fire Road', scenery: 5, desc: 'Historic route along the Nez Perce / Lewis & Clark trail through Clearwater NF. 100 miles of ridgeline riding at 6,000-7,000ft.', season: 'Jul-Sep' },
  { name: 'Elk City Wagon Road', lat: 45.825, lng: -115.475, diff: 'Moderate', miles: 50, elev: 3000, trail: 'Dual Sport,Fire Road', scenery: 5, desc: 'Historic route through Nez Perce NF to Elk City. Remote mountain terrain with hot springs. Idaho backcountry at its best.', season: 'Jun-Oct' },

  // === HIDDEN GEMS — MISC ===
  { name: 'Medicine Bow NF — Snowy Range', lat: 41.325, lng: -106.325, diff: 'Moderate', miles: 40, elev: 2500, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Mountain riding in Medicine Bow NF, WY. Alpine meadows and rocky peaks at 10,000ft+. Less crowded than Colorado. Hidden gem.', season: 'Jul-Sep' },
  { name: 'Priest Lake — Idaho Panhandle', lat: 48.525, lng: -116.875, diff: 'Moderate', miles: 35, elev: 1500, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Northern Idaho lake country riding in Kaniksu NF. Cedar forest with mountain lake views. Remote and beautiful.', season: 'Jun-Oct' },
  { name: 'Whipsaw Trail — British Columbia', lat: 49.325, lng: -120.625, diff: 'Hard', miles: 55, elev: 3500, trail: 'Dual Sport,Enduro', scenery: 5, desc: '55km technical trail in southern BC, Canada. Creek crossings, rocky terrain, mountain passes. Bucket list dual sport ride.', season: 'Jul-Sep' },
  { name: 'Trans-Wisconsin Adventure Trail', lat: 44.275, lng: -89.625, diff: 'Easy', miles: 250, elev: 2000, trail: 'Dual Sport,Fire Road', scenery: 3, desc: '250-mile route across Wisconsin on gravel and dirt roads. Easy riding through farmland, forest, and lake country. TWAT (seriously).', season: 'May-Oct' },
  { name: 'Trans-Iowa Adventure Trail', lat: 42.025, lng: -93.475, diff: 'Easy', miles: 200, elev: 1000, trail: 'Dual Sport,Fire Road', scenery: 2, desc: '200+ mile route across Iowa on B-roads and minimum maintenance roads. Flat but scenic farmland. Good dual sport touring.', season: 'Apr-Oct' },
  { name: 'Baja California — Mike\'s Sky Ranch', lat: 31.075, lng: -115.575, diff: 'Hard', miles: 30, elev: 3000, trail: 'Single Track,Enduro', scenery: 5, desc: 'Legendary Baja riding near Mike\'s Sky Ranch. Desert mountains, whoops, and technical terrain. Classic Baja 1000 training ground.', season: 'Oct-Apr' },
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
      `riding-b28-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Batch 28: Inserted ${count} of ${spots.length} riding spots`);
db.close();
