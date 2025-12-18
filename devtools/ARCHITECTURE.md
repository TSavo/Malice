# Malice DevTools Architecture

Complete architectural overview of the DevTools system.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Tree View   │  │Virtual FS    │  │  LSP Client      │  │
│  │  (Objects)   │  │(malice://)   │  │  (IntelliSense)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼───────────────────┼────────────┘
          │                  │                   │
          │ WebSocket        │ WebSocket         │ stdio/IPC
          │ :9999            │ :9999             │
          │                  │                   │
┌─────────┴──────────────────┴───────────────────┴────────────┐
│              Malice v2 Server (Bun/Node)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              DevTools Layer                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │ DevTools    │  │   Type      │  │    LSP      │  │   │
│  │  │ Server      │  │ Generator   │  │   Server    │  │   │
│  │  │ (JSON-RPC)  │  │  (.d.ts)    │  │ (Language)  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  └─────────┼────────────────┼────────────────┼─────────┘   │
│            └────────────────┴────────────────┘             │
│                             ↓                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           ObjectManager (Shared)                     │   │
│  │  - Stable Proxy Cache: Map<ObjId, RuntimeObject>     │   │
│  │  - In-memory state = source of truth                 │   │
│  │  - Background persistence to MongoDB                 │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────┴─────────────────────────────────┐   │
│  │              Game Layer                              │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  GameCoordinator                               │  │   │
│  │  │    ├─ TelnetServer  (port 5555)                │  │   │
│  │  │    └─ WebSocketServer (port 8080)              │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ↓
          ┌──────────────────────────────┐
          │        MongoDB :27017         │
          │  ┌────────────────────────┐  │
          │  │  objects collection    │  │
          │  │  - GameObject docs     │  │
          │  │  - Persistence only    │  │
          │  └────────────────────────┘  │
          └──────────────────────────────┘
```

## Core Architecture: Stable Proxy Pattern

**There is one source of truth: in-memory state.**

### Key Principles

1. **On startup, `loadAll()` loads everything from MongoDB into memory as stable proxies**
2. **Any change to in-memory state persists immediately to DB in the background**
3. **There is NO multi-server setup** - single server architecture
4. **There are NO external changes coming from the DB**
5. **Stable Proxy Pattern**: Once a proxy is created, it's never evicted, never recreated
6. **`load()` is effectively a synchronous in-memory lookup after startup**

### Why No Change Streams?

- Single server = no need for cross-server invalidation
- In-memory state IS the truth, DB is just persistence
- Simpler, faster, no MongoDB replica set requirement

## Data Flow

### 1. Reading an Object (VS Code → In-Memory)

```
VS Code Extension
  ↓ (send JSON-RPC request)
DevToolsServer.handle({ method: "object.get", params: { id: 3 } })
  ↓ (thin wrapper)
ObjectManager.load(3)
  ↓ (in-memory lookup - always a cache hit after startup)
Return stable RuntimeObject proxy
  ↓ (return)
VS Code receives GameObject JSON
```

After `loadAll()` on startup, `load()` is essentially synchronous - it just returns the cached proxy.

### 2. Writing an Object (VS Code → In-Memory → MongoDB)

```
VS Code Extension (save method)
  ↓ (send JSON-RPC request)
DevToolsServer.handle({ method: "method.set", params: { objectId: 3, name: "onInput", code: "..." } })
  ↓ (thin wrapper)
RuntimeObject.setMethod("onInput", { code: "..." })
  ↓ (in-memory update)
Proxy state updated immediately
  ↓ (background persistence)
ObjectDatabase.update(3, { ... }) → MongoDB
  ↓
Write complete ✓
```

The key insight: changes are visible immediately in-memory. MongoDB persistence happens in the background.

### 3. Type Generation (In-Memory → VS Code)

```
DevTools client requests types
  ↓
TypeGenerator.generate()
  ↓ (iterates in-memory cache)
ObjectManager.cache → All RuntimeObjects
  ↓ (for each object)
Generate TypeScript interface
  ↓ (combine all)
Complete .d.ts file
  ↓ (send to client)
DevToolsServer sends response
  ↓ (WebSocket)
VS Code Extension receives types
  ↓ (write file)
.malice/generated.d.ts written
  ↓ (TypeScript engine reloads)
IntelliSense updated ✓
```

## Component Responsibilities

### DevToolsServer (`src/devtools/devtools-server.ts`)

**Purpose:** JSON-RPC WebSocket server

**Responsibilities:**
- ✅ Accept WebSocket connections (port 9999)
- ✅ Parse JSON-RPC requests
- ✅ Route to appropriate ObjectManager methods
- ✅ Return JSON-RPC responses
- ✅ Broadcast notifications to all clients
- ❌ NO business logic
- ❌ NO direct MongoDB access (uses ObjectManager)

**Methods:**
```typescript
class DevToolsServer {
  start(): void                                    // Start WebSocket server
  handle(msg: JsonRpcRequest): JsonRpcResponse    // Route requests
  broadcast(notification: JsonRpcNotification)    // Send to all clients

  // Thin wrappers around ObjectManager:
  private listObjects()                           // → manager.db.listAll()
  private getObject(id)                           // → manager.load(id)
  private setMethod(id, name, code)               // → obj.setMethod()
  // ... etc
}
```

### TypeGenerator (`src/devtools/type-generator.ts`)

**Purpose:** Generate TypeScript definitions from in-memory objects

**Responsibilities:**
- ✅ Query ObjectManager cache for all objects
- ✅ Infer TypeScript types from property values
- ✅ Generate interface per object
- ✅ Generate ObjectManager interface with aliases
- ✅ Return complete .d.ts file as string
- ❌ NO file writing (VS Code extension does that)

**Methods:**
```typescript
class TypeGenerator {
  constructor(objectManager: ObjectManager)

  async generate(): Promise<string>              // Full .d.ts file

  private generateObjectInterface(obj: GameObject): string
  private generateObjectManagerInterface(): string
  private generateBaseTypes(): string
  private inferType(value: any): string
}
```

### LSP Server (`src/devtools/lsp-server.ts`) - Phase 2

**Purpose:** Language Server Protocol for IntelliSense

**Responsibilities:**
- ✅ Handle LSP requests (textDocument/completion, hover, etc.)
- ✅ Query ObjectManager for object properties/methods
- ✅ Walk prototype chains for inheritance
- ✅ Use TypeScript language service for type checking
- ✅ Return completion items, hover info, diagnostics

**Methods:**
```typescript
class MaliceLSP {
  constructor(objectManager: ObjectManager)

  async getCompletions(uri: string, position: Position): Promise<CompletionItem[]>
  async getHover(uri: string, position: Position): Promise<Hover>
  async getDiagnostics(uri: string): Promise<Diagnostic[]>

  private resolveProperties(objectId: number): Promise<Property[]>
  private parseUri(uri: string): [objectId: number, methodName: string]
}
```

### ObjectManager (`src/database/object-manager.ts`)

**Purpose:** Single source of truth for game objects (in-memory)

**Responsibilities:**
- ✅ Load all objects into memory on startup via `loadAll()`
- ✅ Maintain stable proxy cache (proxies never evicted)
- ✅ Provide synchronous access via `getSync(id)`
- ✅ Background persistence to MongoDB
- ✅ Manage aliases ($.system, $.recycler, etc.)
- ✅ Expose `db` property for DevTools direct access

**Key Properties:**
```typescript
class ObjectManager {
  public readonly db: ObjectDatabase              // For DevTools/bootstrap
  private cache: ObjectCache                      // Stable proxy cache
  private aliases: Map<string, RuntimeObject>     // Dynamic aliases

  async loadAll(): Promise<void>                  // Load everything on startup
  async load(id: ObjId): Promise<RuntimeObject>   // Get proxy (cache hit after loadAll)
  getSync(id: ObjId): RuntimeObject | null        // Synchronous lookup
  invalidate(id: ObjId): void                     // Clear transient caches only
}
```

**Stable Proxy Pattern:**
```typescript
// After loadAll(), this is essentially synchronous:
const obj = await manager.load(42);  // Returns cached proxy

// The same proxy is always returned:
const obj1 = await manager.load(42);
const obj2 = await manager.load(42);
obj1 === obj2  // true - same proxy reference

// Proxies are never evicted:
// Old references remain valid forever
```

### ObjectDatabase (`src/database/object-db.ts`)

**Purpose:** MongoDB persistence layer

**Responsibilities:**
- ✅ Connect to MongoDB
- ✅ CRUD operations on `objects` collection
- ✅ Sequential ID allocation via `getNextId()`
- ❌ NO caching (that's ObjectManager's job)
- ❌ NO change streams (single server, in-memory is truth)

**Key Methods:**
```typescript
class ObjectDatabase {
  async connect(): Promise<void>
  async get(id: ObjId): Promise<GameObject | null>
  async update(id: ObjId, updates: Partial<GameObject>): Promise<void>
  async listAll(): Promise<GameObject[]>
  async getNextId(): Promise<ObjId>               // Sequential allocation
}
```

### Object Lifecycle: $.recycler

**All object creation and destruction goes through `$.recycler`:**

```typescript
// Creating objects:
const newObj = await $.recycler.allocate(parentId);

// Recycling objects (soft delete, ID can be reused):
await $.recycler.recycle(objectId);
```

The database layer does NOT have recycle methods - all lifecycle management is handled by the in-game `$.recycler` object.

## Security Boundaries

```
┌─────────────────────────────────────────────┐
│  Trusted Zone (localhost only)              │
│  ┌────────────┐        ┌─────────────────┐ │
│  │  VS Code   │◄──────►│ DevTools Server │ │
│  │ Extension  │  :9999 │  (localhost)    │ │
│  └────────────┘        └────────┬────────┘ │
│                                 │          │
│  ┌──────────────────────────────┼────────┐ │
│  │    ObjectManager (shared)    │        │ │
│  └──────────────────────────────┼────────┘ │
│                                 │          │
└─────────────────────────────────┼──────────┘
                                  │
                    ┌─────────────┴────────────┐
                    │      MongoDB             │
                    │  (localhost:27017)       │
                    │  Authentication required │
                    └──────────────────────────┘
```

**Security layers:**
1. DevTools binds to 127.0.0.1 only
2. MongoDB binds to 127.0.0.1 only
3. Optional token auth for DevTools
4. SSH tunneling for remote access
5. Disabled in production (NODE_ENV check)

## Performance Characteristics

### Memory Usage

| Component | Memory Footprint |
|-----------|-----------------|
| ObjectManager cache | O(n) objects - ALL objects loaded |
| TypeGenerator | O(n) during generation, 0 after |
| DevToolsServer | O(m) connected clients |

**Total:** All objects in memory (~10-50MB for typical game)

### Latency

| Operation | Latency |
|-----------|---------|
| load() after startup | <0.1ms (in-memory lookup) |
| getSync() | <0.1ms (synchronous) |
| Property/method access | <0.1ms (in-memory) |
| MongoDB persistence | ~5-10ms (background, non-blocking) |
| Type generation | ~100ms for 1000 objects |

### Why This Is Fast

- **No cache misses after startup** - everything is loaded
- **No MongoDB queries during gameplay** - only background writes
- **Stable proxies** - no object recreation overhead
- **Synchronous access** - `getSync()` for hot paths

## Failure Modes

### MongoDB Connection Loss

**Symptom:** Background persistence fails

**Detection:** MongoDB driver throws connection errors

**Impact:** 
- Game continues running (in-memory state is fine)
- Changes not persisted until reconnection
- Recovery: reconnect and flush pending writes

### Stale Data Suspicion

**Symptom:** Data seems incorrect

**Detection:** Compare in-memory state with MongoDB

**Recovery:** With stable proxy pattern, this should not occur.
If suspected, use surgical invalidation:
```typescript
objectManager.invalidate(id); // Invalidates compiled methods and parent chains
```

**Impact:** Minimal - only clears transient caches for one object

## Testing Strategy

### Unit Tests

- `ObjectManager.load()` returns cached proxy
- `ObjectManager.getSync()` returns synchronous lookup
- `ObjectManager.invalidate()` clears transient caches
- `TypeGenerator.generate()` produces valid TypeScript
- `DevToolsServer.handle()` routes to correct methods

### Integration Tests

- Full bootstrap → all objects loaded
- DevTools edits → changes visible immediately
- Concurrent property updates

### End-to-End Tests

- Start full stack (MongoDB + Game + DevTools)
- Connect VS Code extension
- Edit object method
- Verify game executes new code
- Verify types regenerated

## Monitoring & Observability

### Metrics to Track

```typescript
// Cache statistics
objectManager.getCacheSize()           // Should equal total object count

// Performance
avgLoadLatency                         // Should be <1ms after startup
pendingWritesCount                     // Background writes queued
typeGenerationDuration                 // Time to regenerate .d.ts
```

### Logging

```typescript
// ObjectManager
console.log(`[ObjectManager] Loaded ${count} objects`);
console.log(`[ObjectManager] Invalidating transient caches for #${id}`);

// DevToolsServer
console.log(`[DevTools] Client connected`);
console.log(`[DevTools] method.set: object #${id}.${methodName}`);
```

## Deployment Topology

### Development (Single Machine)

```
Laptop
  ├─ MongoDB (Docker or local)
  ├─ Malice Server (bun run dev)
  │   ├─ Game (port 5555)
  │   └─ DevTools (port 9999)
  └─ VS Code + Extension
```

### Shared Dev Server (Remote)

```
Dev Server                      Developer's Laptop
  ├─ MongoDB (localhost)          ├─ VS Code
  ├─ Malice Server                │
  │   ├─ Game (5555)              └─ SSH Tunnel
  │   └─ DevTools (9999)              ↓
  │                           ssh -L 9999:localhost:9999
```

### Production (Single Server)

```
Production Server
  ├─ MongoDB (localhost, authenticated)
  └─ Malice Server
      └─ Game (port 5555)
      (NO DevTools in production)
```

**Note:** DevTools disabled in production (`NODE_ENV=production`)

## Summary

**Key Architectural Principles:**

1. **In-Memory = Single Source of Truth**
   - All objects loaded on startup via `loadAll()`
   - MongoDB is persistence layer only
   - No external changes to watch for

2. **Stable Proxy Pattern**
   - Proxies never evicted, never recreated
   - Old references remain valid forever
   - `load()` is synchronous after startup

3. **Single Server Architecture**
   - No multi-server sync needed
   - No change streams
   - Simpler, faster, more reliable

4. **$.recycler = Object Lifecycle**
   - All creation via `$.recycler.allocate()`
   - All destruction via `$.recycler.recycle()`
   - No lifecycle methods in DB/Manager layer

5. **DevTools = Thin Transport**
   - No business logic
   - Just JSON-RPC ↔ ObjectManager translation

6. **Security = Network Isolation**
   - Localhost-only by default
   - SSH tunneling for remote access
   - Disabled in production

**This architecture enables:**
- ✅ Live editing without restarts
- ✅ Sub-millisecond object access
- ✅ Real-time IntelliSense from live data
- ✅ Zero-copy deployment (edits are permanent)
- ✅ Simple single-server deployment
