# Custom Type Definitions

This directory contains your custom TypeScript type definitions that are shared across all MOO methods.

## Quick Start

### 1. Use types in your methods:

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />
/// <reference path="../.malice/types/system.d.ts" />

// Now you have full IntelliSense!
const player = self as PlayerObject;
player.stats.health -= 10;

await $.system.sendToPlayer(player.id, 'You take 10 damage!');
```

### 2. Files in this directory:

- **game.d.ts** - Core game types (PlayerStats, Items, Rooms, Characters)
- **system.d.ts** - System object interfaces (utilities, auth, combat)
- **README.md** - This file

### 3. Adding your own types:

Create a new `.d.ts` file in this directory:

```typescript
// .malice/types/quests.d.ts
export interface Quest {
  id: number;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
}

export interface QuestObjective {
  type: 'kill' | 'collect' | 'talk' | 'explore';
  target: string;
  count: number;
  current: number;
}
```

Then reference it in your methods:

```typescript
/// <reference path="../.malice/types/quests.d.ts" />

const quest: Quest = {
  id: 1,
  title: 'Slay the Dragon',
  // ... IntelliSense will help!
};
```

## Type System Architecture

```
┌─────────────────────────────────────────────┐
│ MongoDB                                      │
│ ┌─────────────────────────────────────────┐ │
│ │ Object #5                                │ │
│ │ methods: { onCreate: "console.log()" }  │ │
│ └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ DevTools Server                              │
│ TypeGenerator.generate()                     │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ .malice/malice.d.ts (AUTO-GENERATED)        │
│ ┌─────────────────────────────────────────┐ │
│ │ interface MaliceObject_5 { ... }        │ │
│ │ declare const self: RuntimeObject;      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ .malice/types/*.d.ts (YOUR CUSTOM TYPES)    │
│ ┌─────────────────────────────────────────┐ │
│ │ interface PlayerStats { ... }           │ │
│ │ interface SystemObject { ... }          │ │
│ └─────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ VS Code (malice://objects/5/onCreate.ts)    │
│ ┌─────────────────────────────────────────┐ │
│ │ /// <reference path="..." />            │ │
│ │ const player = self as PlayerObject;    │ │
│ │         ▲                                │ │
│ │         └─ IntelliSense from .d.ts      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Type Resolution Order

When you type `self.` in a method, TypeScript looks for types in this order:

1. **Inline types** (defined in the method itself)
2. **Custom types** (from `.malice/types/*.d.ts`)
3. **Auto-generated types** (from `.malice/malice.d.ts`)
4. **Built-in types** (from TypeScript standard library)

## Examples

### Example 1: Type-safe player object

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/game.d.ts" />

const player = self as PlayerObject;

// TypeScript knows player.stats exists and has these properties:
player.stats.health -= 10;
player.stats.mana += 5;

if (player.stats.health <= 0) {
  await $.system.sendToPlayer(player.id, 'You have died!');
}
```

### Example 2: Using system utilities

```typescript
/// <reference path="../.malice/malice.d.ts" />
/// <reference path="../.malice/types/system.d.ts" />

// Parse user command
const cmd = await $.system.parseCommand(args[0] as string);

if (cmd.verb === 'attack') {
  const damage = await $.system.rollDice(6, 2); // 2d6
  await $.combat.applyDamage(parseInt(cmd.directObject!), damage, 'player');
}
```

### Example 3: Creating reusable code

**Option A: Put it on a system object (RECOMMENDED)**

```typescript
// Object #2 (system), method: validateEmail
const email = args[0] as string;
const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
return regex.test(email);
```

```typescript
// Then use from any method:
const isValid = await $.system.validateEmail(playerEmail);
```

**Option B: Use prototype chain**

```typescript
// Object #100: BasePlayer (parent: 1)
// All player objects inherit from #100

// Object #101: Warrior (parent: 100)
// Inherits all BasePlayer methods
```

## Important Notes

1. **DO NOT** edit `.malice/malice.d.ts` - it's auto-generated
2. **DO** create custom types in `.malice/types/`
3. **DO** use triple-slash references at the top of methods
4. **DO** use system objects for shared code
5. **DON'T** copy/paste utility functions across methods
6. **DON'T** use `any` everywhere - defeats the purpose!

## Need Help?

- Read the full guide: `v2/docs/typescript-guide.md`
- Check examples in this directory
- Check GitHub for issues/discussions
