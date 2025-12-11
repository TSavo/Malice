# $.exclusions - Action Exclusion System

Prevents incompatible simultaneous actions using mutex-based rules.

## Purpose

Centralized system for preventing conflicts like:
- Walking while sitting
- Sitting while fighting
- Crafting while moving
- Operating terminals while sleeping

## Why Use Exclusions?

**Without exclusions:** Scattered checks everywhere

```javascript
// DON'T: Manual checks in every method
async function startWalking(player) {
  if (player.isSitting) return "Stand up first.";
  if (player.isFighting) return "Can't move during combat.";
  if (player.isCrafting) return "Finish crafting first.";
  // ... endless repetition
}
```

**With exclusions:** Automatic enforcement

```javascript
// DO: Let the system handle it
async function startWalking(player) {
  const blocked = await $.exclusions.check(player, 'walk');
  if (blocked) return blocked; // Returns the message string
  
  await $.exclusions.start(player, 'walk', "You'll need to stop moving first.");
  // ... do walking
}
```

## API

### check(obj, action)

Check if an action is blocked without acquiring the lock.

**Returns:** `false` if allowed, or message string if blocked

```javascript
const blocked = await $.exclusions.check(player, 'walk');
if (blocked) {
  return blocked; // "You'll need to stand up first."
}
// Not blocked, proceed
```

### start(obj, action, message, [timeout])

Start an action, acquiring the exclusion lock.

**Returns:** `false` if started, or blocking message string if prevented

```javascript
const result = await $.exclusions.start(
  player, 
  'sit', 
  "You'll need to stand up first.",
  60000  // Optional: auto-release after 60s
);

if (result) {
  return result; // "You'll need to stop moving first."
}
// Started successfully
```

### end(obj, action)

End an action, releasing the exclusion lock.

**Returns:** `true` if released, `false` if wasn't active

```javascript
await $.exclusions.end(player, 'sit');
```

### current(obj)

Get all currently active actions on an object.

**Returns:** Array of `{ action, data, acquiredAt }` objects

```javascript
const actions = await $.exclusions.current(player);
// [{ action: 'sit', data: "Stand up first", acquiredAt: 1234567890 }]
```

## Predefined Rules

| Action | Excludes |
|--------|----------|
| `walk`, `run`, `crawl`, `swim` | Each other, plus `sit`, `sleep`, `crafting`, `operating` |
| `sit` | Movement, `sleep`, `operating` |
| `sleep` | Everything active |
| `crafting` | Movement, `fighting`, `operating` |
| `fighting` | `crafting`, `sleep`, `operating` |
| `operating` | Most active behaviors |
| `eating`, `drinking` | Only `sleep` |
| `talking`, `watching` | Nothing (can multitask) |

## Custom Exclusions

### define(action, excludesArray)

Define a new action and what it excludes.

```javascript
await $.exclusions.define('fly', ['walk', 'sit', 'swim', 'crawl']);

// Now can use 'fly' action
await $.exclusions.start(player, 'fly', "You'll need to land first.");
```

### get(action)

Get the exclusion list for an action.

```javascript
const exclusions = await $.exclusions.get('walk');
// ['sit', 'sleep', 'crafting', 'operating']
```

### undefine(action)

Remove exclusion rules for an action.

```javascript
await $.exclusions.undefine('fly');
```

## Real Examples

### Room Sitting System

```javascript
obj.setMethod('sit', `
  const sittables = self.sittables || [];
  if (sittables.length === 0) {
    return 'There is nowhere to sit here.';
  }

  // Check if blocked
  const blocked = await $.exclusions.check(player, 'sit');
  if (blocked) return blocked;

  // Find available seat
  const sittable = sittables.find(s => s.occupied.length < s.capacity);
  if (!sittable) return 'All seating is occupied.';

  // Sit and acquire exclusion
  sittable.occupied.push(player.id);
  player.sitting = self.id;
  await $.exclusions.start(player, 'sit', "You'll need to stand up first.");

  await self.announce(player, null, {
    actor: 'You sit down on ' + sittable.name + '.',
    others: await $.pronoun.sub('%N sits down on ' + sittable.name + '.', player),
  });
`);

obj.setMethod('stand', `
  if (!player.sitting) return 'You are not sitting.';

  // Remove from sittable and release exclusion
  // ... remove from sittable.occupied ...
  player.sitting = null;
  await $.exclusions.end(player, 'sit');

  await self.announce(player, null, {
    actor: 'You stand up.',
    others: await $.pronoun.sub('%N stands up.', player),
  });
`);
```

### Movement System

```javascript
obj.setMethod('startMovement', `
  const destRoom = args[0];
  const distance = args[1];

  // Check awake, calories, etc.
  if (!await self.isAwake()) {
    return { success: false, message: 'Cannot move while asleep.' };
  }

  // Set movement state and acquire exclusion
  self.movementState = { destRoom, distance, startTime: Date.now() };
  await $.exclusions.start(self, 'walk', "You'll need to stop moving first.");

  // Schedule arrival
  await $.scheduler.schedule('move_' + self.id, timeMs, 0, self, 'completeMovement');

  return { success: true, message: 'You start walking.' };
`);

obj.setMethod('completeMovement', `
  const state = self.movementState;
  
  // Clear state and release exclusion
  self.movementState = null;
  await $.exclusions.end(self, 'walk');

  // Move to destination
  await self.moveTo(state.destRoom, self);
  return { success: true, message: 'Arrived.' };
`);
```

### Movement Queueing Exception

Walking while already walking should **queue** the movement, not block it:

```javascript
obj.setMethod('go', `
  // Check only non-movement exclusions
  const currentActions = await $.exclusions.current(player);
  for (const actionInfo of currentActions) {
    if (actionInfo.action !== 'walk' && actionInfo.action !== 'run') {
      const exclusions = await $.exclusions.get(actionInfo.action);
      if (exclusions.includes('walk')) {
        return actionInfo.data; // Return blocking message
      }
    }
  }
  
  // Walking while walking is OK - queues movement
  if (player.startMovement) {
    const result = await player.startMovement(destRoom, distance);
    return result.message;
  }
`);
```

## Tips

1. **Store helpful messages:** Tell users exactly how to proceed
   ```javascript
   await $.exclusions.start(player, 'crafting', "Finish crafting first with 'craft finish'.");
   ```

2. **Use descriptive action names:** `operating` is better than `using`

3. **Consider timeouts:** Long actions should auto-release
   ```javascript
   await $.exclusions.start(player, 'crafting', "...", 300000); // 5 min timeout
   ```

4. **Update data if needed:** Store context with the exclusion
   ```javascript
   await $.exclusions.update(player, 'crafting', "Nearly done crafting...");
   ```

## See Also

- [$.mutex](./mutex.md) - Underlying mutex system
- [Room System](../prototypes/rooms.md) - Sittables implementation
- [Agent System](../prototypes/agents.md) - Movement implementation
