# Malice Builders Guide

A comprehensive guide for creating new prototypes and systems in Malice.

**Related Documentation:**
- [MCP-TOOLS.md](MCP-TOOLS.md) - MCP tools for AI assistants and automation
- [moo-programming.md](moo-programming.md) - MOO programming reference
- [plot-jobs.md](plot-jobs.md) - Plot/job system for AI city management

## Two Ways to Build

Malice supports two building approaches:

1. **Code-based (Bootstrap)** - TypeScript builders for prototypes that are part of the core system. Changes require a rebuild.

2. **Runtime (MCP)** - Create objects, add methods, and build content at runtime via MCP tools. No rebuild required. Ideal for AI-assisted building and iteration.

**When to use Code vs MCP:**

| Use Code (Bootstrap) | Use MCP (Runtime) |
|---------------------|-------------------|
| Core prototypes that many things inherit from | One-off instances and content |
| Complex systems requiring TypeScript types | Iterating on new prototype designs |
| Things that must exist at startup | AI-created NPCs and storylines |
| Performance-critical methods | Testing method changes live |

## Runtime Building with MCP

MCP tools allow you to create and modify objects without rebuilding. This is the preferred approach for content creation and AI integration.

### Creating Objects via MCP

```javascript
// Create a new object
mcp.create_object({
  parent: 49,  // $.lock prototype
  properties: {
    name: "Combination Lock",
    description: "A lock with a dial combination.",
    combination: "12-34-56"
  }
});
// Returns: { objectId: 2500 }

// Add a method
mcp.set_method({
  objectId: 2500,
  name: "canAccess",
  code: `
    const agent = args[0];
    const input = args[1];
    if (!self.combination) return true;
    if (input === self.combination) return true;
    return 'Wrong combination.';
  `
});

// Register as a prototype alias (optional)
mcp.call_method({
  objectId: 0,  // ObjectManager
  name: "addAlias",
  args: ["combinationLock", 2500]
});
```

### Creating Prototype Hierarchies

```javascript
// 1. Create base prototype
const base = await mcp.create_object({
  parent: 3,  // $.describable
  properties: { name: "Container", description: "Something that holds things.", contents: [] }
});

// 2. Add methods to base
await mcp.set_method({
  objectId: base.objectId,
  name: "add",
  code: `
    const item = args[0];
    const contents = self.contents || [];
    contents.push(item.id);
    self.contents = contents;
    item.location = self.id;
    return 'Added ' + item.name;
  `
});

// 3. Create specialized variant
const chest = await mcp.create_object({
  parent: base.objectId,
  properties: { name: "Chest", description: "A wooden chest.", locked: false }
});

// 4. Override method in child
await mcp.set_method({
  objectId: chest.objectId,
  name: "add",
  code: `
    if (self.locked) return 'The chest is locked.';
    // Call parent method
    const parent = await $.load(self._parent);
    return parent.add(args[0]);
  `
});
```

### AI Registry Integration

The $.ai registry tracks AI-controlled humans:

```javascript
// Spawn an AI human
mcp.spawn_ai({
  role: "guard",
  name: "Marcus",
  locationId: 100,
  sex: "male",
  age: 35
});

// List all guards
mcp.list_ai({ role: "guard" });

// Remove when done
mcp.despawn_ai({ humanId: 567 });
```

### Plot/Job System Integration

Create narratives and quests via MCP:

```javascript
// Create a plot
mcp.create_plot({
  name: "Missing Jewels",
  metadata: { participants: [100], type: "investigation" }
});

// Add a job with a hook
mcp.create_job({
  plotId: 500,
  jobId: "find_jewels",
  metadata: { reward: 100 }
});

// Watch for events
mcp.register_job_hook({
  plotId: 500,
  jobId: "find_jewels",
  targetId: 200,
  eventName: "itemPickedUp",
  filter: { itemName: "jewels" }
});
```

See [MCP-TOOLS.md](MCP-TOOLS.md) for complete tool reference.

## Code-Based Building (Bootstrap)

For core prototypes that need to exist at startup, use TypeScript builders.

## Directory Structure

```
src/database/bootstrap/
├── core-system-builder.ts      # Orchestrates singleton utilities
├── prototype-builder.ts        # Orchestrates all prototypes
├── prototypes/
│   ├── index.ts               # Exports all prototype builders
│   ├── lock-builder.ts        # Example: Lock prototype
│   ├── biometric-lock-builder.ts
│   └── ...
└── world/                     # World content (rooms, etc.)
```

## Creating a New Prototype

### Step 1: Create the Builder File

Create `src/database/bootstrap/prototypes/[name]-builder.ts`:

```typescript
import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the [Name] prototype
 * [Description of what it does]
 *
 * Inherits from [Parent].
 *
 * Properties:
 * - prop1: Description
 * - prop2: Description
 *
 * Methods:
 * - method1(args): Description
 */
export class [Name]Builder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: '[Name]',
        description: 'Default description.',
        // Add default properties here
      },
      methods: {},
    });

    // Add methods
    obj.setMethod('methodName', `
      // Method code here
      // Available globals: self, args, $, caller
      // self = this object
      // args = array of arguments
      // $ = alias resolver (await $.recycler, await $.load(id))
      // caller = the agent who invoked this (if applicable)

      const param1 = args[0];
      return result;
    `);

    return obj;
  }
}
```

### Step 2: Export from Index

Add to `src/database/bootstrap/prototypes/index.ts`:

```typescript
export { [Name]Builder } from './[name]-builder.js';
```

### Step 3: Register in Prototype Builder

Edit `src/database/bootstrap/prototype-builder.ts`:

1. Import the builder:
```typescript
import { [Name]Builder } from './prototypes/[name]-builder.js';
```

2. Add ID tracking in the `ids` object (if needed for alias):
```typescript
const ids = {
  // ... existing
  [name]: 0,
};
```

3. Instantiate and build:
```typescript
const [name]Builder = new [Name]Builder(this.manager);
// Build after its parent exists!
ids.[name] = (await [name]Builder.build(ids.parentPrototype)).id;
```

4. Register alias (if needed):
```typescript
await objectManager.call('addAlias', '[name]', ids.[name]);
```

**IMPORTANT**: Build order matters! A prototype must be built AFTER its parent.

## Creating a Singleton Utility

Singletons like `$.recycler`, `$.bank`, `$.ai` are system objects, not prototypes.

### Step 1: Create Builder in bootstrap/ (not prototypes/)

Create `src/database/bootstrap/[name]-builder.ts`:

```typescript
import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

/**
 * Builds [Name] object (dynamic ID)
 * [Description]
 */
export class [Name]Builder {
  private [name]: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.[name]) {
      this.[name] = await this.manager.load(aliases.[name]);
      if (this.[name]) return; // Already exists
    }

    // Create new singleton (parent is Root #1)
    this.[name] = await this.manager.create({
      parent: 1,
      properties: {
        name: '[Name]',
        description: 'Description here',
        // Properties...
      },
      methods: {},
    });

    // Add methods...
    this.[name].setMethod('methodName', `
      // Method code
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.[name]) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', '[name]', this.[name].id);
    console.log(\`Registered [name] alias -> #\${this.[name].id}\`);
  }
}
```

### Step 2: Register in Core System Builder

Edit `src/database/bootstrap/core-system-builder.ts`:

```typescript
import { [Name]Builder } from './[name]-builder.js';

// In buildCoreSystems():
const [name]Builder = new [Name]Builder(this.manager);
await [name]Builder.build();
await [name]Builder.registerAlias();
```

## Method Code Conventions

Methods are written as string templates. Available globals:

| Global | Description |
|--------|-------------|
| `self` | The object the method is defined on |
| `args` | Array of arguments passed to the method |
| `$` | System proxy - access aliases, load objects, call ObjectManager methods |
| `caller` | The agent who invoked (for verbs/commands) |
| `context` | Connection context (for player commands) |

### The $ Proxy

The `$` object provides several capabilities:

```javascript
// 1. Access registered aliases (singletons)
const recycler = await $.recycler;
const bank = await $.bank;

// 2. Load objects by ID
const obj = await $.load(123);
const player = await $[42];  // Shorthand for $.load(42)

// 3. Call methods on ObjectManager #0
// Any unknown property delegates to #0
await $.clearAliasesForObject(objectId);
await $.addAlias('myAlias', objectId);
const aliasId = await $.getAlias('myAlias');

// 4. Access infrastructure
$.db           // Database access
$.evictFromCache(id)  // Cache management
```

### Common Patterns

```javascript
// Get another singleton
const recycler = await $.recycler;
const bank = await $.bank;

// Load an object by ID
const obj = await $.load(123);

// Create an object
const newObj = await recycler.create({
  parent: prototypeId,
  properties: { ... }
}, locationId);

// Call a method on another object
await obj.call('methodName', arg1, arg2);

// Get/set properties
const value = self.propertyName;
self.set('propertyName', newValue);

// Work with arrays (must re-set to persist)
const arr = self.items || [];
arr.push(newItem);
self.items = arr;  // or self.set('items', arr);

// Work with objects (must re-set to persist)
const map = self.registry || {};
map[key] = value;
self.registry = map;
```

## Inheritance Chain

```
Root (#1)
├── System (#2)
├── Describable (#3)
│   ├── Location (#4)
│   │   ├── Room (#6)
│   │   │   └── Elevator (#42)
│   │   ├── LockerBank (#36)
│   │   └── Vendable (#41)
│   ├── Exit (#5)
│   ├── Agent (#7)
│   │   └── Embodied (#8)
│   │       └── Human (#9)
│   │           └── Player (#10)
│   │               └── Admin (#11)
│   ├── Decayable (#12)
│   │   ├── Corpse (#13)
│   │   ├── Edible (#17)
│   │   │   ├── Food (#18)
│   │   │   ├── Drink (#19)
│   │   │   └── BodyPart (#21)
│   │   └── ...
│   ├── Lock (#??)
│   │   ├── BiometricLock
│   │   ├── RentableLock
│   │   └── ...
│   ├── Door (#43)
│   ├── Wearable (#34)
│   ├── Stackable (#40)
│   └── ...
└── Singletons (parent: Root)
    ├── Recycler
    ├── Bank
    ├── BodyFactory
    ├── AI
    └── ...
```

## Lock System

Locks are objects that implement `canAccess(agent, target)`.

### Available Lock Types

| Lock | Alias | Description |
|------|-------|-------------|
| Lock | `$.lock` (#49) | Base lock, always allows access |
| Biometric Lock | `$.biometricLock` | Scans body parts for authorization |
| Rentable Lock | `$.rentableLock` | Rental system for apartments |
| Latch Lock | `$.latchLock` (#2491) | One-sided privacy lock |

### Creating a New Lock Type via MCP (Runtime)

You can create new lock prototypes entirely via MCP without touching code:

```javascript
// 1. Create the prototype (parent is $.lock #49)
mcp.create_object({
  parent: 49,
  properties: {
    name: "Latch Lock",
    description: "A simple latch that can only be locked or unlocked from one side.",
    locked: false,
    insideRoomId: null  // Room ID from which lock can be operated
  }
});
// Returns: Created object #2491

// 2. Add the canAccess method
mcp.set_method({
  objectId: 2491,
  name: "canAccess",
  code: `
    const agent = args[0];
    const target = args[1];

    if (!self.locked) {
      return true;
    }
    return 'The latch is locked from the other side.';
  `
});

// 3. Add lock/unlock methods
mcp.set_method({
  objectId: 2491,
  name: "lock",
  code: `
    const agent = args[0];

    if (!self.insideRoomId) {
      return 'This latch is not installed properly.';
    }
    if (agent.location !== self.insideRoomId) {
      return 'You can only latch this from the other side.';
    }
    if (self.locked) {
      return 'The latch is already locked.';
    }

    self.locked = true;
    return 'You slide the latch closed.';
  `
});

mcp.set_method({
  objectId: 2491,
  name: "unlock",
  code: `
    const agent = args[0];

    if (!self.insideRoomId) {
      return 'This latch is not installed properly.';
    }
    if (agent.location !== self.insideRoomId) {
      return 'You can only unlatch this from the other side.';
    }
    if (!self.locked) {
      return 'The latch is already unlocked.';
    }

    self.locked = false;
    return 'You slide the latch open.';
  `
});

// 4. Register the alias
mcp.call_method({
  objectId: 0,
  name: "addAlias",
  args: ["latchLock", 2491]
});
```

### Creating a New Lock Type via Code

```typescript
export class [Name]LockBuilder {
  constructor(private manager: ObjectManager) {}

  async build(lockId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockId,  // Parent is $.lock
      properties: {
        name: '[Name] Lock',
        description: 'Description',
        // Lock-specific properties
      },
      methods: {},
    });

    obj.setMethod('canAccess', `
      const agent = args[0];
      const target = args[1];

      // Return true to allow access
      // Return string to deny with message

      if (/* condition */) {
        return true;
      }
      return 'Access denied: reason';
    `);

    return obj;
  }
}
```

### Creating Lock Instances

```javascript
// Create an instance of latchLock for a specific door
mcp.create_object({
  parent: 2491,  // $.latchLock prototype
  properties: {
    name: "bathroom latch",
    description: "A simple sliding latch, tarnished brass.",
    locked: false,
    insideRoomId: 2487  // The bathroom room ID
  }
});
// Returns: Created object #2492
```

### Attaching Locks to Doors/Exits

Locks are stored in a `locks` array as object references:

```javascript
// Attach lock to door via MCP
mcp.set_property({
  objectId: 2490,  // door ID
  name: "locks",
  value: ["#2492"]  // array of objrefs
});

// Or in method code:
const locks = door.locks || [];
locks.push("#" + lock.id);
door.locks = locks;
```

### Testing Locks

```javascript
// Test canAccess
mcp.call_method({
  objectId: 2492,
  name: "canAccess",
  args: [null, null]
});
// Returns: true (unlocked) or "The latch is locked from the other side."

// Manually toggle for testing
mcp.set_property({ objectId: 2492, name: "locked", value: true });
```

## Door System

Doors are objects attached to exits. Properties:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Door name |
| `description` | string | What it looks like |
| `open` | boolean | Is the door open? |
| `locked` | boolean | Legacy simple lock |
| `locks` | array | Array of lock object IDs |
| `code` | string | Legacy code lock |
| `autolockOnClose` | boolean | Auto-lock when closed |
| `location` | number | Room ID where door is visible |

Methods: `openDoor()`, `closeDoor()`, `lockDoor()`, `unlockDoor()`, `canAccess(agent)`

## Room/World Building via MCP

### dig - Create a room with exits

```javascript
await mcp.dig({
  name: "Room Name",
  description: "Room description...",
  fromRoomId: 123,        // Connect from this room
  exitDirection: "north", // Exit direction from source
  returnDirection: "south", // Return exit direction
  x: 5, y: 10, z: 0       // Coordinates
});
```

### link_rooms - Connect existing rooms

```javascript
await mcp.link_rooms({
  fromRoomId: 123,
  toRoomId: 456,
  exitDirection: "enter building",
  returnDirection: "out"  // Optional
});
```

### Creating objects via MCP

```javascript
// Create an instance of a prototype
await mcp.create_object({
  parent: prototypeId,
  properties: {
    name: "Object name",
    description: "Description",
    location: roomId,
    // ... other properties
  }
});

// Set a property
await mcp.set_property({
  objectId: 123,
  name: "propertyName",
  value: "value"  // or number, boolean, array, object, "#id" for objref
});

// Call a method
await mcp.call_method({
  objectId: 123,
  name: "methodName",
  args: [arg1, arg2]
});
```

## Testing

Run TypeScript type check:
```bash
npx tsc --noEmit
```

Run tests:
```bash
npm test
```

## Common Gotchas

1. **Build order**: Prototypes must be built after their parents exist
2. **Array/object mutation**: Must re-set the property after modifying
3. **Async**: All method code is async - use `await` for `$.load`, `$.recycler`, etc.
4. **String methods**: Methods are strings, escape special characters properly
5. **Objrefs**: Use `"#123"` format for object references in properties
6. **Aliases**: Register aliases after building so `$.name` resolution works

## Documentation

Create `docs/moo/[name].md` or `docs/moo/prototypes/[name].md` for new systems.

Follow the existing doc style:
- Overview section
- Properties table
- Methods with examples
- Usage examples
- See Also links
