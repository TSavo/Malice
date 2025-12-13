# Wound System

Injuries that bleed, heal, and infect over time.

## Overview

Wounds are complex objects that exist on body parts. They model injury progression realistically:

- **Bleeding** drains blood (hydration + calories)
- **Pain** affects the owner
- **Infection** risk for untreated wounds
- **Healing** progresses with proper treatment
- **Forensics** for autopsy examination

## $.wound - Wound Prototype

### Properties

```javascript
{
  // Wound characteristics
  type: 'cut',            // cut, bruise, puncture, burn, laceration, abrasion, fracture
  severity: 20,           // 0-100 (minor scrape to life-threatening)
  depth: 'shallow',       // superficial, shallow, deep, penetrating
  bodyPart: null,         // Reference to body part this wound is on

  // Bleeding
  bleeding: 0,            // 0-100 (0 = not bleeding, 100 = arterial)

  // Infection
  infected: false,
  infectionSeverity: 0,   // 0-100
  infectionType: null,    // bacterial, necrotic, septic

  // Healing
  healingProgress: 0,     // 0-100 (100 = fully healed)

  // Treatment
  cleaned: false,         // Has been cleaned/disinfected
  bandaged: false,        // Has been bandaged
  stitched: false,        // Has been stitched (for deep cuts)

  // Pain
  painLevel: 20,          // 0-100

  // Forensics
  inflictedTick: 0,       // When wound was created
  cause: null,            // blade, blunt, claw, bite, fire, acid
  attacker: null,         // Who caused it
}
```

### Wound Types

| Type | Description | Bleeding | Pain |
|------|-------------|----------|------|
| cut | Clean slice | High (0.8x) | Medium (0.7x) |
| laceration | Ragged tear | Very high (1.0x) | High (0.9x) |
| puncture | Stabbing wound | Medium (0.6x) | High (0.8x) |
| abrasion | Scrape/graze | Low (0.3x) | Low (0.5x) |
| bruise | Blunt trauma | None (0x) | Medium (0.6x) |
| burn | Heat/chemical | Low (0.2x) | Very high (1.0x) |
| fracture | Broken bone | Very low (0.1x) | Extreme (1.2x) |

### Wound Depths

| Depth | Bleeding | Healing | Infection Risk |
|-------|----------|---------|----------------|
| superficial | 0.3x | 1.5x faster | None |
| shallow | 0.6x | Normal | Normal |
| deep | 1.0x | 0.5x slower | 2x |
| penetrating | 1.5x | 0.25x slower | 3x |

## Wound Lifecycle

```
Wound inflicted
    ↓
[Bleeding phase]
    - Drains hydration and calories
    - Natural clotting (0.5/tick)
    - Bandaging speeds clotting (2/tick)
    - Stitching speeds clotting (5/tick)
    ↓
[Infection risk]
    - Uncleaned wounds risk infection
    - Deeper wounds = higher risk
    - Dirty causes (bite, claw) = higher risk
    ↓
[Healing phase - requires cleaning]
    - Clean wounds: 0.2% per tick base
    - Bandaged: +0.3% per tick
    - Stitched: +0.5% per tick
    - Infected: 0.2x healing rate
    ↓
100% healed → wound removed
```

## Key Methods

### initialize(type, severity, options)
Set up a new wound.

```javascript
await wound.initialize('cut', 50, {
  depth: 'deep',
  cause: 'blade',
  attacker: enemy.id,
  bodyPart: arm.id
});
```

### tick()
Process one game tick. Called by body part tick.

```javascript
const result = await wound.tick();
// {
//   bled: 3.5,           // Blood lost this tick
//   healed: 0.2,         // Healing progress gained
//   infected: false,     // Did infection start?
//   pain: 30,            // Pain sent to owner
//   fullyHealed: false   // Is wound gone?
// }
```

### Treatment Methods

#### clean(thoroughness)
Clean and disinfect the wound.

```javascript
const result = await wound.clean(80);
// {
//   success: true,
//   message: 'The wound is now clean.'
// }
```

**Effects:**
- Marks wound as cleaned
- If thoroughness > 70 and infection < 50: cures infection
- Otherwise: reduces infection severity

**Critical:** Wounds CANNOT heal until cleaned!

#### bandage(quality)
Apply a bandage.

```javascript
const result = await wound.bandage(70);
// { success: true, message: 'The wound is now bandaged.' }
```

**Effects:**
- Marks wound as bandaged
- Speeds clotting (2/tick vs 0.5/tick)
- High quality (>70) immediately reduces bleeding by 20

#### stitch(skill)
Stitch wound closed. Only for cuts/lacerations, deep or penetrating.

```javascript
const result = await wound.stitch(60);
// { success: true, message: 'The wound has been stitched closed.' }
```

**Effects:**
- Marks wound as stitched
- Reduces bleeding by 30
- Speeds clotting (5/tick)
- Poor skill (<30) increases pain

**Fails if:**
- Wrong wound type (not cut/laceration)
- Too shallow (superficial)

### aggravate(amount)
Reopen or worsen the wound.

```javascript
const result = await wound.aggravate(30);
// {
//   success: true,
//   message: 'The wound reopens!',
//   bleeding: 45
// }
```

**Effects:**
- Increases bleeding
- Increases pain (half of amount)
- Reduces healing progress (half of amount)
- Heavy aggravation (>30) removes bandage

### infect(type)
Cause wound infection.

```javascript
const result = await wound.infect('bacterial');
// {
//   success: true,
//   type: 'bacterial',
//   message: 'The wound has become infected.'
// }
```

**Infection types:**
- `bacterial` - Standard infection, treatable
- `necrotic` - Tissue death, requires debridement
- `septic` - Blood poisoning, life-threatening

### getAutopsyFindings(skill, decay)
Get forensic findings for autopsy.

```javascript
const findings = await wound.getAutopsyFindings(75, 20);
// [
//   'A serious deep laceration, bleeding profusely.',
//   'The wound appears recent.',
//   'The wound edges are clean, suggesting a bladed weapon.',
//   'Signs of bacterial infection are present.'
// ]
```

## Bleeding Mechanics

Bleeding drains body resources each tick:

```javascript
// Blood loss per tick
const bleedAmount = wound.bleeding / 10;  // 0-10 hydration

// Hydration drain (blood is mostly water)
bodyPart.hydration -= bleedAmount;

// Calorie drain (blood carries nutrients)
const caloriesLost = wound.bleeding * 0.5;
bodyPart.calories -= caloriesLost;
```

**Natural clotting:**
- Base: 0.5 bleeding reduction per tick
- Bandaged: 2.0 per tick
- Stitched: 5.0 per tick

## Infection Mechanics

### Infection Risk

Uncleaned wounds have a chance to infect each tick:

```javascript
const baseChance = 0.001;  // 0.1% per tick

// Depth multiplier
const depthFactor = {
  superficial: 0,  // No infection risk
  shallow: 1,
  deep: 2,
  penetrating: 3,
};

// Cause multiplier
const causeFactor = {
  bite: 3,         // Very dirty
  claw: 2,
  dirty: 2,
  blade: 1,
  blunt: 0.5,      // Less likely
};

// Risk increases over time
const timeFactor = ticksSinceInflicted / 60;

const infectionChance = baseChance * depthFactor * causeFactor * timeFactor;
```

### Infection Progression

```
Infected (bacterial)
    ↓ 0.2 severity/tick if uncleaned
severity > 80
    ↓
Becomes septic → applies sepsis status to owner
```

**Infection effects:**
- Increases pain
- Slows healing to 20% normal rate
- Sepsis affects entire body

## Healing Mechanics

### Healing Requirements

1. **Must be cleaned** - Dirty wounds don't heal
2. **Not actively bleeding** - Bleeding > 10 stops healing
3. **Treatment helps** - Bandage/stitching speeds healing

### Healing Rates

```javascript
// Base rate (cleaned wound)
let healRate = 0.2;  // 0.2% per tick

// Treatment bonuses
if (bandaged) healRate += 0.3;
if (stitched && type in ['cut', 'laceration']) healRate += 0.5;

// Infection penalty
if (infected) healRate *= 0.2;

// Depth penalty
const depthFactor = {
  superficial: 1.5,   // Faster
  shallow: 1.0,
  deep: 0.5,          // Slower
  penetrating: 0.25,  // Much slower
};
healRate *= depthFactor;
```

### Healing Timeline Examples

| Wound | Treatment | Time to Heal |
|-------|-----------|--------------|
| Superficial cut | Cleaned only | ~333 ticks (~5.5 hours) |
| Shallow cut | Cleaned + bandaged | ~200 ticks (~3.3 hours) |
| Deep cut | Cleaned + bandaged + stitched | ~200 ticks (~3.3 hours) |
| Deep cut | Uncleaned | Never (must clean first) |
| Deep cut, infected | Cleaned after infection | ~1000 ticks (~16 hours) |

## Pain System

Wounds cause periodic pain to their owner:

```javascript
// Every 10 ticks, pain is sent to owner
if (tick % 10 === 0) {
  await owner.feel({
    type: 'pain',
    intensity: wound.painLevel,  // 0-100
    source: 'wound',
    location: bodyPart.name,
  });
}
```

**Pain reduction:**
- Starts decreasing when healing > 30%
- Rate: 0.1 pain/tick

## Creating Wounds

### Via Body Part

```javascript
// Preferred method - body part handles wound creation
await bodyPart.addWound({
  type: 'cut',
  severity: 40,
  depth: 'deep',
  cause: 'blade',
  attacker: enemy.id,
});
```

### Direct Creation

```javascript
const wound = await $.recycler.create($.wound, {});
await wound.initialize('puncture', 60, {
  depth: 'penetrating',
  cause: 'bite',
  bodyPart: leg.id,
});
```

## Treatment Flow

### Proper Treatment

```javascript
// 1. Clean the wound first
await wound.clean(80);

// 2. Stitch if deep cut/laceration
if (['cut', 'laceration'].includes(wound.type) && wound.depth !== 'superficial') {
  await wound.stitch(60);
}

// 3. Bandage
await wound.bandage(70);

// 4. Wait for healing (wound.tick() called each game tick)
```

### Emergency Treatment

```javascript
// Heavy bleeding - bandage immediately to slow blood loss
if (wound.bleeding > 50) {
  await wound.bandage(50);  // Even dirty bandage helps
}

// Clean later when bleeding is controlled
await wound.clean(70);
```

## Forensic Analysis

Wounds provide forensic data for autopsy:

| Skill + Visibility | Information |
|-------------------|-------------|
| 20+ | Wound description |
| 30+ | Treatment evidence (stitches, bandages) |
| 40+ | Infection signs |
| 50+ | Cause of wound (blade, blunt, etc.) |
| 60+ | Approximate wound age |

## Integration with Body System

Wounds are stored on body parts:

```javascript
// Body part has wounds array
bodyPart.wounds = [wound1.id, wound2.id, ...];

// Body part tick processes all wounds
await bodyPart.tick();  // Calls wound.tick() for each wound

// Wound removal when healed
if (wound.healingProgress >= 100) {
  await bodyPart.removeWound(wound);
  await $.recycler.recycle(wound);
}
```

## See Also

- [Body System](./body.md) - Body parts and wound integration
- [Decay System](./decay.md) - Body decay affects wound visibility
- [Consumables](./consumables.md) - Healing items
