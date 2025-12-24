import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Directories to scan for world coordinates
const WORLD_DIRS = [
  '../src/database/bootstrap/world/seattle/pioneer-square/yesler-way',
  '../src/database/bootstrap/world/seattle/pioneer-square/occidental-park',
  '../src/database/bootstrap/world/seattle/pioneer-square/1st-ave-s',
  '../src/database/bootstrap/world/seattle/pioneer-square/buildings/smith-tower',
  '../src/database/bootstrap/world/seattle/pioneer-square/buildings/underground-complex',
];

function extractCoordsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const regex = /x:\s*(-?\d+),\s*y:\s*(-?\d+),\s*z:\s*(-?\d+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content))) {
    matches.push({
      x: parseInt(match[1]),
      y: parseInt(match[2]),
      z: parseInt(match[3]),
      file: path.basename(filePath),
    });
  }
  return matches;
}

function collectCoords(dirs) {
  let coords = [];
  for (const dir of dirs) {
    const absDir = path.join(__dirname, dir);
    if (!fs.existsSync(absDir)) continue;
    const files = fs.readdirSync(absDir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
      coords = coords.concat(extractCoordsFromFile(path.join(absDir, file)));
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

const allCoords = collectCoords(WORLD_DIRS);
const map = buildMap(allCoords);

// Print a few example levels
printMap(map, 10); // Smith Tower floor 10
printMap(map, -4); // Underground z=-4
printMap(map, 0);  // Surface (if any rooms at z=0)

// To print other levels, call printMap(map, zLevel);
