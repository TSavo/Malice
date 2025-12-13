#!/usr/bin/env node

/**
 * Remap Smith Tower room coordinates to match new Pioneer Square grid.
 *
 * Old: x=-5 to -2, y=7 to 9
 * New: x=-6 to -3, y=8 to 10
 *
 * Transform: x -= 1, y += 1
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

  // Match x: <number> - only positive or negative integers
  content = content.replace(/(\bx:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldX = parseInt(num);
    const newX = oldX - 1;
    changes++;
    return `${prefix}${newX}`;
  });

  // Match y: <number> - only positive or negative integers
  content = content.replace(/(\by:\s*)(-?\d+)/g, (match, prefix, num) => {
    const oldY = parseInt(num);
    const newY = oldY + 1;
    changes++;
    return `${prefix}${newY}`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  return changes;
}

console.log('🏗️  Remapping Smith Tower coordinates...');
console.log('');
console.log('Transform: x -= 1, y += 1');
console.log('');

const files = fs.readdirSync(SMITH_TOWER_DIR)
  .filter(f => f.endsWith('.ts'))
  .map(f => path.join(SMITH_TOWER_DIR, f));

let totalChanges = 0;
for (const file of files) {
  const changes = updateFile(file);
  totalChanges += changes;
  console.log(`  ${path.basename(file)}: ${changes} coordinate updates`);
}

console.log('');
console.log(`✅ Updated ${files.length} files with ${totalChanges} total coordinate changes`);
