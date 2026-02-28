import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

const spots = [
  // === APPALACHIA ===
  { name: 'NF Dispersed — Pisgah NF', lat: 35.325, lng: -82.775, desc: 'Free forest camping in Pisgah NF, NC. Blue Ridge Mountains with waterfalls and old-growth forest. Near Pisgah riding trails and BRP.' },
  { name: 'NF Dispersed — Nantahala NF', lat: 35.175, lng: -83.575, desc: 'Free camping in Nantahala NF, NC. Mountain forest with river gorge access. Near Tsali and Nantahala riding areas.' },
  { name: 'NF Dispersed — Monongahela NF', lat: 38.625, lng: -79.775, desc: 'Free camping in Mon NF, WV. Allegheny mountain forest with bogs and spruce. Near Dolly Sods and WV riding.' },
  { name: 'NF Dispersed — Jefferson NF', lat: 37.375, lng: -80.125, desc: 'Free camping in Jefferson NF, VA. Appalachian mountains with ridge views. Near Blue Ridge Parkway and VA riding.' },
  { name: 'NF Dispersed — Chattahoochee NF', lat: 34.725, lng: -83.975, desc: 'Free forest camping in Chattahoochee NF, GA. Southern Appalachian mountains with creeks. Near N Georgia riding trails.' },
  { name: 'Dispersed — Land Between the Lakes', lat: 36.825, lng: -88.075, desc: 'Free camping in LBL, KY/TN. 170,000 acres between two lakes. Multiple zones. Near Turkey Bay OHV riding area.' },
  { name: 'NF Dispersed — Talladega NF', lat: 33.775, lng: -85.875, desc: 'Free camping in Talladega NF, AL. Piedmont foothills with hardwood forest. Near Kentuck ORV and Alabama riding.' },
  { name: 'NF Dispersed — Uwharrie NF', lat: 35.375, lng: -80.075, desc: 'Free camping in Uwharrie NF, NC. Small but scenic forest. Near Uwharrie OHV riding — popular NC riding area.' },

  // === SOUTHEAST ===
  { name: 'NF Dispersed — Ocala NF', lat: 29.175, lng: -81.775, desc: 'Free camping in Ocala NF, FL. Sand pine scrub and springs. Near Ocala NF riding trails. Year-round riding.' },
  { name: 'NF Dispersed — Apalachicola NF', lat: 30.175, lng: -84.875, desc: 'Free camping in Apalachicola NF, FL. Flatwoods and swamp. Near Tallahassee. Good winter camping. Near FL Panhandle riding.' },
  { name: 'NF Dispersed — Kisatchie NF', lat: 31.525, lng: -93.075, desc: 'Free camping in Kisatchie NF, LA. Longleaf pine forest with sandstone bluffs. Near Cane Camp and LA riding.' },
  { name: 'NF Dispersed — Holly Springs NF', lat: 34.725, lng: -89.375, desc: 'Free camping in Holly Springs NF, MS. Rolling hill forest near Memphis. Near Davis Lake recreation and MS riding.' },
  { name: 'NF Dispersed — Ozark NF', lat: 35.825, lng: -93.375, desc: 'Free camping in Ozark NF, AR. Scenic mountain forest with bluffs and waterfalls. Near Ozark riding and AR BDR.' },
  { name: 'NF Dispersed — Ouachita NF', lat: 34.675, lng: -94.175, desc: 'Free forest camping in Ouachita NF, AR/OK. Mountains with hot springs nearby. Near Wolf Pen Gap and Ouachita riding.' },
  { name: 'NF Dispersed — Mark Twain NF', lat: 37.225, lng: -91.275, desc: 'Free camping in Mark Twain NF, MO. Ozark forest with springs and caves. Near Chadwick and MO riding areas.' },

  // === MIDWEST ===
  { name: 'NF Dispersed — Hiawatha NF', lat: 46.275, lng: -86.675, desc: 'Free camping in Hiawatha NF, MI UP. Great Lakes forest with lakeshore. Near UP riding trails and MI BDR.' },
  { name: 'NF Dispersed — Huron-Manistee NF', lat: 44.325, lng: -85.725, desc: 'Free camping in Huron-Manistee NF, MI. Northern lower peninsula forest. Near Caberfae and MI riding.' },
  { name: 'NF Dispersed — Chequamegon-Nicolet NF', lat: 45.875, lng: -90.025, desc: 'Free camping in Chequamegon NF, WI. Northern Wisconsin forest with lakes. Near WI ATV/UTV trail network.' },
  { name: 'NF Dispersed — Superior NF', lat: 47.875, lng: -91.275, desc: 'Free camping in Superior NF, MN. BWCA border area, boreal forest with lakes. Near MN north shore riding.' },
  { name: 'NF Dispersed — Hoosier NF', lat: 38.525, lng: -86.475, desc: 'Free camping in Hoosier NF, IN. Southern Indiana hill country with caves. Near IN riding areas.' },
  { name: 'NF Dispersed — Shawnee NF', lat: 37.575, lng: -88.775, desc: 'Free camping in Shawnee NF, IL. Sandstone bluffs and slot canyons in southern IL. Unique terrain. Near Garden of the Gods.' },
  { name: 'NF Dispersed — Wayne NF', lat: 39.475, lng: -82.275, desc: 'Free camping in Wayne NF, OH. Southeast Ohio hill country. Near Monday Creek OHV and Perry State Forest riding.' },
  { name: 'Dispersed — Zaleski State Forest', lat: 39.325, lng: -82.375, desc: 'Free dispersed camping in Zaleski SF, OH. Southern Ohio hills with Lake Hope. Near Zaleski riding trails — one of Ohio\'s best.' },

  // === OHIO (user is local — these matter!) ===
  { name: 'Dispersed — Woodbury Wildlife Area', lat: 40.175, lng: -81.575, desc: 'Primitive camping in Woodbury WA, OH. 19,000 acres in east-central OH. Rolling hills with streams. Near Woodbury riding.' },
  { name: 'Dispersed — AEP ReCreation Land', lat: 39.825, lng: -81.725, desc: 'Free camping on AEP land in SE Ohio. 60,000 acres of reclaimed mining land with trails and ponds. Popular with OHV riders.' },

  // === PLAINS STATES ===
  { name: 'NF Dispersed — Black Hills NF', lat: 44.025, lng: -103.775, desc: 'Free camping in Black Hills NF, SD. Pine forest with granite spires. Near Black Hills riding — SD\'s best riding area.' },
  { name: 'NF Dispersed — Custer NF', lat: 45.325, lng: -106.975, desc: 'Free camping in Custer Gallatin NF, MT. Beartooth Plateau area with alpine meadows. Near Red Lodge riding.' },
  { name: 'NF Dispersed — Thunder Basin', lat: 43.575, lng: -105.275, desc: 'Free camping in Thunder Basin NG, WY. High plains grassland. Remote and peaceful. Near Devils Tower and NE WY riding.' },
  { name: 'BLM Dispersed — Badlands', lat: 43.825, lng: -102.275, desc: 'Free BLM camping near Badlands NP, SD. Dramatic eroded landscape. Good overnight stop. Near SD 44 riding.' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO locations (
    name, latitude, longitude, category, sub_type,
    description, best_season, source, source_id
  ) VALUES (?, ?, ?, 'campsite', 'boondocking', ?, 'Year-round', 'agent-curated', ?)
`);

let count = 0;
const tx = db.transaction(() => {
  for (const s of spots) {
    const result = insert.run(
      s.name, s.lat, s.lng, s.desc,
      `boondock3-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Boondocking batch 3: Inserted ${count} of ${spots.length} spots`);
db.close();
