# Missing Indexes Analysis Report

*Generated: 2026-03-01*

## Summary

- **Total queries analyzed:** 16
- **Optimized (using indexes):** 10
- **Needs optimization (table scans):** 5
- **Errors/Not applicable:** 0
- **Recommendations:** 4 new indexes suggested

---

## Query Performance Analysis

### ✅ Optimized Queries (10)

These queries are already using indexes efficiently:


**Filter by category**
```sql
SELECT * FROM locations WHERE category = ?
```
Plan: SEARCH locations USING INDEX idx_locations_category_subtype (category=?)

**Filter by sub_type**
```sql
SELECT * FROM locations WHERE sub_type = ?
```
Plan: SEARCH locations USING INDEX idx_locations_sub_type (sub_type=?)

**Filter by best_season**
```sql
SELECT * FROM locations WHERE best_season = ?
```
Plan: SEARCH locations USING INDEX idx_locations_season (best_season=?)

**Filter by scenery rating**
```sql
SELECT * FROM locations WHERE scenery_rating >= ?
```
Plan: SEARCH locations USING INDEX idx_locations_scenery (scenery_rating>?)

**Filter by featured**
```sql
SELECT * FROM locations WHERE featured = ?
```
Plan: SEARCH locations USING INDEX idx_locations_featured (featured=?)

**Filter by state**
```sql
SELECT * FROM locations WHERE state = ?
```
Plan: SEARCH locations USING INDEX idx_locations_state (state=?)

**Compound: category + sub_type**
```sql
SELECT * FROM locations WHERE category = ? AND sub_type = ?
```
Plan: SEARCH locations USING INDEX idx_locations_category_subtype (category=? AND sub_type=?)

**Compound: category + difficulty**
```sql
SELECT * FROM locations WHERE category = ? AND difficulty = ?
```
Plan: SEARCH locations USING INDEX idx_locations_category_subtype (category=?)

**Compound: category + state**
```sql
SELECT * FROM locations WHERE category = ? AND state = ?
```
Plan: SEARCH locations USING INDEX idx_locations_state (state=?)

**Order by scenery rating DESC**
```sql
SELECT * FROM locations ORDER BY scenery_rating DESC LIMIT 50
```
Plan: SCAN locations USING INDEX idx_locations_scenery

---

### ⚠️ Queries Needing Optimization (5)

These queries perform table scans and could benefit from indexes:


**Filter by difficulty**
```sql
SELECT * FROM locations WHERE difficulty = ?
```
Plan: SCAN locations
**Issue:** Full table scan - no index used

**Filter by permit_required**
```sql
SELECT * FROM locations WHERE permit_required = ?
```
Plan: SCAN locations
**Issue:** Full table scan - no index used

**Order by name ASC**
```sql
SELECT * FROM locations ORDER BY name ASC LIMIT 50
```
Plan: SCAN locations | USE TEMP B-TREE FOR ORDER BY
**Issue:** Full table scan - no index used

**Trip stops by trip_id**
```sql
SELECT * FROM trip_stops WHERE trip_id = ?
```
Plan: SCAN trip_stops
**Issue:** Full table scan - no index used

**Trip stops by location_id**
```sql
SELECT * FROM trip_stops WHERE location_id = ?
```
Plan: SCAN trip_stops
**Issue:** Full table scan - no index used

---

## Recommended Indexes

### Priority: MEDIUM

These indexes would improve query performance for common use cases:


**locations.permit_required**
- Reason: Users filter by permit requirements
- SQL:
  ```sql
  CREATE INDEX idx_locations_permit_required ON locations(permit_required);
  ```

**locations.water_available**
- Reason: Water availability is a key filter for camping
- SQL:
  ```sql
  CREATE INDEX idx_locations_water_available ON locations(water_available);
  ```

**locations.cost_per_night**
- Reason: Cost filtering for budget planning
- SQL:
  ```sql
  CREATE INDEX idx_locations_cost_per_night ON locations(cost_per_night);
  ```

**locations.distance_miles**
- Reason: Sorting/filtering by trail length
- SQL:
  ```sql
  CREATE INDEX idx_locations_distance_miles ON locations(distance_miles);
  ```

### Apply All Recommended Indexes

```sql
CREATE INDEX idx_locations_permit_required ON locations(permit_required);
CREATE INDEX idx_locations_water_available ON locations(water_available);
CREATE INDEX idx_locations_cost_per_night ON locations(cost_per_night);
CREATE INDEX idx_locations_distance_miles ON locations(distance_miles);
```

---

## Index Maintenance Tips

1. **Run ANALYZE regularly** - Updates query planner statistics
   ```sql
   ANALYZE;
   ```

2. **Monitor query performance** - Use EXPLAIN QUERY PLAN for slow queries
3. **Avoid over-indexing** - Too many indexes slow down INSERTs/UPDATEs
4. **Compound indexes** - Consider multi-column indexes for common filter combinations
5. **Index selectivity** - Indexes work best on columns with high cardinality

---

## Current Index Coverage

**Locations table:** 11 indexes
**Trip_stops table:** 1 indexes
**Trips table:** 0 indexes

### All Existing Indexes

- `idx_locations_category` on `locations`
- `idx_locations_category_subtype` on `locations`
- `idx_locations_coords` on `locations`
- `idx_locations_country` on `locations`
- `idx_locations_county` on `locations`
- `idx_locations_featured` on `locations`
- `idx_locations_scenery` on `locations`
- `idx_locations_season` on `locations`
- `idx_locations_source` on `locations`
- `idx_locations_state` on `locations`
- `idx_locations_sub_type` on `locations`
- `idx_trip_stops_trip` on `trip_stops`

---

*Report generated by analyze-missing-indexes.js*
