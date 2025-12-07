# TypeScript Type Generation Specification

## Overview

The DevTools server dynamically generates TypeScript definition files (`.d.ts`) from the current state of MongoDB, enabling IntelliSense and type checking when editing object methods in VS Code.

## Generated Files

### Primary Output: `generated.d.ts`

**Location:** `v2/.malice/generated.d.ts` (written by VS Code extension)

This file is **auto-generated** and should never be manually edited.

```typescript
// Auto-generated from MongoDB - DO NOT EDIT
// Generated: 2025-12-05T10:30:00.000Z

/** Object #1 - Root */
interface MaliceObject_1 {
  // (empty)
}

/** Object #2 - System */
interface MaliceObject_2 {
  name: string;
  onConnection(...args: any[]): Promise<any>;
}

// ... more objects

interface ObjectManager {
  load(id: number): Promise<RuntimeObject>;
  create(data: GameObjectData): Promise<RuntimeObject>;
  // ... standard methods

  // Dynamic aliases (auto-discovered)
  readonly system: Promise<RuntimeObject>;
  readonly authManager: Promise<RuntimeObject>;
  readonly charGen: Promise<RuntimeObject>;

  [key: string]: any;
}

interface RuntimeObject {
  readonly id: number;
  readonly parent: number;
  call(method: string, ...args: any[]): Promise<any>;
  get(prop: string): any;
  set(prop: string, value: any): void;
  _getRaw(): GameObject;
  [key: string]: any;
}

interface ConnectionContext {
  send(text: string): void;
  close(): void;
  setHandler(obj: RuntimeObject): void;
  readonly connection: Connection;
  isAuthenticated(): boolean;
  getUserId(): number | null;
}

declare const self: RuntimeObject;
declare const $: ObjectManager;
declare const args: any[];
```

## Type Inference Rules

### Properties

| MongoDB Value | TypeScript Type |
|---------------|-----------------|
| `"string"` | `string` |
| `123` | `number` |
| `true` | `boolean` |
| `null` | `null` |
| `[1,2,3]` | `any[]` |
| `{a: 1}` | `Record<string, any>` |
| `undefined` | `any` |

**Examples:**

```typescript
// MongoDB:
properties: {
  name: "AuthManager",
  maxRetries: 3,
  enabled: true,
  users: [1, 2, 3],
  config: { timeout: 5000 }
}

// Generated:
interface MaliceObject_3 {
  name: string;
  maxRetries: number;
  enabled: boolean;
  users: any[];
  config: Record<string, any>;
}
```

### Methods

All methods are typed as:
```typescript
methodName(...args: any[]): Promise<any>
```

**Rationale:**
- Methods are stored as strings, no static type info
- Methods always receive `args` array
- Methods can be sync or async (we assume async for safety)

**Future Enhancement:**
Parse JSDoc comments from method code:
```typescript
// In MongoDB:
methods: {
  onInput: `
    /**
     * @param {ConnectionContext} context
     * @param {string} input
     * @returns {Promise<void>}
     */
    const context = args[0];
    const input = args[1];
    ...
  `
}

// Generated:
interface MaliceObject_3 {
  onInput(context: ConnectionContext, input: string): Promise<void>;
}
```

### Prototype Chain

Properties and methods are **NOT inherited** in the generated types. Each object interface only includes properties/methods defined directly on that object.

**Rationale:**
- Keeps types simple and readable
- Prototype resolution happens at runtime via `RuntimeObject.get()`
- `[key: string]: any` on `RuntimeObject` allows any property access

**Alternative (Future):**
Generate inheritance chains:
```typescript
interface MaliceObject_5 extends MaliceObject_1 {
  // Object #5 inherits from #1
}
```

## ObjectManager Aliases

The generator queries `ObjectManager.getAliases()` to discover registered aliases:

```typescript
// Runtime:
objectManager.registerAlias('system', systemObject);
objectManager.registerAlias('authManager', authObject);

// Generated:
interface ObjectManager {
  // ... standard methods

  readonly system: Promise<RuntimeObject>;
  readonly authManager: Promise<RuntimeObject>;

  [key: string]: any; // For dynamic aliases
}
```

**Built-in aliases:**
- `system` → Object #2
- `authManager` → Object #3
- `charGen` → Object #4

## Context-Specific Types

When editing a specific object's method, inject that object's type:

### Virtual Document Wrapping

```typescript
// User opens: malice://#3/onInput.ts

// VS Code document provider generates:
/// <reference path="../../.malice/generated.d.ts" />

// Context-specific type override
declare const self: RuntimeObject & MaliceObject_3;
declare const $: ObjectManager;
declare const args: any[];

// User's code follows:
const context = args[0];
const input = args[1];
...
```

This gives autocomplete for:
- `self.welcomeMessage` ✓ (from MaliceObject_3)
- `self.onConnect` ✓ (from MaliceObject_3)
- `$.authManager` ✓ (from ObjectManager)
- `context.send()` ✓ (from ConnectionContext)

## Regeneration Triggers

Types are regenerated when:

1. **Initial connection:** VS Code requests `types.generate`
2. **Object changed:** MongoDB change stream detects modification (automatic)
3. **Manual refresh:** User triggers "Refresh Types" command

### Change Detection via MongoDB Change Streams

The DevTools server uses **MongoDB change streams** to automatically detect when objects are modified:

```typescript
// ObjectManager watches MongoDB change stream
objectManager.setupChangeStreamWatcher();

// On any change:
db.watch() → change event
  ↓
ObjectManager.invalidate(objectId)  // Clear cache
  ↓
TypeGenerator.regenerate()  // Rebuild .d.ts
  ↓
Broadcast to all VS Code clients:
{
  "method": "types.updated",
  "params": { "definitions": "..." }
}
```

**Triggers regeneration on:**
- New object created (`insert`)
- Object properties modified (`update`)
- Object methods modified (`update`)
- Object deleted/recycled (`delete`)
- Alias registered/removed (internal event)

**Multi-server support:**
- Game server modifies object → DevTools sees change via stream
- Another DevTools instance edits → This instance sees change
- Any external MongoDB write → Detected automatically

### Debouncing

Multiple rapid changes are debounced to avoid excessive regeneration:

```typescript
// Wait 500ms after last change before regenerating
const debounce = 500;

let regenerateTimer: NodeJS.Timeout | null = null;

onChangeStreamEvent((change) => {
  if (regenerateTimer) clearTimeout(regenerateTimer);

  regenerateTimer = setTimeout(async () => {
    const types = await typeGenerator.generate();
    broadcastToClients({ method: 'types.updated', params: { definitions: types } });
  }, 500);
});
```

**Why debouncing?**
- User saves 5 methods quickly → 1 regeneration, not 5
- Batch import creates 10 objects → 1 regeneration, not 10
- Reduces CPU/network overhead

## TypeScript Configuration

VS Code workspace needs proper TypeScript config:

### `v2/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "typeRoots": [
      "./node_modules/@types",
      "./.malice"
    ]
  },
  "include": [
    "src/**/*",
    ".malice/**/*"
  ]
}
```

### `v2/.vscode/settings.json`

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "malice://**/*.ts": "typescript"
  }
}
```

## Example Flow

1. **User opens VS Code** in `v2/` workspace
2. **Extension activates**, connects to `ws://localhost:9999/devtools`
3. **Requests types:** `→ { method: "types.generate" }`
4. **Server generates** `.d.ts` from MongoDB
5. **Extension writes:** `v2/.malice/generated.d.ts`
6. **TypeScript loads** definitions
7. **User opens method:** `malice://#3/onInput.ts`
8. **Gets autocomplete:**
   - `self.` → Shows properties/methods from MaliceObject_3
   - `$.` → Shows ObjectManager aliases
   - `context.` → Shows ConnectionContext methods

Later:

9. **User updates property** via DevTools or in-game
10. **MongoDB change stream** fires
11. **Server regenerates** types (debounced)
12. **Notifies clients:** `← { method: "types.updated", params: { definitions: "..." } }`
13. **Extension updates** `generated.d.ts`
14. **TypeScript reloads** automatically
15. **Autocomplete updated!**

## Advanced Features (Future)

### 1. Property Type Annotations

Allow defining types in property metadata:

```typescript
// In MongoDB:
properties: {
  maxHp: { value: 100, type: 'number' },
  position: { value: { x: 0, y: 0 }, type: 'Point2D' }
}

// Generated:
interface MaliceObject_5 {
  maxHp: number;
  position: Point2D;
}
```

### 2. Method Signature Parsing

Parse method code to infer parameter types:

```typescript
// Detect patterns like:
const context = args[0]; // → ConnectionContext
const input = args[1];   // → string
const userId = args[2];  // → number

// Generate:
interface MaliceObject_3 {
  onInput(context: ConnectionContext, input: string, userId: number): Promise<any>;
}
```

### 3. Inherited Property Types

Generate full inheritance chain:

```typescript
interface MaliceObject_5 extends MaliceObject_1 {
  // Inherits everything from #1
  customProperty: string;
}
```

### 4. Custom Type Definitions

Users can provide a `custom-types.d.ts`:

```typescript
// v2/.malice/custom-types.d.ts
interface Point2D {
  x: number;
  y: number;
}

interface InventoryItem {
  id: number;
  quantity: number;
}
```

These are merged into generated types.

## Performance Considerations

### Caching

- Types are cached in-memory
- Only regenerate when MongoDB changes
- Debounce rapid changes (500ms)

### Size Limits

For large databases (1000+ objects):

```typescript
// Only generate types for:
- Core objects (#1-10)
- Recently modified objects (last 7 days)
- Objects with registered aliases

// Others use generic RuntimeObject type
```

### Incremental Generation

Instead of regenerating everything, update only changed objects:

```typescript
// Change stream event:
{ operationType: 'update', documentKey: { _id: 5 } }

// Only regenerate:
interface MaliceObject_5 { ... }

// Keep rest of file unchanged
```

## Testing

### Manual Testing

```bash
# Start server
cd v2
bun run dev

# Connect with client
node devtools/examples/client-example.ts

# Request types
{ "method": "types.generate", "id": 1 }

# Verify output
cat v2/.malice/generated.d.ts
```

### Automated Testing

```typescript
// v2/test/devtools-types.test.ts
describe('Type Generation', () => {
  it('should generate property types correctly', async () => {
    const obj = await manager.create({
      parent: 1,
      properties: {
        name: 'Test',
        count: 42,
        enabled: true
      },
      methods: {}
    });

    const types = await generator.generate();

    expect(types).toContain('name: string');
    expect(types).toContain('count: number');
    expect(types).toContain('enabled: boolean');
  });
});
```

## Error Handling

### Invalid TypeScript in Methods

If generated types cause TypeScript errors:

```typescript
// Method has syntax error:
methods: {
  broken: "const x = ;" // Invalid!
}

// Generator still creates type:
interface MaliceObject_5 {
  broken(...args: any[]): Promise<any>; // Generic fallback
}

// VS Code shows error when editing the method itself
// but doesn't break the whole type system
```

### Circular Dependencies

If objects reference each other:

```typescript
// Object #5 has property pointing to #6
// Object #6 has property pointing to #5

// Generated types use forward declarations:
interface MaliceObject_5 {
  other: any; // Could be MaliceObject_6, but avoid circular ref
}

interface MaliceObject_6 {
  other: any;
}
```

## Summary

The type generation system bridges the gap between **dynamic runtime** (MongoDB strings) and **static analysis** (TypeScript). It provides the best of both worlds:

- ✅ Edit code as strings in MongoDB (flexibility)
- ✅ Get IntelliSense in VS Code (developer experience)
- ✅ Catch errors before runtime (safety)
- ✅ Types stay up-to-date automatically (convenience)
