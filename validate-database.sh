#!/bin/bash
# TrailCamp Database Validation Tests
# Run: bash validate-database.sh

DB="server/trailcamp.db"
ERRORS=0

echo "======================================"
echo "TrailCamp Database Validation Tests"
echo "======================================"
echo ""

# Test 1: Database file exists and is readable
echo "Test 1: Database file exists..."
if [ ! -f "$DB" ]; then
  echo "❌ FAIL: Database file not found"
  ERRORS=$((ERRORS+1))
else
  echo "✅ PASS: Database file exists"
fi

# Test 2: SQLite integrity check
echo ""
echo "Test 2: SQLite integrity check..."
INTEGRITY=$(sqlite3 "$DB" "PRAGMA integrity_check;")
if [ "$INTEGRITY" = "ok" ]; then
  echo "✅ PASS: Database integrity OK"
else
  echo "❌ FAIL: Database integrity check failed: $INTEGRITY"
  ERRORS=$((ERRORS+1))
fi

# Test 3: All required tables exist
echo ""
echo "Test 3: Required tables exist..."
TABLES=$(sqlite3 "$DB" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
REQUIRED="locations trips trip_stops trip_journal"
for table in $REQUIRED; do
  if echo "$TABLES" | grep -q "^$table$"; then
    echo "✅ PASS: Table '$table' exists"
  else
    echo "❌ FAIL: Table '$table' missing"
    ERRORS=$((ERRORS+1))
  fi
done

# Test 4: Locations table has data
echo ""
echo "Test 4: Locations table has data..."
COUNT=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations;")
if [ "$COUNT" -gt 0 ]; then
  echo "✅ PASS: Locations table has $COUNT records"
else
  echo "❌ FAIL: Locations table is empty"
  ERRORS=$((ERRORS+1))
fi

# Test 5: No NULL coordinates
echo ""
echo "Test 5: All locations have valid coordinates..."
NULL_COORDS=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE latitude IS NULL OR longitude IS NULL;")
if [ "$NULL_COORDS" -eq 0 ]; then
  echo "✅ PASS: All locations have coordinates"
else
  echo "❌ FAIL: $NULL_COORDS locations missing coordinates"
  ERRORS=$((ERRORS+1))
fi

# Test 6: Coordinates in valid range
echo ""
echo "Test 6: Coordinates within valid ranges..."
INVALID_COORDS=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE latitude < -90 OR latitude > 90 OR longitude < -180 OR longitude > 180;")
if [ "$INVALID_COORDS" -eq 0 ]; then
  echo "✅ PASS: All coordinates in valid range"
else
  echo "❌ FAIL: $INVALID_COORDS locations have invalid coordinates"
  ERRORS=$((ERRORS+1))
fi

# Test 7: All locations have required fields
echo ""
echo "Test 7: All locations have required fields..."
MISSING_NAME=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE name IS NULL OR name = '';")
MISSING_CATEGORY=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE category IS NULL OR category = '';")
if [ "$MISSING_NAME" -eq 0 ] && [ "$MISSING_CATEGORY" -eq 0 ]; then
  echo "✅ PASS: All locations have name and category"
else
  echo "❌ FAIL: $MISSING_NAME missing name, $MISSING_CATEGORY missing category"
  ERRORS=$((ERRORS+1))
fi

# Test 8: Category values are valid
echo ""
echo "Test 8: Category values are valid..."
INVALID_CATEGORIES=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE category NOT IN ('riding', 'campsite', 'scenic', 'dump', 'water');")
if [ "$INVALID_CATEGORIES" -eq 0 ]; then
  echo "✅ PASS: All categories are valid"
else
  echo "❌ FAIL: $INVALID_CATEGORIES locations have invalid categories"
  ERRORS=$((ERRORS+1))
fi

# Test 9: Scenery ratings in valid range
echo ""
echo "Test 9: Scenery ratings in valid range (1-10)..."
INVALID_SCENERY=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE scenery_rating IS NOT NULL AND (scenery_rating < 1 OR scenery_rating > 10);")
if [ "$INVALID_SCENERY" -eq 0 ]; then
  echo "✅ PASS: All scenery ratings are 1-10"
else
  echo "❌ FAIL: $INVALID_SCENERY locations have invalid scenery ratings"
  ERRORS=$((ERRORS+1))
fi

# Test 10: Foreign key integrity (trip_stops -> trips)
echo ""
echo "Test 10: Foreign key integrity (trip_stops -> trips)..."
ORPHANED_STOPS=$(sqlite3 "$DB" "SELECT COUNT(*) FROM trip_stops WHERE trip_id NOT IN (SELECT id FROM trips);")
if [ "$ORPHANED_STOPS" -eq 0 ]; then
  echo "✅ PASS: No orphaned trip stops"
else
  echo "❌ FAIL: $ORPHANED_STOPS orphaned trip stops found"
  ERRORS=$((ERRORS+1))
fi

# Test 11: Riding locations have trail_types
echo ""
echo "Test 11: Riding locations have trail_types..."
MISSING_TRAIL_TYPES=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE category = 'riding' AND (trail_types IS NULL OR trail_types = '');")
if [ "$MISSING_TRAIL_TYPES" -eq 0 ]; then
  echo "✅ PASS: All riding locations have trail_types"
else
  echo "⚠️  WARNING: $MISSING_TRAIL_TYPES riding locations missing trail_types"
fi

# Test 12: Featured flag is boolean
echo ""
echo "Test 12: Featured flag is boolean (0 or 1)..."
INVALID_FEATURED=$(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE featured IS NOT NULL AND featured NOT IN (0, 1);")
if [ "$INVALID_FEATURED" -eq 0 ]; then
  echo "✅ PASS: All featured values are 0 or 1"
else
  echo "❌ FAIL: $INVALID_FEATURED locations have invalid featured values"
  ERRORS=$((ERRORS+1))
fi

# Test 13: Data consistency check
echo ""
echo "Test 13: Data statistics..."
echo "  Total locations: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations;")"
echo "  Riding: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE category = 'riding';")"
echo "  Boondocking: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE sub_type = 'boondocking';")"
echo "  Campgrounds: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE sub_type = 'campground';")"
echo "  Featured: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE featured = 1;")"
echo "  With external links: $(sqlite3 "$DB" "SELECT COUNT(*) FROM locations WHERE external_links IS NOT NULL AND external_links != '';")"
echo "✅ Statistics reported"

# Summary
echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
if [ "$ERRORS" -eq 0 ]; then
  echo "✅ ALL TESTS PASSED"
  exit 0
else
  echo "❌ $ERRORS TEST(S) FAILED"
  exit 1
fi
