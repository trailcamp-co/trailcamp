#!/usr/bin/env node
// Bulk Update Script for TrailCamp
// Safely update multiple locations based on criteria

import Database from 'better-sqlite3';

const db = new Database('./trailcamp.db');

// Protected fields that should not be bulk updated
const PROTECTED_FIELDS = ['id', 'created_at'];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  const config = {
    where: null,
    updates: [],
    dryRun: false,
    showHelp: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      config.showHelp = true;
    } else if (arg === '--dry-run') {
      config.dryRun = true;
    } else if (arg === '--where') {
      config.where = args[++i];
    } else if (arg === '--set') {
      const setValue = args[++i];
      const [field, value] = setValue.split('=').map(s => s.trim());
      
      if (PROTECTED_FIELDS.includes(field)) {
        console.error(`✗ Error: Cannot update protected field '${field}'`);
        process.exit(1);
      }
      
      config.updates.push({ field, value });
    }
  }
  
  return config;
}

// Show help
function showHelp() {
  console.log(`
TrailCamp Bulk Update Tool

Usage:
  node bulk-update.js --where "condition" --set "field=value" [options]

Options:
  --where "condition"   SQL WHERE clause (required)
  --set "field=value"   Field to update (can specify multiple)
  --dry-run            Preview changes without applying
  --help               Show this help

Examples:
  # Update scenery rating for all boondocking spots
  node bulk-update.js \\
    --where "sub_type = 'boondocking'" \\
    --set "scenery_rating=8" \\
    --dry-run

  # Add permit info to all National Park locations
  node bulk-update.js \\
    --where "name LIKE '%National Park%'" \\
    --set "permit_required=1" \\
    --set "permit_info=Entrance fee required"

  # Update cell signal for remote areas
  node bulk-update.js \\
    --where "state IN ('AK', 'MT', 'WY') AND category = 'campsite'" \\
    --set "cell_signal=Poor"

  # Change difficulty rating
  node bulk-update.js \\
    --where "difficulty = 'Easy' AND trail_types LIKE '%Technical%'" \\
    --set "difficulty=Moderate"

Notes:
  - Always use --dry-run first to preview changes
  - WHERE clause is SQL syntax (LIKE, IN, AND, OR, etc.)
  - String values with spaces need quotes: "permit_info=USFS Pass required"
  - Protected fields cannot be updated: ${PROTECTED_FIELDS.join(', ')}
  `);
}

// Get matching locations
function getMatchingLocations(whereClause) {
  const query = `SELECT * FROM locations WHERE ${whereClause}`;
  try {
    return db.prepare(query).all();
  } catch (err) {
    console.error(`✗ Invalid WHERE clause: ${err.message}`);
    process.exit(1);
  }
}

// Parse value (handle numbers, booleans, null, strings)
function parseValue(value) {
  if (value === 'NULL' || value === 'null') return null;
  if (value === 'true') return 1;
  if (value === 'false') return 0;
  
  // Try parsing as number
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== '') {
    return num;
  }
  
  // Return as string, removing surrounding quotes if present
  return value.replace(/^["']|["']$/g, '');
}

// Preview changes
function previewChanges(locations, updates) {
  console.log('\n' + '='.repeat(70));
  console.log('PREVIEW: Changes that will be applied');
  console.log('='.repeat(70));
  console.log(`\nMatched locations: ${locations.length}`);
  console.log('\nUpdates:');
  for (const update of updates) {
    console.log(`  ${update.field} = ${update.value}`);
  }
  
  console.log('\n' + '─'.repeat(70));
  console.log('Sample locations (showing up to 10):');
  console.log('─'.repeat(70) + '\n');
  
  for (const loc of locations.slice(0, 10)) {
    console.log(`[${loc.id}] ${loc.name}`);
    console.log(`  Category: ${loc.category}`);
    
    for (const update of updates) {
      const currentValue = loc[update.field];
      const newValue = parseValue(update.value);
      console.log(`  ${update.field}: ${currentValue} → ${newValue}`);
    }
    
    console.log('');
  }
  
  if (locations.length > 10) {
    console.log(`... and ${locations.length - 10} more locations\n`);
  }
}

// Apply updates
function applyUpdates(locations, updates, dryRun) {
  if (dryRun) {
    console.log('='.repeat(70));
    console.log('DRY RUN - No changes were applied');
    console.log('='.repeat(70));
    console.log('\nRun without --dry-run to apply these changes.\n');
    return { updated: 0, failed: 0 };
  }
  
  const stats = { updated: 0, failed: 0 };
  
  // Build UPDATE query
  const setClause = updates.map(u => `${u.field} = ?`).join(', ');
  const updateQuery = `UPDATE locations SET ${setClause} WHERE id = ?`;
  const stmt = db.prepare(updateQuery);
  
  for (const loc of locations) {
    try {
      const values = updates.map(u => parseValue(u.value));
      values.push(loc.id); // Add ID for WHERE clause
      
      stmt.run(...values);
      stats.updated++;
    } catch (err) {
      stats.failed++;
      console.error(`✗ Failed to update location ${loc.id}: ${err.message}`);
    }
  }
  
  return stats;
}

// Main
const config = parseArgs();

if (config.showHelp) {
  showHelp();
  process.exit(0);
}

if (!config.where) {
  console.error('✗ Error: --where clause is required\n');
  console.log('Use --help for usage information');
  process.exit(1);
}

if (config.updates.length === 0) {
  console.error('✗ Error: At least one --set clause is required\n');
  console.log('Use --help for usage information');
  process.exit(1);
}

console.log('TrailCamp Bulk Update Tool\n');

if (config.dryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be applied\n');
}

// Get matching locations
const locations = getMatchingLocations(config.where);

if (locations.length === 0) {
  console.log('✗ No locations matched the WHERE clause');
  console.log(`  WHERE: ${config.where}\n`);
  process.exit(0);
}

// Preview changes
previewChanges(locations, config.updates);

// Apply updates
const stats = applyUpdates(locations, config.updates, config.dryRun);

if (!config.dryRun) {
  console.log('\n' + '='.repeat(70));
  console.log('UPDATE COMPLETE');
  console.log('='.repeat(70));
  console.log(`\nUpdated:  ${stats.updated}`);
  console.log(`Failed:   ${stats.failed}`);
  console.log('='.repeat(70) + '\n');
  
  if (stats.updated > 0) {
    console.log('✓ Changes applied successfully!');
    console.log('\nRecommend running data quality check:');
    console.log('  ./check-data-quality.sh\n');
  }
}

db.close();
