#!/bin/bash

# setup.sh - TrailCamp Development Environment Setup
# One-command setup for new contributors

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   TrailCamp Development Setup             ║"
echo "║   Motorcycle Trip Planning App            ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo -e "${RED}Error: This doesn't appear to be the TrailCamp project root${NC}"
    echo "Expected structure: client/, server/, package.json"
    exit 1
fi

echo -e "${GREEN}✓ Project structure validated${NC}"
echo

# Step 1: Check dependencies
echo -e "${BLUE}Step 1: Checking dependencies...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    echo "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✓ npm $NPM_VERSION${NC}"

# Check SQLite3
if ! command -v sqlite3 &> /dev/null; then
    echo -e "${YELLOW}⚠ sqlite3 CLI not found (optional for manual DB inspection)${NC}"
    echo "Install: brew install sqlite (macOS) | apt install sqlite3 (Linux)"
else
    SQLITE_VERSION=$(sqlite3 --version | awk '{print $1}')
    echo -e "${GREEN}✓ sqlite3 $SQLITE_VERSION${NC}"
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}✗ git not found${NC}"
    echo "Please install git from https://git-scm.com/"
    exit 1
fi
GIT_VERSION=$(git --version | awk '{print $3}')
echo -e "${GREEN}✓ git $GIT_VERSION${NC}"

echo

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"

# Root dependencies
if [ -f "package.json" ]; then
    echo "Installing root dependencies..."
    npm install
    echo -e "${GREEN}✓ Root dependencies installed${NC}"
fi

# Client dependencies
if [ -d "client" ] && [ -f "client/package.json" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
    echo -e "${GREEN}✓ Client dependencies installed${NC}"
fi

# Server dependencies
if [ -d "server" ] && [ -f "server/package.json" ]; then
    echo "Installing server dependencies..."
    cd server
    npm install
    cd ..
    echo -e "${GREEN}✓ Server dependencies installed${NC}"
fi

echo

# Step 3: Database setup
echo -e "${BLUE}Step 3: Setting up database...${NC}"

DB_PATH="$SCRIPT_DIR/server/trailcamp.db"
MIGRATIONS_DIR="$SCRIPT_DIR/server/migrations"

if [ -f "$DB_PATH" ]; then
    echo -e "${YELLOW}Database already exists: $DB_PATH${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm "$DB_PATH"
        echo -e "${GREEN}✓ Old database removed${NC}"
    else
        echo "Keeping existing database."
    fi
fi

# Run migrations if database doesn't exist or was just deleted
if [ ! -f "$DB_PATH" ]; then
    echo "Creating database and running migrations..."
    
    # Create database file
    sqlite3 "$DB_PATH" "SELECT 1;" > /dev/null 2>&1
    
    # Run migrations
    if [ -d "$MIGRATIONS_DIR" ]; then
        MIGRATION_COUNT=0
        for migration in "$MIGRATIONS_DIR"/*.sql; do
            # Skip down migrations
            if [[ "$migration" == *"_down.sql" ]]; then
                continue
            fi
            
            if [ -f "$migration" ]; then
                echo "  Running $(basename "$migration")..."
                sqlite3 "$DB_PATH" < "$migration"
                ((MIGRATION_COUNT++))
            fi
        done
        echo -e "${GREEN}✓ Ran $MIGRATION_COUNT migrations${NC}"
    else
        echo -e "${YELLOW}⚠ Migrations directory not found${NC}"
    fi
else
    echo -e "${GREEN}✓ Using existing database${NC}"
fi

# Get current row count
if [ -f "$DB_PATH" ]; then
    LOCATION_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM locations;" 2>/dev/null || echo "0")
    echo "Current location count: $LOCATION_COUNT"
fi

echo

# Step 4: Environment configuration
echo -e "${BLUE}Step 4: Checking environment configuration...${NC}"

ENV_FILE="$SCRIPT_DIR/server/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env template..."
    cat > "$ENV_FILE" << 'EOF'
# TrailCamp Server Configuration

# Database
DATABASE_PATH=./trailcamp.db

# Server
PORT=3001
NODE_ENV=development

# Optional: Mapbox (for directions/routing)
# MAPBOX_TOKEN=your_token_here

# Optional: Analytics
# ENABLE_USAGE_TRACKING=true
EOF
    echo -e "${GREEN}✓ Created server/.env${NC}"
    echo -e "${YELLOW}ℹ Edit server/.env to add optional API keys${NC}"
else
    echo -e "${GREEN}✓ Environment file exists${NC}"
fi

echo

# Step 5: Verify installation
echo -e "${BLUE}Step 5: Verifying installation...${NC}"

# Check if server starts (quick test)
echo "Testing server startup..."
cd server
timeout 3 npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓ Server starts successfully${NC}"
    kill $SERVER_PID 2>/dev/null || true
else
    echo -e "${YELLOW}⚠ Server test inconclusive (may need manual check)${NC}"
fi

cd ..

echo

# Success summary
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║   ✓ Setup Complete!                       ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo
echo -e "${BLUE}Next steps:${NC}"
echo
echo "1. Start the development servers:"
echo "   ${YELLOW}npm run dev${NC}"
echo
echo "2. Open your browser:"
echo "   Frontend: ${YELLOW}http://localhost:5173${NC}"
echo "   Backend:  ${YELLOW}http://localhost:3001${NC}"
echo
echo "3. Read the documentation:"
echo "   - README.md (project overview)"
echo "   - CONTRIBUTING.md (contribution guide)"
echo "   - server/API.md (API documentation)"
echo "   - server/DATABASE-SCHEMA.md (database reference)"
echo
echo -e "${BLUE}Useful commands:${NC}"
echo "  npm run dev           - Start dev servers"
echo "  npm run build         - Build for production"
echo "  npm run preview       - Preview production build"
echo
echo "Database location: ${YELLOW}$DB_PATH${NC}"
echo "Locations in database: ${YELLOW}$LOCATION_COUNT${NC}"
echo
echo -e "${GREEN}Happy coding! 🏍️${NC}"
echo
