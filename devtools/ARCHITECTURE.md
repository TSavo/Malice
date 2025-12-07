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
│  │  - Cache: Map<ObjId, RuntimeObject>                  │   │
│  │  - Change Stream Watcher                             │   │
│  │  - Cache Invalidation                                │   │
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
          │  │  - Change stream       │  │
          │  └────────────────────────┘  │
          └──────────────────────────────┘
```

## Data Flow

### 1. Reading an Object (VS Code → MongoDB)

```
VS Code Extension
  ↓ (send JSON-RPC request)
DevToolsServer.handle({ method: "object.get", params: { id: 3 } })
  ↓ (thin wrapper)
ObjectManager.load(3)
  ↓ (check cache)
Cache hit? → Return cached RuntimeObject
Cache miss? → Query MongoDB
  ↓
MongoDB.findOne({ _id: 3 })
  ↓
RuntimeObject created & cached
  ↓ (return)
VS Code receives GameObject JSON
```

### 2. Writing an Object (VS Code → MongoDB → Other Servers)

```
VS Code Extension (save method)
  ↓ (send JSON-RPC request)
DevToolsServer.handle({ method: "method.set", params: { objectId: 3, name: "onInput", code: "..." } })
  ↓ (thin wrapper)
ObjectDatabase.update(3, { methods.onInput: "..." })
  ↓
MongoDB.updateOne({ _id: 3 }, { $set: { ... } })
  ↓ (write complete)
ObjectManager.invalidate(3) ← Clear local cache
  ↓
MongoDB Change Stream fires
  ↓ (broadcasts to all watchers)
  ├─→ Game Server 1: ObjectManager.invalidate(3)
  ├─→ Game Server 2: ObjectManager.invalidate(3)
  └─→ DevTools Server 2: ObjectManager.invalidate(3)
      ↓
  All servers' caches cleared
      ↓
  Next load(3) reads fresh data from MongoDB ✓
```

### 3. Type Generation (MongoDB → VS Code)

```
ObjectManager detects change (via change stream)
  ↓
TypeGenerator.generate()
  ↓ (queries MongoDB)
ObjectManager.db.listAll() → All GameObjects
  ↓ (for each object)
Generate TypeScript interface
  ↓ (combine all)
Complete .d.ts file
  ↓ (send to all clients)
DevToolsServer.broadcast({ method: "types.updated", params: { definitions: "..." } })
  ↓ (WebSocket)
VS Code Extension receives notification
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
  private setMethod(id, name, code)               // → manager.db.update()
  // ... etc
}
```

### TypeGenerator (`src/devtools/type-generator.ts`)

**Purpose:** Generate TypeScript definitions from MongoDB

**Responsibilities:**
- ✅ Query ObjectManager for all objects
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

**Purpose:** Single source of truth for game objects

**Responsibilities:**
- ✅ Load objects from MongoDB
- ✅ Cache RuntimeObjects in memory
- ✅ Watch MongoDB change streams
- ✅ Invalidate cache on external changes
- ✅ Manage aliases ($.system, $.authManager, etc.)
- ✅ Expose `db` property for DevTools direct access

**Key Properties:**
```typescript
class ObjectManager {
  public readonly db: ObjectDatabase      // DevTools uses this
  private cache: Map<ObjId, RuntimeObject> // Performance cache
  private aliases: Map<string, RuntimeObject> // Dynamic aliases

  async load(id: ObjId): Promise<RuntimeObject>
  invalidate(id: ObjId): void              // Clear cache for object
  private setupChangeStreamWatcher(): void  // Auto-invalidate
}
```

**Change Stream Flow:**
```typescript
// On construction:
constructor(db: ObjectDatabase) {
  this.db = db;
  this.setupChangeStreamWatcher(); // ← Starts watching
}

private setupChangeStreamWatcher() {
  this.db.watch((change) => {
    if (change.operationType === 'update') {
      const id = change.documentKey._id;
      if (this.cache.has(id)) {
        console.log(`External change for #${id} - invalidating`);
        this.cache.delete(id); // ← Cache invalidated
      }
    }
  });
}
```

### ObjectDatabase (`src/database/object-db.ts`)

**Purpose:** MongoDB persistence layer

**Responsibilities:**
- ✅ Connect to MongoDB
- ✅ CRUD operations on `objects` collection
- ✅ Watch change streams
- ✅ Expose callback for change events
- ❌ NO caching (that's ObjectManager's job)

**Key Methods:**
```typescript
class ObjectDatabase {
  async connect(): Promise<void>
  async get(id: ObjId): Promise<GameObject | null>
  async update(id: ObjId, updates: Partial<GameObject>): Promise<void>
  async listAll(): Promise<GameObject[]>

  watch(callback: (change: ChangeStreamDocument) => void): void
}
```

## Multi-Server Synchronization

### Scenario: Two Game Servers + DevTools

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Game Server 1│  │ Game Server 2│  │ DevTools     │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ObjectManager │  │ObjectManager │  │ObjectManager │
│  cache: {    │  │  cache: {    │  │  cache: {}   │
│    #3: obj   │  │    #3: obj   │  │              │
│  }           │  │  }           │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         ↓
              ┌──────────────────┐
              │    MongoDB       │
              │  Change Stream   │
              └──────────────────┘
```

**Timeline:**

1. **DevTools modifies object #3**
   ```
   DevTools → MongoDB.update({ _id: 3 })
   DevTools → ObjectManager.invalidate(3)
   ```

2. **MongoDB broadcasts change event**
   ```
   MongoDB Change Stream → { operationType: 'update', documentKey: { _id: 3 } }
   ```

3. **All servers receive event**
   ```
   Game Server 1: ObjectManager receives event → cache.delete(3)
   Game Server 2: ObjectManager receives event → cache.delete(3)
   DevTools: (already invalidated in step 1)
   ```

4. **Next read loads fresh data**
   ```
   Game Server 1: load(3) → cache miss → MongoDB.findOne() → fresh data ✓
   Game Server 2: load(3) → cache miss → MongoDB.findOne() → fresh data ✓
   ```

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
| ObjectManager cache | O(n) objects cached |
| Change stream | ~1MB overhead |
| TypeGenerator | O(n) during generation, 0 after |
| DevToolsServer | O(m) connected clients |

**Total:** Minimal overhead (~5-10MB for typical usage)

### Network Traffic

| Operation | Size | Frequency |
|-----------|------|-----------|
| Change stream event | ~100 bytes | On every DB write |
| Type generation | ~100KB for 1000 objects | Debounced (500ms) |
| JSON-RPC request | ~500 bytes | User-initiated |
| JSON-RPC response | ~5KB average | Per request |

**Total bandwidth:** <1MB/min typical usage

### Latency

| Operation | Latency |
|-----------|---------|
| Cache hit | <1ms |
| Cache miss (MongoDB) | ~5-10ms |
| Change stream propagation | ~10-50ms |
| Type generation | ~100ms for 1000 objects |

## Failure Modes

### Change Stream Disconnection

**Symptom:** Cache not invalidating across servers

**Detection:**
```typescript
this.changeStream.on('error', (err) => {
  console.error('[ObjectDatabase] Change stream error:', err);
});
```

**Recovery:** Automatic reconnection after 5 seconds

**Impact:** Temporary stale reads (eventual consistency)

### MongoDB Connection Loss

**Symptom:** All DB operations fail

**Detection:** MongoDB driver throws connection errors

**Recovery:** Application-level reconnection logic (future enhancement)

**Impact:** DevTools unavailable until reconnection

### Cache Corruption

**Symptom:** Stale data returned even after invalidation

**Detection:** Compare cache version with MongoDB timestamp

**Recovery:**
```typescript
objectManager.clearCache(); // Nuclear option
```

**Impact:** Performance hit on next load (all cache misses)

## Testing Strategy

### Unit Tests

- `ObjectDatabase.watch()` calls callback on changes
- `ObjectManager.invalidate()` clears cache
- `TypeGenerator.generate()` produces valid TypeScript
- `DevToolsServer.handle()` routes to correct methods

### Integration Tests

- Two ObjectManagers + one MongoDB
- Server 1 writes → Server 2 cache invalidates
- DevTools edits → Game server sees changes
- Concurrent writes to different objects

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
objectManager.getCacheSize()           // Current cache size
cacheHitRate = hits / (hits + misses)  // Cache effectiveness

// Change stream statistics
changeStreamEventsReceived             // Total events
cacheInvalidationsTriggered            // Actual invalidations

// Performance
avgLoadLatency                         // Load time (cached vs uncached)
typeGenerationDuration                 // Time to regenerate .d.ts
```

### Logging

```typescript
// ObjectManager
console.log(`[ObjectManager] External change for #${id} - invalidating cache`);

// ObjectDatabase
console.log(`[ObjectDatabase] Watching for changes (multi-server sync enabled)`);

// DevToolsServer
console.log(`[DevTools] Client connected`);
console.log(`[DevTools] method.set: object #${id}.${methodName}`);
```

## Deployment Topology

### Development (Single Machine)

```
Laptop
  ├─ MongoDB (Docker)
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

### Production (Multi-Server)

```
Load Balancer
  ↓
  ├─→ Game Server 1 (no DevTools)
  ├─→ Game Server 2 (no DevTools)
  └─→ Game Server 3 (no DevTools)
        ↓
    MongoDB Cluster
    (authenticated, TLS)
```

**Note:** DevTools disabled in production (`NODE_ENV=production`)

## Summary

**Key Architectural Principles:**

1. **MongoDB = Single Source of Truth**
   - All state persisted immediately
   - Cache is performance optimization only

2. **Change Streams = Multi-Server Sync**
   - Automatic cache invalidation
   - No polling required
   - Event-driven architecture

3. **ObjectManager = Shared Layer**
   - Game and DevTools use same instance
   - One cache, one connection, one source of truth

4. **DevTools = Thin Transport**
   - No business logic
   - Just JSON-RPC ↔ ObjectManager translation

5. **Security = Network Isolation**
   - Localhost-only by default
   - SSH tunneling for remote access
   - Disabled in production

**This architecture enables:**
✅ Live editing without restarts
✅ Multiple servers sharing one database
✅ Real-time IntelliSense from live data
✅ Zero-copy deployment (edits are permanent)
