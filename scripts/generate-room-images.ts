#!/usr/bin/env bun
/**
 * Generate images for rooms that don't have imageOnDisk set.
 *
 * Uses MCP to call room.image({ saveToDisk: true }) which:
 * - Uses the room's getImagePrompt() for context-aware prompts
 * - Respects daily quota (499/day Google free tier)
 * - Saves to both MongoDB GridFS and assets/images/
 *
 * Resumable - skips rooms that already have imageOnDisk.
 *
 * Usage:
 *   bun scripts/generate-room-images.ts [--dry-run] [--limit N] [--world-only] [--buildings-only]
 *
 * Options:
 *   --dry-run         Show what would be generated without making API calls
 *   --limit N         Max images to generate this run
 *   --world-only      Only process world rooms (not buildings)
 *   --buildings-only  Only process building rooms
 *   --mcp-url URL     MCP server URL (default: http://localhost:3010)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const WORLD_DIR = path.join(process.cwd(), 'src/database/bootstrap/world/seattle/pioneer-square');
const BUILDINGS_DIR = path.join(WORLD_DIR, 'buildings');

interface RoomDef {
  name: string;
  description: string;
  x?: number;
  y?: number;
  z?: number;
  imageOnDisk?: string | object;
  outdoor?: boolean;
  [key: string]: unknown;
}

interface RoomFile {
  filePath: string;
  relativePath: string;
  room: RoomDef;
  type: 'world' | 'building';
  roomId?: number; // MOO object ID, resolved via MCP
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const buildingsOnly = args.includes('--buildings-only');
const worldOnly = args.includes('--world-only');
const limitArgIdx = args.indexOf('--limit');
const overrideLimit = limitArgIdx >= 0 ? parseInt(args[limitArgIdx + 1], 10) : null;
const mcpUrlIdx = args.indexOf('--mcp-url');
const MCP_URL = mcpUrlIdx >= 0 ? args[mcpUrlIdx + 1] : 'http://localhost:3010';

// MCP session management
let mcpSessionId: string | null = null;

/**
 * Initialize MCP session
 */
async function initMcpSession(): Promise<string> {
  const response = await fetch(`${MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'generate-room-images', version: '1.0.0' },
      },
    }),
  });

  const sessionId = response.headers.get('mcp-session-id');
  if (!sessionId) {
    throw new Error('No session ID returned from MCP initialize');
  }
  return sessionId;
}

/**
 * Execute MOO code via MCP
 */
async function executeMooCode(code: string): Promise<unknown> {
  // Ensure we have a session
  if (!mcpSessionId) {
    mcpSessionId = await initMcpSession();
  }

  const response = await fetch(`${MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': mcpSessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'execute_moo_code',
        arguments: { code },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  // Parse SSE response
  const text = await response.text();
  const dataLine = text.split('\n').find(l => l.startsWith('data:'));
  if (!dataLine) {
    throw new Error('No data in MCP response');
  }

  const result = JSON.parse(dataLine.substring(5));
  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  // Parse the result from the tool response
  const content = result.result?.content?.[0];
  if (content?.type === 'text') {
    try {
      return JSON.parse(content.text);
    } catch {
      return content.text;
    }
  }
  return result.result;
}

/**
 * Get room ID by coordinates via MCP
 */
async function getRoomIdByCoords(x: number, y: number, z: number): Promise<number | null> {
  const result = await executeMooCode(`
    const rooms = await $query().parent($room).prop('x').equals(${x}).all();
    for (const room of rooms) {
      if (room.y === ${y} && room.z === ${z}) {
        return room.id;
      }
    }
    return null;
  `);
  return result as number | null;
}

/**
 * Generate image for a room via MCP
 */
async function generateRoomImage(roomId: number): Promise<{ blobKey: string; filename: string | null }> {
  const result = await executeMooCode(`
    const room = await $load(${roomId});
    if (!room) throw new Error('Room not found: ${roomId}');
    return await room.image({ saveToDisk: true, force: true });
  `);
  return result as { blobKey: string; filename: string | null };
}

/**
 * Get current usage from MCP
 */
async function getUsage(): Promise<{ today: number; limit: number; remaining: number }> {
  const result = await executeMooCode(`
    return await $aiImageGen.getUsage();
  `);
  return result as { today: number; limit: number; remaining: number };
}

async function main() {
  console.log('🖼️  Room Image Generator (MCP)');
  console.log('==============================');
  if (dryRun) console.log('🔍 DRY RUN MODE - no changes will be made\n');

  // Check MCP connection and get usage
  let usage: { today: number; limit: number; remaining: number };
  try {
    usage = await getUsage();
    console.log(`📊 Usage today: ${usage.today}/${usage.limit}`);
    console.log(`📊 Remaining: ${usage.remaining}\n`);
  } catch (err) {
    console.error(`❌ Failed to connect to MCP at ${MCP_URL}`);
    console.error(`   Make sure the server is running: npm start`);
    console.error(`   Error: ${err}`);
    process.exit(1);
  }

  const effectiveLimit = overrideLimit ?? usage.remaining;
  if (effectiveLimit <= 0) {
    console.log('❌ Daily limit reached. Try again tomorrow.');
    process.exit(0);
  }

  // Find all room files without imageOnDisk
  const roomsToProcess: RoomFile[] = [];

  if (!buildingsOnly) {
    console.log('🔍 Scanning world rooms...');
    await scanWorldRooms(roomsToProcess);
  }

  if (!worldOnly) {
    console.log('🔍 Scanning building rooms...');
    await scanBuildingRooms(roomsToProcess);
  }

  console.log(`\n📋 Found ${roomsToProcess.length} rooms without images\n`);

  if (roomsToProcess.length === 0) {
    console.log('✅ All rooms have images!');
    process.exit(0);
  }

  // Process rooms up to the limit
  const toGenerate = roomsToProcess.slice(0, effectiveLimit);
  console.log(`🎨 Will generate ${toGenerate.length} images (limited by quota)\n`);

  let generated = 0;
  let errors = 0;

  for (const roomFile of toGenerate) {
    console.log(`[${generated + 1}/${toGenerate.length}] ${roomFile.room.name}`);
    console.log(`    File: ${roomFile.relativePath}`);

    if (dryRun) {
      console.log(`    ⏭️  Skipped (dry run)\n`);
      generated++;
      continue;
    }

    try {
      // Resolve room ID by coordinates
      const { x, y, z } = roomFile.room;
      if (x === undefined || y === undefined) {
        console.log(`    ⚠️  No coordinates, skipping\n`);
        continue;
      }

      const roomId = await getRoomIdByCoords(x, y, z ?? 0);
      if (!roomId) {
        console.log(`    ⚠️  Room not found in MOO at (${x}, ${y}, ${z ?? 0})\n`);
        continue;
      }

      console.log(`    MOO ID: #${roomId}`);

      // Generate image via MCP
      const result = await generateRoomImage(roomId);
      console.log(`    ✅ Generated: ${result.filename || result.blobKey}`);

      // Update the source file with imageOnDisk
      if (result.filename) {
        await addImageOnDiskToFile(roomFile.filePath, result.filename);
        console.log(`    ✅ Updated source file\n`);
      }

      generated++;
    } catch (err) {
      console.error(`    ❌ Error: ${err}`);
      errors++;
    }
  }

  console.log('\n==============================');
  console.log(`✅ Generated: ${generated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Remaining quota: ${effectiveLimit - generated}`);
}

async function scanWorldRooms(results: RoomFile[]): Promise<void> {
  const subdirs = fs.readdirSync(WORLD_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'buildings')
    .map(d => d.name);

  for (const subdir of subdirs) {
    const dir = path.join(WORLD_DIR, subdir);
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const module = await import(pathToFileURL(filePath).href);
        const room = module.room as RoomDef;

        if (room && room.name && room.description && !room.imageOnDisk) {
          results.push({
            filePath,
            relativePath: path.relative(process.cwd(), filePath),
            room,
            type: 'world',
          });
        }
      } catch {
        // Skip files that can't be imported
      }
    }
  }
}

async function scanBuildingRooms(results: RoomFile[]): Promise<void> {
  if (!fs.existsSync(BUILDINGS_DIR)) return;

  const buildings = fs.readdirSync(BUILDINGS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const building of buildings) {
    const buildingDir = path.join(BUILDINGS_DIR, building);
    const files = fs.readdirSync(buildingDir).filter(f => f.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(buildingDir, file);
      try {
        const module = await import(pathToFileURL(filePath).href);

        // Buildings export { building: { rooms: { '%0': {...}, '%1': {...} } } }
        if (module.building?.rooms) {
          for (const [placeholder, roomDef] of Object.entries(module.building.rooms)) {
            const room = roomDef as RoomDef;
            if (room && room.name && room.description && !room.imageOnDisk) {
              results.push({
                filePath,
                relativePath: `${path.relative(process.cwd(), filePath)}:${placeholder}`,
                room,
                type: 'building',
              });
            }
          }
        }
      } catch {
        // Skip files that can't be imported
      }
    }
  }
}

async function addImageOnDiskToFile(filePath: string, imageFilename: string): Promise<void> {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if it's a building file (has 'building' export with rooms)
  if (content.includes('export const building')) {
    // For buildings, we need to add imageOnDisk to each room definition
    // This is more complex - skip for now and just log
    console.log(`    ⚠️  Building file - manual edit needed`);
    return;
  }

  // For world rooms, add imageOnDisk after z coordinate
  // Look for pattern: z: N, or z: N (with possible comment)
  const zPattern = /(\s+z:\s*-?\d+,?)(\s*\/\/.*)?(\n)/;
  const match = content.match(zPattern);

  if (match) {
    const indent = match[0].match(/^\s*/)?.[0] || '  ';
    const insertion = `${match[1]}${match[2] || ''}\n${indent}imageOnDisk: '${imageFilename}',`;
    content = content.replace(zPattern, insertion + '\n');
    fs.writeFileSync(filePath, content);
  } else {
    console.log(`    ⚠️  Could not find z coordinate to insert after`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
