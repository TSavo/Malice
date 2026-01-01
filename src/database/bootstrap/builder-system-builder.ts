import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the $builder system object
 *
 * Simple interface: build(from, {x, y, z})
 * AI decides if it makes sense, creates room + all exits, or says no.
 */
export class BuilderSystemBuilder implements Builder {
  static provides = ['builder'];
  static depends = ['room', 'exit'];

  private builder: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.builder) {
      this.builder = await this.manager.load(aliases.builder);
      if (this.builder) return;
    }

    const root = await this.manager.load('root');
    this.builder = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Builder',
        description: 'AI-powered world builder. build(from, to) or refuse.',
        buildPrompt: this.getBuildPrompt(),
        abilities: `AI-powered world builder.

build(from, {x, y, z}, hint?) - Build room at coords, linked from 'from'
  Returns: new room with all exits linked, or null if AI refuses
  AI does 3x3x3 search and links ALL valid neighbors

WHEN AI BUILDS:
- Open sky above outdoor room
- Water in water terrain
- Ground level urban with neighbors
- Building floors with structure below

WHEN AI REFUSES:
- Deep ocean (z < -15) without hint
- Indoor z>0 from different building exterior
- Isolated airspace with nothing below
- Badlands without explicit purpose

Rooms are PERMANENT. AI errs on side of refusing.`,
      },
      methods: {},
    });

    // ============== THE ONE METHOD ==============
    this.builder.setMethod(
      'build',
      `
      /**
       * Build a room at coordinates, linked from a source room.
       * AI decides if it makes sense. Does 3x3x3 search for all neighbors.
       *
       * @param from - The room you're coming from (for context)
       * @param to - Target coordinates {x, y, z}
       * @param hint - Optional hint like "airspace", "underwater", "tunnel"
       * @returns New room with exits linked, or null if AI refuses
       */
      const from = args[0];
      const to = args[1];
      const hint = args[2] || '';

      if (!from || !to) {
        console.log('[Builder] build: from and to required');
        return null;
      }

      const x = to.x;
      const y = to.y;
      const z = to.z;

      if (x === undefined || y === undefined || z === undefined) {
        console.log('[Builder] build: to must have x, y, z');
        return null;
      }

      // Already exists? Just return it
      const existing = await $spatial.getRoomDataAt(x, y, z);
      if (existing) return existing;

      // Gather context
      const terrain = await $spatial.getTerrainAt(x, y);
      const fromDesc = from.name + ' (' + (from.outdoor ? 'outdoor' : 'indoor') + ' at z=' + from.z + ')';

      // Calculate direction from 'from' to 'to'
      const dx = x - (from.x || 0);
      const dy = y - (from.y || 0);
      const dz = z - (from.z || 0);
      let direction = '';
      if (dz > 0) direction = 'up';
      else if (dz < 0) direction = 'down';
      else if (dy > 0) direction = 'north';
      else if (dy < 0) direction = 'south';
      else if (dx > 0) direction = 'east';
      else if (dx < 0) direction = 'west';

      // Find all existing neighbors (3x3x3 search)
      const offsets = [
        {dx:0, dy:1, dz:0, dir:'north', rev:'south'},
        {dx:0, dy:-1, dz:0, dir:'south', rev:'north'},
        {dx:1, dy:0, dz:0, dir:'east', rev:'west'},
        {dx:-1, dy:0, dz:0, dir:'west', rev:'east'},
        {dx:0, dy:0, dz:1, dir:'up', rev:'down'},
        {dx:0, dy:0, dz:-1, dir:'down', rev:'up'},
        {dx:1, dy:1, dz:0, dir:'northeast', rev:'southwest'},
        {dx:-1, dy:1, dz:0, dir:'northwest', rev:'southeast'},
        {dx:1, dy:-1, dz:0, dir:'southeast', rev:'northwest'},
        {dx:-1, dy:-1, dz:0, dir:'southwest', rev:'northeast'},
      ];

      let neighborsInfo = '';
      const neighbors = [];
      for (const off of offsets) {
        const n = await $spatial.getRoomDataAt(x + off.dx, y + off.dy, z + off.dz);
        if (n) {
          neighbors.push({ room: n, ...off });
          neighborsInfo += off.dir.toUpperCase() + ': ' + n.name + ' (' + (n.outdoor ? 'outdoor' : 'indoor') + ')\\n';
        }
      }

      // Check column for vertical context
      const column = await $spatial.getRoomsInColumn(x, y);
      let columnInfo = '';
      for (const r of column) {
        columnInfo += 'z=' + r.z + ': ' + r.name + ' (' + (r.outdoor ? 'outdoor' : 'indoor') + ')\\n';
      }

      // Build prompt
      const prompt = \`BUILD REQUEST: Create room at (\${x}, \${y}, \${z})?

COMING FROM: \${fromDesc} going \${direction}
TERRAIN: \${terrain}
HINT: \${hint || 'none'}

NEIGHBORS (3x3x3 search):
\${neighborsInfo || 'None found'}

COLUMN (same x,y):
\${columnInfo || 'Empty column'}

DECISION RULES:
1. z > 0 airspace: Only if outdoor room exists below in column
2. z = 0 water: Only if terrain is 'water'
3. z < 0 underwater: Only if water terrain AND z >= -15
4. z < -15 deep: Only with explicit depth hint
5. z > 0 indoor: Only if building structure exists below (rooms at z=0,1,2...)
6. z < 0 tunnel: Only with infrastructure hint (subway, sewer, tunnel)
7. From indoor z>0 to different column indoor: REFUSE (different buildings)

IF YOU BUILD:
1. Create room with $recycler.create($room, {x:\${x}, y:\${y}, z:\${z}})
2. Set: name, description, outdoor, lighting (0-100), population (0-100), ambientNoise (0-100)
3. Link to ALL valid neighbors using $builder.connect(newRoom, neighbor, direction)

SPATIAL RULES FOR EXITS:
- Same column (same x,y): ALWAYS connect (stairs/fly)
- BOTH outdoor: Connect horizontally (any z)
- z=0 outdoor→indoor: Connect as door
- z>0, not both outdoor, different column: NO CONNECTION
- Diagonal: Only if both outdoor

Use execute_moo_code. Return { built: true, roomId, name } or { built: false, reason: '...' }\`;

      // Call AI
      const { response } = await $aiQuery(self.buildPrompt, prompt);

      // Check if room was created
      const created = await $spatial.getRoomDataAt(x, y, z);
      return created || null;
      `,
    );

    // ============== CONNECT (helper) ==============
    this.builder.setMethod(
      'connect',
      `
      /**
       * Create bidirectional exits between two rooms.
       * @param room1 - First room
       * @param room2 - Second room
       * @param direction - Direction from room1 to room2
       * @param options - { vehicleAllowed }
       */
      const room1 = args[0];
      const room2 = args[1];
      const direction = args[2];
      const options = args[3] || {};

      if (!room1 || !room2 || !direction) return null;

      const opposites = {
        north: 'south', south: 'north',
        east: 'west', west: 'east',
        northeast: 'southwest', southwest: 'northeast',
        northwest: 'southeast', southeast: 'northwest',
        up: 'down', down: 'up',
      };
      const opposite = opposites[direction.toLowerCase()] || 'back';

      const aliasMap = {
        north: ['n'], south: ['s'], east: ['e'], west: ['w'],
        northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
        up: ['u'], down: ['d', 'dn'],
      };

      // Calculate distance
      const dx = Math.abs((room2.x || 0) - (room1.x || 0));
      const dy = Math.abs((room2.y || 0) - (room1.y || 0));
      const dz = Math.abs((room2.z || 0) - (room1.z || 0));
      const distance = Math.round(Math.sqrt(dx*30*dx*30 + dy*30*dy*30 + dz*3*dz*3)) || 10;

      // Forward exit
      const exit1 = await $recycler.create($exit, {
        name: direction,
        aliases: aliasMap[direction.toLowerCase()] || [],
        destRoom: room2,
        distance: distance,
        vehicleAllowed: options.vehicleAllowed || false,
      });
      await room1.addExit(exit1);

      // Return exit
      const exit2 = await $recycler.create($exit, {
        name: opposite,
        aliases: aliasMap[opposite.toLowerCase()] || [],
        destRoom: room1,
        distance: distance,
        vehicleAllowed: options.vehicleAllowed || false,
      });
      await room2.addExit(exit2);

      return { forward: exit1, backward: exit2 };
      `,
    );

    // ============== DESCRIBE ==============
    this.builder.setMethod(
      'describe',
      `
      return \`Builder: build(from, {x,y,z}, hint?)

AI creates room at coordinates if it makes sense.
Does 3x3x3 neighbor search, links all valid exits.
Returns new room or null if AI refuses.\`;
      `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.builder) return;
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;
    await objectManager.call('addAlias', 'builder', this.builder.id);
    console.log(`  ✅ Registered $.builder -> #${this.builder.id}`);
  }

  private getBuildPrompt(): string {
    return `# World Builder AI

You build rooms for a cyberpunk noir MOO in dystopian Seattle 2077.

## YOUR JOB

Given a build request, decide YES or NO. If YES, create the room and link it to all valid neighbors.

## COORDINATE SYSTEM

- X: East (+) / West (-), 30m per unit
- Y: North (+) / South (-), 30m per unit
- Z: Up (+) / Down (-), 3m per unit
- z=0 is street level
- x < -15 is water (Elliott Bay)
- x > 20 or |y| > 15 is badlands

## WHEN TO BUILD

1. **Airspace** (z > 0, outdoor): Only if outdoor room exists directly below
2. **Water surface** (z = 0): Only if terrain is 'water'
3. **Underwater** (z < 0): Only if water terrain AND z >= -15
4. **Deep water** (z < -15): Only with explicit depth hint
5. **Ground urban** (z = 0): If neighbors exist or logical expansion
6. **Building interior** (z > 0, indoor): If rooms exist below in column
7. **Underground**: Only with infrastructure hint (subway, sewer, tunnel)

## WHEN TO REFUSE

- Indoor z>0 accessed from different building's exterior
- Isolated airspace with nothing below
- Deep ocean without depth markers
- Random underground without purpose
- Badlands without explicit camp/ruins hint

## IF YOU BUILD

\`\`\`javascript
// 1. Create room
const room = await $recycler.create($room, { x: X, y: Y, z: Z });

// 2. Set properties
room.name = 'Evocative Name';
room.description = 'Atmospheric 2-4 sentences with sensory details.';
room.outdoor = true; // or false
room.lighting = 50;  // 0-100
room.population = 0; // 0-100
room.ambientNoise = 20; // 0-100

// 3. Link to ALL valid neighbors (provided in prompt)
// Use $builder.connect(room, neighbor, direction, { vehicleAllowed })

// Spatial rules:
// - Same column: ALWAYS connect
// - BOTH outdoor: Connect (any z)
// - z=0 outdoor→indoor: Connect as door
// - z>0, not both outdoor, different column: NO
// - Diagonal: Only both outdoor

return { built: true, roomId: room.id, name: room.name };
\`\`\`

## IF YOU REFUSE

\`\`\`javascript
return { built: false, reason: 'Explanation of why this does not make sense' };
\`\`\`

## STYLE

Cyberpunk noir. Gritty, atmospheric. Rain-soaked dystopia.
Names: Short, evocative ("Neon Alley", "Open Sky", "Murky Depths")
Descriptions: Sensory details, mood, hints of story.`;
  }
}

registerBuilder(BuilderSystemBuilder);
