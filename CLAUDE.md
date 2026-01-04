# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

**All changes must go through pull requests.** Do not commit directly to master.

1. Create a feature branch: `git checkout -b feature/description`
2. Make your changes and commit
3. Push and create a PR: `gh pr create`
4. Merge after review

## Project Overview

Malice is a modern TypeScript-based Text MOO (Multi-User Object-Oriented) game engine inspired by LambdaMOO. It uses MongoDB for persistence, RxJS for reactive patterns, and TypeScript for both server code and in-database method execution.

## Common Commands

```bash
# Development
npm start           # Start server (Bun runtime)
bun run dev         # Start with auto-reload (Bun)

# Testing
npm test                                    # Run all tests
npm test -- agent.test.ts                   # Run single test file
npm test -- --watch                         # Watch mode
npm run test:coverage                       # With coverage

# Type checking
npm run typecheck   # tsc --noEmit

# Building
npm run build       # Compile TypeScript

# Bootstrap (rebuild world/prototypes)
npm run bootstrap:apply        # Apply bootstrap
npm run bootstrap:force        # Force rebuild all methods
FORCE_BOOTSTRAP=true npm start # Rebuild on startup

# Docker
docker compose up -d           # Start MongoDB + game server
npm run docker:rebuild         # Full rebuild with fresh volumes
```

## Architecture

### Stable Proxy Pattern

The core architectural pattern is the **Stable Proxy Architecture**:

1. **Full Warmup**: All objects are loaded into memory at startup via `manager.loadAll()`
2. **O(1) Cache**: Objects stored in array-backed `ObjectCache` for instant access by ID
3. **Stable Proxies**: `RuntimeObject` proxies never change - same reference for entire server lifetime
4. **Async Write-Through**: Memory is source of truth, MongoDB persisted in background

### Object System

Everything is a `RuntimeObject` with numeric IDs (#0, #1, #2, etc.):

- `#-1` - `$.nothing` - Immutable null object reference
- `#0` - `$` - ObjectManager itself (stores aliases, provides `$load`, `$create`, `$query`, `$aiQuery`)
- `#1` - Root - Base of all inheritance
- `#2` - System - Routes new connections to AuthManager
- `#3` - Programmer - Wizard-level access, can build world

Objects have:
- **Properties**: Typed values (string, number, boolean, objref, array, object)
- **Methods**: TypeScript code strings compiled and executed at runtime
- **Parent**: Single prototype inheritance chain (walks up to find properties/methods)

### Types vs Objects

Malice has a two-tier object system:

| Aspect | Types (`$.define`) | Objects (`$recycler.create`) |
|--------|-------------------|------------------------------|
| **ID** | String (e.g., `'bandage'`) | Numeric (e.g., `#42`) |
| **Collection** | `types` | `objects` |
| **Lifecycle** | Permanent | Recyclable |
| **Aliasing** | Auto-aliased by name | Manual |

**The Golden Rule: Define types, then create objects from them.**

```typescript
// 1. Define a type (creates $securityCamera alias)
const $securityCamera = await $.define('securityCamera', $device, {
  properties: {
    name: 'Security Camera',
    recording: true,
    abilities: 'Surveillance device. Logs events when recording.',
  }
});

// 2. Create instances from the type
await $recycler.create($securityCamera, { name: 'Lobby Camera' });
await $recycler.create($securityCamera, { name: 'Entrance Camera' });
```

**Even for one-off objects**, define a type first - it gives you an alias, shared behavior, and maintainability.

See `docs/moo/reference/types-vs-objects.md` for full documentation.

### Abilities-First Architecture

**IMPORTANT**: Malice uses an abilities-first paradigm. See `docs/ABILITIES-FIRST.md` for full details.

**The core idea**: Instead of procedural methods, objects have:
- **Property descriptions** - explain what each property MEANS
- **Abilities** - prose physics describing how the object BEHAVES

The AI narrator reads abilities and interprets player intent, modifying properties directly.

**Three types of specification:**
- **JSDoc** on methods = CONSTRAINTS (what infrastructure methods do)
- **Property descriptions** = CONSTRAINTS (what data means)
- **Abilities** = PHYSICS (how things interact)

**All player actions go through the AI narrator:**
- "look" → AI reads room and contents abilities, describes scene
- "north" → AI reads exit abilities, moves player
- "unlock the door" → AI reads lock abilities, checks key
- "pick up the gun" → AI reads hand abilities, checks maxItems/weight via canContain()
- "put knife in pocket" → AI reads pocket abilities, checks weight/volume capacity
- "search for bugs" → AI reads concealment abilities, reveals items

There are no coded verbs. The AI interprets every command by reading abilities and property descriptions.

**Inventory is distributed** - items are held in hands (up to 2 per hand, weight-limited) or stored in pockets (attached to worn clothing). The `moveTo()` primitive moves items between locations, and `canContain()` enforces capacity constraints.

**When building objects:**
```typescript
// First, define a type for your new category of thing
const $securityCamera = await $.define('securityCamera', $device, {
  properties: {
    name: 'Security Camera',
    recording: true,
    eventLog: [],
    abilities: `Surveillance device. When 'recording' is true, logs events.
    Can be disabled by covering lens or cutting power.`,
  }
});
$securityCamera.setPropertyDescription('recording', "Whether actively recording.");
$securityCamera.setPropertyDescription('eventLog', "Array of recorded events.");

// Then create instances from the type
const lobbyCamera = await $recycler.create($securityCamera, {
  name: 'Lobby Camera',
});
await lobbyCamera.moveTo(lobbyRoom);
```

**DO NOT** register verbs for game interactions. Let the AI handle them via abilities.

### Method Execution Context

Methods are TypeScript code stored as strings in MongoDB. When executed, they have access to:

```typescript
self         // The object the method is called on (Proxy - direct property access)
$            // ObjectManager - $.system, $.authManager, or await $[42] for ID access
args         // Method arguments array
context      // ConnectionContext for player commands
player       // Player RuntimeObject (for verb dispatch)
command      // Raw command string
pass()       // Call parent's version of this method (MOO-style super)
$load(id)    // Load object by ID
$create({parent, properties, methods})  // Create new object
$query(criteria?)                       // Fluent query builder (see below)
$aiQuery(system, prompt, session?)      // Query Claude AI with MCP tools
$<alias>     // Pre-resolved aliases: $room, $exit, $player, $recycler, $http, $email, $blob, etc.
```

### Fluent Query Builder

`$query()` provides fluent, chainable queries for finding objects using a selector pattern:

```typescript
// Property selectors
$query().prop('outdoor').equals(true).all()
$query().prop('z').gt(0).all()
$query().prop('name').contains('smith').all()
$query().prop('*').contains('secret').all()  // search all string properties

// Method selectors
$query().method('tick').exists().all()
$query().method('*').contains('$recycler').all()  // search all methods

// Negation
$query().prop('recycled').not().equals(true).all()
$query().method('tick').not().exists().all()

// OR groups (predicates within group are ANDed, groups are ORed)
$query().parent($weapon).or().prop('damage').gt(10).all()

// AND for readability (noop - predicates are ANDed by default)
$query().prop('x').equals(1).and().prop('y').equals(2).all()

// Complex: (outdoor AND z>0) OR (indoor AND z<0)
$query()
  .prop('outdoor').equals(true).and().prop('z').gt(0)
  .or()
  .prop('outdoor').equals(false).and().prop('z').lt(0)
  .all()

// Parent/inheritance filters
$query().parent($room).prop('z').equals(0).all()
$query().inheritedFrom($item).limit(10).all()

// Property predicates: .equals(), .exists(), .contains(), .gt(), .gte(), .lt(), .lte(), .in(), .matches(), .startsWith(), .endsWith()
// Method predicates: .exists(), .existsLocal(), .contains(), .matches()
// Result methods: .all(), .first(), .count(), .ids(), .names(), .parents(), .children()
```

### Key Directories

- `src/database/` - Object system core (`RuntimeObject`, `ObjectManager`, `ObjectCache`, `ObjectDatabase`)
- `src/database/bootstrap/` - World/prototype builders run at startup
- `src/transport/` - Transport servers and faction bundles
  - `faction-bundle.ts` - Wraps HTTP+WebSocket+SessionMCP for one faction
  - `faction-transport-registry.ts` - Manages all faction bundles
- `src/config/faction-ports.ts` - Port allocation logic for factions
- `src/game/` - `GameCoordinator` (startup orchestration), `ConnectionContext` (player session)
- `src/mcp/` - MCP servers for Claude Code integration
- `src/devtools/` - VS Code extension server (WebSocket JSON-RPC)
- `src/lsp/` - LSP API server for IDE features
- `types/` - TypeScript type definitions

### Servers and Ports

**Static Services (Admin/Dev):**
- **80** - Main website
- **3000** - LSP REST API (VS Code extension)
- **3010** - MCP server for Claude Code (code-first: execute_moo_code, admin access)
- **9999** - DevTools WebSocket (VS Code extension)

**Per-Faction Transport Bundles:**
Each faction gets its own isolated network infrastructure. Ports are calculated from faction index:

| Faction | Index | HTTP | WebSocket | Session MCP |
|---------|-------|------|-----------|-------------|
| Continuum | 0 | 8000 | 8080 | 3012 |
| Gray Cartel | 1 | 8001 | 8081 | 3013 |
| (new faction) | N | 8000+N | 8080+N | 3012+N |

Factions are created dynamically via `$factionManager.create()` - see Faction System below.

## Multiplexed Transport

The WebSocket server supports a **multiplexed channel protocol** for rich web clients. Connect to `/mux` path for channel support.

### Wire Protocol

Messages are JSON envelopes with channel routing:
```json
{ "ch": "game", "t": "data", "p": "Hello world" }
{ "ch": "state", "t": "data", "p": { "type": "room", "data": {...} } }
{ "ch": "ctrl", "t": "data", "p": { "type": "prompt", "text": "> " } }
```

- `ch` - Channel ID (game, state, ctrl, or custom)
- `t` - Message type (data, open, close, ack, ping, pong)
- `p` - Payload (string for game, object for state/ctrl)

### Built-in Channels

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `game` | bidirectional | Text I/O (like telnet) |
| `state` | server→client | State pushes (room, inventory, etc.) |
| `ctrl` | bidirectional | Control signals (resize, ready, prompt) |
| `custom:*` | bidirectional | Custom channels (open with `t: 'open'`) |

### MOO Methods for Channels

**On `$player`** (individual):
```typescript
player.state('room', { name: 'Lobby', exits: ['n', 's'] });  // state channel
player.ctrl('prompt', { text: '> ' });                       // ctrl channel
player.channel('custom:events', { type: 'alert' });          // any channel
```

**On `$location`** (spatial broadcast):
```typescript
room.broadcastState('room', roomData);     // all players in room
room.broadcastCtrl('mode', { combat: true });
room.broadcastChannel('custom:fx', { sound: 'explosion.mp3' });
```

**On `$`** (global broadcast):
```typescript
await $.broadcastState('announcement', { message: 'Server restart in 5m' });
await $.broadcastCtrl('mode', { maintenance: true });
await $.broadcastChannel('custom:alert', { level: 'critical' });
```

### Client Connection

```javascript
// Connect to multiplexed endpoint
const ws = new WebSocket('ws://localhost:8080/mux');

ws.onmessage = (e) => {
  const { ch, t, p } = JSON.parse(e.data);
  if (ch === 'game') terminal.write(p);
  if (ch === 'state') updateState(p);
  if (ch === 'ctrl') handleCtrl(p);
};

// Send game input
ws.send(JSON.stringify({ ch: 'game', t: 'data', p: 'look' }));

// Send resize
ws.send(JSON.stringify({ ch: 'ctrl', t: 'data', p: { type: 'resize', w: 80, h: 24 } }));
```

### WebSocket Protocol

All WebSocket connections use the multiplexed JSON envelope format. Clients connect with HTTP Basic Auth or token authentication:

```javascript
const ws = new WebSocket('wss://malice.life:8080/', {
  headers: { 'Authorization': 'Basic ' + btoa(username + ':' + password) }
});
```

## Code Style

- TypeScript with strict mode enabled
- ESM modules (use `.js` extensions in imports)
- Path aliases: `@/*` for `./src/*`, `@types/*` for `./types/*`
- Vitest for testing with 30s timeout
- RxJS for event streams (connections, transports)

## Key Patterns

### Creating Objects
```typescript
// Parent must be a RuntimeObject, not an ID
const parent = await manager.load(parentId);
const obj = await manager.create({
  parent,
  properties: { name: 'Thing', description: 'A thing' },
  methods: { describe: 'return self.description;' }
});
```

### Property Access
```typescript
// Via proxy (preferred in MOO code)
self.hp = 100;
const name = self.name;

// Via explicit methods
obj.set('hp', 100);
const hp = obj.get('hp');
```

### Object References (ObjRefs)
Properties can store references to other objects. They're stored as `{ type: 'objref', value: <id> }` but resolved to `RuntimeObject` when accessed:
```typescript
self.location = room;      // Stores objref
const loc = self.location; // Returns RuntimeObject
```

### Inheritance Chain
Methods/properties are looked up by walking the parent chain:
```typescript
// In method code, call parent's version:
return await pass(...args);
```

### Method Management

RuntimeObjects have methods for managing their code:

```typescript
// Set a method (replaces entire code)
obj.setMethod('greet', `
  const name = args[0] || 'World';
  return 'Hello, ' + name + '!';
`);

// Edit a method with string replacement (like file editing)
const result = obj.editMethod('greet', 'Hello', 'Greetings');
// Returns: { success: true, code: '...' } or { success: false, error: '...' }

// Replace all occurrences
obj.editMethod('greet', 'foo', 'bar', { replaceAll: true });

// Get method source (local only)
const code = obj.getMethod('greet');

// Get method source walking inheritance chain
const inherited = await obj.getMethodCode('greet');
// Returns: { code: '...', objectId: 123 } or null
```

**editMethod behavior:**
- Only edits methods defined directly on the object (not inherited)
- Fails if `oldString` not found in code
- Fails if `oldString` appears multiple times (unless `replaceAll: true`)
- Returns current code on error for debugging

### Perception Filter System

Agents can have **perception filters** that modify what they perceive and provide virtual addressable entities. Used for neural interfaces, hallucinations, augmented reality, etc.

```typescript
// Add a perception filter to an agent
await agent.addPerceptionFilter(source, filter);

// Filter can provide:
// - modifyRoomDescription(output, room, viewer) - Inject content into room descriptions
// - getAddressableEntities() - Return array of names that can be addressed via "to" verb
// - onAddressed(speaker, targetName, message) - Handle when player says "to <entity> <message>"
// - onSee/onHear/onSmell/onTaste/onFeel(message, source) - Sensory hooks
```

**Example: The Mask** - A neural interface wearable that:
- When worn, adds Pluribus (the city AI) as an addressable entity
- Forwards sensory input to Pluribus for AI awareness
- Injects Pluribus's presence into room descriptions
- Registers `think <message>` verb for silent communication

### Body Parts and Sensory System

Human bodies have a hierarchical part structure with sensory capabilities:

```
torso (root)
  ├─ head ($head prototype)
  │   ├─ face
  │   │   ├─ leftEye, rightEye ($eye - canSee)
  │   │   ├─ leftEar, rightEar ($ear - hear method)
  │   │   ├─ nose ($nose - canSmell)
  │   │   └─ mouth ($mouth - canTaste, delegates to tongue)
  │   │       └─ tongue ($tongue - canTaste, canSpeak)
  │   ├─ neck, scalp
  ├─ shoulders → arms → forearms → hands ($hand - holds items) → fingers
  ├─ thighs → knees → legs → feet
  └─ groin, chest, abdomen, back
```

**Hands as containers:** Each hand can hold up to 2 items (maxItems) with a 10kg weight limit (maxWeight). Items are held via `item.moveTo(hand)` and `hand.canContain(item)` enforces limits.

Each sensory organ has capability methods that propagate up:
- `head.canSmell()` → `face.nose.canSmell()`
- `head.canTaste()` → `face.mouth.canTaste()` → `mouth.tongue.canTaste()`
- `embodied.smell(message)` checks `head.canSmell()` before processing

## MCP Integration

The MCP server at port 3010 provides a **code-first interface** for Claude Code to interact with the MOO world.

### Architecture

- **Port 3010** - Main MCP server (admin/builder access, code-first)
- **Port 3012** - Session MCP server (player access, action-based)

### Local vs Production MCP

Two MCP servers are configured in `.mcp.json`:

| Server | URL | Purpose |
|--------|-----|---------|
| `malice` | `localhost:3010` | Local dev server |
| `malice-prod` | `localhost:4010` | Production (via SSH tunnel) |

**To connect to production:**
```bash
# Start SSH tunnel (maps prod:3010 → local:4010)
ssh -L 4010:localhost:3010 -i ~/.ssh/malice-do root@malice.world

# Or use SSH config (see docs/DEPLOYMENT.md)
ssh malice-prod
```

Then use `mcp__malice-prod__execute_moo_code` instead of `mcp__malice__execute_moo_code`.

### Code-First Philosophy

**IMPORTANT**: This project uses direct MOO code execution:

```typescript
// ✅ Direct MOO code (the right way)
execute_moo_code({
  code: `
    // Use $recycler to create objects
    const room = await $recycler.create($room, {
      name: "Hall",
      x: 0, y: 0, z: 0
    });

    // Create and move item
    const torch = await $recycler.create($item, {
      name: "torch"
    });
    await torch.moveTo(room, player);

    return {roomId: room.id, torchId: torch.id};
  `
})
```

**Benefits**:
- **No wrapper layer** - just pure MOO code
- **Composable** - loops, conditionals, multi-step operations
- **Full MOO context** - $, $load(), $recycler, all $aliases
- **Single execution** - no round-trips between steps
- **Player context** - if authenticated, access `player` variable

### Authentication

The main MCP server (3010) supports HTTP Basic Auth to tie into the MOO's user database:

```bash
# Connect with authentication
curl -u username:password http://localhost:3010/mcp
```

When authenticated:
- Your player ID is stored in the MCP session
- The `player` variable is injected into `execute_moo_code` execution context
- You can access your player object: `player.playername`, `player.location`, etc.

Without authentication:
- The `player` variable is `undefined`
- You still have full access to all MCP tools
- Use this for world building and administrative tasks

### Direct MOO Code Execution

Write native MOO code using `execute_moo_code`. No wrappers - just pure MOO:

```typescript
// Authenticated - access your player
const myRoom = player?.location;
console.log(`You are in: ${myRoom?.name || 'nowhere'}`);

// Create a room
const room = await $recycler.create($room, {
  name: 'Hallway',
  description: 'A long hallway',
  x: 0, y: 1, z: 0
});

// Create and place an item
const torch = await $recycler.create($item, {
  name: 'torch',
  description: 'A flickering torch'
});
await torch.moveTo(room, player);

// Link rooms with exits
const fromRoom = await $load(100);
fromRoom.exits = fromRoom.exits || {};
fromRoom.exits.north = room.id;
room.exits = room.exits || {};
room.exits.south = fromRoom.id;

return {roomId: room.id, torchId: torch.id};
```

### Available in Execution Context

- `$` - ObjectManager ($.db, $.addAlias, etc.)
- `$load(id)` - Load object by ID
- `$create({parent, properties, methods})` - Create new object
- `$query()` - Fluent query builder for finding objects
- `$aiQuery(system, prompt, session?)` - Query Claude AI with MCP tools
- `$recycler` - Create/destroy objects via recycler pattern
- All `$aliases` - `$room`, `$player`, `$exit`, `$ai`, `$plot`, `$spatial`, `$faction`, `$factionManager`, `$transports`, `$continuum`, `$cartel`, furniture prototypes (`$bed`, `$table`, `$chair`, `$cabinet`, `$trunk`, `$crate`, `$locker`, `$bench`, `$couch`, `$safe`, `$furniture`), security (`$door`, `$lock`, `$biometricLock`), etc.
- `player` - Your authenticated player object (if HTTP Basic Auth provided)
- Full JavaScript - loops, conditionals, async/await, etc.

### MCP Resources

The MCP server provides moo:// resources for querying game state:

**Meta Resources:**
- `moo://tools` - List all available MCP tools
- `moo://aliases` - List all object aliases
- `moo://schema` - MOO object schema documentation

**Object Resources:**
- `moo://objects/{id}` - Get object details (#42 or 42)
- `moo://objects/{id}/prop/{name}` - Get specific property value
- `moo://objects/{id}/method/{name}` - Get method source code (walks inheritance)
- `moo://objects/{id}/verbs` - Get all verbs registered on an agent
- `moo://objects/list/{page}` - Paginated object list (100 per page)
- `moo://alias/{name}` - Get object by alias (e.g., moo://alias/player)

**Room Resources:**
- `moo://rooms/{id}` - Get room state with exits, contents, and players

**Player Resources:**
- `moo://players` - List all player characters
- `moo://players/{id}` - Get individual player details

**AI/NPC Resources:**
- `moo://ai` - List all AI-controlled NPCs
- `moo://ai/{id}` - Get AI NPC profile with personality and memories
- `moo://ai/{id}/memories` - Get memories for an AI NPC
- `moo://ai/{id}/notes` - Get notes for an AI NPC
- `moo://ai/worldLog` - Shared OOC chat between Pluribus and Sister Gray (deity chat)

**NPC Session Resources (Claude API Logs):**
- `moo://npc-sessions` - List all AI NPC conversation sessions
- `moo://npc-sessions/{sessionId}` - Get full conversation history (JSONL format)

**Plot Resources:**
- `moo://plots` - List all active plots
- `moo://plots/{id}` - Get plot details and events
- `moo://plots/{id}/events` - Get event log for a specific plot

**Event Resources:**
- `moo://events/recent` - Get 50 most recent game events

**Documentation Resources:**
- `moo://docs` - List all documentation files
- `moo://docs/{name}` - Get documentation file (e.g., moo://docs/builders-guide)
- `moo://city-ai` - List all city AI documentation files
- `moo://city-ai/{name}` - Get city AI doc (e.g., moo://city-ai/context)

**Greeter/Onboarding Resources:**
- `moo://docs/greeter/00-overview` - Two paths overview, pacing, path detection
- `moo://docs/greeter/continuum/{stage}` - Continuum path stages (01-07)
- `moo://docs/greeter/underground/{stage}` - Underground path stages (01-07)

### Using MCP

**Prefer direct MOO code**:
- Use `execute_moo_code` with native MOO capabilities
- Access `$recycler`, `$load()`, `$ai`, `$plot`, and all other $aliases directly
- Write composable code with full JavaScript capabilities

**Individual MCP tools** (legacy, avoid):
- `mcp__malice__*` tools are available but not recommended
- They're just wrappers around MOO code - use the MOO code directly instead
- See `docs/MCP-TOOLS.md` if you need the tool reference

## Scheduler

The `$scheduler` object manages periodic jobs. It starts **paused** by default.

```typescript
// Resume scheduler (required after server start)
await $scheduler.resume();

// Pause scheduler
await $scheduler.pause();

// Check if paused
const isPaused = await $scheduler.isPaused();

// Schedule a job
await $scheduler.schedule('jobName', delay, interval, target, 'methodName', ...args);
// delay: ms until first run (0 = next tick)
// interval: ms between runs (0 = one-shot, deleted after first run)

// Unschedule a job
await $scheduler.unschedule('jobName');

// Enable/disable a job without removing it
await $scheduler.setEnabled('jobName', false);

// List all jobs
const jobs = await $scheduler.listJobs();

// Get job info
const job = await $scheduler.getJob('jobName');

// Force run a job immediately
await $scheduler.runNow('jobName');

// Get scheduler status
const status = await $scheduler.describe();
// Returns: "Scheduler [PAUSED]: 3 job(s)\n  playerHeartbeat: every 60s, next in 45s\n  ..."
```

**Default jobs** (registered at startup):
- `playerHeartbeat` - Ticks all players every 60s
- `decayTick` - Processes decayable objects every 60s
- `pluribusWake` - Wakes Pluribus AI every hour (on the hour)
- `sisterGrayWake` - Wakes Sister Gray AI every hour (on the half-hour)

## Spatial System ($spatial)

The `$spatial` singleton manages coordinate-based rooms and terrain.

### Coordinate System

```
X-axis: West (-) to East (+)
Y-axis: South (-) to North (+)
Z-axis: Vertical (0 = ground, negative = underground, positive = altitude)

Grid: ~30m per x/y unit, ~3m per z unit
Water terrain: x < -15 (Elliott Bay)
```

### Room Lookup

```typescript
// Get room data at coordinates
const room = await $spatial.getRoomDataAt(x, y, z);

// Get terrain type
const terrain = await $spatial.getTerrainAt(x, y);
// Returns: 'water', 'ground', 'blocked', etc.

// Get location hint for coordinates
const hint = await $spatial.getLocationHint(x, y, z);
```

### Dynamic Room Creation: ensureRoom()

For **AI-controlled dynamic room creation** (vehicles, exploration), use `ensureRoom()`:

```typescript
// AI decides IF room should exist - returns room or NULL
const room = await $spatial.ensureRoom(x, y, z, 'hint about why');
if (!room) {
  // AI said no - this location doesn't make sense
  return 'Cannot go there.';
}
await vehicle.moveTo(room);
```

**When to use:**
- Aircraft flying to new coordinates → creates airspaceRoom
- Boats sailing to new water → creates waterRoom
- Submarines diving to new depths → creates underwaterRoom
- Room description mentions location that doesn't exist yet

**When NOT to use:**
- Normal player movement (use exits)
- Entering buildings (use exits)
- Any case where an exit should exist

**The AI is conservative** - it only creates rooms that make physical sense:
- **Airspace** (z > 0): Only above outdoor rooms
- **Water surface** (z = 0): Only in water terrain (x < -15)
- **Underwater** (z < 0): Only in water, max depth z >= -15 without explicit hint
- **Ground level**: Urban context with neighboring rooms

**Rooms are permanent** - once created, they stay forever. No cleanup needed.

### How ensureRoom Works Internally

1. Checks if room already exists at (x, y, z) → returns it
2. Gathers terrain data and neighboring room context
3. Calls `$builder.maybeCreate(x, y, z, hint)` - AI decides
4. AI either creates room or returns null
5. Looks up the room again → returns it or null

### Hint Examples

```typescript
// Vehicle hints (handled internally by vehicle prototypes)
await $spatial.ensureRoom(x, y, 10, 'aircraft taking off');
await $spatial.ensureRoom(x, y, 0, 'boat sailing to new water');
await $spatial.ensureRoom(x, y, -5, 'submarine diving');

// Exploration hints (narrator may use these)
await $spatial.ensureRoom(x+1, y, 0, 'abandoned building mentioned in room description to the east');
```

### Pioneer Square Underground Network

The game features an extensive underground tunnel network beneath Pioneer Square (Seattle's historic 1889 street level). The system spans multiple levels from z=-2 (upper tunnels) down to z=-6 (deep vaults).

**Key levels:**
- **z=-2**: Upper tunnels (~267 rooms) - Dense corridor network across the entire district
- **z=-3**: Transitional layer (~75 rooms) - Deep passages, cisterns, and flooded zones
- **z=-4**: Lower passages - Gray Cartel operational territory, Deep Cisterns (pre-fire water infrastructure)
- **z=-5**: Deep vaults - Secured cell bases
- **z=-6**: Submerged zones - Water table boundary

**Major sections:**
- Western Network (Gray Cartel core territory)
- Waterfront Underground (piers and tidal caves)
- Eastside Underground (steam tunnels and utility infrastructure)
- Yesler Underground (prohibition-era passages)
- King Street Underground (rail platform connections)
- Chinatown Underground (historic Chinese tunnels, gambling dens, opium passages)

**Surface entry points:**
- Fabrication building (-21, +10)
- Smith Tower (-12, +9)
- Occidental Park (-3, +2)
- Supply Depot (-21, -5)
- Yesler Way grating (-7, +12)
- 4th Avenue utility hatch (+14, 0)
- King Street Station (+4, -12)

**Building basement connections:**
- Doc Maynard's cellar (-15, 2, -1) → east to underground
- Fabrication Factory foundry (-19, 10, -1) → south to underground
- Gargoyle Building coal cellar (-18, 12, -1) → east to underground
- Grand Central cistern (-15, 0, -1) → south to underground
- Immigration Services detention cells (-15, 10, -1) → east to underground
- Merchants Cafe basement → underground connection
- Morrison & Kline basement (-14, 8, -1) → down to underground
- Occidental Square old cellar (-8, 0, -1) → south to underground
- Owl Cafe basement → underground connection
- Pioneer Books basement → underground connection
- Pioneer Hotel mechanical room (-15, 7, -1) → east to underground
- Redux Vintage basement (-16, 4, -1) → underground smuggling route
- Zeitgeist Coffee basement (-10, 11, -1) → underground breach

See `docs/city-ai/MAP-UNDERGROUND.md` for detailed maps, room coordinates, and territorial information.

## Web Map Visualizer

The server provides 3D map visualization at:

- **`/map`** - Public map (above-ground rooms, population heatmap)
- **`/admin/map`** - Admin map (all rooms including underground, individual agents) - requires HTTP Basic Auth

**Features:**
- Rooms rendered as 3D cubes with height-based coloring
- Exit connections shown as red tubes between rooms
- Population heatmap (5x5 grid aggregation)
- Agent markers (green = player, blue = NPC)
- View controls: Top, Side, Reset
- Auto-refresh: 30s (public), 3s (admin)

**API Endpoints:**
- `GET /api/map/rooms` - Room coordinates and exits
- `GET /api/map/rooms?z_min=0` - Filter by minimum z-level
- `GET /api/map/players` - Aggregated population heatmap
- `GET /api/map/players/admin` - Individual agent positions (admin auth required)

## Faction System

Factions are organizations with isolated network infrastructure. Each faction gets its own transport bundle (HTTP, WebSocket, Session MCP).

### Key Objects

- **`$faction`** - Prototype for faction instances (creatable)
- **`$factionManager`** - Singleton for creation, destruction, memberships, relationships
- **`$transports`** - Registry for transport bundles (internal, used by $factionManager)

### Default Factions

- **`$continuum`** - The governing authority (domain: thecontinuum.city, index: 0)
- **`$cartel`** - Underground resistance (domain: graycartel.com, index: 1)

### Creating Factions at Runtime

```typescript
// Create a new faction with full transport bundle
const faction = await $factionManager.create({
  name: 'Shadow Syndicate',
  domain: 'shadowsyndicate.net',
  description: 'A mysterious organization',
  charGen: $charGen,  // Optional: custom character generation
});

// Transports are automatically started
console.log(faction.ports);
// { http: 8002, ws: 8082, sessionMcp: 3014 }

// Players register on faction website, then connect via WebSocket with auth
```

### Destroying Factions

```typescript
// Graceful shutdown with message to connected players
await $factionManager.destroy(faction, {
  gracefulTimeoutMs: 5000,
  message: 'Faction shutting down...'
});
// Transports stopped, object recycled, domain mapping cleared
```

### Faction Memberships

```typescript
// Assign entity to faction
await $factionManager.setMembership(player, $cartel);

// Get entity's faction
const faction = await $factionManager.getMembership(player);

// Get all members of a faction
const members = await $factionManager.getMembers($continuum);
```

### Faction Relationships

```typescript
// Set relationship between factions
await $factionManager.setRelationship($continuum, $cartel, 'hostile');
// Types: 'friendly', 'hostile', 'neutral'

// Check relationships
const rel = await $factionManager.getRelationship($continuum, $cartel);
const friendly = await $factionManager.isFriendly(entityA, entityB);
const hostile = await $factionManager.isHostile(entityA, entityB);
```

### Querying Factions

```typescript
// List all factions
const factions = await $factionManager.list();

// Get faction by domain
const cartel = await $factionManager.getByDomain('graycartel.com');

// Check transport status
const info = await $transports.get(faction);
// { factionId, name, domain, ports, connectionCount, online }

// Get connections for a faction
const conns = await $transports.getConnections(faction);
const count = await $transports.getConnectionCount(faction);
```

### Transport Bundle Details

Each faction's transport bundle includes:

| Transport | Purpose |
|-----------|---------|
| HTTP | Web server for landing page, /register, /verify, /play, domain content |
| WebSocket | Authenticated connections with /mux multiplexed channels |
| Session MCP | Player-scoped MCP access for AI-driven clients |

### Email Verification Flow

New player registration requires email verification:

```
1. User visits faction site (thecontinuum.city or graycartel.com)
2. User fills registration form (username, email, password)
3. POST /register creates player with emailVerified=false
4. faction.onPlayerRegistered(player) is called:
   - Sends branded verification email via $email
   - Sends Discord notification via $http (if discordWebhook configured)
5. User clicks email link → GET /verify?t=token
   - Sets emailVerified=true, clears verificationToken
   - Redirects to /play?verified=1
6. User logs in → POST /api/auth
   - Checks emailVerified === true
   - Returns 403 if not verified
   - Returns one-time token if verified
```

### Faction Registration Hook

Each faction has an `onPlayerRegistered(player)` method called after registration:

```typescript
// Base implementation in $faction prototype
// Override in faction instances for custom branding

// $continuum sends blue-themed email
// $cartel sends green/dark-themed email
// Both can send Discord notifications if discordWebhook is set

// Set Discord webhook for registration notifications:
$continuum.discordWebhook = 'https://discord.com/api/webhooks/...';
$cartel.discordWebhook = 'https://discord.com/api/webhooks/...';
```

## Email, HTTP, Blob, and AI Image Objects

MOO objects for external communication, blob storage, and AI image generation. These are proper MOO objects (not injected TypeScript classes) - their methods use native `fetch`, `await import('resend')`, and `await import('mongodb')` for GridFS.

### $email - Email Object

Send emails via faction-specific domains using Resend:

```typescript
// Send email from faction domain (noreply@thecontinuum.city)
await $email.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello</h1>',
  faction: $continuum  // Optional: uses faction's domain
});

// Without faction, sends from malice.world
await $email.send({
  to: 'user@example.com',
  subject: 'Admin Notice',
  html: '<p>System message</p>'
});
```

### $http - HTTP Object

Make external HTTP requests (webhooks, APIs):

```typescript
// POST to Discord webhook
await $http.post('https://discord.com/api/webhooks/...', {
  content: 'Hello from Malice!',
  embeds: [{ title: 'Alert', color: 0xff0000 }]
});

// GET request
const response = await $http.get('https://api.example.com/data');
// { status: 200, body: { ... } }

// GET binary data (images, files) - returns base64
const imageResp = await $http.getBinary('https://example.com/image.png');
// { status: 200, body: 'base64...', contentType: 'image/png' }

// Full request with options
await $http.request('https://api.example.com', {
  method: 'PUT',
  headers: { 'Authorization': 'Bearer ...' },
  body: { key: 'value' },
  timeout: 5000
});
```

### $blob - Blob Storage Object

Store and retrieve binary data using MongoDB GridFS. Binary data is stored on disk, only 24-character keys are stored in object properties (avoiding memory bloat).

```typescript
// Write binary data, get back a 24-char key
const blobKey = await $blob.write(base64Data, {
  contentType: 'image/png',
  filename: 'avatar.png',
  createdBy: player.id
});
player.avatarBlobKey = blobKey;  // Only 24 chars in memory, not 2MB!

// Read binary data (returns base64)
const base64Data = await $blob.read(blobKey);

// Get blob metadata
const meta = await $blob.meta(blobKey);
// { key, filename, contentType, length, uploadDate, metadata }

// Check if blob exists
const exists = await $blob.exists(blobKey);

// Delete blob
await $blob.delete(blobKey);

// Generate URL for web access
const url = $blob.url(blobKey, 'thecontinuum.city');
// https://thecontinuum.city/blob/507f1f77bcf86cd799439011
```

**Typical workflow (e.g., avatar generation in chargen):**
```typescript
// Fetch image from AI service
const imageResp = await $http.getBinary('https://ai-service.com/generate?prompt=...');

// Store in blob storage
const blobKey = await $blob.write(imageResp.body, {
  contentType: imageResp.contentType,
  filename: 'avatar.png'
});

// Store only the key in player prop (not the 2MB image!)
player.avatarBlobKey = blobKey;

// Player can view at: https://faction.domain/blob/{blobKey}
```

### $aiImageGen - AI Image Generation Object

Generate images using Google's Gemini API (Nano Banana) and store them in `$blob`:

```typescript
// Generate image and store in $blob
const result = await $aiImageGen.generate('A cyberpunk banana with neon lights');
// { success: true, blobKey: '...', contentType: 'image/png', prompt: '...' }

// Get URL for the generated image
const url = $blob.url(result.blobKey, 'thecontinuum.city');

// Generate with options
const result = await $aiImageGen.generate('A glowing orb', {
  model: 'gemini-3-pro-image-preview',  // Use Nano Banana Pro
  metadata: { createdBy: player.id },
  filename: 'orb.png'
});

// Generate without storing (returns base64 directly)
const raw = await $aiImageGen.generateRaw('A simple icon');
// { success: true, data: 'base64...', contentType: 'image/png' }

// List available models
const models = $aiImageGen.listModels();
// [{ id: 'gemini-2.0-flash-exp-image-generation', name: '...', tier: 'free' }, ...]

// Change default model
$aiImageGen.setDefaultModel('gemini-3-pro-image-preview');
```

**Environment:** Requires `GEMINI_API_KEY` environment variable.

**Available models:**
- `gemini-2.0-flash-exp-image-generation` (default, free tier)
- `gemini-2.5-flash-image` - Nano Banana (free tier)
- `gemini-3-pro-image-preview` - Nano Banana Pro (free tier)
- `imagen-4.0-generate-001` - Imagen 4.0 (paid)
- `imagen-4.0-ultra-generate-001` - Imagen 4.0 Ultra (paid)

All transports require authentication. Players must first register via `POST /register` on the faction's HTTP server, then connect via WebSocket or Session MCP with their credentials. Connections are tagged with `factionId` for routing to the correct character generation flow.
