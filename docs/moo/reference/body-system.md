# Body System Reference

The body system provides realistic physical bodies for agents, with hierarchical body parts, sensory organs, damage tracking, and metabolism.

## Overview

Embodied agents (Humans, Players) have a body tree consisting of:

```
torso (root)
├── head
│   ├── scalp
│   ├── neck
│   │   └── throat
│   └── face
│       ├── left eye
│       ├── right eye
│       ├── left ear
│       ├── right ear
│       ├── nose
│       └── mouth
│           └── tongue
├── right shoulder
│   └── arm
│       └── forearm
│           └── hand
│               ├── thumb
│               ├── index finger
│               ├── middle finger
│               ├── ring finger
│               └── pinky
├── left shoulder
│   └── arm
│       └── forearm
│           └── hand
│               └── (fingers...)
├── right thigh
│   └── knee
│       └── leg
│           └── foot
├── left thigh
│   └── knee
│       └── leg
│           └── foot
├── groin
│   └── (sex-specific parts)
├── left chest
├── right chest
├── abdomen
├── digestive stomach
└── back
```

## Creating Bodies

Use `$bodyFactory` to create complete human bodies:

```javascript
// Create a human body with default appearance
const body = await $bodyFactory.createHumanBody(owner);

// Create with specific sex
const body = await $bodyFactory.createHumanBody(owner, 'female');

// Create with detailed appearance
const body = await $bodyFactory.createHumanBody(owner, 'male', {
  skinTone: 'olive',
  eyeColor: 'green',
  leftEyeColor: 'green',     // Supports heterochromia
  rightEyeColor: 'blue',
  eyeStyle: 'almond',
  hairColor: 'brown',
  hairStyle: 'curly',
  hairTexture: 'thick',
  buildType: 'athletic',
  faceShape: 'oval',
  noseShape: 'roman',
  lipShape: 'full',
  freckles: 'light',
  facialHair: 'stubble',
  distinguishingMark: 'scar on left cheek',
});

// Specify primary hand
const body = await $bodyFactory.createHumanBody(owner, 'female', {}, 'left');
```

## Body Part Properties

Each body part has these properties:

| Property | Type | Description |
|----------|------|-------------|
| `owner` | RuntimeObject | Agent who owns this body |
| `parts` | `{name: part}` | Child body parts |
| `bones` | `string[]` | Bones in this part |
| `wounds` | `Wound[]` | Wounds on this part |
| `coverable` | boolean | Can wear clothing here |
| `removable` | boolean | Can be severed |
| `critical` | boolean | Death if destroyed |
| `condition` | `{name: severity}` | Current conditions |
| `worn` | `Wearable[]` | Clothing covering this part |

### Stats

Body parts can contribute to stats:

```javascript
// Hands contribute to dexterity
hand.dexterity = 1;

// Arms contribute to strength
arm.strength = 1;

// Eyes contribute to perception
eye.perception = 1;

// Head contributes to IQ
head.iq = 1;
```

Stats are aggregated from all body parts via `Embodied.getStat()`.

### Calories/Energy

Body parts store calories for the energy system:

```javascript
// Each part has calorie storage
arm.calories = 100;      // Current calories
arm.maxCalories = 150;   // Maximum storage

// Torso is the main calorie store
torso.calories = 2000;
torso.maxCalories = 3000;

// Hydration (separate from calories)
torso.hydration = 100;
torso.maxHydration = 100;
```

## Accessing Body Parts

### From Embodied Agent

```javascript
// Get body root (torso)
const torso = await agent.getBody();
const torso = await agent.getTorso();  // Alias

// Get head
const head = await agent.getHead();

// Get mouth (for speaking)
const mouth = await agent.getMouth();

// Get eyes (array)
const eyes = await agent.getEyes();  // [leftEye, rightEye]

// Get ears (array)
const ears = await agent.getEars();  // [leftEar, rightEar]

// Get hands
const hands = await agent.getHands();
// { primary: rightHand, secondary: leftHand, both: [rightHand, leftHand] }
```

### From Body Part

```javascript
// Get child part by name
const arm = await shoulder.getPart('arm');

// Find part by name (recursive search)
const finger = await torso.findPart('left index finger');

// Get random part (for random targeting)
const randomPart = await torso.randomPart();

// Get all contents recursively
const allItems = await torso.resolveAllContents();

// Build coverage map (all coverable parts)
const coverageMap = await torso.coverageMap();
// { 'head': headPart, 'left arm': armPart, ... }
```

## Sensory System

### Vision

```javascript
// Check if agent can see
const canSee = await agent.canSee();  // false if blind, no eyes, unconscious

// See a visual message
const seen = await agent.see("Bob waves at you.");
// Returns true if seen, false if blind

// Check specific eye
const leftEye = (await agent.getEyes())[0];
const canSeeLeft = await leftEye.canSee();
```

### Hearing

```javascript
// Check if agent can hear
const canHear = await agent.canHear();  // false if deaf, no ears, unconscious

// Hear speech
const heard = await agent.hear("Hello!", "English", speaker);
// Returns { content, language, understood: true/false } or null if deaf

// Hear through specific ear
const leftEar = (await agent.getEars())[0];
const canHearLeft = await leftEar.canHear();
```

### Smell

```javascript
// Check if agent can smell
const canSmell = await agent.canSmell();

// Smell something
await agent.smell("A pungent odor fills the room.", source);
```

### Taste

```javascript
// Check if agent has a tongue
const canTaste = await agent.canTaste();

// Taste something
await agent.taste("A bitter metallic taste.", source);
```

### Touch/Pain

```javascript
// Body parts can feel
const canFeel = await bodyPart.canFeel();

// Report sensation to owner
await bodyPart.feel({
  type: 'pain',      // 'pain', 'touch', 'temperature'
  intensity: 75,      // 0-100
  source: knife,      // What caused it
});

// Agent receives via onSensation hook
agent.setMethod('onSensation', `
  const sensation = args[0];
  if (sensation.type === 'pain' && sensation.intensity > 50) {
    await self.tell("Intense pain in your " + sensation.partName + "!");
  }
`);
```

## Damage System

### Taking Damage

```javascript
// Apply damage to a body part
const result = await bodyPart.takeDamage({
  type: 'cut',          // 'cut', 'blunt', 'pierce', 'burn', 'frostbite'
  severity: 50,         // 0-100
  depth: 'deep',        // 'superficial', 'shallow', 'deep'
  cause: weapon,        // What caused the damage
  force: 50,            // Force of impact
  breakChance: 20,      // Chance to break bones (0-100)
}, attacker);

// Result contains:
// { part, type, wound, bonesBroken: [], description }
```

### Wounds

Wounds are objects attached to body parts:

```javascript
// List wounds on a part
const wounds = bodyPart.wounds || [];

// Wound properties
wound.type = 'cut';           // Damage type
wound.severity = 50;          // 0-100
wound.depth = 'deep';         // How deep
wound.bleeding = true;        // Currently bleeding
wound.infected = false;       // Infection status
wound.healed = 0;             // Healing progress 0-100
wound.cause = knife;          // What caused it
```

### Critical Parts

Parts marked `critical: true` cause death when destroyed:

- Head
- Neck
- Throat
- Back (spine)

```javascript
// Check if destruction is lethal
if (bodyPart.critical) {
  await owner.onDeath();
}
```

### Severing Parts

Parts marked `removable: true` can be severed:

```javascript
// Check if severable
if (bodyPart.removable) {
  // Sever the part (creates a separate object)
  await bodyPart.sever(attacker);
}
```

Severed parts:
- Become Edible (can be eaten - cannibalism)
- Become Decayable (rot over time)
- Maintain wound/condition state

## Hands and Inventory

Player inventory in Malice is **distributed** across multiple locations - there is no single "inventory" array. Items are stored in hands, pockets, and containers.

### Hand Properties

Each hand is a container with capacity limits:

```javascript
// Hand properties (from $hand prototype)
hand.canGrasp = true;       // Whether hand can hold items
hand.maxItems = 2;          // Can hold up to 2 objects at once
hand.maxWeight = 10000;     // 10kg capacity in grams
hand.calories = 50;         // Current grip strength
hand.contents = [];         // Items currently held
```

### Picking Up Items

Items are held IN hands using the `moveTo()` primitive:

```javascript
// Pick up an item into hand
await item.moveTo(hand);

// Drop item from hand
await item.moveTo(room);

// Transfer to pocket
await item.moveTo(pocket);
```

**Hand canContain() checks:**
- Item count: `contents.length < maxItems` (typically 2)
- Weight: total weight + item.weight ≤ maxWeight

Returns error strings if rejected:
- `'Your hand is already full.'`
- `'That is too heavy to hold.'`

### Accessing Hands

```javascript
// Get both hands with primary/secondary designation
const hands = await agent.getHands();
// {
//   primary: rightHand,    // Or leftHand if left-handed
//   secondary: leftHand,   // Opposite hand
//   both: [rightHand, leftHand]
// }

// Check what's in hands
const rightItems = hands.primary.contents;  // Array of items
const leftItems = hands.secondary.contents;
```

### Distributed Inventory Model

Player inventory consists of:

```
Player Inventory (Distributed):

1. HANDS (up to 2 items each, weight limited)
   └─ rightHand.contents = [sword, torch]
   └─ leftHand.contents = [shield]

2. WORN CLOTHING
   └─ torso.worn = [shirt, jacket]
   └─ head.worn = [hat]

3. POCKETS (attached to worn clothing)
   └─ jacket.pockets[0].contents = [keys, wallet]
   └─ pants.pockets[0].contents = [phone]

4. CONTAINERS (backpacks, bags, etc.)
   └─ backpack.contents = [rope, ammo, medkit]
```

### Getting All Inventory

```javascript
// Get everything the player is carrying
const allItems = await agent.resolveAllContents();
// Returns flat array of all items in hands, pockets, containers, etc.

// Get total carried weight
const weight = await agent.getCarriedWeight();
// Sums: hands + worn items + pocket contents + container contents
```

### Pockets

Pockets are `$pocket` instances attached to clothing:

```javascript
// Pocket properties
pocket.maxWeight = 500;     // 500g capacity
pocket.maxVolume = 500;     // 500cc capacity
pocket.attachedTo = pants;  // Parent clothing
pocket.contents = [];       // Items stored
```

**Pocket canContain() checks:**
- Item count (default max: 10)
- Weight: total + item.weight ≤ maxWeight
- Volume: total + item.volume ≤ maxVolume

See [Wearables](../prototypes/wearables.md#pockets-system) for full pocket documentation.

### AI-Interpreted Inventory Actions

All inventory actions are AI-interpreted via abilities:

```
Player: "pick up the sword"
↓
AI reads: hand.abilities (GRASP, CAPACITY limits)
AI reads: sword.weight
AI checks: hand.canContain(sword)
AI executes: await sword.moveTo(hand)
AI narrates: "You grip the sword's worn leather handle."

Player: "put sword in my pocket"
↓
AI reads: pocket.abilities (CAPACITY, CONCEALMENT)
AI checks: pocket.canContain(sword)
AI result: "That is too bulky for this pocket."
AI narrates: "The sword is far too long to fit in your pocket."
```

## Clothing/Coverage

### Wearing Clothing

```javascript
// Clothing covers specific body parts
shirt.covers = ['torso', 'left arm', 'right arm'];

// When worn, added to body part's worn array
await shirt.wear(agent);
// bodyPart.worn now includes shirt

// Check what's covering a part
const worn = await bodyPart.getWornItems();
// Returns array sorted by layer (innermost first)

// Get visible description (outermost layer or bare)
const desc = await bodyPart.getVisibleDescription(viewer);
// "black leather jacket" or "bare arm"
```

### Layering System

Clothing has layers for ordering:

```javascript
// Layer values (lower = closer to skin)
underwear.layer = 0;
shirt.layer = 1;
sweater.layer = 2;
jacket.layer = 3;

// Outermost layer is visible
// Must remove outer layers to access inner layers
```

## Metabolism

### Calories

```javascript
// Check calories in a body part
const calories = torso.calories;
const maxCalories = torso.maxCalories;

// Check total body calories
const total = await agent.getTotalCalories();

// Consume calories (from activity)
await agent.consumeCalories(100);

// Add calories (from eating)
await torso.addCalories(200);
```

### Hydration

```javascript
// Check hydration
const hydration = torso.hydration;  // 0-100

// Dehydration effects trigger at low levels
// Death at 0%
```

### Digestion

The `digestive stomach` processes food:

```javascript
// Food goes into stomach
const stomach = await torso.getPart('digestiveStomach');

// Stomach has:
stomach.maxContents = 10;     // Max items
stomach.maxVolume = 1000;     // Max volume (ml)
stomach.digestionRate = 50;   // Calories processed per tick
```

## Consciousness

```javascript
// Check consciousness
if (!agent.conscious) {
  // Cannot act, speak, or perceive
}

// Set consciousness
agent.conscious = true;   // Awake
agent.conscious = false;  // Unconscious

// Wake from sleep
await agent.wake();

// Fall asleep
await agent.sleep();
```

## Body Description

```javascript
// Describe entire body (for examination)
const desc = await torso.describe(viewer);

// Describe specific part
const partDesc = await bodyPart.describe(viewer);

// Shows:
// - Part name and condition
// - Visible clothing/coverage
// - Wounds and damage
// - Special features (skin tone, scars, etc.)
```

## Appearance Properties

Body parts can have appearance properties:

```javascript
// Skin tone (on all visible parts)
torso.skinTone = 'olive';

// Hair (on scalp)
scalp.hairColor = 'brown';
scalp.hairStyle = 'curly';
scalp.hairTexture = 'thick';

// Eyes
leftEye.color = 'green';
leftEye.shape = 'almond';

// Face
face.faceShape = 'oval';
face.freckles = 'light';
face.facialHair = 'stubble';
face.distinguishingMark = 'scar on left cheek';

// Nose
nose.shape = 'roman';

// Mouth
mouth.lipShape = 'full';

// Build type (on torso)
torso.buildType = 'athletic';
```

## Best Practices

### 1. Always Check for Body

```javascript
const body = await agent.getBody();
if (!body) {
  return "You have no body.";
}
```

### 2. Use getPart for Navigation

```javascript
// Navigate the body tree
const shoulder = await body.getPart('rightShoulder');
const arm = await shoulder.getPart('arm');
const forearm = await arm.getPart('forearm');
const hand = await forearm.getPart('hand');

// Or use findPart for deep searches
const hand = await body.findPart('right hand');
```

### 3. Check Sensory Abilities

```javascript
// Always check before using senses
if (await agent.canSee()) {
  await agent.see(message);
}

if (await agent.canHear()) {
  await agent.hear(message);
}
```

### 4. Handle Missing Parts

```javascript
const mouth = await agent.getMouth();
if (!mouth) {
  return "You cannot speak without a mouth.";
}
```

## See Also

- [Prototypes Reference](./prototypes.md) - Body part prototypes
- [Event Hooks](./hooks.md) - onSensation, onCriticalDamage
- [$ Globals Reference](./globals.md) - $bodyFactory
