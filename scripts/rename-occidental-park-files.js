#!/usr/bin/env node

/**
 * Rename Occidental Park files to match their actual coordinates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parkDir = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square/occidental-park');

const files = fs.readdirSync(parkDir).filter(f => f.endsWith('.ts'));

console.log(`Analyzing ${files.length} files...\n`);

const renames = [];

for (const file of files) {
  const filePath = path.join(parkDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const xMatch = content.match(/^\s*x:\s*(-?\d+),/m);
  const yMatch = content.match(/^\s*y:\s*(\d+),/m);

  if (!xMatch || !yMatch) {
    console.log(`SKIP: ${file} - no coordinates found`);
    continue;
  }

  const x = parseInt(xMatch[1]);
  const y = parseInt(yMatch[1]);

  const expectedName = `x${x}-y${y}.ts`;

  if (file !== expectedName) {
    renames.push({ oldName: file, newName: expectedName, x, y });
  }
}

if (renames.length === 0) {
  console.log('All files already have correct names!');
  process.exit(0);
}

console.log(`Found ${renames.length} files to rename:\n`);

// Sort by coordinates
renames.sort((a, b) => a.x - b.x || a.y - b.y);

// Check for conflicts
const newNames = new Set();
for (const r of renames) {
  if (newNames.has(r.newName)) {
    console.error(`CONFLICT: Multiple files would be named ${r.newName}`);
    process.exit(1);
  }
  newNames.add(r.newName);
}

// Also check against existing files that won't be renamed
const existingNames = new Set(files);
for (const r of renames) {
  if (existingNames.has(r.newName) && !renames.some(x => x.oldName === r.newName)) {
    console.error(`CONFLICT: ${r.newName} already exists and won't be renamed`);
    process.exit(1);
  }
}

// Do renames in two passes to avoid conflicts
// First pass: rename to temp names
for (const r of renames) {
  const oldPath = path.join(parkDir, r.oldName);
  const tempPath = path.join(parkDir, `_temp_${r.newName}`);
  fs.renameSync(oldPath, tempPath);
}

// Second pass: rename from temp to final
for (const r of renames) {
  const tempPath = path.join(parkDir, `_temp_${r.newName}`);
  const newPath = path.join(parkDir, r.newName);
  fs.renameSync(tempPath, newPath);
  console.log(`${r.oldName} → ${r.newName}`);
}

console.log(`\nRenamed ${renames.length} files.`);
