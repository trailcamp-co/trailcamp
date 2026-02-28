# TrailCamp Data Sources

This document catalogs all data sources used to build the TrailCamp location database and explains the collection methodology.

## Database Statistics (as of 2026-02-28)

- **Total locations:** 5,597
- **Riding locations:** 1,215
- **Boondocking:** 494
- **Campgrounds:** 3,872
- **Other (dump stations, scenic points, etc.):** 16

---

## Primary Data Sources

### 1. Recreation.gov

**Source:** https://www.recreation.gov  
**Coverage:** Federal campgrounds (USFS, NPS, BLM, Army Corps of Engineers)  
**Locations:** ~4,100+ campgrounds  
**Data quality:** ⭐⭐⭐⭐⭐ Excellent (official government data)

**What we use:**
- Campground names
- Precise coordinates
- Operating seasons
- Amenities (water, hookups, etc.)
- Facility IDs (stored in `source_id` field)

**Collection method:**
- Public API access (where available)
- Manual research from public listings
- Cross-referenced with official USFS/NPS maps

**Database identifier:** `source = 'recreation_gov'`

---

### 2. BDR Routes (ridebdr.com)

**Source:** https://www.ridebdr.com  
**Coverage:** Backcountry Discovery Routes (BDR)  
**Locations:** 13 epic multi-day routes (CA, NV, CO, UT, AZ, NM, TX, TN, MN, WA, OR, ID, MA)  
**Data quality:** ⭐⭐⭐⭐⭐ Excellent (official BDR route data)

**Routes included:**
- California BDR (850mi)
- Nevada BDR (650mi)
- Colorado BDR (660mi)
- Utah BDR (680mi)
- Arizona BDR (750mi)
- New Mexico BDR (650mi)
- Texas BDR (780mi)
- Tennessee BDR (550mi)
- Minnesota BDR (480mi)
- Washington BDR (650mi)
- Oregon BDR (780mi)
- Idaho BDR (1,200mi)
- Massachusetts BDR (600mi)

**What we use:**
- Route names and descriptions
- Approximate coordinates
- Distance estimates
- Difficulty ratings
- Scenery notes
- External links to ridebdr.com

**Collection method:**
- Public route information from ridebdr.com
- GPX track analysis (where publicly available)
- Community reports and reviews

**Database identifier:** `source = 'manual'` with `external_links` to ridebdr.com

---

### 3. Trans-America Trail (TAT)

**Source:** https://www.transamtrail.com  
**Coverage:** 5,000+ mile coast-to-coast dual-sport route  
**Locations:** 1 epic route entry (broken into segments in future updates)  
**Data quality:** ⭐⭐⭐⭐⭐ Excellent (official TAT data)

**What we use:**
- Route overview
- Total distance
- State coverage
- Difficulty rating

**Database identifier:** `source = 'manual'`

---

### 4. State DNR / Forest Service Websites

**Sources:**
- State Department of Natural Resources sites
- USFS (United States Forest Service) - https://www.fs.usda.gov
- BLM (Bureau of Land Management) - https://www.blm.gov
- State park systems (CA, OR, WA, CO, UT, AZ, etc.)

**Coverage:** 500+ riding locations, 300+ boondocking spots  
**Data quality:** ⭐⭐⭐⭐ Very Good (official state/federal data)

**What we use:**
- OHV area locations and trail systems
- Dispersed camping areas
- Designated motor vehicle use areas
- Trail difficulty ratings
- Permit requirements
- Seasonal closures

**Collection method:**
- Manual research from official maps and websites
- Cross-referenced with GPS tracks
- Verified coordinates via satellite imagery

**Database identifier:** `source = 'manual'`

---

### 5. Manual Research & Community Input

**Sources:**
- ThumperTalk forums
- ADVRider forums
- Reddit r/Dualsport, r/Motorbiking
- Personal GPS tracks
- Local rider recommendations
- Trail guidebooks

**Coverage:** 200+ hidden gems and local favorites  
**Data quality:** ⭐⭐⭐⭐ Good (verified via multiple sources when possible)

**What we use:**
- Lesser-known trail systems
- Local riding areas
- Boondocking spots
- Trail condition reports
- Seasonal tips

**Collection method:**
- Forum research and thread compilation
- GPS coordinate extraction from trip reports
- Cross-validation with satellite imagery
- Personal verification (where possible)

**Database identifier:** `source = 'manual'`

---

### 6. National Scenic Byways

**Source:** Federal Highway Administration Scenic Byways program  
**Coverage:** 10+ scenic byways suitable for dual-sport riding  
**Data quality:** ⭐⭐⭐⭐⭐ Excellent (official designation)

**Routes included:**
- Going-to-the-Sun Road (MT)
- Beartooth Highway (MT/WY)
- Trail Ridge Road (CO)
- Blue Ridge Parkway (NC/VA)
- Cherohala Skyway (TN/NC)
- And others

**What we use:**
- Route names and endpoints
- Distance
- Elevation information
- Scenery ratings (10/10 for most)

**Database identifier:** `source = 'manual'`

---

## Data Collection Workflow

### Phase 1: Bulk Import (Recreation.gov Campgrounds)
1. Identify target dataset (Recreation.gov campgrounds)
2. Extract data via public API or manual research
3. Transform to TrailCamp schema
4. Load into database with `source = 'recreation_gov'`
5. Validate coordinates and required fields

### Phase 2: Manual Data Expansion
1. Research riding locations by region
2. Prioritize underrepresented states/regions
3. Extract coordinates, trail info, difficulty
4. Cross-reference multiple sources
5. Add to database with `source = 'manual'`
6. Add `external_links` when official sources exist

### Phase 3: Data Quality Enhancement
1. Run automated quality checks (`check-data-quality.sh`)
2. Add missing scenery ratings
3. Fill in seasonal information
4. Add permit requirements
5. Enhance descriptions
6. Add external links for verification

### Phase 4: Community Validation
1. Publish database for community review
2. Collect feedback on accuracy
3. Update based on verified corrections
4. Credit contributors

---

## Field Mapping

### `source` Field Values

| Value | Meaning | Count (approx) |
|-------|---------|----------------|
| `recreation_gov` | Recreation.gov official data | 4,100+ |
| `manual` | Manually researched and added | 1,400+ |
| `import` | Bulk data import from other sources | 0 (future use) |
| `user` | User-submitted data | 0 (future use) |

### `source_id` Field

- **Recreation.gov locations:** Contains facility ID (e.g., `rec-10000167`)
- **Manual locations:** Usually NULL (no external ID)
- **Future:** May contain IDs from other data providers

### `external_links` Field

- Official website URLs
- ridebdr.com route pages
- USFS/BLM trail pages
- NPS park pages
- Verification sources

---

## Data Accuracy & Verification

### Coordinates
- **Primary source:** Official maps, Recreation.gov API
- **Verification:** Google Maps, satellite imagery
- **Precision:** 4-6 decimal places (±10 meters typical)

### Trail Information
- **Primary source:** Official trail maps, DNR websites
- **Verification:** Community reports, GPS tracks
- **Updates:** Ongoing as conditions change

### Permit Requirements
- **Primary source:** Official land management agency websites
- **Verification:** Recent trip reports
- **Updates:** Annual review recommended (permit rules change)

### Costs
- **Primary source:** Recreation.gov, park websites
- **Verification:** Recent visitor reports
- **Note:** Costs subject to change; verify before trip

---

## Data Limitations

### Known Gaps
1. **Limited coverage in:**
   - Great Plains states (sparse public land)
   - Some Eastern states (less off-road riding opportunities)
   - Private riding parks (not public land)

2. **Missing data:**
   - ~11% of locations missing cost_per_night
   - Some locations missing permit_info details
   - Limited user reviews/tips

3. **Temporal accuracy:**
   - Seasonal closures change
   - Costs update annually
   - Trail conditions vary year-to-year

### Data Refresh Cadence
- **Campground info:** Annual review recommended
- **Trail conditions:** User reports welcome anytime
- **Permit requirements:** Check official sources before trip
- **Costs:** Verify at time of booking

---

## Contributing New Data

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:
- Adding new locations
- Data quality standards
- Submission process
- Verification requirements

---

## Future Data Sources (Planned)

Potential additions:
- [ ] State OHV trail databases (comprehensive import)
- [ ] AllTrails API (motorcycle-friendly trails)
- [ ] Private campground databases (KOA, Harvest Hosts, etc.)
- [ ] iOverlander data (international locations)
- [ ] User-submitted GPS tracks (crowdsourced routes)

---

## Attribution & Licensing

### Government Data
- Recreation.gov data is public domain (U.S. government work)
- USFS/BLM/NPS maps and data are public domain
- State DNR data varies by state (generally public access)

### Community Data
- BDR routes: Used with reference to ridebdr.com
- TAT: Used with reference to transamtrail.com
- Forum data: Aggregated public information with citation

### TrailCamp Database
- Original compilation and curation: TrailCamp project
- Database schema and structure: MIT License (or your chosen license)
- Community contributions: As specified in CONTRIBUTING.md

---

## Contact & Corrections

Found inaccurate data? Please:
1. [Open an issue](https://github.com/yourusername/trailcamp/issues) with details
2. Include source documentation for corrections
3. Provide updated information when possible

For data source questions or partnerships:
- GitHub Issues
- Community Discord (if applicable)

---

*Last updated: 2026-02-28*  
*Maintained by the TrailCamp community*
