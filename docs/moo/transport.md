# Transport Layer

Malice uses HTTP and WebSocket transports for player connections. Each faction gets its own transport bundle with dedicated ports.

## Transport Architecture

**Per-Faction Transport Bundles:**

Each faction gets isolated network infrastructure:

| Faction | HTTP | WebSocket | Session MCP |
|---------|------|-----------|-------------|
| Continuum | 8000 | 8080 | 3012 |
| Gray Cartel | 8001 | 8081 | 3013 |
| (new faction N) | 8000+N | 8080+N | 3012+N |

**WebSocket Paths:**

| Path | Format | Use Case |
|------|--------|----------|
| `/` | Raw text | Simple web terminals |
| `/mux` | JSON envelopes | Rich web clients (recommended) |

## Multiplexed WebSocket Transport

The `/mux` endpoint provides a channel-based protocol for rich web clients that need more than just text I/O.

### Why Multiplexed?

Raw WebSocket connections are single-channel - everything is text in, text out. The multiplexed transport adds:

- **Out-of-band state updates** - Push room/inventory changes without cluttering text
- **Control signals** - Resize, ready state, typing indicators
- **Custom channels** - Extensible for future features (media, maps, etc.)
- **Clean separation** - Game text stays on game channel, metadata elsewhere

### Wire Protocol

Every message is a JSON object with three fields:

```json
{
  "ch": "channel_name",
  "t": "message_type",
  "p": "payload"
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `ch` | string | Channel ID |
| `t` | string | Message type |
| `p` | any | Payload (type depends on channel) |
| `seq` | number? | Optional sequence number |

#### Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `data` | both | Normal data message |
| `open` | client→server | Request to open a channel |
| `close` | both | Close a channel |
| `ack` | server→client | Acknowledge channel open |
| `ping` | client→server | Keepalive ping |
| `pong` | server→client | Keepalive response |

### Built-in Channels

#### `game` - Text I/O

The primary channel for game text, equivalent to telnet.

```javascript
// Client sends command
{ "ch": "game", "t": "data", "p": "look" }

// Server sends output
{ "ch": "game", "t": "data", "p": "The Lobby\r\nA grand entrance hall...\r\n" }
```

Payload is always a string.

#### `state` - State Updates

Server pushes structured state data. Client never sends on this channel.

```javascript
// Room update
{ "ch": "state", "t": "data", "p": { "type": "room", "data": { "name": "Lobby", "exits": ["n", "s", "e"] } } }

// Inventory update
{ "ch": "state", "t": "data", "p": { "type": "inventory", "data": [{ "id": 42, "name": "torch" }] } }

// Inventory delta
{ "ch": "state", "t": "data", "p": { "type": "inventoryDelta", "data": { "added": [...], "removed": [...] } } }
```

State payload structure:
```typescript
interface StateMessage {
  type: string;   // 'room' | 'inventory' | 'inventoryDelta' | custom
  data: unknown;  // Type-specific data
}
```

#### `ctrl` - Control Signals

Bidirectional control messages.

**Client → Server:**
```javascript
// Terminal resize
{ "ch": "ctrl", "t": "data", "p": { "type": "resize", "w": 120, "h": 40 } }

// Client ready (after initial load)
{ "ch": "ctrl", "t": "data", "p": { "type": "ready" } }

// Typing indicator
{ "ch": "ctrl", "t": "data", "p": { "type": "typing", "active": true } }
```

**Server → Client:**
```javascript
// Update prompt
{ "ch": "ctrl", "t": "data", "p": { "type": "prompt", "text": "> " } }

// Mode change
{ "ch": "ctrl", "t": "data", "p": { "type": "mode", "mode": "combat" } }
```

#### Custom Channels

Open custom channels with `custom:` prefix:

```javascript
// Client requests channel
{ "ch": "custom:events", "t": "open", "p": null }

// Server acknowledges
{ "ch": "custom:events", "t": "ack", "p": { "opened": true } }

// Data flows
{ "ch": "custom:events", "t": "data", "p": { "event": "npc_spawn", "npc": "guard" } }

// Close when done
{ "ch": "custom:events", "t": "close", "p": null }
```

## MOO Channel Methods

### Player Methods

Every player object has methods to send on channels:

```javascript
// Send state update to this player
await player.call('state', 'room', { name: 'Lobby', exits: ['n'] });

// Send control message
await player.call('ctrl', 'prompt', { text: '> ' });

// Send on any channel
await player.call('channel', 'custom:events', { event: 'alert' });
```

These methods no-op silently for non-multiplexed connections.

### Location Broadcast Methods

Locations (rooms, containers) can broadcast to all contained players:

```javascript
// Broadcast room state to everyone here
await room.call('broadcastState', 'room', {
  name: room.name,
  description: room.description
});

// Broadcast control signal
await room.call('broadcastCtrl', 'mode', { combat: true });

// Broadcast on custom channel
await room.call('broadcastChannel', 'custom:fx', {
  sound: 'explosion.mp3',
  volume: 0.8
});
```

### Global Broadcast Methods

The ObjectManager (`$`) provides global broadcasts:

```javascript
// Announce to all connected mux players
const count = await $.broadcastState('announcement', {
  message: 'Server restart in 5 minutes'
});
console.log(`Sent to ${count} players`);

// Global mode change
await $.broadcastCtrl('mode', { maintenance: true });

// Custom global event
await $.broadcastChannel('custom:world', { event: 'earthquake' });
```

## Client Implementation

### Basic JavaScript Client

```javascript
class MaliceClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.handlers = new Map();

    this.ws.onmessage = (e) => {
      const { ch, t, p } = JSON.parse(e.data);
      const handler = this.handlers.get(ch);
      if (handler) handler(t, p);
    };
  }

  on(channel, handler) {
    this.handlers.set(channel, handler);
  }

  send(channel, payload, type = 'data') {
    this.ws.send(JSON.stringify({ ch: channel, t: type, p: payload }));
  }

  sendCommand(text) {
    this.send('game', text);
  }

  resize(w, h) {
    this.send('ctrl', { type: 'resize', w, h });
  }
}

// Usage
const client = new MaliceClient('ws://localhost:8080/mux');

client.on('game', (t, text) => terminal.write(text));
client.on('state', (t, msg) => {
  if (msg.type === 'room') updateRoomPanel(msg.data);
  if (msg.type === 'inventory') updateInventory(msg.data);
});
client.on('ctrl', (t, msg) => {
  if (msg.type === 'prompt') updatePrompt(msg.text);
});

client.sendCommand('look');
client.resize(120, 40);
```

### xterm.js Integration

```javascript
const term = new Terminal({ cols: 80, rows: 24 });
const client = new MaliceClient('ws://localhost:8080/mux');

// Game output to terminal
client.on('game', (t, text) => term.write(text));

// Terminal input to game
term.onData((data) => client.sendCommand(data));

// Sync terminal size
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
fitAddon.fit();

new ResizeObserver(() => {
  fitAddon.fit();
  client.resize(term.cols, term.rows);
}).observe(term.element);
```

## Transport Selection

The server automatically selects transport based on connection path:

| Path Pattern | Transport Class |
|--------------|-----------------|
| `/mux`, `/ws/mux` | `MultiplexedTransport` |
| `/`, `/ws`, other | `WebSocketTransport` |

Both transports emit to the same `Connection` abstraction, so the game logic doesn't need to know which transport is in use. The `ConnectionContext` provides `isMultiplexed` to check.

## Implementation Details

### Source Files

- `src/transport/multiplexed/` - Multiplexed transport implementation
  - `types.ts` - TypeScript interfaces
  - `channel.ts` - Individual channel (RxJS subjects)
  - `channel-mux.ts` - Channel multiplexer
  - `multiplexed-transport.ts` - Transport wrapper
  - `codecs/json-codec.ts` - Wire format encoder/decoder

- `src/transport/websocket/websocket-server.ts` - Path-based routing

- `src/game/connection-context.ts` - Context methods (`state`, `ctrl`, `channel`)

- `src/database/bootstrap/prototypes/player-builder.ts` - Player MOO methods
- `src/database/bootstrap/prototypes/location-builder.ts` - Location broadcast methods
- `src/database/bootstrap/minimal-bootstrap.ts` - Global broadcast methods

### Testing

```bash
npm test -- --run test/transport/multiplexed.test.ts
```

Tests cover:
- Connection and welcome banner
- Game channel I/O
- Control channel signals
- Channel open/ack protocol
- MOO broadcast methods
- Raw vs multiplexed format detection
