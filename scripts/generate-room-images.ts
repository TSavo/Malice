#!/usr/bin/env bun
/**
 * Generate images for rooms using Midjourney API.
 *
 * Uses MCP to call room.image({ saveToDisk: true }) which:
 * - Uses the room's getImagePrompt() for context-aware prompts
 * - Passes negative prompts via MJ's --no parameter
 * - Saves to both MongoDB GridFS and assets/images/
 *
 * Resumable - skips rooms that already have imageOnDisk.
 *
 * Usage:
 *   bun scripts/generate-room-images.ts [--dry-run] [--limit N] [--world-only] [--buildings-only]
 *
 * Options:
 *   --dry-run         Show what would be generated without making API calls
 *   --limit N         Max images to generate this run (default: unlimited)
 *   --world-only      Only process world rooms (not buildings)
 *   --buildings-only  Only process building rooms
 *   --underground     Only process underground rooms (z < 0)
 *   --surface         Only process surface rooms (z >= 0)
 *   --mcp-url URL     MCP server URL (default: http://localhost:3010)
 *   --delay MS        Delay between images in ms (default: 5000)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const WORLD_DIR = path.join(process.cwd(), 'src/database/bootstrap/world/seattle/pioneer-square');
const BUILDINGS_DIR = path.join(WORLD_DIR, 'buildings');
const ASSETS_DIR = path.join(process.cwd(), 'assets/images');
const UNDERGROUND_JSON = path.join(process.cwd(), 'underground-world-fresh-described-fixed.json');

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
  type: 'world' | 'building' | 'underground-json';
  roomId?: number; // MOO object ID, resolved via MCP
  jsonRoomId?: string; // For JSON rooms, the room's 'id' field (e.g., 'r1')
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const buildingsOnly = args.includes('--buildings-only');
const worldOnly = args.includes('--world-only');
const undergroundOnly = args.includes('--underground');
const surfaceOnly = args.includes('--surface');
const jsonOnly = args.includes('--json-only'); // Only process underground JSON rooms
const limitArgIdx = args.indexOf('--limit');
const overrideLimit = limitArgIdx >= 0 ? parseInt(args[limitArgIdx + 1], 10) : null;
const mcpUrlIdx = args.indexOf('--mcp-url');
const MCP_URL = mcpUrlIdx >= 0 ? args[mcpUrlIdx + 1] : 'http://localhost:3010';
const delayIdx = args.indexOf('--delay');
const DELAY_MS = delayIdx >= 0 ? parseInt(args[delayIdx + 1], 10) : 0; // 0 means use random delay
const MIN_DELAY_MS = 5000;   // 5 seconds
const MAX_DELAY_MS = 180000; // 3 minutes

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
async function executeMooCode(code: string, timeoutMs: number = 600000): Promise<unknown> {
  // Ensure we have a session
  if (!mcpSessionId) {
    mcpSessionId = await initMcpSession();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
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
      signal: controller.signal,
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
  } finally {
    clearTimeout(timeout);
  }
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
 * Returns the result from room.image({ saveToDisk: true })
 */
async function generateRoomImage(roomId: number): Promise<{ blobKey: string; filename: string | null }> {
  const result = await executeMooCode(`
    const room = await $load(${roomId});
    if (!room) throw new Error('Room not found: ${roomId}');
    return await room.image({ saveToDisk: true, force: true });
  `, 600000); // 10 minute timeout for Midjourney generation
  return result as { blobKey: string; filename: string | null };
}

/**
 * Check if Midjourney API is healthy via MCP
 */
async function checkMidjourneyHealth(): Promise<boolean> {
  try {
    const result = await executeMooCode(`
      const health = await $aiImageGen.health();
      return health;
    `);
    const health = result as { status: string; connected?: boolean; error?: string };
    return health.status === 'healthy' || health.connected === true;
  } catch (err) {
    console.error('Health check error:', err);
    return false;
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get delay for next image (random if DELAY_MS is 0, otherwise fixed)
 */
function getDelay(): number {
  if (DELAY_MS > 0) return DELAY_MS;
  // Random delay between 5 seconds and 3 minutes
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

async function main() {
  console.log('🖼️  Room Image Generator (Midjourney)');
  console.log('=====================================');
  if (dryRun) console.log('🔍 DRY RUN MODE - no changes will be made\n');

  // Check MCP connection and Midjourney health
  try {
    const healthy = await checkMidjourneyHealth();
    if (!healthy) {
      console.error('❌ Midjourney API is not healthy');
      process.exit(1);
    }
    console.log('✅ Midjourney API connected\n');
  } catch (err) {
    console.error(`❌ Failed to connect to MCP at ${MCP_URL}`);
    console.error(`   Make sure the server is running: docker compose up -d`);
    console.error(`   Error: ${err}`);
    process.exit(1);
  }

  // Ensure assets directory exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // Find all room files without imageOnDisk
  const roomsToProcess: RoomFile[] = [];

  if (!buildingsOnly && !jsonOnly) {
    console.log('🔍 Scanning world rooms...');
    await scanWorldRooms(roomsToProcess);
  }

  if (!worldOnly && !jsonOnly) {
    console.log('🔍 Scanning building rooms...');
    await scanBuildingRooms(roomsToProcess);
  }

  if (!worldOnly && !buildingsOnly) {
    console.log('🔍 Scanning underground JSON rooms...');
    await scanUndergroundJsonRooms(roomsToProcess);
  }

  // Filter by z-level if requested
  let filtered = roomsToProcess;
  if (undergroundOnly) {
    filtered = roomsToProcess.filter(r => (r.room.z ?? 0) < 0);
    console.log(`📍 Filtering to underground only (z < 0)`);
  } else if (surfaceOnly) {
    filtered = roomsToProcess.filter(r => (r.room.z ?? 0) >= 0);
    console.log(`📍 Filtering to surface only (z >= 0)`);
  }

  console.log(`\n📋 Found ${filtered.length} rooms without images\n`);

  if (filtered.length === 0) {
    console.log('✅ All rooms have images!');
    process.exit(0);
  }

  // Process rooms up to the limit
  const toGenerate = overrideLimit ? filtered.slice(0, overrideLimit) : filtered;
  console.log(`🎨 Will generate ${toGenerate.length} images\n`);
  if (DELAY_MS > 0) {
    console.log(`⏱️  Delay between images: ${DELAY_MS}ms (fixed)\n`);
  } else {
    console.log(`⏱️  Delay between images: ${MIN_DELAY_MS / 1000}s - ${MAX_DELAY_MS / 1000}s (random)\n`);
  }

  let generated = 0;
  let errors = 0;

  for (const roomFile of toGenerate) {
    console.log(`[${generated + 1}/${toGenerate.length}] ${roomFile.room.name}`);
    console.log(`    File: ${roomFile.relativePath}`);
    console.log(`    Coords: (${roomFile.room.x}, ${roomFile.room.y}, ${roomFile.room.z ?? 0})`);

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
      console.log(`    ⏳ Generating image via Midjourney...`);

      // Generate image via MCP (this calls room.image())
      const result = await generateRoomImage(roomId);
      console.log(`    ✅ Generated: ${result.filename || result.blobKey}`);

      // Update the source file with imageOnDisk
      if (result.filename) {
        await addImageOnDiskToFile(roomFile.filePath, result.filename, roomFile);
        console.log(`    ✅ Updated source file\n`);
      } else {
        console.log(`    ⚠️  No filename returned, blob only\n`);
      }

      generated++;

      // Delay between images to avoid rate limiting
      if (generated < toGenerate.length) {
        const delay = getDelay();
        console.log(`    ⏱️  Waiting ${(delay / 1000).toFixed(0)}s before next image...`);
        await sleep(delay);
      }
    } catch (err) {
      console.error(`    ❌ Error: ${err}`);
      errors++;
      console.log('');
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Generated: ${generated}`);
  console.log(`❌ Errors: ${errors}`);
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

async function addImageOnDiskToFile(filePath: string, imageFilename: string, roomFile?: RoomFile): Promise<void> {
  // Handle underground JSON rooms specially
  if (roomFile?.type === 'underground-json' && roomFile.jsonRoomId) {
    await updateUndergroundJsonImage(roomFile.jsonRoomId, imageFilename);
    return;
  }

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

/**
 * Scan underground JSON file for rooms without images
 */
async function scanUndergroundJsonRooms(results: RoomFile[]): Promise<void> {
  if (!fs.existsSync(UNDERGROUND_JSON)) {
    console.log('    Underground JSON not found, skipping');
    return;
  }

  const data = JSON.parse(fs.readFileSync(UNDERGROUND_JSON, 'utf-8'));
  const rooms = data.rooms || [];

  for (const roomDef of rooms) {
    // Skip rooms that already have imageOnDisk
    if (roomDef.imageOnDisk) continue;

    results.push({
      filePath: UNDERGROUND_JSON,
      relativePath: `underground-json:${roomDef.id}`,
      room: {
        name: roomDef.id, // JSON rooms don't have names, use ID
        description: roomDef.description,
        x: roomDef.pos.x,
        y: roomDef.pos.y,
        z: roomDef.pos.z,
      },
      type: 'underground-json',
      jsonRoomId: roomDef.id,
    });
  }
}

/**
 * Update underground JSON file with imageOnDisk for a specific room
 */
async function updateUndergroundJsonImage(roomId: string, imageFilename: string): Promise<void> {
  if (!fs.existsSync(UNDERGROUND_JSON)) {
    console.log(`    ⚠️  Underground JSON not found`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(UNDERGROUND_JSON, 'utf-8'));
  const rooms = data.rooms || [];

  // Find the room by ID and add imageOnDisk
  const roomIndex = rooms.findIndex((r: any) => r.id === roomId);
  if (roomIndex === -1) {
    console.log(`    ⚠️  Room ${roomId} not found in JSON`);
    return;
  }

  rooms[roomIndex].imageOnDisk = imageFilename;

  // Write back to file with pretty formatting
  fs.writeFileSync(UNDERGROUND_JSON, JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
