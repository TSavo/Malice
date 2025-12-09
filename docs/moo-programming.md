# MOO Programming Best Practices

This guide covers MOO code conventions and the utility objects available via `$.*`.

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

## Core Utilities

| Alias | Purpose |
|-------|---------|
| `$[0]` | ObjectManager: alias management, object ID allocation |
| `$.english` | Grammar: articles, plurals, conjugation, ordinals |
| `$.pronoun` | Pronoun substitution, perspective-aware messaging |
| `$.format` | Text layout: columns, tables, lists, templates |
| `$.proportional` | Proportional message selection (health bars, etc.) |
| `$.recycler` | Object lifecycle: create, recycle, unrecycle |
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

**Always use `$.recycler` for creating and destroying objects.**

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

## System Aliases

Aliases live in `#0.aliases` (the ObjectManager). They map names to object IDs, enabling `$.name` syntax.

### Core Aliases (Protected)

| Alias | Object | Purpose |
|-------|--------|---------|
| `nothing` | #-1 | Null reference |
| `object_manager` | #0 | ObjectManager itself |
| `root` | #1 | Base of all objects |
| `system` | #2 | Connection router |

### Managing Aliases in MOO Code

```javascript
// Add an alias (preferred method)
await $[0].addAlias('myUtils', obj.id);   // Now $.myUtils works

// Remove an alias
await $[0].removeAlias('myUtils');        // Returns true if removed

// Get an alias
const id = await $[0].getAlias('myUtils'); // Returns object ID or undefined

// List all aliases
const aliases = $[0].aliases;             // { nothing: -1, root: 1, ... }
```

Note: Core aliases (`nothing`, `object_manager`, `root`, `system`) are protected and cannot be removed.

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

### 2. MOO Code: $[0].addAlias()

From within MOO code, use the ObjectManager's alias methods:

```javascript
// Create an object and register it as an alias
const utils = await $.recycler.create($.root, { name: 'MyUtils' });
utils.setMethod('greet', `
  return 'Hello, ' + (args[0] || 'stranger') + '!';
`);

await $[0].addAlias('myUtils', utils.id);
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

| Prototype | Use For |
|-----------|---------|
| `$.describable` | Anything with name/description |
| `$.location` | Containers (holds contents) |
| `$.room` | Rooms with exits |
| `$.agent` | Things that can act (NPCs) |
| `$.embodied` | Agents with physical bodies |
| `$.human` | Human-type embodied agents |
| `$.player` | Player characters |
| `$.admin` | Wizard/admin players |
| `$.decayable` | Things that decay over time |
| `$.edible` | Consumable items |
| `$.food` | Solid food |
| `$.drink` | Liquids |
| `$.bodyPart` | Body parts (inherit from $.edible!) |
| `$.wearable` | Items that can be worn |
| `$.clothing` | Wearable clothing items |

## Summary: What to Use Where

| Task | Use |
|------|-----|
| Register a system alias | `$[0].addAlias()` |
| Remove a system alias | `$[0].removeAlias()` |
| Lookup an alias | `$[0].getAlias()` |
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
| Format tables/columns | `$.format.table()`, `$.format.columns()` |
| Sensory-aware emotes | `$.emote.broadcast()` |
| Parse emote to segments | `$.emote.parseSegments()` |
| Get pronouns for object | `$.emote.getObjectPronoun()` |
