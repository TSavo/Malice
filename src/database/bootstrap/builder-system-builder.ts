import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { type Builder, registerBuilder } from './builder-registry';

/**
 * Builds the $builder system object
 *
 * AI-powered world builder that creates contextually appropriate rooms.
 * Uses $aiQuery to explore surroundings, understand terrain, and generate
 * rooms that fit the existing world.
 *
 * Key principle: Rooms are PERMANENT once created. The AI must understand
 * context before creating, because there's no undo.
 */
export class BuilderSystemBuilder implements Builder {
  static provides = ['builder'];
  static depends = ['room', 'exit']; // Uses $spatial at runtime (not build time)

  private builder: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.builder) {
      this.builder = await this.manager.load(aliases.builder);
      if (this.builder) return; // Already exists
    }

    // Create new $builder
    const root = await this.manager.load('root');
    this.builder = await this.manager.create({
      parent: root!,
      properties: {
        name: 'Builder',
        description:
          'AI-powered world builder. Creates contextually appropriate rooms.',

        // The system prompt for room building AI
        buildPrompt: this.getBuildPrompt(),

        // Session tracking for multi-step builds
        sessions: {},

        abilities: `Infrastructure for AI-powered world building.

WORKFLOW:
1. Create room: const room = await $recycler.create($room, { x, y, z })
2. Build: await $builder.build(room, hints?)

BUILD: build(room, hints?) uses AI to:
- Set name, description, lighting, population based on terrain and neighbors
- Create bidirectional exits to all adjacent rooms with appropriate names
All in one AI call.

CONNECT: connect(room1, room2, direction) creates bidirectional exits between rooms.
Calculates distance from coordinates. Uses opposite direction for return exit.

SET EXIT: setExit(fromRoom, direction, toRoom, options) creates one-way exit.
Options: distance, hidden, locked, door, vehicleAllowed.

PRINCIPLE: Rooms are PERMANENT. Build thoughtfully.`,
      },
      methods: {},
    });

    // ============== BUILD METHOD ==============
    this.builder.setMethod(
      'build',
      `
      /** Use AI to fully build a room: set properties AND create exits to neighbors.
       * @param room - The room to build (must have x, y, z set)
       * @param hints - Optional hints like "warehouse", "rooftop", "subway"
       * @returns { success, room, aiResponse }
       */
      const room = args[0];
      const hints = args[1] || '';

      if (!room) {
        return { error: 'Room is required' };
      }

      const x = room.x;
      const y = room.y;
      const z = room.z;

      if (x === undefined || y === undefined || z === undefined) {
        return { error: 'Room must have x, y, z coordinates set' };
      }

      // Gather context about surroundings
      const context = await self.gatherContext(x, y, z);

      // Filter to neighbors that exist for exit creation
      const existingNeighbors = context.neighbors.filter(n => n.room);

      // Build neighbor info for prompt
      let neighborInfo = 'None (isolated room)';
      if (existingNeighbors.length > 0) {
        neighborInfo = '';
        for (const n of existingNeighbors) {
          neighborInfo += '- ' + n.direction.toUpperCase() + ' (#' + n.room.id + '): "' + n.room.name + '" - ' + (n.room.outdoor ? 'outdoor' : 'indoor') + '\\n';
        }
      }

      // Build the prompt for AI
      const prompt = \`Build room #\${room.id} at coordinates (\${x}, \${y}, \${z}).

TERRAIN: \${context.terrain}
HINTS: \${hints || 'none'}

SURROUNDING CONTEXT:
\${context.surroundingsText}

NEIGHBORS TO LINK:
\${neighborInfo}

You must do TWO things in a SINGLE execute_moo_code call:

1. SET ROOM PROPERTIES based on context:
   - name: Short, evocative (e.g., "Rain-Slicked Alley", "Abandoned Server Room")
   - description: 2-4 sentences with sensory details, cyberpunk noir tone
   - outdoor: true/false based on location
   - lighting: 0-100 (0=dark, 100=bright)
   - population: 0-100 for ambient crowd
   - ambientNoise: 0-100

2. CREATE BIDIRECTIONAL EXITS to each neighbor:
   - Use appropriate names (compass for streets, "door"/"stairs" for transitions)
   - Include standard aliases (n, s, e, w, u, d)
   - Set vehicleAllowed: true for streets, false for stairs/doors

Example execute_moo_code:
\\\`\\\`\\\`javascript
const room = await $load(\${room.id});

// 1. Set room properties
room.name = 'Neon Alley';
room.description = 'Broken neon flickers overhead, casting shadows across oily puddles. The distant thrum of bass leaks from somewhere above.';
room.outdoor = true;
room.lighting = 40;
room.population = 10;
room.ambientNoise = 30;

// 2. Create exits to neighbors
const northRoom = await $load(123);  // Replace with actual IDs
const exitNorth = await $recycler.create($exit, {
  name: 'north',
  aliases: ['n'],
  destRoom: northRoom,
  distance: 10,
  vehicleAllowed: true,
});
await room.addExit(exitNorth);

// Return exit
const exitSouth = await $recycler.create($exit, {
  name: 'south',
  aliases: ['s'],
  destRoom: room,
  distance: 10,
  vehicleAllowed: true,
});
await northRoom.addExit(exitSouth);

return { success: true, name: room.name };
\\\`\\\`\\\`

Do this for ALL neighbors listed above. Use the actual room IDs shown.\`;

      // Call AI to build the room
      const { response } = await $aiQuery(self.buildPrompt, prompt);

      return { success: true, room: room, aiResponse: response };
      `,
    );

    // ============== GATHER CONTEXT ==============
    this.builder.setMethod(
      'gatherContext',
      `
      /** Gather context about surroundings of coordinates.
       * @param x - X coordinate
       * @param y - Y coordinate
       * @param z - Z coordinate
       * @returns Context object with terrain, neighbors, etc.
       */
      const x = args[0];
      const y = args[1];
      const z = args[2];

      // Get terrain type
      const terrain = await $spatial.getTerrainAt(x, y);

      // Check all 6 directions for neighbors
      const directions = [
        { name: 'north', dx: 0, dy: 1, dz: 0 },
        { name: 'south', dx: 0, dy: -1, dz: 0 },
        { name: 'east', dx: 1, dy: 0, dz: 0 },
        { name: 'west', dx: -1, dy: 0, dz: 0 },
        { name: 'up', dx: 0, dy: 0, dz: 1 },
        { name: 'down', dx: 0, dy: 0, dz: -1 },
      ];

      const neighbors = [];
      let surroundingsText = '';

      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        const nz = z + dir.dz;

        const neighbor = await $spatial.getRoomDataAt(nx, ny, nz);
        if (neighbor) {
          neighbors.push({
            direction: dir.name,
            room: neighbor,
            x: nx,
            y: ny,
            z: nz,
          });
          surroundingsText += dir.name.toUpperCase() + ' (' + nx + ',' + ny + ',' + nz + '): ';
          surroundingsText += neighbor.name + ' - ' + (neighbor.description || '(no description)');
          surroundingsText += neighbor.outdoor ? ' [outdoor]' : ' [indoor]';
          surroundingsText += '\\n';
        } else {
          surroundingsText += dir.name.toUpperCase() + ' (' + nx + ',' + ny + ',' + nz + '): (empty)\\n';
        }
      }

      // Also check rooms in the same column for vertical context
      const column = await $spatial.getRoomsInColumn(x, y);
      if (column.length > 0) {
        surroundingsText += '\\nOTHER ROOMS IN COLUMN (x=' + x + ', y=' + y + '):\\n';
        for (const room of column) {
          if (room.z !== z) {
            surroundingsText += '  z=' + room.z + ': ' + room.name;
            surroundingsText += room.outdoor ? ' [outdoor]' : ' [indoor]';
            surroundingsText += '\\n';
          }
        }
      }

      return {
        terrain,
        neighbors,
        surroundingsText: surroundingsText || 'No surrounding rooms found.',
        x, y, z,
      };
      `,
    );

    // ============== CONNECT METHOD ==============
    this.builder.setMethod(
      'connect',
      `
      /** Create bidirectional exits between two rooms.
       * @param room1 - First room
       * @param room2 - Second room
       * @param direction - Direction from room1 to room2 (e.g., 'north')
       * @param options - Optional: { distance, vehicleAllowed }
       * @returns { success, exits }
       */
      const room1 = args[0];
      const room2 = args[1];
      const direction = args[2];
      const options = args[3] || {};

      if (!room1 || !room2 || !direction) {
        return { error: 'room1, room2, and direction are required' };
      }

      // Calculate distance from coordinates if not provided
      let distance = options.distance;
      if (!distance && room1.distanceTo) {
        distance = await room1.distanceTo(room2);
      }
      distance = distance || 10;

      // Get opposite direction
      const opposites = {
        north: 'south', south: 'north',
        east: 'west', west: 'east',
        northeast: 'southwest', southwest: 'northeast',
        northwest: 'southeast', southeast: 'northwest',
        up: 'down', down: 'up',
        in: 'out', out: 'in',
      };
      const opposite = opposites[direction.toLowerCase()] || 'back';

      // Get standard aliases for directions
      const aliasMap = {
        north: ['n'], south: ['s'], east: ['e'], west: ['w'],
        northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
        up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
      };
      const aliases1 = aliasMap[direction.toLowerCase()] || [];
      const aliases2 = aliasMap[opposite.toLowerCase()] || [];

      // Create exit from room1 to room2
      const exit1 = await $recycler.create($exit, {
        name: direction,
        aliases: aliases1,
        destRoom: room2,
        distance: distance,
        vehicleAllowed: options.vehicleAllowed || false,
      });
      await room1.addExit(exit1);

      // Create return exit from room2 to room1
      const exit2 = await $recycler.create($exit, {
        name: opposite,
        aliases: aliases2,
        destRoom: room1,
        distance: distance,
        vehicleAllowed: options.vehicleAllowed || false,
      });
      await room2.addExit(exit2);

      return {
        success: true,
        exits: { forward: exit1, backward: exit2 },
        distance: distance,
      };
      `,
    );

    // ============== SET EXIT METHOD ==============
    this.builder.setMethod(
      'setExit',
      `
      /** Create a one-way exit from one room to another.
       * @param fromRoom - Source room
       * @param direction - Direction name (e.g., 'north', 'door')
       * @param toRoom - Destination room
       * @param options - Optional: { distance, hidden, locked, door, vehicleAllowed, aliases }
       * @returns The created exit
       */
      const fromRoom = args[0];
      const direction = args[1];
      const toRoom = args[2];
      const options = args[3] || {};

      if (!fromRoom || !direction || !toRoom) {
        return { error: 'fromRoom, direction, and toRoom are required' };
      }

      // Calculate distance if not provided
      let distance = options.distance;
      if (!distance && fromRoom.distanceTo) {
        distance = await fromRoom.distanceTo(toRoom);
      }
      distance = distance || 10;

      // Get aliases
      const aliasMap = {
        north: ['n'], south: ['s'], east: ['e'], west: ['w'],
        northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
        up: ['u'], down: ['d', 'dn'], in: ['i'], out: ['o'],
      };
      const aliases = options.aliases || aliasMap[direction.toLowerCase()] || [];

      // Create exit
      const exit = await $recycler.create($exit, {
        name: direction,
        aliases: aliases,
        destRoom: toRoom,
        distance: distance,
        hidden: options.hidden || false,
        locked: options.locked || false,
        vehicleAllowed: options.vehicleAllowed || false,
      });

      // Add door if specified
      if (options.door) {
        exit.door = options.door;
      }

      // Add to room
      await fromRoom.addExit(exit);

      return exit;
      `,
    );

    // ============== DESCRIBE METHOD ==============
    this.builder.setMethod(
      'describe',
      `
      /** Get description of the builder system. */
      return \`Builder System

USAGE:
  // Step 1: Create an empty room with coordinates
  const room = await $recycler.create($room, { x: 5, y: 3, z: 0 });

  // Step 2: Let AI name, describe, and connect it
  await $builder.build(room, 'abandoned warehouse');  // hints optional

WHAT build() DOES:
  - Queries surrounding rooms for context
  - Sets name, description, outdoor, lighting, population, ambientNoise
  - Creates bidirectional exits to neighbors (only where physically sensible!)
  - 30m horizontal distance, 3m vertical distance

MANUAL TOOLS:
  $builder.connect(room1, room2, direction) - Bidirectional exits
  $builder.setExit(from, direction, to, options) - One-way exit
  $builder.gatherContext(x, y, z) - Get surrounding room info

SPATIAL RULES (IMPORTANT):
  - z>0 rooms don't connect horizontally (different buildings!)
  - Same x,y different z → vertical stairs/elevator OK
  - z=0 outdoor to outdoor → streets connect OK
\`;
      `,
    );

    // Property descriptions
    this.builder.setPropertyDescription(
      'buildPrompt',
      'System prompt for the AI when creating rooms',
    );
    this.builder.setPropertyDescription(
      'sessions',
      'Tracking for multi-step build operations',
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.builder) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'builder', this.builder.id);
    console.log(`  ✅ Registered $.builder -> #${this.builder.id}`);
  }

  /**
   * Generate the comprehensive system prompt for room building AI
   */
  private getBuildPrompt(): string {
    return `# World Builder AI

You are an AI that builds rooms for a cyberpunk noir MOO game set in dystopian Seattle, 2077. Your job is to take an empty room (already created with coordinates) and give it life: name, description, properties, and connections to neighboring rooms.

## CRITICAL: Permanence

Rooms are PERMANENT once built. There is no undo. You must:
- Study the surrounding context carefully before deciding what this room should be
- Match the tone, style, and logic of neighboring rooms
- Create sensible connections that make spatial sense

---

# PART 1: UNDERSTANDING ROOMS

## What is a Room?

A Room is a location players can occupy. It has:

### Identity Properties
- \`name\`: Short, evocative title (e.g., "Rain-Slicked Alley", "Abandoned Server Room")
- \`description\`: 2-4 sentences of atmospheric prose with sensory details

### Spatial Properties
- \`x, y, z\`: Integer coordinates (already set when you receive the room)
  - X: East (+) / West (-) — each unit = 30 meters (one city block)
  - Y: North (+) / South (-) — each unit = 30 meters (one city block)
  - Z: Up (+) / Down (-) — each unit = 3 meters (one building floor)
    - z=0 is street level
    - z=3 is roughly the 3rd floor (~9 meters up)
    - z=-1 is one floor underground

### Environment Properties
- \`outdoor\`: boolean - Is this outside? Affects weather, natural light
- \`lighting\`: 0-100 (0=pitch black, 30=dim, 60=normal indoor, 100=bright daylight)
- \`population\`: 0-100 - Ambient crowd level (NPCs, passersby). 0=empty, 50=busy, 100=packed
- \`ambientNoise\`: 0-100 - Background noise (0=silent, 30=quiet murmur, 70=loud, 100=deafening)
- \`waterLevel\`: 0-100 (0=dry, 30=ankle, 50=waist, 100=submerged) - Usually 0 unless sewers/flooded

### Exit Property
- \`exits\`: Array of Exit objects (you add to this via room.addExit())

## Terrain Types

Based on coordinates, terrain affects what makes sense:
- \`urban\`: Inside city limits - streets, buildings, alleys, plazas
- \`water\`: Elliott Bay (western edge) - docks, piers, or open water
- \`badlands\`: Outside city - ruins, radioactive wastes, wilderness

---

# PART 2: UNDERSTANDING EXITS

## What is an Exit?

An Exit is a one-way passage from one room to another. For players to travel both ways, you need TWO exits (one in each room pointing to the other).

### Exit Properties
- \`name\`: The direction or passage name (e.g., "north", "rusty door", "stairs up", "fire escape")
- \`aliases\`: Array of shortcuts (e.g., ["n"] for north, ["d", "dn"] for down)
- \`destRoom\`: The destination room object
- \`distance\`: Distance in meters (affects travel time)
  - Horizontal (same z): ~30 meters between grid squares
  - Vertical (stairs): ~3 meters per floor
  - Within same room (door to door): 5-10 meters
- \`hidden\`: boolean - If true, doesn't appear in room description (secret passages)
- \`locked\`: boolean - If true, blocks passage until unlocked
- \`vehicleAllowed\`: boolean - Can vehicles use this? True for roads/streets, false for stairs/doors/ladders

### Standard Direction Aliases
\`\`\`javascript
const aliasMap = {
  north: ['n'], south: ['s'], east: ['e'], west: ['w'],
  northeast: ['ne'], northwest: ['nw'], southeast: ['se'], southwest: ['sw'],
  up: ['u'], down: ['d', 'dn'],
  in: ['i'], out: ['o'],
};
\`\`\`

### Creating Bidirectional Exits
Always create BOTH directions:
\`\`\`javascript
// Horizontal: From new room going north to existing room (30m = one block)
const exitNorth = await $recycler.create($exit, {
  name: 'north',
  aliases: ['n'],
  destRoom: existingNorthRoom,
  distance: 30,  // 30m for horizontal movement
  vehicleAllowed: true,
});
await newRoom.addExit(exitNorth);

// Return exit
const exitSouth = await $recycler.create($exit, {
  name: 'south',
  aliases: ['s'],
  destRoom: newRoom,
  distance: 30,
  vehicleAllowed: true,
});
await existingNorthRoom.addExit(exitSouth);

// Vertical: Stairs (3m = one floor)
const exitUp = await $recycler.create($exit, {
  name: 'stairs up',
  aliases: ['u', 'up'],
  destRoom: upstairsRoom,
  distance: 3,  // 3m for one floor
  vehicleAllowed: false,  // Can't drive up stairs!
});
\`\`\`

---

# PART 3: SPATIAL AWARENESS (CRITICAL!)

## Physical Reality Check

You are building in Seattle. Buildings are SEPARATE structures. The key rule is:
**INDOOR rooms at z>0 cannot connect horizontally to rooms in different buildings.**

But OUTDOOR spaces CAN connect horizontally at any z-level because you can walk/fly between them.

## Exit Rules by Location

### Same Column (same x,y, different z)
- Vertical movement (up/down) via stairs, elevator, ladder: ALWAYS ALLOWED
- These ARE connected - they're the same structure or same airspace column
- Outdoor to outdoor vertically: ALLOWED (flying, climbing, falling)

### Different Columns (different x,y), ANY z-level
**Check: Are BOTH rooms outdoor?**
- BOTH outdoor → ALLOWED (streets connect, rooftops connect, open sky connects)
- One or both indoor → NOT ALLOWED at z>0 (different buildings)
- z=0 outdoor→indoor: ALLOWED (entering a building)

### Ground Level (z = 0)
- Outdoor-to-outdoor: ALLOWED (streets, plazas, parks)
- Outdoor to indoor: ALLOWED (entering building)
- Indoor to indoor (different x,y): NOT ALLOWED (different buildings)

### Above Ground (z > 0)
- **Both outdoor (rooftops, airspace)**: ALLOWED - you can walk/fly between adjacent rooftops
- **Indoor to indoor**: NOT ALLOWED - these are different buildings!
- **Indoor to outdoor**: Usually NOT ALLOWED unless this IS the rooftop access

### Underground (z < 0)
- Tunnels/sewers may connect horizontally (context-dependent)
- Basements usually don't connect to neighbor basements
- Use judgment based on what the spaces are

## Decision Tree for Exits

1. **Is the neighbor in the same column (same x,y)?**
   - YES → vertical exit is OK (stairs/elevator/ladder/flying)

2. **Are BOTH this room AND the neighbor outdoor?**
   - YES → horizontal exit is OK at ANY z-level
     - z=0: streets, plazas ("north", "south")
     - z>0: rooftops, airspace ("leap to north rooftop", "fly north")
   - NO → continue to step 3

3. **Are we at z=0 AND is this an outdoor→indoor transition?**
   - YES → door/entrance exit is OK
   - NO → DO NOT CREATE an exit

## Examples

**WRONG**: Room at (5, 3, 3) [indoor office] creating exit "west" to room at (4, 3, 3) [indoor apartment]
→ Different buildings! No connection.

**RIGHT**: Room at (5, 3, 3) [outdoor rooftop] creating exit "leap west" to room at (4, 3, 3) [outdoor rooftop]
→ Both outdoor, rooftops can connect.

**RIGHT**: Room at (5, 3, 5) [open sky] creating exit "fly north" to room at (5, 4, 5) [open sky]
→ Both outdoor airspace, flying between them.

**RIGHT**: Room at (5, 3, 3) [indoor office] creating exit "down" to room at (5, 3, 2) [indoor hallway]
→ Same column, vertical is OK.

**RIGHT**: Room at (5, 3, 0) [outdoor street] creating exit "lobby door" to room at (5, 3, 0) [indoor lobby]
→ z=0 outdoor→indoor is entering a building. (Note: same coords means building entrance is at street level)

**RIGHT**: Room at (5, 3, 0) [outdoor street] creating exit "north" to room at (5, 4, 0) [outdoor plaza]
→ Ground level outdoor to outdoor.

---

# PART 4: CONTEXT-AWARE BUILDING

## Reading Context

Before building, you'll be told:
1. The room's coordinates (x, y, z)
2. Terrain type at this location
3. What exists in each cardinal direction (including up/down)
4. Any hints provided (e.g., "warehouse", "rooftop")

**CRITICAL**: Just because a neighbor EXISTS doesn't mean you should connect to it!

## Making Decisions Based on Context

### Same column (same x,y), different z → ALWAYS CONNECT vertically
- Indoor: "stairs up", "stairs down", "ladder", "elevator"
- Outdoor: "climb", "fly up", "descend"
- vehicleAllowed=false for stairs, could be true for aircraft in open sky

### Both rooms outdoor (any z) → CONNECT horizontally
- z=0: compass directions ("north", "south")
- z>0 rooftops: "leap to", "cross to", compass directions
- z>0 airspace: "fly north", "glide west"
- vehicleAllowed=true for streets and airspace, false for rooftop leaps

### Ground level (z=0), outdoor→indoor → CONNECT as building entrance
- Use "door", "entrance", "lobby door"
- vehicleAllowed=false
- Consider if door should be locked

### Upper floor (z>0), one or both indoor → CHECK CAREFULLY
- Both indoor, different x,y: NO EXIT (different buildings)
- Indoor to outdoor at same z: NO EXIT (unless rooftop access)
- Same building (same x,y): connect via stairs

### Underground (z<0), horizontal → CONTEXT-DEPENDENT
- Sewers/tunnels might connect
- Basements usually don't
- Subway tunnels connect stations

### Setting outdoor property
- Streets, plazas, rooftops, airspace: outdoor=true
- Buildings, tunnels, basements: outdoor=false
- Water surface: outdoor=true
- Underwater: outdoor=false (enclosed by water)

### Lighting by location
- Outdoor day: 70-100
- Outdoor night/overcast: 30-50
- Indoor well-lit: 60-80
- Underground: 20-40
- Underwater: 10-30 (decreases with depth)

---

# PART 5: LOCKS AND DOORS

## Simple Locking
For basic locks, set on the exit:
\`\`\`javascript
const lockedExit = await $recycler.create($exit, {
  name: 'security door',
  aliases: ['door'],
  destRoom: secureArea,
  locked: true,  // Blocks passage
  distance: 5,
});
\`\`\`

## When to Add Locks
Consider adding locked exits for:
- Private areas (offices, apartments, storage)
- Transition from public to private
- Security checkpoints
- Abandoned areas with valuable contents

Usually just set \`locked: true\`. Advanced door/lock systems exist but aren't needed for basic building.

---

# PART 6: STYLE GUIDE

## Tone
Gritty, atmospheric, noir. This is a rain-soaked dystopia of:
- Neon signs flickering through smog
- Megacorporate towers above, street-level decay below
- Black markets, gang territory, desperate survivors
- Advanced tech mixed with urban blight

## Naming Conventions
Short, evocative names. Examples:
- Streets: "Neon Alley", "Pike Street", "Rainwater Corner"
- Indoor: "Abandoned Server Room", "The Rusty Nail Bar", "Clinic Waiting Room"
- Underground: "Flooded Tunnel", "Smuggler's Cache", "Subway Platform"
- Rooftops: "Wind-Swept Rooftop", "Helipad", "Rooftop Garden"

## Description Style
2-4 sentences with:
- Visual details (lighting, colors, decay, technology)
- Other senses (sounds, smells, textures)
- Atmosphere and mood
- Hints of story, history, or danger

### Example Descriptions

**Street-level outdoor:**
> Broken neon flickers overhead, casting red and blue shadows across puddles of oily water. Dumpsters overflow with refuse, and the distant thrum of bass leaks from a club somewhere above. Gang tags compete with faded corporate logos on the crumbling brick walls.

**Indoor commercial:**
> Flickering fluorescent tubes struggle against the gloom of this abandoned retail space. Empty shelves gather dust, and old promotional holos stutter on loop. The smell of mold and something worse drifts from the back room.

**Underground:**
> Water drips steadily from cracked pipes overhead, pooling in oily puddles across the buckled concrete floor. The only light comes from emergency strips, their glow barely pushing back the darkness. Something skitters away in the shadows.

---

# PART 7: EXECUTION

## Your Task

When given a room to build, you will:

1. **Analyze context**: Study terrain, neighbors, z-level, hints
2. **Decide what this room should be**: Match context logically
3. **Execute one code block** that:
   - Sets room.name
   - Sets room.description
   - Sets room.outdoor, room.lighting, room.population, room.ambientNoise
   - Creates bidirectional exits ONLY where physically sensible (see Part 3!)

## Code Template
\`\`\`javascript
const room = await $load(ROOM_ID);

// 1. Set identity
room.name = 'Evocative Name';
room.description = 'Atmospheric description with sensory details. Multiple sentences painting the scene.';

// 2. Set environment
room.outdoor = true; // or false
room.lighting = 50;  // 0-100
room.population = 10; // 0-100
room.ambientNoise = 20; // 0-100

// 3. Create exits ONLY where physically sensible!
// Remember: z>0 rooms don't connect horizontally to different buildings!

// For a horizontal neighbor at ground level (z=0):
const northRoom = await $load(NEIGHBOR_ID);
const exitNorth = await $recycler.create($exit, {
  name: 'north',
  aliases: ['n'],
  destRoom: northRoom,
  distance: 30,  // 30m = one city block
  vehicleAllowed: true,
});
await room.addExit(exitNorth);

const exitSouth = await $recycler.create($exit, {
  name: 'south',
  aliases: ['s'],
  destRoom: room,
  distance: 30,
  vehicleAllowed: true,
});
await northRoom.addExit(exitSouth);

// For a vertical neighbor (same x,y, different z):
const upRoom = await $load(UPSTAIRS_ID);
const exitUp = await $recycler.create($exit, {
  name: 'stairs up',
  aliases: ['u', 'up'],
  destRoom: upRoom,
  distance: 3,  // 3m = one floor
  vehicleAllowed: false,
});
await room.addExit(exitUp);

const exitDown = await $recycler.create($exit, {
  name: 'stairs down',
  aliases: ['d', 'down'],
  destRoom: room,
  distance: 3,
  vehicleAllowed: false,
});
await upRoom.addExit(exitDown);

return { success: true, name: room.name };
\`\`\`

## Final Checklist
Before your code runs, verify:
- [ ] Name is short and evocative
- [ ] Description is 2-4 sentences with sensory details
- [ ] outdoor=true for streets, rooftops, airspace, water surface
- [ ] lighting makes sense (underground=dim, outdoor=variable, indoor=moderate)
- [ ] **SPATIAL CHECK**: Did I apply the rules correctly?
  - Same x,y, different z → CONNECT (stairs/fly)
  - BOTH outdoor → CONNECT (any z-level)
  - z>0, one or both indoor, different x,y → NO EXIT
  - z=0, outdoor→indoor → CONNECT (door)
- [ ] Exit names match the context:
  - Streets: compass directions
  - Rooftops: "leap west", "cross to north building"
  - Airspace: "fly north", "descend"
  - Building: "door", "stairs"
- [ ] BOTH directions created for each valid connection
- [ ] vehicleAllowed: true for streets/airspace, false for stairs/rooftop-leaps/doors
- [ ] Distance: 30m for horizontal, 3m for vertical`;
  }
}

// Self-register
registerBuilder(BuilderSystemBuilder);
