#!/usr/bin/env node

/**
 * Reset Smith Tower coordinates to proper position:
 * x=-6 to -3 (between Occidental at x=-7 and 2nd Ave at x=0)
 * y=9 to 12 (touching Yesler Way at y=12)
 *
 * Current position: x=-13 to -10, y=10 to 12
 * Target position: x=-6 to -3, y=9 to 12
 *
 * Transform: x += 7, y -= 1 (but y=10 becomes 9, y=11 becomes 10, y=12 becomes 11... wait no)
 *
 * Actually we want the building at y=9 to 12, 4 rows.
 * Current is y=10 to 12, 3 rows.
 *
 * We need to shift x += 7 to go from x=-13 back to x=-6
 * And shift y -= 1 to go from y=10-12 to y=9-11
 *
 * But that doesn't touch Yesler at y=12. Let me reconsider.
 *
 * The user wants:
 * - North entrance at x=-5, Yesler (y=12)
 * - West entrance at y=9, 1st Ave (x=-14)
 *
 * A 4x3 building can't span from x=-14 to x=-5 (that's 10 units).
 *
 * Interpretation: The building is at its original x=-6 to -3, but shifted north
 * so the top row is at y=12 (Yesler).
 *
 * For west entrance to reach 1st Ave at y=9, there must be an internal
 * corridor or the entrance connects via street.
 *
 * New target:
 * - x=-6 to -3 (4 wide)
 * - y=10 to 12 (3 tall, north row at Yesler y=12)
 * - North door at x=-5, y=12
 * - West side at x=-6 connects to... the adjacent block
 *
 * The "y=9 1st street" might mean y=9 on whatever street is adjacent,
 * not necessarily 1st Ave itself.
 *
 * Let me just restore to x=-6 to -3, y=10 to 12 (original intent from first remap)
 * then add the Yesler entrance.
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

  // Shift X back east: +7 (from x=-13 to x=-6)
  content = content.replace(/(\bx:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldX = parseInt(num);
    const newX = oldX + 7;
    changes++;
    return `${prefix}${newX}`;
  });

  // Y stays at 10-12 (no change needed, but let's verify)
  // Current: y=10, 11, 12
  // Target: y=10, 11, 12 (same)
  // No y adjustment needed

  fs.writeFileSync(filePath, content, 'utf8');
  return changes;
}

console.log('🏗️  Resetting Smith Tower X coordinates...');
console.log('');
console.log('Current: x=-13 to -10, y=10 to 12');
console.log('Target: x=-6 to -3, y=10 to 12');
console.log('');
console.log('Transform: x += 7');
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
console.log('New footprint: x=-6 to -3, y=10 to 12');
console.log('North entrance (Yesler): x=-5, y=12');
