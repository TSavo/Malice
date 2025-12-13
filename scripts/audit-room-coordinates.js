#!/usr/bin/env node

/**
 * Audit all room coordinates to check they match expected positions
 *
 * Expected coordinates:
 * - Avenues: Waterfront=-21, 1st=-14, Occidental=-7, 2nd=0, 3rd=+7, 4th=+14
 * - Streets: King=-12, Jackson=-6, Main=0, Washington=+6, Yesler=+12
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pioneerSquareDir = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

// Expected X coordinates for avenues
const avenueX = {
  'waterfront': -21,
  '1st-ave-s': -14,
  'occidental-ave-s': -7,
  '2nd-ave-s': 0,
  '3rd-ave-s': 7,
  '4th-ave-s': 14,
};

// Expected Y coordinates for streets
const streetY = {
  's-king': -12,
  's-jackson': -6,
  's-main': 0,
  's-washington': 6,
  'yesler-way': 12,
};

const issues = [];
const stats = { total: 0, correct: 0, wrong: 0, noCoords: 0 };

function extractCoords(content) {
  const xMatch = content.match(/^\s*x:\s*(-?\d+),/m);
  const yMatch = content.match(/^\s*y:\s*(-?\d+),/m);
  return {
    x: xMatch ? parseInt(xMatch[1]) : null,
    y: yMatch ? parseInt(yMatch[1]) : null,
  };
}

function checkDirectory(dir, relativePath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      // Skip buildings for now - they have their own coordinate systems
      if (entry.name === 'buildings') continue;
      checkDirectory(fullPath, relPath);
    } else if (entry.name.endsWith('.ts') && !entry.name.startsWith('index')) {
      checkFile(fullPath, relPath);
    }
  }
}

function checkFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const coords = extractCoords(content);

  stats.total++;

  if (coords.x === null || coords.y === null) {
    stats.noCoords++;
    return;
  }

  const parts = relativePath.split(path.sep);
  const dirName = parts[0];
  const fileName = parts[parts.length - 1];

  let expectedX = null;
  let expectedY = null;
  let issue = null;

  // Check avenues (should have fixed X, variable Y from filename)
  if (avenueX[dirName] !== undefined) {
    expectedX = avenueX[dirName];
    if (coords.x !== expectedX) {
      issue = `Avenue ${dirName}: expected x=${expectedX}, got x=${coords.x}`;
    }
  }

  // Check streets (should have fixed Y, variable X from filename)
  if (streetY[dirName] !== undefined) {
    expectedY = streetY[dirName];
    if (coords.y !== expectedY) {
      issue = `Street ${dirName}: expected y=${expectedY}, got y=${coords.y}`;
    }
  }

  // Check occidental-park (should be x=-6 to -1, y=1 to 4)
  if (dirName === 'occidental-park') {
    if (coords.x < -6 || coords.x > -1) {
      issue = `Occidental Park: x=${coords.x} out of range -6 to -1`;
    }
    if (coords.y < 1 || coords.y > 4) {
      issue = `Occidental Park: y=${coords.y} out of range 1 to 4`;
    }
  }

  if (issue) {
    issues.push({ file: relativePath, coords, issue });
    stats.wrong++;
  } else {
    stats.correct++;
  }
}

console.log('Auditing room coordinates...\n');
checkDirectory(pioneerSquareDir);

console.log('=== STATISTICS ===');
console.log(`Total files: ${stats.total}`);
console.log(`Correct: ${stats.correct}`);
console.log(`Wrong: ${stats.wrong}`);
console.log(`No coordinates: ${stats.noCoords}`);

if (issues.length > 0) {
  console.log('\n=== ISSUES FOUND ===\n');
  for (const issue of issues) {
    console.log(`${issue.file}`);
    console.log(`  Coords: (${issue.coords.x}, ${issue.coords.y})`);
    console.log(`  Issue: ${issue.issue}`);
    console.log('');
  }
} else {
  console.log('\nNo coordinate issues found!');
}
