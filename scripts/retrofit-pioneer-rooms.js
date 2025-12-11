#!/usr/bin/env node

/**
 * Retrofit Pioneer Square room files with environmental properties
 * 
 * Adds to each room:
 * - population: 0 (empty, post-Event)
 * - ambientNoise: 0 (quiet, abandoned)
 * - lighting: 100 (daylight, outdoor)
 * - waterLevel: 0 (dry)
 * - outdoor: true (all street-level rooms)
 */

const fs = require('fs');
const path = require('path');

const PIONEER_SQUARE_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

function retrofitRoomFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has environmental properties
  if (content.includes('population:') || content.includes('ambientNoise:')) {
    console.log(`  ✓ Already retrofitted: ${path.basename(filePath)}`);
    return false;
  }
  
  // Find the room export and add properties before the closing brace
  const roomExportMatch = content.match(/export const room = \{([^}]+)\};/s);
  if (!roomExportMatch) {
    console.warn(`  ⚠ Could not parse: ${filePath}`);
    return false;
  }
  
  const roomContent = roomExportMatch[1];
  
  // Check if it has the basic properties
  if (!roomContent.includes('name:') || !roomContent.includes('description:')) {
    console.warn(`  ⚠ Missing basic properties: ${filePath}`);
    return false;
  }
  
  // Build the new room content with environmental properties
  const lines = roomContent.split('\n');
  const lastPropertyIndex = lines.length - 1; // Last line before closing brace
  
  // Insert environmental properties before the last line
  const environmentalProps = [
    '  // Environmental properties',
    '  population: 0, // Empty (post-Event)',
    '  ambientNoise: 0, // Quiet/abandoned',
    '  lighting: 100, // Daylight (outdoor)',
    '  waterLevel: 0, // Dry',
    '  outdoor: true, // Street level',
  ];
  
  // Find last property (could be z, or intersection if it exists)
  let insertIndex = lines.length - 1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().match(/^(name|description|x|y|z|intersection):/)) {
      // Found a property, insert after the next comma
      insertIndex = i;
      // Make sure the line ends with comma
      if (!lines[i].trim().endsWith(',')) {
        lines[i] = lines[i].trimEnd() + ',';
      }
      break;
    }
  }
  
  // Insert environmental properties
  lines.splice(insertIndex + 1, 0, ...environmentalProps);
  
  const newRoomContent = lines.join('\n');
  const newContent = content.replace(roomExportMatch[0], `export const room = {${newRoomContent}};`);
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

function processDirectory(dir, dirName = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      count += processDirectory(fullPath, entry.name);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('MAP')) {
      if (retrofitRoomFile(fullPath)) {
        count++;
        if (count % 10 === 0) {
          console.log(`  Processed ${count} files...`);
        }
      }
    }
  }
  
  return count;
}

console.log('🔧 Retrofitting Pioneer Square room files...');
console.log('');

const count = processDirectory(PIONEER_SQUARE_DIR);

console.log('');
console.log(`✅ Retrofitted ${count} room files`);
console.log('');
console.log('Environmental properties added:');
console.log('  - population: 0 (empty)');
console.log('  - ambientNoise: 0 (quiet)');
console.log('  - lighting: 100 (well-lit/daylight)');
console.log('  - waterLevel: 0 (dry)');
console.log('  - outdoor: true (street level)');
