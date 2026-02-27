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
  // ===== COLORADO — from RiderPlanet + knowledge =====
  { name: 'Bangs Canyon — Grand Junction', lat: 39.0234, lng: -108.5567, sub_type: 'BLM', trail_types: ['Single Track', 'Desert', 'Technical'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'High desert outside GJ. Canyons, plateaus, slickrock, single track. Thousands of acres.', slug: 'bangs-canyon' },
  { name: 'Captain Jacks Trail — Colorado Springs', lat: 38.7789, lng: -104.8567, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 6, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Pike NF. 6 miles challenging single track. Hard packed dirt. Near Colorado Springs.', slug: 'captain-jacks' },
  { name: 'Hartman Rocks — Gunnison', lat: 38.5234, lng: -106.9567, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: '22 square miles near Gunnison. Smooth fast single track to rugged 4x4. Huge variety.', slug: 'hartman-rocks' },
  { name: 'Golden Horseshoe — Breckenridge', lat: 39.4789, lng: -106.0567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 0, permit_info: null, notes: '6,000 acres of pristine mountain trails. Breckenridge area. High alpine.', slug: 'golden-horseshoe' },
  { name: 'Grand Valley OHV — Grand Junction', lat: 39.0567, lng: -108.6234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road', 'Technical'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Large open area near GJ. Smooth to rugged with numerous hill climbs.', slug: 'grand-valley-ohv' },
  { name: 'Cuchara Recreation Area — Cuchara', lat: 37.3234, lng: -105.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Spanish Peaks area. Mountain views, aspen forest. Scenic S Colorado riding.', slug: 'cuchara' },
  { name: 'Dry Lake MX — Gypsum', lat: 39.6234, lng: -106.9567, sub_type: 'MX Track', trail_types: ['Motocross', 'Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 3, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Dirt bikes only. MX main, peewee, mini, endurocross, single track. Gypsum CO.', slug: 'dry-lake-mx' },
  { name: 'Rampart Range Road — Colorado Springs', lat: 39.0567, lng: -105.0234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Classic CO front range ride. 40 mile forest road from Colorado Springs to Woodland Park.', slug: 'rampart-range' },

  // ===== MORE WESTERN DEPTH =====
  
  // AZ — more
  { name: 'Crown King — Bradshaw Mountains', lat: 34.2234, lng: -112.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 3000, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'Prescott NF. Historic mining town. Forest road climb from desert to pines. Classic AZ ride.', slug: 'crown-king' },
  { name: 'Mount Graham — Safford', lat: 32.7234, lng: -109.8567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Coronado NF. Desert floor to 10,720 ft! Five biozones. SE AZ sky island.', slug: 'mt-graham' },
  { name: 'Four Peaks Wilderness Edge', lat: 33.7567, lng: -111.3234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Desert'], difficulty: 'Hard', distance_miles: 20, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Tonto NF. Iconic AZ peaks near Phoenix. Rugged forest roads with panoramic views.', slug: 'four-peaks' },

  // UT — more
  { name: 'White Rim Trail — Canyonlands', lat: 38.3567, lng: -109.8234, sub_type: 'National Park', trail_types: ['Fire Road', 'Desert'], difficulty: 'Moderate', distance_miles: 100, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 1, permit_info: 'NPS permit required', notes: '100-mile loop below Island in the Sky mesa. Colorado/Green River views. Bucket list ride.', slug: 'white-rim' },
  { name: 'Nine Mile Canyon — Price', lat: 39.7234, lng: -110.1567, sub_type: 'BLM', trail_types: ['Fire Road', 'Desert'], difficulty: 'Easy', distance_miles: 40, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'World\'s longest art gallery — thousands of petroglyphs. Remote canyon road. Historic.', slug: 'nine-mile-canyon' },

  // NV — more
  { name: 'Logandale Trails — Overton', lat: 36.4567, lng: -114.5234, sub_type: 'BLM', trail_types: ['Desert', 'Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 25, elevation_gain_ft: 500, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'NE of Las Vegas. Technical desert single track. Red sandstone. Popular Vegas area riding.', slug: 'logandale' },
  { name: 'Tonopah — Nye County BLM', lat: 38.0567, lng: -117.2234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 30, elevation_gain_ft: 500, scenery_rating: 3, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'Central NV. Wide open desert riding. Historic mining town. Halfway between Reno and Vegas.', slug: 'tonopah' },

  // OR — more
  { name: 'BLM Prineville District — Central OR', lat: 44.3234, lng: -120.7567, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Apr-Oct', permit_required: 0, permit_info: null, notes: 'High desert east of Bend. Juniper and sage. Open riding on BLM roads.', slug: 'prineville-blm' },

  // WA — more  
  { name: 'Greenwater OHV — Enumclaw', lat: 47.1234, lng: -121.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Mt. Baker-Snoqualmie NF. Forest trails near Mt. Rainier. PNW mountain riding.', slug: 'greenwater-ohv' },

  // ID — more
  { name: 'Bruneau Dunes — Bruneau', lat: 42.9234, lng: -115.7567, sub_type: 'State Park', trail_types: ['Sand Dunes'], difficulty: 'Moderate', distance_miles: 10, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'State park fee', notes: 'Tallest single-structured sand dune in North America (470 ft). Southern Idaho.', slug: 'bruneau-dunes' },

  // MT — more
  { name: 'Kootenai NF — Yaak Valley', lat: 48.7234, lng: -115.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Remote NW Montana. Yaak Valley. Dense forest, mountains, grizzly country. Total wilderness feel.', slug: 'yaak-valley' },

  // NM — more
  { name: 'Jemez Mountains — Jemez Springs', lat: 35.8234, lng: -106.7567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Santa Fe NF. Volcanic caldera, hot springs, mountain meadows. NW of Albuquerque. Beautiful.', slug: 'jemez-mountains' },

  // More SE hidden gems
  { name: 'Pottersville OHV — Cohutta WMA GA', lat: 34.9234, lng: -84.6567, sub_type: 'State Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'North Georgia mountains. Cohutta Wildlife area. Mountain terrain.', slug: 'pottersville-ga' },
  { name: 'Sam Houston NF OHV — New Waverly TX', lat: 30.5234, lng: -95.4567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'East TX pine forest. Easy riding close to Houston. Sandy and forested.', slug: 'sam-houston-nf' },
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
console.log(`Batch 17: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
