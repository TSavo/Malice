# Verb System

Understanding Malice's dynamic per-player verb registration system.

## Purpose

Verbs in Malice are **dynamically registered per-player** based on context. Only commands that are actually available appear in tab completion and help. When you pick up an item, its verbs become available. When you drop it, they disappear.

## Why Dynamic Verbs?

**Bad: Global verb table**
```javascript
const VERBS = {
  'eat': handleEat,
  'wear': handleWear,
};

// Problems:
// - How do you know WHICH food to eat?
// - What if player has no food?
// - "eat" shows up in help even when impossible
// - Multiple items with same verb conflict
```

**Good: Per-player, per-item registration**
```javascript
// Only registered when:
// - Player is holding the food
// - Food hasn't been eaten yet

// Automatically unregistered when:
// - Player drops it
// - Food is consumed
// - Player disconnects

// Benefits:
// - Tab completion only shows available commands
// - "help" only shows what you can actually do
// - No "you can't eat that" errors
// - Multiple items work correctly (eat apple vs eat bread)
```

## Verb Registration

### Basic Registration

```javascript
await player.registerVerb(
  ['pattern1', 'pattern2'],  // Array of command patterns
  sourceObject,              // Object providing the verb
  'methodName'               // Method to call on sourceObject
);
```

### Pattern Syntax

| Pattern | Meaning | Example Input | Args to Handler |
|---------|---------|---------------|-----------------|
| `look` | Exact match | "look" | `[player]` |
| `look %s` | Rest of line | "look around here" | `[player, "around here"]` |
| `give %i to %i` | Two items | "give sword to bob" | `[player, sword, bob]` |
| `wear %t` | This object | "wear shirt" | `[player]` |
| `eat %t` | This object | "eat apple" | `[player]` |

**Pattern codes:**
- `%s` - Rest of line as string
- `%i` - Match an item (fuzzy match)
- `%t` - This object (the source object)

### Registration Example

```javascript
// When clothing is picked up
obj.setMethod('onArrived', `
  const dest = args[0];
  if (dest?.owner) {
    const owner = await $.load(dest.owner);
    // Register multiple patterns for same verb
    await owner.registerVerb(
      ['wear %t', 'put on %t', 'don %t'],
      self,
      'doWear'
    );
  }
`);
```

## Verb Lifecycle

### Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     REGISTRATION                             │
├─────────────────────────────────────────────────────────────┤
│  Player connects     Item picked up      Exit registered     │
│        │                   │                    │           │
│        v                   v                    v           │
│  connect()           onArrived()         onContentArrived()  │
│  registerVerb()      registerVerb()      registerVerb()      │
│  (look, say, go)     (wear, eat)         (north, south)      │
│                                                             │
│                   player.verbs = [...]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                       EXECUTION                              │
├─────────────────────────────────────────────────────────────┤
│  Player types: "wear shirt"                                 │
│        │                                                    │
│        v                                                    │
│  matchVerb("wear shirt")                                    │
│        │                                                    │
│        v                                                    │
│  Pattern "wear %t" matches (shirt = source object)          │
│        │                                                    │
│        v                                                    │
│  shirt.doWear(player)                                       │
│        │                                                    │
│        v                                                    │
│  Handler returns message -> sent to player                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    UNREGISTRATION                            │
├─────────────────────────────────────────────────────────────┤
│  Item dropped      Player disconnects    Player leaves room  │
│        │                   │                    │           │
│        v                   v                    v           │
│  onLeaving()         disconnect()       onContentLeaving()  │
│        │                   │                    │           │
│        v                   v                    v           │
│  unregisterVerbsFrom unregisterVerbsFrom unregisterVerbsFrom │
│  (item)              (self)              (exit)              │
└─────────────────────────────────────────────────────────────┘
```

## Verb Handlers

### Handler Signature

```javascript
obj.setMethod('doWear', `
  // args[0] = player who typed the command
  // args[1...n] = resolved items from pattern

  const player = args[0];
  const target = args[1];  // If pattern had %i
  const text = args[1];    // If pattern had %s

  // Return string to send to player
  // Return nothing for silent success
  return 'You wear the ' + self.name + '.';
`);
```

### Pattern Argument Mapping

```javascript
// Pattern: 'eat %t'
// Input: "eat apple"
// Handler receives: args = [player]
// (%t is self - the handler knows which object it is)

// Pattern: 'give %i to %i'
// Input: "give sword to bob"
// Handler receives: args = [player, sword, bob]

// Pattern: 'say %s'
// Input: 'say hello everyone'
// Handler receives: args = [player, 'hello everyone']
```

### Example Handler

```javascript
obj.setMethod('doWear', `
  const wearer = args[0];

  // 1. Call base method for state change
  const result = await self.wear(wearer);
  if (!result.success) return result.error;

  // 2. Swap verbs: unregister 'wear', register 'remove'
  await wearer.unregisterVerbsFrom(self);
  await wearer.registerVerb(['remove %t', 'take off %t'], self, 'doRemove');

  // 3. Announce to room
  const room = await $.load(wearer.location);
  await $.pronoun.announce(room, '%N puts on %d.', wearer, self);

  return result.message;
`);
```

## Unregistration

### unregisterVerbsFrom()

Removes ALL verbs from a specific source:

```javascript
// Remove all verbs provided by this item
await player.unregisterVerbsFrom(item);

// Remove all verbs (usually in disconnect)
await player.unregisterVerbsFrom(player);
```

### Where to Unregister

**In onLeaving():**
```javascript
obj.setMethod('onLeaving', `
  const dest = args[0];
  const source = args[1];
  const mover = args[2];

  // If leaving a hand, unregister from owner
  if (source?.owner) {
    const owner = await $.load(source.owner);
    await owner.unregisterVerbsFrom(self);
  }
`);
```

**In disconnect():**
```javascript
async disconnect() {
  // Clean up all verbs
  await self.unregisterVerbsFrom(self);
  
  // Additional cleanup...
}
```

**In room's onContentLeaving():**
```javascript
async onContentLeaving(obj, dest, mover) {
  if (obj.isPlayer) {
    // Remove exit verbs when player leaves
    for (const exitId of self.exits || []) {
      const exit = await $.load(exitId);
      await obj.unregisterVerbsFrom(exit);
    }
  }
}
```

## Verb Swapping Pattern

Many objects need to swap verbs based on state:

```javascript
// In doWear (when wearing succeeds):
await player.unregisterVerbsFrom(self);  // Remove 'wear'
await player.registerVerb(['remove %t', 'take off %t'], self, 'doRemove');

// In doRemove (when removing succeeds):
await player.unregisterVerbsFrom(self);  // Remove 'remove'
await player.registerVerb(['wear %t', 'put on %t'], self, 'doWear');
```

This keeps available verbs synchronized with object state.

## Hooks for Verb Registration

### onArrived() - Register Verbs

Called when object arrives at a location:

```javascript
obj.setMethod('onArrived', `
  const dest = args[0];      // Where it arrived
  const source = args[1];    // Where it came from
  const mover = args[2];     // Who moved it

  // If arriving in a hand, register with owner
  if (dest?.owner) {
    const owner = await $.load(dest.owner);
    if (!self.wornBy) {  // Only if not already worn
      await owner.registerVerb(['wear %t'], self, 'doWear');
    }
  }
`);
```

### onLeaving() - Unregister Verbs

Called when object is about to leave:

```javascript
obj.setMethod('onLeaving', `
  const dest = args[0];
  const source = args[1];
  const mover = args[2];

  // If leaving a hand, unregister from owner
  if (source?.owner) {
    const owner = await $.load(source.owner);
    await owner.unregisterVerbsFrom(self);
  }
`);
```

### onContentArrived() - Register for Contents

Called on container when something arrives:

```javascript
// $.room.onContentArrived() - register exit verbs
async onContentArrived(obj, source, mover) {
  if (obj.isPlayer) {
    // Register exit verbs with player
    for (const [dir, exitId] of Object.entries(self.exits || {})) {
      const exit = await $.load(exitId);
      await obj.registerVerb([dir], exit, 'traverse');
    }
  }
}
```

### onContentLeaving() - Unregister from Contents

Called on container when something is leaving:

```javascript
async onContentLeaving(obj, dest, mover) {
  if (obj.isPlayer) {
    // Remove exit verbs when player leaves
    for (const exitId of Object.values(self.exits || {})) {
      await obj.unregisterVerbsFrom(exitId);
    }
  }
}
```

## Real-World Examples

### Player Connection

```javascript
// $.player.connect() - registers base commands
async connect() {
  await self.registerVerb(['look', 'l'], self, 'look');
  await self.registerVerb(['inventory', 'i'], self, 'inventory');
  await self.registerVerb(['say %s', '"%s"'], self, 'say');
  await self.registerVerb(['go %s'], self, 'go');
  await self.registerVerb(['get %i', 'take %i'], self, 'get');
  await self.registerVerb(['drop %i'], self, 'drop');
  await self.registerVerb(['quit', '@quit'], self, 'quit');

  // Move to starting location, trigger room hooks
  const startRoom = await $.load(self.location);
  await startRoom.onContentArrived(self, null, self);
}
```

### Admin Extension

```javascript
// $.admin.connect() - adds admin commands, then calls parent
async connect() {
  // Register admin-only verbs FIRST
  await self.registerVerb(['@dig %s'], self, 'dig');
  await self.registerVerb(['@create'], self, 'create');
  await self.registerVerb(['@teleport %i to %i'], self, 'teleport');
  await self.registerVerb(['@set %s'], self, 'setProperty');

  // THEN call parent to get all player verbs too
  await pass();
}
```

### Item Usage

```javascript
// Food item
obj.setMethod('onArrived', `
  if (args[0]?.owner) {
    const owner = await $.load(args[0].owner);
    await owner.registerVerb(['eat %t'], self, 'doEat');
  }
`);

obj.setMethod('doEat', `
  const eater = args[0];
  
  // Consume food
  const result = await self.consume(eater);
  if (!result.success) return result.error;
  
  // Unregister verb (food is gone)
  await eater.unregisterVerbsFrom(self);
  
  // Recycle object
  await $.recycler.recycle(self);
  
  return 'You eat the ' + self.name + '.';
`);
```

## Best Practices

1. **Register in onArrived, unregister in onLeaving** - Hooks handle the lifecycle
2. **Use unregisterVerbsFrom(source)** - Removes ALL verbs from that source
3. **Return strings from handlers** - They're sent to the player automatically
4. **Use %t for "this object"** - Cleaner than %i when verb is item-specific
5. **Include aliases** - `['eat %t', 'consume %t', 'devour %t']`
6. **Swap verbs on state change** - wear/remove, open/close, lock/unlock
7. **Check conditions in handlers** - Not at registration time

## Common Patterns

### State-Dependent Verbs

```javascript
// Only register appropriate verb for current state
if (self.isOpen) {
  await player.registerVerb(['close %t'], self, 'doClose');
} else {
  await player.registerVerb(['open %t'], self, 'doOpen');
}
```

### Conditional Registration

```javascript
// Only register if conditions met
if (self.hasFood && !self.spoiled) {
  await player.registerVerb(['eat %t'], self, 'doEat');
}
```

### Multiple Aliases

```javascript
// Provide multiple ways to invoke
await player.registerVerb(
  ['wear %t', 'put on %t', 'don %t', 'equip %t'],
  self,
  'doWear'
);
```

## See Also

- [Prototypes](../prototypes.md) - Object system and inheritance
- [Best Practices](../best-practices.md) - Code organization
- [Core Concepts](../core-concepts.md) - Methods and properties
