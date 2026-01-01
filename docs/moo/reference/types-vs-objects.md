# Types vs Objects

Malice has a two-tier object system: **Types** (prototypes) and **Objects** (instances). Understanding when to use each is essential for building the world.

## Quick Reference

| Aspect | Types (`$.define`) | Objects (`$recycler.create`) |
|--------|-------------------|------------------------------|
| **ID Format** | String (e.g., `'bandage'`) | Numeric (e.g., `#42`) |
| **Collection** | `types` | `objects` |
| **Lifecycle** | Permanent | Recyclable |
| **Parent** | Must be another type | Can be type or object |
| **Aliasing** | Auto-aliased by name | Manual via `$.addAlias()` |
| **Purpose** | Prototypes, templates | Game entities, instances |
| **Creation** | Bootstrap or runtime | Runtime |

## Types (Prototypes)

Types are templates that define shared behavior and default properties. They form the inheritance hierarchy.

### Creating Types

Use `$.define(name, parent, options)` to create a type:

```javascript
// From MOO code at runtime
// Variable uses $ prefix to indicate it's a type alias
const $bandage = await $.define('bandage', $medical, {
  properties: {
    name: 'Bandage',
    description: 'A simple cloth bandage.',
    healAmount: 5,
    maxUses: 3,
  },
  methods: {
    use: `
      const target = args[0];
      target.hp = Math.min(target.maxHp, target.hp + self.healAmount);
      self.uses--;
      if (self.uses <= 0) {
        await $recycler.recycle(self);
      }
      return 'You apply the bandage.';
    `
  }
});

// Now $bandage is available as an alias
const myBandage = await $recycler.create($bandage, { name: 'My Bandage' });
```

### Type Characteristics

- **String IDs**: Types use their name as ID (e.g., `'bandage'`, `'weapon'`)
- **Auto-aliased**: Creating `$.define('bandage', ...)` automatically creates `$bandage`
- **Permanent**: Types cannot be recycled - they're part of the world schema
- **Parent must be a type**: You can only inherit from other types
- **Stored in `types` collection**: Separate MongoDB collection from objects

### When to Create Types

Create a type when you need:

1. **A reusable template** - Multiple objects will share this behavior
2. **An inheritance point** - Other types will inherit from this
3. **Shared methods** - Common logic for a category of objects
4. **A prototype alias** - Quick access via `$myType`

**Examples of types:**
- `$weapon` - Base for all weapons
- `$pistol` - Inherits from `$weapon`, base for pistols
- `$food` - Base for edible items
- `$clothing` - Base for wearable items

## Objects (Instances)

Objects are concrete game entities - the actual things players interact with.

### Creating Objects

Use `$recycler.create(parent, properties)` to create an object:

```javascript
// Create an instance of $bandage
const bandage = await $recycler.create($bandage, {
  name: 'Dirty Bandage',
  description: 'A used bandage. Better than nothing.',
  healAmount: 2,
});

// Create an NPC
const guard = await $recycler.create($human, {
  name: 'City Guard',
  description: 'A stern-looking guard in blue uniform.',
});
await guard.moveTo(room);

// Create a room
const room = await $recycler.create($room, {
  name: 'Alley',
  description: 'A dark alley between buildings.',
  x: 5, y: 10, z: 0,
});
```

### Object Characteristics

- **Numeric IDs**: Objects use sequential integers (e.g., `#42`, `#1337`)
- **Recyclable**: Can be destroyed and reused via `$recycler.recycle()`
- **Parent can be type or object**: Inherit from `$bandage` or clone another object
- **Manual aliasing**: Use `$.addAlias('name', obj.id)` if needed
- **Stored in `objects` collection**: Separate MongoDB collection from types

### When to Create Objects

Create an object when you need:

1. **A game entity** - Something players interact with
2. **A unique instance** - One-off or specific item
3. **Temporary entities** - Will be recycled later
4. **Runtime spawning** - Created during gameplay

**Examples of objects:**
- A specific sword in a room
- An NPC guarding a door
- A player character
- A room in the world

## The Inheritance Chain

Types and objects share the same inheritance mechanism. When looking up a property or method:

1. Check the object/type itself
2. Walk up the parent chain (parent's parent, etc.)
3. Stop when found or reach `$root`

```
$root (type)
  └─ $describable (type)
       └─ $item (type)
            └─ $weapon (type)
                 └─ $pistol (type)
                      └─ #42 "Rusty Pistol" (object)
```

Both `$pistol` (type) and `#42` (object) can have their own properties and methods that override inherited ones.

## The Recommended Pattern: Define Then Create

**Builders SHOULD define new types, then create objects from them.**

This is the core pattern for building content in Malice:

1. **Define a type** with `$.define()` - establishes the template
2. **Create objects** from that type with `$recycler.create()` - spawns instances

This pattern gives you:
- **Reusability** - One type, many instances
- **Maintainability** - Change the type, all instances inherit updates
- **Organization** - Clear prototype hierarchy
- **Aliasing** - Quick access via `$yourType`

```javascript
// Create a new weapon type at runtime
// Variable uses $ prefix to indicate it's a type alias
const $plasmaRifle = await $.define('plasmaRifle', $rifle, {
  properties: {
    name: 'Plasma Rifle',
    damage: 25,
    ammoType: 'plasma cell',
  },
  methods: {
    fire: `
      // Custom firing behavior
      await self.consumeAmmo(1);
      return await pass(); // Call parent's fire method
    `
  }
});

// Now spawn instances
const rifle = await $recycler.create($plasmaRifle, {
  name: 'Modified Plasma Rifle',
  damage: 30,
});
```

## Low-Level vs High-Level Creation

### `$create()` - Low-level object creation

Direct object creation without lifecycle hooks:

```javascript
const obj = await $create({
  parent: $item,
  properties: { name: 'Thing' },
  methods: {}
});
```

### `$recycler.create()` - High-level object creation

Recommended for game objects - includes:
- Permission checks (caller must be wizard or have `canBuild`)
- Ownership tracking (`owner`, `createdBy`, `createdAt`)
- Automatic alias generation from name
- Object pooling (reuses recycled objects)
- `onCreate` hook invocation

```javascript
const obj = await $recycler.create($item, {
  name: 'Magic Sword',
}, player); // Optional caller for ownership
```

### `$.define()` - Type creation

For creating new prototypes (types):

```javascript
// Variable uses $ prefix to indicate it's a type alias
const $newType = await $.define('newType', $parentType, {
  properties: { ... },
  methods: { ... }
});
```

## Best Practices

### The Golden Rule: Define Before Create

When building new content, **always define a type first**, then create instances:

```javascript
// GOOD: Define type, then create instances
// Variable uses $ prefix to indicate it's a type alias
const $securityCamera = await $.define('securityCamera', $device, {
  properties: {
    name: 'Security Camera',
    recording: true,
    abilities: 'Surveillance device. When recording is true, logs events.',
  }
});

// Now create instances from the type
await $recycler.create($securityCamera, { name: 'Lobby Camera' });
await $recycler.create($securityCamera, { name: 'Entrance Camera' });

// BAD: Creating objects directly from generic parents
await $recycler.create($device, { name: 'Security Camera', recording: true });
await $recycler.create($device, { name: 'Another Camera', recording: true });
// ^ Duplicates properties, no shared behavior, no alias
```

### Use Types For:
- **Any new category of thing** - Even if you only need one instance
- Shared behavior across instances
- Inheritance points for further specialization
- Getting a prototype alias (`$myType`)

### Use Objects For:
- Specific instances placed in the world
- Player-owned items
- NPCs and characters
- Rooms and locations

### Naming Conventions
- Types: lowercase, singular (e.g., `bandage`, `plasmaRifle`)
- Objects: Natural names with articles (e.g., `'A Rusty Pistol'`)

### Inheritance Tips
- Keep type hierarchies shallow (3-4 levels max)
- Put shared logic in the highest appropriate type
- Use `pass()` to call parent methods when overriding

## See Also

- [Globals Reference](./globals.md) - `$recycler`, `$.define`, `$create`
- [Prototypes Reference](./prototypes.md) - Built-in type hierarchy
- [World Building](../prototypes/world-building.md) - Creating game content
