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

## AI Registry (Consolidated Tool)

The `ai` tool is a consolidated interface for managing AI-controlled humans. AI humans are regular `$.human` instances tracked by role in the `$.ai` registry.

### Actions

- `spawn` - Create a new AI-controlled human (role, name?, description?, locationId?, sex?, age?)
- `despawn` - Remove an AI human (humanId, recycle?)
- `list` - List all AI humans (role?)
- `info` - Get detailed AI human info (humanId)
- `do` - Execute a command as AI human (humanId, command)
- `look` - Get what AI human sees (humanId)

### Examples

```javascript
// Spawn a guard
ai({ action: "spawn", role: "guard", name: "Marcus", sex: "male", age: 35, locationId: 100 })
// Returns: { id: 567, name: "Marcus", role: "guard" }

// See what the guard sees
ai({ action: "look", humanId: 567 })
// Returns: { location: "Lobby", exits: ["north", "south"], people: [...], items: [...] }

// Make the guard do things
ai({ action: "do", humanId: 567, command: "say Halt! Who goes there?" })
ai({ action: "do", humanId: 567, command: "north" })
ai({ action: "do", humanId: 567, command: "get sword" })

// List all guards
ai({ action: "list", role: "guard" })
// Returns: { count: 1, humans: [{ id: 567, name: "Marcus", role: "guard", location: 100 }] }

// Get detailed info
ai({ action: "info", humanId: 567 })
// Returns: { id: 567, name: "Marcus", role: "guard", spawnedAt: "...", ... }

// Remove the AI
ai({ action: "despawn", humanId: 567, recycle: true })
```

## Notes (Consolidated Tool)

The `notes` tool provides a consolidated interface for attaching notes to MOO objects. Notes support text content, authors, and tags for organization.

### Actions

- `get` - Get all notes on an object (objectId)
- `add` - Add a note to an object (objectId, text, author?, tags?)
- `delete` - Delete a note by index (objectId, index)
- `search` - Search notes across objects (query?, tag?, author?, limit?)
- `list_objects` - List all objects that have notes

### Examples

```javascript
// Add a note to an object
notes({ action: "add", objectId: 123, text: "This needs review", author: "Claude", tags: ["review", "important"] })
// Returns: { added: true, index: 0 }

// Get all notes on an object
notes({ action: "get", objectId: 123 })
// Returns: { notes: [{ text: "This needs review", author: "Claude", tags: [...], createdAt: "..." }] }

// Search notes by tag
notes({ action: "search", tag: "review" })
// Returns: { results: [{ objectId: 123, noteIndex: 0, note: {...} }] }

// Search notes by text
notes({ action: "search", query: "needs review", limit: 10 })

// List objects with notes
notes({ action: "list_objects" })
// Returns: { objects: [{ id: 123, name: "...", noteCount: 1 }] }

// Delete a note
notes({ action: "delete", objectId: 123, index: 0 })
```

## World Query (Consolidated Tool)

The `world` tool provides SQL-like querying of MOO objects, translated to MongoDB queries for efficient execution.

### Actions

- `query` - Search objects with DSL query (q, limit?, offset?)
- `validate` - Validate a query without executing (q)

### Query Syntax

```
.property == value           # Equality
.property != value           # Inequality
.property > 5                # Numeric comparisons: >, <, >=, <=
.property contains 'text'    # Substring match (case-insensitive)
.property like 'foo*'        # Glob pattern (* = any, ? = single char)
.property matches 'regex'    # Regex match
.property exists             # Property is defined
not .property exists         # Negation
X and Y                      # Logical AND
X or Y                       # Logical OR
(X or Y) and Z               # Grouping
```

### Special Properties

- `.id`, `.parent` - Direct document fields
- `.name`, `.description`, etc. - Mapped to `properties.X`

### Examples

```javascript
// Find all objects with "Tower" in name
world({ action: "query", q: ".name contains 'Tower'" })

// Find children of a specific parent
world({ action: "query", q: ".parent == 10" })

// Complex query with AND/OR
world({ action: "query", q: "(.name contains 'sword' or .name contains 'dagger') and .location exists" })

// Validate a query before running
world({ action: "validate", q: ".parent == 10 and .name like 'Lock*'" })
// Returns: { valid: true }

// Paginated results
world({ action: "query", q: ".parent == 7", limit: 20, offset: 40 })
```

### Query Response

```javascript
{
  query: ".name contains 'Tower'",
  mongoQuery: { "properties.name": { "$regex": "Tower", "$options": "i" } },
  count: 15,
  offset: 0,
  results: [
    { id: 1411, parent: 7, name: "Smith Tower - Ground Floor - Reception" },
    // ...
  ]
}
```

## Plot System (Consolidated Tool)

The `plot` tool is a consolidated interface for managing plots, jobs, and phases. All plot operations use an `action` parameter.

### Structure

```
Plot
  ├── name, description, metadata
  ├── events[]                    # Narrative log
  ├── phases[]                    # Narrative stages with AI prompts
  │     └── { id, name, description, prompt, metadata }
  └── jobs{}                      # Player progression tracking
        └── { status, currentPhase, phaseHistory[], hooks[], metadata }
```

### Actions

**Plot Management:**
- `create` - Create a new plot (name, metadata?)
- `get` - Get plot details (plotId)
- `list` - List plots (status?: active|completed|abandoned|failed)
- `search` - Search plot events (query, limit?)
- `close` - Close a plot (plotId, status, reason?)
- `set_metadata` - Set plot metadata (plotId, key, value)
- `add_event` - Add event to log (plotId, message, from?)
- `get_events` - Get event log (plotId, limit?)

**Phase Management:**
- `set_phases` - Define phases for a plot (plotId, phases[])
- `get_phases` - Get phase definitions (plotId)

**Job Management:**
- `create_job` - Create job in plot (plotId, jobId, metadata?, expiresAt?)
- `get_job` - Get job details (plotId, jobId)
- `complete_job` - Complete a job (plotId, jobId, reason?)
- `fail_job` - Fail a job (plotId, jobId, reason?)

**Job Phase Tracking:**
- `get_job_phase` - Get current phase for job (plotId, jobId)
- `advance_phase` - Advance job to next phase (plotId, jobId)
- `set_phase` - Set job to specific phase (plotId, jobId, phaseId)

**Hooks:**
- `register_hook` - Register job hook (plotId, jobId, targetId, eventName, filter?)

**Queue:**
- `next` - Get next plot needing attention (bumps timer 24h)
- `active` - List all active plots with metadata

### Examples

```javascript
// Create a plot
plot({ action: "create", name: "Package Delivery", metadata: { type: "delivery" } })
// Returns: { created: true, plotId: 500, name: "Package Delivery" }

// Set phases (simple structure - just prompts for AI guidance)
plot({
  action: "set_phases",
  plotId: 500,
  phases: [
    { id: "accept", name: "Accept Job", description: "Player accepts", prompt: "Guide player to accept the delivery job" },
    { id: "pickup", name: "Pick Up", description: "Get the package", prompt: "Player needs to pick up the package from the warehouse" },
    { id: "deliver", name: "Deliver", description: "Complete delivery", prompt: "Help player deliver to the destination" }
  ]
})

// Create a job (auto-starts on first phase)
plot({ action: "create_job", plotId: 500, jobId: "player-42", metadata: { playerId: 42 } })

// Get current phase info
plot({ action: "get_job_phase", plotId: 500, jobId: "player-42" })
// Returns: { phaseId: "accept", phase: {...}, startedAt: "...", history: [] }

// Advance to next phase
plot({ action: "advance_phase", plotId: 500, jobId: "player-42" })
// Returns: { advanced: true, newPhase: "pickup" }

// Add narrative event
plot({ action: "add_event", plotId: 500, message: "Player picked up the package" })

// Register a hook
plot({
  action: "register_hook",
  plotId: 500,
  jobId: "player-42",
  targetId: 100,
  eventName: "itemDropped",
  filter: { itemName: "package" }
})

// Complete the job
plot({ action: "complete_job", plotId: 500, jobId: "player-42", reason: "Delivered successfully" })

// Close the plot
plot({ action: "close", plotId: 500, status: "completed", reason: "Quest finished" })

// Get next plot needing attention
plot({ action: "next" })
// Returns oldest plot needing attention, bumps timer by 24h

// List active plots
plot({ action: "active" })
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
// 1. Check for pending plots
const result = await plot({ action: "next" });
// Returns oldest plot needing attention, bumps timer by 24h

if (!result.plot) {
  // No plots need attention
  return;
}

// 2. Read the event history to understand context
const events = await plot({ action: "get_events", plotId: result.plot.id, limit: 50 });
// events contains the full narrative log:
// - Player actions and requests
// - Previous AI responses
// - State changes

// 3. Use other MCP tools to affect the world
// Example: Player requested a delivery
const item = await spawn_item({
  prototypeId: 40,  // $.stackable
  locationId: result.plot.metadata.targetRoomId,
  properties: { name: "package", description: "A wrapped package" }
});

// 4. Add narrative event
await plot({
  action: "add_event",
  plotId: result.plot.id,
  message: "A courier arrives and places a package on the table."
});

// 5. Update metadata
await plot({
  action: "set_metadata",
  plotId: result.plot.id,
  key: "deliveredItemId",
  value: item.objectId
});
```

**Key concepts:**
- `plot({ action: "next" })` returns the oldest plot needing attention and bumps its timer by 24 hours
- Use `plot({ action: "add_event" })` to add events visible to players
- Use `plot({ action: "set_metadata" })` to track state
- Combine with other MCP tools to create objects, move items, spawn NPCs, etc.
- See [plot-jobs.md](plot-jobs.md) for full documentation on the plot system

### Spawning and Controlling AI NPCs

```javascript
// 1. Spawn a guard
const guard = await ai({ action: "spawn", role: "guard", name: "Marcus", sex: "male", age: 35, locationId: 100 });
// Returns: { id: 567, name: "Marcus" }

// 2. See what the guard sees
const view = await ai({ action: "look", humanId: 567 });
// Returns: { location: "Lobby", exits: ["north", "south"], people: [...], items: [...] }

// 3. Make the guard do things
await ai({ action: "do", humanId: 567, command: "say Halt! Who goes there?" });
await ai({ action: "do", humanId: 567, command: "north" });
await ai({ action: "do", humanId: 567, command: "get sword" });

// 4. List all guards
const guards = await ai({ action: "list", role: "guard" });
// Returns: { count: 1, humans: [{ id: 567, name: "Marcus", role: "guard", location: 100 }] }

// 5. Get detailed info
const info = await ai({ action: "info", humanId: 567 });
// Returns: { id: 567, name: "Marcus", role: "guard", spawnedAt: "...", ... }

// 6. When no longer needed
await ai({ action: "despawn", humanId: 567, recycle: true });
```

### Creating AI-Driven Plot with Jobs

```javascript
// 1. Create a plot for a delivery quest
const result = await plot({ action: "create", name: "Package Delivery", metadata: { participants: [100], type: "delivery" } });
// Returns: { created: true, plotId: 500, name: "Package Delivery" }

// 2. Create a job within the plot
await plot({ action: "create_job", plotId: 500, jobId: "deliver_to_lobby", metadata: { targetRoom: 50, item: "package" } });

// 3. Register a hook to watch for item drop
await plot({ action: "register_hook", plotId: 500, jobId: "deliver_to_lobby", targetId: 50, eventName: "itemDropped", filter: { itemName: "package" } });

// 4. Add narrative event
await plot({ action: "add_event", plotId: 500, message: "Quest accepted: Deliver the package to the lobby." });

// 5. When the hook fires, complete the job
await plot({ action: "complete_job", plotId: 500, jobId: "deliver_to_lobby", reason: "Package delivered successfully" });

// 6. Close the plot
await plot({ action: "close", plotId: 500, status: "completed", reason: "Delivery completed" });
```

### Searching and Monitoring Plots

```javascript
// Search plot events
const results = await plot({ action: "search", query: "stolen jewels" });

// List all active plots
const active = await plot({ action: "list", status: "active" });

// Get full event history
const events = await plot({ action: "get_events", plotId: 500, limit: 50 });

// Get next plot needing attention
const next = await plot({ action: "next" });

// List all active plots with metadata
const allActive = await plot({ action: "active" });
```
