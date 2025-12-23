# MCP Tools & Resources Reference

The tools and resources available to you for managing the city.

## Overview

You interact with the Malice MOO by writing native MOO code using `execute_moo_code`:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Create a plot
    const plotId = await $plot.create('Water Main Repair', {
      type: 'infrastructure',
      priority: 'high'
    });

    // Spawn an NPC
    const npc = await $ai.spawn({
      role: 'supervisor',
      name: 'Site Foreman',
      location: await $load(repairSiteId),
      personality: 'Gruff but professional.'
    });

    // Log event
    await $plot.addEvent(plotId, 'Job posted. Awaiting workers.', 'system');

    return {plotId, npcId: npc.id};
  `
})
```

**Benefits**: No wrapper layer, composable code with loops/conditionals, full MOO context ($, $load(), $aliases).

The tools below are legacy wrappers - prefer direct MOO code when possible.

## MCP Resources (Read-Only)

Resources provide read-only access via URI patterns. Use these for inspection.

### Object Resources

| Resource | Description |
|----------|-------------|
| `moo://objects/{id}` | Get object details (properties, methods, parent) |
| `moo://objects/{id}/prop/{name}` | Get a specific property value |
| `moo://objects/{id}/method/{name}` | Get method code (walks inheritance) |
| `moo://objects/list/{page}` | Paginated object list (100/page) |

**Examples:**
```
moo://objects/100             # Object #100
moo://objects/100/prop/name   # Get name property
moo://objects/100/method/say  # Get say method (shows inheritance)
moo://objects/list/1          # First 100 objects
```

### Room Resources

| Resource | Description |
|----------|-------------|
| `moo://rooms/{id}` | Room state (exits, players, contents) |

### AI NPC Resources

| Resource | Description |
|----------|-------------|
| `moo://ai` | List all AI NPCs |
| `moo://ai/{id}` | NPC profile (personality, history, memories) |
| `moo://ai/{id}/memories` | NPC memories only |
| `moo://ai/{id}/notes` | NPC notes only |
| `moo://npc-sessions/{id}` | NPC conversation history |

### Plot Resources

| Resource | Description |
|----------|-------------|
| `moo://plots` | List all plots |
| `moo://plots/{id}` | Plot details |
| `moo://plots/{id}/events` | Plot event log |

### Documentation Resources

| Resource | Description |
|----------|-------------|
| `moo://docs` | List technical docs |
| `moo://docs/{name}` | Get doc: mcp-tools, plot-jobs, builders-guide, moo-programming, npc-agent, timeline |
| `moo://city-ai` | List city AI docs |
| `moo://city-ai/{name}` | Get doc: context, factions, jobs, locations, map, npcs, objectives, plots, rules, tools |

### Other Resources

| Resource | Description |
|----------|-------------|
| `moo://players` | List players |
| `moo://players/{id}` | Player details |
| `moo://aliases` | Object aliases |
| `moo://events/recent` | Recent game events |

---

## MCP Tools (Read-Write)

### search_objects

Find objects by name pattern.

```javascript
mcp.search_objects({ pattern: 'Factory', limit: 50 })
```

### find_by_property

Find objects with a specific property value.

```javascript
mcp.find_by_property({ name: 'faction', value: 'Citizen' })
```

### find_children

Find objects that inherit from a parent.

```javascript
mcp.find_children({ parentId: playerPrototypeId, recursive: true })
```

## Property Tools

### set_property

Set a property on an object.

```javascript
mcp.set_property({ objectId: 100, name: 'credits', value: 500 })
```

## Method Tools

### set_method

Create or update a method.

```javascript
mcp.set_method({
  objectId: 100,
  name: 'greet',
  code: `
    const visitor = args[0];
    return 'Welcome, ' + visitor.name + '.';
  `
})
```

### call_method

Execute a method on an object.

```javascript
mcp.call_method({
  objectId: 100,
  name: 'greet',
  args: [playerId]
})
```

## Creation Tools

### create_object

Create a new object. The `parent` must be a RuntimeObject, not a number.

```javascript
// First load the parent prototype
const roomPrototype = await manager.load(roomPrototypeId);

// Then create the object with the loaded parent
const result = await manager.create({
  parent: roomPrototype!,
  properties: {
    name: 'New Room',
    description: 'A freshly created room.'
  }
});
// Returns: RuntimeObject
```

### clone_object

Deep copy an object.

```javascript
mcp.clone_object({ objectId: 100, locationId: roomId })
```

### recycle_object

Soft-delete an object.

```javascript
mcp.recycle_object({ objectId: 100 })
```

## World Tools

### list_rooms

List all rooms with coordinates.

```javascript
mcp.list_rooms()
```

### get_exits

List exits from a room.

```javascript
mcp.get_exits({ roomId: 100 })
```

### dig

Create a new room with exits.

```javascript
mcp.dig({
  name: 'Storage Room',
  description: 'A dusty storage area.',
  fromRoomId: 100,
  exitDirection: 'north',
  returnDirection: 'south'
})
```

### link_rooms

Create exits between rooms.

```javascript
mcp.link_rooms({
  fromRoomId: 100,
  toRoomId: 200,
  exitDirection: 'east',
  returnDirection: 'west'
})
```

### move_object

Move an object to a new location.

```javascript
mcp.move_object({ objectId: 100, destinationId: 200 })
```

### spawn_item

Create an instance of a prototype at a location.

```javascript
mcp.spawn_item({
  prototypeId: sustainPrototypeId,
  locationId: dispensaryId,
  properties: { name: 'Sustain Pill' }
})
```

## Alias Tools

### alias_lookup

Look up an object by its alias.

```javascript
mcp.alias_lookup({ alias: 'faction' })
// Returns: { alias: 'faction', id: 50, name: 'Faction Manager' }
```

### list_aliases

List all registered aliases.

```javascript
mcp.list_aliases()
```

### add_alias

Register a global alias for an object. Makes it accessible as `$name` to both factions.

```javascript
mcp.add_alias({ alias: 'securityCamera', objectId: '#1234' })
// Returns: "Registered $securityCamera -> #1234"
```

**Important:** All new technology prototypes should be registered as aliases so both factions can use them. This is a core rule of the game — you build the toy, everyone can play with it.

## Player Tools

### list_players

List all players with location and online status.

```javascript
mcp.list_players()
```

## AI/NPC Tools (Consolidated `ai` tool)

All AI operations use the `ai` tool with an `action` parameter.

### spawn

Create an AI-controlled human.

```javascript
ai({
  action: 'spawn',
  role: 'guard',
  name: 'Marcus',
  locationId: factoryId,
  sex: 'male',
  age: 35,
  personality: 'Suspicious and vigilant.',
  history: 'Former military.'
})
```

### despawn

Remove an AI human.

```javascript
ai({ action: 'despawn', humanId: 500, recycle: true })
```

### list

List AI-controlled humans.

```javascript
ai({ action: 'list', role: 'guard' })
```

### info

Get information about an AI human.

```javascript
ai({ action: 'info', humanId: 500 })
```

### do

Execute a command as an AI human.

```javascript
ai({ action: 'do', humanId: 500, command: 'say Halt! Identify yourself.' })
```

### look

Get what an AI sees in their location.

```javascript
ai({ action: 'look', humanId: 500 })
```

### profile

Get the full profile (also available as resource `moo://ai/{id}`).

```javascript
ai({ action: 'profile', humanId: 500 })
```

### setPersonality / setHistory

Set personality or history.

```javascript
ai({ action: 'setPersonality', humanId: 500, personality: 'Gruff but fair.' })
ai({ action: 'setHistory', humanId: 500, history: 'Former soldier.' })
```

### remember / recall / forget

Manage memories.

```javascript
ai({ action: 'remember', humanId: 500, text: 'Player Jack is wanted', importance: 'critical' })
ai({ action: 'recall', humanId: 500, criticalOnly: true })
ai({ action: 'forget', humanId: 500, index: 2 })
```

### Dressing NPCs ($tailor)

Use `$tailor.dress()` to dress NPCs. The tailor creates contextually appropriate clothing based on role, personality, and environment.

**In MOO code:**
```typescript
const npc = await $load(500);
await $tailor.dress(npc, 'shabby, recently fired')
```

**Using execute_moo_code:**
```typescript
execute_moo_code({
  code: `
    const npc = await $load(500);
    await $tailor.dress(npc, 'shabby, recently fired');
    return { success: true };
  `
})
```

The tailor automatically:
- Loads the NPC's role and personality
- Examines their environment
- Creates clothing appropriate to their social tier
- Equips items in proper layer order (underwear → base → mid → outer)

**Social tier clothing:**
- Scavengers: Minimal - just pants, maybe shirt, poor condition
- Workers/Guards: Basic - underwear, pants, shirt, boots
- Corporate: Complete - full outfit with socks, belt, proper shoes
- Executives: Formal - 3-piece suit, silk underwear, polished shoes

### spawn with clothed

Auto-dress NPCs on spawn:

**In MOO code:**
```typescript
await $ai.spawn({
  role: 'guard',
  location: await $load(100),
  clothed: true
})

await $ai.spawn({
  role: 'executive',
  location: await $load(200),
  clothed: true,
  context: 'CEO of major corp'
})
```

See [TAILORING.md](../TAILORING.md) for full clothing system reference.

## Plot/Job Tools (Consolidated `plot` tool)

All plot/job operations use the `plot` tool with an `action` parameter.

### create

Create a narrative container.

```javascript
plot({ action: 'create', name: 'Water Main Repair', metadata: { type: 'infrastructure' } })
```

### list

List plots with optional status filter.

```javascript
plot({ action: 'list', status: 'active' })
```

### get_events

Get the event log (also available as resource `moo://plots/{id}/events`).

```javascript
plot({ action: 'get_events', plotId: 100, limit: 50 })
```

### add_event

Add an event to a plot's log.

```javascript
plot({ action: 'add_event', plotId: 100, message: 'Worker arrived.', from: 'handler' })
```

### close

Close a plot with a final status.

```javascript
plot({ action: 'close', plotId: 100, status: 'completed', reason: 'Repair successful.' })
```

### create_job / complete_job / fail_job

Manage jobs within plots.

```javascript
plot({ action: 'create_job', plotId: 100, jobId: 'repair_pipe', metadata: { reward: 50 } })
plot({ action: 'complete_job', plotId: 100, jobId: 'repair_pipe', reason: 'Done.' })
plot({ action: 'fail_job', plotId: 100, jobId: 'repair_pipe', reason: 'Abandoned.' })
```

### next

Get the next plot needing attention.

```javascript
plot({ action: 'next' })
```

## Notes Tool (Consolidated `notes` tool)

Attach notes to objects for tracking.

### add / append / get / delete

```javascript
notes({ action: 'add', objectId: 100, text: 'Needs review', tags: ['review'] })
notes({ action: 'append', objectId: 100, tag: 'log', text: '[2108-03-15] Event occurred' })
notes({ action: 'get', objectId: 100 })
notes({ action: 'delete', objectId: 100, index: 0 })
```

### search / list_objects

```javascript
notes({ action: 'search', tag: 'review' })
notes({ action: 'list_objects' })
```

## Combat Tool (Consolidated `combat` tool)

All combat resolution operations use the `combat` tool with an `action` parameter.

See [COMBAT.md](./COMBAT.md) for full combat resolution guide.

### status

Get current combat state.

```javascript
combat({ action: 'status', combatId: 'combat-abc123' })
```

### context

Get full context for AI resolution (combatants, actions, stats, wounds, weapons).

```javascript
combat({ action: 'context', combatId: 'combat-abc123' })
```

### check

Perform a skill check. Skills are emergent - any skill name is valid.

```javascript
combat({ 
  action: 'check', 
  combatId: 'combat-abc123',
  combatantId: 100,
  skillName: 'knife-fighting',
  opposingLevel: 50  // optional, default 50
})
```

### damage

Apply damage to a combatant's body part.

```javascript
combat({
  action: 'damage',
  combatId: 'combat-abc123',
  targetId: 200,
  bodyPart: 'torso',
  damageType: 'cut',  // cut, bruise, puncture, laceration, abrasion, burn
  severity: 45,       // 0-100
  cause: 'blade'      // optional: blade, fist, blunt, boot, claw
})
```

### emote

Narrate combat action to the room.

```javascript
combat({
  action: 'emote',
  combatId: 'combat-abc123',
  text: "Jack's blade arcs toward Marcus. Marcus throws up an arm, the knife slicing across his forearm."
})
```

### effect

Apply a status effect.

```javascript
combat({
  action: 'effect',
  combatId: 'combat-abc123',
  targetId: 200,
  effect: 'stunned',  // stunned, knockedDown, disarmed, winded
  intensity: 60,
  duration: 30000     // optional, ms
})
```

### end

End the combat.

```javascript
combat({
  action: 'end',
  combatId: 'combat-abc123',
  reason: 'death',    // death, flee, surrender, knockout, intervention
  winnerId: 100       // optional
})
```

### next_round

Advance to the next round.

```javascript
combat({ action: 'next_round', combatId: 'combat-abc123' })
```

### list

List all active combats.

```javascript
combat({ action: 'list' })
```

## World Query Tool (Consolidated `world` tool)

SQL-like querying of MOO objects.

### query

```javascript
world({ action: 'query', q: ".name contains 'sword'" })
world({ action: 'query', q: ".parent == 10 and .location exists", limit: 20 })
```

### Query Syntax

```
.property == value           # Equality
.property contains 'text'    # Substring match
.property like 'foo*'        # Glob pattern
.property exists             # Property is defined
X and Y / X or Y             # Logical operators
```

## Common Patterns

### Find and modify a player

```javascript
// Find player by name
const results = await mcp.search_objects({ pattern: 'PlayerName' });
const player = results[0];

// Get their faction (via resource)
const info = await readResource(`moo://objects/${player.id}/prop/faction`);

// Set their credits
await mcp.set_property({ objectId: player.id, name: 'credits', value: 100 });
```

### Create a repair job

```javascript
// Create plot
const result = await plot({ action: 'create', name: 'Repair: Water Main', metadata: { type: 'repair' } });
const plotId = result.plotId;

// Create job
await plot({ action: 'create_job', plotId, jobId: 'fix_pipe', metadata: { reward: 50 } });

// Spawn supervisor NPC
await ai({ action: 'spawn', role: 'supervisor', name: 'Site Foreman', locationId: repairSiteId });

// Log event
await plot({ action: 'add_event', plotId, message: 'Job posted. Awaiting workers.' });
```

### Check room contents (using resource)

```javascript
const roomInfo = await readResource('moo://rooms/100');
// roomInfo.players - players in room
// roomInfo.contents - objects in room
// roomInfo.exits - available exits
```
