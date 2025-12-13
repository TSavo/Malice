#!/usr/bin/env node

/**
 * Find missing rooms - check that all expected coordinates have rooms
 *
 * Expected grid:
 * - Avenues (fixed X): Waterfront=-21, 1st=-14, Occidental=-7, 2nd=0, 3rd=+7, 4th=+14
 * - Streets (fixed Y): King=-12, Jackson=-6, Main=0, Washington=+6, Yesler=+12
 * - Y range: -12 to +12
 * - X range: -21 to +14
 *
 * Blocked areas:
 * - Smith Tower: x=-13 to -10, y=+9 to +11
 * - Pioneer Building: x=+1 to +4, y=+8 to +10
 * - Grand Central: x=-13 to -10, y=+2 to +4
 * - Corp Construction: x=0 to +6, y=+1 to +4
 * - Collapsed Building: x=+9 to +14, y=+7 to +10
 * - Sinkhole: x=-18 to -15, y=-9 to -7
 * - Condemned Block: x=+9 to +12, y=-9 to -7
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pioneerSquareDir = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

// Collect all existing coordinates
const existingCoords = new Set();

function extractCoords(content) {
  const xMatch = content.match(/^\s*x:\s*(-?\d+),/m);
  const yMatch = content.match(/^\s*y:\s*(-?\d+),/m);
  return {
    x: xMatch ? parseInt(xMatch[1]) : null,
    y: yMatch ? parseInt(yMatch[1]) : null,
  };
}

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'buildings') continue; // Skip buildings
      scanDirectory(fullPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.startsWith('index')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const coords = extractCoords(content);
      if (coords.x !== null && coords.y !== null) {
        existingCoords.add(`${coords.x},${coords.y}`);
      }
    }
  }
}

function isBlocked(x, y) {
  // Smith Tower: x=-13 to -10, y=+9 to +11
  if (x >= -13 && x <= -10 && y >= 9 && y <= 11) return 'Smith Tower';

  // Pioneer Building: x=+1 to +4, y=+8 to +10
  if (x >= 1 && x <= 4 && y >= 8 && y <= 10) return 'Pioneer Building';

  // Grand Central: x=-13 to -10, y=+2 to +4
  if (x >= -13 && x <= -10 && y >= 2 && y <= 4) return 'Grand Central';

  // Corp Construction: x=0 to +6, y=+1 to +4
  if (x >= 0 && x <= 6 && y >= 1 && y <= 4) return 'Corp Construction';

  // Collapsed Building: x=+9 to +14, y=+7 to +10
  if (x >= 9 && x <= 14 && y >= 7 && y <= 10) return 'Collapsed Building';

  // Sinkhole: x=-18 to -14, y=-9 to -7 (extends to block 1st Ave)
  if (x >= -18 && x <= -14 && y >= -9 && y <= -7) return 'Sinkhole';

  // Condemned Block: x=+9 to +12, y=-9 to -7
  if (x >= 9 && x <= 12 && y >= -9 && y <= -7) return 'Condemned Block';

  return null;
}

console.log('Scanning existing rooms...\n');
scanDirectory(pioneerSquareDir);
console.log(`Found ${existingCoords.size} rooms\n`);

// Check avenues for missing rooms
const avenues = [
  { name: '1st Ave S', x: -14 },
  { name: 'Occidental Ave S', x: -7 },
  { name: '2nd Ave S', x: 0 },
  { name: '3rd Ave S', x: 7 },
  { name: '4th Ave S', x: 14 },
  { name: 'Waterfront', x: -21 },
];

// Check streets for missing rooms
const streets = [
  { name: 'S. King', y: -12 },
  { name: 'S. Jackson', y: -6 },
  { name: 'S. Main', y: 0 },
  { name: 'S. Washington', y: 6 },
  { name: 'Yesler Way', y: 12 },
];

const missingAvenues = [];
const missingStreets = [];

// Check avenues (Y from -12 to +12, excluding street intersections handled by streets)
for (const ave of avenues) {
  for (let y = -12; y <= 12; y++) {
    const key = `${ave.x},${y}`;
    const blocked = isBlocked(ave.x, y);

    if (!existingCoords.has(key) && !blocked) {
      missingAvenues.push({ name: ave.name, x: ave.x, y });
    }
  }
}

// Check streets (X from -21 to +14)
for (const street of streets) {
  for (let x = -21; x <= 14; x++) {
    const key = `${x},${street.y}`;
    const blocked = isBlocked(x, street.y);

    if (!existingCoords.has(key) && !blocked) {
      missingStreets.push({ name: street.name, x, y: street.y });
    }
  }
}

console.log('=== MISSING AVENUE ROOMS ===');
if (missingAvenues.length === 0) {
  console.log('None!\n');
} else {
  // Group by avenue
  const byAvenue = {};
  for (const m of missingAvenues) {
    if (!byAvenue[m.name]) byAvenue[m.name] = [];
    byAvenue[m.name].push(m.y);
  }
  for (const [name, ys] of Object.entries(byAvenue)) {
    console.log(`${name}: missing y=${ys.join(', ')}`);
  }
  console.log(`\nTotal: ${missingAvenues.length} missing\n`);
}

console.log('=== MISSING STREET ROOMS ===');
if (missingStreets.length === 0) {
  console.log('None!\n');
} else {
  // Group by street
  const byStreet = {};
  for (const m of missingStreets) {
    if (!byStreet[m.name]) byStreet[m.name] = [];
    byStreet[m.name].push(m.x);
  }
  for (const [name, xs] of Object.entries(byStreet)) {
    console.log(`${name}: missing x=${xs.join(', ')}`);
  }
  console.log(`\nTotal: ${missingStreets.length} missing\n`);
}
