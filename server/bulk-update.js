#!/usr/bin/env node
// Bulk Update Tool for TrailCamp
// Safely update multiple locations based on criteria

import Database from 'better-sqlite3';
import readline from 'readline';

const db = new Database('./trailcamp.db');

const UPDATABLE_FIELDS = [
  'description', 'category', 'sub_type', 'trail_types', 'difficulty',
  'distance_miles', 'scenery_rating', 'best_season', 'season', 'cell_signal',
  'shade', 'level_ground', 'water_available', 'water_nearby', 'stay_limit_days',
  'permit_required', 'permit_info', 'cost_per_night', 'hours', 'notes',
  'external_links', 'source', 'featured', 'state'
];

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  const config = {
    field: null,
    value: null,
    where: '',
    dryRun: args.includes('--dry-run'),
    yes: args.includes('--yes')
  };
  
  // Parse --set field=value
  const setIndex = args.indexOf('--set');
  if (setIndex >= 0 && args[setIndex + 1]) {
    const [field, ...valueParts] = args[setIndex + 1].split('=');
    config.field = field;
    config.value = valueParts.join('='); // In case value contains =
  }
  
  // Parse --where condition
  const whereIndex = args.indexOf('--where');
  if (whereIndex >= 0 && args[whereIndex + 1]) {
    // Collect all args after --where until next flag
    const whereArgs = [];
    for (let i = whereIndex + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      whereArgs.push(args[i]);
    }
    config.where = whereArgs.join(' ');
  }
  
  return config;
}

function showHelp() {
  console.log(`
TrailCamp Bulk Update Tool

Usage:
  node bulk-update.js --set FIELD=VALUE --where CONDITION [--dry-run] [--yes]

Options:
  --set FIELD=VALUE    Field to update and new value
  --where CONDITION    SQL WHERE clause (without WHERE keyword)
  --dry-run           Preview changes without applying
  --yes               Skip confirmation prompt
  --help              Show this help

Updatable Fields:
  ${UPDATABLE_FIELDS.join(', ')}

Examples:
  # Update scenery rating for all California boondocking
  node bulk-update.js --set scenery_rating=8 --where "state = 'CA' AND sub_type = 'boondocking'" --dry-run

  # Fix trail types format
  node bulk-update.js --set trail_types='Single Track,Enduro' --where "trail_types = 'Single Track, Enduro'"

  # Add best_season to locations in Alaska
  node bulk-update.js --set best_season='Summer' --where "state = 'AK' AND best_season IS NULL"

  # Mark featured locations
  node bulk-update.js --set featured=1 --where "scenery_rating = 10"

  # Update permit info for National Parks
  node bulk-update.js --set permit_required=1 --where "name LIKE '%National Park%'"

Notes:
  - Always use --dry-run first to preview changes
  - WHERE conditions use SQL syntax
  - String values should be quoted: "state = 'CA'"
  - Use LIKE for pattern matching: "name LIKE '%Trail%'"
  - Multiple conditions: "state = 'CA' AND category = 'riding'"
`);
}

// Validate inputs
function validate(config) {
  const errors = [];
  
  if (!config.field) {
    errors.push('Missing --set parameter');
  } else if (!UPDATABLE_FIELDS.includes(config.field)) {
    errors.push(`Invalid field: ${config.field}. Allowed: ${UPDATABLE_FIELDS.join(', ')}`);
  }
  
  if (!config.where) {
    errors.push('Missing --where parameter (required for safety)');
  }
  
  if (config.value === null || config.value === undefined) {
    errors.push('Missing value in --set parameter (use FIELD=VALUE)');
  }
  
  return errors;
}

// Preview changes
function previewChanges(config) {
  const query = `SELECT id, name, ${config.field} FROM locations WHERE ${config.where} LIMIT 20`;
  
  try {
    const matches = db.prepare(query).all();
    return matches;
  } catch (err) {
    throw new Error(`Invalid WHERE clause: ${err.message}`);
  }
}

// Count affected rows
function countAffected(config) {
  const query = `SELECT COUNT(*) as count FROM locations WHERE ${config.where}`;
  
  try {
    const result = db.prepare(query).get();
    return result.count;
  } catch (err) {
    throw new Error(`Invalid WHERE clause: ${err.message}`);
  }
}

// Perform update
function performUpdate(config) {
  const query = `UPDATE locations SET ${config.field} = ? WHERE ${config.where}`;
  
  try {
    const result = db.prepare(query).run(config.value);
    return result.changes;
  } catch (err) {
    throw new Error(`Update failed: ${err.message}`);
  }
}

// Ask for confirmation
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Main
async function main() {
  const config = parseArgs();
  
  // Validate
  const errors = validate(config);
  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    errors.forEach(err => console.error(`  - ${err}`));
    console.error('\nRun with --help for usage information.\n');
    process.exit(1);
  }
  
  console.log('\nTrailCamp Bulk Update\n');
  console.log('='.repeat(60));
  console.log(`Field:    ${config.field}`);
  console.log(`Value:    ${config.value}`);
  console.log(`WHERE:    ${config.where}`);
  console.log(`Mode:     ${config.dryRun ? 'DRY RUN (no changes)' : 'LIVE UPDATE'}`);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Count affected rows
    const count = countAffected(config);
    
    if (count === 0) {
      console.log('⚠️  No locations match the WHERE condition.\n');
      process.exit(0);
    }
    
    console.log(`📊 ${count} location(s) will be affected\n`);
    
    // Preview changes
    const preview = previewChanges(config);
    
    if (preview.length > 0) {
      console.log('Preview (showing up to 20 locations):\n');
      console.log('ID    | Name                              | Current Value');
      console.log('-'.repeat(60));
      
      for (const row of preview) {
        const currentValue = row[config.field] === null ? 'NULL' : row[config.field];
        console.log(
          `${row.id.toString().padEnd(5)} | ` +
          `${(row.name || '').substring(0, 33).padEnd(33)} | ` +
          `${currentValue}`
        );
      }
      
      if (count > preview.length) {
        console.log(`... and ${count - preview.length} more`);
      }
      
      console.log('');
    }
    
    // Exit if dry run
    if (config.dryRun) {
      console.log('✓ Dry run complete. Run without --dry-run to apply changes.\n');
      process.exit(0);
    }
    
    // Confirm update
    if (!config.yes) {
      console.log(`⚠️  This will UPDATE ${count} location(s):`);
      console.log(`   SET ${config.field} = '${config.value}'`);
      console.log(`   WHERE ${config.where}\n`);
      
      const confirmed = await askConfirmation('Continue? (y/n): ');
      
      if (!confirmed) {
        console.log('\n❌ Update cancelled.\n');
        process.exit(0);
      }
    }
    
    // Perform update
    console.log('\nApplying update...');
    const updated = performUpdate(config);
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully updated ${updated} location(s)!`);
    console.log('='.repeat(60) + '\n');
    
    console.log('Recommended next steps:');
    console.log('  1. Run data quality check: ./check-data-quality.sh');
    console.log('  2. Backup database: ./backup-database.sh\n');
    
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
