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

## Core Utilities

| Alias | Purpose |
|-------|---------|
| `$[0]` | ObjectManager: alias management, object ID allocation |
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
