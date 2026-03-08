import { Router, Request, Response } from 'express';
import { eq, sql, and } from 'drizzle-orm';
import { db } from '../db';
import { locations } from '../db/schema';
import { requireAuth } from '../middleware/auth';

const router = Router();

// POST /api/import/ioverlander — admin only
router.post('/ioverlander', requireAuth, async (req: Request, res: Response) => {
  // Admin-only check
  const adminId = process.env.ADMIN_USER_ID;
  if (!adminId || req.user!.id !== adminId) {
    res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    return;
  }

  const { sw_lat, sw_lng, ne_lat, ne_lng } = req.body;

  if (!sw_lat || !sw_lng || !ne_lat || !ne_lng) {
    res.status(400).json({ error: 'Bounding box required: sw_lat, sw_lng, ne_lat, ne_lng' });
    return;
  }

  try {
    const url = `https://www.ioverlander.com/api/places?sw_lat=${sw_lat}&sw_lng=${sw_lng}&ne_lat=${ne_lat}&ne_lng=${ne_lng}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (!response.ok) {
      res.status(502).json({ error: `iOverlander API returned ${response.status}` });
      return;
    }

    const places = await response.json();
    if (!Array.isArray(places)) {
      res.json({ imported: 0, skipped: 0, total: 0 });
      return;
    }

    const categoryMap: Record<string, string> = {
      'Wild Camping': 'campsite', 'Established Campground': 'campsite',
      'Informal Campsite': 'campsite', 'Water': 'water', 'Drinking Water': 'water',
      'Dump Station': 'dump', 'Gas Station': 'gas', 'Fuel Station': 'gas',
      'Grocery Store': 'grocery', 'Supermarket': 'grocery', 'Laundry': 'laundromat',
      'Scenic/Interesting Place': 'scenic',
    };

    let imported = 0;
    let skipped = 0;

    for (const place of places) {
      const category = categoryMap[place.category] || categoryMap[place.type] || 'campsite';
      const [existing] = await db.select({ id: locations.id }).from(locations)
        .where(and(eq(locations.source, 'ioverlander'), eq(locations.sourceId, String(place.id))));

      if (existing) { skipped++; continue; }

      try {
        await db.insert(locations).values({
          name: place.name,
          description: place.description || null,
          latitude: place.latitude,
          longitude: place.longitude,
          category,
          source: 'ioverlander',
          sourceId: String(place.id),
          notes: place.description || null,
          waterNearby: place.water ? 1 : 0,
        });
        imported++;
      } catch { skipped++; }
    }

    res.json({ imported, skipped, total: places.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from iOverlander', details: String(error) });
  }
});

// GET /api/import/status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const [total] = await db.select({ c: sql<number>`count(*)` }).from(locations);
    const [ioverlander] = await db.select({ c: sql<number>`count(*)` }).from(locations).where(eq(locations.source, 'ioverlander'));
    const [recGov] = await db.select({ c: sql<number>`count(*)` }).from(locations).where(eq(locations.source, 'recreation_gov'));
    const [agentCurated] = await db.select({ c: sql<number>`count(*)` }).from(locations).where(eq(locations.source, 'agent_curated'));
    const [user] = await db.select({ c: sql<number>`count(*)` }).from(locations).where(eq(locations.source, 'user'));

    res.json({
      total: total.c, ioverlander: ioverlander.c, recreation_gov: recGov.c,
      agent_curated: agentCurated.c, user: user.c,
    });
  } catch (err) {
    console.error('Error fetching import status:', err);
    res.status(500).json({ error: 'Failed to fetch status', code: 'INTERNAL_ERROR' });
  }
});

export default router;
