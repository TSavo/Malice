# Decay System

Objects that rot, decompose, and transform over time.

## Overview

The decay system models organic decomposition. Items like food, body parts, and corpses decay over time, progressing through stages until they're destroyed or transformed.

**Prototype Hierarchy:**
```
$.describable
└── $.decayable          ← Base decay mechanics
    └── $.corpse         ← Dead bodies (→ humanRemains)

$.describable
├── $.humanRemains       ← Dried remains (→ skeletalRemains)
└── $.skeletalRemains    ← Bones (permanent)
```

**Decay Timeline Example (Corpse):**
```
Death → Corpse (0%)
  ↓ ~2 months
Corpse (100%) → Human Remains (80%)
  ↓ ~6 months
Human Remains (100%) → Skeletal Remains
  ↓ never
Skeletal Remains persist indefinitely
```

## $.decayable - Base Prototype

The foundation for anything that decays over time.

### Properties

```javascript
{
  decayRate: 1,           // % decay per tick (1 tick = 1 minute)
  decayLevel: 0,          // Current decay (0-100%)
  decayCondition: null,   // When decay starts (null = always)
  decayStarted: null,     // Timestamp when decay began
  decaying: false,        // Currently decaying?

  // Storage modifiers (multipliers)
  storageSensitivity: {
    refrigerated: 0.1,    // 10% of normal rate
    frozen: 0,            // Stops decay
    vacuum: 0.2,          // 20% of normal rate
    heated: 2.0,          // 2x faster
    preserved: 0,         // Stops decay (salt, vinegar)
  },

  // Damage from storage
  storageDamage: {
    frozen: 0,            // Some items damaged by freezing
  },
}
```

### Decay Stages

| Level | Stage | Description |
|-------|-------|-------------|
| 0-25% | fresh | Recently created, no visible decay |
| 25-50% | slight | Minor decay, some effects |
| 50-75% | decayed | Significant decay, spoiled |
| 75-99% | severe | Dangerous to consume/use |
| 100% | destroyed | Fully decayed, unusable |

### Decay Conditions

The `decayCondition` property controls when decay starts:

```javascript
decayCondition: null       // Always decaying
decayCondition: 'severed'  // Body parts: decay when severed
decayCondition: 'dead'     // Corpses: decay when dead
decayCondition: 'harvested'// Food: decay after harvesting
decayCondition: 'cooked'   // Some foods decay faster when cooked
```

### Key Methods

#### shouldDecay()
Check if this object should currently be decaying.

```javascript
const isDecaying = await item.shouldDecay();
```

#### getStorageModifier()
Get the decay rate multiplier based on current container.

```javascript
const modifier = await item.getStorageModifier();
// 0.1 if in refrigerator, 0 if frozen, 1 if normal
```

#### decayTick()
Process one tick of decay. Called by scheduler/heartbeat.

```javascript
const result = await item.decayTick();
// {
//   decayed: 1.0,        // Amount decayed this tick
//   level: 45,           // Current decay level
//   stage: 'slight',     // Current stage name
//   destroyed: false     // Whether fully decayed
// }
```

#### getDecayStage()
Get the current decay stage name.

```javascript
const stage = await item.getDecayStage();
// 'fresh', 'slight', 'decayed', 'severe', or 'destroyed'
```

#### getDecayDescription()
Get a description of the decay state for examine.

```javascript
const desc = await item.getDecayDescription();
// "It looks slightly past its prime."
```

#### preserve(method)
Stop decay by preserving the item.

```javascript
await item.preserve('salt');
// item.preserved = true
// item.preservationMethod = 'salt'
```

#### receiveCalories(calories)
Heal decay damage using calories (for living tissue).

```javascript
const result = await bodyPart.receiveCalories(500);
// {
//   healed: 5,           // % decay healed
//   level: 20,           // New decay level
//   caloriesUsed: 500    // Calories consumed
// }
```

### Hooks

#### onFullyDecayed()
Called when decay reaches 100%. Override to handle destruction.

```javascript
// Default: marks as destroyed
// Corpse: transforms into $.humanRemains
// Food: could spawn flies, emit smell
```

#### onStorageDamage(amount, reason)
Called when storage is damaging the item.

```javascript
// Called when frozen organs take damage, etc.
```

## $.corpse - Dead Bodies

Created when a player dies. Contains their body and inventory.

### Properties

```javascript
{
  originalName: null,     // Dead player's name
  width: 50,              // cm
  height: 180,
  depth: 30,
  weight: 70000,          // grams (~70kg)
  contents: [],           // Body + inventory
  decayRate: 0.00116,     // ~2 months to fully decay
  decayCondition: 'always',
  searched: false,        // Has been looted?
}
```

### Decay Timeline

| Decay % | Stage | Description |
|---------|-------|-------------|
| 0-5% | Fresh | Recently dead, face recognizable |
| 5-10% | Recent | Gray pallor, clouded eyes |
| 10-20% | Rigor setting in | Features distorting |
| 20-30% | Full rigor | Waxy, mottled appearance |
| 30-40% | Early bloat | Decomposition gases, unpleasant smell |
| 40-50% | Full bloat | Swollen grotesquely, difficult smell |
| 50-60% | Active decay | Flesh discolored, sloughing off |
| 60-70% | Advanced decay | Soft tissue liquefying |
| 70-80% | Late decay | More bone than flesh |
| 80-90% | Dry remains | Bones exposed, dried sinew |
| 90-100% | Skeletal | Little more than bones |

### Key Methods

#### getBody()
Get the body object inside the corpse.

```javascript
const body = await corpse.getBody();
```

#### search(searcher)
Search the corpse for items.

```javascript
const result = await corpse.search(player);
// {
//   success: true,
//   message: 'You search the body and find:',
//   items: [
//     { id: 123, name: 'knife', location: 'hand' },
//     { id: 456, name: 'wallet', location: 'torso' }
//   ]
// }
```

#### loot(itemName, looter)
Take a specific item from the corpse.

```javascript
const result = await corpse.loot('knife', player);
// {
//   success: true,
//   message: 'You take knife from the corpse.',
//   item: <RuntimeObject>
// }
```

#### performAutopsy(examiner, skill)
Examine the corpse for cause of death.

```javascript
const report = await corpse.performAutopsy(doctor, 75);
// {
//   subject: 'John',
//   sex: 'male',
//   species: 'human',
//   overallCondition: 'The body is fresh...',
//   causeOfDeath: ['Severe malnutrition...'],
//   bodyFindings: { ... },
//   stomachContents: ['Partially digested bread.'],
//   toxicology: ['High levels of sedative compounds.'],
//   summary: 'Probable cause of death: Severe malnutrition...'
// }
```

**Autopsy reveals:**
- Sex (from anatomy examination)
- Species
- Starvation/dehydration indicators
- Trauma (wounds, broken bones)
- Stomach contents (last meal)
- Toxicology (drugs, poisons)
- Cause of death summary

**Skill affects detail level.** Higher skill + fresher corpse = more information.

### Transformation

At 100% decay, corpse transforms into `$.humanRemains`:
- Corpse shell is recycled
- Body is moved to new remains object
- Room is notified of transformation

## $.humanRemains - Dried Remains

Intermediate stage between corpse and skeleton.

### Properties

```javascript
{
  originalName: null,
  width: 50,
  height: 40,
  depth: 40,
  weight: 15000,          // ~15kg (dried out)
  decayRate: 0.000386,    // ~6 months to skeletal
  decayLevel: 0,
  contents: [],
  searched: false,
}
```

### Key Methods

Same as corpse: `getBody()`, `search()`, `loot()`, `performAutopsy()`

**Autopsy is limited:**
- Bone trauma still visible
- Soft tissue examination impossible
- Toxicology unreliable
- Missing parts noted

### Transformation

At 100% decay, transforms into `$.skeletalRemains`.

## $.skeletalRemains - Bones

Final stage. Bones persist indefinitely.

### Properties

```javascript
{
  originalName: null,
  width: 50,
  height: 30,
  depth: 50,
  weight: 10000,          // ~10kg of bones
  decayRate: 0,           // NO DECAY - permanent
  decayLevel: 100,        // Already fully decayed
  contents: [],
  searched: false,
}
```

### Key Methods

Same as corpse: `getBody()`, `search()`, `loot()`, `performAutopsy()`

**Autopsy is very limited:**
- Only bone trauma visible
- Missing bones noted
- Cause of death often undeterminable

## Storage and Preservation

### Container Storage Properties

Containers can have properties that affect decay:

```javascript
// Refrigerator
refrigerator.refrigerated = true;
// Items inside decay at 10% normal rate

// Freezer
freezer.frozen = true;
// Items inside don't decay (but some may be damaged)

// Vacuum container
vacuumBag.vacuum = true;
// Items decay at 20% normal rate

// Heated area
oven.heated = true;
// Items decay at 2x normal rate
```

### Preservation Methods

```javascript
// Salt preservation
await meat.preserve('salt');
// meat.preserved = true
// meat.preservationMethod = 'salt'
// Decay stops, slight decay reduction if < 50%
```

## Creating Decayable Objects

### Basic Decayable

```javascript
const apple = await $.recycler.create($.decayable, {
  name: 'an apple',
  description: 'A fresh red apple.',
  decayRate: 2,           // Decays 2% per tick
  decayCondition: 'harvested',
  harvested: true,        // Start decaying immediately
});
```

### Custom Decay Behavior

```javascript
// Food that transforms when decayed
apple.setMethod('onFullyDecayed', `
  // Transform into rotten apple
  self.name = 'a rotten apple';
  self.description = 'A brown, mushy apple covered in mold.';
  self.edible = false;
  self.decayRate = 0;  // Stop decaying
`);
```

## Scheduler Integration

Decay is processed by the game's tick system:

```javascript
// In scheduler or heartbeat
for (const obj of decayingObjects) {
  const result = await obj.decayTick();
  if (result.destroyed) {
    // Handle destruction/transformation
  }
}
```

## Real-World Examples

### Corpse Lifecycle

```
Player dies
  ↓
$.corpse created with player's body + inventory
  ↓ 0-10 days
Still identifiable, can determine cause of death
  ↓ 10-30 days
Bloating, identity obscured, smell attracts attention
  ↓ 30-60 days
Advanced decay, limited autopsy possible
  ↓ ~60 days
Transforms to $.humanRemains
  ↓ ~6 months
Transforms to $.skeletalRemains
  ↓ forever
Bones remain as grim landmark
```

### Food Decay

```javascript
const bread = await $.recycler.create($.food, {
  name: 'a loaf of bread',
  decayRate: 0.5,         // Slower than produce
  decayCondition: null,   // Always decaying
});

// After 50 ticks (decay 25%):
// "The bread is slightly stale."

// After 100 ticks (decay 50%):
// "The bread is moldy and hard."

// After 200 ticks (decay 100%):
// Bread is destroyed or becomes inedible
```

### Refrigeration

```javascript
// Put food in fridge
await bread.moveTo(refrigerator);

// Decay rate becomes 0.5 * 0.1 = 0.05% per tick
// Bread lasts 10x longer
```

## See Also

- [Body System](./body.md) - Body parts that can decay
- [Consumables](./consumables.md) - Food and drink decay
- [Recycler](../utilities/recycler.md) - Object lifecycle management
