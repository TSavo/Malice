# Smith Tower - Builder's Guide

**Developer documentation for enhancing and maintaining Smith Tower in the Malice game world.**

---

## Table of Contents

1. [Object System Basics](#object-system-basics)
2. [Building Structure](#building-structure)
3. [Smith Tower Architecture](#smith-tower-architecture)
4. [Lock System](#lock-system)
5. [Elevator System](#elevator-system)
6. [Adding New Floors](#adding-new-floors)
7. [Job Integration](#job-integration)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)

---

## Object System Basics

### LambdaMOO-Style Object Model

This is an **object-oriented** MUD, not a relational database. Everything is an object with properties and methods.

**Key Principles:**
- Objects reference other objects directly (NOT by ID)
- Properties auto-persist (no `.save()` calls needed)
- Prototypes provide inheritance
- Methods are runtime JavaScript code

**Example:**
```typescript
// WRONG - Database thinking
lock.authorizedUsers = { 5: [123, 456, 789] };  // IDs!
await lock.save();  // No save() method!

// RIGHT - Object-oriented thinking
await lock.authorize(playerObject, 5);  // Object reference
// Properties persist automatically
```

### Prototypes

Objects inherit from prototypes:
- `$.describable` - Base for all visible objects
- `$.room` - Locations players can be in
- `$.exit` - Connections between rooms
- `$.lock` - Base access control
- `$.biometricLock` - Scans body parts for authorization
- `$.elevator` - Multi-floor transportation

---

## Building Structure

### File Organization

```
src/database/bootstrap/world/seattle/pioneer-square/buildings/smith-tower/
├── z1.ts      # Floor 1 - The Bank
├── z2.ts      # Floor 2 - Job Center
├── z3.ts      # Floor 3 - CorpSec
├── z4.ts      # Floor 4 - Residential
├── ...
├── z36.ts     # Floor 36 - Retail Level 1
├── z37.ts     # Floor 37 - Retail Level 2
└── z38.ts     # Floor 38 - Observatory
```

### Floor File Structure

```typescript
export const building = {
  rooms: {
    '%E': {
      // Elevator placeholder (shared across floors)
      prototype: 'elevator',
      exits: { out: '%LOBBY' },
    },

    '%LOBBY': {
      name: 'Floor Lobby',
      description: `Multi-paragraph description...`,
      x: -4,
      y: 8,
      z: 1,  // Floor number
      population: 0,
      ambientNoise: 5,
      lighting: 75,
      waterLevel: 0,
      outdoor: false,
      exits: {
        north: '%ROOM2',
        south: '%ROOM3',
        in: '%E',  // Back to elevator
      },
      methods: {
        // Elevator call methods (see Common Patterns)
      },
      elevatorId: '%E',
    },

    // More rooms...
  },
};
```

---

## Smith Tower Architecture

### Current State (2110)

**Continuum's Flagship Building:**
- **Floor 1 (The Bank)**: Fully operational, automated banking
- **Floor 2 (Job Center)**: Accessible, AI recruitment terminals
- **Floor 3 (CorpSec)**: Infrastructure ready, awaiting personnel
- **Floors 4-33**: Residential apartments, awaiting tenants
- **Floor 34**: Premium residential - executive tier apartments- **Floor 35**: Executive amenities - lounge, fitness, meeting rooms
- **Floors 36-37**: Retail shells, prepared for build-out
- **Floor 38**: Observatory, accessible

**Aesthetic**: Ghost town - ultra-modern, clean, sparse, echoing. Infrastructure installed, minimal occupancy.

### Access Control

```
Floor 1:  ✅ Open (banking services)
          🔒 Vault locked (%LV)
Floor 2:  ✅ Open (job applications)
Floor 3:  🔒 Locked (%L1 - CorpSec clearance)
Floors 4-35: 🔒 Locked (%LR - residential authorization)
Floor 38: ✅ Open (observation deck)
```

### Elevator Configuration

The elevator is defined on Floor 1 (`z1.ts`) and referenced by all other floors:

```typescript
'%E': {
  prototype: 'elevator',
  name: 'Elevator Car',
  description: `Modern elevator with brushed steel...`,
  elevator: {
    floors: [1, 2, 3, 4, ..., 38],
    currentFloor: 1,
    doorsOpen: true,
    floorRooms: {
      1: '%5',      // Floor 1 elevator bank room ID
      2: '%F',      // Floor 2 elevator lobby room ID
      3: '%P',      // Floor 3 elevator lobby room ID
      // ...
    },
    locks: ['%L1', '%LR'],  // Lock object IDs
  },
},
```

---

## Lock System

### BiometricLock Prototype

**Properties:**
```typescript
{
  name: 'Scanner Name',
  description: 'What it looks like',
  scanners: [
    { type: 'retinal', part: 'eye', message: 'Scan failed.' },
    { type: 'fingerprint', part: 'hand', message: 'Print not recognized.' },
    { type: 'palm', part: 'hand', message: 'Palm rejected.' },
  ],
  authorizedUsers: {
    // target: [array of player OBJECTS, not IDs]
    5: [],        // Floor 5 - no one authorized
    10: [player1, player2],  // Floor 10 - two residents
  },
}
```

**Methods:**
```typescript
// Check access (called by elevator/door)
canAccess(agent, target) -> true | string

// Grant access
authorize(playerObject, target)

// Revoke access
revoke(playerObject, target)
```

**How It Works:**
1. Checks if agent has required body parts (eye, hand, etc.)
2. Checks if body parts are covered by clothing (blocks scan)
3. Checks if agent is in `authorizedUsers[target]` array
4. Returns `true` or error message

### Lock Examples

**CorpSec Lock (Floor 3 only):**
```typescript
'%L1': {
  prototype: 'biometricLock',
  name: 'Elevator Retina Scanner',
  description: 'A recessed retinal scanner with a steady red glow.',
  scanners: [
    { type: 'retinal', part: 'eye', message: 'Retinal scan failed.' },
  ],
  authorizedUsers: {
    3: [],  // Floor 3 - empty array = no one authorized yet
  },
},
```

**Residential Lock (Floors 4-33):**
```typescript
'%LR': {
  prototype: 'biometricLock',
  name: 'Residential Access Scanner',
  description: 'A palm scanner glowing soft amber.',
  scanners: [
    { type: 'palm', part: 'hand', message: 'Residential access denied.' },
  ],
  authorizedUsers: {
    4: [], 5: [], 6: [], // ... all residential floors
    // Empty arrays = no residents assigned yet
  },
},
```

**Vault Lock (single room):**
```typescript
'%LV': {
  prototype: 'biometricLock',
  name: 'Vault Access Scanner',
  description: 'A fingerprint scanner with steady blue LED.',
  scanners: [
    { type: 'fingerprint', part: 'hand', message: 'Vault access denied.' },
  ],
  authorizedUsers: [],  // No map = always locked
},
```

### Granting Access

**In a job completion handler:**
```typescript
// Get the lock object
const residentialLock = await $.load('%LR');

// Authorize player for floor 5
await residentialLock.authorize(player, 5);

// Properties persist automatically - no save() needed
```

**In a terminal interaction:**
```typescript
methods: {
  assignHousing: `
    const player = args[0];
    const assignedFloor = 7;  // Assign floor 7

    const lock = await $.load('%LR');
    await lock.authorize(player, assignedFloor);

    return 'Housing assigned: Smith Tower, Floor ' + assignedFloor;
  `,
}
```

---

## Elevator System

### How Elevators Work

1. Player is in elevator lobby room
2. Player calls elevator: `call elevator`
3. Room's `callElevator` method fires
4. Elevator checks current floor vs. requested floor
5. If different, `selectFloor()` is called
6. `selectFloor()` calls `canAccessFloor()`
7. `canAccessFloor()` checks all locks
8. Each lock's `canAccess(agent, floor)` is called
9. If all pass, elevator moves

### Elevator Call Pattern

**Every elevator lobby needs this pattern:**

```typescript
'%LOBBY': {
  name: 'Elevator Lobby',
  // ... other properties
  exits: {
    in: '%E',  // Elevator entrance
  },
  methods: {
    onContentArrived: `
      const obj = args[0];
      if (!obj?.registerVerb) return;
      await obj.registerVerb(
        ['call elevator', 'summon elevator', 'press elevator button'],
        self,
        'callElevator'
      );
    `,
    onContentLeaving: `
      const obj = args[0];
      if (obj?.unregisterVerbsFrom) {
        await obj.unregisterVerbsFrom(self.id);
      }
    `,
    callElevator: `
      const player = args[0];
      const floorNumber = 5;  // THIS FLOOR'S NUMBER
      const elevatorId = self.elevatorId || null;

      if (!elevatorId) {
        return 'The call button clicks uselessly. No power.';
      }

      const elevator = await $.load(elevatorId);
      if (!elevator) {
        return 'Nothing answers the button press.';
      }

      if (elevator.currentFloor === floorNumber) {
        if (!elevator.doorsOpen && elevator.openDoors) {
          await elevator.openDoors();
        }
        return 'The elevator is already here.';
      }

      if (elevator.selectFloor) {
        const result = await elevator.selectFloor(player, floorNumber);
        return result?.message || 'You press the button. Machinery stirs above.';
      }

      return 'The button light flickers, but nothing happens.';
    `,
  },
  elevatorId: '%E',
},
```

**Key Points:**
- `floorNumber` must match the floor's z coordinate
- `elevatorId` references the elevator object
- `callElevator` handles bringing elevator to this floor
- Verbs register/unregister when player enters/leaves

---

## Adding New Floors

### Step 1: Create Floor File

```bash
# Create new floor file
touch src/database/bootstrap/world/seattle/pioneer-square/buildings/smith-tower/z10.ts
```

### Step 2: Define Building Structure

```typescript
// smith-tower/z10.ts
export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%LOBBY' },
    },

    '%LOBBY': {
      name: 'Floor 10 Lobby',
      description: `...`,
      x: -4,
      y: 8,
      z: 10,  // FLOOR NUMBER
      exits: {
        north: '%ROOM1',
        south: '%ROOM2',
        in: '%E',
      },
      methods: {
        // Copy elevator call pattern from above
      },
      elevatorId: '%E',
    },

    // Define other rooms...
  },
};
```

### Step 3: Update Elevator Configuration

**In `z1.ts`, update the elevator:**

```typescript
'%E': {
  elevator: {
    floors: [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,  // ADD YOUR FLOOR
      // ...
    ],
    floorRooms: {
      1: '%5',
      // ...
      10: '%LOBBY',  // ADD MAPPING
    },
  },
},
```

### Step 4: Update Locks (if needed)

**If the floor should be locked:**

```typescript
'%LR': {
  authorizedUsers: {
    4: [], 5: [], 6: [], 7: [], 8: [], 9: [],
    10: [],  // ADD YOUR FLOOR
  },
},
```

---

## Job Integration

### Job System Overview

Players get jobs through:
1. **Job Center terminals** (floor 2) - AI recruitment
2. **$.plot** - Event/story-driven jobs
3. **$.jobBoard** - Posted opportunities

### Granting Access via Jobs

**Example: Housing assignment job**

```typescript
// In job completion handler
{
  onComplete: `
    const player = args[0];
    const job = args[1];

    // Assign apartment on floor 7
    const residentialLock = await $.load('%LR');
    await residentialLock.authorize(player, 7);

    // Maybe also give them a key item
    const key = await $.create({
      parent: '$.item',
      name: 'Smith Tower Apartment Key - 7F',
    });
    await player.addToInventory(key);

    return 'You have been assigned an apartment on Floor 7.';
  `,
}
```

**Example: CorpSec clearance job**

```typescript
{
  onComplete: `
    const player = args[0];

    // Grant CorpSec floor access
    const corpsecLock = await $.load('%L1');
    await corpsecLock.authorize(player, 3);

    return 'CorpSec clearance granted. You may now access Floor 3.';
  `,
}
```

---

## Best Practices

### Object References, Not IDs

**❌ WRONG:**
```typescript
// Don't store IDs
lock.authorizedUsers = { 5: [123, 456] };

// Don't look up by ID manually
const player = await $.load(123);
```

**✅ RIGHT:**
```typescript
// Store object references
lock.authorizedUsers = { 5: [player1, player2] };

// Use authorize method
await lock.authorize(playerObject, 5);
```

### No .save() Calls

**❌ WRONG:**
```typescript
lock.authorizedUsers[5].push(player);
await lock.save();  // No such method!
```

**✅ RIGHT:**
```typescript
await lock.authorize(player, 5);
// Properties persist automatically
```

### Room Coordinates

**Maintain consistent grid layout:**
```
(-5, +9)  (-4, +9)  (-3, +9)  (-2, +9)
(-5, +8)  (-4, +8)  (-3, +8)  (-2, +8)
(-5, +7)  (-4, +7)  (-3, +7)  (-2, +7)
```

**Elevator is typically at (-4, +8) on each floor**

### Description Style

**Match the ghost town aesthetic:**
```typescript
description: `A modern lobby with pristine white floors. LED panels
provide bright, even lighting. A terminal displays: SYSTEM READY -
NO PERSONNEL ASSIGNED.

The space is spotless, recently installed. Everything works. Nobody's here.
The air smells of fresh paint and cleaning solution.`
```

**Key elements:**
- Modern, clean, functional
- Automated systems active but unmanned
- Echoing, empty spaces
- Waiting for occupants who haven't arrived

### Exit Naming

**Be consistent with cardinal directions:**
```typescript
exits: {
  north: '%ROOM_NORTH',
  south: '%ROOM_SOUTH',
  east: '%ROOM_EAST',
  west: '%ROOM_WEST',
  in: '%E',      // Into elevator
  out: '%LOBBY', // Out to lobby
  up: '%STAIRS_UP',
  down: '%STAIRS_DOWN',
}
```

---

## Common Patterns

### Locked Exit

**Add lock to an exit:**
```typescript
exits: {
  west: { to: '%VAULT', lock: '%LV' },  // Locked exit
  east: '%PUBLIC_AREA',                  // Unlocked exit
}
```

### Sittable Furniture

```typescript
sittables: [
  {
    name: 'a bench',
    capacity: 4,
    emptyMsg: 'A bench sits empty.',
    occupiedMsg: '%s sitting on a bench',
  },
],
```

### Terminal Interaction

```typescript
methods: {
  use: `
    const player = args[0];

    // Display terminal interface
    await player.tell('CONTINUUM SYSTEMS - TERMINAL ACTIVE');
    await player.tell('');
    await player.tell('1. Check Status');
    await player.tell('2. Request Access');

    const choice = await $.prompt.question(player, 'Select option: ');

    if (choice === '1') {
      return 'SYSTEM STATUS: NOMINAL';
    } else if (choice === '2') {
      // Handle access request
      return 'ACCESS REQUEST LOGGED';
    }
  `,
}
```

### Room Ambience

```typescript
population: 0,      // NPCs in room (always 0 - no NPCs in this game)
ambientNoise: 5,    // 0-20 scale, affects hearing
lighting: 75,       // 0-100 scale, affects visibility
waterLevel: 0,      // 0-100 scale, affects movement
outdoor: false,     // Indoor/outdoor flag
```

---

## Future Enhancements

### Planned Additions

**Floors 4-33 (Residential):**
- Individual apartment rooms
- Shared amenities (laundry, gym, rooftop)
- Variability: some furnished, some empty shells
- Different apartment sizes/qualities

**Floors 34-35:**
- Undesigned - opportunity for unique features
- Could be: offices, penthouses, facilities, etc.

**Floor 2 Enhancements:**
- Actual job terminal interactions
- Assignment processing
- Clone backup facilities

**Floor 3 Enhancements:**
- CorpSec armory access
- Dispatch system
- Mission briefings

### Adding Features

**Before adding new features:**
1. Check existing prototypes (`src/database/bootstrap/prototypes/`)
2. Review similar implementations in other buildings
3. Maintain object-oriented approach (no IDs!)
4. Test elevator access after changes
5. Verify lock behavior with test characters

---

## Troubleshooting

### Elevator Not Stopping at Floor

**Check:**
1. Is floor number in `elevator.floors` array?
2. Is floor mapped in `elevator.floorRooms`?
3. Does floor's `callElevator` have correct `floorNumber`?
4. Does `elevatorId` match the elevator object?

### Lock Always Denying Access

**Check:**
1. Is lock ID in `elevator.locks` array?
2. Does player have required body part (eye, hand)?
3. Is body part covered by clothing?
4. Is player in `authorizedUsers` array for target floor?
5. Are you passing object reference, not ID?

### Room Not Appearing

**Check:**
1. Is file exported from building module?
2. Is room ID unique?
3. Do exits from other rooms point to this room?
4. Are x, y, z coordinates set correctly?

---

## Reference

### Key Prototype Locations

- **Lock**: `src/database/bootstrap/prototypes/lock-builder.ts`
- **BiometricLock**: `src/database/bootstrap/prototypes/biometric-lock-builder.ts`
- **Elevator**: `src/database/bootstrap/prototypes/elevator-builder.ts`
- **Room**: (inherited from describable)
- **Exit**: `src/database/bootstrap/prototypes/exit-builder.ts`

### Smith Tower Floor Summary

| Floor | Name | Status | Access |
|-------|------|--------|--------|
| 1 | The Bank | Operational | Open (vault locked) |
| 2 | Job Center | Operational | Open |
| 3 | CorpSec | Infrastructure ready | Locked (%L1) |
| 4-33 | Residential | Awaiting tenants | Locked (%LR) |
| 34 | Premium Residential | Executive tier units | Locked (%LR) || 35 | Executive Amenities | Lounge, fitness, meeting | Open |
| 36 | Retail Level 1 | Shells prepared | Open |
| 37 | Retail Level 2 | Shells prepared | Open |
| 38 | Observatory | Operational | Open |

---

**Last Updated:** 2025-12-12
**Game Timeline:** Seattle 2110 (48 years after The Burning)

---

## Global Objects and Alias Registration

When you need to create objects that should be accessible globally (like city systems, public services, or shared resources), you need a two-step process:

### Step 1: Define with % Placeholder in Building File

BuildingBuilder only supports % placeholders, not $ aliases. Define your object with a % placeholder:

```typescript
'%CITY_ANNOUNCE': {
  prototype: "sign",
  name: "City Announcement Board",
  description: "A sleek digital display...",
  content: "--- CITY ANNOUNCEMENTS ---\n\nNo current announcements.",
  location: "%5",
},
```

### Step 2: Register Global Alias in game-bootstrap.ts

After BuildingBuilder runs, register the global alias in src/database/bootstrap/game-bootstrap.ts:

```typescript
// After buildingBuilder.build()
console.log("Registering global building aliases...");
const citySign = await this.manager.find(obj => obj.name === "City Announcement Board");
if (citySign) {
  const objectManager = await this.manager.load(0);
  await objectManager?.call("addAlias", "cityAnnounce", citySign.id);
  console.log("  ✅ Registered $.cityAnnounce");
} else {
  console.warn("  ⚠️  City Announcement Board not found");
}
```

### Why This Matters

Global objects like $.cityAnnounce allow NPCs and systems to interact with building features from anywhere in the game.

City AI can now update the sign:
- await $.cityAnnounce.setProperty('content', 'New announcement...');

Important: Players should be able to read these signs. Make sure:
- The sign is visible in room descriptions
- Players can interact with it (read, examine)
- Content is updated regularly by city systems
- Format is clear and readable

---

## Coordinate System and Building Footprint

### Smith Tower Building Footprint

The building occupies these coordinates:
- X-axis: -5 to -2 (West to East)
- Y-axis: 7 to 9 (South to North)
- Z-axis: 0 to 39 (Ground to Top)

### Standard Positions

Elevator (consistent across all floors):
- Position: x: -4, y: 8, z: [floor]
- Center of building, accessible from all wings

Ground Floor Entrances:
- North entrance: x: -3, y: 9, z: 0 (to Yesler Way)
- West entrance: x: -5, y: 8, z: 0 (to 1st Ave)

### Coordinate Axis Reference

Y-axis (North/South):
  9 = North
  8 = Center
  7 = South

X-axis (West/East):
  -5 = West
  -4 = Center-West
  -3 = Center-East
  -2 = East

### Common Mistake: 0-Based Coordinates

WRONG: x: 0, y: 0, z: 4  // This is outside the building!

CORRECT: x: -4, y: 8, z: 4  // Elevator at proper position

All condo floors (z4-z33) were initially built with 0-based coordinates and had to be corrected to match the building footprint.

---

## Room Layout Best Practices

### Condo Floor Pattern (z4-z33)

Each residential floor has:
- 1 elevator lobby (center)
- 3 rental units (A, B, C)
- Each unit has an entrance room connected to the lobby

### Exit Direction Consistency

Critical: Exit directions must match actual geometric positions!

Example from Unit C entrance issue:
- Elevator at (-4, 8) with "south" exit
- Must go to room at (-4, 7) (directly south)
- NOT to room at (-5, 7) (southwest corner)

Fix Applied: Changed Unit C entrance from C2 (southwest) to C3 (south)

### Door and Lock Naming Convention

Use consistent naming for doors and locks. Example for Unit C3 on floor 4:

'%RL_C3_z4': rentable lock
'%D_C3_z4': door using that lock
Elevator south exit references %C3_z4 and %D_C3_z4

---

## BuildingBuilder Integration

BuildingBuilder is integrated into the bootstrap process in src/database/game-bootstrap.ts.

### Bootstrap Sequence

1. Setup: Imports and initialization
2. Prototypes: Load all prototype objects
3. BuildingBuilder: Build all buildings from definitions
4. Global Aliases: Register global object aliases
5. World Bootstrap: Load world definitions

### How BuildingBuilder Works

- Reads building definition files (z0.ts, z1.ts, etc.)
- Creates all rooms and objects
- Resolves % placeholders to actual object references
- Shares objects across floors (elevators, locks use same placeholder)
- Creates exits with bidirectional connections
- Sets up prototype inheritance

### What BuildingBuilder Does NOT Do

- Register global $ aliases (must do manually in bootstrap)
- Validate coordinate geometry
- Check exit direction consistency
- Verify room descriptions mention features

---

## Troubleshooting Common Issues

### Issue: Elevator exit direction does not match geometry

Symptom: Exit direction name does not match actual coordinates

Example: Elevator at (-4, 8) with south exit going to room at (-5, 7) which is southwest, not south.

Fix: Ensure exit directions match coordinates:
- north: y+1
- south: y-1
- east: x+1
- west: x-1

### Issue: Global object not accessible

Symptom: Defined object as $.name but BuildingBuilder does not create it

Diagnosis: BuildingBuilder only handles % placeholders

Fix: Use two-step process:
1. Define with %PLACEHOLDER in building file
2. Register alias in game-bootstrap.ts after build

### Issue: Rooms have wrong coordinates

Symptom: Rooms positioned outside building footprint

Fix: Verify against building footprint:
- Smith Tower: x: -5 to -2, y: 7 to 9
- Check elevator position first (always -4, 8)
- Calculate other positions relative to elevator

---

## Summary of Recent Fixes

### Ground Floor (z0)

Added: City Announcement Board
- Object: %CITY_ANNOUNCE in building file
- Global alias: $.cityAnnounce registered in bootstrap
- Purpose: City AI posts announcements for all players
- Location: Elevator Bank lobby

### Condo Floors (z4-z33)

Fixed: Coordinate system
- Changed from 0-based (x: 0-3, y: 0-2) to building footprint (x: -5 to -2, y: 7-9)
- Applied to all 30 residential floors

Fixed: Unit C entrance geometry
- Changed entrance from C2 (southwest corner) to C3 (directly south)
- Updated elevator south exit to point to C3
- Renamed locks and doors from C2 to C3
- Fixed all room exits to maintain consistency
- Applied to all 30 residential floors

### Integration

Confirmed: BuildingBuilder properly integrated
- Runs in game-bootstrap.ts after prototype loading
- Creates all building objects from definitions
- Global aliases registered after build completes

---

## City Announcement Sign - Usage Guide

The City Announcement Board ($.cityAnnounce) is designed for the city AI to communicate with players.

### Accessing the Sign

From anywhere in the game:
const sign = await $.cityAnnounce;

### Updating Content

City AI updates the sign:
await $.cityAnnounce.setProperty('content', '--- CITY ANNOUNCEMENTS ---\n\nNOTICE: Maintenance scheduled for Sector 7.\nTIME: 2100 hours.\n\nStay informed. Stay compliant.\n\n- Continuum City Systems');

### Best Practices

1. Regular Updates: City AI should post announcements as events occur
2. Clear Format: Use consistent formatting (headers, timestamps, signatures)
3. Player Accessibility: Sign is in ground floor lobby - high traffic area
4. Readable Content: Keep announcements concise and scannable
5. Thematic Consistency: Match Continuum corporate/authoritarian tone

### What Players See

Players in the Elevator Bank will see:
- Sign mentioned in room description
- Can examine the sign to read current content
- New announcements appear automatically (no notification - they must check)

This creates a living, breathing city where players must stay informed by checking public information displays.

