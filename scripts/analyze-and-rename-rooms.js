#!/usr/bin/env node

/**
 * Analyze pioneer square room files:
 * 1. Check filename vs actual coordinates
 * 2. Identify files that need renaming
 * 3. Identify missing street rooms
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIONEER_SQUARE_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

function getCoordinates(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const xMatch = content.match(/x:\s*(-?\d+)/);
  const yMatch = content.match(/y:\s*(-?\d+)/);
  return {
    x: xMatch ? parseInt(xMatch[1]) : null,
    y: yMatch ? parseInt(yMatch[1]) : null
  };
}

function analyzeDirectory(dir, streetType) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.includes('MAP'));
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const coords = getCoordinates(filePath);

    // Parse expected coordinate from filename
    let expectedCoord;
    if (streetType === 'avenue') {
      // Files like y5.ts, y-3.ts
      const match = file.match(/y(-?\d+)\.ts/);
      expectedCoord = match ? parseInt(match[1]) : null;
    } else {
      // Files like x5.ts, x-3.ts
      const match = file.match(/x(-?\d+)\.ts/);
      expectedCoord = match ? parseInt(match[1]) : null;
    }

    results.push({
      file,
      actualX: coords.x,
      actualY: coords.y,
      expectedCoord,
      needsRename: streetType === 'avenue'
        ? (expectedCoord !== coords.y)
        : (expectedCoord !== coords.x)
    });
  }

  return results;
}

console.log('🔍 Analyzing Pioneer Square room files...\n');

// Analyze each street directory
const streets = [
  { name: '1st-ave-s', type: 'avenue' },
  { name: '2nd-ave-s', type: 'avenue' },
  { name: 'yesler-way', type: 'street' },
  { name: 's-washington', type: 'street' },
  { name: 's-main', type: 'street' },
  { name: 's-jackson', type: 'street' },
  { name: 's-king', type: 'street' },
];

let totalMismatches = 0;

for (const street of streets) {
  const dir = path.join(PIONEER_SQUARE_DIR, street.name);
  if (!fs.existsSync(dir)) {
    console.log(`⚠ Directory not found: ${street.name}`);
    continue;
  }

  const results = analyzeDirectory(dir, street.type);
  const mismatches = results.filter(r => r.needsRename);

  if (mismatches.length > 0) {
    console.log(`\n📁 ${street.name} (${mismatches.length} mismatches):`);
    for (const m of mismatches.slice(0, 10)) {
      const coordKey = street.type === 'avenue' ? 'y' : 'x';
      const actual = street.type === 'avenue' ? m.actualY : m.actualX;
      console.log(`  ${m.file}: expected ${coordKey}=${m.expectedCoord}, actual ${coordKey}=${actual}`);
    }
    if (mismatches.length > 10) {
      console.log(`  ... and ${mismatches.length - 10} more`);
    }
    totalMismatches += mismatches.length;
  }
}

console.log(`\n📊 Total files needing rename: ${totalMismatches}`);

// Check for missing 1st Ave rooms near Smith Tower
console.log('\n\n🏗️ Checking 1st Ave S coverage near Smith Tower (y=9 to y=12):');
const firstAveDir = path.join(PIONEER_SQUARE_DIR, '1st-ave-s');
const firstAveFiles = fs.readdirSync(firstAveDir).filter(f => f.endsWith('.ts'));

const existingYCoords = new Set();
for (const file of firstAveFiles) {
  const coords = getCoordinates(path.join(firstAveDir, file));
  if (coords.y !== null) existingYCoords.add(coords.y);
}

console.log('Existing 1st Ave S y-coordinates:', [...existingYCoords].sort((a,b) => a-b).join(', '));

const neededY = [9, 10, 11, 12];
const missingY = neededY.filter(y => !existingYCoords.has(y));
console.log('Missing y-coordinates for Smith Tower area:', missingY.length > 0 ? missingY.join(', ') : 'None');

// Check Yesler Way coverage
console.log('\n🏗️ Checking Yesler Way coverage near Smith Tower (x=-14 to x=-10):');
const yeslerDir = path.join(PIONEER_SQUARE_DIR, 'yesler-way');
const yeslerFiles = fs.readdirSync(yeslerDir).filter(f => f.endsWith('.ts'));

const existingXCoords = new Set();
for (const file of yeslerFiles) {
  const coords = getCoordinates(path.join(yeslerDir, file));
  if (coords.x !== null) existingXCoords.add(coords.x);
}

console.log('Existing Yesler Way x-coordinates:', [...existingXCoords].sort((a,b) => a-b).join(', '));

const neededX = [-14, -13, -12, -11, -10];
const missingX = neededX.filter(x => !existingXCoords.has(x));
console.log('Missing x-coordinates for Smith Tower area:', missingX.length > 0 ? missingX.join(', ') : 'None');
