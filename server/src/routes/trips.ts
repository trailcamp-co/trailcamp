import { Router, Request, Response } from 'express';
import { getDb } from '../database';

const router = Router();

// GET /api/trips
router.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const trips = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id) as stop_count,
      (SELECT SUM(nights) FROM trip_stops WHERE trip_id = t.id) as total_nights,
      (SELECT SUM(drive_distance_miles) FROM trip_stops WHERE trip_id = t.id) as total_distance
    FROM trips t ORDER BY t.created_at DESC
  `).all();
  res.json(trips);
});

// POST /api/trips
router.post('/', (req: Request, res: Response) => {
  const db = getDb();
  const { name, description, status, start_date, end_date, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO trips (name, description, status, start_date, end_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description, status || 'planning', start_date, end_date, notes);
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(trip);
});

// PUT /api/trips/:id
router.put('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const fields = req.body;
  const sets: string[] = [];
  const values: any[] = [];
  const allowedFields = ['name', 'description', 'status', 'start_date', 'end_date', 'notes'];

  for (const field of allowedFields) {
    if (field in fields) {
      sets.push(`${field} = ?`);
      values.push(fields[field]);
    }
  }

  if (sets.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  sets.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE trips SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  res.json(trip);
});

// DELETE /api/trips/:id
router.delete('/:id', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM trips WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

// GET /api/trips/:id/stops
router.get('/:id/stops', (req: Request, res: Response) => {
  const db = getDb();
  const stops = db.prepare(`
    SELECT ts.*, l.name as location_name, l.category as location_category
    FROM trip_stops ts
    LEFT JOIN locations l ON ts.location_id = l.id
    WHERE ts.trip_id = ?
    ORDER BY ts.sort_order
  `).all(req.params.id);
  res.json(stops);
});

// POST /api/trips/:id/stops
router.post('/:id/stops', (req: Request, res: Response) => {
  const db = getDb();
  const { location_id, name, latitude, longitude, planned_arrival, planned_departure, nights, notes } = req.body;

  // Get max sort_order
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM trip_stops WHERE trip_id = ?').get(req.params.id) as { max_order: number | null };
  const sort_order = (maxOrder.max_order ?? -1) + 1;

  const result = db.prepare(`
    INSERT INTO trip_stops (trip_id, location_id, name, latitude, longitude, sort_order, planned_arrival, planned_departure, nights, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, location_id || null, name, latitude, longitude, sort_order, planned_arrival, planned_departure, nights, notes);

  const stop = db.prepare('SELECT * FROM trip_stops WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(stop);
});

// PUT /api/trips/:id/stops/:stopId
router.put('/:id/stops/:stopId', (req: Request, res: Response) => {
  const db = getDb();
  const { sort_order, planned_arrival, planned_departure, actual_arrival, actual_departure, nights, notes, name, latitude, longitude, drive_time_mins, drive_distance_miles } = req.body;

  db.prepare(`
    UPDATE trip_stops SET sort_order = COALESCE(?, sort_order), planned_arrival = COALESCE(?, planned_arrival),
    planned_departure = COALESCE(?, planned_departure), actual_arrival = COALESCE(?, actual_arrival),
    actual_departure = COALESCE(?, actual_departure), nights = COALESCE(?, nights), notes = COALESCE(?, notes),
    name = COALESCE(?, name), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
    drive_time_mins = COALESCE(?, drive_time_mins), drive_distance_miles = COALESCE(?, drive_distance_miles)
    WHERE id = ? AND trip_id = ?
  `).run(sort_order, planned_arrival, planned_departure, actual_arrival, actual_departure, nights, notes, name, latitude, longitude, drive_time_mins, drive_distance_miles, req.params.stopId, req.params.id);

  const stop = db.prepare('SELECT * FROM trip_stops WHERE id = ?').get(req.params.stopId);
  res.json(stop);
});

// PUT /api/trips/:id/stops/reorder
router.put('/:id/reorder', (req: Request, res: Response) => {
  const db = getDb();
  const { stopIds } = req.body; // array of stop IDs in new order

  const update = db.prepare('UPDATE trip_stops SET sort_order = ? WHERE id = ? AND trip_id = ?');
  const reorder = db.transaction((ids: number[]) => {
    ids.forEach((id, index) => {
      update.run(index, id, req.params.id);
    });
  });

  reorder(stopIds);

  const stops = db.prepare('SELECT * FROM trip_stops WHERE trip_id = ? ORDER BY sort_order').all(req.params.id);
  res.json(stops);
});

// DELETE /api/trips/:id/stops/:stopId
router.delete('/:id/stops/:stopId', (req: Request, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM trip_stops WHERE id = ? AND trip_id = ?').run(req.params.stopId, req.params.id);
  res.status(204).send();
});

// POST /api/trips/:id/optimize
router.post('/:id/optimize', (req: Request, res: Response) => {
  const db = getDb();
  const stops = db.prepare('SELECT * FROM trip_stops WHERE trip_id = ? ORDER BY sort_order').all(req.params.id) as any[];

  if (stops.length < 3) {
    res.json({ stops, saved: 0 });
    return;
  }

  // Calculate original total distance
  const originalDistance = calculateTotalDistance(stops);

  // Nearest-neighbor TSP: keep first stop fixed
  const optimized: any[] = [stops[0]];
  const remaining = stops.slice(1);

  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(
        current.latitude, current.longitude,
        remaining[i].latitude, remaining[i].longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }

  // 2-opt improvement: swap pairs to eliminate backtracking
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < optimized.length - 1; i++) {
      for (let j = i + 1; j < optimized.length; j++) {
        const before = segmentDistance(optimized, i - 1, i) + segmentDistance(optimized, j, (j + 1) % optimized.length);
        // Reverse the segment between i and j
        const reversed = [...optimized.slice(0, i), ...optimized.slice(i, j + 1).reverse(), ...optimized.slice(j + 1)];
        const after = segmentDistance(reversed, i - 1, i) + segmentDistance(reversed, j, (j + 1) % reversed.length);
        if (after < before - 0.1) {
          optimized.splice(0, optimized.length, ...reversed);
          improved = true;
        }
      }
    }
  }

  // Update sort_order for all stops
  const updateStmt = db.prepare('UPDATE trip_stops SET sort_order = ? WHERE id = ?');
  const reorder = db.transaction(() => {
    optimized.forEach((stop, index) => {
      updateStmt.run(index, stop.id);
    });
  });
  reorder();

  const newDistance = calculateTotalDistance(optimized);
  const saved = Math.round((originalDistance - newDistance) * 10) / 10;

  const updatedStops = db.prepare('SELECT * FROM trip_stops WHERE trip_id = ? ORDER BY sort_order').all(req.params.id);
  res.json({ stops: updatedStops, saved: Math.max(0, saved) });
});

function segmentDistance(stops: any[], i: number, j: number): number {
  if (i < 0 || j >= stops.length) return 0;
  return haversineDistance(stops[i].latitude, stops[i].longitude, stops[j].latitude, stops[j].longitude);
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateTotalDistance(stops: any[]): number {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    total += haversineDistance(
      stops[i - 1].latitude, stops[i - 1].longitude,
      stops[i].latitude, stops[i].longitude
    );
  }
  return total;
}

// GET /api/trips/:id/route
router.get('/:id/route', async (req: Request, res: Response) => {
  const db = getDb();
  const stops = db.prepare('SELECT * FROM trip_stops WHERE trip_id = ? ORDER BY sort_order').all(req.params.id) as any[];

  if (stops.length < 2) {
    res.json({ routes: [], stops });
    return;
  }

  const coords = stops.map((s: any) => `${s.longitude},${s.latitude}`).join(';');
  const mapboxToken = process.env.MAPBOX_SECRET_KEY;

  try {
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`
    );
    const data = await response.json();
    res.json({ route: data, stops });
  } catch (error) {
    res.json({ route: null, stops, error: 'Failed to fetch route' });
  }
});

export default router;
