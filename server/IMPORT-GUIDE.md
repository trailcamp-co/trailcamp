# Location Import Guide

## Overview
The `import-locations.js` script allows bulk importing of locations from CSV files with validation and duplicate detection.

## Quick Start

### 1. Generate Example CSV
```bash
node import-locations.js --example
```

This creates `import-example.csv` with sample data.

### 2. Edit CSV File
Add your locations to the CSV file following the format below.

### 3. Validate (Dry Run)
```bash
node import-locations.js your-file.csv --dry-run
```

This validates without importing. Fix any errors reported.

### 4. Import
```bash
node import-locations.js your-file.csv
```

This imports validated locations into the database.

## CSV Format

### Required Columns
- **name** - Location name (required)
- **latitude** - Decimal degrees, -90 to 90 (required)
- **longitude** - Decimal degrees, -180 to 180 (required)
- **category** - Must be: `riding`, `campsite`, `dump`, `water`, or `scenic` (required)

### Optional Columns
- **description** - Brief description
- **sub_type** - For campsites: `boondocking`, `campground`, `rv_park`, etc.
- **trail_types** - For riding: `Single Track`, `Dual Sport`, `Enduro`, `Fire Road`, etc. (comma-separated)
- **difficulty** - `Easy`, `Beginner`, `Moderate`, `Intermediate`, `Hard`, `Advanced`, `Expert`
- **distance_miles** - Trail distance in miles (number)
- **scenery_rating** - 1-10 scale (integer)
- **best_season** - `Summer`, `Winter`, `Spring`, `Fall`, `Spring,Fall`, or `Year-round`
- **cell_signal** - `None`, `Poor`, `Moderate`, `Good`, `Excellent`
- **permit_required** - `1` if permit needed, `0` if not
- **permit_info** - Details about required permits
- **cost_per_night** - Camping cost in dollars (number, 0 for free)
- **hours** - Operating hours (e.g., `24/7`, `Dawn to Dusk`, `8am-5pm`)
- **notes** - Additional information, directions, tips
- **external_links** - URLs to official sites (comma-separated)
- **source** - Data source identifier (defaults to `import`)

### For Campsites Only
- **shade** - `None`, `Partial`, `Full`
- **level_ground** - `Yes`, `No`, `Partial`
- **water_available** - `1` if water on-site, `0` if not
- **water_nearby** - `1` if water nearby, `0` if not
- **stay_limit_days** - Maximum stay in days (number)

## Example CSV

```csv
name,description,latitude,longitude,category,sub_type,trail_types,difficulty,distance_miles,scenery_rating,best_season,cell_signal,permit_required,permit_info,cost_per_night,notes,source
Mountain Loop Trail,Technical single-track with alpine views,47.8234,-121.5678,riding,,Single Track,Hard,12,9,Summer,Poor,1,USFS Northwest Forest Pass,,Steep rocky sections. Best ridden clockwise,manual
Dispersed Camp Site A,Primitive camping near trailhead,47.8156,-121.5543,campsite,boondocking,,,,8,Summer,None,0,,0,High-clearance recommended. Amazing views,manual
```

## Validation Rules

### Automatic Checks
✅ **Coordinates** - Must be within valid ranges  
✅ **Category** - Must be one of 5 allowed values  
✅ **Scenery** - If provided, must be 1-10  
✅ **Duplicates** - Name + coordinates must be unique  
✅ **Required fields** - Name, lat, lon, category must exist

### Common Errors

**"Missing name"**
- Ensure first column has location name
- Name cannot be empty

**"Invalid latitude"**
- Must be decimal degrees: -90 to 90
- Use negative for South

**"Invalid longitude"**
- Must be decimal degrees: -180 to 180  
- Use negative for West (US locations)

**"Invalid category"**
- Must be exactly: `riding`, `campsite`, `dump`, `water`, or `scenic`
- Case-insensitive

**"Duplicate of existing location ID X"**
- Same name and coordinates already exist
- Update existing location instead or use slightly different name

**"Invalid Record Length"**
- CSV has wrong number of columns
- Ensure all rows have same number of fields as header
- Empty fields still need commas: `,,` not just ``

## Tips for Creating CSV Files

### In Excel/Numbers
1. Use the example CSV as a template
2. Fill in your data
3. Export as CSV (UTF-8 if possible)
4. Test with `--dry-run` first

### In Text Editor
1. Copy example CSV header
2. Add one row per location
3. Use `,` for empty fields
4. Don't use quotes unless value contains commas
5. Save as `.csv` file

### Field Order Matters
The CSV columns MUST be in this exact order:
```
name, description, latitude, longitude, category, sub_type,
trail_types, difficulty, distance_miles, scenery_rating,
best_season, cell_signal, permit_required, permit_info,
cost_per_night, notes, source
```

### Empty vs Missing
- **Empty field:** Use `,` between commas: `field1,,field3`
- **Missing optional field:** Still include the comma
- Every row must have exactly 17 fields

## Batch Importing

### Multiple Files
```bash
for file in imports/*.csv; do
  echo "Importing $file..."
  node import-locations.js "$file" --dry-run
  if [ $? -eq 0 ]; then
    node import-locations.js "$file"
  else
    echo "Skipping $file due to errors"
  fi
done
```

### Large Files
For files with 1000+ rows:
- Test with first 10 rows using `--dry-run`
- Import in batches of 500 rows
- Run data quality check after each batch

## After Importing

### Recommended Steps
1. **Run data quality check:**
   ```bash
   ./check-data-quality.sh
   ```

2. **Check for duplicates:**
   ```bash
   node find-duplicates.js
   ```

3. **Verify imports:**
   ```bash
   sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations WHERE source = 'import'"
   ```

4. **Update dashboard:**
   ```bash
   node generate-dashboard-data.js
   ```

5. **Backup database:**
   ```bash
   ./backup-database.sh
   ```

## Troubleshooting

### Import Fails Midway
- Database rolled back automatically
- Fix errors in CSV
- Re-run import (duplicates will be caught)

### Special Characters
- Use UTF-8 encoding
- Avoid smart quotes (" ") - use straight quotes ("")
- Commas in values: wrap field in quotes: `"view, amazing"` (but avoid if possible)

### Performance
- 100 rows: ~1 second
- 1,000 rows: ~5 seconds
- 10,000 rows: ~30 seconds

## Data Sources

When importing from external sources, set the `source` column appropriately:
- `recreation_gov` - Recreation.gov data
- `manual` - Hand-researched/verified
- `import` - Bulk import (default)
- `user` - User contribution
- `ridebdr.com` - BDR route data
- `nps` - National Park Service
- `usfs` - US Forest Service

---

*Last updated: 2026-02-28*
*Script: import-locations.js*
