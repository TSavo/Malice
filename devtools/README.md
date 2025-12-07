# Malice DevTools

Development tools for editing Malice game objects in Visual Studio Code.

## Architecture

```
┌─────────────────────┐
│   VS Code Extension │
│   - Tree view       │
│   - Virtual docs    │
│   - LSP client      │
└──────────┬──────────┘
           │ WebSocket (port 9999)
           │ DevTools Protocol (JSON-RPC)
┌──────────┴──────────┐
│  DevTools Server    │
│  - CRUD API         │
│  - Type generation  │
│  - Change watching  │
└──────────┬──────────┘
           │
┌──────────┴──────────┐
│   ObjectManager     │
│   - Load/save objs  │
│   - Cache mgmt      │
└──────────┬──────────┘
           │
┌──────────┴──────────┐
│      MongoDB        │
└─────────────────────┘
```

## Components

### 1. DevTools Server (TypeScript)
**Location:** `v2/src/transport/devtools/`

- WebSocket server on port 9999
- Exposes ObjectManager via JSON-RPC protocol
- Generates TypeScript definitions from MongoDB
- Watches for changes and notifies clients

### 2. VS Code Extension
**Location:** `v2/devtools/vscode-extension/`

- Tree view of game objects
- Virtual filesystem (`malice://` URI scheme)
- Real-time type definition updates
- IntelliSense for `self`, `$`, `args`

### 3. Protocol Specifications
**Location:** `v2/devtools/spec/`

- **PROTOCOL.md** - JSON-RPC 2.0 DevTools protocol (CRUD operations)
- **LSP.md** - Language Server Protocol integration (autocomplete, hover, diagnostics)
- **TYPES.md** - TypeScript type generation specification
- **SECURITY.md** - Security model and best practices

## Quick Start

```bash
# Terminal 1: Start Malice server with DevTools
cd v2
bun run dev

# Terminal 2: Install and run VS Code extension
cd devtools/vscode-extension
npm install
npm run compile
code --extensionDevelopmentHost=../../

# In VS Code:
# - Open v2/ workspace
# - See "Malice Objects" in sidebar
# - Click any method to edit
```

## Directory Structure

```
v2/devtools/
├── README.md                    # This file
├── spec/
│   ├── PROTOCOL.md             # DevTools protocol spec
│   ├── TYPES.md                # Type generation spec
│   └── SECURITY.md             # Security considerations
├── vscode-extension/
│   ├── package.json
│   ├── src/
│   │   ├── extension.ts        # Extension entry point
│   │   ├── client.ts           # DevTools client
│   │   ├── tree-provider.ts    # Object tree view
│   │   └── document-provider.ts # Virtual filesystem
│   └── tsconfig.json
└── examples/
    ├── telnet-test.sh          # Test with telnet
    └── client-example.ts       # Node.js client example
```

## Features

### Phase 1 (MVP - Basic Editing)
- [x] Protocol specification (PROTOCOL.md)
- [x] Type generation spec (TYPES.md)
- [x] Security spec (SECURITY.md)
- [ ] DevTools server implementation
- [ ] Basic CRUD operations (object/property/method)
- [ ] Static type generation from MongoDB
- [ ] VS Code extension scaffold
- [ ] Virtual filesystem (malice:// URIs)

### Phase 2 (LSP - Intelligent Editing)
- [x] Language Server Protocol specification (LSP.md)
- [ ] LSP server implementation
- [ ] Context-aware autocomplete (self., $., args)
- [ ] Prototype chain resolution
- [ ] Hover information
- [ ] Real-time TypeScript diagnostics

### Phase 3 (Advanced Features)
- [ ] Go-to-definition across objects
- [ ] Find references
- [ ] Symbol search (workspace-wide)
- [ ] Rename refactoring
- [ ] Multi-user editing coordination
- [ ] Code snippets and templates

## Security

DevTools server is **localhost-only by default**:
- Only binds to 127.0.0.1
- Optional token authentication
- Disabled in production builds
- No external network access

See `spec/SECURITY.md` for details.
