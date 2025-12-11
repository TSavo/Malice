# Core Concepts

Essential concepts for working with Malice's object system.

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

### Why the Proxy Exists

```javascript
// Without Proxy - verbose and error-prone
await obj.set('location', { type: 'objref', value: room.id });
const loc = await obj.get('location');
const locObj = typeof loc === 'number' ? await $.load(loc) : loc;

// With Proxy - natural JavaScript
obj.location = room;
const loc = await $.load(obj.location); // Always safe
```

## Property Types

All properties are stored as typed values in MongoDB:

| Type | Stored As | Read As |
|------|-----------|---------|
| `string` | `{ type: 'string', value: '...' }` | `'...'` |
| `number` | `{ type: 'number', value: 42 }` | `42` |
| `boolean` | `{ type: 'boolean', value: true }` | `true` |
| `array` | `{ type: 'array', value: [...] }` | `[...]` (recursive) |
| `object` | `{ type: 'object', value: {...} }` | `{...}` (recursive) |
| `objref` | `{ type: 'objref', value: 42 }` | RuntimeObject (if cached) or ID |

### Object References (`objref`)

**Object references are stored as IDs but resolved to RuntimeObjects when read.**

```javascript
// WRITING: RuntimeObject → stored as objref
self.owner = player;  // player is a RuntimeObject
// Stored as: { type: 'objref', value: 42 }  (where 42 is player.id)

// READING: objref → RuntimeObject (if in cache)
const owner = self.owner;
// If #42 is cached: returns RuntimeObject (can call owner.tell())
// If #42 not cached: returns raw ID (42)
```

### The Caching Gotcha

Object references only resolve to RuntimeObjects if the target is **already in the cache**:

```javascript
// UNSAFE: Object might not be cached
const owner = self.owner;  // Might be RuntimeObject OR raw ID!
if (typeof owner === 'number') {
  owner = await $.load(owner);
}

// SAFE: Always use $.load() for object refs you need to call
const owner = await $.load(self.owner);  // Always returns RuntimeObject
await owner.tell('Hello!');  // Safe to call methods
```

### Never Use `.id` for Storage

```javascript
// DO: Store RuntimeObjects directly
self.location = room;
self.owner = player;
self.contents = [item1, item2];

// DON'T: Never use .id - it's pointless
self.location = room.id;      // NO! Why would you do this?
self.owner = player.id;       // NO! Just use player!
```

**The system stores objrefs automatically.** When you write `self.location = room`, it stores `{ type: 'objref', value: 42 }` for you. Using `.id` is:
- **Pointless** - the system extracts IDs automatically
- **Harmful** - you lose type information (becomes `number` not `objref`)

**Exception: Comparison is fine.**
```javascript
if (viewer.id === actor.id) continue;  // ✓ Comparing IDs
if (viewer === actor) continue;        // ✓ Also works (same cache instance)
```

## Loading Objects

### $.load() - Always Safe

```javascript
// SAFE: $.load() always returns RuntimeObject (loads if needed)
const loc = await $.load(self.location);
await loc.announce('Hello!');  // Always works

// Works whether self.location is objref OR number
// $.load() handles both cases
```

### Why $.load() Works Either Way

```javascript
// If self.location resolved to RuntimeObject:
const loc = await $.load(self.location);  // Returns it immediately

// If self.location resolved to number:
const loc = await $.load(self.location);  // Loads #42 from database
```

### $[id] Shorthand

```javascript
// Load by numeric ID
const obj = await $[42];
const obj = await $.load(42);  // Equivalent
```

## Arrays and Objects with References

References are resolved **recursively** in arrays and nested objects:

```javascript
// Setting an array with RuntimeObjects
self.bodyParts = [head, torso, leftArm, rightArm];
// Stored as: { type: 'array', value: [
//   { type: 'objref', value: 10 },
//   { type: 'objref', value: 11 },
//   { type: 'objref', value: 12 },
//   { type: 'objref', value: 13 }
// ]}

// Reading resolves each element
const parts = self.bodyParts;
// Returns: [RuntimeObject, RuntimeObject, RuntimeObject, RuntimeObject]
// (if all are cached)
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
3. Load object #5
4. Call its `plural` method

### The Alias Registry

All aliases live in `$.aliases`:

```javascript
{
  nothing: -1,           // Special: null reference
  object_manager: 0,     // #0 itself
  root: 1,               // Base prototype for all objects
  system: 2,             // Connection router, player management

  // Utilities (dynamically assigned IDs)
  english: 5,
  pronoun: 6,
  format: 7,
  recycler: 8,
  // ... etc
}
```

IDs above 2 are **dynamic**—they're assigned at bootstrap time and may differ between databases. That's why you use `$.english` instead of hardcoded IDs.

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

| Operation | Use |
|-----------|-----|
| Store reference | `self.owner = player` |
| Read (safe) | `await $.load(self.owner)` |
| Read (if cached) | `self.owner` |
| Load by ID | `await $.load(42)` or `await $[42]` |
| Access utility | `$.english` or `$.format` |
| Add alias | `await $.addAlias('name', obj)` |

## See Also

- [Architecture](./architecture.md) - Three-layer system
- [Best Practices](./best-practices.md) - Composition over duplication
- [Utilities](./utilities/) - Available utility objects
