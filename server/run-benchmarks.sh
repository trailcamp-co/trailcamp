#!/bin/bash
# Performance Benchmarking Suite for TrailCamp
# Tests common query patterns and measures execution time

set -e

DB_PATH="./trailcamp.db"
ITERATIONS=10

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Performance Benchmarks${NC}"
echo -e "${BLUE}    Database: ${DB_PATH}${NC}"
echo -e "${BLUE}    Iterations: ${ITERATIONS} per query${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Helper function to benchmark a query
benchmark_query() {
    local name="$1"
    local query="$2"
    local total_ms=0
    
    for i in $(seq 1 $ITERATIONS); do
        start=$(date +%s%N)
        sqlite3 "$DB_PATH" "$query" > /dev/null 2>&1 || true
        end=$(date +%s%N)
        
        elapsed_ns=$((end - start))
        elapsed_ms=$((elapsed_ns / 1000000))
        total_ms=$((total_ms + elapsed_ms))
    done
    
    avg_ms=$((total_ms / ITERATIONS))
    
    # Determine color based on performance
    local color="${GREEN}"
    if [ $avg_ms -gt 100 ]; then
        color="${RED}"
    elif [ $avg_ms -gt 50 ]; then
        color="${YELLOW}"
    fi
    
    printf "%-50s ${color}%5dms${NC}\n" "$name" "$avg_ms"
    
    echo "$avg_ms"
}

# Track results
declare -a times
declare -a query_names

echo -e "${BLUE}━━━ Common Query Patterns ━━━${NC}\n"

# 1. Full table scan
query_names+=("Full locations scan")
times+=($(benchmark_query "Full locations scan" "SELECT * FROM locations;"))

# 2. Count query
query_names+=("Count all locations")
times+=($(benchmark_query "Count all locations" "SELECT COUNT(*) FROM locations;"))

# 3. Category filter (indexed)
query_names+=("Filter by category (riding)")
times+=($(benchmark_query "Filter by category (riding)" "SELECT * FROM locations WHERE category = 'riding';"))

# 4. Scenery filter (indexed)
query_names+=("Filter by scenery >= 8")
times+=($(benchmark_query "Filter by scenery >= 8" "SELECT * FROM locations WHERE scenery_rating >= 8;"))

# 5. Compound filter
query_names+=("Compound filter (category + scenery)")
times+=($(benchmark_query "Compound filter (category + scenery)" "SELECT * FROM locations WHERE category = 'riding' AND scenery_rating >= 8;"))

# 6. Aggregation
query_names+=("Aggregation (avg scenery by category)")
times+=($(benchmark_query "Aggregation (avg scenery by category)" "SELECT category, AVG(scenery_rating) FROM locations GROUP BY category;"))

# 7. Join query
query_names+=("Join (trips with stops)")
times+=($(benchmark_query "Join (trips with stops)" "SELECT t.*, COUNT(ts.id) FROM trips t LEFT JOIN trip_stops ts ON t.id = ts.trip_id GROUP BY t.id;"))

# 8. Full-text search (if FTS index exists)
query_names+=("Full-text search (FTS)")
fts_time=$(benchmark_query "Full-text search (FTS)" "SELECT * FROM locations_fts WHERE locations_fts MATCH 'moab' LIMIT 50;" 2>/dev/null || echo "0")
times+=($fts_time)

# Calculate statistics
total=0
count=0
slowest_time=0
slowest_name=""
fastest_time=999999
fastest_name=""

for i in "${!times[@]}"; do
    time=${times[$i]}
    name=${query_names[$i]}
    
    # Skip if time is 0 (query failed/skipped)
    if [ "$time" -gt 0 ] 2>/dev/null; then
        total=$((total + time))
        count=$((count + 1))
        
        if [ "$time" -gt "$slowest_time" ]; then
            slowest_time=$time
            slowest_name=$name
        fi
        
        if [ "$time" -lt "$fastest_time" ]; then
            fastest_time=$time
            fastest_name=$name
        fi
    fi
done

if [ $count -gt 0 ]; then
    avg=$((total / count))
else
    avg=0
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Summary${NC}\n"

echo "Queries tested:    $count"
printf "Average time:      %dms\n" "$avg"
printf "Fastest:           %s (%dms)\n" "$fastest_name" "$fastest_time"
printf "Slowest:           %s (%dms)\n" "$slowest_name" "$slowest_time"

# Performance rating
if [ $avg -lt 10 ]; then
    echo -e "\n${GREEN}✅ Performance: EXCELLENT${NC}"
elif [ $avg -lt 50 ]; then
    echo -e "\n${GREEN}✅ Performance: GOOD${NC}"
elif [ $avg -lt 100 ]; then
    echo -e "\n${YELLOW}⚠️  Performance: ACCEPTABLE${NC}"
else
    echo -e "\n${RED}❌ Performance: NEEDS OPTIMIZATION${NC}"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Performance targets
echo -e "${BLUE}Performance Targets:${NC}"
echo -e "  ${GREEN}<  10ms  → Excellent${NC}"
echo -e "  ${GREEN}<  50ms  → Good${NC}"
echo -e "  ${YELLOW}< 100ms  → Acceptable${NC}"
echo -e "  ${RED}> 100ms  → Needs optimization${NC}"

echo ""

# Save results to file for tracking
echo "$(date +%Y-%m-%d\ %H:%M:%S),${avg},${slowest_time},${fastest_time}" >> benchmark-history.csv
