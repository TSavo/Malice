#!/usr/bin/env node

/**
 * Final fix for Occidental Park:
 * 1. Change x1-*.ts files from x=0 to x=-5 (fill the gap)
 * 2. Delete x2-*.ts files (they're beyond park boundary)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parkDir = path.join(__dirname, '../src/database/bootstrap/world/seattle/pioneer-square/occidental-park');

// 1. Fix x1-*.ts files (change x=0 to x=-5)
const x1Files = fs.readdirSync(parkDir).filter(f => f.startsWith('x1-'));
console.log('Fixing x1-*.ts files (x=0 → x=-5):');
for (const file of x1Files) {
  const filePath = path.join(parkDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/^(\s*x:\s*)0,/m, '$1-5,');
  fs.writeFileSync(filePath, content);
  console.log(`  Fixed: ${file}`);
}

// 2. Delete x2-*.ts files
const x2Files = fs.readdirSync(parkDir).filter(f => f.startsWith('x2-'));
console.log('\nDeleting x2-*.ts files (x=1, beyond park boundary):');
for (const file of x2Files) {
  const filePath = path.join(parkDir, file);
  fs.unlinkSync(filePath);
  console.log(`  Deleted: ${file}`);
}

// 3. Verify final state
console.log('\n--- Verification ---');
const remainingFiles = fs.readdirSync(parkDir).filter(f => f.endsWith('.ts'));
console.log(`Files remaining: ${remainingFiles.length}`);

const xCoords = new Set();
const yCoords = new Set();

for (const file of remainingFiles) {
  const content = fs.readFileSync(path.join(parkDir, file), 'utf8');
  const xMatch = content.match(/^\s*x:\s*(-?\d+),/m);
  const yMatch = content.match(/^\s*y:\s*(\d+),/m);
  if (xMatch) xCoords.add(parseInt(xMatch[1]));
  if (yMatch) yCoords.add(parseInt(yMatch[1]));
}

const sortedX = [...xCoords].sort((a, b) => a - b);
const sortedY = [...yCoords].sort((a, b) => a - b);

console.log(`X range: ${sortedX.join(', ')}`);
console.log(`Y range: ${sortedY.join(', ')}`);
console.log(`\nExpected: x = -6 to -1, y = 1 to 4 (24 rooms)`);
console.log(`Actual: ${remainingFiles.length} files`);
