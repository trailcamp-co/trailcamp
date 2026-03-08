import { Router, Request, Response } from 'express';
import { eq, and, desc, sql, avg } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { locationReviews, locations, users } from '../db/schema';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).nullish(),
  content: z.string().max(2000).nullish(),
  visited_date: z.string().nullish(),
});

// ─── GET /api/reviews/:locationId — public, get all reviews for a location ──

router.get('/:locationId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);

    const rows = await db
      .select({
        review: locationReviews,
        displayName: users.displayName,
      })
      .from(locationReviews)
      .leftJoin(users, eq(locationReviews.userId, users.id))
      .where(eq(locationReviews.locationId, locationId))
      .orderBy(desc(locationReviews.createdAt));

    // Calculate average
    const [avgRes] = await db
      .select({ avg: sql<number>`round(avg(${locationReviews.rating})::numeric, 1)`, count: sql<number>`count(*)` })
      .from(locationReviews)
      .where(eq(locationReviews.locationId, locationId));

    res.json({
      reviews: rows.map((r) => ({
        id: r.review.id,
        rating: r.review.rating,
        title: r.review.title,
        content: r.review.content,
        visited_date: r.review.visitedDate,
        created_at: r.review.createdAt,
        author: r.displayName || 'Anonymous',
        is_own: req.user?.id === r.review.userId,
      })),
      average_rating: avgRes?.avg ? Number(avgRes.avg) : null,
      review_count: Number(avgRes?.count ?? 0),
    });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews', code: 'INTERNAL_ERROR' });
  }
});

// ─── GET /api/reviews/summary/batch — get avg ratings for multiple locations ─

router.post('/summary/batch', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { location_ids } = req.body as { location_ids: number[] };
    if (!Array.isArray(location_ids) || location_ids.length === 0) {
      res.json({});
      return;
    }
    if (location_ids.length > 500) {
      res.status(400).json({ error: 'Maximum 500 location IDs per batch', code: 'VALIDATION_ERROR' });
      return;
    }

    const rows = await db
      .select({
        locationId: locationReviews.locationId,
        avg: sql<number>`round(avg(${locationReviews.rating})::numeric, 1)`,
        count: sql<number>`count(*)`,
      })
      .from(locationReviews)
      .where(sql`${locationReviews.locationId} IN ${location_ids}`)
      .groupBy(locationReviews.locationId);

    const result: Record<number, { average_rating: number; review_count: number }> = {};
    for (const row of rows) {
      result[row.locationId] = {
        average_rating: Number(row.avg),
        review_count: Number(row.count),
      };
    }
    res.json(result);
  } catch (err) {
    console.error('Error fetching review summaries:', err);
    res.status(500).json({ error: 'Failed to fetch summaries', code: 'INTERNAL_ERROR' });
  }
});

// ─── POST /api/reviews/:locationId — create or update own review ────────────

router.post('/:locationId', requireAuth, validate(reviewSchema), async (req: Request, res: Response) => {
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

    // Check if user already has a review (upsert)
    const [existing] = await db.select().from(locationReviews)
      .where(and(eq(locationReviews.userId, req.user!.id), eq(locationReviews.locationId, locationId)));

    if (existing) {
      const [updated] = await db.update(locationReviews).set({
        rating: body.rating,
        title: body.title ?? null,
        content: body.content ?? null,
        visitedDate: body.visited_date ?? null,
        updatedAt: new Date(),
      }).where(eq(locationReviews.id, existing.id)).returning();

      res.json({ ...updated, updated: true });
    } else {
      const [created] = await db.insert(locationReviews).values({
        locationId,
        userId: req.user!.id,
        rating: body.rating,
        title: body.title ?? null,
        content: body.content ?? null,
        visitedDate: body.visited_date ?? null,
      }).returning();

      res.status(201).json({ ...created, created: true });
    }
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to save review', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/reviews/:locationId — delete own review ────────────────────

router.delete('/:locationId', requireAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    await db.delete(locationReviews)
      .where(and(eq(locationReviews.userId, req.user!.id), eq(locationReviews.locationId, locationId)));
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Failed to delete review', code: 'INTERNAL_ERROR' });
  }
});

export default router;
