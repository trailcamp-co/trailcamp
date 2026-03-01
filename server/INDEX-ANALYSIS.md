# Index Analysis Report

*Generated: 2026-02-28*

## Summary

Analyzed common query patterns and added missing indexes to improve performance.

### Before Optimization
- **Full table scans:** 4 queries
- **Queries using indexes:** 3 queries

### After Optimization
- **Full table scans:** 1 query (best_season LIKE query - expected)
- **Queries using indexes:** 6 queries
- **Improvement:** 75% reduction in table scans

## Indexes Added

Migration: `005_add_performance_indexes.sql`

```sql
-- Cost range queries
CREATE INDEX idx_locations_cost ON locations(cost_per_night);

-- Permit filtering
CREATE INDEX idx_locations_permit ON locations(permit_required);

-- Water availability
CREATE INDEX idx_locations_water_avail ON locations(water_available);
CREATE INDEX idx_locations_water_nearby ON locations(water_nearby);

-- Category + difficulty composite
CREATE INDEX idx_locations_category_difficulty ON locations(category, difficulty);

-- Difficulty alone
CREATE INDEX idx_locations_difficulty ON locations(difficulty);
```

## Query Performance Improvements

### ✅ Now Using Indexes

| Query Pattern | Before | After |
|--------------|--------|-------|
| Cost range (BETWEEN) | SCAN locations | **INDEX idx_locations_cost** |
| Difficulty filter | SCAN locations | **INDEX idx_locations_category_difficulty** |
| Permit filter | SCAN locations | **INDEX idx_locations_permit** |
| Water availability | SCAN locations (partial) | **INDEX idx_locations_water_avail** |

### ✅ Already Optimized

| Query Pattern | Index Used |
|--------------|------------|
| Category + sub_type | idx_locations_category_subtype |
| State filter | idx_locations_state |
| Scenery rating | idx_locations_scenery |
| Coordinates | idx_locations_coords |

### ⚠️ Remaining Table Scans

| Query Pattern | Reason | Impact |
|--------------|--------|--------|
| best_season LIKE '%Summer%' | LIKE with wildcards can't use index | Low - infrequent query |

**Note:** LIKE queries with leading wildcards (`%value%`) cannot use B-tree indexes efficiently. For best_season, consider:
1. Using exact match: `best_season = 'Summer'` (can use existing index)
2. Using full-text search (FTS) for more complex season queries
3. Storing seasons as separate columns if critical performance issue

## Current Index Coverage

### locations Table
Total indexes: 18

**Single-column indexes:**
- category
- sub_type
- scenery_rating
- best_season
- featured
- state
- county  
- country
- source
- cost_per_night (new)
- permit_required (new)
- water_available (new)
- water_nearby (new)
- difficulty (new)

**Composite indexes:**
- (category, sub_type)
- (latitude, longitude)
- (source, source_id)
- (category, difficulty) (new)

**Full-text search:**
- locations_fts (name, description, notes, trail_types)

### Other Tables
- trip_stops: idx_trip_stops_trip (trip_id)

## Index Overhead

### Storage Impact
- Each index adds ~2-5% to database size
- 6 new indexes: estimated +15-20% size increase
- **Before:** 9.9MB
- **After:** ~11.5MB (estimated)

### Write Performance
- Indexes slow down INSERT/UPDATE slightly
- Impact: minimal (batch imports only)
- Benefit: dramatically faster SELECT queries

## Recommendations

### ✅ Completed
- [x] Add cost_per_night index
- [x] Add permit_required index
- [x] Add water availability indexes
- [x] Add category + difficulty composite
- [x] Add difficulty index

### Future Considerations

1. **Monitor query patterns** - If new slow queries emerge, add indexes
2. **best_season optimization** - If LIKE queries become a bottleneck:
   - Parse seasons into separate boolean columns
   - Or use FTS for season text search
3. **Composite index tuning** - Monitor if category+difficulty is used effectively
4. **Index maintenance** - Run ANALYZE periodically to update statistics

## Testing

### Before Indexes
```bash
# Cost range query
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE cost_per_night BETWEEN 0 AND 20;
# Result: SCAN locations
```

### After Indexes
```bash
# Cost range query
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE cost_per_night BETWEEN 0 AND 20;
# Result: SEARCH locations USING INDEX idx_locations_cost
```

### Performance Test Results
Run `./test-performance.sh` to verify improvements.

Expected improvements:
- Cost filter queries: 80-90% faster
- Difficulty filter: 70-80% faster
- Permit filter: 85-95% faster

## Maintenance

### Regular Maintenance
```bash
# Update index statistics (run weekly)
sqlite3 trailcamp.db "ANALYZE;"

# Check index usage
./analyze-missing-indexes.sh

# Verify no regressions
./test-performance.sh
```

### If Performance Degrades
1. Run ANALYZE to update statistics
2. Check for new slow queries
3. Add indexes as needed
4. Consider VACUUM if database is fragmented

---

*Analysis tool: analyze-missing-indexes.sh*
*Migration: 005_add_performance_indexes.sql*
