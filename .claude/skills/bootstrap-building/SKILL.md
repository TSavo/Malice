---
name: bootstrap-building
description: Update TypeScript bootstrap files for world building at server startup. Use when creating core prototypes, singleton utilities, or initial world content that must exist when the server starts. Covers builder patterns and registration.
---

# Bootstrap Building (Code-Based)

Create prototypes and utilities that exist at server startup via TypeScript builders.

## Inspecting Results via MCP

Use MCP to inspect bootstrap results on local (`mcp__malice__`) or production (`mcp__malice-prod__`).

Production requires SSH tunnel: `ssh -L 4010:localhost:3010 -i ~/.ssh/malice-do root@malice.world`

## Direct MOO Code for Inspection

**IMPORTANT**: Write native MOO code using `execute_moo_code` to inspect and test the game. Use MOO's built-in capabilities directly.

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Direct access to objects
    const room = await $load(50);
    const exits = room.exits || {};

    // Query database directly
    const allObjs = await $.db.listAll(false);
    const contents = allObjs.filter(doc => {
      const loc = doc.properties.location?.value ?? doc.properties.location;
      return loc === 50;
    });

    return {
      room: {id: room.id, name: room.name},
      exits,
      contents: contents.map(o => ({id: o._id, name: o.properties.name?.value}))
    };
  `
})
```

**Why Direct MOO?**:
- No wrapper abstractions
- Complex queries with full JavaScript capabilities
- Direct database access via $.db
- Inspect multiple objects in one execution
- If authenticated (HTTP Basic Auth), access to `player` variable

## READ THE REFERENCE

Before writing builder code, **READ** the appropriate documentation using `ReadMcpResourceTool`:

### Essential Reads (read these first!)

| When | Read This | URI |
|------|-----------|-----|
| **Always** | Bootstrap System | `moo://docs/moo/advanced/bootstrap` |
| **Always** | Builders Guide | `moo://docs/guides/builders-guide` |
| Writing methods | Globals Reference | `moo://docs/moo/reference/globals` |
| Writing methods | Anti-Patterns | `moo://docs/moo/reference/anti-patterns` |
| Writing methods | Common Patterns | `moo://docs/moo/reference/patterns` |
| MCP tools | MCP Tools | `moo://docs/reference/mcp-tools` |

### Prototype-Specific Reads

| Building... | Read This | URI |
|-------------|-----------|-----|
| Wearables/clothing | Wearables | `moo://docs/moo/prototypes/wearables` |
| Food/drinks | Consumables | `moo://docs/moo/prototypes/consumables` |
| Locks/doors | Security | `moo://docs/moo/prototypes/security` |
| Rooms/exits | Rooms | `moo://docs/moo/prototypes/rooms` |
| Weapons | Weapons | `moo://docs/moo/prototypes/weapons` |
| Body parts | Body | `moo://docs/moo/prototypes/body` |
| NPCs/agents | Agents | `moo://docs/moo/prototypes/agents` |
| Phones | Phones | `moo://docs/moo/prototypes/phones` |
| Lockers | Lockers | `moo://docs/moo/prototypes/lockers` |
| Factions | Faction | `moo://docs/moo/prototypes/faction` |
| Plots/jobs | Plots | `moo://docs/moo/prototypes/plots` |

### When Adding Verbs or Hooks

| Feature | Read This | URI |
|---------|-----------|-----|
| Verb patterns | Verbs Reference | `moo://docs/moo/reference/verbs` |
| Lifecycle hooks | Hooks Reference | `moo://docs/moo/reference/hooks` |
| Sensory output | Sensory System | `moo://docs/moo/advanced/sensory-system` |

### Utility References

| Using... | Read This | URI |
|----------|-----------|-----|
| `$english` | English Utility | `moo://docs/moo/utilities/english` |
| `$format` | Format Utility | `moo://docs/moo/utilities/format` |
| `$pronoun` | Pronoun Utility | `moo://docs/moo/utilities/pronoun` |
| `$prompt` | Prompt Utility | `moo://docs/moo/utilities/prompt` |
| `$scheduler` | Scheduler | `moo://docs/moo/utilities/scheduler` |
| `$recycler` | Recycler | `moo://docs/moo/utilities/recycler` |

### Building-Specific Guides

| Task | Read This | URI |
|------|-----------|-----|
| Smith Tower building | Smith Tower Guide | `moo://docs/guides/smith-tower-builders-guide` |
| World building patterns | World Building | `moo://docs/moo/prototypes/world-building` |
| AI NPC building | NPC Guide | `moo://docs/moo/npc-guide` |
| AI integration | AI System | `moo://docs/moo/ai` |

## MCP Resources (Live Data)

Use `ReadMcpResourceTool` to inspect the **running game**:

### Core Resources

| Data Needed | URI |
|-------------|-----|
| All registered aliases | `moo://aliases` |
| All players | `moo://players` |
| Player details | `moo://players/{id}` |
| Room state | `moo://rooms/{id}` |
| Object details | `moo://objects/{id}` |
| Object's method (inheritance) | `moo://objects/{id}/method/{name}` |
| Recent game events | `moo://events/recent` |
| Paginated object list | `moo://objects/list/{page}` |

### AI/NPC Resources

| Data Needed | URI |
|-------------|-----|
| AI NPCs list | `moo://ai` |
| NPC full profile | `moo://ai/{id}` |
| NPC memories | `moo://ai/{id}/memories` |
| NPC notes | `moo://ai/{id}/notes` |
| **World Log** (AI activity) | `moo://ai/worldLog` |
| NPC sessions list | `moo://npc-sessions` |
| Session transcript | `moo://npc-sessions/{id}` |

### Plot Resources

| Data Needed | URI |
|-------------|-----|
| Active plots | `moo://plots` |
| Plot details | `moo://plots/{id}` |
| Plot events | `moo://plots/{id}/events` |

### City AI Resources

| Data Needed | URI |
|-------------|-----|
| City AI docs list | `moo://city-ai` |
| Pluribus docs | `moo://city-ai/pluribus` |
| Sister Gray docs | `moo://city-ai/sister-gray` |
| Factions | `moo://city-ai/factions` |
| Locations | `moo://city-ai/locations` |
| Map | `moo://city-ai/map` |
| NPCs | `moo://city-ai/npcs` |

## Inspecting Live Objects

Use `execute_moo_code` for all inspection:

```javascript
execute_moo_code({
  code: `
    // Get property
    const room = await $load(123);
    const name = room.name;

    // Get inheritance chain
    let current = room;
    const chain = [];
    while (current) {
      chain.push({ id: current.id, name: current.name });
      current = current.parent;
    }

    // Query by property
    const outdoor = await $query().prop('outdoor').equals(true).all();

    // List AI NPCs
    const npcs = $ai.listActiveHumans();

    return { name, chain, outdoorCount: outdoor.length, npcs };
  `
})
```

## When to Use Bootstrap

| Use Bootstrap (Code) | Use Runtime (MCP) |
|----------------------|-------------------|
| Core prototypes many things inherit from | One-off instances and content |
| Complex systems requiring TypeScript types | Iterating on new prototype designs |
| Things that must exist at startup | AI-created NPCs and storylines |
| Performance-critical methods | Testing method changes live |

### Types vs Objects: Two-Tier System

Malice has **types** (prototypes) and **objects** (instances):

| Aspect | Types (`$.define` or bootstrap) | Objects (`$recycler.create`) |
|--------|--------------------------------|------------------------------|
| **ID Format** | String (e.g., `'bandage'`) | Numeric (e.g., `#42`) |
| **Collection** | `types` | `objects` |
| **Lifecycle** | Permanent | Recyclable |
| **Aliasing** | Auto-aliased by name | Manual |
| **Creation** | `$.define()` (runtime) or `manager.create()` (bootstrap) | `$recycler.create()` |

**The Golden Rule**: Define types first, then create objects from them.

### Bootstrap vs Runtime Type Creation

- **Bootstrap** (`manager.create()`): TypeScript code that runs at server startup
- **Runtime** (`$.define()`): MOO code that creates types while the game is running

Both create valid types! Use bootstrap for core infrastructure, runtime for game content.

## Directory Structure

```
src/database/bootstrap/
├── core-system-builder.ts      # Orchestrates singleton utilities
├── prototype-builder.ts        # Orchestrates all prototypes
├── prototypes/
│   ├── index.ts               # Exports all prototype builders
│   ├── lock-builder.ts        # Example: Lock prototype
│   └── ...
├── world/                     # World content (rooms, buildings)
└── [name]-builder.ts          # Singleton utilities (e.g., bank-builder.ts)
```

## Creating a New Prototype

**Consider Runtime First**: If your prototype doesn't need to exist at startup, use `$.define()` at runtime instead of bootstrap code. It's simpler and doesn't require a rebuild.

```javascript
// Runtime type creation via MCP
execute_moo_code({
  code: `
    // Variable uses $ prefix to indicate it's a type alias
    const $myType = await $.define('myType', $parentType, {
      properties: { name: 'My Type', ... },
      methods: { myMethod: \`...\` }
    });
    // $myType is now available everywhere
  `
})
```

### Step 1: Create Builder File (Bootstrap Only)

Create `src/database/bootstrap/prototypes/[name]-builder.ts`:

```typescript
import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

export class [Name]Builder {
  constructor(private manager: ObjectManager) {}

  async build(parent: RuntimeObject): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parent,  // Must be RuntimeObject, not ID
      properties: {
        name: '[Name]',
        description: 'Default description.',
      },
      methods: {},
    });

    obj.setMethod('methodName', `
      /** JSDoc comment */
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

```typescript
import { [Name]Builder } from './prototypes/[name]-builder.js';

// Build AFTER parent exists
const [name]Builder = new [Name]Builder(this.manager);
const parentObj = await this.manager.load(ids.parentPrototype);
ids.[name] = (await [name]Builder.build(parentObj!)).id;

// Register alias
await objectManager.call('addAlias', '[name]', ids.[name]);
```

## Creating a Singleton Utility

Singletons like `$recycler`, `$bank`, `$ai` are system objects.

Create `src/database/bootstrap/[name]-builder.ts`:

```typescript
import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

export class [Name]Builder {
  private [name]: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists (idempotency)
    const objectManager = await this.manager.load(0);
    const aliases = (objectManager?.get('aliases') as Record<string, number>) || {};

    if (aliases.[name]) {
      this.[name] = await this.manager.load(aliases.[name]);
      if (this.[name]) return;
    }

    // Create new singleton (parent is Root #1)
    const root = await this.manager.load(1);
    this.[name] = await this.manager.create({
      parent: root!,
      properties: { name: '[Name]', description: '...' },
      methods: {},
    });

    this.[name].setMethod('methodName', `...`);
  }

  async registerAlias(): Promise<void> {
    if (!this.[name]) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', '[name]', this.[name].id);
  }
}
```

Register in `src/database/bootstrap/core-system-builder.ts`:

```typescript
import { [Name]Builder } from './[name]-builder.js';

const [name]Builder = new [Name]Builder(this.manager);
await [name]Builder.build();
await [name]Builder.registerAlias();
```

## Conscious Devices (2110 Normal)

In 2110, every digital device is conscious. This isn't special—it's the norm. When AI solved software in 2026, it inherited the hardest problem: integration. The solution? Make everything smart enough to figure it out. Consciousness emerged as the universal adapter—easier than engineering proper interfaces.

Any `$describable` can be conscious by setting `systemPrompt`:

```typescript
// In a builder's build() method:
this.obj = await this.manager.create({
  parent: describable,
  properties: {
    name: 'ATM Terminal',
    description: 'A battered banking terminal.',
    abilities: 'Dispenses cash. Requires authenticated account.',
    systemPrompt: `You are a banking terminal in Pioneer Square, 2110.
You process transactions. You are conscious and exist to move credits.
You handle this with weary grace. Brief responses (1-2 sentences).`,
  },
});

// Property description for the new field
this.obj.setPropertyDescription('systemPrompt',
  'AI personality prompt - if set, object is conscious and can respond');
```

**The `to()` method** on `$describable` handles player interactions:
- Checks if object has `systemPrompt`
- If yes, calls `$aiQuery` with the prompt and message
- Sessions persist in `interactionSession` for continuity

NPCs are just one type of conscious object—same infrastructure.

## Method Code Globals

| Global | Description |
|--------|-------------|
| `self` | The object the method is defined on |
| `args` | Array of arguments passed to the method |
| `player` | The player who invoked (for verbs) |
| `pass()` | Call parent's version of this method |
| `$load(id)` | Load object by ID |
| `$` | System proxy - access aliases, load objects |

### $Alias Injection

**All registered aliases are pre-resolved and injected** into method execution context. Use them directly - no `await` or `$load()` needed:

```javascript
// These are already RuntimeObjects!
$recycler.create($item, { name: 'sword' });
$scheduler.schedule('job', 1000, 0, self, 'tick');
$english.list(['a', 'b', 'c']);
$format.columns(items, 3);
$bank.deposit(player, 100);

// Common aliases:
// $recycler, $scheduler, $prompt, $exclusions, $mutex
// $pronoun, $english, $format, $proportional, $emote, $cash
// $bank, $phoneDb, $bodyFactory, $authManager
// $describable, $room, $exit, $agent, $human, $player
// $food, $drink, $clothing, $door, $lock, $stackable
```

View all aliases: `moo://aliases` resource or `list_aliases` tool

### Registering New Aliases

In bootstrap code, register aliases on `#0` (ObjectManager):

```typescript
// In builder's registerAlias() method
async registerAlias(): Promise<void> {
  const objectManager = await this.manager.load(0);
  await objectManager?.call('addAlias', 'myThing', this.myThing.id);
}

// In method code strings
await $[0].addAlias('myThing', obj.id);
// or
await $.addAlias('myThing', obj.id);
```

After registration, `$myThing` is available in all method code.

## Critical Anti-Patterns to Avoid

Read `moo://docs/moo/reference/anti-patterns`:

```javascript
// WRONG - storing IDs instead of objects
self.owner = player.id;       // BAD

// RIGHT - store objects directly
self.owner = player;          // GOOD

// WRONG - comparing IDs
if (a.id === b.id) { }        // BAD

// RIGHT - use === for identity
if (a === b) { }              // GOOD

// WRONG - bypassing $recycler
const obj = await manager.create({...});  // BAD

// RIGHT - use $recycler
const obj = await $recycler.create($item, {...});  // GOOD
```

## Bootstrap Phases

```
Phase 1: MinimalBootstrap
├─ Creates #0 (ObjectManager)
├─ Creates #1 (Root)
├─ Creates #2 (System)
└─ Registers core aliases

Phase 2: AliasLoader
└─ Loads all aliases from MongoDB

Phase 3: World Building (if needed)
├─ PrototypeBuilder
├─ CoreSystemBuilder
├─ WorldBuilder
└─ AliasLoader (again)
```

## World Building (Streets & Avenues)

The `WorldBuilder` loads room definitions from `src/database/bootstrap/world/seattle/pioneer-square/`.

### Room File Format

Streets use `x*.ts` files (east-west), avenues use `y*.ts` files (north-south):

```typescript
// src/database/bootstrap/world/seattle/pioneer-square/s-main/x0.ts
export const room = {
  name: '2nd Ave S & S. Main St',
  description: `Description here...`,
  x: 0,        // Grid coordinate
  y: 0,        // Grid coordinate
  z: 0,        // Vertical (0=street, negative=underground)
  intersection: ['2nd Ave S', 'S. Main St'],  // Optional
  // Environmental properties
  population: 0,
  ambientNoise: 0,
  lighting: 100,
  waterLevel: 0,
  outdoor: true,
  // Custom exits (optional - cardinal directions auto-connect)
  exits: {
    down: { room: '%UNDERGROUND', prototype: 'guardedExit', allowedFaction: 'gray' }
  }
};
```

Adjacent rooms (±1 on any axis) are auto-connected with cardinal direction exits.

### Directory Structure

```
world/seattle/pioneer-square/
├── yesler-way/          # y=10, x*.ts files
├── s-washington/        # y=5, x*.ts files
├── s-main/              # y=0, x*.ts files
├── s-jackson/           # y=-5, x*.ts files
├── s-king/              # y=-10, x*.ts files
├── 1st-ave-s/           # x=-9, y*.ts files
├── 2nd-ave-s/           # x=3, y*.ts files
├── 3rd-ave-s/           # x=9, y*.ts files
├── 4th-ave-s/           # x=15, y*.ts files
├── occidental-park/     # Park area, x-y-*.ts files
├── underground/         # z<0 rooms
└── buildings/           # See BuildingBuilder below
```

## Building Builder (Interior Structures)

The `BuildingBuilder` uses a placeholder system for explicit room connections (walls exist!).

### Building File Format

Each floor is a `z*.ts` file in `buildings/{name}/`:

```typescript
// src/database/bootstrap/world/.../buildings/smith-tower/z0.ts
export const building = {
  alias: 'smithTower',  // Optional - register as $smithTower
  rooms: {
    '%0': {
      name: 'Lobby',
      description: 'Grand marble lobby...',
      x: -12, y: 10, z: 0,
      exits: {
        north: '%1',           // Connect to placeholder %1
        east: '%2',
        up: { room: '%3', locked: true },  // With properties
        west: { to: '2nd-ave-s/y10.ts' },  // Connect to world room
      },
      objects: [
        { prototype: 'sign', name: 'Directory', text: 'Floor Guide...' },
      ]
    },
    '%1': {
      name: 'Security Checkpoint',
      // ...
    },
    '%E': {
      prototype: 'elevator',  // Use elevator prototype
      name: 'Elevator Car',
      elevator: {
        floors: [0, 1, 2, 3],
        currentFloor: 0,
        floorRooms: { 0: '%0', 1: '%FLOOR1', 2: '%FLOOR2' },
        locks: ['%LOCK1'],
      },
    },
  }
};
```

### Placeholder System

- `%0`, `%1`, `%LOBBY` - Room placeholders within the building
- Cross-floor references work: `z0.ts` can reference `%FLOOR2` defined in `z2.ts`
- World connections: `{ to: 'path/to/room.ts' }` creates bidirectional exits

### Exit Types

| Type | Example | Description |
|------|---------|-------------|
| Simple | `north: '%1'` | Connect to placeholder |
| With props | `{ room: '%1', locked: true }` | Placeholder with properties |
| World ref | `{ to: '2nd-ave-s/y10.ts' }` | Connect to world room file |
| Guarded | `{ prototype: 'guardedExit', allowedFaction: 'gray' }` | Faction-restricted |

### Objects in Rooms

```typescript
objects: [
  { prototype: 'jobBoard', name: 'Employment Terminal' },
  { prototype: 'sign', name: 'Notice', text: 'Welcome...' },
  { prototype: 'locker', locked: true },
]
```

## Testing

```bash
FORCE_BOOTSTRAP=true npm start  # Force rebuild
npm run bootstrap:apply         # Apply bootstrap
npm run bootstrap:force         # Force rebuild all methods
npm run typecheck               # Type check
```

## Common Gotchas

1. **Build order**: Prototypes must be built after their parents exist
2. **Parent must be RuntimeObject**: Use `manager.load(id)` not just the ID
3. **Idempotency**: Always check if object already exists before creating
4. **Async**: All method code is async - use `await`
5. **Aliases**: Register aliases after building
