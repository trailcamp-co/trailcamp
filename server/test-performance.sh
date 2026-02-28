#!/bin/bash
# TrailCamp API Performance Testing
# Measures response times for common endpoints

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:3001/api"
ITERATIONS=10

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    TrailCamp API Performance Test${NC}"
echo -e "${BLUE}    Base URL: ${API_BASE}${NC}"
echo -e "${BLUE}    Iterations per endpoint: ${ITERATIONS}${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# Check if server is running
if ! curl -s "${API_BASE}/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ API server not responding at ${API_BASE}${NC}"
    echo -e "${YELLOW}Start the dev server: npm run dev${NC}\n"
    exit 1
fi

echo -e "${GREEN}✓ API server is responding${NC}\n"

# Helper function to test an endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    
    local total_time=0
    local max_time=0
    local min_time=999999
    local failed=0
    
    for i in $(seq 1 $ITERATIONS); do
        # Measure response time using time command
        start=$(date +%s%N)
        status=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")
        end=$(date +%s%N)
        
        time_ns=$((end - start))
        time_ms=$((time_ns / 1000000))
        
        if [ "${status}" != "200" ]; then
            failed=$((failed + 1))
        fi
        
        total_time=$((total_time + time_ms))
        
        if [ ${time_ms} -gt ${max_time} ]; then
            max_time=${time_ms}
        fi
        
        if [ ${time_ms} -lt ${min_time} ]; then
            min_time=${time_ms}
        fi
        
        # Small delay between requests
        sleep 0.05
    done
    
    avg_time=$((total_time / ITERATIONS))
    
    # Determine color based on performance
    local color="${GREEN}"
    if [ ${avg_time} -gt 500 ]; then
        color="${RED}"
    elif [ ${avg_time} -gt 200 ]; then
        color="${YELLOW}"
    fi
    
    # Print result
    printf "%-55s " "${name}"
    printf "${color}%5dms${NC} avg  " "${avg_time}"
    printf "(min: %5dms, max: %5dms)" "${min_time}" "${max_time}"
    
    if [ ${failed} -gt 0 ]; then
        printf "  ${RED}[%d failures]${NC}" "${failed}"
    fi
    
    printf "\n"
}

# Test endpoints
echo -e "${BLUE}━━━ Core Endpoints ━━━${NC}\n"

test_endpoint "GET /api/health" "${API_BASE}/health"
test_endpoint "GET /api/locations (all 5,597)" "${API_BASE}/locations"
test_endpoint "GET /api/locations?category=riding" "${API_BASE}/locations?category=riding"
test_endpoint "GET /api/locations?limit=50" "${API_BASE}/locations?limit=50"
test_endpoint "GET /api/locations?limit=100" "${API_BASE}/locations?limit=100"

echo -e "\n${BLUE}━━━ Trip Endpoints ━━━${NC}\n"

test_endpoint "GET /api/trips" "${API_BASE}/trips"

echo -e "\n${BLUE}━━━ Filtered Queries ━━━${NC}\n"

test_endpoint "GET /api/locations?scenery_min=8" "${API_BASE}/locations?scenery_min=8"
test_endpoint "GET /api/locations?scenery_min=9" "${API_BASE}/locations?scenery_min=9"
test_endpoint "GET /api/locations?category=campsite&sub_type=boondocking" "${API_BASE}/locations?category=campsite&sub_type=boondocking"
test_endpoint "GET /api/locations?difficulty=Hard" "${API_BASE}/locations?difficulty=Hard"
test_endpoint "GET /api/locations?best_season=Summer" "${API_BASE}/locations?best_season=Summer"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}Performance Targets${NC}\n"

echo -e "  ${GREEN}<  50ms  → Excellent${NC}"
echo -e "  ${GREEN}< 200ms  → Good${NC}"
echo -e "  ${YELLOW}< 500ms  → Acceptable${NC}"
echo -e "  ${RED}> 500ms  → Needs optimization${NC}"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
