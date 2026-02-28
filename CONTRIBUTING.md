# Contributing to TrailCamp

Thank you for your interest in contributing to TrailCamp! This guide will help you add new locations, improve existing data, and contribute code improvements.

## Table of Contents

1. [Adding New Locations](#adding-new-locations)
2. [Data Quality Standards](#data-quality-standards)
3. [Improving Existing Data](#improving-existing-data)
4. [Code Contributions](#code-contributions)
5. [Reporting Issues](#reporting-issues)

---

## Adding New Locations

### Riding Locations

To add a new riding location (trail, OHV area, etc.):

1. **Gather Required Information:**
   - Name (official name preferred)
   - Precise coordinates (latitude, longitude)
   - Trail types (Single Track, Dual Sport, Enduro, Fire Road, etc.)
   - Difficulty rating (Easy, Moderate, Hard, etc.)
   - Distance in miles
   - Scenery rating (1-10 scale)

2. **Optional But Recommended:**
   - Best season to ride
   - Cell signal availability
   - Permit requirements
   - External links (official website, trail info)
   - Notes (directions, conditions, tips)

3. **Add via SQL:**

```sql
INSERT INTO locations (
  name,
  description,
  latitude,
  longitude,
  category,
  trail_types,
  difficulty,
  distance_miles,
  scenery_rating,
  best_season,
  cell_signal,
  permit_required,
  permit_info,
  external_links,
  notes,
  source
) VALUES (
  'Trail Name Here',
  'Brief description of the trail and what makes it special',
  40.1234,
  -105.6789,
  'riding',
  'Single Track,Enduro',  -- Comma-separated, no spaces after commas
  'Moderate',
  25,  -- miles
  8,   -- scenery rating 1-10
  'Summer',
  'None',
  1,   -- 1 if permit required, 0 if not
  'USFS Northwest Forest Pass required',
  'https://www.fs.usda.gov/...',
  'Trailhead parking at mile marker 12. Best ridden clockwise.',
  'manual'
);
```

### Camping Locations

To add a new campsite (campground, boondocking spot):

1. **Gather Required Information:**
   - Name
   - Coordinates
   - Sub-type (boondocking, campground, RV park, etc.)
   - Scenery rating
   - Best season

2. **Optional But Valuable:**
   - Water availability (on-site or nearby)
   - Cost per night
   - Stay limit (days)
   - Shade availability
   - Level ground for camping
   - Cell signal
   - Permit info
   - Operating hours

3. **Add via SQL:**

```sql
INSERT INTO locations (
  name,
  description,
  latitude,
  longitude,
  category,
  sub_type,
  scenery_rating,
  best_season,
  water_available,
  water_nearby,
  cost_per_night,
  stay_limit_days,
  shade,
  level_ground,
  cell_signal,
  permit_required,
  permit_info,
  hours,
  notes,
  source
) VALUES (
  'Campsite Name Here',
  'Dispersed camping area with mountain views',
  38.5678,
  -106.1234,
  'campsite',
  'boondocking',
  9,
  'Summer,Fall',
  0,  -- no water on-site
  1,  -- water nearby
  0,  -- free
  14, -- 14-day stay limit
  'Partial',
  'Yes',
  'Moderate',
  0,  -- no permit required
  NULL,
  '24/7',
  'Access road rough, high-clearance recommended. Amazing sunset views.',
  'manual'
);
```

---

## Data Quality Standards

### Required Fields

All locations must have:
- ✅ **name** - Official or commonly used name
- ✅ **latitude** - Decimal degrees (-90 to 90)
- ✅ **longitude** - Decimal degrees (-180 to 180)
- ✅ **category** - `riding`, `campsite`, `dump`, `water`, or `scenic`

### Riding Locations Should Have:
- ✅ **trail_types** - At least one type
- ✅ **difficulty** - Standard difficulty level
- ✅ **distance_miles** - Total trail distance
- ✅ **scenery_rating** - 1-10 scale

### Campsites Should Have:
- ✅ **sub_type** - boondocking, campground, etc.
- ✅ **scenery_rating** - 1-10 scale
- ✅ **best_season** - When to visit

### Data Format Rules

**Trail Types:**
- Use comma-separated format: `Single Track,Enduro,Fire Road`
- NO spaces after commas
- Standard values: Single Track, Dual Sport, Enduro, Fire Road, Motocross, Sand Dunes, Ridge Riding, Technical, Rock Crawling, Desert

**Difficulty Levels:**
- Standard values: Easy, Beginner, Moderate, Intermediate, Hard, Advanced, Expert
- Choose based on technical challenge and consequences of mistakes

**Scenery Ratings:**
- 1-3: Functional, not particularly scenic
- 4-5: Pleasant scenery
- 6-7: Good scenery, worth the trip
- 8-9: Excellent scenery, destination-worthy
- 10: World-class, bucket-list scenery

**Best Season:**
- Format: `Summer`, `Winter`, `Spring`, `Fall`, `Spring,Fall`, or `Year-round`
- Match comma format with NO spaces

**Coordinates:**
- Use decimal degrees (not degrees/minutes/seconds)
- 4-6 decimal places precision
- US locations: latitude 18°-72°N, longitude 130°W-67°W

---

## Improving Existing Data

Found incomplete or incorrect data? Here's how to improve it:

### Adding Missing Information

```sql
-- Add trail types to location
UPDATE locations 
SET trail_types = 'Single Track,Enduro' 
WHERE id = 123;

-- Add scenery rating
UPDATE locations 
SET scenery_rating = 8 
WHERE id = 123;

-- Add permit information
UPDATE locations 
SET permit_required = 1,
    permit_info = 'Arizona State Land Trust Recreational Permit required ($15/year)'
WHERE id = 123;
```

### Correcting Errors

```sql
-- Fix coordinates
UPDATE locations 
SET latitude = 40.1234, longitude = -105.6789 
WHERE id = 123;

-- Fix difficulty rating
UPDATE locations 
SET difficulty = 'Hard' 
WHERE id = 123;

-- Update cost
UPDATE locations 
SET cost_per_night = 25 
WHERE id = 123;
```

### Enriching Descriptions

Good descriptions include:
- What makes the location special
- Key features (views, technical sections, amenities)
- Important warnings or notes
- Access information

```sql
UPDATE locations 
SET description = 'Epic single-track riding through alpine meadows. Challenging rocky sections near the summit. Best ridden late summer after snow clears. Parking at Trailhead #4.'
WHERE id = 123;
```

---

## Code Contributions

### Setting Up Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/trailcamp.git
cd trailcamp

# Install dependencies
cd client && npm install
cd ../server && npm install

# Run dev servers
npm run dev  # Starts both client (5173) and server (3001)
```

### Code Style

- **JavaScript/TypeScript:** Follow existing patterns
- **React components:** Functional components with hooks
- **SQL:** Uppercase keywords, readable formatting
- **File naming:** kebab-case for files, PascalCase for React components

### Testing Your Changes

Before submitting:
```bash
# Run data quality checks
cd server
./check-data-quality.sh

# Run performance tests
./test-performance.sh

# Check for duplicates
node find-duplicates.js
```

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b add-arizona-trails`
3. **Make your changes** (data additions, code improvements, etc.)
4. **Test thoroughly** using scripts above
5. **Commit with clear messages:**
   ```bash
   git commit -m "Add 15 single-track trails in Arizona"
   git commit -m "Fix permit info for California OHV areas"
   git commit -m "Improve map clustering performance"
   ```
6. **Push to your fork:** `git push origin add-arizona-trails`
7. **Open a Pull Request** with:
   - Clear title describing the change
   - Description of what you added/fixed
   - Any testing you performed
   - Screenshots if UI changes

---

## Reporting Issues

### Found Bad Data?

[Open an issue](https://github.com/yourusername/trailcamp/issues) with:
- Location ID (if known)
- Location name
- What's wrong (incorrect coordinates, outdated info, etc.)
- Correct information (if you have it)

### Found a Bug?

[Open an issue](https://github.com/yourusername/trailcamp/issues) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/device info (if relevant)
- Screenshots (if applicable)

### Feature Requests

We welcome ideas! Open an issue with:
- Clear description of the feature
- Why it would be useful
- Examples of how it might work

---

## Data Sources

When adding locations, please cite your sources:
- Official trail maps or websites
- State/National Forest service sites
- ridebdr.com (for BDR routes)
- Recreation.gov (for campgrounds)
- Personal GPS tracks (if high accuracy)

Set the `source` field appropriately:
- `recreation_gov` - Recreation.gov data
- `manual` - Manually added/researched
- `import` - Bulk data import
- `user` - User submission

Add official links in `external_links` field when available.

---

## Questions?

- Check existing issues for similar questions
- Review the README.md for general project info
- Open a discussion or issue for help

---

**Thank you for helping make TrailCamp better for the motorcycle adventure community!** 🏍️🏕️
