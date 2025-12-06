# MOO Programming Guide

This guide explains how to write MOO code (method code) in Malice v2. Methods are written in **TypeScript** and compiled at runtime.

## Execution Context

When a method executes, it has access to these variables:

| Variable | Type | Description |
|----------|------|-------------|
| `self` | `RuntimeObject` | The object the method is defined on (proxied) |
| `$` | `ObjectManager` | Access to all objects and aliases |
| `args` | `any[]` | Arguments passed to the method |
| `context` | `ConnectionContext` | The connection context (if called from a player action) |
| `player` | `RuntimeObject` | The player who triggered this (or `self` if no player) |

## Object References

### The `$` Object Manager

The `$` variable is your gateway to all objects in the database. It supports multiple access patterns:

#### Direct ID Access (`$N`)

Access any object by its numeric ID:

```typescript
// Access object #2 (System)
const system = $.2;

// Access object #100 (some player)
const player = $.100;

// Call a method on object #4
await $.4.describe();

// Get a property from object #50
const name = $.50.name;
```

#### Registered Aliases (`$.alias`)

Core objects are registered as aliases during bootstrap:

```typescript
// Access System object
const system = $.system;

// Access AuthManager
const auth = $.authManager;

// Access CharGen
const chargen = $.charGen;

// Access PreAuthHandler
const preauth = $.preauthHandler;

// Access Recycler
const recycler = $.recycler;

// Access the null object (nothing)
const nothing = $.nothing;
```

#### Loading Objects by ID

For programmatic access when the ID is in a variable:

```typescript
// Load object by ID (async)
const obj = await $.load(playerId);

// Synchronous cache lookup (returns null if not cached)
const cached = $.getSync(playerId);
```

## The `self` Object

`self` refers to the current object with full property and method access.

### Property Access

Properties can be accessed directly (no `.get()` needed):

```typescript
// Direct property access (recommended)
const name = self.name;
const hp = self.hp;
const location = self.location;

// Or via .get() method
const name = self.get('name');
```

### Setting Properties

Properties are set directly and auto-saved:

```typescript
// Direct assignment (auto-saves to MongoDB)
self.hp = 100;
self.location = 50;
self.inventory = [101, 102, 103];

// Or via .set() method
self.set('hp', 100);
await self.save();  // Manual save if needed
```

### Calling Methods

```typescript
// Call a method on self
await self.call('describe');
await self.call('moveTo', roomId);

// Or via direct method call (if method exists)
await self.describe();
await self.moveTo(roomId);
```

## Property Types

Properties are stored as typed values. The system auto-detects types:

| JavaScript Value | Stored Type | Example |
|-----------------|-------------|---------|
| `"hello"` | `string` | `self.name = "Alice"` |
| `42` | `number` | `self.hp = 100` |
| `true` | `boolean` | `self.isWizard = true` |
| `null` | `null` | `self.target = null` |
| RuntimeObject | `objref` | `self.location = $.50` |
| `[1, 2, 3]` | `array` | `self.inventory = [1, 2]` |
| `{a: 1}` | `object` | `self.stats = {str: 10}` |

### Object References

When you store a RuntimeObject in a property, it's stored as an `objref` (just the ID). When you read it back, it's automatically resolved:

```typescript
// Store an object reference
self.location = $.50;  // Stores: { type: 'objref', value: 50 }

// Read it back - automatically resolved to RuntimeObject
const room = self.location;  // Returns the RuntimeObject for #50
room.name;  // "Town Square"
```

## Inheritance

Objects inherit properties and methods from their parent chain.

### Property Inheritance

When you access a property, the system walks up the parent chain:

```typescript
// Object #100 (parent: #13)
// Object #13 has: { maxHp: 100 }

// Reading from #100 walks up to find maxHp
const maxHp = self.maxHp;  // Found on #13, returns 100

// Setting always sets on the current object
self.maxHp = 150;  // Now #100 has its own maxHp
```

### Method Inheritance

Methods are also inherited:

```typescript
// #10 Describable defines 'describe' method
// #100 Alice inherits from #13 -> #12 -> #11 -> #10

// This finds and executes the describe method from #10
await self.describe();

// Override by defining the method on #100
self.setMethod('describe', `
  return \`\${self.name} (customized)\`;
`);
```

## Method Arguments

Arguments passed to a method are available in the `args` array:

```typescript
// Method definition
{
  methods: {
    greet: `
      const targetName = args[0];
      return \`Hello, \${targetName}!\`;
    `
  }
}

// Calling with arguments
await self.call('greet', 'Alice');  // Returns "Hello, Alice!"

// Or via direct call
await self.greet('Alice');
```

## Async/Await

All method code runs in an async context. Use `await` for:

```typescript
// Loading objects
const room = await $.load(self.location);

// Calling methods
await self.moveTo(newRoom);
await player.call('notify', 'You arrive.');

// Multiple operations
const [source, target] = await Promise.all([
  $.load(args[0]),
  $.load(args[1])
]);
```

## Complete Examples

### Simple Greeter

```typescript
// Method: greet
return `Hello, I'm ${self.name}!`;
```

### Movement Method

```typescript
// Method: moveTo (on Agent prototype)
const newLocation = args[0];

// Get the destination room
const destRoom = typeof newLocation === 'number'
  ? await $.load(newLocation)
  : newLocation;

if (!destRoom) {
  throw new Error('Invalid destination');
}

// Leave current room
const oldRoom = await $.load(self.location);
if (oldRoom) {
  await oldRoom.call('onExit', self);
}

// Update location
self.location = destRoom.id;
await self.save();

// Enter new room
await destRoom.call('onEnter', self);
```

### Room Description

```typescript
// Method: describe (on Room object)
const exits = self.exits || {};
const exitNames = Object.keys(exits);

let desc = `${self.name}\n`;
desc += `${self.description}\n`;

if (exitNames.length > 0) {
  desc += `\nExits: ${exitNames.join(', ')}`;
}

return desc;
```

### Combat Action

```typescript
// Method: attack
const target = args[0];
const damage = args[1] || self.baseDamage || 10;

// Resolve target if it's an ID
const enemy = typeof target === 'number'
  ? await $.load(target)
  : target;

if (!enemy) {
  throw new Error('No target');
}

// Calculate damage
const finalDamage = Math.max(1, damage - (enemy.defense || 0));

// Apply damage
enemy.hp = (enemy.hp || 0) - finalDamage;
await enemy.save();

// Check for death
if (enemy.hp <= 0) {
  await enemy.call('onDeath', self);
}

return {
  target: enemy.id,
  damage: finalDamage,
  killed: enemy.hp <= 0
};
```

### Login Handler

```typescript
// Method: onConnect (on AuthManager)
const ctx = args[0];

// Check if already authenticated
if (ctx.player) {
  return await ctx.player.call('onLogin', ctx);
}

// Show login prompt
await ctx.send('Welcome to Malice!\r\n');
await ctx.send('Enter username:password to login\r\n');
await ctx.send('Or "create <username> <password>" to create a new character\r\n');
```

## DevTools Type Generation

The DevTools server can generate TypeScript definitions for all objects. This gives you IntelliSense when editing methods:

```typescript
// Auto-generated types show:
// - All properties with their types
// - All methods with signatures
// - All registered aliases

declare const self: RuntimeObject & {
  name: string;
  hp: number;
  location: RuntimeObject;
  describe(): Promise<string>;
  moveTo(room: RuntimeObject | number): Promise<void>;
};

declare const $: ObjectManager & {
  readonly system: RuntimeObject;
  readonly authManager: RuntimeObject;
  // ... more aliases
};
```

## Special Objects

### #-1 (Nothing)

The null object reference. Used to represent "no object":

```typescript
// Check if location is set
if (self.location === $.nothing) {
  // No location set
}

// Clear a reference
self.target = $.nothing;
```

### #0 (ObjectManager)

The root system object. Represents the ObjectManager itself:

```typescript
const mgr = await $.load(0);
mgr.name;  // "ObjectManager"
```

### #1 (Root)

The base of all inheritance. All objects ultimately inherit from Root.

## Error Handling

Errors in methods propagate to the caller:

```typescript
// Method: validate
if (!self.name) {
  throw new Error('Object must have a name');
}

if (self.hp < 0) {
  throw new Error('HP cannot be negative');
}

return true;
```

Catch errors when calling methods:

```typescript
try {
  await target.call('attack', self);
} catch (err) {
  await player.send(`Attack failed: ${err.message}\r\n`);
}
```

## Best Practices

1. **Use direct property access** - `self.name` is cleaner than `self.get('name')`

2. **Always await async operations** - Methods run async, use `await`

3. **Handle missing objects** - `$.load()` can return `null`

4. **Use objrefs for relationships** - Store object IDs, let the system resolve them

5. **Keep methods focused** - Small methods are easier to debug

6. **Inherit wisely** - Put shared behavior on parent objects

7. **Document with help** - Use the `help` property in method definitions:
   ```typescript
   self.setMethod('look', code, {
     callable: true,
     aliases: ['l'],
     help: 'Look at your surroundings'
   });
   ```

## TypeScript Features

Since methods are TypeScript, you can use:

- Type annotations (for documentation)
- Destructuring: `const { name, hp } = self.getOwnProperties()`
- Spread operator: `const allItems = [...inventory, newItem]`
- Template literals: `` `${self.name} attacks!` ``
- Optional chaining: `target?.hp`
- Nullish coalescing: `self.hp ?? 100`
- Arrow functions: `items.filter(i => i.value > 10)`

The TypeScript is compiled to ES2022 JavaScript at runtime.
