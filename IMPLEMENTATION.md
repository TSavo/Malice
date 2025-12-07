# Malice v2 - Implementation Summary

## What Was Built

A complete, modern, reactive TMMO engine with a LambdaMOO-style object system, built from first principles with TypeScript, RxJS, and MongoDB.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Game Clients                            │
│     Telnet (5555)    WebSocket (8080)    TLS (5556)        │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    Transport Layer                          │
│  - TelnetTransport (RFC854 protocol)                        │
│  - WebSocketTransport (text/binary frames)                  │
│  - TLSTransport (SSL client certificates)                   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                   Connection Layer                          │
│  - ConnectionContext (bridges transport to objects)         │
│  - GameCoordinator (thin routing layer)                     │
│  - Handler pattern (onInput delegation)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    Object System                            │
│  - ObjectManager (loading, caching, $N syntax)              │
│  - RuntimeObject (executable methods, property proxy)       │
│  - ObjectDatabase (MongoDB persistence)                     │
│  - Verb Registration (dynamic command system)               │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────┴────────────────────────────────┐
│                      MongoDB                                │
│  - Game objects (properties + methods as TypeScript)        │
│  - Change streams (multi-server cache sync)                 │
│  - Replica set (required for change streams)                │
└─────────────────────────────────────────────────────────────┘
```

## Core Design Principles

### 1. Everything is MOO Code

All game logic lives in MongoDB as methods, not in TypeScript:

```typescript
// TypeScript provides ONLY:
// - Transport (Telnet, WebSocket, TLS)
// - Object database (CRUD, caching)
// - Method execution (RuntimeObject)

// Everything else is MOO code in MongoDB:
// - Authentication flow (AuthManager.onInput)
// - Player command loop (Player.onInput)
// - Movement (Describable.moveTo)
// - Verb registration (Agent.registerVerb)
// - Room exits (Room.go)
```

### 2. Dynamic Verb Registration

Commands aren't hardcoded. Objects register their verbs dynamically:

```
Player connects:
  → Player.connect() registers: look, say, quit

Player enters room with exits {north: 51, south: 52}:
  → Room.onContentArrived() registers: north, south

Player picks up gun:
  → Gun.onArrived() registers: shoot, aim

Player drops gun:
  → Gun.onLeaving() unregisters: shoot, aim

Player leaves room:
  → Room.onContentLeft() unregisters: north, south
```

### 3. Single Primitive for Movement

`Describable.moveTo()` is the ONLY way to change location:

```
moveTo(destination, mover):
  1. source.onContentLeaving(self, dest, mover)  ← Can throw to cancel
  2. self.onLeaving(source, dest, mover)
  3. self.location = dest.id
  4. source.onContentLeft(self, dest, mover)     ← Unregister verbs
  5. self.onArrived(dest, source, mover)         ← Register verbs
  6. dest.onContentArrived(self, source, mover)  ← Register verbs
```

### 4. Handler Pattern for Input

ConnectionContext delegates input to a handler object:

```
New connection → System.onConnection()
  → context.setHandler(AuthManager)

AuthManager.onInput() validates credentials
  → context.authenticate(playerId)
  → context.setHandler(player)

Player.onInput() handles all commands
  → Looks up verb in registry
  → Dispatches to handler object
```

## File Structure

```
v2/
├── src/
│   ├── transport/                 # Network layer
│   │   ├── telnet/               # Telnet protocol (RFC854)
│   │   ├── websocket/            # WebSocket protocol
│   │   └── tls/                  # TLS with client certs
│   │
│   ├── connection/               # Connection management
│   │   ├── connection.ts         # Connection wrapper
│   │   └── connection-manager.ts # Pool management
│   │
│   ├── database/                 # Object system
│   │   ├── object-db.ts          # MongoDB CRUD
│   │   ├── runtime-object.ts     # Executable objects (Proxy-based)
│   │   ├── object-manager.ts     # Caching, $N syntax, aliases
│   │   ├── object-cache.ts       # In-memory cache
│   │   └── bootstrap/            # Core object builders
│   │       ├── minimal-bootstrap.ts      # Root, System
│   │       ├── prototype-builder.ts      # Describable, Location, Room, Agent, Human, Player
│   │       ├── auth-manager-builder.ts   # AuthManager
│   │       ├── chargen-builder.ts        # CharGen
│   │       ├── preauth-handler-builder.ts # PreAuthHandler
│   │       └── recycler-builder.ts       # Recycler
│   │
│   ├── game/                     # Game coordination
│   │   ├── connection-context.ts # Bridges transport to objects
│   │   └── game-coordinator.ts   # Main game loop (thin)
│   │
│   └── index.ts                  # Server entry point
│
├── types/                        # TypeScript definitions
│   ├── object.ts                 # Object system types
│   ├── transport.ts              # Transport interfaces
│   ├── telnet.ts                 # Telnet protocol constants
│   └── connection.ts             # Connection state types
│
├── test/                         # Test suite
│   ├── bootstrap/                # Bootstrap tests
│   ├── lsp/                      # DevTools LSP tests
│   └── *.test.ts                 # Unit tests
│
└── devtools/                     # DevTools server (LSP)
    └── ...
```

## Object Hierarchy

```
#-1 Nothing
#0 ObjectManager
#1 Root
├─ #2 System               (connection routing)
├─ #3 AuthManager          (interactive login)
├─ #4 CharGen              (character creation)
├─ #5 PreAuthHandler       (SSL/OAuth auth)
├─ #10 Describable         (name, description, moveTo)
│   ├─ #11 Location        (container hooks)
│   │   └─ #14 Room        (exits, go)
│   └─ #15 Agent           (verbs, registerVerb)
│       └─ #12 Human       (sex, pronouns)
│           └─ #13 Player  (auth, onInput)
└─ #20 Recycler            (object deletion)
```

## Key Features

### Transport Layer
- ✅ Telnet (RFC854 with NAWS, terminal type)
- ✅ WebSocket (text/binary frames)
- ✅ TLS (SSL client certificates)
- ✅ Reactive (RxJS Observables)
- ✅ Transport abstraction (game logic is transport-agnostic)

### Object System
- ✅ MongoDB persistence
- ✅ Prototype inheritance
- ✅ Method execution (TypeScript compiled at runtime)
- ✅ Property proxy (`self.hp` instead of `self.get('hp')`)
- ✅ `$N` syntax (`$.50`, `$.4.describe()`)
- ✅ Registered aliases (`$.system`, `$.authManager`)
- ✅ Typed values (objrefs auto-resolve to RuntimeObjects)
- ✅ Change streams (multi-server cache sync)

### Verb System
- ✅ Dynamic verb registration
- ✅ Verbs stored on Agent (`self.verbs`)
- ✅ Register/unregister verbs (`registerVerb`, `unregisterVerb`)
- ✅ Room exit verbs registered on enter
- ✅ Item verbs registered on pickup

### Location System
- ✅ `moveTo()` as single primitive
- ✅ Transition hooks (onLeaving, onArrived, onContentLeaving, etc.)
- ✅ Hook can throw to cancel movement
- ✅ Verbs registered/unregistered during transitions

### Authentication
- ✅ Interactive login (AuthManager)
- ✅ SSL client certificates (PreAuthHandler)
- ✅ HTTP Basic Auth (WebSocket)
- ✅ Password hashing (bcrypt)
- ✅ Permission system (canUseDevTools, isWizard, isSuspended)

### DevTools
- ✅ LSP server for IDE integration
- ✅ Object browsing
- ✅ Method editing with IntelliSense
- ✅ Property inspection
- ✅ Virtual filesystem (`malice://objects/2/onConnection.ts`)

## Connection Flow

```
1. Client connects (Telnet/WebSocket/TLS)
   ↓
2. Transport creates connection
   ↓
3. GameCoordinator wraps in ConnectionContext
   ↓
4. GameCoordinator calls System.onConnection(context)
   ↓
5. System loads AuthManager, sets as handler
   ↓
6. AuthManager.onConnect shows login prompt
   ↓
7. User enters "alice:password123"
   ↓
8. AuthManager.onInput validates credentials
   ↓
9. AuthManager calls Player.connect(context)
   ↓
10. Player.connect:
    - Registers default verbs (look, say, quit)
    - Triggers onArrived on current location
    - Room registers exit verbs
    ↓
11. context.setHandler(player)
    ↓
12. Player.onInput handles all commands
    - Looks up verb in registry
    - Dispatches to handler object
```

## Command Dispatch

```typescript
// Player.onInput
const input = args[1].trim();
const [verb, ...argParts] = input.split(/\s+/);
const argString = argParts.join(' ');

// Look up verb in registry
const verbInfo = await self.getVerb(verb.toLowerCase());

if (verbInfo) {
  // Dispatch to handler
  const handler = await $.load(verbInfo.obj);
  const result = await handler[verbInfo.method](context, self, argString);
  if (result) context.send(`${result}\r\n`);
} else {
  context.send(`I don't understand "${verb}".\r\n`);
}
```

## MOO Code Execution Context

Methods execute with these variables:

| Variable | Type | Description |
|----------|------|-------------|
| `self` | `RuntimeObject` | The object the method is on (proxied) |
| `$` | `ObjectManager` | Access to all objects (`$.50`, `$.system`) |
| `args` | `any[]` | Arguments passed to the method |
| `context` | `ConnectionContext` | The connection (if player action) |
| `player` | `RuntimeObject` | The player who triggered this |

### Property Access
```typescript
// Direct access (recommended)
self.hp = 100;
const name = self.name;

// Object references auto-resolve
const room = self.location;  // Returns RuntimeObject, not number
room.name;  // Works directly
```

### Object Access
```typescript
// By ID
const room = $.50;
await $.4.describe();

// By alias
const sys = $.system;
const auth = $.authManager;

// Async load
const obj = await $.load(someId);
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- agent.test.ts

# Type checking
npm run typecheck
```

## What's Next

### Phase 2: Game Mechanics (In Progress)
- [ ] Inventory system (get, drop, put)
- [ ] Look at objects
- [ ] Communication (say, emote, whisper)
- [ ] Help system

### Phase 3: World Building
- [ ] MOO commands (@create, @dig, @property, @method)
- [ ] In-game programming
- [ ] Room builder
- [ ] Object editor

### Phase 4: Advanced Features
- [ ] Combat system
- [ ] Skills/abilities
- [ ] NPC AI
- [ ] Quest system
- [ ] Economy

## Performance

- **Object caching**: RuntimeObjects cached in memory
- **Change streams**: Automatic cache invalidation across servers
- **Compiled methods**: TypeScript compiled once, cached
- **Lazy loading**: Objects loaded on-demand
- **Prototype sharing**: Methods inherited, not duplicated

## Security Notes

⚠️ **IMPORTANT**: Methods are executed as **trusted code** with **full system access**.

Currently implemented:
- ✅ Password hashing (bcrypt)
- ✅ SSL certificate validation
- ✅ Permission checks (canUseDevTools, isWizard)
- ✅ Suspension support (isSuspended)

Not yet implemented:
- ❌ Method sandboxing
- ❌ Resource limits (CPU, memory)
- ❌ Object ownership/permissions
- ❌ Rate limiting

## Philosophy

> "All game logic in MOO code. TypeScript is just infrastructure."

The TypeScript layer provides:
1. Transport (getting bytes in/out)
2. Object database (CRUD, caching)
3. Method execution (compiling and running)

Everything else - authentication, commands, movement, combat - lives as methods in MongoDB. This enables:
- Live updates without restart
- In-game programming
- True LambdaMOO-style extensibility
