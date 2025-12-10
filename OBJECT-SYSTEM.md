# Malice v2 Object System

A LambdaMOO-style object database implementation using MongoDB and TypeScript.

## Architecture

### Core Concepts

- **Everything is an Object**: All game entities (players, rooms, characters, items) are objects stored in MongoDB
- **Numeric IDs**: Each object has a unique numeric ID (`#1`, `#2`, etc.)
- **Prototype Inheritance**: Objects inherit properties and methods from a parent object
- **Executable Methods**: Methods are TypeScript code stored as strings and executed dynamically
- **Root Object**: Object `#1` is the root from which all objects inherit (parent `#0` means no parent)
- **Verb Registration**: Objects dynamically register/unregister commands they provide

### Object Structure

```typescript
interface GameObject {
  _id: ObjId;                              // Unique numeric ID
  parent: ObjId;                           // Parent object (0 = no parent)
  properties: Record<string, Value>;       // Typed key-value properties
  methods: Record<string, Method>;         // Executable TypeScript code
  created: Date;                           // Creation timestamp
  modified: Date;                          // Last modification timestamp
}
```

### Property Types

Properties are stored with explicit type information:

```typescript
type ValueType = 'number' | 'string' | 'boolean' | 'null' | 'objref' | 'array' | 'object';

interface Value {
  type: ValueType;
  value: any;
}
```

When you store a RuntimeObject in a property, it's stored as an `objref` (just the ID). When you read it back, it's automatically resolved to the RuntimeObject.

### Core Objects

1. **Object #-1 (Nothing)**: The null object reference
2. **Object #0 (ObjectManager)**: System root, manages aliases
3. **Object #1 (Root)**: Base object for all inheritance
4. **Object #2 (System)**: Handles system-level operations like new connections
5. **Object #3 (AuthManager)**: Handles login screen and authentication
6. **Object #4 (CharGen)**: Creates new user characters
7. **Object #5 (PreAuthHandler)**: Transport-level auth (SSL, OAuth)

## Method Execution

Methods are executed with the following context:

- `self`: The RuntimeObject instance (proxied for direct property access)
- `$`: The ObjectManager (for loading/creating other objects)
- `args`: Array of arguments passed to the method
- `context`: ConnectionContext (if called from player action)
- `player`: The player who triggered this (or `self` if no player)

### Direct Object Access (`$N` Syntax)

Access any object directly by ID:

```javascript
const room = $.50;           // Get object #50
await $.4.describe();        // Call method on #4
const hp = $.100.hp;         // Get property from #100
```

### Property Syntax Sugar

Objects use **ES6 Proxy** to enable direct property access with automatic persistence:

```javascript
// Direct property access (recommended)
const hp = self.hp;
const maxHp = self.maxHp;
self.hp = newHp;  // Auto-saves in background!

// Or via methods (still works)
const hp = self.get('hp');
self.set('hp', newHp);
await self.save();
```

### Object Manager (`$`) Shortcuts

```javascript
// Access core objects via aliases
const sys = $.system;         // System object (#2)
const auth = $.authManager;   // AuthManager object (#3)
const cg = $.charGen;         // CharGen object (#4)

// Load any object by ID
const player = await $.load(42);

// Create new objects
const room = await $.create({
  parent: 1,
  properties: { name: 'Town Square' },
  methods: { ... }
});
```

### Dynamic Aliases

```javascript
// Register an alias
await $.addAlias('tavern', tavernObject);
await $.addAlias('square', squareObj);

// Use the alias later
const tav = $.tavern;

// Remove an alias
await $.removeAlias('tavern');

// Get all aliases
const aliases = $.aliases;
```

## Verb Registration System

Commands are dynamically registered and unregistered as objects move around the world.

### How It Works

1. **Agent.verbs** - Each agent has a verb registry: `{ verbName: { obj: ObjId, method: string } }`
2. **registerVerb(name, sourceObj, method?)** - Register a command
3. **unregisterVerb(name)** - Remove a command
4. **unregisterVerbsFrom(sourceObj)** - Remove all commands from an object

### Verb Registration Flow

```
Player enters room with exits: { north: 100, south: 101 }

1. player.moveTo(roomId)
2. room.onContentArrived(player, ...)
3.   player.registerVerb('north', room, 'go')
4.   player.registerVerb('south', room, 'go')

Player types "north":

1. player.onInput(..., 'north')
2. verbInfo = player.getVerb('north')  → { obj: roomId, method: 'go' }
3. room.go(context, player, 'north')
4.   player.moveTo(100, player)
5.     room.onContentLeft(player, ...)  → unregisters 'north', 'south'
6.     newRoom.onContentArrived(player, ...) → registers new exits
```

### Example: Gun Registers Verbs When Held

```javascript
// Gun.onArrived - called when gun moves to new location
methods: {
  onArrived: `
    const dest = args[0];
    const source = args[1];

    // If moved to an agent's hand, register shoot verb
    if (dest.registerVerb && dest.get('isHand')) {
      const owner = await $.load(dest.location);
      await owner.registerVerb('shoot', self);
      await owner.registerVerb('aim', self);
    }
  `,

  onLeaving: `
    const source = args[0];

    // Unregister verbs when leaving
    if (source.unregisterVerbsFrom) {
      const owner = await $.load(source.location);
      await owner.unregisterVerbsFrom(self);
    }
  `
}
```

## Location Transitions

All location changes go through the `moveTo` primitive on Describable:

```javascript
// Describable.moveTo - THE primitive for all movement
await obj.moveTo(destination, mover);
```

### Transition Hooks

| Hook | Called On | When | Purpose |
|------|-----------|------|---------|
| `onContentLeaving(obj, dest, mover)` | Source container | Before move | Can throw to cancel |
| `onLeaving(source, dest, mover)` | Moving object | Before move | Prepare for departure |
| `onContentLeft(obj, dest, mover)` | Source container | After move | Cleanup, unregister verbs |
| `onArrived(dest, source, mover)` | Moving object | After move | Register verbs |
| `onContentArrived(obj, source, mover)` | Dest container | After move | Announce arrival, register verbs |

### Example: Room Registers Exit Verbs

```javascript
// Room.onContentArrived
methods: {
  onContentArrived: `
    const obj = args[0];

    // Only register verbs for agents
    if (!obj.registerVerb) return;

    // Register each exit direction as a verb
    const exits = self.exits || {};
    for (const direction of Object.keys(exits)) {
      await obj.registerVerb(direction, self, 'go');
    }
  `,

  onContentLeft: `
    const obj = args[0];

    if (!obj.unregisterVerbsFrom) return;

    // Unregister all verbs this room provided
    await obj.unregisterVerbsFrom(self.id);
  `
}
```

## Command Dispatch

Player.onInput looks up verbs in the registry:

```javascript
// Player.onInput
const verb = parts[0].toLowerCase();
const argString = parts.slice(1).join(' ');

// Look up verb in registry
const verbInfo = await self.getVerb(verb);

if (verbInfo) {
  // Dispatch to handler
  const handler = await $.load(verbInfo.obj);
  const result = await handler[verbInfo.method](context, self, argString);
  if (result !== undefined) {
    context.send(`${result}\r\n`);
  }
} else {
  context.send(`I don't understand "${verb}".\r\n`);
}
```

## Object Recycling

LambdaMOO-style soft deletion with ID reuse:

```javascript
// Recycle (soft delete) an object
await $.recycle(oldObject);

// Create new object - automatically reuses lowest recycled ID
const newObj = await $.create({
  parent: 1,
  properties: { ... }
});
```

## Connection Flow

**All connection logic lives in object methods - not in TypeScript classes!**

1. Client connects to Telnet (port 5555) or WebSocket (port 8080)
2. `GameCoordinator` creates a `ConnectionContext` wrapping the connection
3. `GameCoordinator` calls System object (#2) `onConnection()` method
4. System's `onConnection()` loads AuthManager (#3) and sets it as handler
5. AuthManager shows login prompt, handles username/password
6. On successful auth, calls Player's `connect()` method
7. Player registers default verbs (look, say, quit)
8. Player triggers `onArrived` on their location to register room verbs
9. Player's `onInput` handles all commands via verb dispatch

**Key Principle**: GameCoordinator is just thin glue code. All game logic is stored as methods on objects in MongoDB.

## Database Layer

### ObjectDatabase (`src/database/object-db.ts`)
- MongoDB persistence layer
- CRUD operations for game objects
- ID generation and uniqueness

### RuntimeObject (`src/database/runtime-object.ts`)
- Wraps GameObject with executable interface
- Method execution via Function constructor
- Property resolution walks prototype chain
- Typed Value conversion (objrefs resolved to RuntimeObjects)
- Proxy for direct property access

### ObjectManager (`src/database/object-manager.ts`)
- Coordinates ObjectDatabase and RuntimeObjects
- In-memory caching with change stream invalidation
- `$N` syntax for direct object access
- Alias registration and resolution

### Bootstrap (`src/database/bootstrap/`)
- Modular builders for core objects
- Idempotent (safe to run multiple times)
- Creates prototypes, system objects, aliases

## Security Considerations

**IMPORTANT**: Methods are executed as trusted code with full access to the system. There is currently:
- No sandboxing
- No permission checks
- No resource limits

This is intentional for an early prototype but should be addressed before allowing untrusted user-created objects.

## Files

### Core Object System
- `types/object.ts` - Type definitions
- `src/database/object-db.ts` - MongoDB persistence
- `src/database/runtime-object.ts` - Executable object wrapper
- `src/database/object-manager.ts` - Caching and coordination
- `src/database/object-cache.ts` - In-memory cache

### Bootstrap
- `src/database/bootstrap/minimal-bootstrap.ts` - Root, System
- `src/database/bootstrap/prototype-builder.ts` - Describable, Location, Room, Agent, Human, Player
- `src/database/bootstrap/auth-manager-builder.ts` - AuthManager
- `src/database/bootstrap/chargen-builder.ts` - CharGen
- `src/database/bootstrap/preauth-handler-builder.ts` - PreAuthHandler

### Game Integration
- `src/game/connection-context.ts` - Bridges connections to objects
- `src/game/game-coordinator.ts` - Main game coordinator
- `src/index.ts` - Server entry point
