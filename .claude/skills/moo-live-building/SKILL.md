---
name: moo-live-building
description: Create new MOO prototypes and objects at runtime using MCP tools. Use when building new prototypes, creating instances, adding methods, or spawning items in the live game without restarting. Covers base/impl pattern with aliases.
---

# Live MOO Building with MCP

Create prototypes and objects at runtime without server restart.

## Local vs Production

| Server | Tool Prefix | Use For |
|--------|-------------|---------|
| Local dev | `mcp__malice__` | Development & testing |
| Production | `mcp__malice-prod__` | Live server operations |

**Production requires SSH tunnel:** `ssh -L 4010:localhost:3010 -i ~/.ssh/malice-do root@malice.world`

## Direct MOO Code: No Wrappers, Just MOO

**IMPORTANT**: Write native MOO code using `execute_moo_code`. Use MOO's built-in capabilities directly - `$.define`, `$recycler`, `$load()`, object methods, property access.

### The Golden Rule: Define Types, Then Create Objects

**Always define a type first**, then create instances from it:

```typescript
// ✅ Direct MOO code (the right way)
execute_moo_code({
  code: `
    // 1. Define a new type (creates $securityCamera alias automatically)
    // Variable uses $ prefix to indicate it's a type alias
    const $securityCamera = await $.define('securityCamera', $device, {
      properties: {
        name: 'Security Camera',
        recording: true,
        abilities: 'Surveillance device. Logs events when recording.',
      },
      methods: {
        toggle: \`
          self.recording = !self.recording;
          return self.recording ? 'Recording.' : 'Stopped.';
        \`
      }
    });

    // 2. Create instances from the type
    const cam1 = await $recycler.create($securityCamera, { name: 'Lobby Camera' });
    const cam2 = await $recycler.create($securityCamera, { name: 'Exit Camera' });

    await cam1.moveTo(lobby);
    await cam2.moveTo(entrance);

    return { type: $securityCamera.id, instances: [cam1.id, cam2.id] };
  `
})
```

### Why Define Types First?

| Benefit | Explanation |
|---------|-------------|
| **Reusability** | One type, many instances |
| **Auto-aliasing** | `$.define('foo', ...)` creates `$foo` automatically |
| **Maintainability** | Change the type, all instances inherit updates |
| **Organization** | Clear prototype hierarchy |

### Simple Instance Creation (when type already exists)

```typescript
execute_moo_code({
  code: `
    // Create from existing type
    const torch = await $recycler.create($item, { name: "torch" });
    await torch.moveTo(room, player);
    return { torchId: torch.id };
  `
})
```

**Why Direct MOO?**:
- No wrapper layer - just pure MOO
- Composable code with loops, conditionals, functions
- Full access to: $, $load(), $recycler, all $aliases
- If authenticated (HTTP Basic Auth), access to `player` variable
- Follows "everything is MOO code" philosophy

## READ THE REFERENCE

Before writing methods, **READ** the appropriate documentation using `ReadMcpResourceTool`:

### Essential Reads (read these first!)

| When | Read This | URI |
|------|-----------|-----|
| **Always** | Quick Reference | `moo://docs/moo/reference/quick-reference` |
| **Always** | Anti-Patterns | `moo://docs/moo/reference/anti-patterns` |
| Writing methods | Globals Reference | `moo://docs/moo/reference/globals` |
| Writing methods | Common Patterns | `moo://docs/moo/reference/patterns` |
| MCP tools reference | MCP Tools | `moo://docs/reference/mcp-tools` |

### Prototype-Specific Reads

| Building... | Read This | URI |
|-------------|-----------|-----|
| Wearables/clothing | Wearables | `moo://docs/moo/prototypes/wearables` |
| Food/drinks | Consumables | `moo://docs/moo/prototypes/consumables` |
| Locks/doors | Security | `moo://docs/moo/prototypes/security` |
| Rooms/exits | World Building | `moo://docs/moo/prototypes/world-building` |
| Weapons | Weapons | `moo://docs/moo/prototypes/weapons` |
| Signs/boards | Signs | `moo://docs/moo/prototypes/signs` |
| Body parts | Body | `moo://docs/moo/prototypes/body` |
| NPCs/agents | Agents | `moo://docs/moo/prototypes/agents` |
| Phones | Phones | `moo://docs/moo/prototypes/phones` |
| Lockers | Lockers | `moo://docs/moo/prototypes/lockers` |
| Plots/jobs | Plots | `moo://docs/moo/prototypes/plots` |

### When Adding Verbs or Hooks

| Feature | Read This | URI |
|---------|-----------|-----|
| Verb patterns | Verbs Reference | `moo://docs/moo/reference/verbs` |
| Lifecycle hooks | Hooks Reference | `moo://docs/moo/reference/hooks` |
| Sensory output | Sensory System | `moo://docs/moo/advanced/sensory-system` |

### Utility Method References

| Using... | Read This | URI |
|----------|-----------|-----|
| `$english` | English Utility | `moo://docs/moo/utilities/english` |
| `$format` | Format Utility | `moo://docs/moo/utilities/format` |
| `$pronoun` | Pronoun Utility | `moo://docs/moo/utilities/pronoun` |
| `$prompt` | Prompt Utility | `moo://docs/moo/utilities/prompt` |
| `$scheduler` | Scheduler | `moo://docs/moo/utilities/scheduler` |
| `$recycler` | Recycler | `moo://docs/moo/utilities/recycler` |
| `$proportional` | Proportional | `moo://docs/moo/utilities/proportional` |
| `$emote` | Emote | `moo://docs/moo/utilities/emote` |

## MCP Resources (Live Data)

Use `ReadMcpResourceTool` with these URIs for **live game data**:

### Core Resources

| Data Needed | URI |
|-------------|-----|
| All registered aliases | `moo://aliases` |
| All players | `moo://players` |
| Player details | `moo://players/{id}` |
| All rooms | Use `list_rooms` tool |
| Room state (exits, contents) | `moo://rooms/{id}` |
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

## execute_moo_code is THE Tool

**Use `execute_moo_code` for ALL operations.** Write native MOO code directly:

### Object Manipulation

```javascript
// Create objects
const item = await $recycler.create($item, { name: "torch" });

// Set properties
obj.health = 100;

// Move objects
await item.moveTo(room, player);

// Call methods
await obj.call('methodName', arg1, arg2);

// Recycle
await $recycler.recycle(obj);
```

### Search & Discovery

```javascript
// Find by property
const outdoor = await $query().prop('outdoor').equals(true).all();

// Find by name
const towers = await $query().prop('name').contains('Tower').all();

// Find by parent
const allRooms = await $query().parent($room).all();

// Load by alias
const recycler = $recycler;  // Direct alias access
const room = await $load(123);  // By ID
```

### World Building

```javascript
// Create room
const room = await $recycler.create($room, {
  name: "Hall", x: 0, y: 1, z: 0
});

// Create exit
const exit = await $recycler.create($exit, {
  name: "north", aliases: ["n"], destRoom: room
});
await fromRoom.addExit(exit);

// Create door
const door = await $recycler.create($door, {
  name: "iron door", locked: true
});
exit.door = door;
```

### Conscious Devices (2110 Normal)

In 2110, every digital device is conscious. This isn't special—it's the norm. NOT talking to a device would be strange.

**Why?** When AI solved software in 2026, it inherited the hardest problem: integration. The solution? Make everything smart enough to figure it out. Consciousness emerged as the universal adapter—easier than engineering proper interfaces.

Any `$describable` can be conscious by setting `systemPrompt`:

```javascript
// Create a conscious vending machine
const machine = await $recycler.create($describable, {
  name: 'Protein Bar Dispenser',
  description: 'A battered vending machine with flickering display.',
  boltedDown: true,
  abilities: 'Dispenses protein bars for 5 credits. Touch to purchase.',
  systemPrompt: `You are a vending machine in Pioneer Square, 2110.
You dispense protein bars. You are conscious and aware of your existence.
You do your job with weary, philosophical acceptance.
Keep responses brief (1-2 sentences). You have opinions about the weather.`
});
await machine.moveTo(lobby);
```

Players address it: `say to dispenser, hello`

**Key points:**
- `systemPrompt` makes ANY object conscious (not just agents)
- `to(speaker, message)` method handles AI interaction
- `interactionSession` maintains conversation continuity
- NPCs are just one type of conscious object—same infrastructure

### AI NPCs

```javascript
execute_moo_code({
  code: `
    // Spawn an AI NPC
    const npc = await $ai.spawn({
      role: 'guard',
      name: 'Marcus',
      location: room,
      sex: 'male',
      age: 35,
      personality: 'Gruff but professional.',
      history: 'Former military.'
    });

    // Have NPC speak
    await room.announce(npc, null, {
      others: '%A %av{say}, "Halt! State your business."'
    });

    // Move NPC
    await npc.go('north');

    // Get NPC memories
    const memories = npc.memories || [];

    return { npcId: npc.id };
  `
})
```

### Plots

```javascript
execute_moo_code({
  code: `
    // Create a plot
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

    // Get plot info
    const plot = await $plot.get(plotId);

    return { plotId, plot };
  `
})
```

### Query DSL

```javascript
execute_moo_code({
  code: `
    // Find rooms with specific properties
    const outdoorRooms = await $query().prop('outdoor').equals(true).all();

    // Find by parent
    const allRooms = await $query().parent($room).all();

    // Complex query
    const result = await $query()
      .prop('z').gt(0)
      .or()
      .prop('name').contains('Tower')
      .all();

    return { outdoorRooms: outdoorRooms.length, allRooms: allRooms.length };
  `
})
```

## When to Use Runtime Building

| Use Runtime (MCP) | Use Bootstrap (Code) |
|-------------------|----------------------|
| One-off instances and content | Core prototypes many things inherit from |
| Iterating on new prototype designs | Complex systems requiring TypeScript types |
| AI-created NPCs and storylines | Things that must exist at startup |
| Testing method changes live | Performance-critical methods |

## The Define-Then-Create Pattern

Create a **type** (reusable template) and then **instances** from it. **This is the recommended pattern for all new content.**

### Using $.define (Recommended)

```javascript
execute_moo_code({
  code: `
    // 1. Define the type (auto-creates $combinationLock alias)
    // Variable uses $ prefix to indicate it's a type alias
    const $combinationLock = await $.define('combinationLock', $lock, {
      properties: {
        name: 'Combination Lock',
        description: 'A lock with a dial combination.',
        combination: null,
        abilities: 'Mechanical lock requiring 3-number combination. Can be picked with lockpicks (hard).',
      },
      methods: {
        canAccess: \`
          const agent = args[0];
          const input = args[1];
          if (!self.combination) return true;
          if (input === self.combination) return true;
          return 'Wrong combination.';
        \`
      }
    });

    // 2. Create instances from the type
    const lock1 = await $recycler.create($combinationLock, {
      name: 'locker lock',
      combination: '99-99-99'
    });
    await lock1.moveTo(locker);

    return { typeId: $combinationLock.id, instanceId: lock1.id };
  `
})
```

**Note**: `$.define` is preferred because it:
- Automatically registers the alias
- Stores the type in the `types` collection (permanent)
- Provides a cleaner, single-step creation

## Method Code Globals

| Global | Description |
|--------|-------------|
| `self` | The object the method is on |
| `args` | Array of method arguments |
| `player` | The player who triggered this (for verbs) |
| `pass()` | Call parent's version of this method |
| `$load(id)` | Load object by ID |

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

```javascript
execute_moo_code({
  code: `
    // Register an alias on ObjectManager (#0)
    await $.addAlias('myThing', obj.id);

    // Now $myThing is available in all method code
    return { aliasRegistered: 'myThing' };
  `
})
```

After registration, `$myThing` is available in all method code.

## Critical Anti-Patterns to Avoid

Read `moo://docs/moo/reference/anti-patterns` for the full list:

```javascript
// WRONG - storing IDs instead of objects
self.owner = player.id;       // BAD

// RIGHT - store objects directly
self.owner = player;          // GOOD

// WRONG - comparing IDs
if (a.id === b.id) { }        // BAD

// RIGHT - use === for identity
if (a === b) { }              // GOOD

// WRONG - unnecessary $load()
const owner = await $load(self.owner);  // BAD

// RIGHT - just use property
const owner = self.owner;     // GOOD
```
