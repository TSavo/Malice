#!/usr/bin/env node

/**
 * Remove generated rooms that are in the wrong directory.
 *
 * 1st-ave-s should only have rooms at x=-14
 * 2nd-ave-s should only have rooms at x=0
 * etc.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIONEER_SQUARE_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

// Expected X coordinate for each avenue directory
const AVENUE_X = {
  'waterfront': -21,
  '1st-ave-s': -14,
  'occidental-ave-s': -7,
  '2nd-ave-s': 0,
  '3rd-ave-s': 7,
  '4th-ave-s': 14,
};

// Expected Y coordinate for each street directory
const STREET_Y = {
  's-king': -12,
  's-jackson': -6,
  's-main': 0,
  's-washington': 6,
  'yesler-way': 12,
};

function getCoordinates(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const xMatch = content.match(/x:\s*(-?\d+)/);
  const yMatch = content.match(/y:\s*(-?\d+)/);
  return {
    x: xMatch ? parseInt(xMatch[1]) : null,
    y: yMatch ? parseInt(yMatch[1]) : null
  };
}

console.log('🧹 Cleaning up misplaced room files...\n');

let removed = 0;

// Check avenue directories
for (const [dirName, expectedX] of Object.entries(AVENUE_X)) {
  const dir = path.join(PIONEER_SQUARE_DIR, dirName);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.includes('MAP'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const coords = getCoordinates(filePath);

    if (coords.x !== null && coords.x !== expectedX) {
      console.log(`  Removing ${dirName}/${file}: x=${coords.x} (expected x=${expectedX})`);
      fs.unlinkSync(filePath);
      removed++;
    }
  }
}

// Check street directories
for (const [dirName, expectedY] of Object.entries(STREET_Y)) {
  const dir = path.join(PIONEER_SQUARE_DIR, dirName);
  if (!fs.existsSync(dir)) continue;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.includes('MAP'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    const coords = getCoordinates(filePath);

    if (coords.y !== null && coords.y !== expectedY) {
      console.log(`  Removing ${dirName}/${file}: y=${coords.y} (expected y=${expectedY})`);
      fs.unlinkSync(filePath);
      removed++;
    }
  }
}

console.log(`\n✅ Removed ${removed} misplaced files`);
