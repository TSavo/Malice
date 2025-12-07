# Malice DevTools Protocol Specification

**Version:** 1.0.0
**Transport:** WebSocket (JSON-RPC 2.0)
**Port:** 9999 (localhost only)

## Overview

The DevTools protocol enables VS Code and other editors to interact with a running Malice server for live editing of game objects, methods, and properties stored in MongoDB.

## Connection

```
ws://localhost:9999/devtools?token=<optional-auth-token>
```

### Handshake

Client connects via WebSocket. Server responds with capabilities:

```json
{
  "jsonrpc": "2.0",
  "method": "server.hello",
  "params": {
    "version": "1.0.0",
    "capabilities": {
      "objectCRUD": true,
      "typeGeneration": true,
      "changeWatch": true,
      "lsp": false
    }
  }
}
```

## Message Format

All messages use JSON-RPC 2.0:

### Request
```json
{
  "jsonrpc": "2.0",
  "method": "object.get",
  "params": { "id": 2 },
  "id": 1
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "result": { /* data */ },
  "id": 1
}
```

### Error
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "Object not found"
  },
  "id": 1
}
```

### Notification (server-initiated)
```json
{
  "jsonrpc": "2.0",
  "method": "object.changed",
  "params": { "id": 2 }
}
```

## Methods

### Object Operations

#### `objects.list`
List all objects in the database.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "objects.list",
  "params": {
    "includeRecycled": false  // optional, default false
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "objects": [
      {
        "id": 1,
        "parent": 0,
        "properties": ["name"],
        "methods": [],
        "recycled": false
      },
      {
        "id": 2,
        "parent": 1,
        "properties": ["name"],
        "methods": ["onConnection"],
        "recycled": false
      }
    ]
  },
  "id": 1
}
```

#### `object.get`
Get full object data.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.get",
  "params": { "id": 2 },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "object": {
      "_id": 2,
      "parent": 1,
      "properties": {
        "name": "System"
      },
      "methods": {
        "onConnection": "const context = args[0]; ..."
      },
      "created": "2025-12-05T10:00:00.000Z",
      "modified": "2025-12-05T10:00:00.000Z",
      "recycled": false
    }
  },
  "id": 2
}
```

#### `object.create`
Create a new object.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.create",
  "params": {
    "parent": 1,
    "properties": {
      "name": "New Room",
      "description": "A blank room"
    },
    "methods": {
      "onEnter": "const user = args[0];\nuser.send('Welcome!');"
    }
  },
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "object": {
      "_id": 5,
      "parent": 1,
      "properties": { "name": "New Room", "description": "A blank room" },
      "methods": { "onEnter": "..." },
      "created": "2025-12-05T10:30:00.000Z",
      "modified": "2025-12-05T10:30:00.000Z",
      "recycled": false
    }
  },
  "id": 3
}
```

#### `object.update`
Update entire object (replaces all properties/methods).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.update",
  "params": {
    "id": 5,
    "parent": 1,
    "properties": { "name": "Updated Room" },
    "methods": { "onEnter": "..." }
  },
  "id": 4
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true },
  "id": 4
}
```

#### `object.delete`
Soft-delete (recycle) an object.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "object.delete",
  "params": { "id": 5 },
  "id": 5
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true, "recycled": true },
  "id": 5
}
```

### Property Operations

#### `property.get`
Get a single property value.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "property.get",
  "params": {
    "objectId": 3,
    "name": "welcomeMessage"
  },
  "id": 6
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "value": "Welcome to Malice!\r\n",
    "type": "string"
  },
  "id": 6
}
```

#### `property.set`
Set a property value.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "property.set",
  "params": {
    "objectId": 3,
    "name": "welcomeMessage",
    "value": "Welcome to the new Malice!\r\n"
  },
  "id": 7
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true },
  "id": 7
}
```

#### `property.delete`
Remove a property.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "property.delete",
  "params": {
    "objectId": 3,
    "name": "oldProperty"
  },
  "id": 8
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true },
  "id": 8
}
```

### Method Operations

#### `method.get`
Get method source code.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "method.get",
  "params": {
    "objectId": 2,
    "name": "onConnection"
  },
  "id": 9
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "code": "const context = args[0];\nconst authManager = await $.authManager;\n..."
  },
  "id": 9
}
```

#### `method.set`
Update method source code.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "method.set",
  "params": {
    "objectId": 2,
    "name": "onConnection",
    "code": "const context = args[0];\n// Updated implementation\n..."
  },
  "id": 10
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true, "invalidated": true },
  "id": 10
}
```

**Note:** `invalidated: true` means the ObjectManager cache was cleared for this object.

#### `method.delete`
Remove a method.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "method.delete",
  "params": {
    "objectId": 2,
    "name": "oldMethod"
  },
  "id": 11
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "success": true },
  "id": 11
}
```

### Type Generation

#### `types.generate`
Generate TypeScript definitions from current database state.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "types.generate",
  "params": {},
  "id": 12
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "definitions": "// Auto-generated\n\ninterface MaliceObject_1 { ... }\n..."
  },
  "id": 12
}
```

#### `types.watch`
Enable automatic type regeneration on changes.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "types.watch",
  "params": {},
  "id": 13
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": { "watching": true },
  "id": 13
}
```

After this, the server will send `types.updated` notifications when objects change.

### Alias Management

#### `aliases.list`
Get all registered ObjectManager aliases.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "aliases.list",
  "params": {},
  "id": 14
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "aliases": [
      { "name": "system", "objectId": 2 },
      { "name": "authManager", "objectId": 3 },
      { "name": "charGen", "objectId": 4 }
    ]
  },
  "id": 14
}
```

## Notifications (Server → Client)

Server-initiated notifications are sent automatically via **MongoDB change streams**. The DevTools server watches for changes from other servers (game servers, other DevTools instances) and broadcasts them to all connected clients.

### `object.changed`
An object was modified (detected via MongoDB change stream).

```json
{
  "jsonrpc": "2.0",
  "method": "object.changed",
  "params": {
    "objectId": 2,
    "changeType": "update",
    "source": "external"
  }
}
```

**Triggers:**
- Another DevTools instance edits the object
- Game server modifies object properties/methods
- Any write to MongoDB `objects` collection

### `object.created`
A new object was created.

```json
{
  "jsonrpc": "2.0",
  "method": "object.created",
  "params": {
    "objectId": 5
  }
}
```

### `object.deleted`
An object was recycled.

```json
{
  "jsonrpc": "2.0",
  "method": "object.deleted",
  "params": {
    "objectId": 5
  }
}
```

### `types.updated`
Type definitions have been regenerated (sent when watching).

```json
{
  "jsonrpc": "2.0",
  "method": "types.updated",
  "params": {
    "definitions": "// Auto-generated\n..."
  }
}
```

**Trigger:** Sent automatically when any object is modified (via change stream)

## Error Codes

Standard JSON-RPC errors plus:

| Code | Message | Description |
|------|---------|-------------|
| -32001 | Object not found | Object ID doesn't exist |
| -32002 | Property not found | Property doesn't exist on object |
| -32003 | Method not found | Method doesn't exist on object |
| -32004 | Invalid parent | Parent object doesn't exist |
| -32005 | Permission denied | (Future: when permissions added) |
| -32006 | Invalid TypeScript | Method code has syntax errors |

## Virtual URIs

For VS Code integration, objects are mapped to virtual URIs:

```
malice://#<objectId>/<methodName>.ts    → Method source
malice://#<objectId>/<propertyName>.json → Property value (JSON editor)
malice://#<objectId>/meta.json           → Object metadata
```

Examples:
```
malice://#2/onConnection.ts
malice://#3/welcomeMessage.json
malice://#4/meta.json
```

## Security

### Authentication

Optional token-based auth via query parameter:

```
ws://localhost:9999/devtools?token=your-secret-token
```

If server requires auth and token is missing/invalid, connection is immediately closed with code 1008 (Policy Violation).

### Authorization

Currently no per-object authorization. All authenticated clients have full CRUD access.

Future: Check object ownership/permissions before allowing modifications.

### Network Binding

**Production:** DevTools server should NOT start
**Development:** Bind only to 127.0.0.1 (localhost)

Never expose port 9999 to external networks.

## Example Session

```javascript
// Client connects
const ws = new WebSocket('ws://localhost:9999/devtools');

// Server sends hello
← { "jsonrpc": "2.0", "method": "server.hello", "params": { ... } }

// Client lists objects
→ { "jsonrpc": "2.0", "method": "objects.list", "id": 1 }
← { "jsonrpc": "2.0", "result": { "objects": [...] }, "id": 1 }

// Client gets method
→ { "jsonrpc": "2.0", "method": "method.get", "params": { "objectId": 2, "name": "onConnection" }, "id": 2 }
← { "jsonrpc": "2.0", "result": { "code": "..." }, "id": 2 }

// Client updates method
→ { "jsonrpc": "2.0", "method": "method.set", "params": { "objectId": 2, "name": "onConnection", "code": "..." }, "id": 3 }
← { "jsonrpc": "2.0", "result": { "success": true }, "id": 3 }

// Server notifies other clients
← { "jsonrpc": "2.0", "method": "object.changed", "params": { "objectId": 2 } }

// Client requests type generation
→ { "jsonrpc": "2.0", "method": "types.generate", "id": 4 }
← { "jsonrpc": "2.0", "result": { "definitions": "..." }, "id": 4 }

// Client enables type watching
→ { "jsonrpc": "2.0", "method": "types.watch", "id": 5 }
← { "jsonrpc": "2.0", "result": { "watching": true }, "id": 5 }

// Later, when any object changes...
← { "jsonrpc": "2.0", "method": "types.updated", "params": { "definitions": "..." } }
```

## Multi-Server Architecture

The DevTools protocol is designed for **multiple servers sharing one MongoDB database**.

### MongoDB Change Streams

All DevTools servers watch MongoDB change streams:

```typescript
// When another server modifies object #3
MongoDB Change Stream → DevTools Server
  ↓
ObjectManager.invalidate(3)  // Clear cache
  ↓
Broadcast to all connected clients:
{
  "method": "object.changed",
  "params": { "objectId": 3, "source": "external" }
}
```

**Benefits:**
- ✅ Multiple DevTools instances stay in sync
- ✅ Game server changes visible in VS Code immediately
- ✅ No polling required (event-driven)
- ✅ Automatic cache invalidation

### Requirements

MongoDB must run as a **replica set** (even single-node) for change streams:

```bash
docker run -d --name malice-mongo -p 27017:27017 mongo:7.0 --replSet rs0
docker exec malice-mongo mongosh --eval "rs.initiate()"
```

See `CHANGE-STREAMS.md` for details.

## Future Extensions

### Language Server Protocol
Once basic CRUD is stable, add LSP methods:
- `textDocument/completion` - Autocomplete
- `textDocument/hover` - Type info on hover
- `textDocument/definition` - Go-to-definition

### Diff/History
Track object modification history for rollback.

### Multi-user Coordination
Lock objects during editing to prevent conflicts.
