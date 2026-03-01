# Data Integrity Validation

## Overview
Advanced validation script that goes beyond basic data quality checks to validate business logic, relationships, and data consistency.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
node validate-integrity.js
```

## Validation Checks

### 1. Cross-Reference Validation
**Critical Level** - Data relationships must be valid

- ✅ Trip stops → Valid locations
- ✅ Trip stops → Valid trips  
- Ensures no orphaned records pointing to deleted entries

### 2. Business Logic Validation
**Warning Level** - Data should make business sense

- ✅ Riding locations have trail types OR difficulty
- ✅ Campsites with costs have sub_type
- ✅ Boondocking costs are reasonable (<$50/night)
- ℹ️ Trails with distance have difficulty ratings

### 3. Data Consistency
**Warning/Critical Level** - Values should be in valid ranges

- ✅ No negative values (distance, cost, stay limits)
- ✅ Scenery ratings between 1-10
- ✅ Stay limits <= 365 days

### 4. Required Field Combinations
**Warning Level** - Related fields should exist together

- ⚠️ Permit required → Permit info exists (18 missing)
- ℹ️ Non-boondocking campsites have water info

### 5. Advanced Duplicate Detection
**Critical/Info Level** - Find potential duplicates

- ✅ No exact duplicates (same name + coordinates)
- ℹ️ 20 near-duplicates within ~300 feet (may be legitimate)

### 6. Database Integrity
**Critical Level** - SQLite integrity checks

- ✅ Database integrity check passed
- ✅ Foreign key constraints valid

## Issue Severity Levels

| Level | Icon | Meaning | Action Required |
|-------|------|---------|----------------|
| **CRITICAL** | 🚨 | Data corruption or broken relationships | Fix immediately |
| **WARNING** | ⚠️ | Data quality issues or business logic violations | Review and fix |
| **INFO** | ℹ️ | Potential issues or recommendations | Review when convenient |
| **PASSED** | ✅ | Check passed | No action needed |

## Output Example

```
======================================================================
VALIDATION REPORT
======================================================================

Total checks: 15
Passed: 13
Info: 1
Warnings: 1
Critical: 0

──────────────────────────────────────────────────────────────────────
⚠️  WARNINGS:

⚠ Permit Information: 18 locations require permits but missing permit_info
  Check: SELECT id, name FROM locations WHERE permit_required = 1 ...

──────────────────────────────────────────────────────────────────────
ℹ️  INFORMATION:

ℹ Potential Near-Duplicates: 20 pairs of locations within ~300 feet

======================================================================

⚠️  Found 1 issues that need attention

📄 Detailed report saved to: ./integrity-validation-report.json
```

## Detailed Report JSON

The script generates `integrity-validation-report.json` with full details:

```json
{
  "critical": [],
  "warning": [
    {
      "check": "Permit Information",
      "message": "18 locations require permits but missing permit_info",
      "count": 18,
      "sql": "SELECT id, name FROM locations WHERE ..."
    }
  ],
  "info": [...],
  "passed": [...]
}
```

## Automated Checks

### Pre-Deployment
Run before deploying to production:
```bash
#!/bin/bash
# deploy.sh
cd server
if ! node validate-integrity.js; then
  echo "⚠️  Validation warnings detected. Review before deploying."
  read -p "Continue? (y/n) " -n 1 -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

### CI/CD Integration
Add to GitHub Actions or similar:
```yaml
- name: Validate Database Integrity
  run: |
    cd server
    node validate-integrity.js || true  # Don't fail on warnings
```

### Cron Schedule
Run weekly to catch issues early:
```cron
0 2 * * 0 cd /path/to/trailcamp/server && node validate-integrity.js >> logs/validation.log 2>&1
```

## Fixing Common Issues

### 18 Locations Missing Permit Info
**Issue:** Permit required flag set but no details

**Find affected locations:**
```sql
SELECT id, name, permit_required 
FROM locations 
WHERE permit_required = 1 
  AND (permit_info IS NULL OR permit_info = '');
```

**Fix:**
```sql
-- Add specific permit information
UPDATE locations 
SET permit_info = 'OHV registration required' 
WHERE id = 123;

-- Or remove permit flag if not actually required
UPDATE locations 
SET permit_required = 0 
WHERE id = 456;
```

### Near-Duplicate Locations
**Issue:** Multiple locations within ~300 feet

**Review:**
```sql
SELECT 
  l1.id, l1.name,
  l2.id, l2.name,
  ABS(l1.latitude - l2.latitude) + ABS(l1.longitude - l2.longitude) as distance
FROM locations l1
JOIN locations l2 ON l1.id < l2.id
WHERE ABS(l1.latitude - l2.latitude) < 0.001
  AND ABS(l1.longitude - l2.longitude) < 0.001
ORDER BY distance;
```

**Action:**
- If true duplicates → Delete one
- If different areas (trailheads, campgrounds) → Update names to differentiate
- If legitimate → No action needed

### Negative Values
**Issue:** Distance, cost, or stay limits are negative

**Find:**
```sql
SELECT id, name, distance_miles, cost_per_night, stay_limit_days
FROM locations
WHERE distance_miles < 0 
   OR cost_per_night < 0 
   OR stay_limit_days < 0;
```

**Fix:**
```sql
-- Fix data entry errors
UPDATE locations 
SET distance_miles = ABS(distance_miles) 
WHERE distance_miles < 0;
```

### Scenery Ratings Out of Range
**Issue:** Ratings < 1 or > 10

**Auto-fix:**
```sql
UPDATE locations 
SET scenery_rating = CASE 
  WHEN scenery_rating < 1 THEN 1 
  WHEN scenery_rating > 10 THEN 10 
END 
WHERE scenery_rating < 1 OR scenery_rating > 10;
```

### Orphaned Trip Stops
**Issue:** Trip stops point to deleted locations or trips

**Find and remove:**
```sql
-- Remove stops pointing to deleted locations
DELETE FROM trip_stops 
WHERE location_id NOT IN (SELECT id FROM locations);

-- Remove stops pointing to deleted trips
DELETE FROM trip_stops 
WHERE trip_id NOT IN (SELECT id FROM trips);
```

## Comparison to Basic Quality Check

| Check | Basic (check-data-quality.sh) | Advanced (validate-integrity.js) |
|-------|-------------------------------|----------------------------------|
| Required fields | ✅ | ✅ |
| Coordinate ranges | ✅ | ✅ |
| Data type validation | ✅ | ✅ |
| Foreign keys | ✅ | ✅ |
| **Business logic** | ❌ | ✅ |
| **Cross-validation** | ❌ | ✅ |
| **Duplicate detection** | Basic | Advanced |
| **Relationship integrity** | ❌ | ✅ |
| **Context-aware checks** | ❌ | ✅ |

**Recommendation:** Run both scripts:
- `check-data-quality.sh` - Fast basic checks daily
- `validate-integrity.js` - Comprehensive checks weekly

## Exit Codes

- `0` - All checks passed
- `1` - Warnings or info messages found

## Performance

- **Speed:** <1 second for 6,000+ locations
- **Database:** Read-only, no modifications
- **Memory:** <50MB

## Future Enhancements

Potential additions:
- [ ] Geocoding validation (state matches coordinates)
- [ ] Trail type consistency (common patterns)
- [ ] Seasonal logic validation (best_season matches region)
- [ ] Cost trends analysis (outlier detection)
- [ ] Name format consistency
- [ ] External link validation (check URLs return 200)

---

*Last updated: 2026-02-28*
*Script: validate-integrity.js*
