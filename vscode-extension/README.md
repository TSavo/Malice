# Malice MOO Language Support for VS Code

TypeScript language support for Malice MOO objects with full IntelliSense, type checking, and autocomplete.

## Features

- 🎯 **Full TypeScript Support**: Write MOO methods in TypeScript with type checking
- 🔍 **IntelliSense**: Autocomplete for all object properties and methods
- 📝 **Hover Info**: See type signatures and documentation
- 🚀 **Go to Definition**: Navigate to prototype definitions
- 🔎 **Find References**: Find all uses of methods/properties
- 🌳 **Object Browser**: Browse all MOO objects as a virtual file system
- ✏️ **Live Editing**: Edit methods and properties directly in VS Code

## Setup

### 1. Start Malice Server

```bash
cd /path/to/malice/infallible-davinci/v2
npm start
```

This starts:
- MongoDB connection
- Game server
- LSP API server (port 3000)

### 2. Install Extension

```bash
cd vscode-extension
npm install
npm run compile
```

### 3. Load Extension in VS Code

1. Press `F5` to open Extension Development Host
2. Or: Run `Debug: Start Debugging` from Command Palette

### 4. Configure

Set your Malice server URL in VS Code settings:

```json
{
  "malice.apiUrl": "http://localhost:3000"
}
```

## Usage

### Opening Objects

**Command Palette** → `Malice: Open Object` → Enter object ID → Select method

**Quick Open**: `Ctrl+P` → Type `malice://objects/5/connect.ts`

### Browsing Objects

**Command Palette** → `Malice: Browse Objects`

Or use the Malice sidebar (Activity Bar icon)

### Editing Methods

1. Open a method file: `malice://objects/5/connect.ts`
2. Edit TypeScript code with full IntelliSense
3. Save (`Ctrl+S`) to update in MongoDB
4. Changes are live - reconnect to see them

### Editing Properties

1. Open a property file: `malice://objects/5/name.json`
2. Edit JSON
3. Save to update

## Virtual File System

The extension exposes a virtual file system:

```
malice://objects/
├── 1/                      (Root object)
│   ├── name.json          (property)
│   └── describe.ts        (method)
├── 5/                      (Player prototype)
│   ├── connect.ts         (method - TypeScript)
│   ├── onInput.ts         (method)
│   ├── playername.json    (property - JSON)
│   └── location.json      (property)
└── ...
```

## TypeScript Context

Each method gets full TypeScript context:

```typescript
// Auto-generated context for malice://objects/5/connect.ts

import type { Player } from '@malice/types/prototypes';
import type { ObjectManager } from '@malice/database/object-manager';
import type { ConnectionContext } from '@malice/game/connection-context';

declare const self: Player;  // Typed as Player prototype
declare const $: ObjectManager;
declare const args: [ConnectionContext];

// Your method code:
const context = args[0];
const loc = await $.load(self.location); // Autocomplete works!
```

## Type Definitions

The extension includes type definitions for:

- All prototypes (Describable, Location, Room, Agent, Human, Player)
- ObjectManager (`$`)
- ConnectionContext
- All MOO globals

## Keybindings

- `Ctrl+P` → Quick open objects
- `F12` → Go to definition
- `Shift+F12` → Find all references
- `Ctrl+Space` → Trigger autocomplete
- `Ctrl+.` → Quick fixes

## Troubleshooting

### "Cannot connect to API server"

- Make sure Malice server is running
- Check `malice.apiUrl` setting
- Check API server logs

### "No autocomplete"

- Save the file to trigger compilation
- Check for TypeScript errors in Problems panel
- Reload VS Code window

### "Changes not reflected"

- Save file (`Ctrl+S`)
- Check API server logs
- Reconnect to game to see changes

## Development

### Building

```bash
npm run compile
```

### Watching

```bash
npm run watch
```

### Packaging

```bash
npm run package
```

Creates `.vsix` file for distribution.

## Architecture

```
VS Code Extension
    ↓ FileSystemProvider (malice://)
HTTP API Server (port 3000)
    ↓
VirtualFileSystem
    ↓
MongoDB
```

```
VS Code Extension
    ↓ LSP Client
LSP Server (IPC)
    ↓
TypeScript Language Service
    ↓
Virtual Documents (with context)
```
