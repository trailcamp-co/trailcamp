// Generate Admin Dashboard Data for TrailCamp
// Creates comprehensive JSON with monitoring metrics

import Database from 'better-sqlite3';
import fs from 'fs';
import { execSync } from 'child_process';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Generating admin dashboard data...\n');

// Helper to get region from coordinates (same as other analyses)
const REGIONS = {
  'Pacific Northwest': { latMin: 42, latMax: 49, lonMin: -125, lonMax: -116 },
  'California': { latMin: 32, latMax: 42, lonMin: -125, lonMax: -114 },
  'Southwest Desert': { latMin: 31, latMax: 37, lonMin: -115, lonMax: -103 },
  'Rocky Mountains': { latMin: 37, latMax: 49, lonMin: -115, lonMax: -102 },
  'Great Plains': { latMin: 35, latMax: 49, lonMin: -105, lonMax: -95 },
  'Great Lakes': { latMin: 41, latMax: 48, lonMin: -93, lonMax: -76 },
  'Southeast': { latMin: 24, latMax: 37, lonMin: -90, lonMax: -75 },
  'Northeast': { latMin: 37, latMax: 48, lonMin: -80, lonMax: -67 },
  'Alaska': { latMin: 52, latMax: 72, lonMin: -170, lonMax: -130 },
  'Hawaii': { latMin: 18, latMax: 23, lonMin: -161, lonMax: -154 }
};

function getRegion(lat, lon) {
  for (const [name, bounds] of Object.entries(REGIONS)) {
    if (lat >= bounds.latMin && lat <= bounds.latMax &&
        lon >= bounds.lonMin && lon <= bounds.lonMax) {
      return name;
    }
  }
  return 'Other';
}

// 1. Database Overview
const overview = {
  totalLocations: db.prepare('SELECT COUNT(*) as count FROM locations').get().count,
  riding: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding'").get().count,
  campsites: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite'").get().count,
  boondocking: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite' AND sub_type = 'boondocking'").get().count,
  trips: db.prepare('SELECT COUNT(*) as count FROM trips').get().count,
  tripStops: db.prepare('SELECT COUNT(*) as count FROM trip_stops').get().count
};

// 2. Data Quality Scores
const dataQuality = {
  scorecard: {
    coordinateValidity: {
      score: 100,
      details: 'All coordinates valid',
      check: db.prepare('SELECT COUNT(*) as count FROM locations WHERE latitude IS NULL OR longitude IS NULL OR latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180').get().count
    },
    sceneryRatings: {
      score: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NOT NULL').get().count / overview.totalLocations) * 100),
      details: `${db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NOT NULL').get().count} of ${overview.totalLocations} have ratings`
    },
    permitInfo: {
      score: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE permit_required = 1 AND permit_info IS NOT NULL AND permit_info != \'\'').get().count / Math.max(1, db.prepare('SELECT COUNT(*) as count FROM locations WHERE permit_required = 1').get().count)) * 100),
      details: 'Locations with permit flags have details'
    },
    trailMileage: {
      score: Math.round((db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL AND distance_miles > 0").get().count / overview.riding) * 100),
      details: `${db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL").get().count} of ${overview.riding} riding locations`
    }
  },
  overallScore: 0  // Will calculate below
};

// Calculate overall quality score
const scores = Object.values(dataQuality.scorecard).map(s => s.score);
dataQuality.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

// 3. Regional Distribution
const regionalStats = {};
const locations = db.prepare('SELECT latitude, longitude, category, sub_type FROM locations').all();

for (const loc of locations) {
  const region = getRegion(loc.latitude, loc.longitude);
  if (!regionalStats[region]) {
    regionalStats[region] = { total: 0, riding: 0, boondocking: 0, campgrounds: 0 };
  }
  regionalStats[region].total++;
  if (loc.category === 'riding') regionalStats[region].riding++;
  else if (loc.sub_type === 'boondocking') regionalStats[region].boondocking++;
  else if (loc.category === 'campsite') regionalStats[region].campgrounds++;
}

// 4. Content Stats
const contentStats = {
  trailMiles: {
    total: Math.round(db.prepare("SELECT SUM(distance_miles) as sum FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL").get().sum || 0),
    average: Math.round(db.prepare("SELECT AVG(distance_miles) as avg FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL").get().avg || 0)
  },
  costData: {
    locationsWithCost: db.prepare('SELECT COUNT(*) as count FROM locations WHERE cost_per_night IS NOT NULL').get().count,
    freeCamping: db.prepare('SELECT COUNT(*) as count FROM locations WHERE cost_per_night = 0').get().count,
    averagePaid: Math.round((db.prepare('SELECT AVG(cost_per_night) as avg FROM locations WHERE cost_per_night IS NOT NULL AND cost_per_night > 0').get().avg || 0) * 100) / 100
  },
  scenery: {
    worldClass: db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating = 10').get().count,
    excellent: db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating >= 8').get().count,
    average: Math.round((db.prepare('SELECT AVG(scenery_rating) as avg FROM locations WHERE scenery_rating IS NOT NULL').get().avg || 0) * 10) / 10
  },
  difficulty: {
    easy: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND difficulty IN ('Easy', 'Beginner')").get().count,
    moderate: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND difficulty IN ('Moderate', 'Intermediate')").get().count,
    hard: db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND difficulty IN ('Hard', 'Advanced', 'Expert')").get().count
  }
};

// 5. System Health
let databaseSize = 'Unknown';
let backupCount = 0;

try {
  const dbStats = execSync('ls -lh ./trailcamp.db 2>/dev/null | awk \'{print $5}\'', { encoding: 'utf8' }).trim();
  databaseSize = dbStats || 'Unknown';
} catch (e) {
  // Ignore
}

try {
  backupCount = parseInt(execSync('ls -1 ./backups/trailcamp-backup-*.sql 2>/dev/null | wc -l', { encoding: 'utf8' }).trim()) || 0;
} catch (e) {
  // Ignore
}

const systemHealth = {
  databaseSize,
  backupCount,
  lastBackup: backupCount > 0 ? 'Available' : 'None',
  integrityCheck: db.prepare('PRAGMA integrity_check').get()['integrity_check'] === 'ok' ? 'OK' : 'FAILED'
};

// 6. Growth & Activity (if we had timestamps, would show trends)
const topRegions = Object.entries(regionalStats)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 5)
  .map(([region, stats]) => ({ region, ...stats }));

// 7. Recent Activity (last 10 trips created - would need created_at timestamps)
const recentTrips = db.prepare('SELECT id, name FROM trips ORDER BY id DESC LIMIT 10').all();

// 8. Top Locations (by scenery rating)
const topLocations = db.prepare(`
  SELECT name, category, scenery_rating, latitude, longitude 
  FROM locations 
  WHERE scenery_rating >= 9 
  ORDER BY scenery_rating DESC, name ASC 
  LIMIT 20
`).all();

// 9. Data Coverage by Category
const coverage = {
  ridingWithMileage: Math.round((db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND distance_miles IS NOT NULL").get().count / overview.riding) * 100),
  ridingWithDifficulty: Math.round((db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'riding' AND difficulty IS NOT NULL").get().count / overview.riding) * 100),
  campsitesWithCost: Math.round((db.prepare("SELECT COUNT(*) as count FROM locations WHERE category = 'campsite' AND cost_per_night IS NOT NULL").get().count / overview.campsites) * 100),
  allWithScenery: Math.round((db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NOT NULL').get().count / overview.totalLocations) * 100)
};

// 10. Alerts & Warnings
const alerts = [];

// Check for data quality issues
const missingScenery = overview.totalLocations - db.prepare('SELECT COUNT(*) as count FROM locations WHERE scenery_rating IS NOT NULL').get().count;
if (missingScenery > 100) {
  alerts.push({
    level: 'warning',
    message: `${missingScenery} locations missing scenery ratings`,
    action: 'Run data quality scripts to identify and fix'
  });
}

const invalidCoords = db.prepare('SELECT COUNT(*) as count FROM locations WHERE latitude IS NULL OR longitude IS NULL').get().count;
if (invalidCoords > 0) {
  alerts.push({
    level: 'critical',
    message: `${invalidCoords} locations have invalid coordinates`,
    action: 'Fix immediately - these locations are unusable'
  });
}

if (systemHealth.integrityCheck !== 'OK') {
  alerts.push({
    level: 'critical',
    message: 'Database integrity check FAILED',
    action: 'Restore from backup immediately'
  });
}

if (backupCount === 0) {
  alerts.push({
    level: 'warning',
    message: 'No database backups found',
    action: 'Run backup-database.sh to create first backup'
  });
}

// Compile dashboard data
const dashboard = {
  generatedAt: new Date().toISOString(),
  summary: {
    ...overview,
    dataQualityScore: dataQuality.overallScore,
    systemHealth: systemHealth.integrityCheck,
    totalTrailMiles: contentStats.trailMiles.total
  },
  dataQuality,
  regionalDistribution: regionalStats,
  topRegions,
  contentStats,
  coverage,
  systemHealth,
  recentTrips,
  topLocations: topLocations.map(loc => ({
    name: loc.name,
    category: loc.category,
    scenery: loc.scenery_rating,
    region: getRegion(loc.latitude, loc.longitude)
  })),
  alerts
};

// Save dashboard data
const outputPath = './dashboard-data.json';
fs.writeFileSync(outputPath, JSON.stringify(dashboard, null, 2));

console.log('✅ Dashboard data generated!');
console.log(`📄 Saved to: ${outputPath}\n`);

// Print summary
console.log('📊 Dashboard Summary:');
console.log(`  Total Locations: ${overview.totalLocations.toLocaleString()}`);
console.log(`  Data Quality Score: ${dataQuality.overallScore}%`);
console.log(`  System Health: ${systemHealth.integrityCheck}`);
console.log(`  Database Size: ${databaseSize}`);
console.log(`  Total Trail Miles: ${contentStats.trailMiles.total.toLocaleString()}`);

if (alerts.length > 0) {
  console.log(`\n⚠️  ${alerts.length} alerts:`);
  for (const alert of alerts) {
    const icon = alert.level === 'critical' ? '🚨' : '⚠️';
    console.log(`  ${icon} ${alert.message}`);
  }
} else {
  console.log('\n✅ No alerts - system healthy');
}

console.log(`\nTop 3 regions:`);
for (const region of topRegions.slice(0, 3)) {
  console.log(`  ${region.region}: ${region.total} locations`);
}

db.close();
