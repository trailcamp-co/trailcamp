# Bulk Update Guide

## Overview
The `bulk-update.js` script allows safe batch updates of locations based on SQL WHERE criteria with dry-run preview.

## Quick Start

### Always Test First
```bash
# Preview changes before applying
node bulk-update.js \
  --where "category = 'riding'" \
  --set "best_season=Summer" \
  --dry-run
```

### Apply Updates
```bash
# Remove --dry-run to apply
node bulk-update.js \
  --where "category = 'riding'" \
  --set "best_season=Summer"
```

## Usage

### Basic Syntax
```bash
node bulk-update.js \
  --where "SQL_CONDITION" \
  --set "field=value" \
  [--dry-run]
```

### Multiple Fields
```bash
node bulk-update.js \
  --where "condition" \
  --set "field1=value1" \
  --set "field2=value2" \
  --set "field3=value3"
```

## Examples

### Update Scenery Ratings
```bash
# Set all boondocking to 8/10 scenery
node bulk-update.js \
  --where "sub_type = 'boondocking'" \
  --set "scenery_rating=8" \
  --dry-run
```

### Add Permit Information
```bash
# Add permit info to National Parks
node bulk-update.js \
  --where "name LIKE '%National Park%'" \
  --set "permit_required=1" \
  --set "permit_info=Entrance fee or backcountry permit required"
```

### Update Cell Signal
```bash
# Mark remote states as poor signal
node bulk-update.js \
  --where "state IN ('AK', 'MT', 'WY') AND category = 'campsite'" \
  --set "cell_signal=Poor"
```

### Change Difficulty Ratings
```bash
# Upgrade Technical Easy trails to Moderate
node bulk-update.js \
  --where "difficulty = 'Easy' AND trail_types LIKE '%Technical%'" \
  --set "difficulty=Moderate"
```

### Set Best Season
```bash
# Desert trails best in winter
node bulk-update.js \
  --where "trail_types LIKE '%Desert%'" \
  --set "best_season=Winter"
```

### Update Costs
```bash
# Mark BLM land as free
node bulk-update.js \
  --where "notes LIKE '%BLM%' AND category = 'campsite'" \
  --set "cost_per_night=0"
```

### Add Notes
```bash
# Add warning to high-elevation trails
node bulk-update.js \
  --where "notes LIKE '%elevation%' OR notes LIKE '%alpine%'" \
  --set "notes=High elevation - check snow conditions before riding"
```

## WHERE Clause Reference

### Operators
- `=` Equal
- `!=` or `<>` Not equal
- `>`, `>=`, `<`, `<=` Comparisons
- `LIKE` Pattern matching (`%` = wildcard)
- `IN` Match list of values
- `AND`, `OR` Combine conditions
- `IS NULL`, `IS NOT NULL` Check for null

### Examples
```sql
-- Exact match
category = 'riding'

-- Pattern matching
name LIKE '%Forest%'
name LIKE 'Moab%'

-- Multiple values
state IN ('CA', 'OR', 'WA')
difficulty IN ('Hard', 'Expert')

-- Combinations
category = 'riding' AND difficulty = 'Easy'
state = 'CO' OR state = 'UT'

-- Null checks
scenery_rating IS NULL
permit_info IS NOT NULL

-- Ranges
scenery_rating >= 8
distance_miles > 50

-- Complex
category = 'campsite' AND (sub_type = 'boondocking' OR cost_per_night = 0)
```

## Value Types

### Strings
```bash
--set "name=New Name"
--set "notes=Trail info here"
```

### Numbers
```bash
--set "scenery_rating=9"
--set "distance_miles=25.5"
--set "cost_per_night=15"
```

### Booleans
```bash
--set "permit_required=true"    # Stores as 1
--set "water_available=false"   # Stores as 0
```

### Null
```bash
--set "notes=NULL"
--set "external_links=null"
```

### Strings with Spaces
```bash
# Use quotes
--set "permit_info=USFS Northwest Forest Pass required"

# Or escape
--set "notes=Beautiful trail with amazing views"
```

## Protected Fields

These fields CANNOT be bulk updated:
- `id` - Primary key
- `created_at` - Creation timestamp

Attempting to update these will fail with an error.

## Safety Features

### 1. Dry Run Preview
Always shows:
- Number of matched locations
- Fields being updated
- Before/after values for first 10 locations

### 2. Error Handling
- Invalid WHERE clause → Shows SQL error
- Protected field → Blocks update
- Database error → Shows which location failed

### 3. Transaction Safety
- Each location updated individually
- Failures don't roll back successful updates
- Failed updates are reported

## Best Practices

### 1. Always Dry Run First
```bash
# ALWAYS test first
node bulk-update.js --where "..." --set "..." --dry-run

# Only apply if preview looks correct
node bulk-update.js --where "..." --set "..."
```

### 2. Start Small
```bash
# Test on one location first
node bulk-update.js --where "id = 123" --set "..." --dry-run

# Then expand to full set
node bulk-update.js --where "state = 'CA'" --set "..." --dry-run
```

### 3. Backup First
```bash
# Always backup before large updates
./backup-database.sh

# Then run update
node bulk-update.js --where "..." --set "..."
```

### 4. Verify After
```bash
# Check data quality
./check-data-quality.sh

# Verify specific updates
sqlite3 trailcamp.db "SELECT name, field_name FROM locations WHERE state = 'CA' LIMIT 10"
```

### 5. Use Specific WHERE Clauses
```bash
# ❌ BAD - Too broad
--where "category = 'riding'"

# ✅ GOOD - Specific
--where "category = 'riding' AND state = 'CA' AND difficulty IS NULL"
```

## Common Workflows

### Fix Missing Data
```bash
# Find locations missing scenery ratings
node bulk-update.js \
  --where "scenery_rating IS NULL AND category = 'campsite'" \
  --set "scenery_rating=6" \
  --dry-run
```

### Standardize Values
```bash
# Fix inconsistent difficulty ratings
node bulk-update.js \
  --where "difficulty IN ('easy', 'EASY', 'beginner')" \
  --set "difficulty=Easy" \
  --dry-run
```

### Add Bulk Metadata
```bash
# Mark all Alaska locations with remote flag
node bulk-update.js \
  --where "state = 'AK'" \
  --set "cell_signal=None" \
  --set "notes=Remote location - plan accordingly" \
  --dry-run
```

### Correct Errors
```bash
# Fix wrong category
node bulk-update.js \
  --where "id IN (123, 456, 789)" \
  --set "category=campsite" \
  --set "sub_type=boondocking"
```

## Troubleshooting

### No Matches Found
```
✗ No locations matched the WHERE clause
```
**Solution:** Check your WHERE syntax
```bash
# Debug: Count matches first
sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE your_condition"
```

### Invalid WHERE Clause
```
✗ Invalid WHERE clause: near "FORM": syntax error
```
**Solution:** Fix SQL syntax
```bash
# Common mistakes:
= instead of LIKE for patterns
Missing quotes around strings
Typo in column name
```

### Protected Field Error
```
✗ Error: Cannot update protected field 'id'
```
**Solution:** Don't update id or created_at fields

## Integration

### With Import Script
```bash
# Import new locations
node import-locations.js new-data.csv

# Bulk update imported locations
node bulk-update.js \
  --where "source = 'import'" \
  --set "scenery_rating=7"
```

### With Data Quality Checks
```bash
# Find issues
./check-data-quality.sh

# Fix with bulk update
node bulk-update.js --where "..." --set "..."

# Verify fix
./check-data-quality.sh
```

### With Git Workflow
```bash
# Backup
./backup-database.sh
git add server/backups/*.sql
git commit -m "Backup before bulk update"

# Update
node bulk-update.js --where "..." --set "..."

# Commit changes
git add server/trailcamp.db
git commit -m "Bulk update: added scenery ratings to 500 locations"
```

---

*Last updated: 2026-02-28*
*Script: bulk-update.js*
