#!/usr/bin/env node

/**
 * Remap Pioneer Square room coordinates from old spacing to new spacing.
 *
 * Old: Avenues 6 apart, Streets 5 apart
 * New: Avenues 7 apart, Streets 6 apart
 *
 * This script:
 * 1. Updates x/y coordinates in all pioneer-square room files
 * 2. Creates new room files for the additional grid points
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIONEER_SQUARE_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

// Old avenue X coordinates -> New
const X_MAP = {
  '-15': -21, '-14': -20, '-13': -19, '-12': -18, '-11': -17, '-10': -16,
  '-9': -14, '-8': -13, '-7': -12, '-6': -11, '-5': -10, '-4': -9,
  '-3': -7, '-2': -6, '-1': -5, '0': -4, '1': -3, '2': -2,
  '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5,
  '9': 7, '10': 8, '11': 9, '12': 10, '13': 11, '14': 12,
  '15': 14
};

// Old street Y coordinates -> New
const Y_MAP = {
  '-10': -12, '-9': -11, '-8': -10, '-7': -9, '-6': -8,
  '-5': -6, '-4': -5, '-3': -4, '-2': -3, '-1': -2,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 6, '6': 7, '7': 8, '8': 9, '9': 10,
  '10': 12
};

function transformX(oldX) {
  const key = String(oldX);
  if (key in X_MAP) return X_MAP[key];

  // For values outside the defined range, scale proportionally
  // Old spacing: 6 apart, New spacing: 7 apart
  // Find which block it's in and interpolate
  const oldNum = parseInt(oldX);

  // Determine which avenue block we're in
  if (oldNum <= -15) return Math.round((oldNum + 15) * (7/6) - 21);
  if (oldNum <= -9) return Math.round((oldNum + 9) * (7/6) - 14);
  if (oldNum <= -3) return Math.round((oldNum + 3) * (7/6) - 7);
  if (oldNum <= 3) return Math.round((oldNum - 3) * (7/6) + 0);
  if (oldNum <= 9) return Math.round((oldNum - 9) * (7/6) + 7);
  return Math.round((oldNum - 15) * (7/6) + 14);
}

function transformY(oldY) {
  const key = String(oldY);
  if (key in Y_MAP) return Y_MAP[key];

  const oldNum = parseInt(oldY);

  // Determine which street block we're in
  if (oldNum <= -10) return Math.round((oldNum + 10) * (6/5) - 12);
  if (oldNum <= -5) return Math.round((oldNum + 5) * (6/5) - 6);
  if (oldNum <= 0) return Math.round(oldNum * (6/5));
  if (oldNum <= 5) return Math.round(oldNum * (6/5));
  if (oldNum <= 10) return Math.round((oldNum - 5) * (6/5) + 6);
  return Math.round((oldNum - 10) * (6/5) + 12);
}

function updateRoomFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Match x: <number> and y: <number>
  const xMatch = content.match(/x:\s*(-?\d+)/);
  const yMatch = content.match(/y:\s*(-?\d+)/);

  if (!xMatch || !yMatch) {
    console.log(`  ⚠ No coordinates found: ${path.basename(filePath)}`);
    return { updated: false };
  }

  const oldX = parseInt(xMatch[1]);
  const oldY = parseInt(yMatch[1]);
  const newX = transformX(oldX);
  const newY = transformY(oldY);

  if (oldX === newX && oldY === newY) {
    return { updated: false, oldX, oldY, newX, newY };
  }

  // Replace coordinates
  content = content.replace(/x:\s*(-?\d+)/, `x: ${newX}`);
  content = content.replace(/y:\s*(-?\d+)/, `y: ${newY}`);

  fs.writeFileSync(filePath, content, 'utf8');

  return { updated: true, oldX, oldY, newX, newY };
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  const changes = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const result = processDirectory(fullPath);
      count += result.count;
      changes.push(...result.changes);
    } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('MAP')) {
      const result = updateRoomFile(fullPath);
      if (result.updated) {
        count++;
        changes.push({
          file: path.relative(PIONEER_SQUARE_DIR, fullPath),
          oldX: result.oldX,
          oldY: result.oldY,
          newX: result.newX,
          newY: result.newY
        });
      }
    }
  }

  return { count, changes };
}

console.log('🗺️  Remapping Pioneer Square coordinates...');
console.log('');
console.log('Old spacing: Avenues 6 apart, Streets 5 apart');
console.log('New spacing: Avenues 7 apart, Streets 6 apart');
console.log('');

const { count, changes } = processDirectory(PIONEER_SQUARE_DIR);

console.log(`✅ Updated ${count} room files`);
console.log('');

if (changes.length > 0 && changes.length <= 20) {
  console.log('Changes:');
  for (const c of changes) {
    console.log(`  ${c.file}: (${c.oldX}, ${c.oldY}) → (${c.newX}, ${c.newY})`);
  }
} else if (changes.length > 20) {
  console.log(`First 20 changes:`);
  for (const c of changes.slice(0, 20)) {
    console.log(`  ${c.file}: (${c.oldX}, ${c.oldY}) → (${c.newX}, ${c.newY})`);
  }
  console.log(`  ... and ${changes.length - 20} more`);
}
