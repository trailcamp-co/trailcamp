// Missing Permit Info Finder for TrailCamp
// Identifies locations that likely need permits but have incomplete data

import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('./trailcamp.db', { readonly: true });

console.log('Finding locations with potentially missing permit information...\n');

// Patterns that typically require permits
const PERMIT_PATTERNS = [
  { name: 'National Park', field: 'name', pattern: /national park|nps/i, permitType: 'Entrance fee or backcountry permit' },
  { name: 'National Forest OHV', field: 'name', pattern: /national forest|nf.*ohv|ohv.*forest/i, permitType: 'OHV permit or trail pass' },
  { name: 'State Park OHV', field: 'name', pattern: /state park.*ohv|ohv.*state park/i, permitType: 'State OHV registration' },
  { name: 'Wilderness Area', field: 'name', pattern: /wilderness/i, permitType: 'Wilderness permit' },
  { name: 'BLM Special Area', field: 'name', pattern: /blm.*ohv|ohv.*blm/i, permitType: 'BLM permit or recreation pass' },
  { name: 'State Recreation Area', field: 'name', pattern: /recreation area|sra/i, permitType: 'Day-use or camping permit' },
  { name: 'Wildlife Management Area', field: 'name', pattern: /wildlife management|wma/i, permitType: 'Access permit (hunting license often required)' },
  { name: 'OHV Park/Area', field: 'name', pattern: /ohv\s+(park|area)/i, permitType: 'OHV registration' }
];

// Get all locations
const locations = db.prepare('SELECT * FROM locations WHERE category IN (\'riding\', \'campsite\')').all();

console.log(`Analyzing ${locations.length} locations...\n`);

const findings = {
  missingPermitRequired: [],  // permit_required is NULL but likely needs one
  missingPermitInfo: [],      // permit_required = 1 but permit_info is NULL/empty
  suspectedNeeds: []          // Based on name patterns, might need permit
};

for (const loc of locations) {
  const hasPermitFlag = loc.permit_required === 1;
  const hasPermitInfo = loc.permit_info && loc.permit_info.trim().length > 0;
  
  // Check if name matches patterns that typically require permits
  let matchedPattern = null;
  for (const pattern of PERMIT_PATTERNS) {
    if (pattern.pattern.test(loc[pattern.field])) {
      matchedPattern = pattern;
      break;
    }
  }
  
  // Case 1: Has permit flag but missing info
  if (hasPermitFlag && !hasPermitInfo) {
    findings.missingPermitInfo.push({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      sub_type: loc.sub_type,
      permit_required: loc.permit_required,
      reason: 'Has permit_required = 1 but missing permit_info'
    });
  }
  
  // Case 2: Name suggests permit needed but flag not set
  if (matchedPattern && !hasPermitFlag) {
    findings.missingPermitRequired.push({
      id: loc.id,
      name: loc.name,
      category: loc.category,
      sub_type: loc.sub_type,
      pattern: matchedPattern.name,
      suggestedPermit: matchedPattern.permitType,
      reason: `Name matches "${matchedPattern.name}" pattern - likely needs permit`
    });
  }
  
  // Case 3: Name suggests permit, has flag, but info is vague
  if (matchedPattern && hasPermitFlag && hasPermitInfo) {
    // Check if permit_info is too vague (just "Permit required" or similar)
    const vague = /^(permit required|permit needed|yes)$/i.test(loc.permit_info.trim());
    if (vague) {
      findings.suspectedNeeds.push({
        id: loc.id,
        name: loc.name,
        category: loc.category,
        current_permit_info: loc.permit_info,
        suggestedPermit: matchedPattern.permitType,
        reason: 'Has permit flag but info is too vague'
      });
    }
  }
}

// Generate markdown report
let report = `# Missing Permit Information Report

*Generated: ${new Date().toISOString().split('T')[0]}*

## Summary

- **Total locations analyzed:** ${locations.length}
- **Missing permit_info (flag set):** ${findings.missingPermitInfo.length}
- **Likely needs permit (flag not set):** ${findings.missingPermitRequired.length}
- **Vague permit info:** ${findings.suspectedNeeds.length}

---

## 1. Locations with permit_required but Missing Details

These locations have \`permit_required = 1\` but are missing \`permit_info\` text:

`;

if (findings.missingPermitInfo.length > 0) {
  report += `| ID | Name | Category | Sub-Type |\n`;
  report += `|----|------|----------|----------|\n`;
  
  for (const loc of findings.missingPermitInfo) {
    report += `| ${loc.id} | ${loc.name} | ${loc.category} | ${loc.sub_type || 'N/A'} |\n`;
  }
  
  report += `\n**Action Required:** Add specific permit information for these ${findings.missingPermitInfo.length} locations.\n\n`;
  report += `**Example SQL:**\n\`\`\`sql\n`;
  report += `UPDATE locations SET permit_info = 'Specific permit details here' WHERE id = <location_id>;\n`;
  report += `\`\`\`\n`;
} else {
  report += `✅ No locations found with this issue.\n`;
}

report += `\n---\n\n## 2. Locations Likely Requiring Permits (Flag Not Set)\n\n`;
report += `Based on name patterns, these locations likely require permits but \`permit_required\` is not set:\n\n`;

if (findings.missingPermitRequired.length > 0) {
  // Group by pattern
  const byPattern = {};
  for (const loc of findings.missingPermitRequired) {
    if (!byPattern[loc.pattern]) {
      byPattern[loc.pattern] = [];
    }
    byPattern[loc.pattern].push(loc);
  }
  
  for (const [pattern, locs] of Object.entries(byPattern)) {
    report += `\n### ${pattern} (${locs.length} locations)\n\n`;
    report += `| ID | Name | Category | Suggested Permit |\n`;
    report += `|----|------|----------|------------------|\n`;
    
    for (const loc of locs.slice(0, 20)) {  // Limit to 20 per pattern for readability
      report += `| ${loc.id} | ${loc.name} | ${loc.category} | ${loc.suggestedPermit} |\n`;
    }
    
    if (locs.length > 20) {
      report += `\n*... and ${locs.length - 20} more*\n`;
    }
  }
  
  report += `\n**Action Required:** Review these ${findings.missingPermitRequired.length} locations and set permit_required flag + details.\n\n`;
  report += `**Example SQL:**\n\`\`\`sql\n`;
  report += `UPDATE locations \n`;
  report += `SET permit_required = 1, \n`;
  report += `    permit_info = 'Specific permit type and requirements'\n`;
  report += `WHERE id = <location_id>;\n`;
  report += `\`\`\`\n`;
} else {
  report += `✅ No obvious missing permits found.\n`;
}

report += `\n---\n\n## 3. Vague Permit Information\n\n`;
report += `These locations have a permit flag and info, but the info is too vague:\n\n`;

if (findings.suspectedNeeds.length > 0) {
  report += `| ID | Name | Current Info | Suggested Improvement |\n`;
  report += `|----|------|--------------|----------------------|\n`;
  
  for (const loc of findings.suspectedNeeds.slice(0, 30)) {
    report += `| ${loc.id} | ${loc.name} | "${loc.current_permit_info}" | ${loc.suggestedPermit} |\n`;
  }
  
  if (findings.suspectedNeeds.length > 30) {
    report += `\n*... and ${findings.suspectedNeeds.length - 30} more*\n`;
  }
  
  report += `\n**Action Required:** Improve permit_info with specific details.\n`;
} else {
  report += `✅ All permit info is reasonably specific.\n`;
}

report += `\n---\n\n## Permit Data Quality\n\n`;

const totalWithPermitFlag = db.prepare('SELECT COUNT(*) as count FROM locations WHERE permit_required = 1').get().count;
const totalWithPermitInfo = db.prepare('SELECT COUNT(*) as count FROM locations WHERE permit_info IS NOT NULL AND permit_info != \'\'').get().count;
const ridingLocations = db.prepare('SELECT COUNT(*) as count FROM locations WHERE category = \'riding\'').get().count;
const campsiteLocations = db.prepare('SELECT COUNT(*) as count FROM locations WHERE category = \'campsite\'').get().count;

report += `### Current Coverage\n\n`;
report += `- Locations with \`permit_required = 1\`: ${totalWithPermitFlag}\n`;
report += `- Locations with \`permit_info\` text: ${totalWithPermitInfo}\n`;
report += `- Riding locations: ${ridingLocations} total\n`;
report += `- Campsite locations: ${campsiteLocations} total\n\n`;

const permitPctRiding = Math.round((totalWithPermitFlag / ridingLocations) * 100);
report += `**Riding locations with permits:** ${permitPctRiding}% of riding locations have permit flags\n\n`;

report += `### Common Permit Types\n\n`;
report += `Based on analysis, common permit requirements:\n\n`;
report += `1. **OHV Registration** - State-specific off-highway vehicle registration (CA, AZ, UT, etc.)\n`;
report += `2. **National Forest Trail Pass** - Required for some NF OHV areas\n`;
report += `3. **State Park Day-Use Pass** - Entry fee for state parks\n`;
report += `4. **Wilderness Permit** - Required for designated wilderness areas\n`;
report += `5. **BLM Recreation Pass** - Some BLM areas require permits\n`;
report += `6. **Backcountry Permit** - National Parks backcountry camping\n\n`;

report += `### Data Improvement Recommendations\n\n`;

if (findings.missingPermitInfo.length > 0) {
  report += `1. **HIGH PRIORITY:** Add permit_info for ${findings.missingPermitInfo.length} locations with permit flag set\n`;
}

if (findings.missingPermitRequired.length > 20) {
  report += `2. **MEDIUM PRIORITY:** Review ${findings.missingPermitRequired.length} locations likely needing permits\n`;
}

if (findings.suspectedNeeds.length > 20) {
  report += `3. **LOW PRIORITY:** Improve vague permit info for ${findings.suspectedNeeds.length} locations\n`;
}

report += `\n---\n\n*Report generated by find-missing-permits.js*\n`;

// Save report
fs.writeFileSync('./MISSING-PERMITS.md', report);
console.log('✅ Permit info analysis complete!');
console.log(`📄 Report saved to: MISSING-PERMITS.md\n`);

// Print summary
console.log('📊 Summary:');
console.log(`  Missing permit_info (flag set): ${findings.missingPermitInfo.length}`);
console.log(`  Likely needs permit (flag not set): ${findings.missingPermitRequired.length}`);
console.log(`  Vague permit info: ${findings.suspectedNeeds.length}`);

if (findings.missingPermitRequired.length > 0) {
  console.log(`\n⚠️  ${findings.missingPermitRequired.length} locations likely need permit flags - manual review recommended`);
}

db.close();
