# Performance Benchmarking Guide

## Overview
The benchmarking suite provides standardized performance tests for TrailCamp's database queries to track performance over time and detect regressions.

## Quick Start

```bash
cd /Users/nicosstrnad/Projects/trailcamp/server
./run-benchmarks.sh
```

## What Gets Tested

### Database Queries (10 iterations each)
1. **Full table scan** - SELECT * FROM locations
2. **Count all** - COUNT(*) query
3. **Filter by category** - Index lookup on category field
4. **Filter by scenery** - Range query on scenery_rating
5. **Compound filter** - Multiple WHERE conditions
6. **Aggregation** - GROUP BY with AVG
7. **Join query** - trips + trip_stops JOIN
8. **Full-text search** - FTS5 MATCH query (if FTS index exists)

Each test measures:
- **Average** response time (ms)
- **Min** response time (ms)
- **Max** response time (ms)

## Performance Ratings

| Response Time | Rating | Status |
|--------------|--------|--------|
| < 50ms | ✅ Excellent | Optimal performance |
| < 200ms | ✅ Good | Acceptable performance |
| < 500ms | ⚠️ Acceptable | Consider optimization |
| > 500ms | ❌ Needs optimization | Action required |

## Example Output

```
═══════════════════════════════════════════════════════
    TrailCamp Performance Benchmarks
    2026-02-28_21-32-41
═══════════════════════════════════════════════════════

━━━ Database Info ━━━

Database size: 9.9M
Total locations: 6148
Total trips: 1

━━━ Running Query Benchmarks ━━━

1. Full table scan... 23ms
2. Count all locations... 3ms
3. Filter by category (riding)... 8ms
4. Scenery >= 8... 5ms
5. Compound filter (category + scenery)... 5ms
6. Aggregate (AVG scenery by category)... 5ms
7. Join (trips + stops)... 3ms
8. Full-text search (moab)... 3ms

━━━ Performance Summary ━━━

Query Performance Ratings:

Full table scan                    23ms  (min:   21ms, max:    34ms)  Excellent
Count all                           3ms  (min:    3ms, max:     4ms)  Excellent
Filter by category                  8ms  (min:    8ms, max:     9ms)  Excellent
Filter by scenery                   5ms  (min:    5ms, max:     6ms)  Excellent
Compound filter                     5ms  (min:    5ms, max:     5ms)  Excellent
Aggregation                         5ms  (min:    5ms, max:     5ms)  Excellent
Join query                          3ms  (min:    3ms, max:     4ms)  Excellent
Full-text search                    3ms  (min:    3ms, max:     4ms)  Excellent

Overall Assessment:

✅ Database performance is EXCELLENT
Average query time: 6ms
```

## When to Run Benchmarks

### Regular Testing
- **After schema changes** - Ensure migrations don't degrade performance
- **After adding indexes** - Verify index improves query speed
- **Before production deployment** - Baseline current performance
- **Monthly** - Track performance trends over time

### Regression Detection
Run benchmarks before and after major changes:
```bash
# Before change
./run-benchmarks.sh > before.txt

# Make changes (add index, migrate schema, etc.)

# After change
./run-benchmarks.sh > after.txt

# Compare
diff before.txt after.txt
```

### Continuous Integration
Add to CI/CD pipeline:
```yaml
# .github/workflows/benchmark.yml
- name: Run benchmarks
  run: |
    cd server
    ./run-benchmarks.sh
    # Fail if average > 100ms
```

## Interpreting Results

### Excellent Performance (Current State)
All queries < 50ms indicates:
- ✅ Proper indexes in place
- ✅ Efficient query design
- ✅ Database size manageable
- ✅ No optimization needed

### Good Performance
Queries 50-200ms indicates:
- ✅ Generally acceptable
- Consider optimization for heavily-used queries
- Monitor as data grows

### Needs Optimization
Queries > 500ms indicates:
- ❌ Missing indexes
- ❌ Inefficient query design
- ❌ Database needs VACUUM
- ❌ Too much data for current approach

## Common Performance Issues

### Slow Full Table Scan
**Symptom:** Full table scan > 100ms

**Solutions:**
- VACUUM database to defragment
- Increase iterations to reduce cold-start bias
- Check disk I/O performance

### Slow Filtered Queries
**Symptom:** Filter queries > 50ms despite indexes

**Solutions:**
```sql
-- Verify index exists
SELECT name FROM sqlite_master WHERE type='index';

-- Add missing index
CREATE INDEX idx_locations_field ON locations(field);

-- Update statistics
ANALYZE;
```

### Slow Aggregations
**Symptom:** GROUP BY queries > 200ms

**Solutions:**
- Index the GROUP BY column
- Consider materialized views for complex aggregations
- Pre-calculate common aggregations

### Slow Joins
**Symptom:** JOIN queries > 100ms

**Solutions:**
- Index foreign key columns
- Limit JOIN result size
- Ensure JOIN conditions are indexed

## Baseline Performance (2026-02-28)

**Environment:**
- Mac mini (Apple Silicon)
- Database: 9.9MB, 6,148 locations
- SQLite version: 3.43.2

**Results:**
- Average query time: **6ms**
- All queries: **< 50ms** (Excellent)
- Slowest query: Full table scan (23ms)
- Fastest queries: Count, Join, FTS (3ms)

### Performance by Query Type
| Query Type | Avg Time | Rating |
|-----------|----------|--------|
| Full table scan | 23ms | ✅ Excellent |
| Count | 3ms | ✅ Excellent |
| Single-column filter | 8ms | ✅ Excellent |
| Range filter | 5ms | ✅ Excellent |
| Compound filter | 5ms | ✅ Excellent |
| Aggregation | 5ms | ✅ Excellent |
| Join | 3ms | ✅ Excellent |
| Full-text search | 3ms | ✅ Excellent |

## Automation

### Cron Job (Weekly)
```cron
# Run benchmarks every Sunday at 3 AM
0 3 * * 0 cd /path/to/trailcamp/server && ./run-benchmarks.sh >> logs/benchmarks.log 2>&1
```

### Store Historical Data
```bash
# Save results with timestamp
./run-benchmarks.sh | tee "benchmark-results/$(date +%Y-%m-%d).txt"
```

### Alert on Regression
```bash
#!/bin/bash
# alert-on-regression.sh

THRESHOLD=50  # Alert if average > 50ms

./run-benchmarks.sh > /tmp/benchmark-output.txt
avg=$(grep "Average query time:" /tmp/benchmark-output.txt | awk '{print $4}' | tr -d 'ms')

if [ ${avg} -gt ${THRESHOLD} ]; then
  echo "⚠️ Performance regression detected: ${avg}ms average (threshold: ${THRESHOLD}ms)"
  # Send alert (email, Slack, etc.)
fi
```

## Optimization Workflow

1. **Baseline** - Run benchmarks on current state
2. **Identify** - Find slow queries (> 200ms)
3. **Analyze** - Use EXPLAIN QUERY PLAN
4. **Optimize** - Add indexes, rewrite queries
5. **Verify** - Run benchmarks again
6. **Compare** - Confirm improvement

### Example Optimization
```bash
# 1. Baseline
./run-benchmarks.sh > before-optimization.txt

# 2. Identify slow query
# "Filter by difficulty: 450ms"

# 3. Check for index
sqlite3 trailcamp.db "EXPLAIN QUERY PLAN SELECT * FROM locations WHERE difficulty = 'Hard'"

# 4. Add index
sqlite3 trailcamp.db "CREATE INDEX idx_locations_difficulty ON locations(difficulty)"

# 5. Re-run benchmarks
./run-benchmarks.sh > after-optimization.txt

# 6. Compare
diff before-optimization.txt after-optimization.txt
# Filter by difficulty: 450ms → 8ms ✅
```

## Future Enhancements

Potential improvements:
- [ ] Concurrent query testing (multiple users)
- [ ] Write operation benchmarks (INSERT, UPDATE, DELETE)
- [ ] API endpoint benchmarks (HTTP response times)
- [ ] Load testing (1000+ concurrent requests)
- [ ] Memory usage profiling
- [ ] Export results to JSON for graphing
- [ ] Automated regression alerts
- [ ] Performance dashboard integration

---

*Last updated: 2026-02-28*
*Script: run-benchmarks.sh*
