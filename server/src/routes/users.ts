import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { users, trips, locations, userFavorites, userSettings, tripJournal } from '../db/schema';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).nullish(),
  avatar_url: z.string().url().nullish(),
  home_lat: z.number().min(-90).max(90).nullish(),
  home_lon: z.number().min(-180).max(180).nullish(),
  home_address: z.string().max(500).nullish(),
  units_preference: z.enum(['imperial', 'metric']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
});

// ─── GET /api/users/me ───────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    let [user] = await db.select().from(users).where(eq(users.id, req.user!.id));

    // Auto-create user record on first API call (Supabase Auth creates the auth user,
    // but we need a row in our users table too)
    if (!user) {
      [user] = await db.insert(users).values({
        id: req.user!.id,
        email: req.user!.email,
      }).returning();
    }

    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, req.user!.id));

    res.json({ ...user, settings: settings ?? null });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile', code: 'INTERNAL_ERROR' });
  }
});

// ─── PUT /api/users/me ───────────────────────────────────────────────────────

router.put('/me', requireAuth, validate(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if ('display_name' in body) updateData.displayName = body.display_name;
    if ('avatar_url' in body) updateData.avatarUrl = body.avatar_url;
    if ('home_lat' in body) updateData.homeLat = body.home_lat;
    if ('home_lon' in body) updateData.homeLon = body.home_lon;
    if ('home_address' in body) updateData.homeAddress = body.home_address;
    if ('units_preference' in body) updateData.unitsPreference = body.units_preference;
    if ('theme' in body) updateData.theme = body.theme;

    // Upsert: create if doesn't exist
    const [existing] = await db.select().from(users).where(eq(users.id, req.user!.id));
    let user;
    if (existing) {
      [user] = await db.update(users).set(updateData).where(eq(users.id, req.user!.id)).returning();
    } else {
      [user] = await db.insert(users).values({
        id: req.user!.id,
        email: req.user!.email,
        ...updateData,
      }).returning();
    }

    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile', code: 'INTERNAL_ERROR' });
  }
});

// ─── DELETE /api/users/me ────────────────────────────────────────────────────
// Deletes all user data. Cascading FKs handle trips, journal, favorites, settings.

router.delete('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    // Delete user-owned locations (private ones)
    await db.delete(locations).where(eq(locations.userId, req.user!.id));
    // Delete user record (cascades to trips, favorites, settings, journal)
    await db.delete(users).where(eq(users.id, req.user!.id));
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Failed to delete account', code: 'INTERNAL_ERROR' });
  }
});

export default router;
