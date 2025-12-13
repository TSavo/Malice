# Bootstrap System

Understanding Malice's bootstrap process and how to create custom system builders.

## Purpose

The bootstrap system initializes a fresh Malice database, creating the minimal object hierarchy and all core utilities. Understanding this process is essential for:
- Adding new utility systems (like custom `$.myUtility`)
- Understanding startup sequence
- Debugging initialization issues
- Creating custom world content

## Bootstrap Architecture

Bootstrap happens in **three phases**:

```
Phase 1: MinimalBootstrap
├─ Creates #0 (ObjectManager - implicit, always exists)
├─ Creates #1 (Root - base of all objects)
├─ Creates #2 (System - connection router)
└─ Registers core aliases (nothing, root, system)

Phase 2: AliasLoader
└─ Loads all aliases from MongoDB (root.properties.aliases)

Phase 3: World Building (if needed)
├─ PrototypeBuilder: Creates $.describable, $.agent, $.player, etc.
├─ CoreSystemBuilder: Creates all utilities ($.english, $.format, etc.)
├─ WorldBuilder: Creates initial rooms and world geometry
└─ AliasLoader (again): Reloads to include new aliases
```

## The Four Core Objects

| ID | Name | Parent | Purpose |
|----|------|--------|---------|
| #0 | ObjectManager | - | Manages all objects, proxy for `$` |
| #1 | Root | #0 | Base of inheritance, config storage |
| #2 | System | #1 | Connection router, player tracking |
| #3+ | Dynamic | varies | Everything else (dynamic IDs) |

**Important:** Only #0, #1, #2 have fixed IDs. Everything else is dynamically assigned.

## Phase 1: MinimalBootstrap

Creates the absolute essentials needed before any other code can run.

**What it creates:**

### Object #1 (Root)
```typescript
{
  _id: 1,
  parent: 0,
  properties: {
    name: 'Root',
    description: 'Base of all objects',
    config: {
      siteName: 'Malice',
      motd: 'Welcome to Malice!',
      maxConnections: 100
    }
  },
  methods: {}
}
```

**Purpose:**
- Base of all inheritance (every object has Root in its parent chain)
- Stores global configuration
- Minimal by design (just data storage)

### Object #2 (System)
```typescript
{
  _id: 2,
  parent: 1,
  properties: {
    name: 'System',
    description: 'Connection router and system coordinator'
  },
  methods: {
    onConnection: '...',  // Routes new connections
    tickAllPlayers: '...' // Heartbeat for all online players
  }
}
```

**Purpose:**
- Entry point for all new connections
- Routes to AuthManager or PreAuthHandler
- Coordinates system-wide operations (heartbeats, cleanup)

### Alias Management Methods

MinimalBootstrap adds three methods to #0 (ObjectManager):

```javascript
// Register a new alias
await $.addAlias('myUtil', obj);

// Remove an alias (protected: nothing, object_manager, root, system)
await $.removeAlias('myUtil');

// Look up an alias
const id = await $.getAlias('myUtil');
```

## Phase 2: AliasLoader

Loads aliases from MongoDB's `root.properties.aliases`:

```javascript
{
  nothing: -1,
  object_manager: 0,
  root: 1,
  system: 2,
  // Dynamic IDs (set during bootstrap):
  describable: 5,
  player: 8,
  english: 12,
  format: 15,
  // ... etc
}
```

**Why MongoDB?**
- Dynamic IDs change between databases
- No hardcoded IDs in TypeScript code
- Can add/remove aliases without code changes
- Persists across restarts

After loading, these become available as `$.english`, `$.format`, etc.

## Phase 3: World Building

Only runs if the world hasn't been built yet (checks for `$.player` existence).

### PrototypeBuilder

Creates the object hierarchy:

```
$.root (#1)
└─ $.describable
    ├─ $.location
    │   └─ $.room
    ├─ $.exit
    ├─ $.agent
    │   └─ $.embodied
    │       └─ $.human
    │           └─ $.player
    │               └─ $.admin
    ├─ $.wearable
    │   └─ $.clothing
    └─ $.edible
        ├─ $.food
        ├─ $.drink
        └─ $.bodyPart
```

Each prototype is created with:
- Properties (defaults for all instances)
- Methods (behavior shared by all instances)
- Proper parent chain

### CoreSystemBuilder

Creates all utility systems (dynamic IDs):

| Builder | Alias | Purpose |
|---------|-------|---------|
| AuthManagerBuilder | `authManager` | Login system |
| CharGenBuilder | `charGen` | Character creation |
| RecyclerBuilder | `recycler` | Object lifecycle |
| EnglishBuilder | `english` | Grammar utilities |
| PronounSubBuilder | `pronoun` | Perspective messaging |
| FormatBuilder | `format` | Text formatting |
| ProportionalBuilder | `proportional` | Value-based messages |
| PromptBuilder | `prompt` | Interactive input |
| EmoteBuilder | `emote` | Sensory emotes |
| SchedulerBuilder | `scheduler` | Job scheduling |
| MutexBuilder | `mutex` | Object locks |
| ExclusionsBuilder | `exclusions` | Action exclusions |
| MementoBuilder | `memento` | Object cloning |
| PlotBuilder | `plot` | Narrative logging |
| RoomBuilder | `room` | Room utilities |
| BodyFactoryBuilder | `bodyFactory` | Body creation |

**Process:**
1. Instantiate all builders
2. Call `build()` on each (creates objects, adds methods)
3. Call `registerAlias()` on each (adds to root.properties.aliases)

### WorldBuilder

Creates initial world geometry:
- Spawns starting room(s)
- Creates exits between rooms
- Sets up initial locations
- Registers `startRoom` alias

### BuildingBuilder

Creates structured buildings from TypeScript definition files:

```typescript
// src/database/bootstrap/world/seattle/pioneer-square/buildings/smith-tower/z1.ts
export const building = {
  rooms: {
    '%E': {
      prototype: 'elevator',
      exits: { out: '%LOBBY' },
    },
    '%LOBBY': {
      name: 'Floor 1 Lobby',
      description: `...`,
      x: -4, y: 8, z: 1,
      exits: { north: '%A', in: '%E' },

      // Spawn objects inside rooms
      objects: [
        {
          prototype: 'jobBoard',  // Must exist in $.aliases
          name: 'Employment Terminal',
          description: 'A job listing terminal.',
        },
      ],
    },
  },
};
```

**Key features:**
- Uses `%placeholder` system for cross-floor references
- Shared objects (elevators, locks) use same placeholder across floors
- Supports `objects` array to spawn items inside rooms
- Objects get `location` set and are added to room's `contents` via `addContent()`

See [SMITH-TOWER-BUILDERS-GUIDE.md](../../../SMITH-TOWER-BUILDERS-GUIDE.md) for detailed documentation.

## Creating a Custom Utility Builder

### Step 1: Create the Builder Class

```typescript
// src/database/bootstrap/my-utils-builder.ts
import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

export class MyUtilsBuilder {
  private myUtils: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // 1. Check if already exists (idempotency)
    const objectManager = await this.manager.load(0);
    const aliases = objectManager?.get('aliases') as Record<string, number> || {};

    if (aliases.myUtils) {
      this.myUtils = await this.manager.load(aliases.myUtils);
      if (this.myUtils) return; // Already built
    }

    // 2. Create the utility object
    this.myUtils = await this.manager.create({
      parent: 1,  // Inherit from Root
      properties: {
        name: 'MyUtils',
        description: 'My custom utilities',
        // Add any properties here
        config: { enabled: true }
      },
      methods: {},
    });

    // 3. Add methods
    this.myUtils.setMethod('greet', `
      const name = args[0] || 'stranger';
      return 'Hello, ' + name + '!';
    `);

    this.myUtils.setMethod('calculate', `
      const a = args[0] || 0;
      const b = args[1] || 0;
      return a + b;
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.myUtils) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    // Register as $.myUtils
    await objectManager.call('addAlias', 'myUtils', this.myUtils.id);
  }
}
```

### Step 2: Add to CoreSystemBuilder

```typescript
// src/database/bootstrap/core-system-builder.ts

// Add import at top
import { MyUtilsBuilder } from './my-utils-builder.js';

export class CoreSystemBuilder {
  async buildCoreSystems(): Promise<void> {
    // ... existing builders ...
    const myUtilsBuilder = new MyUtilsBuilder(this.manager);

    // Build phase
    await myUtilsBuilder.build();
    // ... other builds ...

    // Register alias phase
    await myUtilsBuilder.registerAlias();
    // ... other registrations ...
  }
}
```

### Step 3: Export from index

```typescript
// src/database/bootstrap/index.ts
export { MyUtilsBuilder } from './my-utils-builder.js';
```

### Step 4: Use Your Utility

After restart, your utility is available:

```javascript
// In any MOO code:
const greeting = await $.myUtils.greet('Alice');
// "Hello, Alice!"

const sum = await $.myUtils.calculate(5, 3);
// 8
```

## Builder Best Practices

### 1. Idempotency

Always check if the object already exists:

```typescript
async build(): Promise<void> {
  const objectManager = await this.manager.load(0);
  const aliases = objectManager?.get('aliases') as Record<string, number> || {};

  if (aliases.myUtils) {
    this.myUtils = await this.manager.load(aliases.myUtils);
    if (this.myUtils) return; // Already exists, don't recreate
  }

  // Create new...
}
```

**Why:** Bootstrap might run multiple times during development.

### 2. Use Parent #1 (Root)

Utilities should inherit from Root:

```typescript
this.myUtils = await this.manager.create({
  parent: 1,  // Root
  properties: { ... }
});
```

**Why:** Utilities don't need complex inheritance, just basic object features.

### 3. Separate build() and registerAlias()

```typescript
async build(): Promise<void> {
  // Create object and add methods
}

async registerAlias(): Promise<void> {
  // Register in root.properties.aliases
}
```

**Why:** All objects must exist before any aliases are registered (dependency ordering).

### 4. Document Methods

Add JSDoc comments in method code:

```typescript
this.myUtils.setMethod('greet', `
  /** Greet someone by name
   *  @param name - Name to greet (default: 'stranger')
   *  @returns Greeting message
   */
  const name = args[0] || 'stranger';
  return 'Hello, ' + name + '!';
`);
```

### 5. Use Existing Utilities

Don't duplicate logic:

```typescript
// BAD - duplicates $.english.plural
this.myUtils.setMethod('makePlural', `
  return word.endsWith('s') ? word : word + 's';
`);

// GOOD - delegates to $.english
this.myUtils.setMethod('formatList', `
  const items = args[0];
  return await $.english.list(items);
`);
```

## Prototypes vs Utilities

| Use Case | Create As | Parent | Example |
|----------|-----------|--------|---------|
| **Utility** | Single object | #1 (Root) | $.english, $.format |
| **Prototype** | Prototype object | Existing prototype | $.weapon → $.describable |

**Utilities:**
- Stateless helpers
- Called from anywhere
- One instance globally
- Methods operate on arguments

**Prototypes:**
- Base for creating instances
- Have many instances (clone via $.recycler)
- Define default properties/methods
- Methods operate on `self`

## Testing Your Builder

### 1. Drop Test Database

```bash
node scripts/drop-test-db.js
```

### 2. Restart Server

```bash
npm run dev
```

### 3. Check Logs

Look for:
```
🎮 Bootstrapping Malice...
✅ Minimal bootstrap complete
✅ Loaded all aliases
🏗️  Building World...
Creating core systems...
✅ Created MyUtils
✅ World built successfully!
```

### 4. Test in DevTools or Client

Connect and try:
```javascript
await $.myUtils.greet('Bob');
```

## Debugging Bootstrap Issues

### Object Not Found

```
Error: Object not found: myUtils
```

**Cause:** Alias not registered or builder not run

**Fix:** Check CoreSystemBuilder includes your builder

### Duplicate Alias

```
Error: Alias 'myUtils' already exists
```

**Cause:** Trying to register same alias twice

**Fix:** Check idempotency in `build()`

### Method Not Found

```
Error: myUtils.greet is not a function
```

**Cause:** Method wasn't added during build

**Fix:** Verify `setMethod()` calls in `build()`

### Bootstrap Fails

```
Error during bootstrap: ...
```

**Fix:** Check logs, fix error, drop test DB, restart

## Advanced: Prototype Builders

For creating prototypes (not utilities):

```typescript
// src/database/bootstrap/prototypes/weapon-builder.ts
export class WeaponBuilder {
  private weapon: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check for existing
    const objectManager = await this.manager.load(0);
    const aliases = objectManager?.get('aliases') as Record<string, number> || {};

    if (aliases.weapon) {
      this.weapon = await this.manager.load(aliases.weapon);
      if (this.weapon) return;
    }

    // Create prototype
    const describable = await this.manager.load(aliases.describable);
    if (!describable) throw new Error('Describable not found');

    this.weapon = await this.manager.create({
      parent: describable.id,  // Inherit from $.describable
      properties: {
        name: 'Weapon',
        description: 'A base weapon prototype',
        damage: 0,
        damageType: 'blunt',
        durability: 100,
        maxDurability: 100
      },
      methods: {},
    });

    // Add weapon-specific methods
    this.weapon.setMethod('attack', `
      const target = args[0];
      const attacker = args[1];
      
      if (self.durability <= 0) {
        return { success: false, error: 'Weapon is broken' };
      }
      
      self.durability--;
      return { success: true, damage: self.damage, type: self.damageType };
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.weapon) return;

    const objectManager = await this.manager.load(0);
    await objectManager.call('addAlias', 'weapon', this.weapon.id);
  }
}
```

Add to PrototypeBuilder instead of CoreSystemBuilder.

## Bootstrap Execution Order

**Startup sequence:**

1. **Server starts** → `game-bootstrap.ts`
2. **Phase 1: MinimalBootstrap** → Creates #0, #1, #2
3. **Phase 2: AliasLoader** → Loads existing aliases
4. **Check world** → Does `$.player` exist?
   - **Yes** → Skip to step 8
   - **No** → Continue to step 5
5. **Phase 3a: PrototypeBuilder** → Creates object hierarchy
6. **Phase 3b: CoreSystemBuilder** → Creates utilities
7. **Phase 3c: WorldBuilder** → Creates rooms
8. **AliasLoader (again)** → Reloads all aliases
9. **Ready** → Accepts connections

**Total time:** Usually 100-500ms on fresh DB.

## See Also

- [Architecture](../architecture.md) - Three-layer system overview
- [Creating Utilities](./utilities.md) - When to create utilities vs prototypes (coming soon)
- [Prototypes](../prototypes.md) - Prototype system and inheritance
- [Core Concepts](../core-concepts.md) - Objects and the $ system
