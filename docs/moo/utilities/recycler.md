# $.recycler - Object Lifecycle

**Always use `$.recycler` for creating and destroying objects. There is NO other correct way.**

## Purpose

Manages complete object lifecycle: creation, deletion, and recycling. Provides object pooling (reusing deleted objects) to prevent memory bloat and ensures proper cleanup when objects are destroyed.

## Why This Is Non-Negotiable

**CATASTROPHICALLY WRONG:**
```javascript
// NEVER DO THIS - causes database corruption
const sword = await manager.create({ parent: weaponId });  // No pooling
delete objects[sword.id];                                  // Orphans references
await manager.delete(sword.id);                            // Bypasses cleanup hooks
```

**Problems with bypassing $.recycler:**
- ❌ No object pooling (memory bloat over time)
- ❌ No recycled object reuse (wasted allocations)
- ❌ Parent chain not validated
- ❌ No creation hooks called
- ❌ References from other objects point to nothing
- ❌ Contents left floating in limbo
- ❌ Location's contents array not updated
- ❌ No cascade to child objects
- ❌ Database inconsistency

**CORRECT:**
```javascript
const sword = await $.recycler.create($.weapon, { name: 'Iron Sword', damage: 10 });
await $.recycler.recycle(sword);  // Proper cleanup, available for reuse
```

## What $.recycler Handles

- ✅ Object pooling (reuses recycled objects of same parent type)
- ✅ Location cleanup (removes from container's contents)
- ✅ Contents cascade (optionally recycles everything inside)
- ✅ Reference safety (marks as recycled, doesn't hard-delete)
- ✅ Memory efficiency (recycle + reuse vs create + delete)
- ✅ Undo support (unrecycle brings objects back)

## API Reference

### create() - Create New Object

```javascript
await $.recycler.create(parent, properties?)
```

Creates a new object (or reuses a recycled one of the same type).

| Parameter | Type | Description |
|-----------|------|-------------|
| `parent` | RuntimeObject | Prototype to inherit from |
| `properties` | object | Initial property values (optional) |

**Returns:** RuntimeObject (the new object)

**How it works:**
1. Checks for recyclable objects of the same parent type
2. Reuses one if available (cheaper than new allocation)
3. Creates new object only if none available
4. Sets initial properties
5. Calls any onCreate hooks

**Examples:**
```javascript
// Create from prototype
const sword = await $.recycler.create($.weapon, {
  name: 'Iron Sword',
  damage: 10,
  durability: 100
});

// Create with no custom properties
const room = await $.recycler.create($.room);

// Create complex nested structure
const body = await $.recycler.create($.body, {
  hp: 100,
  maxHp: 100
});
```

### recycle() - Soft Delete

```javascript
await $.recycler.recycle(obj, removeContents = true)
```

Marks object as recyclable and cleans up references.

| Parameter | Type | Description |
|-----------|------|-------------|
| `obj` | RuntimeObject | Object to recycle |
| `removeContents` | boolean | Whether to recycle contents too (default: true) |

**What happens:**
1. Removes from location's contents
2. Optionally recycles all contents recursively
3. Marks as `recycled: true`
4. Available for reuse by `create()`
5. **NOT permanently deleted** - can be unrecycled

**Examples:**
```javascript
// Simple recycle
await $.recycler.recycle(sword);

// Recycle but preserve contents (rare)
await $.recycler.recycle(container, false);
```

### purge() - Hard Delete

```javascript
await $.recycler.purge(obj)
```

Permanently deletes object from database. **Use only when absolutely necessary.**

**Examples:**
```javascript
// Permanent removal (rare - usually recycle instead)
await $.recycler.purge(brokenObject);
```

### recycleTree() - Recursive Delete

```javascript
await $.recycler.recycleTree(obj)
```

Recursively recycles object and all its contents.

**Examples:**
```javascript
// Delete room and everything in it
await $.recycler.recycleTree(abandonedRoom);

// Delete container and all items inside
await $.recycler.recycleTree(destroyedChest);
```

### canRecycle() - Check Before Recycling

```javascript
await $.recycler.canRecycle(obj)
```

Returns `true` if object can be safely recycled.

**Examples:**
```javascript
if (await $.recycler.canRecycle(obj)) {
  await $.recycler.recycle(obj);
} else {
  await player.tell('Cannot destroy that.');
}
```

### unrecycle() - Restore Object

```javascript
await $.recycler.unrecycle(obj)
```

Brings recycled object back to life.

**Examples:**
```javascript
// Undo delete
await $.recycler.unrecycle(deletedItem);
item.recycled = false;
item.location = room;
```

## Real-World Examples

### Item Creation (Spawning Loot)

```javascript
async spawnLoot() {
  const items = [
    await $.recycler.create($.weapon, { name: 'rusty sword', damage: 5 }),
    await $.recycler.create($.armor, { name: 'leather vest', defense: 3 }),
    await $.recycler.create($.food, { name: 'stale bread', calories: 200 })
  ];
  
  for (const item of items) {
    item.location = this.location;
    this.location.contents.push(item);
  }
}
```

### Item Destruction (Decay System)

```javascript
async decay() {
  this.durability--;
  
  if (this.durability <= 0) {
    await $.pronoun.announce(
      await $.load(this.location),
      '%d crumbles to dust.',
      null,
      this
    );
    
    await $.recycler.recycle(this);
  }
}
```

### Room Cleanup (Reset Dungeon)

```javascript
async resetDungeon() {
  const rooms = this.rooms; // Array of room IDs
  
  for (const roomId of rooms) {
    const room = await $.load(roomId);
    
    // Recycle all items in room (but not players)
    const items = room.contents.filter(c => c.type === 'item');
    for (const item of items) {
      await $.recycler.recycle(item);
    }
  }
  
  // Respawn fresh loot
  await this.spawnLoot();
}
```

### Character Death (Corpse Creation)

```javascript
async die() {
  // Create corpse from body
  const corpse = await $.recycler.create($.corpse, {
    name: `corpse of ${this.name}`,
    description: `The lifeless body of ${this.name}.`,
    originalBody: this.id
  });
  
  // Transfer inventory to corpse
  for (const item of this.inventory) {
    item.location = corpse;
  }
  this.inventory = [];
  
  corpse.location = this.location;
  this.location.contents.push(corpse);
  
  // Move player to void
  this.location = await $.load(-1); // $.nothing
}
```

### Temporary Objects (Spell Effects)

```javascript
async castFireball(target) {
  // Create temporary effect object
  const fireball = await $.recycler.create($.effect, {
    name: 'fireball',
    damage: 50,
    duration: 0  // Instant
  });
  
  await fireball.apply(target);
  
  // Clean up immediately
  await $.recycler.recycle(fireball);
}
```

## Tips & Best Practices

1. **Always use create()** - Never use ObjectManager.create() directly
2. **Recycle, don't purge** - Recycling enables object reuse
3. **Check canRecycle()** - Validate before destroying protected objects
4. **Use recycleTree() carefully** - Recursively destroys everything inside
5. **Unrecycle for undo** - Implement admin undelete with unrecycle()
6. **Clean up references** - Remove from arrays when recycling
7. **Test with contents** - Verify nested object cleanup works

## Common Patterns

### Create-Use-Destroy

```javascript
// Temporary object pattern
const temp = await $.recycler.create($.temp, { data: value });
await temp.process();
await $.recycler.recycle(temp);
```

### Pool Management

```javascript
// Reuse pattern - create() automatically pools
const items = [];
for (let i = 0; i < 100; i++) {
  items.push(await $.recycler.create($.item)); // Reuses recycled ones
}
```

### Safe Destruction

```javascript
// Always check before destroying
async safeDestroy(obj) {
  if (obj.protected) {
    return 'Cannot destroy protected object.';
  }
  
  if (!await $.recycler.canRecycle(obj)) {
    return 'Object cannot be recycled.';
  }
  
  await $.recycler.recycle(obj);
  return 'Destroyed.';
}
```

## See Also

- [$.memento](./memento.md) - Cloning object trees
- [Core Concepts](../core-concepts.md) - Object references
- [Architecture](../architecture.md) - Why pooling matters
