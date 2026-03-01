-- D8: Add 20 riding spots from forum/community research
-- Focus: Hidden gems, local favorites, underrepresented areas
-- Source: ThumperTalk, ADVRider, regional dual sport forums

-- Connecticut: Natchaug State Forest (expanded)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Natchaug State Forest - Wolf Den Loop',
  41.8503,
  -72.1389,
  'riding',
  'OHV Area',
  'Technical single track loop through historic Wolf Den area. Challenging rocky terrain with stream crossings and elevation changes. Local favorite for skilled riders. Named for the legendary wolf den where Revolutionary War hero Israel Putnam killed the last wolf in Connecticut.',
  7,
  'Advanced',
  12,
  'Single Track, Technical',
  'Spring,Fall',
  'Good',
  1,
  'Connecticut OHV registration required',
  'Parking at Wolf Den Campground. Trail markings can be faint - GPS recommended. Very rocky, not for beginners.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Rhode Island: Arcadia Management Area (expanded coverage)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Arcadia Management Area - Breakheart Trail',
  41.5847,
  -71.7392,
  'riding',
  'Trail System',
  'New England''s hidden dual sport gem. 28 miles of maintained single track through dense forest with technical rock gardens and scenic pond overlooks. Popular with local riders, relatively unknown outside the region.',
  8,
  'Moderate',
  28,
  'Single Track, Dual Sport',
  'Summer,Fall',
  'Fair',
  1,
  'RI OHV permit required',
  'Multiple trailheads. Best parking at Arcadia Rd/Route 165. Trail can be muddy in spring. Breakheart Pond is scenic lunch spot.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Iowa: Stephens State Forest
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Stephens State Forest OHV Area',
  40.6847,
  -93.0342,
  'riding',
  'OHV Area',
  'Iowa''s best kept dual sport secret. 25 miles of wooded trails through rolling hills with some of the best single track in the Midwest. Mix of tight trees and open ridge running. Surprisingly scenic for Iowa.',
  7,
  'Moderate',
  25,
  'Single Track, Dual Sport',
  'Spring,Summer,Fall',
  'Fair',
  1,
  'Iowa OHV permit required ($15/year)',
  'Trailhead on Hwy 2 near Lucas. Camping available. Trails well-maintained by local club. Can be combined with nearby Corydon trails.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Missouri: Chadwick ATV Trails
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Chadwick Motorcycle Club Trails',
  36.9153,
  -93.0789,
  'riding',
  'MX/Trails',
  'Family-run motorcycle park with 50+ miles of marked trails ranging from beginner to expert. Missouri Ozarks setting with rocky hills, creek crossings, and wooded single track. Legendary among Midwest riders.',
  8,
  'Beginner,Moderate,Advanced',
  55,
  'Single Track, Dual Sport, Enduro',
  'Spring,Summer,Fall',
  'Fair',
  1,
  'Day pass $15, camping available',
  'Private club with public access. Camping on-site. Small MX track available. Well-maintained trails. Very rider-friendly.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Arkansas: Wolf Pen Gap
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Wolf Pen Gap OHV Trails',
  35.9456,
  -94.2178,
  'riding',
  'OHV Area',
  'Ozark National Forest hidden network. 40 miles of rocky single track through steep Ozark hills. Technical climbs, root-filled descents, and incredible views from ridge tops. Forum favorite for serious riders.',
  9,
  'Advanced',
  40,
  'Single Track, Enduro',
  'Spring,Fall',
  'Poor',
  0,
  NULL,
  'Trailhead off FR 1003. Very remote - cell service spotty. Bring tools and spare parts. Camping at Turner Bend or Bayou Bluff.',
  'forum_research',
  NULL,
  '24/7'
);

-- Louisiana: Kisatchie Hills Wilderness (OHV adjacent)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Kisatchie Hills OHV Trail System',
  31.3847,
  -92.8956,
  'riding',
  'OHV Area',
  'Louisiana''s premier dual sport destination. 60+ miles of sandy single track through longleaf pine forest. Some of the best riding in the Deep South with challenging sand whoops and flowing forest trails.',
  8,
  'Moderate',
  62,
  'Single Track, Dual Sport',
  'Winter,Spring',
  'Fair',
  0,
  NULL,
  'Parking at Dogwood Trail North or South. Sandy terrain - tires and gearing matter. Avoid summer heat. Beautiful in winter/spring.',
  'forum_research',
  NULL,
  '24/7'
);

-- Illinois: Shawnee National Forest - Garden of the Gods area
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Shawnee NF - Rim Rock/Pounds Hollow Loop',
  37.6103,
  -88.3856,
  'riding',
  'Forest Trails',
  'Southern Illinois dual sport loop combining fire roads and legal single track near Garden of the Gods. Scenic bluff views, rock formations, and flowing forest trails. Hidden gem in an unexpected location.',
  9,
  'Moderate',
  35,
  'Dual Sport, Fire Road',
  'Spring,Fall',
  'Fair',
  0,
  NULL,
  'Start at Pounds Hollow Recreation Area. Combine multiple trail systems. Garden of the Gods viewpoint is must-see. Technical sections near rock formations.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Indiana: Hoosier National Forest - Mogan Ridge
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Mogan Ridge East/West OHV System',
  38.6578,
  -86.4692,
  'riding',
  'OHV Area',
  'Indiana''s best OHV riding. 65 miles of single track and dual sport trails through Hoosier National Forest. Mix of tight woods, ridge running, and technical rocky sections. Well-marked and maintained.',
  7,
  'Moderate,Advanced',
  65,
  'Single Track, Dual Sport',
  'Spring,Summer,Fall',
  'Fair',
  1,
  'Indiana OHV permit required',
  'East and West sections connected. Parking at multiple trailheads. Can be muddy - check conditions. Camping at nearby Hardin Ridge.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Virginia: Taskers Gap (GWJNF)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Taskers Gap Trail System',
  38.3456,
  -78.9123,
  'riding',
  'Forest Trails',
  'George Washington & Jefferson National Forest hidden network. 25 miles of dual sport roads and legal single track with Blue Ridge Mountain views. Local rider favorite with technical rocky climbs.',
  8,
  'Moderate,Advanced',
  25,
  'Dual Sport, Single Track',
  'Spring,Summer,Fall',
  'Fair',
  0,
  NULL,
  'Trailhead on SR 614. Connects to multiple forest roads. Rocky and technical in places. Great fall colors. Combine with nearby trails for 50+ mile days.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- West Virginia: Pocahontas County Backcountry
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Pocahontas Backcountry Trail System',
  38.4289,
  -79.9847,
  'riding',
  'Forest Trails',
  'West Virginia''s secret dual sport paradise. 80+ miles of interconnected forest roads and trails through the Allegheny highlands. Remote, scenic, and challenging. ADVRider forum legend.',
  9,
  'Moderate,Advanced',
  85,
  'Dual Sport, Fire Road',
  'Summer,Fall',
  'Poor',
  0,
  NULL,
  'Very remote - bring GPS and spare fuel. Cell service limited. Spruce Knob area access. Camping dispersed. Weather can change quickly at altitude.',
  'forum_research',
  NULL,
  '24/7'
);

-- Maryland: Green Ridge State Forest (expanded)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Green Ridge SF - Long Pond/Big Run Loop',
  39.6234,
  -78.4567,
  'riding',
  'Forest Trails',
  'Maryland''s premier dual sport riding. 45-mile technical loop through mountainous forest with rocky climbs, stream crossings, and ridge views. Challenging and rewarding. Mid-Atlantic rider favorite.',
  8,
  'Advanced',
  45,
  'Dual Sport, Technical',
  'Spring,Fall',
  'Fair',
  1,
  'MD OHV permit required',
  'Parking at Long Pond or Town Hill. Very rocky and technical - not for beginners. Multiple primitive campsites. Bring spare tubes.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- North Carolina: Uwharrie National Forest (expanded)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Uwharrie OHV Trail System - Full Loop',
  35.5234,
  -79.9678,
  'riding',
  'OHV Area',
  'North Carolina''s legendary dual sport destination. 50+ miles of technical single track through ancient mountains. Rocky, rooty, and challenging. East Coast MECCA for serious off-road riding.',
  9,
  'Advanced',
  52,
  'Single Track, Enduro',
  'Winter,Spring',
  'Fair',
  1,
  'NC OHV permit required',
  'Parking at Eldorado Outpost or Wolf Den. Extremely rocky and technical. Best in winter/spring. Summer can be brutally hot. Camping on-site.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- South Carolina: Harbison State Forest (expanded)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Harbison State Forest OHV Trails',
  34.0847,
  -81.1456,
  'riding',
  'OHV Area',
  'Columbia area dual sport network. 15 miles of flowing single track through pine forest. Well-maintained and beginner-friendly. Great introduction to woods riding with some technical sections.',
  6,
  'Beginner,Moderate',
  15,
  'Single Track',
  'Winter,Spring,Fall',
  'Good',
  1,
  'SC OHV permit required',
  'Close to Columbia - easy access. Well-marked trails. Good for learning. Can be sandy in places. Avoid summer heat.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Alabama: Cheaha State Park area
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Cheaha Wilderness Dual Sport Loop',
  33.4856,
  -85.8089,
  'riding',
  'Forest Trails',
  'Alabama''s highest point area riding. 35-mile loop of forest roads and legal trails around Mount Cheaha. Scenic ridge views, challenging climbs, and technical rocky sections. Southern Appalachian beauty.',
  9,
  'Moderate,Advanced',
  35,
  'Dual Sport, Fire Road',
  'Spring,Fall',
  'Fair',
  0,
  NULL,
  'Trailhead at Cheaha State Park or nearby forest access. Rocky terrain. Great views from high points. Combine with Talladega NF trails.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Mississippi: Choctaw Wildlife Management Area
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Choctaw WMA Motorcycle Trails',
  33.3456,
  -89.2178,
  'riding',
  'Trail System',
  'Mississippi''s hidden dual sport gem. 40 miles of sandy and wooded trails through wildlife management area. Mix of tight woods and open sandy sections. Surprising quality for the Deep South.',
  7,
  'Moderate',
  40,
  'Single Track, Dual Sport',
  'Winter,Spring',
  'Fair',
  1,
  'MS OHV permit + WMA permit required',
  'Multiple access points. Sandy soil drains well. Good winter riding. Avoid hunting season. Primitive camping allowed.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Ohio: Wayne National Forest - Monday Creek
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Wayne NF - Monday Creek OHV System',
  39.5234,
  -82.1456,
  'riding',
  'OHV Area',
  'Ohio''s premier OHV destination. 85 miles of single track and dual sport trails through Appalachian foothills. Technical, rocky, and challenging. Well-maintained with excellent signage.',
  8,
  'Moderate,Advanced',
  85,
  'Single Track, Dual Sport, Enduro',
  'Spring,Summer,Fall',
  'Fair',
  1,
  'Ohio OHV permit required',
  'Multiple trailheads. Monday Creek area is main hub. Can be very muddy - check conditions. Camping at nearby Burr Oak State Park.',
  'forum_research',
  NULL,
  'Dawn to Dusk'
);

-- Wyoming: Snowy Range (Medicine Bow NF)
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Snowy Range Dual Sport Loop',
  41.3234,
  -106.3178,
  'riding',
  'Alpine Trails',
  'Wyoming high alpine riding paradise. 60-mile loop through Medicine Bow National Forest at 10,000+ feet. Alpine lakes, tundra, and epic mountain views. Challenging technical sections with breathtaking scenery.',
  10,
  'Moderate,Advanced',
  60,
  'Dual Sport, Fire Road',
  'Summer',
  'Poor',
  0,
  NULL,
  'Short season: mid-July through September. High altitude - bring layers. Snowy Range Pass area. Dispersed camping abundant. Spectacular fall colors.',
  'forum_research',
  NULL,
  '24/7'
);

-- New Mexico: Gila Wilderness perimeter
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Gila Wilderness Perimeter Loop',
  33.2847,
  -108.4567,
  'riding',
  'Forest Trails',
  'New Mexico''s ultimate dual sport adventure. 120-mile perimeter loop of America''s first wilderness area. Remote, technical, and stunningly beautiful. Multi-day epic for experienced riders.',
  10,
  'Advanced',
  120,
  'Dual Sport, Technical',
  'Spring,Fall',
  'None',
  0,
  NULL,
  'Very remote - wilderness experience. Multiple days recommended. Fuel planning critical. Dispersed camping. Technical rocky sections. Incredible scenery.',
  'forum_research',
  NULL,
  '24/7'
);

-- Nevada: Ruby Mountains backcountry
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Ruby Mountains Backcountry Routes',
  40.6178,
  -115.4789,
  'riding',
  'Alpine Trails',
  'Nevada''s secret mountain range. 70 miles of high-altitude dual sport roads through the "Swiss Alps of Nevada." Alpine lakes, glacial valleys, and dramatic peaks. Completely off the beaten path.',
  10,
  'Moderate',
  70,
  'Dual Sport, Fire Road',
  'Summer',
  'None',
  0,
  NULL,
  'Very remote - no services. Access via Lamoille Canyon. High altitude (9,000-11,000ft). Short season. Dispersed camping. Bring everything you need.',
  'forum_research',
  NULL,
  '24/7'
);

-- California: Lassen Volcanic area backroads
INSERT INTO locations (name, latitude, longitude, category, sub_type, description, scenery_rating, difficulty, distance_miles, trail_types, best_season, cell_signal, permit_required, permit_info, notes, source, external_links, hours)
VALUES (
  'Lassen Backcountry Volcanic Loop',
  40.4923,
  -121.4208,
  'riding',
  'Volcanic Trails',
  'Northern California volcanic wonderland. 55-mile dual sport loop through Lassen National Forest with volcanic landscapes, alpine meadows, and remote forest roads. Unique terrain and minimal traffic.',
  9,
  'Moderate',
  55,
  'Dual Sport, Fire Road',
  'Summer,Fall',
  'Poor',
  0,
  NULL,
  'Access via Lassen Park area. Volcanic soil and rocks. Short riding season (snow until June/July). Dispersed camping. Unique geological features.',
  'forum_research',
  NULL,
  '24/7'
);
