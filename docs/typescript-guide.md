# TypeScript in Malice MOO - Developer Guide

## Architecture Overview

Malice uses a hybrid approach to TypeScript:
- **Runtime**: Methods execute as plain JavaScript strings via VM
- **Development**: TypeScript provides IntelliSense and type checking in VS Code
- **Types**: Auto-generated from MongoDB state + custom user types

## Type System Components

### 1. Auto-Generated Types (`.malice/malice.d.ts`)

**Generated automatically** from MongoDB by the TypeGenerator. **DO NOT edit manually**.

```typescript
// Auto-generated when objects are created/modified
interface MaliceObject_5 {
  name: string;
  health: number;
  onCreate(...args: any[]): Promise<any>;
}

declare const self: RuntimeObject;
declare const $: ObjectManager;
declare const args: any[];
```

**Regenerated when:**
- Objects are created or deleted
- Methods are added, changed, or deleted
- Properties are added, changed, or deleted
- Any change detected via MongoDB change streams

### 2. Custom Shared Types (`.malice/types/`)

**Create your own types** that can be reused across all methods.

**Example: Create `.malice/types/game.d.ts`**

```typescript
/**
 * Custom game types
 * These are shared across all MOO methods
 */

/** Player statistics */
interface PlayerStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  charisma: number;
}

/** Combat result */
interface CombatResult {
  damage: number;
  criticalHit: boolean;
  message: string;
}

/** Room exit directions */
type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

/** Inventory item */
interface Item {
  id: number;
  name: string;
  weight: number;
  value: number;
  description: string;
}

/** Enhanced RuntimeObject with game-specific properties */
interface GameRuntimeObject extends RuntimeObject {
  // Type-safe property access
  name: string;
  location: number;
  inventory: number[];
  stats?: PlayerStats;
}
```

**Update jsconfig.json to include your types:**

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "checkJs": true,
    "allowJs": true
  },
  "include": [
    ".malice/**/*"
  ],
  "exclude": ["node_modules"]
}
```

**Use in methods:**

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />

// Now you can use your custom types!
const player = self as GameRuntimeObject;
const stats: PlayerStats = player.stats || {
  strength: 10,
  dexterity: 10,
  intelligence: 10,
  charisma: 10
};

const result: CombatResult = {
  damage: stats.strength * 2,
  criticalHit: Math.random() > 0.9,
  message: 'You strike the enemy!'
};
```

### 3. Method-Specific Types (Inline)

For types only used in one method, define them inline:

```typescript
/// <reference path="../.malice/malice.d.ts" />

// Method-specific interface
interface ParsedCommand {
  verb: string;
  directObject?: string;
  preposition?: string;
  indirectObject?: string;
}

function parseCommand(input: string): ParsedCommand {
  const parts = input.split(' ');
  return {
    verb: parts[0],
    directObject: parts[1],
    // ...
  };
}

const cmd = parseCommand(args[0] as string);
```

## Including External Code

### Option 1: Shared Utility Methods on a System Object

**Best practice for code reuse**

```javascript
// Create object #2 as "System" object
// Add method: parseCommand

// In object #5's method:
const parsed = await $.system.call('parseCommand', input);
```

**With types:**

```typescript
// .malice/types/system.d.ts
interface SystemObject extends RuntimeObject {
  parseCommand(input: string): Promise<ParsedCommand>;
  rollDice(sides: number, count: number): Promise<number>;
  formatTime(timestamp: number): Promise<string>;
}

// Update ObjectManager in your types:
interface ObjectManager {
  // ... existing properties
  readonly system: SystemObject;
}
```

```typescript
// Now in any method:
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/system.d.ts" />

const result = await $.system.parseCommand(args[0] as string);
// TypeScript knows the return type!
```

### Option 2: Prototype Chain (Object Inheritance)

```javascript
// Object #3: BaseMob (parent: 1)
// Methods: attack(), defend(), takeDamage()

// Object #10: Goblin (parent: 3)
// Inherits all BaseMob methods
```

**Type it:**

```typescript
// .malice/types/mobs.d.ts
interface BaseMob extends RuntimeObject {
  attack(target: RuntimeObject): Promise<CombatResult>;
  defend(): Promise<number>;
  takeDamage(amount: number): Promise<void>;
}

interface Goblin extends BaseMob {
  // Goblin-specific methods
  sneakAttack(target: RuntimeObject): Promise<CombatResult>;
}
```

#### Using `pass()` for Method Overrides (MOO-style super)

When you override a parent's method but still want to call the parent's implementation, use `pass()`. This is Malice's equivalent of `super()` in traditional OOP.

**Basic usage:**

```typescript
// Parent object #3 (BaseMob) has:
// attack method: return self.strength * 2;

// Child object #10 (Goblin) overrides attack:
const parentDamage = await pass();  // Calls BaseMob.attack()
const sneakBonus = Math.random() > 0.7 ? 10 : 0;
return parentDamage + sneakBonus;
```

**Key behaviors:**

1. **`pass()` with no arguments** - Uses the original `args` passed to the current method
2. **`pass(arg1, arg2, ...)`** - Passes custom arguments to the parent method
3. **`self` binding preserved** - In the parent method, `self` still refers to the child instance
4. **Works through inheritance chains** - Each `pass()` finds the next parent up the chain

**Example: Deep inheritance chain**

```typescript
// Grandparent (#1 Root)
// method: describe
return "A thing";

// Parent (#3 BaseMob, parent: 1)
// method: describe (overrides Root)
const base = await pass();  // Gets "A thing"
return base + " that moves";

// Child (#10 Goblin, parent: 3)
// method: describe (overrides BaseMob)
const base = await pass();  // Gets "A thing that moves"
return base + " and attacks";

// Result of goblin.describe(): "A thing that moves and attacks"
```

**Important:** `pass()` searches from where the method is *defined*, not where it's *called on*. This means if a Goblin instance calls an inherited method from BaseMob that uses `pass()`, it correctly calls Root's method (BaseMob's parent), not Goblin's parent.

**Error handling:**

```typescript
// If there's no parent method, pass() throws:
try {
  await pass();
} catch (e) {
  // "pass(): No parent implementation of 'methodName' found"
}
```

### Option 3: Copy/Paste Utility Functions (Not Recommended)

```typescript
// If you must... but this defeats the purpose of a MOO
function utilityFunction() {
  // ... copied into every method that needs it
}
```

**Don't do this.** Use system objects instead.

### Option 4: External NPM Packages (Future Enhancement)

**Not currently supported**, but could be added:

```typescript
// Hypothetical future API:
const lodash = await $.system.require('lodash');
const result = lodash.chunk([1, 2, 3, 4], 2);
```

## Practical Examples

### Example 1: Player Object with Stats

**.malice/types/player.d.ts**
```typescript
interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
}

interface PlayerObject extends RuntimeObject {
  stats: PlayerStats;
  name: string;
  location: number;
}
```

**Object #5 onCreate method:**
```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/player.d.ts" />

const player = self as PlayerObject;

player.stats = {
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  level: 1,
  experience: 0
};

await player.save();
```

### Example 2: Command Parser System

**Create System Object (#2) with parseCommand method:**

```typescript
// Object #2, method: parseCommand
const input = args[0] as string;
const parts = input.toLowerCase().split(' ');

return {
  verb: parts[0],
  target: parts[1],
  rest: parts.slice(2).join(' ')
};
```

**.malice/types/commands.d.ts**
```typescript
interface ParsedCommand {
  verb: string;
  target?: string;
  rest?: string;
}

interface SystemObject extends RuntimeObject {
  parseCommand(input: string): Promise<ParsedCommand>;
}

// Extend ObjectManager to include system
declare module '.malice/malice' {
  interface ObjectManager {
    readonly system: SystemObject;
  }
}
```

**Use in any method:**
```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/commands.d.ts" />

const cmd = await $.system.parseCommand(args[0] as string);

if (cmd.verb === 'look') {
  const target = cmd.target
    ? await $.load(parseInt(cmd.target))
    : await $.load(self.location);

  // ...
}
```

### Example 3: Type-Safe Database Queries

**.malice/types/database.d.ts**
```typescript
interface QueryResult<T> {
  results: T[];
  count: number;
}

interface PlayerRecord {
  _id: number;
  name: string;
  level: number;
  lastLogin: Date;
}

interface DatabaseObject extends RuntimeObject {
  query<T>(collection: string, filter: any): Promise<QueryResult<T>>;
  findPlayers(minLevel: number): Promise<QueryResult<PlayerRecord>>;
}
```

## Type Reference Priority

When TypeScript resolves types, it follows this order:

1. **Inline types** in the method itself
2. **Custom types** from `.malice/types/*.d.ts`
3. **Auto-generated types** from `.malice/malice.d.ts`
4. **Built-in types** from TypeScript standard library

## Best Practices

### ✅ DO:
- Create shared types in `.malice/types/` for game concepts
- Use system objects for reusable code
- Type your custom properties and methods
- Use `as` to cast `RuntimeObject` to specific types
- Keep type files organized by domain (combat.d.ts, inventory.d.ts, etc.)

### ❌ DON'T:
- Edit `.malice/malice.d.ts` (it's auto-generated)
- Copy/paste utility functions across methods
- Use `any` everywhere (defeats the purpose)
- Store executable code in properties (use methods)

## Troubleshooting

### Types not showing up in IntelliSense?

1. **Check jsconfig.json includes .malice/**
2. **Reload VS Code window** (Cmd/Ctrl + Shift + P → "Reload Window")
3. **Verify file is in `.malice/` directory**
4. **Check for syntax errors** in your .d.ts files

### "Cannot find name 'X'" error?

Add the appropriate triple-slash reference:
```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/your-types.d.ts" />
```

### Auto-generated types outdated?

- **Wait 500ms** after making changes (debounce delay)
- **Check DevTools server** is running and connected
- **Manually regenerate**: Modify any property to trigger update

## Limitations

### Current Limitations:

1. **No real module system**: Methods can't `import` or `require`
2. **No NPM packages**: Can't use external libraries directly
3. **Runtime is still JavaScript**: Types are only for development
4. **No build step**: Code runs as-is, no transpilation

### Workarounds:

1. **Use system objects** for shared code
2. **Bundle utilities** into a single system method
3. **Type cast carefully** to maintain type safety
4. **Plan for future enhancements** (module system coming?)

## Future Enhancements

Possible improvements to the type system:

1. **Module system**: `const utils = await import('malice://libs/utils')`
2. **NPM integration**: `const _ = await require('lodash')`
3. **Build step**: Transpile TypeScript methods before storage
4. **Type checking**: Server-side validation of types
5. **Shared libraries**: Version-controlled code modules
6. **IDE integration**: Better debugging and breakpoints

---

**Questions?** Check the main Malice documentation.
