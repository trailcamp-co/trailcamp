import { Router, Request, Response } from 'express';
import { eq, and, desc, gt, sql, count, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { conditionReports, locations, users } from '../db/schema';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Condition types per category
const CONDITION_TYPES: Record<string, string[]> = {
  hiking: ['clear', 'muddy', 'icy', 'dry', 'overgrown', 'washed out', 'rocky', 'flooded', 'snow-covered'],
  mtb: ['clear', 'muddy', 'dry', 'tacky', 'loose', 'rocky', 'roots exposed', 'snow-covered'],
  riding: ['clear', 'muddy', 'dusty', 'rocky', 'rutted', 'sandy', 'washed out'],
  offroad: ['clear', 'muddy', 'dusty', 'rocky', 'rutted', 'sandy', 'washed out', 'flooded'],
  horseback: ['clear', 'muddy', 'dry', 'overgrown', 'rocky', 'flooded'],
  climbing: ['dry', 'wet', 'icy', 'seeping', 'loose rock'],
  campsite: ['clean', 'quiet', 'crowded', 'buggy', 'messy', 'closed for season', 'flooded', 'snow-covered'],
  boating: ['usable', 'low water', 'high water', 'debris', 'closed'],
  swimming: ['clean', 'algae', 'rough', 'cold', 'warm', 'closed'],
  fishing: ['biting', 'slow', 'stocked recently', 'low water', 'high water'],
};

const SUPPORTED_CATEGORIES = Object.keys(CONDITION_TYPES);

const SEVERITY_LEVELS = ['info', 'caution', 'warning', 'danger', 'closed'] as const;

// Expiry days based on severity
function getExpiryDays(severity: string): number {
  switch (severity) {
    case 'closed': return 30;
    case 'danger':
    case 'warning': return 14;
    default: return 7;
  }
}

const conditionSchema = z.object({
  condition_type: z.string().min(1).max(50),
  severity: z.enum(SEVERITY_LEVELS).default('info'),
  description: z.string().max(500).optional(),
});

// ─── GET /api/conditions/:locationId — active reports ────────────────────────
router.get('/:locationId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    if (isNaN(locationId)) return void res.status(400).json({ error: 'Invalid location ID' });

    const now = new Date();
    const rows = await db
      .select({
        report: conditionReports,
        displayName: users.displayName,
      })
      .from(conditionReports)
      .leftJoin(users, eq(conditionReports.userId, users.id))
      .where(and(
        eq(conditionReports.locationId, locationId),
        gt(conditionReports.expiresAt, now)
      ))
      .orderBy(desc(conditionReports.createdAt));

    res.json({
      conditions: rows.map((r) => ({
        id: r.report.id,
        condition_type: r.report.conditionType,
        severity: r.report.severity,
        description: r.report.description,
        expires_at: r.report.expiresAt,
        created_at: r.report.createdAt,
        author: r.displayName ?? 'Anonymous',
        is_own: req.user?.id === r.report.userId,
      })),
      count: rows.length,
    });
  } catch (err) {
    console.error('Error fetching conditions:', err);
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

// ─── GET /api/conditions/batch?location_ids=1,2,3 ───────────────────────────
router.get('/batch/summary', optionalAuth, async (req: Request, res: Response) => {
  try {
    const idsStr = req.query.location_ids as string;
    if (!idsStr) return void res.json({});
    const ids = idsStr.split(',').map(Number).filter(n => !isNaN(n)).slice(0, 100);
    if (ids.length === 0) return void res.json({});

    const now = new Date();
    const rows = await db
      .select({
        locationId: conditionReports.locationId,
        severity: conditionReports.severity,
        conditionType: conditionReports.conditionType,
        cnt: count(),
      })
      .from(conditionReports)
      .where(and(
        inArray(conditionReports.locationId, ids),
        gt(conditionReports.expiresAt, now)
      ))
      .groupBy(conditionReports.locationId, conditionReports.severity, conditionReports.conditionType);

    // Aggregate per location — pick worst severity
    const severityRank: Record<string, number> = { info: 0, caution: 1, warning: 2, danger: 3, closed: 4 };
    const result: Record<number, { latest_severity: string; latest_condition: string; count: number }> = {};
    for (const row of rows) {
      const lid = row.locationId;
      const existing = result[lid];
      const rowCount = Number(row.cnt);
      if (!existing || severityRank[row.severity] > severityRank[existing.latest_severity]) {
        result[lid] = {
          latest_severity: row.severity,
          latest_condition: row.conditionType,
          count: (existing?.count ?? 0) + rowCount,
        };
      } else {
        existing.count += rowCount;
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching batch conditions:', err);
    res.status(500).json({ error: 'Failed to fetch conditions' });
  }
});

// ─── POST /api/conditions/:locationId ────────────────────────────────────────
router.post('/:locationId', requireAuth, validate(conditionSchema), async (req: Request, res: Response) => {
  try {
    const locationId = Number(req.params.locationId);
    if (isNaN(locationId)) return void res.status(400).json({ error: 'Invalid location ID' });

    const { condition_type, severity, description } = req.body as z.infer<typeof conditionSchema>;

    // Get location category to validate condition type
    const [loc] = await db.select({ category: locations.category }).from(locations).where(eq(locations.id, locationId));
    if (!loc) return void res.status(404).json({ error: 'Location not found' });

    const validTypes = CONDITION_TYPES[loc.category];
    if (!validTypes) return void res.status(400).json({ error: `Conditions not supported for ${loc.category}` });
    if (!validTypes.includes(condition_type)) {
      return void res.status(400).json({ error: `Invalid condition type for ${loc.category}. Valid: ${validTypes.join(', ')}` });
    }

    // Rate limit: 1 per user per location per 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [recent] = await db
      .select({ cnt: count() })
      .from(conditionReports)
      .where(and(
        eq(conditionReports.locationId, locationId),
        eq(conditionReports.userId, req.user!.id),
        gt(conditionReports.createdAt, oneDayAgo)
      ));
    if (Number(recent?.cnt ?? 0) >= 1) {
      return void res.status(429).json({ error: 'You can submit one report per location every 24 hours' });
    }

    const expiresAt = new Date(Date.now() + getExpiryDays(severity) * 24 * 60 * 60 * 1000);

    const [report] = await db.insert(conditionReports).values({
      locationId,
      userId: req.user!.id,
      conditionType: condition_type,
      severity,
      description: description ?? null,
      expiresAt,
    }).returning();

    res.status(201).json({
      id: report.id,
      condition_type: report.conditionType,
      severity: report.severity,
      description: report.description,
      expires_at: report.expiresAt,
      created_at: report.createdAt,
      author: 'You',
      is_own: true,
    });
  } catch (err) {
    console.error('Error submitting condition:', err);
    res.status(500).json({ error: 'Failed to submit condition report' });
  }
});

// ─── DELETE /api/conditions/:id ──────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return void res.status(400).json({ error: 'Invalid report ID' });

    const [report] = await db.select().from(conditionReports).where(eq(conditionReports.id, id));
    if (!report) return void res.status(404).json({ error: 'Report not found' });
    if (report.userId !== req.user!.id) return void res.status(403).json({ error: 'Not your report' });

    await db.delete(conditionReports).where(eq(conditionReports.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting condition:', err);
    res.status(500).json({ error: 'Failed to delete condition report' });
  }
});

// Export valid types for frontend
router.get('/types/:category', (_req: Request, res: Response) => {
  const category = _req.params.category;
  const types = CONDITION_TYPES[category as string];
  if (!types) return void res.json({ supported: false, types: [] });
  res.json({ supported: true, types });
});

export default router;
