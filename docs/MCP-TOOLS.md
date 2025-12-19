# Malice MCP Tools & Resources Reference

The Malice MCP server exposes tools and resources for AI assistants and automation to interact with the MOO world.

**Endpoint:** `http://localhost:3001/mcp`

**Related Documentation:**
- [BUILDERS-GUIDE.md](BUILDERS-GUIDE.md) - Creating prototypes and systems in code
- [moo-programming.md](moo-programming.md) - MOO programming reference
- [plot-jobs.md](plot-jobs.md) - Plot/job system for AI city management

---

## MCP Resources (Read-Only)

Resources provide read-only access to MOO data via URI patterns. Use these for inspection and queries.

### Object Resources

| Resource | Description |
|----------|-------------|
| `moo://objects/{id}` | Get object details (properties, methods, parent, timestamps) |
| `moo://objects/{id}/prop/{name}` | Get a specific property value |
| `moo://objects/{id}/method/{name}` | Get method code (walks inheritance chain, shows where defined) |
| `moo://objects/list/{page}` | Paginated object list (100 per page) |

**Examples:**
```
moo://objects/10              # Human prototype
moo://objects/10/prop/name    # → "Human"
moo://objects/3028/method/say # → { definedOn: { id: 10, name: "Human" }, inherited: true, code: "..." }
moo://objects/list/1          # → { page: 1, totalPages: 31, total: 3079, objects: [...] }
```

### Room Resources

| Resource | Description |
|----------|-------------|
| `moo://rooms/{id}` | Live room state (description, exits, players, contents) |

**Example:**
```
moo://rooms/377  # → { name: "Occidental Park", exits: [...], players: [...], contents: [...] }
```

### Player Resources

| Resource | Description |
|----------|-------------|
| `moo://players` | List all player characters |
| `moo://players/{id}` | Individual player details |

### AI NPC Resources

| Resource | Description |
|----------|-------------|
| `moo://ai` | List all AI-controlled NPCs |
| `moo://ai/{id}` | Full NPC profile (personality, history, memories) |
| `moo://ai/{id}/memories` | NPC memories only |
| `moo://ai/{id}/notes` | NPC notes only |
| `moo://npc-sessions` | List NPCs with conversation sessions |
| `moo://npc-sessions/{id}` | NPC conversation history (Claude agent transcript) |

### Plot Resources

| Resource | Description |
|----------|-------------|
| `moo://plots` | List all plots |
| `moo://plots/{id}` | Individual plot details |
| `moo://plots/{id}/events` | Plot event log |

### Documentation Resources

| Resource | Description |
|----------|-------------|
| `moo://docs` | List all technical documentation files |
| `moo://docs/{name}` | Get a specific doc (mcp-tools, plot-jobs, builders-guide, moo-programming, npc-agent, timeline, smith-tower-builders-guide) |
| `moo://city-ai` | List all city AI documentation files |
| `moo://city-ai/{name}` | Get a specific city AI doc (context, factions, jobs, locations, map, npcs, objectives, plots, readme, rules, tools) |

### Other Resources

| Resource | Description |
|----------|-------------|
| `moo://aliases` | List all registered object aliases |
| `moo://events/recent` | Recent game events (last 100) |
| `moo://schema` | Database schema |

---

## MCP Tools (Read-Write)

Tools perform operations with side effects. Use these to modify the world.

### Object Management

#### create_object
Create a new MOO object with a specified parent.

```javascript
{
  parent: "#1",  // Parent object reference
  properties: { name: "My Object", description: "..." }
}
// Returns: Created object ID and info
```

#### clone_object
Create a deep copy of an object with all its properties.

```javascript
{ objectId: 123, locationId: 456 }  // locationId optional
// Returns: New object ID
```

#### recycle_object
Soft-delete a MOO object (marks as deleted, adds to recycle bin).

```javascript
{ objectId: 123 }
// Returns: Confirmation message
```

#### move_object
Move an object to a new location.

```javascript
{ objectId: 123, destinationId: 456 }
// Returns: Confirmation message
```

### Properties & Methods

#### set_property
Set a property value on an object.

```javascript
{ objectId: 123, name: "health", value: 100 }
// For object references: value: "#456"
// Returns: Confirmation
```

#### set_method
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

#### call_method
Execute a method on an object and return the result.

```javascript
{ objectId: 123, name: "greet", args: ["Alice"] }
// Returns: Method return value
```

### Search & Discovery

#### search_objects
Search MOO objects by name pattern (substring or regex).

```javascript
{
  pattern: "Tower",      // Substring match
  regex: false,          // Set true for regex
  limit: 50
}
// Returns: Array of matching objects
```

#### find_by_property
Find objects that have a specific property value.

```javascript
{ name: "isWizard", value: true }
// Or: { name: "isWizard" }  // Find all with this property
// Returns: Array of matching objects
```

#### find_children
Find all objects that inherit from a given parent.

```javascript
{ parentId: 10, recursive: false, limit: 100 }
// Returns: Array of child objects
```

#### find_in_location
Find all objects in a room or container.

```javascript
{ locationId: 456, recursive: false }
// Returns: Array of objects in location
```

#### get_inheritance_chain
Get the full parent inheritance chain for an object.

```javascript
{ id: 123 }
// Returns: Array of parent objects up to Root
```

### Aliases

#### alias_lookup
Look up an object by its alias (e.g., "lock", "recycler", "room").

```javascript
{ alias: "recycler" }  // Without $ prefix
// Returns: Object ID and basic info
```

#### list_aliases
List all registered object aliases.

```javascript
{}
// Returns: { aliasName: objectId, ... }
```

### Rooms & World Building

#### list_rooms
List all rooms in the world with coordinates and exit counts.

```javascript
{}
// Returns: Array of rooms with { id, name, x, y, z, exitCount }
```

#### dig
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

#### link_rooms
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

#### unlink
Remove an exit from a room.

```javascript
{ roomId: 100, exitId: 150 }
// Returns: Confirmation
```

#### get_exits
List all exits from a room with destinations and doors.

```javascript
{ roomId: 100 }
// Returns: Array of exits with door info
```

### Items & Spawning

#### spawn_item
Create an instance of a prototype and place it at a location.

```javascript
{
  prototypeId: 49,  // e.g., $.lock
  locationId: 100,
  properties: { name: "rusty lock" }  // Optional overrides
}
// Returns: New object ID
```

#### set_exit_door
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

#### describe_object
Get the runtime description of an object as a player would see it.

```javascript
{ objectId: 123 }
// Returns: Description string from describe() method
```

### Players

#### list_players
List all player characters with location and online status.

```javascript
{}
// Returns: Array of players
```

## Telnet Sessions

Interactive telnet sessions for testing player experience.

#### session_connect
Connect to the MOO via telnet.

```javascript
{}
// Returns: { sessionId, welcome message }
```

#### session_send
Send a command to an active session.

```javascript
{ sessionId: "abc123", command: "look" }
// Returns: Response output
```

#### session_log
Get the session log (last N lines).

```javascript
{ sessionId: "abc123", lines: 100 }
// Returns: Log output
```

#### session_list
List all active telnet sessions.

```javascript
{}
// Returns: Array of session IDs
```

#### session_close
Close a telnet session.

```javascript
{ sessionId: "abc123" }
// Returns: Confirmation
```

## AI Registry (Consolidated Tool)

The `ai` tool is a consolidated interface for managing AI-controlled humans. AI humans are regular `$.human` instances tracked by role in the `$.ai` registry.

### Actions

- `spawn` - Create a new AI-controlled human (role, name?, description?, locationId?, sex?, age?, clothed?)
- `despawn` - Remove an AI human (humanId, recycle?)
- `list` - List all AI humans (role?)
- `info` - Get detailed AI human info (humanId)
- `do` - Execute a command as AI human (humanId, command)
- `look` - Get what AI human sees (humanId)
- `tailor` - Dress an NPC with AI tailor (humanId, context?)
- `profile` - Get full NPC profile (humanId)
- `setPersonality` - Set personality traits (humanId, personality)
- `setHistory` - Set backstory/history (humanId, history)
- `remember` - Store a memory (humanId, text, importance?, tags?)
- `recall` - Get memories (humanId, importance?, tag?, limit?)
- `forget` - Remove a memory (humanId, index)
- `memories` - Get formatted memory summary (humanId)

### Examples

```javascript
// Spawn a guard
ai({ action: "spawn", role: "guard", name: "Marcus", sex: "male", age: 35, locationId: 100 })
// Returns: { id: 567, name: "Marcus", role: "guard" }

// Spawn with auto-dressing
ai({ action: "spawn", role: "guard", name: "Marcus", locationId: 100, clothed: true })
// Returns: { id: 567, name: "Marcus", role: "guard", clothed: true }

// Dress an existing NPC
ai({ action: "tailor", humanId: 567 })
ai({ action: "tailor", humanId: 567, context: "shabby, recently demoted" })

// See what the guard sees
ai({ action: "look", humanId: 567 })
// Returns: { location: "Lobby", exits: ["north", "south"], people: [...], items: [...] }

// Make the guard do things
ai({ action: "do", humanId: 567, command: "say Halt! Who goes there?" })
ai({ action: "do", humanId: 567, command: "north" })

// Get profile (also available as resource moo://ai/567)
ai({ action: "profile", humanId: 567 })

// Store a memory
ai({ action: "remember", humanId: 567, text: "Saw suspicious person near vault", importance: "important" })

// List all guards
ai({ action: "list", role: "guard" })

// Remove the AI
ai({ action: "despawn", humanId: 567, recycle: true })
```

## Notes (Consolidated Tool)

The `notes` tool provides a consolidated interface for attaching notes to MOO objects. Notes support text content, authors, and tags for organization.

### Actions

- `get` - Get all notes on an object (objectId)
- `add` - Add a note to an object (objectId, text, author?, tags?)
- `append` - Append to existing note by tag (objectId, tag, text, author?)
- `delete` - Delete a note by index (objectId, index)
- `search` - Search notes across objects (query?, tag?, author?, limit?)
- `list_objects` - List all objects that have notes

### Examples

```javascript
// Add a note to an object
notes({ action: "add", objectId: 123, text: "This needs review", author: "Claude", tags: ["review"] })

// Get all notes on an object
notes({ action: "get", objectId: 123 })

// Search notes by tag
notes({ action: "search", tag: "review" })

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

### Examples

```javascript
// Find all objects with "Tower" in name
world({ action: "query", q: ".name contains 'Tower'" })

// Complex query with AND/OR
world({ action: "query", q: "(.name contains 'sword' or .name contains 'dagger') and .location exists" })

// Paginated results
world({ action: "query", q: ".parent == 7", limit: 20, offset: 40 })
```

## Plot System (Consolidated Tool)

The `plot` tool is a consolidated interface for managing plots, jobs, and phases.

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

---

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

### Find all items in a room (using resource)

```javascript
// Use the room resource
const roomInfo = await readResource("moo://rooms/100");
// roomInfo.contents contains all non-player objects
// roomInfo.players contains all players
// roomInfo.exits contains all exits
```

### Search for a prototype by name

```javascript
const results = await search_objects({ pattern: "Lock", limit: 10 });
const lockProto = results.find(r => r.name === "Lock");
```

### Spawning and Controlling AI NPCs

```javascript
// 1. Spawn a guard
const guard = await ai({ action: "spawn", role: "guard", name: "Marcus", locationId: 100 });

// 2. See what the guard sees
const view = await ai({ action: "look", humanId: guard.id });

// 3. Make the guard do things
await ai({ action: "do", humanId: guard.id, command: "say Halt!" });

// 4. Check the guard's profile (via resource)
const profile = await readResource(`moo://ai/${guard.id}`);

// 5. When no longer needed
await ai({ action: "despawn", humanId: guard.id, recycle: true });
```

### AI City Management with Plot Jobs

```javascript
// 1. Check for pending plots
const result = await plot({ action: "next" });

if (result.plot) {
  // 2. Read event history
  const events = await plot({ action: "get_events", plotId: result.plot.id });

  // 3. Use other MCP tools to affect the world
  const item = await spawn_item({
    prototypeId: 40,
    locationId: result.plot.metadata.targetRoomId,
    properties: { name: "package" }
  });

  // 4. Add narrative event
  await plot({
    action: "add_event",
    plotId: result.plot.id,
    message: "A courier arrives with a package."
  });
}
```
