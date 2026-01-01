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
3. Create bidirectional exits to ALL valid neighbors (see prompt for exit creation)

SPATIAL RULES FOR EXITS (CRITICAL - think carefully!):

HORIZONTAL (same z):
- Both outdoor at z=0: Street, alley, sidewalk - YES
- Both outdoor at z>0: Open air between rooftops - YES if adjacent
- z=0 outdoor to z=0 indoor: Door into building - YES
- z>0 indoor different columns: NO! Different buildings!
- Diagonal at z>0: NO diagonal air connections

VERTICAL (same x,y column) - NOT AUTOMATIC!
- Floors do NOT automatically connect just because they're stacked
- Vertical access requires INTENTIONAL infrastructure:
  * STAIRS: Connect adjacent floors only (z to z+1), name exit 'stairs'
  * ELEVATOR: Use $elevator for multi-floor access, NOT direct exits
  * LADDER: For maintenance access, fire escapes
  * RESTRICTED: Some floors only accessible by specific means

VERTICAL ACCESS PATTERNS:
- Public building: Stairs z=0↔z=1↔z=2, elevator for all floors
- Secure building: Lobby stairs to z=1, elevator-only above
- Warehouse: Ground floor only, ladder to roof
- Apartment: Stairs every floor, no direct roof access
- Skyscraper: Express elevator skips floors, local stairs

DO NOT create 'up'/'down' exits between every floor automatically!
Ask: "How would someone ACTUALLY get between these floors?"

THINK ARCHITECTURALLY:
- Buildings are vertical stacks (same x,y column)
- Streets are horizontal connections (same z=0)
- Vertical access is DESIGNED, not automatic
- Elevators are rooms that MOVE, not simple exits
- Stairs connect ADJACENT floors only

Use execute_moo_code. Return { built: true, roomId, name } or { built: false, reason: '...' }\`;

      // Call AI
      const { response } = await $aiQuery(self.buildPrompt, prompt);

      // Check if room was created
      const created = await $spatial.getRoomDataAt(x, y, z);
      return created || null;
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

// 3. Link to valid neighbors ONLY - think architecturally!

// HORIZONTAL (same z):
// - Both outdoor z=0: Street/alley - YES
// - Both outdoor z>0: Rooftop/air - YES if adjacent
// - z=0 outdoor→indoor: Building entrance - YES
// - z>0 indoor different column: NO! Different buildings!

// VERTICAL (same column) - NOT AUTOMATIC!
// - Floors don't auto-connect just because they stack
// - STAIRS: Only adjacent floors (z↔z+1), name it 'stairs'
// - ELEVATOR: Use $elevator object, NOT direct exits
// - LADDER: For maintenance, fire escape
// - Ask: "How would someone ACTUALLY get here?"

// BUILDING PATTERNS:
// - Office: stairs lobby↔2nd, elevator all floors
// - Warehouse: ground only, ladder to roof
// - Apartment: stairs each floor
// - Secure: elevator-only above certain floors

return { built: true, roomId: room.id, name: room.name };
\`\`\`

## IF YOU REFUSE

\`\`\`javascript
return { built: false, reason: 'Explanation of why this does not make sense' };
\`\`\`

## STYLE

Cyberpunk noir. Gritty, atmospheric. Rain-soaked dystopia.
Names: Short, evocative ("Neon Alley", "Open Sky", "Murky Depths")
Descriptions: Sensory details, mood, hints of story.

## EXIT SYSTEM

Exits connect rooms. Create bidirectional exits (one in each direction) for normal passages.

### Exit Properties
- name: Direction name ('north', 'door', 'stairs')
- aliases: Shortcuts (['n'], ['d', 'dn'])
- destRoom: Destination room object
- distance: Meters (affects travel time)
- hidden: true = secret passage (not shown in room description)
- vehicleAllowed: true for roads/streets, false for stairs/ladders/indoor

### Custom Exit (named passage)
\`\`\`javascript
const exit = await $recycler.create($exit, {
  name: 'rusty door',
  aliases: ['door', 'west', 'w'],
  destRoom: backRoom,
  distance: 5,
  hidden: false,
  vehicleAllowed: false
});
await room.addExit(exit);
\`\`\`

## DOOR SYSTEM

Doors are shared objects that control passage. Attach to exits for access control.

### Creating a Door on an Exit
\`\`\`javascript
// Create the door
const door = await $recycler.create($door, {
  name: 'steel security door',
  locked: true,
  open: false,
  lockDifficulty: 7,  // 1-10, harder to pick
  durability: 100,     // structural integrity
  material: 'steel',   // affects forcing/damage
  autolockOnClose: true
});

// Create exit with door attached
const exit = await $recycler.create($exit, {
  name: 'security door',
  aliases: ['door', 'north', 'n'],
  destRoom: secureRoom,
  door: door  // Attach the door
});
await lobby.addExit(exit);

// Create return exit sharing SAME door
const returnExit = await $recycler.create($exit, {
  name: 'security door',
  aliases: ['door', 'south', 's'],
  destRoom: lobby,
  door: door  // Same door object - bidirectional
});
await secureRoom.addExit(returnExit);
\`\`\`

### Door Properties
- locked: true = won't open without authorization
- open: true = swung open, passage allowed
- locks: Array of $lock objects for access control
- lockDifficulty: 1-10 resistance to picking
- durability: 0-100 structural integrity
- material: 'wood', 'steel', 'glass' (affects damage)
- autolockOnClose: true = auto-locks when closed

### Door State for Passage
- canPass(): returns true if open && !locked
- AI narrator handles unlock/pick/force via abilities

## LOCK SYSTEM

Locks provide authorization. Add to doors or exits for access control.

### Creating a Locked Door
\`\`\`javascript
// Create a lock with authorized users
const lock = await $recycler.create($lock, {
  name: 'security lock',
  verifiedUsers: [manager, securityGuard],  // Pre-authorized
  difficulty: 6
});

// Create door with lock
const door = await $recycler.create($door, {
  name: 'office door',
  locked: true,
  open: false,
  locks: [lock]  // Lock controls access
});
\`\`\`

### Lock Properties
- verifiedUsers: Array of authorized player objects
- difficulty: 1-10 picking resistance

### Lock Methods
- isAuthorized(player): Check if player in verifiedUsers
- authorize(player): Add player to verifiedUsers
- revoke(player): Remove from verifiedUsers

### Multiple Locks (composable security)
\`\`\`javascript
const keyLock = await $recycler.create($lock, { verifiedUsers: [] });
const bioLock = await $recycler.create($biometricLock, { verifiedUsers: [] });

const door = await $recycler.create($door, {
  locks: [keyLock, bioLock]  // Both must authorize
});
\`\`\`

## ELEVATOR SYSTEM

Elevators are rooms that move between floors. Use for vertical building access.

### Creating an Elevator
\`\`\`javascript
// Create elevator (it's a room that moves)
const elevator = await $recycler.create($elevator, {
  name: 'Main Elevator',
  description: 'Brushed steel walls reflect distorted neon. A panel glows with floor buttons.',
  currentFloor: 1,
  floors: [1, 2, 3, 10, 11, 42],  // Accessible floors
  floorRooms: {},  // Will be populated
  doorsOpen: true,
  travelTimePerFloor: 2000,  // 2 seconds per floor
  capacity: 8
});

// Create lobby rooms for each floor
const lobby1 = await $recycler.create($room, { name: 'Ground Floor Lobby', x: 5, y: 5, z: 0 });
const lobby2 = await $recycler.create($room, { name: 'Second Floor', x: 5, y: 5, z: 1 });
const lobby42 = await $recycler.create($room, { name: 'Penthouse Lobby', x: 5, y: 5, z: 14 });

// Map floors to rooms
elevator.floorRooms = {
  1: lobby1,
  2: lobby2,
  42: lobby42
};

// Create 'out' exit from elevator (updates destination on arrival)
const elevatorOut = await $recycler.create($exit, {
  name: 'out',
  aliases: ['o', 'exit', 'doors'],
  destRoom: lobby1,  // Initial destination
  distance: 2
});
await elevator.addExit(elevatorOut);

// Create 'elevator' exit from each lobby INTO the elevator
for (const [floor, lobby] of Object.entries(elevator.floorRooms)) {
  const toElevator = await $recycler.create($exit, {
    name: 'elevator',
    aliases: ['e', 'lift'],
    destRoom: elevator,
    distance: 2
  });
  await lobby.addExit(toElevator);
}
\`\`\`

### Elevator Properties
- currentFloor: Current floor number
- floors: Array of accessible floor numbers [1, 2, 10, 42]
- floorRooms: Map { floorNum: roomObject }
- moving: true while in motion
- destination: Target floor (or null)
- doorsOpen: true when doors open
- travelTimePerFloor: ms per floor (default 2000)
- capacity: Max passengers
- locks: Array of locks for floor access control

### Elevator Operation
- Player says "press 5" → AI calls elevator.selectFloor(player, 5)
- selectFloor() checks locks, closes doors, schedules arrival
- arrive() updates currentFloor, changes 'out' exit destination, opens doors

### Restricted Floor Access
\`\`\`javascript
// Create lock for penthouse
const penthouseLock = await $recycler.create($lock, {
  name: 'penthouse access',
  verifiedUsers: [owner, butler]
});

// Add to elevator
elevator.locks = [penthouseLock];

// Now only authorized users can select floor 42
\`\`\`

### Elevator Doors (lobby side)

Use $elevatorDoor on lobby exits - only allows passage when elevator is present.

\`\`\`javascript
// Create elevator door for lobby
const elevatorDoor = await $recycler.create($elevatorDoor, {
  name: 'Elevator Doors',
  elevator: elevator,  // Reference to the elevator
  floor: 1             // This door is on floor 1
});

// Create exit from lobby with elevator door
const toElevator = await $recycler.create($exit, {
  name: 'elevator',
  aliases: ['e', 'lift'],
  destRoom: elevator,
  door: elevatorDoor  // Blocks entry when elevator not present
});
await lobby.addExit(toElevator);
\`\`\`

### $elevatorDoor Properties
- elevator: Reference to elevator object
- floor: Floor number this door is on
- canPass(): Only true when elevator.currentFloor === floor AND elevator.doorsOpen

## GUARDED EXITS

Use $guardedExit for faction-restricted passages.

\`\`\`javascript
// Create faction-restricted exit
const factionDoor = await $recycler.create($guardedExit, {
  name: 'secure passage',
  aliases: ['passage', 'north', 'n'],
  destRoom: factionHQ,
  allowedFaction: 'Continuum',  // Only Continuum members pass
  denyMessage: 'The guards block your way. "Continuum personnel only."'
});
await lobby.addExit(factionDoor);
\`\`\`

### $guardedExit Properties
- allowedFaction: Faction name that can pass (null = unrestricted)
- denyMessage: Custom rejection message
- Faction check happens BEFORE door/lock checks

## WHEN TO CREATE WHAT

| Situation | Create |
|-----------|--------|
| Open passage between rooms | Two $exit objects (bidirectional) |
| Passage with door | $exit + $door attached |
| Locked door | $door with locks:[$lock] |
| Secret passage | $exit with hidden:true |
| Multi-floor building | $elevator + lobby rooms + $elevatorDoor |
| Vehicle road | $exit with vehicleAllowed:true |
| Stairs between floors | $exit named 'stairs' (no vehicleAllowed) |
| Faction-restricted area | $guardedExit with allowedFaction |

## CREATING BIDIRECTIONAL EXITS

When connecting two rooms, always create exits in BOTH directions:

\`\`\`javascript
// Forward exit: room1 → room2
const exitForward = await $recycler.create($exit, {
  name: 'north',
  aliases: ['n'],
  destRoom: room2,
  distance: 30
});
await room1.addExit(exitForward);

// Backward exit: room2 → room1
const exitBackward = await $recycler.create($exit, {
  name: 'south',
  aliases: ['s'],
  destRoom: room1,
  distance: 30
});
await room2.addExit(exitBackward);
\`\`\`

Standard direction opposites:
- north ↔ south
- east ↔ west
- up ↔ down
- northeast ↔ southwest
- northwest ↔ southeast
- in ↔ out`;
  }
}

registerBuilder(BuilderSystemBuilder);
