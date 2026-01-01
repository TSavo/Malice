# Malice Builders Guide

A comprehensive guide for creating new prototypes and systems in Malice.

**Related Documentation:**
- [MCP-TOOLS.md](MCP-TOOLS.md) - MCP tools for AI assistants and automation
- [moo-programming.md](moo-programming.md) - MOO programming reference
- [plot-jobs.md](plot-jobs.md) - Plot/job system for AI city management

## Building Best Practices

### Priority 1: Fix Specification Gaps FIRST

**IMPORTANT**: Before building or modifying objects, check if the spec is complete. Use the Bug Fixer pattern:

```typescript
// 1. First, understand the object by reading its AI-friendly description
const description = await object.describeForAI();
console.log(description);
// Returns a structured breakdown: properties, abilities, methods, inheritance

// 2. Look for gaps in the specification
// Missing abilities text? Add it.
// Properties without descriptions? Add them.
// Methods without JSDoc? Add it.
```

**The Bug Fixer checks for:**
- Missing `abilities` text (physics/behavior specification)
- Properties without descriptions (use `setPropertyDescription()`)
- Methods without JSDoc comments (constraints/contracts)
- Inherited methods that need overriding
- Incomplete double dispatch patterns

**Why this matters**: AI narrators and tools depend on complete specifications. Fixing gaps makes objects self-documenting and extensible.

### Understanding Objects with describeForAI()

Before modifying an object, always understand what it is:

```typescript
// Get a complete AI-friendly description
const info = await object.describeForAI();

// Returns:
{
  objectId: 42,
  name: "Security Camera",
  parent: "#3 (Describable)",
  properties: {
    recording: {
      value: true,
      description: "Whether actively recording."  // ✅ Self-documenting
    },
    eventLog: {
      value: [],
      description: "Array of recorded events."
    }
  },
  abilities: "Surveillance device. When 'recording' is true...",
  methods: {
    record: {
      code: "...",
      inherited: false,
      documentation: "/** Records an event to the log */"
    }
  }
}
```

**When to use describeForAI():**
- Before editing methods on an unfamiliar object
- When investigating bugs or unexpected behavior
- Before adding new properties or abilities
- To understand the inheritance chain

### Self-Documenting Properties

Always add property descriptions for new properties:

```typescript
// ✅ GOOD: Self-documenting
object.setPropertyDescription('maxCapacity', "Maximum weight this container can hold (kg).");
object.maxCapacity = 50;

// ❌ BAD: Undocumented
object.maxCapacity = 50;  // What units? What does this control?
```

**Why**: Property descriptions appear in:
- `describeForAI()` output
- AI narrator context
- Builder tools and inspectors
- Error messages

### Abilities Text: Physics and Behavior

Abilities describe HOW things interact, not just WHAT they are:

```typescript
// ✅ GOOD: Complete abilities specification
const lock = await $recycler.create($lock, {
  name: "Combination Lock",
  combination: "12-34-56",
  abilities: `
    Mechanical lock requiring a 3-number combination.
    Can be picked with lockpicks (difficulty: hard).
    Can be forced with strength > 15 (makes noise).
    Can be bypassed if hinge pins are removed.
    Combination can be reset by authorized personnel.
  `
});

// ❌ BAD: No abilities (AI has no idea how it works)
const lock = await $recycler.create($lock, {
  name: "Combination Lock",
  combination: "12-34-56"
});
```

**What to include in abilities:**
- How the object responds to common actions
- What tools or conditions can modify it
- Side effects (noise, damage, alerts)
- Limitations and constraints

### Double Dispatch Pattern for Extensibility

Use double dispatch to allow new tools to work with existing systems:

```typescript
// ❌ BAD: Lock knows about every tool
lock.setMethod('pick', `
  const tool = args[0];
  if (tool.name === 'lockpick') return true;
  if (tool.name === 'hairpin') return true;
  if (tool.name === 'paperclip') return true;
  // Every new tool requires editing this method!
  return false;
`);

// ✅ GOOD: Double dispatch - let tools define their capabilities
lock.setMethod('pick', `
  const tool = args[0];

  // Delegate to the tool: "Can YOU pick THIS?"
  if (tool.canPick && await tool.canPick(self)) {
    self.locked = false;
    return 'You successfully pick the lock.';
  }

  return 'You cannot pick this lock with that.';
`);

// Now tools define what they can do
lockpick.setMethod('canPick', `
  const lock = args[0];

  // Lockpicks work on mechanical locks
  if (lock.abilities?.includes('mechanical')) {
    return true;
  }

  // But not biometric locks
  if (lock.abilities?.includes('biometric')) {
    return false;
  }

  return false;
`);
```

**Benefits:**
- Add new tools without modifying lock code
- Tools can have complex logic (skill checks, durability)
- Abilities text guides the tool's logic
- Extensible to new lock types

**Common double dispatch patterns:**
- `lock.pick(tool)` → `tool.canPick(lock)`
- `container.pry(tool)` → `tool.canPry(container)`
- `door.force(agent)` → `agent.canForce(door)`
- `npc.persuade(agent)` → `agent.canPersuade(npc)`

### Growing the Spec: Prototypes vs Instances

When adding functionality, add to **prototypes**, not instances:

```typescript
// ❌ BAD: Adding abilities to a single instance
const door = await $load(123);
door.abilities = "Can be forced with strength > 15";

// ✅ GOOD: Add to the prototype so ALL doors get it
const doorProto = await $door;
doorProto.abilities = doorProto.abilities + "\n\nCan be forced with strength > 15.";

// Now create a force() method on the prototype
doorProto.setMethod('force', `
  const agent = args[0];
  const str = agent.strength || 10;

  if (str > 15) {
    self.open = true;
    return 'You force the door open with a loud crash!';
  }

  return 'You strain against the door but cannot force it.';
`);
```

**Why**:
- Prototypes define shared behavior
- Instances inherit automatically
- Easier to maintain consistency
- Changes propagate to all instances

**When to modify instances:**
- Override specific behavior (e.g., "this door cannot be forced")
- Set unique property values (e.g., "this lock's combination")
- Add instance-specific data (e.g., "this NPC's name")

### Complete Workflow Example

Here's the complete Bug Fixer workflow:

```typescript
// 1. Understand the object
const lock = await $load(49);  // $lock prototype
const info = await lock.describeForAI();

// 2. Check for gaps
if (!info.abilities) {
  // Missing abilities - add them
  lock.abilities = `
    Base lock that always allows access.
    Child prototypes should override canAccess() method.
    Can be attached to doors, containers, or any secured object.
  `;
}

// 3. Check properties
if (!info.properties.locked?.description) {
  lock.setPropertyDescription('locked', "Whether the lock is currently engaged.");
}

// 4. Add missing JSDoc to methods
if (info.methods.canAccess && !info.methods.canAccess.documentation) {
  lock.editMethod('canAccess',
    'const agent = args[0];',
    `/**
     * Check if an agent can access through this lock.
     * @param {RuntimeObject} agent - The agent attempting access
     * @param {RuntimeObject} target - The secured object
     * @returns {boolean|string} true if allowed, error message if denied
     */
    const agent = args[0];`
  );
}

// 5. Implement double dispatch if missing
const code = lock.getMethod('pick');
if (code && !code.includes('canPick')) {
  // Add double dispatch support
  lock.editMethod('pick',
    'return false;',
    `// Delegate to tool
    if (tool.canPick && await tool.canPick(self)) {
      return true;
    }
    return false;`
  );
}

// 6. Verify the fix
const updated = await lock.describeForAI();
console.log('Updated object:', updated);
```

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

### Direct MOO Code Approach

**IMPORTANT**: Write native MOO code using `execute_moo_code`. Use MOO's built-in capabilities directly:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Create object using $recycler
    const lock = await $recycler.create($lock, {
      name: "Combination Lock",
      description: "A lock with a dial combination.",
      combination: "12-34-56"
    });

    // Add method directly
    lock.setMethod("canAccess", \\\`
      const agent = args[0];
      const input = args[1];
      if (!self.combination) return true;
      if (input === self.combination) return true;
      return 'Wrong combination.';
    \\\`);

    // Edit method with find/replace (like file editing)
    lock.editMethod("canAccess", "Wrong combination", "Try again");
    // Returns: { success: true, code: '...' }

    // Get method source
    const code = lock.getMethod("canAccess");

    // Register alias
    await $.addAlias("combinationLock", lock.id);

    return {id: lock.id, name: lock.name};
  `
})
```

**Why Direct MOO?**:
- No wrapper layer - just pure MOO
- Composable code with full JavaScript
- Access to $, $load(), $recycler, all $aliases
- If authenticated (HTTP Basic Auth), access to `player` variable

### Creating Objects via MCP (Legacy Examples)

```javascript
// Create a new object
mcp.create_object({
  parent: "#49",  // $lock prototype
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
  parent: "#3",  // $describable
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
    const parent = await $load(self._parent);
    return parent.add(args[0]);
  `
});
```

### AI Registry Integration

The $ai registry tracks AI-controlled humans (use the consolidated `ai` tool):

```javascript
// Spawn an AI human
$ai.spawn({ role: "guard", name: "Marcus", location: await $load(100), sex: "male", age: 35 });

// List all guards
$ai.getByRole("guard");

// Remove when done
$ai.despawn(567);
```

### Faction System Integration

The $faction singleton tracks faction memberships and inter-faction relationships:

```javascript
// Create a faction
await $faction.createFaction('Continuum', 'The AI-controlled corporate authority');
await $faction.createFaction('Scavengers', 'Survivors living outside the system');

// Set an entity's faction
await $faction.setFaction(entity, 'Continuum');
await $faction.setFaction(npc, 'Scavengers');

// Set relationships between factions
await $faction.setRelationship('Continuum', 'Scavengers', 'hostile');

// Check relationships
const friendly = await $faction.isFriendly(entityA, entityB);
const hostile = await $faction.isHostile(entityA, entityB);

// Get faction info
const faction = await $faction.getFaction(entity);  // returns 'Continuum'
const members = await $faction.getMembers('Continuum');  // returns [id, id, ...]
const relationship = await $faction.getRelationship('Continuum', 'Scavengers');  // 'hostile'

// Leadership
await $faction.setLeader('Continuum', leaderId);
const leader = await $faction.getLeader('Continuum');
```

Relationship types: `'friendly'`, `'hostile'`, `'neutral'` (default)

### Plot/Job System Integration

Create narratives and quests via MCP (use the consolidated `plot` tool):

```javascript
// Create a plot
$plotSpawner.createPlot( name: "Missing Jewels", metadata: { participants: [100], type: "investigation" } });

// Add a job with a hook
const plot = await $load(500); await plot.createJob("find_jewels", { reward: 100 });

// Watch for events
await plot.registerJobHook("find_jewels", 200, "itemPickedUp", { itemName: "jewels" });
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

  async build(parent: RuntimeObject): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parent,
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
      // $ = alias resolver (await $recycler, await $load(id))
      // caller = the agent who invoked this (if applicable)

      const param1 = args[0];
      return result;
    `);

    // Edit existing methods (like file editing - find/replace)
    obj.editMethod('methodName', 'old code', 'new code');
    // Returns: { success: true, code: '...' } or { success: false, error: '...' }

    // Replace all occurrences
    obj.editMethod('methodName', 'foo', 'bar', { replaceAll: true });

    // Get method source
    const code = obj.getMethod('methodName');  // local only
    const inherited = await obj.getMethodCode('methodName');  // walks chain

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
// Build after its parent exists - load the parent object first!
const parentObj = await this.manager.load(ids.parentPrototype);
ids.[name] = (await [name]Builder.build(parentObj!)).id;
```

4. Register alias (if needed):
```typescript
await objectManager.call('addAlias', '[name]', ids.[name]);
```

**IMPORTANT**: Build order matters! A prototype must be built AFTER its parent.

## Creating a Singleton Utility

Singletons like `$recycler`, `$bank`, `$ai` are system objects, not prototypes.

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
    const root = await this.manager.load(1);
    if (!root) throw new Error('Root object #1 not found');

    this.[name] = await this.manager.create({
      parent: root,
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
const recycler = await $recycler;
const bank = await $bank;

// 2. Load objects by ID
const obj = await $load(123);
const player = await $[42];  // Shorthand for $load(42)

// 3. Call methods on ObjectManager #0
// Any unknown property delegates to #0
await $clearAliasesForObject(objectId);
await $addAlias('myAlias', objectId);
const aliasId = await $getAlias('myAlias');

// 4. Access infrastructure
$.db           // Database access
$.evictFromCache(id)  // Cache management
```

### Common Patterns

```javascript
// Get another singleton
const recycler = await $recycler;
const bank = await $bank;

// Load an object by ID
const obj = await $load(123);

// Create an object
const newObj = await recycler.create({
  parent: prototypeId,
  properties: { ... }
}, locationId);

// Call a method on another object
await obj.methodName(arg1, arg2);

// Get/set properties (never use .get()/.set())
const value = self.propertyName;
self.propertyName = newValue;

// Compare objects with ===
if (self.location === room) { }

// Work with arrays (must re-assign to persist)
const arr = self.items || [];
arr.push(newItem);
self.items = arr;

// Work with objects (must re-assign to persist)
const map = self.registry || {};
map[key] = value;
self.registry = map;
```

### Finding Objects with $query

The fluent query builder uses a selector pattern:

```javascript
// Property selectors
$query().prop('outdoor').equals(true).all()
$query().prop('z').gt(0).all()
$query().prop('name').contains('smith').all()
$query().prop('*').contains('secret').all()  // search all properties

// Method selectors
$query().method('tick').exists().all()
$query().method('*').contains('$recycler').all()  // search all methods

// Negation
$query().prop('recycled').not().equals(true).all()
$query().method('tick').not().exists().all()

// OR groups (predicates within group are ANDed, groups are ORed)
$query().parent($weapon).or().prop('damage').gt(10).all()

// AND for readability (noop)
$query().prop('x').equals(1).and().prop('y').equals(2).all()

// Parent/inheritance filters
$query().parent($room).prop('z').equals(0).all()
$query().inheritedFrom($item).limit(10).all()
```

**Property predicates:** `.equals()`, `.exists()`, `.contains()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.in()`, `.matches()`, `.startsWith()`, `.endsWith()`

**Method predicates:** `.exists()`, `.existsLocal()`, `.contains()`, `.matches()`

**Query methods:**
- `.parent(proto)` - Direct parent prototype
- `.inheritedFrom(proto)` - Anywhere in prototype chain
- `.or()` - Start new OR group
- `.and()` - Noop for readability
- `.limit(n)` - Limit results

**Result methods:**
- `.all()` - All matching objects
- `.first()` - First match or null
- `.count()` - Count of matches
- `.ids()` - Array of IDs
- `.names()` - Array of names
- `.parents()` - Unique parents of matches
- `.children()` - Direct children of matches

### AI Queries with $aiQuery

Query Claude AI from MOO code:

```javascript
// Basic AI query
const result = await $aiQuery(systemPrompt, userPrompt);
// Returns: { response: "...", session: "abc123" }

// Resume conversation with session
const result = await $aiQuery(systemPrompt, userPrompt, previousSession);

// Store session for continuity
self.agentSession = result.session;
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
│   │   └── GuardedExit - faction-restricted passage
│   ├── Agent (#7)
│   │   └── Embodied (#8)
│   │       └── Human (#9)
│   │           └── Player (#10)
│   │               └── Admin (#11)
│   ├── Decayable (#12)
│   │   ├── Corpse (#13)
│   │   ├── Edible (#17)
│   │   │   ├── Food (#18)
│   │   │   │   └── Sustain (#19) - Continuum nutrient pills
│   │   │   ├── Drink (#20)
│   │   │   │   └── BottledWater (#21) - Sealed water bottles
│   │   │   └── BodyPart (#22)
│   │   └── ...
│   ├── Lock (#??)
│   │   ├── BiometricLock
│   │   ├── RentableLock
│   │   └── ...
│   ├── Door (#43)
│   ├── Wearable (#34)
│   │   └── Clothing
│   ├── Pocket - container attached to clothing
│   ├── Stackable (#40)
│   │   └── Dollar - physical cash
│   └── ...
└── Singletons (parent: Root)
    ├── Recycler
    ├── Bank - credit operations
    ├── Cash - physical cash operations
    ├── BodyFactory
    ├── AI
    ├── Faction - tracks faction memberships and relationships
    └── ...
```

## Lock System

Locks are objects that implement `canAccess(agent, target)`.

### Available Lock Types

| Lock | Alias | Description |
|------|-------|-------------|
| Lock | `$lock` (#49) | Base lock, always allows access |
| Biometric Lock | `$biometricLock` | Scans body parts for authorization |
| Rentable Lock | `$rentableLock` | Rental system for apartments |
| Latch Lock | `$latchLock` (#2491) | One-sided privacy lock |

### Creating a New Lock Type via MCP (Runtime)

You can create new lock prototypes entirely via MCP without touching code:

```javascript
// 1. Create the prototype (parent is $lock #49)
mcp.create_object({
  parent: "#49",
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

  async build(lockPrototype: RuntimeObject): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: lockPrototype,  // Parent is $lock
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
  parent: "#2491",  // $latchLock prototype
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

### Dynamic Room Creation with $spatial.ensureRoom()

For AI-controlled dynamic room creation (vehicles, exploration), use `$spatial.ensureRoom()`:

```javascript
// AI decides IF room should exist - returns room or null
const room = await $spatial.ensureRoom(x, y, z, 'hint about why');
if (!room) {
  // AI said no - this location doesn't make sense
  return 'Cannot go there.';
}
```

**When to use:**
- Aircraft flying to new coordinates
- Boats sailing to new water
- Submarines diving to new depths
- Room description mentions location that doesn't exist yet

**When NOT to use:**
- Normal player movement (use exits)
- Entering buildings (use exits)
- Any case where an exit should exist

The AI is **conservative** - it only creates rooms that make physical sense:
- Airspace: only above outdoor rooms
- Water: only in water terrain (x < -15)
- Underwater: only in water, max depth z >= -15 without hint

**Rooms are permanent** - once created, they stay forever. No cleanup needed.

See `docs/moo/prototypes/world-building.md` for complete documentation.

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
3. **Async**: All method code is async - use `await` for `$load`, `$recycler`, etc.
4. **String methods**: Methods are strings, escape special characters properly
5. **Objrefs**: Use `"#123"` format for object references in properties
6. **Aliases**: Register aliases after building so `$name` resolution works

## Documentation

Create `docs/moo/[name].md` or `docs/moo/prototypes/[name].md` for new systems.

Follow the existing doc style:
- Overview section
- Properties table
- Methods with examples
- Usage examples
- See Also links
