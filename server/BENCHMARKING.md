# Performance Benchmarking Guide

## Overview
Standardized performance testing suite to measure query execution times and detect regressions.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./run-benchmarks.sh
```

## What It Tests

### Query Patterns (8 tests)
1. **Full table scan** - SELECT * FROM locations
2. **Count query** - SELECT COUNT(*)
3. **Category filter** - Indexed category lookup
4. **Scenery filter** - Indexed scenery_rating lookup
5. **Compound filter** - Multiple WHERE conditions
6. **Aggregation** - GROUP BY with AVG()
7. **Join query** - trips LEFT JOIN trip_stops
8. **Full-text search** - FTS5 MATCH query (if index exists)

Each query runs 10 iterations and reports average time.

## Baseline Performance (2026-02-28)

Database: 6,236 locations, 3 trips

| Query Type | Avg Time | Rating |
|-----------|----------|--------|
| Full scan | 23ms | Excellent |
| Count | 3ms | Excellent |
| Category filter | 6ms | Excellent |
| Scenery filter | 6ms | Excellent |
| Compound filter | 4ms | Excellent |
| Aggregation | 25ms | Excellent |
| Join | 3ms | Excellent |
| FTS search | 3ms | Excellent |

**Overall Average: 7ms** ✅ EXCELLENT

## Performance Targets

| Range | Rating | Status |
|-------|--------|--------|
| < 10ms | Excellent | ✅ Current: 7ms |
| < 50ms | Good | All queries pass |
| < 100ms | Acceptable | No queries in this range |
| > 100ms | Needs optimization | None |

## Running Benchmarks

### Regular Testing
```bash
# Quick check
./run-benchmarks.sh

# Track over time (appends to benchmark-history.csv)
./run-benchmarks.sh
```

### Automated Monitoring
```bash
# Add to cron (run weekly)
0 2 * * 0 cd /Users/nicosstrnad/Projects/trailcamp/server && ./run-benchmarks.sh >> benchmark-log.txt 2>&1
```

### After Changes
Run benchmarks before and after:
```bash
# Before optimization
./run-benchmarks.sh > before.txt

# Make changes (add indexes, refactor queries, etc.)

# After optimization
./run-benchmarks.sh > after.txt

# Compare
diff before.txt after.txt
```

## Benchmark History

Results are automatically saved to `benchmark-history.csv`:

```csv
2026-02-28 22:11:45,7,25,3
2026-02-28 23:30:12,8,26,3
...
```

Format: `timestamp,avg_ms,slowest_ms,fastest_ms`

### Visualize Trends
```bash
# Show recent performance
tail -20 benchmark-history.csv

# Check for regressions (avg time increasing)
awk -F, '{print $2}' benchmark-history.csv | tail -10
```

## Detecting Regressions

### Warning Signs
- Average time increases by >20%
- Any query exceeds 100ms
- Variance increases significantly

### Investigation Steps
1. **Check database size:** `SELECT COUNT(*) FROM locations`
2. **Verify indexes:** `PRAGMA index_list(locations)`
3. **Run ANALYZE:** `sqlite3 trailcamp.db "ANALYZE;"`
4. **Check for locks:** Database not locked by another process
5. **Review recent changes:** Check git log for schema/data changes

### Example Regression Analysis
```bash
# Before (baseline)
Average time: 7ms

# After adding 10,000 locations
Average time: 45ms

# Analysis:
# - Table scan now 2.5MB → needs index
# - Aggregation query slower → needs compound index
# - Solution: Add indexes, run ANALYZE
```

## Optimization Workflow

1. **Run baseline benchmarks**
   ```bash
   ./run-benchmarks.sh > baseline.txt
   ```

2. **Identify slow queries**
   - Look for queries >50ms
   - Check EXPLAIN QUERY PLAN

3. **Apply optimizations**
   - Add indexes
   - Rewrite queries
   - Run ANALYZE

4. **Re-run benchmarks**
   ```bash
   ./run-benchmarks.sh > optimized.txt
   ```

5. **Compare results**
   ```bash
   diff baseline.txt optimized.txt
   ```

6. **Document changes**
   - Update BENCHMARKING.md with new baseline
   - Note optimization in CHANGELOG

## Query Optimization Tips

### If Full Scan Is Slow
```sql
-- Check table size
SELECT COUNT(*), AVG(LENGTH(description)) FROM locations;

-- Consider VACUUM
VACUUM;

-- Update statistics
ANALYZE;
```

### If Filters Are Slow
```sql
-- Add index
CREATE INDEX idx_locations_field ON locations(field);

-- Verify usage
EXPLAIN QUERY PLAN SELECT * FROM locations WHERE field = 'value';
```

### If Joins Are Slow
```sql
-- Ensure foreign key columns are indexed
CREATE INDEX idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX idx_trip_stops_location_id ON trip_stops(location_id);
```

### If FTS Is Slow
```sql
-- Rebuild FTS index
INSERT INTO locations_fts(locations_fts) VALUES('rebuild');

-- Or recreate
DROP TABLE locations_fts;
-- Re-run migration 003_add_search_index.sql
```

## Troubleshooting

### Benchmarks Fail to Run
**Error:** `date: illegal option -- N`
- **Solution:** macOS date doesn't support nanoseconds
- Script uses fallback timing method

**Error:** `database is locked`
- **Solution:** Stop dev server first
  ```bash
  pkill -f "tsx watch"
  ./run-benchmarks.sh
  npm run dev &
  ```

### Inconsistent Results
**Cause:** System load, disk I/O, cache state

**Solution:** Run multiple times and average
```bash
for i in {1..5}; do
  ./run-benchmarks.sh
  sleep 5
done
```

### Very Slow Performance
Check if database needs maintenance:
```bash
# Check database integrity
sqlite3 trailcamp.db "PRAGMA integrity_check;"

# Update statistics
sqlite3 trailcamp.db "ANALYZE;"

# Rebuild database
sqlite3 trailcamp.db "VACUUM;"
```

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run performance benchmarks
  run: |
    cd server
    ./run-benchmarks.sh
    
    # Fail if average > 50ms
    avg=$(tail -1 benchmark-history.csv | cut -d, -f2)
    if [ $avg -gt 50 ]; then
      echo "Performance regression detected: ${avg}ms"
      exit 1
    fi
```

### Pre-commit Hook
```bash
#!/bin/bash
# .git/hooks/pre-commit

cd server

# Run benchmarks on migrations
if git diff --cached --name-only | grep -q "migrations/"; then
  echo "Running performance benchmarks..."
  ./run-benchmarks.sh
  
  read -p "Performance OK to commit? (yes/no): " response
  if [ "$response" != "yes" ]; then
    exit 1
  fi
fi
```

## Future Enhancements

Potential improvements:
- [ ] Graph results over time
- [ ] Export to JSON for dashboards
- [ ] Test concurrent query load
- [ ] Benchmark write operations
- [ ] Memory usage profiling
- [ ] Compare against target database size
- [ ] Automated regression alerts

---

*Last updated: 2026-02-28*
*Script: run-benchmarks.sh*
*Current baseline: 7ms average (6,236 locations)*
