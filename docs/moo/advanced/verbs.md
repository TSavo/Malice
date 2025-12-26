# Verb System

Understanding Malice's dynamic per-player verb registration system.

> **⚠️ ABILITIES-FIRST ARCHITECTURE**
>
> **Most game interactions should NOT use registered verbs.**
>
> Malice uses an abilities-first paradigm where the AI narrator interprets player intent by reading object abilities (prose physics). Verb registration is reserved for **infrastructure only**.
>
> **Only these verbs should be coded:**
> ```
> MOVEMENT:    north, south, east, west, up, down, enter, exit
> PERCEPTION:  look, glance
> SOCIAL:      say, whisper, shout, emote, to
> META:        quit, who, help, inventory, exits, stand, sit
> ```
>
> **Everything else goes through the AI:**
> - "eat the apple" → AI reads edible abilities
> - "wear the jacket" → AI reads wearable abilities
> - "unlock the door" → AI reads lock abilities
> - "pick up the gun" → AI reads hand/weight abilities
>
> See `docs/ABILITIES-FIRST.md` for the full architecture.
>
> **The information below is retained for infrastructure verbs only.**

---

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

| Pattern | Meaning | Example Input | `args` in Handler |
|---------|---------|---------------|------------------|
| `look` | Exact match | "look" | `[]` |
| `look %s` | Rest of line | "look around here" | `["around here"]` |
| `give %i to %i` | Two items | "give sword to bob" | `[sword, bob]` |
| `wear %t` | This object | "wear shirt" | `[shirt]` |
| `eat %t` | This object | "eat apple" | `[apple]` |

`player`, `context`, and `command` are **direct variables** in verb handlers (provided by `callVerb()`), not elements inside `args`.

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
    const owner = await $load(dest.owner);
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

### Note on pattern codes

Only the following placeholder codes are currently implemented in the command matcher:
- `%i` (resolve an item from room contents + held items)
- `%t` (match the *handler object* name/aliases and pass the handler as an argument)
- `%s` (consume the rest of input as a string)

This is separate from the pronoun/template formatter used by `$pronoun.*` (which has its own formatting codes like `%d`, `%tN`, etc.).

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

### Important: `args` does not include `player`

Verb handlers receive **only pattern variables** in `args` (`%i`, `%t`, `%s`). The `player` who typed the command (and `context` + `command`) are available as direct variables.

If you see older examples that do things like `const player = args[0];`, those are from an earlier calling convention and are no longer correct.

### Handler Context

When a verb handler is called via `callVerb()`, the method body has access to these **direct variables**:

| Variable | Description |
|----------|-------------|
| `self` | The handler object (the object providing the verb) |
| `player` | The player who typed the command |
| `command` | The raw command string (e.g., "drop apple") |
| `context` | Connection context (telnet session info) |
| `args` | **Only the resolved pattern variables** (see below) |
| `$` | Object manager for loading objects |

### Pattern Argument Mapping

The `args` array contains **only the resolved pattern variables** (`%i`, `%t`, `%s`), NOT the player or context:

```javascript
// Pattern: 'eat %t'
// Input: "eat apple"
// args = [food]         // The resolved food object from %t
// player = <player>     // Direct variable, NOT in args

// Pattern: 'drop %i'
// Input: "drop sword"
// args = [sword]        // The resolved item from %i
// player = <player>     // Direct variable, NOT in args

// Pattern: 'give %i to %i'
// Input: "give sword to bob"
// args = [sword, bob]   // Two resolved items from %i %i
// player = <player>     // Direct variable, NOT in args

// Pattern: 'say %s'
// Input: 'say hello everyone'
// args = ['hello everyone']  // The rest of the line from %s
// player = <player>          // Direct variable, NOT in args

// Pattern: 'look' (no pattern variables)
// Input: "look"
// args = []             // Empty - no pattern variables
// player = <player>     // Direct variable
```

### Handler Signature

```javascript
obj.setMethod('doWear', `
  // Direct variables (NOT in args):
  //   player = the player who typed the command
  //   context = connection context
  //   self = this object (the handler)
  //
  // args = resolved pattern variables only:
  //   args[0] = first %i, %t, or %s value
  //   args[1] = second %i, %t, or %s value
  //   etc.

  // For pattern 'wear %t':
  //   args[0] = the clothing item (same as self)
  //   player = direct variable

  // Use 'player' directly, NOT args[0]
  const result = await self.wear(player);
  if (!result.success) return result.error;

  // Return string to send to player
  return 'You wear the ' + self.name + '.';
`);
```

### Example Handler

```javascript
obj.setMethod('doWear', `
  // Pattern: 'wear %t'
  // args[0] = clothing (same as self, from %t)
  // player = direct variable (the wearer)

  // 1. Call base method for state change
  const result = await self.wear(player);
  if (!result.success) return result.error;

  // 2. Swap verbs: unregister 'wear', register 'remove'
  await player.unregisterVerbsFrom(self);
  await player.registerVerb(['remove %t', 'take off %t'], self, 'doRemove');

  // 3. Announce to room
  const room = await $load(player.location);
  await $pronoun.announce(room, '%N puts on %d.', player, self);

  return result.message;
`);
```

### Common Pattern Examples

```javascript
// Pattern: 'drop %i' - args[0] is the item to drop
obj.setMethod('drop', `
  const item = args[0];  // Resolved item from %i
  // player is a direct variable

  if (!item) return 'Drop what?';

  await item.moveTo(player.location, player);
  return 'You drop ' + item.name + '.';
`);

// Pattern: 'help' or 'help %s' - args[0] is optional topic
obj.setMethod('help', `
  const topic = args[0];  // Optional topic from %s (or undefined)
  // player is a direct variable

  if (!topic) {
    return 'Available commands: look, get, drop, ...';
  }
  return 'Help for ' + topic + ': ...';
`);

// Pattern: 'eat %t' - args[0] is self (the food)
obj.setMethod('eat', `
  // args[0] = self (from %t, redundant but present)
  // player is a direct variable (the eater)

  const result = await self.consume(player);
  return result.success ? 'Delicious!' : result.error;
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
    const owner = await $load(source.owner);
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
      const exit = await $load(exitId);
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
    const owner = await $load(dest.owner);
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
    const owner = await $load(source.owner);
    await owner.unregisterVerbsFrom(self);
  }
`);
```

### onContentArrived() - Register for Contents

Called on container when something arrives:

```javascript
// $room.onContentArrived() - register exit verbs
async onContentArrived(obj, source, mover) {
  if (obj.isPlayer) {
    // Register exit verbs with player
    for (const [dir, exitId] of Object.entries(self.exits || {})) {
      const exit = await $load(exitId);
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
// $player.connect() - registers base commands
async connect() {
  await self.registerVerb(['look', 'l'], self, 'look');
  await self.registerVerb(['inventory', 'i'], self, 'inventory');
  await self.registerVerb(['say %s', '"%s"'], self, 'say');
  await self.registerVerb(['go %s'], self, 'go');
  await self.registerVerb(['get %i', 'take %i'], self, 'get');
  await self.registerVerb(['drop %i'], self, 'drop');
  await self.registerVerb(['quit', '@quit'], self, 'quit');

  // Move to starting location, trigger room hooks
  const startRoom = await $load(self.location);
  await startRoom.onContentArrived(self, null, self);
}
```

### Admin Extension

```javascript
// $admin.connect() - adds admin commands, then calls parent
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
// Food item - register verb when picked up
obj.setMethod('onArrived', `
  // onArrived is NOT a verb handler, it's a lifecycle hook
  // args[0] = dest, args[1] = source, args[2] = mover
  const dest = args[0];
  if (dest?.owner) {
    const owner = await $load(dest.owner);
    await owner.registerVerb(['eat %t'], self, 'doEat');
  }
`);

// Verb handler - uses direct 'player' variable
obj.setMethod('doEat', `
  // Pattern: 'eat %t'
  // args[0] = self (from %t, same as self)
  // player = direct variable (the eater)

  // Consume food
  const result = await self.consume(player);
  if (!result.success) return result.error;

  // Unregister verb (food is gone)
  await player.unregisterVerbsFrom(self);

  // Recycle object
  await $recycler.recycle(self);

  return 'You eat the ' + self.name + '.';
`);
```

## Best Practices

1. **Use `player` directly in verb handlers** - It's a direct variable, NOT `args[0]`
2. **`args` only contains pattern variables** - `%i`, `%t`, `%s` values, nothing else
3. **Register in onArrived, unregister in onLeaving** - Hooks handle the lifecycle
4. **Use unregisterVerbsFrom(source)** - Removes ALL verbs from that source
5. **Return strings from handlers** - They're sent to the player automatically
6. **Use %t for "this object"** - Cleaner than %i when verb is item-specific
7. **Include aliases** - `['eat %t', 'consume %t', 'devour %t']`
8. **Swap verbs on state change** - wear/remove, open/close, lock/unlock
9. **Check conditions in handlers** - Not at registration time

### Verb Handler vs Lifecycle Hook Args

**IMPORTANT:** Verb handlers and lifecycle hooks use different argument conventions:

| Method Type | args[0] | args[1] | args[2] | `player` variable |
|-------------|---------|---------|---------|-------------------|
| **Verb handler** (`doEat`, `drop`, etc.) | First %i/%t/%s | Second %i/%t/%s | Third... | ✓ Available |
| **Lifecycle hook** (`onArrived`, etc.) | dest | source | mover | ✗ Not available |
| **Direct call** (`moveTo`, etc.) | First arg passed | Second arg | Third... | ✗ Not available |

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
