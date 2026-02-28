import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

// Curated high-quality boondocking/dispersed camping spots near riding areas
// These are well-known free camping spots frequented by overlanders and riders
const spots = [
  // === ARIZONA (prime boondocking state) ===
  { name: 'Ghost Town Road BLM — Wickenburg', lat: 33.925, lng: -112.785, desc: 'Popular free dispersed camping on BLM land north of Wickenburg. Flat desert terrain, great sunsets. Close to Vulture Mine Road riding. 14-day limit.' },
  { name: 'Dome Rock BLM — Quartzsite', lat: 33.695, lng: -114.245, desc: 'Large BLM dispersed area near Quartzsite. Flat desert with mountain views. Very popular snowbird spot Jan-Feb. Close to KOFA riding.' },
  { name: 'Darby Well Road BLM — Ajo', lat: 32.375, lng: -112.875, desc: 'Free camping on BLM land south of Ajo. Desert valley with mountain backdrop. Near Organ Pipe National Monument riding areas.' },
  { name: 'Potato Patch BLM — Prescott', lat: 34.565, lng: -112.545, desc: 'Dispersed camping in Prescott NF at 7,600ft. Ponderosa pine forest, cool summer temps. Close to Prescott NF trail system.' },
  { name: 'Scaddan Wash BLM — Lake Havasu', lat: 34.545, lng: -114.295, desc: 'Free BLM camping near Lake Havasu City. Desert terrain with wash access. Near Cattail Cove and desert riding areas.' },
  { name: 'Saddle Mountain BLM — Tonopah', lat: 33.475, lng: -112.875, desc: 'BLM dispersed camping west of Phoenix. Remote desert setting with Saddle Mountain views. Good staging for desert riding.' },
  { name: 'Snyder Hill BLM — Tucson', lat: 32.185, lng: -111.125, desc: 'Free BLM camping minutes from Tucson. Popular with locals. Saguaro cactus landscape. Near Tucson Mountain riding.' },

  // === UTAH ===
  { name: 'BLM Dispersed — Moab (Willow Springs)', lat: 38.625, lng: -109.625, desc: 'Free BLM camping off Willow Springs Road north of Moab. Easy access to Slickrock Trail and Moab riding areas. Can be busy in season.' },
  { name: 'BLM Dispersed — Hurricane Cliffs', lat: 37.125, lng: -113.325, desc: 'Free camping near Hurricane, UT. Red rock desert with views of Zion area mountains. Close to Warner Valley riding.' },
  { name: 'BLM Dispersed — Green River', lat: 38.975, lng: -110.175, desc: 'Free camping near Green River, UT. Desert terrain between Moab and Capitol Reef. Good staging for San Rafael Swell riding.' },
  { name: 'Lone Rock Beach — Lake Powell', lat: 37.025, lng: -111.525, desc: 'Free BLM beach camping on Lake Powell shore. Drive right onto the sand. Stunning setting. Near Glen Canyon riding.' },

  // === CALIFORNIA ===
  { name: 'Alabama Hills BLM — Lone Pine', lat: 36.605, lng: -118.115, desc: 'Iconic free camping with Mt Whitney views. Movie Flat area has established spots. Amazing photography. Near Sierra dual sport routes.' },
  { name: 'Tuttle Creek BLM — Lone Pine', lat: 36.565, lng: -118.125, desc: 'Free BLM camping just south of Alabama Hills. Mountain creek setting. Less crowded than Movie Flat. Great riding staging.' },
  { name: 'Ocotillo Wells SVRA — Anza-Borrego', lat: 33.155, lng: -116.135, desc: 'Free open riding AND camping at this SVRA in the desert. Ride directly from camp. Sandy desert terrain. Popular winter destination.' },
  { name: 'Plaster City BLM — Imperial Valley', lat: 32.785, lng: -115.855, desc: 'Vast BLM open area near Glamis. Free camping with dune access. Popular with OHV riders. Winter season best.' },
  { name: 'Mammoth Lakes BLM — Glass Flow', lat: 37.675, lng: -118.935, desc: 'Free dispersed camping in volcanic terrain near Mammoth. Obsidian flows and pumice. Close to Mammoth dual sport routes. Summer only.' },

  // === NEVADA ===
  { name: 'BLM Dispersed — Lovell Canyon', lat: 36.125, lng: -115.625, desc: 'Free camping in Spring Mountains NRA near Las Vegas. Pine forest at elevation. Cool escape from desert heat. Near Mt Charleston riding.' },
  { name: 'Stovepipe Wells BLM', lat: 36.615, lng: -117.145, desc: 'Free BLM camping near Death Valley. Desert floor with mountain views. Close to Titus Canyon and Racetrack Valley.' },
  { name: 'Sand Mountain Recreation Area', lat: 39.275, lng: -118.425, desc: 'BLM recreation area east of Fallon, NV. Famous 600ft sand dune. Free camping in surrounding desert. OHV riding on dunes.' },

  // === COLORADO ===
  { name: 'BLM Dispersed — Fruita', lat: 39.175, lng: -108.775, desc: 'Free camping on BLM land near Fruita/Grand Junction. Close to 18 Road trail system and Kokopelli Trail. Desert terrain.' },
  { name: 'Dispersed — Kebler Pass', lat: 38.875, lng: -107.075, desc: 'Free forest camping along Kebler Pass road near Crested Butte. Aspen forest, mountain views. Close to CB trail system. Summer only.' },
  { name: 'Dispersed — Lake City', lat: 37.975, lng: -107.325, desc: 'Free forest camping near Lake City, CO. Alpine terrain, 9,000ft+. Close to Alpine Loop, Engineer Pass, Cinnamon Pass.' },

  // === NEW MEXICO ===
  { name: 'BLM Dispersed — Organ Mountains', lat: 32.275, lng: -106.575, desc: 'Free BLM camping east of Las Cruces near Organ Mountains-Desert Peaks NM. Desert terrain with dramatic mountain views.' },
  { name: 'NF Dispersed — Gila', lat: 33.375, lng: -108.675, desc: 'Free forest camping in Gila National Forest. Pine and mixed forest at elevation. Remote and peaceful. Near Gila trail system.' },
  { name: 'BLM Dispersed — Rio Puerco', lat: 35.125, lng: -107.075, desc: 'Free BLM camping west of Albuquerque off I-40. Desert terrain. Good overnight stop between AZ and points east.' },

  // === OREGON ===
  { name: 'BLM Dispersed — Alvord Desert', lat: 42.525, lng: -118.625, desc: 'Camp on the playa of Alvord Desert in SE Oregon. Surreal flat white desert with Steens Mountain backdrop. Near Steens Loop riding.' },
  { name: 'NF Dispersed — Bend', lat: 43.975, lng: -121.575, desc: 'Abundant free camping in Deschutes NF near Bend. Pine forest, volcanic terrain. Close to Oregon BDR and Central Oregon trails.' },

  // === IDAHO ===
  { name: 'BLM Dispersed — Bruneau Dunes', lat: 42.925, lng: -115.725, desc: 'Free BLM camping near Bruneau Dunes SP. Desert terrain with canyon views. Close to Bruneau Canyon and desert riding.' },
  { name: 'NF Dispersed — McCall', lat: 44.875, lng: -116.075, desc: 'Free forest camping in Payette NF near McCall, ID. Mountain lake setting. Close to extensive Payette NF trail system.' },

  // === MONTANA ===
  { name: 'NF Dispersed — Helena', lat: 46.625, lng: -112.075, desc: 'Free camping in Helena NF. Mountain forest with creek access. Close to Continental Divide riding and MacDonald Pass.' },
  { name: 'BLM Dispersed — Missouri Breaks', lat: 47.875, lng: -109.225, desc: 'Free BLM camping in the Missouri Breaks. Remote badlands terrain. Unique geological formations. Near Upper Missouri River riding.' },

  // === WYOMING ===
  { name: 'BLM Dispersed — Dubois', lat: 43.525, lng: -109.675, desc: 'Free BLM camping between Dubois and Riverton. Wind River Range views. Close to backcountry dual sport routes.' },
  { name: 'NF Dispersed — Big Horn Mountains', lat: 44.625, lng: -107.225, desc: 'Free forest camping in Bighorn NF. Mountain meadows and pine forest. Close to Cloud Peak Wilderness area riding.' },

  // === WASHINGTON ===
  { name: 'NF Dispersed — Cle Elum', lat: 47.225, lng: -121.025, desc: 'Free camping in Okanogan-Wenatchee NF near Cle Elum. Mountain forest setting. Close to Teanaway riding area and WA BDR.' },

  // === TEXAS ===  
  { name: 'BLM Dispersed — Big Bend Region', lat: 29.275, lng: -103.575, desc: 'Free BLM camping in the Chihuahuan Desert near Big Bend NP. Remote desert with mountain views. Near Old Ore Road and River Road.' },

  // === APPALACHIAN AREA ===
  { name: 'NF Dispersed — Cherokee NF', lat: 35.875, lng: -82.575, desc: 'Free forest camping in Cherokee NF near the TN/NC border. Appalachian mountain forest. Close to Cherohala Skyway and Forest Service trails.' },
  { name: 'NF Dispersed — Daniel Boone NF', lat: 37.775, lng: -83.625, desc: 'Free camping in Daniel Boone NF, KY. Cliff-lined gorges, waterfalls, hardwood forest. Near Redbird Crest Trail and KY riding.' },
  { name: 'NF Dispersed — George Washington NF', lat: 38.275, lng: -79.425, desc: 'Free camping in GW National Forest, VA. Shenandoah Valley access. Mountain terrain with great fall foliage. Near VA riding areas.' },
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
      s.name, s.lat, s.lng,
      s.desc,
      `boondock-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Boondocking import: Inserted ${count} of ${spots.length} dispersed camping spots`);
db.close();
