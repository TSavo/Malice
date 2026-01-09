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

// Global MongoDB client for cleanup
let mongoClient: MongoClient | null = null;

async function main() {
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_AI_API_KEY not set');
    process.exit(1);
  }

  // Validate Google API key format (should start with AIza)
  if (!GOOGLE_API_KEY.startsWith('AIza')) {
    console.error('❌ GOOGLE_AI_API_KEY does not look like a valid Google API key (should start with "AIza")');
    process.exit(1);
  }

  console.log('🖼️  Room Image Generator');
  console.log('========================');
  if (dryRun) console.log('🔍 DRY RUN MODE - no changes will be made\n');

  // Connect to MongoDB to check usage
  mongoClient = new MongoClient(MONGO_URI);
  const client = mongoClient;
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
      console.log(`    ✅ Updated source file`);

      // Update MongoDB usage - fail fast if it errors
      try {
        const updateResult = await usageCollection.updateOne(
          { date: today },
          { $inc: { count: 1 }, $setOnInsert: { date: today } },
          { upsert: true }
        );
        if (!updateResult.acknowledged) {
          throw new Error('MongoDB update not acknowledged');
        }
        console.log(`    ✅ Updated usage count\n`);
      } catch (usageErr) {
        console.error(`    ❌ Failed to update usage count: ${usageErr}`);
        throw new Error(`Critical: Usage tracking failed - ${usageErr}`);
      }

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
  const depth = room.z ?? 0;

  // Style directives for photorealism
  const style = [
    'photorealistic',
    'cinematic lighting',
    'high detail',
    'no people',
    'no humans',
    'no figures',
    'empty',
    'desolate',
    'abandoned',
    'run down',
    'weathered',
    'gritty',
    'urban decay',
  ].join(', ');

  // Negative prompt elements (appended as "without X")
  const avoid = 'without any people, crowds, pedestrians, or human figures';

  let context = '';
  if (isUnderground) {
    // Different underground vibes based on depth
    if (depth <= -4) {
      context = 'Deep underground vault beneath Seattle, pitch black except for emergency lighting, ' +
        'concrete walls with water damage, rusty pipes, flooded floor puddles, claustrophobic, oppressive. ';
    } else if (depth <= -2) {
      context = 'Seattle underground tunnel system from 1889, brick and stone walls, ' +
        'dim flickering lights, debris and rubble, graffiti, homeless camp remnants, rats, damp and musty. ';
    } else {
      context = 'Building basement in Seattle, concrete and exposed pipes, ' +
        'water-stained walls, old storage, industrial decay, dim fluorescent lighting. ';
    }
  } else if (isOutdoor) {
    context = 'Pioneer Square Seattle street scene, overcast grey sky, ' +
      'historic red brick buildings, cobblestone streets, overgrown weeds through cracks, ' +
      'boarded up storefronts, broken windows, abandoned cars, trash and debris, post-apocalyptic atmosphere. ';
  } else {
    // Indoor - try to detect room type from name/description
    const nameAndDesc = `${room.name} ${room.description}`.toLowerCase();

    if (nameAndDesc.includes('office') || nameAndDesc.includes('corporate')) {
      context = 'Abandoned corporate office interior, overturned desks, scattered papers, ' +
        'broken computer monitors, water-stained ceiling tiles, dead plants, dust everywhere. ';
    } else if (nameAndDesc.includes('lobby') || nameAndDesc.includes('foyer')) {
      context = 'Abandoned building lobby, grand but decayed, broken chandelier, ' +
        'marble floor covered in dust and debris, graffiti on walls, shattered glass. ';
    } else if (nameAndDesc.includes('bar') || nameAndDesc.includes('pub') || nameAndDesc.includes('tavern')) {
      context = 'Abandoned dive bar interior, overturned stools, broken bottles, ' +
        'dusty bar counter, neon signs dark, grimy floors, cigarette burns. ';
    } else if (nameAndDesc.includes('warehouse') || nameAndDesc.includes('storage')) {
      context = 'Abandoned warehouse interior, empty shelving units, ' +
        'concrete floor with oil stains, broken skylights, pigeons nesting, industrial decay. ';
    } else if (nameAndDesc.includes('apartment') || nameAndDesc.includes('bedroom') || nameAndDesc.includes('living')) {
      context = 'Abandoned apartment interior, furniture covered in dust sheets, ' +
        'peeling wallpaper, water damage on ceiling, broken windows with curtains blowing. ';
    } else if (nameAndDesc.includes('kitchen') || nameAndDesc.includes('diner') || nameAndDesc.includes('restaurant')) {
      context = 'Abandoned restaurant kitchen, rusted appliances, ' +
        'broken tiles, grease stains, rotting food remnants, pest droppings. ';
    } else if (nameAndDesc.includes('hospital') || nameAndDesc.includes('medical') || nameAndDesc.includes('clinic')) {
      context = 'Abandoned medical facility, overturned gurneys, ' +
        'scattered medical supplies, broken equipment, biohazard signs, eerie sterile decay. ';
    } else if (nameAndDesc.includes('church') || nameAndDesc.includes('chapel')) {
      context = 'Abandoned church interior, broken pews, ' +
        'shattered stained glass, altar covered in debris, pigeons roosting, haunting atmosphere. ';
    } else if (nameAndDesc.includes('gallery') || nameAndDesc.includes('museum')) {
      context = 'Abandoned art gallery, empty frames on walls, ' +
        'pedestals knocked over, skylight covered in grime, dust motes in light beams. ';
    } else if (nameAndDesc.includes('shop') || nameAndDesc.includes('store') || nameAndDesc.includes('retail')) {
      context = 'Abandoned retail store, empty shelves and racks, ' +
        'mannequins toppled over, shattered display cases, faded sale signs, looted. ';
    } else {
      context = 'Abandoned interior space in Seattle, dust and debris everywhere, ' +
        'water damage, peeling paint, broken furniture, graffiti, urban decay. ';
    }
  }

  // Extract key details from description (first 250 chars)
  const descSnippet = room.description
    .slice(0, 250)
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${context}${room.name}: ${descSnippet}. ${style}. ${avoid}. Wide angle shot, 16:9 cinematic composition.`;
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
  // Make it robust to handle CRLF and trailing commas
  const zPattern = /(\s+z:\s*-?\d+)(,?)(\s*\/\/.*)?(\r?\n)/;
  const match = content.match(zPattern);

  if (match) {
    const indent = match[0].match(/^\s*/)?.[0] || '  ';
    const hasComma = match[2]; // Preserve existing comma if present
    const comment = match[3] || ''; // Preserve comment if present
    const lineEnding = match[4]; // Preserve line ending (LF or CRLF)
    const insertion = `${match[1]}${hasComma}${comment}${lineEnding}${indent}// Pre-generated image${lineEnding}${indent}imageOnDisk: '${imageFilename}',`;
    content = content.replace(zPattern, insertion);
    fs.writeFileSync(filePath, content);
  } else {
    console.log(`    ⚠️  Could not find z coordinate to insert after`);
  }
}

// Ensure MongoDB cleanup on exit
async function cleanup() {
  if (mongoClient) {
    try {
      await mongoClient.close();
      console.log('\n🔌 MongoDB connection closed');
    } catch (err) {
      console.error('Error closing MongoDB:', err);
    }
  }
}

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted by user');
  await cleanup();
  process.exit(130);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Terminated');
  await cleanup();
  process.exit(143);
});

main().catch(async err => {
  console.error('Fatal error:', err);
  await cleanup();
  process.exit(1);
});
