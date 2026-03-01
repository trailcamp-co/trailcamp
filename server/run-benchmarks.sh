#!/bin/bash
# Performance Benchmarking Suite for TrailCamp
# Runs standardized performance tests

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

DB_PATH="./trailcamp.db"
RESULTS_DIR="./benchmark-results"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p "${RESULTS_DIR}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp Performance Benchmarks${NC}"
echo -e "${BLUE}    ${TIMESTAMP}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Helper: Time a SQL query
benchmark_query() {
    local name="$1"
    local query="$2"
    local iterations="${3:-10}"
    
    local total_ms=0
    local min_ms=999999
    local max_ms=0
    
    for i in $(seq 1 $iterations); do
        start=$(date +%s%N)
        sqlite3 "${DB_PATH}" "${query}" > /dev/null 2>&1
        end=$(date +%s%N)
        
        elapsed_ns=$((end - start))
        elapsed_ms=$((elapsed_ns / 1000000))
        
        total_ms=$((total_ms + elapsed_ms))
        
        if [ ${elapsed_ms} -lt ${min_ms} ]; then
            min_ms=${elapsed_ms}
        fi
        
        if [ ${elapsed_ms} -gt ${max_ms} ]; then
            max_ms=${elapsed_ms}
        fi
    done
    
    avg_ms=$((total_ms / iterations))
    
    echo "${avg_ms},${min_ms},${max_ms}"
}

# Get database info
echo -e "${BLUE}━━━ Database Info ━━━${NC}\n"

DB_SIZE=$(du -h "${DB_PATH}" | cut -f1)
echo -e "Database size: ${DB_SIZE}"

TOTAL_LOCATIONS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM locations")
echo -e "Total locations: ${TOTAL_LOCATIONS}"

TOTAL_TRIPS=$(sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM trips")
echo -e "Total trips: ${TOTAL_TRIPS}"

echo ""

# Run benchmarks
echo -e "${BLUE}━━━ Running Query Benchmarks ━━━${NC}\n"

# Store results in parallel arrays
query_names=()
query_results=()

# 1. Full table scan
echo -n "1. Full table scan... "
result=$(benchmark_query "full_scan" "SELECT * FROM locations")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Full table scan")
query_results+=("${result}")

# 2. Count query
echo -n "2. Count all locations... "
result=$(benchmark_query "count_all" "SELECT COUNT(*) FROM locations")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Count all")
query_results+=("${result}")

# 3. Index lookup (category)
echo -n "3. Filter by category (riding)... "
result=$(benchmark_query "filter_category" "SELECT * FROM locations WHERE category = 'riding'")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Filter by category")
query_results+=("${result}")

# 4. Range query (scenery)
echo -n "4. Scenery >= 8... "
result=$(benchmark_query "filter_scenery" "SELECT * FROM locations WHERE scenery_rating >= 8")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Filter by scenery")
query_results+=("${result}")

# 5. Compound filter
echo -n "5. Compound filter (category + scenery)... "
result=$(benchmark_query "compound_filter" "SELECT * FROM locations WHERE category = 'riding' AND scenery_rating >= 8")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Compound filter")
query_results+=("${result}")

# 6. Aggregation
echo -n "6. Aggregate (AVG scenery by category)... "
result=$(benchmark_query "aggregate" "SELECT category, AVG(scenery_rating) FROM locations GROUP BY category")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Aggregation")
query_results+=("${result}")

# 7. Join query
echo -n "7. Join (trips + stops)... "
result=$(benchmark_query "join_query" "SELECT t.name, ts.* FROM trips t LEFT JOIN trip_stops ts ON t.id = ts.trip_id LIMIT 100")
avg=$(echo "${result}" | cut -d',' -f1)
echo -e "${avg}ms"
query_names+=("Join query")
query_results+=("${result}")

# 8. FTS search (if exists)
if sqlite3 "${DB_PATH}" "SELECT name FROM sqlite_master WHERE type='table' AND name='locations_fts'" | grep -q "locations_fts"; then
    echo -n "8. Full-text search (moab)... "
    result=$(benchmark_query "fts_search" "SELECT * FROM locations_fts WHERE locations_fts MATCH 'moab'" 5)
    avg=$(echo "${result}" | cut -d',' -f1)
    echo -e "${avg}ms"
    query_names+=("Full-text search")
    query_results+=("${result}")
fi

# Performance ratings
rate_performance() {
    local ms=$1
    
    if [ ${ms} -lt 50 ]; then
        echo "Excellent"
    elif [ ${ms} -lt 200 ]; then
        echo "Good"
    elif [ ${ms} -lt 500 ]; then
        echo "Acceptable"
    else
        echo "Needs optimization"
    fi
}

# Summary
echo -e "\n${BLUE}━━━ Performance Summary ━━━${NC}\n"

echo -e "Query Performance Ratings:\n"

total_avg=0
count=${#query_results[@]}

for i in $(seq 0 $((count - 1))); do
    name="${query_names[$i]}"
    result="${query_results[$i]}"
    avg=$(echo "${result}" | cut -d',' -f1)
    min=$(echo "${result}" | cut -d',' -f2)
    max=$(echo "${result}" | cut -d',' -f3)
    rating=$(rate_performance ${avg})
    
    total_avg=$((total_avg + avg))
    
    printf "%-30s %6sms  (min: %4sms, max: %5sms)  " "${name}" "${avg}" "${min}" "${max}"
    
    if [ "${rating}" = "Excellent" ]; then
        echo -e "${GREEN}${rating}${NC}"
    elif [ "${rating}" = "Good" ]; then
        echo -e "${GREEN}${rating}${NC}"
    elif [ "${rating}" = "Acceptable" ]; then
        echo -e "${YELLOW}${rating}${NC}"
    else
        echo -e "${RED}${rating}${NC}"
    fi
done

# Overall assessment
overall_avg=$((total_avg / count))

echo -e "\n${BLUE}Overall Assessment:${NC}\n"

if [ ${overall_avg} -lt 100 ]; then
    echo -e "${GREEN}✅ Database performance is EXCELLENT${NC}"
    echo -e "Average query time: ${overall_avg}ms"
elif [ ${overall_avg} -lt 250 ]; then
    echo -e "${GREEN}✓ Database performance is GOOD${NC}"
    echo -e "Average query time: ${overall_avg}ms"
else
    echo -e "${YELLOW}⚠️  Database performance could be improved${NC}"
    echo -e "Average query time: ${overall_avg}ms"
fi

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Benchmark Complete${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Performance targets
echo -e "${BLUE}Performance Targets:${NC}"
echo -e "  <  50ms  → ${GREEN}Excellent${NC}"
echo -e "  < 200ms  → ${GREEN}Good${NC}"
echo -e "  < 500ms  → ${YELLOW}Acceptable${NC}"
echo -e "  > 500ms  → ${RED}Needs optimization${NC}\n"
