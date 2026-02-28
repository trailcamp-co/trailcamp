# TrailCamp Deployment Guide

Complete guide for deploying TrailCamp to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Preparation](#database-preparation)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [DNS and SSL](#dns-and-ssl)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing locally
- [ ] Data quality checks passing (`./server/check-data-quality.sh`)
- [ ] Performance tests acceptable (`./server/test-performance.sh`)
- [ ] No console errors in browser
- [ ] Mobile responsive testing complete
- [ ] Dark mode verified
- [ ] All features tested in production-like environment

### Security

- [ ] Environment variables secured (no secrets in code)
- [ ] API keys rotated for production
- [ ] Database backups configured
- [ ] HTTPS/SSL certificates ready
- [ ] CORS configured for production domain
- [ ] Rate limiting configured
- [ ] SQL injection protection verified (parameterized queries)
- [ ] XSS protection verified (React escaping + CSP headers)

### Performance

- [ ] Bundle size analyzed and optimized
- [ ] Images optimized
- [ ] Database indexes in place
- [ ] CDN configured (if using)
- [ ] Caching strategy defined

### Documentation

- [ ] README.md up to date
- [ ] API documentation current
- [ ] Deployment runbook ready (this doc!)
- [ ] Team trained on deployment process

---

## Environment Setup

### Required Services

1. **Server:** VPS or cloud instance (recommended: 2GB RAM minimum)
2. **Domain:** Registered domain name
3. **SSL:** Certificate (Let's Encrypt recommended)
4. **Node.js:** v18+ installed
5. **Process Manager:** PM2 or systemd

### Environment Variables

Create `.env` files for both client and server:

**Server (`server/.env`):**
```env
NODE_ENV=production
PORT=3001
DATABASE_PATH=./trailcamp.db
CORS_ORIGIN=https://yourdomain.com
MAPBOX_ACCESS_TOKEN=your_production_token

# Optional: External services
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

**Client (`client/.env.production`):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_MAPBOX_TOKEN=your_public_mapbox_token
```

---

## Database Preparation

### 1. Final Backup

Before deployment, create final development backup:

```bash
cd server
./backup-database.sh
# Save backup to secure location
scp backups/trailcamp-backup-*.sql user@backup-server:/backups/
```

### 2. Database Migration

```bash
# On production server
cd /var/www/trailcamp/server

# Upload database (if migrating from dev)
scp local/path/to/trailcamp.db user@server:/var/www/trailcamp/server/

# OR restore from SQL dump
sqlite3 trailcamp.db < backup.sql

# Verify integrity
sqlite3 trailcamp.db "PRAGMA integrity_check;"

# Run data quality checks
./check-data-quality.sh
```

### 3. Set Permissions

```bash
chmod 644 trailcamp.db
chown www-data:www-data trailcamp.db  # Adjust user as needed
```

### 4. Configure Backups

Add to crontab (`crontab -e`):

```cron
# Daily backup at 3 AM
0 3 * * * cd /var/www/trailcamp/server && ./backup-database.sh >> /var/log/trailcamp-backup.log 2>&1

# Data quality check daily at 4 AM
0 4 * * * cd /var/www/trailcamp/server && ./check-data-quality.sh >> /var/log/trailcamp-quality.log 2>&1
```

---

## Backend Deployment

### Option 1: VPS Deployment (PM2)

#### 1. Install Dependencies

```bash
cd /var/www/trailcamp
git clone https://github.com/yourusername/trailcamp.git .

cd server
npm install --production
```

#### 2. Build

```bash
npm run build
```

#### 3. Install PM2

```bash
npm install -g pm2
```

#### 4. Create PM2 Ecosystem File

`ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'trailcamp-api',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/trailcamp-error.log',
    out_file: '/var/log/trailcamp-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

#### 5. Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

#### 6. Verify

```bash
pm2 status
curl http://localhost:3001/api/health
```

### Option 2: Systemd Service

Create `/etc/systemd/system/trailcamp.service`:

```ini
[Unit]
Description=TrailCamp API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/trailcamp/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=trailcamp

Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable trailcamp
sudo systemctl start trailcamp
sudo systemctl status trailcamp
```

### Nginx Reverse Proxy

`/etc/nginx/sites-available/trailcamp`:

```nginx
# API backend
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/trailcamp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Frontend Deployment

### Option 1: Static Hosting (Netlify, Vercel, Cloudflare Pages)

#### Build Locally

```bash
cd client
npm install
npm run build
# Output in client/dist/
```

#### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd client
netlify deploy --prod --dir=dist
```

Configure environment variables in Netlify dashboard:
- `VITE_API_BASE_URL=https://api.yourdomain.com`
- `VITE_MAPBOX_TOKEN=your_token`

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd client
vercel --prod
```

Add environment variables in Vercel dashboard.

### Option 2: Self-Hosted (Nginx)

#### 1. Build

```bash
cd /var/www/trailcamp/client
npm install
npm run build
```

#### 2. Nginx Config

`/etc/nginx/sites-available/trailcamp-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/trailcamp/client/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/trailcamp-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## DNS and SSL

### 1. DNS Configuration

Point your domain to the server:

```
A Record:  yourdomain.com        →  your.server.ip.address
A Record:  www.yourdomain.com    →  your.server.ip.address
A Record:  api.yourdomain.com    →  your.server.ip.address  (if separate)
```

### 2. SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal (should be configured automatically)
sudo certbot renew --dry-run
```

Certbot will automatically update your Nginx configs for HTTPS.

---

## Post-Deployment

### 1. Verification Checklist

- [ ] Homepage loads: `https://yourdomain.com`
- [ ] API health check: `https://api.yourdomain.com/api/health`
- [ ] Map loads with data
- [ ] Filters work
- [ ] Trip creation works
- [ ] Search works
- [ ] Mobile responsive
- [ ] HTTPS redirect working
- [ ] No mixed content warnings

### 2. Performance Check

```bash
# API performance
cd server
./test-performance.sh

# Frontend Lighthouse audit
npx lighthouse https://yourdomain.com --view
```

### 3. Initial Data Verification

```bash
curl https://api.yourdomain.com/api/locations?limit=5
# Should return 5 locations
```

---

## Monitoring

### Health Checks

Set up external monitoring (UptimeRobot, Pingdom, etc.):

- Monitor: `https://api.yourdomain.com/api/health`
- Check interval: 5 minutes
- Alert on: down for > 5 minutes

### Log Monitoring

```bash
# PM2 logs
pm2 logs trailcamp-api

# Systemd logs
sudo journalctl -u trailcamp -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Database Monitoring

Create monitoring script `server/monitor-db.sh`:

```bash
#!/bin/bash
DB_SIZE=$(du -h trailcamp.db | cut -f1)
LOCATION_COUNT=$(sqlite3 trailcamp.db "SELECT COUNT(*) FROM locations;")

echo "Database size: $DB_SIZE"
echo "Location count: $LOCATION_COUNT"

# Alert if database size exceeds threshold
MAX_SIZE_MB=500
CURRENT_SIZE_MB=$(du -m trailcamp.db | cut -f1)
if [ $CURRENT_SIZE_MB -gt $MAX_SIZE_MB ]; then
    echo "WARNING: Database size exceeds ${MAX_SIZE_MB}MB"
fi
```

Add to cron for daily checks.

### Backup Verification

Weekly backup restoration test:

```bash
# Test backup restoration
cd /var/www/trailcamp/server/backups
LATEST=$(ls -t trailcamp-backup-*.sql | head -1)
sqlite3 test-restore.db < $LATEST
sqlite3 test-restore.db "PRAGMA integrity_check;"
rm test-restore.db
```

---

## Rollback Procedures

### Quick Rollback (PM2)

```bash
# List deployments
pm2 list

# Rollback to previous
cd /var/www/trailcamp
git log --oneline -5  # Find previous commit
git checkout <previous-commit-hash>

cd server
npm run build
pm2 restart trailcamp-api
```

### Database Rollback

```bash
# Stop server
pm2 stop trailcamp-api  # or sudo systemctl stop trailcamp

# Restore from backup
cd /var/www/trailcamp/server
cp trailcamp.db trailcamp.db.broken  # Save current state
sqlite3 trailcamp.db < backups/trailcamp-backup-YYYY-MM-DD_HH-MM-SS.sql

# Verify restoration
./check-data-quality.sh

# Restart server
pm2 start trailcamp-api  # or sudo systemctl start trailcamp
```

### Complete Rollback

```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop nginx

# 2. Restore code
cd /var/www/trailcamp
git fetch --all
git checkout <previous-stable-tag>

# 3. Restore database
cd server
sqlite3 trailcamp.db < backups/last-stable-backup.sql

# 4. Rebuild
cd server && npm run build
cd ../client && npm run build

# 5. Restart services
pm2 restart all
sudo systemctl start nginx

# 6. Verify
curl https://api.yourdomain.com/api/health
curl https://yourdomain.com
```

---

## Troubleshooting

### API Not Responding

```bash
# Check if process is running
pm2 status
# or
sudo systemctl status trailcamp

# Check logs
pm2 logs trailcamp-api --lines 100
# or
sudo journalctl -u trailcamp -n 100

# Check port
sudo lsof -i :3001

# Restart
pm2 restart trailcamp-api
# or
sudo systemctl restart trailcamp
```

### Database Locked

```bash
# Find processes using database
fuser trailcamp.db

# Kill if safe
pm2 stop trailcamp-api
# Manual cleanup if needed
sqlite3 trailcamp.db "PRAGMA wal_checkpoint(FULL);"
pm2 start trailcamp-api
```

### High Memory Usage

```bash
# Check memory
pm2 monit

# Restart with memory limit
pm2 restart trailcamp-api --max-memory-restart 500M
```

### Frontend Not Loading

```bash
# Check Nginx config
sudo nginx -t

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Verify files exist
ls -lh /var/www/trailcamp/client/dist/

# Check permissions
sudo chown -R www-data:www-data /var/www/trailcamp/client/dist/
```

---

## Maintenance Windows

### Zero-Downtime Deployment

Using PM2 cluster mode:

```bash
# Deploy new code
cd /var/www/trailcamp
git pull origin main
cd server && npm run build

# Reload with zero downtime
pm2 reload ecosystem.config.js
```

### Planned Maintenance

1. Announce maintenance window to users
2. Put up maintenance page (optional)
3. Stop services, perform updates
4. Run verification tests
5. Restart services
6. Remove maintenance page

---

## Security Best Practices

- [ ] Keep Node.js and dependencies updated
- [ ] Regular security audits: `npm audit`
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key authentication only (no password auth)
- [ ] Fail2ban configured
- [ ] Regular backup rotation (keep 30 days)
- [ ] Monitor access logs for suspicious activity
- [ ] API rate limiting enabled
- [ ] HTTPS enforced (redirect HTTP → HTTPS)

---

## Contact & Support

- **Deployment issues:** [Create GitHub issue](https://github.com/yourusername/trailcamp/issues)
- **Security concerns:** Email security@yourdomain.com
- **Performance monitoring:** Check status page at status.yourdomain.com

---

*Last updated: 2026-02-28*
*Version: 1.0*
