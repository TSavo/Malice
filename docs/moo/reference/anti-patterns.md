# Anti-Patterns

Common mistakes to avoid when programming in Malice MOO.

## Object Creation & Destruction

### ❌ Bypassing $.recycler

```javascript
// WRONG - breaks pooling
const obj = await manager.create({ parent: 1 });

// RIGHT
const obj = await $.recycler.create($.item);
```

**Why it's bad:**
- No object ID pooling (memory bloat)
- No recycling support
- No creation hooks called
- Breaks cleanup systems

### ❌ Manual Object Deletion

```javascript
// WRONG - catastrophic data corruption
delete objects[obj.id];
obj.location = null;
room.contents = room.contents.filter(o => o !== obj);

// RIGHT
await $.recycler.recycle(obj);
```

**Why it's bad:**
- Orphaned references everywhere
- Contents left floating
- Verbs not unregistered
- Database inconsistency
- No cascade to children

### ❌ Using purge() Instead of recycle()

```javascript
// WRONG - prevents ID reuse
await $.recycler.purge(obj);

// RIGHT - enables pooling
await $.recycler.recycle(obj);
```

**Why it's bad:**
- Object IDs never reused
- Database bloats over time
- Can't undo deletion
- No benefit over recycle()

## Movement & Contents

### ❌ Direct Contents Manipulation

```javascript
// WRONG - breaks verb registration
room.contents.push(item);
room.contents = [...room.contents, item];
item.location = room;

// RIGHT
await item.moveTo(room);
```

**Why it's bad:**
- Hooks never called
- Verbs not registered/unregistered
- Location property inconsistent
- Contents array out of sync

### ❌ Forgetting Mover Context

```javascript
// WRONG - no context for who caused movement
await item.moveTo(dest);

// RIGHT
await item.moveTo(dest, player);
```

**Why it's bad:**
- Can't track who moved what
- Hooks can't distinguish intentional vs automatic movement
- Logging incomplete

### ❌ Moving During Iteration

```javascript
// WRONG - modifies array while iterating
for (const item of room.contents) {
  await item.moveTo(otherRoom);  // Changes room.contents!
}

// RIGHT - copy first
const items = [...room.contents];
for (const item of items) {
  await item.moveTo(otherRoom);
}
```

**Why it's bad:**
- Skip items
- Crash on undefined
- Unpredictable behavior

## Verbs & Commands

### ❌ Verbs in Base Prototypes

```javascript
// WRONG - every wearable has the same verb message
$.wearable.setMethod('doWear', `
  await player.tell('You put it on.');  // Generic!
`);

// RIGHT - verbs in implementation layer
$.clothing.setMethod('doWear', `
  await player.tell('You put on the ' + self.name + '.');
`);
```

**Why it's bad:**
- Can't customize per type
- Duplicate verbs on all children
- Messages don't make sense
- Violates Base+Implementation pattern

### ❌ Not Unregistering Verbs

```javascript
// WRONG - verb stays registered after item dropped
async doWear() {
  // ... wear logic ...
  // (forgot to unregister in onLeaving)
}

// RIGHT - unregister in hooks
obj.setMethod('onLeaving', `
  if (args[1]?.owner) {
    const owner = await $.load(args[1].owner);
    await owner.unregisterVerbsFrom(self);
  }
`);
```

**Why it's bad:**
- Verbs available when they shouldn't be
- Tab completion shows invalid commands
- Can invoke verbs on items you don't have

### ❌ Hardcoded Verb Patterns

```javascript
// WRONG - only one way to invoke
await player.registerVerb(['wear sword'], self, 'doWear');

// RIGHT - use %t for "this object"
await player.registerVerb(['wear %t', 'put on %t'], self, 'doWear');
```

**Why it's bad:**
- Pattern only works for one specific item name
- Changing item name breaks verb
- No flexibility for players

## Messaging & Output

### ❌ Manual String Building

```javascript
// WRONG - breaks perspective, no grammar
const msg = actor.name + ' pick up the ' + item.name + '.';
room.announce(msg);

// RIGHT
await $.pronoun.announce(room, '%N %v{pick} up %d.', actor, item);
```

**Why it's bad:**
- No perspective change (actor sees "Bob picks up...")
- No verb conjugation
- No article handling (a/an/the)
- Duplicates utility logic

### ❌ Using tell() for Diegetic Events

```javascript
// WRONG - bypasses sensory system
await player.tell('You see the door slam shut.');
await player.tell('You hear a loud bang.');

// RIGHT
await player.see('The door slams shut.');
await player.hear('BANG!');
```

**Why it's bad:**
- Blind players "see" things
- Deaf players "hear" things
- No consciousness checks
- Breaks immersion

### ❌ Inline Grammar Logic

```javascript
// WRONG - duplicates $.english
const verb = count === 1 ? 'falls' : 'fall';
const article = /^[aeiou]/i.test(name) ? 'an' : 'a';
const plural = name.endsWith('s') ? name : name + 's';

// RIGHT
const verb = await $.format.verb('fall', count);
const article = await $.english.article(name);
const plural = await $.english.plural(name);
```

**Why it's bad:**
- Duplicate logic everywhere
- Doesn't handle irregular forms
- Harder to maintain
- Violates Golden Rule (compose, don't duplicate)

## Properties & State

### ❌ Not Using pass()

```javascript
// WRONG - completely replaces parent behavior
$.admin.setMethod('connect', `
  await self.registerVerb(['@dig'], self, 'dig');
  // Forgot to call parent - player verbs never registered!
`);

// RIGHT
$.admin.setMethod('connect', `
  await self.registerVerb(['@dig'], self, 'dig');
  await pass();  // Get all parent verbs too
`);
```

**Why it's bad:**
- Loses all parent functionality
- Have to duplicate parent's code
- Breaks when parent changes

### ❌ Modifying Parent Properties

```javascript
// WRONG - affects all objects
$.human.maxHp = 200;  // Now ALL humans have 200 HP!

// RIGHT - shadow on instance
player.maxHp = 200;  // Only this player has 200 HP
```

**Why it's bad:**
- Changes affect all children
- Can't have per-instance customization
- Hard to debug unexpected changes

### ❌ Using Parent for Instance Data

```javascript
// WRONG - storing instance data on prototype
$.room.occupants = [player1, player2];  // Shared by ALL rooms!

// RIGHT - each instance has own data
room.occupants = [player1, player2];  // Just this room
```

**Why it's bad:**
- All instances share the same data
- Race conditions
- Data leaks between instances

## Async & Promises

### ❌ Forgetting await

```javascript
// WRONG - room is a Promise, not an object
const room = $.load(42);
room.name;  // undefined!

// RIGHT
const room = await $.load(42);
room.name;  // "Town Square"
```

**Why it's bad:**
- Objects are undefined
- Silent failures
- Hard to debug

### ❌ Sequential When Parallel is Possible

```javascript
// WRONG - slow, loads one at a time
const room = await $.load(roomId);
const player = await $.load(playerId);
const item = await $.load(itemId);

// RIGHT - fast, loads in parallel
const [room, player, item] = await Promise.all([
  $.load(roomId),
  $.load(playerId),
  $.load(itemId)
]);
```

**Why it's bad:**
- Unnecessary waiting
- Poor performance
- Scales badly

### ❌ Fire-and-Forget Without Error Handling

```javascript
// WRONG - errors silently swallowed
player.tell('Hello');  // No await - if it fails, you'll never know

// RIGHT
await player.tell('Hello');  // Errors propagate
```

**Why it's bad:**
- Errors disappear
- Hard to debug
- Silent failures

## Logic & Control Flow

### ❌ If/Else Chains for Proportional Values

```javascript
// WRONG - unmaintainable if/else chains
let status;
if (hp === 0) status = 'dead';
else if (hp < 10) status = 'critical';
else if (hp < 25) status = 'wounded';
else if (hp < 50) status = 'hurt';
else if (hp < 75) status = 'scratched';
else status = 'healthy';

// RIGHT
const status = await $.proportional.sub(
  ['dead', 'critical', 'wounded', 'hurt', 'scratched', 'healthy'],
  hp, maxHp
);
```

**Why it's bad:**
- Hard to maintain
- Edge case bugs
- Duplicate logic everywhere
- Violates Golden Rule

### ❌ Magic Numbers

```javascript
// WRONG - what do these numbers mean?
if (player.hp < 20 && player.strength > 15) {
  player.canLift = true;
}

// RIGHT
const LOW_HP_THRESHOLD = 20;
const MIN_STRENGTH_TO_LIFT = 15;

if (player.hp < LOW_HP_THRESHOLD && player.strength > MIN_STRENGTH_TO_LIFT) {
  player.canLift = true;
}
```

**Why it's bad:**
- Unclear intent
- Hard to change
- Easy to use wrong value

### ❌ Global State

```javascript
// WRONG - global variables
let currentRound = 1;
let combatants = [];

// RIGHT - state on objects
combat.round = 1;
combat.combatants = [];
```

**Why it's bad:**
- Race conditions
- Memory leaks
- Can't have multiple concurrent instances
- Hard to test

## Performance

### ❌ Loading in Loops

```javascript
// WRONG - loads same object many times
for (let i = 0; i < 100; i++) {
  const room = await $.load(roomId);  // Loads 100 times!
  await room.doSomething();
}

// RIGHT - load once
const room = await $.load(roomId);
for (let i = 0; i < 100; i++) {
  await room.doSomething();
}
```

**Why it's bad:**
- Unnecessary database queries
- Slow performance
- Wastes resources

### ❌ Not Using Object Cache

```javascript
// WRONG - bypasses cache
const obj = await manager.getFromDatabase(id);

// RIGHT - uses cache
const obj = await $.load(id);
```

**Why it's bad:**
- Duplicate objects in memory
- Inconsistent state
- Poor performance

### ❌ Blocking Operations in Tight Loops

```javascript
// WRONG - sequential processing
for (const item of manyItems) {
  await item.process();  // Wait for each one
}

// RIGHT - batch or parallel
await Promise.all(
  manyItems.map(item => item.process())
);
```

**Why it's bad:**
- Slow, linear scaling
- Blocks entire server
- Poor user experience

## Error Handling

### ❌ Swallowing Errors

```javascript
// WRONG - error disappears
try {
  await dangerousOperation();
} catch (e) {
  // Nothing - error lost!
}

// RIGHT
try {
  await dangerousOperation();
} catch (e) {
  console.error('Operation failed:', e);
  await player.tell('Something went wrong.');
  // Or re-throw if can't recover
}
```

**Why it's bad:**
- Can't debug problems
- Silent failures
- Corrupted state

### ❌ Generic Error Messages

```javascript
// WRONG - not helpful
throw new Error('Failed');

// RIGHT
throw new Error('Cannot open container: it is locked.');
```

**Why it's bad:**
- Player doesn't know what went wrong
- Hard to debug
- Poor user experience

### ❌ Not Handling Expected Failures

```javascript
// WRONG - no handling for common failures
const item = room.contents.find(o => o.name === name);
item.use();  // Crashes if not found!

// RIGHT
const item = room.contents.find(o => o.name === name);
if (!item) {
  return 'You don\\'t see that here.';
}
await item.use();
```

**Why it's bad:**
- Crashes on normal cases
- Poor error messages
- Bad user experience

## Testing & Debugging

### ❌ No Logging

```javascript
// WRONG - silent operation
async complexMethod() {
  // 100 lines of logic
  // No visibility into what's happening
}

// RIGHT
async complexMethod() {
  console.log('complexMethod: starting');
  // ... logic ...
  console.log('complexMethod: completed successfully');
}
```

**Why it's bad:**
- Can't debug issues
- No audit trail
- Hard to understand flow

### ❌ Testing in Production

```javascript
// WRONG - testing on live server
// (breaking things for real players)

// RIGHT - use separate test database
// Run automated tests before deploying
```

**Why it's bad:**
- Breaks things for users
- No rollback
- Unprofessional

## Security

### ❌ Trusting User Input

```javascript
// WRONG - no validation
async doSetProperty(player, propName, value) {
  self[propName] = value;  // Player can set ANY property!
}

// RIGHT
async doSetProperty(player, propName, value) {
  const allowed = ['description', 'color'];
  if (!allowed.includes(propName)) {
    return 'You cannot set that property.';
  }
  self[propName] = value;
}
```

**Why it's bad:**
- Security vulnerabilities
- Data corruption
- Privilege escalation

### ❌ Not Checking Permissions

```javascript
// WRONG - anyone can do anything
async doDelete(player, obj) {
  await $.recycler.recycle(obj);
}

// RIGHT
async doDelete(player, obj) {
  if (!player.isAdmin && obj.owner !== player.id) {
    return 'Permission denied.';
  }
  await $.recycler.recycle(obj);
}
```

**Why it's bad:**
- Players can grief
- Data loss
- Abuse potential

## Summary: Golden Rules

1. ✅ **Always use $.recycler** for object creation/destruction
2. ✅ **Always use moveTo()** for object movement
3. ✅ **Always use utilities** ($.english, $.format, $.pronoun)
4. ✅ **Always await async calls** when you need the result
5. ✅ **Always unregister verbs** in onLeaving hooks
6. ✅ **Always use appropriate senses** (see/hear/smell/taste/feel)
7. ✅ **Always validate input** before using it
8. ✅ **Always handle errors** explicitly
9. ✅ **Always use pass()** when extending parent methods
10. ✅ **Always load in parallel** when possible

## See Also

- [Best Practices](../best-practices.md) - What TO do
- [Common Patterns](./patterns.md) - Reusable solutions
- [Utilities](../utilities/) - Tools to use instead of reinventing
