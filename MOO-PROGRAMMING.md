# MOO Programming Guide

This guide teaches you how to write code for Malice, a MOO-style virtual world engine. Methods are written in **TypeScript** and run on the server.

## What is a MOO?

A MOO is a text-based virtual world where everything is an **object**. Players are objects. Rooms are objects. Items are objects. Each object can have:

- **Properties** - Data like `name`, `description`, `hp`
- **Methods** - Code that does things like `look`, `say`, `attack`
- **A Parent** - Objects inherit from their parent (like classes in OOP)

## Your First Method

Here's a simple method that greets someone:

```typescript
// Method: greet
const name = args[0] || 'stranger';
return `Hello, ${name}!`;
```

When someone calls `await obj.greet('Alice')`, it returns `"Hello, Alice!"`.

## The Magic Variables

Every method has access to these variables automatically:

| Variable | What it is |
|----------|------------|
| `self` | The object this method belongs to |
| `$` | Access to ALL objects in the world |
| `args` | Arguments passed to this method |
| `player` | The player who triggered this action |
| `context` | The connection (for sending messages) |

### `self` - The Current Object

`self` is the object your code is running on:

```typescript
// Get properties
const myName = self.name;
const myHp = self.hp;

// Set properties (auto-saves!)
self.hp = 100;
self.description = 'A brave adventurer';

// Call other methods on yourself
await self.describe();
```

### `$` - The Object Manager

`$` is your gateway to every object in the world:

```typescript
// Load an object by ID
const room = await $.load(42);

// Use registered aliases (set up by the system)
const recycler = $.recycler;      // Creates new objects
const root = $.root;              // Base of all inheritance

// Access prototypes
const playerProto = $.player;     // Player prototype
const roomProto = $.room;         // Room prototype
```

### `args` - Method Arguments

Arguments passed to your method:

```typescript
// Method: attack
const target = args[0];    // First argument
const weapon = args[1];    // Second argument

// With defaults
const damage = args[2] || 10;
```

### `player` - Who Did This?

The player who triggered this action:

```typescript
// Method: look (on a Room)
// Don't show the player themselves in the room
const contents = self.contents.filter(id => id !== player.id);
```

## Properties

Properties are just data on an object. Access them directly:

```typescript
// Reading
const name = self.name;
const hp = self.hp;
const items = self.inventory;

// Writing (auto-saves to database!)
self.name = 'Alice';
self.hp = 100;
self.inventory = [1, 2, 3];
```

### Property Types

| Type | Example |
|------|---------|
| String | `self.name = 'Sword'` |
| Number | `self.damage = 25` |
| Boolean | `self.isHidden = true` |
| Null | `self.target = null` |
| Array | `self.items = [1, 2, 3]` |
| Object | `self.stats = { str: 10, dex: 15 }` |
| Object Reference | `self.location = room` (stores the ID) |

### Object References

When you store an object in a property, it saves the ID. When you read it back, you get the object:

```typescript
// Store a reference to room #50
self.location = await $.load(50);

// Later, read it back - automatically loads the object
const room = self.location;
room.name;  // "Town Square"
```

## Calling Methods

```typescript
// Call a method on self
await self.describe();

// Call with arguments
await self.moveTo(newRoom);
await self.attack(enemy, 25);

// Call on another object
const room = await $.load(self.location);
await room.announce('A loud noise echoes!');
```

## Inheritance

Objects inherit from their parent. If you ask for a property or method that doesn't exist on the object, it checks the parent, then the grandparent, and so on.

```typescript
// Player inherits: Player -> Human -> Embodied -> Agent -> Describable -> Root
//
// If player doesn't have 'describe' method, it uses the one from Describable
await player.describe();

// Set a property - always sets on THIS object, not the parent
self.customProp = 'only on this object';
```

### The Prototype Chain

```
Root (#1)
  └── Describable - has name, description, aliases
        └── Location - can contain things
        │     └── Room - has exits, crowd mechanics
        └── Agent - can move, speak, has verbs
              └── Embodied - has a body, senses
                    └── Human - has pronouns, age
                          └── Player - has login, commands
```

## The Verb System

Players type commands like `look`, `get sword`, `say hello`. The verb system matches these to methods.

### Registering Verbs

```typescript
// Simple verb - just the word
await self.registerVerb('look', self, 'look');

// With aliases
await self.registerVerb(['look', 'l'], self, 'look');

// With patterns
await self.registerVerb('get %i', self, 'get');        // %i = item in room
await self.registerVerb('say %s', self, 'say');        // %s = rest of line
await self.registerVerb('put %i in %t', self, 'put');  // %t = target item
```

### Pattern Tokens

| Token | Meaning | Example |
|-------|---------|---------|
| `%i` | An item (matched by name/alias) | `get %i` matches "get sword" |
| `%t` | A target item | `put %i in %t` matches "put key in box" |
| `%s` | Rest of the line (string) | `say %s` matches "say hello everyone" |

### How Verbs Work

1. Player types: `get sword`
2. System finds verb `get %i` registered by player
3. Matches "sword" to an object in the room
4. Calls `player.get(swordObject)`

## Sending Messages to Players

Use `tell()` for system messages and `see()` for visual descriptions:

```typescript
// System message (always delivered)
await player.tell('You feel hungry.');

// Visual message (requires consciousness, not blind)
await player.see('The room is dark and dusty.');

// From a room - message everyone
for (const id of self.contents) {
  const obj = await $.load(id);
  if (obj.tell) {
    await obj.tell('A bell rings in the distance.');
  }
}
```

## Creating Objects

Use the recycler to create new objects:

```typescript
// Create a simple object
const sword = await $.recycler.create({
  parent: $.describable.id,
  properties: {
    name: 'Iron Sword',
    description: 'A sturdy iron blade.',
    damage: 15,
  },
}, player);  // player = who's creating it (for permissions)

// Create a room
const room = await $.recycler.create({
  parent: $.room.id,
  properties: {
    name: 'Dark Cave',
    description: 'A damp cave with water dripping from stalactites.',
    exits: [],
  },
}, player);
```

## Common Patterns

### Room Description

```typescript
// Method: describe (on Room)
const viewer = args[0];

let output = `${self.name}\r\n${self.description}\r\n`;

// Show exits
const exits = self.exits || [];
if (exits.length > 0) {
  const exitNames = [];
  for (const exitId of exits) {
    const exit = await $.load(exitId);
    if (exit && !exit.hidden) {
      exitNames.push(exit.name);
    }
  }
  output += `\r\nExits: ${exitNames.join(', ')}\r\n`;
}

// Show contents (but not the viewer)
const contents = (self.contents || []).filter(id => id !== viewer?.id);
if (contents.length > 0) {
  output += '\r\nYou see:\r\n';
  for (const id of contents) {
    const obj = await $.load(id);
    if (obj) {
      output += `  ${obj.name}\r\n`;
    }
  }
}

return output;
```

### Movement

```typescript
// Method: moveTo (on Agent)
const dest = args[0];
const destRoom = typeof dest === 'number' ? await $.load(dest) : dest;

if (!destRoom) {
  throw new Error('Invalid destination');
}

// Leave old room
if (self.location) {
  const oldRoom = await $.load(self.location);
  if (oldRoom) {
    await oldRoom.removeContent(self.id);
  }
}

// Enter new room
self.location = destRoom.id;
await destRoom.addContent(self.id);

// Show the new room
const desc = await destRoom.describe(self);
await self.see(desc);
```

### Say Command

```typescript
// Method: say
const message = args[0];

if (!message) {
  await self.tell('Say what?');
  return;
}

// Announce to the room
const room = await $.load(self.location);
if (room) {
  for (const id of room.contents || []) {
    const obj = await $.load(id);
    if (obj && obj.hear) {
      if (id === self.id) {
        await obj.hear(`You say "${message}"`);
      } else {
        await obj.hear(`${self.name} says "${message}"`);
      }
    }
  }
}
```

## Async/Await

All methods run asynchronously. Always use `await` when:

```typescript
// Loading objects
const room = await $.load(42);

// Calling methods
await self.moveTo(room);

// Multiple loads at once
const [sword, shield] = await Promise.all([
  $.load(swordId),
  $.load(shieldId)
]);
```

## Error Handling

Throw errors to stop execution:

```typescript
// Validation
if (!self.name) {
  throw new Error('Object must have a name');
}

// Catching errors
try {
  await target.attack(self);
} catch (err) {
  await player.tell(`Attack failed: ${err.message}`);
}
```

## Quick Reference

```typescript
// Properties
self.name                    // Read
self.name = 'New Name'       // Write (auto-saves)

// Objects
await $.load(42)             // Load by ID
$.recycler                   // System alias
$.player                     // Player prototype

// Methods
await self.describe()        // Call method
await obj.call('method', arg) // Dynamic call

// Messages
await player.tell('...')     // System message
await player.see('...')      // Visual message

// Create objects
await $.recycler.create({ parent: $.thing.id, properties: {...} }, player)

// Verbs
await self.registerVerb('look', self, 'look')
await self.registerVerb('get %i', self, 'get')
```

## Tips for New Coders

1. **Everything is an object** - Players, rooms, items, even exits
2. **Use `await`** - Almost everything is async
3. **Properties auto-save** - Just set them, no need to call save()
4. **Inherit behavior** - Put shared code on parent prototypes
5. **Test in-game** - Use `@eval` (if you're an admin) to run code live
6. **Check for null** - `$.load()` can return null if object doesn't exist

```typescript
const obj = await $.load(id);
if (!obj) {
  await player.tell('Object not found!');
  return;
}
```
