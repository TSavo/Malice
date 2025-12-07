# TypeScript Quick Start Guide

## Your 3 Questions Answered

### 1. How does TypeScript work in this system?

**Short answer:** Methods are stored as JavaScript strings in MongoDB. When you edit them in VS Code, the extension injects type references at the top, giving you IntelliSense. TypeScript is **only for development** - at runtime, it's still plain JavaScript.

**The Flow:**

```
1. MongoDB stores:        { methods: { onCreate: "console.log('hi')" } }
                                                    ↓
2. VS Code opens:         malice://objects/5/onCreate.ts
                                                    ↓
3. Extension injects:     /// <reference path="../.malice/malice.d.ts" />
                          console.log('hi')
                                                    ↓
4. TypeScript reads:      .malice/malice.d.ts (auto-generated from MongoDB)
                          .malice/types/*.d.ts (your custom types)
                                                    ↓
5. You get IntelliSense:  self.█ ← shows all RuntimeObject methods
                          $.system.█ ← shows all system methods
                                                    ↓
6. On save:               Extension strips type reference
                                                    ↓
7. MongoDB saves:         { methods: { onCreate: "console.log('hi')" } }
                                                    ↓
8. On execute:            vm.run(methodCode, { self, $, args })
```

### 2. Where do I put types so they can be reused?

**Put them in `.malice/types/*.d.ts`**

```
.malice/
├── malice.d.ts          ← AUTO-GENERATED (don't edit!)
└── types/
    ├── game.d.ts        ← Your custom game types
    ├── system.d.ts      ← System object interfaces
    └── quests.d.ts      ← More custom types (you create these)
```

**Example: Create `.malice/types/game.d.ts`**

```typescript
// Define your types once
export interface PlayerStats {
  health: number;
  maxHealth: number;
  strength: number;
}

export interface PlayerObject extends RuntimeObject {
  stats: PlayerStats;
  name: string;
}
```

**Use in ANY method:**

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />

const player = self as PlayerObject;
player.stats.health -= 10; // ← IntelliSense knows .stats exists!
```

### 3. How do I include outside code?

**You can't use npm packages or `import` directly**, but you have 3 options:

#### Option 1: System Objects (RECOMMENDED ✅)

**Put reusable code on a "system" object** that all methods can call.

**Step 1:** Create Object #2 (system object)
**Step 2:** Add a method called `parseCommand`:

```typescript
// Object #2, method: parseCommand
const input = args[0] as string;
const words = input.toLowerCase().split(' ');

return {
  verb: words[0],
  target: words[1],
  rest: words.slice(2).join(' ')
};
```

**Step 3:** Define its types in `.malice/types/system.d.ts`:

```typescript
export interface SystemObject extends RuntimeObject {
  parseCommand(input: string): Promise<{ verb: string; target?: string; rest?: string }>;
}

// Make it available globally
declare global {
  interface ObjectManager {
    readonly system: SystemObject;
  }
}
```

**Step 4:** Register the alias (one-time setup):

```typescript
// Run this once in the bootstrap
await objectManager.registerAlias('system', systemObject);
```

**Step 5:** Use from ANY method:

```typescript
/// <reference path="../.malice/types/system.d.ts" />

const cmd = await $.system.parseCommand(args[0] as string);

if (cmd.verb === 'attack') {
  // ...
}
```

#### Option 2: Prototype Chain (Inheritance)

```
Object #1 (Root)
    ↓
Object #100 (BasePlayer)  ← has methods: attack(), defend()
    ↓
Object #101 (Warrior)     ← inherits attack(), defend()
    ↓                        adds: powerAttack(), rage()
Object #5 (Your Character) ← inherits ALL parent methods
```

**Type it:**

```typescript
// .malice/types/player-classes.d.ts
export interface BasePlayerObject extends RuntimeObject {
  attack(target: RuntimeObject): Promise<number>;
  defend(): Promise<void>;
}

export interface WarriorObject extends BasePlayerObject {
  powerAttack(target: RuntimeObject): Promise<number>;
  rage(): Promise<void>;
}
```

#### Option 3: External Libraries (NOT CURRENTLY SUPPORTED ❌)

You **cannot** do this yet:

```typescript
import lodash from 'lodash'; // ❌ Won't work
const _ = require('lodash'); // ❌ Won't work
```

**Workaround:** Bundle utilities into your system object:

```typescript
// Object #2, method: chunk
const array = args[0] as any[];
const size = args[1] as number;
const chunks = [];

for (let i = 0; i < array.length; i += size) {
  chunks.push(array.slice(i, i + size));
}

return chunks;
```

```typescript
// Use it:
const chunks = await $.system.chunk([1, 2, 3, 4, 5, 6], 2);
// Returns: [[1, 2], [3, 4], [5, 6]]
```

## Complete Example

### Setup (One-Time)

**1. Create `.malice/types/game.d.ts`:**

```typescript
export interface PlayerStats {
  health: number;
  maxHealth: number;
}

export interface PlayerObject extends RuntimeObject {
  stats: PlayerStats;
  location: number;
}
```

**2. Create `.malice/types/system.d.ts`:**

```typescript
export interface SystemObject extends RuntimeObject {
  sendMessage(playerId: number, msg: string): Promise<void>;
  rollDice(sides: number): Promise<number>;
}

declare global {
  interface ObjectManager {
    readonly system: SystemObject;
  }
}
```

**3. Create Object #2 (System) with methods:**

```typescript
// Method: sendMessage
const playerId = args[0] as number;
const message = args[1] as string;

const player = await $.load(playerId);
// TODO: Actually send the message via connection
console.log(`To ${playerId}: ${message}`);
```

```typescript
// Method: rollDice
const sides = args[0] as number;
return Math.floor(Math.random() * sides) + 1;
```

**4. Register alias (bootstrap):**

```typescript
await objectManager.registerAlias('system', await objectManager.load(2));
```

### Use (In Any Method)

**Object #5, method: onCreate:**

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />
/// <reference path="../.malice/types/system.d.ts" />

// Cast self to our custom type
const player = self as PlayerObject;

// Initialize with IntelliSense
player.stats = {
  health: 100,
  maxHealth: 100
};

player.location = 1;

// Use system utilities
const startingGold = await $.system.rollDice(100);
await $.system.sendMessage(player.id, `You start with ${startingGold} gold!`);

// Save
await player.save();
```

## Common Patterns

### Pattern 1: Type-Safe Properties

```typescript
/// <reference path="../.malice/types/game.d.ts" />

const player = self as PlayerObject;

// TypeScript prevents typos:
player.stats.heath = 50; // ❌ ERROR: Did you mean 'health'?
player.stats.health = 50; // ✅ OK
```

### Pattern 2: Reusable Utilities

```typescript
// Put on system object:
// Object #2, method: formatTime
const timestamp = args[0] as number;
const date = new Date(timestamp);
return date.toLocaleString();
```

```typescript
// Use anywhere:
const timeStr = await $.system.formatTime(Date.now());
```

### Pattern 3: Prototype Methods

```typescript
// Object #100 (BasePlayer), method: heal
const player = self as PlayerObject;
player.stats.health = Math.min(
  player.stats.health + 20,
  player.stats.maxHealth
);
await player.save();
```

```typescript
// Object #5 (inherits from #100)
// Can call inherited method:
await self.call('heal');
```

## Key Takeaways

✅ **DO:**
- Put reusable types in `.malice/types/*.d.ts`
- Use system objects for shared code
- Reference types with `/// <reference path="..." />`
- Cast `self` to your custom object types

❌ **DON'T:**
- Edit `.malice/malice.d.ts` (auto-generated)
- Copy/paste code between methods
- Use `import` or `require` (not supported)
- Forget to add triple-slash references

## Files I Created For You

I've created these example files you can use:

```
v2/
├── docs/
│   ├── typescript-guide.md        ← Full detailed guide
│   └── QUICK-START-TYPES.md       ← This file
└── .malice/
    ├── types/
    │   ├── game.d.ts              ← Game types (PlayerStats, Items, etc.)
    │   ├── system.d.ts            ← System object interfaces
    │   └── README.md              ← Quick reference
    └── examples/
        ├── example-onCreate-method.ts    ← Full player creation example
        └── example-system-method.ts      ← How to create utilities
```

**Next Steps:**
1. Read `.malice/types/README.md`
2. Look at `.malice/examples/example-onCreate-method.ts`
3. Create Object #2 and add utility methods
4. Register it as `$.system`
5. Start using types in your methods!

## Questions?

- Read the full guide: `v2/docs/typescript-guide.md`
- Check examples: `v2/.malice/examples/`
- Look at the type definitions: `v2/.malice/types/`
