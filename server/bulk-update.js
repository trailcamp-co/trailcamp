#!/usr/bin/env node
// Bulk Update Script for TrailCamp
// Safely update multiple locations based on criteria

import Database from 'better-sqlite3';

const db = new Database('./trailcamp.db');

function printHelp() {
  console.log(`
TrailCamp Bulk Update Tool

Usage:
  node bulk-update.js --where "CONDITION" --set "FIELD=VALUE" [--dry-run]

Options:
  --where    SQL WHERE clause to match locations
  --set      Field and value to update (can specify multiple)
  --dry-run  Preview changes without applying them
  --help     Show this help

Examples:
  # Add permit info to all California National Forest OHV areas
  node bulk-update.js \\
    --where "state = 'CA' AND name LIKE '%National Forest%'" \\
    --set "permit_required=1" \\
    --set "permit_info='CA OHV registration required'" \\
    --dry-run

  # Update best season for all Alaska locations
  node bulk-update.js \\
    --where "state = 'AK'" \\
    --set "best_season='Summer'" \\
    --dry-run

  # Add cell signal info to remote desert areas
  node bulk-update.js \\
    --where "state IN ('NV', 'AZ') AND sub_type = 'boondocking'" \\
    --set "cell_signal='None'" \\
    --dry-run

  # Update scenery rating for a specific region
  node bulk-update.js \\
    --where "latitude BETWEEN 40 AND 41 AND longitude BETWEEN -120 AND -119" \\
    --set "scenery_rating=8"

Safety Notes:
  - ALWAYS use --dry-run first to preview changes
  - Be specific with WHERE clauses to avoid unintended updates
  - Cannot update id, latitude, longitude (protected fields)
  - Updates are logged with before/after values
  `);
}

// Parse command line arguments
function parseArgs(args) {
  const parsed = {
    where: null,
    set: [],
    dryRun: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') {
      parsed.help = true;
    } else if (args[i] === '--dry-run') {
      parsed.dryRun = true;
    } else if (args[i] === '--where' && i + 1 < args.length) {
      parsed.where = args[i + 1];
      i++;
    } else if (args[i] === '--set' && i + 1 < args.length) {
      parsed.set.push(args[i + 1]);
      i++;
    }
  }

  return parsed;
}

// Validate field name
function validateField(field) {
  const protectedFields = ['id', 'latitude', 'longitude'];
  
  if (protectedFields.includes(field.toLowerCase())) {
    return { valid: false, error: `Cannot update protected field: ${field}` };
  }

  // List of allowed fields (from locations table schema)
  const allowedFields = [
    'name', 'description', 'category', 'sub_type', 'trail_types',
    'difficulty', 'distance_miles', 'scenery_rating', 'best_season',
    'season', 'cell_signal', 'shade', 'level_ground', 'water_available',
    'water_nearby', 'stay_limit_days', 'permit_required', 'permit_info',
    'cost_per_night', 'hours', 'notes', 'external_links', 'source',
    'featured', 'state', 'county', 'country'
  ];

  if (!allowedFields.includes(field.toLowerCase())) {
    return { valid: false, error: `Unknown field: ${field}. Allowed fields: ${allowedFields.join(', ')}` };
  }

  return { valid: true };
}

// Parse SET clause
function parseSetClause(setString) {
  const parts = setString.split('=');
  if (parts.length !== 2) {
    return { valid: false, error: `Invalid SET format: ${setString}. Use FIELD=VALUE` };
  }

  const field = parts[0].trim();
  let value = parts[1].trim();

  // Validate field
  const fieldValidation = validateField(field);
  if (!fieldValidation.valid) {
    return fieldValidation;
  }

  // Parse value (handle NULL, numbers, strings)
  if (value.toUpperCase() === 'NULL') {
    value = null;
  } else if (value === 'true' || value === 'false') {
    value = value === 'true' ? 1 : 0;
  } else if (!isNaN(value) && value !== '') {
    value = parseFloat(value);
  } else {
    // Remove quotes if present
    value = value.replace(/^['"]|['"]$/g, '');
  }

  return { valid: true, field, value };
}

// Build UPDATE query
function buildUpdateQuery(setFields, whereClause) {
  const setClauses = setFields.map(s => `${s.field} = ?`).join(', ');
  const query = `UPDATE locations SET ${setClauses} WHERE ${whereClause}`;
  return query;
}

// Get matching locations
function getMatching(whereClause) {
  try {
    const query = `SELECT * FROM locations WHERE ${whereClause}`;
    return db.prepare(query).all();
  } catch (err) {
    throw new Error(`Invalid WHERE clause: ${err.message}`);
  }
}

// Perform bulk update
function bulkUpdate(whereClause, setFields, dryRun) {
  console.log(`\n${dryRun ? 'DRY RUN - ' : ''}Bulk Update Operation\n${'='.repeat(60)}\n`);

  // Get matching locations
  console.log(`Finding locations matching: ${whereClause}\n`);
  const matching = getMatching(whereClause);

  if (matching.length === 0) {
    console.log('✗ No locations match the criteria.\n');
    return;
  }

  console.log(`Found ${matching.length} locations to update\n`);

  // Build update query
  const updateQuery = buildUpdateQuery(setFields, whereClause);
  const updateValues = setFields.map(s => s.value);

  console.log(`Query: ${updateQuery}`);
  console.log(`Values: ${updateValues.map(v => v === null ? 'NULL' : v).join(', ')}\n`);

  // Show preview of changes
  console.log('Preview of changes:\n');
  console.log(`${'─'.repeat(60)}`);

  const maxPreview = 10;
  for (let i = 0; i < Math.min(matching.length, maxPreview); i++) {
    const loc = matching[i];
    console.log(`Location #${loc.id}: ${loc.name}`);
    
    for (const setField of setFields) {
      const oldValue = loc[setField.field];
      const newValue = setField.value;
      const displayOld = oldValue === null ? 'NULL' : oldValue;
      const displayNew = newValue === null ? 'NULL' : newValue;
      
      if (oldValue !== newValue) {
        console.log(`  ${setField.field}: ${displayOld} → ${displayNew}`);
      }
    }
    console.log('');
  }

  if (matching.length > maxPreview) {
    console.log(`... and ${matching.length - maxPreview} more\n`);
  }

  console.log(`${'─'.repeat(60)}\n`);

  // Execute update
  if (!dryRun) {
    try {
      const stmt = db.prepare(updateQuery);
      const result = stmt.run(...updateValues);
      
      console.log(`✓ Successfully updated ${result.changes} locations\n`);
      
      // Show summary
      console.log('Updated fields:');
      for (const setField of setFields) {
        const displayValue = setField.value === null ? 'NULL' : setField.value;
        console.log(`  ${setField.field} = ${displayValue}`);
      }
      console.log('');
      
    } catch (err) {
      console.error(`\n✗ Update failed: ${err.message}\n`);
      process.exit(1);
    }
  } else {
    console.log('DRY RUN - No changes applied.\n');
    console.log('To apply these changes, run without --dry-run:\n');
    console.log(`  node bulk-update.js --where "${whereClause}" ${setFields.map(s => `--set "${s.field}=${s.value}"`).join(' ')}\n`);
  }

  console.log(`${'='.repeat(60)}\n`);
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

const parsed = parseArgs(args);

if (parsed.help) {
  printHelp();
  process.exit(0);
}

// Validate arguments
if (!parsed.where) {
  console.error('✗ Error: --where clause is required\n');
  console.log('Usage: node bulk-update.js --where "CONDITION" --set "FIELD=VALUE" [--dry-run]\n');
  console.log('Run --help for examples\n');
  process.exit(1);
}

if (parsed.set.length === 0) {
  console.error('✗ Error: At least one --set clause is required\n');
  console.log('Usage: node bulk-update.js --where "CONDITION" --set "FIELD=VALUE" [--dry-run]\n');
  console.log('Run --help for examples\n');
  process.exit(1);
}

// Parse SET clauses
const setFields = [];
for (const setString of parsed.set) {
  const parsed = parseSetClause(setString);
  if (!parsed.valid) {
    console.error(`✗ Error: ${parsed.error}\n`);
    process.exit(1);
  }
  setFields.push({ field: parsed.field, value: parsed.value });
}

// Execute bulk update
try {
  bulkUpdate(parsed.where, setFields, parsed.dryRun);
} catch (err) {
  console.error(`\n✗ Operation failed: ${err.message}\n`);
  process.exit(1);
} finally {
  db.close();
}
