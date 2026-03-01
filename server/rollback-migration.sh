#!/bin/bash
# Rollback a database migration

set -e

DB_PATH="./trailcamp.db"
MIGRATION_NAME=$1

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

if [ -z "$MIGRATION_NAME" ]; then
    echo -e "${YELLOW}Usage: ./rollback-migration.sh <migration_name>${NC}"
    echo ""
    echo "Available migrations to rollback:"
    echo "  001_add_integrity_constraints.sql"
    echo "  002_add_timestamp_triggers.sql"
    echo "  003_add_search_index.sql"
    echo "  004_add_location_fields.sql (NOT RECOMMENDED)"
    echo ""
    exit 1
fi

echo -e "${YELLOW}Rolling back migration: ${MIGRATION_NAME}${NC}"
echo ""
echo -e "${RED}⚠️  This will modify the database schema!${NC}"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Backup first
echo -e "\n${YELLOW}Creating backup...${NC}"
./backup-database.sh

case "$MIGRATION_NAME" in
    "001_add_integrity_constraints.sql")
        echo -e "\n${YELLOW}Removing validation triggers...${NC}"
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS validate_coordinates_insert;
DROP TRIGGER IF EXISTS validate_coordinates_update;
DROP TRIGGER IF EXISTS validate_scenery_insert;
DROP TRIGGER IF EXISTS validate_scenery_update;
DROP TRIGGER IF EXISTS validate_cost_insert;
DROP TRIGGER IF EXISTS validate_cost_update;
DROP TRIGGER IF EXISTS validate_category_insert;
DROP TRIGGER IF EXISTS validate_category_update;
EOF
        echo -e "${GREEN}✓ Removed 8 validation triggers${NC}"
        ;;
        
    "002_add_timestamp_triggers.sql")
        echo -e "\n${YELLOW}Removing timestamp triggers...${NC}"
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS update_trips_timestamp;
DROP TRIGGER IF EXISTS update_locations_timestamp;
EOF
        echo -e "${GREEN}✓ Removed 2 timestamp triggers${NC}"
        ;;
        
    "003_add_search_index.sql")
        echo -e "\n${YELLOW}Removing FTS search index...${NC}"
        sqlite3 "$DB_PATH" << 'EOF'
DROP TRIGGER IF EXISTS locations_fts_insert;
DROP TRIGGER IF EXISTS locations_fts_update;
DROP TRIGGER IF EXISTS locations_fts_delete;
DROP TABLE IF EXISTS locations_fts;
EOF
        echo -e "${GREEN}✓ Removed FTS index and 3 sync triggers${NC}"
        ;;
        
    "004_add_location_fields.sql")
        echo -e "\n${RED}✗ Cannot rollback column additions in SQLite${NC}"
        echo -e "${YELLOW}Columns (state, county, country) will remain but can be ignored${NC}"
        echo ""
        echo "To clear data without removing columns:"
        echo "  sqlite3 trailcamp.db \"UPDATE locations SET state = NULL, county = NULL, country = NULL;\""
        exit 1
        ;;
        
    *)
        echo -e "\n${RED}Unknown migration: $MIGRATION_NAME${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✓ Rollback complete!${NC}"
echo ""
echo "Verify database integrity:"
echo -e "  ${YELLOW}./check-data-quality.sh${NC}"
