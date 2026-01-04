# World Building

> **Abilities-First**: When building world objects, use abilities to describe physics and interactions. See `docs/ABILITIES-FIRST.md`.

How to build structured game worlds with rooms, buildings, and coordinate systems.

## Overview

Malice provides two world-building systems:

1. **WorldBuilder** - Street-level outdoor world (grids, coordinates, automatic connections)
2. **BuildingBuilder** - Indoor building interiors (explicit connections, placeholders, multi-floor)

Both work with the same **coordinate system** and **$room / $exit** prototypes.

## Coordinate System

### Pioneer Square Grid

All rooms exist in a 3D integer coordinate space (meters):

```
X-axis: West (-) to East (+)
  -15: Waterfront
   -9: 1st Ave S
   -3: Occidental Ave S
    0: Center
   +3: 2nd Ave S
   +9: 3rd Ave S
  +15: 4th Ave S

Y-axis: South (-) to North (+)
  -10: S. King St
   -5: S. Jackson St
    0: S. Main St
   +5: S. Washington St
  +10: Yesler Way

Z-axis: Vertical
   <0: Underground (tunnels, basements)
    0: Street level
   >0: Building floors (z=1 is 1st floor, z=42 is 42nd floor)
```

**Grid spacing:**
- Horizontal: ~30 meters per coordinate unit
- Vertical: ~3 meters per floor (z unit)

### Why Integers?

- **Precise spatial relationships** - Adjacent rooms are exactly 1 unit apart
- **Automatic connections** - WorldBuilder connects adjacent coordinates
- **Easy pathfinding** - Calculate distance between any two points
- **Building alignment** - Multi-floor buildings share x,y coordinates

## WorldBuilder - Outdoor World

### Purpose

Creates outdoor street-level rooms from TypeScript definition files. Automatically connects adjacent rooms with exits.

### Directory Structure

```
src/database/bootstrap/world/seattle/pioneer-square/
├── yesler-way/           # Y=+10 (east-west street)
│   ├── x-15.ts           # Room at (-15, +10, 0)
│   ├── x-9.ts
│   └── ...
├── s-washington/         # Y=+5
│   └── ...
├── s-main/               # Y=0
│   └── ...
├── s-jackson/            # Y=-5
│   └── ...
├── s-king/               # Y=-10
│   └── ...
├── waterfront/           # X=-15 (north-south avenue)
│   ├── y-10.ts           # Room at (-15, +10, 0)
│   ├── y5.ts
│   └── ...
├── 1st-ave-s/            # X=-9
│   └── ...
├── occidental-ave-s/     # X=-3
│   └── ...
├── 2nd-ave-s/            # X=+3
│   └── ...
├── 3rd-ave-s/            # X=+9
│   └── ...
├── 4th-ave-s/            # X=+15
│   └── ...
├── alleys/               # Non-grid rooms
│   └── ...
└── occidental-park/      # Park areas
    └── ...
```

### Room Definition File

**Example: `s-main/x-3.ts` (S. Main St & Occidental Ave S)**

```typescript
export const room = {
  name: 'S. Main St & Occidental Ave S',
  description: 'A historic intersection in Pioneer Square. The brick ' +
               'buildings here date back to the 1890s, their facades worn ' +
               'but still standing. Traffic lights cycle through their routine.',
  x: -3,        // Occidental Ave S
  y: 0,         // S. Main St
  z: 0,         // Street level
  intersection: ['S. Main St', 'Occidental Ave S'],
  blocked: false,  // If true, this coordinate is not buildable
};
```

### How It Works

1. **Load** - Scans directories, imports all `.ts` files
2. **Create** - Creates room objects with coordinates
3. **Connect** - Automatically creates exits between adjacent rooms
4. **Register** - Sets `$startRoom` alias

**Automatic Exit Creation:**
- Rooms at (x, y+1) get 'north'/'south' exits
- Rooms at (x+1, y) get 'east'/'west' exits
- Rooms at (x, y, z+1) get 'up'/'down' exits
- Distance calculated from grid spacing

### Intersection Rooms

Rooms on multiple streets:

```typescript
export const room = {
  name: 'S. Main St & 2nd Ave S',
  x: 3,
  y: 0,
  z: 0,
  intersection: ['S. Main St', '2nd Ave S'],  // List all streets
  // Room can be reached from both streets
};
```

### Blocked Coordinates

Mark coordinates as non-buildable (solid buildings, no access):

```typescript
export const room = {
  name: 'Solid Building',
  x: 5,
  y: 5,
  z: 0,
  blocked: true,  // WorldBuilder skips this coordinate
};
```

## BuildingBuilder - Indoor Spaces

### Purpose

Creates building interiors with **explicit exit connections** using a placeholder system. Supports multi-floor buildings with cross-floor objects (elevators).

### Why Not WorldBuilder?

Indoor spaces have:
- **Walls** - Not every adjacent coordinate connects
- **Doors** - Specific connections between rooms
- **Elevators** - Shared objects across multiple floors
- **Non-rectangular layouts** - Irregular room arrangements

### Placeholder System

Use `%0`, `%1`, `%2`, etc. as temporary IDs. These get resolved to real object IDs during build.

**Why placeholders?**
- Define room graphs before objects exist
- Reference rooms not yet created
- Share objects across files (like `%E` for elevator)

### Directory Structure

```
src/database/bootstrap/world/seattle/pioneer-square/buildings/
└── smith-tower/
    ├── z1.ts         # Floor 1 (z=1)
    ├── z2.ts         # Floor 2 (z=2)
    ├── z3.ts         # Floor 3 (z=3)
    └── ...
```

**File naming:** `z<floor>.ts` where `<floor>` is the z-coordinate.

**Basements:** Use negative z-coordinates for basement levels:
```
buildings/my-building/
├── z-2.ts        # Deep basement (z=-2)
├── z-1.ts        # Basement (z=-1)
├── z0.ts         # Ground floor (z=0)
└── z1.ts         # First floor (z=1)
```

### Building Metadata (z0.ts)

The first file in a building directory is typically `z0.ts`, which contains **building metadata** in addition to ground-level rooms:

```typescript
export const building = {
  name: 'Factory Row',      // Building name
  x: -20,                   // Southwest corner x-coordinate
  y: 7,                     // Southwest corner y-coordinate
  width: 3,                 // Building footprint width (x-axis)
  height: 1,                // Building footprint height (y-axis)
  floors: 2,                // Total number of floors (including roofs)

  rooms: {
    // Ground floor rooms defined here...
  },
};
```

**Important**: The `floors` property indicates the **total number of floor files** (z0.ts, z1.ts, etc.). When you add a new floor to a building (like adding a roof), you must:
1. Create the new floor file (e.g., `z1.ts`)
2. Update the `floors` property in `z0.ts` to reflect the new total

**Example: Adding a roof**

Before (1 floor):
```typescript
// factory-row/z0.ts
export const building = {
  floors: 1,  // Only z0.ts exists
  // ...
};
```

After (2 floors):
```typescript
// factory-row/z0.ts
export const building = {
  floors: 2,  // z0.ts and z1.ts (roof) now exist
  // ...
};
```

### Room Definition Files

**Example: `smith-tower/z1.ts`**

```typescript
export const building = {
  rooms: {
    '%0': {
      name: 'Lobby',
      description: 'An art deco lobby with marble floors.',
      x: -4,
      y: 8,
      z: 1,  // Floor 1
      population: 20,
      ambientNoise: 30,
      lighting: 90,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%1',     // To room %1 (defined below)
        east: '%2',      // To room %2
        elevator: '%E',  // To elevator (cross-floor placeholder)
      }
    },

    '%1': {
      name: 'Hallway',
      description: 'A narrow hallway.',
      x: -4,
      y: 9,
      z: 1,
      exits: {
        south: '%0',  // Back to Lobby
        door: {       // Exit with properties
          room: '%2',
          locked: true,
          lockKey: '%K',  // Key item placeholder
        }
      }
    },

    '%2': {
      name: 'Office',
      description: 'A small office.',
      x: -3,
      y: 9,
      z: 1,
      exits: {
        west: '%0',
      }
    },

    '%E': {
      // Elevator (shared across all floors)
      prototype: 'elevator',  // Use elevator prototype instead of room
      name: 'Elevator Car',
      description: 'A metal elevator car.',
      x: -4,
      y: 8,
      z: 1,  // Initial position (floor 1)
      exits: {
        out: '%0',  // Exit to lobby
      },
      elevator: {
        floors: [1, 2, 11, 35, 42],
        currentFloor: 1,
        doorsOpen: true,
        floorRooms: {
          1: '%0',  // Floor 1 lobby (this file)
          2: '%F',  // Floor 2 lobby (z2.ts)
          11: '%G', // Floor 11 lobby (z11.ts)
          // etc.
        },
      },
    },
  },
};
```

### Cross-Floor Objects

Elevators and other multi-floor objects use the **same placeholder** across files:

**z1.ts:**
```typescript
'%E': {
  prototype: 'elevator',
  elevator: {
    floors: [1, 2],
    floorRooms: {
      1: '%0',  // This floor's lobby
      2: '%F',  // Next floor's lobby
    }
  }
}
```

**z2.ts:**
```typescript
'%E': {
  // Same placeholder, same elevator
  // Only defined once, referenced in multiple floors
  exits: {
    out: '%F',  // Floor 2 lobby
  }
}

'%F': {
  name: 'Floor 2 Lobby',
  exits: {
    elevator: '%E',  // Back to elevator
  }
}
```

### Exit Properties

Simple exits:
```typescript
exits: {
  north: '%1',  // Just destination
}
```

Exits with properties:
```typescript
exits: {
  door: {
    room: '%1',
    locked: true,
    lockKey: '%K',    // Item that unlocks
    hidden: false,
    distance: 5,
  }
}
```

World exits (connecting to street rooms):
```typescript
exits: {
  west: {
    to: 'waterfront/y10.ts',  // Path to world room file
    description: 'Glass doors open onto the Waterfront',
  }
}
```

Guarded exits (faction-restricted):
```typescript
exits: {
  north: {
    to: 's-washington/x-20.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'The scanner flashes red. "Citizens only."',
    description: 'A reinforced door leads to the dispensary',
  }
}
```

Guarded exits with locks (faction + biometric):
```typescript
exits: {
  east: {
    to: 'alley/y10.ts',
    prototype: 'guardedExit',
    allowedFaction: 'Citizen',
    denyMessage: 'Authorized personnel only.',
    locks: ['%DOOR_LOCK'],  // Additional lock check
    description: 'A steel emergency exit',
  }
}
```

Exits with door objects (recommended for buildings):
```typescript
// Define door and lock objects in rooms section
rooms: {
  '%FRONT_LOCK': {
    prototype: 'lock',
    name: 'Shop Lock',
    description: 'A simple deadbolt.',
    difficulty: 3,
  },
  '%FRONT_DOOR': {
    prototype: 'door',
    name: 'Shop Entrance',
    description: 'A glass door with signage.',
    locked: false,
    open: true,
    locks: ['%FRONT_LOCK'],
    material: 'glass',
    durability: 40,
  },

  // Reference door in exits
  '%LOBBY': {
    name: 'Lobby',
    description: '...',
    exits: {
      west: {
        to: 'street/y3.ts',
        description: 'The glass door leads to the street',
        door: '%FRONT_DOOR',  // Reference to door object
      },
    },
  },
}
```

Rentable spaces (apartments, storage units):
```typescript
'%APT_LOCK': {
  prototype: 'rentableLock',
  name: 'Apartment Lock',
  description: 'A modern deadbolt.',
  rentPeriodDays: 30,
  rentAmount: 500,  // In credits
},
'%APT_DOOR': {
  prototype: 'door',
  name: 'Apartment Door',
  description: 'A solid wood door.',
  locked: true,
  open: false,
  locks: ['%APT_LOCK'],
  material: 'wood',
  durability: 60,
},
```

### Room Properties

Full room definition:

```typescript
'%0': {
  name: 'Room Name',              // Required
  description: 'Description...',  // Required
  x: 0,                           // Required (coordinate)
  y: 0,                           // Required
  z: 0,                           // Required
  prototype: 'room',              // Optional (default: 'room', can be 'elevator')
  
  // Optional environmental properties
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: false,

  // Exits object
  exits: {
    north: '%1',
    south: '%2',
    // etc.
  },

  // Sittables (optional) - Furniture agents can sit on
  sittables: [
    {
      name: 'a wooden chair',
      capacity: 1,
      emptyMsg: 'A wooden chair sits against the wall.',
      occupiedMsg: '%s sitting on a wooden chair'
    },
    {
      name: 'a long bench',
      capacity: 4,
      emptyMsg: 'A bench runs along the wall.',
      occupiedMsg: '%s on the bench'
    }
  ],

  // Objects (optional) - Items to create and place in room
  objects: [
    {
      prototype: 'furniture',
      name: 'desk',
      description: 'A sturdy wooden desk.',
    },
    {
      prototype: 'cabinet',
      name: 'filing cabinet',
      aliases: ['cabinet', 'files'],
      description: 'A metal filing cabinet with four drawers.',
    }
  ],

  // Elevator-specific (if prototype: 'elevator')
  elevator: {
    floors: [1, 2, 3],
    currentFloor: 1,
    doorsOpen: true,
    floorRooms: { 1: '%A', 2: '%B' },
  },
}
```

## Creating a New Building

### Step 1: Plan the Layout

Sketch your building's floor plan:
```
Floor 1 (z=1):
  Lobby (%0) - center
  ├─ north → Office (%1)
  ├─ south → Storage (%2)
  └─ elevator → Elevator (%E)

Floor 2 (z=2):
  Upper Lobby (%F)
  └─ elevator → Elevator (%E, same object)
```

### Step 2: Choose Coordinates

Pick (x, y) for your building's footprint:
```typescript
// Building at S. Main & 2nd Ave
x: 3,   // 2nd Ave S
y: 0,   // S. Main St
z: 1-5  // 5 floors
```

### Step 3: Create Floor Files

**z1.ts:**
```typescript
export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      name: 'Elevator',
      description: '...',
      x: 3, y: 0, z: 1,
      exits: { out: '%0' },
      elevator: {
        floors: [1, 2],
        currentFloor: 1,
        doorsOpen: true,
        floorRooms: { 1: '%0', 2: '%F' },
      },
    },
    
    '%0': {
      name: 'Lobby',
      description: '...',
      x: 3, y: 0, z: 1,
      exits: {
        north: '%1',
        elevator: '%E',
      },
    },
    
    '%1': {
      name: 'Office',
      description: '...',
      x: 3, y: 1, z: 1,
      exits: {
        south: '%0',
      },
    },
  },
};
```

**z2.ts:**
```typescript
export const building = {
  rooms: {
    '%F': {
      name: 'Upper Lobby',
      description: '...',
      x: 3, y: 0, z: 2,
      exits: {
        elevator: '%E',
      },
    },
  },
};
```

### Step 4: Create Building Directory

```bash
mkdir -p src/database/bootstrap/world/seattle/pioneer-square/buildings/my-building
```

### Step 5: Add Floor Files

Place `z1.ts`, `z2.ts`, etc. in the directory.

### Step 6: Bootstrap Handles the Rest

On next server start, BuildingBuilder:
1. Scans for building directories
2. Loads all z*.ts files
3. Creates rooms and resolves placeholders
4. Connects exits
5. Registers shared objects (elevators)

## Connecting Buildings to Streets

### Entry/Exit Rooms

Create exits between street-level rooms and building entrances.

### World Room Detection

When buildings have exits that reference world rooms (using `to: 'path/to/room.ts'`), the BuildingBuilder automatically finds the target room by coordinates. To determine which rooms are "world rooms" (outdoor/public spaces vs. building interiors), the builder checks:

**A room is considered a world room if:**
- `outdoor: true`, OR
- Name contains: `Way`, `Ave`, `St`, `Underground`, `Passage`, or `Tunnel`

This affects bidirectional exit creation - the builder can automatically create return exits from world rooms back into buildings.

**Examples:**
```typescript
// These are detected as world rooms:
{ name: 'Yesler Way & 2nd Ave', outdoor: true }
{ name: 'S. Main St & Occidental Ave S' }  // Contains 'St' and 'Ave'
{ name: 'Underground Passage - North Section' }  // Contains 'Underground' and 'Passage'
{ name: 'Service Tunnel' }  // Contains 'Tunnel'

// These are NOT world rooms (building interiors):
{ name: 'Lobby', outdoor: false }
{ name: 'Office 301' }
{ name: 'Storage Room' }
```

**Why this matters:** When creating buildings that connect to underground passages or outdoor areas, make sure your room names follow these conventions so the builder can properly establish bidirectional connections.

**Street room (s-main/x3.ts):**
```typescript
export const room = {
  name: 'S. Main St & 2nd Ave',
  x: 3,
  y: 0,
  z: 0,  // Street level
  // WorldBuilder creates this room
};
```

**Building entrance (my-building/z1.ts):**
```typescript
export const building = {
  rooms: {
    '%0': {
      name: 'Building Entrance',
      x: 3,
      y: 0,
      z: 1,  // Ground floor
      exits: {
        out: { 
          // Connect to street
          room: 'street',  // Special: links to WorldBuilder room at same x,y,z=0
        },
      },
    },
  },
};
```

### Manual Connection

Or connect explicitly after bootstrap:

```javascript
const street = await $startRoom;  // Or find street room
const building = await $load(buildingEntranceId);

const exitIn = await $recycler.create($exit, {
  name: 'door',
  aliases: ['d', 'in'],
  destRoom: building.id,
});

const exitOut = await $recycler.create($exit, {
  name: 'out',
  aliases: ['o'],
  destRoom: street.id,
});

await street.addExit(exitIn);
await building.addExit(exitOut);
```

## Connecting Basements to Underground Tunnels

### Overview

Pioneer Square buildings often have basements (z=-1, z=-2) that connect to the underground tunnel network. The underground passages are in `underground/upper-tunnels/` and `underground/lower-passages/`.

### Connection Pattern

Building basements connect to underground rooms using **file path references**:

```typescript
// In building basement file (morrison-kline/z-1.ts)
'%MECHANICAL': {
  name: 'Mechanical Room',
  description: '...',
  x: -14,
  y: 8,
  z: -1,
  exits: {
    down: {
      to: 'underground/upper-tunnels/x-14-y8.ts:%SHAFT',
      description: 'A concealed hatch leads down into the underground',
    },
  },
}
```

### Exit Syntax

**Format:** `'path/to/file.ts'` or `'path/to/file.ts:%PLACEHOLDER'`

- **Without placeholder**: Links to the first room in the target file
- **With placeholder**: Links to a specific room in the target file (e.g., `:%SHAFT`, `:%TUNNEL`)

### Example: Morrison & Kline Law Offices

**Building basement** at (-14, 8, -1):

```typescript
// morrison-kline/z-1.ts
'%MECHANICAL': {
  x: -14, y: 8, z: -1,
  exits: {
    down: {
      to: 'underground/upper-tunnels/x-14-y8.ts:%SHAFT',
      description: 'A concealed hatch leads down into the underground',
    },
  },
}
```

**Underground tunnel** at (-14, 8, -2):

```typescript
// underground/upper-tunnels/x-14-y8.ts
'%SHAFT': {
  name: 'Access Shaft',
  description: 'A narrow shaft descending from the building above...',
  x: -14, y: 8, z: -2,
  exits: {
    up: {
      to: 'buildings/morrison-kline/z-1.ts:%MECHANICAL',
      description: 'A ladder leads up to the building basement',
    },
    east: '%TUNNEL',  // Continue into tunnel network
  },
}
```

### Bi-Directional Connections

**Always create both directions:**
1. Building basement → Underground (down/east/south)
2. Underground → Building basement (up/west/north)

The `to:` path works in both directions - building files can reference underground files and vice versa.

### Common Patterns

**Coal cellars** (many buildings had coal delivery access to underground):
```typescript
'%COAL_CELLAR': {
  name: 'Coal Cellar',
  x: -18, y: 12, z: -1,
  exits: {
    east: {
      to: 'underground/upper-tunnels/x-17-y12.ts',
      description: 'A passage leads to the underground tunnel network',
    },
  },
}
```

**Mechanical rooms with hidden access**:
```typescript
'%MECHANICAL': {
  name: 'Mechanical Room',
  exits: {
    down: {
      to: 'underground/upper-tunnels/x-14-y8.ts:%SHAFT',
      description: 'A concealed hatch behind the water heater',
    },
  },
}
```

**Storage vaults with smuggling routes**:
```typescript
'%HIDDEN_ROOM': {
  name: 'Hidden Storage',
  exits: {
    down: {
      to: 'underground/upper-tunnels/x-15-y4.ts',
      description: 'A shaft drops into the underground smuggling network',
      door: '%HIDDEN_PANEL',
      locks: ['%HIDDEN_LOCK'],
    },
  },
}
```

### Adding Basement Access from Ground Floor

Don't forget to add the basement entrance from the ground floor:

```typescript
// In z0.ts (ground floor)
'%RECEPTION': {
  name: 'Reception',
  x: -14, y: 7, z: 0,
  exits: {
    down: {
      room: '%STAIRS',  // Links to basement in z-1.ts
      door: '%BASEMENT_DOOR',
      locks: ['%BASEMENT_LOCK'],
    },
  },
}

'%BASEMENT_DOOR': {
  prototype: 'door',
  name: 'Basement Door',
  locked: true,
  open: false,
  locks: ['%BASEMENT_LOCK'],
},

'%BASEMENT_LOCK': {
  prototype: 'lock',
  name: 'Basement Door Lock',
  difficulty: 4,
},
```

### Real-World Examples

**Gargoyle Building** - Coal cellar connects to z=-2 tunnels:
- `buildings/gargoyle-building/z0.ts` - Basement with coal cellar
- Connection at (-18, 12, -1) → `underground/upper-tunnels/x-16-y11.ts`

**Morrison & Kline** - Mechanical room with concealed hatch:
- `buildings/morrison-kline/z-1.ts` - Law office archives
- Connection at (-14, 8, -1) → `underground/upper-tunnels/x-14-y8.ts:%SHAFT`

**Redux Vintage** - Hidden smuggling room:
- `buildings/redux-vintage/z-1.ts` - Vintage storage with secret passage
- Connection at (-16, 4, -1) → `underground/upper-tunnels/x-16-y4.ts`

**Zeitgeist Coffee** - Old foundation breach:
- `buildings/zeitgeist-coffee/z-1.ts` - Bean storage and roasting
- Connection at (-10, 11, -1) → `underground/upper-tunnels/x-10-y11.ts`

## Real-World Example: Smith Tower

### Layout

```
Smith Tower: 42-story historic building
Location: (-4, 8, 0) at Yesler Way & 2nd Ave
Floors:
  z=0:  Street entrance
  z=1:  Lobby, bank, offices
  z=2:  Offices
  z=11: Restaurant
  z=35: Observation deck (restricted)
  z=42: Top floor (restricted)

Elevator: Shared object %E connects all floors
Security: Biometric locks on floors 35, 42
```

### Files

**z1.ts** - Ground floor with bank, security office, offices  
**z2.ts** - Office floor  
**z11.ts** - Restaurant floor  
**z35.ts** - Observation deck (locked)  
**z42.ts** - Top floor (locked)

### Key Features

- Elevator uses same `%E` placeholder across all files
- `floorRooms` map connects elevator to each floor's lobby
- Locked exits prevent unauthorized access
- Coordinates align with street grid at (-4, 8)

## Sittable Positions

Rooms can define **sittables** - specific locations where agents can sit, stand, or position themselves. This adds spatial detail beyond just being "in the room."

### Defining Sittables

Add to room definition:

```typescript
'%LOBBY': {
  name: 'Lobby',
  description: '...',
  x: 0, y: 0, z: 1,

  sittables: [
    {
      name: 'a leather couch',
      capacity: 4,
      emptyMsg: 'A leather couch lines the wall.',
      occupiedMsg: '%s on the couch',
    },
    {
      name: 'the reception desk',
      capacity: 1,
      emptyMsg: 'A reception desk stands empty.',
      occupiedMsg: '%s at the desk',
    },
    {
      name: 'floor cushions',
      capacity: 6,
      emptyMsg: 'Colorful cushions are scattered on the floor.',
      occupiedMsg: '%s lounging on cushions',
    },
  ],
}
```

### Sittable Properties

- **name** - Display name for the position (e.g., "a wooden chair")
- **capacity** - Maximum number of agents (1 for single chair, 4+ for benches/couches)
- **emptyMsg** - Description shown when no one is there
- **occupiedMsg** - Template shown when occupied (`%s` replaced with agent names)

### How It Works

When a room is described:
1. Empty sittables show their `emptyMsg`
2. Occupied sittables show `occupiedMsg` with agent names
3. Names are automatically formatted (e.g., "Alice and Bob are on the bench")

**Example output:**
```
Trinity - VIP Lounge

The VIP lounge exists in its own reality, two stories below street level...

A curved leather banquette commands the center of the room.
Alice and Bob are in the VIP seating.
A corner booth with its own curtain.

Obvious exits: up, east, south, west
```

### Best Practices

1. **Match room theme** - Sittables should fit the environment (bar stools in bars, office chairs in offices)
2. **Appropriate capacity** - Single chairs = 1, benches = 3-4, large couches = 6-8
3. **Descriptive messages** - Use active verbs ("sitting on", "at", "lounging on")
4. **Vary positions** - Mix different types in larger rooms for spatial variety

## Tips & Best Practices

### WorldBuilder

1. **Use intersection arrays** - List all streets a room is on
2. **Mark blocked areas** - Solid buildings should be blocked
3. **Coordinate consistency** - Street room positions should align with real geography
4. **Starting room** - Place at a central, accessible location

### BuildingBuilder

1. **Placeholder consistency** - Use same placeholder for shared objects
2. **Elevator in every file** - Reference `%E` in each floor's exits
3. **Coordinate alignment** - Building floors share (x, y), differ in z
4. **Lock high-security areas** - Use locked exits or elevator floor locks
5. **Test floor transitions** - Make sure elevator connects all floors properly
6. **World room naming** - When connecting to streets/underground, ensure target rooms include keywords: `Way`, `Ave`, `St`, `Underground`, `Passage`, or `Tunnel` (or have `outdoor: true`) so the builder can establish bidirectional exits

### Both Systems

1. **Integer coordinates only** - No fractional positions
2. **Plan the grid first** - Draw a map before coding
3. **Use descriptive names** - "Lobby" is better than "Room 1"
4. **Population affects feel** - Set appropriate crowd levels
5. **Lighting matters** - Dark areas need light sources
6. **Test connections** - Walk through and verify exits work

## Debugging

### Room Not Found

```javascript
// Check if room exists at coordinates
const room = await $load(await $getAlias('startRoom'));
console.log(room.x, room.y, room.z);
```

### Exit Not Connecting

```javascript
// List room's exits
const exits = room.exits || [];
for (const exitId of exits) {
  const exit = await $load(exitId);
  console.log(exit.name, '->', exit.destRoom);
}
```

### Placeholder Not Resolved

Check BuildingBuilder logs during bootstrap:
```
Warning: Placeholder %X not found in building my-building
```

Fix: Make sure placeholder is defined in some z*.ts file.

### Elevator Not Working

```javascript
// Check elevator configuration
console.log('Current floor:', elevator.currentFloor);
console.log('Available floors:', elevator.floors);
console.log('Floor rooms:', elevator.floorRooms);

// Verify floor rooms exist
for (const [floor, roomId] of Object.entries(elevator.floorRooms)) {
  const room = await $load(roomId);
  console.log(`Floor ${floor}:`, room?.name || 'NOT FOUND');
}
```

## Dynamic Room Creation: $spatial.ensureRoom()

For **AI-controlled dynamic room creation** at runtime (vehicles flying to new locations, submarines diving to new depths, etc.), use `$spatial.ensureRoom()`:

```javascript
// AI-controlled room creation - AI decides IF room should exist
const room = await $spatial.ensureRoom(x, y, z, 'hint about why');
// Returns: room object if created, NULL if AI says no
```

### When to Use ensureRoom()

Use this for **edge-case world expansion** - NOT normal navigation:

| Scenario | Use ensureRoom? |
|----------|-----------------|
| Player walks through exit | NO - use exits |
| Aircraft flies to new airspace | YES - creates airspaceRoom |
| Submarine dives to new depth | YES - creates underwaterRoom |
| Boat sails to new water | YES - creates waterRoom |
| Room description mentions adjacent location | MAYBE - if exploration warranted |

### How It Works

1. **Check existing**: `ensureRoom` first checks if a room already exists at (x,y,z)
2. **If exists**: Returns it immediately
3. **If not**: AI (`$builder.maybeCreate`) decides whether to create:
   - Gathers terrain data, neighboring rooms, context
   - Applies conservative rules (see below)
   - Either creates room or returns `null`

### AI Creation Rules (Conservative)

The AI is **very conservative** - it only creates rooms that absolutely make sense:

| Room Type | AI Creates When |
|-----------|-----------------|
| **Airspace** (z > 0) | Outdoor room exists below |
| **Water Surface** (z = 0) | Water terrain at that x,y |
| **Underwater** (z < 0) | Water terrain above, z >= -15 |
| **Deep Water** (z < -15) | Explicit "deep trench" hint |
| **Ground Level** | Urban area with neighboring rooms |
| **Building Interior** | Established structure below |

### The Hint Parameter

Hints guide AI decisions:

```javascript
// Aircraft taking off
await $spatial.ensureRoom(x, y, 10, 'aircraft taking off above outdoor ground');

// Submarine diving
await $spatial.ensureRoom(x, y, -5, 'submarine descending in water terrain');

// Player discovers abandoned building mentioned in description
await $spatial.ensureRoom(x+1, y, 0, 'abandoned building mentioned in room description to the east');
```

### Handling Rejection

**Always handle null** - AI saying no is normal:

```javascript
const airspace = await $spatial.ensureRoom(x, y, z, 'aircraft taking off');
if (!airspace) {
  return 'Cannot take off here - no valid airspace above.';
}
await aircraft.moveTo(airspace);
```

### Rooms Are Permanent

Once created, rooms **stay forever**:
- No `releaseRoom()` or cleanup
- AI only creates once, room persists for future visits
- This is intentional - world grows permanently

### For Vehicles (Aircraft, Boats, Submarines)

Vehicle prototypes handle ensureRoom internally:

```javascript
// Aircraft takeoff() already does:
const airspace = await $spatial.ensureRoom(x, y, z, 'aircraft taking off');
if (!airspace) return 'Cannot take off here';

// Submarine dive() already does:
const underwater = await $spatial.ensureRoom(x, y, z, 'submarine diving');
if (!underwater) return 'Cannot dive here';
```

See vehicle builders for complete implementation:
- `aircraft-builder.ts` - `takeoff()`, `fly()`
- `watercraft-builder.ts` - `launch()`, `sail()`, `dive()`
- `submarine-builder.ts` - dive operations
- `av-builder.ts` - VTOL takeoff

### NOT for Normal Navigation

**Do NOT use ensureRoom for:**
- Walking between rooms (use exits)
- Entering buildings (use exits)
- Any action where an exit should exist

Exits are explicit connections. `ensureRoom` is for **coordinate-based movement in unbounded spaces** (sky, ocean, underground).

## See Also

- [Room System](./rooms.md) - Room, Exit, Elevator prototypes
- [Faction System](./faction.md) - Faction memberships and guarded exits
- [Security System](./security.md) - Locks, biometrics, and access control
- [Bootstrap](../advanced/bootstrap.md) - How bootstrap works
- [Objects](../advanced/objects.md) - Creating and placing objects
- [Architecture](../architecture.md) - Three-layer system overview
