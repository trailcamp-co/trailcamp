import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/locations
router.get('/', (req: Request, res: Response) => {
  const db = getDb();
  let query = 'SELECT * FROM locations WHERE 1=1';
  const params: any[] = [];

  if (req.query.category) {
    query += ' AND category = ?';
    params.push(req.query.category);
  }

  if (req.query.visited === '1') {
    query += ' AND visited = 1';
  } else if (req.query.visited === '0') {
    query += ' AND visited = 0';
  }

  if (req.query.want_to_visit === '1') {
    query += ' AND want_to_visit = 1';
  }

  if (req.query.min_rating) {
    query += ' AND user_rating >= ?';
    params.push(Number(req.query.min_rating));
  }

  if (req.query.difficulty) {
    query += ' AND difficulty = ?';
    params.push(req.query.difficulty);
  }

  if (req.query.sub_type) {
    query += ' AND sub_type = ?';
    params.push(req.query.sub_type);
  }

  // Bounding box filter
  if (req.query.sw_lat && req.query.sw_lng && req.query.ne_lat && req.query.ne_lng) {
    query += ' AND latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?';
    params.push(Number(req.query.sw_lat), Number(req.query.ne_lat), Number(req.query.sw_lng), Number(req.query.ne_lng));
  }

  query += ' ORDER BY name';

  const locations = db.prepare(query).all(...params);
  res.json(locations);
});

// GET /api/locations/search
router.get('/search', (req: Request, res: Response) => {
  const db = getDb();
  const q = req.query.q as string;
  if (!q) {
    res.json([]);
    return;
  }

  const locations = db.prepare(`
    SELECT * FROM locations
    WHERE name LIKE ? OR description LIKE ? OR notes LIKE ? OR sub_type LIKE ?
    ORDER BY name LIMIT 50
  `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  res.json(locations);
});

// POST /api/locations
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const {
    name, description, latitude, longitude, category, sub_type, source,
    cell_signal, shade, level_ground, water_nearby, dump_nearby, max_vehicle_length,
    stay_limit_days, season, crowding, trail_types, difficulty, distance_miles,
    elevation_gain_ft, permit_required, permit_info, scenery_rating, best_season,
    photos, external_links, notes, hours, user_rating, user_notes, visited,
    visited_date, want_to_visit
  } = req.body;

  const result = db.prepare(`
    INSERT INTO locations (name, description, latitude, longitude, category, sub_type, source,
      cell_signal, shade, level_ground, water_nearby, dump_nearby, max_vehicle_length,
      stay_limit_days, season, crowding, trail_types, difficulty, distance_miles,
      elevation_gain_ft, permit_required, permit_info, scenery_rating, best_season,
      photos, external_links, notes, hours, user_rating, user_notes, visited,
      visited_date, want_to_visit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name, description, latitude, longitude, category, sub_type || null, source || 'user',
    cell_signal, shade, level_ground, water_nearby, dump_nearby, max_vehicle_length,
    stay_limit_days, season, crowding,
    trail_types ? (typeof trail_types === 'string' ? trail_types : JSON.stringify(trail_types)) : null,
    difficulty, distance_miles, elevation_gain_ft, permit_required, permit_info,
    scenery_rating, best_season,
    photos ? (typeof photos === 'string' ? photos : JSON.stringify(photos)) : null,
    external_links ? (typeof external_links === 'string' ? external_links : JSON.stringify(external_links)) : null,
    notes, hours, user_rating, user_notes, visited || 0, visited_date, want_to_visit || 0
  );

  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(location);
});

// PUT /api/locations/:id
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const fields = req.body;
  const sets: string[] = [];
  const values: any[] = [];

  const allowedFields = [
    'name', 'description', 'latitude', 'longitude', 'category', 'sub_type', 'source',
    'cell_signal', 'shade', 'level_ground', 'water_nearby', 'dump_nearby', 'max_vehicle_length',
    'stay_limit_days', 'season', 'crowding', 'trail_types', 'difficulty', 'distance_miles',
    'elevation_gain_ft', 'permit_required', 'permit_info', 'scenery_rating', 'best_season',
    'photos', 'external_links', 'notes', 'hours', 'user_rating', 'user_notes', 'visited',
    'visited_date', 'want_to_visit'
  ];

  for (const field of allowedFields) {
    if (field in fields) {
      sets.push(`${field} = ?`);
      let val = fields[field];
      if (['trail_types', 'photos', 'external_links'].includes(field) && typeof val !== 'string' && val !== null) {
        val = JSON.stringify(val);
      }
      values.push(val);
    }
  }

  if (sets.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  sets.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE locations SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  res.json(location);
});

// DELETE /api/locations/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM locations WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// GET /api/locations/stats
router.get('/stats', (_req: Request, res: Response) => {
  const db = getDb();

  const totalLocations = (db.prepare('SELECT COUNT(*) as count FROM locations').get() as any).count;
  const visitedCount = (db.prepare('SELECT COUNT(*) as count FROM locations WHERE visited = 1').get() as any).count;
  const ridingAreas = (db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding'").get() as any).count;
  const ridingVisited = (db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND visited = 1").get() as any).count;
  const campsites = (db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite'").get() as any).count;

  const tripCount = (db.prepare('SELECT COUNT(*) as count FROM trips').get() as any).count;
  const totalNights = (db.prepare('SELECT COALESCE(SUM(nights), 0) as total FROM trip_stops').get() as any).total;
  const totalMiles = (db.prepare('SELECT COALESCE(SUM(drive_distance_miles), 0) as total FROM trip_stops').get() as any).total;

  const topRated = db.prepare('SELECT * FROM locations WHERE user_rating IS NOT NULL ORDER BY user_rating DESC LIMIT 5').all();

  // States visited - approximate from coordinates
  const visitedLocations = db.prepare('SELECT DISTINCT latitude, longitude FROM locations WHERE visited = 1').all();

  res.json({
    totalLocations,
    visitedCount,
    ridingAreas,
    ridingVisited,
    campsites,
    tripCount,
    totalNights,
    totalMiles: Math.round(totalMiles * 10) / 10,
    topRated,
    visitedLocations,
  });
});

export default router;
