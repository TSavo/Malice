---
name: bootstrap-building
description: Update TypeScript bootstrap files for world building at server startup. Use when creating core prototypes, singleton utilities, or initial world content that must exist when the server starts. Covers builder patterns and registration.
---

# Bootstrap Building (Code-Based)

Create prototypes and utilities that exist at server startup via TypeScript builders.

## READ THE REFERENCE

Before writing builder code, **READ** the appropriate documentation using `ReadMcpResourceTool`:

### Essential Reads (read these first!)

| When | Read This | URI |
|------|-----------|-----|
| **Always** | Bootstrap System | `moo://docs/moo/advanced/bootstrap` |
| **Always** | Builders Guide | `moo://docs/builders-guide` |
| Writing methods | Globals Reference | `moo://docs/moo/reference/globals` |
| Writing methods | Anti-Patterns | `moo://docs/moo/reference/anti-patterns` |
| Writing methods | Common Patterns | `moo://docs/moo/reference/patterns` |
| MCP tools | MCP Tools | `moo://docs/mcp-tools` |

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
| Smith Tower building | Smith Tower Guide | `moo://docs/smith-tower-builders-guide` |
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

## MCP Tools for Inspection

Use these tools to inspect live objects when designing bootstrap code:

| Tool | Purpose |
|------|---------|
| `get_property` | Get property value |
| `get_inheritance` | Get ancestor/descendant chain |
| `alias_lookup` | Resolve alias to object |
| `list_aliases` | List all $.aliases |
| `find_by_property` | Find by property value |
| `search_objects` | Find by name pattern |
| `describe_object` | Get runtime description |

### `ai` tool actions for inspection

| Action | Purpose |
|--------|---------|
| `list` | List all AI humans |
| `info` | Get AI human details |
| `profile` | Get full NPC profile |
| `memories` | Get memory summary |
| `worldLog` | Get world log entries |

### `world` tool - Query DSL

```javascript
// Find objects by property
mcp__malice__world({ action: "query", q: ".parent == 49" })

// Find by name pattern
mcp__malice__world({ action: "query", q: ".name contains 'Lock'" })
```

## When to Use Bootstrap

| Use Bootstrap (Code) | Use Runtime (MCP) |
|----------------------|-------------------|
| Core prototypes many things inherit from | One-off instances and content |
| Complex systems requiring TypeScript types | Iterating on new prototype designs |
| Things that must exist at startup | AI-created NPCs and storylines |
| Performance-critical methods | Testing method changes live |

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

### Step 1: Create Builder File

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
