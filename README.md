# Malice v2 - Modern TypeScript TMMO

A modern, reactive Text-based Massively Multiplayer Online (TMMO) game engine built with TypeScript, RxJS, and MongoDB.

## Features

- ✅ **LambdaMOO-style object system** - Prototype-based inheritance with executable methods
- ✅ **Multi-transport support** - Telnet and WebSocket
- ✅ **High-Performance Caching** - O(1) array-backed cache with Stable Proxy Pattern
- ✅ **Stable Architecture** - Single-server focus with in-memory source of truth
- ✅ **Full authentication system** - Interactive login, SSL certs, HTTP Basic Auth
- ✅ **Agent-based model** - Everything that acts is an Agent
- ✅ **In-database programming** - All game logic stored as methods in MongoDB

## Quick Start

### Prerequisites

- Node.js 20+ or Bun 1.0+
- Docker and Docker Compose (recommended)
- MongoDB 7.0+ (or use Docker Compose)

### Installation

```bash
# Clone the repository
git clone https://github.com/TSavo/Malice.git
cd Malice/v2

# Install dependencies
npm install
# or
bun install
```

### Running with Docker Compose (Recommended)

```bash
# Start MongoDB replica set and game server
docker compose up -d

# View logs
docker compose logs -f game

# Stop everything
docker compose down
```

### Running Locally

```bash
# Start MongoDB (if not using Docker Compose)
docker run -d --name malice-mongo -p 27017:27017 \
  --replSet rs0 mongo:7.0

# Initialize replica set
docker exec malice-mongo mongosh --eval '
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})'

# Start the game server
npm start
# or
bun run dev  # With auto-reload
```

### Connect to the Game

```bash
# Via telnet
telnet localhost 5555

# Via WebSocket (using websocat)
websocat ws://localhost:8080

# Via TLS with client certificate
openssl s_client -connect localhost:5556 \
  -cert client.pem -key client-key.pem
```

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Game Clients                        │
│     Telnet (5555)  WebSocket (8080)  TLS (5556)        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Transport Layer                        │
│  - TelnetTransport (RFC854 protocol)                   │
│  - WebSocketTransport (text/binary frames)             │
│  - TLSTransport (SSL client certs)                     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                 Connection Layer                        │
│  - ConnectionContext (wraps transport)                 │
│  - ConnectionManager (pool management)                 │
│  - Authentication state                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Game Layer                            │
│  - GameCoordinator (routes to System object)          │
│  - All logic lives in MongoDB!                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                  Object System                          │
│  - ObjectManager (loading, caching, aliases)           │
│  - RuntimeObject (executable methods)                  │
│  - ObjectDatabase (MongoDB persistence)                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│                    MongoDB                              │
│  - Durable backing store                               │
│  - Loaded entirely into memory at startup              │
│  - Asynchronous persistence for all changes            │
└─────────────────────────────────────────────────────────┘
```

### Core Concepts

#### 1. Everything is an Object

All game entities (players, rooms, characters, items) are objects stored in MongoDB with:
- Numeric IDs (#1, #2, #3, ...)
- Parent for inheritance
- Properties (data)
- Methods (executable TypeScript code)

```typescript
{
  _id: 100,
  parent: 13,  // Inherits from Player prototype
  properties: {
    name: "Alice",
    location: 50,
    hp: 100
  },
  methods: {
    greet: `return \`Hello, I'm \${self.name}!\`;`
  }
}
```

#### 2. Prototype-Based Inheritance

Objects inherit properties and methods from their parent:

```
#1 Root
└─ #10 Describable (name, description, aliases)
   └─ #11 Agent (location, inventory, moveTo, say)
      └─ #12 Human (sex, pronouns, age)
         └─ #13 Player (auth, permissions)
            └─ #100 Alice (instance)
```

#### 3. In-Database Programming

All game logic lives as methods in MongoDB, written in TypeScript:

```typescript
// Method code has access to these variables:
// - self: The current object (proxied for direct property access)
// - $: ObjectManager for accessing other objects
// - args: Arguments passed to the method
// - context: Connection context (if called from player action)
// - player: The player who triggered this

// Access objects by ID with $N syntax:
const room = $.50;           // Get object #50
await $.4.describe();        // Call method on #4

// Or use registered aliases:
const system = $.system;     // System object
const auth = $.authManager;  // AuthManager object

// Direct property access on self:
self.hp = 100;               // Set property (auto-saves)
const name = self.name;      // Get property

// Call methods:
await self.call('describe');
await target.moveTo(room);

// Explicit DB sync (rarely needed due to auto-persistence):
await self.push();           // Memory -> DB
await self.pull();           // DB -> Memory (syncs external changes)
```

Example method stored in MongoDB:
```typescript
{
  _id: 2,
  methods: {
    onConnection: `
      const ctx = args[0];
      await $.authManager.call('onConnect', ctx);
    `
  }
}
```

See [**MOO-PROGRAMMING.md**](./MOO-PROGRAMMING.md) for the complete guide.

#### 4. Stable Proxy Architecture

Malice uses a high-performance in-memory model:
- **Full Warmup**: The entire database is loaded into memory at startup.
- **O(1) Cache**: Objects are stored in a dense array for instant access.
- **Stable Proxies**: Object references stay constant in memory even when data changes.
- **Durable Writes**: Changes are immediately persisted to MongoDB for durability (`push`).
- **External Sync**: Explicitly refresh objects from the database if modified externally (`pull`).

## Project Structure

```
v2/
├── src/
│   ├── transport/              # Transport implementations
│   │   ├── telnet/             # Telnet server (RFC854)
│   │   ├── websocket/          # WebSocket server
│   │   └── tls/                # TLS server (SSL certs)
│   ├── connection/             # Connection management
│   │   ├── connection.ts       # Connection wrapper
│   │   └── connection-manager.ts
│   ├── database/               # Object system
│   │   ├── object-db.ts        # MongoDB persistence
│   │   ├── runtime-object.ts   # Executable objects
│   │   ├── object-manager.ts   # Caching & loading
│   │   └── bootstrap/          # Core object creation
│   │       ├── minimal-bootstrap.ts
│   │       ├── prototype-builder.ts
│   │       ├── auth-manager-builder.ts
│   │       ├── chargen-builder.ts
│   │       ├── preauth-handler-builder.ts
│   │       └── recycler-builder.ts
│   ├── game/                   # Game coordination
│   │   ├── connection-context.ts
│   │   └── game-coordinator.ts
│   └── index.ts                # Server entry point
├── test/                       # Test suite
│   ├── telnet-protocol-parser.test.ts
│   ├── telnet-command-builder.test.ts
│   └── connection-manager.test.ts
├── types/                      # TypeScript types
│   ├── object.ts
│   ├── transport.ts
│   ├── telnet.ts
│   └── connection.ts
└── docker-compose.yml          # Production stack
```

## Documentation

### Core Concepts
- [**MOO-PROGRAMMING.md**](./MOO-PROGRAMMING.md) - **How to write MOO code** (methods, `$`, `self`, properties)
- [**OBJECT-SYSTEM.md**](./OBJECT-SYSTEM.md) - Object model, inheritance, methods
- [**OBJECT-HIERARCHY.md**](./OBJECT-HIERARCHY.md) - Complete object tree

### Architecture
- [**AUTH-ARCHITECTURE.md**](./AUTH-ARCHITECTURE.md) - Authentication modes and flow
- [**CHANGE-STREAMS.md**](./CHANGE-STREAMS.md) - Multi-server cache synchronization
- [**IMPLEMENTATION.md**](./IMPLEMENTATION.md) - Implementation details

### DevTools
- [**devtools/ARCHITECTURE.md**](./devtools/ARCHITECTURE.md) - DevTools architecture
- [**devtools/spec/PROTOCOL.md**](./devtools/spec/PROTOCOL.md) - DevTools protocol
- [**devtools/spec/SECURITY.md**](./devtools/spec/SECURITY.md) - Security model

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

### Type Checking

```bash
npm run typecheck
```

The typecheck script also compiles MOO method bodies defined in bootstrap files to catch
TypeScript syntax errors before runtime. You can run this step alone via:

```bash
npm run moo:check
```

### Building

```bash
npm run build
```

## MCP Integration

Malice provides a **code-first MCP server** for Claude Code integration, implementing Anthropic's "code execution with MCP" pattern.

### Code-First Architecture

Claude writes native MOO code that executes in the game context:

```typescript
// ✅ Direct MOO code
execute_moo_code({
  code: `
    // Use $recycler to create objects
    const room = await $recycler.create($room, {
      name: "Hall",
      x: 0, y: 0, z: 0
    });

    // Create and move item
    const torch = await $recycler.create($item, {name: "torch"});
    await torch.moveTo(room, player);

    return {roomId: room.id, torchId: torch.id};
  `
})
```

### Benefits

- **No wrapper layer** - just pure MOO code
- **Composable** - loops, conditionals, multi-step operations
- **Full game context** - $, $load(), $recycler, all $aliases
- **Single execution** - no round-trips between steps
- **Player authentication** - HTTP Basic Auth provides `player` variable

### MCP Servers

| Port | Server | Purpose |
|------|--------|---------|
| 3010 | Code-First MCP | Admin/builder access with `execute_moo_code` |
| 3012 | Session MCP | Player-specific actions (not yet implemented) |

### Authentication

Connect with HTTP Basic Auth to access your player context:

```bash
# Authenticated access (player variable available)
curl -u username:password http://localhost:3010/mcp

# Unauthenticated access (admin/builder tasks)
curl http://localhost:3010/mcp
```

### MCP Resources

The server provides `moo://` resources for querying game state:

- `moo://objects/{id}` - Object details
- `moo://rooms/{id}` - Room state with exits/contents
- `moo://players` - All players
- `moo://ai` - AI NPCs
- `moo://ai/{id}` - NPC profile with personality/memories
- `moo://npc-sessions/{id}` - Claude API conversation logs
- `moo://plots` - Active plots/quests
- `moo://docs/{name}` - Documentation files
- `moo://city-ai/{name}` - City AI documentation

See `docs/reference/MCP-TOOLS.md` for complete reference.

## Core Objects

The system bootstraps with these core objects:

| ID | Name | Purpose |
|----|------|---------|
| #1 | Root | Base of all inheritance |
| #2 | System | Routes new connections |
| #3 | AuthManager | Interactive login |
| #4 | CharGen | Creates player characters |
| #5 | PreAuthHandler | SSL/OAuth authentication |
| #10 | Describable | Name, description, aliases |
| #11 | Agent | Location, inventory, actions |
| #12 | Human | Sex, pronouns, age |
| #13 | Player | Auth, permissions, stats |
| #20 | Recycler | Object deletion/recovery |

## Authentication

Malice supports multiple authentication methods:

### 1. Interactive Login (Telnet/WebSocket)
```
Client connects
  ↓
AuthManager shows login screen
  ↓
User enters username:password
  ↓
AuthManager validates password
  ↓
Player connects to game
```

### 2. SSL Client Certificates (TLS)
```
Client connects with cert
  ↓
TLS validates certificate
  ↓
PreAuthHandler finds Player by fingerprint
  ↓
Player connects to game
```

### 3. HTTP Basic Auth (WebSocket)
```
Client sends Authorization: Basic <base64>
  ↓
WebSocket extracts username:password
  ↓
PreAuthHandler validates credentials
  ↓
Player connects to game
```

## Example: Creating a Room

```typescript
// Via MOO code (future)
const room = await $.recycler.create($.room, {
  name: 'Town Square'
});

// Create a merchant agent
const merchant = await $.recycler.create($.agent, {
  name: 'Grizzled Merchant',
  description: 'A weathered trader with a sharp eye for deals.',
  credits: 500
});

// Add a greet method
merchant.setMethod('greet', `
  const player = args[0];
  await player.tell('Welcome to my shop!');
`);
```

## Example: Creating a Character

> **Note:** In Malice, there are no "NPCs" - every character you meet is controlled
> by either a human or an AI agent. However, characters can be created programmatically
> and may be AI-controlled players in the game world.

```typescript
const merchant = await $.create({
  parent: 13,  // Inherit from Player
  properties: {
    name: 'Shopkeeper',
    description: 'A gruff shopkeeper with a weathered face.',
    location: 50,
    inventory: [201, 202, 203]  // Items for sale
  },
  methods: {
    onGreet: `
      const player = args[0];
      await self.call('say', 'Welcome to my shop!');
    `
  }
});
```

## Configuration

### Environment Variables

- `MONGO_URI` - MongoDB connection string (default: `mongodb://localhost:27017`)
- `NODE_ENV` - Environment (`development` or `production`)
- `TELNET_PORT` - Telnet server port (default: `5555`)
- `WS_PORT` - WebSocket server port (default: `8080`)
- `TLS_PORT` - TLS server port (default: `5556`)

## Security

### Current Security Model

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
- ❌ Input validation/sanitization

See [AUTH-ARCHITECTURE.md](./AUTH-ARCHITECTURE.md) for details.

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Transport layer (Telnet, WebSocket, TLS)
- [x] Connection management
- [x] Object system (MongoDB)
- [x] Prototype inheritance
- [x] Method execution
- [x] Authentication system
- [x] High-performance O(1) cache
- [x] Stable Proxy Pattern
- [x] Bootstrap system

### Phase 2: Game Mechanics 🚧
- [ ] Room system
- [ ] Movement commands (n, s, e, w, up, down)
- [ ] Inventory system
- [ ] Object manipulation (get, drop, look)
- [ ] Communication (say, emote, whisper)
- [ ] Help system

### Phase 3: World Building 📋
- [ ] MOO-style commands (@create, @dig, @property, @method)
- [ ] In-game programming
- [ ] Room builder
- [ ] Object editor
- [ ] World persistence

### Phase 4: Advanced Features 📋
- [ ] Combat system
- [ ] Skills/abilities
- [ ] AI agent integration
- [ ] Quest system
- [ ] Economy
- [ ] Guilds/factions

### Phase 5: Tooling 📋
- [ ] Web-based admin panel
- [ ] DevTools LSP integration
- [ ] Debugging tools
- [ ] Performance monitoring
- [ ] Backup/restore

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript with strict mode
- ESM modules (`.js` extensions in imports)
- Functional style preferred
- RxJS for reactive patterns
- Comprehensive tests for new features

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- agent.test.ts

# Run in watch mode
npm test -- --watch
```

Test coverage goals:
- Core systems: 90%+
- Transport layer: 80%+
- Game logic: 70%+

## License

MIT License - see LICENSE file for details

## Credits

- Inspired by [LambdaMOO](https://en.wikipedia.org/wiki/LambdaMOO)
- Built with [TypeScript](https://www.typescriptlang.org/), [RxJS](https://rxjs.dev/), and [MongoDB](https://www.mongodb.com/)
- Tested with [Vitest](https://vitest.dev/)

## Links

- GitHub: https://github.com/TSavo/Malice
- Documentation: See `docs/` folder
- Issues: https://github.com/TSavo/Malice/issues

## Philosophy

> "Do one thing well, then move to the next."

We're building from the ground up:
1. ✅ **Transport layer** - Telnet, WebSocket, TLS
2. ✅ **Object system** - MongoDB persistence, inheritance
3. ✅ **Authentication** - Multiple auth modes
4. ✅ **Multi-server** - Change streams for cache sync
5. 🚧 **Game mechanics** - Rooms, movement, interaction
6. 📋 **World building** - In-game programming
7. 📋 **Advanced features** - Combat, skills, quests

Each layer is built solid before moving to the next.
