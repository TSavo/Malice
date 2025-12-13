# Room System

Understanding rooms, exits, elevators, and spatial coordinates in Malice.

## Overview

The room system provides the spatial foundation for the game world. Three key prototypes work together:

- **$.room** - Locations with coordinates, exits, and environmental properties
- **$.exit** - Directional connections between rooms with locks and aliases
- **$.elevator** - Vertical transport between floors with composable security

All rooms exist in a 3D coordinate grid (x, y, z) and connect via exits.

## $.room - Room Prototype

Inherits from: **$.location**

### Purpose

Rooms are locations with spatial coordinates, exits, crowd mechanics, and environmental properties. Every place players can be (streets, buildings, underground) is a room.

### Properties

#### Spatial Coordinates (Integer meters)
```javascript
{
  x: 0,    // West (-) to East (+)
  y: 0,    // South (-) to North (+)
  z: 0,    // Vertical: negative = underground, 0 = ground level, positive = upper floors
}
```

**Pioneer Square coordinate system:**
- X: Waterfront (x=-15) to 4th Ave (x=+15)
- Y: S. King St (y=-10) to Yesler Way (y=+10)  
- Z: Underground tunnels (z<0), street level (z=0), building floors (z>0)

#### Exits
```javascript
{
  exits: [exitId1, exitId2, ...]  // Array of Exit object IDs
}
```

#### Crowd Mechanics
```javascript
{
  population: 0,     // Artificial crowd (NPCs, busy streets) 0-100
  ambientNoise: 0,   // Base noise level 0-100 (affects hearing)
}
```

**Crowd levels:**
- 0-10: Empty/quiet (easy perception)
- 11-30: Light crowd (some interference)
- 31-60: Moderate crowd (need to watch to see/hear clearly)
- 61-80: Heavy crowd (hard to perceive non-watched people)
- 81-100: Packed (can barely perceive anyone not watched)

#### Environment
```javascript
{
  lighting: 100,     // 0=pitch black, 50=dim, 100=well-lit
  waterLevel: 0,     // 0=dry, 50=waist-deep, 100=fully submerged
  outdoor: true,     // Affects weather, natural light
}
```

#### Sittable Furniture
```javascript
{
  sittables: [
    {
      name: 'a wooden chair',
      capacity: 1,
      occupied: [],  // Array of agent IDs currently sitting
      emptyMsg: 'A wooden chair sits against the wall.',
      occupiedMsg: '%s sitting on a wooden chair.'  // %s replaced with names
    },
    {
      name: 'a long bench',
      capacity: 4,
      occupied: [],
      emptyMsg: 'A long bench runs along the window.',
      occupiedMsg: '%s sitting on a long bench.'
    }
  ]
}
```

### Key Methods

### Content Management (inherited from $.location)

Rooms inherit content management methods from `$.location`:

#### addContent(objOrId)
Add an object to this location's contents. Accepts either an object ID (number) or a RuntimeObject.

```javascript
// By ID
await room.addContent(itemId);

// By object reference
await room.addContent(itemObj);
```

**What it does:**
- Adds the object's ID to `self.contents` array
- Sets `obj.location` to this room's ID
- Calls `onContentArrived(obj)` hook if defined

#### removeContent(objOrId)
Remove an object from this location's contents. Accepts either an object ID (number) or a RuntimeObject.

```javascript
// By ID
await room.removeContent(itemId);

// By object reference
await room.removeContent(itemObj);
```

### Display Methods

#### describe(viewer)
Returns full room description including exits, contents, sittables, crowd/atmosphere.

```javascript
const desc = await room.describe(player);
await player.tell(desc);
```

**Output example:**
```
Smith Tower Lobby
An art deco lobby with marble floors and brass fixtures. 
The elevator doors gleam under ornate chandeliers.

The area buzzes with activity - footsteps echo off marble, 
conversations blend into ambient chatter.

A wooden chair sits against the wall.
Bob is sitting on a long bench.

Obvious exits: north, south, elevator

You see:
  - a security guard
  - a brass plaque
```

#### addExit(exit)
Add an exit to this room.

```javascript
await room.addExit(exitObj);
await room.addExit(exitId);
```

#### getCrowdDescription()
Get atmospheric description based on population + actual occupants.

```javascript
const desc = await room.getCrowdDescription();
// "The area buzzes with activity..."
```

#### getWaterDescription()
Get water level description if any.

```javascript
const desc = await room.getWaterDescription();
// "Water reaches your waist."
```

#### addSittable(name, capacity, emptyMsg, occupiedMsg)
Add furniture to the room.

```javascript
await room.addSittable(
  'a leather couch',
  3,
  'A leather couch sits in the corner.',
  '%s lounging on a leather couch.'
);
```

#### sit(player, sittableName)
Have player sit on furniture.

```javascript
const result = await room.sit(player, 'couch');
if (!result.success) {
  await player.tell(result.error);
}
```

#### stand(player)
Have player stand up from furniture.

```javascript
await room.stand(player);
```

## $.exit - Exit Prototype

Inherits from: **$.describable**

### Purpose

Exits are directional connections between rooms. They have names (north, door, stairs), aliases (n, d, u), can be locked, and track distance.

### Properties

```javascript
{
  name: 'north',           // Primary direction
  description: 'A passage to the north',
  aliases: ['n'],          // Shorthand aliases
  destRoom: 42,            // Destination room ID
  distance: 10,            // Distance in meters
  hidden: false,           // If true, not shown in room description
  locked: false,           // Requires unlocking
  lockKey: null,           // Item ID that unlocks (if locked)
}
```

### Standard Direction Aliases

| Direction | Name | Aliases |
|-----------|------|---------|
| Cardinal | north, south, east, west | n, s, e, w |
| Diagonal | northeast, northwest, southeast, southwest | ne, nw, se, sw |
| Vertical | up, down | u, d, dn |
| Special | in, out | i, o |

### Key Methods

#### matches(direction)
Check if a direction string matches this exit.

```javascript
if (exit.matches('n') || exit.matches('north')) {
  // Player can use this exit
}
```

#### canUse(agent)
Check if agent can use this exit.

```javascript
const result = await exit.canUse(player);
if (result.allowed) {
  // Proceed with movement
} else {
  await player.tell(result.reason);
}
```

**Returns:**
```javascript
{ allowed: true }
// or
{ allowed: false, reason: 'The way north is locked.' }
```

#### unlock(agent, item)
Attempt to unlock with an item.

```javascript
const result = await exit.unlock(player, key);
if (result.success) {
  await player.tell(result.message);
}
```

## $.elevator - Elevator Prototype

Inherits from: **$.location**

### Purpose

Elevators provide vertical transport between floors with a composable lock system. Multiple security locks can control access to different floors.

### Properties

```javascript
{
  currentFloor: 1,            // Current floor number
  floors: [1, 2, 11, 35, 42], // Accessible floors
  floorRooms: {               // Map floor number to room ID
    1: 123,
    2: 124,
    11: 125,
    35: 126,
    42: 127
  },
  moving: false,              // True while in motion
  destination: null,          // Floor being traveled to
  doorsOpen: true,            // Door state
  travelTimePerFloor: 2000,   // Milliseconds per floor (default 2 seconds)
  capacity: 10,               // Max passengers
  locks: [],                  // Array of lock objects (composable security)
}
```

### Lock System (Composable Security)

Elevators can have multiple locks that all must approve access:

```javascript
// Add biometric scanner
const bioLock = await $.recycler.create($.biometricLock, {
  authorizedFingerprints: ['alice-fp', 'bob-fp']
});
await elevator.addLock(bioLock);

// Add keycard reader
const cardLock = await $.recycler.create($.keycardLock, {
  authorizedCards: [cardId1, cardId2]
});
await elevator.addLock(cardLock);

// Add floor restriction lock
const floorLock = await $.recycler.create($.floorLock, {
  restrictedFloors: [35, 42],  // Only certain people can access
  authorizedAgents: [adminId]
});
await elevator.addLock(floorLock);
```

**How it works:**
1. Player selects floor
2. `canAccessFloor()` checks ALL locks
3. If ANY lock denies, access denied
4. If ALL locks approve, elevator moves

### Key Methods

#### selectFloor(agent, floor)
Agent requests to go to a floor.

```javascript
const result = await elevator.selectFloor(player, 42);
if (result.success) {
  await player.tell(result.message);
} else {
  await player.tell(result.message);
}
```

**Returns:**
```javascript
{ success: true, message: 'The elevator begins moving to floor 42.' }
// or
{ success: false, message: 'Access denied: biometric scan failed.' }
```

#### canAccessFloor(agent, floor)
Check if agent can access a floor via lock system.

```javascript
const result = await elevator.canAccessFloor(player, 42);
if (result === true) {
  // Access granted
} else {
  // result is rejection string
  await player.tell(result);
}
```

#### addLock(lock)
Add a security lock.

```javascript
await elevator.addLock(lockObj);
await elevator.addLock(lockId);
```

#### removeLock(lock)
Remove a security lock.

```javascript
await elevator.removeLock(lockObj);
```

#### openDoors() / closeDoors()
Control door state.

```javascript
await elevator.openDoors();
await elevator.closeDoors();
```

## Creating Rooms

### Basic Room

```javascript
const room = await $.recycler.create($.room, {
  name: 'Coffee Shop',
  description: 'A cozy coffee shop with the aroma of fresh brew.',
  x: 5,
  y: 0,
  z: 0,
  population: 15,      // Light crowd
  ambientNoise: 20,    // Quiet conversation
  lighting: 80,        // Well-lit
  outdoor: false
});
```

### Adding Exits

```javascript
// Create exit to another room
const exitNorth = await $.recycler.create($.exit, {
  name: 'north',
  aliases: ['n'],
  destRoom: northRoomId,
  distance: 10,
  hidden: false
});

await room.addExit(exitNorth);
```

### Adding Furniture

```javascript
await room.addSittable(
  'a barstool',
  1,
  'A barstool sits at the counter.',
  '%s perched on a barstool.'
);

await room.addSittable(
  'a corner booth',
  4,
  'A corner booth offers privacy.',
  '%s sitting in a corner booth.'
);
```

## Creating Elevators

### Basic Elevator

```javascript
const elevator = await $.recycler.create($.elevator, {
  name: 'Smith Tower Elevator',
  description: 'An art deco elevator car with polished brass.',
  currentFloor: 1,
  floors: [1, 2, 11, 35, 42],  // Ground, 2nd, 11th, 35th (restaurant), 42nd (observation)
  travelTimePerFloor: 2000,
  capacity: 10
});

// Map floors to rooms
elevator.floorRooms = {
  1: lobbyId,
  2: secondFloorId,
  11: eleventhFloorId,
  35: restaurantId,
  42: observationDeckId
};
```

### Adding Security

```javascript
// Restrict top floors to VIPs
const vipLock = await $.recycler.create($.floorLock, {
  restrictedFloors: [35, 42],
  authorizedAgents: [vipId1, vipId2]
});

await elevator.addLock(vipLock);
```

## Connecting Rooms with Exits

### Bidirectional Connection

```javascript
async function connectRooms(room1, room2, dir1, dir2, distance) {
  // Exit from room1 to room2
  const exit1 = await $.recycler.create($.exit, {
    name: dir1,
    aliases: [dir1[0]],  // First letter as alias
    destRoom: room2.id,
    distance: distance || 10
  });
  await room1.addExit(exit1);

  // Exit from room2 to room1
  const exit2 = await $.recycler.create($.exit, {
    name: dir2,
    aliases: [dir2[0]],
    destRoom: room1.id,
    distance: distance || 10
  });
  await room2.addExit(exit2);
}

// Usage
await connectRooms(lobby, hallway, 'north', 'south', 15);
```

### Locked Exit

```javascript
const lockedDoor = await $.recycler.create($.exit, {
  name: 'door',
  aliases: ['d'],
  destRoom: secretRoomId,
  distance: 2,
  locked: true,
  lockKey: keyItemId  // Specific key required
});

await room.addExit(lockedDoor);
```

### Hidden Exit

```javascript
const secretPassage = await $.recycler.create($.exit, {
  name: 'passage',
  aliases: ['p'],
  destRoom: hiddenRoomId,
  distance: 5,
  hidden: true  // Won't show in room description
});

await room.addExit(secretPassage);
```

## Crowd Mechanics

Population and actual occupants combine to affect perception:

```javascript
// Busy street corner
room.population = 60;  // Heavy foot traffic
room.ambientNoise = 70;  // Loud urban noise

// Effect: Hard to notice individual people unless watching them
// Hard to hear conversations unless close

// Quiet office
room.population = 5;
room.ambientNoise = 15;

// Effect: Easy to see/hear everyone
```

## Environmental Effects

### Water Levels

```javascript
room.waterLevel = 0;    // Dry
room.waterLevel = 30;   // Ankle-deep
room.waterLevel = 50;   // Waist-deep
room.waterLevel = 70;   // Chest-deep
room.waterLevel = 100;  // Fully submerged (need to breathe underwater)
```

### Lighting

```javascript
room.lighting = 0;      // Pitch black (can't see without light source)
room.lighting = 30;     // Very dim (hard to see details)
room.lighting = 60;     // Dim (can see but not clearly)
room.lighting = 100;    // Well-lit (normal vision)
```

### Outdoor vs Indoor

```javascript
room.outdoor = true;    // Affected by weather, time of day
room.outdoor = false;   // Indoor, artificial light/climate
```

## Real-World Examples

### Street Intersection

```javascript
const intersection = await $.recycler.create($.room, {
  name: 'S. Main St & 2nd Ave',
  description: 'A busy intersection in Pioneer Square. Traffic lights ' +
               'cycle through their routine as pedestrians hurry past.',
  x: 0,   // 2nd Ave
  y: 0,   // S. Main St
  z: 0,   // Street level
  population: 45,      // Moderate crowd
  ambientNoise: 60,    // Traffic, conversations
  lighting: 80,        // Streetlights
  outdoor: true
});
```

### Underground Tunnel

```javascript
const tunnel = await $.recycler.create($.room, {
  name: 'Underground Passage',
  description: 'A damp brick tunnel beneath the city. Water drips ' +
               'from the ceiling and puddles on the cracked floor.',
  x: 0,
  y: 5,
  z: -5,  // Underground
  population: 0,       // Empty
  ambientNoise: 5,     // Very quiet
  lighting: 20,        // Very dim
  waterLevel: 15,      // Ankle-deep water
  outdoor: false
});
```

### Office Building Lobby

```javascript
const lobby = await $.recycler.create($.room, {
  name: 'Smith Tower Lobby',
  description: 'An art deco lobby with marble floors and brass fixtures.',
  x: -5,
  y: 0,
  z: 0,
  population: 20,
  ambientNoise: 30,
  lighting: 90,
  outdoor: false
});

// Add furniture
await lobby.addSittable(
  'a leather couch',
  3,
  'A leather couch sits beneath a window.',
  '%s sitting on a leather couch.'
);

// Add elevator
const elevator = await $.recycler.create($.elevator, {
  name: 'elevator',
  currentFloor: 0,
  floors: [0, 1, 2, 11, 35, 42],
  // ... elevator setup ...
});

// Connect elevator to lobby
await elevator.moveTo(lobby);
```

## Tips & Best Practices

1. **Use coordinates consistently** - Plan your world grid first
2. **Population affects immersion** - Busy streets should feel busy
3. **Lighting matters** - Darkness should require light sources
4. **Bidirectional exits** - Always create return paths
5. **Lock important areas** - Use locked exits for progression gates
6. **Hidden exits for secrets** - Discovery mechanics
7. **Crowd levels scale perception** - Packed areas = harder to notice things
8. **Elevators for tall buildings** - Better than stairs for skyscrapers
9. **Composable locks** - Multiple security layers for high-security areas
10. **Water level for hazards** - Swimming, drowning mechanics

## See Also

- [World Building](./world-building.md) - Pioneer Square structure, coordinate system
- [Prototypes](../prototypes.md) - Object hierarchy overview
- [Objects](../advanced/objects.md) - Creating and placing objects
- [Bootstrap](../advanced/bootstrap.md) - Building custom room types
