#!/usr/bin/env node
// Location Import Script for TrailCamp
// Imports locations from CSV with validation

import Database from 'better-sqlite3';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const db = new Database('./trailcamp.db');

// Validation functions
function validateLatitude(lat) {
  const num = parseFloat(lat);
  return !isNaN(num) && num >= -90 && num <= 90;
}

function validateLongitude(lon) {
  const num = parseFloat(lon);
  return !isNaN(num) && num >= -180 && num <= 180;
}

function validateScenery(rating) {
  if (!rating || rating === '') return true; // Optional
  const num = parseInt(rating);
  return !isNaN(num) && num >= 1 && num <= 10;
}

function validateCategory(category) {
  const valid = ['riding', 'campsite', 'dump', 'water', 'scenic'];
  return valid.includes(category?.toLowerCase());
}

// Check for duplicate
function checkDuplicate(name, lat, lon) {
  const existing = db.prepare(`
    SELECT id, name FROM locations 
    WHERE name = ? AND latitude = ? AND longitude = ?
  `).get(name, lat, lon);
  return existing;
}

// Parse CSV file
function parseCSV(filePath) {
  console.log(`Reading CSV file: ${filePath}\n`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  
  console.log(`Found ${records.length} rows in CSV\n`);
  return records;
}

// Validate and import locations
function importLocations(csvPath, dryRun = false) {
  const records = parseCSV(csvPath);
  
  const stats = {
    total: records.length,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    imported: 0,
    errors: []
  };
  
  console.log(`${dryRun ? 'DRY RUN - ' : ''}Processing ${stats.total} locations...\n`);
  
  const insertStmt = db.prepare(`
    INSERT INTO locations (
      name, description, latitude, longitude, category, sub_type,
      trail_types, difficulty, distance_miles, scenery_rating,
      best_season, cell_signal, shade, level_ground,
      water_available, water_nearby, stay_limit_days,
      permit_required, permit_info, cost_per_night, hours,
      notes, external_links, source
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);
  
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const lineNum = i + 2; // +2 for header row and 1-indexing
    
    // Required fields
    const name = row.name?.trim();
    const lat = parseFloat(row.latitude);
    const lon = parseFloat(row.longitude);
    const category = row.category?.toLowerCase();
    
    // Validate required fields
    const errors = [];
    
    if (!name || name === '') {
      errors.push('Missing name');
    }
    
    if (!validateLatitude(lat)) {
      errors.push(`Invalid latitude: ${row.latitude}`);
    }
    
    if (!validateLongitude(lon)) {
      errors.push(`Invalid longitude: ${row.longitude}`);
    }
    
    if (!validateCategory(category)) {
      errors.push(`Invalid category: ${row.category} (must be: riding, campsite, dump, water, scenic)`);
    }
    
    if (!validateScenery(row.scenery_rating)) {
      errors.push(`Invalid scenery rating: ${row.scenery_rating} (must be 1-10)`);
    }
    
    // Check for errors
    if (errors.length > 0) {
      stats.invalid++;
      stats.errors.push({
        line: lineNum,
        name: name || 'Unknown',
        errors: errors
      });
      continue;
    }
    
    // Check for duplicate
    const duplicate = checkDuplicate(name, lat, lon);
    if (duplicate) {
      stats.duplicates++;
      stats.errors.push({
        line: lineNum,
        name,
        errors: [`Duplicate of existing location ID ${duplicate.id}`]
      });
      continue;
    }
    
    stats.valid++;
    
    // Import if not dry run
    if (!dryRun) {
      try {
        insertStmt.run(
          name,
          row.description || null,
          lat,
          lon,
          category,
          row.sub_type || null,
          row.trail_types || null,
          row.difficulty || null,
          row.distance_miles ? parseFloat(row.distance_miles) : null,
          row.scenery_rating ? parseInt(row.scenery_rating) : null,
          row.best_season || null,
          row.cell_signal || null,
          row.shade || null,
          row.level_ground || null,
          row.water_available ? parseInt(row.water_available) : 0,
          row.water_nearby ? parseInt(row.water_nearby) : 0,
          row.stay_limit_days ? parseInt(row.stay_limit_days) : null,
          row.permit_required ? parseInt(row.permit_required) : 0,
          row.permit_info || null,
          row.cost_per_night ? parseFloat(row.cost_per_night) : null,
          row.hours || null,
          row.notes || null,
          row.external_links || null,
          row.source || 'import'
        );
        stats.imported++;
      } catch (err) {
        stats.invalid++;
        stats.errors.push({
          line: lineNum,
          name,
          errors: [`Database error: ${err.message}`]
        });
      }
    }
  }
  
  return stats;
}

// Print report
function printReport(stats, dryRun) {
  console.log('\n' + '='.repeat(60));
  console.log(dryRun ? 'DRY RUN REPORT' : 'IMPORT REPORT');
  console.log('='.repeat(60));
  console.log(`\nTotal rows:       ${stats.total}`);
  console.log(`Valid:            ${stats.valid}`);
  console.log(`Invalid:          ${stats.invalid}`);
  console.log(`Duplicates:       ${stats.duplicates}`);
  
  if (!dryRun) {
    console.log(`Imported:         ${stats.imported}`);
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log('ERRORS:\n');
    
    for (const err of stats.errors) {
      console.log(`Line ${err.line}: ${err.name}`);
      for (const e of err.errors) {
        console.log(`  ✗ ${e}`);
      }
      console.log('');
    }
  }
  
  console.log('='.repeat(60) + '\n');
  
  if (dryRun && stats.valid > 0) {
    console.log('✓ Dry run passed! Run without --dry-run to import.\n');
  } else if (!dryRun && stats.imported > 0) {
    console.log(`✓ Successfully imported ${stats.imported} locations!\n`);
  }
}

// Generate example CSV
function generateExample() {
  const example = `name,description,latitude,longitude,category,sub_type,trail_types,difficulty,distance_miles,scenery_rating,best_season,cell_signal,permit_required,permit_info,cost_per_night,notes,source
Example Trail,Beautiful single-track through pine forest,40.1234,-105.6789,riding,,Single Track,Moderate,15,8,Summer,Moderate,1,USFS Northwest Forest Pass,,Best ridden clockwise,manual
Example Campground,Dispersed camping with mountain views,38.5678,-106.1234,campsite,boondocking,,,9,Summer,None,0,,0,High-clearance recommended,manual
`;
  
  fs.writeFileSync('./import-example.csv', example);
  console.log('✓ Generated example CSV: import-example.csv\n');
  console.log('Edit this file with your locations and run:');
  console.log('  node import-locations.js import-example.csv --dry-run\n');
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  console.log(`
TrailCamp Location Import Tool

Usage:
  node import-locations.js <csv-file> [--dry-run]
  node import-locations.js --example

Options:
  --dry-run    Validate without importing
  --example    Generate example CSV file
  --help       Show this help

Example:
  node import-locations.js locations.csv --dry-run
  node import-locations.js locations.csv

CSV Format:
  Required columns: name, latitude, longitude, category
  Optional: description, sub_type, trail_types, difficulty, distance_miles,
            scenery_rating, best_season, cell_signal, permit_required,
            permit_info, cost_per_night, notes, source

  Category must be: riding, campsite, dump, water, or scenic
  `);
  process.exit(0);
}

if (args.includes('--example')) {
  generateExample();
  process.exit(0);
}

const csvPath = args[0];
const dryRun = args.includes('--dry-run');

if (!fs.existsSync(csvPath)) {
  console.error(`✗ File not found: ${csvPath}\n`);
  process.exit(1);
}

try {
  const stats = importLocations(csvPath, dryRun);
  printReport(stats, dryRun);
  
  if (!dryRun && stats.imported > 0) {
    console.log('Recommend running data quality check:');
    console.log('  ./check-data-quality.sh\n');
  }
  
  process.exit(stats.invalid > 0 ? 1 : 0);
} catch (err) {
  console.error(`\n✗ Import failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
