# Object Creation & Movement

Essential patterns for creating, destroying, and moving objects in Malice.

## Object Creation

### Always Use $.recycler.create()

**Never create objects any other way.**

```javascript
// WRONG - breaks pooling system
const obj = await manager.create({ parent: 1 });  // NO!
const obj = await $.create(...);  // NO!

// RIGHT - uses recycler
const obj = await $.recycler.create($.item);  // Reuses recycled IDs
const obj2 = await $.recycler.create($.room, {
  name: 'New Room',
  description: 'A freshly created room.'
});
```

### Why $.recycler Matters

The recycler provides:
- **Object pooling** - reuses deleted object IDs
- **Memory efficiency** - prevents ID bloat
- **Proper initialization** - calls onCreate hooks
- **Parent validation** - ensures valid inheritance chain

### Choosing the Right Parent

Pick the most specific prototype that matches what your object **IS**:

```javascript
// Creating a room
const room = await $.recycler.create($.room, {
  name: 'Dark Cave',
  description: 'A damp, dark cave.',
  exits: {}
});

// Creating a player character
const player = await $.recycler.create($.player, {
  name: 'Alice',
  playername: 'alice'
});

// Creating clothing
const shirt = await $.recycler.create($.clothing, {
  name: 'red shirt',
  warmth: 5,
  covers: ['torso']
});

// Creating food
const apple = await $.recycler.create($.food, {
  name: 'apple',
  calories: 50,
  bites: 3
});
```

### Setting Properties After Creation

```javascript
const sword = await $.recycler.create($.item, { name: 'sword' });

// Set additional properties
sword.description = 'A sharp steel sword.';
sword.damage = 10;
sword.weight = 5;
sword.aliases = ['blade', 'weapon'];
sword.condition = 100;

// Place it somewhere
await sword.moveTo(room);
```

### Creating Multiple Related Objects

```javascript
async createShop() {
  // Create the shop room
  const shop = await $.recycler.create($.room, {
    name: 'General Store',
    description: 'A cluttered shop full of goods.'
  });

  // Create items and place them
  const items = [
    { name: 'rope', weight: 2 },
    { name: 'torch', weight: 1 },
    { name: 'rations', weight: 3 }
  ];
  
  for (const data of items) {
    const item = await $.recycler.create($.item, data);
    await item.moveTo(shop);
  }

  // Create the shopkeeper
  const keeper = await $.recycler.create($.npc, {
    name: 'Merchant',
    description: 'A friendly merchant with a ready smile.'
  });
  await keeper.moveTo(shop);

  return shop;
}
```

## Object Destruction

### Always Use $.recycler.recycle()

**Never manipulate location/contents directly.**

```javascript
// WRONG - breaks verb registration
delete objects[obj.id];              // NO!
obj.location = null;                 // NO!
room.contents = room.contents.filter(o => o !== obj);  // NO!

// RIGHT - uses recycler
await $.recycler.recycle(obj);       // Proper cleanup + pooling
await $.recycler.recycleTree(obj);   // Recursively recycle contents too
```

### recycle() vs purge()

```javascript
// Soft delete - marks for reuse (PREFERRED)
await $.recycler.recycle(obj);
// - Sets recycled flag
// - Removes from location
// - Available for reuse
// - Can be unrecycled

// Hard delete - permanent removal (RARE)
await $.recycler.purge(obj);
// - Completely removes from database
// - Cannot be recovered
// - Use only for cleanup/migration
```

### Recursive Deletion

```javascript
// Delete object and all its contents
await $.recycler.recycleTree(container);

// Example: destroy chest with all items inside
const chest = await $.load(chestId);
await $.recycler.recycleTree(chest);  // Chest + all items recycled
```

## Object Movement

### The Golden Rule: Use moveTo()

**Never manipulate contents arrays directly.**

```javascript
// WRONG - breaks verb registration and hooks
room.contents.push(item);                           // NO!
room.contents = [...room.contents, item];           // NO!
item.location = room;                               // NO!
item.set('location', room);                         // NO!

// RIGHT - uses moveTo()
await item.moveTo(room);                            // Handles everything
await item.moveTo(room, player);                    // With mover context
```

### Why moveTo() Matters

`moveTo()` does all of this automatically:

1. **Calls source container's `onContentLeaving()`** - can cancel movement
2. **Calls moving object's `onLeaving()`** - cleanup
3. **Updates `location` property** - sets new location
4. **Removes from source's `contents` array** - maintains consistency
5. **Calls source's `onContentLeft()`** - unregisters verbs
6. **Adds to destination's `contents` array** - updates container
7. **Calls moving object's `onArrived()`** - registers verbs
8. **Calls destination's `onContentArrived()`** - registers verbs

Skipping any of these breaks verb registration.

### Basic Movement

```javascript
// Move item to room
await item.moveTo(room);

// Move item to container
await item.moveTo(chest);

// Move player to new room
await player.moveTo(newRoom);

// With mover context (who caused the movement)
await item.moveTo(player.hand, player);
```

### Movement Cancellation

Hooks can throw to cancel movement:

```javascript
// In container.onContentLeaving()
async onContentLeaving(obj, dest, mover) {
  if (self.locked) {
    throw new Error('The ' + self.name + ' is locked!');
  }
  
  if (obj.cursed && obj.wornBy) {
    throw new Error(obj.name + ' cannot be removed while cursed!');
  }
}
```

### Checking Movement Feasibility

```javascript
// Try movement in try/catch
async tryMove(item, destination, mover) {
  try {
    await item.moveTo(destination, mover);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Usage
const result = await tryMove(sword, player, player);
if (!result.success) {
  await player.tell(result.error);
}
```

## Movement Hooks

### onLeaving() - Before Movement

Called on the moving object before it leaves:

```javascript
obj.setMethod('onLeaving', `
  const dest = args[0];      // Where it's going
  const source = args[1];    // Where it's leaving from
  const mover = args[2];     // Who's moving it

  // Cleanup verbs if leaving a player's hand
  if (source?.owner) {
    const owner = await $.load(source.owner);
    await owner.unregisterVerbsFrom(self);
  }
  
  // Log the movement
  console.log(self.name + ' leaving ' + source?.name);
`);
```

### onArrived() - After Movement

Called on the moving object after it arrives:

```javascript
obj.setMethod('onArrived', `
  const dest = args[0];      // Where it arrived
  const source = args[1];    // Where it came from
  const mover = args[2];     // Who moved it

  // Register verbs if arriving in a player's hand
  if (dest?.owner) {
    const owner = await $.load(dest.owner);
    await owner.registerVerb(['use %t'], self, 'doUse');
  }
  
  // Announce arrival if moving to a room
  if (dest.exits) {  // It's a room
    await dest.announce(self.name + ' appears.');
  }
`);
```

### onContentLeaving() - Container Cleanup

Called on the source container before content leaves:

```javascript
// In $.room.onContentLeaving()
async onContentLeaving(obj, dest, mover) {
  if (obj.isPlayer) {
    // Remove exit verbs when player leaves
    for (const exitId of Object.values(self.exits || {})) {
      await obj.unregisterVerbsFrom(await $.load(exitId));
    }
  }
  
  // Can throw to cancel
  if (self.locked && mover.id !== self.keyHolder) {
    throw new Error('The door is locked!');
  }
}
```

### onContentArrived() - Container Setup

Called on the destination container after content arrives:

```javascript
// In $.room.onContentArrived()
async onContentArrived(obj, source, mover) {
  if (obj.isPlayer) {
    // Register exit verbs with player
    for (const [dir, exitId] of Object.entries(self.exits || {})) {
      const exit = await $.load(exitId);
      await obj.registerVerb([dir], exit, 'traverse');
    }
    
    // Show room description
    const desc = await self.describe(obj);
    await obj.tell(desc);
  }
}
```

## Getting and Manipulating Contents

### Reading Contents

```javascript
// Contents is an array of RuntimeObjects (if cached)
for (const obj of room.contents) {
  await player.tell('- ' + obj.name);
}

// Filter contents
const items = room.contents.filter(obj => !obj.isPlayer);
const players = room.contents.filter(obj => obj.isPlayer);

// Find specific item
const sword = room.contents.find(obj => obj.name === 'sword');
```

### Checking Containment

```javascript
// Is item in this container?
const isHere = container.contents.some(obj => obj === item);
const isHere2 = item.location === container;  // Also works

// Recursive containment check
async isInside(item, container) {
  let loc = await $.load(item.location);
  while (loc) {
    if (loc.id === container.id) return true;
    loc = await $.load(loc.location);
  }
  return false;
}
```

### Moving Multiple Items

```javascript
// Move all items from one container to another
async transferAll(from, to, mover) {
  // Copy array since we're modifying it during iteration
  const items = [...from.contents];
  
  for (const item of items) {
    await item.moveTo(to, mover);
  }
}

// Move specific items
async moveMatchingItems(from, to, predicate, mover) {
  const items = from.contents.filter(predicate);
  
  for (const item of items) {
    await item.moveTo(to, mover);
  }
}
```

## Real-World Examples

### Item Pickup

```javascript
async doGet(player, itemName) {
  const room = await $.load(player.location);
  
  // Find item in room
  const item = room.contents.find(obj => 
    obj.name === itemName || obj.aliases?.includes(itemName)
  );
  
  if (!item) {
    return 'You don\\'t see that here.';
  }
  
  // Check if it can be picked up
  if (item.boltedDown) {
    return item.name + ' cannot be moved.';
  }
  
  // Move to player's hand
  const hand = await player.getPrimaryHand();
  if (!hand) {
    return 'You have no free hands!';
  }
  
  try {
    await item.moveTo(hand, player);
    await player.tell('You pick up ' + item.name + '.');
    
    // Others see it
    await $.pronoun.announce(room, '%N picks up %d.', player, item);
  } catch (error) {
    return error.message;
  }
}
```

### Item Drop

```javascript
async doDrop(player, item) {
  const room = await $.load(player.location);
  
  // Move from hand to room
  try {
    await item.moveTo(room, player);
    await player.tell('You drop ' + item.name + '.');
    
    // Others see it
    await $.pronoun.announce(room, '%N drops %d.', player, item);
  } catch (error) {
    return error.message;
  }
}
```

### Creating Equipment Set

```javascript
async createStarterEquipment(player) {
  // Create basic gear
  const items = [
    { proto: $.clothing, props: { name: 'cloth tunic', warmth: 5 } },
    { proto: $.clothing, props: { name: 'cloth pants', warmth: 5 } },
    { proto: $.weapon, props: { name: 'rusty dagger', damage: 3 } },
    { proto: $.food, props: { name: 'stale bread', calories: 100 } }
  ];
  
  for (const { proto, props } of items) {
    const item = await $.recycler.create(proto, props);
    
    // Place in player's inventory
    const hand = await player.getHand();
    if (hand) {
      await item.moveTo(hand, player);
    } else {
      // Fallback to location if no hands
      await item.moveTo(await $.load(player.location), player);
    }
  }
}
```

### Room Reset (Respawn)

```javascript
async resetRoom() {
  // Remove all non-player contents
  const items = [...self.contents].filter(obj => !obj.isPlayer);
  
  for (const item of items) {
    await $.recycler.recycle(item);
  }
  
  // Spawn fresh items
  await this.spawnDefaultContents();
}

async spawnDefaultContents() {
  const spawns = [
    { proto: $.weapon, props: { name: 'iron sword' } },
    { proto: $.armor, props: { name: 'leather vest' } },
    { proto: $.food, props: { name: 'apple' } }
  ];
  
  for (const { proto, props } of spawns) {
    const item = await $.recycler.create(proto, props);
    await item.moveTo(self);  // 'self' is the room
  }
}
```

## Best Practices

1. **Always use $.recycler.create()** - Never create objects directly
2. **Always use moveTo()** - Never manipulate location/contents manually
3. **Use try/catch for movement** - Hooks can throw to cancel
4. **Copy arrays before iterating** - If modifying during iteration
5. **Check boltedDown** - Before attempting to move items
6. **Use mover context** - Pass who's causing the movement
7. **Register verbs in hooks** - onArrived/onLeaving handle verb lifecycle
8. **Prefer recycle() over purge()** - Allows object pooling
9. **Use recycleTree() for containers** - Recursively cleans contents

## Common Patterns

### Safe Movement

```javascript
async safeMoveTo(item, dest, mover) {
  try {
    await item.moveTo(dest, mover);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Conditional Movement

```javascript
async moveIfAllowed(item, dest, mover) {
  // Pre-check before attempting
  if (item.boltedDown) {
    return 'Cannot move that.';
  }
  
  if (dest.locked && mover.id !== dest.owner) {
    return 'Destination is locked.';
  }
  
  await item.moveTo(dest, mover);
  return 'Moved successfully.';
}
```

### Mass Transfer

```javascript
async emptyContainer(container, dest, mover) {
  const items = [...container.contents];
  const results = [];
  
  for (const item of items) {
    try {
      await item.moveTo(dest, mover);
      results.push({ item: item.name, success: true });
    } catch (error) {
      results.push({ item: item.name, success: false, error: error.message });
    }
  }
  
  return results;
}
```

## See Also

- [$.recycler](../utilities/recycler.md) - Object lifecycle management
- [Verbs](./verbs.md) - Verb registration in movement hooks
- [Prototypes](../prototypes.md) - Object hierarchy and inheritance
