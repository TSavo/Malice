# $ Globals Reference

The `$` object provides access to global utility objects and system services from within MOO method code. These are registered aliases that resolve to singleton RuntimeObjects.

## How $ Works

Aliases are stored in `#0.properties.aliases` (the ObjectManager). When you access `$.foo` in method code, it looks up the alias and returns the corresponding RuntimeObject.

```javascript
// In MOO method code:
const recycler = $.recycler;  // Resolves alias 'recycler' to the Recycler object
const player = await $.load(playerId);  // Load any object by ID
```

## Core Aliases

| Alias | Description |
|-------|-------------|
| `$.nothing` | Special null object (#-1) |
| `$.object_manager` | The ObjectManager (#0) |
| `$.root` | Root object (#1) - base of all objects |
| `$.system` | System object (#2) - connection router |

## System Services

### $.recycler - Object Lifecycle

Creates and deletes objects with permission checks and lifecycle hooks.

```javascript
// Create a new object
const item = await $.recycler.create({
  parent: $.describable.id,
  properties: {
    name: 'Magic Sword',
    description: 'A gleaming blade.',
  }
});

// Create with legacy syntax
const item = await $.recycler.create(parentId, { name: 'Sword' });

// Delete an object (soft delete)
await $.recycler.recycle(item);

// Restore from recycle bin
await $.recycler.unrecycle(objectId);

// Permanently delete (wizard only)
await $.recycler.purge(objectId, wizard);

// Recursively delete object and all parts
await $.recycler.recycleTree(objectId);
```

**Methods:**
- `create(params, caller?)` - Create new object
- `recycle(obj, caller?)` - Soft delete
- `unrecycle(objectId)` - Restore from bin
- `purge(objectId, caller)` - Permanent delete
- `recycleTree(objectId, caller?)` - Delete object and nested parts
- `canRecycle(caller, obj)` - Check permissions

### $.scheduler - Job Scheduling

Schedules periodic or one-shot tasks.

```javascript
// Schedule a repeating job (every 60s, starting immediately)
await $.scheduler.schedule('heartbeat', 0, 60000, $.system, 'tickAllPlayers');

// Schedule a one-shot job (runs once after 5s delay)
await $.scheduler.schedule('delayed-msg', 5000, 0, player, 'tell', 'Time passed!');

// Schedule with initial delay then repeat
await $.scheduler.schedule('warmup', 10000, 60000, target, 'method');

// Unschedule a job
await $.scheduler.unschedule('heartbeat');

// Enable/disable without removing
await $.scheduler.setEnabled('heartbeat', false);

// Force immediate execution
await $.scheduler.runNow('heartbeat');

// List all jobs
const jobs = await $.scheduler.listJobs();
```

**Parameters:**
- `name` - Unique job identifier
- `delay` - ms until first run (0 = next tick)
- `interval` - ms between runs (0 = one-shot, min 1000ms for repeating)
- `target` - Object to call method on
- `method` - Method name
- `...args` - Arguments to pass

### $.prompt - Interactive Input

Handles interactive prompts with players.

```javascript
// Text question
const name = await $.prompt.question(player, 'What is your name? ');

// Multiple choice (returns selected key)
const choice = await $.prompt.choice(player, 'Pick a class:', {
  warrior: 'Warrior - Strong melee fighter',
  mage: 'Mage - Powerful spellcaster',
  rogue: 'Rogue - Stealthy assassin',
});

// Yes/no question (returns true/false)
const confirmed = await $.prompt.yesorno(player, 'Delete all items?');

// Menu with columns (returns selected key)
const option = await $.prompt.menu(player, 'Select option:', {
  north: 'Go North',
  south: 'Go South',
  east: 'Go East',
  west: 'Go West',
}, 2); // 2 columns

// Multiline text input (ends with '.' on own line)
const text = await $.prompt.multiline(player, 'Enter description:');

// Check if player is in prompt state
const active = await $.prompt.isActive(player);

// Cancel current prompt
await $.prompt.cancel(player);
```

### $.exclusions - Action Conflicts

Prevents incompatible simultaneous actions using mutex locks.

```javascript
// Check if action is blocked
const blocked = await $.exclusions.check(player, 'walk');
if (blocked) {
  return blocked; // Returns message like "You'll need to stand up first."
}

// Start an action (acquires lock)
const result = await $.exclusions.start(player, 'sit', "You're sitting.");
if (result) {
  return result; // Was blocked
}

// End an action (releases lock)
await $.exclusions.end(player, 'sit');

// Get current actions
const actions = await $.exclusions.current(player);
// [{action: 'sit', data: "You're sitting.", acquiredAt: ...}]

// Define custom exclusion rules
await $.exclusions.define('meditate', ['walk', 'run', 'fighting']);

// Clear all actions (admin)
await $.exclusions.clearAll(player);
```

**Default Exclusion Rules:**
- `walk/run/crawl/swim` excludes `sit`, `sleep`, `crafting`, `operating`
- `sit` excludes `walk`, `run`, `crawl`, `swim`, `sleep`, `operating`
- `sleep` excludes all movement, `sit`, `crafting`, `operating`
- `crafting` excludes movement, `sleep`, `fighting`, `operating`
- `fighting` excludes `crafting`, `sleep`, `operating`
- `eating/drinking` excludes `sleep`

### $.mutex - Generic Locks

Low-level mutex system used by exclusions and other systems.

```javascript
// Acquire a lock
await $.mutex.acquire(obj, 'lockName', optionalData, timeoutMs);

// Check if locked (returns data or false)
const data = await $.mutex.check(obj, 'lockName');

// Release a lock
await $.mutex.release(obj, 'lockName');

// Update lock data
await $.mutex.update(obj, 'lockName', newData);

// Extend timeout
await $.mutex.extend(obj, 'lockName', newTimeoutMs);

// List all locks on object
const locks = await $.mutex.list(obj);
```

## Text Formatting

### $.pronoun - Pronoun Substitution

Handles pronoun and name substitution in message templates.

```javascript
// Basic substitution
const msg = await $.pronoun.sub(
  "%N picks up %t and puts it in %p pocket.",
  actor,      // %N, %s, %o, %p, %r
  null,       // direct object (%d)
  null,       // indirect object (%i)
  item        // item (%t)
);
// "Bob picks up the sword and puts it in his pocket."

// Perspective-aware (handles "you" for viewers)
const msg = await $.pronoun.perspective(
  "%A %v{pick} up %t.",
  actor,
  target,
  viewer,
  item
);
// Actor sees: "You pick up the sword."
// Others see: "Bob picks up the sword."

// Announce to room with different messages per viewer
await $.pronoun.announce(room, actor, target, {
  actor: "You hit %t!",
  target: "%A hits you!",
  others: "%A hits %t!",
}, 'thwack', item);
```

**Substitution Codes:**
| Code | Meaning |
|------|---------|
| `%s` | Subject pronoun (he/she/they) |
| `%o` | Object pronoun (him/her/them) |
| `%p` | Possessive adjective (his/her/their) |
| `%q` | Possessive pronoun (his/hers/theirs) |
| `%r` | Reflexive (himself/herself/themselves) |
| `%n` | Actor name |
| `%t` | Item/this object name |
| `%d` | Direct object name |
| `%i` | Indirect object name |
| `%l` | Location name |
| `%%` | Literal % |

Capitalize code for capitalized output: `%N`, `%S`, etc.

### $.english - English Utilities

Text formatting for proper English.

```javascript
// List with Oxford comma
$.english.list(['a', 'b', 'c']); // "a, b, and c"
$.english.list(['x', 'y'], 'or'); // "x or y"

// Pluralization
$.english.plural(3, 'wolf'); // "wolves"
$.english.plural(1, 'child'); // "child"
$.english.plural(2, 'child'); // "children"

// Count with words
$.english.count(5, 'bruise'); // "five bruises"
$.english.count(1, 'cat'); // "a cat"
$.english.count(0, 'item'); // "no items"
$.english.count(0, 'wound', 'free of %i'); // "free of wounds"

// Articles
$.english.article('apple'); // "an apple"
$.english.article('banana'); // "a banana"

// Ordinals
$.english.ordinal(1); // "first"
$.english.ordinal(23); // "23rd"

// Number words
$.english.numberWord(5); // "five"
$.english.numberWord(42); // "42"

// Possessive
$.english.possessive('Bob'); // "Bob's"
$.english.possessive('James'); // "James'"

// Capitalization
$.english.capitalize('hello world'); // "Hello world"
$.english.titleCase('the lord of the rings'); // "The Lord of the Rings"

// Verb conjugation
$.english.conjugate('walk', 3); // "walks"
$.english.conjugate('have', 3); // "has"
$.english.pastTense('walk'); // "walked"
$.english.pastTense('go'); // "went"
$.english.presentParticiple('run'); // "running"

// Garble for audio degradation
$.english.garble('Hello there friend', 30); // "Hello dere frien"
$.english.garble('Hello there friend', 70); // "...lo ...ere ..."
```

### $.format - Layout Utilities

Text layout for columns, tables, and boxes.

```javascript
// Padding
$.format.padRight('hi', 10); // "hi        "
$.format.padLeft('42', 5, '0'); // "00042"
$.format.center('hi', 10); // "    hi    "
$.format.truncate('Hello World', 8); // "Hello..."

// Columns
const lines = await $.format.columns(['a','b','c','d','e'], 2);
// ['a    b', 'c    d', 'e']

// Tables
const table = await $.format.table([
  ['Name', 'HP', 'Status'],
  ['Goblin', '10', 'Alive'],
  ['Orc', '25', 'Dead'],
]);
// ['Name    HP  Status', '------  --  ------', 'Goblin  10  Alive', 'Orc     25  Dead']

// Word wrap
const wrapped = await $.format.wrap('Long text here...', 40);

// Box drawing
const box = await $.format.box('Hello!', { style: 'single', title: 'Message' });
// ['┌─ Message ─┐', '│ Hello!    │', '└───────────┘']

// Progress bar
$.format.bar(75, 100, 20, { showPct: true }); // "[===============     ] 75%"

// Lists
const list = await $.format.list(['one', 'two'], { style: 'number' });
// ['  1. one', '  2. two']

// Key-value alignment
const kv = await $.format.keyValue({ Name: 'Bob', HP: 100 });
// ['Name: Bob', 'HP:   100']

// Prose list
$.format.prose(['sword', 'shield', 'dagger']); // "sword, shield, and dagger"

// Compose with verb conjugation
await $.format.compose('%T %v{fall} away.', ['pants']);
// "The pants falls away."
await $.format.compose('%T %v{fall} away.', ['shirt', 'pants']);
// "The shirt and pants fall away."
```

### $.proportional - Value-Based Messages

Selects messages based on a value within a range.

```javascript
// Select message based on current/max
const msg = await $.proportional.sub(
  ['empty', 'almost empty', 'half full', 'mostly full', 'full'],
  currentAmount,
  maxAmount
);

// First message (index 0) ONLY when amount = 0
// Last message (index n-1) ONLY when amount = max
// Middle messages distributed evenly across 1 to max-1

// From percentage
const msg = await $.proportional.fromPercent(messages, 75);

// Get index instead of message
const idx = await $.proportional.index(messages, current, max);
```

### $.emote - Freeform Emotes

Parses and broadcasts emotes with sensory awareness.

```javascript
// Broadcast to room
await $.emote.broadcast('.smile and .say "Hello!"', actor, room);

// Parse for specific viewer
const formatted = await $.emote.format('.wave at Bob', actor, viewer, room);

// Get sensory breakdown
const sensory = await $.emote.formatSensory(emoteStr, actor, viewer, knownNames);
// { visual, audible, olfactory, gustatory, visualDeaf, combined }
```

**Emote Markers:**
| Marker | Type | Routed Via |
|--------|------|------------|
| `.verb` | Visual action | `viewer.see()` |
| `"speech"` | Spoken words | `viewer.hear()` |
| `,verb` | Audible non-speech | `viewer.hear()` |
| `~verb` | Olfactory | `viewer.smell()` |
| `^verb` | Gustatory | `viewer.taste()` |

**Example:**
```
Input: .fall on my knees and .say "Hey!" to Bob
Actor: You fall on your knees and say, "Hey!" to Bob.
Bob: Alice falls on her knees and says, "Hey!" to you.
Others: Alice falls on her knees and says, "Hey!" to Bob.
Blind: Alice says, "Hey!"
Deaf: Alice falls on her knees and says something to Bob.
```

## Prototype Aliases

Quick access to prototype objects for inheritance:

| Alias | Description |
|-------|-------------|
| `$.describable` | Base for all world objects |
| `$.location` | Container prototype |
| `$.room` | Room prototype |
| `$.exit` | Exit prototype |
| `$.agent` | Actors with verbs |
| `$.embodied` | Agents with bodies |
| `$.human` | Human NPC prototype |
| `$.player` | Player prototype |
| `$.admin` | Admin player prototype |
| `$.food` | Edible items |
| `$.drink` | Drinkable items |
| `$.clothing` | Wearable items |
| `$.door` | Door prototype |
| `$.lock` | Lock prototype |
| `$.stackable` | Stackable commodities |

## System Aliases

| Alias | Description |
|-------|-------------|
| `$.authManager` | Handles login/authentication |
| `$.charGen` | Character creation |
| `$.preAuthHandler` | Pre-authenticated connections |
| `$.bodyFactory` | Creates human bodies |
| `$.bank` | Banking system |
| `$.phoneDb` | Phone directory |
| `$.startRoom` | Default spawn location |

## Special Properties on $

In addition to aliases, `$` provides direct access to ObjectManager methods:

```javascript
// Load any object by ID
const obj = await $.load(123);

// Create object (low-level, prefer $.recycler.create)
const obj = await $.create({ parent: 1, properties: {...} });

// Get all aliases
const aliases = $.aliases;

// Evict from cache
$.evictFromCache(objectId);

// Clear aliases for an object
await $.clearAliasesForObject(objectId);
```

## Adding Custom Aliases

Aliases are managed through the ObjectManager (#0):

```javascript
// Add an alias
await $[0].addAlias('myUtil', myUtilObject.id);

// Remove an alias
await $[0].removeAlias('myUtil');

// Get alias
const id = await $[0].getAlias('myUtil');

// Protected aliases (cannot be removed)
// nothing, object_manager, root, system
```

## See Also

- [Prototypes Reference](./prototypes.md) - Object types and inheritance
- [Verb System](./verbs.md) - Player command handling
- [Architecture](../architecture.md) - How methods execute
