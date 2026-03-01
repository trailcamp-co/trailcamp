#!/usr/bin/env node

// import-forum-spots.js - Import 20 riding spots from forum research

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'trailcamp.db');
const db = new Database(DB_PATH);

const forumSpots = [
  {
    name: 'Natchaug State Forest - Wolf Den Loop',
    latitude: 41.8503,
    longitude: -72.1389,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Technical single track loop through historic Wolf Den area. Challenging rocky terrain with stream crossings and elevation changes. Local favorite for skilled riders. Named for the legendary wolf den where Revolutionary War hero Israel Putnam killed the last wolf in Connecticut.',
    scenery_rating: 7,
    difficulty: 'Advanced',
    distance_miles: 12,
    trail_types: 'Single Track, Technical',
    best_season: 'Spring,Fall',
    cell_signal: 'Good',
    permit_required: 1,
    permit_info: 'Connecticut OHV registration required',
    notes: 'Parking at Wolf Den Campground. Trail markings can be faint - GPS recommended. Very rocky, not for beginners.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Arcadia Management Area - Breakheart Trail',
    latitude: 41.5847,
    longitude: -71.7392,
    category: 'riding',
    sub_type: 'Trail System',
    description: 'New England\'s hidden dual sport gem. 28 miles of maintained single track through dense forest with technical rock gardens and scenic pond overlooks. Popular with local riders, relatively unknown outside the region.',
    scenery_rating: 8,
    difficulty: 'Moderate',
    distance_miles: 28,
    trail_types: 'Single Track, Dual Sport',
    best_season: 'Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'RI OHV permit required',
    notes: 'Multiple trailheads. Best parking at Arcadia Rd/Route 165. Trail can be muddy in spring. Breakheart Pond is scenic lunch spot.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Stephens State Forest OHV Area',
    latitude: 40.6847,
    longitude: -93.0342,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Iowa\'s best kept dual sport secret. 25 miles of wooded trails through rolling hills with some of the best single track in the Midwest. Mix of tight trees and open ridge running. Surprisingly scenic for Iowa.',
    scenery_rating: 7,
    difficulty: 'Moderate',
    distance_miles: 25,
    trail_types: 'Single Track, Dual Sport',
    best_season: 'Spring,Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'Iowa OHV permit required ($15/year)',
    notes: 'Trailhead on Hwy 2 near Lucas. Camping available. Trails well-maintained by local club. Can be combined with nearby Corydon trails.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Chadwick Motorcycle Club Trails',
    latitude: 36.9153,
    longitude: -93.0789,
    category: 'riding',
    sub_type: 'MX/Trails',
    description: 'Family-run motorcycle park with 50+ miles of marked trails ranging from beginner to expert. Missouri Ozarks setting with rocky hills, creek crossings, and wooded single track. Legendary among Midwest riders.',
    scenery_rating: 8,
    difficulty: 'Beginner,Moderate,Advanced',
    distance_miles: 55,
    trail_types: 'Single Track, Dual Sport, Enduro',
    best_season: 'Spring,Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'Day pass $15, camping available',
    notes: 'Private club with public access. Camping on-site. Small MX track available. Well-maintained trails. Very rider-friendly.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Wolf Pen Gap OHV Trails',
    latitude: 35.9456,
    longitude: -94.2178,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Ozark National Forest hidden network. 40 miles of rocky single track through steep Ozark hills. Technical climbs, root-filled descents, and incredible views from ridge tops. Forum favorite for serious riders.',
    scenery_rating: 9,
    difficulty: 'Advanced',
    distance_miles: 40,
    trail_types: 'Single Track, Enduro',
    best_season: 'Spring,Fall',
    cell_signal: 'Poor',
    permit_required: 0,
    notes: 'Trailhead off FR 1003. Very remote - cell service spotty. Bring tools and spare parts. Camping at Turner Bend or Bayou Bluff.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Kisatchie Hills OHV Trail System',
    latitude: 31.3847,
    longitude: -92.8956,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Louisiana\'s premier dual sport destination. 60+ miles of sandy single track through longleaf pine forest. Some of the best riding in the Deep South with challenging sand whoops and flowing forest trails.',
    scenery_rating: 8,
    difficulty: 'Moderate',
    distance_miles: 62,
    trail_types: 'Single Track, Dual Sport',
    best_season: 'Winter,Spring',
    cell_signal: 'Fair',
    permit_required: 0,
    notes: 'Parking at Dogwood Trail North or South. Sandy terrain - tires and gearing matter. Avoid summer heat. Beautiful in winter/spring.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Shawnee NF - Rim Rock/Pounds Hollow Loop',
    latitude: 37.6103,
    longitude: -88.3856,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'Southern Illinois dual sport loop combining fire roads and legal single track near Garden of the Gods. Scenic bluff views, rock formations, and flowing forest trails. Hidden gem in an unexpected location.',
    scenery_rating: 9,
    difficulty: 'Moderate',
    distance_miles: 35,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Spring,Fall',
    cell_signal: 'Fair',
    permit_required: 0,
    notes: 'Start at Pounds Hollow Recreation Area. Combine multiple trail systems. Garden of the Gods viewpoint is must-see. Technical sections near rock formations.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Mogan Ridge East/West OHV System',
    latitude: 38.6578,
    longitude: -86.4692,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Indiana\'s best OHV riding. 65 miles of single track and dual sport trails through Hoosier National Forest. Mix of tight woods, ridge running, and technical rocky sections. Well-marked and maintained.',
    scenery_rating: 7,
    difficulty: 'Moderate,Advanced',
    distance_miles: 65,
    trail_types: 'Single Track, Dual Sport',
    best_season: 'Spring,Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'Indiana OHV permit required',
    notes: 'East and West sections connected. Parking at multiple trailheads. Can be muddy - check conditions. Camping at nearby Hardin Ridge.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Taskers Gap Trail System',
    latitude: 38.3456,
    longitude: -78.9123,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'George Washington & Jefferson National Forest hidden network. 25 miles of dual sport roads and legal single track with Blue Ridge Mountain views. Local rider favorite with technical rocky climbs.',
    scenery_rating: 8,
    difficulty: 'Moderate,Advanced',
    distance_miles: 25,
    trail_types: 'Dual Sport, Single Track',
    best_season: 'Spring,Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 0,
    notes: 'Trailhead on SR 614. Connects to multiple forest roads. Rocky and technical in places. Great fall colors. Combine with nearby trails for 50+ mile days.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Pocahontas Backcountry Trail System',
    latitude: 38.4289,
    longitude: -79.9847,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'West Virginia\'s secret dual sport paradise. 80+ miles of interconnected forest roads and trails through the Allegheny highlands. Remote, scenic, and challenging. ADVRider forum legend.',
    scenery_rating: 9,
    difficulty: 'Moderate,Advanced',
    distance_miles: 85,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Summer,Fall',
    cell_signal: 'Poor',
    permit_required: 0,
    notes: 'Very remote - bring GPS and spare fuel. Cell service limited. Spruce Knob area access. Camping dispersed. Weather can change quickly at altitude.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Green Ridge SF - Long Pond/Big Run Loop',
    latitude: 39.6234,
    longitude: -78.4567,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'Maryland\'s premier dual sport riding. 45-mile technical loop through mountainous forest with rocky climbs, stream crossings, and ridge views. Challenging and rewarding. Mid-Atlantic rider favorite.',
    scenery_rating: 8,
    difficulty: 'Advanced',
    distance_miles: 45,
    trail_types: 'Dual Sport, Technical',
    best_season: 'Spring,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'MD OHV permit required',
    notes: 'Parking at Long Pond or Town Hill. Very rocky and technical - not for beginners. Multiple primitive campsites. Bring spare tubes.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Uwharrie OHV Trail System - Full Loop',
    latitude: 35.5234,
    longitude: -79.9678,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'North Carolina\'s legendary dual sport destination. 50+ miles of technical single track through ancient mountains. Rocky, rooty, and challenging. East Coast MECCA for serious off-road riding.',
    scenery_rating: 9,
    difficulty: 'Advanced',
    distance_miles: 52,
    trail_types: 'Single Track, Enduro',
    best_season: 'Winter,Spring',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'NC OHV permit required',
    notes: 'Parking at Eldorado Outpost or Wolf Den. Extremely rocky and technical. Best in winter/spring. Summer can be brutally hot. Camping on-site.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Harbison State Forest OHV Trails',
    latitude: 34.0847,
    longitude: -81.1456,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Columbia area dual sport network. 15 miles of flowing single track through pine forest. Well-maintained and beginner-friendly. Great introduction to woods riding with some technical sections.',
    scenery_rating: 6,
    difficulty: 'Beginner,Moderate',
    distance_miles: 15,
    trail_types: 'Single Track',
    best_season: 'Winter,Spring,Fall',
    cell_signal: 'Good',
    permit_required: 1,
    permit_info: 'SC OHV permit required',
    notes: 'Close to Columbia - easy access. Well-marked trails. Good for learning. Can be sandy in places. Avoid summer heat.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Cheaha Wilderness Dual Sport Loop',
    latitude: 33.4856,
    longitude: -85.8089,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'Alabama\'s highest point area riding. 35-mile loop of forest roads and legal trails around Mount Cheaha. Scenic ridge views, challenging climbs, and technical rocky sections. Southern Appalachian beauty.',
    scenery_rating: 9,
    difficulty: 'Moderate,Advanced',
    distance_miles: 35,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Spring,Fall',
    cell_signal: 'Fair',
    permit_required: 0,
    notes: 'Trailhead at Cheaha State Park or nearby forest access. Rocky terrain. Great views from high points. Combine with Talladega NF trails.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Choctaw WMA Motorcycle Trails',
    latitude: 33.3456,
    longitude: -89.2178,
    category: 'riding',
    sub_type: 'Trail System',
    description: 'Mississippi\'s hidden dual sport gem. 40 miles of sandy and wooded trails through wildlife management area. Mix of tight woods and open sandy sections. Surprising quality for the Deep South.',
    scenery_rating: 7,
    difficulty: 'Moderate',
    distance_miles: 40,
    trail_types: 'Single Track, Dual Sport',
    best_season: 'Winter,Spring',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'MS OHV permit + WMA permit required',
    notes: 'Multiple access points. Sandy soil drains well. Good winter riding. Avoid hunting season. Primitive camping allowed.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Wayne NF - Monday Creek OHV System',
    latitude: 39.5234,
    longitude: -82.1456,
    category: 'riding',
    sub_type: 'OHV Area',
    description: 'Ohio\'s premier OHV destination. 85 miles of single track and dual sport trails through Appalachian foothills. Technical, rocky, and challenging. Well-maintained with excellent signage.',
    scenery_rating: 8,
    difficulty: 'Moderate,Advanced',
    distance_miles: 85,
    trail_types: 'Single Track, Dual Sport, Enduro',
    best_season: 'Spring,Summer,Fall',
    cell_signal: 'Fair',
    permit_required: 1,
    permit_info: 'Ohio OHV permit required',
    notes: 'Multiple trailheads. Monday Creek area is main hub. Can be very muddy - check conditions. Camping at nearby Burr Oak State Park.',
    source: 'forum_research',
    hours: 'Dawn to Dusk'
  },
  {
    name: 'Snowy Range Dual Sport Loop',
    latitude: 41.3234,
    longitude: -106.3178,
    category: 'riding',
    sub_type: 'Alpine Trails',
    description: 'Wyoming high alpine riding paradise. 60-mile loop through Medicine Bow National Forest at 10,000+ feet. Alpine lakes, tundra, and epic mountain views. Challenging technical sections with breathtaking scenery.',
    scenery_rating: 10,
    difficulty: 'Moderate,Advanced',
    distance_miles: 60,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Summer',
    cell_signal: 'Poor',
    permit_required: 0,
    notes: 'Short season: mid-July through September. High altitude - bring layers. Snowy Range Pass area. Dispersed camping abundant. Spectacular fall colors.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Gila Wilderness Perimeter Loop',
    latitude: 33.2847,
    longitude: -108.4567,
    category: 'riding',
    sub_type: 'Forest Trails',
    description: 'New Mexico\'s ultimate dual sport adventure. 120-mile perimeter loop of America\'s first wilderness area. Remote, technical, and stunningly beautiful. Multi-day epic for experienced riders.',
    scenery_rating: 10,
    difficulty: 'Advanced',
    distance_miles: 120,
    trail_types: 'Dual Sport, Technical',
    best_season: 'Spring,Fall',
    cell_signal: 'None',
    permit_required: 0,
    notes: 'Very remote - wilderness experience. Multiple days recommended. Fuel planning critical. Dispersed camping. Technical rocky sections. Incredible scenery.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Ruby Mountains Backcountry Routes',
    latitude: 40.6178,
    longitude: -115.4789,
    category: 'riding',
    sub_type: 'Alpine Trails',
    description: 'Nevada\'s secret mountain range. 70 miles of high-altitude dual sport roads through the "Swiss Alps of Nevada." Alpine lakes, glacial valleys, and dramatic peaks. Completely off the beaten path.',
    scenery_rating: 10,
    difficulty: 'Moderate',
    distance_miles: 70,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Summer',
    cell_signal: 'None',
    permit_required: 0,
    notes: 'Very remote - no services. Access via Lamoille Canyon. High altitude (9,000-11,000ft). Short season. Dispersed camping. Bring everything you need.',
    source: 'forum_research',
    hours: '24/7'
  },
  {
    name: 'Lassen Backcountry Volcanic Loop',
    latitude: 40.4923,
    longitude: -121.4208,
    category: 'riding',
    sub_type: 'Volcanic Trails',
    description: 'Northern California volcanic wonderland. 55-mile dual sport loop through Lassen National Forest with volcanic landscapes, alpine meadows, and remote forest roads. Unique terrain and minimal traffic.',
    scenery_rating: 9,
    difficulty: 'Moderate',
    distance_miles: 55,
    trail_types: 'Dual Sport, Fire Road',
    best_season: 'Summer,Fall',
    cell_signal: 'Poor',
    permit_required: 0,
    notes: 'Access via Lassen Park area. Volcanic soil and rocks. Short riding season (snow until June/July). Dispersed camping. Unique geological features.',
    source: 'forum_research',
    hours: '24/7'
  }
];

console.log('Importing 20 riding spots from forum research...\n');

const insertStmt = db.prepare(`
  INSERT INTO locations (
    name, latitude, longitude, category, sub_type, description,
    scenery_rating, difficulty, distance_miles, trail_types, best_season,
    cell_signal, permit_required, permit_info, notes, source, external_links, hours
  ) VALUES (
    @name, @latitude, @longitude, @category, @sub_type, @description,
    @scenery_rating, @difficulty, @distance_miles, @trail_types, @best_season,
    @cell_signal, @permit_required, @permit_info, @notes, @source, @external_links, @hours
  )
`);

let imported = 0;
const insertMany = db.transaction((spots) => {
  for (const spot of spots) {
    try {
      // Ensure all optional fields have values (NULL if missing)
      const spotWithDefaults = {
        ...spot,
        permit_info: spot.permit_info || null,
        external_links: spot.external_links || null
      };
      insertStmt.run(spotWithDefaults);
      imported++;
      console.log(`✓ ${spot.name}`);
    } catch (err) {
      console.error(`✗ Failed to import ${spot.name}: ${err.message}`);
    }
  }
});

insertMany(forumSpots);

console.log(`\n✓ Imported ${imported}/${forumSpots.length} locations`);

// Get updated counts
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    (SELECT COUNT(*) FROM locations WHERE category='riding') as riding,
    (SELECT SUM(distance_miles) FROM locations WHERE category='riding') as trail_miles
  FROM locations
`).get();

console.log(`\nUpdated database stats:`);
console.log(`- Total locations: ${stats.total}`);
console.log(`- Riding spots: ${stats.riding}`);
console.log(`- Total trail miles: ${Math.round(stats.trail_miles)}`);

db.close();
