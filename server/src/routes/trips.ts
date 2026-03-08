import { toSnakeCase } from '../utils/caseTransform';
import { Router, Request, Response } from 'express';
import { eq, and, sql, asc, desc, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { trips, tripStops, tripJournal, locations } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();


// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createTripSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullish(),
  status: z.enum(['planning', 'active', 'completed']).default('planning'),
  start_date: z.string().nullish(),
  end_date: z.string().nullish(),
  notes: z.string().nullish(),
});

const updateTripSchema = createTripSchema.partial();

const createStopSchema = z.object({
  location_id: z.number().int().nullish(),
  name: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  planned_arrival: z.string().nullish(),
  planned_departure: z.string().nullish(),
  nights: z.number().int().nullish(),
  notes: z.string().nullish(),
});

const updateStopSchema = z.object({
  sort_order: z.number().int().nullish(),
  planned_arrival: z.string().nullish(),
  planned_departure: z.string().nullish(),
  actual_arrival: z.string().nullish(),
  actual_departure: z.string().nullish(),
  nights: z.number().int().nullish(),
  notes: z.string().nullish(),
  name: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  drive_time_mins: z.number().int().nullish(),
  drive_distance_miles: z.number().nullish(),
});

const journalSchema = z.object({
  stop_id: z.number().int().nullish(),
  content: z.string().min(1, 'Content is required'),
  entry_date: z.string().nullish(),
});

const updateJournalSchema = z.object({
  stop_id: z.number().int().nullish(),
  content: z.string().min(1, 'Content is required').optional(),
  entry_date: z.string().nullish(),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateTotalDistance(stops: { latitude: number | null; longitude: number | null }[]): number {
  let total = 0;
  for (let i = 1; i < stops.length; i++) {
    const prev = stops[i - 1];
    const curr = stops[i];
    if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
      total += haversineDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
  }
  return total;
}

function escapeXml(s: string | null | undefined): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Verify trip belongs to the authenticated user. Returns trip or sends 404. */
async function getUserTrip(tripId: number, userId: string, res: Response) {
  const [trip] = await db.select().from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId)));
  if (!trip) {
    res.status(404).json({ error: 'Trip not found', code: 'NOT_FOUND' });
    return null;
  }
  return trip;
}

// ─── GET /api/trips ──────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        trip: trips,
        stopCount: sql<number>`(SELECT COUNT(*) FROM trip_stops WHERE trip_id = ${trips.id})`,
        totalNights: sql<number>`(SELECT COALESCE(SUM(nights), 0) FROM trip_stops WHERE trip_id = ${trips.id})`,
        totalDistance: sql<number>`(SELECT COALESCE(SUM(drive_distance_miles), 0) FROM trip_stops WHERE trip_id = ${trips.id})`,
      })
      .from(trips)
      .where(eq(trips.userId, req.user!.id))
      .orderBy(desc(trips.createdAt));

    res.json(rows.map((r) => ({
      ...toSnakeCase(r.trip as unknown as Record<string, unknown>),
      stop_count: r.stopCount,
      total_nights: r.totalNights,
      total_distance: r.totalDistance,
    })));
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ error: 'Failed to fetch trips', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/trips ─────────────────────────────────────────────────────────

router.post('/', requireAuth, validate(createTripSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const [created] = await db.insert(trips).values({
      userId: req.user!.id,
      name: body.name,
      description: body.description ?? null,
      status: body.status ?? 'planning',
      startDate: body.start_date ?? null,
      endDate: body.end_date ?? null,
      notes: body.notes ?? null,
    }).returning();
    res.status(201).json(toSnakeCase(created as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Failed to create trip', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/trips/:id ──────────────────────────────────────────────────────

router.put('/:id', requireAuth, validate(updateTripSchema), async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if ('name' in body) updateData.name = body.name;
    if ('description' in body) updateData.description = body.description;
    if ('status' in body) updateData.status = body.status;
    if ('start_date' in body) updateData.startDate = body.start_date;
    if ('end_date' in body) updateData.endDate = body.end_date;
    if ('notes' in body) updateData.notes = body.notes;

    const [updated] = await db.update(trips).set(updateData)
      .where(eq(trips.id, trip.id)).returning();
    res.json(toSnakeCase(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ error: 'Failed to update trip', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/trips/:id/duplicate ───────────────────────────────────────────

router.post('/:id/duplicate', requireAuth, async (req: Request, res: Response) => {
  try {
    const original = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!original) return;

    const [newTrip] = await db.insert(trips).values({
      userId: req.user!.id,
      name: `${original.name} (Copy)`,
      description: original.description,
      status: 'planning',
      startDate: original.startDate,
      endDate: original.endDate,
      notes: original.notes,
    }).returning();

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, original.id)).orderBy(asc(tripStops.sortOrder));

    for (const s of stops) {
      await db.insert(tripStops).values({
        tripId: newTrip.id,
        locationId: s.locationId,
        name: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        sortOrder: s.sortOrder,
        nights: s.nights,
        notes: s.notes,
        driveDistanceMiles: s.driveDistanceMiles,
        driveTimeMins: s.driveTimeMins,
      });
    }

    res.status(201).json(toSnakeCase(newTrip as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error duplicating trip:', err);
    res.status(500).json({ error: 'Failed to duplicate trip', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/trips/:id ───────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;
    await db.delete(trips).where(eq(trips.id, trip.id));
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting trip:', err);
    res.status(500).json({ error: 'Failed to delete trip', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/trips/:id/stops ────────────────────────────────────────────────

router.get('/:id/stops', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const rows = await db
      .select({
        stop: tripStops,
        locationName: locations.name,
        locationCategory: locations.category,
        locationSubType: locations.subType,
        locationDifficulty: locations.difficulty,
      })
      .from(tripStops)
      .leftJoin(locations, eq(tripStops.locationId, locations.id))
      .where(eq(tripStops.tripId, trip.id))
      .orderBy(asc(tripStops.sortOrder));

    res.json(rows.map((r) => ({
      ...toSnakeCase(r.stop as unknown as Record<string, unknown>),
      location_name: r.locationName,
      location_category: r.locationCategory,
      location_sub_type: r.locationSubType,
      location_difficulty: r.locationDifficulty,
    })));
  } catch (err) {
    console.error('Error fetching stops:', err);
    res.status(500).json({ error: 'Failed to fetch stops', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/trips/:id/stops ───────────────────────────────────────────────

router.post('/:id/stops', requireAuth, validate(createStopSchema), async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const body = req.body;
    const [maxRes] = await db.select({ maxOrder: sql<number>`COALESCE(MAX(sort_order), -1)` })
      .from(tripStops).where(eq(tripStops.tripId, trip.id));
    const sortOrder = (maxRes?.maxOrder ?? -1) + 1;

    const [created] = await db.insert(tripStops).values({
      tripId: trip.id,
      locationId: body.location_id ?? null,
      name: body.name ?? null,
      latitude: body.latitude,
      longitude: body.longitude,
      sortOrder,
      plannedArrival: body.planned_arrival ?? null,
      plannedDeparture: body.planned_departure ?? null,
      nights: body.nights ?? null,
      notes: body.notes ?? null,
    }).returning();

    res.status(201).json(toSnakeCase(created as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error creating stop:', err);
    res.status(500).json({ error: 'Failed to create stop', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/trips/:id/stops/:stopId ────────────────────────────────────────

router.put('/:id/stops/:stopId', requireAuth, validate(updateStopSchema), async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const stopId = Number(req.params.stopId);
    const body = req.body;
    const updateData: Record<string, unknown> = {};

    if (body.sort_order != null) updateData.sortOrder = body.sort_order;
    if (body.planned_arrival !== undefined) updateData.plannedArrival = body.planned_arrival;
    if (body.planned_departure !== undefined) updateData.plannedDeparture = body.planned_departure;
    if (body.actual_arrival !== undefined) updateData.actualArrival = body.actual_arrival;
    if (body.actual_departure !== undefined) updateData.actualDeparture = body.actual_departure;
    if (body.nights !== undefined) updateData.nights = body.nights;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.drive_time_mins !== undefined) updateData.driveTimeMins = body.drive_time_mins;
    if (body.drive_distance_miles !== undefined) updateData.driveDistanceMiles = body.drive_distance_miles;

    const [updated] = await db.update(tripStops).set(updateData)
      .where(and(eq(tripStops.id, stopId), eq(tripStops.tripId, trip.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Stop not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(toSnakeCase(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error updating stop:', err);
    res.status(500).json({ error: 'Failed to update stop', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/trips/:id/reorder ──────────────────────────────────────────────

router.put('/:id/reorder', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const { stopIds } = req.body as { stopIds: number[] };
    if (!Array.isArray(stopIds)) {
      res.status(400).json({ error: 'stopIds must be an array', code: 'VALIDATION_ERROR' });
      return;
    }

    for (let i = 0; i < stopIds.length; i++) {
      await db.update(tripStops).set({ sortOrder: i })
        .where(and(eq(tripStops.id, stopIds[i]), eq(tripStops.tripId, trip.id)));
    }

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));
    res.json(stops.map(s => toSnakeCase(s as unknown as Record<string, unknown>)));
  } catch (err) {
    console.error('Error reordering stops:', err);
    res.status(500).json({ error: 'Failed to reorder stops', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/trips/:id/stops/:stopId ─────────────────────────────────────

router.delete('/:id/stops/:stopId', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;
    await db.delete(tripStops).where(and(eq(tripStops.id, Number(req.params.stopId)), eq(tripStops.tripId, trip.id)));
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting stop:', err);
    res.status(500).json({ error: 'Failed to delete stop', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/trips/:id/optimize ────────────────────────────────────────────

router.post('/:id/optimize', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));

    if (stops.length < 3) {
      res.json({ stops, saved: 0 });
      return;
    }

    const originalDistance = calculateTotalDistance(stops);

    // Nearest-neighbor TSP: keep first stop fixed
    const optimized = [stops[0]];
    const remaining = stops.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIdx = 0;
      let nearestDist = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        if (!current.latitude || !current.longitude || !remaining[i].latitude || !remaining[i].longitude) continue;
        const dist = haversineDistance(current.latitude, current.longitude, remaining[i].latitude!, remaining[i].longitude!);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = i;
        }
      }

      optimized.push(remaining[nearestIdx]);
      remaining.splice(nearestIdx, 1);
    }

    // 2-opt improvement
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 1; i < optimized.length - 1; i++) {
        for (let j = i + 1; j < optimized.length; j++) {
          const a = optimized[i - 1], b = optimized[i], c = optimized[j];
          const d = optimized[(j + 1) % optimized.length];
          if (!a.latitude || !b.latitude || !c.latitude || !d.latitude) continue;
          if (!a.longitude || !b.longitude || !c.longitude || !d.longitude) continue;

          const before = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude) +
            haversineDistance(c.latitude, c.longitude, d.latitude, d.longitude);
          const after = haversineDistance(a.latitude, a.longitude, c.latitude, c.longitude) +
            haversineDistance(b.latitude, b.longitude, d.latitude, d.longitude);

          if (after < before - 0.1) {
            const reversed = [...optimized.slice(0, i), ...optimized.slice(i, j + 1).reverse(), ...optimized.slice(j + 1)];
            optimized.splice(0, optimized.length, ...reversed);
            improved = true;
          }
        }
      }
    }

    // Save new order
    for (let i = 0; i < optimized.length; i++) {
      await db.update(tripStops).set({ sortOrder: i }).where(eq(tripStops.id, optimized[i].id));
    }

    const newDistance = calculateTotalDistance(optimized);
    const saved = Math.round((originalDistance - newDistance) * 10) / 10;

    const updatedStops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));
    res.json({ stops: updatedStops.map(s => toSnakeCase(s as unknown as Record<string, unknown>)), saved: Math.max(0, saved) });
  } catch (err) {
    console.error('Error optimizing trip:', err);
    res.status(500).json({ error: 'Failed to optimize trip', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/trips/:id/route ────────────────────────────────────────────────

router.get('/:id/route', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));

    if (stops.length < 2) {
      res.json({ routes: [], stops });
      return;
    }

    const coords = stops.map((s) => `${s.longitude},${s.latitude}`).join(';');
    const mapboxToken = process.env.MAPBOX_SECRET_KEY || process.env.MAPBOX_PUBLIC_KEY;

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${mapboxToken}`
      );
      const data = await response.json();
      res.json({ route: data, stops });
    } catch {
      res.json({ route: null, stops, error: 'Failed to fetch route' });
    }
  } catch (err) {
    console.error('Error fetching route:', err);
    res.status(500).json({ error: 'Failed to fetch route', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/trips/:id/export-gpx ──────────────────────────────────────────

router.get('/:id/export-gpx', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));

    // Find nearby riding spots using bounding box (instead of loading all)
    const validStops = stops.filter(s => s.latitude && s.longitude);
    const nearbyRiding: (typeof locations.$inferSelect)[] = [];

    if (validStops.length > 0) {
      const lats = validStops.map(s => s.latitude!);
      const lngs = validStops.map(s => s.longitude!);
      const pad = 0.3; // ~20 miles in degrees
      const south = Math.min(...lats) - pad;
      const north = Math.max(...lats) + pad;
      const west = Math.min(...lngs) - pad;
      const east = Math.max(...lngs) + pad;

      const candidates = await db.select().from(locations).where(and(
        eq(locations.category, 'riding'),
        gte(locations.latitude, south),
        lte(locations.latitude, north),
        gte(locations.longitude, west),
        lte(locations.longitude, east),
      ));

      const seenIds = new Set<number>();
      for (const stop of validStops) {
        for (const spot of candidates) {
          if (seenIds.has(spot.id)) continue;
          const dist = haversineDistance(stop.latitude!, stop.longitude!, spot.latitude, spot.longitude);
          if (dist <= 20) {
            nearbyRiding.push(spot);
            seenIds.add(spot.id);
          }
        }
      }
    }

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailCamp" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(trip.name)}</name>
    <desc>${escapeXml(trip.description)}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>\n`;

    for (const stop of stops) {
      gpx += `  <wpt lat="${stop.latitude}" lon="${stop.longitude}">
    <name>${escapeXml(stop.name)}</name>
    <desc>${escapeXml(stop.notes)}</desc>
    <sym>Campground</sym>
  </wpt>\n`;
    }

    for (const spot of nearbyRiding) {
      gpx += `  <wpt lat="${spot.latitude}" lon="${spot.longitude}">
    <name>${escapeXml(spot.name)}</name>
    <desc>${escapeXml(spot.description)}</desc>
    <sym>Trail Head</sym>
  </wpt>\n`;
    }

    if (stops.length >= 2) {
      gpx += `  <trk>\n    <name>${escapeXml(trip.name)} Route</name>\n    <trkseg>\n`;
      for (const stop of stops) {
        gpx += `      <trkpt lat="${stop.latitude}" lon="${stop.longitude}"><name>${escapeXml(stop.name)}</name></trkpt>\n`;
      }
      gpx += `    </trkseg>\n  </trk>\n`;
    }

    gpx += `</gpx>`;

    const filename = `${trip.name.replace(/[^a-zA-Z0-9]/g, '_')}.gpx`;
    res.setHeader('Content-Type', 'application/gpx+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(gpx);
  } catch (err) {
    console.error('Error exporting GPX:', err);
    res.status(500).json({ error: 'Failed to export GPX', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/trips/:id/export-markdown ──────────────────────────────────────

router.get('/:id/export-markdown', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const stops = await db.select().from(tripStops)
      .where(eq(tripStops.tripId, trip.id)).orderBy(asc(tripStops.sortOrder));

    const lines: string[] = [];
    lines.push(`# ${trip.name}`, '');
    if (trip.description) lines.push(`> ${trip.description}`, '');
    lines.push(`**Status:** ${trip.status} | **Start:** ${trip.startDate || 'TBD'}`);

    const totalNights = stops.reduce((s, st) => s + (st.nights || 0), 0);
    const totalMiles = stops.reduce((s, st) => s + (st.driveDistanceMiles || 0), 0);
    lines.push(`**Stops:** ${stops.length} | **Nights:** ${totalNights} | **Driving:** ${Math.round(totalMiles)} mi`);
    lines.push('', '---', '');

    let currentDate = trip.startDate || '';
    stops.forEach((stop, i) => {
      const name = stop.name || `Stop ${i + 1}`;
      lines.push(`## ${i + 1}. ${name}`, '');
      lines.push(`📍 ${stop.latitude?.toFixed(4)}, ${stop.longitude?.toFixed(4)}`);
      if (stop.nights) lines.push(`🏕️ ${stop.nights} night${stop.nights > 1 ? 's' : ''}`);
      if (currentDate) {
        lines.push(`📅 ${currentDate}`);
        const d = new Date(currentDate + 'T00:00:00');
        d.setDate(d.getDate() + (stop.nights || 1));
        currentDate = d.toISOString().split('T')[0];
      }
      if (stop.driveDistanceMiles) {
        const mins = stop.driveTimeMins || 0;
        lines.push(`🚗 ${Math.round(stop.driveDistanceMiles)} mi${mins ? ` (~${Math.floor(mins / 60)}h ${mins % 60}m)` : ''}`);
      }
      if (stop.notes) lines.push(`\n${stop.notes}`);
      lines.push('');
    });

    lines.push('---', '*Generated by TrailCamp*');

    const filename = `${trip.name.replace(/[^a-zA-Z0-9 -]/g, '')}.md`;
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(lines.join('\n'));
  } catch (err) {
    console.error('Error exporting markdown:', err);
    res.status(500).json({ error: 'Failed to export markdown', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/trips/:id/journal ──────────────────────────────────────────────

router.get('/:id/journal', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const entries = await db
      .select({
        entry: tripJournal,
        stopName: tripStops.name,
      })
      .from(tripJournal)
      .leftJoin(tripStops, eq(tripJournal.stopId, tripStops.id))
      .where(eq(tripJournal.tripId, trip.id))
      .orderBy(desc(tripJournal.entryDate), desc(tripJournal.createdAt));

    res.json(entries.map((r) => ({ ...toSnakeCase(r.entry as unknown as Record<string, unknown>), stop_name: r.stopName })));
  } catch (err) {
    console.error('Error fetching journal:', err);
    res.status(500).json({ error: 'Failed to fetch journal', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/trips/:id/journal ─────────────────────────────────────────────

router.post('/:id/journal', requireAuth, validate(journalSchema), async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const body = req.body;
    const [created] = await db.insert(tripJournal).values({
      tripId: trip.id,
      stopId: body.stop_id ?? null,
      userId: req.user!.id,
      content: body.content.trim(),
      entryDate: body.entry_date ?? new Date().toISOString().split('T')[0],
    }).returning();

    res.status(201).json(toSnakeCase(created as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error creating journal entry:', err);
    res.status(500).json({ error: 'Failed to create journal entry', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/trips/:id/journal/:entryId ──────────────────────────────────────

router.put('/:id/journal/:entryId', requireAuth, validate(updateJournalSchema), async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    const entryId = Number(req.params.entryId);
    const body = req.body;
    const updateData: Record<string, unknown> = {};

    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.stop_id !== undefined) updateData.stopId = body.stop_id;
    if (body.entry_date !== undefined) updateData.entryDate = body.entry_date;

    const [updated] = await db.update(tripJournal).set(updateData)
      .where(and(eq(tripJournal.id, entryId), eq(tripJournal.tripId, trip.id)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Journal entry not found', code: 'NOT_FOUND' });
      return;
    }
    res.json(toSnakeCase(updated as unknown as Record<string, unknown>));
  } catch (err) {
    console.error('Error updating journal entry:', err);
    res.status(500).json({ error: 'Failed to update journal entry', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/trips/:id/journal/:entryId ──────────────────────────────────

router.delete('/:id/journal/:entryId', requireAuth, async (req: Request, res: Response) => {
  try {
    const trip = await getUserTrip(Number(req.params.id), req.user!.id, res);
    if (!trip) return;

    await db.delete(tripJournal).where(
      and(eq(tripJournal.id, Number(req.params.entryId)), eq(tripJournal.tripId, trip.id))
    );
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting journal entry:', err);
    res.status(500).json({ error: 'Failed to delete journal entry', code: 'INTERNAL_ERROR' });
  }
});

export default router;
