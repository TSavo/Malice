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
$<alias>     // Pre-resolved aliases: $room, $exit, $player, $recycler, etc.
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
- **8080** - WebSocket server (web clients)
- **3000** - LSP REST API (VS Code extension)
- **3001** - MCP server for Claude Code (`malice-moo` tools)
- **3002** - CharGen MCP server (AI character creation)
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

## MCP Integration

The MCP server at port 3001 provides tools for Claude Code to interact with the MOO world:
- Object CRUD operations
- Room/exit management
- Player/NPC management
- AI human spawning
- Plot/job management
- Notes system
- World queries with DSL

Use `mcp__malice__*` tools to interact with the running game server.
