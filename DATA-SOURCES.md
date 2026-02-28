# TrailCamp Data Sources

This document describes all data sources used in TrailCamp and how the data was collected, processed, and integrated.

## Summary

- **Total Locations:** 5,597
- **Riding Locations:** 1,215
- **Camping Locations:** 4,370 (494 boondocking, 3,872 campgrounds)
- **Other:** 12 (dump stations, water sources, scenic points)

---

## Primary Data Sources

### 1. Recreation.gov (Campgrounds)

**Source:** [Recreation.gov Ridb API](https://ridb.recreation.gov/)
**Coverage:** ~3,900 campgrounds across National Parks, National Forests, BLM, Army Corps of Engineers, etc.
**License:** Public domain (U.S. Government)
**Fields Imported:**
- Facility name
- GPS coordinates (latitude, longitude)
- Facility type (campground, group site, etc.)
- Reservation info
- Basic amenities

**Processing:**
- Filtered to motorcycle-relevant camping (excludes RV-only, group sites, etc.)
- Enriched with additional fields (scenery ratings, best season, notes)
- Added `source` = `recreation_gov` + facility ID in `source_id`

**Data Quality:**
- ✅ High coordinate accuracy (GPS verified)
- ✅ Official names
- ⚠️ Limited detail on dispersed/primitive sites
- ⚠️ Cost data often outdated (manually updated where possible)

---

### 2. Manual Research (Riding + Boondocking)

**Coverage:** ~1,700 locations (all riding + boondocking spots)
**Sources:**
- State OHV trail maps
- National Forest motor vehicle use maps (MVUMs)
- Bureau of Land Management (BLM) recreation maps
- State park websites
- Riding forums (ThumperTalk, ADVRider)
- Personal GPS tracks
- BDR route data (ridebdr.com)
- Local trail guides

**Methodology:**
1. Research official trail maps and regulations
2. Verify coordinates using Google Maps / satellite imagery
3. Cross-reference multiple sources for accuracy
4. Add detailed riding-specific data (trail types, difficulty, distance)
5. Include permit requirements and access info
6. Rate scenery based on photos/videos/reports

**Data Quality:**
- ✅ Highly curated for motorcycle relevance
- ✅ Detailed trail-specific information
- ⚠️ Subjective ratings (difficulty, scenery)
- ⚠️ Requires periodic updates (trail conditions change)

---

### 3. Specific Data Collection Campaigns

#### BDR Routes (Backcountry Discovery Routes)

**Source:** [ridebdr.com](https://ridebdr.com)
**Coverage:** 13 BDR routes (WABDR, COBDR, UTBDR, etc.)
**Fields:**
- Official route name
- Total mileage
- Start/end points
- Difficulty rating
- Seasonality
- External links to official route pages

**Processing:**
- Each route added as single "riding" location with full mileage
- Coordinates set to approximate route midpoint or iconic section
- Trail type: "Dual Sport,Fire Road"
- All rated 9-10/10 scenery (bucket-list routes)

#### State-by-State Expansion

**Wave 1 (D1-D7):**
- Pacific Northwest boondocking (30 locations)
- New England riding (25 locations)
- Great Lakes riding (20 locations)
- Southwest desert boondocking (20 locations)
- Hawaii/Alaska riding (15 locations)
- Epic dual sport routes (10 locations)
- Plains states riding (20 locations)

**Wave 1.6 (D8-D17):**
- Southeast riding (15 locations)
- California boondocking (15 locations)
- Texas riding (10 locations)
- Rocky Mountain boondocking (10 locations)
- Mid-Atlantic riding (10 locations)
- Scenic byways (10 locations)

**Methodology:**
- Target underrepresented regions
- Focus on publicly accessible locations
- Prioritize diverse difficulty levels
- Verify permit requirements
- Add external links to official sources

---

## Data Processing & Enrichment

### Automated Enrichment (Wave 1.5/1.7)

**DQ1: Scenery Ratings**
- Applied intelligent defaults based on location type
- National Parks → 8/10
- State Parks → 7/10
- Boondocking → 7/10 (scenic by nature)
- Generic campgrounds → 6/10
- Manually reviewed and adjusted high-value locations

**DQ2: Trail Types Standardization**
- Converted JSON arrays to comma-separated format
- Alphabetized values
- Removed inconsistent spacing

**DQ3: Best Season**
- Applied regional defaults based on climate
- Desert Southwest → Winter
- PNW/Great Lakes → Summer
- Mid-Atlantic → Spring/Fall
- Tropical (Hawaii) → Year-round

**DQ7: High-Elevation Seasonal Notes**
- Added snow season warnings to 39 mountain passes
- Included accessibility windows

**DQ9: Water Availability**
- Flagged 29 boondocking spots with water access
- Flagged 3,872 campgrounds with on-site water

**DQ10: Operating Hours**
- Set 4,340 locations to "24/7" (campgrounds, boondocking)
- Set 135 OHV areas to "Dawn to Dusk"

**DQ14: External Links**
- Added ridebdr.com links for all BDR routes
- Added NPS/USFS links for major trails
- Total: 67 locations with external links

**DQ20: Featured Flag**
- Marked 70 bucket-list locations as "featured"
- Criteria: 10/10 scenery, iconic routes, BDRs, major National Parks

### Data Cleaning (Wave 1.7)

**DQ6: Duplicate Removal**
- Removed ~440 duplicates in D6
- Removed 20 additional duplicates in DQ8
- Used coordinate + name matching

**DQ12: Coordinate Validation**
- Verified all 5,597 coordinates in valid ranges
- Checked for common errors (swapped lat/lon, wrong hemisphere)
- 0 issues found

**DQ13: Elevation Data**
- Added elevation to major high-altitude passes
- Colorado 12,000'+ passes
- Trail Ridge Road (12,183ft)
- Beartooth Highway (10,947ft)
- Mauna Kea (13,796ft)

---

## Data Gaps & Known Limitations

### Geographic Coverage

**Well Represented:**
- Rocky Mountains (1,355 locations)
- California (881 locations)
- Pacific Northwest (733 locations)

**Underrepresented:**
- Great Plains (180 locations) - limited public land
- Hawaii (9 locations) - island access constraints
- Alaska (193 locations) - remote, seasonal access

### Data Completeness

**High Coverage (>95%):**
- ✅ Coordinates (100%)
- ✅ Names (100%)
- ✅ Categories (100%)
- ✅ Scenery ratings (100%)
- ✅ Best season (100%)

**Moderate Coverage (50-95%):**
- ⚠️ Cost data (622 locations, 11%)
- ⚠️ Permit info (partial - 305 locations likely need review)
- ⚠️ External links (67 locations)

**Low Coverage (<50%):**
- ❌ Nearby town info (limited)
- ❌ Elevation data (only major passes)
- ❌ Road conditions (not systematically captured)

### Seasonal Currency

- Campground fees may change annually
- Trail conditions change with weather/maintenance
- Permit requirements can be updated by agencies
- **Recommendation:** Annual review and update cycle

---

## Verification & Quality Assurance

### Automated Checks

**Data Quality Script (`check-data-quality.sh`):**
- 15 automated integrity checks
- Runs on all locations
- Current status: ✅ All checks passing

**Checks Include:**
- Required fields (name, coordinates, category)
- Coordinate range validation
- Scenery rating ranges (1-10)
- Distance reasonability (<10,000 miles)
- Foreign key integrity
- Duplicate detection

### Manual Review

**High-Value Locations:**
- All 10/10 scenery locations manually verified
- All BDR routes cross-referenced with ridebdr.com
- Major National Park trails verified with NPS sources

**Random Sampling:**
- Periodic spot-checks of coordinates using satellite imagery
- Cross-reference permit requirements with official sources

---

## Citation & Attribution

### Government Data

- **Recreation.gov:** Public domain, U.S. Government
- **USFS MVUMs:** Public domain, USDA Forest Service
- **BLM Maps:** Public domain, Bureau of Land Management
- **NPS Data:** Public domain, National Park Service

### Third-Party Sources

- **ridebdr.com:** Used with attribution for BDR route info
- **AllTrails:** Referenced for trail verification (links added where appropriate)
- **State DNR/Parks:** Public information, links to official sources

### User Contributions

- Future user-submitted locations will be tracked with `source = 'user'`
- Contributors will be credited in commit messages / release notes

---

## Update Frequency

### Current Status (2026-02-28)

- Last major data expansion: 2026-02-28
- Total overnight build sessions: 1 (~12 hours autonomous work)
- Total locations added: 5,597
- Total analysis reports generated: 10+

### Planned Updates

**Quarterly:**
- Review campground fees
- Update permit requirements
- Add newly opened trails

**Annually:**
- Re-scrape Recreation.gov for new facilities
- Update BDR route data
- Expand underrepresented regions

**Ongoing:**
- User-submitted corrections
- Community contributions via pull requests

---

## Data Export

All data can be exported via:

**CSV Exports:**
- `trailcamp-all-locations.csv` (full database)
- `trailcamp-riding.csv` (riding locations only)
- `trailcamp-boondocking.csv` (boondocking only)
- `trailcamp-campgrounds.csv` (campgrounds only)

**SQL Dump:**
- `trailcamp-backup.sql` (complete schema + data)

**JSON Analysis:**
- `location-density-analysis.json` (heatmap data)

**Generated via:**
```bash
cd server
./backup-database.sh  # SQL dump
node analyze-density.js  # JSON heatmap
```

---

## Contributing Data

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Adding new locations
- Improving existing data
- Data quality standards
- Pull request process

---

## Questions or Issues?

- **Data errors:** Open an issue with location ID + details
- **Missing locations:** Submit via pull request or issue
- **Source verification:** We welcome fact-checking and corrections

---

*Last updated: 2026-02-28*
*Database version: 1.0 (5,597 locations)*
