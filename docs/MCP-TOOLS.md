# Malice MCP Tools Reference

The Malice MCP server exposes tools for AI assistants and automation to interact with the MOO world.

**Endpoint:** `http://localhost:3001/mcp`

**Related Documentation:**
- [BUILDERS-GUIDE.md](BUILDERS-GUIDE.md) - Creating prototypes and systems in code
- [moo-programming.md](moo-programming.md) - MOO programming reference
- [plot-jobs.md](plot-jobs.md) - Plot/job system for AI city management

## Object Management

### get_object
Fetch a MOO object by its ID.

```javascript
{ id: 123 }
// Returns: { _id, parent, properties, methods, created, modified }
```

### list_objects
List all MOO objects in the database.

```javascript
{ limit: 100, includeRecycled: false }
// Returns: Array of object summaries
```

### create_object
Create a new MOO object with a specified parent.

```javascript
{
  parent: 1,  // Parent object ID
  properties: { name: "My Object", description: "..." }
}
// Returns: Created object ID and info
```

### clone_object
Create a deep copy of an object with all its properties.

```javascript
{ objectId: 123, locationId: 456 }  // locationId optional
// Returns: New object ID
```

### recycle_object
Soft-delete a MOO object (marks as deleted, adds to recycle bin).

```javascript
{ objectId: 123 }
// Returns: Confirmation message
```

### move_object
Move an object to a new location.

```javascript
{ objectId: 123, destinationId: 456 }
// Returns: Confirmation message
```

## Properties & Methods

### get_property
Get a specific property value from an object (walks inheritance chain).

```javascript
{ objectId: 123, name: "description" }
// Returns: Property value
```

### set_property
Set a property value on an object.

```javascript
{ objectId: 123, name: "health", value: 100 }
// For object references: value: "#456"
// Returns: Confirmation
```

### get_method
Get the TypeScript code for a method on an object.

```javascript
{ objectId: 123, name: "attack" }
// Returns: { name, code, help?, callable? }
```

### set_method
Create or update a TypeScript method on an object.

```javascript
{
  objectId: 123,
  name: "greet",
  code: "return 'Hello, ' + args[0] + '!';",
  help: "Greet someone by name",
  callable: true
}
// Returns: Confirmation
```

### call_method
Execute a method on an object and return the result.

```javascript
{ objectId: 123, name: "greet", args: ["Alice"] }
// Returns: Method return value
```

## Search & Discovery

### search_objects
Search MOO objects by name pattern (substring or regex).

```javascript
{
  pattern: "Tower",      // Substring match
  regex: false,          // Set true for regex
  limit: 50
}
// Returns: Array of matching objects
```

### find_by_property
Find objects that have a specific property value.

```javascript
{ name: "isWizard", value: true }
// Or: { name: "isWizard" }  // Find all with this property
// Returns: Array of matching objects
```

### find_children
Find all objects that inherit from a given parent.

```javascript
{ parentId: 10, recursive: false, limit: 100 }
// Returns: Array of child objects
```

### find_in_location
Find all objects in a room or container.

```javascript
{ locationId: 456, recursive: false }
// Returns: Array of objects in location
```

### get_inheritance_chain
Get the full parent inheritance chain for an object.

```javascript
{ id: 123 }
// Returns: Array of parent objects up to Root
```

## Aliases

### alias_lookup
Look up an object by its alias (e.g., "lock", "recycler", "room").

```javascript
{ alias: "recycler" }  // Without $ prefix
// Returns: Object ID and basic info
```

### list_aliases
List all registered object aliases.

```javascript
{}
// Returns: { aliasName: objectId, ... }
```

## Rooms & World Building

### list_rooms
List all rooms in the world with coordinates and exit counts.

```javascript
{}
// Returns: Array of rooms with { id, name, x, y, z, exitCount }
```

### dig
Create a new room with optional bidirectional exits.

```javascript
{
  name: "Secret Chamber",
  description: "A hidden room...",
  fromRoomId: 100,        // Optional: connect from this room
  exitDirection: "north", // Direction of exit
  returnDirection: "south", // Return exit
  x: 0, y: 0, z: 0        // Coordinates
}
// Returns: New room ID
```

### link_rooms
Create an exit from one room to another.

```javascript
{
  fromRoomId: 100,
  toRoomId: 200,
  exitDirection: "enter cave",
  returnDirection: "out"  // Optional
}
// Returns: Exit IDs
```

### unlink
Remove an exit from a room.

```javascript
{ roomId: 100, exitId: 150 }
// Returns: Confirmation
```

### get_exits
List all exits from a room with destinations and doors.

```javascript
{ roomId: 100 }
// Returns: Array of exits with door info
```

### get_room_info
Get comprehensive room information: exits, contents, players, objects.

```javascript
{ roomId: 100 }
// Returns: { room, exits, contents, players, objects }
```

## Items & Spawning

### spawn_item
Create an instance of a prototype and place it at a location.

```javascript
{
  prototypeId: 49,  // e.g., $.lock
  locationId: 100,
  properties: { name: "rusty lock" }  // Optional overrides
}
// Returns: New object ID
```

### set_exit_door
Create and attach a door to an exit.

```javascript
{
  exitId: 150,
  doorId: null,           // Or existing door ID
  doorName: "oak door",
  doorDescription: "A sturdy oak door",
  open: false
}
// Returns: Door ID
```

### describe_object
Get the runtime description of an object as a player would see it.

```javascript
{ objectId: 123 }
// Returns: Description string from describe() method
```

## Players

### list_players
List all player characters with location and online status.

```javascript
{}
// Returns: Array of players
```

## Telnet Sessions

Interactive telnet sessions for testing player experience.

### session_connect
Connect to the MOO via telnet.

```javascript
{}
// Returns: { sessionId, welcome message }
```

### session_send
Send a command to an active session.

```javascript
{ sessionId: "abc123", command: "look" }
// Returns: Response output
```

### session_log
Get the session log (last N lines).

```javascript
{ sessionId: "abc123", lines: 100 }
// Returns: Log output
```

### session_list
List all active telnet sessions.

```javascript
{}
// Returns: Array of session IDs
```

### session_close
Close a telnet session.

```javascript
{ sessionId: "abc123" }
// Returns: Confirmation
```

## Plot/Job System

For AI city management and narrative handling.

### get_next_job
Get the next plot/job needing attention from the FIFO queue.

```javascript
{}
// Returns: Plot with event log and metadata
```

### respond_to_job
Add an event to a plot as the city AI handler.

```javascript
{
  plotId: 500,
  message: "Guard dispatched to investigate",
  metadata: { guardId: 123, status: "investigating" }
}
// Returns: Confirmation
```

### list_active_jobs
List all active plots/jobs with metadata.

```javascript
{}
// Returns: Array of active jobs
```

### set_job_metadata
Set or update metadata on a plot/job.

```javascript
{ plotId: 500, key: "status", value: "resolved" }
// Returns: Confirmation
```

## Examples

### Create a locked door between rooms

```javascript
// 1. Create the exit
const exit = await link_rooms({
  fromRoomId: 100,
  toRoomId: 200,
  exitDirection: "north",
  returnDirection: "south"
});

// 2. Create and attach a door
const door = await set_exit_door({
  exitId: exit.exitId,
  doorName: "iron door",
  doorDescription: "A heavy iron door with a complex lock.",
  open: false
});

// 3. Create a lock instance
const lock = await spawn_item({
  prototypeId: 49,  // $.lock
  locationId: 100,
  properties: { name: "iron lock" }
});

// 4. Attach lock to door
await set_property({
  objectId: door.doorId,
  name: "locks",
  value: ["#" + lock.objectId]
});
```

### Find all items in a room

```javascript
const info = await get_room_info({ roomId: 100 });
// info.objects contains all non-player objects
// info.players contains all players
// info.exits contains all exits with door info
```

### Search for a prototype by name

```javascript
const results = await search_objects({ pattern: "Lock", limit: 10 });
// Find the base Lock prototype
const lockProto = results.find(r => r.name === "Lock");
```
