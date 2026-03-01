import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { userFavorites, locations } from '../db/schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── GET /api/favorites ──────────────────────────────────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        favorite: userFavorites,
        location: locations,
      })
      .from(userFavorites)
      .innerJoin(locations, eq(userFavorites.locationId, locations.id))
      .where(eq(userFavorites.userId, req.user!.id))
      .orderBy(userFavorites.createdAt);

    res.json(rows.map((r) => ({
      id: r.favorite.id,
      location_id: r.favorite.locationId,
      created_at: r.favorite.createdAt,
      location: r.location,
    })));
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/favorites/:locationId ─────────────────────────────────────────

router.post('/:locationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);

    // Verify location exists
    const [loc] = await db.select().from(locations).where(eq(locations.id, locationId));
    if (!loc) {
      res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      return;
    }

    // Check if already favorited
    const [existing] = await db.select().from(userFavorites)
      .where(and(eq(userFavorites.userId, req.user!.id), eq(userFavorites.locationId, locationId)));

    if (existing) {
      res.json({ id: existing.id, location_id: locationId, already_existed: true });
      return;
    }

    const [created] = await db.insert(userFavorites).values({
      userId: req.user!.id,
      locationId,
    }).returning();

    res.status(201).json({ id: created.id, location_id: created.locationId });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/favorites/:locationId ───────────────────────────────────────

router.delete('/:locationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    await db.delete(userFavorites)
      .where(and(eq(userFavorites.userId, req.user!.id), eq(userFavorites.locationId, locationId)));
    res.status(204).send();
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite', code: 'INTERNAL_ERROR' });
  }
});

export default router;
