#!/usr/bin/env node

/**
 * Rename pioneer square room files to match their actual coordinates.
 *
 * Avenue directories (1st-ave-s, 2nd-ave-s, etc): files named by y coordinate
 * Street directories (yesler-way, s-main, etc): files named by x coordinate
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

function renameFilesInDirectory(dir, coordType) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && !f.includes('MAP'));
  const renames = [];

  // First pass: collect all renames needed
  for (const file of files) {
    const filePath = path.join(dir, file);
    const coords = getCoordinates(filePath);
    const coord = coordType === 'y' ? coords.y : coords.x;

    if (coord === null) continue;

    const newFileName = `${coordType}${coord}.ts`;
    if (file !== newFileName) {
      renames.push({
        oldPath: filePath,
        newPath: path.join(dir, newFileName),
        oldName: file,
        newName: newFileName
      });
    }
  }

  // Check for conflicts - if newPath already exists
  const existingFiles = new Set(files);
  const tempRenames = [];

  // Use temp names to avoid conflicts
  for (const r of renames) {
    if (existingFiles.has(r.newName) && r.oldName !== r.newName) {
      // Rename to temp first
      const tempPath = r.oldPath + '.tmp';
      tempRenames.push({
        ...r,
        tempPath
      });
    } else {
      tempRenames.push(r);
    }
  }

  // Execute renames in two passes to avoid conflicts
  let renamed = 0;

  // Pass 1: rename to temp files where needed
  for (const r of tempRenames) {
    if (r.tempPath) {
      fs.renameSync(r.oldPath, r.tempPath);
    }
  }

  // Pass 2: rename temp files and direct renames
  for (const r of tempRenames) {
    const sourcePath = r.tempPath || r.oldPath;
    if (fs.existsSync(sourcePath)) {
      // Check if target exists (shouldn't after temp rename)
      if (fs.existsSync(r.newPath) && sourcePath !== r.newPath) {
        console.log(`  ⚠ Conflict: ${r.newName} already exists, skipping ${r.oldName}`);
        // Restore temp file
        if (r.tempPath) {
          fs.renameSync(r.tempPath, r.oldPath);
        }
        continue;
      }
      fs.renameSync(sourcePath, r.newPath);
      renamed++;
    }
  }

  return renamed;
}

console.log('📁 Renaming Pioneer Square room files to match coordinates...\n');

const directories = [
  // Avenues: files named by y coordinate
  { name: '1st-ave-s', coord: 'y' },
  { name: '2nd-ave-s', coord: 'y' },
  { name: '3rd-ave-s', coord: 'y' },
  { name: '4th-ave-s', coord: 'y' },
  { name: 'occidental-ave-s', coord: 'y' },
  { name: 'waterfront', coord: 'y' },
  // Streets: files named by x coordinate
  { name: 'yesler-way', coord: 'x' },
  { name: 's-washington', coord: 'x' },
  { name: 's-main', coord: 'x' },
  { name: 's-jackson', coord: 'x' },
  { name: 's-king', coord: 'x' },
];

let totalRenamed = 0;

for (const { name, coord } of directories) {
  const dir = path.join(PIONEER_SQUARE_DIR, name);
  if (!fs.existsSync(dir)) {
    continue;
  }

  const count = renameFilesInDirectory(dir, coord);
  if (count > 0) {
    console.log(`  ${name}: ${count} files renamed`);
    totalRenamed += count;
  }
}

console.log(`\n✅ Total files renamed: ${totalRenamed}`);
