# $.memento - Object Cloning

Use `$.memento` to serialize object graphs and create clones with new IDs. Perfect for body templates, equipment sets, or any object tree that needs duplication.

## Purpose

Provides deep cloning of object graphs with automatic reference remapping. Serializes objects to JSON for templating, then rehydrates with fresh IDs while preserving internal structure.

## Why Use This?

**Bad: Manual cloning nightmare**
```javascript
async function cloneBody(body) {
  const newBody = await $.recycler.create(body.parent);
  newBody.name = body.name;
  newBody.hp = body.hp;
  // ... copy 20 more properties ...

  const newParts = {};
  for (const partId of body.parts) {
    const part = await $.load(partId);
    const newPart = await $.recycler.create(part.parent);
    newPart.name = part.name;
    newPart.owner = newBody.id;  // Update reference!
    // ... copy properties ...

    // Nested parts? Recursive nightmare...
    for (const childId of part.children || []) {
      // ... another 20 lines of recursive cloning ...
    }
    newParts[part.name] = newPart.id;
  }
  newBody.parts = Object.values(newParts);
  return newBody;
}
```

**Good: Automatic graph cloning**
```javascript
async function cloneBody(body, ...allParts) {
  const clones = await $.memento.clone([body, ...allParts]);
  return clones['%0']; // New body with all internal refs updated
}
```

## What $.memento Handles

- ✅ Deep object graph traversal
- ✅ Internal reference remapping (part.owner -> new body ID)
- ✅ External reference preservation (prototype stays same)
- ✅ New ID allocation for every cloned object
- ✅ Property copying

## How It Works

- **capture()** - Serializes objects to JSON, replacing in-graph IDs with placeholders
- **rehydrate()** - Creates new objects from serialized data with fresh IDs
- **Objects in the array** = "in-graph" -> get new IDs
- **Objects outside the array** = "external" -> IDs preserved

## API Reference

### clone() - One-Step Cloning

```javascript
await $.memento.clone(objects)
```

Clones all objects in array with fresh IDs.

| Parameter | Type | Description |
|-----------|------|-------------|
| `objects` | RuntimeObject[] | Array of objects to clone |

**Returns:** Object mapping `{ '%0': newObj1, '%1': newObj2, ... }`

**Examples:**
```javascript
// Clone a single object
const clone = await $.memento.clone([original]);
const newObj = clone['%0']; // %0 is first object

// Clone a connected tree (body with parts)
const clones = await $.memento.clone([body, head, leftArm, rightArm]);
// clones['%0'] = new body, clones['%1'] = new head, etc.
// Internal references updated to point to new objects
```

### capture() - Serialize to JSON

```javascript
await $.memento.capture(objects)
```

Serializes objects to JSON string (for templates/storage).

**Examples:**
```javascript
// Capture to JSON
const template = await $.memento.capture([body, head, leftArm, rightArm]);
// template is a JSON string

// Store the template
prototype.bodyTemplate = template;
```

### rehydrate() - Create from JSON

```javascript
await $.memento.rehydrate(jsonString)
```

Creates new objects from captured JSON.

**Examples:**
```javascript
// Later: create instances from template
const newParts = await $.memento.rehydrate(prototype.bodyTemplate);
const newBody = newParts['%0'];
```

## Real-World Examples

### Body Template System

```javascript
// Create a human body template once
async createHumanTemplate() {
  const body = await $.recycler.create($.body, {
    name: 'human body',
    hp: 100,
    maxHp: 100
  });
  
  const head = await $.recycler.create($.bodypart, {
    name: 'head',
    owner: body,
    canEat: true,
    canSee: true,
    canHear: true
  });
  
  const torso = await $.recycler.create($.bodypart, {
    name: 'torso',
    owner: body,
    canBreathe: true
  });
  
  const leftArm = await $.recycler.create($.bodypart, {
    name: 'left arm',
    owner: body,
    canGrasp: true
  });
  
  const rightArm = await $.recycler.create($.bodypart, {
    name: 'right arm',
    owner: body,
    canGrasp: true
  });
  
  body.parts = [head.id, torso.id, leftArm.id, rightArm.id];
  
  // Capture as template
  const template = await $.memento.capture([body, head, torso, leftArm, rightArm]);
  $.human.bodyTemplate = template;
  
  // Clean up originals
  await $.recycler.recycle(body);
}

// Create a new player body from template
async createPlayerBody(player) {
  const clones = await $.memento.rehydrate($.human.bodyTemplate);
  const body = clones['%0'];
  
  // Customize for this player
  body.name = player.name + "'s body";
  body.owner = player;
  
  player.body = body;
  return body;
}
```

### Equipment Set Duplication

```javascript
// Clone entire equipment set
async duplicateEquipmentSet(originalSet) {
  const items = [];
  for (const itemId of originalSet.items) {
    items.push(await $.load(itemId));
  }
  
  // Clone all items at once
  const clones = await $.memento.clone(items);
  
  // Create new set with cloned items
  const newSet = await $.recycler.create($.equipmentSet, {
    name: originalSet.name + ' (copy)',
    items: Object.values(clones).map(c => c.id)
  });
  
  return newSet;
}
```

### Room Prefab System

```javascript
// Create room prefab with furniture
async createRoomPrefab(name, description, furnitureList) {
  const room = await $.recycler.create($.room, { name, description });
  const furniture = [];
  
  for (const item of furnitureList) {
    const obj = await $.recycler.create($.furniture, item);
    obj.location = room;
    room.contents.push(obj);
    furniture.push(obj);
  }
  
  // Save as prefab
  const prefab = await $.memento.capture([room, ...furniture]);
  $.prefabs[name] = prefab;
  
  // Clean up originals
  await $.recycler.recycleTree(room);
}

// Spawn room from prefab
async spawnRoom(prefabName, coordinates) {
  const clones = await $.memento.rehydrate($.prefabs[prefabName]);
  const room = clones['%0'];
  
  room.x = coordinates.x;
  room.y = coordinates.y;
  room.z = coordinates.z;
  
  return room;
}
```

### NPC Clone Factory

```javascript
// Create many NPCs from one template
async spawnNPCs(template, count) {
  const npcs = [];
  
  for (let i = 0; i < count; i++) {
    const clones = await $.memento.rehydrate(template);
    const npc = clones['%0'];
    
    // Randomize attributes
    npc.name = npc.name + ' ' + (i + 1);
    npc.hp = Math.floor(Math.random() * 50) + 50;
    
    npcs.push(npc);
  }
  
  return npcs;
}
```

### Spell/Item Instancing

```javascript
// Clone spell effect with all components
async castClone(caster, target) {
  // Clone caster's item
  const original = await $.load(caster.equipment.weapon);
  const clones = await $.memento.clone([original]);
  const duplicate = clones['%0'];
  
  // Give to target
  duplicate.location = target;
  target.inventory.push(duplicate);
  
  await $.pronoun.announce(
    await $.load(caster.location),
    '%N creates a duplicate of %d for %tN!',
    caster,
    original,
    target
  );
}
```

## What Gets Captured

```javascript
// Objects in the array = "in-graph" -> get new IDs
const clones = await $.memento.clone([body, arm]);
// body.owner = #123 (external) -> stays #123
// arm.owner = body (in-graph) -> updated to new body's ID
```

**In-graph references** (pointing to objects in the clone array):
- Get remapped to new IDs
- Maintain relationships within cloned structure

**External references** (pointing to objects NOT in the clone array):
- Stay as original IDs
- Link to shared prototypes/systems

## Tips & Best Practices

1. **Use for templates** - Create once, clone many times
2. **Capture hierarchies** - Include all related objects in array
3. **External refs stay** - Prototypes and shared objects aren't duplicated
4. **Store as JSON** - Templates persist across server restarts
5. **Clone complex structures** - Bodies, equipment sets, rooms with furniture
6. **Test references** - Verify internal refs point to clones, external to originals

## Common Patterns

### Template Storage

```javascript
// Create template
const template = await $.memento.capture([obj1, obj2]);
$.templates.myTemplate = template;

// Use template
const clones = await $.memento.rehydrate($.templates.myTemplate);
```

### One-Time Clone

```javascript
// Quick clone without storing
const clones = await $.memento.clone([original]);
const copy = clones['%0'];
```

### Multi-Instance Spawning

```javascript
// Spawn many from one template
for (let i = 0; i < 10; i++) {
  const clones = await $.memento.rehydrate(template);
  // Customize each clone...
}
```

## See Also

- [$.recycler](./recycler.md) - Object creation and lifecycle
- [Core Concepts](../core-concepts.md) - Object references
- [Architecture](../architecture.md) - Template systems
