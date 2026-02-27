import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import tripsRouter from './routes/trips';
import locationsRouter from './routes/locations';
import directionsRouter from './routes/directions';
import importRouter from './routes/import';
import { seedDatabase } from './seed';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/trips', tripsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/directions', directionsRouter);
app.use('/api/import', importRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mapbox token endpoint for frontend
app.get('/api/mapbox-token', (_req, res) => {
  res.json({ token: process.env.MAPBOX_PUBLIC_KEY || process.env.MAPBOX_SECRET_KEY });
});

// Seed database on startup
seedDatabase();

app.listen(PORT, () => {
  console.log(`TrailCamp server running on port ${PORT}`);
});
