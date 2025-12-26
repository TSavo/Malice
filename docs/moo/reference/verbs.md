# Verb System Reference

The verb system handles player commands by matching input against registered patterns and dispatching to handler methods.

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
> **Everything else goes through the AI narrator.**
>
> See `docs/ABILITIES-FIRST.md` for the full architecture.

---

## Overview

When a player types a command:
1. Input is matched against registered verb patterns
2. Placeholders (`%i`, `%t`, `%s`) are resolved to objects/strings
3. The matched handler method is called with resolved arguments
4. The result is returned to the player

## Pattern Syntax

Verb patterns consist of literal words and placeholders:

| Placeholder | Meaning | Resolution |
|-------------|---------|------------|
| `%i` | Item | Resolves to a `RuntimeObject` from room contents + held items |
| `%t` | This handler | Input must match the handler object's `name` or `aliases`; pushes the handler object |
| `%s` | String | Captures remaining input as a string |

Only `%i`, `%t`, and `%s` are currently implemented in the matcher.

### Pattern Examples

```javascript
// Simple verb
'look'                    // No arguments

// Item patterns
'get %i'                  // get sword, get apple
'drop %i'                 // drop sword

// Target patterns (handler object)
'eat %t'                  // eat apple (where apple is the handler)
'wear %t'                 // wear shirt

// String patterns
'say %s'                  // say hello everyone
'emote %s'                // emote waves hello

// Complex patterns
'put %i in %t'            // put sword in chest
'give %i to %i'           // give apple to bob
'look %i in %t'           // look key in drawer
```

## Registering Verbs

## How Verb Registration Works (Internal Model)

At runtime, verbs are stored on the *agent* (player/NPC) in `self.verbs` as a map keyed by the verb pattern:

```javascript
self.verbs = {
  'look': { obj: playerObject, method: 'look' },
  'get %i': { obj: playerObject, method: 'get' },
  'eat %t': { obj: appleObject, method: 'eat' },
};
```

- The map key is the **exact pattern string** you registered.
- The value contains:
  - `obj`: the **handler object** (a `RuntimeObject`) to dispatch to
  - `method`: the **method name** to invoke on `obj`

### `registerVerb(patterns, sourceObj, methodName?)`

`registerVerb` takes a pattern (or array of patterns) and stores each pattern in `self.verbs`.

If `methodName` is omitted, it is derived from the *first word of the pattern*.

Important: derivation also strips `%i`, `%t`, `%s` from the first word, so unusual patterns can produce surprising method names.


Verbs are registered on an Agent (Player/NPC) using `registerVerb()`:

```javascript
// Register a single pattern
await player.registerVerb('look', player, 'look');

// Register multiple patterns for the same handler
await player.registerVerb(
  ['eat %t', 'eat ' + self.name],  // Patterns array
  self,                             // Handler object (the food)
  'eat'                             // Method to call
);

// Method name derived from pattern if not specified
await player.registerVerb(['get %i', 'take %i', 'grab %i'], player);
// Derives method name 'get' from first word
```

### Registration Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `patterns` | `string \| string[]` | Pattern(s) to match |
| `sourceObj` | `RuntimeObject` | Object providing the handler method |
| `methodName` | `string?` | Method to call (optional, derived from first word) |

## Unregistering Verbs

```javascript
// Remove a specific pattern
await player.unregisterVerb('eat apple');

// Remove ALL verbs provided by an object
await player.unregisterVerbsFrom(foodItem);
```

## Verb Lifecycle

Verbs are typically registered/unregistered via hooks:

### onArrived - Register When Item Arrives

```javascript
// Food registers 'eat' when picked up or entering a room
obj.setMethod('onArrived', `
  const dest = args[0];

  // If arriving in a player's hand
  if (dest && dest.owner) {
    const owner = dest.owner;
    if (owner.registerVerb) {
      await owner.registerVerb(['eat %t', 'eat ' + self.name], self, 'eat');
    }
  }
`);
```

### onLeaving - Unregister When Item Leaves

```javascript
// Clothing unregisters verbs when leaving a container
obj.setMethod('onLeaving', `
  const source = args[0];

  if (source && source.owner) {
    const owner = source.owner;
    if (owner.unregisterVerbsFrom) {
      await owner.unregisterVerbsFrom(self);
    }
  }
`);
```

### Verb Swapping on State Change

```javascript
// Clothing: wear -> remove verb swap
obj.setMethod('doWear', `
  // ... wear logic ...

  // Unregister 'wear' verb
  await wearer.unregisterVerbsFrom(self);

  // Register 'remove' verb instead
  await wearer.registerVerb(
    ['remove %t', 'take off %t', 'remove ' + self.name],
    self,
    'doRemove'
  );
`);
```

## Item Resolution

### Resolution Rules (What `%i` actually does)

The `%i` placeholder calls `resolveItem(text)` on the agent.

- Search scope is **room contents + held items** (hands)
- Matching is case-insensitive and supports:
  - exact match against `name` and `aliases`
  - partial match (`startsWith` or `includes`) against `name` and `aliases`
- If multiple matches are found and no ordinal is provided, resolution fails with a disambiguation prompt like `Which sword? (1. rusty sword, 2. silver sword)`.


The `%i` placeholder resolves item names to RuntimeObjects:

### Search Scope

Items are searched in:
1. Current room's contents
2. Items in the player's hands

### Ordinal Support

Players can use ordinals to disambiguate:

```
get sword           // Gets first sword (or prompts if multiple)
get first sword     // Gets first match
get second sword    // Gets second match
get 2nd apple       // Numeric ordinals work too
get last sword      // Gets the last match
```

Supported ordinals:
- Words: `first`, `second`, `third`, ... `tenth`
- Numeric: `1st`, `2nd`, `3rd`, ... `10th`
- Special: `last`

### Ambiguity Handling

When multiple items match without an ordinal:

```
> get sword
Which sword? (1. rusty sword, 2. silver sword)
```

The verb returns an error prompting the player to specify.

## Pattern Matching

### Matching Algorithm

Internally, `matchVerb(input)`:

1. Collects all registered patterns: `Object.keys(self.verbs)`
2. Sorts them by **specificity** (more whitespace-separated parts first)
3. Tries each pattern in order via `tryMatchPattern(input, pattern, verbInfo)`
4. Returns the first successful match

A key detail: if a pattern *matches structurally* but item resolution fails (not found / ambiguous), the matcher returns that error immediately instead of trying less-specific patterns.


### Match Priority

Patterns are sorted by specificity (more parts = higher priority):

```javascript
// If both patterns are registered:
'put %i in %t'    // More specific (4 parts)
'put %i'          // Less specific (2 parts)

// Input: "put sword in chest"
// Matches: 'put %i in %t' (higher priority)
```

### Literal Matching

Literal words must match exactly (case-insensitive):

```javascript
'look at %i'      // Matches: "look at sword"
                  // No match: "look sword" (missing 'at')
```

### Target Resolution (%t)

The `%t` placeholder must match the handler object:

```javascript
// Handler: apple with name "red apple", aliases: ["apple"]
'eat %t'

// Matches: "eat red apple", "eat apple"
// No match: "eat banana" (wrong handler)
```

## Dispatch and Handler Context

When `player.onInput()` matches a verb, it dispatches like this:

```ts
const result = await match.handler.callVerb(
  match.verbInfo.method,
  context,
  player,
  trimmed,
  match.args
);
```

Inside the handler method (the code string you set with `setMethod()`), these are available as **direct variables**:

- `self`: the handler object (the object you registered as `sourceObj`)
- `player`: the object that typed the command
- `context`: the connection/session context
- `command`: the raw input line
- `$`: object manager / helpers
- `args`: **only** the resolved pattern variables, in placeholder order
- `pass(...)`: call parent implementation

### `args` mapping

`args` contains the resolved values for `%i`, `%t`, `%s` in the order they appear in the pattern. It does **not** include `player` or `context`.

Examples:

- Pattern: `look` → `args = []`
- Pattern: `say %s` → `args = ["hello there"]`
- Pattern: `give %i to %i` → `args = [itemObject, targetObject]`
- Pattern: `eat %t` → `args = [self]`

## Handler Method Signature

When a verb is matched, the handler method runs with these direct variables:

```javascript
obj.setMethod('eat', `
  // Standard variables available:
  // - context: Connection context
  // - player: The player who typed the command
  // - command: Raw input string
  // - self: The handler object (this)

  // Resolved arguments from pattern:
  // args[0], args[1], etc. contain resolved %i, %t, %s values

  const target = args[0];  // First placeholder value

  return 'You eat the ' + target.name + '.';
`);
```

### Argument Order

Arguments are passed in the order placeholders appear in the pattern:

```javascript
// Pattern: 'put %i in %t'
// Input: "put sword in chest"
// args[0] = sword (RuntimeObject)
// args[1] = chest (RuntimeObject)

// Pattern: 'give %i to %i'
// Input: "give apple to bob"
// args[0] = apple (RuntimeObject)
// args[1] = bob (RuntimeObject)
```

## Default Player Verbs (Infrastructure Only)

### Note: Abilities-First

Most traditional verbs (get, drop, eat, wear, unlock, attack) have been **removed** in favor of AI interpretation. The AI narrator reads object abilities and handles these interactions.

Default player verbs are registered in `src/database/bootstrap/prototypes/player-builder.ts` via `connect()`.

**Infrastructure verbs that remain coded:**

| Pattern | Method | Description |
|---------|--------|-------------|
| `look`, `l` | `look` | Look at surroundings |
| `glance` | `glance` | Quick look |
| `say %s`, `"%s`, `'%s` | `say` | Say something |
| `whisper %s to %i` | `whisper` | Private message |
| `shout %s` | `shout` | Loud announcement |
| `emote %s`, `:%s` | `emote` | Perform an action |
| `to %i %s` | `addressTo` | Speak to specific entity |
| `north`, `south`, etc. | via exits | Movement |
| `inventory`, `i` | `inventory` | List carried items |
| `exits` | `exits` | Show available exits |
| `help`, `help %s` | `help` | Get help |
| `quit`, `@quit` | `quit` | Disconnect |

**Removed (now AI-interpreted):**
- `get`, `take`, `grab`, `lift`, `drag` → AI reads hand abilities
- `drop`, `put`, `place` → AI reads grasping abilities
- `eat`, `drink`, `consume` → AI reads edible abilities
- `wear`, `remove`, `don`, `doff` → AI reads wearable abilities
- `open`, `close`, `unlock`, `lock` → AI reads door/lock abilities
- `attack`, `fight`, `hit` → AI reads combat abilities

## Implementation Details

### Important limitation: ONLY `%i`, `%t`, `%s`

The core command matcher currently special-cases only `%i`, `%t`, and `%s`. Any other placeholder token will be treated as a literal word and will not match player input.

This does **not** refer to the pronoun/template formatter (used by `$.pronoun.*`), which has its own formatting codes like `%d`, `%tN`, etc.

If you need additional verb placeholder types, the right fix is to extend `tryMatchPattern` in `src/database/bootstrap/prototypes/agent-builder.ts`.


### Verb Storage

Verbs are stored in `self.verbs` as a pattern-keyed object:

```javascript
self.verbs = {
  'eat apple': { obj: appleObject, method: 'eat' },
  'eat %t': { obj: appleObject, method: 'eat' },
  'look': { obj: playerObject, method: 'look' },
  // ...
};
```

### Matching Process

1. `matchVerb(input)` - Entry point for matching
2. Patterns sorted by specificity (descending)
3. Each pattern tested via `tryMatchPattern(input, pattern, verbInfo)`
4. First successful match returns handler info
5. Resolution errors (ambiguous, not found) returned immediately

### Error Handling

```javascript
const match = await self.matchVerb(trimmed);

if (match && match.error) {
  // Pattern matched but resolution failed
  // e.g., "Which sword?" or "You don't see that here."
  await self.tell(match.error);
} else if (match && match.handler) {
  // Success - dispatch to handler
  const result = await match.handler.callVerb(...);
} else {
  // No matching pattern
  await self.tell('I don\'t understand that.');
}
```

## Best Practices

### 1. Use Specific Patterns First

Register more specific patterns alongside generic ones:

```javascript
await owner.registerVerb([
  'eat ' + self.name,  // Specific: "eat apple"
  'eat %t'             // Generic: "eat <matching-item>"
], self, 'eat');
```

### 2. Clean Up on Departure

Always unregister verbs when an item leaves:

```javascript
obj.setMethod('onLeaving', `
  const source = args[0];
  if (source && source.owner && source.owner.unregisterVerbsFrom) {
    await source.owner.unregisterVerbsFrom(self);
  }
`);
```

### 3. Swap Verbs on State Change

When an item changes state, swap its verbs:

```javascript
// Door: when opened, unregister 'open', register 'close'
// Clothing: when worn, unregister 'wear', register 'remove'
```

### 4. Document Handler Methods

Use JSDoc comments for help system:

```javascript
obj.setMethod('eat', `
  /** Eat this food item.
   *  Usage: eat <item>
   *  Consumes a bite of food, providing calories and hydration.
   */
  // ... implementation
`);
```

The `help` command extracts these docblocks for player help.

## See Also

- [Prototypes Reference](./prototypes.md) - Object types that use verbs
- [Event Hooks](./hooks.md) - onArrived/onLeaving lifecycle
- [Architecture](../architecture.md) - How methods are executed

