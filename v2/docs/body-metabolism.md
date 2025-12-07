# Body Metabolism System

This document describes the calorie, damage, and fitness systems for embodied agents.

## Core Properties

Each body part has three key properties:

| Property | Description | Changed By |
|----------|-------------|------------|
| `maxCalories` | Muscle mass / trained capacity | Fitness XP (+), Starvation (-) |
| `calories` | Current energy stored | Activity (-), Eating (+) |
| `decayLevel` | Injury/damage (0-100%) | Wounds (+), Metabolism/Healing (-) |

### Effective Capacity

The effective capacity of a body part is:

```
effectiveCapacity = maxCalories - decayLevel
```

**All stats derive from effective capacity.** There are no separate strength/dexterity
properties - everything is calorie-based:

| Stat | Derived From |
|------|--------------|
| Strength | Torso + Arms + Legs effective capacity |
| Dexterity | Hands + Feet effective capacity (× fat modifier) |
| Intelligence | Head effective capacity |
| Perception | Eyes + Ears effective capacity |
| Speed | Legs effective capacity (× fat modifier × 2) |

This means:
- Training (fitness XP) → higher `maxCalories` → stronger stats
- Starvation → lower `maxCalories` → weaker stats
- Injury → higher `decayLevel` → weaker stats
- Healing → lower `decayLevel` → restored stats

## Energy Flow

### Normal Activity

```
Activity burns calories
         ↓
    [calories] decreases
         ↓
    Eating replenishes
         ↓
    [calories] increases (capped by maxCalories)
         ↓
    Excess stored as fat
```

### Starvation Cascade

When calories are needed but unavailable:

```
1. Burn from body part calories
         ↓ (if depleted)
2. Burn from torso calories
         ↓ (if depleted)
3. Burn fat (1 fat = 100 calories)
         ↓ (if depleted)
4. Consume muscle tissue:
   - maxCalories DECREASES (permanent atrophy)
   - Some calories restored (eating yourself)
         ↓ (if total body decay ≥ 50%)
5. Death by starvation
```

### Recovery

| What's Lost | How to Recover |
|-------------|----------------|
| `calories` | Eat food |
| `fat` | Eat excess food |
| `decayLevel` (injury) | Metabolism heals over time |
| `maxCalories` (muscle) | Fitness XP (training) |

## Fitness System

### XP Accumulation

- 1 XP per 3 hours of playtime
- Maximum 3 XP per day (9 hours played)
- XP accumulates in a pool to spend

### XP Cost Curve

Each body part has a "level" based on its maxCalories:

```
level = (maxCalories - 90) / 10
```

| maxCalories | Level | XP to Next Level |
|-------------|-------|------------------|
| 100 | 1 | 1 XP |
| 110 | 2 | 3 XP |
| 120 | 3 | 5 XP |
| 130 | 4 | 7 XP |
| 140 | 5 | 9 XP |
| ... | n | (2n - 1) XP |

Formula: `xpNeeded = (2 * level) - 1`

Each advancement adds +10 maxCalories to the body part(s).

### Starvation vs Injury

These are two separate damage systems:

**Starvation (muscle atrophy)**
- Mechanism: Body consumes muscle for energy
- Effect: `maxCalories` decreases
- Recovery: Fitness XP (must rebuild muscle through training)
- Permanent until trained

**Injury (wounds/damage)**
- Mechanism: External damage, decay, infection
- Effect: `decayLevel` increases
- Recovery: Metabolism (eating heals over time)
- Temporary if treated

Both reduce effective capacity:
```
effectiveCapacity = maxCalories - decayLevel
```

A starved AND injured limb is doubly weakened.

## Example Scenarios

### Scenario 1: Starvation Recovery

1. Player starves, arm's maxCalories drops from 150 to 100
2. Player eats - calories restored, but maxCalories stays at 100
3. Player plays 3 hours - earns 1 fitness XP
4. Player spends XP on arms - maxCalories increases to 110
5. Repeat until arm is back to 150 (or higher)

### Scenario 2: Injury Recovery

1. Player's arm is wounded - decayLevel increases to 30
2. Effective capacity: 150 - 30 = 120
3. Player eats well - metabolism heals wound
4. decayLevel decreases to 0 over time
5. Effective capacity restored to 150

### Scenario 3: Both

1. Player starves: maxCalories drops to 100
2. Player is also wounded: decayLevel at 20
3. Effective capacity: 100 - 20 = 80
4. Eating heals wound (decayLevel → 0), effective = 100
5. But maxCalories still 100 until trained

## Body Part Hierarchy

```
Torso (root)
├── Head
│   ├── Face
│   │   ├── Left Eye
│   │   ├── Right Eye
│   │   ├── Left Ear
│   │   ├── Right Ear
│   │   ├── Nose
│   │   └── Mouth
│   │       └── Tongue
│   └── Scalp
├── Left Shoulder → Arm → Forearm → Hand → Fingers
├── Right Shoulder → Arm → Forearm → Hand → Fingers
├── Left Thigh → Knee → Leg → Foot → Toes
└── Right Thigh → Knee → Leg → Foot → Toes
```

Each part in the chain can have its own calories, maxCalories, and decayLevel.

## Fat System

Fat is stored on the torso and serves as energy reserve:

| Property | Default | Description |
|----------|---------|-------------|
| `fat` | 20 | Current fat level |
| `maxFat` | 100 | Maximum fat storage |

### Fat Modifiers

Fat affects physical stats (dexterity, speed, stealth):

- 0-20% fat: No penalty (healthy weight)
- 20-100% fat: Linear penalty up to 50% reduction

```
if (fat <= maxFat * 0.2) return 1.0;
penalty = (fat - threshold) / (maxFat - threshold) * 0.5;
return 1.0 - penalty;  // 0.5 to 1.0
```

### Fat Descriptions

| Fat % | Description |
|-------|-------------|
| 0-16% | lean |
| 17-33% | fit |
| 34-50% | soft |
| 51-66% | overweight |
| 67-83% | obese |
| 84-100% | morbidly obese |

## Related Files

- `embodied-builder.ts` - Calorie methods, burnCalories cascade
- `player-builder.ts` - Fitness XP system, @fitness menu
- `decayable-builder.ts` - Base decay/healing for objects
- `sensory-builders.ts` - Eye/ear capacity calculations
- `bodypart-builder.ts` - Wound system (separate from starvation)
