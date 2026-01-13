---
name: Query Objects
description: Use this skill when asked to "find objects", "search for", "query objects", "list all", "get objects where", or when using $query to locate objects in Malice.
version: 1.0.0
---

# Query Objects with $query

## Basic Usage

```javascript
// Get query builder
const q = $query();

// Chain filters, then execute
const results = await q.parent($room).all();
```

## Filter Methods

### By Parent (Prototype)

```javascript
// All rooms
const rooms = await $query().parent($room).all();

// All players
const players = await $query().parent($player).all();

// All items
const items = await $query().parent($item).all();
```

### By Property Value

```javascript
// Exact match
const matches = await $query()
  .prop('name')
  .equals('Smith Tower')
  .all();

// Contains substring
const matches = await $query()
  .prop('name')
  .contains('Tower')
  .all();

// Numeric comparison
const heavyItems = await $query()
  .prop('weight')
  .gt(1000)  // greater than 1000 grams
  .all();

// Boolean check
const npcs = await $query()
  .prop('isNPC')
  .equals(true)
  .all();
```

### By Location

```javascript
// Objects in a specific room
const room = await $load(roomId);
const contents = room.contents;  // Array of object IDs

// Or query by location property
const inRoom = await $query()
  .prop('location')
  .equals(roomId)
  .all();
```

## Execution Methods

### Get All Results

```javascript
const all = await $query().parent($room).all();
// Returns array of RuntimeObjects
```

### Get First Result

```javascript
const first = await $query()
  .prop('name')
  .equals('Smith Tower')
  .first();
// Returns single RuntimeObject or null
```

### Get Count

```javascript
const count = await $query().parent($player).count();
// Returns number
```

## Chaining Filters

```javascript
// Multiple conditions (AND)
const results = await $query()
  .parent($room)
  .prop('z')
  .equals(0)  // ground level
  .prop('outdoor')
  .equals(true)
  .all();
```

## Common Patterns

### Find All NPCs in a Location

```javascript
const roomId = 173;
const npcs = await $query()
  .parent($human)
  .prop('location')
  .equals(roomId)
  .prop('isNPC')
  .equals(true)
  .all();
```

### Find Objects by Name Pattern

```javascript
const terminals = await $query()
  .prop('name')
  .contains('Terminal')
  .all();
```

### Find Rooms at a Z-Level

```javascript
const underground = await $query()
  .parent($room)
  .prop('z')
  .lt(0)  // negative z = underground
  .all();
```

### Find All Objects with a Custom Property

```javascript
const conscious = await $query()
  .prop('systemPrompt')
  .exists()
  .all();
```

## Processing Results

```javascript
const results = await $query().parent($room).all();

// Map to summary
const summary = results.map(r => ({
  id: r.id,
  name: r.name,
  coords: { x: r.x, y: r.y, z: r.z }
}));

// Filter further
const largeRooms = results.filter(r => r.width > 10);

// Count by property
const byLevel = {};
for (const r of results) {
  byLevel[r.z] = (byLevel[r.z] || 0) + 1;
}
```

## Performance Notes

- Queries scan the object collection
- Use `.first()` if you only need one result
- Add specific filters to narrow results
- Parent filter is efficient (uses type index)
