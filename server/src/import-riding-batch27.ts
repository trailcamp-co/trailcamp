import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

// Targeting gaps: TX East, more variety in existing states, unique destinations
const spots = [
  // === TEXAS EAST (currently only 18) ===
  { name: 'Davy Crockett National Forest ATV', lat: 31.375, lng: -95.175, diff: 'Easy', miles: 25, elev: 200, trail: 'Fire Road,Single Track', scenery: 3, desc: 'East Texas pine forest riding. Sandy trails through Davy Crockett NF. Multiple loops suitable for beginners. Camping available nearby.', season: 'Year-round' },
  { name: 'Sabine National Forest ATV Trails', lat: 31.125, lng: -93.875, diff: 'Moderate', miles: 35, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: 'East Texas forest trails near Louisiana border. Hardwood and pine forest with creek crossings. Family-friendly riding.', season: 'Year-round' },
  { name: 'Sam Houston National Forest Stubblefield', lat: 30.575, lng: -95.475, diff: 'Moderate', miles: 40, elev: 250, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Popular Houston-area riding. 40+ miles of trails through pine forest. Can be muddy after rain. Good intermediate riding.', season: 'Year-round' },
  { name: 'Barnwell Mountain Recreation Area', lat: 32.615, lng: -96.685, diff: 'Hard', miles: 15, elev: 400, trail: 'Motocross,Enduro', scenery: 3, desc: '1,800 acres near Gilmer, TX. Extreme rock gardens, hill climbs, technical sections. Hosts GNCC events. Camping on-site.', season: 'Year-round' },
  { name: 'Red River MX Park', lat: 33.875, lng: -94.175, diff: 'Hard', miles: 8, elev: 200, trail: 'Motocross,Enduro', scenery: 2, desc: 'Premier motocross facility in north Texas. MX tracks and woods trails. Hosts regional races. Near Texarkana.', season: 'Year-round' },
  { name: 'Caddo National Grasslands OHV', lat: 33.575, lng: -96.125, diff: 'Easy', miles: 20, elev: 150, trail: 'Fire Road,Dual Sport', scenery: 2, desc: 'Prairie grassland riding north of Dallas. Flat terrain with minimal elevation. Good for beginners and dual sport bikes.', season: 'Year-round' },
  { name: 'Angelina National Forest OHV', lat: 31.275, lng: -94.575, diff: 'Moderate', miles: 30, elev: 250, trail: 'Single Track,Fire Road', scenery: 3, desc: 'East Texas forest riding with sandy trails. Near Sam Rayburn Reservoir. Multiple trail systems.', season: 'Year-round' },

  // === MORE FLORIDA (now 25 total, can add more variety) ===
  { name: 'Waldo Motocross', lat: 29.785, lng: -82.175, diff: 'Hard', miles: 3, elev: 50, trail: 'Motocross', scenery: 2, desc: 'Motocross tracks northeast of Gainesville. National-caliber facility. Hosts amateur and pro races.', season: 'Year-round' },
  { name: 'Dames Point Motocross', lat: 30.425, lng: -81.535, diff: 'Hard', miles: 4, elev: 50, trail: 'Motocross', scenery: 2, desc: 'Jacksonville area MX park. Multiple tracks for different skill levels. Active racing schedule.', season: 'Year-round' },

  // === UNIQUE / SPECIAL DESTINATIONS ===
  { name: 'Hatfield-McCoy — Pinnacle Creek', lat: 37.765, lng: -81.885, diff: 'Moderate', miles: 80, elev: 2000, trail: 'Single Track,Fire Road', scenery: 5, desc: 'One of 8 trail systems in Hatfield-McCoy network, WV. Mountain terrain with coal mining history. 80+ miles of twisty trails. World-class.', season: 'Apr-Nov' },
  { name: 'Hatfield-McCoy — Indian Ridge', lat: 37.425, lng: -81.625, diff: 'Moderate', miles: 90, elev: 2200, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Southern Hatfield-McCoy system. More technical terrain with ridgeline riding. Stunning mountain views.', season: 'Apr-Nov' },
  { name: 'Hatfield-McCoy — Rockhouse', lat: 37.615, lng: -81.765, diff: 'Moderate', miles: 85, elev: 1800, trail: 'Single Track,Fire Road,Enduro', scenery: 5, desc: 'Central HMC system. Mix of flowing single track and technical rock sections. Great for all skill levels.', season: 'Apr-Nov' },
  { name: 'Paiute Trail', lat: 38.575, lng: -111.875, diff: 'Moderate', miles: 275, elev: 10000, trail: 'Dual Sport,Single Track', scenery: 5, desc: '275-mile loop through central Utah mountains. Alpine meadows, aspen forests, 10,000ft elevation. One of America\'s great dual sport rides.', season: 'Jun-Oct' },
  { name: 'White Rim Trail', lat: 38.375, lng: -109.875, diff: 'Moderate', miles: 100, elev: 1200, trail: 'Dual Sport', scenery: 5, desc: '100-mile loop in Canyonlands NP, UT. Iconic red rock desert riding. Technical 4x4 trail suitable for dual sport bikes. Permit required.', season: 'Mar-May, Sep-Nov' },
  { name: 'Shafer Trail', lat: 38.475, lng: -109.725, diff: 'Hard', miles: 18, elev: 1400, trail: 'Dual Sport,Enduro', scenery: 5, desc: 'Connector to White Rim with dramatic switchbacks down canyon walls. Technical loose rock descent. Not for beginners.', season: 'Mar-Nov' },
  { name: 'Lockhart Basin', lat: 38.325, lng: -109.525, diff: 'Hard', miles: 55, elev: 3000, trail: 'Dual Sport,Enduro', scenery: 5, desc: 'Remote canyon route from Moab to Lockhart Basin. Technical rocky terrain, dramatic scenery. Requires experience and preparation.', season: 'Apr-Oct' },
  { name: 'Hole-in-the-Rock Road', lat: 37.675, lng: -111.325, diff: 'Moderate', miles: 57, elev: 800, trail: 'Dual Sport', scenery: 5, desc: '57-mile historic route to Lake Powell. High-clearance dirt road through slot canyon country. Epic scenery.', season: 'Mar-Nov' },
  { name: 'Burr Trail', lat: 37.875, lng: -110.975, diff: 'Easy', miles: 68, elev: 2000, trail: 'Dual Sport', scenery: 5, desc: '68-mile scenic byway (partly paved) through Capitol Reef area, UT. Stunning red rock canyons and switchbacks. Moderate difficulty.', season: 'Apr-Nov' },
  { name: 'Needles District 4x4 Roads', lat: 38.125, lng: -109.825, diff: 'Hard', miles: 40, elev: 800, trail: 'Dual Sport,Enduro', scenery: 5, desc: 'Technical 4x4 routes in Canyonlands Needles District. Elephant Hill, SOB Hill. Very technical, experienced riders only.', season: 'Mar-May, Sep-Nov' },
  { name: 'Gemini Bridges Trail', lat: 38.675, lng: -109.625, diff: 'Moderate', miles: 14, elev: 600, trail: 'Dual Sport,Enduro', scenery: 5, desc: 'Scenic trail to natural rock bridges near Moab. Rocky technical sections. Can combine with other Moab trails for longer loops.', season: 'Mar-Nov' },
  
  // === MIDWEST ADDITIONS ===
  { name: 'Redbird State Recreation Area', lat: 36.775, lng: -83.375, diff: 'Hard', miles: 120, elev: 2500, trail: 'Single Track,Enduro', scenery: 5, desc: 'SE Kentucky mountain riding. 120+ miles of trails from easy to expert. Significant elevation changes in Daniel Boone NF.', season: 'Apr-Nov' },
  { name: 'Tekoa Mountain Trail System', lat: 40.885, lng: -77.325, diff: 'Hard', miles: 35, elev: 1200, trail: 'Single Track,Enduro', scenery: 4, desc: 'Central PA single track. Rocky technical terrain. Part of Weiser State Forest trail network.', season: 'Apr-Nov' },
  { name: 'Raystown OHV Area', lat: 40.425, lng: -78.075, diff: 'Moderate', miles: 25, elev: 800, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Central PA riding near Raystown Lake. Mixed terrain with rocky and smooth sections. Camping nearby.', season: 'Apr-Nov' },
  { name: 'Black Moshannon State Forest', lat: 41.065, lng: -78.075, diff: 'Moderate', miles: 30, elev: 600, trail: 'Single Track,Fire Road', scenery: 4, desc: 'North central PA. Bog and forest riding. Unique terrain. Part of PA\'s extensive state forest trail network.', season: 'May-Oct' },

  // === WEST COAST DEPTH ===
  { name: 'Carnegie SVRA', lat: 37.625, lng: -121.535, diff: 'Hard', miles: 30, elev: 1500, trail: 'Motocross,Enduro,Single Track', scenery: 3, desc: '1,500 acres near Livermore, CA. MX tracks, HS course, and challenging hill climbs. Dry California terrain.', season: 'Year-round' },
  { name: 'Prairie City SVRA', lat: 38.675, lng: -121.025, diff: 'Moderate', miles: 25, elev: 400, trail: 'Motocross,Enduro', scenery: 3, desc: 'Near Sacramento. MX tracks, woods trails, and OHV play areas. Family-friendly with facilities. Popular NorCal spot.', season: 'Year-round' },
  { name: 'Cow Mountain OHV', lat: 39.125, lng: -122.925, diff: 'Moderate', miles: 50, elev: 2000, trail: 'Single Track,Fire Road,Enduro', scenery: 4, desc: 'North of San Francisco. 50+ miles of trails with great views of Clear Lake. Oak woodland and grassland terrain.', season: 'Year-round' },
  { name: 'Stonyford OHV', lat: 39.375, lng: -122.575, diff: 'Moderate', miles: 60, elev: 2500, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Mendocino NF. 60 miles of trails through oak and pine forest. Northern California backcountry riding.', season: 'Apr-Nov' },
  { name: 'Clear Creek Management Area', lat: 37.025, lng: -121.625, diff: 'Hard', miles: 35, elev: 1800, trail: 'Single Track,Enduro', scenery: 4, desc: 'BLM riding area near Hollister, CA. Technical rocky terrain with dramatic elevation changes. Advanced riders.', season: 'Year-round' },

  // === NORTHWEST DEPTH ===
  { name: 'Tillamook State Forest OHV', lat: 45.625, lng: -123.375, diff: 'Moderate', miles: 80, elev: 2000, trail: 'Single Track,Fire Road', scenery: 5, desc: 'Coastal Oregon forest riding. 80+ miles through temperate rainforest. Wet and muddy but beautiful.', season: 'May-Oct' },
  { name: 'Evans Creek ORV Park', lat: 47.225, lng: -121.825, diff: 'Moderate', miles: 40, elev: 1500, trail: 'Single Track,Fire Road,Motocross', scenery: 4, desc: 'Near Enumclaw, WA. MX tracks and 40 miles of trails. Popular Puget Sound area riding.', season: 'May-Oct' },
  { name: 'Tahuya State Forest ORV', lat: 47.425, lng: -122.925, diff: 'Easy', miles: 35, elev: 600, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Hood Canal area, WA. Tight woods trails. Good for beginners and intermediate. Near Seattle.', season: 'Year-round' },
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
      `riding-b27-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Batch 27: Inserted ${count} of ${spots.length} riding spots`);
db.close();
