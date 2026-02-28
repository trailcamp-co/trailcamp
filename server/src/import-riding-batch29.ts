import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

const spots = [
  // === NORTH CAROLINA ===
  { name: 'Brown Mountain OHV', lat: 35.925, lng: -81.775, diff: 'Hard', miles: 40, elev: 2500, trail: 'Single Track,Enduro', scenery: 4, desc: 'Challenging mountain riding in Pisgah NF near Morganton, NC. Rocky, technical trails with significant elevation. Popular NC riding.', season: 'Apr-Nov' },
  { name: 'Tellico OHV Area', lat: 35.375, lng: -84.125, diff: 'Hard', miles: 50, elev: 3000, trail: 'Single Track,Enduro', scenery: 5, desc: 'Legendary mountain riding in Nantahala NF on NC/TN border. 50+ miles of trails from novice to expert. Creek crossings, rock gardens.', season: 'Apr-Nov' },
  { name: 'Brushy Mountain Motorsports Park', lat: 36.225, lng: -81.175, diff: 'Moderate', miles: 15, elev: 800, trail: 'Single Track,Motocross', scenery: 3, desc: 'North Carolina riding park near Taylorsville. MX tracks and woods trails. Family-friendly with camping.', season: 'Year-round' },
  { name: 'Warrior Creek OHV', lat: 36.075, lng: -80.775, diff: 'Moderate', miles: 20, elev: 1000, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Uwharrie NF riding near Troy, NC. Rolling terrain with creek crossings. Good intermediate riding in central NC.', season: 'Year-round' },

  // === SOUTH CAROLINA ===
  { name: 'Enoree OHV Area', lat: 34.725, lng: -81.875, diff: 'Moderate', miles: 18, elev: 500, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Sumter NF riding in upstate SC. Rolling forest trails. Good intermediate riding with camping nearby.', season: 'Year-round' },
  { name: 'Wambaw Cycle Trail', lat: 33.225, lng: -79.575, diff: 'Easy', miles: 15, elev: 200, trail: 'Single Track', scenery: 3, desc: 'Coastal SC riding in Francis Marion NF. Sandy flatwoods with swamp views. Unique Lowcountry riding.', season: 'Year-round' },
  { name: 'Bricks OHV Area', lat: 34.075, lng: -81.275, diff: 'Moderate', miles: 12, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Small OHV area in Sumter NF near Newberry, SC. Family-friendly riding with loops for different skill levels.', season: 'Year-round' },

  // === GEORGIA ===
  { name: 'Durhamtown Plantation Sportsman\'s Resort', lat: 32.975, lng: -82.925, diff: 'Moderate', miles: 200, elev: 400, trail: 'Single Track,Enduro,Motocross', scenery: 3, desc: 'Premier Georgia riding facility. 200 miles of trails, MX tracks, GP courses. Hosts GNCC races. Camping and lodging on-site.', season: 'Year-round' },
  { name: 'Cohutta OHV Area', lat: 34.825, lng: -84.625, diff: 'Hard', miles: 35, elev: 2500, trail: 'Single Track,Enduro', scenery: 5, desc: 'Mountain riding in Chattahoochee NF near Blue Ridge, GA. Rocky trails through Cohutta Wilderness boundary. Stunning scenery.', season: 'Apr-Nov' },
  { name: 'Statesboro MX Park', lat: 32.425, lng: -81.775, diff: 'Hard', miles: 5, elev: 100, trail: 'Motocross', scenery: 2, desc: 'Southeast Georgia MX facility. Multiple tracks for different skill levels. Near Savannah.', season: 'Year-round' },
  { name: 'Jake\'s GNCC', lat: 31.825, lng: -83.325, diff: 'Moderate', miles: 12, elev: 200, trail: 'Enduro,Single Track', scenery: 3, desc: 'South Georgia riding facility hosting GNCC rounds. Woods racing terrain. Sand and roots.', season: 'Year-round' },

  // === TENNESSEE ===
  { name: 'Windrock Park', lat: 36.075, lng: -84.275, diff: 'Moderate', miles: 300, elev: 3000, trail: 'Single Track,Fire Road,Dual Sport', scenery: 4, desc: '300+ miles of trails from beginner to expert in former coal mine property. Mountain views, varied terrain. One of TN\'s best.', season: 'Year-round' },
  { name: 'Royal Blue OHV Area', lat: 36.575, lng: -84.375, diff: 'Hard', miles: 60, elev: 2500, trail: 'Single Track,Enduro', scenery: 4, desc: 'Mountain riding in Big South Fork area, TN. Technical trails with elevation. Near KY border. Popular destination.', season: 'Apr-Nov' },
  { name: 'Brimstone Recreation', lat: 35.675, lng: -84.775, diff: 'Moderate', miles: 100, elev: 2000, trail: 'Single Track,Fire Road,ATV', scenery: 4, desc: '100+ miles of trails in east TN mountains. Mix of easy and intermediate. Family-friendly resort with cabins.', season: 'Year-round' },
  { name: 'Ride Royal Blue', lat: 36.625, lng: -84.325, diff: 'Hard', miles: 50, elev: 2500, trail: 'Single Track,Enduro', scenery: 4, desc: 'Expansion of Royal Blue system. Technical mountain riding near Big South Fork. Creek crossings, rock ledges.', season: 'Apr-Nov' },

  // === ALABAMA ===
  { name: 'Durhamtown OHV Trail', lat: 33.125, lng: -85.325, diff: 'Moderate', miles: 15, elev: 500, trail: 'Single Track', scenery: 3, desc: 'Alabama riding in Talladega NF. Rolling forest terrain with creek crossings. Good intermediate riding.', season: 'Year-round' },
  { name: 'Stony Lonesome OHV', lat: 34.725, lng: -86.325, diff: 'Moderate', miles: 20, elev: 600, trail: 'Single Track,Fire Road', scenery: 3, desc: 'North Alabama riding in Bankhead NF. Rocky trails through forest. Popular weekend spot.', season: 'Year-round' },
  { name: 'Kentuck OHV Trail System', lat: 33.325, lng: -87.325, diff: 'Easy', miles: 12, elev: 300, trail: 'Single Track,Fire Road', scenery: 3, desc: 'West Alabama riding in Tuscaloosa County. Easy to moderate trails. Good for beginners and families.', season: 'Year-round' },

  // === FLORIDA ===
  { name: 'Croom Motorcycle Area', lat: 28.575, lng: -82.275, diff: 'Easy', miles: 30, elev: 100, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Popular Tampa-area riding in Withlacoochee State Forest. Sandy trails through pine flatwoods. Beginner-friendly.', season: 'Year-round' },
  { name: 'Tate\'s Hell State Forest', lat: 29.875, lng: -84.675, diff: 'Easy', miles: 25, elev: 50, trail: 'Single Track,Fire Road', scenery: 3, desc: 'Florida Panhandle riding near Apalachicola. Flat sand trails through pine and palmetto. Unique terrain.', season: 'Year-round' },

  // === VIRGINIA ===
  { name: 'Taskers Gap USFS Trails', lat: 38.525, lng: -78.375, diff: 'Hard', miles: 18, elev: 1500, trail: 'Single Track,Enduro', scenery: 4, desc: 'Mountain single track in George Washington NF, VA. Rocky, technical terrain. Near Shenandoah Valley.', season: 'Apr-Nov' },
  { name: 'North Mountain Trail', lat: 37.575, lng: -80.375, diff: 'Moderate', miles: 20, elev: 1200, trail: 'Single Track,Fire Road', scenery: 4, desc: 'Jefferson NF riding in southwest VA. Ridge trails with views. Good intermediate mountain riding.', season: 'Apr-Nov' },
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
      `riding-b29-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Batch 29: Inserted ${count} of ${spots.length} riding spots`);
db.close();
