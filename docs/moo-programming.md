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

Use `$.pronoun.sub()` for text that varies by viewer (second vs third person).

### Template Codes

| Code | Meaning | You | Third Person |
|------|---------|-----|--------------|
| `%N` | Actor name (cap) | You | Bob |
| `%n` | Actor name | you | Bob |
| `%s` | Subject pronoun | you | he/she/they |
| `%o` | Object pronoun | you | him/her/them |
| `%p` | Possessive | your | his/her/their |
| `%r` | Reflexive | yourself | himself/herself |
| `%v{verb}` | Conjugated verb | cut | cuts |
| `%d` | Direct object name | | |
| `%i` | Item/indirect object | | |
| `%l` | Location name | | |

### Usage

```javascript
// Basic substitution
const msg = await $.pronoun.sub('%N %v{pick} up %d.', actor, sword);
// Actor sees: "You pick up the sword."
// Others see: "Bob picks up the sword."

// With target pronouns (%tN, %ts, %to, %tp, %tr)
const msg = await $.pronoun.sub('%N %v{punch} %tN in %tp face!', attacker, null, target);
// Attacker: "You punch Bob in his face!"
// Target:   "Bob punches you in your face!"
// Others:   "Bob punches Jim in his face!"
```

### announce() - Room Messaging

```javascript
// Send perspective-correct message to everyone in a room
await $.pronoun.announce(room, '%N %v{enter} from the north.', actor);
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

Combines list formatting, verb conjugation, and pronoun substitution:

```javascript
// Template codes:
//   %T - Capitalized list with article ("The sword and shield")
//   %t - Lowercase list with article ("the sword and shield")
//   %v{verb} - Verb conjugated by count (falls/fall)
//   Plus all $.pronoun.sub codes

await $.format.compose('%T %v{fall} away in tatters.', ['pants'])
// "The pants falls away in tatters."

await $.format.compose('%T %v{fall} away in tatters.', ['shirt', 'pants'])
// "The shirt and pants fall away in tatters."

await $.format.compose('%N watches as %t %v{tumble} to the ground.',
  ['coins'], { actor: player })
// "Bob watches as the coins tumble to the ground."
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
| Format tables/columns | `$.format.table()`, `$.format.columns()` |
| Sensory-aware emotes | `$.emote.broadcast()` |
| Parse emote to segments | `$.emote.parseSegments()` |
| Get pronouns for object | `$.emote.getObjectPronoun()` |
