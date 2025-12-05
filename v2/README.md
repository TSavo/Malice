# Malice v2 - Modern Transport Layer

Reactive TypeScript transport layer for Malice TMMO, built with RxJS and Bun.

## Architecture

### First Principles
- **Small, focused files** - No file over 500 lines
- **Separation of concerns** - Types, protocol, transport, connection all separate
- **Reactive by default** - RxJS Observables throughout
- **Transport agnostic** - Game logic never knows about telnet vs websocket

### Structure

```
v2/
├── types/              # Type definitions
│   ├── transport.ts    # Core transport interfaces
│   ├── telnet.ts       # Telnet protocol types
│   └── connection.ts   # Connection state types
├── src/
│   ├── transport/      # Transport implementations
│   │   ├── base-transport.ts           # Abstract base class
│   │   ├── telnet/
│   │   │   ├── protocol-parser.ts      # RFC854 parser
│   │   │   ├── command-builder.ts      # Command construction
│   │   │   ├── telnet-transport.ts     # Telnet implementation
│   │   │   └── telnet-server.ts        # Telnet server
│   │   └── websocket/
│   │       ├── websocket-transport.ts  # WebSocket implementation
│   │       └── websocket-server.ts     # WebSocket server
│   └── connection/     # Connection management
│       ├── connection.ts               # Connection wrapper
│       └── connection-manager.ts       # Pool management
└── test/               # Tests (TODO)
```

## Key Concepts

### Transport Layer
All transports implement `ITransport`:
```typescript
interface ITransport {
  readonly input$: Observable<string>;      // Incoming data
  readonly output$: Subject<string>;        // Outgoing data
  readonly connected$: Observable<boolean>; // Connection state
  readonly capabilities$: Observable<...>;  // Terminal caps
  readonly closed$: Observable<void>;       // Close event
}
```

### Connection Layer
`Connection` wraps a transport with session state:
- Authentication state
- User ID association
- Convenience methods

### Connection Manager
Manages all active connections:
- Reactive connection pool
- Aggregated input stream
- Broadcast capabilities

## Usage

### Install
```bash
bun install
```

### Run Demo
```bash
bun run dev
```

### Connect
```bash
# Via telnet
telnet localhost 5555

# Via WebSocket (need a WS client)
# Example: websocat ws://localhost:8080
```

## Demo Commands
- `help` - Show available commands
- `info` - Show connection info
- `who` - List connected users
- `quit` - Disconnect

## Features

### Telnet Transport
- ✅ Full RFC854 protocol support
- ✅ NAWS (window size negotiation)
- ✅ Terminal type detection
- ✅ Environment variables
- ✅ Raw/cooked mode switching
- ✅ Automatic CRLF conversion

### WebSocket Transport
- ✅ Text and binary frames
- ✅ Automatic reconnection support
- ✅ ANSI support (browser terminals)

### Reactive Architecture
- ✅ Observable streams for all I/O
- ✅ Automatic cleanup on disconnect
- ✅ Backpressure handling
- ✅ Event-driven design

## Next Steps

This is **just the transport layer**. Next up:
1. Game object models (User, Room, Body, etc.)
2. Command parsing and routing
3. Sensory/stimulus system
4. Persistence layer (MongoDB?)
5. Port existing game logic

## Philosophy

> "Do one thing well, then move to the next."

We're building from the ground up:
1. ✅ **Transport** - Done (you are here)
2. **Domain Models** - Next
3. **Game Logic** - After that
4. **Persistence** - When needed
