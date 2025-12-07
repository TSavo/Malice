# MongoDB Change Streams for Multi-Server Cache Invalidation

## Overview

Malice v2 uses **MongoDB change streams** to enable multiple game servers and DevTools instances to share a single MongoDB database while maintaining cache consistency.

## How It Works

### Single Server (Without Change Streams)
```
Game Server
  ├─ ObjectManager
  │   └─ Cache: { #5: Object }
  │
  └─ Updates object #5
      ├─ Writes to MongoDB ✓
      └─ Clears local cache ✓
```

**Problem:** No issue with single server!

### Multiple Servers (Without Change Streams)
```
Server 1                          Server 2
  ├─ Cache: { #5: Object }         ├─ Cache: { #5: Object }
  │                                │
  └─ Updates object #5             └─ Reads object #5
      ├─ Writes to MongoDB ✓           └─ Returns stale cache ❌
      └─ Clears local cache ✓
```

**Problem:** Server 2 has stale cache!

### Multiple Servers (With Change Streams)
```
Server 1                          Server 2
  ├─ Cache: { #5: Object }         ├─ Cache: { #5: Object }
  │                                │
  └─ Updates object #5             │
      ├─ Writes to MongoDB ✓       │
      └─ Clears local cache ✓      │
                                   │
      MongoDB Change Stream ────────┘
      (broadcasts update event)
                                   │
                                   └─ Receives event
                                       └─ Clears local cache ✓

      Next read on Server 2:
      └─ Cache miss → Reads from MongoDB ✓
```

**Solution:** Server 2's cache is automatically invalidated!

## Implementation

### ObjectDatabase

```typescript
// v2/src/database/object-db.ts

/**
 * Watch for changes to objects (for cache invalidation across servers)
 */
watch(callback: (change: any) => void): void {
  this.changeStream = this.objects.watch([], {
    fullDocument: 'updateLookup',
  });

  this.changeStream.on('change', (change) => {
    callback(change);
  });

  this.changeStream.on('error', (err) => {
    console.error('[ObjectDatabase] Change stream error:', err);
    // Auto-reconnect after 5 seconds
    this.changeStream = undefined;
    setTimeout(() => this.watch(callback), 5000);
  });
}
```

### ObjectManager

```typescript
// v2/src/database/object-manager.ts

private setupChangeStreamWatcher(): void {
  this.db.watch((change) => {
    const operationType = change.operationType;

    if (operationType === 'update' || operationType === 'replace') {
      const id = change.documentKey._id as ObjId;

      if (this.cache.has(id)) {
        console.log(`[ObjectManager] External change detected for #${id}`);
        this.cache.delete(id); // ← Invalidate cache
      }
    } else if (operationType === 'delete') {
      const id = change.documentKey._id as ObjId;
      this.cache.delete(id);

      // Also remove from aliases
      for (const [name, obj] of this.aliases) {
        if (obj.id === id) {
          this.aliases.delete(name);
        }
      }
    }
  });
}
```

## Change Stream Events

MongoDB sends events for:

| Operation | Description | Action |
|-----------|-------------|--------|
| `insert` | New object created | (No cache to invalidate) |
| `update` | Object modified | Clear cache for that object |
| `replace` | Object replaced | Clear cache for that object |
| `delete` | Object deleted | Clear cache + remove aliases |

## Use Cases

### Use Case 1: DevTools Editing While Game Running

```
Terminal 1: Game Server (port 5555)
  ├─ Player interacts with object #3
  ├─ Loads object #3 (caches it)
  └─ Executes methods on #3

Terminal 2: VS Code + DevTools (port 9999)
  ├─ Developer edits object #3's method
  ├─ Saves → DevTools writes to MongoDB
  └─ Change stream broadcasts update

Game Server:
  ├─ Receives change event for object #3
  ├─ Clears cache for #3
  └─ Next method call loads fresh code ✓
```

**Result:** Code changes take effect immediately without restart!

### Use Case 2: Horizontal Scaling (Load Balancing)

```
                   ┌────────────┐
                   │ MongoDB    │
                   └──────┬─────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
   │Server 1 │       │Server 2 │       │Server 3 │
   │Port 5555│       │Port 6666│       │Port 7777│
   └─────────┘       └─────────┘       └─────────┘
        ↑                 ↑                 ↑
        │                 │                 │
   ┌────┴─────────────────┴─────────────────┴────┐
   │         Load Balancer (Round Robin)         │
   └──────────────────┬──────────────────────────┘
                      │
                 Players connect here
```

**All servers see same world state via MongoDB + change streams!**

### Use Case 3: Multi-Server Combat

```
Player A on Server 1:
  ├─ Attacks Player B
  └─ Updates Player B's HP in MongoDB
      └─ Change stream broadcasts

Player B on Server 2:
  ├─ Receives change event
  ├─ Invalidates cache for Player B's object
  └─ Next read shows updated HP ✓
```

**Result:** Cross-server interactions work seamlessly!

## Requirements

### MongoDB Configuration

Change streams require:
- **MongoDB 3.6+** (replica set or sharded cluster)
- **Replica set** (even single-node)

#### Enable Replica Set (Local Development)

```bash
# Start MongoDB as replica set
docker run -d \
  --name malice-mongo \
  -p 27017:27017 \
  mongo:7.0 \
  --replSet rs0

# Initialize replica set
docker exec malice-mongo mongosh --eval "rs.initiate()"

# Verify
docker exec malice-mongo mongosh --eval "rs.status()"
```

#### Docker Compose (Recommended)

```yaml
# v2/docker-compose.yml
version: '3.8'

services:
  mongo:
    image: mongo:7.0
    command: --replSet rs0
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: echo "rs.initiate().ok || rs.status().ok" | mongosh --quiet
      interval: 5s
      timeout: 10s
      retries: 5

  game:
    build: .
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      MONGO_URI: mongodb://mongo:27017/malice
    ports:
      - "5555:5555"
      - "8080:8080"
      - "9999:9999"

volumes:
  mongo-data:
```

## Performance Considerations

### Overhead

Change streams have minimal overhead:
- **Network:** ~100 bytes per change event
- **CPU:** Negligible (event-driven)
- **Latency:** <50ms typical

### Optimization

Only invalidate if cached:
```typescript
if (this.cache.has(id)) {
  console.log(`Invalidating cache for #${id}`);
  this.cache.delete(id);
}
// If not cached, no work needed!
```

### Monitoring

```typescript
// Count cache invalidations
let invalidationCount = 0;

this.db.watch((change) => {
  if (change.operationType === 'update') {
    invalidationCount++;
    console.log(`[Stats] Cache invalidations: ${invalidationCount}`);
  }
});
```

## Error Handling

### Connection Loss

Change stream auto-reconnects:
```typescript
this.changeStream.on('error', (err) => {
  console.error('[ObjectDatabase] Change stream error:', err);

  // Clear reference
  this.changeStream = undefined;

  // Retry after 5 seconds
  setTimeout(() => {
    if (!this.changeStream) {
      this.watch(callback);
    }
  }, 5000);
});
```

### Missed Events

If change stream disconnects:
- **Cached objects:** May be stale until next write
- **New reads:** Always fresh from MongoDB ✓
- **Writes:** Always go to MongoDB ✓

**Worst case:** Temporary stale reads (eventual consistency)

## Testing

Run tests:
```bash
cd v2
bun test test/change-stream.test.ts
```

Tests verify:
- ✅ Cache invalidation across servers
- ✅ DevTools edits visible to game
- ✅ Concurrent writes to different objects

## Debugging

Enable verbose logging:
```typescript
// In ObjectManager
if (this.cache.has(id)) {
  console.log(`[ObjectManager] Cache hit for #${id}`);
} else {
  console.log(`[ObjectManager] Cache miss for #${id} - loading from MongoDB`);
}
```

Watch change events:
```bash
# In mongosh
db.objects.watch()
```

## Production Checklist

- [ ] MongoDB running as replica set
- [ ] Change streams enabled (automatic if replica set)
- [ ] Multiple servers can connect to same MongoDB
- [ ] Tests passing (`bun test test/change-stream.test.ts`)
- [ ] Monitoring for cache invalidation rate
- [ ] Error handling for change stream disconnects

## Summary

**Change streams enable:**
✅ Multiple game servers sharing one MongoDB
✅ DevTools editing while game runs
✅ Live code changes without restart
✅ Cross-server player interactions
✅ Horizontal scaling
✅ Cache consistency across all servers

**With minimal overhead and automatic recovery!**
