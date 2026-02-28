# GPX Export Guide

## Overview
Export TrailCamp locations to GPX format for use with GPS devices, mapping software, and trip planning tools.

## Quick Start

### Export All Riding Locations
```bash
node export-to-gpx.js --riding all-trails.gpx
```

### Export All Camping Locations
```bash
node export-to-gpx.js --camping all-camps.gpx
```

### Export Specific Trip
```bash
node export-to-gpx.js --trip 1 my-trip.gpx
```

### Export by State
```bash
node export-to-gpx.js --state CA california.gpx
node export-to-gpx.js --state UT utah.gpx
```

## Output Format

### GPX 1.1 Standard
- Industry-standard XML format
- Compatible with virtually all GPS devices and software
- Includes waypoints with coordinates, names, descriptions

### Waypoint Data Included
- **name** - Location name
- **description** - Full description
- **lat/lon** - Precise coordinates
- **type** - Trail, Camping, or Campground
- **symbol** - Trail Head or Campground (for GPS display)

### Extensions (Custom Data)
- **difficulty** - Trail difficulty rating
- **scenery** - Scenery rating (1-10)
- **trail_types** - Trail types (Single Track, Dual Sport, etc.)
- **distance_miles** - Trail distance

## Compatible Devices & Software

### GPS Devices
- ✅ **Garmin** - All models (Montana, GPSMAP, eTrex, etc.)
- ✅ **Magellan** - Most models
- ✅ **TomTom** - Rider series
- ✅ **Lowrance** - Endura series

### Desktop Software
- ✅ **Garmin BaseCamp** - Trip planning
- ✅ **Google Earth** - Visualization
- ✅ **QGIS** - GIS analysis
- ✅ **GPSBabel** - Format conversion

### Mobile Apps
- ✅ **Gaia GPS** - Offline maps & navigation
- ✅ **AllTrails** - Trail discovery
- ✅ **Ride with GPS** - Motorcycle routing
- ✅ **OsmAnd** - Offline navigation

## Usage Examples

### 1. Load on Garmin GPS
```bash
# Export riding locations
node export-to-gpx.js --riding garmin-trails.gpx

# Copy to device
cp garmin-trails.gpx /Volumes/GARMIN/GPX/

# Eject device - waypoints will appear on GPS
```

### 2. Plan Trip in BaseCamp
```bash
# Export trip
node export-to-gpx.js --trip 1 western-trip.gpx

# Import into BaseCamp:
# File → Import → western-trip.gpx
```

### 3. Visualize in Google Earth
```bash
# Export state
node export-to-gpx.js --state CO colorado.gpx

# Import into Google Earth:
# File → Open → colorado.gpx
```

### 4. Offline Maps in Gaia GPS
```bash
# Export camping spots
node export-to-gpx.js --camping camps.gpx

# Import in Gaia GPS app:
# More → Import → Select File
```

## Advanced Usage

### Export Multiple States
```bash
for state in CA OR WA UT CO AZ; do
  node export-to-gpx.js --state $state "${state,,}-locations.gpx"
done
```

### Filter by Category
The script currently supports:
- `--riding` - All riding locations
- `--camping` - All camping locations

### Combine Multiple GPX Files
```bash
# Use GPSBabel to merge
gpsbabel -i gpx -f file1.gpx -f file2.gpx -o gpx -F combined.gpx
```

## File Sizes

Typical export sizes:
- **All riding** (1,554 locations): ~450KB
- **All camping** (4,682 locations): ~1.2MB
- **Single trip** (10 stops): ~5KB
- **State** (varies): 50KB - 300KB

All files are plain text XML and compress well.

## Importing to Specific Devices

### Garmin Montana/GPSMAP
1. Connect device via USB
2. Copy `.gpx` file to `/Garmin/GPX/` folder
3. Eject safely
4. Waypoints appear in Waypoint Manager

### Garmin BaseCamp
1. File → Import → Select `.gpx` file
2. Waypoints appear in "My Collection"
3. Drag to trip or create routes

### Gaia GPS (iOS/Android)
1. Open app → More → Import
2. Select `.gpx` file from Files/Downloads
3. Waypoints added to Saved folder

### Google Earth
1. File → Open → Select `.gpx` file
2. Waypoints appear in left sidebar
3. Click to fly to location

## Troubleshooting

### "No locations found"
- Check that state code is uppercase: `--state CA` not `--state ca`
- Verify state data exists: `node geocode-locations.js --report`

### GPX won't load on device
- Check file isn't corrupted: `head -20 file.gpx` should show XML
- Ensure device supports GPX 1.1 (most modern devices do)
- Try smaller file (use `--state` instead of `--riding`)

### Waypoints show wrong symbols
- Different devices use different symbol sets
- Edit GPX file to change `<sym>` tags if needed

### Extensions don't show
- Not all software displays custom extensions
- Core data (name, coordinates, description) will always work

## Batch Export Script

Create `export-all.sh`:
```bash
#!/bin/bash
# Export all locations to GPX

cd /Users/nicosstrnad/Projects/trailcamp/server

# Export by category
node export-to-gpx.js --riding exports/all-riding.gpx
node export-to-gpx.js --camping exports/all-camping.gpx

# Export by state (top 10)
for state in CA CO UT AZ OR WA NV ID MT WY; do
  node export-to-gpx.js --state $state "exports/${state}-locations.gpx"
done

echo "✓ Export complete!"
ls -lh exports/
```

Make executable:
```bash
chmod +x export-all.sh
./export-all.sh
```

## GPX Schema

Standard GPX 1.1 structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1">
  <metadata>
    <name>TrailCamp Export</name>
    <time>2026-02-28T22:09:00Z</time>
  </metadata>
  
  <wpt lat="40.1234" lon="-105.6789">
    <name>Example Trail</name>
    <desc>Beautiful single-track through pine forest</desc>
    <type>Trail</type>
    <sym>Trail Head</sym>
    <extensions>
      <difficulty>Moderate</difficulty>
      <scenery>8</scenery>
      <trail_types>Single Track</trail_types>
      <distance_miles>15</distance_miles>
    </extensions>
  </wpt>
</gpx>
```

## Future Enhancements

Potential improvements:
- [ ] Export routes (connected waypoints) not just waypoints
- [ ] Add elevation data from external source
- [ ] Generate tracks (GPS breadcrumb trails) for trails
- [ ] Split large files by region automatically
- [ ] Add thumbnail images as waypoint photos
- [ ] Export KML format for Google Earth/Maps

---

*Last updated: 2026-02-28*
*Script: export-to-gpx.js*
*Format: GPX 1.1 Standard*
