# World Building

How to build structured game worlds with rooms, buildings, and coordinate systems.

## Overview

Malice provides two world-building systems:

1. **WorldBuilder** - Street-level outdoor world (grids, coordinates, automatic connections)
2. **BuildingBuilder** - Indoor building interiors (explicit connections, placeholders, multi-floor)

Both work with the same **coordinate system** and **$.room / $.exit** prototypes.

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
4. **Register** - Sets `$.startRoom` alias

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

### Building Definition File

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

Create exits between street-level rooms and building entrances:

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
const street = await $.startRoom;  // Or find street room
const building = await $.load(buildingEntranceId);

const exitIn = await $.recycler.create($.exit, {
  name: 'door',
  aliases: ['d', 'in'],
  destRoom: building.id,
});

const exitOut = await $.recycler.create($.exit, {
  name: 'out',
  aliases: ['o'],
  destRoom: street.id,
});

await street.addExit(exitIn);
await building.addExit(exitOut);
```

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
const room = await $.load(await $.getAlias('startRoom'));
console.log(room.x, room.y, room.z);
```

### Exit Not Connecting

```javascript
// List room's exits
const exits = room.exits || [];
for (const exitId of exits) {
  const exit = await $.load(exitId);
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
  const room = await $.load(roomId);
  console.log(`Floor ${floor}:`, room?.name || 'NOT FOUND');
}
```

## See Also

- [Room System](./rooms.md) - Room, Exit, Elevator prototypes
- [Bootstrap](../advanced/bootstrap.md) - How bootstrap works
- [Objects](../advanced/objects.md) - Creating and placing objects
- [Architecture](../architecture.md) - Three-layer system overview
