# TypeScript Prototypes (Option B) — Implementation Plan

This document describes a concrete plan to add **TypeScript-authored prototype definitions** that compile into Malice prototype objects (properties + methods stored as TS strings).

Scope/constraints (as agreed):

- Scope: **prototype hierarchy only** (not core system singletons, not world/buildings).
- Normal boot: **do not overwrite runtime edits** (at most fill missing defaults).
- Force bootstrap (`forceBootstrap: true` / `FORCE_BOOTSTRAP=true`): disk is **source of truth** for spec-defined methods/properties, overwriting existing values.
- Authoring convention: prototype methods are authored as `async` and use a fixed parameter prefix that maps to Malice implicit globals.

---

## 1. Authoring format (Option B)

Each prototype is authored as a decorated class.

### File layout

- Add a new tree for authored prototypes:
  - `src/database/prototypes-ts/**/*.ts`

### Decorator

- Implement a decorator:

```ts
@prototype({ alias: 'describable', parent: 'root' })
export class Describable { ... }
```

Where:

- `alias`: string; the key stored in `#0.properties.aliases` (`$describable`).
- `parent`: string; alias of the parent prototype (`root`, `describable`, etc.).

### Defaults

`static defaults` provides default prototype properties.

Constraints for v1:

- `static defaults` MUST be an **object literal**.
- Values MUST be JSON-ish (null/string/number/boolean/array/object). No functions/classes/dates.

Example:

```ts
static defaults = {
  name: 'Describable',
  description: 'Base prototype',
  aliases: [] as string[],
  location: null,
  contents: [],
};
```

### Methods

Prototype methods are normal TS method declarations.

Convention for parameters (v1):

- Methods MUST be declared `async`.
- First parameters MUST be exactly:
  - `self`, `$`, `pass`
- Remaining parameters map to Malice `args`.

Example:

```ts
async moveTo(self: any, $: any, pass: any, dest: any, mover?: any) {
  if (typeof dest === 'number') dest = await $.load(dest);
  ...
}
```

In Malice runtime, `self`, `$`, and `pass` are already injected as implicit globals. We keep them as params in TS for readability/types, and compile them away.

---

## 2. Compiler output / intermediate spec

Define a normalized in-memory spec matching Malice storage semantics:

```ts
export type CompiledPrototypeSpec = {
  alias: string;
  parentAlias: string;
  properties: Record<string, unknown>; // validated JSON-ish values
  methods: Record<
    string,
    {
      code: string; // stored TS snippet executed by RuntimeObjectImpl
      callable?: boolean;
      aliases?: string[];
      help?: string;
    }
  >;
};
```

Notes:

- `code` will be a top-level TS snippet. It does NOT need an async wrapper;
  runtime already executes every method in an async IIFE (`src/database/runtime-object.ts`).
- `methods` can be extended later for metadata.

---

## 3. Extraction strategy (TypeScript Compiler API)

We already depend on `typescript` (`package.json`) and use it in runtime execution and LSP.

### Module

Add a new extractor/compiler module:

- `src/database/bootstrap/prototype-ts/extract.ts`

Responsibilities:

1. Enumerate files in `src/database/prototypes-ts/`.
2. Parse each file into a `ts.SourceFile`.
3. Locate decorated exported class declarations.
4. Extract:
   - decorator args → `alias`, `parentAlias`
   - `static defaults` object literal → properties
   - method declarations → emitted method code strings

### AST nodes to read

- `ts.ClassDeclaration` with `decorators`
- Decorator call: `@prototype({ ... })`
- Static property: `static defaults = { ... }`
- `ts.MethodDeclaration`

### Emitting method code

For each method `M(self, $, pass, a, b, c)`:

1. Verify required prefix params exist with exact names (`self`, `$`, `pass`).
2. Bind remaining parameters from `args[i]`.

Emission template:

```ts
let a = args[0];
let b = args[1];
let c = args[2];

// method body statements copied here
...
```

Implementation notes:

- Use `ts.Printer` to print the method body statements (stable and avoids string slicing pitfalls).
- Use `let` for mapped args by default (safe with reassignment).
- The compiler fails fast if:
  - method is missing required prefix params
  - `static defaults` is not an object literal
  - decorator arg shape is not a literal object

---

## 4. Applying compiled specs to the running DB

Add an applier module:

- `src/database/bootstrap/prototype-ts/apply.ts`

Inputs:

- `ObjectManager`
- `CompiledPrototypeSpec[]`
- mode: `{'force': boolean}`

Apply logic per spec:

1. Resolve `alias` and `parentAlias` to object IDs using `#0.properties.aliases`.
2. Ensure prototype object exists:
   - if missing, create it with `parentId` and `properties` and empty methods
   - then register alias via `#0.addAlias(alias, id)`
3. Apply properties:
   - **force=false**: set ONLY properties that are currently `undefined`
   - **force=true**: overwrite only keys present in `spec.properties`
4. Apply methods:
   - **force=false**: do nothing (preserve runtime edits)
   - **force=true**: overwrite methods defined in `spec.methods`

We intentionally avoid deleting extra properties/methods during v1.

---

## 5. Wiring into bootstrap

### FORCE_BOOTSTRAP path

`GameBootstrap` currently calls `PrototypeBuilder.rebuildMethods()` on force bootstrap:

- `src/database/game-bootstrap.ts`

Change prototype rebuild logic to:

- compile TS specs
- apply specs with `force=true`

Keep core system rebuild behavior unchanged.

### Normal world build path

On first-run (no world), `PrototypeBuilder.buildPrototypes()` currently creates prototypes via many builder classes.

Migration plan:

- v1: keep current builders as the source of truth.
- v2: after TS spec pipeline works, allow replacing parts of prototype creation with specs.

---

## 6. Namespaced aliases (bodyParts)

Current bootstrap stores:

- `aliases.bodyParts = { torso: id, ... }`
- plus top-level aliases for each part (`aliases.torso = id`, etc.)

Plan:

- Keep this behavior in the TS-spec era.
- Implement via either:
  - a dedicated spec type for grouped aliases, OR
  - a convention where certain prototypes declare `namespace: 'bodyParts'`.

Not required for v1 unless we migrate body-part prototypes first.

---

## 7. Tests

Add tests under `test/bootstrap/`:

1. Extractor unit test:
   - provide a small fixture prototype TS file
   - assert `CompiledPrototypeSpec` has correct alias/parent/properties and generated method code contains mapped args.

2. Force apply integration test:
   - bootstrap minimal world
   - create a prototype, override a method via runtime
   - run apply(force=true)
   - assert method code reverted.

3. Non-force preservation test:
   - override method at runtime
   - run apply(force=false)
   - assert method unchanged.

---

## 8. Deliverables checklist

v1 implementation should include:

- `src/database/prototypes-ts/` example prototype(s)
- `src/database/bootstrap/prototype-ts/`:
  - extractor
  - applier
  - minimal validation/errors
- `GameBootstrap` integration for `forceBootstrap`
- tests for extraction + apply

---

## Appendix: Why method code can be uniform

Even "sync" methods execute in an async wrapper.

`RuntimeObjectImpl.executeMethod()` runs stored `code` inside an async IIFE and awaits it.

Therefore the compiler can emit the same shape of code for all authored methods; the only requirement is to `return` values when needed.
