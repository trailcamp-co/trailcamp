# Automated Git Tagging

Auto-tag script that creates version tags based on database migration count.

## Version Format

`v1.X` where X = number of migrations

Examples:
- 5 migrations → `v1.5`
- 10 migrations → `v1.10`
- 23 migrations → `v1.23`

## Usage

```bash
cd server/
./auto-tag.sh
```

Interactive prompts:
1. Shows proposed tag version
2. Displays database statistics
3. Shows tag message preview
4. Confirms before creating tag

## Tag Message Contents

Each tag includes:
- Schema version (migration count)
- Total location count
- Riding spot count
- Boondocking site count
- Total trail miles
- Data quality score

Example tag message:
```
TrailCamp Release v1.8

Database Schema Version: 8 migrations

Statistics:
- Total Locations: 6,148
- Riding Spots: 1,394
- Boondocking Sites: 639
- Total Trail Miles: 84,665
- Data Quality Score: 93%

Auto-generated tag based on migration count.
```

## Features

### Safety Checks
- Verifies git repository exists
- Checks if tag already exists
- Confirms before creating/overwriting
- Validates migrations directory

### Duplicate Handling
If tag exists:
- Shows existing tag info
- Offers to delete and recreate
- Aborts if user declines

### Database Stats
Automatically pulls live stats from database:
- Location counts by category
- Trail mileage totals
- Quality score (if analyzer exists)
- Gracefully handles missing database

## Pushing Tags

Created tags are local by default.

Push specific tag:
```bash
git push origin v1.8
```

Push all tags:
```bash
git push --tags
```

## Git Hooks Integration

### Automatic Tagging After Migration

Create `.git/hooks/post-commit`:

```bash
#!/bin/bash

# Check if migrations were changed
if git diff-tree --no-commit-id --name-only HEAD | grep -q "^server/migrations/"; then
    echo "Migration detected - consider tagging release"
    echo "Run: cd server && ./auto-tag.sh"
fi
```

Make executable:
```bash
chmod +x .git/hooks/post-commit
```

### Automatic Tagging (Fully Automated)

**⚠️ Use with caution** - creates tags without confirmation.

Create `.git/hooks/post-commit`:

```bash
#!/bin/bash

if git diff-tree --no-commit-id --name-only HEAD | grep -q "^server/migrations/.*\.sql$"; then
    cd server/
    ./auto-tag.sh <<< "y" # Auto-confirm
    echo "Auto-tagged release after migration"
fi
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Auto-Tag Release

on:
  push:
    paths:
      - 'server/migrations/*.sql'
    branches:
      - main

jobs:
  tag:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Count migrations
        id: migrations
        run: |
          COUNT=$(find server/migrations -name "*.sql" -not -name "*_down.sql" | wc -l)
          echo "count=$COUNT" >> $GITHUB_OUTPUT
      
      - name: Create tag
        run: |
          VERSION="v1.${{ steps.migrations.outputs.count }}"
          git tag -a "$VERSION" -m "Release $VERSION"
          git push origin "$VERSION"
```

## Viewing Tags

List all tags:
```bash
git tag
```

Show tag details:
```bash
git show v1.8
```

Checkout specific tag:
```bash
git checkout v1.8
```

## Tag Management

### Delete Local Tag
```bash
git tag -d v1.8
```

### Delete Remote Tag
```bash
git push origin --delete v1.8
```

### Re-tag After Fixes
If you need to move a tag (e.g., after fixing migration):

```bash
# Delete old tag locally and remotely
git tag -d v1.8
git push origin --delete v1.8

# Create new tag
./auto-tag.sh

# Push new tag
git push origin v1.8
```

## Best Practices

### When to Tag
- After adding new migration
- After major data expansions
- Before deployment
- At significant milestones

### When NOT to Tag
- During active development
- Before testing migration
- On broken/partial migrations
- Multiple times per day

### Semantic Versioning Note
This uses a simplified schema-based versioning (v1.X).

For traditional semantic versioning (vMAJOR.MINOR.PATCH):
- Major schema changes → increment major (v2.0)
- Minor migrations → increment minor (v1.X)
- Hotfixes → increment patch (v1.8.1)

## Troubleshooting

### "Not in a git repository"
**Cause:** Running outside git repo
**Fix:** `cd` to project root first

### "Migrations directory not found"
**Cause:** Script expects `migrations/` folder
**Fix:** Run from `server/` directory or update `MIGRATIONS_DIR` path

### "Database not found"
**Cause:** trailcamp.db doesn't exist yet
**Fix:** Script uses placeholder stats, safe to proceed

### Tag Already Exists
**Options:**
1. Delete and recreate (script prompts)
2. Increment manually: create v1.X.1 instead
3. Abort and investigate

### Quality Score Shows "N/A"
**Cause:** analyze-quality.js not found or failed
**Fix:** Quality score is optional, tag is still created successfully

## Automation Examples

### Weekly Release Tagging

cron job:
```bash
0 0 * * 0 cd /path/to/trailcamp/server && ./auto-tag.sh <<< "y" 2>&1 | tee -a logs/auto-tag.log
```

### Tag on Deploy

In deploy script:
```bash
#!/bin/bash
cd server/
./auto-tag.sh <<< "y"
git push --tags
# ... rest of deploy
```

## Related Documentation
- DATABASE-MIGRATIONS.md - Migration workflow
- BACKUP-ROTATION.md - Backup strategy
- DEPLOYMENT.md - Production deployment

---

*Auto-generated versioning based on database schema evolution.*
