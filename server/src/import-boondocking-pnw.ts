import Database from 'better-sqlite3';
import path from 'path';
const db = new Database(path.join(__dirname, '..', 'trailcamp.db'));

const spots = [
  // OREGON
  { name: 'Dispersed — Newberry Volcanic Monument', lat: 43.725, lng: -121.225, desc: 'Free camping near Newberry Caldera, OR. Volcanic terrain with obsidian flows and crater lakes. Near La Pine riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Ochoco NF', lat: 44.325, lng: -120.275, desc: 'Free camping in Ochoco NF, central OR. Ponderosa pine with mountain meadows. Less crowded than Bend area. Near Ochoco riding.', season: 'May-Oct' },
  { name: 'BLM Dispersed — Hart Mountain', lat: 42.525, lng: -119.675, desc: 'Free BLM camping at Hart Mountain NAR, SE Oregon. Remote antelope country with hot springs. Near Plush and Lakeview riding.', season: 'May-Oct' },
  { name: 'NF Dispersed — Rogue River', lat: 42.425, lng: -123.125, desc: 'Free camping in Rogue River NF, southern OR. Mountain forest near Crater Lake. Near Upper Rogue riding.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Juntura', lat: 43.775, lng: -118.025, desc: 'Free BLM camping in eastern OR high desert. Remote rangeland with canyon access. Near Malheur riding country.', season: 'May-Oct' },
  { name: 'NF Dispersed — Willamette NF — McKenzie', lat: 44.175, lng: -122.025, desc: 'Free camping along McKenzie River in Willamette NF. Old-growth forest with waterfalls. Near Aufderheide riding.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Painted Hills', lat: 44.675, lng: -120.225, desc: 'Free BLM camping near Painted Hills NM. Colorful badlands landscape. Near Mitchell and John Day riding.', season: 'Apr-Oct' },
  { name: 'NF Dispersed — Wallowa-Whitman NF', lat: 45.275, lng: -117.275, desc: 'Free camping in Wallowa NF, NE Oregon. Alpine terrain, Eagle Cap views. Near Hells Canyon and NE Oregon riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Mt Jefferson', lat: 44.675, lng: -121.825, desc: 'Free camping in Willamette NF near Mt Jefferson Wilderness. Cascade mountain forest. Near Detroit Lake riding.', season: 'Jun-Oct' },

  // WASHINGTON
  { name: 'NF Dispersed — Gifford Pinchot NF', lat: 46.175, lng: -121.725, desc: 'Free camping in GP NF, southern WA. Mt Adams and Mt St Helens views. Near Randle and Lewis River riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Colville NF', lat: 48.575, lng: -117.875, desc: 'Free camping in Colville NF, NE Washington. Remote pine forest with lakes. Near Colville and Republic riding.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Juniper Dunes', lat: 46.575, lng: -118.675, desc: 'Free BLM camping near Juniper Dunes Wilderness, eastern WA. Desert dunes landscape. Near Pasco and Tri-Cities.', season: 'Mar-Nov' },
  { name: 'NF Dispersed — Wenatchee NF — Blewett', lat: 47.525, lng: -120.625, desc: 'Free forest camping along Blewett Pass in Wenatchee NF. Mountain pass terrain. Near Liberty and Swauk riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Olympic NF — Hoh', lat: 47.825, lng: -123.875, desc: 'Free camping in Olympic NF near Hoh Rainforest. Temperate rainforest, incredibly lush. Near Olympic Peninsula riding.', season: 'Jun-Oct' },

  // MONTANA
  { name: 'NF Dispersed — Gallatin NF', lat: 45.525, lng: -111.075, desc: 'Free camping in Gallatin NF near Bozeman. Mountain terrain with rivers. Near Gallatin Valley and Bridger riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Kootenai NF', lat: 48.225, lng: -115.775, desc: 'Free camping in Kootenai NF, NW Montana. Dense cedar forest with Cabinet Mountains. Remote and beautiful.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Havre', lat: 48.525, lng: -109.725, desc: 'Free BLM camping on the Hi-Line, north-central MT. Prairie grassland with Bears Paw Mountains. Remote Montana.', season: 'May-Oct' },
  { name: 'NF Dispersed — Lewis and Clark NF', lat: 47.275, lng: -110.875, desc: 'Free camping in Lewis and Clark NF near Great Falls. Rocky Mountain Front terrain. Near Bob Marshall Wilderness riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Deerlodge NF', lat: 46.125, lng: -112.725, desc: 'Free camping in Deerlodge NF between Butte and Anaconda. Historic mining country with mountain meadows.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Miles City', lat: 46.425, lng: -105.875, desc: 'Free BLM camping in eastern MT badlands near Miles City. Ponderosa pine breaks country. Near Terry Badlands.', season: 'May-Oct' },

  // IDAHO
  { name: 'NF Dispersed — Boise NF — Lowman', lat: 44.075, lng: -115.625, desc: 'Free camping in Boise NF near Lowman. Hot springs nearby, mountain forest. Near Idaho City and backcountry riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Caribou NF', lat: 42.625, lng: -111.525, desc: 'Free camping in Caribou NF, SE Idaho. Mountain terrain near Bear Lake. Near Paris and SE Idaho riding.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Craters of the Moon', lat: 43.425, lng: -113.575, desc: 'Free BLM camping near Craters of the Moon NM. Volcanic lava flows and cinder cones. Unique lunar landscape.', season: 'May-Oct' },
  { name: 'NF Dispersed — Clearwater NF — Lochsa', lat: 46.325, lng: -115.375, desc: 'Free camping along Lochsa River in Clearwater NF. Wild river corridor, old-growth cedar. Near Lolo Motorway riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Challis NF', lat: 44.525, lng: -114.225, desc: 'Free camping in Challis NF near Stanley. Sawtooth Valley access, alpine terrain. Near Yankee Fork and backcountry riding.', season: 'Jun-Oct' },

  // WYOMING
  { name: 'NF Dispersed — Bridger-Teton — Hoback', lat: 43.175, lng: -110.675, desc: 'Free camping along Hoback River in Bridger-Teton NF. Mountain canyon with river access. Near Jackson and Snake River riding.', season: 'Jun-Oct' },
  { name: 'BLM Dispersed — Cody', lat: 44.525, lng: -109.075, desc: 'Free BLM camping west of Cody, WY. Absaroka Range views, sagebrush prairie. Near Chief Joseph Highway riding.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Medicine Bow — Laramie', lat: 41.225, lng: -106.175, desc: 'Free camping in Medicine Bow NF near Laramie. Snowy Range alpine terrain at 10,000ft+. Near Centennial riding.', season: 'Jul-Sep' },
  { name: 'BLM Dispersed — South Pass', lat: 42.575, lng: -108.825, desc: 'Free BLM camping at South Pass, WY. Historic Oregon Trail crossing. High desert at 7,500ft. Near Atlantic City ghost town.', season: 'Jun-Oct' },
  { name: 'NF Dispersed — Shoshone NF', lat: 44.475, lng: -109.575, desc: 'Free camping in Shoshone NF between Cody and Yellowstone. Mountain forest with grizzly country. Near Sunlight Basin riding.', season: 'Jun-Oct' },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO locations (name, latitude, longitude, category, sub_type, description, best_season, source, source_id)
  VALUES (?, ?, ?, 'campsite', 'boondocking', ?, ?, 'agent-curated', ?)
`);

let count = 0;
const tx = db.transaction(() => {
  for (const s of spots) {
    const r = insert.run(s.name, s.lat, s.lng, s.desc, s.season, `boondock-pnw-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`);
    if (r.changes > 0) count++;
  }
});
tx();
console.log(`PNW Boondocking: Inserted ${count} of ${spots.length}`);
db.close();
