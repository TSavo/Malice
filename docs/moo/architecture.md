# Architecture Overview

Malice uses a three-layer architecture that maximizes flexibility and hot-reloadability.

## The Three Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: DATABASE CONTENT (Closed Source)                  │
│  The actual world. Specific items, rooms, characters, secrets. │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: BOOTSTRAP CODE (Open Source - MOO)                │
│  Foundational prototypes. "Common knowledge."               │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: TYPESCRIPT CORE (Open Source - Minimal)           │
│  Transport, database, VM. Only what CAN'T be MOO code.      │
└─────────────────────────────────────────────────────────────┘
```

## Layer Decision Tree

| Question | Answer |
|----------|--------|
| Does it require network sockets, MongoDB, or VM? | TypeScript (reluctantly) |
| Is it foundational knowledge everyone has? | Bootstrap (MOO) |
| Is it specific world content or secrets? | Database (closed) |
| **Can it be MOO code?** | **It should be MOO code.** |

## Why This Matters

**TypeScript requires restart.** Every change to the TypeScript layer means:
- Recompiling
- Restarting the server
- Reconnecting all players
- Losing in-progress state

**MOO code is hot-reloadable.** Changes to MOO code:
- Take effect immediately
- Don't interrupt players
- Can be rolled back instantly
- Can be tested in production safely

**Therefore:** Everything that CAN be MOO code SHOULD be MOO code.

## What Goes Where

### Layer 1: TypeScript Core (Minimal)

**ONLY these things:**
- WebSocket/Telnet transport
- MongoDB connection and queries
- Object database (ObjectManager, RuntimeObject)
- Change stream subscription
- Basic VM runtime

**NOT these things:**
- Game logic (belongs in Layer 2)
- Content (belongs in Layer 3)
- Prototypes (belongs in Layer 2)
- Utilities (belongs in Layer 2)
- Calculations (belongs in Layer 2)

### Layer 2: Bootstrap Code (Foundational)

**Prototypes and systems everyone knows:**
- Room prototype with exits
- Human body prototype with metabolism
- Food/drink/clothing prototypes
- Combat system basics
- Movement mechanics
- $.english, $.format, $.pronoun utilities

**Common knowledge that's safe to share:**
- How rooms work
- How bodies work
- How metabolism works
- How combat works
- Grammar utilities
- List formatting

### Layer 3: Database Content (Secrets)

**The actual world:**
- Specific room descriptions
- Unique items and their powers
- NPC personalities and dialogue
- Quest logic and rewards
- Hidden doors and secrets
- Rare loot tables

**Things players discover in play:**
- Where things are
- What things do
- Who knows what
- How to solve puzzles
- Combinations and recipes

## Example: Food System

### Layer 1 (TypeScript)
```typescript
// NOTHING - Food doesn't need TypeScript
```

### Layer 2 (Bootstrap)
```javascript
// Food prototype - how food works in general
$.food = await $.create({
  parent: $.thing,
  properties: {
    calories: 0,
    portions: 1,
    consumedMessage: 'You eat %t.',
  },
  methods: {
    async eat(eater) {
      if (this.portions <= 0) return 'None left.';
      this.portions--;
      await eater.addCalories(this.calories);
      await room.announce(eater, null, {
        actor: this.consumedMessage,
        others: await $.pronoun.sub('%N eats %t.', eater, null, null, this),
      });
    },
  },
});
```

### Layer 3 (Database)
```javascript
// Specific food item - secret effect
const mysteryMeat = await $.create({
  parent: $.food,
  properties: {
    name: 'mystery meat',
    description: 'Smells... questionable.',
    calories: 500,
    portions: 3,
    secretIngredient: true, // Players don't know this exists
  },
  methods: {
    async eat(eater) {
      await super.eat(eater); // Standard food behavior
      
      // SECRET: Mystery meat has a special effect
      if (this.secretIngredient) {
        await eater.applyEffect('radiation', 100);
      }
    },
  },
});
```

Players can see the bootstrap code and learn "food has calories and portions."
Players CANNOT see the database and don't know mystery meat has radiation.

## Benefits

**For developers:**
- Fast iteration on game logic (MOO)
- Rare core changes (TypeScript)
- Easy experimentation (MOO)

**For players:**
- No downtime for balance changes
- Bugs can be fixed without restart
- New content appears instantly

**For the game:**
- Open source core without spoilers
- Community can contribute prototypes
- Content stays secret

## See Also

- [Core Concepts](./core-concepts.md) - Objects, properties, methods
- [Best Practices](./best-practices.md) - The Golden Rule
