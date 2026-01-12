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
 * Processes 3 rooms in parallel for faster throughput.
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
 *   --delay MS        Fixed delay between batches in ms (default: random 5s-25s)
 *   --parallel N      Number of parallel requests (default: 3)
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

interface ImageGenerationResult {
  blobKey: string;
  filename: string | null;
}

// Immutable result types for parallel processing
type ProcessingSuccess = {
  readonly status: 'success';
  readonly roomFile: Readonly<RoomFile>;
  readonly roomId: number;
  readonly blobKey: string;
  readonly imageFilename: string;
  readonly imageData: string; // base64
};

type ProcessingSkipped = {
  readonly status: 'skipped';
  readonly roomFile: Readonly<RoomFile>;
  readonly reason: string;
};

type ProcessingError = {
  readonly status: 'error';
  readonly roomFile: Readonly<RoomFile>;
  readonly error: string;
  readonly isTokenError: boolean;
  readonly isRateLimit: boolean;
};

type ProcessingResult = ProcessingSuccess | ProcessingSkipped | ProcessingError;

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
const MAX_DELAY_MS = 25000;  // 25 seconds
const parallelIdx = args.indexOf('--parallel');
const PARALLEL_COUNT = parallelIdx >= 0 ? parseInt(args[parallelIdx + 1], 10) : 2;

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
    const rooms = await $query().parent($room).prop('x').equals(${JSON.stringify(x)}).all();
    for (const room of rooms) {
      if (room.y === ${JSON.stringify(y)} && room.z === ${JSON.stringify(z)}) {
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
async function generateRoomImage(roomId: number): Promise<ImageGenerationResult> {
  const result = await executeMooCode(`
    const room = await $load(${JSON.stringify(roomId)});
    if (!room) throw new Error('Room not found: ${JSON.stringify(roomId)}');
    // Don't use saveToDisk - that saves inside Docker container
    // We'll download from GridFS to host filesystem separately
    return await room.image({ force: true });
  `, 600000); // 10 minute timeout for Midjourney generation
  return result as ImageGenerationResult;
}

/**
 * Download a blob from GridFS via MCP
 */
async function downloadBlob(blobKey: string): Promise<string> {
  const result = await executeMooCode(`
    return await $blob.read(${JSON.stringify(blobKey)});
  `);
  return result as string;
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
    // Require connected AND ok/healthy status
    if (!health.connected) return false;
    if (health.status && health.status !== 'healthy' && health.status !== 'ok') return false;
    return true;
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
 * Get delay for next batch (random if DELAY_MS is 0, otherwise fixed)
 */
function getDelay(): number {
  if (DELAY_MS > 0) return DELAY_MS;
  // Random delay between 5 seconds and 25 seconds
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

/**
 * Generate filename for a room (pure function)
 */
function generateFilename(roomFile: Readonly<RoomFile>): string {
  const { name, x, y, z } = roomFile.room;
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `${baseName}-x${x}-y${y}-z${z ?? 0}.png`;
}

/**
 * Process a single room - pure function that returns immutable result
 * Does NOT write to disk - that's handled separately after all parallel work completes
 */
async function processRoom(roomFile: Readonly<RoomFile>, index: number, total: number): Promise<ProcessingResult> {
  const { x, y, z } = roomFile.room;
  const logPrefix = `[${index + 1}/${total}]`;

  // Validate coordinates
  if (x === undefined || y === undefined) {
    return {
      status: 'skipped',
      roomFile,
      reason: 'No coordinates',
    };
  }

  try {
    // Resolve room ID by coordinates
    const roomId = await getRoomIdByCoords(x, y, z ?? 0);
    if (!roomId) {
      return {
        status: 'skipped',
        roomFile,
        reason: `Room not found in MOO at (${x}, ${y}, ${z ?? 0})`,
      };
    }

    console.log(`${logPrefix} ${roomFile.room.name} (#${roomId}) - generating...`);

    // Generate image via MCP (saves to GridFS)
    const result = await generateRoomImage(roomId);

    // Validate result - API may return error object instead of blobKey
    if (!result || !result.blobKey || typeof result.blobKey !== 'string') {
      console.error(`${logPrefix} ${roomFile.room.name} - invalid result: ${JSON.stringify(result)}`);
      return {
        status: 'error',
        roomFile,
        error: `Invalid API result: ${JSON.stringify(result)}`,
        isTokenError: true, // Treat as potential token error
        isRateLimit: false,
      };
    }

    // Download from GridFS
    const imageFilename = generateFilename(roomFile);
    const imageData = await downloadBlob(result.blobKey);

    // Validate image data
    if (!imageData || typeof imageData !== 'string') {
      console.error(`${logPrefix} ${roomFile.room.name} - invalid image data from blob`);
      return {
        status: 'error',
        roomFile,
        error: 'Invalid image data from blob storage',
        isTokenError: false,
        isRateLimit: false,
      };
    }

    console.log(`${logPrefix} ${roomFile.room.name} - done (${result.blobKey})`);

    return {
      status: 'success',
      roomFile,
      roomId,
      blobKey: result.blobKey,
      imageFilename,
      imageData,
    };
  } catch (err) {
    const errStr = String(err);
    const isTokenError = errStr.includes('ERR_INVALID_ARG_TYPE') || errStr.includes('Received an instance of Object');

    // Check for rate limit in docker logs
    let isRateLimit = false;
    if (isTokenError) {
      try {
        const { execSync } = await import('child_process');
        const logs = execSync('docker compose logs midjourney-api --tail 5 2>&1', { encoding: 'utf-8' });
        isRateLimit = logs.includes('429') || logs.includes('rate limit');
      } catch {
        // Ignore log check errors
      }
    }

    console.error(`${logPrefix} ${roomFile.room.name} - ERROR: ${err}`);

    return {
      status: 'error',
      roomFile,
      error: errStr,
      isTokenError: isTokenError && !isRateLimit,
      isRateLimit,
    };
  }
}

/**
 * Write successful results to disk (side effect, done after parallel processing)
 */
async function writeResultsToDisk(results: readonly ProcessingSuccess[]): Promise<void> {
  for (const result of results) {
    const filePath = path.join(ASSETS_DIR, result.imageFilename);
    fs.writeFileSync(filePath, Buffer.from(result.imageData, 'base64'));
    await addImageOnDiskToFile(result.roomFile.filePath, result.imageFilename, result.roomFile);
    console.log(`    ✅ Saved: ${result.imageFilename}`);
  }
}

async function main() {
  console.log('🖼️  Room Image Generator (Midjourney)');
  console.log('=====================================');
  console.log(`🔀 Parallel mode: ${PARALLEL_COUNT} concurrent requests`);
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
  const toGenerate: readonly RoomFile[] = overrideLimit ? filtered.slice(0, overrideLimit) : filtered;
  console.log(`🎨 Will generate ${toGenerate.length} images in batches of ${PARALLEL_COUNT}\n`);
  if (DELAY_MS > 0) {
    console.log(`⏱️  Delay between batches: ${DELAY_MS}ms (fixed)\n`);
  } else {
    console.log(`⏱️  Delay between batches: ${MIN_DELAY_MS / 1000}s - ${MAX_DELAY_MS / 1000}s (random)\n`);
  }

  if (dryRun) {
    for (let i = 0; i < toGenerate.length; i++) {
      const roomFile = toGenerate[i];
      console.log(`[${i + 1}/${toGenerate.length}] ${roomFile.room.name} - would generate`);
    }
    console.log(`\n✅ Dry run complete. Would generate ${toGenerate.length} images.`);
    process.exit(0);
  }

  // Process in batches of PARALLEL_COUNT
  let generated = 0;
  let errors = 0;
  let skipped = 0;
  let consecutiveTokenErrors = 0;
  let batchIndex = 0;
  const retryQueue: RoomFile[] = []; // Queue for rate-limited rooms

  for (let i = 0; i < toGenerate.length; i += PARALLEL_COUNT) {
    batchIndex++;
    const batch = toGenerate.slice(i, i + PARALLEL_COUNT);
    const batchStart = i;

    console.log(`\n📦 Batch ${batchIndex} (${batch.length} rooms):`);
    for (const rf of batch) {
      console.log(`   - ${rf.room.name} (${rf.room.x}, ${rf.room.y}, ${rf.room.z ?? 0})`);
    }
    console.log('');

    // Process batch in parallel - each returns an immutable result
    const results: ProcessingResult[] = await Promise.all(
      batch.map((roomFile, idx) => processRoom(roomFile, batchStart + idx, toGenerate.length))
    );

    // Separate results by status
    const successes = results.filter((r): r is ProcessingSuccess => r.status === 'success');
    const skips = results.filter((r): r is ProcessingSkipped => r.status === 'skipped');
    const errs = results.filter((r): r is ProcessingError => r.status === 'error');

    // Write successful results to disk (sequential to avoid file conflicts)
    if (successes.length > 0) {
      console.log(`\n📝 Writing ${successes.length} images to disk...`);
      await writeResultsToDisk(successes);
      consecutiveTokenErrors = 0; // Reset on any success
    }

    // Log skips
    for (const skip of skips) {
      console.log(`    ⏭️  Skipped: ${skip.roomFile.room.name} - ${skip.reason}`);
    }

    // Handle errors
    for (const err of errs) {
      if (err.isRateLimit) {
        console.log(`    ⏳ Rate limited on ${err.roomFile.room.name} - added to retry queue`);
        retryQueue.push(err.roomFile);
        errors--; // Don't count as error since we'll retry
      } else if (err.isTokenError) {
        consecutiveTokenErrors++;
        console.error(`    ⚠️  Token error on ${err.roomFile.room.name} (${consecutiveTokenErrors} consecutive)`);

        if (consecutiveTokenErrors >= 3) {
          console.error('\n🛑 Too many consecutive token errors - likely invalid Midjourney token');
          console.error('🔄 Stopping midjourney-api container...');
          try {
            const { execSync } = await import('child_process');
            execSync('docker compose stop midjourney-api', { stdio: 'inherit' });
            console.error('✅ Container stopped. Please update MIDJOURNEY_SALAI_TOKEN and restart.');
          } catch (stopErr) {
            console.error('❌ Failed to stop container:', stopErr);
          }
          process.exit(1);
        }
      }
    }

    generated += successes.length;
    skipped += skips.length;
    errors += errs.length;

    // Delay between batches
    if (i + PARALLEL_COUNT < toGenerate.length) {
      const delay = getDelay();
      console.log(`\n⏱️  Batch complete. Waiting ${(delay / 1000).toFixed(0)}s before next batch...`);
      await sleep(delay);
    }
  }

  // Process retry queue (rate-limited rooms)
  if (retryQueue.length > 0) {
    console.log(`\n🔄 Processing ${retryQueue.length} rate-limited rooms from retry queue...`);
    console.log('⏳ Waiting 60s before retrying...');
    await sleep(60000);

    let retryAttempt = 0;
    const maxRetries = 3;

    while (retryQueue.length > 0 && retryAttempt < maxRetries) {
      retryAttempt++;
      console.log(`\n🔄 Retry attempt ${retryAttempt}/${maxRetries} (${retryQueue.length} rooms remaining)`);

      const currentRetryBatch = retryQueue.splice(0, PARALLEL_COUNT);
      const retryResults = await Promise.all(
        currentRetryBatch.map((roomFile, idx) => processRoom(roomFile, idx, currentRetryBatch.length))
      );

      const retrySuccesses = retryResults.filter((r): r is ProcessingSuccess => r.status === 'success');
      const retryErrs = retryResults.filter((r): r is ProcessingError => r.status === 'error');

      if (retrySuccesses.length > 0) {
        await writeResultsToDisk(retrySuccesses);
        generated += retrySuccesses.length;
        console.log(`    ✅ Retry succeeded for ${retrySuccesses.length} rooms`);
      }

      for (const err of retryErrs) {
        if (err.isRateLimit) {
          retryQueue.push(err.roomFile); // Re-add to queue
          console.log(`    ⏳ Still rate limited: ${err.roomFile.room.name}`);
        } else {
          errors++;
          console.log(`    ❌ Retry failed: ${err.roomFile.room.name} - ${err.error}`);
        }
      }

      if (retryQueue.length > 0) {
        console.log('⏳ Waiting 60s before next retry...');
        await sleep(60000);
      }
    }

    if (retryQueue.length > 0) {
      console.log(`\n⚠️  ${retryQueue.length} rooms failed after ${maxRetries} retry attempts:`);
      for (const rf of retryQueue) {
        console.log(`    - ${rf.room.name} (${rf.filePath})`);
      }
      errors += retryQueue.length;
    }
  }

  console.log('\n=====================================');
  console.log(`✅ Generated: ${generated}`);
  console.log(`⏭️  Skipped: ${skipped}`);
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
        // Note: rooms object contains rooms, doors, and locks - filter to only rooms by checking prototype
        if (module.building?.rooms) {
          for (const [placeholder, roomDef] of Object.entries(module.building.rooms)) {
            const room = roomDef as RoomDef & { prototype?: string };
            // Skip non-rooms (doors, locks, etc.) - rooms either have no prototype or prototype='room'
            const proto = room.prototype as string | undefined;
            const isRoom = !proto || proto === 'room';
            if (isRoom && room && room.name && room.description && !room.imageOnDisk) {
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
  if (content.includes('export const building') && roomFile?.relativePath.includes(':')) {
    // Extract placeholder key from relativePath (e.g., "path/to/file.ts:%ARTERY_N1")
    const placeholder = roomFile.relativePath.split(':').pop();
    if (!placeholder) {
      console.log(`    ⚠️  Could not extract room placeholder from path`);
      return;
    }

    // Find the room object by its placeholder key and add imageOnDisk after z coordinate
    // Pattern: 'placeholder': { ... z: N, ... }
    const roomKeyPattern = new RegExp(`('${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{[^}]*?)(z:\\s*-?\\d+,?)`);
    const match = content.match(roomKeyPattern);

    if (match) {
      const replacement = `${match[1]}${match[2]}\n      imageOnDisk: '${imageFilename}',`;
      content = content.replace(roomKeyPattern, replacement);
      fs.writeFileSync(filePath, content);
    } else {
      console.log(`    ⚠️  Could not find room ${placeholder} z coordinate in building file`);
    }
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
