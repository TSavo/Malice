---
name: MOO Objects and Methods
description: Use this skill when asked about "MOO objects", "properties", "methods", "setMethod", "$load", "$recycler", "create objects", "edit methods", "object inheritance", "prototypes", or general MOO programming in Malice.
version: 1.0.0
---

# MOO Objects and Methods

## Core Concept

Everything in Malice is a MOO object. Rooms, items, players, NPCs, websites, documentation - all objects in MongoDB with properties and methods.

## Loading Objects

```javascript
// By ID
const obj = await $load(123);

// By alias (if registered)
const player = await $load('player');  // Returns $player prototype
const room = await $load('room');      // Returns $room prototype

// All aliases are on object #0
const obj0 = await $load(0);
const aliases = obj0.aliases;  // { player: 45, room: 67, ... }
```

## Reading Properties

```javascript
const obj = await $load(123);

// Direct access
const name = obj.name;
const desc = obj.description;

// Get method
const loc = obj.get('location');

// Check if property exists
const hasIt = obj.has('customProp');
```

## Setting Properties

```javascript
const obj = await $load(123);

// Direct assignment (persists automatically)
obj.name = 'New Name';
obj.customProp = { any: 'value' };

// Set method
obj.set('description', 'New description');
```

## Methods

Methods are TypeScript strings stored on objects. They execute with access to:
- `self` - The object the method is on
- `args` - Arguments passed to the method
- `$` - The ObjectManager (all $ aliases)
- `$load(id)` - Load any object
- `$aiQuery(...)` - Call AI
- All `$aliases` - $room, $player, $recycler, etc.

### Reading Methods

```javascript
const obj = await $load(123);
const methodCode = obj.getMethod('describe');
// Returns the method source as a string
```

### Setting Methods

```javascript
const obj = await $load(123);

obj.setMethod('greet', `
  /** Greet someone.
   *  @param target - Who to greet
   *  @returns Greeting message
   */
  const target = args[0];
  return 'Hello, ' + (target?.name || 'stranger') + '! I am ' + self.name;
`);
```

### Calling Methods

```javascript
const obj = await $load(123);
const result = await obj.call('greet', someTarget);
// Or directly
const result2 = await obj.greet(someTarget);
```

## Creating Objects

Always use `$recycler`:

```javascript
// Create from prototype
const newRoom = await $recycler.create($room, {
  name: 'My Room',
  description: 'A new room',
  x: 10, y: 20, z: 0
});

// Create with custom properties
const newItem = await $recycler.create($item, {
  name: 'Magic Sword',
  description: 'It glows faintly',
  weight: 1500,  // grams
  customProp: 'whatever'
});
```

## Inheritance

Objects inherit from their parent (prototype). Property/method lookup walks up the chain.

```javascript
const obj = await $load(123);

// Get parent
const parent = await obj.parent();

// Get all ancestors
const chain = await obj.ancestors();

// Check inheritance
const isRoom = await obj.isa($room);  // true if inherits from $room
```

## Key Prototypes

| Prototype | Purpose |
|-----------|---------|
| `$describable` | Base for all world objects |
| `$room` | Rooms with coordinates |
| `$exit` | Connections between rooms |
| `$agent` | Things that can act |
| `$human` | Human-shaped agents |
| `$player` | Player characters |
| `$item` | Portable objects |
| `$webRoute` | Website routes |

## Querying Objects

```javascript
// Find by property
const rooms = await $query().parent($room).all();

// Find by name
const matches = await $query()
  .prop('name')
  .contains('Tower')
  .all();

// Find by custom criteria
const npcs = await $query()
  .prop('isNPC')
  .equals(true)
  .all();
```

## Important Notes

- **Everything persists.** Changes save to MongoDB automatically.
- **Methods are live.** Edit a method, next call uses new code.
- **No restart needed.** Objects are hot-reloadable.
- **Use async/await.** Most operations are async.
