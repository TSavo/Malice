#!/usr/bin/env node

/**
 * Fix Occidental Park coordinates to match MAP.md
 *
 * Current: x = -9 to -2, y = 0 to 3
 * Target:  x = -6 to -1, y = +1 to +4
 *
 * Shift: x += 3, y += 1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parkDir = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square/occidental-park');

const files = fs.readdirSync(parkDir).filter(f => f.endsWith('.ts'));

console.log(`Found ${files.length} files in occidental-park\n`);

const changes = [];

for (const file of files) {
  const filePath = path.join(parkDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract current coordinates
  const xMatch = content.match(/^\s*x:\s*(-?\d+),/m);
  const yMatch = content.match(/^\s*y:\s*(-?\d+),/m);

  if (!xMatch || !yMatch) {
    console.log(`SKIP: ${file} - no coordinates found`);
    continue;
  }

  const oldX = parseInt(xMatch[1]);
  const oldY = parseInt(yMatch[1]);

  // Apply shift: x += 3, y += 1
  const newX = oldX + 3;
  const newY = oldY + 1;

  // Update coordinates in content
  content = content.replace(/^(\s*x:\s*)-?\d+,/m, `$1${newX},`);
  content = content.replace(/^(\s*y:\s*)-?\d+,/m, `$1${newY},`);

  fs.writeFileSync(filePath, content);

  changes.push({
    file,
    oldX, oldY,
    newX, newY
  });

  console.log(`${file}: (${oldX}, ${oldY}) → (${newX}, ${newY})`);
}

console.log(`\nUpdated ${changes.length} files`);

// Show final coordinate range
const allX = changes.map(c => c.newX);
const allY = changes.map(c => c.newY);
console.log(`\nNew coordinate range:`);
console.log(`  x: ${Math.min(...allX)} to ${Math.max(...allX)}`);
console.log(`  y: ${Math.min(...allY)} to ${Math.max(...allY)}`);
