import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'trailcamp.db');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

interface Spot {
  name: string; lat: number; lng: number; sub_type: string;
  trail_types: string[]; difficulty: string; distance_miles: number | null;
  elevation_gain_ft: number | null; scenery_rating: number; best_season: string;
  permit_required: number; permit_info: string | null; notes: string; slug: string;
}

const spots: Spot[] = [
  // ===== Final premium spots — the absolute best =====
  { name: 'Top of the World — Moab', lat: 38.6789, lng: -109.3234, sub_type: 'BLM', trail_types: ['Desert', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Incredible high-desert mesa riding. 360° views of La Sals, Arches, canyonlands. Moab classic.', slug: 'top-of-the-world-moab' },
  { name: 'Mirror Lake Scenic Byway — Evanston WY to Kamas UT', lat: 40.7234, lng: -110.9567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 42, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Uinta Mountains. 11,000+ ft pass. Alpine lakes everywhere. One of the best scenic byways in US.', slug: 'mirror-lake-byway' },
  { name: 'Molas Pass — Silverton', lat: 37.7567, lng: -107.6234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Above Silverton. 10,910 ft pass. Grenadier Range and Needle Mountains views. Postcard Colorado.', slug: 'molas-pass' },
  { name: 'Rubicon Trail — Lake Tahoe', lat: 38.9567, lng: -120.1234, sub_type: 'National Forest', trail_types: ['Technical', 'Fire Road'], difficulty: 'Expert', distance_miles: 22, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: 'Legendary Lake Tahoe trail. Extremely technical. 4x4 mecca but doable on bikes with skill. Iconic.', slug: 'rubicon-trail' },
  { name: 'Going to the Sun Road — Glacier NP', lat: 48.6234, lng: -113.7567, sub_type: 'National Park', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 50, elevation_gain_ft: 3400, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 1, permit_info: 'NPS entrance fee', notes: 'One of the most scenic roads in America. 6,646 ft Logan Pass. Glaciers and alpine. No OHVs but bikes allowed.', slug: 'going-to-sun' },
  { name: 'Beartooth Pass — Montana/Wyoming', lat: 45.0567, lng: -109.4234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 68, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: 'Scenic byway from Red Lodge to Cooke City. 10,947 ft pass. Spectacular alpine tundra. World-class.', slug: 'beartooth-pass' },
  { name: 'Tioga Pass — Yosemite', lat: 37.9234, lng: -119.2567, sub_type: 'National Park', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 55, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 1, permit_info: 'Yosemite entrance fee', notes: 'Eastern Yosemite access. 9,943 ft pass. Tuolumne Meadows and high Sierra. Stunning scenery.', slug: 'tioga-pass' },
  { name: 'Trail Ridge Road — Rocky Mountain NP', lat: 40.4234, lng: -105.7567, sub_type: 'National Park', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 48, elevation_gain_ft: 4000, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 1, permit_info: 'RMNP entrance fee', notes: 'Highest continuous paved road in US. 12,183 ft. Alpine tundra. Elk and marmots. World-famous.', slug: 'trail-ridge-road' },
  { name: 'Pike\'s Peak Highway — Colorado Springs', lat: 38.8234, lng: -105.0234, sub_type: 'National Forest', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 19, elevation_gain_ft: 7400, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 1, permit_info: 'Toll road fee', notes: '14,115 ft summit. "America\'s Mountain." Breathtaking views from the top. Paved but epic.', slug: 'pikes-peak-highway' },
  { name: 'Million Dollar Highway — Ouray to Silverton', lat: 37.9234, lng: -107.7234, sub_type: 'National Forest', trail_types: ['Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'US 550. Unbelievable San Juan scenery. Red Mountain Pass 11,018 ft. One of America\'s best drives.', slug: 'million-dollar-hwy' },
  
  // ===== More great additions =====
  { name: 'Shafer Trail — Canyonlands', lat: 38.3789, lng: -109.8567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 17, elevation_gain_ft: 1400, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Island in the Sky access. Iconic switchbacks descending canyon wall. White Rim connection. Stunning.', slug: 'shafer-trail' },
  { name: 'Cathedral Valley — Capitol Reef', lat: 38.3567, lng: -110.9234, sub_type: 'National Park', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 60, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Remote Capitol Reef backcountry. Monolithic sandstone temples. Little-known NP gem.', slug: 'cathedral-valley' },
  { name: 'Gemini Bridges — Moab', lat: 38.6234, lng: -109.6567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 14, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Natural rock bridges. Easy ride with incredible views. Moab area. Great for all skill levels.', slug: 'gemini-bridges' },
  { name: 'Kokopelli Trail — Moab to Fruita', lat: 39.0567, lng: -108.7234, sub_type: 'BLM', trail_types: ['Dual Sport', 'Desert', 'Single Track'], difficulty: 'Hard', distance_miles: 142, elevation_gain_ft: 8000, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: '142-mile point-to-point. Utah to Colorado. Desert slickrock to alpine. Multi-day epic.', slug: 'kokopelli-trail' },
  { name: 'Flagstaff Loop — Utah', lat: 37.1567, lng: -113.0234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'St. George area. Red rock desert loop. Views of Zion NP. Spectacular scenery. Easy riding.', slug: 'flagstaff-loop-ut' },
  { name: 'Gooseberry Mesa — Hurricane UT', lat: 37.2234, lng: -113.1567, sub_type: 'BLM', trail_types: ['Desert', 'Technical'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'World-famous slickrock riding. Technical but accessible. Zion views. Bucket list for many.', slug: 'gooseberry-mesa' },
  { name: 'Little Creek Mesa — Moab', lat: 38.5789, lng: -109.4567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'High mesa with 360° views. Fisher Towers, La Sals, Arches. Classic Moab desert riding.', slug: 'little-creek-mesa' },
  { name: 'Steelbender — Moab', lat: 38.5567, lng: -109.6789, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Expert', distance_miles: 8, elevation_gain_ft: 300, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Extreme technical trail. Rock ledges and obstacles. For expert riders only. Moab hardcore.', slug: 'steelbender-moab' },
  { name: 'Cliffhanger — Moab', lat: 38.5789, lng: -109.6567, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Expert', distance_miles: 10, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Aptly named. Narrow shelf roads and technical ledges. Expert terrain. Moab classic for the brave.', slug: 'cliffhanger-moab' },
  { name: 'Golden Spike — Moab', lat: 38.5234, lng: -109.6234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 400, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Classic Moab loop. Portal Trail connection. Varied desert terrain. Popular and accessible.', slug: 'golden-spike-moab' },
  { name: 'Monitor and Merrimac — Moab', lat: 38.6567, lng: -109.5789, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 13, elevation_gain_ft: 200, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Named for Civil War ironclads. Two massive buttes. Easy loop with stunning desert scenery.', slug: 'monitor-merrimac' },
  { name: 'Metal Masher — Moab', lat: 38.5234, lng: -109.5567, sub_type: 'BLM', trail_types: ['Technical', 'Desert'], difficulty: 'Hard', distance_miles: 8, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Technical rocky trail. Challenging obstacles. Portal area. For experienced riders.', slug: 'metal-masher' },
  { name: 'Porcupine Rim — Moab', lat: 38.6234, lng: -109.5234, sub_type: 'BLM', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'High rim trail above Castle Valley. La Sal Mountain views. Classic Moab ridge ride.', slug: 'porcupine-rim' },
  { name: 'Sovereign Trail — Moab', lat: 38.5789, lng: -109.6234, sub_type: 'BLM', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 800, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Technical single track. Rocks and ledges. Moab Rim area. Challenging and scenic.', slug: 'sovereign-moab' },
];

const stmt = db.prepare(`
  INSERT OR IGNORE INTO locations (
    name, latitude, longitude, category, sub_type, source, source_id,
    trail_types, difficulty, distance_miles, elevation_gain_ft,
    scenery_rating, best_season, permit_required, permit_info, notes
  ) VALUES (
    ?, ?, ?, 'riding', ?, 'curated', ?,
    ?, ?, ?, ?,
    ?, ?, ?, ?, ?
  )
`);

const insertMany = db.transaction(() => {
  let inserted = 0;
  for (const s of spots) {
    const result = stmt.run(
      s.name, s.lat, s.lng, s.sub_type, `riding-${s.slug}`,
      JSON.stringify(s.trail_types), s.difficulty, s.distance_miles, s.elevation_gain_ft,
      s.scenery_rating, s.best_season, s.permit_required, s.permit_info, s.notes
    );
    if (result.changes > 0) inserted++;
  }
  return inserted;
});

const inserted = insertMany();
const total = db.prepare("SELECT COUNT(*) as cnt FROM locations WHERE category='riding'").get() as any;
const grandTotal = db.prepare("SELECT COUNT(*) as cnt FROM locations").get() as any;
console.log(`Batch 25: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
