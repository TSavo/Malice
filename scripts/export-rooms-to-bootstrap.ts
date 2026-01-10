#!/usr/bin/env npx tsx
/**
 * Convert described room JSON to TypeScript bootstrap files
 * 
 * Takes the output from generate-room-descriptions.ts and creates
 * individual room files in the bootstrap structure.
 */

import * as fs from 'fs';
import * as path from 'path';

const INPUT_FILE = process.argv[2];
const OUTPUT_DIR = process.argv[3] || 'src/database/bootstrap/world/seattle/pioneer-square/underground-generated';

if (!INPUT_FILE) {
  console.error('Usage: npx tsx export-rooms-to-bootstrap.ts <described-world.json> [output-dir]');
  process.exit(1);
}

interface Room {
  id: string;
  pos: { x: number; y: number; z: number };
  roomType: string;
  topology: string;
  era: string;
  condition: string;
  atmosphere: string;
  exits: { north: boolean; south: boolean; east: boolean; west: boolean; up: boolean; down: boolean };
  exitCount: number;
  depth: number;
  features: string[];
  nearWater: boolean;
  nearSurface: boolean;
  isDeep: boolean;
  description?: string;
}

interface Exit {
  from: string;
  to: string;
  kind: string;
}

interface WorldExport {
  rooms: Room[];
  exits: Exit[];
}

function generateRoomName(room: Room): string {
  const typeNames: Record<string, string[]> = {
    entrance: ['Basement Access', 'Underground Entry', 'Descent Point', 'Access Shaft'],
    room: ['Buried Chamber', 'Forgotten Room', 'Hidden Space', 'Underground Chamber', 'Sealed Room'],
    railway: ['Buried Passage', 'Forgotten Corridor', 'Dark Tunnel', 'Underground Way', 'Narrow Passage'],
  };
  
  const eraModifiers: Record<string, string[]> = {
    victorian: ['Victorian', 'Old', 'Historic', '1889'],
    depression: ['WPA', 'Concrete', 'Depression-era'],
    industrial: ['Cartel', 'Modified', 'Secured'],
    modern: ['Recent', 'Basement'],
    deep: ['Deep', 'Cave', 'Subterranean'],
    ancient: ['Ancient', 'Pre-fire', 'Primordial'],
  };
  
  const names = typeNames[room.roomType] || typeNames.room;
  const mods = eraModifiers[room.era] || [];
  
  // Seeded random for consistency
  const seed = Math.abs(room.pos.x * 73856093 ^ room.pos.y * 19349663 ^ room.pos.z * 83492791);
  const nameIdx = seed % names.length;
  const modIdx = (seed >> 8) % (mods.length + 1); // +1 for chance of no modifier
  
  if (modIdx < mods.length) {
    return `${mods[modIdx]} ${names[nameIdx]}`;
  }
  return names[nameIdx];
}

function getExitDirection(from: Room, to: Room): string {
  const dx = to.pos.x - from.pos.x;
  const dy = to.pos.y - from.pos.y;
  const dz = to.pos.z - from.pos.z;
  
  if (dz > 0) return 'up';
  if (dz < 0) return 'down';
  if (dy > 0) return 'north';
  if (dy < 0) return 'south';
  if (dx > 0) return 'east';
  if (dx < 0) return 'west';
  return 'out';
}

function sanitizeFilename(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function generateRoomFile(room: Room, exits: Exit[], roomById: Map<string, Room>): string {
  const name = generateRoomName(room);
  const description = room.description || `A ${room.condition} ${room.era}-era ${room.roomType}. The air is ${room.atmosphere}.`;
  
  // Generate exit definitions
  const roomExits = exits.filter(e => e.from === room.id);
  const exitDefs = roomExits.map(e => {
    const target = roomById.get(e.to);
    if (!target) return null;
    const dir = getExitDirection(room, target);
    const targetFile = `./x${target.pos.x}-y${target.pos.y}-z${target.pos.z}`;
    return `    { direction: '${dir}', target: '${targetFile}' }`;
  }).filter(Boolean);
  
  return `import { RoomPrototype } from '@/types/prototypes';

export const room: RoomPrototype = {
  name: '${name.replace(/'/g, "\\'")}',
  description: \`${description.replace(/`/g, '\\`')}\`,
  coordinates: { x: ${room.pos.x}, y: ${room.pos.y}, z: ${room.pos.z} },
  region: 'underground',
  exits: [
${exitDefs.join(',\n')}
  ],
  meta: {
    era: '${room.era}',
    roomType: '${room.roomType}',
    topology: '${room.topology}',
    condition: '${room.condition}',
    atmosphere: '${room.atmosphere}',
    features: ${JSON.stringify(room.features)},
    nearWater: ${room.nearWater},
    nearSurface: ${room.nearSurface},
    isDeep: ${room.isDeep},
    depth: ${room.depth},
    generatedId: '${room.id}',
  },
};

export default room;
`;
}

function main() {
  console.log('=== Room Bootstrap Generator ===');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('');
  
  // Load world data
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8')) as WorldExport;
  console.log(`Loaded ${data.rooms.length} rooms, ${data.exits.length} exits`);
  
  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Build room map
  const roomById = new Map<string, Room>();
  for (const room of data.rooms) {
    roomById.set(room.id, room);
  }
  
  // Group rooms by z-level for subdirectories
  const roomsByZ = new Map<number, Room[]>();
  for (const room of data.rooms) {
    const z = room.pos.z;
    if (!roomsByZ.has(z)) roomsByZ.set(z, []);
    roomsByZ.get(z)!.push(room);
  }
  
  // Generate files
  let generated = 0;
  for (const [z, rooms] of roomsByZ) {
    const zDir = path.join(OUTPUT_DIR, `z${z}`);
    fs.mkdirSync(zDir, { recursive: true });
    
    for (const room of rooms) {
      const filename = `x${room.pos.x}-y${room.pos.y}-z${room.pos.z}.ts`;
      const filepath = path.join(zDir, filename);
      const content = generateRoomFile(room, data.exits, roomById);
      
      fs.writeFileSync(filepath, content);
      generated++;
    }
    
    console.log(`  z=${z}: ${rooms.length} rooms`);
  }
  
  // Generate index file
  const indexContent = `// Generated underground rooms
// Total: ${data.rooms.length} rooms across z-levels ${Array.from(roomsByZ.keys()).sort((a, b) => b - a).join(', ')}

${Array.from(roomsByZ.keys()).sort((a, b) => b - a).map(z => 
  `export * from './z${z}';`
).join('\n')}
`;
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.ts'), indexContent);
  
  console.log('');
  console.log(`=== Generated ${generated} room files ===`);
}

main();
