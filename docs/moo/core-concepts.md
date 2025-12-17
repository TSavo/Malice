# Core Concepts

Essential concepts for working with Malice's object system.

## The In-Memory Architecture

**All objects live in memory.** At startup, every object is loaded from MongoDB into the cache. This means:

- Object references (`objref`) **always** resolve to RuntimeObjects
- Object identity (`===`) just works
- No "cache miss" scenarios
- Database is only accessed for: startup load, writes, and replica set sync

## Property Access

**NEVER use `.get()`, `.set()`, or `.call()` directly.** The Proxy handles everything.

### The Proxy Magic

```javascript
// DO: Just use properties directly
self.name = 'Bob';
const n = self.name;

// DON'T: Never call these manually
self.set('name', 'Bob');     // NO!
const n = self.get('name');  // NO!
```

The `RuntimeObject` Proxy automatically converts between JavaScript and MOO value types. When you set a property, it calls `.set()` internally. When you read it, it calls `.get()`. **You never need to do this yourself.**

### Natural JavaScript

```javascript
// Properties work like regular JavaScript
self.location = room;
const loc = self.location;  // Returns RuntimeObject, always
await loc.announce('Hello!');

// Arrays work naturally too
self.contents = [item1, item2, item3];
const items = self.contents;  // Array of RuntimeObjects
```

## Object References

### Store Objects, Not IDs

**Always store RuntimeObjects directly. Never use `.id` for storage.**

```javascript
// DO: Store RuntimeObjects directly
self.location = room;
self.owner = player;
self.target = enemy;
self.contents = [item1, item2];

// DON'T: Never store IDs
self.location = room.id;      // NO! Loses type information
self.owner = player.id;       // NO! Becomes number, not objref
```

When you store a RuntimeObject, the system automatically creates an `objref`:
```javascript
self.owner = player;  // Stored as: { type: 'objref', value: 42 }
```

When you read it back, you get the RuntimeObject:
```javascript
const owner = self.owner;  // Returns RuntimeObject for #42
await owner.tell('Hello!');  // Just works
```

### Object Identity with `===`

**Use `===` for object comparison. Never compare `.id` values.**

```javascript
// DO: Use === for identity comparison
if (self.location === otherPlayer.location) {
  // We're in the same room
}

if (item.owner === self) {
  // I own this item
}

// Skip self in loops
for (const obj of room.contents) {
  if (obj === self) continue;  // Skip myself
  await obj.tell('Hello!');
}

// DON'T: Never compare IDs
if (self.location.id === otherPlayer.location.id) { }  // NO! Pointless
if (item.owner.id === self.id) { }  // NO! Use ===
```

**Why `===` works:** All objects are singleton proxies in the cache. Two references to the same object are literally the same JavaScript object.

## Property Types

All properties are stored as typed values in MongoDB:

| Type | Stored As | Read As |
|------|-----------|---------|
| `string` | `{ type: 'string', value: '...' }` | `'...'` |
| `number` | `{ type: 'number', value: 42 }` | `42` |
| `boolean` | `{ type: 'boolean', value: true }` | `true` |
| `array` | `{ type: 'array', value: [...] }` | `[...]` (recursive) |
| `object` | `{ type: 'object', value: {...} }` | `{...}` (recursive) |
| `objref` | `{ type: 'objref', value: 42 }` | RuntimeObject |

### Arrays and Nested Objects

References are resolved **recursively** in arrays and nested objects:

```javascript
// Setting an array with RuntimeObjects
self.bodyParts = [head, torso, leftArm, rightArm];
// Stored as array of objrefs

// Reading returns array of RuntimeObjects
const parts = self.bodyParts;
for (const part of parts) {
  await part.describe();  // Each is a RuntimeObject
}

// Nested objects work too
self.relationships = {
  mother: momObj,
  father: dadObj,
  friends: [friend1, friend2]
};
```

## Loading Objects

### When You Need `$.load()`

Since all objects are in memory, you rarely need `$.load()`. Use it when:

1. **Loading by numeric ID** (from external input):
```javascript
const obj = await $.load(42);  // Load object #42
const obj = await $[42];       // Shorthand
```

2. **Loading from a string** (user input, database ID):
```javascript
const targetId = parseInt(args[0]);
const target = await $.load(targetId);
```

### You Don't Need `$.load()` For Properties

```javascript
// Since all objects are in memory:
const owner = self.owner;        // Already a RuntimeObject
await owner.tell('Hello!');      // Just works

// You DON'T need to do this:
const owner = await $.load(self.owner);  // Unnecessary!
```

## How `$` Works

The `$` variable is a **Proxy** to the ObjectManager (#0).

### `$` Is the ObjectManager

```javascript
// $ IS #0 - these are all the same object
$                    // The ObjectManager
await $.load(0)      // Load #0
await $[0]           // Load #0 by index

// $ has an 'aliases' property - a simple { name: id } map
$.aliases
// { nothing: -1, root: 1, system: 2, english: 5, format: 6, ... }
```

### How `$.alias` Syntax Works

When you write `$.english`, the Proxy does this:

```javascript
// $.english internally does:
const id = $.aliases['english'];  // Look up 'english' in $.aliases -> 5
const obj = await $.load(id);     // Load object #5
return obj;                       // Return the RuntimeObject
```

So `$.english.plural('cat')` is really:
1. Get `$.aliases` property (from #0)
2. Find `english` -> `5`
3. Return object #5 (already in memory)
4. Call its `plural` method

### Why Use Aliases?

```javascript
// DON'T: Hardcoded IDs break when database changes
const english = await $[5];  // What if english is #7 in this DB?

// DO: Aliases are stable across databases
const english = $.english;   // Always works
```

### Managing Aliases

```javascript
// Add an alias (makes $.myUtils work)
await $.addAlias('myUtils', obj);  // Pass object, not .id

// Remove an alias
await $.removeAlias('myUtils');  // Returns true if removed

// Look up an alias
const id = await $.getAlias('myUtils');  // Returns ID or undefined

// Direct access to the map (read-only preferred)
const allAliases = $.aliases;
```

### Core Aliases (Protected)

These four aliases are protected and cannot be removed:

| Alias | Object | Purpose |
|-------|--------|---------|
| `nothing` | #-1 | Null reference |
| `object_manager` | #0 | ObjectManager itself |
| `root` | #1 | Base prototype for all objects |
| `system` | #2 | Connection router, player tracking |

## Quick Reference

| Operation | Syntax |
|-----------|--------|
| Set property | `self.owner = player` |
| Get property | `const owner = self.owner` |
| Compare objects | `if (a === b)` |
| Store in array | `self.items = [item1, item2]` |
| Load by ID | `await $.load(42)` or `await $[42]` |
| Access utility | `$.english` or `$.format` |
| Add alias | `await $.addAlias('name', obj)` |

## Anti-Patterns to Avoid

```javascript
// WRONG: Using .get()/.set()
self.set('name', 'Bob');
const n = self.get('name');

// WRONG: Storing IDs instead of objects
self.owner = player.id;

// WRONG: Comparing IDs
if (a.id === b.id) { }

// WRONG: Unnecessary $.load()
const loc = await $.load(self.location);  // location is already RuntimeObject
```

## See Also

- [Architecture](./architecture.md) - In-memory object system
- [Best Practices](./best-practices.md) - Composition over duplication
- [Anti-Patterns](./reference/anti-patterns.md) - Common mistakes
- [Utilities](./utilities/) - Available utility objects
