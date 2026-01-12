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

# Image Generation
bun scripts/generate-room-images.ts                 # Generate images for all rooms
bun scripts/generate-room-images.ts --dry-run       # Preview what would be generated
bun scripts/generate-room-images.ts --limit 10      # Generate max 10 images
bun scripts/generate-room-images.ts --world-only    # Only world rooms
bun scripts/generate-room-images.ts --buildings-only # Only building rooms
bun scripts/generate-room-images.ts --underground   # Only underground rooms (z < 0)
bun scripts/generate-room-images.ts --surface       # Only surface rooms (z >= 0)
bun scripts/generate-room-images.ts --parallel 3    # Process 3 rooms concurrently (default: 2)

# Image Compression
bun scripts/compress-images.ts                      # Compress all images (lossless PNG optimization)
bun scripts/compress-images.ts --dry-run            # Preview compression without changes
bun scripts/compress-images.ts --parallel 4         # Process 4 images concurrently
bun scripts/compress-images.ts --limit 10           # Process max 10 images
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

**AI Services:**
- **3020** - Midjourney API server (Discord bot proxy, exposed for debugging/direct access)

### Midjourney API Server

The Midjourney API server (`midjourney-api` service) runs as a Docker container and provides a REST API for generating images via Discord's Midjourney bot. It requires a Discord account with an active Midjourney subscription.

**Setup:**
1. Get Discord credentials:
   - `SALAI_TOKEN` - Your Discord token (DevTools > Application > Local Storage > token)
   - `SERVER_ID` - Discord server ID where Midjourney bot is present
   - `CHANNEL_ID` - Channel ID for sending Midjourney commands
2. Add to `.env`:
   ```bash
   MIDJOURNEY_SERVER_ID=your_discord_server_id
   MIDJOURNEY_CHANNEL_ID=your_discord_channel_id
   MIDJOURNEY_SALAI_TOKEN=your_discord_token
   MIDJOURNEY_DEBUG=false
   HUGGINGFACE_TOKEN=hf_xxxxxxxxxx  # Optional: for human verification
   ```
3. Start with Docker Compose:
   ```bash
   docker compose up midjourney-api
   ```

**API Endpoints:**
- `POST /generate` - Full pipeline: imagine → wait → upscale → return image
  - Body: `{ prompt, options?, upscaleIndex?, download? }`
  - Returns: `{ id, hash, uri, width, height, flags, content }`
- `GET /health` - Health check
  - Returns: `{ connected, status }`
- `GET /options` - Get available Midjourney options documentation

**Integration:**
The `$aiImageGen` MOO object uses this service internally. You don't need to call the API directly - just use `$aiImageGen.generate()` from MOO code.

**Image Compression:**
The server now uses oxipng for lossless PNG compression (~12% size reduction). All images returned by the API are automatically compressed before being served. This reduces storage costs and bandwidth without any quality loss.

See `midjourney-api/API.md` for full API documentation.

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
| `audio` | server→client | TTS audio segments for speech synthesis |
| `wm` | bidirectional | Window management (open/close/update windows) |
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
  if (ch === 'audio') handleTTS(p.segments);
};

// Send game input
ws.send(JSON.stringify({ ch: 'game', t: 'data', p: 'look' }));

// Send resize
ws.send(JSON.stringify({ ch: 'ctrl', t: 'data', p: { type: 'resize', w: 80, h: 24 } }));
```

### Showing Windows to Players

Players can be shown visual content in popup windows via the `player.show()` API. Windows can display either object images or HTML content, and can optionally persist across reconnects.

**Display an object's image:**
```typescript
// Show a locked door's image to the player
const lock = await $load(42);
player.show('lock', lock, {
  icon: '🔐',
  persist: true  // Adds to start menu, persists across reconnects
});
```

**Display HTML content:**
```typescript
// Show a document or custom UI
player.show('note', '<h1>Classified Memo</h1><p>Project UNUM is active...</p>', {
  icon: '📄',
  title: 'Classified Document',
  persist: false
});
```

**Close and hide windows:**
```typescript
player.close('lock');  // Closes window, keeps in start menu if persist was true
player.hide('note');   // Closes window AND removes from start menu
```

**How it works:**
- `show()` uses the `state` channel to send window data to the client
- Client renders a ShowWindow with the object's image or HTML content
- If `persist: true`, window config is stored in `player.windowLayout` and restored on reconnect
- For object-type windows, image URLs are refreshed on reconnect (content may have changed)
- For HTML-type windows, frame persists but content is not stored (to avoid stale/large data)

See `docs/city-ai/WINDOW-MANAGEMENT.md` for the lower-level `player.openWindow()` API which provides more control over window types (html, iframe, terminal) and configuration.

### Text-to-Speech (TTS)

Every object in the game can speak using the TTS system. Speech is broadcast as both text and audio to all players in the same location.

**Object Methods:**
```typescript
// Say something out loud (available on ALL objects via $describable)
npc.say("Hello there!");
player.say("Hi!");
vendingMachine.say("Please insert coins.");

// Get object's TTS voice ID (gender-aware, deterministic based on object ID)
const voice = obj.getVoiceId();
// Returns: 'speaker_123' (from 789 LibriTTS voices) or 'alloy' (fallback)

// Reroll to a different voice (increments voiceSeed)
const newVoice = await obj.rerollVoice();
// Optional gender override: await obj.rerollVoice('female') or rerollVoice('male')

// Manually set a specific voice
obj.setVoice('speaker_42');

// Set voice style for steerability (optional)
obj.voiceStyle = "speak slowly and menacingly";
```

**Location Broadcast:**
```typescript
// Broadcast audio segments to all players in location
room.broadcastAudio([
  { speaker: '42', speakerName: 'Bot', voiceId: 'speaker_123', text: 'Hello' },
  { speaker: '99', speakerName: 'Alice', voiceId: 'speaker_456', text: 'Hi there!', voiceStyle: 'cheerful' }
]);
```

**How it works:**
1. Any object calls `say(message)` - broadcasts text via `location.announce()` and audio via `location.broadcastAudio()`
2. Voice is **gender-aware**: objects with `sex` property get appropriate voices (374 female, 415 male)
3. Voice is **deterministic**: same object + voiceSeed always gets same voice
4. Audio segments sent to all players in location via `audio` channel
5. Client AudioManager receives segments, requests TTS from VibeVoice, and plays audio with volume controls

**Voice assignment:**
- Objects with `sex='female'` or `'F'` get female voices
- Objects with `sex='male'` or `'M'` get male voices
- Objects without `sex` get voices from all available voices
- 789 LibriTTS voices available (speaker_0 through speaker_788)
- Fallback to 6 built-in voices if TTS server unavailable: alloy, echo, fable, onyx, nova, shimmer

**Client-side AudioManager:**
The web client includes an `AudioManager` (served via `/js/audio-manager.js`) that handles TTS playback:
- Receives audio segments via `audio` channel
- Requests TTS from VibeVoice server (`http://host:8880/tts`)
- Queues and plays audio sequentially
- Per-object volume controls (0-1) persisted to localStorage
- Master volume control and global mute
- Sound settings UI accessible via taskbar button (🔊)
- Automatically registers new speakers as they're heard

**Volume controls:**
```javascript
// In browser console
malice.audio.setMasterVolume(0.8);           // 80% master volume
malice.audio.toggleMute();                   // Mute/unmute all audio
malice.audio.setObjectVolume('42', 0.5);     // Set speaker #42 to 50%
malice.audio.toggleObjectMute('42');         // Mute/unmute speaker #42
malice.audio.stop();                         // Stop playback, clear queue
malice.audio.toggleSettings();               // Show/hide settings UI
```

Settings are saved to `localStorage` under key `malice-audio-settings` and persist across sessions.

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
- All `$aliases` - `$room`, `$player`, `$exit`, `$ai`, `$plot`, `$spatial`, `$faction`, `$factionManager`, `$transports`, `$continuum`, `$cartel`, `$greeter`, furniture prototypes (`$bed`, `$table`, `$chair`, `$cabinet`, `$trunk`, `$crate`, `$locker`, `$bench`, `$couch`, `$safe`, `$furniture`), security (`$door`, `$lock`, `$biometricLock`, `$guardedExit`), utilities (`$http`, `$email`, `$blob`, `$tts`, `$aiImageGen`), etc.
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
- `greeterPoolMaintenance` - Replenishes greeter NPC pools every 5 minutes

## Greeter System ($greeter)

The `$greeter` singleton manages post-character-generation orientation for new players. It uses a **pool-based architecture** to pre-spawn clothed NPCs, eliminating spawn delays during player onboarding.

### Pool Architecture

Instead of spawning greeters on-demand (slow), the system maintains ready-to-assign pools:

```typescript
// Check pool status
const status = await $greeter.getPoolStatus();
// { continuum: 2, cartel: 2, target: 2, replenishing: {} }

// Pools are automatically maintained by the greeterPoolMaintenance scheduler job
// Manual replenishment if needed:
await $greeter.replenishPool('continuum');
await $greeter.replenishPool('cartel');

// Initialize pools (called at startup)
await $greeter.initializePools();
```

### Assigning Greeters

```typescript
// Assign a greeter to a player (instant from pool)
const greeter = await $greeter.spawnForPlayer(playerId, 'continuum');
// or
const greeter = await $greeter.spawnForPlayer(playerId, 'cartel');

// The greeter is automatically:
// - Assigned to the player
// - Configured with faction-specific system prompt
// - Introduced to the player in-character
```

### Tracking Orientation Progress

```typescript
// Start orientation (automatically called by spawnForPlayer)
await $greeter.startOrientation(playerId, greeterId);

// Update phase
await $greeter.updatePhase(playerId, 'walk-to-square');

// Complete orientation (returns greeter to pool)
await $greeter.completeOrientation(playerId);

// Player orientation state stored on player object:
player.orientation = {
  greeterId: 42,
  faction: 'continuum',
  phase: 'welcome',
  started: '2026-01-10T12:00:00Z',
  completedPhases: ['welcome', 'walk'],
  completedAt: '2026-01-10T12:30:00Z'  // Set when complete
};
```

### Pool Management Internals

The pool system works by:
1. **Background spawning**: `greeterPoolMaintenance` job runs every 5 minutes
2. **Pre-clothing**: NPCs are spawned with `clothed: true` via `$ai.spawn()`
3. **Ready state**: Pooled greeters are fully dressed and positioned at faction starting locations
4. **Instant assignment**: `acquireFromPool()` pops a ready greeter (O(1) operation)
5. **Auto-replenishment**: Pool refills in background after assignment
6. **Recycling**: Finished greeters are recycled (not reused) to avoid state contamination

```typescript
// Low-level pool operations (usually not needed directly)
const greeter = await $greeter.acquireFromPool('continuum');
await $greeter.returnToPool(greeterId);  // Recycles by default
await $greeter.spawnPooledGreeter('cartel');  // Spawn one greeter
```

### Faction-Specific Greeters

**Continuum** (Immigration Services):
- Role: `continuum-greeter`
- Names: Officer Chen, Officer Martinez, Officer Reyes, etc.
- Personality: Professional, efficient, by-the-book CorpSec officer
- Location: Immigration Services (#42)

**Gray Cartel** (Runner's Den):
- Role: `cartel-greeter`
- Names: Sparrow, Ghost, Flicker, Shadow, etc.
- Personality: Street-smart Runner who uses tunnel slang
- Location: Runner's Den (underground)

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

The game features an extensive underground tunnel network beneath Pioneer Square (Seattle's historic 1889 street level). The system spans multiple levels from z=-1 (building basements) down to z=-6 (ancient depths).

Rooms at z=-2 through z=-6 are procedurally generated from JSON (`underground-world-fresh-described-fixed.json`) via `UndergroundJsonBuilder`.

**Key levels:**
- **z=-1**: ~99 building basements - Surface building entry points (TypeScript-defined)
- **z=-2**: 326 upper tunnels - Dense corridor network across the entire district (Victorian railway, burial chambers)
- **z=-3**: 145 transitional passages - Deep passages, cisterns, and flooded zones
- **z=-4**: 51 lower passages - Gray Cartel operational territory (Armory, Medical Bay, Communications Center), Deep Cisterns (pre-fire water infrastructure)
- **z=-5**: 29 deep vaults - Secured cell bases
- **z=-6**: 10 ancient depths - Water table boundary, includes The Blind (ancient ritual chamber)

**Major sections:**
- Western Network (Gray Cartel core territory)
- Waterfront Underground (piers and tidal caves)
- Eastside Underground (steam tunnels and utility infrastructure)
- Yesler Underground (prohibition-era passages)
- King Street Underground (rail platform connections)
- Chinatown Underground (historic Chinese tunnels, gambling dens, opium passages)
- Underground Tour (preserved tourist route, buried storefronts, homeless shelter areas)

**Surface entry points:**
- Fabrication Factory (-21, +10) - Public Services → Fab Basement
- Smith Tower (-2, +9) - Internal escape tunnel
- Occidental Square (-3, +2) - Gallery trapdoor → Occ Cross
- Supply Depot (-21, -5) - Loading floor hatch → South Tunnel
- Yesler Way grating (-7, +12) - Hidden grating → shaft
- 4th Avenue utility hatch (+14, 0) - Utility access
- King Street Station (+4, -12) - Platform service shaft
- Trinity Nightclub (-8, +3) - Underground exit → Occ S1
- Underground Tour building (-15, -2) - Tour entrance → Descent → Tour Start
- **Corp Construction** (+0 to +6, +1 to +4, z=0) - Continuum research facility with elevator access to levels -1 through -3

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
- Supply Depot emergency reserves (-20, -5, -1) → east to underground
- Terra Nova Gallery art vault (-16, -5, -1) → north to underground
- Zeitgeist Coffee basement (-10, 11, -1) → underground breach

See `docs/city-ai/MAP-UNDERGROUND.md` for detailed maps, room coordinates, and territorial information.

### Corp Construction - Project Foundation

**Corp Construction** is a Continuum research facility disguised as a civic center construction site. Located at coordinates (+0 to +6, +1 to +4), it spans four vertical levels from the surface (z=0) down to z=-3.

**Surface Level (z=0):**
- Fenced construction site with armed private security
- Billboard announces "FUTURE HOME OF CONTINUUM CIVIC CENTER"
- Entry gate at (+6, +1) near 3rd Ave S
- Guard post, equipment yard, office trailers

**Level -1 (Construction Zone):**
- Active construction with blast-resistant reinforced walls
- Containment anteroom with hazmat equipment and decontamination shower
- Primary containment room with observation windows overlooking the artifact chamber
- Vault doors and biometric access controls

**Level -2 (Infrastructure & Research):**
- Infrastructure hub with life support systems
- Observation deck overlooking the artifact chamber
- Data center monitoring multiple global sites (Chicago, London, Tokyo)
- Research archives with historical documents dating back to the 1889 Great Seattle Fire

**Level -3 (Research - Restricted, Director Authorization Only):**
- Bio-Integration Lab studying tissue transformation
- Physics Lab with anomalous artifact shard
- Materials Lab developing impossible materials
- Psychology Wing studying consciousness contact
- Sensory Isolation Chamber for artifact communication

**The Artifact:**
The facility conceals **Project Foundation** - Continuum's study of ancient artifacts discovered beneath Seattle and other cities worldwide. The Seattle artifact is a structure of black stone and corroded metal that predates human settlement, exhibiting impossible properties: negative mass, temporal variance, and signs of consciousness. The artifact is growing at 0.3mm/day and was first excavated in 2024.

**Access:**
- Surface entry via gate at 3rd Ave S & Main St (+6, +1, z=0)
- Elevator shaft connects all four levels
- Underground levels require director-level authorization
- Not connected to the general underground tunnel network

**Story Integration:**
This is a classified Continuum facility. Most NPCs know only the surface cover story ("civic center construction, over budget, behind schedule"). Only director-level Continuum personnel know about the underground research levels and the artifact.

See `src/database/bootstrap/world/seattle/pioneer-square/buildings/corp-construction/` for full room definitions.

## Web Map Visualizer

The server provides 3D map visualization at:

- **`/map`** - Public map (above-ground rooms, population heatmap)
- **`/admin/map`** - Admin map (all rooms including underground, individual agents) - requires HTTP Basic Auth

The map dynamically fetches live data from the API endpoints below.

**Features:**
- Rooms rendered as 3D cubes with height-based coloring
- Exit connections shown as red tubes between rooms
- Population heatmap (5x5 grid aggregation)
- Agent markers (green = player, blue = NPC)
- View controls: Top, Side, Reset
- Auto-refresh toggle: 30s (public), 3s (admin)
- Loading and error states with retry

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

## Email, HTTP, Blob, TTS, and AI Image Objects

MOO objects for external communication, blob storage, text-to-speech, and AI image generation. These are proper MOO objects (not injected TypeScript classes) - their methods use native `fetch`, `await import('resend')`, and `await import('mongodb')` for GridFS.

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

### $tts - Text-to-Speech Voice Manager

Manages TTS voices using VibeVoice (self-hosted voice cloning server). Provides 789 LibriTTS voices (374 female, 415 male) plus 6 built-in voices.

```typescript
// List all available voices
const voices = await $tts.listVoices();
// [{ voice_id: 'speaker_0', name: 'speaker_0' }, ...]

// Get voice stats
const stats = await $tts.getVoiceStats();
// { female: 374, male: 415, total: 789, builtin: 6 }

// Get gender-specific voices
const femaleVoices = await $tts.getFemaleVoices();
// ['speaker_0', 'speaker_2', ...]
const maleVoices = await $tts.getMaleVoices();
// ['speaker_1', 'speaker_3', ...]

// Get voice for gender (deterministic based on object ID + seed)
const voice = await $tts.getVoiceForGender('female', objectId, seed);
// Returns: 'speaker_42'

// Add a custom voice from audio sample
const result = await $tts.addVoice('villain', audioBase64, 'wav');
// { success: true, voice_id: 'villain' }

// Generate speech audio
const audio = await $tts.speak('Hello world', 'speaker_42', { speed: 1.0 });
// { success: true, audio: 'base64...', contentType: 'audio/wav' }

// Check voice exists
const exists = await $tts.hasVoice('speaker_42');

// Get voice info
const info = await $tts.getVoice('speaker_42');
// { voice_id: 'speaker_42', name: 'speaker_42' }

// Check TTS server health
const health = await $tts.health();
// { healthy: true, model: '...', gpu_available: true, ... }
```

**Key features:**
- **Gender-aware selection**: Automatically matches voices to character gender
- **Deterministic assignment**: Same objectId + seed = same voice
- **Voice cloning**: Add custom voices from audio samples
- **Built-in fallback**: 6 voices (alloy, echo, fable, onyx, nova, shimmer) if server unavailable
- **30-min cache**: Gender data cached for performance

**Environment:**
- `VIBEVOICE_URL` - VibeVoice server URL (default: `http://vibevoice-server:8880`)

### $aiImageGen - AI Image Generation Object

Generate images using Midjourney and store them in `$blob`. All generated images are automatically compressed using lossless PNG optimization (oxipng) by the Midjourney API server before storage.

```typescript
// Generate image and store in $blob
const result = await $aiImageGen.generate('A cyberpunk banana with neon lights');
// { success: true, blobKey: '...', contentType: 'image/png', prompt: '...', uri: 'https://...' }

// Get URL for the generated image
const url = $blob.url(result.blobKey, 'thecontinuum.city');

// Generate with Midjourney-specific options
const result = await $aiImageGen.generate('A glowing orb in a dark forest', {
  aspectRatio: 'portrait',               // 'landscape', 'portrait', 'square', or '16:9', '9:16', '1:1'
  stylize: 750,                          // 0-1000, artistic influence (default: 100)
  chaos: 25,                             // 0-100, variation/randomness (default: 0)
  no: 'people, text',                    // Elements to exclude from image
  version: '7',                          // '5', '6', '6.1', '7', 'niji6', etc. (default: 7)
  style: 'raw',                          // 'raw' or 'scenic'
  upscaleIndex: 2,                       // 1-4, which image from grid to use (default: 1)
  metadata: { createdBy: player.id },
  filename: 'orb.png'
});

// Generate without storing (returns base64 directly)
const raw = await $aiImageGen.generateRaw('A simple icon');
// { success: true, data: 'base64...', contentType: 'image/png', uri: '...' }

// List available Midjourney versions
const models = $aiImageGen.listModels();
// [
//   { id: '7', name: 'Midjourney v7 (latest)', tier: 'quality', default: true },
//   { id: '6.1', name: 'Midjourney v6.1', tier: 'quality' },
//   { id: 'niji6', name: 'Niji 6 (anime)', tier: 'specialty' },
//   ...
// ]

// Change default version
$aiImageGen.setDefaultModel('6.1');

// Check API health
const health = await $aiImageGen.health();
// { success: true, connected: true, status: '...' }

// Get available options documentation
const options = await $aiImageGen.getOptions();
```

**Environment:** Requires Midjourney API server (see "Midjourney API Server" section below).

**Environment variables:**
- `MIDJOURNEY_SERVER_ID` - Discord server ID
- `MIDJOURNEY_CHANNEL_ID` - Discord channel ID
- `MIDJOURNEY_SALAI_TOKEN` - Discord authentication token
- `MIDJOURNEY_DEBUG` - Enable debug logging (optional)
- `HUGGINGFACE_TOKEN` - For human verification (optional)
- `MIDJOURNEY_API_URL` - API server URL (default: `http://midjourney-api:3000`)

**Available Midjourney versions:**
- `7` - Midjourney v7 (latest, default)
- `6.1` - Midjourney v6.1
- `6` - Midjourney v6
- `5.2` - Midjourney v5.2
- `niji6` - Niji 6 (anime style)
- `niji5` - Niji 5 (anime style)

**Midjourney options:**
- `aspectRatio` - Image dimensions: 'landscape' (16:9), 'portrait' (9:16), 'square' (1:1), or custom ratio
- `stylize` - Artistic influence (0-1000, default: 100). Higher = more artistic interpretation
- `chaos` - Variation/randomness (0-100, default: 0). Higher = more varied results
- `no` - Comma-separated list of elements to exclude (e.g., 'people, text, watermarks')
- `version` - Midjourney version to use
- `style` - 'raw' (less opinionated) or 'scenic' (more artistic)
- `seed` - Deterministic seed for reproducible results
- `quality` - Image quality setting
- `weird` - Weirdness factor for experimental results
- `tile` - Enable seamless tiling
- `upscaleIndex` - Which image from 2x2 grid to upscale (1-4, default: 1)

All transports require authentication. Players must first register via `POST /register` on the faction's HTTP server, then connect via WebSocket or Session MCP with their credentials. Connections are tagged with `factionId` for routing to the correct character generation flow.
