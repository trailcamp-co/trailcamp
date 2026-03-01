# Development Environment Setup

Quick start guide for contributing to TrailCamp.

## One-Command Setup

```bash
git clone https://github.com/[username]/trailcamp.git
cd trailcamp
./setup.sh
```

The setup script will:
1. ✓ Check required dependencies
2. ✓ Install npm packages (root, client, server)
3. ✓ Initialize SQLite database
4. ✓ Run all migrations
5. ✓ Create environment configuration
6. ✓ Verify installation

## Prerequisites

### Required
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)

### Optional (but recommended)
- **sqlite3 CLI** - For manual database inspection
  - macOS: `brew install sqlite`
  - Linux: `apt install sqlite3`
  - Windows: Download from [sqlite.org](https://www.sqlite.org/download.html)

## Manual Setup

If you prefer manual setup or need to troubleshoot:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Client dependencies
cd client
npm install
cd ..

# Server dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
cd server

# Create database
sqlite3 trailcamp.db "SELECT 1;"

# Run migrations (in order)
for file in migrations/*.sql; do
  if [[ ! "$file" =~ "_down.sql" ]]; then
    sqlite3 trailcamp.db < "$file"
  fi
done
```

### 3. Environment Configuration

Create `server/.env`:

```bash
# Database
DATABASE_PATH=./trailcamp.db

# Server
PORT=3001
NODE_ENV=development

# Optional: Mapbox (for directions/routing)
# MAPBOX_TOKEN=your_token_here

# Optional: Analytics
# ENABLE_USAGE_TRACKING=true
```

### 4. Start Development Servers

```bash
# From project root
npm run dev
```

This starts:
- **Frontend (Vite)**: http://localhost:5173
- **Backend (Express)**: http://localhost:3001

## Verifying Installation

### Check Server Health
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

### Check Database
```bash
cd server
sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations;"
```

### Run Tests
```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test
```

## Project Structure

```
trailcamp/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── lib/         # Utilities
│   └── package.json
├── server/              # Express + SQLite backend
│   ├── migrations/      # Database migrations
│   ├── scripts/         # Utility scripts
│   ├── trailcamp.db    # SQLite database
│   └── package.json
├── setup.sh            # One-command setup script
├── package.json        # Root package (scripts)
└── README.md
```

## Common Development Tasks

### Start Dev Servers
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Database Operations

#### Inspect Database
```bash
cd server
sqlite3 trailcamp.db
```

Useful SQLite commands:
```sql
.tables                          -- List all tables
.schema locations               -- Show table schema
SELECT COUNT(*) FROM locations; -- Count rows
```

#### Run Migration
```bash
cd server
sqlite3 trailcamp.db < migrations/006_new_migration.sql
```

#### Rollback Migration
See `server/MIGRATION-ROLLBACK.md`

#### Backup Database
```bash
cd server
./backup-database.sh
```

### Code Quality

#### Linting
```bash
# Client
cd client
npm run lint

# Server
cd server
npm run lint
```

#### Formatting
```bash
# Client
cd client
npm run format

# Server
cd server
npm run format
```

## Troubleshooting

### "EADDRINUSE: address already in use"
**Cause:** Port 3001 or 5173 already in use

**Fix:**
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in server/.env
PORT=3002
```

### "Database locked"
**Cause:** Multiple processes accessing database

**Fix:**
1. Stop all dev servers
2. Close any `sqlite3` CLI sessions
3. Restart dev servers

### "Module not found"
**Cause:** Missing dependencies

**Fix:**
```bash
# Reinstall all dependencies
rm -rf node_modules client/node_modules server/node_modules
npm install
cd client && npm install
cd ../server && npm install
```

### "Cannot find trailcamp.db"
**Cause:** Database not initialized

**Fix:**
```bash
cd server
sqlite3 trailcamp.db "SELECT 1;"
# Then run migrations
```

### Frontend build fails
**Cause:** Vite caching issues

**Fix:**
```bash
cd client
rm -rf dist .vite
npm run build
```

## Getting Help

### Documentation
- [README.md](./README.md) - Project overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [server/API.md](./server/API.md) - API reference
- [server/DATABASE-SCHEMA.md](./server/DATABASE-SCHEMA.md) - Database schema

### Check Existing Issues
Browse [GitHub Issues](https://github.com/[username]/trailcamp/issues) for known problems.

### Ask for Help
1. Check documentation first
2. Search existing issues
3. Create a new issue with:
   - Clear description
   - Steps to reproduce
   - System info (OS, Node version)
   - Error messages

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
Edit code, add features, fix bugs.

### 3. Test Locally
```bash
# Run dev servers
npm run dev

# Test in browser
# Run any automated tests
```

### 4. Commit Changes
```bash
git add .
git commit -m "Add: your feature description"
```

Good commit messages:
- `Add: new feature X`
- `Fix: bug in Y component`
- `Update: improve Z performance`
- `Docs: update API documentation`

### 5. Push to GitHub
```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request
1. Go to GitHub repository
2. Click "New Pull Request"
3. Select your feature branch
4. Describe changes clearly
5. Link any related issues

## Best Practices

### Code Style
- Use TypeScript types (client + server)
- Follow existing code patterns
- Keep functions small and focused
- Add comments for complex logic

### Git Commits
- Make small, focused commits
- Write clear commit messages
- Don't commit secrets/API keys
- Test before committing

### Database
- Always create migrations for schema changes
- Test migrations before committing
- Never modify existing migrations
- Include rollback (down) migrations

### Documentation
- Update README.md for major features
- Document new API endpoints
- Add inline comments for complex code
- Update CHANGELOG.md

## Advanced Topics

### Custom Database
Use your own database file:
```bash
cd server
DATABASE_PATH=/path/to/custom.db npm run dev
```

### Production Build
```bash
npm run build
# Builds to client/dist and server/dist
```

### Environment Variables
Add to `server/.env`:
```bash
# Custom port
PORT=4000

# Custom database
DATABASE_PATH=/path/to/db.sqlite

# API keys
MAPBOX_TOKEN=your_token_here

# Features
ENABLE_USAGE_TRACKING=true
ENABLE_RATE_LIMITING=true
```

### Running Scripts
Many utility scripts in `server/`:
```bash
cd server

# Data quality
./check-data-quality.sh

# Backups
./backup-database.sh

# Exports
./export-all.sh

# Performance
./run-benchmarks.sh
```

## Quick Reference

| Task | Command |
|------|---------|
| Setup project | `./setup.sh` |
| Start dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Test | `npm test` |
| DB backup | `cd server && ./backup-database.sh` |
| Run migration | `cd server && sqlite3 trailcamp.db < migrations/XXX.sql` |

---

**Ready to contribute?** Read [CONTRIBUTING.md](./CONTRIBUTING.md) next!

🏍️ Happy hacking on TrailCamp!
