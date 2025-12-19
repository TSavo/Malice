# Exclusions System Reference

The exclusions system prevents incompatible simultaneous actions using mutex locks. For example, you can't walk while sitting or craft while sleeping.

## Overview

Exclusions work through a rule system that defines which actions block which other actions. When you start an action, the system:

1. Checks if any blocking action is already active
2. If blocked, returns a message explaining why
3. If not blocked, acquires a mutex lock for the action

## Basic Usage

### Checking if an Action is Blocked

```javascript
// Check if player can walk
const blocked = await $exclusions.check(player, 'walk');
if (blocked) {
  return blocked;  // "You can't do that while sitting."
}

// Proceed with walking...
```

### Starting an Action

```javascript
// Start sitting (returns false on success, message string if blocked)
const result = await $exclusions.start(player, 'sit', "You'll need to stand up first.");
if (result) {
  return result;  // Was blocked by something
}

// Player is now sitting
await player.tell("You sit down.");
```

### Ending an Action

```javascript
// Stop sitting (stand up)
await $exclusions.end(player, 'sit');
await player.tell("You stand up.");
```

## Default Exclusion Rules

The system comes with these predefined rules:

### Movement Actions

| Action | Excludes |
|--------|----------|
| `walk` | sit, sleep, crafting, operating |
| `run` | sit, sleep, crafting, operating |
| `crawl` | sit, sleep, crafting, operating |
| `swim` | sit, sleep, crafting, operating |

### Positional Actions

| Action | Excludes |
|--------|----------|
| `sit` | walk, run, crawl, swim, sleep, operating |
| `sleep` | walk, run, crawl, swim, sit, crafting, operating |

### Activity Actions

| Action | Excludes |
|--------|----------|
| `crafting` | walk, run, swim, sleep, fighting, operating |
| `fighting` | crafting, sleep, operating |
| `operating` | walk, run, swim, sit, sleep, crafting, fighting |

### Light Activities

| Action | Excludes |
|--------|----------|
| `eating` | sleep |
| `drinking` | sleep |
| `talking` | (none) |
| `watching` | (none) |

## Self-Exclusion

Every action implicitly excludes itself. You can't start walking if you're already walking.

```javascript
const blocked = await $exclusions.check(player, 'walk');
// If player is already walking: "You're already walking."
```

## API Reference

### check(obj, action)

Check if an action is blocked by current exclusions.

**Parameters:**
- `obj` - The object to check (usually a player)
- `action` - The action name to check

**Returns:**
- `false` if not blocked
- String message explaining why blocked

```javascript
const blocked = await $exclusions.check(player, 'run');
if (blocked) {
  await player.tell(blocked);  // "You can't do that while sitting."
  return;
}
```

### start(obj, action, data?, timeout?)

Start an action (acquire exclusion mutex).

**Parameters:**
- `obj` - The object performing the action
- `action` - The action name
- `data` - Optional data stored with the lock (default: `true`)
- `timeout` - Optional timeout in ms (default: no timeout)

**Returns:**
- `false` on success
- String message if blocked

```javascript
// Start with custom blocking message
const result = await $exclusions.start(player, 'sit', "You'll need to stand up first.");

// Start with timeout (auto-ends after 60 seconds)
const result = await $exclusions.start(player, 'crafting', craftingData, 60000);
```

### end(obj, action)

End an action (release exclusion mutex).

**Parameters:**
- `obj` - The object to release
- `action` - The action name to end

**Returns:**
- `true` if ended successfully
- `false` if action wasn't active

```javascript
await $exclusions.end(player, 'sit');
```

### update(obj, action, data)

Update data on an active action without ending it.

**Parameters:**
- `obj` - The object with the action
- `action` - The action name
- `data` - New data to store

**Returns:**
- `true` if updated
- `false` if action not active

```javascript
// Update crafting progress
await $exclusions.update(player, 'crafting', { progress: 50 });
```

### extend(obj, action, timeout)

Extend/reset the timeout on an active action.

**Parameters:**
- `obj` - The object with the action
- `action` - The action name
- `timeout` - New timeout in ms

**Returns:**
- `true` if extended
- `false` if action not active

```javascript
// Keep crafting going another 60 seconds
await $exclusions.extend(player, 'crafting', 60000);
```

### current(obj)

Get all active actions for an object.

**Parameters:**
- `obj` - The object to check

**Returns:**
- Array of `{ action, data, acquiredAt }` objects

```javascript
const actions = await $exclusions.current(player);
// [{ action: 'sit', data: "You'll need to stand up first.", acquiredAt: 1234567890 }]

for (const { action } of actions) {
  console.log("Currently: " + action);
}
```

### define(action, excludes)

Define or update exclusion rules for an action.

**Parameters:**
- `action` - The action name
- `excludes` - Array of action names this action excludes

```javascript
// Define custom "meditate" action
await $exclusions.define('meditate', ['walk', 'run', 'fighting', 'talking']);
```

### get(action)

Get exclusion rules for an action.

**Parameters:**
- `action` - The action name

**Returns:**
- Array of action names that this action excludes

```javascript
const excludes = await $exclusions.get('sit');
// ['walk', 'run', 'crawl', 'swim', 'sleep', 'operating']
```

### undefine(action)

Remove exclusion rules for an action.

**Parameters:**
- `action` - The action name

**Returns:**
- `true` if removed
- `false` if didn't exist

```javascript
await $exclusions.undefine('meditate');
```

### list()

List all defined exclusion rules.

**Returns:**
- Object with `{ action: [excludes...] }` for all actions

```javascript
const allRules = await $exclusions.list();
// { walk: ['sit', 'sleep', ...], sit: ['walk', 'run', ...], ... }
```

### clearAll(obj)

Force end all actions on an object (admin use).

**Parameters:**
- `obj` - The object to clear

**Returns:**
- Number of actions ended

```javascript
const count = await $exclusions.clearAll(player);
await player.tell("Cleared " + count + " actions.");
```

## Practical Examples

### Sitting Down

```javascript
obj.setMethod('doSit', `
  // Check if we can sit
  const blocked = await $exclusions.start(self, 'sit', "You'll need to stand up first.");
  if (blocked) {
    return blocked;
  }

  // Update posture
  self.posture = 'sitting';

  // Notify room
  await room.announce(self, null, {
    actor: "You sit down.",
    others: "%A sits down.",
  });

  return true;
`);

obj.setMethod('doStand', `
  // End sitting
  const wasSitting = await $exclusions.end(self, 'sit');
  if (!wasSitting) {
    return "You're not sitting.";
  }

  // Update posture
  self.posture = 'standing';

  // Notify room
  await room.announce(self, null, {
    actor: "You stand up.",
    others: "%A stands up.",
  });

  return true;
`);
```

### Crafting System

```javascript
obj.setMethod('startCrafting', `
  const recipe = args[0];
  const duration = args[1] || 30000;  // 30 seconds default

  // Start crafting with timeout
  const blocked = await $exclusions.start(self, 'crafting', {
    recipe: recipe,
    progress: 0,
    startedAt: Date.now(),
  }, duration);

  if (blocked) {
    return blocked;
  }

  await self.tell("You begin crafting " + recipe.name + "...");

  // Schedule completion check
  await $scheduler.schedule(
    'craft-' + self.id,
    duration,
    0,  // One-shot
    self,
    'completeCrafting'
  );

  return true;
`);

obj.setMethod('cancelCrafting', `
  const wasCrafting = await $exclusions.end(self, 'crafting');
  if (!wasCrafting) {
    return "You're not crafting anything.";
  }

  // Cancel the scheduled completion
  await $scheduler.unschedule('craft-' + self.id);

  await self.tell("You stop crafting.");
  return true;
`);
```

### Combat System

```javascript
obj.setMethod('startCombat', `
  const target = args[0];

  // Enter combat mode
  const blocked = await $exclusions.start(self, 'fighting', {
    target: target,
    startedAt: Date.now(),
  });

  if (blocked) {
    return blocked;
  }

  // Register combat verbs
  await self.registerVerb(['attack %i', 'hit %i', 'strike %i'], self, 'doAttack');
  await self.registerVerb(['flee', 'run away', 'escape'], self, 'doFlee');

  await self.tell("You enter combat with " + target.name + "!");
  return true;
`);

obj.setMethod('endCombat', `
  const wasFighting = await $exclusions.end(self, 'fighting');
  if (!wasFighting) {
    return;  // Not in combat
  }

  // Unregister combat verbs
  await self.unregisterVerb('attack %i');
  await self.unregisterVerb('flee');

  await self.tell("Combat has ended.");
`);
```

### Terminal Operation

```javascript
obj.setMethod('useTerminal', `
  const terminal = args[0];

  // Start operating the terminal
  const blocked = await $exclusions.start(self, 'operating', {
    terminal: terminal,
    mode: 'main-menu',
  });

  if (blocked) {
    return blocked;
  }

  // Register terminal-specific verbs
  await self.registerVerb(['type %s', 'enter %s'], terminal, 'handleInput');
  await self.registerVerb(['exit', 'quit', 'leave'], terminal, 'exitTerminal');

  // Show terminal welcome
  await terminal.showMenu(self);
  return true;
`);
```

## Underlying Mutex System

Exclusions use `$mutex` with `action:` prefixed lock names:

```javascript
// These are equivalent:
await $exclusions.start(player, 'sit', data);
await $mutex.acquire(player, 'action:sit', data);

await $exclusions.end(player, 'sit');
await $mutex.release(player, 'action:sit');

await $exclusions.check(player, 'sit');
await $mutex.check(player, 'action:sit');
```

For non-action exclusions (like resource locks), use `$mutex` directly.

## Best Practices

### 1. Use Descriptive Blocking Messages

```javascript
// Good - explains what to do
await $exclusions.start(player, 'sit', "You'll need to stand up first.");

// Less helpful
await $exclusions.start(player, 'sit', true);
// Results in: "You can't do that while sit."
```

### 2. Always End Actions

```javascript
// If an action fails after starting, end it
const blocked = await $exclusions.start(player, 'crafting', data);
if (blocked) return blocked;

try {
  await doCrafting();
} catch (error) {
  await $exclusions.end(player, 'crafting');  // Clean up
  throw error;
}
```

### 3. Use Timeouts for Timed Actions

```javascript
// Crafting auto-ends after 60 seconds if not completed
await $exclusions.start(player, 'crafting', data, 60000);
```

### 4. Check Before Expensive Operations

```javascript
// Check first, then do expensive setup
const blocked = await $exclusions.check(player, 'crafting');
if (blocked) return blocked;

// Now do expensive material checks, etc.
const materials = await gatherMaterials();
if (!materials) return "Missing materials.";

// Finally start the action
await $exclusions.start(player, 'crafting', { materials });
```

## See Also

- [$ Globals Reference](./globals.md) - $exclusions, $mutex
- [Verb System](./verbs.md) - Registering verbs for actions
- [Event Hooks](./hooks.md) - Action-related hooks
