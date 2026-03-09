import { Router, Request, Response } from 'express';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db';
import { locationPhotos, users } from '../db/schema';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

function getSupabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const uploadSchema = z.object({
  image: z.string().regex(/^data:image\/(jpeg|jpg|png|webp|heic);base64,/i, 'Must be a base64 data URI'),
  caption: z.string().max(500).optional(),
});

// ─── GET /api/photos/:locationId ─────────────────────────────────────────────
router.get('/:locationId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    if (isNaN(locationId)) return void res.status(400).json({ error: 'Invalid location ID' });

    const rows = await db
      .select({
        photo: locationPhotos,
        displayName: users.displayName,
      })
      .from(locationPhotos)
      .leftJoin(users, eq(locationPhotos.userId, users.id))
      .where(eq(locationPhotos.locationId, locationId))
      .orderBy(desc(locationPhotos.createdAt));

    res.json({
      photos: rows.map((r) => ({
        id: r.photo.id,
        url: r.photo.url,
        thumbnail_url: r.photo.thumbnailUrl ?? r.photo.url,
        caption: r.photo.caption,
        created_at: r.photo.createdAt,
        author: r.displayName ?? 'Anonymous',
        is_own: req.user?.id === r.photo.userId,
      })),
      count: rows.length,
    });
  } catch (err) {
    console.error('Error fetching photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// ─── POST /api/photos/:locationId ────────────────────────────────────────────
router.post('/:locationId', requireAuth, validate(uploadSchema), async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    if (isNaN(locationId)) return void res.status(400).json({ error: 'Invalid location ID' });

    const { image, caption } = req.body as z.infer<typeof uploadSchema>;

    // Limit: 10 photos per user per location
    const [existing] = await db
      .select({ cnt: count() })
      .from(locationPhotos)
      .where(and(eq(locationPhotos.locationId, locationId), eq(locationPhotos.userId, req.user!.id)));
    if (Number(existing?.cnt ?? 0) >= 10) {
      return void res.status(400).json({ error: 'Maximum 10 photos per location' });
    }

    // Parse base64
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return void res.status(400).json({ error: 'Invalid image format' });
    const [, ext, b64] = matches;
    const buffer = Buffer.from(b64, 'base64');

    if (buffer.length > 5 * 1024 * 1024) {
      return void res.status(400).json({ error: 'Image too large (max 5MB)' });
    }

    const supabase = getSupabaseAdmin();
    const filename = `${locationId}/${req.user!.id}-${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
    const bucket = 'location-photos';

    // Ensure bucket exists
    await supabase.storage.createBucket(bucket, { public: true }).catch(() => {});

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, buffer, {
      contentType: `image/${ext}`,
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filename);

    const [photo] = await db.insert(locationPhotos).values({
      locationId,
      userId: req.user!.id,
      url: publicUrl,
      caption: caption ?? null,
    }).returning();

    res.status(201).json({
      id: photo.id,
      url: photo.url,
      thumbnail_url: photo.url,
      caption: photo.caption,
      created_at: photo.createdAt,
      author: 'You',
      is_own: true,
    });
  } catch (err) {
    console.error('Error uploading photo:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// ─── DELETE /api/photos/:id ───────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: 'Invalid photo ID' });

    const [photo] = await db.select().from(locationPhotos).where(eq(locationPhotos.id, id));
    if (!photo) return void res.status(404).json({ error: 'Photo not found' });
    if (photo.userId !== req.user!.id) return void res.status(403).json({ error: 'Not your photo' });

    // Delete from storage
    const supabase = getSupabaseAdmin();
    const urlParts = photo.url.split('/location-photos/');
    if (urlParts[1]) {
      await supabase.storage.from('location-photos').remove([urlParts[1]]).catch(() => {});
    }

    await db.delete(locationPhotos).where(eq(locationPhotos.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting photo:', err);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
