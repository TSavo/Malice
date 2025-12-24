import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Root directory for world files
const WORLD_ROOT = path.join(__dirname, '../src/database/bootstrap/world');

function extractCoordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /x:\s*(-?\d+),\s*y:\s*(-?\d+),\s*z:\s*(-?\d+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content))) {
    const relativePath = path.relative(WORLD_ROOT, filePath);
    matches.push({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      z: parseInt(match[3]),
      file: path.basename(filePath),
      path: relativePath,
    });
  }
  return matches;
}

function scanDirectory(dir) {
  let coords = [];
  if (!fs.existsSync(dir)) return coords;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Recurse into subdirectories
      coords = coords.concat(scanDirectory(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      coords = coords.concat(extractCoordsFromFile(fullPath));
    }
  }
  return coords;
}

function buildMap(coords) {
  // Group by z, then y, then x
  const map = {};
  for (const { x, y, z, file } of coords) {
    if (!map[z]) map[z] = {};
    if (!map[z][y]) map[z][y] = {};
    map[z][y][x] = file;
  }
  return map;
}

function printMap(map, zLevel) {
  const level = map[zLevel];
  if (!level) {
    console.log(`No data for z=${zLevel}`);
    return;
  }
  const xs = Array.from(
    new Set(Object.values(level).flatMap(row => Object.keys(row).map(Number)))
  ).sort((a, b) => a - b);
  const ys = Object.keys(level)
    .map(Number)
    .sort((a, b) => b - a); // Print top to bottom
  console.log(`Map for z=${zLevel}`);
  for (const y of ys) {
    let row = '';
    for (const x of xs) {
      row += level[y][x] ? '■ ' : '. ';
    }
    console.log(row + ` y=${y}`);
  }
  console.log('x:', xs.join(' '));
}

console.log(`Scanning world directory: ${WORLD_ROOT}\n`);
const allCoords = scanDirectory(WORLD_ROOT);
console.log(`Found ${allCoords.length} coordinate entries\n`);
const map = buildMap(allCoords);

// Show available z-levels
const zLevels = Object.keys(map).map(Number).sort((a, b) => b - a);
console.log(`Available z-levels: ${zLevels.join(', ')}`);
console.log(`Range: ${Math.min(...zLevels)} to ${Math.max(...zLevels)}\n`);

// Print statistics for each level
console.log('=== Level Statistics ===');
for (const z of zLevels) {
  const roomCount = Object.values(map[z]).reduce((sum, row) => sum + Object.keys(row).length, 0);
  console.log(`z=${z.toString().padStart(3)}: ${roomCount.toString().padStart(4)} rooms`);
}
console.log();

// Print maps for key levels
printMap(map, 0);   // Surface
printMap(map, -1);  // Underground level 1
printMap(map, -4);  // Underground level 4
printMap(map, 1);   // Smith Tower floor 1
printMap(map, 10);  // Smith Tower floor 10

// To print other levels, call printMap(map, zLevel);
