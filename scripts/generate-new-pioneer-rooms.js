#!/usr/bin/env node

/**
 * Generate new Pioneer Square room files for the expanded grid.
 *
 * New spacing creates additional coordinates that need rooms:
 * - Avenues at x = -21, -14, -7, 0, +7, +14
 * - Streets at y = -12, -6, 0, +6, +12
 *
 * Between each avenue pair (7 apart), there are 6 rooms at x+1 through x+6
 * Between each street pair (6 apart), there are 5 rooms at y+1 through y+5
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIONEER_SQUARE_DIR = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square');

// Avenue names by X coordinate
const AVENUES = {
  '-21': 'Waterfront',
  '-14': '1st Ave S',
  '-7': 'Occidental Ave S',
  '0': '2nd Ave S',
  '7': '3rd Ave S',
  '14': '4th Ave S'
};

// Street names by Y coordinate
const STREETS = {
  '-12': 'S. King St',
  '-6': 'S. Jackson St',
  '0': 'S. Main St',
  '6': 'S. Washington St',
  '12': 'Yesler Way'
};

// Get avenue directory name
function getAvenueDir(x) {
  if (x <= -18) return 'waterfront';
  if (x <= -11) return '1st-ave-s';
  if (x <= -4) return 'occidental-ave-s';
  if (x <= 3) return '2nd-ave-s';
  if (x <= 10) return '3rd-ave-s';
  return '4th-ave-s';
}

// Check if coordinate exists
function roomExists(x, y) {
  const dir = path.join(PIONEER_SQUARE_DIR, getAvenueDir(x));
  if (!fs.existsSync(dir)) return false;

  const filename = `y${y >= 0 ? '' : ''}${y}.ts`;
  const filepath = path.join(dir, filename);

  if (!fs.existsSync(filepath)) return false;

  // Check if x coordinate matches
  const content = fs.readFileSync(filepath, 'utf8');
  const xMatch = content.match(/x:\s*(-?\d+)/);
  if (!xMatch) return false;

  return parseInt(xMatch[1]) === x;
}

// Collect all existing coordinates
function collectExistingCoordinates() {
  const coords = new Set();

  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.includes('MAP')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const xMatch = content.match(/x:\s*(-?\d+)/);
        const yMatch = content.match(/y:\s*(-?\d+)/);
        if (xMatch && yMatch) {
          coords.add(`${xMatch[1]},${yMatch[1]}`);
        }
      }
    }
  }

  scanDir(PIONEER_SQUARE_DIR);
  return coords;
}

// Get location description based on nearby landmarks
function getLocationContext(x, y) {
  // Find nearest avenue
  let nearestAve = -21;
  for (const aveX of [-21, -14, -7, 0, 7, 14]) {
    if (Math.abs(x - aveX) < Math.abs(x - nearestAve)) {
      nearestAve = aveX;
    }
  }

  // Find nearest street
  let nearestStreet = -12;
  for (const stY of [-12, -6, 0, 6, 12]) {
    if (Math.abs(y - stY) < Math.abs(y - nearestStreet)) {
      nearestStreet = stY;
    }
  }

  const aveName = AVENUES[String(nearestAve)] || 'the avenue';
  const stName = STREETS[String(nearestStreet)] || 'the street';

  return { aveName, stName, nearestAve, nearestStreet };
}

// Generate room content for a new coordinate
function generateRoomContent(x, y) {
  const { aveName, stName, nearestAve, nearestStreet } = getLocationContext(x, y);

  // Determine room type
  const isOnAvenue = [-21, -14, -7, 0, 7, 14].includes(x);
  const isOnStreet = [-12, -6, 0, 6, 12].includes(y);
  const isIntersection = isOnAvenue && isOnStreet;

  let name, description;

  if (isIntersection) {
    name = `${aveName} & ${stName}`;
    description = `The intersection of ${aveName} and ${stName}. Cracked asphalt and faded crosswalk lines mark where two streets meet. A traffic light hangs overhead, dark and powerless.`;
  } else if (isOnAvenue) {
    name = aveName;
    description = `A stretch of ${aveName} between ${stName} and the next cross street. The sidewalk is cracked, weeds pushing through. Empty storefronts line the street, their windows dark.`;
  } else if (isOnStreet) {
    name = stName;
    description = `${stName} runs east-west here, the pavement cracked and weathered. Buildings rise on either side, their facades stained by decades of rain and neglect.`;
  } else {
    // Interior block - sidewalk/plaza area
    const distFromAve = Math.abs(x - nearestAve);
    const distFromSt = Math.abs(y - nearestStreet);

    if (distFromAve === 1 || distFromAve === 6) {
      name = `Near ${aveName}`;
      description = `The sidewalk along ${aveName}, between ${stName} and the next intersection. Concrete is cracked and uneven. The buildings here show their age—brick facades weathered, windows dark or boarded.`;
    } else if (distFromSt === 1 || distFromSt === 5) {
      name = `Near ${stName}`;
      description = `A narrow passage between buildings, running parallel to ${stName}. The alley is shadowed and quiet, littered with debris that no one has cleared in decades.`;
    } else {
      name = 'Pioneer Square Block';
      description = `Deep within a Pioneer Square block, surrounded by the backs of buildings. Fire escapes zigzag overhead. The space is shadowed, forgotten, a gap between structures that the city once filled with purpose.`;
    }
  }

  return `// Generated room for new grid spacing
// Coordinate: (${x}, ${y})

export const room = {
  name: '${name.replace(/'/g, "\\'")}',
  description: \`${description}\`,
  x: ${x},
  y: ${y},
  z: 0,
  // Environmental properties
  population: 0,
  ambientNoise: 5,
  lighting: ${isOnAvenue || isOnStreet ? 70 : 40},
  waterLevel: 0,
  outdoor: true,
};
`;
}

// Main
console.log('🏗️  Generating new Pioneer Square rooms for expanded grid...');
console.log('');

const existingCoords = collectExistingCoordinates();
console.log(`Found ${existingCoords.size} existing room coordinates`);

// Calculate all coordinates that should exist
const allCoords = [];
for (let x = -21; x <= 14; x++) {
  for (let y = -12; y <= 12; y++) {
    allCoords.push({ x, y });
  }
}

// Find missing coordinates
const missingCoords = allCoords.filter(({ x, y }) => !existingCoords.has(`${x},${y}`));
console.log(`Found ${missingCoords.length} missing coordinates`);

// Generate files for missing coordinates
let created = 0;
for (const { x, y } of missingCoords) {
  const dir = path.join(PIONEER_SQUARE_DIR, getAvenueDir(x));

  // Create directory if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Created directory: ${path.relative(PIONEER_SQUARE_DIR, dir)}`);
  }

  const filename = `y${y}.ts`;
  const filepath = path.join(dir, filename);

  // Skip if file already exists (might have different x)
  if (fs.existsSync(filepath)) {
    // Check what x it has
    const content = fs.readFileSync(filepath, 'utf8');
    const xMatch = content.match(/x:\s*(-?\d+)/);
    if (xMatch) {
      console.log(`  ⚠ File exists with different x: ${filename} has x=${xMatch[1]}, need x=${x}`);
    }
    continue;
  }

  const content = generateRoomContent(x, y);
  fs.writeFileSync(filepath, content, 'utf8');
  created++;
}

console.log('');
console.log(`✅ Created ${created} new room files`);
