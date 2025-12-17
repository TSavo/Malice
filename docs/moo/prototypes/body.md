# Body System

Body parts, wounds, metabolism, and death states in Malice.

## Overview

The body system models player and NPC anatomy, health, and injury:
- **$.bodyPart** - Base for all body parts
- **$.hand / $.head / $.stomach** - Specific body parts
- **$.wound** - Injury system
- **$.corpse / $.humanRemains / $.skeletalRemains** - Death/decay states

## $.bodyPart - Base Prototype

### Purpose

Represents a single anatomical part (hand, head, leg, etc.). Used for targeting, damage, and biometric scans.

### Properties

```javascript
{
  name: 'left hand',
  partType: 'hand',      // Type of part
  health: 100,           // Current health
  maxHealth: 100,        // Maximum health
  wounds: [woundId1, ...], // Array of wound IDs
}
```

### Key Methods

#### takeDamage(amount)
Apply damage to the part.

```javascript
await hand.takeDamage(10);
```

#### heal(amount)
Restore health.

```javascript
await hand.heal(5);
```

#### addWound(wound)
Add a wound to the part.

```javascript
await hand.addWound(woundObj);
```

## Specific Body Parts

### $.hand

```javascript
const hand = await $.recycler.create($.hand, {
  name: 'right hand',
  partType: 'hand',
  health: 100,
  maxHealth: 100
});
```

### $.head

```javascript
const head = await $.recycler.create($.head, {
  name: 'head',
  partType: 'head',
  health: 100,
  maxHealth: 100
});
```

### $.stomach

```javascript
const stomach = await $.recycler.create($.stomach, {
  name: 'stomach',
  partType: 'stomach',
  health: 100,
  maxHealth: 100
});
```

## $.wound - Injury System

### Purpose

Tracks injuries to body parts. Wounds can affect health, abilities, and require healing.

### Properties

```javascript
{
  type: 'cut',           // Type of wound (cut, bruise, burn, etc.)
  severity: 2,           // Severity (1=mild, 5=critical)
  bleeding: true,        // Is the wound bleeding?
  infected: false,       // Is the wound infected?
  healed: false,         // Has the wound healed?
}
```

### Key Methods

#### heal()
Heal the wound.

```javascript
await wound.heal();
```

#### infect()
Mark wound as infected.

```javascript
await wound.infect();
```

## Death & Decay States

### $.corpse

Represents a dead body. Can decay into remains.

```javascript
const corpse = await $.recycler.create($.corpse, {
  name: 'corpse of Alice',
  decayRate: 0.05
});
```

### $.humanRemains

Represents decomposed remains.

```javascript
const remains = await $.recycler.create($.humanRemains, {
  name: 'human remains',
  decayRate: 0.1
});
```

### $.skeletalRemains

Represents skeletonized remains.

```javascript
const skeleton = await $.recycler.create($.skeletalRemains, {
  name: 'skeletal remains',
  decayRate: 0.2
});
```

## Metabolism, Heartbeat, Digestion, and Food/Water

### Stomach (Digestion)
- **Properties:**
  - `maxContents`: Max number of items
  - `maxVolume`: Max volume (ml)
  - `digestionRate`: Calories extracted per tick
- **Methods:**
  - `canContain(item)`: Only edible items (must have `calories`)
  - `digest()`: Processes contents, extracts calories, removes digested items
  - `getCurrentVolume()`, `hasRoomFor(volume)`, `getFullness()`, `describe()`

**Example:**
```javascript
// Add food to stomach
await stomach.canContain(foodItem); // Checks if edible and fits
// Digest food
const calories = await stomach.digest(); // Extracts calories per tick
```

### Torso (Calorie/Fat Storage)
- **Properties:**
  - `calories`: Current available energy
  - `maxCalories`: Max storage
  - `fat`: Overflow storage (burned when out of calories)
  - `maxFat`: Max fat

### Embodied/Human (Metabolism & Starvation)
- **Properties:**
  - `body`: Reference to torso (root)
  - `breath`, `maxBreath`: Air for drowning
- **Methods:**
  - `digestTick()`: Processes digestion/metabolism (called by scheduler)
  - `replenishCalories(amount)`: Distributes calories from food
  - Starvation/death logic: If body decay > 50%, triggers death

**Scheduler Integration:**
- `$.scheduler.tick()` runs every second (see `game-coordinator.ts`)
- Triggers digestion/metabolism jobs for all embodied agents

### Food Items
- Must have `calories` property to be digested
- May have `bites`, `volume`, etc.

**Example:**
```javascript
const apple = await $.recycler.create($.food, { calories: 95, bites: 3 });
await stomach.canContain(apple);
await stomach.digest(); // Extracts calories
```

### Water
- Not explicitly modeled as a separate property, but can be tracked via item `volume` and hydration logic if implemented

### Death by Starvation
- If body decay > 50%, triggers death sequence
- Fat is burned when out of calories

### Summary
- **Stomach** digests food, extracts calories
- **Torso** stores calories/fat
- **Embodied/Human** manages metabolism, breath, starvation
- **Scheduler** triggers digestion/metabolism every tick
- **Food** must have calories to be digested

---

## Tips & Best Practices

1. **Model all body parts** - Use $.bodyPart for hands, head, stomach, etc.
2. **Track wounds per part** - Each part can have multiple wounds
3. **Use decay for corpses** - Dead bodies should decay over time
4. **Metabolism affects healing** - Nutrition speeds recovery
5. **Infection risk for wounds** - Add infection logic for realism
6. **Custom parts for non-humans** - Extend $.bodyPart for animals, robots
7. **Test injury and healing** - Simulate combat and recovery

## See Also

- [Agents](./agents.md) - Players and NPCs that have bodies
- [Wounds](./wounds.md) - Detailed wound system
- [Items](./items.md) - Food and consumables that affect metabolism
