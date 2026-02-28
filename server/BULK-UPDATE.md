## Bulk Update Guide

## Overview
The `bulk-update.js` script allows safe batch updates to multiple locations based on SQL WHERE criteria with dry-run preview.

## Quick Start

### 1. Always Start with Dry Run
```bash
node bulk-update.js \
  --where "CONDITION" \
  --set "FIELD=VALUE" \
  --dry-run
```

### 2. Review Preview
Check the preview output to ensure only intended locations are matched.

### 3. Apply Changes
Remove `--dry-run` to execute:
```bash
node bulk-update.js \
  --where "CONDITION" \
  --set "FIELD=VALUE"
```

## Common Use Cases

### Add Permit Information
```bash
# Add permit requirement to all California National Forest OHV areas
node bulk-update.js \
  --where "state = 'CA' AND name LIKE '%National Forest%' AND category = 'riding'" \
  --set "permit_required=1" \
  --set "permit_info='California OHV registration required ($52/year)'" \
  --dry-run
```

### Update Seasonal Information
```bash
# Set best season for all Alaska locations
node bulk-update.js \
  --where "state = 'AK'" \
  --set "best_season='Summer'" \
  --dry-run

# Update winter locations in Southwest
node bulk-update.js \
  --where "state IN ('AZ', 'NM') AND latitude < 35" \
  --set "best_season='Winter'" \
  --dry-run
```

### Add Cell Signal Information
```bash
# Mark remote desert boondocking as no signal
node bulk-update.js \
  --where "state IN ('NV', 'UT', 'AZ') AND sub_type = 'boondocking' AND cell_signal IS NULL" \
  --set "cell_signal='None'" \
  --dry-run
```

### Update Costs
```bash
# Set free camping for all boondocking
node bulk-update.js \
  --where "sub_type = 'boondocking' AND cost_per_night IS NULL" \
  --set "cost_per_night=0" \
  --dry-run

# Update state park costs
node bulk-update.js \
  --where "name LIKE '%State Park%' AND cost_per_night IS NULL" \
  --set "cost_per_night=25" \
  --dry-run
```

### Scenery Ratings
```bash
# Boost scenery for National Parks
node bulk-update.js \
  --where "name LIKE '%National Park%' AND scenery_rating < 8" \
  --set "scenery_rating=8" \
  --dry-run

# Rate desert mountain areas
node bulk-update.js \
  --where "latitude BETWEEN 33 AND 37 AND longitude BETWEEN -115 AND -110" \
  --set "scenery_rating=7" \
  --dry-run
```

### Fix Data Issues
```bash
# Clear incorrect water flags
node bulk-update.js \
  --where "sub_type = 'boondocking' AND water_available = 1" \
  --set "water_available=0" \
  --set "water_nearby=1" \
  --dry-run

# Normalize trail types (remove spaces)
node bulk-update.js \
  --where "trail_types LIKE '% ,%'" \
  --set "trail_types=REPLACE(trail_types, ' ,', ',')" \
  --dry-run
```

## WHERE Clause Examples

### By Category/Type
```sql
category = 'riding'
sub_type = 'boondocking'
category = 'campsite' AND sub_type = 'campground'
```

### By State/Region
```sql
state = 'CA'
state IN ('OR', 'WA', 'ID')
state IS NULL  -- Locations without geocoding
```

### By Coordinates (Geographic Area)
```sql
latitude BETWEEN 40 AND 45 AND longitude BETWEEN -125 AND -120
latitude > 60  -- Alaska
```

### By Name Pattern
```sql
name LIKE '%National Forest%'
name LIKE '%BDR%'
name LIKE '%State Park%'
```

### By Missing Data
```sql
permit_info IS NULL
scenery_rating IS NULL
cost_per_night IS NULL
cell_signal IS NULL
```

### Complex Conditions
```sql
category = 'riding' AND difficulty IN ('Hard', 'Expert') AND scenery_rating >= 8
state = 'UT' AND (name LIKE '%Moab%' OR name LIKE '%Slickrock%')
category = 'campsite' AND cost_per_night = 0 AND scenery_rating >= 7
```

## SET Clause Format

### Text Fields
```bash
--set "name='New Name'"
--set "notes='This is a note'"
--set "cell_signal='Moderate'"
```

### Numeric Fields
```bash
--set "scenery_rating=8"
--set "cost_per_night=25.50"
--set "distance_miles=15"
```

### Boolean Fields (0/1)
```bash
--set "permit_required=1"
--set "water_available=0"
--set "featured=1"
```

### NULL Values
```bash
--set "notes=NULL"
--set "permit_info=NULL"
```

### Multiple Fields
```bash
--set "scenery_rating=9" \
--set "best_season='Summer'" \
--set "cell_signal='None'"
```

## Allowed Fields

### Can Update
- name, description, category, sub_type
- trail_types, difficulty, distance_miles
- scenery_rating, best_season, season
- cell_signal, shade, level_ground
- water_available, water_nearby, stay_limit_days
- permit_required, permit_info
- cost_per_night, hours
- notes, external_links, source, featured
- state, county, country

### Cannot Update (Protected)
- ❌ id
- ❌ latitude
- ❌ longitude

## Safety Features

### Dry Run Mode
- Always shows preview before applying changes
- Displays up to 10 affected locations with before/after values
- Shows total count of matches
- Provides exact command to execute changes

### Error Prevention
- Protected fields cannot be updated
- Invalid field names rejected
- WHERE clause syntax validated
- Unknown fields rejected

### Change Preview
```
Preview of changes:

────────────────────────────────────────────────────────────
Location #123: Trail Name
  scenery_rating: NULL → 8
  best_season: NULL → Summer
  permit_required: 0 → 1

Location #456: Another Location
  scenery_rating: 6 → 8
  
... and 245 more
```

## Best Practices

### 1. Always Dry Run First
```bash
# GOOD
node bulk-update.js --where "..." --set "..." --dry-run
# Review output
node bulk-update.js --where "..." --set "..."

# BAD
node bulk-update.js --where "..." --set "..."  # Skipped dry run!
```

### 2. Be Specific with WHERE
```bash
# GOOD - Specific conditions
--where "state = 'CA' AND category = 'riding' AND difficulty = 'Easy'"

# RISKY - Too broad
--where "category = 'riding'"  # Updates 1000+ locations!
```

### 3. Test on Small Set First
```bash
# Test with LIMIT
--where "category = 'riding' LIMIT 5"
# Then expand
--where "category = 'riding'"
```

### 4. Backup Before Large Updates
```bash
# Backup database first
./backup-database.sh

# Then update
node bulk-update.js --where "..." --set "..."
```

### 5. Run Data Quality Check After
```bash
# After bulk update
./check-data-quality.sh
```

## Common Workflows

### Fix Missing Data in Batches
```bash
# Find locations missing scenery ratings
sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE scenery_rating IS NULL"

# Update by category
node bulk-update.js \
  --where "category = 'riding' AND scenery_rating IS NULL" \
  --set "scenery_rating=5" \
  --dry-run
```

### Standardize Data Formats
```bash
# Normalize cell signal values
node bulk-update.js \
  --where "cell_signal = 'no signal'" \
  --set "cell_signal='None'" \
  --dry-run

# Standardize seasons
node bulk-update.js \
  --where "best_season LIKE '%fall%'" \
  --set "best_season='Fall'" \
  --dry-run
```

### Regional Updates
```bash
# Update all locations in a state
node bulk-update.js \
  --where "state = 'MT'" \
  --set "notes='Montana requires OHV registration'" \
  --dry-run
```

## Troubleshooting

### "Invalid WHERE clause"
- Check SQL syntax
- Use single quotes for strings: `name = 'value'`
- Escape special characters

### "Unknown field"
- Check spelling
- See list of allowed fields above
- Cannot update id, latitude, longitude

### "No locations match"
- Verify WHERE clause
- Check if data exists: `sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE ..."`
- State/county columns may be NULL if not geocoded

### Changes Not Applied
- Remove `--dry-run` flag
- Check terminal for errors
- Verify database file path

## Performance

- **Small updates (<100 rows):** Instant
- **Medium (100-1000 rows):** 1-2 seconds
- **Large (1000+ rows):** 3-5 seconds
- **Very large (5000+ rows):** 10+ seconds

All updates are atomic - either all succeed or none applied.

---

*Last updated: 2026-02-28*
*Script: bulk-update.js*
