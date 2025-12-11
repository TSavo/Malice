# $.mutex - Object Locks

Use `$.mutex` for preventing race conditions on objects. Locks are stored on the objects themselves and can auto-expire.

**Note:** For preventing incompatible actions (sitting/walking), use [`$.exclusions`](./exclusions.md) instead—it's built on top of mutex with better semantics.

## Purpose

Provides object-level locking with timeout support. Prevents race conditions when multiple operations need exclusive access to an object. Locks persist across server restarts.

## Why Use This?

**Bad: Global lock tracking**
```javascript
const locks = {}; // Global state - bad!

async function startCrafting(player, item) {
  const key = item.id + ':craft';
  if (locks[key]) {
    return 'Item is being crafted.';
  }
  locks[key] = { player: player.id };
  
  try {
    await doCrafting(item);
  } finally {
    delete locks[key]; // Easy to forget!
  }
  // Server crash? Lock never released.
}
```

**Good: Object-based locks**
```javascript
async function startCrafting(player, item) {
  const blocked = await $.mutex.acquire(item, 'craft', { player: player.id }, 60000);
  if (blocked) return 'Being crafted by #' + blocked.player;

  await doCrafting(item);
  await $.mutex.release(item, 'craft');
}
```

## What $.mutex Handles

- ✅ Lock state persisted on the object itself
- ✅ Automatic timeout/expiry
- ✅ Arbitrary data storage with lock
- ✅ Survives server restarts
- ✅ No global state pollution

## API Reference

### acquire() - Get Lock

```javascript
await $.mutex.acquire(obj, lockName, data?, timeout?)
```

Tries to acquire a lock. Returns `false` if successful, or lock data if blocked.

| Parameter | Type | Description |
|-----------|------|-------------|
| `obj` | RuntimeObject | Object to lock |
| `lockName` | string | Lock identifier |
| `data` | any | Data to store with lock (optional) |
| `timeout` | number | Auto-release after ms (optional) |

**Returns:** `false` (success) or existing lock data (blocked)

**Examples:**
```javascript
// Simple lock
const blocked = await $.mutex.acquire(room, 'movement');
if (blocked) {
  return 'Room is busy.';
}

// Lock with data
const blocked = await $.mutex.acquire(item, 'craft', {
  crafter: player.id,
  startedAt: Date.now()
});

// Lock with timeout (auto-releases after 30s)
await $.mutex.acquire(player, 'crafting', { item: 'sword' }, 30000);
```

### release() - Unlock

```javascript
await $.mutex.release(obj, lockName)
```

Releases a lock (cancels timeout if set).

**Examples:**
```javascript
await $.mutex.release(room, 'movement');
await $.mutex.release(player, 'crafting');
```

### check() - Query Lock

```javascript
await $.mutex.check(obj, lockName)
```

Returns lock data if held, `null` if free.

**Examples:**
```javascript
const holder = await $.mutex.check(obj, 'combat');
if (holder) {
  await player.tell('Combat in progress by #' + holder.attacker);
}
```

### update() - Modify Lock Data

```javascript
await $.mutex.update(obj, lockName, newData)
```

Updates data on existing lock.

**Examples:**
```javascript
await $.mutex.update(obj, 'craft', { progress: 50 });
```

### extend() - Extend Timeout

```javascript
await $.mutex.extend(obj, lockName, additionalMs)
```

Extends timeout on existing lock.

**Examples:**
```javascript
// Add another 60 seconds
await $.mutex.extend(obj, 'craft', 60000);
```

### list() - Debug Locks

```javascript
await $.mutex.list(obj)
```

Returns all locks on an object (for debugging).

**Examples:**
```javascript
const locks = await $.mutex.list(player);
// { 'crafting': { data: {...}, acquiredAt: 1234567890 }, ... }
```

### releaseAll() - Clear All Locks

```javascript
await $.mutex.releaseAll(obj)
```

Releases all locks on an object.

**Examples:**
```javascript
// Emergency unlock
await $.mutex.releaseAll(brokenObject);
```

## Real-World Examples

### Crafting System

```javascript
async startCrafting(player, recipe) {
  // Lock player during crafting
  const blocked = await $.mutex.acquire(player, 'crafting', {
    recipe: recipe.name,
    startedAt: Date.now()
  }, recipe.duration);
  
  if (blocked) {
    return `You're already crafting ${blocked.recipe}.`;
  }
  
  await player.tell('You begin crafting ' + recipe.name + '...');
  
  // Schedule completion
  await $.scheduler.schedule(
    'craft_' + player.id,
    recipe.duration,
    0,
    this,
    'completeCrafting',
    player.id,
    recipe.id
  );
}

async completeCrafting(playerId, recipeId) {
  const player = await $.load(playerId);
  const recipe = await $.load(recipeId);
  
  // Create item
  const item = await $.recycler.create(recipe.result);
  item.location = player;
  player.inventory.push(item);
  
  // Release lock
  await $.mutex.release(player, 'crafting');
  
  await player.tell('You finish crafting ' + item.name + '!');
}
```

### Room Transition Lock

```javascript
async movePlayer(player, direction) {
  // Prevent simultaneous movement
  const blocked = await $.mutex.acquire(player, 'movement');
  if (blocked) {
    return 'You are already moving.';
  }
  
  try {
    await this.performMove(player, direction);
  } finally {
    await $.mutex.release(player, 'movement');
  }
}
```

### Resource Collection

```javascript
async gather(player, resource) {
  // Lock resource while being gathered
  const blocked = await $.mutex.acquire(resource, 'gathering', {
    gatherer: player.id
  }, 5000);
  
  if (blocked) {
    return `${await $.load(blocked.gatherer).name} is already gathering this.`;
  }
  
  await player.tell('You begin gathering...');
  await $.scheduler.schedule('gather_' + resource.id, 5000, 0, this, 'completeGather', player.id, resource.id);
}
```

## Tips & Best Practices

1. **Use for exclusive access** - When only one operation should run at a time
2. **Store meaningful data** - Put context in lock data for debugging
3. **Set timeouts** - Prevent stuck locks from crashes/disconnects
4. **Release in finally** - Ensure locks release even on errors
5. **Check before operations** - Use check() to query lock state
6. **Use $.exclusions for actions** - Better abstraction for sitting/walking/etc

## See Also

- [$.exclusions](./exclusions.md) - Higher-level action exclusion system
- [$.scheduler](./scheduler.md) - For timed lock releases
- [Core Concepts](../core-concepts.md) - Object persistence
