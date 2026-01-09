#!/usr/bin/env bun
/**
 * Generate images for rooms that don't have imageOnDisk set.
 *
 * Uses Google AI free tier (499/day limit tracked in MongoDB).
 * Resumable - skips rooms that already have imageOnDisk.
 *
 * Usage:
 *   bun scripts/generate-room-images.ts [--dry-run] [--limit N] [--buildings-only] [--world-only]
 *
 * Options:
 *   --dry-run       Show what would be generated without making API calls
 *   --limit N       Override daily limit (default: reads from MongoDB usage)
 *   --buildings-only Only process building rooms
 *   --world-only    Only process world rooms
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { MongoClient } from 'mongodb';

const ASSETS_DIR = path.join(process.cwd(), 'assets/images');
const WORLD_DIR = path.join(process.cwd(), 'src/database/bootstrap/world/seattle/pioneer-square');
const BUILDINGS_DIR = path.join(WORLD_DIR, 'buildings');

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malice';
const DAILY_LIMIT = 499;

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
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const buildingsOnly = args.includes('--buildings-only');
const worldOnly = args.includes('--world-only');
const limitArgIdx = args.indexOf('--limit');
const overrideLimit = limitArgIdx >= 0 ? parseInt(args[limitArgIdx + 1], 10) : null;

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not set');
    process.exit(1);
  }

  console.log('🖼️  Room Image Generator');
  console.log('========================');
  if (dryRun) console.log('🔍 DRY RUN MODE - no changes will be made\n');

  // Connect to MongoDB to check usage
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const usageCollection = db.collection('aiImageGenUsage');

  const today = new Date().toISOString().slice(0, 10);
  const usageDoc = await usageCollection.findOne({ date: today });
  const usedToday = usageDoc?.count || 0;
  const remaining = overrideLimit ?? (DAILY_LIMIT - usedToday);

  console.log(`📊 Usage today: ${usedToday}/${DAILY_LIMIT}`);
  console.log(`📊 Remaining: ${remaining}\n`);

  if (remaining <= 0) {
    console.log('❌ Daily limit reached. Try again tomorrow.');
    await client.close();
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
    await client.close();
    process.exit(0);
  }

  // Process rooms up to the limit
  const toGenerate = roomsToProcess.slice(0, remaining);
  console.log(`🎨 Will generate ${toGenerate.length} images (limited by quota)\n`);

  let generated = 0;
  let errors = 0;

  for (const roomFile of toGenerate) {
    const imageFilename = generateImageFilename(roomFile);
    const imagePath = path.join(ASSETS_DIR, imageFilename);

    console.log(`[${generated + 1}/${toGenerate.length}] ${roomFile.room.name}`);
    console.log(`    File: ${roomFile.relativePath}`);
    console.log(`    Image: ${imageFilename}`);

    if (dryRun) {
      console.log(`    ⏭️  Skipped (dry run)\n`);
      generated++;
      continue;
    }

    try {
      // Generate image
      const prompt = buildPrompt(roomFile.room);
      console.log(`    Prompt: ${prompt.slice(0, 80)}...`);

      const imageData = await generateImage(prompt);

      // Save to disk
      fs.writeFileSync(imagePath, Buffer.from(imageData, 'base64'));
      console.log(`    ✅ Saved ${imageFilename}`);

      // Update the source file with imageOnDisk
      await addImageOnDiskToFile(roomFile.filePath, imageFilename);
      console.log(`    ✅ Updated source file\n`);

      // Update MongoDB usage
      await usageCollection.updateOne(
        { date: today },
        { $inc: { count: 1 }, $setOnInsert: { date: today } },
        { upsert: true }
      );

      generated++;
    } catch (err) {
      console.error(`    ❌ Error: ${err}`);
      errors++;
    }
  }

  console.log('\n========================');
  console.log(`✅ Generated: ${generated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📊 Remaining quota: ${remaining - generated}`);

  await client.close();
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
      } catch (err) {
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
      } catch (err) {
        // Skip files that can't be imported
      }
    }
  }
}

function generateImageFilename(roomFile: RoomFile): string {
  // Create a filename from the room name and coordinates
  const room = roomFile.room;
  const baseName = room.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  if (room.x !== undefined && room.y !== undefined) {
    const z = room.z ?? 0;
    return `${baseName}-x${room.x}-y${room.y}-z${z}.png`;
  }

  // Fallback: use hash of file path
  const hash = Buffer.from(roomFile.filePath).toString('base64').slice(0, 8);
  return `${baseName}-${hash}.png`;
}

function buildPrompt(room: RoomDef): string {
  const isOutdoor = room.outdoor ?? false;
  const isUnderground = (room.z ?? 0) < 0;

  let context = '';
  if (isUnderground) {
    context = 'Underground Seattle tunnel, abandoned, dark, industrial. ';
  } else if (isOutdoor) {
    context = 'Pioneer Square Seattle street, abandoned post-apocalyptic, grey overcast sky. ';
  } else {
    context = 'Indoor room, abandoned, dust and debris. ';
  }

  // Extract key details from description (first 200 chars to avoid too-long prompts)
  const descSnippet = room.description.slice(0, 300).replace(/\n/g, ' ');

  return `${context}${room.name}. ${descSnippet}. Photorealistic, wide angle, 16:9 aspect ratio.`;
}

async function generateImage(prompt: string): Promise<string> {
  const resp = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GOOGLE_API_KEY!,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '16:9' },
        },
      }),
    }
  );

  if (!resp.ok) {
    const error = await resp.text();
    throw new Error(`API error ${resp.status}: ${error}`);
  }

  const data = await resp.json();
  const parts = data.candidates?.[0]?.content?.parts || [];

  for (const part of parts) {
    if (part.inlineData?.data) {
      return part.inlineData.data;
    }
  }

  throw new Error('No image in response');
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
    const insertion = `${match[1]}${match[2] || ''}\n${indent}// Pre-generated image\n${indent}imageOnDisk: '${imageFilename}',`;
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
