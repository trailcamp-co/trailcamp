#!/usr/bin/env node

// enhance-boondocking-reviews.js - Add detailed reviews/tips to top 20 boondocking spots

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'trailcamp.db');
const db = new Database(DB_PATH);

// Enhanced reviews for top 20 boondocking locations
const reviews = {
  'BLM — Alabama Hills Dispersed': {
    description: 'Iconic dispersed camping below the Eastern Sierra with jaw-dropping views of Mount Whitney. Hundreds of established sites among unique rock formations used in countless Western films.',
    notes: 'Best sites near Movie Road and Tuttle Creek. Arrive early (before 2pm) for prime spots with rock privacy. No water - bring everything. 14-day limit. Crowded weekends - weekdays better. Sunrise on Whitney is spectacular. Rock climbing world-class. Town of Lone Pine 3 miles for supplies.'
  },
  'BLM — Alabama Hills West': {
    description: 'Western section of Alabama Hills with more privacy and solitude. Dramatic granite formations create natural campsites with incredible Sierra Nevada backdrop. Less crowded than eastern area.',
    notes: 'Access via Whitney Portal Road then west on dirt roads. Sites more spread out - better privacy. Same 14-day limit. No services - pack everything out. Lone Pine 5 miles. Best sunset spots on western hillsides. Mountain biking excellent. Watch for rattlesnakes in warmer months.'
  },
  'BLM — Alpine Loop Dispersed': {
    description: 'High-altitude dispersed camping along the Alpine Loop Scenic Byway in Colorado\'s San Juan Mountains. Stunning alpine meadows at 11,000+ feet with 360-degree mountain views.',
    notes: 'Short season: late June-September (snow before/after). Multiple pullouts along Engineer and Cinnamon Pass roads. Level sites limited - arrive early. Afternoon thunderstorms common - set up early. Lake City or Silverton for supplies. 4WD recommended. Wildflowers peak July. Freezing temps possible any night.'
  },
  'BLM — Alpine Plateau Dispersed': {
    description: 'Remote high-desert plateau camping in Colorado\'s western slope. Expansive views, dark skies, and total solitude. True wilderness experience with zero light pollution.',
    notes: 'Very remote - GPS essential. Nearest services 40+ miles. Bring all water. Sites anywhere on BLM land - pick scenic ridge. Weather can change rapidly. Spring/fall best. Summer hot days, cold nights. Incredible star gazing. Popular with hunters in fall. Cell service: none.'
  },
  'BLM — Burr Trail Dispersed': {
    description: 'Dispersed sites along Utah\'s legendary Burr Trail between Boulder and Capitol Reef. Red rock canyons, slickrock, and remote desert beauty. One of Utah\'s most scenic backways.',
    notes: 'Best sites near Deer Creek or Long Canyon pullouts. Partially paved, gravel sections. Any vehicle OK in dry weather. Flash flood danger in canyons - check forecast. Boulder for last supplies. 14-day limit. Spring (Mar-May) and fall (Sep-Nov) ideal. Summer extremely hot. Petroglyphs nearby.'
  },
  'BLM — Castle Valley': {
    description: 'Iconic red rock valley near Moab with free dispersed camping below Castle Rock and The Priest and Nuns formations. Colorado River views and easy access to world-class riding.',
    notes: 'Sites along Castle Valley Road - some reserved for long-term. Best views on eastern side. Moab 20 minutes for supplies. Popular with climbers and dirt bikers. Can be dusty and windy. Quiet hours enforced. Composting toilet available. Professor Valley nearby for variety. Spring/fall peak seasons - crowded.'
  },
  'BLM — Cathedral Valley Dispersed': {
    description: 'Remote dispersed camping in Capitol Reef\'s Cathedral Valley district. Otherworldly monoliths, total isolation, and some of Utah\'s most dramatic desert scenery.',
    notes: '4WD REQUIRED - Hartnet Road very rough. River crossing usually passable spring-fall. No services within 50 miles. Bring all water and fuel. Sites scattered throughout valley. Camp near monoliths for sunrise/sunset magic. Torrey for last supplies. Permit not required but sign in at ranger station.'
  },
  'BLM — Chicken Corners': {
    description: 'Moab area dispersed camping along the famous Chicken Corners 4x4 trail. Clifftop campsites with 1,000-foot views down to Colorado River. Epic sunsets and proximity to Moab trails.',
    notes: 'Access via Lockhart Basin Road - high clearance helpful. Sites along cliffedge - not for those afraid of heights! Very popular - arrive early or go midweek. Moab 30 minutes. No water - pack in. Can be windy. Watch for ledges at night. Mountain biking trails abundant. Spring/fall busy, summer scorching.'
  },
  'BLM — Cumberland Pass Dispersed': {
    description: 'High alpine dispersed camping near Cumberland Pass in Colorado\'s Sawatch Range. Wildflower meadows, aspen groves, and 12,000+ foot peaks. Peaceful and scenic.',
    notes: 'Season: July-September. Rough dirt road - high clearance recommended. Sites near pass summit or along creeks lower. Pitkin for limited supplies. Afternoon storms - set up by noon. Mosquitoes early season. Fall colors spectacular (late September). Free. Fishing in nearby streams. Cold nights - bring warm gear.'
  },
  'BLM — Lake City Dispersed': {
    description: 'Dispersed camping around Lake City, Colorado in the heart of the San Juans. Alpine setting with creek access, wildflowers, and mountain views. Gateway to Engineer and Cinnamon Pass.',
    notes: 'Sites along Lake Fork Gunnison River and nearby forest roads. Lake City 5-10 minutes for supplies. Popular with OHV riders and fishermen. Level sites near river go fast. Season: June-September. Bears active - food storage required. Free. Well water in town. Connects to Alpine Loop trails.'
  },
  'BLM — Ophir Pass Dispersed': {
    description: 'Dramatic high-altitude camping along Ophir Pass road between Silverton and Telluride. Waterfalls, alpine tundra, and mining ruins. One of Colorado\'s most scenic passes.',
    notes: '4WD required west of summit. Season: July-September. Sites scattered along road - some near waterfalls. Silverton or Telluride for supplies. Afternoon lightning - park early. Narrow shelf road sections. Amazing wildflowers. Freezing temps possible year-round. Free. Mountain goats sometimes visible. Rugged and remote.'
  },
  'BLM — Ophir Valley Dispersed': {
    description: 'Secluded valley camping below Ophir Pass on Telluride side. Old mining ghost town nearby, aspen groves, and cascading creeks. Less crowded than summit area.',
    notes: 'Access from Telluride via gravel road. Easier than summit - 2WD OK in dry weather. Sites in valley near old Ophir townsite. Season: June-September. Creekside spots most scenic. Telluride 20 minutes. Free. Hiking to waterfalls nearby. Fall aspen colors incredible. Can be muddy after rain.'
  },
  'BLM — Racetrack Road': {
    description: 'Death Valley\'s most mysterious dispersed camping area near the famous sailing stones of Racetrack Playa. Remote, stark, and utterly unique landscape.',
    notes: '4WD REQUIRED - very rough 27-mile road from Ubehebe Crater. Bring all water and fuel. No services within 80 miles. Camping allowed on playa edges. Best winter/spring (Oct-April). Summer lethal (120°F+). Stones move in winter with ice. Incredible stars. Totally isolated. Park entry fee required. Stovepipe Wells for last supplies.'
  },
  'BLM — Sand Flats Recreation Area': {
    description: 'Moab\'s premier dispersed camping area adjacent to Slickrock Bike Trail and dirt bike trails. Red rock slickrock camping with views of La Sal Mountains.',
    notes: '$15/night fee collected by campground host. Sites scattered across slickrock - pick your spot. Vault toilets available. No water - bring it. Moab 10 minutes. Very popular with mountain bikers and motorcycle riders. Book ahead weekends. Spring/fall peak season. Summer hot. Views spectacular at sunset.'
  },
  'BLM — Sedona Dispersed': {
    description: 'Free dispersed camping in Sedona\'s red rock country with vortex energy and stunning formations. Multiple areas offering different vibes and scenery.',
    notes: 'Popular areas: Schnebly Hill Road, Boynton Canyon, FR 525. 14-day limit. High clearance helpful for best sites. Sedona very close for supplies/restaurants. Extremely popular - arrive before noon for good spots. Spiritual vibe. Hiking trails everywhere. Spring/fall busy. Rangers patrol for violations. Pack out all trash.'
  },
  'BLM — Silverton Dispersed': {
    description: 'High-altitude dispersed camping around the historic mining town of Silverton. Alpine meadows, old mines, and access to multiple mountain passes.',
    notes: 'Sites along Mineral Creek and nearby forest roads. Silverton for supplies. Season: June-September. Snow possible year-round. Free. Popular with Jeepers and dirt bikers. Level sites limited. Creek sites nicest. Bears present - store food properly. Afternoon storms common. Gateway to Alpine Loop and Ophir Pass.'
  },
  'Beartooth Highway Dispersed — Red Lodge': {
    description: 'Epic high-altitude dispersed camping along the Beartooth Scenic Byway. Alpine tundra, glacial lakes, and some of America\'s most dramatic mountain scenery at 10,000+ feet.',
    notes: 'Season: late June-September (snow closes road). Sites at pullouts with alpine lakes. Red Lodge or Cooke City for supplies. Afternoon thunderstorms daily - set up early. Freezing temps every night. Grizzly country - bear spray and food storage required. Unbelievable scenery. Highway of switchbacks. Free. Fishing excellent.'
  },
  'Big Pine Creek Dispersed — Inyo NF': {
    description: 'Dispersed camping along Big Pine Creek Road below the Palisade Glacier. Eastern Sierra high country with creek access and views of 14,000-foot peaks.',
    notes: 'Sites along dirt road above Big Pine Creek Campground. Free. Season: May-October. Bishop or Big Pine for supplies. Very popular - arrive early. 14-day limit. Bear-proof containers required. Fishing good. Hiking to glacier starts here. Creek noise at night. Mosquitoes early season. Aspens beautiful in fall.'
  },
  'Calico Basin BLM — Red Rock Canyon': {
    description: 'Stunning red rock dispersed camping just outside Las Vegas. Dramatic formations, world-class climbing, and desert beauty. Surprisingly peaceful despite proximity to city.',
    notes: 'Sites along dirt roads in basin. First-come. Popular with climbers - very crowded weekends. Vegas 30 minutes. No water - bring it. 14-day limit. Rangers patrol. Pack out trash. Spring (Mar-May) and fall (Sep-Nov) ideal. Summer dangerously hot. Winter can be cold. Rock climbing incredible. Dawn colors spectacular.'
  },
  'Cinnamon Pass Dispersed — Lake City': {
    description: 'Colorado\'s highest and most spectacular dispersed camping along Cinnamon Pass at 12,600 feet. Above treeline tundra, mining ruins, and 360-degree mountain views.',
    notes: '4WD required. Season: July-September only. Very rough road. Sites near summit or meadows below. Lake City for supplies. Altitude sickness possible - acclimate first. Freezing every night. Afternoon lightning storms - tent by noon. Wildflowers peak July-August. Free. No cell service. Unbelievably scenic. Can connect to Engineer Pass loop.'
  }
};

console.log('Enhancing top 20 boondocking locations with detailed reviews...\n');

const updateStmt = db.prepare(`
  UPDATE locations 
  SET description = ?,
      notes = ?
  WHERE name = ? AND category = 'campsite' AND sub_type = 'boondocking'
`);

let updated = 0;
const updateMany = db.transaction(() => {
  for (const [name, content] of Object.entries(reviews)) {
    try {
      const result = updateStmt.run(content.description, content.notes, name);
      if (result.changes > 0) {
        updated++;
        console.log(`✓ ${name}`);
      } else {
        console.log(`⚠ Not found: ${name}`);
      }
    } catch (err) {
      console.error(`✗ Failed to update ${name}: ${err.message}`);
    }
  }
});

updateMany();

console.log(`\n✓ Enhanced ${updated}/${Object.keys(reviews).length} locations`);

// Get sample of updated location
const sample = db.prepare(`
  SELECT name, LENGTH(description) as desc_len, LENGTH(notes) as notes_len
  FROM locations
  WHERE name = 'BLM — Alabama Hills Dispersed'
`).get();

if (sample) {
  console.log(`\nSample (Alabama Hills):`);
  console.log(`- Description: ${sample.desc_len} characters`);
  console.log(`- Notes: ${sample.notes_len} characters`);
}

db.close();
console.log('\n✓ Done!');
