# Wearables System

Clothing, armor, and accessories that can be worn on body parts.

## Overview

The wearables system allows items to be worn on body parts:

- **Covers** specific body part slots
- **Layers** for stacking (underwear under shirt under jacket)
- **Warmth** for cold survival
- **Protection** for damage reduction
- **Verb registration** for wear/remove commands

**Prototype Hierarchy:**
```
$.describable
└── $.wearable         ← Base wearable
    └── $.clothing     ← Everyday clothing (wear/remove verbs)
```

## $.wearable - Base Wearable

Foundation for all wearable items.

### Properties

```javascript
{
  // Body slots this covers
  covers: [],             // ['torso', 'leftArm', 'rightArm']

  // Layer for stacking (lower = closer to skin)
  layer: 2,
  // 1 = underwear
  // 2 = base layer
  // 3 = mid layer
  // 4 = outer layer
  // 5 = outerwear

  // Benefits
  warmth: 0,              // 0-100, cold protection
  protection: 0,          // 0-100, damage reduction

  // State
  wornOn: null,           // Body part ID when worn
  wornBy: null,           // Player ID when worn

  // Appearance
  wornDescription: null,  // Description when worn (overrides naked body part)
}
```

### Body Part Slots

| Slot | Description |
|------|-------------|
| `head` | Head (hats, helmets) |
| `face` | Face (masks, glasses) |
| `neck` | Neck (scarves, necklaces) |
| `torso` | Torso (shirts, jackets) |
| `back` | Back (backpacks, capes) |
| `waist` | Waist (belts, pouches) |
| `leftArm` | Left arm (sleeves) |
| `rightArm` | Right arm (sleeves) |
| `leftHand` | Left hand (gloves) |
| `rightHand` | Right hand (gloves) |
| `hands` | Both hands (general gloves) |
| `leftLeg` | Left leg (pants leg) |
| `rightLeg` | Right leg (pants leg) |
| `leftFoot` | Left foot (shoes) |
| `rightFoot` | Right foot (shoes) |
| `feet` | Both feet (general footwear) |

### Key Methods

#### canWear(wearer)
Check if item can be worn.

```javascript
const result = await shirt.canWear(player);
// {
//   success: true
// }
// or
// {
//   success: false,
//   error: 'You are already wearing something at that layer (t-shirt).'
// }
```

**Checks:**
- Not already worn by someone else
- Not already worn by this player
- Player has required body parts
- No layer conflicts on covered slots

#### wear(wearer)
Put on the item.

```javascript
const result = await shirt.wear(player);
// { success: true, message: 'You put on a cotton shirt.' }
```

**What it does:**
1. Verifies `canWear()` passes
2. Adds item ID to `worn` array on each covered body part
3. Sets `wornBy` and `wornOn`
4. Removes from current location (hand/ground)
5. Sets location to wearer

#### remove(wearer)
Take off the item.

```javascript
const result = await shirt.remove(player);
// { success: true, message: 'You take off a cotton shirt.' }
```

**What it does:**
1. Verifies item is worn by this player
2. Removes item ID from `worn` array on body parts
3. Clears `wornBy` and `wornOn`

#### getWornOnSlot(wearer, slot)
Get all items worn on a specific slot.

```javascript
const items = await $.wearable.getWornOnSlot(player, 'torso');
// [undershirt, shirt, jacket]
```

#### getWornDescription()
Get description shown when item is worn.

```javascript
const desc = await shirt.getWornDescription();
// "a crisp white shirt" or item name if wornDescription not set
```

## $.clothing - Everyday Clothing

Inherits from $.wearable, adds verb registration.

### Properties

```javascript
{
  covers: ['torso'],      // What body parts it covers
  layer: 2,               // Base layer by default
  warmth: 10,             // Provides warmth
  protection: 0,          // No combat protection

  // Clothing-specific
  material: 'cotton',     // Fabric type
  color: 'white',
  condition: 100,         // 0-100, degrades with wear
}
```

### Verb Registration Flow

```
1. Player picks up clothing
   → onArrived() registers 'wear' verb

2. Player types "wear shirt"
   → doWear() called
   → wear() puts on item
   → Unregisters 'wear' verb
   → Registers 'remove' verb

3. Player types "remove shirt"
   → doRemove() called
   → remove() takes off item
   → Moves to hand (or drops if hands full)
   → Unregisters 'remove' verb
   → Registers 'wear' verb
```

### Verb Patterns

```javascript
// When holding (not worn)
'wear shirt'        → doWear()
'wear %t'           → doWear()
'put on shirt'      → doWear()
'put on %t'         → doWear()

// When worn
'remove shirt'      → doRemove()
'remove %t'         → doRemove()
'take off shirt'    → doRemove()
'take off %t'       → doRemove()
```

### Key Methods

#### doWear(context, wearer)
Verb handler for wearing.

```javascript
> wear shirt
"You put on a cotton shirt."
```

Also announces to room: "Bob puts on a cotton shirt."

#### doRemove(context, wearer)
Verb handler for removing.

```javascript
> remove shirt
"You take off a cotton shirt."
```

Places item in hand, or drops if hands full.

### describe() Override

Shows material, color, and condition:

```
a cotton shirt
A white cotton garment.
Covers: torso
Layer: base layer
Warmth: 10
Condition: good
```

## Layer System

Clothing stacks in layers. Lower layers are worn first, higher layers go over them.

### Layer Order

| Layer | Name | Examples |
|-------|------|----------|
| 1 | Underwear | Boxers, bra, socks |
| 2 | Base layer | T-shirt, undershirt |
| 3 | Mid layer | Sweater, hoodie |
| 4 | Outer layer | Jacket, dress |
| 5 | Outerwear | Overcoat, raincoat |

### Layer Conflicts

You cannot wear two items at the same layer on the same slot:

```javascript
// Already wearing layer 2 t-shirt on torso
> wear polo_shirt
"You are already wearing something at that layer (t-shirt)."

// But you CAN wear a layer 3 sweater over it
> wear sweater
"You put on a wool sweater."
```

### Layering Example

```
Slot: torso
├── Layer 1: tank top
├── Layer 2: t-shirt
├── Layer 3: sweater
├── Layer 4: jacket
└── Layer 5: raincoat
```

## Warmth System

Warmth protects against cold environments:

```javascript
const jacket = await $.recycler.create($.clothing, {
  name: 'a winter jacket',
  covers: ['torso', 'leftArm', 'rightArm'],
  layer: 5,
  warmth: 40,            // High warmth
  material: 'down',
});
```

Total warmth is sum of all worn items affecting a body part.

## Creating Clothing

### Basic Shirt

```javascript
const shirt = await $.recycler.create($.clothing, {
  name: 'a cotton t-shirt',
  description: 'A comfortable everyday shirt.',
  covers: ['torso'],
  layer: 2,
  warmth: 5,
  material: 'cotton',
  color: 'blue',
});
```

### Full Outfit

```javascript
// Pants (covers both legs)
const pants = await $.recycler.create($.clothing, {
  name: 'jeans',
  covers: ['leftLeg', 'rightLeg', 'waist'],
  layer: 2,
  warmth: 15,
  material: 'denim',
  color: 'blue',
});

// Shoes (covers both feet)
const shoes = await $.recycler.create($.clothing, {
  name: 'sneakers',
  covers: ['feet'],
  layer: 2,
  warmth: 5,
  material: 'canvas',
  color: 'white',
});

// Hat
const hat = await $.recycler.create($.clothing, {
  name: 'a baseball cap',
  covers: ['head'],
  layer: 2,
  warmth: 2,
  material: 'cotton',
  color: 'red',
});
```

### Multi-layer Outfit

```javascript
// Underwear (layer 1)
const underwear = await $.recycler.create($.clothing, {
  name: 'boxer shorts',
  covers: ['waist', 'leftLeg', 'rightLeg'],
  layer: 1,
  warmth: 2,
});

// T-shirt (layer 2)
const tshirt = await $.recycler.create($.clothing, {
  name: 'a white t-shirt',
  covers: ['torso'],
  layer: 2,
  warmth: 5,
});

// Hoodie (layer 3)
const hoodie = await $.recycler.create($.clothing, {
  name: 'a gray hoodie',
  covers: ['torso', 'leftArm', 'rightArm', 'head'],
  layer: 3,
  warmth: 20,
});

// Jacket (layer 4)
const jacket = await $.recycler.create($.clothing, {
  name: 'a leather jacket',
  covers: ['torso', 'leftArm', 'rightArm'],
  layer: 4,
  warmth: 25,
  protection: 5,          // Some protection
});
```

## Body Part Integration

When worn, items are added to body part's `worn` array:

```javascript
// After wearing shirt
bodyPart.worn = [shirt.id]

// After wearing undershirt then shirt
bodyPart.worn = [undershirt.id, shirt.id]
```

### Appearance Override

Worn items override the "naked" description of body parts:

```javascript
// Without clothing
bodyPart.nakedDescription = "bare pale skin"

// With clothing (shirt.wornDescription)
// Shows: "a crisp white shirt" instead of "bare pale skin"
```

## Condition System

Clothing degrades with wear:

| Condition | Description |
|-----------|-------------|
| 90-100 | pristine |
| 70-89 | good |
| 50-69 | worn |
| 30-49 | tattered |
| 0-29 | ragged |

Degraded clothing may provide less warmth/protection.

## Player Interaction Example

```
> inventory
You are carrying:
  a cotton shirt

> wear shirt
You put on a cotton shirt.

> inventory
You are wearing:
  a cotton shirt

> remove shirt
You take off a cotton shirt.

> inventory
You are carrying:
  a cotton shirt
```

## Future: Armor

The wearables system supports armor (not yet implemented):

```javascript
const armor = await $.recycler.create($.wearable, {
  name: 'a kevlar vest',
  covers: ['torso'],
  layer: 4,
  warmth: 5,
  protection: 50,         // Damage reduction
});
```

## See Also

- [Body System](./body.md) - Body parts and worn arrays
- [Agents](./agents.md) - Player interaction
- [Items](./items.md) - General item handling
