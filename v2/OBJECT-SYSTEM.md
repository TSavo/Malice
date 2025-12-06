# Malice v2 Object System

A LambdaMOO-style object database implementation using MongoDB and TypeScript.

## Architecture

### Core Concepts

- **Everything is an Object**: All game entities (players, rooms, NPCs, items) are objects stored in MongoDB
- **Numeric IDs**: Each object has a unique numeric ID (`#1`, `#2`, etc.)
- **Prototype Inheritance**: Objects inherit properties and methods from a parent object
- **Executable Methods**: Methods are TypeScript code stored as strings and executed dynamically
- **Root Object**: Object `#1` is the root from which all objects inherit (parent `#0` means no parent)

### Object Structure

```typescript
interface GameObject {
  _id: ObjId;                              // Unique numeric ID
  parent: ObjId;                           // Parent object (0 = no parent)
  properties: Record<string, PropertyValue>; // Key-value properties
  methods: Record<string, MethodCode>;     // Executable TypeScript code
  created: Date;                           // Creation timestamp
  modified: Date;                          // Last modification timestamp
}
```

### Core Objects

1. **Object #1 (Root)**: Base object for all inheritance, starts empty
2. **Object #2 (System)**: Handles system-level operations like new connections
3. **Object #3 (AuthManager)**: Handles login screen and authentication
4. **Object #4 (CharGen)**: Creates new user characters

## Method Execution

Methods are executed with the following context:

- `self`: The RuntimeObject instance (use this instead of `this`)
- `$`: The ObjectManager (for loading/creating other objects)
- `args`: Array of arguments passed to the method

### Property Syntax Sugar

Objects use **ES6 Proxy** to enable direct property access with automatic persistence:

**Old Syntax** (still works):
```javascript
const hp = self.get('hp');
const maxHp = self.get('maxHp');
self.set('hp', newHp);
await self.save(); // Manual save
```

**New Syntax** (recommended):
```javascript
const hp = self.hp;
const maxHp = self.maxHp;
self.hp = newHp; // Auto-saves in background!
```

Properties are automatically persisted to MongoDB when set. No need to call `save()`!

### Object Manager (`$`) Shortcuts

The `$` object manager provides convenient getters for core objects:

```javascript
// Access core objects
const sys = await $.system;       // System object (#2)
const auth = await $.authManager;  // AuthManager object (#3)
const cg = await $.charGen;        // CharGen object (#4)

// Load any object by ID
const player = await $.load(42);

// Create new objects
const room = await $.create({
  parent: 1,
  properties: { name: 'Town Square' },
  methods: { ... }
});
```

**Old way:**
```javascript
const chargen = await context.load(4);
```

**New way:**
```javascript
const chargen = await $.charGen;
```

### Dynamic Aliases

You can register custom aliases on the fly:

```javascript
// Register an alias (two ways)
$.tavern = tavernObject;              // Property syntax
$.registerAlias('square', squareObj); // Method syntax

// Use the alias later
const tav = $.tavern;
const desc = await tav.call('describe');

// Remove an alias
$.removeAlias('tavern');

// List all aliases
const aliases = $.getAliases();
```

This is useful for:
- **World state**: `$.currentEvent`, `$.townSquare`
- **Cached references**: `$.wizard`, `$.questGiver`
- **Dynamic systems**: `$.combatManager`, `$.weatherSystem`

### Object Recycling

LambdaMOO-style soft deletion with ID reuse:

```javascript
// Recycle (soft delete) an object
await $.recycle(oldObject);
// or
await $.recycle(42); // by ID

// Create new object - automatically reuses lowest recycled ID
const newObj = await $.create({
  parent: 1,
  properties: { ... }
});
// newObj might have ID #42 if that was recycled!
```

**Benefits:**
- **ID reuse**: Keeps object ID space compact
- **No broken references**: Object still exists (just marked `recycled: true`)
- **Graceful degradation**: Code can check `obj._getRaw().recycled`
- **Efficient**: Reuses lowest IDs first

**When to use:**
- Deleting temporary objects (items that decay, temporary NPCs)
- Removing disconnected player objects
- Cleaning up failed object creation

### Example Methods

```typescript
// System object (#2) - Connection handling
methods: {
  onConnection: `
    const context = args[0]; // ConnectionContext

    // Load AuthManager using clean syntax
    const authManager = await $.authManager;

    if (!authManager) {
      context.send('Error: Authentication system not available.\\r\\n');
      context.close();
      return;
    }

    // Set AuthManager as input handler
    context.setHandler(authManager);

    // Call AuthManager's onConnect
    await authManager.call('onConnect', context);
  `
}

// AuthManager object (#3) - Login screen
methods: {
  onConnect: `
    const context = args[0];
    const welcome = self.welcomeMessage; // Clean property access
    context.send(welcome);
  `,

  onInput: `
    const context = args[0];
    const input = args[1];

    const username = input.trim();
    context.send(\`Creating character for \${username}...\\r\\n\`);

    const chargen = await $.charGen; // Clean object manager access
    if (chargen) {
      await chargen.call('onNewUser', context, username);
    }
  `
}
```

## Connection Flow

**All connection logic lives in object methods - not in TypeScript classes!**

1. Client connects to Telnet (port 5555) or WebSocket (port 8080)
2. `GameCoordinator` creates a `ConnectionContext` wrapping the connection
3. `GameCoordinator` calls System object (#2) `onConnection()` method
4. System's `onConnection()` loads AuthManager (#3) and sets it as handler
5. System calls AuthManager's `onConnect()` method
6. AuthManager's `onConnect()` sends welcome message
7. Client sends username
8. AuthManager's `onInput()` receives username, loads CharGen (#4)
9. CharGen's `onNewUser()` creates User object in database
10. User is authenticated and can enter game

**Key Principle**: GameCoordinator is just thin glue code. All game logic is stored as methods on objects in MongoDB.

## Database Layer

### ObjectDatabase (`src/database/object-db.ts`)
- MongoDB persistence layer
- CRUD operations for game objects
- ID generation and uniqueness

### RuntimeObject (`src/database/runtime-object.ts`)
- Wraps GameObject with executable interface
- Method execution via Function constructor
- Property resolution walks prototype chain
- Caching for performance

### ObjectManager (`src/database/object-manager.ts`)
- Coordinates ObjectDatabase and RuntimeObjects
- In-memory caching
- Object creation and loading
- Preloading for core objects

### GameBootstrap (`src/database/bootstrap.ts`)
- Initializes core objects on first run
- Idempotent (safe to run multiple times)
- Creates Root, AuthManager, and CharGen

## Running the System

### Local Development

```bash
# Start MongoDB
docker run -d --name malice-mongo -p 27017:27017 mongo:7.0

# Run server
npm start

# Test connection
npx tsx test-game-client.ts
```

### Docker Compose

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f game

# Stop everything
docker compose down
```

### Testing

```bash
# Run test suite
npm test

# With coverage
npm run test:coverage

# With UI
npm run test:ui
```

## Example: Creating a New Object Type

```typescript
// In bootstrap or via @create command
const room = await manager.create({
  parent: 1,  // Inherit from root
  properties: {
    name: 'Town Square',
    description: 'A bustling town square with a fountain in the center.',
    exits: { north: 5, south: 6 }  // Object IDs of connected rooms
  },
  methods: {
    onEnter: `
      const user = args[0];
      const desc = self.get('description');
      user.send(\`\${desc}\\r\\n\`);

      const exits = self.get('exits');
      const exitList = Object.keys(exits).join(', ');
      user.send(\`Exits: \${exitList}\\r\\n\`);
    `
  }
});

console.log(`Created room #${room.id}`);
```

## Property Inheritance

Properties are resolved by walking up the prototype chain:

```typescript
// User object #4 (parent: 1)
properties: {
  username: 'TestUser',
  hp: 100
}

// Calling user.get('username') returns 'TestUser'
// Calling user.get('hp') returns 100
// Calling user.get('nonexistent') walks to parent #1, returns undefined
```

## Security Considerations

**IMPORTANT**: Methods are executed as trusted code with full access to the system. There is currently:
- ❌ No sandboxing
- ❌ No permission checks
- ❌ No resource limits

This is intentional for an early prototype but should be addressed before allowing untrusted user-created objects.

## Next Steps

Potential enhancements:
1. Command parser for in-game object creation (`@create`, `@property`, `@method`)
2. Room system with movement commands
3. Permission system (owner, group, world)
4. Object verbs (generic actions)
5. Built-in programming language (vs raw TypeScript)
6. Sandboxing for untrusted code
7. Resource limits (CPU, memory, method call depth)
8. Object recycling (delete objects, reuse IDs)
9. Backup and restore tools
10. Web-based object editor

## Files

### Core Object System
- `types/object.ts` - Type definitions
- `src/database/object-db.ts` - MongoDB persistence
- `src/database/runtime-object.ts` - Executable object wrapper
- `src/database/object-manager.ts` - Caching and coordination
- `src/database/bootstrap.ts` - Core object initialization

### Game Integration
- `src/game/connection-context.ts` - Bridges connections to objects
- `src/game/game-coordinator.ts` - Main game coordinator
- `src/index.ts` - Server entry point

### Configuration
- `docker-compose.yml` - Full stack setup
- `Dockerfile` - Game server container
- `.dockerignore` - Docker build exclusions
