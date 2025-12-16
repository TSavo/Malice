# MCP Tools & Resources Reference

The tools and resources available to you for managing the city.

## Overview

You interact with the Malice MOO through MCP (Model Context Protocol) tools and resources. These allow you to:

- Query and modify game objects
- Manage plots and jobs
- Spawn and control NPCs
- Interact with the world

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

Create a new object.

```javascript
mcp.create_object({
  parent: roomPrototypeId,
  properties: {
    name: 'New Room',
    description: 'A freshly created room.'
  }
})
// Returns: { objectId: 2500 }
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
