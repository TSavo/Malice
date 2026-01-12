#!/usr/bin/env bun
/**
 * Recovery script to add imageOnDisk to building files for images already generated.
 *
 * Scans assets/images/ for building-related images and updates the source files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const ASSETS_DIR = path.join(process.cwd(), 'assets/images');
const BUILDINGS_DIR = path.join(
  process.cwd(),
  'src/database/bootstrap/world/seattle/pioneer-square/buildings',
);

interface BuildingRoom {
  name: string;
  x: number;
  y: number;
  z: number;
  imageOnDisk?: string;
}

interface BuildingFile {
  filePath: string;
  rooms: Map<string, BuildingRoom>; // placeholder -> room
}

async function main() {
  console.log('🔍 Scanning building files...');

  // Load all building files and their rooms
  const buildingFiles: BuildingFile[] = [];
  const buildings = fs
    .readdirSync(BUILDINGS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const building of buildings) {
    const buildingDir = path.join(BUILDINGS_DIR, building);
    const files = fs.readdirSync(buildingDir).filter((f) => f.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(buildingDir, file);
      try {
        const module = await import(pathToFileURL(filePath).href);
        if (module.building?.rooms) {
          const rooms = new Map<string, BuildingRoom>();
          for (const [placeholder, roomDef] of Object.entries(
            module.building.rooms,
          )) {
            const room = roomDef as BuildingRoom;
            rooms.set(placeholder, room);
          }
          buildingFiles.push({ filePath, rooms });
        }
      } catch {
        // Skip files that can't be imported
      }
    }
  }

  console.log(`📁 Found ${buildingFiles.length} building files`);

  // Scan existing images
  const imageFiles = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.endsWith('.png'));
  console.log(`🖼️  Found ${imageFiles.length} images`);

  // Build a map of coordinates -> image filename
  const coordToImage = new Map<string, string>();
  for (const img of imageFiles) {
    // Parse coordinates from filename: name-xN-yN-zN.png
    const match = img.match(/-x(-?\d+)-y(-?\d+)-z(-?\d+)\.png$/);
    if (match) {
      const key = `${match[1]},${match[2]},${match[3]}`;
      coordToImage.set(key, img);
    }
  }

  console.log(`📍 Mapped ${coordToImage.size} images to coordinates`);

  // Find building rooms that have images but no imageOnDisk
  let updated = 0;
  let alreadySet = 0;
  let noImage = 0;

  for (const { filePath, rooms } of buildingFiles) {
    let fileModified = false;
    let content = fs.readFileSync(filePath, 'utf-8');

    for (const [placeholder, room] of rooms) {
      if (room.imageOnDisk) {
        alreadySet++;
        continue;
      }

      const key = `${room.x},${room.y},${room.z}`;
      const imageFilename = coordToImage.get(key);

      if (!imageFilename) {
        noImage++;
        continue;
      }

      // Add imageOnDisk to this room in the file
      // Pattern: 'placeholder': { ... z: N, ... }
      const escapedPlaceholder = placeholder.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&',
      );
      const roomKeyPattern = new RegExp(
        `('${escapedPlaceholder}':\\s*\\{[^}]*?)(z:\\s*-?\\d+,?)`,
        's',
      );
      const match = content.match(roomKeyPattern);

      if (match) {
        const replacement = `${match[1]}${match[2]}\n      imageOnDisk: '${imageFilename}',`;
        content = content.replace(roomKeyPattern, replacement);
        fileModified = true;
        updated++;
        console.log(`  ✅ ${placeholder} -> ${imageFilename}`);
      } else {
        console.log(`  ⚠️  Could not find ${placeholder} in ${filePath}`);
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, content);
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Updated: ${updated}`);
  console.log(`⏭️  Already set: ${alreadySet}`);
  console.log(`❌ No image: ${noImage}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
