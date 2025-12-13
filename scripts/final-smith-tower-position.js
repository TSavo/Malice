#!/usr/bin/env node

/**
 * Move Smith Tower to final position touching both 1st Ave and Yesler Way.
 *
 * Current: x=-6 to -3, y=9 to 11
 * Target: x=-13 to -10, y=9 to 11
 *
 * This positions it:
 * - West edge at x=-13 (adjacent to 1st Ave at x=-14)
 * - North edge at y=11 (adjacent to Yesler Way at y=12)
 *
 * Transform: x -= 7
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

  // Shift X west by 7
  content = content.replace(/(\bx:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldX = parseInt(num);
    const newX = oldX - 7;
    changes++;
    return `${prefix}${newX}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  return changes;
}

console.log('🏗️  Moving Smith Tower to touch 1st Ave...');
console.log('');
console.log('Current: x=-6 to -3, y=9 to 11');
console.log('Target: x=-13 to -10, y=9 to 11');
console.log('');
console.log('Transform: x -= 7');
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
console.log('Final footprint: x=-13 to -10, y=9 to 11');
console.log('West entrance (1st Ave at x=-14): x=-13, y=9');
console.log('North entrance (Yesler at y=12): x=-12, y=11');
