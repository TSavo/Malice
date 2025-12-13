# Consumables System

Food, drink, and digestion mechanics.

## Overview

The consumables system models eating, drinking, and digestion:

- **Edibles** decay over time (inherit from $.decayable)
- **Consumption** sends food to stomach
- **Digestion** extracts calories over time
- **Effects** can apply status effects (sedation, nausea, etc.)
- **Forensics** stomach contents visible during autopsy

**Prototype Hierarchy:**
```
$.decayable
└── $.edible           ← Base consumable
    ├── $.food         ← Solid food (eat verb)
    └── $.drink        ← Liquids (drink verb)

$.stackable
└── $.stomachContents  ← Digesting food in stomach (aggregates like stackables)
```

## $.edible - Base Consumable

Foundation for all consumable items.

### Properties

```javascript
{
  // Nutrition
  calories: 100,          // Total kcal for whole item
  hydration: 20,          // ml water equivalent

  // Consumption
  portions: 1,            // Total portions to consume
  remaining: 1,           // Portions left

  // Status
  spoiled: false,
  poisoned: false,

  // Status effects when consumed
  // { effectName: { intensity, decay } }
  effects: {},

  // Physical
  width: 5,               // cm
  height: 5,
  depth: 5,
  weight: 100,            // grams
  volume: 100,            // ml

  // Decay (inherits from $.decayable)
  decayCondition: 'harvested',
  decayRate: 0.01,        // ~7 days to fully rot
  harvested: false,

  // Storage sensitivity
  storageSensitivity: {
    refrigerated: 0.2,    // 5x longer shelf life
    frozen: 0,            // No decay
    vacuum: 0.3,
    heated: 3.0,          // 3x faster decay
    preserved: 0,         // Salt/vinegar stops decay
  },
}
```

### Decay Effects on Nutrition

Calories scale with decay level:

| Decay % | Calories | Effect |
|---------|----------|--------|
| 0% | 100% | Fresh, full nutrition |
| 25% | 50% | Starting to spoil |
| 50% | 0% | Rotten, no nutrition |
| 75% | -50% | Harmful to consume |
| 100% | -100% | Toxic |

**Formula:** `calories * (1 - decay/50)`

### Key Methods

#### getCaloriesPerPortion()
Get calories per portion, adjusted for decay.

```javascript
const cal = await food.getCaloriesPerPortion();
// 50 if 200 calories / 4 portions at 0% decay
// 0 if 50% decayed
// -50 if 100% decayed
```

#### consume(consumer, sourceType)
Consume one portion.

```javascript
const result = await food.consume(player, 'food');
// {
//   calories: 50,         // Calories consumed
//   hydration: 12,        // Hydration gained
//   effects: [...],       // Status effects applied
//   warnings: ['spoiled'],// Any warnings
//   fullyConsumed: false, // All portions eaten?
//   remaining: 3          // Portions left
// }
```

**What consume() does:**
1. Checks stomach capacity
2. Calculates calories (adjusted for decay)
3. Reduces remaining portions
4. Updates item weight
5. Sends bite to stomach
6. Applies status effects
7. Recycles item if fully consumed

#### hasRemaining()
Check if any portions left.

```javascript
if (await food.hasRemaining()) {
  // Still has portions
}
```

## $.food - Solid Food

Inherits from $.edible, provides `eat` verb.

### Properties

```javascript
{
  calories: 200,
  hydration: 50,          // Solid food has some moisture
  portions: 4,            // 4 bites to eat
  remaining: 4,

  // Flavor system
  ingredients: [
    { name: 'beef', flavor: 'savory' },
    { name: 'onion', flavor: 'sharp' },
  ],

  // Physical
  width: 8,
  height: 5,
  depth: 8,
  weight: 150,            // grams
}
```

### eat(context, eater) Method

The `eat` verb handler.

```javascript
const result = await food.eat(context, player);
// "You take a bite of a sandwich. You taste savory beef."
// or
// "You finish eating a sandwich."
```

**Behavior:**
1. Verifies player can access food (holding or in room)
2. Calls `consume()` for one portion
3. Processes spoiled/poisoned effects
4. Generates flavor message from ingredients
5. Announces to room
6. Returns narrative response

**Spoiled food effects:**
- Chance of nausea based on decay level
- Nausea reduces calories in stomach by 10-50%

**Poisoned food effects:**
- Damages torso (5-15% decay)
- 50% chance of sedation

### Verb Registration

Food auto-registers `eat` verb when:
- Picked up (arrives in player's hand)
- Dropped in room with players

```javascript
// Player can now type:
// > eat sandwich
// > eat %t
```

## $.drink - Liquids

Inherits from $.edible, provides `drink` verb.

### Properties

```javascript
{
  calories: 50,           // Some drinks have calories
  hydration: 200,         // Very hydrating
  portions: 5,            // 5 sips to drink
  remaining: 5,

  // Physical
  width: 7,
  height: 15,
  depth: 7,
  weight: 300,            // With liquid
  containerWeight: 50,    // Empty container weight

  // Slower decay than food
  decayRate: 0.005,       // ~14 days to spoil
}
```

### drink(context, drinker) Method

The `drink` verb handler.

```javascript
const result = await drink.drink(context, player);
// "You take a sip of water."
// or
// "You finish drinking water."
```

Works like `eat()` but for liquids.

### describe() Override

Shows liquid level:

```javascript
const desc = await drink.describe();
// "A bottle of water
//  It is about half full."
```

Levels: empty, almost empty, half full, mostly full, full

## $.stomachContents - Digesting Food

Inherits from: **$.stackable**

Created when food is consumed. Tracks digestion progress. Inherits stackable's merge/split capabilities for aggregation.

### Properties

```javascript
{
  // Inherited from $.stackable
  stackType: null,        // Set dynamically based on sourceProto
  quantity: 1,            // How many consumed (inherited)
  unit: 'servings',
  contraband: false,

  // Source tracking
  sourceName: 'apple',    // Original food name
  sourceProto: 123,       // Original prototype ID (aggregation key)
  sourceType: 'food',     // food, drink, pill

  // Nutrition
  calories: 100,          // Remaining calories
  caloriesOriginal: 100,  // Original calories

  // Volume (for stomach capacity)
  volume: 100,            // Current ml
  volumeOriginal: 100,    // Original ml

  // Status
  spoiled: false,
  poisoned: false,
}
```

### Aggregation (via Stackable)

StomachContents inherits from $.stackable, enabling automatic aggregation:

```javascript
// Eating 3 apples:
stomachContents = {
  sourceName: 'apple',
  calories: 300,          // 3 x 100
  caloriesOriginal: 300,
  volume: 300,
  quantity: 3,
}
```

**Aggregation rules (via canStackWith override):**
- Same `sourceProto` (prototype ID)
- Same `spoiled` state
- Same `poisoned` state

### Inherited Methods (from $.stackable)

- `merge(other)` - Combine two stomach contents (also merges calories/volume)
- `split(amount)` - Split off a portion (inherited, rarely used)
- `add(amount)` / `remove(amount)` - Adjust quantity
- `isEmpty()` - Check if fully digested

### Key Methods

#### digestTick(rate)
Extract calories during digestion.

```javascript
const result = await contents.digestTick(50);
// {
//   calories: 50,         // Calories extracted
//   volume: 50            // Volume reduced
// }
```

#### isFullyDigested()
Check if all calories extracted.

```javascript
if (await contents.isFullyDigested()) {
  // Remove from stomach
}
```

#### getDigestionPercent()
Get digestion progress.

```javascript
const percent = await contents.getDigestionPercent();
// 75 = 75% digested
```

#### describe()
For autopsy/examination.

```javascript
const desc = await contents.describe();
// "3 servings of apple (partially digested)"
// "bread (recently consumed) [spoiled]"
```

## Consumption Flow

### Eating Food

```
Player: "eat sandwich"
         ↓
food.eat(context, player)
         ↓
Verify access (holding or in room)
         ↓
food.consume(player, 'food')
         ↓
Check stomach capacity
         ↓
Calculate calories (decay-adjusted)
         ↓
Reduce remaining portions & weight
         ↓
Create/update StomachContents in stomach
         ↓
Apply status effects
         ↓
If fully consumed: recycle food item
         ↓
Return narrative response + announce to room
```

### Digestion

```
Player tick (heartbeat)
         ↓
For each StomachContents:
         ↓
contents.digestTick(digestRate)
         ↓
Extract calories → add to body
Reduce volume → free stomach space
         ↓
If fully digested: remove from stomach
```

## Status Effects

Consumables can apply status effects:

```javascript
const druggedDrink = await $.recycler.create($.drink, {
  name: 'drugged cocktail',
  effects: {
    sedation: { intensity: 30, decay: 0.5 },
    euphoria: { intensity: 10, decay: 0.3 },
  },
});

// When consumed:
// player.addEffect('sedation', 6, 0.5)  // 30/5 portions
// player.addEffect('euphoria', 2, 0.3)
```

**Common effects:**
- `sedation` - Drowsiness, slowed reactions
- `stimulation` - Alertness, faster reactions
- `euphoria` - Mood boost
- `nausea` - Stomach issues
- `pain` - Physical discomfort

## Creating Consumables

### Basic Food

```javascript
const apple = await $.recycler.create($.food, {
  name: 'an apple',
  description: 'A crisp red apple.',
  calories: 95,
  hydration: 85,          // Apples are 85% water
  portions: 4,
  remaining: 4,
  weight: 200,
  ingredients: [
    { name: 'apple', flavor: 'sweet' },
  ],
  harvested: true,        // Start decay immediately
});
```

### Alcoholic Drink

```javascript
const beer = await $.recycler.create($.drink, {
  name: 'a beer',
  description: 'A cold lager.',
  calories: 150,
  hydration: -50,         // Alcohol dehydrates!
  portions: 3,
  remaining: 3,
  weight: 450,
  containerWeight: 100,
  effects: {
    sedation: { intensity: 15, decay: 0.2 },
    euphoria: { intensity: 10, decay: 0.3 },
  },
});
```

### Poisoned Food

```javascript
const poisonedMeat = await $.recycler.create($.food, {
  name: 'suspicious meat',
  description: 'Something smells off.',
  calories: 200,
  portions: 2,
  remaining: 2,
  poisoned: true,
});
// Eating causes organ damage and possible sedation
```

## Refrigeration

Store food in refrigerated containers:

```javascript
// Create a fridge
const fridge = await $.recycler.create($.location, {
  name: 'refrigerator',
  refrigerated: true,
});

// Food inside decays at 20% normal rate
await apple.moveTo(fridge);
// apple.getStorageModifier() returns 0.2
```

## Autopsy Integration

Stomach contents visible during autopsy:

```javascript
const report = await corpse.performAutopsy(doctor, 75);
// report.stomachContents = [
//   'Partially digested bread.',
//   'Decomposed food matter.',
//   'The bread shows signs of contamination.' // if poisoned
// ]
```

## Real-World Examples

### Full Meal Cycle

```javascript
// 1. Player eats sandwich (4 portions)
> eat sandwich
"You take a bite of a sandwich. You taste savory ham."

> eat sandwich
"You take a bite of a sandwich. You taste sharp cheese."

> eat sandwich
"You take a bite of a sandwich."

> eat sandwich
"You finish eating a sandwich."

// 2. Stomach now contains:
// StomachContents { sourceName: 'sandwich', calories: 300, ... }

// 3. Over time, digestion extracts calories:
// Tick 1: 50 calories → body, 250 remain
// Tick 2: 50 calories → body, 200 remain
// ...
// Tick 6: 50 calories → body, 0 remain, contents removed
```

### Spoiled Food

```javascript
// Food at 60% decay
> eat old_bread
"You take a bite of old bread. It tastes off..."
"You feel nauseous..."

// Nausea reduces stomach calories by 10-50%
// Player lost some nutrition
```

### Stomach Capacity

```javascript
// Stomach is full (1000ml capacity)
> eat large_meal
"Your stomach is too full."

// Must wait for digestion to free space
```

## See Also

- [Decay System](./decay.md) - Food spoilage mechanics
- [Body System](./body.md) - Stomach and digestion
- [Agents](./agents.md) - Status effects system
