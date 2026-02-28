# GPX Export Guide

## Overview
Export TrailCamp locations and trips to GPX format for use with GPS devices, mapping apps, and navigation software.

## Quick Start

### Export Riding Locations
```bash
# All riding locations
node export-gpx.js riding --output all-riding.gpx

# California trails only
node export-gpx.js riding --state CA --output ca-trails.gpx

# Hard difficulty trails
node export-gpx.js riding --difficulty Hard --output hard-trails.gpx

# Epic scenery (8+) riding spots
node export-gpx.js riding --scenery 8 --output epic-riding.gpx
```

### Export Campsites
```bash
# All campsites
node export-gpx.js campsites --output campsites.gpx

# Boondocking spots only
node export-gpx.js campsites --subtype boondocking --output boondocking.gpx

# Utah campgrounds
node export-gpx.js campsites --state UT --output utah-camps.gpx
```

### Export Trips
```bash
# Export trip by ID
node export-gpx.js trip 1 --output my-trip.gpx
```

## GPX Format

### Waypoints
Each location becomes a waypoint with:
- **Coordinates:** Latitude, longitude
- **Name:** Location name
- **Description:** Full description
- **Comment:** Difficulty, distance, scenery rating
- **Type:** Trail or Campsite
- **Symbol:** Trail Head or Campground

### Routes (Trips Only)
Trip exports include a route connecting all stops in order:
- Route points for each stop
- Stop order preserved
- Trip name and notes included

## GPS Device Compatibility

### Tested Devices
- ✅ **Garmin** (Montana, GPSMAP, eTrex, etc.)
- ✅ **Garmin Basecamp** (Desktop planning)
- ✅ **Gaia GPS** (Mobile app)
- ✅ **OnX Offroad** (Import waypoints)
- ✅ **Google Earth** (Open GPX files)

### Import Instructions

**Garmin Devices:**
1. Connect device to computer
2. Copy `.gpx` file to `/Garmin/GPX/` folder
3. Eject device safely
4. Waypoints appear in Waypoint Manager

**Gaia GPS:**
1. Open Gaia GPS app
2. Tap Menu → Saved → Import
3. Select GPX file
4. Waypoints and routes import automatically

**OnX Offroad:**
1. Open OnX app
2. Tap Menu → Waypoints → Import
3. Choose GPX file
4. Waypoints added to "Imported" folder

## Advanced Usage

### Combine Filters
```bash
# California boondocking with epic scenery
node export-gpx.js campsites --state CA --subtype boondocking --scenery 9

# Colorado moderate riding trails
node export-gpx.js riding --state CO --difficulty Moderate
```

### Limit Results
```bash
# Top 50 riding locations (by name alphabetically)
node export-gpx.js riding --limit 50
```

### Batch Export by State
```bash
# Export each state separately
for state in CA CO UT AZ; do
  node export-gpx.js riding --state $state --output ${state}-riding.gpx
done
```

## File Sizes

Typical GPX file sizes:
- 10 locations: ~2-3 KB
- 100 locations: ~20-30 KB
- 1,000 locations: ~200-300 KB
- Full database (6,000+): ~1.2 MB

All files are XML text format and compress well with zip.

## Use Cases

### Trip Planning
1. Export trip to GPX
2. Load in Gaia GPS or Garmin
3. Navigate turn-by-turn on device
4. Track actual route vs planned

### Offline Maps
1. Export riding spots for a region
2. Load into offline GPS app
3. Find trails without cell signal
4. Navigate to trailheads

### Sharing Routes
1. Export trip GPX
2. Share file with riding buddies
3. They import to their devices
4. Everyone has same waypoints

### Backup
1. Export all locations periodically
2. Store GPX files as backup
3. Can re-import if database lost

## Customization

### Add Custom Fields
Edit `export-gpx.js` to include more metadata:
```javascript
// Add elevation to comment
if (loc.elevation) cmt += `Elevation: ${loc.elevation}ft. `;

// Add permit info to description
if (loc.permit_info) desc += ` ${loc.permit_info}`;
```

### Change Symbols
Garmin supports many symbols. Edit in `generateWaypoint()`:
```javascript
<sym>${loc.difficulty === 'Hard' ? 'Danger' : 'Trail Head'}</sym>
```

Available symbols: Trail Head, Campground, Bike Trail, Flag, Waypoint, etc.

## Troubleshooting

### "Trip not found"
Check trip ID is correct:
```bash
sqlite3 trailcamp.db "SELECT id, name FROM trips"
```

### GPS Device Won't Import
- Ensure file has `.gpx` extension
- Check file isn't corrupted: `head export.gpx`
- Try smaller batch: `--limit 100`

### Garmin Shows Wrong Symbol
Some devices have limited symbol support. Use generic symbols:
- `Trail Head` → Universally supported
- Custom symbols may show as default waypoint icon

### File Too Large
Split into multiple files:
```bash
node export-gpx.js riding --state CA --output ca-riding.gpx
node export-gpx.js riding --state UT --output ut-riding.gpx
```

## Integration with Other Tools

### Google Earth
1. Open Google Earth
2. File → Open → Select `.gpx`
3. Waypoints appear as placemarks
4. Can export to KML if needed

### CalTopo
1. Go to caltopo.com
2. File → Import → GPX
3. Waypoints added to map
4. Can plan routes connecting them

### Ride with GPS
1. Go to ridewithgps.com
2. My Routes → Import GPX
3. Creates route from waypoints
4. Calculate distance/elevation

## Best Practices

1. **Name files clearly:** `ca-single-track-hard.gpx` not `export.gpx`
2. **Use filters:** Don't export all 6,000 locations to a GPS device
3. **Test small first:** Export 10 locations, test import, then do full export
4. **Organize by region:** Easier to find on device
5. **Update periodically:** Re-export when new locations added

## Future Enhancements

Potential improvements:
- [ ] Export tracks (multi-point routes) in addition to waypoints
- [ ] Include elevation data if available
- [ ] Add GPX extensions for trail type, difficulty
- [ ] Generate KML output for Google Earth
- [ ] Create GeoJSON for web mapping
- [ ] Batch export all states automatically
- [ ] Include photos/links in waypoint metadata

---

*Last updated: 2026-02-28*
*Script: export-gpx.js*
*GPX Version: 1.1 (compatible with all major GPS devices)*
