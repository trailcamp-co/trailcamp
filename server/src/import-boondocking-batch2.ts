import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

const spots = [
  // === NEVADA (huge BLM state, underrepresented) ===
  { name: 'BLM Dispersed — Unionville', lat: 40.825, lng: -117.725, desc: 'Remote Nevada ghost town area. Free BLM camping with mountain backdrop. Near Star Peak and Humboldt Range riding.' },
  { name: 'BLM Dispersed — Pyramid Lake', lat: 40.025, lng: -119.475, desc: 'Free BLM camping near Pyramid Lake, NV. Desert terrain with stunning tufa formations. Near Peavine Mountain riding.' },
  { name: 'BLM Dispersed — Tonopah', lat: 38.075, lng: -117.225, desc: 'Free camping near Tonopah, NV. High desert terrain at 6,000ft. Good overnight between Reno and Vegas. Near Tonopah riding trails.' },
  { name: 'BLM Dispersed — Beatty', lat: 36.925, lng: -116.775, desc: 'Free camping near Death Valley gateway town. Desert terrain, quiet, scenic. Near Rhyolite ghost town and Titus Canyon riding.' },
  { name: 'BLM Dispersed — Austin Summit', lat: 39.475, lng: -117.075, desc: 'High desert BLM camping along US-50 (Loneliest Road). Mountain views, cool nights. Near Austin riding trails and Toiyabe NF.' },

  // === MONTANA ===
  { name: 'NF Dispersed — Bitterroot Valley', lat: 46.375, lng: -114.025, desc: 'Free camping in Bitterroot NF, MT. Mountain river valley, pine forest. Close to Bitterroot riding and Montana BDR south section.' },
  { name: 'NF Dispersed — Flathead Lake', lat: 47.875, lng: -114.075, desc: 'Free forest camping near Flathead Lake. Mountain forest with lake views. Close to Swan Range riding and Glacier area.' },
  { name: 'BLM Dispersed — Dillon', lat: 45.225, lng: -112.625, desc: 'Free BLM camping in southwest MT. Open rangeland with mountain views. Near Pioneer Mountains riding and Continental Divide.' },
  { name: 'NF Dispersed — Seeley Lake', lat: 47.175, lng: -113.475, desc: 'Free forest camping in Lolo NF near Seeley Lake. Beautiful mountain lake setting. Close to extensive Lolo NF trail network.' },

  // === WYOMING ===
  { name: 'NF Dispersed — Pinedale', lat: 42.825, lng: -109.875, desc: 'Free camping in Bridger-Teton NF near Pinedale. Wind River Range views, alpine meadows. Close to Wyoming BDR and backcountry.' },
  { name: 'BLM Dispersed — Lander', lat: 42.825, lng: -108.775, desc: 'Free BLM camping near Lander, WY. Gateway to Wind River Range. Near Sinks Canyon and Red Canyon riding.' },
  { name: 'NF Dispersed — Sheridan', lat: 44.825, lng: -107.075, desc: 'Free forest camping in Bighorn NF west of Sheridan. Mountain forest with meadows. Close to Cloud Peak Wilderness riding.' },

  // === OREGON ===
  { name: 'NF Dispersed — Mt Hood', lat: 45.325, lng: -121.775, desc: 'Free camping in Mt Hood NF. Volcanic mountain forest with views of Mt Hood. Close to extensive forest road riding network.' },
  { name: 'BLM Dispersed — Steens Mountain', lat: 42.625, lng: -118.575, desc: 'Free BLM camping on Steens Mountain, OR. Remote high desert with stunning views of Alvord Desert. Near Steens Loop riding.' },
  { name: 'NF Dispersed — Umpqua', lat: 43.275, lng: -122.375, desc: 'Free camping in Umpqua NF. Old-growth forest with waterfalls. Near Oregon BDR central section and forest road riding.' },
  { name: 'BLM Dispersed — Christmas Valley', lat: 43.225, lng: -120.675, desc: 'Free BLM camping in high desert of central OR. Unique landscape with sand dunes, hot springs nearby. Near Christmas Valley riding.' },

  // === IDAHO ===
  { name: 'NF Dispersed — Stanley', lat: 44.225, lng: -114.975, desc: 'Free camping in Sawtooth NF near Stanley, ID. Spectacular mountain scenery, Sawtooth Range views. Close to Idaho BDR and backcountry.' },
  { name: 'NF Dispersed — Salmon', lat: 45.175, lng: -113.925, desc: 'Free forest camping near Salmon, ID. Gateway to Frank Church Wilderness. Remote mountain riding paradise.' },
  { name: 'BLM Dispersed — Twin Falls', lat: 42.575, lng: -114.475, desc: 'Free BLM camping in Snake River Plain. Desert terrain with canyon views. Near Twin Falls OHV areas and Shoshone riding.' },

  // === WASHINGTON ===
  { name: 'NF Dispersed — Winthrop', lat: 48.475, lng: -120.175, desc: 'Free camping in Okanogan NF near Winthrop, WA. Mountain forest with creek access. Close to Methow Valley and WA BDR north.' },
  { name: 'NF Dispersed — Ellensburg', lat: 46.975, lng: -120.575, desc: 'Free forest camping in Wenatchee NF near Ellensburg. Pine forest with mountain views. Near Manastash Ridge riding.' },

  // === COLORADO ===
  { name: 'NF Dispersed — Buena Vista', lat: 38.825, lng: -106.125, desc: 'Free camping in San Isabel NF near Buena Vista. Arkansas River valley, 14er views. Close to Monarch Pass and Colorado BDR.' },
  { name: 'BLM Dispersed — Gunnison', lat: 38.525, lng: -106.925, desc: 'Free BLM camping near Gunnison. Mountain valley terrain at 7,700ft. Close to Hartman Rocks riding and Taylor Park.' },
  { name: 'NF Dispersed — Durango', lat: 37.325, lng: -107.825, desc: 'Free camping in San Juan NF near Durango. Mountain forest with mine ruins. Close to Alpine Loop and Colorado BDR south.' },
  { name: 'BLM Dispersed — Naturita', lat: 38.225, lng: -108.575, desc: 'Free BLM camping near Naturita, CO. Red rock canyon terrain. Close to Paradox Valley riding and Tabeguache Trail.' },

  // === NEW MEXICO ===
  { name: 'NF Dispersed — Santa Fe NF', lat: 35.825, lng: -105.775, desc: 'Free forest camping in Santa Fe NF. Sangre de Cristo Mountains, pine forest at 8,000ft+. Close to Santa Fe riding trails.' },
  { name: 'BLM Dispersed — Truth or Consequences', lat: 33.225, lng: -107.275, desc: 'Free BLM camping near T or C, NM. Desert terrain with hot springs nearby. Close to Caballo riding and Black Range.' },
  { name: 'NF Dispersed — Cloudcroft', lat: 32.975, lng: -105.725, desc: 'Free camping in Lincoln NF near Cloudcroft. High altitude pine forest (8,600ft). Cool escape from desert heat. Near Sacramento Mtns riding.' },

  // === ARIZONA DEPTH ===
  { name: 'NF Dispersed — Payson', lat: 34.325, lng: -111.375, desc: 'Free camping in Tonto NF near Payson. Rim Country forest at 5,000ft. Close to Arizona Trail and Mogollon Rim riding.' },
  { name: 'BLM Dispersed — Congress', lat: 34.175, lng: -112.875, desc: 'Free BLM camping between Wickenburg and Prescott. Desert-to-forest transition. Near Date Creek and Weaver Mountains riding.' },
  { name: 'NF Dispersed — Alpine', lat: 33.875, lng: -109.125, desc: 'Free camping in Apache-Sitgreaves NF near Alpine, AZ. High mountain meadows at 8,050ft. Near Blue Range Wilderness riding.' },

  // === UTAH DEPTH ===
  { name: 'BLM Dispersed — Kanab', lat: 37.075, lng: -112.525, desc: 'Free BLM camping near Kanab, UT. Red rock desert with access to Grand Staircase-Escalante. Near Kanab area riding.' },
  { name: 'BLM Dispersed — Price', lat: 39.625, lng: -110.775, desc: 'Free BLM camping in Castle Country near Price, UT. High desert with San Rafael Swell access. Near Nine Mile Canyon riding.' },

  // === CALIFORNIA DEPTH ===
  { name: 'NF Dispersed — Bridgeport', lat: 38.275, lng: -119.225, desc: 'Free camping in Humboldt-Toiyabe NF near Bridgeport, CA. Eastern Sierra meadows with mountain views. Near Bodie and dual sport routes.' },
  { name: 'BLM Dispersed — Ridgecrest', lat: 35.625, lng: -117.675, desc: 'Free BLM camping in Mojave Desert near Ridgecrest. Desert terrain with mountain views. Near Jawbone Canyon OHV riding.' },
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
      `boondock2-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`
    );
    if (result.changes > 0) count++;
  }
});
tx();

console.log(`Boondocking batch 2: Inserted ${count} of ${spots.length} spots`);
db.close();
