#!/bin/bash

# auto-tag.sh - Automated Git Release Tagging
# Tags releases with version numbers based on database migration count

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_PATH="$SCRIPT_DIR/trailcamp.db"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== TrailCamp Auto-Tagger ===${NC}"
echo

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Count migrations
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found at $MIGRATIONS_DIR${NC}"
    exit 1
fi

MIGRATION_COUNT=$(find "$MIGRATIONS_DIR" -name "*.sql" -not -name "*_down.sql" | wc -l | tr -d ' ')
VERSION="v1.$MIGRATION_COUNT"

echo "Migration count: $MIGRATION_COUNT"
echo "Proposed tag: $VERSION"
echo

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}Tag $VERSION already exists${NC}"
    echo "Existing tag info:"
    git show "$VERSION" --no-patch
    echo
    read -p "Do you want to delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$VERSION"
        echo -e "${GREEN}Deleted existing tag${NC}"
    else
        echo "Aborting."
        exit 0
    fi
fi

# Get database stats
if [ -f "$DB_PATH" ]; then
    STATS=$(sqlite3 "$DB_PATH" <<EOF
SELECT 
    (SELECT COUNT(*) FROM locations) as total_locations,
    (SELECT COUNT(*) FROM locations WHERE category = 'riding') as riding_count,
    (SELECT COUNT(*) FROM locations WHERE category = 'boondocking') as boondocking_count,
    (SELECT COALESCE(SUM(distance_miles), 0) FROM locations WHERE distance_miles IS NOT NULL) as total_miles;
EOF
)
    
    IFS='|' read -r TOTAL_LOCS RIDING_COUNT BOONDOCKING_COUNT TOTAL_MILES <<< "$STATS"
    
    # Get quality score if analyze-quality script exists
    if [ -f "$SCRIPT_DIR/analyze-quality.js" ]; then
        QUALITY_SCORE=$(node "$SCRIPT_DIR/analyze-quality.js" 2>/dev/null | grep "Quality Score:" | awk '{print $3}' || echo "N/A")
    else
        QUALITY_SCORE="N/A"
    fi
else
    echo -e "${YELLOW}Warning: Database not found, using placeholder stats${NC}"
    TOTAL_LOCS="N/A"
    RIDING_COUNT="N/A"
    BOONDOCKING_COUNT="N/A"
    TOTAL_MILES="N/A"
    QUALITY_SCORE="N/A"
fi

# Create tag message
TAG_MESSAGE="TrailCamp Release $VERSION

Database Schema Version: $MIGRATION_COUNT migrations

Statistics:
- Total Locations: $TOTAL_LOCS
- Riding Spots: $RIDING_COUNT
- Boondocking Sites: $BOONDOCKING_COUNT
- Total Trail Miles: $TOTAL_MILES
- Data Quality Score: $QUALITY_SCORE

Auto-generated tag based on migration count.
"

echo "Tag message:"
echo "----------------------------------------"
echo "$TAG_MESSAGE"
echo "----------------------------------------"
echo

read -p "Create tag $VERSION? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 0
fi

# Create annotated tag
git tag -a "$VERSION" -m "$TAG_MESSAGE"

echo -e "${GREEN}✓ Created tag $VERSION${NC}"
echo
echo "To push to remote: git push origin $VERSION"
echo "To push all tags: git push --tags"
echo
echo "View tag: git show $VERSION"
