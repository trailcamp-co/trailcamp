import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { userLocationData, locations } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const updateSchema = z.object({
  visited: z.number().int().min(0).max(1).optional(),
  visited_date: z.string().nullish(),
  want_to_visit: z.number().int().min(0).max(1).optional(),
  user_rating: z.number().int().min(1).max(5).nullish(),
  user_notes: z.string().nullish(),
});

// ─── GET /api/userdata — get all user's annotations ─────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(userLocationData)
      .where(eq(userLocationData.userId, req.user!.id));

    // Return as a map: { [locationId]: { visited, rating, notes, ... } }
    const map: Record<number, Record<string, unknown>> = {};
    for (const row of rows) {
      map[row.locationId] = {
        visited: row.visited,
        visited_date: row.visitedDate,
        want_to_visit: row.wantToVisit,
        user_rating: row.userRating,
        user_notes: row.userNotes,
      };
    }
    res.json(map);
  } catch (err) {
    console.error('Error fetching user data:', err);
    res.status(500).json({ error: 'Failed to fetch user data', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/userdata/:locationId — upsert user annotation for a location ──

router.put('/:locationId', requireAuth, validate(updateSchema), async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);

    // Verify location exists
    const [loc] = await db.select({ id: locations.id }).from(locations)
      .where(eq(locations.id, locationId));
    if (!loc) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }

    const body = req.body;
    const [existing] = await db.select().from(userLocationData)
      .where(and(eq(userLocationData.userId, req.user!.id), eq(userLocationData.locationId, locationId)));

    if (existing) {
      // Update
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if ('visited' in body) updateData.visited = body.visited;
      if ('visited_date' in body) updateData.visitedDate = body.visited_date;
      if ('want_to_visit' in body) updateData.wantToVisit = body.want_to_visit;
      if ('user_rating' in body) updateData.userRating = body.user_rating;
      if ('user_notes' in body) updateData.userNotes = body.user_notes;

      await db.update(userLocationData).set(updateData)
        .where(eq(userLocationData.id, existing.id));

      const [updated] = await db.select().from(userLocationData)
        .where(eq(userLocationData.id, existing.id));

      res.json({
        location_id: locationId,
        visited: updated.visited,
        visited_date: updated.visitedDate,
        want_to_visit: updated.wantToVisit,
        user_rating: updated.userRating,
        user_notes: updated.userNotes,
      });
    } else {
      // Insert
      const [created] = await db.insert(userLocationData).values({
        userId: req.user!.id,
        locationId,
        visited: body.visited ?? 0,
        visitedDate: body.visited_date ?? null,
        wantToVisit: body.want_to_visit ?? 0,
        userRating: body.user_rating ?? null,
        userNotes: body.user_notes ?? null,
      }).returning();

      res.status(201).json({
        location_id: locationId,
        visited: created.visited,
        visited_date: created.visitedDate,
        want_to_visit: created.wantToVisit,
        user_rating: created.userRating,
        user_notes: created.userNotes,
      });
    }
  } catch (err) {
    console.error('Error updating user data:', err);
    res.status(500).json({ error: 'Failed to update user data', code: 'INTERNAL_ERROR' });
  }
});

export default router;
