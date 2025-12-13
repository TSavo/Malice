#!/usr/bin/env node

/**
 * Shift Smith Tower 1 row south to not overlap with Yesler Way.
 *
 * Current: x=-6 to -3, y=10 to 12 (top row overlaps Yesler at y=12)
 * Target: x=-6 to -3, y=9 to 11 (one row south)
 *
 * Transform: y -= 1
 *
 * This puts:
 * - North edge at y=11 (adjacent to Yesler at y=12)
 * - South edge at y=9 (adjacent to Washington at y=6... with gap)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SMITH_TOWER_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square/buildings/smith-tower');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Shift Y south by 1
  content = content.replace(/(\by:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldY = parseInt(num);
    const newY = oldY - 1;
    changes++;
    return `${prefix}${newY}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  return changes;
}

console.log('🏗️  Shifting Smith Tower 1 row south...');
console.log('');
console.log('Current: x=-6 to -3, y=10 to 12');
console.log('Target: x=-6 to -3, y=9 to 11');
console.log('');
console.log('Transform: y -= 1');
console.log('');

const files = fs.readdirSync(SMITH_TOWER_DIR)
  .filter(f => f.endsWith('.ts') && !f.includes('backup'))
  .map(f => path.join(SMITH_TOWER_DIR, f));

let totalChanges = 0;
for (const file of files) {
  const changes = updateFile(file);
  totalChanges += changes;
  console.log(`  ${path.basename(file)}: ${changes} coordinate updates`);
}

console.log('');
console.log(`✅ Updated ${files.length} files with ${totalChanges} total coordinate changes`);
console.log('');
console.log('New footprint: x=-6 to -3, y=9 to 11');
console.log('North entrance (to Yesler y=12): from room at y=11');
