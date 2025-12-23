# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Malice is a modern TypeScript-based Text MOO (Multi-User Object-Oriented) game engine inspired by LambdaMOO. It uses MongoDB for persistence, RxJS for reactive patterns, and TypeScript for both server code and in-database method execution.

## Common Commands

```bash
# Development
npm start           # Start server (Node.js with tsx)
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
- `#0` - `$` - ObjectManager itself (stores aliases, provides `$load`, `$create`, `$query`)
- `#1` - Root - Base of all inheritance
- `#2` - System - Routes new connections to AuthManager
- `#3` - Programmer - Wizard-level access, can build world

Objects have:
- **Properties**: Typed values (string, number, boolean, objref, array, object)
- **Methods**: TypeScript code strings compiled and executed at runtime
- **Parent**: Single prototype inheritance chain (walks up to find properties/methods)

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
$query(system, prompt, session?)        // Query Claude AI with MCP tools
$.telnet     // Native telnet session management (admin use)
$<alias>     // Pre-resolved aliases: $room, $exit, $player, $recycler, $session, etc.
```

### Key Directories

- `src/database/` - Object system core (`RuntimeObject`, `ObjectManager`, `ObjectCache`, `ObjectDatabase`)
- `src/database/bootstrap/` - World/prototype builders run at startup
- `src/transport/` - Telnet, WebSocket, TLS servers
- `src/game/` - `GameCoordinator` (startup orchestration), `ConnectionContext` (player session)
- `src/mcp/` - MCP servers for Claude Code integration
- `src/devtools/` - VS Code extension server (WebSocket JSON-RPC)
- `src/lsp/` - LSP API server for IDE features
- `types/` - TypeScript type definitions

### Servers and Ports

- **5555** - Telnet server (player connections)
- **5556** - SSH server (secure player connections with key auth)
- **8080** - WebSocket server (web clients)
- **3000** - LSP REST API (VS Code extension)
- **3010** - MCP server for Claude Code (code-first: execute_moo_code, admin access)
- **3012** - Session MCP server (code-first: execute_session_code, sandboxed player access)
- **9999** - DevTools WebSocket (VS Code extension)

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
  ├─ shoulders → arms → forearms → hands → fingers
  ├─ thighs → knees → legs → feet
  └─ groin, chest, abdomen, back
```

Each sensory organ has capability methods that propagate up:
- `head.canSmell()` → `face.nose.canSmell()`
- `head.canTaste()` → `face.mouth.canTaste()` → `mouth.tongue.canTaste()`
- `embodied.smell(message)` checks `head.canSmell()` before processing

## MCP Integration

The MCP server at port 3010 provides a code-first interface for Claude Code to interact with the MOO world.

### Architecture

- **Port 3010** - Main MCP server (admin/builder access, code-first)
- **Port 3012** - Session MCP server (player access, action-based)

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

### Code-First Execution

Instead of calling individual tools, write MOO code that uses all available tools:

```typescript
// Authenticated - access your player
const myRoom = player.location;
console.log(`You are in: ${myRoom.name}`);

// Create a room and link it
const room = await $mcp.dig({
  name: 'Hallway',
  description: 'A long hallway',
  x: 0, y: 1, z: 0
});

// Spawn items
await $mcp.spawn_item({
  prototypeId: '$torch',
  roomId: '#' + room.room.id
});

// List available tools
const tools = await $mcp.listTools();
```

### Available in Execution Context

- `$mcp.toolName(params)` - Call any MCP tool (dig, spawn_item, set_property, etc.)
- `$mcp.listTools()` - List all available tools
- `$` - Object manager
- `$load(id)` - Load object by ID
- `$create({parent, properties})` - Create new object
- `$alias` shortcuts - `$room`, `$player`, `$exit`, etc.
- `player` - Your authenticated player object (if HTTP Basic Auth provided)

### MCP Resources

The MCP server provides moo:// resources for querying game state:

**Meta Resources:**
- `moo://tools` - List all available MCP tools
- `moo://aliases` - List all object aliases

**Object Resources:**
- `moo://objects/{id}` - Get object details (#42 or 42)
- `moo://alias/{name}` - Get object by alias (e.g., moo://alias/player)

**Room Resources:**
- `moo://rooms/{id}` - Get room state with exits, contents, and players

**Player Resources:**
- `moo://players` - List all player characters

**AI/NPC Resources:**
- `moo://ai` - List all AI-controlled NPCs
- `moo://ai/{id}` - Get AI NPC profile with personality and memories

**Plot Resources:**
- `moo://plots` - List all active plots
- `moo://plots/{id}` - Get plot details and events

Use `mcp__malice__*` tools to interact with the running game server.
