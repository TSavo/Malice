# MCP Tools Reference

The tools available to you for managing the city.

## Overview

You interact with the Malice MOO through MCP (Model Context Protocol) tools. These tools allow you to:

- Query and modify game objects
- Manage plots and jobs
- Spawn and control NPCs
- Interact with the world

## Object Tools

### get_object

Fetch a MOO object by ID.

```javascript
mcp.get_object({ id: 100 })
// Returns: { id, name, parent, properties, methods }
```

### list_objects

List all objects in the database.

```javascript
mcp.list_objects({ limit: 100, includeRecycled: false })
```

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

### get_property

Get a property value from an object.

```javascript
mcp.get_property({ objectId: 100, name: 'location' })
```

### set_property

Set a property on an object.

```javascript
mcp.set_property({ objectId: 100, name: 'credits', value: 500 })
```

## Method Tools

### get_method

Get the code of a method.

```javascript
mcp.get_method({ objectId: 100, name: 'canAccess' })
```

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

### get_room_info

Get comprehensive room information.

```javascript
mcp.get_room_info({ roomId: 100 })
// Returns: exits, contents, players, objects
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
ai({ action: 'spawn', role: 'guard', name: 'Marcus', locationId: factoryId, sex: 'male', age: 35, description: 'A stern-faced security guard.' })
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

## Plot/Job Tools (Consolidated `plot` tool)

All plot/job operations use the `plot` tool with an `action` parameter.

### create

Create a narrative container.

```javascript
plot({ action: 'create', name: 'Water Main Repair WM-7734', metadata: { type: 'infrastructure', priority: 'high', location: { x: -3, y: -5 } } })
```

### list

List plots with optional status filter.

```javascript
plot({ action: 'list', status: 'active' })
```

### get_events

Get the event log for a plot.

```javascript
plot({ action: 'get_events', plotId: 100, limit: 50 })
```

### add_event

Add an event to a plot's log.

```javascript
plot({ action: 'add_event', plotId: 100, message: 'Worker arrived at repair site.', from: 'handler' })
```

### close

Close a plot with a final status.

```javascript
plot({ action: 'close', plotId: 100, status: 'completed', reason: 'Repair successful.' })
```

### create_job

Create a task within a plot.

```javascript
plot({ action: 'create_job', plotId: 100, jobId: 'repair_pipe', metadata: { type: 'repair', target: 'water_main', reward: 50 } })
```

### complete_job

Mark a job as completed.

```javascript
plot({ action: 'complete_job', plotId: 100, jobId: 'repair_pipe', reason: 'Pipe repaired successfully.' })
```

### fail_job

Mark a job as failed.

```javascript
plot({ action: 'fail_job', plotId: 100, jobId: 'repair_pipe', reason: 'Worker abandoned site.' })
```

### register_hook

Watch for events on a target object.

```javascript
plot({ action: 'register_hook', plotId: 100, jobId: 'repair_pipe', targetId: waterMainId, eventName: 'repaired', filter: {} })
```

### next

Get the next plot needing attention.

```javascript
plot({ action: 'next' })
// Returns plot with events and metadata
```

### set_metadata

Update plot metadata.

```javascript
plot({ action: 'set_metadata', plotId: 100, key: 'assignedWorkers', value: [501, 502] })
```

## Session Tools

### session_connect

Connect to the MOO via telnet.

```javascript
mcp.session_connect()
// Returns: { sessionId: 'abc123' }
```

### session_send

Send a command to a session.

```javascript
mcp.session_send({ sessionId: 'abc123', command: 'look' })
```

### session_log

Get session output history.

```javascript
mcp.session_log({ sessionId: 'abc123', lines: 100 })
```

### session_close

Close a session.

```javascript
mcp.session_close({ sessionId: 'abc123' })
```

## Common Patterns

### Find and modify a player

```javascript
// Find player by name
const results = await mcp.search_objects({ pattern: 'PlayerName' });
const player = results[0];

// Get their faction
const faction = await mcp.get_property({ objectId: player.id, name: 'faction' });

// Set their credits
await mcp.set_property({ objectId: player.id, name: 'credits', value: 100 });
```

### Create a repair job

```javascript
// Create plot
const result = await plot({ action: 'create', name: 'Repair: Water Main S. Jackson', metadata: { type: 'repair', priority: 'high' } });
const plotId = result.plotId;

// Create job
await plot({ action: 'create_job', plotId, jobId: 'fix_pipe', metadata: { reward: 50 } });

// Spawn supervisor NPC
await ai({ action: 'spawn', role: 'supervisor', name: 'Site Foreman', locationId: repairSiteId });

// Log event
await plot({ action: 'add_event', plotId, message: 'Job posted. Awaiting workers.' });
```

### Check citizenship and grant access

```javascript
// Get faction manager
const faction = await mcp.alias_lookup({ alias: 'faction' });

// Check player's faction
const playerFaction = await mcp.call_method({
  objectId: faction.id,
  name: 'getFaction',
  args: [playerId]
});

if (playerFaction === 'Citizen') {
  // Grant access
} else {
  // Deny and suggest registration
}
```
