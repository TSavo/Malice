#!/usr/bin/env node

/**
 * Relocate Smith Tower to touch both 1st Ave S (west) and Yesler Way (north).
 *
 * Old: x=-6 to -3, y=+8 to +10 (4x3, near Occidental/2nd Ave)
 * New: x=-13 to -10, y=+9 to +12 (4x4, touching 1st Ave and Yesler)
 *
 * Transform: x -= 7 (shift west), y += 1 (shift north - only rows that need it)
 *
 * Layout changes:
 * Old layout:       New layout:
 *   -6 -5 -4 -3       -13 -12 -11 -10
 * +10 R  L  A  C    +12  R   L   A   C    ← Touches Yesler
 *  +9 W  E  T  D    +11  W   E   T   D
 *  +8 V  VA SM SO   +10  V   VA  SM  SO
 *                   +9   ?   ?   ?   ?    ← New row (lobby/entrance)
 *
 * The building gains a new ground floor row at y=+9 for the 1st Ave entrance.
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

  // Shift all X coordinates by -7 (move west)
  content = content.replace(/(\bx:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldX = parseInt(num);
    const newX = oldX - 7;
    changes++;
    return `${prefix}${newX}`;
  });

  // Shift all Y coordinates by +2 (move north, adding space for entrance row)
  content = content.replace(/(\by:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldY = parseInt(num);
    const newY = oldY + 2;
    changes++;
    return `${prefix}${newY}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  return changes;
}

console.log('🏗️  Relocating Smith Tower...');
console.log('');
console.log('Old position: x=-6 to -3, y=+8 to +10 (near Occidental)');
console.log('New position: x=-13 to -10, y=+10 to +12 (touching 1st Ave & Yesler)');
console.log('');
console.log('Transform: x -= 7, y += 2');
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
console.log('New footprint: x=-13 to -10, y=+10 to +12');
console.log('West entrance (1st Ave): x=-14, y=+11');
console.log('North entrance (Yesler): x=-11, y=+12');
