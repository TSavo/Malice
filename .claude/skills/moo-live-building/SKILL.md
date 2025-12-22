---
name: moo-live-building
description: Create new MOO prototypes and objects at runtime using MCP tools. Use when building new prototypes, creating instances, adding methods, or spawning items in the live game without restarting. Covers base/impl pattern with aliases.
---

# Live MOO Building with MCP

Create prototypes and objects at runtime without server restart.

## READ THE REFERENCE

Before writing methods, **READ** the appropriate documentation using `ReadMcpResourceTool`:

### Essential Reads (read these first!)

| When | Read This | URI |
|------|-----------|-----|
| **Always** | Quick Reference | `moo://docs/moo/reference/quick-reference` |
| **Always** | Anti-Patterns | `moo://docs/moo/reference/anti-patterns` |
| Writing methods | Globals Reference | `moo://docs/moo/reference/globals` |
| Writing methods | Common Patterns | `moo://docs/moo/reference/patterns` |
| MCP tools reference | MCP Tools | `moo://docs/mcp-tools` |

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

## MCP Tools Reference

### Object Manipulation

| Tool | Purpose |
|------|---------|
| `create_object` | Create new object with parent |
| `set_property` | Set property value |
| `get_property` | Get property value |
| `set_method` | Create/update method code |
| `call_method` | Execute a method |
| `spawn_item` | Create instance at location |
| `clone_object` | Deep copy an object |
| `move_object` | Move to new location |
| `recycle_object` | Soft-delete object |
| `describe_object` | Get runtime description |

### Search & Discovery

| Tool | Purpose |
|------|---------|
| `search_objects` | Find by name pattern |
| `find_by_property` | Find by property value |
| `find_in_location` | List contents of room/container |
| `get_inheritance` | Get ancestor/descendant chain |
| `alias_lookup` | Resolve alias to object |
| `list_aliases` | List all $.aliases |
| `add_alias` | Register new alias |

### World Building

| Tool | Purpose |
|------|---------|
| `dig` | Create room with exits |
| `link_rooms` | Create exit between rooms |
| `unlink` | Remove an exit |
| `get_exits` | List exits from room |
| `set_exit_door` | Attach door to exit |
| `list_rooms` | List all rooms |
| `list_players` | List all players |

### Consolidated Tools (use `action` parameter)

#### `ai` tool - AI NPC management

| Action | Purpose |
|--------|---------|
| `spawn` | Create AI-controlled human |
| `despawn` | Remove AI human |
| `list` | List all AI humans |
| `info` | Get AI human details |
| `do` | Execute command as AI |
| `look` | Get what AI sees |
| `tailor` | Dress NPC with AI tailor |
| `profile` | Get full NPC profile |
| `setPersonality` | Set personality traits |
| `setHistory` | Set backstory |
| `remember` | Store critical memory |
| `recall` | Get memories |
| `forget` | Remove memory |
| `memories` | Get memory summary |
| `expect` | Set response timeout |
| `cancelExpect` | Cancel timeout |
| `path` | A* pathfinding |
| `walkPath` | Walk AI along path |
| `worldLog` | Get world log entries |

#### `plot` tool - Plot/job management

| Action | Purpose |
|--------|---------|
| `create` | Create new plot |
| `get` | Get plot details |
| `list` | List plots by status |
| `search` | Search plot events |
| `close` | Complete/abandon plot |
| `set_metadata` | Update plot metadata |
| `add_event` | Log plot event |
| `get_events` | Get event log |
| `set_phases` | Define phases |
| `get_phases` | Get phase definitions |
| `create_job` | Create job in plot |
| `get_job` | Get job details |
| `complete_job` | Mark job complete |
| `fail_job` | Mark job failed |
| `get_job_phase` | Get job's phase |
| `advance_phase` | Advance to next phase |
| `set_phase` | Set specific phase |
| `register_hook` | Register job hook |
| `next` | Get next plot needing attention |
| `active` | List all active plots |

#### `notes` tool - Notes on objects

| Action | Purpose |
|--------|---------|
| `get` | Get notes on object |
| `add` | Add note to object |
| `append` | Append to existing note |
| `delete` | Delete note by index |
| `search` | Search notes |
| `list_objects` | List objects with notes |

#### `world` tool - Query DSL

| Action | Purpose |
|--------|---------|
| `query` | Execute DSL query |
| `validate` | Validate query syntax |

#### `combat` tool - Combat resolution

| Action | Purpose |
|--------|---------|
| `status` | Get combat state |
| `context` | Get full context for AI |
| `check` | Skill check |
| `damage` | Apply damage |
| `emote` | Narrate action |
| `effect` | Apply status effect |
| `end` | End combat |
| `next_round` | Advance round |
| `list` | List active combats |

### Telnet Sessions

| Tool | Purpose |
|------|---------|
| `session_connect` | Connect to MOO |
| `session_send` | Send command |
| `session_log` | Get session output |
| `session_list` | List sessions |
| `session_close` | Close session |

## When to Use Runtime Building

| Use Runtime (MCP) | Use Bootstrap (Code) |
|-------------------|----------------------|
| One-off instances and content | Core prototypes many things inherit from |
| Iterating on new prototype designs | Complex systems requiring TypeScript types |
| AI-created NPCs and storylines | Things that must exist at startup |
| Testing method changes live | Performance-critical methods |

## The Base/Impl Pattern

Create a **base prototype** (reusable template) and then **instances** (implementations):

### Step 1: Create Base Prototype

```javascript
mcp__malice__create_object({
  parent: "$lock",
  properties: {
    name: "Combination Lock",
    description: "A lock with a dial combination.",
    combination: null
  }
})
// Returns: { objectId: 2500 }
```

### Step 2: Add Methods to Base

```javascript
mcp__malice__set_method({
  objectId: "#2500",
  name: "canAccess",
  code: `
    const agent = args[0];
    const input = args[1];
    if (!self.combination) return true;
    if (input === self.combination) return true;
    return 'Wrong combination.';
  `
})
```

### Step 3: Register Alias (Optional)

```javascript
mcp__malice__call_method({
  objectId: "#0",
  name: "addAlias",
  args: ["combinationLock", 2500]
})
```

### Step 4: Create Instances

```javascript
mcp__malice__spawn_item({
  prototypeId: "$combinationLock",
  locationId: "#100",
  properties: {
    name: "locker lock",
    combination: "99-99-99"
  }
})
```

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
