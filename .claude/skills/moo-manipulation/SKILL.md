---
name: moo-manipulation
description: Direct MOO code manipulation without wrapper tools. Use execute_moo_code to interact with the game using native MOO capabilities - $recycler, $load(), object methods, and property access. This is the canonical way to interact with Malice.
---

# Direct MOO Manipulation

Interact with the Malice MOO using **native MOO code** via `execute_moo_code`. No wrapper tools, no $mcp object - just pure MOO.

## The Only Tool You Need

```typescript
execute_moo_code({
  code: `
    // Your MOO code here
    // Direct access to:
    // - $ (ObjectManager)
    // - $load(id)
    // - $create({parent, properties})
    // - All $aliases ($recycler, $room, $player, etc.)
    // - player (if authenticated via HTTP Basic Auth)

    return result;
  `
})
```

## Authentication (Optional)

Connect with HTTP Basic Auth to get the `player` variable:

```bash
# Authenticated (player variable available)
curl -u username:password http://localhost:3010/mcp

# Unauthenticated (admin/builder access, no player variable)
curl http://localhost:3010/mcp
```

## Creating Objects

Use `$recycler` - the native MOO way:

```typescript
execute_moo_code({
  code: `
    // Create a room
    const room = await $recycler.create($room, {
      name: 'Storage Room',
      description: 'A dusty storage area.',
      x: 0, y: 1, z: 0
    });

    // Create an item
    const torch = await $recycler.create($item, {
      name: 'torch',
      description: 'A wooden torch with flickering flame.'
    });

    // Move item to room
    await torch.moveTo(room, player);

    return {roomId: room.id, torchId: torch.id};
  `
})
```

## Loading Objects

```typescript
execute_moo_code({
  code: `
    // By ID
    const room = await $load(123);

    // By alias
    const playerProto = $player;
    const recycler = $recycler;

    // If authenticated, your player
    const myRoom = player?.location;

    return {room: room.name, myLocation: myRoom?.name};
  `
})
```

## Reading Properties

```typescript
execute_moo_code({
  code: `
    const room = await $load(123);

    // Direct property access (via Proxy)
    const name = room.name;
    const desc = room.description;
    const exits = room.exits || {};

    // Or explicit get
    const x = room.get('x');

    return {name, desc, exits, x};
  `
})
```

## Setting Properties

```typescript
execute_moo_code({
  code: `
    const room = await $load(123);

    // Direct property assignment (auto-saves)
    room.description = 'A newly renovated room.';
    room.lighting = 75;

    // Or explicit set
    room.set('ambientNoise', 20);

    return 'Updated';
  `
})
```

## Calling Methods

```typescript
execute_moo_code({
  code: `
    const player = await $load(3028);
    const room = await $load(123);

    // Call methods directly
    await player.moveTo(room, player);
    const description = await room.describe();

    return description;
  `
})
```

## Object References (ObjRefs)

Objects are stored/accessed directly - no ID manipulation needed:

```typescript
execute_moo_code({
  code: `
    const player = await $load(3028);
    const newRoom = await $load(456);

    // Store object reference directly
    player.location = newRoom;  // NOT player.location = newRoom.id

    // Access referenced objects directly
    const currentRoom = player.location;  // Returns RuntimeObject
    const roomName = currentRoom.name;    // Direct property access

    return roomName;
  `
})
```

## Querying Objects

```typescript
execute_moo_code({
  code: `
    // Get all objects
    const allObjects = await $.db.listAll(false);

    // Filter by parent
    const rooms = allObjects.filter(doc => {
      const parent = doc.parent?.value ?? doc.parent;
      return parent === $room.id;
    });

    // Find by property
    const playersInRoom = allObjects.filter(doc => {
      const loc = doc.properties.location?.value ?? doc.properties.location;
      return loc === 123;
    });

    return {
      totalObjects: allObjects.length,
      rooms: rooms.length,
      playersInRoom: playersInRoom.map(p => p._id)
    };
  `
})
```

## Creating Rooms & Exits

```typescript
execute_moo_code({
  code: `
    const fromRoom = await $load(100);

    // Create new room
    const toRoom = await $recycler.create($room, {
      name: 'Hallway',
      description: 'A long hallway.',
      x: 0, y: 1, z: 0
    });

    // Create exits manually
    fromRoom.exits = fromRoom.exits || {};
    fromRoom.exits.north = toRoom.id;

    toRoom.exits = toRoom.exits || {};
    toRoom.exits.south = fromRoom.id;

    return {fromId: fromRoom.id, toId: toRoom.id};
  `
})
```

## Spawning AI NPCs

```typescript
execute_moo_code({
  code: `
    const room = await $load(173);

    // Spawn via $ai
    const npc = await $ai.spawn({
      role: 'guard',
      name: 'Marcus',
      location: room,
      sex: 'male',
      age: 35,
      personality: 'Gruff but professional.',
      history: 'Former military.'
    });

    // Execute command as NPC
    await $ai.do(npc.id, 'say Halt! State your business.');

    return {npcId: npc.id, location: room.name};
  `
})
```

## Working with Plots

```typescript
execute_moo_code({
  code: `
    // Create plot
    const plotId = await $plot.create('Water Main Repair', {
      type: 'infrastructure',
      priority: 'high'
    });

    // Add event
    await $plot.addEvent(plotId, 'Job posted. Awaiting workers.', 'system');

    // Create job
    await $plot.createJob(plotId, 'fix_pipe', {
      reward: 50,
      difficulty: 'medium'
    });

    return {plotId};
  `
})
```

## Registering Aliases

```typescript
execute_moo_code({
  code: `
    const lock = await $recycler.create($lock, {
      name: 'Combination Lock',
      combination: '12-34-56'
    });

    // Register as global alias
    await $.addAlias('combinationLock', lock.id);

    // Now accessible as $combinationLock everywhere
    return {id: lock.id, alias: 'combinationLock'};
  `
})
```

## Common Patterns

### Find and Modify

```typescript
execute_moo_code({
  code: `
    // Find all players
    const allObjects = await $.db.listAll(false);
    const players = allObjects.filter(doc => {
      const parent = doc.parent?.value ?? doc.parent;
      return parent === $player.id;
    });

    // Modify specific player
    const playerDoc = players.find(p =>
      (p.properties.playername?.value ?? p.properties.playername) === 'alice'
    );

    if (playerDoc) {
      const player = await $load(playerDoc._id);
      player.credits = (player.credits || 0) + 100;
      return {playerId: player.id, newBalance: player.credits};
    }

    return {error: 'Player not found'};
  `
})
```

### Batch Operations

```typescript
execute_moo_code({
  code: `
    // Create multiple rooms in a loop
    const rooms = [];

    for (let i = 0; i < 5; i++) {
      const room = await $recycler.create($room, {
        name: \`Room \${i + 1}\`,
        description: \`A numbered room.\`,
        x: i, y: 0, z: 0
      });
      rooms.push(room.id);
    }

    // Link them in sequence
    for (let i = 0; i < rooms.length - 1; i++) {
      const current = await $load(rooms[i]);
      const next = await $load(rooms[i + 1]);

      current.exits = current.exits || {};
      current.exits.east = next.id;

      next.exits = next.exits || {};
      next.exits.west = current.id;
    }

    return {created: rooms.length, ids: rooms};
  `
})
```

### Conditional Logic

```typescript
execute_moo_code({
  code: `
    const player = await $load(3028);
    const currentRoom = player.location;

    // Check conditions
    if (!currentRoom) {
      return {error: 'Player has no location'};
    }

    // Get room contents
    const allObjects = await $.db.listAll(false);
    const contents = allObjects.filter(doc => {
      const loc = doc.properties.location?.value ?? doc.properties.location;
      return loc === currentRoom.id;
    });

    // Different actions based on conditions
    if (contents.length > 10) {
      return {status: 'crowded', count: contents.length};
    } else if (contents.length > 5) {
      return {status: 'busy', count: contents.length};
    } else {
      return {status: 'quiet', count: contents.length};
    }
  `
})
```

## Available Aliases

All registered aliases are pre-loaded and available as `$name`:

**Prototypes:**
- `$room`, `$exit`, `$agent`, `$human`, `$player`
- `$item`, `$food`, `$drink`, `$clothing`, `$weapon`
- `$door`, `$lock`, `$stackable`, `$sign`

**Utilities:**
- `$recycler`, `$scheduler`, `$prompt`, `$exclusions`, `$mutex`
- `$pronoun`, `$english`, `$format`, `$proportional`, `$emote`
- `$cash`, `$bank`, `$phoneDb`, `$bodyFactory`
- `$ai`, `$plot`, `$faction`

**System:**
- `$authManager`, `$charGen`, `$system`

View all: Use ReadMcpResourceTool with `moo://aliases`

## Anti-Patterns (Don't Do This)

```typescript
// ❌ BAD: Storing IDs instead of objects
player.location = room.id;  // NO!

// ✅ GOOD: Store objects directly
player.location = room;  // YES!

// ❌ BAD: Comparing IDs
if (obj1.id === obj2.id) { }  // NO!

// ✅ GOOD: Direct comparison
if (obj1 === obj2) { }  // YES!

// ❌ BAD: Unnecessary $load
const room = await $load(player.location);  // NO! (location is already a RuntimeObject)

// ✅ GOOD: Direct access
const room = player.location;  // YES!
```

See `moo://docs/moo/reference/anti-patterns` for complete list.

## Documentation References

Use ReadMcpResourceTool to access docs:

**Essential:**
- `moo://docs/moo/reference/quick-reference` - Quick reference guide
- `moo://docs/moo/reference/globals` - All $ globals
- `moo://docs/moo/reference/patterns` - Common patterns
- `moo://docs/moo/reference/anti-patterns` - What NOT to do

**Prototypes:**
- `moo://docs/moo/prototypes/rooms` - Rooms and exits
- `moo://docs/moo/prototypes/agents` - NPCs and players
- `moo://docs/moo/prototypes/items` - Items and equipment

**Utilities:**
- `moo://docs/moo/utilities/recycler` - $recycler reference
- `moo://docs/moo/utilities/format` - $format reference
- `moo://docs/moo/utilities/english` - $english reference

**Advanced:**
- `moo://docs/moo/advanced/bootstrap` - Bootstrap system
- `moo://docs/moo/advanced/sensory-system` - Sensory output

## MCP Resources (Read-Only)

Query game state with ReadMcpResourceTool:

- `moo://objects/{id}` - Object details
- `moo://rooms/{id}` - Room state
- `moo://players` - All players
- `moo://ai` - All AI NPCs
- `moo://plots` - All plots
- `moo://aliases` - All registered aliases

See CLAUDE.md for complete resource list.
