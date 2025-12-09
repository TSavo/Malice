# MOO Programming Best Practices

This guide covers MOO code conventions and the utility objects available via `$.*`.

## The Golden Rule: Combine Utilities, Never Duplicate Logic

The utilities in this codebase are designed to **compose together**. Using them correctly turns 20 lines of buggy, inconsistent code into 3 lines of robust, correct code. **NEVER** write your own grammar logic, pronoun handling, list formatting, or message construction.

### Before: 22 Lines of Fragile Code

```javascript
// DON'T DO THIS - Manual message construction
async function announcePickup(actor, items, room) {
  let itemList;
  if (items.length === 1) {
    itemList = 'the ' + items[0].name;
  } else if (items.length === 2) {
    itemList = 'the ' + items[0].name + ' and ' + items[1].name;
  } else {
    itemList = 'the ' + items.slice(0, -1).map(i => i.name).join(', ') +
               ', and ' + items[items.length - 1].name;
  }

  const verb = items.length === 1 ? 'picks' : 'pick';

  for (const viewer of room.contents) {
    if (viewer.id === actor.id) {
      await viewer.tell('You ' + (items.length === 1 ? 'pick' : 'pick') + ' up ' + itemList + '.');
    } else {
      await viewer.tell(actor.name + ' ' + verb + ' up ' + itemList + '.');
    }
  }
}
```

### After: 3 Lines of Correct Code

```javascript
// DO THIS - Let utilities handle everything
async function announcePickup(actor, items, room) {
  const names = items.map(i => i.name);
  await $.format.compose('%N %v{pick} up %t.', names, { actor, room });
}
```

The compose() call handles:
- ✅ Oxford comma for 3+ items
- ✅ Verb conjugation based on actor perspective ("pick" vs "picks")
- ✅ Article handling ("the sword and shield")
- ✅ Second-person for actor ("You pick up"), third-person for others
- ✅ No edge case bugs

### Another Example: Damage Announcement

```javascript
// DON'T: 15 lines of manual work
async function announceDamage(attacker, victim, damage, room) {
  const wounds = [];
  if (damage > 20) wounds.push('a deep gash');
  if (damage > 10) wounds.push('a bruise');
  if (damage > 5) wounds.push('a scratch');

  let woundText = wounds.length === 1 ? wounds[0] :
    wounds.slice(0, -1).join(', ') + ' and ' + wounds[wounds.length - 1];

  const verb = wounds.length === 1 ? 'inflicts' : 'inflict';

  for (const viewer of room.contents) {
    // ... 10 more lines of viewer-specific formatting
  }
}

// DO: 2 lines
async function announceDamage(attacker, victim, wounds, room) {
  await $.format.compose('%N %v{inflict} %a on %tN!', wounds, { actor: attacker, target: victim, room });
}
```

### The Utilities Compose Seamlessly

| Combination | What It Gives You |
|-------------|-------------------|
| `$.format.compose()` + actor | Pronoun substitution + list formatting + verb conjugation |
| `$.pronoun.announce()` + room | Perspective-correct messages to all room occupants |
| `$.proportional.sub()` + value/max | Condition descriptions without if/else chains |
| `$.prompt.choice()` + validation | Complete input flow without manual parsing |
| `$.memento.clone()` + object tree | Deep copy with ID remapping, zero manual work |

**If you're writing more than 5 lines for any of these tasks, you're doing it wrong.**

## Property Access and Method Calls

**RuntimeObjects use a Proxy for direct property access.** Never use `.get()`, `.set()`, or `.call()` in MOO code.

### Reading Properties

```javascript
// CORRECT - Direct property access via Proxy
const hp = self.hp;
const name = player.name;
const loc = self.location;

// WRONG - Never use .get() in MOO code
const hp = self.get('hp');      // NO!
const name = player.get('name'); // NO!
```

### Writing Properties

```javascript
// CORRECT - Direct assignment via Proxy
self.hp = 100;
player.location = room.id;
item.weight = 5;

// WRONG - Never use .set() in MOO code
self.set('hp', 100);            // NO!
player.set('location', room.id); // NO!
```

### Calling Methods

```javascript
// CORRECT - Direct method call via Proxy
await player.tell('Hello!');
await room.announce('Bob enters.');
const desc = await item.describe();

// WRONG - Never use .call() in MOO code
await player.call('tell', 'Hello!');  // NO!
await room.call('announce', 'Bob enters.'); // NO!
```

### Loading Objects

```javascript
// Load by ID
const room = await $.load(42);
const player = await $.load(self.location);

// Shorthand (equivalent to $.load())
const obj = await $[42];
```

### Why the Proxy Exists

The Proxy makes MOO code clean and readable:

```javascript
// With Proxy (correct)
self.hp = self.hp - damage;
await victim.tell('You take ' + damage + ' damage!');

// Without Proxy (ugly, wrong)
self.set('hp', self.get('hp') - damage);
await victim.call('tell', 'You take ' + damage + ' damage!');
```

## Property Types and Object References

Properties are stored as **typed values** in the database. The system automatically converts between JavaScript values and typed storage.

### Value Types

| Type | Stored As | JavaScript Value |
|------|-----------|------------------|
| `string` | `{ type: 'string', value: 'hello' }` | `'hello'` |
| `number` | `{ type: 'number', value: 42 }` | `42` |
| `boolean` | `{ type: 'boolean', value: true }` | `true` |
| `null` | `{ type: 'null', value: null }` | `null` |
| `objref` | `{ type: 'objref', value: 5 }` | `RuntimeObject` or `5` |
| `array` | `{ type: 'array', value: [...] }` | `[...]` (recursive) |
| `object` | `{ type: 'object', value: {...} }` | `{...}` (recursive) |

### Object References (`objref`)

This is where it gets interesting. **Object references are stored as IDs but resolved to RuntimeObjects when read.**

```javascript
// WRITING: RuntimeObject → stored as objref
self.owner = player;  // player is a RuntimeObject
// Stored as: { type: 'objref', value: 42 }  (where 42 is player.id)

// READING: objref → RuntimeObject (if in cache)
const owner = self.owner;
// If #42 is cached: returns RuntimeObject (can call owner.tell())
// If #42 not cached: returns raw ID (42)
```

### The Caching Gotcha

Object references only resolve to RuntimeObjects if the target is **already in the cache**:

```javascript
// SAFE: Object is definitely loaded
const room = await $.load(self.location);  // Loads into cache
const exits = room.exits;  // Returns RuntimeObjects (they're cached from room load)

// UNSAFE: Object might not be cached
const owner = self.owner;  // Might be RuntimeObject OR raw ID!
if (typeof owner === 'number') {
  // Oops, it's just the ID - need to load it
  owner = await $.load(owner);
}

// BEST PRACTICE: Always use $.load() for object refs you need to call
const owner = await $.load(self.owner);  // Always returns RuntimeObject
await owner.tell('Hello!');  // Safe to call methods
```

### How the Proxy Auto-Converts

When you **set** a property:

```javascript
self.location = room;  // room is RuntimeObject
// The Proxy's set handler calls toValue():
// - Detects RuntimeObject (has 'id' property)
// - Stores as { type: 'objref', value: room.id }
```

When you **get** a property:

```javascript
const loc = self.location;
// The Proxy's get handler calls fromValue():
// - Sees type: 'objref', value: 42
// - Calls manager.getSync(42)
// - Returns RuntimeObject if cached, raw ID if not
```

### Arrays and Objects with References

References are resolved **recursively** in arrays and nested objects:

```javascript
// Setting an array with RuntimeObjects
self.bodyParts = [head, torso, leftArm, rightArm];
// Stored as: { type: 'array', value: [
//   { type: 'objref', value: 10 },
//   { type: 'objref', value: 11 },
//   { type: 'objref', value: 12 },
//   { type: 'objref', value: 13 }
// ]}

// Reading resolves each element
const parts = self.bodyParts;
// Returns: [RuntimeObject, RuntimeObject, RuntimeObject, RuntimeObject]
// (if all are cached)
```

### Never Use `.id` - Just Store Objects

```javascript
// DO: Store RuntimeObjects directly
self.location = room;
self.owner = player;
self.contents = [item1, item2];

// DON'T: Never use .id - it's pointless
self.location = room.id;      // NO! Why would you do this?
self.owner = player.id;       // NO! Just use player!
```

**The system stores objrefs. That's the whole point.** When you write `self.location = room`, it stores `{ type: 'objref', value: 42 }` automatically. You never need to extract the ID yourself.

Using `.id` is:
- **Pointless** - the system extracts IDs automatically
- **Harmful** - you lose type information (becomes `number` not `objref`)
- **Broken** - numbers don't auto-resolve to RuntimeObjects on read

### Reading Object References

When you read an objref property:

```javascript
// If the referenced object IS in cache:
const loc = self.location;  // Returns RuntimeObject - can call methods!
await loc.announce('...');  // Works!

// If the referenced object is NOT in cache:
const loc = self.location;  // Returns the raw ID (number)
await loc.announce('...');  // CRASH - number has no methods!
```

**The safe pattern - always use $.load():**

```javascript
// SAFE: $.load() always returns RuntimeObject (loads if needed)
const loc = await $.load(self.location);
await loc.announce('Hello!');  // Always works

// SAFE: Works whether self.location is objref OR number
// $.load() handles both cases
```

### Why $.load() Works Either Way

```javascript
// If self.location resolved to RuntimeObject:
const loc = await $.load(self.location);  // $.load(RuntimeObject) -> returns it
// If self.location resolved to number:
const loc = await $.load(self.location);  // $.load(42) -> loads #42

// $.load() is smart - it accepts both!
```

### Why This Design?

1. **Type preservation** - objrefs know they're object references
2. **Auto-resolution** - Cached objects resolve automatically
3. **Lazy loading** - Uncached objects load on demand via `$.load()`
4. **Cache coherence** - You always get the live, in-memory object

### Quick Reference

| Operation | Use |
|-----------|-----|
| Store reference | `self.owner = player` |
| Read (safe) | `await $.load(self.owner)` |
| Read (if cached) | `self.owner` |
| Load by ID | `await $.load(42)` or `await $[42]` |

**Never use `.id` for storage. Just store the object.**

## Core Utilities

| Alias | Purpose |
|-------|---------|
| `$` | ObjectManager (#0): alias management, object ID allocation |
| `$.english` | Grammar: articles, plurals, conjugation, ordinals |
| `$.pronoun` | Pronoun substitution, perspective-aware messaging |
| `$.format` | Text layout: columns, tables, lists, templates |
| `$.proportional` | Proportional message selection (health bars, etc.) |
| `$.prompt` | Interactive prompts (question, choice, menu, multiline) |
| `$.recycler` | Object lifecycle: create, recycle, unrecycle |
| `$.memento` | Object graph serialization and cloning |
| `$.mutex` | Object-based mutex locks with timeouts |
| `$.scheduler` | Periodic job scheduling (heartbeats, decay) |
| `$.emote` | Sensory-aware emotes with `.verb` syntax |

## $.english - Grammar Utilities

Use `$.english` for all grammar operations. Never duplicate conjugation/pluralization logic.

### Verb Conjugation

```javascript
// Third person singular
await $.english.conjugate('walk', 3)   // "walks"
await $.english.conjugate('kiss', 3)   // "kisses"
await $.english.conjugate('cry', 3)    // "cries"
await $.english.conjugate('be', 3)     // "is"
await $.english.conjugate('have', 3)   // "has"

// Past tense
await $.english.pastTense('walk')      // "walked"
await $.english.pastTense('run')       // "ran"
await $.english.pastTense('cut')       // "cut"

// Present participle (-ing)
await $.english.presentParticiple('walk')  // "walking"
await $.english.presentParticiple('run')   // "running"
```

### Pluralization

```javascript
await $.english.plural('sword')        // "swords"
await $.english.plural('wolf')         // "wolves"
await $.english.plural('child')        // "children"
await $.english.plural('sheep')        // "sheep"

// With count
await $.english.count(3, 'apple')      // "3 apples"
await $.english.count(1, 'apple')      // "1 apple"
await $.english.count(0, 'apple')      // "0 apples"
```

### Articles

```javascript
await $.english.article('apple')       // "an apple"
await $.english.article('sword')       // "a sword"
await $.english.article('hour')        // "an hour"
```

### Other

```javascript
await $.english.ordinal(1)             // "1st"
await $.english.ordinal(22)            // "22nd"
await $.english.possessive('Bob')      // "Bob's"
await $.english.possessive('boss')     // "boss'"
await $.english.capitalize('hello')    // "Hello"
await $.english.titleCase('the old man') // "The Old Man"
await $.english.numberWord(42)         // "forty-two"

// Lists with Oxford comma
await $.english.list(['a', 'b', 'c'])  // "a, b, and c"
```

## $.pronoun - Perspective-Aware Text

Use `$.pronoun.sub()` for text that varies by viewer (second vs third person). This is essential for immersive messaging where the actor sees "You" while others see the actor's name.

### Template Codes

**Actor codes** (the person performing the action):

| Code | Meaning | Actor Sees | Others See |
|------|---------|------------|------------|
| `%N` | Actor name (cap) | You | Bob |
| `%n` | Actor name (lower) | you | Bob |
| `%s` | Subject pronoun | you | he/she/they |
| `%o` | Object pronoun | you | him/her/them |
| `%p` | Possessive pronoun | your | his/her/their |
| `%q` | Possessive noun | yours | his/hers/theirs |
| `%r` | Reflexive | yourself | himself/herself/themselves |
| `%v{verb}` | Conjugated verb | walk | walks |

**Target codes** (the person being acted upon) - prefix with `%t`:

| Code | Meaning | Target Sees | Others See |
|------|---------|-------------|------------|
| `%tN` | Target name (cap) | You | Jim |
| `%tn` | Target name (lower) | you | Jim |
| `%ts` | Target subject | you | he/she/they |
| `%to` | Target object | you | him/her/them |
| `%tp` | Target possessive | your | his/her/their |
| `%tq` | Target possessive noun | yours | his/hers/theirs |
| `%tr` | Target reflexive | yourself | himself/herself |

**Object codes** (things involved in the action):

| Code | Meaning | Example |
|------|---------|---------|
| `%d` | Direct object | "the sword" |
| `%D` | Direct object (cap) | "The sword" |
| `%i` | Indirect object | "the chest" |
| `%I` | Indirect object (cap) | "The chest" |
| `%l` | Location name | "the tavern" |
| `%L` | Location name (cap) | "The tavern" |

### Basic Usage

```javascript
// sub(template, actor, directObj?, target?, indirectObj?, location?)

// Simple action
const msg = await $.pronoun.sub('%N %v{pick} up %d.', actor, sword);
// Actor sees: "You pick up the sword."
// Others see: "Bob picks up the sword."

// Action with target
const msg = await $.pronoun.sub('%N %v{give} %d to %tN.', giver, sword, receiver);
// Giver sees:    "You give the sword to Jim."
// Receiver sees: "Bob gives the sword to you."
// Others see:    "Bob gives the sword to Jim."

// Complex interaction
const msg = await $.pronoun.sub(
  '%N %v{punch} %tN in %tp face, breaking %tr nose!',
  attacker, null, victim
);
// Attacker sees: "You punch Jim in his face, breaking his nose!"
// Victim sees:   "Bob punches you in your face, breaking your nose!"
// Others see:    "Bob punches Jim in his face, breaking his nose!"
```

### Possessives

```javascript
// Possessive pronoun (adjective form)
await $.pronoun.sub('%N %v{take} %p sword.', actor);
// Actor: "You take your sword."
// Others: "Bob takes his sword."

// Possessive noun (standalone form)
await $.pronoun.sub('The victory is %q!', actor);
// Actor: "The victory is yours!"
// Others: "The victory is his!"
```

### announce() - Room Messaging

The main way to send perspective-correct messages to a room:

```javascript
// Everyone in the room gets the appropriate perspective
await $.pronoun.announce(room, '%N %v{enter} from the north.', actor);

// With objects
await $.pronoun.announce(room, '%N %v{drop} %d.', actor, item);

// With targets
await $.pronoun.announce(room, '%N %v{wave} at %tN.', actor, null, target);

// Full signature
await $.pronoun.announce(room, template, actor, directObj, target, indirectObj, location);
```

### tell() vs announce()

```javascript
// tell() - Send to one specific person
await $.pronoun.tell(player, '%N %v{feel} dizzy.', player);
// Player sees: "You feel dizzy."

// announce() - Send to everyone in a room
await $.pronoun.announce(room, '%N %v{collapse}.', actor);
// Actor sees: "You collapse."
// Others see: "Bob collapses."
```

### Custom Viewer

```javascript
// Format for a specific viewer (not the actor)
const msg = await $.pronoun.sub('%N %v{smile} at %tN.', actor, null, target, null, null, viewer);
// If viewer is actor: "You smile at Bob."
// If viewer is target: "Jim smiles at you."
// If viewer is neither: "Jim smiles at Bob."
```

## $.format - Text Formatting

### Natural Language Lists

```javascript
// Oxford comma list
await $.format.prose(['sword'])                    // "sword"
await $.format.prose(['sword', 'shield'])          // "sword and shield"
await $.format.prose(['sword', 'shield', 'helm'])  // "sword, shield, and helm"
await $.format.prose(['red', 'blue'], 'or')        // "red or blue"
```

### compose() - Template Composition

The most powerful formatting tool - combines list formatting, count-based verb conjugation, and pronoun substitution in one call.

**Template codes for lists:**

| Code | Meaning | 1 item | 2+ items |
|------|---------|--------|----------|
| `%T` | List with "The" | "The sword" | "The sword and shield" |
| `%t` | List with "the" | "the sword" | "the sword and shield" |
| `%A` | List with "A/An" | "A sword" | "A sword and shield" |
| `%a` | List with "a/an" | "a sword" | "a sword and shield" |
| `%v{verb}` | Verb conjugated by list count | "falls" | "fall" |

**Plus all `$.pronoun` codes** (`%N`, `%s`, `%p`, `%tN`, etc.) when you pass an actor.

### Basic List Formatting

```javascript
// Single item
await $.format.compose('%T %v{fall} to the ground.', ['sword'])
// "The sword falls to the ground."

// Multiple items
await $.format.compose('%T %v{fall} to the ground.', ['sword', 'shield'])
// "The sword and shield fall to the ground."

// Three+ items (Oxford comma)
await $.format.compose('%T %v{clatter} noisily.', ['sword', 'shield', 'helm'])
// "The sword, shield, and helm clatter noisily."
```

### Combining with Pronouns

```javascript
// compose(template, items, options)
// options: { actor, directObj, target, indirectObj, location, viewer }

// Actor watching items fall
await $.format.compose(
  '%N %v{watch} as %t %v{tumble} to the ground.',
  ['coins'],
  { actor: player }
);
// Player sees: "You watch as the coins tumble to the ground."
// Others see:  "Bob watches as the coins tumble to the ground."

// Actor dropping multiple items
await $.format.compose(
  '%N %v{drop} %t.',
  ['sword', 'shield'],
  { actor: player }
);
// Player sees: "You drop the sword and shield."
// Others see:  "Bob drops the sword and shield."

// Full interaction with target
await $.format.compose(
  '%N %v{throw} %t at %tN!',
  ['dagger', 'rock'],
  { actor: attacker, target: victim }
);
// Attacker sees: "You throw the dagger and rock at Bob!"
// Victim sees:   "Jim throws the dagger and rock at you!"
// Others see:    "Jim throws the dagger and rock at Bob!"
```

### Verb Conjugation by Count

The `%v{verb}` in compose uses the **list count** for conjugation:

```javascript
// 1 item = singular verb (falls, is, has)
// 2+ items = plural verb (fall, are, have)

await $.format.compose('%T %v{is} broken.', ['sword'])
// "The sword is broken."

await $.format.compose('%T %v{is} broken.', ['sword', 'shield'])
// "The sword and shield are broken."

// Works with irregular verbs
await $.format.compose('%T %v{have} been destroyed.', ['sword'])
// "The sword has been destroyed."

await $.format.compose('%T %v{have} been destroyed.', ['sword', 'armor'])
// "The sword and armor have been destroyed."
```

### Real-World Examples

```javascript
// Inventory pickup
const items = ['rusty sword', 'torn cloak', 'gold coin'];
await $.format.compose('%N %v{pick} up %t.', items, { actor: player });
// "You pick up the rusty sword, torn cloak, and gold coin."

// Clothing destruction (decay system)
const destroyed = ['shirt', 'pants'];
await $.format.compose('%p %T %v{fall} away in tatters.', destroyed, { actor: corpse });
// "His shirt and pants fall away in tatters."

// Combat hit
const wounds = ['deep gash', 'bruise'];
await $.format.compose('%N %v{inflict} %a on %tN!', wounds, { actor: attacker, target: victim });
// "You inflict a deep gash and bruise on Bob!"
```

### Count-Based Verb Conjugation

```javascript
// When you have a count but not a list
await $.format.verb('fall', 1)   // "falls"
await $.format.verb('fall', 3)   // "fall"
await $.format.verb('are', 1)    // "is"
```

### Layout Utilities

```javascript
// Columns
await $.format.columns(['a','b','c','d','e'], 2)
// ["a    b", "c    d", "e"]

// Table with headers
await $.format.table([
  ['Name', 'HP', 'Status'],
  ['Goblin', '10', 'Alive'],
  ['Orc', '25', 'Dead']
])

// Progress bar
await $.format.bar(75, 100, 20, {showPct: true})
// "[===============     ] 75%"

// Bulleted list
await $.format.list(['sword', 'shield'], {style: 'bullet'})
// ["  • sword", "  • shield"]

// Key-value alignment
await $.format.keyValue({Name: 'Bob', HP: 100, Status: 'Alive'})
// ["Name:   Bob", "HP:     100", "Status: Alive"]

// Box drawing
await $.format.box('Hello!', {style: 'single'})
// ["┌────────┐", "│ Hello! │", "└────────┘"]

// Text wrapping
await $.format.wrap('Long text here...', 40)

// Padding
await $.format.padRight('hi', 10)   // "hi        "
await $.format.padLeft('42', 5)     // "   42"
await $.format.center('hi', 10)     // "    hi    "
```

## $.recycler - Object Lifecycle

**Always use `$.recycler` for creating and destroying objects. There is NO other correct way.**

### Why This Is Non-Negotiable

```javascript
// DON'T: Direct object creation - BROKEN
const sword = await manager.create({ parent: weaponId, properties: { name: 'Sword' } });
// Problems:
// - No object pooling (memory bloat over time)
// - No recycled object reuse (wasted allocations)
// - Parent chain not validated
// - No creation hooks called
// - Object not tracked for cleanup

// DON'T: Manual deletion - CATASTROPHIC
delete objects[sword.id];           // Orphans references everywhere
sword.set('recycled', true);        // Doesn't clean up contents
await manager.delete(sword.id);     // Bypasses all cleanup hooks
// Problems:
// - References from other objects now point to nothing
// - Contents left floating in limbo
// - Location's contents array not updated
// - No cascade to child objects
// - Database inconsistency

// DO: Always use $.recycler
const sword = await $.recycler.create($.weapon, { name: 'Iron Sword', damage: 10 });
await $.recycler.recycle(sword);  // Proper cleanup, available for reuse
```

$.recycler handles:
- ✅ Object pooling (reuses recycled objects of same parent type)
- ✅ Location cleanup (removes from container's contents)
- ✅ Contents cascade (optionally recycles everything inside)
- ✅ Reference safety (marks as recycled, doesn't hard-delete)
- ✅ Memory efficiency (recycle + reuse vs create + delete)
- ✅ Undo support (unrecycle brings objects back)

**If you bypass $.recycler, you WILL cause database corruption.**

### Creating Objects

```javascript
// Create from prototype
const sword = await $.recycler.create($.weapon, {
  name: 'Iron Sword',
  damage: 10
});

// The recycler:
// 1. Checks for recyclable objects of the same type
// 2. Reuses one if available (cheaper than new allocation)
// 3. Creates new object only if none available
```

### Destroying Objects

```javascript
// Soft delete - marks for reuse
await $.recycler.recycle(sword);

// Hard delete - permanent removal
await $.recycler.purge(sword);

// Recursive delete - object and all contents
await $.recycler.recycleTree(container);
```

### Check Before Recycling

```javascript
if (await $.recycler.canRecycle(obj)) {
  await $.recycler.recycle(obj);
}
```

### Restore Recycled Object

```javascript
// Bring back from the dead
await $.recycler.unrecycle(obj);
```

## $.proportional - Proportional Message Selection

Use `$.proportional` to select messages based on a value within a range. Perfect for health bars, hunger, thirst, capacity indicators, etc.

### Why Not If/Else Chains?

```javascript
// DON'T: 15 lines of unmaintainable if/else
function getHealthStatus(hp, maxHp) {
  const pct = hp / maxHp * 100;
  if (hp === 0) return 'dead';
  if (pct < 10) return 'near death';
  if (pct < 25) return 'critical';
  if (pct < 50) return 'wounded';
  if (pct < 75) return 'hurt';
  if (pct < 100) return 'scratched';
  return 'healthy';
  // Edge cases? Rounding errors? Off-by-one? Good luck.
}

// DO: 1 line with mathematically correct distribution
const status = await $.proportional.sub(
  ['dead', 'near death', 'critical', 'wounded', 'hurt', 'scratched', 'healthy'],
  hp, maxHp
);
```

$.proportional handles:
- ✅ First message only at exactly 0
- ✅ Last message only at exactly max
- ✅ Even distribution of middle messages
- ✅ No edge case bugs

### How It Works

- First message (index 0) is returned ONLY when amount = 0
- Last message (index n-1) is returned ONLY when amount = total
- Middle messages are distributed evenly across the remaining range

### Basic Usage

```javascript
// Select message based on current/max value
const healthMsg = await $.proportional.sub(
  ['dead', 'critical', 'wounded', 'hurt', 'healthy'],
  player.hp,      // current value
  player.maxHp    // maximum value
);

// Example with hp=15, maxHp=100:
//   hp=0:      'dead'
//   hp=1-24:   'critical'
//   hp=25-49:  'wounded'
//   hp=50-74:  'hurt'
//   hp=75-99:  'healthy' (close but not at max)
//   hp=100:    'healthy' (at max)
```

### Get Index Instead

```javascript
// Get which message index (0-based) would be selected
const idx = await $.proportional.index(['empty', 'low', 'half', 'full'], 50, 100);
// idx = 2 (would select 'half')
```

### Percentage Shorthand

```javascript
// Use percentage directly (0-100 scale)
const msg = await $.proportional.fromPercent(
  ['empty', 'quarter', 'half', 'three-quarters', 'full'],
  75
);
// Returns 'three-quarters'
```

### Common Use Cases

```javascript
// Hunger system
const hunger = await $.proportional.sub(
  ['starving', 'famished', 'hungry', 'peckish', 'satisfied', 'full', 'stuffed'],
  player.food, player.maxFood
);

// Container capacity
const capacity = await $.proportional.sub(
  ['empty', 'nearly empty', 'partially filled', 'mostly full', 'full'],
  container.contents.length, container.capacity
);

// Weapon durability
const condition = await $.proportional.sub(
  ['broken', 'badly damaged', 'damaged', 'worn', 'good', 'pristine'],
  weapon.durability, weapon.maxDurability
);
```

## $.prompt - Interactive Prompts

Use `$.prompt` for gathering input from players. All prompts return Promises that resolve when the player responds.

### Why Not Manual Input Handling?

```javascript
// DON'T: 25 lines of fragile manual input handling
async function getPlayerChoice(player, options) {
  await player.tell('Choose an option:');
  for (let i = 0; i < options.length; i++) {
    await player.tell((i + 1) + '. ' + options[i]);
  }
  player.pendingInput = true;
  player.inputCallback = (input) => {
    player.pendingInput = false;
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 1 || num > options.length) {
      player.tell('Invalid choice.');
      return getPlayerChoice(player, options); // Retry
    }
    return options[num - 1];
  };
  // ... handle disconnects, timeouts, nested prompts, etc.
}

// DO: 1 line that handles everything
const choice = await $.prompt.choice(player, 'Choose:', { opt1: 'Option 1', opt2: 'Option 2' });
```

$.prompt handles:
- ✅ Display formatting
- ✅ Input validation and retry
- ✅ Nested prompt prevention
- ✅ @abort cancellation
- ✅ Disconnect cleanup

### Text Questions

```javascript
// Simple text question
const name = await $.prompt.question(player, 'What is your name? ');
await player.tell('Hello, ' + name + '!');

// With validation
const age = await $.prompt.question(player, 'Enter your age: ', (input) => {
  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > 150) {
    return 'Please enter a valid age (1-150).';
  }
  return null; // null = valid
});
```

### Yes/No Questions

```javascript
const confirmed = await $.prompt.yesorno(player, 'Are you sure?');
if (confirmed) {
  await player.tell('Proceeding...');
} else {
  await player.tell('Cancelled.');
}
// Accepts: yes, y, no, n (case insensitive)
```

### Choice Menus

```javascript
// Simple numbered choice
const choice = await $.prompt.choice(player, 'Pick a class:', {
  warrior: 'Warrior - Strong melee fighter',
  mage: 'Mage - Powerful spellcaster',
  rogue: 'Rogue - Stealthy assassin',
});
await player.tell('You chose: ' + choice); // Returns key: 'warrior', 'mage', or 'rogue'

// Columnar menu (better for many options)
const race = await $.prompt.menu(player, 'Choose your race:', {
  human: 'Human',
  elf: 'Elf',
  dwarf: 'Dwarf',
  orc: 'Orc',
  halfling: 'Halfling',
  gnome: 'Gnome',
}, 2); // 2 columns
// Accepts: number, key name, or partial match
```

### Multiline Input

```javascript
// Collect multiple lines (ends with '.' on its own line)
const description = await $.prompt.multiline(player, 'Enter your description:');
// Player types multiple lines, ends with just "."
// User can type @abort to cancel (throws Error)

player.description = description;
await player.tell('Description set!');
```

### Prompt State Management

```javascript
// Check if player is in a prompt
if (await $.prompt.isActive(player)) {
  await player.tell('Please answer the current question first.');
  return;
}

// Cancel current prompt (resolves with null)
await $.prompt.cancel(player);
```

## $.memento - Object Cloning

Use `$.memento` to serialize object graphs and create clones with new IDs. Perfect for body templates, equipment sets, or any object tree that needs duplication.

### Why Not Manual Cloning?

```javascript
// DON'T: 30+ lines of error-prone manual cloning
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
    newPart.owner = newBody.id;  // Update reference
    // ... copy properties ...

    // Handle nested parts (recursive nightmare)
    for (const childId of part.children || []) {
      // ... another 20 lines of recursive cloning ...
    }
    newParts[part.name] = newPart.id;
  }
  newBody.parts = Object.values(newParts);
  return newBody;
}

// DO: 2 lines that handle the entire object graph
async function cloneBody(body, ...allParts) {
  const clones = await $.memento.clone([body, ...allParts]);
  return clones['%0']; // New body with all internal refs updated
}
```

$.memento handles:
- ✅ Deep object graph traversal
- ✅ Internal reference remapping (part.owner -> new body ID)
- ✅ External reference preservation (prototype stays same)
- ✅ New ID allocation for every cloned object
- ✅ Property copying

### How It Works

- **capture()** - Serializes objects to JSON, replacing in-graph IDs with placeholders
- **rehydrate()** - Creates new objects from the serialized data with fresh IDs
- External references (objects not in the capture list) stay as-is

### Basic Cloning

```javascript
// Clone a single object
const clone = await $.memento.clone([original]);
const newObj = clone['%0']; // %0 is first object

// Clone a connected tree (body with parts)
const clones = await $.memento.clone([body, head, leftArm, rightArm]);
// clones['%0'] = new body, clones['%1'] = new head, etc.
// Internal references are updated to point to new objects
```

### Capture and Rehydrate Separately

```javascript
// Capture to JSON (for storage/templates)
const template = await $.memento.capture([body, head, leftArm, rightArm]);
// template is a JSON string

// Store the template
prototype.bodyTemplate = template;

// Later: create instances from template
const newParts = await $.memento.rehydrate(prototype.bodyTemplate);
const newBody = newParts['%0'];
```

### What Gets Captured

```javascript
// Objects in the array = "in-graph" -> get new IDs
// References to other objects = "external" -> stay as existing IDs

const parts = await $.memento.clone([body, arm]);
// body.owner = #123 (external) -> stays #123
// arm.parent = body (in-graph) -> updated to new body's ID
```

## $.mutex - Object Locks

Use `$.mutex` for preventing race conditions on objects. Locks are stored on the objects themselves and can auto-expire.

### Why Not Manual Lock Tracking?

```javascript
// DON'T: 20+ lines of buggy manual locking
const locks = {}; // Global state - bad!

async function startCrafting(player, item) {
  const key = item.id + ':craft';
  if (locks[key]) {
    await player.tell('Item is being crafted by someone else.');
    return;
  }
  locks[key] = { player: player.id, time: Date.now() };

  try {
    await doCrafting(item);
  } finally {
    delete locks[key]; // Easy to forget!
  }
  // What if server crashes? Lock never released.
  // What if timeout? Need separate cleanup job.
  // What about lock data? Need separate structure.
}

// DO: 4 lines with automatic timeout and data storage
async function startCrafting(player, item) {
  const blocked = await $.mutex.acquire(item, 'craft', { player: player.id }, 60000);
  if (blocked) return player.tell('Being crafted by #' + blocked.player);

  await doCrafting(item);
  await $.mutex.release(item, 'craft');
}
```

$.mutex handles:
- ✅ Lock state persisted on the object itself
- ✅ Automatic timeout/expiry
- ✅ Arbitrary data storage with lock
- ✅ Survives server restarts
- ✅ No global state pollution

### Basic Locking

```javascript
// Try to acquire a lock
const blocked = await $.mutex.acquire(room, 'movement');

if (blocked) {
  // Lock already held - blocked contains the stored data
  await player.tell('Room is busy, please wait.');
  return;
}

// Got the lock - do work
await movePlayer(player, room);

// Release when done
await $.mutex.release(room, 'movement');
```

### Locks with Data

```javascript
// Store data with the lock (who/what is holding it)
const blocked = await $.mutex.acquire(room, 'combat', {
  attacker: player.id,
  startedAt: Date.now()
});

if (blocked) {
  // blocked = { attacker: 456, startedAt: 1234567890 }
  await player.tell('Combat in progress by player #' + blocked.attacker);
  return;
}
```

### Auto-Expiring Locks

```javascript
// Lock with timeout (auto-releases after 30 seconds)
await $.mutex.acquire(player, 'crafting', { item: 'sword' }, 30000);

// Do long operation...

// Release manually (cancels auto-release)
await $.mutex.release(player, 'crafting');

// Or let it auto-release if player disconnects/times out
```

### Other Operations

```javascript
// Check without acquiring
const holder = await $.mutex.check(obj, 'lockName');
if (holder) {
  // Lock is held, holder contains the data
}

// Update data on existing lock
await $.mutex.update(obj, 'lockName', { newData: true });

// Extend timeout on existing lock
await $.mutex.extend(obj, 'lockName', 60000); // Another 60s

// List all locks on object (debugging)
const locks = await $.mutex.list(obj);
// { lockName: { data: {...}, acquiredAt: 1234567890 }, ... }

// Release all locks on object
await $.mutex.releaseAll(obj);
```

## $.scheduler - Periodic Jobs

Use `$.scheduler` for recurring tasks like heartbeats, decay processing, and timed events.

### Why Not setInterval/setTimeout?

```javascript
// DON'T: 25 lines of fragile timer management
const jobs = {};

function startDecayJob() {
  if (jobs.decay) clearInterval(jobs.decay);
  jobs.decay = setInterval(async () => {
    try {
      await processDecay();
    } catch (e) {
      console.error('Decay failed:', e);
      // Job silently dies, nothing restarts it
    }
  }, 60000);
}

// On server restart: all jobs lost!
// On crash mid-job: state inconsistent!
// Want to pause? Add more tracking code.
// Want to run now for testing? More code.
// Enable/disable? More code.

// DO: 1 line, persistent, manageable
await $.scheduler.schedule('decayTick', 0, 60000, $.system, 'processDecay');
// Survives restarts, can pause/resume, can runNow for testing
```

$.scheduler handles:
- ✅ Persistence across server restarts
- ✅ Enable/disable without losing config
- ✅ Manual trigger for testing (`runNow`)
- ✅ Job inspection (`getJob`, `listJobs`)
- ✅ Proper error isolation

### Scheduling Jobs

```javascript
// schedule(name, delay, interval, target, method, ...args)

// One-shot: runs once after delay, then deleted
await $.scheduler.schedule('reminder', 60000, 0, player, 'tell', 'Remember to save!');
// Runs in 60 seconds, then job is removed

// Repeating: runs every interval after initial delay
await $.scheduler.schedule('heartbeat', 0, 60000, $.system, 'tick');
// First run immediately (delay=0), then every 60 seconds

// Delayed start repeating
await $.scheduler.schedule('warmup', 10000, 60000, $.system, 'tick');
// First run in 10s, then every 60s thereafter
```

### Job Parameters

| Parameter | Description |
|-----------|-------------|
| `name` | Unique job identifier |
| `delay` | ms until first run (0 = next tick) |
| `interval` | ms between runs (0 = one-shot, deleted after run) |
| `target` | Object (or ID) to call method on |
| `method` | Method name to call |
| `...args` | Arguments to pass to method |

### Managing Jobs

```javascript
// Remove a job
await $.scheduler.unschedule('jobName');

// Enable/disable without removing
await $.scheduler.setEnabled('jobName', false);
await $.scheduler.setEnabled('jobName', true);

// Get job info
const job = await $.scheduler.getJob('jobName');
// { interval, nextRun, targetId, method, args, enabled }

// List all job names
const names = await $.scheduler.listJobs();
// ['heartbeat', 'decayTick', ...]

// Force immediate run (for testing)
await $.scheduler.runNow('jobName');
```

### Built-in Jobs

The system registers these jobs automatically:

| Job | Interval | Purpose |
|-----|----------|---------|
| `playerHeartbeat` | 60s | Calls `$.system.tickAllPlayers()` |
| `decayTick` | 60s | Processes decay on all decayable objects |

### Custom Recurring Tasks

```javascript
// Example: save all players every 5 minutes
await $.scheduler.schedule('autosave', 0, 300000, $.system, 'saveAllPlayers');

// Example: respawn enemies every 10 minutes
await $.scheduler.schedule('respawn', 0, 600000, spawner, 'respawnAll');

// Example: clean up expired sessions hourly
await $.scheduler.schedule('cleanup', 0, 3600000, $.authManager, 'cleanupSessions');
```

## $.emote - Sensory Emotes

Freeform emote parsing with sensory awareness. Different viewers perceive different parts based on their senses.

### Input Modes

| Prefix | Type | Routed Via | Example |
|--------|------|------------|---------|
| `.verb` | Visual | `viewer.see()` | `.smile` |
| `,verb` | Audible | `viewer.hear()` | `,growl` |
| `~verb` | Olfactory | `viewer.smell()` | `~reek of garlic` |
| `^verb` | Gustatory | `viewer.taste()` | `^taste blood` |
| `"text"` | Speech | `viewer.hear()` | `"Hello!"` |

### Syntax

```
.verb phrase          - Visual action, verb conjugated (you fall / Bob falls)
,verb phrase          - Audible non-speech (growl, sigh, footsteps)
~verb phrase          - Smell-based action
^verb phrase          - Taste-based action
.say "text"           - Speech with verb
"text"                - Direct speech (says, "text")
PlayerName            - Shift target for following pronouns
him/her/them          - Object pronouns refer to current target
myself/yourself       - Reflexive pronouns refer to actor
```

### Methods

```javascript
// Parse and broadcast to room (main entry point)
await $.emote.broadcast('.smile at Bob and "Hello!"', actor, room);

// Parse emote into segments (for inspection)
const segments = await $.emote.parseSegments('.fall and ,groan', actor, false);

// Format for a specific viewer
const text = await $.emote.format(segments, viewer);

// Process emote string for a single viewer
const result = await $.emote.processEmote('.wave', actor, viewer);
```

### Sensory Routing Examples

```javascript
// Input: .smile and "Hello!"
// Sighted+Hearing: "Bob smiles and says, 'Hello!'"
// Blind:           "Bob says, 'Hello!'"
// Deaf:            "Bob smiles and says something."

// Input: ,growl menacingly
// Hearing: "Bob growls menacingly."
// Deaf:    (nothing)

// Input: ~reek of garlic
// Can smell: "Bob reeks of garlic."
// Anosmic:   (nothing)

// Input: ^taste blood in your mouth
// Has tongue: "You taste blood in your mouth."
// No tongue:  (nothing)
```

### Targeting

```javascript
// Shift target mid-emote
'.wave to Player2 and .wink at him'
// "Bob waves to Player2 and winks at him."

// Multiple targets
'.look from Player2 to Player3 and .shrug'
// "Bob looks from Player2 to Player3 and shrugs."
```

### Pronoun Helpers

```javascript
// Get appropriate pronoun for an object
await $.emote.getObjectPronoun(player)     // "him"/"her"/"them"
await $.emote.getPossessive(player)        // "his"/"her"/"their"
await $.emote.getReflexive(player)         // "himself"/"herself"/"themselves"
await $.emote.getSubjectPronoun(player)    // "he"/"she"/"they"
```

## How `$` Works: ObjectManager and Aliases

The `$` variable in MOO code is a **Proxy** that provides convenient access to the object system. Understanding how it works is essential.

### `$` Is the ObjectManager (#0)

**`$` itself is object #0**—the ObjectManager, the root of the entire object system. It:
- Allocates new object IDs
- Stores the global alias registry
- Is always the first object created during bootstrap
- Cannot be recycled or deleted

```javascript
// $ IS #0 - these are all the same object
$                    // The ObjectManager
await $.load(0)      // Load #0
await $[0]           // Load #0 by index

// $ has an 'aliases' property - a simple { name: id } map
$.aliases
// { nothing: -1, root: 1, system: 2, english: 5, format: 6, ... }
```

### How `$.alias` Syntax Works

When you write `$.english`, the Proxy does this:

```javascript
// $.english internally does:
const id = $.aliases['english'];  // Look up 'english' in $.aliases -> 5
const obj = await $.load(id);     // Load object #5
return obj;                       // Return the RuntimeObject
```

So `$.english.plural('cat')` is really:
1. Get `$.aliases` property
2. Find `english` -> `5`
3. Load object #5
4. Call its `plural` method

### The Alias Registry

All aliases live in `$.aliases` (which is `$.properties.aliases`):

```javascript
{
  nothing: -1,           // Special: null reference
  object_manager: 0,     // #0 itself
  root: 1,               // Base prototype for all objects
  system: 2,             // Connection router, player management

  // Utilities (dynamically assigned IDs)
  english: 5,
  pronoun: 6,
  format: 7,
  recycler: 8,
  // ... etc
}
```

IDs above 2 are **dynamic**—they're assigned at bootstrap time and may differ between databases. That's why you use `$.english` instead of `$[5]`.

### Why Use Aliases?

```javascript
// DON'T: Hardcoded IDs break when database changes
const english = await $[5];  // What if english is #7 in this DB?

// DO: Aliases are stable across databases
const english = $.english;   // Always works
```

### Managing Aliases

Since `$` is the ObjectManager, it has methods for alias management:

```javascript
// Add an alias (makes $.myUtils work)
await $.addAlias('myUtils', obj.id);

// Remove an alias
await $.removeAlias('myUtils');  // Returns true if removed

// Look up an alias
const id = await $.getAlias('myUtils');  // Returns ID or undefined

// Direct access to the map (read-only preferred)
const allAliases = $.aliases;
```

### Core Aliases (Protected)

These four aliases are protected and cannot be removed:

| Alias | Object | Purpose |
|-------|--------|---------|
| `nothing` | #-1 | Null reference |
| `object_manager` | #0 | ObjectManager itself |
| `root` | #1 | Base prototype for all objects |
| `system` | #2 | Connection router, player tracking |

### `$[id]` vs `$.alias`

```javascript
// Load by numeric ID (when you have the ID)
const obj = await $[42];
const obj = await $.load(42);  // Equivalent

// Load by alias (when you want a well-known utility)
const english = $.english;
const format = $.format;

// $ itself is #0, so these are redundant but valid:
const om = await $[0];  // Same as just using $
```

### Creating Your Own Aliases

```javascript
// 1. Create the object
const myUtils = await $.recycler.create($.root, {
  name: 'MyUtils',
  description: 'Custom utility functions'
});

// 2. Add methods to it
myUtils.setMethod('hello', `
  return 'Hello, ' + (args[0] || 'world') + '!';
`);

// 3. Register the alias ($ is the ObjectManager)
await $.addAlias('myUtils', myUtils.id);

// 4. Now it's available everywhere as $.myUtils
await $.myUtils.hello('Bob');  // "Hello, Bob!"
```

## Creating New Utility Objects

There are two ways to create new `$.aliased` objects:

### 1. Runtime: @alias Command (Admins)

Create utilities in-game without restarting:

```
@create                     ; Create an object
  Parent: 1
  Name: MyUtils

@alias myUtils=#42          ; Register as $.myUtils

@aliases                    ; List all aliases
@alias myUtils              ; Show specific alias
@unalias myUtils            ; Remove alias
```

Then add methods to it:

```
@setVerb #42 greet
  Enter code (end with . on its own line):
  await player.tell('Hello from $.myUtils!');
  .
```

Now callable as `await $.myUtils.greet()` from anywhere.

### 2. MOO Code: $.addAlias()

From within MOO code, use `$` (the ObjectManager) directly:

```javascript
// Create an object and register it as an alias
const utils = await $.recycler.create($.root, { name: 'MyUtils' });
utils.setMethod('greet', `
  return 'Hello, ' + (args[0] || 'stranger') + '!';
`);

await $.addAlias('myUtils', utils.id);
// Now $.myUtils.greet('Bob') works from anywhere
```

### 3. Bootstrap: Builder Pattern (Developers)

For utilities that should exist on fresh databases, create a builder:

```typescript
// src/database/bootstrap/my-utils-builder.ts
import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../../types/object.js';

export class MyUtilsBuilder {
  private myUtils: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists
    const objectManager = await this.manager.load(0);
    const aliases = objectManager?.get('aliases') as Record<string, number> || {};

    if (aliases.myUtils) {
      this.myUtils = await this.manager.load(aliases.myUtils);
      if (this.myUtils) return;
    }

    // Create the utility object
    this.myUtils = await this.manager.create({
      parent: 1,
      properties: {
        name: 'MyUtils',
        description: 'My custom utilities',
      },
      methods: {},
    });

    // Add methods
    this.myUtils.setMethod('greet', `
      const name = args[0] || 'stranger';
      return 'Hello, ' + name + '!';
    `);
  }

  async registerAlias(): Promise<void> {
    if (!this.myUtils) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    // Use the addAlias method on ObjectManager (#0)
    await objectManager.call('addAlias', 'myUtils', this.myUtils.id);
  }
}
```

Then integrate into the bootstrap process.

### Best Practices for Utility Objects

1. **Check idempotency** - Always check if the alias already exists before creating
2. **Use parent #1** (Root) - Utilities don't need complex inheritance
3. **Document methods** - Add JSDoc comments in method code
4. **Delegate to existing utilities** - Don't duplicate logic from `$.english`, `$.format`, etc.
5. **Register alias last** - Create object and methods before registering the alias

## Common Patterns

### Announcing Actions to a Room

```javascript
// DON'T: Manual string building
const msg = actor.name + ' picks up the ' + item.name + '.';
room.announce(msg);

// DO: Use $.pronoun.announce for perspective-correct messages
await $.pronoun.announce(room, '%N %v{pick} up %d.', actor, item);
```

### Listing Items with Proper Grammar

```javascript
// DON'T: Manual join
const msg = items.join(', ');

// DO: Use $.format.prose for Oxford comma
const msg = await $.format.prose(items.map(i => i.name));
// "sword, shield, and helm"
```

### Conjugating Verbs

```javascript
// DON'T: Inline conjugation logic
const verb = count === 1 ? 'falls' : 'fall';

// DO: Use $.english.conjugate or $.format.verb
const verb = await $.format.verb('fall', count);
// Or for non-count contexts:
const verb = await $.english.conjugate('fall', 3);
```

### Destroying Objects

```javascript
// DON'T: Just unlink and forget
item.set('location', null);

// DO: Properly recycle for reuse
await $.recycler.recycle(item);
```

### Multi-Item Messages

```javascript
// DON'T: Build complex strings manually
let msg = '';
if (items.length === 1) {
  msg = 'The ' + items[0] + ' falls.';
} else {
  msg = 'The ' + items.join(' and ') + ' fall.';
}

// DO: Use $.format.compose
const msg = await $.format.compose('%T %v{fall}.', items.map(i => i.name));
```

## Prototype Hierarchy

When creating new object types, inherit from the appropriate prototype:

| Prototype | Inherits From | Use For |
|-----------|---------------|---------|
| `$.describable` | `$.root` | **Foundation** - anything that exists in the world |
| `$.location` | `$.describable` | Containers (holds contents) |
| `$.room` | `$.location` | Rooms with exits |
| `$.exit` | `$.describable` | Directional links between rooms |
| `$.agent` | `$.describable` | Things that can act (NPCs) |
| `$.embodied` | `$.agent` | Agents with physical bodies |
| `$.human` | `$.embodied` | Human-type embodied agents |
| `$.player` | `$.human` | Player characters |
| `$.admin` | `$.player` | Wizard/admin players |
| `$.decayable` | `$.describable` | Things that decay over time |
| `$.edible` | `$.decayable` | Consumable items |
| `$.food` | `$.edible` | Solid food |
| `$.drink` | `$.edible` | Liquids |
| `$.bodyPart` | `$.edible` | Body parts (yes, they're edible!) |
| `$.wearable` | `$.describable` | Items that can be worn |
| `$.clothing` | `$.wearable` | Wearable clothing items |

## Inheritance, Shadowing, and pass()

Objects inherit properties and methods from their parent chain. Understanding how shadowing and `pass()` work is essential.

### Property Inheritance

When you read a property, the system walks up the parent chain until it finds a value:

```javascript
// Player #100 (parent: $.player)
// $.player (parent: $.human)
// $.human has: maxHp = 100

const hp = player.maxHp;  // Found on $.human -> returns 100
```

### Property Shadowing

When you **set** a property, it's ALWAYS set on the object itself, creating a shadow:

```javascript
// $.human has: maxHp = 100

player.maxHp = 150;  // Sets on player #100, NOT on $.human

// Now:
// - player.maxHp = 150 (own property, shadows parent)
// - $.human.maxHp = 100 (unchanged)
// - Other players still inherit 100 from $.human
```

**This is how instances customize inherited defaults:**

```javascript
// All players inherit maxHp=100 from $.human
// But a specific player can override:
player.maxHp = 200;  // This player is special

// Another player still gets the default:
otherPlayer.maxHp;  // 100 (inherited from $.human)
```

### Method Inheritance

Methods work the same way - the system searches up the parent chain:

```javascript
// Player #100 doesn't have 'describe' method
// $.player doesn't have it
// $.human doesn't have it
// $.embodied doesn't have it
// $.agent doesn't have it
// $.describable HAS it!

await player.describe();  // Executes $.describable's describe method
                          // But 'self' is player #100
```

### Method Shadowing

Define a method on your object to shadow the parent's version:

```javascript
// $.describable has: describe() -> returns name + description

// Override on a specific room:
room.setMethod('describe', `
  // Custom description that adds exit info
  let text = self.name + '\\n' + self.description;
  text += '\\nExits: ' + Object.keys(self.exits || {}).join(', ');
  return text;
`);

// Now room.describe() uses the custom version
// Other rooms still use $.describable's version
```

### The pass() Function - Calling Parent Methods

`pass()` calls the **parent's version** of the current method. Essential for extending rather than replacing behavior.

```javascript
// In $.admin.connect():
// We want to add admin verbs, then do everything $.player.connect() does

async connect() {
  // Register admin-specific verbs FIRST
  await self.registerVerb(['@dig %s'], self, 'dig');
  await self.registerVerb(['@create'], self, 'create');
  await self.registerVerb(['@teleport %i to %i'], self, 'teleport');

  // NOW call parent's connect() to get all player verbs
  await pass();  // Calls $.player.connect()
}
```

### pass() with Arguments

Pass different arguments to the parent method:

```javascript
// In a custom describe() method:
async describe() {
  // Get the parent's description first
  const baseDesc = await pass();  // Calls parent's describe()

  // Add our custom stuff
  return baseDesc + '\\nIt glows faintly.';
}

// Pass different args:
async damage(amount) {
  // Double the damage, then let parent handle it
  await pass(amount * 2);
}
```

### pass() Chains Correctly

`pass()` always searches from where the **current method is defined**, not from `self`:

```javascript
// Hierarchy: $.admin -> $.player -> $.human -> ...
// $.player has connect()
// $.admin has connect() that calls pass()

// When admin player connects:
// 1. $.admin.connect() runs (self = admin player)
// 2. pass() searches from $.admin's parent ($.player)
// 3. $.player.connect() runs (self still = admin player)
// 4. If $.player.connect() also called pass(), it would search from $.player's parent
```

### Common pass() Patterns

**Extend behavior (do extra stuff):**
```javascript
// Add behavior before parent
async onArrived(dest, source, mover) {
  await self.registerVerb(['special'], self, 'doSpecial');  // Our addition
  await pass(dest, source, mover);  // Then do normal arrival stuff
}

// Add behavior after parent
async describe() {
  const base = await pass();  // Get parent's description
  return base + '\\n[SPECIAL ITEM]';  // Add our suffix
}
```

**Modify input:**
```javascript
async damage(amount) {
  // Armor reduces damage
  const reduced = Math.max(0, amount - self.armor);
  await pass(reduced);  // Parent handles reduced damage
}
```

**Modify output:**
```javascript
async getWeight() {
  const base = await pass();  // Get parent's weight calculation
  return base + self.carryingWeight;  // Add what we're carrying
}
```

**Conditional override:**
```javascript
async canContain(item) {
  // Special rejection
  if (item.isEvil && self.isHoly) {
    return 'The holy container rejects the evil item!';
  }
  // Otherwise use parent's logic
  return await pass(item);
}
```

### When NOT to Use pass()

```javascript
// DON'T: Call pass() when completely replacing behavior
async describe() {
  // We're doing something completely different
  return 'You cannot see this object.';
  // No pass() - we don't want parent's behavior at all
}

// DON'T: Forget to pass arguments
async onArrived(dest, source, mover) {
  await pass();  // WRONG - lost the arguments!
  await pass(dest, source, mover);  // RIGHT
}
```

### Real-World Example: The Clothing Hierarchy

This shows how `$.wearable` → `$.clothing` → specific item uses shadowing and pass():

```javascript
// ═══════════════════════════════════════════════════════════
// $.wearable - Base prototype (defines core properties)
// ═══════════════════════════════════════════════════════════
// Properties defined here:
//   covers: ['torso']     - body slots this covers
//   layer: 2              - layering order
//   warmth: 0             - cold protection
//   wornBy: null          - who's wearing it

// Method: wear() - core state change logic
async wear(wearer) {
  if (self.wornBy) return { success: false, error: 'Already worn' };

  // Find body part, check layer conflicts, etc.
  self.wornBy = wearer;
  self.wornOn = bodyPart;
  return { success: true };
}

// ═══════════════════════════════════════════════════════════
// $.clothing - Inherits from $.wearable (adds verbs + messaging)
// ═══════════════════════════════════════════════════════════
// Properties ADDED here (shadows nothing):
//   material: 'cotton'
//   color: 'white'

// Method: doWear() - verb handler that USES parent's wear()
async doWear() {
  const wearer = args[1];

  // Call the BASE method (on $.wearable) for state change
  const result = await self.wear(wearer);  // NOT pass() - different method!
  if (!result.success) return result.error;

  // Swap verbs
  await wearer.unregisterVerbsFrom(self);
  await wearer.registerVerb(['remove %t'], self, 'doRemove');

  // Announce
  await $.pronoun.announce(room, '%N puts on %d.', wearer, self);
  return result.message;
}

// ═══════════════════════════════════════════════════════════
// Warm Wool Cloak (instance, parent: $.clothing)
// ═══════════════════════════════════════════════════════════
// Properties that SHADOW parent defaults:
//   name: 'warm wool cloak'     - shadows $.describable default
//   warmth: 40                  - shadows $.wearable's 0
//   covers: ['shoulders']       - shadows $.wearable's ['torso']
//   material: 'wool'            - shadows $.clothing's 'cotton'
//   color: 'gray'               - shadows $.clothing's 'white'

// NO methods defined - inherits doWear from $.clothing
// When player types "wear cloak":
//   1. cloak.doWear() found on $.clothing
//   2. Executes with self = this specific cloak
//   3. self.warmth = 40 (own property)
//   4. self.wear() calls $.wearable.wear() with self = cloak
```

### Real-World Example: Admin Extends Player

```javascript
// ═══════════════════════════════════════════════════════════
// $.player.connect() - registers base commands
// ═══════════════════════════════════════════════════════════
async connect() {
  // Register player verbs
  await self.registerVerb(['look', 'l'], self, 'look');
  await self.registerVerb(['inventory', 'i'], self, 'inventory');
  await self.registerVerb(['say %s', '"%s"'], self, 'say');
  await self.registerVerb(['go %s'], self, 'go');
  await self.registerVerb(['get %i', 'take %i'], self, 'get');
  await self.registerVerb(['drop %i'], self, 'drop');
  await self.registerVerb(['quit', '@quit'], self, 'quit');

  // Move to starting location, trigger room announcements
  const startRoom = await $.load(self.location);
  await startRoom.onContentArrived(self, null, self);
}

// ═══════════════════════════════════════════════════════════
// $.admin.connect() - adds admin commands, then calls parent
// ═══════════════════════════════════════════════════════════
async connect() {
  // FIRST: Register admin-only verbs
  await self.registerVerb(['@dig %s'], self, 'dig');
  await self.registerVerb(['@create'], self, 'create');
  await self.registerVerb(['@teleport %i to %i', '@tel %i to %i'], self, 'teleport');
  await self.registerVerb(['@set %s'], self, 'setProperty');
  await self.registerVerb(['@examine %i', '@exam %i'], self, 'examine');
  await self.registerVerb(['@eval %s'], self, 'eval');
  await self.registerVerb(['@alias %s'], self, 'alias');

  // THEN: Call parent to get all player verbs too
  await pass();
  // Now admin has: @dig, @create, @teleport... AND look, inventory, say, go...
}
```

### Real-World Example: Custom Room Description

```javascript
// ═══════════════════════════════════════════════════════════
// $.describable.describe() - base description
// ═══════════════════════════════════════════════════════════
async describe(viewer) {
  return self.name + '\n' + self.description;
}

// ═══════════════════════════════════════════════════════════
// $.location.describe() - adds contents listing
// ═══════════════════════════════════════════════════════════
async describe(viewer) {
  let text = await pass(viewer);  // Get base description

  // Add contents (excluding viewer)
  const visible = [];
  for (const id of self.contents || []) {
    if (id === viewer?.id) continue;
    const obj = await $.load(id);
    if (obj) visible.push(obj.name);
  }

  if (visible.length > 0) {
    text += '\n\nYou see: ' + visible.join(', ');
  }
  return text;
}

// ═══════════════════════════════════════════════════════════
// $.room.describe() - adds exits
// ═══════════════════════════════════════════════════════════
async describe(viewer) {
  let text = await pass(viewer);  // Get location description (includes contents)

  // Add exits
  const exitDirs = Object.keys(self.exits || {});
  if (exitDirs.length > 0) {
    text += '\n\nExits: ' + exitDirs.join(', ');
  }
  return text;
}

// ═══════════════════════════════════════════════════════════
// The Haunted Library (specific room instance)
// ═══════════════════════════════════════════════════════════
// Shadows the describe() method for special behavior
room.setMethod('describe', `
  // Get the normal room description (name, desc, contents, exits)
  let text = await pass(args[0]);

  // Add spooky atmospheric text
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) {
    text += '\\n\\nThe shadows seem to move in the candlelight...';
  }

  // Add book count
  const books = (self.contents || []).filter(async id => {
    const obj = await $.load(id);
    return obj?.isBook;
  });
  if (books.length > 0) {
    text += '\\n\\n' + books.length + ' dusty tomes line the shelves.';
  }

  return text;
`);

// Result when looking at Haunted Library at midnight:
// "The Haunted Library
// A vast room filled with ancient bookshelves reaching to the vaulted ceiling.
//
// You see: old lantern, wooden ladder
//
// Exits: north, east, up
//
// The shadows seem to move in the candlelight...
//
// 47 dusty tomes line the shelves."
```

### Real-World Example: Damage Reduction Chain

```javascript
// ═══════════════════════════════════════════════════════════
// $.embodied.takeDamage() - base damage handling
// ═══════════════════════════════════════════════════════════
async takeDamage(amount, type, source) {
  self.hp = Math.max(0, self.hp - amount);

  if (self.hp <= 0) {
    await self.die(source);
  }

  return amount;  // Return actual damage taken
}

// ═══════════════════════════════════════════════════════════
// $.human.takeDamage() - adds armor reduction
// ═══════════════════════════════════════════════════════════
async takeDamage(amount, type, source) {
  // Calculate armor reduction
  let reduced = amount;
  const armor = await self.getArmorValue(type);
  reduced = Math.max(1, amount - armor);  // Always at least 1

  // Pass reduced damage to parent
  return await pass(reduced, type, source);
}

// ═══════════════════════════════════════════════════════════
// $.player.takeDamage() - adds pain messages
// ═══════════════════════════════════════════════════════════
async takeDamage(amount, type, source) {
  // Let parent chain handle the actual damage
  const actualDamage = await pass(amount, type, source);

  // Add player feedback
  const severity = await $.proportional.sub(
    ['a scratch', 'painful', 'serious', 'devastating'],
    actualDamage, 50
  );
  await self.tell('You take ' + severity + ' damage!');

  return actualDamage;
}

// When a player takes 30 slashing damage:
// 1. $.player.takeDamage(30, 'slashing', enemy) called
// 2. pass(30, ...) → $.human.takeDamage(30, 'slashing', enemy)
// 3. Armor reduces to 22, pass(22, ...) → $.embodied.takeDamage(22, ...)
// 4. HP reduced by 22, returns 22
// 5. Back in $.human, returns 22
// 6. Back in $.player, shows "You take serious damage!", returns 22
```

## $.describable - The Foundation

**Everything that exists in the world inherits from `$.describable`.** It provides:

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name |
| `description` | string | Long description |
| `aliases` | string[] | Alternative names for matching |
| `location` | number \| null | Object ID of container, or null |
| `contents` | number[] | Object IDs of contained objects |
| `width` | number | Width in centimeters |
| `height` | number | Height in centimeters |
| `depth` | number | Depth in centimeters |
| `weight` | number | Weight in grams |
| `boltedDown` | boolean | If true, cannot be moved |

### Core Methods

```javascript
// Get description (name + description text)
const desc = await obj.describe();

// Get short description (just name)
const short = await obj.shortDesc();

// Get volume in cubic centimeters
const volume = await obj.getVolume();

// Check if this fits inside a container
const fits = await obj.canFitIn(container);  // true/false

// Check if this can contain another object
const result = await obj.canContain(item);   // true or rejection string
```

### The moveTo() Method - THE Primitive for Movement

**ALL movement goes through `moveTo()`.** This is critical:

```javascript
// Move an object to a new location
await item.moveTo(room);              // Item moves to room
await item.moveTo(room, player);      // Player caused the move

// moveTo() handles everything:
// 1. Calls dest.canContain(self) - can reject with string
// 2. Calls source.onContentLeaving() - can throw to cancel
// 3. Calls self.onLeaving() - can throw to cancel
// 4. Updates source.contents and dest.contents
// 5. Updates self.location
// 6. Calls source.onContentLeft() - for cleanup
// 7. Calls self.onArrived() - for setup
// 8. Calls dest.onContentArrived() - for announcements
```

### Movement Hooks

Override these to customize behavior:

```javascript
// On the OBJECT being moved:
obj.setMethod('onLeaving', `
  const [source, dest, mover] = args;
  // Called BEFORE leaving source
  // Throw to cancel the move
  if (self.boltedDown) {
    throw new Error('This is bolted down!');
  }
`);

obj.setMethod('onArrived', `
  const [dest, source, mover] = args;
  // Called AFTER arriving at dest
  // Register verbs, trigger effects, etc.
`);

// On the CONTAINER:
container.setMethod('onContentLeaving', `
  const [obj, dest, mover] = args;
  // Called BEFORE obj leaves this container
  // Throw to prevent departure
`);

container.setMethod('onContentLeft', `
  const [obj, dest, mover] = args;
  // Called AFTER obj left - cleanup
`);

container.setMethod('onContentArrived', `
  const [obj, source, mover] = args;
  // Called AFTER obj arrived - announcements
  await $.pronoun.announce(self, '%N %v{arrive}.', obj);
`);
```

### Why moveTo() Matters

```javascript
// DON'T: Manual location manipulation - BROKEN
item.location = room.id;
room.contents.push(item.id);
// Problems:
// - Old container's contents not updated
// - No hooks fired (announcements, verbs, triggers)
// - No permission checks
// - No canContain validation

// DO: Always use moveTo()
await item.moveTo(room, player);
// Handles everything correctly
```

## $.location - Containers

`$.location` extends `$.describable` to support containing other objects.

### Additional Methods

```javascript
// Add object to contents (called by moveTo)
await container.addContent(objId);

// Remove object from contents (called by moveTo)
await container.removeContent(objId);

// Describe location (shows contents)
const desc = await room.describe(viewer);  // Excludes viewer from "You see:"
```

### Room Messaging

Locations provide messaging to all occupants:

```javascript
// Announce with perspective-aware messages
await room.announce(actor, target, {
  actor: 'You pick up the sword.',      // Actor sees this
  target: 'Bob picks up your sword.',   // Target sees this
  others: 'Bob picks up the sword.'     // Everyone else sees this
}, 'You hear metal scraping.');         // Optional sound

// Message placeholders in announce():
// %a/%A = actor name (you/You if viewer is actor)
// %t/%T = target name (you/You if viewer is target)
// %as/%ao/%ap = actor subject/object/possessive pronoun
// %ts/%to/%tp = target subject/object/possessive pronoun
// %av{verb} = conjugated verb (cut/cuts based on viewer)

// Broadcast speech (respects language understanding)
await room.broadcastSpeech({ content: 'Hello!', language: 'english' }, speaker);
```

### Container Validation

Override `canContain` to restrict what goes in:

```javascript
// A bag that only holds small items
bag.setMethod('canContain', `
  const item = args[0];
  if (item.weight > 1000) {
    return 'The ' + item.name + ' is too heavy for the bag.';
  }
  if (!await item.canFitIn(self)) {
    return 'The ' + item.name + ' is too large for the bag.';
  }
  return true;  // Allow
`);

// A magic box that only holds gems
magicBox.setMethod('canContain', `
  const item = args[0];
  if (!item.isGem) {
    return 'The magic box rejects the ' + item.name + '.';
  }
  return true;
`);
```

## Verb Registration and Lifecycles

Verbs are **dynamically registered per-player**. There is no global verb table. Each player has their own set of available commands based on what they're holding, wearing, and where they are.

### The Verb System

```javascript
// A verb registration has three parts:
await player.registerVerb(
  ['eat %t', 'devour %t'],  // 1. Patterns (what the player types)
  foodItem,                  // 2. Source object (who handles it)
  'eat'                      // 3. Method name (what to call)
);

// When player types "eat apple":
// 1. matchVerb() scans registered patterns
// 2. Finds 'eat %t' matches, %t resolves to apple in inventory
// 3. Calls foodItem.eat(player, apple)
```

### Pattern Syntax

| Pattern | Meaning | Example Input | Resolves To |
|---------|---------|---------------|-------------|
| `%t` | "this" - the source object | `eat apple` | The registered item |
| `%i` | Item in inventory/room | `give %i to bob` | Any matching object |
| `%s` | String capture | `say %s` | Raw text |
| `literal` | Exact match | `north` | Nothing (just matches) |

**Pattern examples:**
```javascript
// Object-specific verb
await player.registerVerb(['eat %t', 'consume %t'], food, 'eat');
// "eat apple" -> food.eat(player) where food IS the apple

// Item-targeting verb
await player.registerVerb(['give %i to %i'], player, 'doGive');
// "give sword to bob" -> player.doGive(sword, bob)

// Free-form text
await player.registerVerb(['say %s', '"%s"'], player, 'doSay');
// "say hello world" -> player.doSay('hello world')

// Direction (literal match)
await player.registerVerb(['north', 'n'], exit, 'go');
// "north" or "n" -> exit.go(player)
```

### Who Registers Verbs and When

| Source | When | Verbs | Unregistered When |
|--------|------|-------|-------------------|
| **Player prototype** | `connect()` | Core commands (`look`, `inventory`, `say`) | `disconnect()` |
| **Admin prototype** | `connect()` before `pass()` | @commands (`@dig`, `@create`, `@set`) | `disconnect()` |
| **Items (onArrived)** | Picked up/equipped | Object-specific (`eat`, `wear`, `drink`) | Dropped (`onLeaving`) |
| **Room exits (onArrived)** | Enter room | Directions (`north`, `south`, `up`) | Leave room |
| **Worn items** | Equipped | State-change (`remove`) | Removed |

### Registration Flow Examples

**Player Login:**
```javascript
// In $.player.connect():
async connect() {
  // Register base commands
  await self.registerVerb(['look', 'l'], self, 'look');
  await self.registerVerb(['inventory', 'i', 'inv'], self, 'inventory');
  await self.registerVerb(['say %s', '"%s"'], self, 'say');
  await self.registerVerb(['go %s'], self, 'go');
  // ...more core verbs
}
```

**Admin Extends Player:**
```javascript
// In $.admin.connect():
async connect() {
  // Register admin commands BEFORE calling parent
  await self.registerVerb(['@dig %s'], self, 'dig');
  await self.registerVerb(['@create'], self, 'create');
  await self.registerVerb(['@set %i.%s=%s'], self, 'setProp');
  await self.registerVerb(['@teleport %i to %i', '@tel %i to %i'], self, 'teleport');

  // Then call parent's connect to get player verbs
  await pass('connect');
}
```

**Item Pickup:**
```javascript
// In $.clothing.onArrived():
async onArrived(dest, source, mover) {
  // dest = the hand that now holds this item
  if (dest && dest.owner) {
    const owner = await $.load(dest.owner);

    // Register 'wear' verb with the player (not the hand)
    await owner.registerVerb(['wear %t', 'put on %t'], self, 'doWear');
  }
}
```

**Room Entry:**
```javascript
// In $.room.onContentArrived():
async onContentArrived(obj, source, mover) {
  // If a player just entered, register exit verbs
  if (obj.isPlayer) {
    for (const exitId of self.exits || []) {
      const exit = await $.load(exitId);
      const dirs = exit.directions || [];  // ['north', 'n']
      await obj.registerVerb(dirs, exit, 'go');
    }
  }
}
```

### Unregistering Verbs

**Critical:** Always unregister when the source becomes unavailable.

```javascript
// Unregister ALL verbs from a specific source object
await player.unregisterVerbsFrom(itemId);

// This is called automatically in:
// - onLeaving() when item leaves player's possession
// - disconnect() for player's own verbs
// - Room's onContentLeaving() for exit verbs
```

**In $.clothing.onLeaving():**
```javascript
async onLeaving(source, dest, mover) {
  if (source && source.owner) {
    const owner = await $.load(source.owner);
    // Remove all verbs this item registered
    await owner.unregisterVerbsFrom(self.id);
  }
}
```

**In $.room.onContentLeaving():**
```javascript
async onContentLeaving(obj, dest, mover) {
  if (obj.isPlayer) {
    // Remove exit verbs when player leaves
    for (const exitId of self.exits || []) {
      await obj.unregisterVerbsFrom(exitId);
    }
  }
}
```

### Verb Handler Signature

All verb handlers receive:

```javascript
obj.setMethod('myVerb', `
  // args[0] = player who typed the command
  // args[1...n] = resolved items from pattern

  const player = args[0];
  const target = args[1];  // If pattern had %i or %t
  const text = args[2];    // If pattern had %s

  // Return string to send to player
  // Return nothing for silent success
  return 'You did the thing!';
`);
```

**Examples:**
```javascript
// Pattern: 'eat %t'
// Input: "eat apple"
// Handler receives: args = [player]
// (%t is self - the handler knows which object it is)

// Pattern: 'give %i to %i'
// Input: "give sword to bob"
// Handler receives: args = [player, sword, bob]

// Pattern: 'say %s'
// Input: 'say hello everyone'
// Handler receives: args = [player, 'hello everyone']
```

### The Complete Verb Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                     REGISTRATION                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Player connects     Admin connects      Item picked up     │
│        │                   │                    │           │
│        v                   v                    v           │
│  registerVerb()      registerVerb()       onArrived()       │
│  (look, inv, say)    (@dig, @set)         registerVerb()    │
│        │                   │              (wear, eat)       │
│        │                   v                    │           │
│        │              pass('connect')           │           │
│        │                   │                    │           │
│        └───────────────────┴────────────────────┘           │
│                            │                                │
│                            v                                │
│                   player.verbs = [...]                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                       EXECUTION                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Player types: "wear shirt"                                 │
│        │                                                    │
│        v                                                    │
│  matchVerb("wear shirt")                                    │
│        │                                                    │
│        v                                                    │
│  Pattern "wear %t" matches (shirt = source object)          │
│        │                                                    │
│        v                                                    │
│  shirt.doWear(player)                                       │
│        │                                                    │
│        v                                                    │
│  Handler returns message -> sent to player                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    UNREGISTRATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Player disconnects   Item dropped      Player leaves room  │
│        │                   │                    │           │
│        v                   v                    v           │
│  disconnect()         onLeaving()       onContentLeaving()  │
│        │                   │                    │           │
│        v                   v                    v           │
│  unregisterVerbsFrom  unregisterVerbsFrom  unregisterVerbsFrom │
│  (self.id)            (item.id)          (exit.id)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Dynamic Per-Player Verbs?

```javascript
// WRONG: Global verb table
const VERBS = {
  'eat': handleEat,
  'wear': handleWear,
};
// Problems:
// - How do you know WHICH food to eat?
// - What if player has no food?
// - "eat" shows up in help even when impossible

// RIGHT: Per-player, per-item registration
// Only registered when:
// - Player is holding the food
// - Food hasn't been eaten yet
// Automatically unregistered when:
// - Player drops it
// - Food is consumed
// - Player disconnects

// Benefits:
// - Tab completion only shows available commands
// - "help" only shows what you can actually do
// - No "you can't eat that" errors - verb doesn't exist
// - Multiple items with same verb work correctly
```

### Verb Swap Pattern

Many objects need to swap verbs based on state:

```javascript
// In doWear (when wearing succeeds):
await player.unregisterVerbsFrom(self.id);  // Remove 'wear'
await player.registerVerb(['remove %t', 'take off %t'], self, 'doRemove');

// In doRemove (when removing succeeds):
await player.unregisterVerbsFrom(self.id);  // Remove 'remove'
await player.registerVerb(['wear %t', 'put on %t'], self, 'doWear');
```

This pattern keeps available verbs in sync with object state.

### Best Practices

1. **Register in onArrived, unregister in onLeaving** - Hooks handle the lifecycle
2. **Use `unregisterVerbsFrom(id)`** - Removes ALL verbs from that source
3. **Return strings from handlers** - They're sent to the player
4. **Use %t for "this object"** - Cleaner than %i when verb is item-specific
5. **Include aliases** - `['eat %t', 'consume %t', 'devour %t']`
6. **Swap verbs on state change** - wear/remove, open/close, etc.

## The Core Design Pattern: Base + Implementation

**This is the most important pattern in the codebase.** Every object type should be designed this way:

1. **Base prototype** - Handles metadata and state (no verbs, no messaging)
2. **Implementation prototype** - Handles verbs and user-facing messaging
3. **Hooks** - Connect to movement system for dynamic verb registration

### Why This Pattern?

```javascript
// DON'T: Mix state and presentation in one prototype
// This creates unmaintainable spaghetti code
obj.setMethod('wear', `
  // 50 lines of validation
  // 30 lines of state changes
  // 20 lines of verb registration
  // 15 lines of room announcements
  // Impossible to extend or customize
`);

// DO: Separate concerns into layers
// Base: state and validation
// Implementation: verbs and messaging
// Result: Clean, extensible, testable
```

### Example: $.wearable (Base) + $.clothing (Implementation)

#### $.wearable - The Base Prototype

Handles **metadata** and **state manipulation**. No verbs. No messaging.

**Properties (metadata):**
```javascript
{
  covers: ['torso'],      // Which body slots this covers
  layer: 2,               // 1=underwear, 2=base, 3=mid, 4=outer, 5=outerwear
  warmth: 10,             // Cold protection (0-100)
  protection: 0,          // Damage reduction (0-100)
  wornOn: null,           // Body part ID when worn
  wornBy: null,           // Player ID when worn
  wornDescription: null,  // Description when worn (replaces naked desc)
}
```

**Methods (state/validation):**
```javascript
// Validation - returns { success: boolean, error?: string }
const result = await item.canWear(player);
// Checks: not already worn, player has body parts, no layer conflicts

// State change - updates wornBy, wornOn, body part worn arrays
const result = await item.wear(player);
// Returns { success: boolean, message: string }

// State change - clears wornBy, wornOn, removes from body parts
const result = await item.remove(player);

// Query - get items worn on a slot
const items = await item.getWornOnSlot(player, 'torso');

// Description utility
const desc = await item.getWornDescription();
```

**Notice:** No `doWear`, no `doRemove`, no room announcements, no verb registration. Just pure state management.

#### $.clothing - The Implementation Prototype

Inherits from `$.wearable`. Adds **verbs**, **messaging**, and **hooks**.

**Additional Properties:**
```javascript
{
  material: 'cotton',  // Fabric type
  color: 'white',      // Color
  condition: 100,      // Degradation (0-100)
}
```

**Verb Handlers (call base methods, then handle presentation):**
```javascript
obj.setMethod('doWear', `
  // Called by verb system when player types 'wear shirt'
  const wearer = args[1];

  // 1. Call base method for state change
  const result = await self.wear(wearer);
  if (!result.success) return result.error;

  // 2. Swap verbs: unregister 'wear', register 'remove'
  await wearer.unregisterVerbsFrom(self.id);
  await wearer.registerVerb(['remove ' + self.name], self, 'doRemove');

  // 3. Announce to room using utilities
  const room = await $.load(wearer.location);
  const msg = await $.pronoun.sub('%N puts on %t.', wearer, null, null, self);
  await room.announce(msg, wearer);

  return result.message;
`);

obj.setMethod('doRemove', `
  const wearer = args[1];

  // 1. Call base method
  const result = await self.remove(wearer);
  if (!result.success) return result.error;

  // 2. Swap verbs: unregister 'remove', register 'wear'
  await wearer.unregisterVerbsFrom(self.id);
  await wearer.registerVerb(['wear ' + self.name], self, 'doWear');

  // 3. Place item (try hands, then drop)
  const hands = await wearer.getHands();
  if (hands.primary) {
    await hands.primary.addContent(self.id);
  }

  // 4. Announce
  const msg = await $.pronoun.sub('%N takes off %t.', wearer, null, null, self);
  await room.announce(msg, wearer);

  return result.message;
`);
```

**Hooks (connect to movement system):**
```javascript
obj.setMethod('onArrived', `
  // Called when clothing arrives in a hand
  const dest = args[0];

  if (dest && dest.owner) {
    const owner = await $.load(dest.owner);
    if (owner && !self.wornBy) {
      // Register 'wear' verb with the player
      await owner.registerVerb(['wear ' + self.name], self, 'doWear');
    }
  }
`);

obj.setMethod('onLeaving', `
  // Called when clothing leaves a hand
  const source = args[0];

  if (source && source.owner) {
    const owner = await $.load(source.owner);
    // Unregister all verbs from this item
    await owner.unregisterVerbsFrom(self.id);
  }
`);
```

### The Verb Lifecycle

```
[Item on ground]
     |
     v  player picks up
[Item in hand] --> onArrived() --> registers 'wear' verb
     |
     v  player types 'wear shirt'
[doWear called] --> wear() --> unregisters 'wear', registers 'remove'
     |
     v  player types 'remove shirt'
[doRemove called] --> remove() --> unregisters 'remove', registers 'wear'
     |
     v  player drops item
[onLeaving called] --> unregisters all verbs
```

### Why This Works

| Layer | Responsibility | Changes When |
|-------|----------------|--------------|
| Base ($.wearable) | State, validation | Core mechanics change |
| Impl ($.clothing) | Verbs, messaging | UI/UX changes |
| Hooks | Registration timing | Movement system changes |

**Benefits:**
- Base can be tested without verb system
- Messaging can be changed without touching state logic
- New implementations ($.armor, $.jewelry) reuse base methods
- Hooks are the ONLY connection to movement - clean interface

### Creating Your Own Object Types

Follow this pattern for every new object type:

```javascript
// 1. BASE: $.consumable - handles state
//    Properties: calories, hydration, spoilage, consumed
//    Methods: canConsume(), consume(), getCalories()
//    NO verbs, NO messaging

// 2. IMPL: $.food - handles verbs + messaging
//    doEat() - calls consume(), announces, registers 'eat more' or removes verb
//    onArrived() - registers 'eat' verb when in hand
//    onLeaving() - unregisters verbs

// 3. IMPL: $.drink - different verbs, same base
//    doDrink() - calls consume(), announces differently
//    onArrived() - registers 'drink' verb

// Both $.food and $.drink reuse $.consumable's state logic
// They just differ in verbs and messaging
```

### Second Example: $.edible (Base) + $.food/$.drink (Implementations)

Same pattern, different domain. One base, multiple implementations sharing the same state logic.

#### $.edible - The Base Prototype

Handles consumption state. No verbs. No "eat" or "drink".

**Properties:**
```javascript
{
  calories: 100,          // kcal per whole item
  hydration: 20,          // ml water equivalent
  portions: 1,            // Total portions
  remaining: 1,           // Portions left
  spoiled: false,         // Gone bad?
  poisoned: false,        // Poisoned?
  effects: {},            // Status effects when consumed
  decayRate: 0.01,        // Decay per tick
}
```

**Methods (state only):**
```javascript
// Calculations - factor in decay, portions
const cal = await food.getCaloriesPerPortion();
const vol = await food.getVolumePerPortion();
const hyd = await food.getHydrationPerPortion();

// THE state change method - handles everything
const result = await food.consume(player, 'food');
// Returns: { calories, hydration, effects, warnings, fullyConsumed, remaining }
// - Checks stomach capacity
// - Reduces remaining portions
// - Updates weight
// - Sends to stomach
// - Applies status effects
// - Recycles when empty
// - NO messaging, NO verbs

// Query
const hasMore = await food.hasRemaining();
```

**Notice:** `consume()` does ALL the work but sends NO messages. It returns data for the caller to format.

#### $.food - Implementation for Solid Food

Adds `eat` verb, handles presentation:

```javascript
obj.setMethod('eat', `
  const eater = args[1];

  // 1. Validation (not in base - verb-specific)
  if (!holdingFood) {
    return 'You need to pick that up first.';
  }

  // 2. Call base method for state change
  const result = await self.consume(eater, 'food');
  if (result.error) return result.error;

  // 3. Process warnings (presentation layer concern)
  let warnMsg = '';
  if (result.warnings.includes('spoiled')) {
    warnMsg += ' It tastes off...';
    // Maybe cause nausea...
  }

  // 4. Build response message
  let msg = result.fullyConsumed
    ? 'You finish eating ' + self.name + '.'
    : 'You take a bite of ' + self.name + '.';

  // 5. Announce to room using $.pronoun
  const eatMsg = await $.pronoun.sub('%N takes a bite of %t.', eater, null, null, self);
  await location.announce(eatMsg, eater);

  return msg + warnMsg;
`);

// Register 'eat' verb when arriving in hand
obj.setMethod('onArrived', `
  if (dest && dest.owner) {
    const owner = await $.load(dest.owner);
    await owner.registerVerb(['eat ' + self.name], self, 'eat');
  }
`);
```

#### $.drink - Implementation for Liquids

Same base, different verb and messaging:

```javascript
obj.setMethod('drink', `
  const drinker = args[1];

  // Same pattern: validate, call base, format messages
  const result = await self.consume(drinker, 'drink');
  if (result.error) return result.error;

  // Different messaging for drinks
  let msg = result.fullyConsumed
    ? 'You finish drinking ' + self.name + '.'
    : 'You take a sip of ' + self.name + '.';

  const drinkMsg = await $.pronoun.sub('%N takes a sip of %t.', drinker, null, null, self);
  await location.announce(drinkMsg, drinker);

  return msg;
`);

// 'sip' is just an alias
obj.setMethod('sip', `
  return await self.drink(args[0], args[1]);
`);

// Register 'drink' and 'sip' verbs
obj.setMethod('onArrived', `
  if (dest && dest.owner) {
    const owner = await $.load(dest.owner);
    await owner.registerVerb(['drink ' + self.name, 'sip ' + self.name], self, 'drink');
  }
`);
```

#### The Pattern in Action

| What | $.edible (Base) | $.food (Impl) | $.drink (Impl) |
|------|-----------------|---------------|----------------|
| State change | `consume()` | calls it | calls it |
| Verb | none | `eat` | `drink`, `sip` |
| Message | none | "take a bite" | "take a sip" |
| Announce | none | $.pronoun.sub | $.pronoun.sub |
| Hook | none | onArrived | onArrived |

**Both implementations share 100% of the state logic in $.edible.**

### Anti-Patterns to Avoid

```javascript
// BAD: Putting verbs in base prototype
// Now every wearable has doWear - armor, jewelry, everything
// Can't customize messaging per subtype
$.wearable.setMethod('doWear', ...);  // NO!

// BAD: Putting state logic in implementation
// Now you duplicate wear logic in $.clothing, $.armor, $.jewelry
$.clothing.setMethod('wear', `
  // 100 lines of state logic that should be in base
`);  // NO!

// BAD: Hardcoding messages in base
$.wearable.setMethod('wear', `
  // ...
  await room.announce(player.name + ' puts on the ' + self.name);  // NO!
  // This should be in the implementation
`);

// BAD: Not using hooks
$.clothing.setMethod('wear', `
  // Manually register verbs
  await wearer.registerVerb(['remove'], self, 'doRemove');
  // What if player drops it? Verb is still registered!
`);  // Let onLeaving handle cleanup

// GOOD: Let hooks manage the verb lifecycle
// onArrived registers, onLeaving unregisters
// Verbs are always consistent with object location
```

## Summary: What to Use Where

| Task | Use |
|------|-----|
| Register a system alias | `$.addAlias()` |
| Remove a system alias | `$.removeAlias()` |
| Lookup an alias | `$.getAlias()` |
| Pluralize a noun | `$.english.plural()` |
| Conjugate a verb (person) | `$.english.conjugate()` |
| Conjugate by count | `$.format.verb()` |
| Past tense | `$.english.pastTense()` |
| Add article (a/an) | `$.english.article()` |
| List with Oxford comma | `$.format.prose()` |
| Template with list + verb | `$.format.compose()` |
| Perspective-aware text | `$.pronoun.sub()` |
| Room announcements | `$.pronoun.announce()` |
| Create objects | `$.recycler.create()` |
| Destroy objects | `$.recycler.recycle()` |
| Proportional message | `$.proportional.sub()` |
| Percentage message | `$.proportional.fromPercent()` |
| Ask text question | `$.prompt.question()` |
| Ask yes/no | `$.prompt.yesorno()` |
| Show choice menu | `$.prompt.choice()`, `$.prompt.menu()` |
| Multiline input | `$.prompt.multiline()` |
| Clone object tree | `$.memento.clone()` |
| Serialize objects | `$.memento.capture()` |
| Acquire lock | `$.mutex.acquire()` |
| Release lock | `$.mutex.release()` |
| Schedule job | `$.scheduler.schedule()` |
| Remove job | `$.scheduler.unschedule()` |
| Format tables/columns | `$.format.table()`, `$.format.columns()` |
| Sensory-aware emotes | `$.emote.broadcast()` |
| Parse emote to segments | `$.emote.parseSegments()` |
| Get pronouns for object | `$.emote.getObjectPronoun()` |
