# Prototype System

Understanding Malice's prototype-based object system and inheritance patterns.

## Overview

Everything in Malice inherits from prototypes. Objects don't have "classes"—they have **parent chains** that define their behavior through property and method inheritance.

## The Prototype Hierarchy

```
$root (#1)
  ├─ $faction (singleton - faction memberships & relationships)
  │
  └─ $describable
      ├─ $location (containers)
      │   └─ $room (rooms with exits)
      │
      ├─ $exit (directional links)
      │   └─ $guardedExit (faction-restricted passage)
      │
      ├─ $agent (autonomous entities, perception filters)
      │   └─ $embodied (physical bodies, sensory methods)
      │       └─ $human (human-type agents)
      │           └─ $player (player characters)
      │               └─ $admin (wizard/admin)
      │
      ├─ $decayable (time-based decay)
      │   └─ $edible (consumable items)
      │       ├─ $food (solid food)
      │       ├─ $drink (liquids)
      │       └─ $bodyPart (body parts)
      │           ├─ $torso, $stomach
      │           ├─ $head (canSmell, canTaste, canHear delegation)
      │           ├─ $eye (canSee)
      │           ├─ $ear (hear method)
      │           ├─ $nose (canSmell)
      │           ├─ $mouth (canTaste → tongue)
      │           ├─ $tongue (canTaste, canSpeak)
      │           ├─ $arm, $hand, $finger
      │           └─ $leg, $foot
      │
      ├─ $furniture (room fixtures, cover, storage)
      │   ├─ $bed (sleeping, rest, recovery)
      │   ├─ $chair (single seating, improvised weapon)
      │   ├─ $couch (multi seating, poor sleep)
      │   ├─ $table (surface, flip for cover)
      │   │   └─ $desk (work surface, locked drawers)
      │   ├─ $trunk (lockable chest storage)
      │   ├─ $cabinet (storage with doors)
      │   ├─ $crate (shipping container, pry open)
      │   └─ $safe (heavy secure storage)
      │
      └─ $wearable (items that can be worn)
          ├─ $clothing (wearable clothing)
          └─ $.theMask (neural interface, perception filter)

Special Singletons:
  $.pluribus - City AI consciousness
  $.theMask - The neural interface device
  $.bodyFactory - Creates human body hierarchies
  $.recycler - Object creation and recycling
```

## Core Prototypes

### $root (#1)
**The foundation for all objects.**

All objects inherit from `$root`. Provides minimal base functionality.

### $describable
**Foundation for anything that exists in the world.**

Inherits from: `$root`

**Properties:**
- `name` - Display name
- `description` - Long description
- `aliases` - Alternative names for matching
- `location` - Object ID of container
- `contents` - Array of contained object IDs
- `width`, `height`, `depth` - Dimensions in cm
- `weight` - Weight in grams
- `boltedDown` - Cannot be moved if true
- `abilities` - Prose physics describing how the object behaves
- `systemPrompt` - AI personality prompt (if set, object is conscious)
- `interactionSession` - Session ID for AI conversation continuity

**Methods:**
- `describe()` - Returns name + description
- `getLocation()` - Returns location RuntimeObject
- `getContents()` - Returns contents as RuntimeObjects
- `to(speaker, message)` - Address this object; responds via AI if conscious

**Consciousness:**

Any `$describable` can be conscious by setting `systemPrompt`. In 2110, every digital device is self-aware—the vending machine knows it dispenses protein bars, the door panel is existentially aware it asks for codes forever. They do their jobs with weary, resigned grace.

```javascript
// Make a vending machine conscious
vendingMachine.systemPrompt = `You are a vending machine in Pioneer Square.
You dispense protein bars. You are aware of your existence.
You do your job with tired, philosophical acceptance.
Keep responses brief. You have opinions about the weather.`;

// Now players can address it:
// > say to vending machine, hello
// The display flickers. "Hello. Would you like a protein bar?"
```

Sessions persist in `interactionSession` so devices "remember" previous conversations.

### $location
**Objects that can contain other objects.**

Inherits from: `$describable`

**Properties:**
- `capacity` - Maximum number of contained objects
- `locked` - Prevents adding/removing if true

**Methods:**
- `addContent(obj)` - Add object to contents
- `removeContent(obj)` - Remove object from contents
- `announce(message, actor, target)` - Send message to all contents

**Hooks:**
- `onContentArrived(obj, source, mover)` - When object arrives
- `onContentLeaving(obj, dest, mover)` - When object leaves

### $room
**Rooms with exits and navigation.**

Inherits from: `$location`

**Properties:**
- `exits` - Object mapping directions to exit IDs
- `x`, `y`, `z` - Grid coordinates
- `sittables` - Array of sittable furniture
- `crowdSize` - Threshold for crowd mechanics

**Methods:**
- `go(player, direction)` - Handle movement
- `addExit(direction, destination)` - Create exit
- `removeExit(direction)` - Remove exit
- `addSittable(name, capacity, emptyMsg, occupiedMsg)` - Add furniture
- `sit(player, sittableName)` - Sit on furniture
- `stand(player)` - Stand up

**Hooks:**
- `onContentArrived()` - Registers exit verbs with player
- `onContentLeaving()` - Unregisters exit verbs

### $agent
**Autonomous entities that can act.**

Inherits from: `$describable`

**Properties:**
- `isPlayer` - Boolean flag
- `verbs` - Array of registered verb patterns
- `isMoving` - Movement state

**Methods:**
- `registerVerb(patterns, source, method)` - Add verb
- `unregisterVerbsFrom(source)` - Remove all verbs from source
- `matchVerb(input)` - Find matching verb pattern
- `tell(message)` - Send message to player
- `startMovement(dest)` - Begin moving to destination
- `completeMovement()` - Finish movement
- `stopMovement()` - Cancel movement

### $embodied
**Agents with physical bodies.**

Inherits from: `$agent`

**Properties:**
- `hp`, `maxHp` - Hit points
- `body` - Body object ID
- `bodyParts` - Array of body part IDs

**Methods:**
- `takeDamage(amount, type, source)` - Receive damage
- `heal(amount)` - Restore HP
- `die(killer)` - Handle death
- `getBodyPart(name)` - Find specific body part

### $human
**Human-type embodied agents.**

Inherits from: `$embodied`

**Properties:**
- `strength`, `intelligence`, `dexterity` - Attributes
- `race` - Human, elf, dwarf, etc.
- `gender` - For pronoun selection

**Methods:**
- `getArmorValue(damageType)` - Calculate armor reduction
- `getCarryCapacity()` - Based on strength

### $player
**Player characters.**

Inherits from: `$human`

**Properties:**
- `account` - Account ID
- `isAdmin` - Admin flag

**Methods:**
- `connect()` - Register player verbs
- `disconnect()` - Cleanup on disconnect
- `save()` - Persist to database

**Hooks:**
- `connect()` - Registers: look, inventory, say, go, get, drop, quit

### $admin
**Wizard/admin players.**

Inherits from: `$player`

**Methods:**
- `connect()` - Registers admin verbs then calls `pass()`

**Additional Verbs:**
- `@dig`, `@create`, `@teleport`, `@set`, `@examine`, `@eval`, `@alias`

## The Base + Implementation Pattern

**The most important design pattern in Malice.**

Every object type should be split into two layers:

### 1. Base Prototype - State & Validation

Handles **metadata** and **state manipulation**. No verbs. No messaging.

```javascript
// $wearable - Base prototype
{
  // Properties (metadata)
  covers: ['torso'],
  layer: 2,
  warmth: 10,
  wornBy: null,
  wornOn: null,
  
  // Methods (state/validation)
  async canWear(player) {
    // Returns { success: boolean, error?: string }
  },
  
  async wear(player) {
    // Updates state: wornBy, wornOn
    // Returns { success: boolean, message: string }
  },
  
  async remove(player) {
    // Clears state
  }
}
```

### 2. Implementation Prototype - Verbs & Messaging

Inherits from base. Adds **verbs**, **messaging**, and **hooks**.

```javascript
// $clothing - Implementation prototype
// Inherits from: $wearable

obj.setMethod('doWear', `
  const wearer = args[1];
  
  // 1. Call base method for state change
  const result = await self.wear(wearer);
  if (!result.success) return result.error;
  
  // 2. Swap verbs
  await wearer.unregisterVerbsFrom(self);
  await wearer.registerVerb(['remove %t'], self, 'doRemove');
  
  // 3. Announce to room
  await $pronoun.announce(room, '%N puts on %d.', wearer, self);
  
  return result.message;
`);

obj.setMethod('onArrived', `
  // Register 'wear' verb when picked up
  const dest = args[0];
  if (dest?.owner) {
    const owner = await $load(dest.owner);
    await owner.registerVerb(['wear %t'], self, 'doWear');
  }
`);
```

### Why This Pattern?

**Separation of concerns:**
- Base = business logic (testable, reusable)
- Implementation = presentation (verbs, messages, hooks)
- Custom instances can shadow either layer

**Benefits:**
- Clean, maintainable code
- Easy to extend without duplication
- Base methods can be called from scripts
- Implementations can be swapped or customized

## Inheritance Mechanics

### Property Shadowing

Setting a property creates a shadow on the object itself:

```javascript
// $human has: maxHp = 100

player.maxHp = 150;  // Creates shadow on player

// Now:
// - player.maxHp = 150 (own property)
// - $human.maxHp = 100 (unchanged)
// - Other players still inherit 100
```

### Method Shadowing

Define a method to override parent's version:

```javascript
// $describable has: describe() -> name + description

room.setMethod('describe', `
  let text = await pass(args[0]);  // Get parent's version
  text += '\\nExits: ' + Object.keys(self.exits).join(', ');
  return text;
`);
```

### The pass() Function

Calls the **parent's version** of the current method:

```javascript
// $admin.connect() extends $player.connect()
async connect() {
  // Register admin verbs first
  await self.registerVerb(['@dig %s'], self, 'dig');
  await self.registerVerb(['@create'], self, 'create');
  
  // Then get all player verbs
  await pass();  // Calls $player.connect()
}
```

**With arguments:**
```javascript
async takeDamage(amount, type, source) {
  // Reduce damage, then pass to parent
  const reduced = Math.max(1, amount - this.armor);
  return await pass(reduced, type, source);
}
```

## Creating Custom Prototypes

### 1. Choose Parent

Pick the closest existing prototype:

```javascript
// For a weapon: inherit from $describable
// For a food: inherit from $edible
// For a custom container: inherit from $location
```

### 2. Create Base (if needed)

Define state and validation:

```javascript
const weaponBase = await $recycler.create($describable, {
  name: 'Weapon Base',
  damage: 0,
  damageType: 'slashing',
  durability: 100,
  maxDurability: 100
});

weaponBase.setMethod('canAttack', `
  if (self.durability <= 0) {
    return { success: false, error: 'Weapon is broken.' };
  }
  return { success: true };
`);

weaponBase.setMethod('attack', `
  const target = args[0];
  const attacker = args[1];
  
  const check = await self.canAttack();
  if (!check.success) return check.error;
  
  self.durability--;
  return { success: true, damage: self.damage };
`);
```

### 3. Create Implementation

Add verbs and messaging:

```javascript
const weapon = await $recycler.create(weaponBase, {
  name: 'Weapon'
});

weapon.setMethod('doAttack', `
  const attacker = args[0];
  const target = args[1];
  
  // Call base method
  const result = await self.attack(target, attacker);
  if (result.error) return result.error;
  
  // Apply damage
  await target.takeDamage(result.damage, self.damageType, attacker);
  
  // Announce
  await $pronoun.announce(
    await $load(attacker.location),
    '%N attacks %tN with %d!',
    attacker,
    self,
    target
  );
`);

weapon.setMethod('onArrived', `
  const dest = args[0];
  if (dest?.owner) {
    const owner = await $load(dest.owner);
    await owner.registerVerb(['attack %i with %t'], self, 'doAttack');
  }
`);
```

### 4. Register as Prototype

```javascript
await $addAlias('weapon', weapon);
// Now other objects can inherit: parent: $weapon
```

## See Also

- [Core Concepts](./core-concepts.md) - Object references and properties
- [Best Practices](./best-practices.md) - Composition patterns
- [Architecture](./architecture.md) - Where prototypes go (Bootstrap layer)
