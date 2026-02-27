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
  // ===== CALIFORNIA — Dual Sport Loops & More =====
  { name: 'Mammoth-Bodie Dual Sport Loop', lat: 37.6567, lng: -118.9234, sub_type: 'National Forest', trail_types: ['Dual Sport', 'Fire Road', 'Technical'], difficulty: 'Hard', distance_miles: 60, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Mammoth Lakes to Bodie ghost town. Technical rocky trails north. Fire roads south. Street legal required.', slug: 'mammoth-bodie' },
  { name: 'Coyote Lake/Means Dry Lake — Barstow', lat: 35.0789, lng: -116.7234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Mojave Desert. Open dry lakebed and desert trails. Near Barstow.', slug: 'coyote-lake-ca' },
  { name: 'Clear Creek Management Area — San Benito County', lat: 36.3567, lng: -120.6234, sub_type: 'BLM', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Oct-May', permit_required: 0, permit_info: null, notes: 'Central CA. Remote BLM trails in inner coast range. Serpentine rock terrain.', slug: 'clear-creek-ca' },
  { name: 'Los Padres NF — Pozo/Hi Mountain', lat: 35.3234, lng: -120.3567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Moderate', distance_miles: 30, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SLO County backcountry. Hi Mountain Road to Big Falls. Ocean and mountain views.', slug: 'los-padres-pozo' },
  { name: 'Mendocino NF — Eel River', lat: 39.7567, lng: -122.8234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 40, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'NorCal. Remote forest with pristine rivers. Least visited NF in CA. True hidden gem.', slug: 'mendocino-nf' },
  { name: 'Plumas NF — Bucks Lake', lat: 39.8567, lng: -121.2234, sub_type: 'National Forest', trail_types: ['Fire Road', 'Single Track'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Northern Sierra. Mountain lake and forest trails. Less crowded than Tahoe area.', slug: 'plumas-bucks-lake' },
  { name: 'Sequoia NF — Greenhorn Mountain', lat: 35.7234, lng: -118.5567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'May-Oct', permit_required: 0, permit_info: null, notes: 'Southern Sierra. Forest roads through sequoia groves and mountain meadows.', slug: 'greenhorn-mountain' },
  { name: 'San Bernardino NF — Cleghorn Ridge', lat: 34.2789, lng: -117.3234, sub_type: 'National Forest', trail_types: ['Single Track', 'Technical'], difficulty: 'Hard', distance_miles: 10, elevation_gain_ft: 1500, scenery_rating: 4, best_season: 'Year-round', permit_required: 0, permit_info: null, notes: 'SoCal mountains. Ridge trail with Cajon Pass views. Technical single track.', slug: 'cleghorn-ridge' },

  // ===== MORE WESTERN EXPANSION =====
  
  // AZ — more
  { name: 'Bulldog Canyon OHV — Mesa', lat: 33.5234, lng: -111.4567, sub_type: 'National Forest', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 15, elevation_gain_ft: 300, scenery_rating: 4, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'Free Tonto NF permit', notes: 'East Mesa. Sonoran Desert with saguaro cacti. Easy and scenic. Permit required.', slug: 'bulldog-canyon' },
  { name: 'Rolls OHV — Yuma', lat: 32.6567, lng: -114.5234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 100, scenery_rating: 3, best_season: 'Oct-Apr', permit_required: 0, permit_info: null, notes: 'SW Arizona near Yuma. Flat desert riding. Open year-round.', slug: 'rolls-yuma' },

  // UT — more
  { name: 'Temple Mountain — Goblin Valley', lat: 38.6567, lng: -110.6234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 500, scenery_rating: 5, best_season: 'Mar-Nov', permit_required: 0, permit_info: null, notes: 'San Rafael Swell. Near Goblin Valley. Colorful geology and old uranium mine roads.', slug: 'temple-mountain' },
  { name: 'Lockhart Basin — Moab to Needles', lat: 38.2567, lng: -109.6234, sub_type: 'BLM', trail_types: ['Desert', 'Fire Road'], difficulty: 'Hard', distance_miles: 52, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Mar-May, Sep-Nov', permit_required: 0, permit_info: null, notes: '52-mile Moab to Canyonlands Needles District. Remote canyon rim riding. Epic adventure.', slug: 'lockhart-basin' },
  
  // CO — more
  { name: 'Weston Pass — Leadville', lat: 39.1234, lng: -106.1567, sub_type: 'National Forest', trail_types: ['Fire Road', 'Ridge Riding'], difficulty: 'Easy', distance_miles: 20, elevation_gain_ft: 2000, scenery_rating: 5, best_season: 'Jun-Sep', permit_required: 0, permit_info: null, notes: '11,921 ft pass. Easiest way over the Mosquito Range. Buffalo Peaks Wilderness views.', slug: 'weston-pass' },
  { name: 'Old Fall River Road — RMNP', lat: 40.3789, lng: -105.7234, sub_type: 'National Park', trail_types: ['Fire Road'], difficulty: 'Easy', distance_miles: 9, elevation_gain_ft: 3000, scenery_rating: 5, best_season: 'Jul-Sep', permit_required: 1, permit_info: 'RMNP entrance fee', notes: 'Rocky Mountain NP. One-way unpaved road to Alpine Visitor Center. 11,796 ft. Elk and tundra.', slug: 'old-fall-river' },

  // NV — more
  { name: 'Valley of Fire OHV — Overton', lat: 36.4234, lng: -114.5567, sub_type: 'State Park', trail_types: ['Desert', 'Fire Road'], difficulty: 'Easy', distance_miles: 10, elevation_gain_ft: 200, scenery_rating: 5, best_season: 'Oct-Apr', permit_required: 1, permit_info: 'State park fee', notes: 'Red sandstone formations near Vegas. Stunning desert scenery. Limited OHV access.', slug: 'valley-of-fire-ohv' },

  // OR — more
  { name: 'Ochoco NF — Marks Creek', lat: 44.2567, lng: -120.4234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 4, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Central OR. Quiet forest riding east of Prineville. Less crowded than west side.', slug: 'ochoco-marks-creek' },

  // WA — more
  { name: 'Walker Valley OHV — Burlington', lat: 48.4567, lng: -122.2234, sub_type: 'State Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Hard', distance_miles: 15, elevation_gain_ft: 800, scenery_rating: 4, best_season: 'Year-round', permit_required: 1, permit_info: 'WA Discover Pass', notes: 'NW Washington. Rocky and muddy PNW riding. North Cascades foothills.', slug: 'walker-valley' },

  // MT — more
  { name: 'Lolo NF — Clearwater Crossing', lat: 46.9567, lng: -114.5234, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 1500, scenery_rating: 5, best_season: 'Jun-Oct', permit_required: 0, permit_info: null, notes: 'Near Missoula. Clearwater River area. Beautiful Montana forest riding.', slug: 'clearwater-crossing' },

  // More SE
  { name: 'Mulberry Gap — Ellijay GA', lat: 34.7567, lng: -84.5234, sub_type: 'Private Park', trail_types: ['Single Track', 'Enduro'], difficulty: 'Moderate', distance_miles: 20, elevation_gain_ft: 1000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Guest fee', notes: 'N Georgia mountains. Mountain bike resort that allows motos. Epic trails + cabin lodging.', slug: 'mulberry-gap' },
  { name: 'Turkey Creek OHV — Talladega NF AL', lat: 33.7234, lng: -85.6567, sub_type: 'National Forest', trail_types: ['Single Track', 'Fire Road'], difficulty: 'Moderate', distance_miles: 25, elevation_gain_ft: 800, scenery_rating: 3, best_season: 'Year-round', permit_required: 1, permit_info: 'USFS OHV fee', notes: 'NE Alabama. Talladega NF trails. Rocky and rooty terrain.', slug: 'turkey-creek-al' },

  // More midwest
  { name: 'Brimstone White Knuckle Event — Huntsville TN', lat: 36.4234, lng: -84.5567, sub_type: 'Trail System', trail_types: ['Single Track', 'Technical', 'Enduro'], difficulty: 'Expert', distance_miles: 100, elevation_gain_ft: 5000, scenery_rating: 5, best_season: 'Year-round', permit_required: 1, permit_info: 'Day pass', notes: 'Cumberland Plateau. 100+ miles extreme trails. Mountain views. One of the best in the SE.', slug: 'brimstone-white-knuckle' },
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
console.log(`Batch 19: Inserted ${inserted} new spots. Total riding: ${total.cnt}. Grand total: ${grandTotal.cnt}`);
db.close();
