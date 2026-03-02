import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load env before anything else
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// ─── Validate Required Environment Variables ─────────────────────────────────

const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ─── Import Routes (after env is loaded) ─────────────────────────────────────

import tripsRouter from './routes/trips';
import locationsRouter from './routes/locations';
import directionsRouter from './routes/directions';
import importRouter from './routes/import';
import usersRouter from './routes/users';
import favoritesRouter from './routes/favorites';
import userdataRouter from './routes/userdata';
import reviewsRouter from './routes/reviews';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Security ────────────────────────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false, // Let frontend handle CSP
}));

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', code: 'RATE_LIMITED' },
});
app.use(limiter);

// Stricter rate limit for auth-adjacent endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: 'Too many auth requests', code: 'RATE_LIMITED' },
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  const originalEnd = _res.end;
  _res.end = function (...args: Parameters<typeof originalEnd>) {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
    }
    return originalEnd.apply(this as any, args);
  } as typeof originalEnd;
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/trips', tripsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/directions', directionsRouter);
app.use('/api/import', importRouter);
app.use('/api/users', authLimiter, usersRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/userdata', userdataRouter);
app.use('/api/reviews', reviewsRouter);

// Health check (public)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Mapbox token endpoint (public)
app.get('/api/mapbox-token', (_req, res) => {
  res.json({ token: process.env.MAPBOX_PUBLIC_KEY || process.env.MAPBOX_SECRET_KEY });
});

// Supabase config for frontend (public — only anon key, never service role)
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🏔️ TrailCamp server running on port ${PORT}`);
  console.log(`   Database: Supabase PostgreSQL`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});
