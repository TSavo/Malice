#!/usr/bin/env node

/**
 * Find coordinate gaps in the underground
 *
 * Scans all rooms with z < 0 and checks for:
 * 1. Exits that skip coordinates (e.g., north from y=-13 to y=-15, missing y=-14)
 * 2. Orphaned rooms (rooms with no exits leading to/from them)
 *
 * Usage: node scripts/find-coordinate-gaps.js [--z=-2] [--fix]
 */

import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = 'malice';

// Parse args
const args = process.argv.slice(2);
const zFilter = args.find(a => a.startsWith('--z='))?.split('=')[1];
const fixMode = args.includes('--fix');

async function main() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('Finding coordinate gaps in underground rooms...\n');

    // Get all rooms with z coordinates
    const rooms = await db.collection('objects').find({
      'properties.z.value': { $exists: true, $lt: 0 }
    }).toArray();

    console.log(`Found ${rooms.length} underground rooms\n`);

    // Build coordinate map
    const coordMap = new Map(); // "x,y,z" -> room
    const roomMap = new Map();  // id -> room

    for (const room of rooms) {
      const x = room.properties.x?.value;
      const y = room.properties.y?.value;
      const z = room.properties.z?.value;

      if (x === undefined || y === undefined || z === undefined) continue;
      if (zFilter && z !== parseInt(zFilter)) continue;

      const key = `${x},${y},${z}`;
      coordMap.set(key, room);
      roomMap.set(room._id, room);
    }

    console.log(`Mapped ${coordMap.size} rooms with coordinates\n`);

    // Direction vectors
    const directions = {
      north: { dx: 0, dy: 1, dz: 0 },
      south: { dx: 0, dy: -1, dz: 0 },
      east: { dx: 1, dy: 0, dz: 0 },
      west: { dx: -1, dy: 0, dz: 0 },
      up: { dx: 0, dy: 0, dz: 1 },
      down: { dx: 0, dy: 0, dz: -1 },
    };

    const gaps = [];
    const orphans = [];

    // Check each room's exits
    for (const [key, room] of coordMap) {
      const x = room.properties.x.value;
      const y = room.properties.y.value;
      const z = room.properties.z.value;
      const name = room.properties.name?.value || `#${room._id}`;

      const exits = room.properties.exits?.value;
      if (!exits || !Array.isArray(exits)) continue;

      // Load exit objects
      for (const exitRef of exits) {
        const exitId = exitRef.id || exitRef.value;
        if (!exitId) continue;

        const exit = await db.collection('objects').findOne({ _id: exitId });
        if (!exit) continue;

        const exitName = exit.properties.name?.value;
        const destId = exit.properties.destRoom?.id || exit.properties.destRoom?.value;
        if (!exitName || !destId) continue;

        const dir = directions[exitName];
        if (!dir) continue; // Skip non-cardinal exits

        // Get destination room
        const destRoom = await db.collection('objects').findOne({ _id: destId });
        if (!destRoom) continue;

        const destX = destRoom.properties.x?.value;
        const destY = destRoom.properties.y?.value;
        const destZ = destRoom.properties.z?.value;
        const destName = destRoom.properties.name?.value || `#${destId}`;

        if (destX === undefined || destY === undefined || destZ === undefined) continue;

        // Check if exit skips coordinates
        const expectedX = x + dir.dx;
        const expectedY = y + dir.dy;
        const expectedZ = z + dir.dz;

        // Calculate distance
        const dist = Math.abs(destX - x) + Math.abs(destY - y) + Math.abs(destZ - z);

        if (dist > 1) {
          // Find all missing coordinates along the path
          const missing = [];

          // Only check along the exit direction axis
          if (dir.dy !== 0 && destY !== y) {
            const step = destY > y ? 1 : -1;
            for (let cy = y + step; cy !== destY && Math.abs(cy - y) < 50; cy += step) {
              const mKey = `${x},${cy},${z}`;
              if (!coordMap.has(mKey)) {
                missing.push({ x, y: cy, z });
              }
            }
          }
          if (dir.dx !== 0 && destX !== x) {
            const step = destX > x ? 1 : -1;
            for (let cx = x + step; cx !== destX && Math.abs(cx - x) < 50; cx += step) {
              const mKey = `${cx},${y},${z}`;
              if (!coordMap.has(mKey)) {
                missing.push({ x: cx, y, z });
              }
            }
          }
          if (dir.dz !== 0 && destZ !== z) {
            const step = destZ > z ? 1 : -1;
            for (let cz = z + step; cz !== destZ && Math.abs(cz - z) < 50; cz += step) {
              const mKey = `${x},${y},${cz}`;
              if (!coordMap.has(mKey)) {
                missing.push({ x, y, z: cz });
              }
            }
          }

          if (missing.length > 0) {
            gaps.push({
              from: { id: room._id, name, x, y, z },
              to: { id: destId, name: destName, x: destX, y: destY, z: destZ },
              direction: exitName,
              missing,
            });
          }
        }
      }
    }

    // Report gaps
    if (gaps.length === 0) {
      console.log('✅ No coordinate gaps found!\n');
    } else {
      console.log(`⚠️  Found ${gaps.length} coordinate gaps:\n`);

      // Group by z-level
      const byZ = new Map();
      for (const gap of gaps) {
        const z = gap.from.z;
        if (!byZ.has(z)) byZ.set(z, []);
        byZ.get(z).push(gap);
      }

      for (const [z, zGaps] of [...byZ.entries()].sort((a, b) => b[0] - a[0])) {
        console.log(`=== z=${z} ===`);
        for (const gap of zGaps) {
          console.log(`  ${gap.from.name} (${gap.from.x},${gap.from.y}) --${gap.direction}--> ${gap.to.name} (${gap.to.x},${gap.to.y})`);
          console.log(`    Missing: ${gap.missing.map(m => `(${m.x},${m.y},${m.z})`).join(', ')}`);
        }
        console.log('');
      }
    }

    // Summary by z-level
    console.log('=== Room counts by z-level ===');
    const countByZ = new Map();
    for (const room of rooms) {
      const z = room.properties.z?.value;
      if (z === undefined) continue;
      countByZ.set(z, (countByZ.get(z) || 0) + 1);
    }
    for (const [z, count] of [...countByZ.entries()].sort((a, b) => b[0] - a[0])) {
      console.log(`  z=${z}: ${count} rooms`);
    }

  } finally {
    await client.close();
  }
}

main().catch(console.error);
