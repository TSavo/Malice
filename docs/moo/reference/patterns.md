# Common Patterns

Reusable code patterns for common tasks in Malice MOO programming.

## Object Creation & Placement

### Create and Place Item

```javascript
async createAndPlace(proto, props, location) {
  const obj = await $.recycler.create(proto, props);
  await obj.moveTo(location);
  return obj;
}

// Usage
const sword = await createAndPlace($.weapon, 
  { name: 'iron sword', damage: 10 },
  room
);
```

### Create Multiple Items

```javascript
async createItemSet(itemDefs, location) {
  const created = [];
  
  for (const def of itemDefs) {
    const item = await $.recycler.create(def.proto, def.props);
    await item.moveTo(location);
    created.push(item);
  }
  
  return created;
}

// Usage
const items = await createItemSet([
  { proto: $.weapon, props: { name: 'sword' } },
  { proto: $.armor, props: { name: 'shield' } },
  { proto: $.food, props: { name: 'bread' } }
], room);
```

### Spawn Loot Table

```javascript
async spawnLoot(lootTable, location) {
  const spawned = [];
  
  for (const entry of lootTable) {
    if (Math.random() < entry.chance) {
      const item = await $.recycler.create(entry.proto, entry.props);
      await item.moveTo(location);
      spawned.push(item);
    }
  }
  
  return spawned;
}

// Usage
const loot = await spawnLoot([
  { proto: $.weapon, props: { name: 'rusty sword' }, chance: 0.5 },
  { proto: $.gold, props: { amount: 10 }, chance: 0.8 },
  { proto: $.potion, props: { name: 'health potion' }, chance: 0.3 }
], chest);
```

## Movement & Transfer

### Safe Movement with Feedback

```javascript
async tryMove(item, dest, mover) {
  try {
    await item.moveTo(dest, mover);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Usage
const result = await tryMove(sword, player.hand, player);
if (result.success) {
  await player.tell('You pick up the sword.');
} else {
  await player.tell(result.error);
}
```

### Transfer All Contents

```javascript
async transferAll(from, to, mover) {
  const items = [...from.contents];
  const results = [];
  
  for (const item of items) {
    const result = await tryMove(item, to, mover);
    results.push({ item: item.name, ...result });
  }
  
  return results;
}

// Usage
const results = await transferAll(oldChest, newChest, player);
const succeeded = results.filter(r => r.success);
await player.tell(`Transferred ${succeeded.length} items.`);
```

### Find and Move Item

```javascript
async findAndMove(container, itemName, dest, mover) {
  const item = container.contents.find(obj =>
    obj.name === itemName || obj.aliases?.includes(itemName)
  );
  
  if (!item) {
    return { success: false, error: 'Item not found.' };
  }
  
  return await tryMove(item, dest, mover);
}
```

## Room & Environment

### Create Connected Rooms

```javascript
async createRoomPair(room1Data, room2Data, direction, oppositeDir) {
  const room1 = await $.recycler.create($.room, room1Data);
  const room2 = await $.recycler.create($.room, room2Data);
  
  // Create exits
  const exit1 = await $.recycler.create($.exit, {
    direction,
    destination: room2.id,
    source: room1.id
  });
  
  const exit2 = await $.recycler.create($.exit, {
    direction: oppositeDir,
    destination: room1.id,
    source: room2.id
  });
  
  room1.exits = room1.exits || {};
  room1.exits[direction] = exit1.id;
  
  room2.exits = room2.exits || {};
  room2.exits[oppositeDir] = exit2.id;
  
  return { room1, room2, exit1, exit2 };
}

// Usage
const { room1, room2 } = await createRoomPair(
  { name: 'Hall', description: 'A long hallway.' },
  { name: 'Room', description: 'A small room.' },
  'north',
  'south'
);
```

### Room Announcement to All

```javascript
async announceToRoom(room, message, exclude = []) {
  const excludeIds = exclude.map(obj => obj.id);
  
  for (const objId of room.contents || []) {
    if (excludeIds.includes(objId)) continue;
    
    const obj = await $.load(objId);
    if (obj?.tell) {
      await obj.tell(message);
    }
  }
}

// Usage
await announceToRoom(room, 'The ground shakes!', [player]);
```

### Get All Players in Room

```javascript
async getPlayersInRoom(room) {
  const players = [];
  
  for (const objId of room.contents || []) {
    const obj = await $.load(objId);
    if (obj?.isPlayer) {
      players.push(obj);
    }
  }
  
  return players;
}
```

## Verb Patterns

### Register Multiple Verb Patterns

```javascript
async registerVerbSet(player, verbs) {
  for (const verb of verbs) {
    await player.registerVerb(verb.patterns, verb.source, verb.method);
  }
}

// Usage
await registerVerbSet(player, [
  { patterns: ['look', 'l'], source: player, method: 'doLook' },
  { patterns: ['inventory', 'i'], source: player, method: 'doInventory' },
  { patterns: ['say %s', '"%s"'], source: player, method: 'doSay' }
]);
```

### Verb Swap on State Change

```javascript
async swapVerbs(player, source, oldVerbs, newVerbs) {
  await player.unregisterVerbsFrom(source);
  
  for (const verb of newVerbs) {
    await player.registerVerb(verb.patterns, source, verb.method);
  }
}

// Usage in doOpen
await swapVerbs(player, self,
  null,  // Don't need old verbs (unregisterVerbsFrom removes all)
  [{ patterns: ['close %t'], source: self, method: 'doClose' }]
);
```

## Messaging & Output

### Perspective-Aware Announcement

```javascript
async perspectiveAnnounce(room, actor, template, directObj, target) {
  for (const objId of room.contents || []) {
    const viewer = await $.load(objId);
    if (!viewer?.tell) continue;
    
    const msg = await $.pronoun.sub(
      template,
      actor,
      directObj,
      target,
      null,
      null,
      viewer
    );
    
    await viewer.tell(msg);
  }
}

// Usage
await perspectiveAnnounce(room, attacker, 
  '%N attacks %tN with %d!',
  weapon,
  victim
);
// Attacker: "You attack Bob with the sword!"
// Victim: "Jim attacks you with the sword!"
// Others: "Jim attacks Bob with the sword!"
```

### Multi-Sense Room Announcement

```javascript
async sensoryAnnounce(room, sensoryData) {
  for (const objId of room.contents || []) {
    const obj = await $.load(objId);
    if (!obj?.isPlayer) continue;
    
    if (sensoryData.visual && obj.see) {
      await obj.see(sensoryData.visual);
    }
    if (sensoryData.audio && obj.hear) {
      await obj.hear(sensoryData.audio);
    }
    if (sensoryData.smell && obj.smell) {
      await obj.smell(sensoryData.smell);
    }
  }
}

// Usage
await sensoryAnnounce(room, {
  visual: 'Lightning flashes!',
  audio: 'CRACK! Thunder roars!',
  smell: 'The air smells of ozone.'
});
```

### Format Item List

```javascript
async formatItemList(items, includeCount = false) {
  if (items.length === 0) return 'nothing';
  
  const names = items.map(item => item.name);
  
  if (includeCount) {
    // Group by name
    const counts = {};
    for (const name of names) {
      counts[name] = (counts[name] || 0) + 1;
    }
    
    const entries = Object.entries(counts).map(([name, count]) => {
      if (count === 1) return name;
      return `${count} ${await $.english.plural(name)}`;
    });
    
    return await $.format.prose(entries);
  }
  
  return await $.format.prose(names);
}

// Usage
const inv = await formatItemList(player.inventory, true);
await player.tell('You are carrying: ' + inv);
// "You are carrying: sword, 3 apples, and shield"
```

## Property Manipulation

### Deep Copy Properties

```javascript
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepCopy);
  
  const copy = {};
  for (const [key, value] of Object.entries(obj)) {
    copy[key] = deepCopy(value);
  }
  return copy;
}

// Usage
const original = { stats: { hp: 100, mp: 50 }, items: ['sword'] };
const copy = deepCopy(original);
copy.stats.hp = 200;  // Doesn't affect original
```

### Merge Properties with Defaults

```javascript
function withDefaults(props, defaults) {
  return { ...defaults, ...props };
}

// Usage
const itemProps = withDefaults(userProps, {
  weight: 1,
  value: 0,
  durability: 100,
  description: 'An item.'
});
```

### Safe Property Access

```javascript
function getProperty(obj, path, defaultValue) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current?.[key] === undefined) return defaultValue;
    current = current[key];
  }
  
  return current;
}

// Usage
const damage = getProperty(weapon, 'stats.damage', 0);
const ownerName = getProperty(item, 'owner.name', 'nobody');
```

## Search & Filter

### Find Item by Name or Alias

```javascript
function findItem(container, searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  
  return container.contents.find(obj =>
    obj.name.toLowerCase() === searchTerm ||
    obj.aliases?.some(alias => alias.toLowerCase() === searchTerm)
  );
}

// Usage
const item = findItem(room, 'sword');
const item2 = findItem(player.inventory, 'blade');  // Might be sword's alias
```

### Fuzzy Search

```javascript
function fuzzyFind(container, searchTerm) {
  searchTerm = searchTerm.toLowerCase();
  
  // Exact match first
  let found = container.contents.find(obj =>
    obj.name.toLowerCase() === searchTerm
  );
  if (found) return found;
  
  // Alias match
  found = container.contents.find(obj =>
    obj.aliases?.some(alias => alias.toLowerCase() === searchTerm)
  );
  if (found) return found;
  
  // Partial match
  found = container.contents.find(obj =>
    obj.name.toLowerCase().includes(searchTerm)
  );
  
  return found;
}
```

### Filter by Type

```javascript
async filterByType(container, typeName) {
  const results = [];
  
  for (const objId of container.contents || []) {
    const obj = await $.load(objId);
    if (obj.type === typeName) {
      results.push(obj);
    }
  }
  
  return results;
}

// Usage
const weapons = await filterByType(room, 'weapon');
const food = await filterByType(chest, 'food');
```

## Timing & Scheduling

### Delayed Action

```javascript
async doAfterDelay(delayMs, target, method, ...args) {
  const jobName = `delayed_${Date.now()}_${Math.random()}`;
  
  await $.scheduler.schedule(
    jobName,
    delayMs,
    0,  // One-shot
    target,
    method,
    ...args
  );
  
  return jobName;
}

// Usage
await doAfterDelay(5000, player, 'tell', 'Time is up!');
```

### Repeating Action with Condition

```javascript
async repeatWhile(intervalMs, target, method, conditionMethod) {
  const jobName = `repeat_${target.id}_${Date.now()}`;
  
  target.setMethod('_repeatCheck_' + jobName, `
    if (await self.${conditionMethod}()) {
      await self.${method}();
    } else {
      await $.scheduler.unschedule('${jobName}');
    }
  `);
  
  await $.scheduler.schedule(
    jobName,
    0,
    intervalMs,
    target,
    '_repeatCheck_' + jobName
  );
  
  return jobName;
}

// Usage
// Heal player every 5 seconds while in combat
await repeatWhile(5000, player, 'regenerate', 'isInCombat');
```

### Cooldown Manager

```javascript
async setCooldown(obj, name, durationMs) {
  obj.cooldowns = obj.cooldowns || {};
  obj.cooldowns[name] = Date.now() + durationMs;
}

function isOnCooldown(obj, name) {
  if (!obj.cooldowns?.[name]) return false;
  return Date.now() < obj.cooldowns[name];
}

function getCooldownRemaining(obj, name) {
  if (!obj.cooldowns?.[name]) return 0;
  return Math.max(0, obj.cooldowns[name] - Date.now());
}

// Usage
if (isOnCooldown(player, 'fireball')) {
  const remaining = Math.ceil(getCooldownRemaining(player, 'fireball') / 1000);
  return `Fireball is on cooldown for ${remaining} more seconds.`;
}

await castFireball(player, target);
await setCooldown(player, 'fireball', 30000);  // 30 second cooldown
```

## State Management

### State Machine Pattern

```javascript
class StateMachine {
  constructor(obj, initialState) {
    this.obj = obj;
    this.obj.state = initialState;
    this.transitions = {};
  }
  
  addTransition(fromState, toState, condition) {
    if (!this.transitions[fromState]) {
      this.transitions[fromState] = [];
    }
    this.transitions[fromState].push({ toState, condition });
  }
  
  async update() {
    const current = this.obj.state;
    const possible = this.transitions[current] || [];
    
    for (const trans of possible) {
      if (await trans.condition(this.obj)) {
        this.obj.state = trans.toState;
        return true;
      }
    }
    
    return false;
  }
}

// Usage
const sm = new StateMachine(npc, 'idle');
sm.addTransition('idle', 'alert', async (obj) => obj.seesEnemy);
sm.addTransition('alert', 'combat', async (obj) => obj.inRange);
sm.addTransition('combat', 'idle', async (obj) => !obj.seesEnemy);

// In tick method
await sm.update();
```

### Flag-Based State

```javascript
function hasFlag(obj, flag) {
  return obj.flags?.includes(flag) || false;
}

function addFlag(obj, flag) {
  obj.flags = obj.flags || [];
  if (!obj.flags.includes(flag)) {
    obj.flags.push(flag);
  }
}

function removeFlag(obj, flag) {
  if (!obj.flags) return;
  obj.flags = obj.flags.filter(f => f !== flag);
}

// Usage
addFlag(player, 'poisoned');
addFlag(player, 'invisible');

if (hasFlag(player, 'poisoned')) {
  await player.takeDamage(5);
}

removeFlag(player, 'invisible');
```

## Async Patterns

### Parallel Loading

```javascript
async loadMultiple(ids) {
  return await Promise.all(ids.map(id => $.load(id)));
}

// Usage
const [room, player, item] = await loadMultiple([roomId, playerId, itemId]);
```

### Sequential with Progress

```javascript
async processSequential(items, processFn, progressCallback) {
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    const result = await processFn(items[i]);
    results.push(result);
    
    if (progressCallback) {
      await progressCallback(i + 1, items.length);
    }
  }
  
  return results;
}

// Usage
await processSequential(
  containers,
  async (c) => await c.sortContents(),
  async (current, total) => {
    await player.tell(`Processing ${current}/${total}...`);
  }
);
```

### Batch Operations

```javascript
async batchProcess(items, batchSize, processFn) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(processFn)
    );
    results.push(...batchResults);
  }
  
  return results;
}

// Usage
const descriptions = await batchProcess(
  room.contents,
  10,  // Process 10 at a time
  async (obj) => await obj.describe()
);
```

## Error Handling

### Try-Catch with Logging

```javascript
async safeCall(fn, context, errorHandler) {
  try {
    return await fn();
  } catch (error) {
    console.error(`Error in ${context}:`, error.message);
    if (errorHandler) {
      return await errorHandler(error);
    }
    throw error;
  }
}

// Usage
await safeCall(
  async () => await dangerousOperation(),
  'dangerousOperation',
  async (error) => {
    await player.tell('Operation failed: ' + error.message);
    return null;
  }
);
```

### Retry Pattern

```javascript
async retry(fn, maxAttempts = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// Usage
const result = await retry(
  async () => await unreliableOperation(),
  3,
  2000
);
```

## Validation

### Validate Properties

```javascript
function validateProps(props, schema) {
  const errors = [];
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = props[key];
    
    if (rules.required && value === undefined) {
      errors.push(`${key} is required`);
    }
    
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${key} must be a ${rules.type}`);
    }
    
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${key} must be at least ${rules.min}`);
    }
    
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${key} must be at most ${rules.max}`);
    }
  }
  
  return errors;
}

// Usage
const errors = validateProps(itemProps, {
  name: { required: true, type: 'string' },
  weight: { required: true, type: 'number', min: 0 },
  durability: { type: 'number', min: 0, max: 100 }
});

if (errors.length > 0) {
  throw new Error('Validation failed: ' + errors.join(', '));
}
```

## See Also

- [Best Practices](../best-practices.md) - Coding conventions
- [Utilities](../utilities/) - Utility documentation
- [Advanced Topics](../advanced/) - Detailed guides
