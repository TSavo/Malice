#!/usr/bin/env npx tsx
/**
 * Room Description Generator
 * 
 * Uses a local LLM (Ollama) to generate atmospheric room descriptions
 * from the roomgen export. Processes rooms in BFS order from entrances
 * so connected rooms can reference each other's descriptions.
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'mistral-nemo:12b-instruct-2407-q4_K_M';
const INPUT_FILE = process.argv[2];
const OUTPUT_FILE = process.argv[3] || INPUT_FILE?.replace('.json', '-described.json');

if (!INPUT_FILE) {
  console.error('Usage: npx tsx generate-room-descriptions.ts <input.json> [output.json]');
  process.exit(1);
}

// Types
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
  neighborTypes: string[];
  // Generated fields
  description?: string;
  shortDescription?: string;
}

interface Exit {
  from: string;
  to: string;
  kind: string;
}

interface WorldExport {
  rooms: Room[];
  exits: Exit[];
  meta: {
    featurePools: Record<string, Record<string, string[]>>;
    conditions: string[];
    atmospheres: string[];
    eras: Record<string, string>;
  };
}

// Feature descriptions for prompt context
const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Victorian
  prism_skylight_dark: 'purple-tinted glass prisms embedded in the ceiling, now dark and blocked from above',
  prism_skylight_cracked: 'cracked vault light prisms, a few still letting in faint grey light',
  prism_skylight_missing: 'empty frames where sidewalk prisms once let in daylight',
  bricked_up_storefront: 'a storefront window bricked up long ago, the outline still visible',
  sealed_doorway: 'a doorway sealed with bricks, mortar darker than the surrounding wall',
  collapsed_ceiling_section: 'a section of ceiling collapsed, debris scattered below',
  cast_iron_column: 'a cast iron support column, ornate but rusted',
  brick_arch: 'a decorative brick arch, craftsmanship from a more careful era',
  rotted_wooden_beam: 'wooden support beams, soft with rot, barely holding',
  crumbling_plaster: 'plaster walls crumbling to expose the brick beneath',
  faded_painted_sign: 'faded painted lettering on the wall, advertising something long forgotten',
  rusted_gas_pipe: 'old gas pipes running along the ceiling, valves frozen with corrosion',
  broken_tile_floor: 'hexagonal floor tiles, many cracked or missing',
  cobblestone_remnant: 'original cobblestones visible where the floor has worn away',
  iron_grate_floor: 'iron grating in the floor, black space visible below',
  coal_chute_sealed: 'a sealed coal chute, its iron door rusted shut',
  wooden_support_shoring: 'timber shoring added later, keeping the walls from collapsing',
  water_stains_old: 'old water stains tracing paths down the walls',
  rat_droppings: 'rat droppings scattered in the corners',
  graffiti_1890s: 'graffiti scratched into the brick, dates from the 1890s',
  candle_wax_residue: 'dried candle wax pooled on a ledge',
  bootprints_in_dust: 'bootprints in the dust, recent',
  debris_pile: 'a pile of fallen debris, brick and plaster and rotted wood',
  fallen_brick: 'loose bricks scattered on the floor',
  exposed_foundation: 'the original foundation exposed, rough-cut stone',
  street_grate_above: 'a street grate visible in the ceiling, faint sounds of the city above',
  
  // Depression era
  concrete_wall_stained: 'poured concrete walls stained with decades of moisture',
  steel_i_beam: 'steel I-beams supporting the ceiling, rust bleeding down',
  wpa_date_stamp_1937: '"WPA 1937" stamped into the concrete',
  valve_wheel_rusted: 'a large valve wheel, frozen with rust',
  cistern_grate: 'a heavy iron grate covering a cistern below',
  pump_housing_dead: 'a pump housing, silent, its machinery long dead',
  drainage_channel: 'a drainage channel cut into the floor',
  
  // Industrial/Cartel
  power_tap_illegal: 'cables spliced into the wall, an illegal power tap',
  cache_concealed: 'a concealed cache behind a loose brick',
  marker_symbol_cartel: 'a symbol scratched into the wall, Cartel territory marker',
  escape_route_marker: 'a small arrow scratched at ankle height, pointing deeper',
  supply_crate_cartel: 'supply crates stacked against the wall, Cartel markings',
  
  // Deep
  groundwater_drip: 'water dripping steadily from above, pooling in a corner',
  bat_guano: 'bat guano scattered on the floor, the smell sharp',
  echo_point: 'sounds echo strangely here, returning from multiple directions',
  natural_rock_face: 'natural rock exposed, the tunnels cut through living stone',
  
  // Ancient
  hand_cut_stone: 'hand-cut stone blocks, fitted without mortar',
  inscribed_date_1870s: '"1876" carved into a keystone',
  bone_fragments_animal: 'animal bone fragments in the sediment',
};

// Build the prompt for a single room
function buildPrompt(room: Room, neighbors: Room[], worldMeta: WorldExport['meta']): string {
  const exitDirections = Object.entries(room.exits)
    .filter(([_, has]) => has)
    .map(([dir]) => dir);
  
  const featureDescs = room.features
    .map(f => FEATURE_DESCRIPTIONS[f] || f.replace(/_/g, ' '))
    .join('; ');
  
  // Build neighbor context
  const neighborContext = neighbors.map(n => {
    const dir = getDirectionTo(room.pos, n.pos);
    if (n.description) {
      return `To the ${dir} (${n.pos.x},${n.pos.y},${n.pos.z}) ${n.roomType}) (${n.condition}, ${n.era} era): "${n.description}"`;
    } else {
      return `To the ${dir}: (${n.pos.x},${n.pos.y},${n.pos.z}) ${n.roomType} (${n.condition}, ${n.era} era)`;
    }
  }).join('\n');

  const prompt = `Write a room description for a text-based cyberpunk noir game set in Seattle's underground (buried 1889 streets). Year: 2109.

ROOM DATA:
- Type: ${room.roomType} (${room.topology})
- Era: ${room.era} (${getEraDescription(room.era)})
- Condition: ${room.condition}
- Atmosphere: ${room.atmosphere}
- Depth: ${room.depth} levels below street

PHYSICAL FEATURES:
${featureDescs || 'Generic underground passage'}

CONNECTED ROOMS:
${neighborContext || 'None described yet'}

STYLE EXAMPLE (match this tone and format):
"The brick walls ooze moisture, staining the mortar black. A rusted iron beam sags overhead, bolts bleeding orange down the stone. Somewhere ahead, water drips into a pool with a hollow echo. The air tastes of copper and rot, thick enough to chew."

RULES:
1. NO second person (you/your). Describe the space itself.
2. 4-5 complete sentences. Third person present tense.
3. Sensory: what can be SEEN, HEARD, SMELLED, FELT.
4. ERA-appropriate: ${room.era === 'modern' ? 'concrete, steel, LEDs' : room.era === 'victorian' ? 'brick, iron, gas pipes' : 'period materials'}
5. CONDITION: ${room.condition}
6. Gritty noir prose. Direct, not flowery.

Description:`;

  return prompt;
}

function getEraDescription(era: string): string {
  const eras: Record<string, string> = {
    victorian: '1889 buried streets, brick and iron',
    depression: '1930s WPA tunnels and cisterns',
    industrial: 'Gray Cartel modified passages',
    modern: 'recent basement connections',
    deep: 'natural caves and deep infrastructure',
    ancient: 'pre-fire 1870s cisterns',
  };
  return eras[era] || era;
}

function getDirectionTo(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  
  if (dz > 0) return 'above';
  if (dz < 0) return 'below';
  if (dy > 0) return 'north';
  if (dy < 0) return 'south';
  if (dx > 0) return 'east';
  if (dx < 0) return 'west';
  return 'nearby';
}

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.85,
        top_p: 0.92,
        num_predict: 350,  // Increased to prevent cutoff
        repeat_penalty: 1.15,  // Reduce repetitive phrases
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.response.trim();
}

async function generateDescriptions(world: WorldExport): Promise<WorldExport> {
  // Build adjacency map
  const adjacency = new Map<string, string[]>();
  const roomById = new Map<string, Room>();
  
  for (const room of world.rooms) {
    roomById.set(room.id, room);
    adjacency.set(room.id, []);
  }
  
  for (const exit of world.exits) {
    adjacency.get(exit.from)?.push(exit.to);
  }
  
  // Find entrance rooms (roomType === 'entrance')
  const entrances = world.rooms.filter(r => r.roomType === 'entrance');
  
  // BFS from entrances - process rooms in order of distance from entrances
  const visited = new Set<string>();
  const queue: string[] = entrances.map(e => e.id);
  const processOrder: string[] = [];
  
  for (const id of queue) visited.add(id);
  
  while (queue.length > 0) {
    const roomId = queue.shift()!;
    // Only process if room exists
    if (roomById.has(roomId)) {
      processOrder.push(roomId);
    }
    
    for (const neighborId of adjacency.get(roomId) || []) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  
  // Add any unreachable rooms at the end
  for (const room of world.rooms) {
    if (!visited.has(room.id)) {
      processOrder.push(room.id);
    }
  }
  
  console.log(`Processing ${processOrder.length} rooms in BFS order from ${entrances.length} entrances...`);
  console.log(`Using model: ${MODEL}`);
  console.log(`Ollama URL: ${OLLAMA_URL}`);
  
  // Count already-done rooms
  const alreadyDone = processOrder.filter(id => roomById.get(id)?.description).length;
  if (alreadyDone > 0) {
    console.log(`Resuming: ${alreadyDone} rooms already have descriptions, ${processOrder.length - alreadyDone} remaining`);
  }
  console.log('');
  
  // Process rooms in order
  let completed = 0;
  let skipped = 0;
  const startTime = Date.now();
  
  for (const roomId of processOrder) {
    const room = roomById.get(roomId);
    if (!room) {
      console.log(`  Skipping ${roomId} - room not found`);
      continue;
    }
    
    // Skip rooms that already have descriptions (resume support)
    if (room.description && !room.description.startsWith('[Generation failed')) {
      skipped++;
      continue;
    }
    
    // Get neighbors with their current descriptions (if any)
    const neighborIds = adjacency.get(roomId) || [];
    const neighbors = neighborIds.map(id => roomById.get(id)).filter((n): n is Room => n !== undefined);
    
    // Build and send prompt
    const prompt = buildPrompt(room, neighbors, world.meta);
    try {
      const description = await callOllama(prompt);
      room.description = description;
      
      completed++;
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = completed / elapsed;
      const totalRemaining = processOrder.length - skipped - completed;
      const remaining = rate > 0 ? totalRemaining / rate : 0;
      
      console.log(`[${skipped + completed}/${processOrder.length}] ${room.id} (${room.roomType}, ${room.era})`);
      console.log(`  ${description.substring(0, 80)}...`);
      console.log(`  ETA: ${Math.round(remaining)}s remaining`);
      
      // Save after EVERY room for resume support
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(world, null, 2));
      console.log('');
      
    } catch (error) {
      console.error(`  Error generating for ${roomId}:`, error);
      room.description = `[Generation failed: ${error}]`;
      // Still save so we can retry just the failed ones
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(world, null, 2));
    }
  }
  
  return world;
}

async function main() {
  console.log('=== Room Description Generator ===');
  console.log(`Input: ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log('');
  
  // Load world data
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8')) as WorldExport;
  console.log(`Loaded ${data.rooms.length} rooms, ${data.exits.length} exits`);
  
  // Check Ollama connection
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!response.ok) throw new Error('Ollama not responding');
    const models = await response.json();
    console.log(`Ollama connected. Available models: ${models.models?.map((m: any) => m.name).join(', ') || 'none'}`);
  } catch (error) {
    console.error(`Cannot connect to Ollama at ${OLLAMA_URL}`);
    console.error('Start Ollama with: docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama');
    console.error(`Then pull model: docker exec ollama ollama pull ${MODEL}`);
    process.exit(1);
  }
  
  // Generate descriptions
  const result = await generateDescriptions(data);
  
  // Save final output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log('');
  console.log(`=== Complete! Saved to ${OUTPUT_FILE} ===`);
}

main().catch(console.error);
