#!/usr/bin/env node
// Broken Link Checker for TrailCamp
// Verifies external_links are still accessible

import Database from 'better-sqlite3';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

// Configuration
const TIMEOUT_MS = 10000;  // 10 second timeout
const DELAY_MS = 500;      // 500ms delay between requests (rate limiting)
const MAX_REDIRECTS = 3;

console.log('Checking external links...\n');

// Get all locations with external_links
const locations = db.prepare(`
  SELECT id, name, category, external_links 
  FROM locations 
  WHERE external_links IS NOT NULL AND external_links != ''
`).all();

console.log(`Found ${locations.length} locations with external links\n`);

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if URL is accessible
function checkUrl(url, redirectCount = 0) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'HEAD',
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'TrailCamp/1.0 (Link Checker)'
        }
      };
      
      const req = protocol.request(options, (res) => {
        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirectCount < MAX_REDIRECTS) {
            const redirectUrl = new URL(res.headers.location, url).href;
            resolve(checkUrl(redirectUrl, redirectCount + 1));
          } else {
            resolve({ ok: false, status: res.statusCode, error: 'Too many redirects' });
          }
        } else if (res.statusCode === 200) {
          resolve({ ok: true, status: res.statusCode });
        } else {
          resolve({ ok: false, status: res.statusCode, error: `HTTP ${res.statusCode}` });
        }
      });
      
      req.on('error', (err) => {
        resolve({ ok: false, status: 0, error: err.message });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, status: 0, error: 'Timeout' });
      });
      
      req.end();
    } catch (err) {
      resolve({ ok: false, status: 0, error: err.message });
    }
  });
}

// Main checking function
async function checkAllLinks() {
  const results = {
    total: 0,
    ok: 0,
    broken: 0,
    errors: []
  };
  
  for (const loc of locations) {
    const links = loc.external_links.split(',').map(l => l.trim()).filter(l => l);
    
    for (const link of links) {
      results.total++;
      
      process.stdout.write(`[${results.total}] Checking ${link.substring(0, 60)}... `);
      
      const result = await checkUrl(link);
      
      if (result.ok) {
        console.log(`✓ ${result.status}`);
        results.ok++;
      } else {
        console.log(`✗ ${result.error || result.status}`);
        results.broken++;
        results.errors.push({
          locationId: loc.id,
          locationName: loc.name,
          category: loc.category,
          url: link,
          error: result.error || `HTTP ${result.status}`,
          status: result.status
        });
      }
      
      // Rate limiting
      if (results.total < locations.reduce((sum, l) => sum + l.external_links.split(',').length, 0)) {
        await sleep(DELAY_MS);
      }
    }
  }
  
  return results;
}

// Generate report
function generateReport(results) {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = `./reports/broken-links-${timestamp}.md`;
  
  let report = `# Broken Links Report\n\n`;
  report += `*Generated: ${timestamp}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total links checked:** ${results.total}\n`;
  report += `- **Working:** ${results.ok} (${Math.round((results.ok / results.total) * 100)}%)\n`;
  report += `- **Broken:** ${results.broken} (${Math.round((results.broken / results.total) * 100)}%)\n\n`;
  
  if (results.broken > 0) {
    report += `## Broken Links\n\n`;
    report += `| Location ID | Name | Category | URL | Error |\n`;
    report += `|-------------|------|----------|-----|-------|\n`;
    
    for (const error of results.errors) {
      report += `| ${error.locationId} | ${error.locationName} | ${error.category} | ${error.url} | ${error.error} |\n`;
    }
    
    report += `\n## Recommendations\n\n`;
    report += `1. Review broken links and update or remove them\n`;
    report += `2. Common fixes:\n`;
    report += `   - Update to new URL if site moved\n`;
    report += `   - Remove if resource no longer exists\n`;
    report += `   - Check for HTTPS version if HTTP failed\n\n`;
    
    report += `## SQL Fix Template\n\n`;
    report += `\`\`\`sql\n`;
    report += `-- Remove broken link\n`;
    report += `UPDATE locations SET external_links = '' WHERE id = <location_id>;\n\n`;
    report += `-- Update to new URL\n`;
    report += `UPDATE locations SET external_links = 'https://new-url.com' WHERE id = <location_id>;\n`;
    report += `\`\`\`\n`;
  } else {
    report += `✅ **All links are working!**\n`;
  }
  
  report += `\n---\n*Report generated by check-links.js*\n`;
  
  fs.writeFileSync(reportPath, report);
  return reportPath;
}

// Run
(async () => {
  try {
    const results = await checkAllLinks();
    
    console.log('\n' + '='.repeat(60));
    console.log('LINK CHECK COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nTotal links:    ${results.total}`);
    console.log(`Working:        ${results.ok} (${Math.round((results.ok / results.total) * 100)}%)`);
    console.log(`Broken:         ${results.broken} (${Math.round((results.broken / results.total) * 100)}%)`);
    
    if (results.broken > 0) {
      const reportPath = generateReport(results);
      console.log(`\n⚠️  Broken links found - see report:`);
      console.log(`   ${reportPath}\n`);
    } else {
      console.log(`\n✅ All links are working!\n`);
    }
    
  } catch (err) {
    console.error(`\n✗ Link check failed: ${err.message}\n`);
    process.exit(1);
  } finally {
    db.close();
  }
})();
