#!/usr/bin/env node

// enhance-boondocking-reviews.js - Add detailed reviews/tips to top 20 boondocking spots

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'trailcamp.db');
const db = new Database(DB_PATH);

// Detailed reviews for top boondocking locations
const reviews = {
  5978: {
    // Takhlakh Lake Dispersed — Gifford Pinchot
    notes: `EPIC Mount Adams views from lakeside dispersed sites. Access via FR 2329 (graded gravel, 2WD OK in summer). Best sites along south shore with unobstructed views. Level pull-offs for campers up to 30ft. Water: lake (filter/treat). Cell: none. Crowds: moderate on weekends, peaceful midweek. Vault toilet at nearby campground. Stay limit: 14 days. Best time: July-Sept (snow closes road Oct-June). Tip: Arrive early Friday for premium lakeside spots. Sunset photography is incredible. Bears active - proper food storage required.`
  },
  5984: {
    // North Fork Flathead Dispersed
    notes: `Remote wilderness camping along crystal-clear Flathead River near Glacier NP. Access via North Fork Road (gravel, washboards, high-clearance recommended). Multiple dispersed sites along river - best spots at pullouts north of Polebridge. Level ground varies - scout before setting up. Water: river (filter). Cell: none. Crowds: low. No facilities. Stay limit: 16 days. Best time: June-Sept. Tip: Fuel up in Columbia Falls - no services until Polebridge (limited). Grizzly country - bear spray and food storage critical. Incredible stargazing. Popular base camp for Glacier backcountry access.`
  },
  6051: {
    // Calico Basin BLM — Red Rock Canyon  
    notes: `Las Vegas area boondocking with world-class red rock scenery. Access off Calico Basin Road (paved, easy 2WD). Multiple BLM sites along Sandstone Drive and side roads. Level sites common. Water: none (bring all you need). Cell: good Verizon/AT&T. Crowds: heavy on weekends. Stay limit: 14 days. Best time: Oct-Apr (summer is dangerously hot 110°F+). Tip: Arrive Wed-Thu for weekend spot. Popular with rock climbers. Town 15min (supplies, dining). Respect quiet hours - residential nearby. Free climbing at Kraft Boulders. Excellent winter base camp.`
  },
  6141: {
    // Convict Lake Dispersed — Eastern Sierra
    notes: `Stunning Eastern Sierra lake with jagged peaks backdrop. Access via Convict Lake Road off US-395 (paved, easy). Dispersed sites on forest roads above the lake. Level sites available but limited. Water: lake or creek (filter). Cell: fair. Crowds: moderate-heavy. Vault toilet at trailhead. Stay limit: 14 days. Best time: June-Oct (high elevation, snow other months). Tip: Lake shore is $$ campground - free dispersed camping on surrounding forest roads. Exceptional fall colors. World-class fishing. Bears active - use bear box or canister. Close to Mammoth Lakes (30min).`
  },
  6142: {
    // Rock Creek Lake Dispersed — Inyo NF
    notes: `High alpine paradise at 9,600ft with Sierra peaks. Access via Rock Creek Road (paved to lake, gravel side roads). Dispersed sites on forest roads near Tom's Place and above lake. Level sites require scouting. Water: creek (filter). Cell: spotty. Crowds: moderate. Some vault toilets nearby. Stay limit: 14 days. Best time: July-Sept (snow-free window is short). Tip: Altitude can affect sleep - acclimate slowly. Incredible fishing in alpine lakes. Mosquitoes bad early season. Bears common - proper storage required. Cool nights even in summer.`
  },
  6144: {
    // Glacier Point Road Dispersed — Yosemite Area
    notes: `Yosemite area dispersed camping with Half Dome/Valley views. Access via Glacier Point Road (paved but closed in winter). Dispersed sites on forest roads branching off main road. Level sites available. Water: seasonal creeks (filter). Cell: poor. Crowds: heavy summer. Vault toilets at Glacier Point. Stay limit: 14 days. Best time: June-Oct (road closed Nov-May). Tip: Arrive midweek for good sites. Free alternative to Yosemite campgrounds. Bears very active - bear canister required. Stargazing is world-class. Close to valley but quieter.`
  },
  6145: {
    // Big Pine Creek Dispersed — Inyo NF
    notes: `Eastern Sierra treasure with Palisade Glacier access. Access via Glacier Lodge Road (paved lower, gravel upper). Dispersed sites along creek and side roads. Level sites sparse - most are sloped. Water: creek (filter, cold!). Cell: poor. Crowds: moderate. Vault toilet at trailhead. Stay limit: 14 days. Best time: June-Sept. Tip: Lower elevation sites more level. Popular trailhead for North Palisade climbers. Bears active - use bear box at trailhead or canister. Cool nights at 7,800ft. Big Pine town 15min (supplies). Mosquitoes early season.`
  },
  6146: {
    // Horseshoe Meadow Dispersed — Whitney Area
    notes: `Mount Whitney area high-altitude basecamp at 10,000ft. Access via Horseshoe Meadow Road (paved, steep final miles). Dispersed sites near trailhead and along road. Mostly level. Water: seasonal creek (filter) or bring. Cell: none. Crowds: heavy July-Sept. Vault toilets at trailhead. Stay limit: 1 night at trailhead lot, 14 days on forest roads. Best time: July-Sept. Tip: Altitude sickness common at 10K - acclimate in Lone Pine first. Popular Whitney Portal alternative. Bring warm gear - freezing nights possible even summer. Fill water in Lone Pine (30min down).`
  },
  6148: {
    // Saddlebag Lake Dispersed — Tioga Pass
    notes: `Highest drive-to lake in CA at 10,087ft. Access via Saddlebag Lake Road off Tioga Pass (paved, closed Oct-June). Limited dispersed sites - mostly at resort overflow. Water: lake (filter). Cell: none. Crowds: very heavy (popular trailhead). Vault toilets at resort. Stay limit: varies. Best time: July-Sept (short season). Tip: Arrive very early or midweek - fills fast. Alternative to Tuolumne Meadows. Altitude affects everyone - take it slow. Resort has small store (limited, expensive). Incredible 20 Lakes Basin backpacking access. Mosquitoes brutal early season.`
  },
  6149: {
    // Kirk Creek BLM — Big Sur Coast
    notes: `Legendary Big Sur ocean camping with sunset views. Access off Highway 1 (paved, winding). BLM sites just south of Kirk Creek Campground. Level sites above cliffs. Water: none (bring all). Cell: spotty Verizon. Crowds: HEAVY weekends/summer. Stay limit: 14 days. Best time: April-Oct (winter storms close Hwy 1). Tip: Scout sites carefully - steep cliffs dangerous. Arrive weekdays for chance at spots. Free alternative to $$ Kirk Creek CG. Foggy mornings common. Powerful surf - swimming dangerous. Town 45min either direction. Incredible sunsets.`
  },
  6151: {
    // King Range BLM — Lost Coast
    notes: `California's most remote coastline. Access via rough dirt roads from Shelter Cove (4WD/high-clearance needed, slow going). Multiple dispersed sites near beaches and ridges. Level sites rare - mostly sloped. Water: streams (filter). Cell: none. Crowds: low (remoteness filters crowds). No facilities. Stay limit: 14 days. Best time: Apr-Oct (winter storms brutal). Tip: Fuel in Garberville (1.5hrs) - no services past there. Tides matter for beach driving. Wildlife abundant (elk, bears). Bring everything - nearest store 1+ hour. Epic solitude and scenery.`
  },
  6166: {
    // Engineer Pass Dispersed — Ouray
    notes: `Colorado alpine pass at 12,800ft - highest on this list. Access via 4WD road from Animas Forks or Lake City (high-clearance mandatory, technical). Dispersed sites near pass summit. Not level - challenging setup. Water: snowmelt streams (filter). Cell: none. Crowds: moderate with Jeep tours. No facilities. Stay limit: 14 days. Best time: July-Aug (snow lingers late, arrives early). Tip: Serious 4WD skills required - not for beginners. Altitude sickness very common. Incredible views but harsh conditions. Bring cold weather gear. San Juan scenery is unmatched.`
  },
  6167: {
    // Ophir Pass Dispersed — Telluride
    notes: `Telluride backcountry access at 11,789ft. Access via Ophir Pass Road (4WD, rocky, high-clearance needed). Sites near pass and along road. Sloped terrain. Water: streams (filter). Cell: none. Crowds: moderate summer. No facilities. Stay limit: 14 days. Best time: July-Sept. Tip: Easier from Silverton side than Ophir side. Popular with OHV riders and Jeepers. Cold nights guaranteed even July. Views of surrounding 13ers and 14ers. Wildflowers peak late July. Close to Black Bear Pass (viewing only - no camping there). Telluride 45min (supplies).`
  },
  6168: {
    // Cinnamon Pass Dispersed — Lake City
    notes: `Remote San Juan high pass at 12,640ft. Access via Alpine Loop (4WD only, technical sections). Sites near pass and along road. Challenging terrain for setup. Water: alpine streams (filter). Cell: none. Crowds: light-moderate. No facilities. Stay limit: 14 days. Best time: mid-July to mid-Sept (short window). Tip: Do NOT attempt in storms - above treeline exposure. Popular loop: Lake City → Cinnamon → Silverton → Engineer → Lake City. Altitude affects vehicles too - expect power loss. Stunning wildflowers. History: mining ruins visible. Very remote - be self-sufficient.`
  },
  6173: {
    // Beartooth Highway Dispersed — Red Lodge
    notes: `Montana/Wyoming alpine highway at 10,000ft+. Access via US-212 (paved but closed Oct-May). Dispersed sites on forest roads off highway. Level sites exist but competitive. Water: alpine lakes/streams (filter). Cell: poor-none. Crowds: heavy summer weekends. Some vault toilets. Stay limit: 16 days. Best time: July-Sept. Tip: "Most beautiful drive in America" - expect traffic. Arrive early for lakeside sites. Beartooth Pass summit (10,947ft) is above. Cold nights common. Mosquitoes early season. Fishing excellent. Close to Yellowstone NE entrance. Grizzly country - proper food storage critical.`
  },
  6247: {
    // BLM — Sedona Dispersed
    notes: `Red rock paradise near Sedona. Access via FR 525 and FR 152 (graded dirt, 2WD dry conditions). Dozens of dispersed sites with red rock views. Level sites common. Water: none (Sedona 15min). Cell: good. Crowds: EXTREME (overflow from town). Stay limit: 14 days, 28 days/year limit. Best time: Oct-Apr (summer too hot). Tip: Arrive Mon-Wed for weekend spots or forget it. Popular "free Sedona camping". Enforce quiet hours - close to neighborhoods. Town very touristy/expensive. Sunset views incredible. Hiking trails accessible. Vault toilet at some areas.`
  },
  6270: {
    // BLM — Alabama Hills West
    notes: `Iconic Eastern Sierra location with Whitney backdrop and movie history. Access off Whitney Portal Road (paved, then dirt BLM roads - 2WD OK). Countless dispersed sites among granite boulders. Level sites common. Water: none (Lone Pine 10min). Cell: good. Crowds: very heavy. Vault toilets (often full/dirty). Stay limit: 14 days. Best time: Oct-Apr (hot summer, cold winter). Tip: Hundreds of films shot here - explore movie sites. Sunrise on Whitney is legendary. Popular rock climbing. Crowded but spread out. Lone Pine has full services. Incredible stargazing.`
  },
  6276: {
    // BLM — Racetrack Road
    notes: `Death Valley remote playa with "sailing stones" phenomenon. Access via Racetrack Road (rough washboards, high-clearance recommended). Limited dispersed sites before playa. Level if you choose right. Water: NONE (bring all - nearest 2+ hours). Cell: none. Crowds: surprisingly moderate (remoteness filters). No facilities. Stay limit: 30 days. Best time: Nov-Mar (summer kills - 120°F+). Tip: Fuel up in Beatty - 90+ miles to playa. Road rough but doable in SUV carefully. Stones only "sail" with rare rain + wind + ice combo. Incredible solitude. Night sky is world-class.`
  },
  6289: {
    // BLM — Sand Flats Recreation Area
    notes: `Moab area slickrock camping near world-famous trails. Access off Sand Flats Road (paved then graded dirt, 2WD OK). Multiple campgrounds + dispersed sites. Level sandstone slabs. Water: none (Moab 10min). Cell: fair. Crowds: heavy (Slickrock Trail is legendary). Vault toilets, fee area ($$$). Stay limit: 14 days. Best time: Mar-May, Sept-Nov (summer brutal 100°F+). Tip: Fee required even for dispersed ($20/night). Mountain bike mecca - Slickrock Trail is bucket list. Incredible sunset/sunrise. Town close for supplies/dining. Spring break is zoo - avoid. Rock camping unique.`
  },
  6291: {
    // BLM — Chicken Corners
    notes: `Moab backcountry 4WD road with Colorado River views. Access via Chicken Corners Trail (4WD, rocky, high-clearance needed). Dispersed sites along route and at Chicken Corners viewpoint. Challenging terrain for larger rigs. Water: none (bring all). Cell: none. Crowds: light (4WD filters crowds). No facilities. Stay limit: 14 days. Best time: Mar-May, Sept-Nov. Tip: Named for drivers who "chicken out" on narrow shelf road sections. White Rim Trail connects nearby. Popular Jeep/motorcycle route. River views incredible. Hot in summer. Bring recovery gear. Potash boat ramp access alternate route. Very remote feel despite proximity to Moab.`
  }
};

console.log('Enhancing top 20 boondocking locations with detailed reviews...\n');

const updateStmt = db.prepare('UPDATE locations SET notes = ? WHERE id = ?');
const getStmt = db.prepare('SELECT name FROM locations WHERE id = ?');

let updated = 0;
const updateMany = db.transaction(() => {
  for (const [id, data] of Object.entries(reviews)) {
    try {
      const location = getStmt.get(id);
      if (location) {
        updateStmt.run(data.notes, id);
        updated++;
        console.log(`✓ ${location.name}`);
      } else {
        console.error(`✗ Location ID ${id} not found`);
      }
    } catch (err) {
      console.error(`✗ Failed to update ID ${id}: ${err.message}`);
    }
  }
});

updateMany();

console.log(`\n✓ Enhanced ${updated}/20 boondocking locations with detailed reviews`);

// Verify updates
const avgLength = db.prepare(`
  SELECT AVG(LENGTH(notes)) as avg_notes
  FROM locations
  WHERE id IN (5978,5984,6051,6141,6142,6144,6145,6146,6148,6149,6151,6166,6167,6168,6173,6247,6270,6276,6289,6291)
`).get();

console.log(`Average notes length for enhanced locations: ${Math.round(avgLength.avg_notes)} chars`);

db.close();
