# Malice MCP Tools & Resources Reference

The Malice MCP server provides a **code-first interface** for AI assistants and automation to interact with the MOO world.

**Endpoint:** `http://localhost:3010/mcp`

**Related Documentation:**
- [BUILDERS-GUIDE.md](BUILDERS-GUIDE.md) - Creating prototypes and systems in code
- [moo-programming.md](moo-programming.md) - MOO programming reference
- [plot-jobs.md](plot-jobs.md) - Plot/job system for AI city management

---

## Direct MOO Code

**IMPORTANT**: Write native MOO code using `execute_moo_code`. Use MOO's built-in capabilities directly - no wrappers needed:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Use $recycler to create objects
    const room = await $recycler.create($room, {
      name: "Hall",
      x: 0, y: 0, z: 0
    });

    // Create and move item
    const torch = await $recycler.create($item, {name: "torch"});
    await torch.moveTo(room, player);

    return {roomId: room.id, torchId: torch.id};
  `
})
```

### Benefits

- **No wrapper layer** - just pure MOO code
- **Composable** - loops, conditionals, multi-step operations
- **Full MOO context** - $, $load(), $recycler, all $aliases
- **Player authentication** - HTTP Basic Auth provides `player` variable
- **Single execution** - no round-trips between steps

### Authentication

```bash
# Authenticated (player variable available in code)
curl -u username:password http://localhost:3010/mcp

# Unauthenticated (admin/builder access)
curl http://localhost:3010/mcp
```

### Available in execute_moo_code Context

```typescript
$                      // ObjectManager ($.db, $.addAlias, $.ai, $.plot, etc.)
$load(id)              // Load object by ID
$recycler              // Create/destroy objects
$room, $player, etc.   // All registered aliases
player                 // Your player object (if authenticated)
// Plus all JavaScript: loops, conditionals, async/await, etc.
```

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
| `moo://ai/worldLog` | World log - AI activity and events across the game |
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

**Note**: Individual MCP tools are available but **NOT RECOMMENDED**. They're just wrappers around native MOO code. **Prefer writing direct MOO code** using `execute_moo_code` instead. The tools below are listed for reference only - use native MOO equivalents when possible.



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

#### get_property
Get a property value from an object.

```javascript
{ objectId: "#123", name: "health" }
// Returns: { property: "health", value: 100 }
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

#### find_in_location
Find all objects in a room or container.

```javascript
{ locationId: 456, recursive: false }
// Returns: Array of objects in location
```

#### get_inheritance
Get inheritance info: ancestor chain (what it inherits from) and optionally descendants.

```javascript
{ objectId: "#123", descendants: false, recursive: false, limit: 100 }
// Returns: { objectId, name, parent, ancestors: [...], descendants?: [...] }
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

#### add_alias
Register a global alias for an object. Makes it accessible as `$name`.

```javascript
{ alias: "securityCamera", objectId: "#1234" }
// Returns: "Registered $securityCamera -> #1234"
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
  prototypeId: 49,  // e.g., $lock
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

## AI Registry ($ai)

Manage AI-controlled NPCs using the `$ai` object. AI humans are regular `$human` instances tracked by role.

### Spawning & Management

```javascript
// Spawn a guard
const npc = await $ai.spawn({
  role: "guard",
  name: "Marcus",
  sex: "male",
  age: 35,
  location: await $load(100)
});
// Returns: RuntimeObject (Human)

// Spawn with auto-dressing
const dressed = await $ai.spawn({
  role: "guard",
  name: "Marcus",
  location: await $load(100),
  clothed: true
});

// Dress an existing NPC
await $tailor.dress(npc, "shabby, recently demoted");

// See what the guard sees
const view = await $ai.look(npc.id);

// Make the guard do things
await $ai.do(npc.id, "say Halt! Who goes there?");
await $ai.do(npc.id, "north");

// Get info
const info = await $ai.getInfo(npc.id);

// List all guards
const guards = await $ai.getByRole("guard");

// Remove the AI
await $ai.despawn(npc.id);  // Recycles by default
await $ai.despawn(npc.id, false);  // Keep object
```

### Profile & Memory

```javascript
// Get full profile (also available as resource moo://ai/{id})
const profile = await $ai.getProfile(npc.id);

// Set personality/history
await $ai.setPersonality(npc.id, "Gruff but fair.");
await $ai.setHistory(npc.id, {
  backstory: "Former soldier",
  events: ["Survived the Burning"],
  secrets: ["Has PTSD"]
});

// Store a memory
await $ai.remember(npc.id, "Saw suspicious person near vault", "important", ["security"]);

// Retrieve memories
const memories = await $ai.recall(npc.id);
const critical = await $ai.recall(npc.id, { importance: "critical" });

// Remove memory
await $ai.forget(npc.id, 0);  // By index
```

### Response Expectations

```javascript
// Set up response timeout (NPC expects player to respond within 5 minutes)
await $ai.expectResponseFrom(npc.id, playerId, 300000, "Player walked away");

// Cancel expectation
await $ai.cancelExpectation(npc.id, playerId);
```

### Pathfinding

```javascript
// Find path between rooms
const path = await $ai.path(100, 200);
// Returns: { success: true, path: [{direction: "north", roomId: 150, distance: 1}, ...], totalDistance: 3 }

// Walk NPC along a path
await $ai.walkPath(npc.id, path.path);
```

### World Log

```javascript
// Get world log (AI activity log for deity NPCs)
const log = await $ai.getWorldLog(50);  // Last 50 entries
```

See [AI/NPC Reference](./moo/reference/ai-npc.md) for full documentation.

## Notes System ($notes)

Attach metadata and tracking information to any object.

### Examples

```javascript
// Add a note to an object
const obj = await $load(123);
await $notes.add(obj, "This needs review", player, ["review"]);

// Get all notes on an object
const notes = await $notes.get(obj);
// [{ text: "...", author: "player", timestamp: "...", tags: [...] }]

// Search notes by tag
const todos = await $notes.search("", { tag: "review" });

// Delete a note
await $notes.delete(obj, 0);  // By index

// Format for display
const formatted = await $notes.format(obj);
// [0] 1/15/2024 10:30:00 AM by player [review]
//     This needs review

// List all objects with notes
const objects = await $notes.listObjects();
```

See [Notes Reference](./moo/reference/notes.md) for full documentation.

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

## Plot System ($plot)

Manage narrative arcs, missions, and jobs.

### Plot Management

```javascript
// Create a new plot
const plotId = await $plotSpawner.createPlot("Water Main Repair", {
  type: "infrastructure",
  priority: "high"
});

// Load and work with plot
const plot = await $load(plotId);

// Add event to log
await plot.addEvent({
  from: "handler",
  message: "Job posted. Awaiting workers.",
  playerId: player.id
});

// Get event log
const events = await plot.getEventLog();
const text = await plot.getEventLogAsText();

// Set metadata
await plot.setMetadata("priority", "critical");

// Close plot
await plot.close("completed", "Repair successful.");
```

### Job Management

```javascript
const plot = await $load(plotId);

// Create job
await plot.createJob("repair_pipe", {
  expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString(),
  reward: 50
});

// Get job details
const job = await plot.getJob("repair_pipe");

// Complete or fail job
await plot.completeJob("repair_pipe", "Done.");
await plot.failJob("repair_pipe", "Abandoned.");
```

### Phases and Hooks

```javascript
const plot = await $load(plotId);

// Set phases
await plot.setPhases([
  { id: "start", name: "Initial Contact" },
  { id: "travel", name: "En Route" },
  { id: "complete", name: "Delivery" }
]);

// Track job phase
const phase = await plot.getJobPhase("delivery_job");
await plot.advancePhase("delivery_job");

// Register hook
await plot.registerJobHook(
  "delivery_job",
  lockerId,
  "oneTimeCodeUsed",
  { code: "XYZ789" }
);
```

### Queue Management

```javascript
// Get next plot needing attention (bumps timer 24h)
const next = await $plotDB.getNext();

// List all active plots
const active = await $plotDB.getByStatus("active");
```

See [Plot System Reference](./moo/reference/plots.md) for full documentation.

## Combat Resolution ($combat)

Combat management for AI-driven fight resolution.

### Example

```javascript
// Get combat context for AI
const ctx = await $combat.getContext("combat-123");

// Perform a skill check
const result = await $combat.check("combat-123", 567, "brawling", 50);

// Apply damage if hit
if (result.success) {
  await $combat.damage("combat-123", 568, "torso", "bruise", 30, "fist");
}

// Narrate the action
await $combat.emote("combat-123", "Marcus lands a solid punch to his opponent's chest!");

// End combat
await $combat.end("combat-123", "knockout", 567);
```

**Damage Types:** `cut`, `bruise`, `puncture`, `burn`, `laceration`, `abrasion`
**Body Parts:** `head`, `torso`, `leftShoulder`, `rightShoulder`, `leftThigh`, `rightThigh`, etc.
**End Reasons:** `death`, `flee`, `surrender`, `knockout`, `intervention`
**Status Effects:** `stunned`, `knockedDown`, `disarmed`, `winded`

See [Combat Guide](./city-ai/COMBAT.md) for full documentation.

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
  prototypeId: 49,  // $lock
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
const guard = await $ai.spawn({
  role: "guard",
  name: "Marcus",
  location: await $load(100)
});

// 2. See what the guard sees
const view = await $ai.look(guard.id);

// 3. Make the guard do things
await $ai.do(guard.id, "say Halt!");

// 4. Check the guard's profile (via resource)
const profile = await readResource(`moo://ai/${guard.id}`);

// 5. When no longer needed
await $ai.despawn(guard.id);
```

### AI City Management with Plot Jobs

```javascript
// 1. Check for pending plots
const next = await $plotDB.getNext();

if (next.plot) {
  const plot = await $load(next.plot.id);

  // 2. Read event history
  const events = await plot.getEventLog();

  // 3. Create items in the world
  const item = await $recycler.create($item, {
    name: "package"
  });
  const targetRoom = await $load(plot.metadata.targetRoomId);
  await item.moveTo(targetRoom, player);

  // 4. Add narrative event
  await plot.addEvent({
    from: "handler",
    message: "A courier arrives with a package."
  });
}
```
