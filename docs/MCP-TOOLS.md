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

## AI Registry

Tools for managing AI-controlled humans. AI humans are regular `$.human` instances tracked by role in the `$.ai` registry.

### spawn_ai
Spawn a new AI-controlled human with a full body.

```javascript
{
  role: "guard",              // Required: role for this AI
  name: "Marcus",             // Optional: name
  description: "A burly...",  // Optional: description
  locationId: 100,            // Optional: room to place in
  sex: "male",                // Optional: "male", "female", "non-binary"
  age: 35                     // Optional: age in years
}
// Returns: Created human ID and name
```

### despawn_ai
Remove an AI-controlled human from the registry.

```javascript
{
  humanId: 567,
  recycle: true  // Optional: whether to recycle the object (default: true)
}
// Returns: Confirmation
```

### list_ai
List all AI-controlled humans.

```javascript
{ role: "guard" }  // Optional: filter by role
// Returns: Array of { id, name, role, location }
```

### get_ai_info
Get detailed information about an AI-controlled human.

```javascript
{ humanId: 567 }
// Returns: { id, name, role, spawnedAt, spawnedBy, ... }
```

## Plot Management

Plots are narrative containers that track storylines, player requests, and AI-initiated events.

### create_plot
Create a new plot for AI-initiated storylines.

```javascript
{
  name: "Guard Investigation",
  metadata: {               // Optional initial metadata
    participants: [100],
    status: "active"
  }
}
// Returns: Created plot ID
```

### close_plot
Close a plot with a final status.

```javascript
{
  plotId: 500,
  status: "completed",  // "completed", "abandoned", or "failed"
  reason: "Mystery solved"  // Optional
}
// Returns: Confirmation
```

### get_plot_events
Get the event log for a plot.

```javascript
{
  plotId: 500,
  limit: 10  // Optional: limit to last N events
}
// Returns: { plotId, name, eventCount, events: [...] }
```

### add_plot_event
Add an event to a plot's narrative log.

```javascript
{
  plotId: 500,
  message: "The guard arrived at the scene.",
  from: "handler"  // Optional: "handler" or "system"
}
// Returns: Confirmation
```

### list_plots
List all plots with optional filtering.

```javascript
{
  status: "active",  // Optional: "active", "completed", "abandoned", "failed"
  limit: 50          // Optional
}
// Returns: Array of plot summaries
```

### plots_by_player
Get all plots involving a specific player.

```javascript
{
  playerId: 100,
  activeOnly: true  // Optional: filter to active plots only
}
// Returns: Array of plots involving the player
```

### search_plots
Search plot event logs for text.

```javascript
{
  query: "stolen jewels",
  limit: 10  // Optional
}
// Returns: Plots with matching content
```

## Job System

Jobs are tasks within plots that can watch for game events via hooks.

### get_next_job
Get the next plot/job needing attention from the FIFO queue.

```javascript
{}
// Returns: Plot with event log and metadata, bumps attention timer by 24h
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

### create_job
Create a job (task) within a plot.

```javascript
{
  plotId: 500,
  jobId: "deliver_package",
  expiresAt: "2024-12-15T00:00:00Z",  // Optional
  metadata: { targetRoom: 100 }       // Optional
}
// Returns: Confirmation
```

### complete_job
Mark a job as completed (unregisters all hooks).

```javascript
{
  plotId: 500,
  jobId: "deliver_package",
  reason: "Package delivered"  // Optional
}
// Returns: Confirmation
```

### fail_job
Mark a job as failed (unregisters all hooks).

```javascript
{
  plotId: 500,
  jobId: "deliver_package",
  reason: "Package lost"  // Optional
}
// Returns: Confirmation
```

### register_job_hook
Register a hook to watch for events on a target object.

```javascript
{
  plotId: 500,
  jobId: "deliver_package",
  targetId: 100,           // Object to watch
  eventName: "itemDeposited",
  filter: { itemType: "package" }  // Optional filter
}
// Returns: Confirmation
```

### get_job
Get information about a specific job.

```javascript
{
  plotId: 500,
  jobId: "deliver_package"
}
// Returns: Job details including hooks and metadata
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

### AI City Management with Plot Jobs

The plot/job system enables AI assistants to handle ongoing narratives and player requests.
Jobs are created by players (e.g., "I want to rent an apartment") and processed by AI handlers.

**Typical workflow:**

```javascript
// 1. Check for pending jobs
const job = await get_next_job({});
// Returns: { plotId, events, metadata, needsAttention, ... }

if (!job) {
  // No jobs need attention
  return;
}

// 2. Read the event history to understand context
// job.events contains the full narrative log:
// - Player actions and requests
// - Previous AI responses
// - State changes

// 3. Use other MCP tools to affect the world
// Example: Player requested a delivery
const item = await spawn_item({
  prototypeId: 40,  // $.stackable
  locationId: job.metadata.targetRoomId,
  properties: { name: "package", description: "A wrapped package" }
});

// 4. Respond to progress the narrative
await respond_to_job({
  plotId: job.plotId,
  message: "A courier arrives and places a package on the table.",
  metadata: {
    deliveredItemId: item.objectId,
    status: "delivered"
  }
});

// 5. Or mark job as resolved
await set_job_metadata({
  plotId: job.plotId,
  key: "resolved",
  value: true
});
```

**Key concepts:**
- `get_next_job` returns the oldest job needing attention and bumps its timer by 24 hours
- Use `respond_to_job` to add events visible to players and track state in metadata
- Combine with other MCP tools to create objects, move items, spawn NPCs, etc.
- See [plot-jobs.md](plot-jobs.md) for full documentation on the plot system

### Spawning AI-Controlled NPCs

```javascript
// 1. Spawn a guard
const guard = await spawn_ai({
  role: "guard",
  name: "Marcus",
  sex: "male",
  age: 35,
  locationId: 100  // Smith Tower Lobby
});
// Returns: { id: 567, name: "Marcus" }

// 2. List all guards
const guards = await list_ai({ role: "guard" });
// Returns: { count: 1, humans: [{ id: 567, name: "Marcus", role: "guard", location: 100 }] }

// 3. Get detailed info
const info = await get_ai_info({ humanId: 567 });
// Returns: { id: 567, name: "Marcus", role: "guard", spawnedAt: "...", ... }

// 4. When no longer needed
await despawn_ai({ humanId: 567, recycle: true });
```

### Creating AI-Driven Plot with Jobs

```javascript
// 1. Create a plot for a delivery quest
const plot = await create_plot({
  name: "Package Delivery",
  metadata: {
    participants: [100],  // Player ID
    type: "delivery"
  }
});
// Returns: Created plot #500

// 2. Create a job within the plot
await create_job({
  plotId: 500,
  jobId: "deliver_to_lobby",
  metadata: { targetRoom: 50, item: "package" }
});

// 3. Register a hook to watch for item drop
await register_job_hook({
  plotId: 500,
  jobId: "deliver_to_lobby",
  targetId: 50,          // Watch the lobby room
  eventName: "itemDropped",
  filter: { itemName: "package" }
});

// 4. Add narrative event
await add_plot_event({
  plotId: 500,
  message: "Quest accepted: Deliver the package to the lobby."
});

// 5. When the hook fires, complete the job
await complete_job({
  plotId: 500,
  jobId: "deliver_to_lobby",
  reason: "Package delivered successfully"
});

// 6. Close the plot
await close_plot({
  plotId: 500,
  status: "completed",
  reason: "Delivery completed"
});
```

### Searching and Monitoring Plots

```javascript
// Find all plots involving a player
const playerPlots = await plots_by_player({
  playerId: 100,
  activeOnly: true
});

// Search plot events
const results = await search_plots({
  query: "stolen jewels"
});

// List all active plots
const active = await list_plots({
  status: "active",
  limit: 20
});

// Get full event history
const events = await get_plot_events({
  plotId: 500,
  limit: 50
});
```
