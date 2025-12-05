# Language Server Protocol Integration

## Overview

The Malice DevTools server implements a **Language Server Protocol (LSP)** to provide rich editing support for object methods stored in MongoDB. This enables VS Code to provide intelligent autocomplete, hover information, diagnostics, and navigation features.

## LSP vs DevTools Protocol

The DevTools system uses **two protocols**:

1. **DevTools Protocol** (port 9999, WebSocket) - CRUD operations, type generation
2. **Language Server Protocol** (stdio/socket, JSON-RPC) - Editor intelligence

### Architecture

```
┌─────────────────────┐
│   VS Code           │
├─────────────────────┤
│ LSP Client          │ ←→ stdio → Malice LSP Server
│ (built-in)          │              ↓
│                     │         ObjectManager
│ DevTools Client     │              ↓
│ (extension)         │           MongoDB
└─────────────────────┘
         ↓ WebSocket
    DevTools Server
```

**Why Two Protocols?**
- **DevTools Protocol** - CRUD, authentication, type generation (custom)
- **LSP** - Editor features using industry standard (VS Code knows LSP)

## LSP Initialization

### Server Capabilities

```json
{
  "capabilities": {
    "textDocumentSync": {
      "openClose": true,
      "change": 2,
      "save": { "includeText": true }
    },
    "completionProvider": {
      "resolveProvider": true,
      "triggerCharacters": [".", "$", "self", "args"]
    },
    "hoverProvider": true,
    "definitionProvider": true,
    "referencesProvider": true,
    "documentSymbolProvider": true,
    "workspaceSymbolProvider": true,
    "diagnosticProvider": {
      "interFileDependencies": false,
      "workspaceDiagnostics": false
    }
  }
}
```

### Client Initialization

```json
{
  "processId": 12345,
  "clientInfo": {
    "name": "Visual Studio Code",
    "version": "1.85.0"
  },
  "rootUri": "file:///path/to/malice/v2",
  "capabilities": {
    "textDocument": {
      "completion": {
        "completionItem": {
          "snippetSupport": true,
          "documentationFormat": ["markdown", "plaintext"]
        }
      }
    }
  }
}
```

## Document URIs

LSP operates on virtual documents with the `malice://` scheme:

```
malice://#2/onConnection.ts    → System object's onConnection method
malice://#3/welcomeMessage.ts  → AuthManager's welcomeMessage property (treated as code)
malice://#4/meta.json          → Object metadata (read-only)
```

### URI Structure

```
malice://#<objectId>/<memberName>.<extension>
        └─────┬─────┘ └────┬────┘  └───┬───┘
          Object ID      Member      Type
                         Name        Hint
```

**Extensions:**
- `.ts` - Method source code (editable)
- `.json` - Property value (editable as JSON)
- `.meta.json` - Object metadata (read-only)

## LSP Methods

### 1. `textDocument/completion`

Provides autocomplete suggestions based on context.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/completion",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    },
    "position": {
      "line": 2,
      "character": 5
    },
    "context": {
      "triggerKind": 2,
      "triggerCharacter": "."
    }
  },
  "id": 1
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "isIncomplete": false,
    "items": [
      {
        "label": "welcomeMessage",
        "kind": 10,
        "detail": "string",
        "documentation": {
          "kind": "markdown",
          "value": "Property defined on object #3"
        },
        "sortText": "0000",
        "insertText": "welcomeMessage"
      },
      {
        "label": "onConnect",
        "kind": 2,
        "detail": "(...args: any[]) => Promise<any>",
        "documentation": {
          "kind": "markdown",
          "value": "Method defined on object #3\n\n```typescript\nconst context = args[0];\ncontext.send(self.welcomeMessage);\n```"
        },
        "sortText": "0001",
        "insertText": "onConnect"
      }
    ]
  },
  "id": 1
}
```

#### Completion Kinds

| Kind | Type | Example |
|------|------|---------|
| 2 | Method | `onConnect` |
| 5 | Field | `id`, `parent` |
| 6 | Variable | `args`, `self`, `$` |
| 10 | Property | `welcomeMessage` |
| 14 | Keyword | `await`, `const` |

### 2. `completionItem/resolve`

Fetch additional details for a completion item (lazy loading).

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "completionItem/resolve",
  "params": {
    "label": "authManager",
    "kind": 10,
    "data": {
      "objectId": 3,
      "memberName": "authManager",
      "resolveType": "alias"
    }
  },
  "id": 2
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "label": "authManager",
    "kind": 10,
    "detail": "Promise<RuntimeObject & MaliceObject_3>",
    "documentation": {
      "kind": "markdown",
      "value": "**Object #3 - AuthManager**\n\nParent: #1 (Root)\n\n**Properties:**\n- `welcomeMessage: string`\n- `loginPrompt: string`\n\n**Methods:**\n- `onConnect(context: ConnectionContext)`\n- `onInput(context: ConnectionContext, input: string)`"
    },
    "insertText": "authManager"
  },
  "id": 2
}
```

### 3. `textDocument/hover`

Show information on hover.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/hover",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    },
    "position": {
      "line": 5,
      "character": 10
    }
  },
  "id": 3
}
```

#### Response (hovering over `self.welcomeMessage`)

```json
{
  "jsonrpc": "2.0",
  "result": {
    "contents": {
      "kind": "markdown",
      "value": "```typescript\n(property) welcomeMessage: string\n```\n\nDefined on object #3 (AuthManager)\n\nValue: `\"Welcome to Malice!\\r\\n\"`"
    },
    "range": {
      "start": { "line": 5, "character": 5 },
      "end": { "line": 5, "character": 19 }
    }
  },
  "id": 3
}
```

#### Response (hovering over `$.authManager`)

```json
{
  "jsonrpc": "2.0",
  "result": {
    "contents": {
      "kind": "markdown",
      "value": "```typescript\n(readonly) authManager: Promise<RuntimeObject>\n```\n\n**Resolves to:** Object #3 (AuthManager)\n\n**Parent:** Object #1 (Root)\n\n**Methods:**\n- `onConnect(context: ConnectionContext)`\n- `onInput(context: ConnectionContext, input: string)`\n\n[View Object](#)"
    }
  },
  "id": 3
}
```

### 4. `textDocument/definition`

Go to definition (Ctrl+Click).

#### Request (clicking on `$.authManager`)

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/definition",
  "params": {
    "textDocument": {
      "uri": "malice://#2/onConnection.ts"
    },
    "position": {
      "line": 3,
      "character": 25
    }
  },
  "id": 4
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "uri": "malice://#3/meta.json",
    "range": {
      "start": { "line": 0, "character": 0 },
      "end": { "line": 0, "character": 0 }
    }
  },
  "id": 4
}
```

Opens the metadata view for object #3.

#### Request (clicking on `self.onConnect`)

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/definition",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    },
    "position": {
      "line": 8,
      "character": 10
    }
  },
  "id": 5
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "uri": "malice://#3/onConnect.ts",
    "range": {
      "start": { "line": 0, "character": 0 },
      "end": { "line": 0, "character": 0 }
    }
  },
  "id": 5
}
```

Opens the `onConnect` method in the editor.

### 5. `textDocument/references`

Find all references to a method or property.

#### Request (find usages of `$.authManager`)

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/references",
  "params": {
    "textDocument": {
      "uri": "malice://#2/onConnection.ts"
    },
    "position": {
      "line": 3,
      "character": 25
    },
    "context": {
      "includeDeclaration": true
    }
  },
  "id": 6
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": [
    {
      "uri": "malice://#2/onConnection.ts",
      "range": {
        "start": { "line": 3, "character": 23 },
        "end": { "line": 3, "character": 34 }
      }
    },
    {
      "uri": "malice://#5/handleLogin.ts",
      "range": {
        "start": { "line": 10, "character": 18 },
        "end": { "line": 10, "character": 29 }
      }
    }
  ],
  "id": 6
}
```

### 6. `textDocument/documentSymbol`

Show outline of current document (methods/properties).

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/documentSymbol",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    }
  },
  "id": 7
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": [
    {
      "name": "context",
      "kind": 13,
      "range": {
        "start": { "line": 0, "character": 6 },
        "end": { "line": 0, "character": 13 }
      },
      "selectionRange": {
        "start": { "line": 0, "character": 6 },
        "end": { "line": 0, "character": 13 }
      }
    },
    {
      "name": "input",
      "kind": 13,
      "range": {
        "start": { "line": 1, "character": 6 },
        "end": { "line": 1, "character": 11 }
      },
      "selectionRange": {
        "start": { "line": 1, "character": 6 },
        "end": { "line": 1, "character": 11 }
      }
    }
  ],
  "id": 7
}
```

### 7. `workspace/symbol`

Search for symbols across all objects.

#### Request (search for "onConnect")

```json
{
  "jsonrpc": "2.0",
  "method": "workspace/symbol",
  "params": {
    "query": "onConnect"
  },
  "id": 8
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": [
    {
      "name": "onConnect",
      "kind": 2,
      "location": {
        "uri": "malice://#3/onConnect.ts",
        "range": {
          "start": { "line": 0, "character": 0 },
          "end": { "line": 0, "character": 0 }
        }
      },
      "containerName": "Object #3 (AuthManager)"
    }
  ],
  "id": 8
}
```

### 8. `textDocument/diagnostic`

Provide real-time error checking.

#### Request

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/diagnostic",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    }
  },
  "id": 9
}
```

#### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "kind": "full",
    "items": [
      {
        "range": {
          "start": { "line": 5, "character": 5 },
          "end": { "line": 5, "character": 25 }
        },
        "severity": 1,
        "code": "TS2551",
        "source": "malice-lsp",
        "message": "Property 'nonExistentProp' does not exist on type 'RuntimeObject & MaliceObject_3'."
      },
      {
        "range": {
          "start": { "line": 10, "character": 15 },
          "end": { "line": 10, "character": 20 }
        },
        "severity": 2,
        "code": "TS6133",
        "source": "malice-lsp",
        "message": "'unused' is declared but its value is never read.",
        "tags": [1]
      }
    ]
  },
  "id": 9
}
```

**Severity Levels:**
- 1 = Error (red squiggle)
- 2 = Warning (yellow squiggle)
- 3 = Information (blue squiggle)
- 4 = Hint (gray dots)

### 9. `textDocument/didChange`

Client notifies server of edits (for incremental updates).

#### Notification (no response expected)

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/didChange",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts",
      "version": 2
    },
    "contentChanges": [
      {
        "range": {
          "start": { "line": 5, "character": 0 },
          "end": { "line": 5, "character": 0 }
        },
        "text": "  // New comment\n"
      }
    ]
  }
}
```

Server updates internal representation and may trigger diagnostics.

### 10. `textDocument/didSave`

Client notifies server of save (triggers MongoDB update).

#### Notification

```json
{
  "jsonrpc": "2.0",
  "method": "textDocument/didSave",
  "params": {
    "textDocument": {
      "uri": "malice://#3/onInput.ts"
    },
    "text": "const context = args[0];\nconst input = args[1];\n..."
  }
}
```

Server:
1. Updates MongoDB with new method code
2. Invalidates ObjectManager cache
3. Regenerates type definitions
4. Broadcasts change to other connected clients

## Context Resolution

The LSP server needs to understand **what you're typing** to provide intelligent completions.

### Completion Triggers

#### `self.`

**Query:** What properties/methods exist on the current object + parent chain?

```typescript
// User editing: malice://#3/onInput.ts
// User types: self.

// LSP queries MongoDB:
const obj = await db.objects.findOne({ _id: 3 });
const properties = Object.keys(obj.properties);
const methods = Object.keys(obj.methods);

// Walk parent chain:
if (obj.parent !== 0) {
  const parent = await db.objects.findOne({ _id: obj.parent });
  // ... merge parent's properties/methods
}

// Return completions
```

#### `$.`

**Query:** What aliases are registered on ObjectManager?

```typescript
// LSP queries ObjectManager:
const aliases = objectManager.getAliases();
// Returns: ['system', 'authManager', 'charGen', ...]

// Also include standard methods:
const methods = ['load', 'create', 'recycle', 'registerAlias', ...];

// Return completions
```

#### `args[`

**Query:** What are the expected arguments for this method?

```typescript
// Future: Parse JSDoc or infer from usage patterns
// For now: Return generic any[]
```

#### `await $.authManager.`

**Query:** User awaited an alias - what object does it resolve to?

```typescript
// LSP knows $.authManager -> object #3
// Query object #3's properties/methods
```

**Challenge:** Requires static analysis of the code to track variable assignments:

```typescript
const auth = await $.authManager; // Track that 'auth' = object #3
auth. // <-- Need to know 'auth' refers to #3
```

**Solution:** Use TypeScript's language service internally:

```typescript
import ts from 'typescript';

// Create virtual source file with type definitions
const sourceFile = ts.createSourceFile(
  'temp.ts',
  wrappedCode,
  ts.ScriptTarget.ES2022
);

// Use TypeScript to resolve types
const typeChecker = program.getTypeChecker();
const symbol = typeChecker.getSymbolAtLocation(node);
```

## Property Resolution Algorithm

When completing `self.propName`:

```typescript
async function resolveProperties(objectId: number): Promise<Property[]> {
  const visited = new Set<number>();
  const properties = [];

  let currentId = objectId;

  while (currentId !== 0 && !visited.has(currentId)) {
    visited.add(currentId);

    const obj = await db.objects.findOne({ _id: currentId });
    if (!obj) break;

    // Add this object's properties/methods
    for (const [name, value] of Object.entries(obj.properties)) {
      if (!properties.some(p => p.name === name)) {
        properties.push({
          name,
          value,
          type: inferType(value),
          definedOn: currentId
        });
      }
    }

    for (const [name, code] of Object.entries(obj.methods)) {
      if (!properties.some(p => p.name === name)) {
        properties.push({
          name,
          type: 'method',
          code,
          definedOn: currentId
        });
      }
    }

    // Walk up prototype chain
    currentId = obj.parent;
  }

  // Add RuntimeObject methods
  properties.push(
    { name: 'call', type: 'method', definedOn: 'RuntimeObject' },
    { name: 'get', type: 'method', definedOn: 'RuntimeObject' },
    { name: 'set', type: 'method', definedOn: 'RuntimeObject' },
    { name: 'id', type: 'number', definedOn: 'RuntimeObject' },
    { name: 'parent', type: 'number', definedOn: 'RuntimeObject' }
  );

  return properties;
}
```

## TypeScript Integration

The LSP server uses TypeScript's language service for type checking:

```typescript
import ts from 'typescript';

export class MaliceLSP {
  private tsService: ts.LanguageService;

  constructor(private objectManager: ObjectManager) {
    // Create virtual file system
    const files = new Map<string, string>();

    // Create LanguageService host
    const servicesHost: ts.LanguageServiceHost = {
      getScriptFileNames: () => Array.from(files.keys()),
      getScriptVersion: () => '1',
      getScriptSnapshot: (fileName) => {
        const content = files.get(fileName);
        return content ? ts.ScriptSnapshot.fromString(content) : undefined;
      },
      getCurrentDirectory: () => process.cwd(),
      getCompilationSettings: () => ({
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        strict: true
      }),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      readDirectory: ts.sys.readDirectory
    };

    this.tsService = ts.createLanguageService(servicesHost);
  }

  async getCompletions(uri: string, position: Position): Promise<CompletionItem[]> {
    const [objectId, methodName] = this.parseUri(uri);
    const code = await this.getMethodCode(objectId, methodName);

    // Wrap code with type definitions
    const wrappedCode = this.wrapWithContext(code, objectId);

    // Get TypeScript completions
    const offset = this.positionToOffset(code, position);
    const completions = this.tsService.getCompletionsAtPosition(
      uri,
      offset,
      {}
    );

    // Enhance with Malice-specific completions
    return this.enhanceCompletions(completions, objectId);
  }

  private wrapWithContext(code: string, objectId: number): string {
    return `
      /// <reference path=".malice/generated.d.ts" />

      declare const self: RuntimeObject & MaliceObject_${objectId};
      declare const $: ObjectManager;
      declare const args: any[];

      (async function() {
        ${code}
      })();
    `;
  }
}
```

## Performance Optimization

### Caching

```typescript
export class MaliceLSP {
  private propertyCache = new Map<number, Property[]>();
  private cacheExpiry = 5000; // 5 seconds

  async resolveProperties(objectId: number): Promise<Property[]> {
    const cached = this.propertyCache.get(objectId);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.properties;
    }

    const properties = await this.fetchPropertiesFromDB(objectId);
    this.propertyCache.set(objectId, {
      properties,
      timestamp: Date.now()
    });

    return properties;
  }

  invalidateCache(objectId: number) {
    this.propertyCache.delete(objectId);
  }
}
```

### Incremental Updates

Only reparse changed portions:

```typescript
onDidChange(params: DidChangeTextDocumentParams) {
  const uri = params.textDocument.uri;
  const changes = params.contentChanges;

  // Apply incremental changes
  for (const change of changes) {
    this.applyEdit(uri, change);
  }

  // Only revalidate changed lines
  this.validateRange(uri, affectedRange);
}
```

### Lazy Loading

Defer expensive operations:

```typescript
async getCompletions(uri: string, position: Position) {
  // Return basic completions immediately
  const basic = this.getBasicCompletions(position);

  return {
    isIncomplete: true, // More items available
    items: basic.map(item => ({
      ...item,
      data: { uri, position } // For resolveCompletionItem
    }))
  };
}

async resolveCompletionItem(item: CompletionItem) {
  // Fetch detailed info only when user selects this item
  const details = await this.fetchCompletionDetails(item.data);
  return { ...item, ...details };
}
```

## Error Handling

### Invalid Object ID

```typescript
async getCompletions(uri: string, position: Position) {
  const [objectId] = this.parseUri(uri);

  const obj = await this.objectManager.load(objectId);
  if (!obj) {
    return {
      isIncomplete: false,
      items: [{
        label: '(Object not found)',
        kind: CompletionItemKind.Text,
        detail: `Object #${objectId} does not exist`
      }]
    };
  }

  // Continue...
}
```

### MongoDB Connection Lost

```typescript
try {
  const properties = await this.resolveProperties(objectId);
} catch (err) {
  console.error('LSP: MongoDB error', err);

  // Fall back to cached data
  return this.getCachedCompletions(objectId);
}
```

### TypeScript Parse Errors

```typescript
try {
  const completions = this.tsService.getCompletionsAtPosition(uri, offset, {});
} catch (err) {
  console.error('LSP: TypeScript error', err);

  // Return basic completions without TS help
  return this.getBasicMaliceCompletions(objectId);
}
```

## Testing

### Unit Tests

```typescript
// v2/test/devtools-lsp.test.ts
describe('Malice LSP', () => {
  it('should complete properties from current object', async () => {
    const lsp = new MaliceLSP(objectManager);

    const completions = await lsp.getCompletions(
      'malice://#3/onInput.ts',
      { line: 2, character: 5 }
    );

    expect(completions.items).toContainEqual(
      expect.objectContaining({
        label: 'welcomeMessage',
        kind: CompletionItemKind.Property
      })
    );
  });

  it('should complete properties from parent chain', async () => {
    // Object #5 inherits from #1
    const completions = await lsp.getCompletions(
      'malice://#5/test.ts',
      { line: 0, character: 5 }
    );

    // Should include properties from #5 and #1
    expect(completions.items).toContainEqual(
      expect.objectContaining({ label: 'parentProperty' })
    );
  });
});
```

### Integration Tests

```bash
# Start test server
cd v2
NODE_ENV=test bun run dev

# Run LSP test client
node devtools/examples/lsp-test-client.ts
```

## VS Code Extension Integration

```typescript
// devtools/vscode-extension/src/lsp-client.ts
import { LanguageClient } from 'vscode-languageclient/node';

export function createLSPClient(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join('out', 'lsp-server.js')
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'malice', language: 'typescript' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.malice/**')
    }
  };

  const client = new LanguageClient(
    'malice-lsp',
    'Malice Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
  return client;
}
```

## Summary

The Language Server Protocol integration provides:

✅ **Intelligent autocomplete** - Context-aware property/method suggestions
✅ **Type information** - Hover to see types and documentation
✅ **Navigation** - Go-to-definition, find-references
✅ **Real-time diagnostics** - TypeScript errors as you type
✅ **Symbol search** - Find methods/properties across all objects
✅ **Outline view** - See document structure

All powered by:
- MongoDB for object data
- TypeScript language service for type checking
- Dynamic type generation from runtime data
- Prototype chain resolution for inheritance
