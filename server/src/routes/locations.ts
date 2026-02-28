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

  if (req.query.favorited === '1') {
    query += ' AND favorited = 1';
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

  // Distance sort using Haversine
  if (req.query.sort_by === 'distance' && req.query.from_lat && req.query.from_lng) {
    const fromLat = Number(req.query.from_lat);
    const fromLng = Number(req.query.from_lng);
    // Haversine approximation in miles
    query = query.replace('SELECT * FROM locations', `SELECT *,
      (3959 * acos(
        cos(radians(${fromLat})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${fromLng})) +
        sin(radians(${fromLat})) * sin(radians(latitude))
      )) AS distance_from FROM locations`);
    query += ' ORDER BY distance_from';
  } else {
    query += ' ORDER BY name';
  }

  const locations = db.prepare(query).all(...params);

  // Add seasonal_status if trip_month is passed
  if (req.query.trip_month) {
    const month = Number(req.query.trip_month);
    (locations as any[]).forEach(loc => {
      loc.seasonal_status = computeSeasonalStatus(loc, month);
    });
  }

  res.json(locations);
});

// GET /api/locations/featured
router.get('/featured', (req: Request, res: Response) => {
  const db = getDb();
  
  // Get all featured bucket-list locations
  let query = 'SELECT * FROM locations WHERE featured = 1';
  
  // Optional category filter
  if (req.query.category) {
    query += ' AND category = ?';
    const locations = db.prepare(query).all(req.query.category);
    res.json(locations);
    return;
  }
  
  // Order by scenery rating DESC (highest first), then by name
  query += ' ORDER BY scenery_rating DESC, name';
  
  const locations = db.prepare(query).all();
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

  // Relevance scoring: exact match > starts with > contains
  const locations = db.prepare(`
    SELECT *,
      CASE
        WHEN LOWER(name) = LOWER(?) THEN 3
        WHEN LOWER(name) LIKE LOWER(? || '%') THEN 2
        ELSE 1
      END AS relevance
    FROM locations
    WHERE name LIKE ? OR description LIKE ? OR notes LIKE ? OR sub_type LIKE ? OR trail_types LIKE ? OR difficulty LIKE ?
    ORDER BY relevance DESC, name LIMIT 20
  `).all(q, q, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

  res.json(locations);
});

// GET /api/locations/nearby-riding
router.get('/nearby-riding', (req: Request, res: Response) => {
  const db = getDb();
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Number(req.query.radius) || 20;

  if (!lat || !lng) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const locations = db.prepare(`
    SELECT * FROM (
      SELECT *,
        (3959 * acos(
          min(1, max(-1,
            cos(? * 3.14159265359 / 180) * cos(latitude * 3.14159265359 / 180) * cos((longitude - ?) * 3.14159265359 / 180) +
            sin(? * 3.14159265359 / 180) * sin(latitude * 3.14159265359 / 180)
          ))
        )) AS distance_from
      FROM locations
      WHERE category = 'riding'
    ) WHERE distance_from <= ?
    ORDER BY distance_from
  `).all(lat, lng, lat, radius);

  res.json(locations);
});

// GET /api/locations/seasonal
router.get('/seasonal', (req: Request, res: Response) => {
  const db = getDb();
  const month = Number(req.query.month) || new Date().getMonth() + 1;

  const locations = db.prepare('SELECT * FROM locations').all() as any[];
  locations.forEach(loc => {
    loc.seasonal_status = computeSeasonalStatus(loc, month);
  });

  res.json(locations);
});

// PUT /api/locations/:id/favorite
router.put('/:id/favorite', (req: Request, res: Response) => {
  const db = getDb();
  const location = db.prepare('SELECT favorited FROM locations WHERE id = ?').get(req.params.id) as { favorited: number } | undefined;
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }
  const newVal = location.favorited ? 0 : 1;
  db.prepare('UPDATE locations SET favorited = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newVal, req.params.id);
  const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(req.params.id);
  res.json(updated);
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
    'visited_date', 'want_to_visit', 'favorited'
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
router.get('/stats', (req: Request, res: Response) => {
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

  // Trip-specific stats if trip_id provided
  let tripStats = null;
  if (req.query.trip_id) {
    const tripId = Number(req.query.trip_id);
    const stops = db.prepare(`
      SELECT ts.*, l.latitude as loc_lat, l.longitude as loc_lng
      FROM trip_stops ts
      LEFT JOIN locations l ON ts.location_id = l.id
      WHERE ts.trip_id = ?
      ORDER BY ts.sort_order
    `).all(tripId) as any[];

    const tripDriveMiles = stops.reduce((sum: number, s: any) => sum + (s.drive_distance_miles || 0), 0);
    const tripDriveTime = stops.reduce((sum: number, s: any) => sum + (s.drive_time_mins || 0), 0);

    // Count nearby riding areas for all stops
    let nearbyRidingCount = 0;
    const diffCounts: Record<string, number> = { Easy: 0, Moderate: 0, Hard: 0, Expert: 0 };
    const trailTypeCounts: Record<string, number> = {};

    for (const stop of stops) {
      const lat = stop.loc_lat || stop.latitude;
      const lng = stop.loc_lng || stop.longitude;
      if (!lat || !lng) continue;

      const nearby = db.prepare(`
        SELECT difficulty, trail_types FROM locations
        WHERE category = 'riding'
        AND (3959 * acos(
          min(1, max(-1,
            cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) +
            sin(radians(?)) * sin(radians(latitude))
          ))
        )) <= 20
      `).all(lat, lng, lat) as any[];

      nearbyRidingCount += nearby.length;
      for (const r of nearby) {
        if (r.difficulty && diffCounts[r.difficulty] !== undefined) {
          diffCounts[r.difficulty]++;
        }
        if (r.trail_types) {
          try {
            const types = JSON.parse(r.trail_types);
            if (Array.isArray(types)) {
              types.forEach((t: string) => {
                const trimmed = t.trim();
                if (trimmed) trailTypeCounts[trimmed] = (trailTypeCounts[trimmed] || 0) + 1;
              });
            }
          } catch {
            r.trail_types.split(',').forEach((t: string) => {
              const trimmed = t.trim();
              if (trimmed) trailTypeCounts[trimmed] = (trailTypeCounts[trimmed] || 0) + 1;
            });
          }
        }
      }
    }

    tripStats = {
      totalDriveMiles: Math.round(tripDriveMiles * 10) / 10,
      totalDriveTimeMins: Math.round(tripDriveTime),
      nearbyRidingCount,
      difficultyBreakdown: diffCounts,
      trailTypeBreakdown: trailTypeCounts,
      stopCount: stops.length,
    };
  }

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
    tripStats,
  });
});

// Helper: compute seasonal status
function computeSeasonalStatus(loc: any, month: number): 'great' | 'shoulder' | 'bad' {
  // If best_season is set, use it
  if (loc.best_season) {
    const bs = loc.best_season.toLowerCase();
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const currentMonthName = monthNames[month - 1];

    if (bs.includes(currentMonthName) || bs.includes('year-round') || bs.includes('all year')) {
      return 'great';
    }
    // Check if within a season range
    if (bs.includes('spring') && [3, 4, 5].includes(month)) return 'great';
    if (bs.includes('summer') && [6, 7, 8].includes(month)) return 'great';
    if (bs.includes('fall') && [9, 10, 11].includes(month)) return 'great';
    if (bs.includes('winter') && [12, 1, 2].includes(month)) return 'great';

    // Shoulder months (adjacent to best season)
    if (bs.includes('spring') && [2, 6].includes(month)) return 'shoulder';
    if (bs.includes('summer') && [5, 9].includes(month)) return 'shoulder';
    if (bs.includes('fall') && [8, 12].includes(month)) return 'shoulder';
    if (bs.includes('winter') && [11, 3].includes(month)) return 'shoulder';

    return 'bad';
  }

  // Heuristic based on latitude and elevation
  const lat = loc.latitude || 0;
  const elevation = loc.elevation_gain_ft || 0;

  if (lat > 42 || elevation > 7000) {
    // High latitude or high elevation: best May-Oct
    if (month >= 5 && month <= 10) return 'great';
    if (month === 4 || month === 11) return 'shoulder';
    return 'bad';
  }

  if (lat < 33) {
    // Southern / desert: best Oct-Apr
    if (month >= 10 || month <= 4) return 'great';
    if (month === 5 || month === 9) return 'shoulder';
    return 'bad';
  }

  // Mid-latitude: year-round generally fine
  return 'great';
}

// GET /api/locations/export — download all locations as JSON
router.get('/export', (_req: Request, res: Response) => {
  const db = getDb();
  const locations = db.prepare('SELECT * FROM locations ORDER BY category, name').all();
  res.setHeader('Content-Disposition', 'attachment; filename="trailcamp-locations.json"');
  res.setHeader('Content-Type', 'application/json');
  res.json({
    exported: new Date().toISOString(),
    count: locations.length,
    locations,
  });
});

export default router;
