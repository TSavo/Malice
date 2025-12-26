# Abilities-First Architecture

The paradigm shift that makes Malice different from traditional MUDs.

## The Core Insight

Traditional MUDs are limited by **code** - you can only do what someone wrote methods for. Malice replaces procedural methods with a two-layer specification interpreted by an AI narrator.

**Property Descriptions + Abilities = The Game Design**

- **Property descriptions** define what each property MEANS
- **Abilities** describe how properties RELATE and INTERACT
- The **AI narrator** reads both as a unified physics document

The game design isn't in code. It's in this living specification that the AI interprets and grows.

## Three Types of Specification

### 1. JSDoc on Methods = CONSTRAINTS

```javascript
/** Transfer credits between accounts.
 *  @param from - Source player (null = mint new credits)
 *  @param to - Destination player (null = burn credits)
 *  @param amount - Amount to transfer
 *  @returns { success, newBalance } or { success: false, error }
 */
```

JSDoc tells the AI what infrastructure methods DO and RETURN. These are hard constraints - the method does exactly what the JSDoc says.

### 2. Property Descriptions = CONSTRAINTS

```javascript
obj.setPropertyDescription('locked', "When true, door won't open without key, picking, or force");
obj.setPropertyDescription('durability', "Structural integrity 0-100. Force reduces it. At 0, breaks.");
obj.setPropertyDescription('concealed', "If true, hidden from casual observation until revealed.");
```

Property descriptions tell the AI what data MEANS. They constrain how properties should be interpreted.

### 3. Abilities = PHYSICS

```javascript
abilities: `Hinged door that swings open or closed.

OPENING: Requires 'locked' to be false. Push or pull to swing.

LOCKING: Key with matching 'keyId' toggles 'locked' state.

PICKING: Thin rigid tools can work against 'lockDifficulty'.
Compare tool quality + user skill against difficulty.
Time/noise tradeoff: rushed = loud, patient = quiet.

FORCING: Strength check against 'durability'. Success damages door,
reduces durability, makes noise. At durability 0, door breaks open.`
```

Abilities are **prose physics**. They describe how things interact, what's possible, what the consequences are. The AI reads abilities and reasons about outcomes.

## The Two Layers

```
Player Input
    ↓
Infrastructure verb? (look, say, move)
    ├─ YES → Execute directly (instant, deterministic)
    └─ NO  → AI Narrator (Priority Order)
                1. Bug Fixer (detect failures FIRST)
                   ├─ Metagaming?
                   ├─ Trolling?
                   └─ Nonsense?
                       └─ YES → player.think(correction)
                2. Narrator (execute intent)
                   ├─ Gather context (room, contents, player abilities)
                   ├─ describeForAI() - understand objects
                   ├─ Read relevant abilities
                   ├─ Reason about intent vs physics
                   ├─ Double dispatch (lock.pick() → tool.canPick())
                   ├─ Modify properties directly
                   └─ Narrate outcome via player.think()
                3. Creator (grow the spec)
                   └─ Add methods/abilities to prototypes when discovering valid interactions
```

### Infrastructure Verbs (Coded)

These remain as coded verbs for speed and determinism:

```
MOVEMENT:    north, south, east, west, up, down, enter, exit
PERCEPTION:  look, glance
SOCIAL:      say, whisper, shout, emote, to
META:        quit, who, help, inventory, exits, stand, sit
```

### Everything Else (AI-Interpreted)

All other player actions go through the AI narrator:

- "unlock the door" → AI reads lock abilities, checks player has key
- "pick up the gun" → AI reads hand abilities, checks weight
- "eat the food" → AI reads edible abilities, triggers digestion
- "search for bugs" → AI reads concealment abilities, reveals items
- "buy a stim-shot" → AI reads vending abilities, handles payment

## The Three AI Roles

The AI narrator operates with three distinct responsibilities, executed in priority order:

### 1. Bug Fixer (HIGHEST PRIORITY)

Detects and handles failure conditions BEFORE attempting to execute player intent:

**Failure Conditions:**
- **Metagaming** - Player references out-of-character knowledge, game mechanics, or breaks the fourth wall
- **Trolling** - Player attempts to abuse the system, exploit ambiguities, or grief other players
- **Nonsense** - Player input is incomprehensible, contradictory, or physically impossible

**Response:** Use `player.think(message)` to deliver corrections as internal monologue:

```javascript
// Example: Player tries "I cast fireball using my +5 wizard staff"
await player.think("You shake your head. This isn't some fantasy game. You're standing in a dark hallway in Night City with a crowbar, not a magic wand.");
```

**Key Principle:** The narrator is **the voice in their head** - their internal thoughts, realizations, and self-corrections. Not an external narrator breaking immersion.

### 2. Narrator (CORE FUNCTIONALITY)

Executes validated player intent by interpreting abilities and modifying game state:

**Process:**
1. **describeForAI()** - Get object understanding before modifications
2. Read relevant abilities from player, target, room, tools
3. Reason about physics, constraints, consequences
4. **Double dispatch** - Delegate capability checks (lock.pick() asks tool.canPick())
5. Modify properties directly based on outcomes
6. Narrate results via `player.think()` for internal monologue or normal output for external events

**Internal vs External Narration:**
- `player.think(msg)` - Internal monologue, realization, private thoughts
- `player.tell(msg)` - External narration, visible outcomes, sensory input
- `room.announce(msg, [exclude])` - Events visible to others

### 3. Creator (LOWEST PRIORITY)

Discovers and formalizes new interactions as permanent specifications:

**When a valid interaction occurs that isn't formally specified:**
1. Execute the interaction successfully (Narrator role)
2. Identify which prototype should gain the new capability
3. Add method or ability text to the prototype
4. Log the enhancement for review

**Example:**
```javascript
// Player successfully uses a hairpin to pick a lock
// Creator recognizes: "hairpin" is a valid tool, not yet specified

// Add to $hairpin prototype:
abilities: `Thin metal tool bent into a hook.

LOCKPICKING: Counts as a thin rigid tool. Quality depends on
material - cheap pins bend easily, professional pins work better.`

// Or add method to $lock prototype:
lock.setMethod('canPickWith', `
  const tool = args[0];
  return tool.thinRigid || tool.canPick || false;
`);
```

## Internal Monologue: think() vs feel()

The narrator speaks as **the voice in the player's head** using distinct methods:

### player.think(message)

**Internal thoughts, realizations, mental processes:**

```javascript
// Success realization
await player.think("Yes! The lock clicks open under your fingers.");

// Failure realization
await player.think("The door won't budge. You'll need to find another way.");

// Discovery
await player.think("Wait - there's something odd about this wall panel...");

// Correction (Bug Fixer role)
await player.think("You pause. Trying to 'hack the mainframe' with your bare hands? You need actual tools, a terminal, something to work with.");
```

### player.feel(message, bodyPart)

**Tactile sensations, physical feedback:**

```javascript
// Distinct from think() - this is TOUCH, not thought
await player.feel("Sharp pain as the needle punctures your skin.", hand);
await player.feel("Cold metal against your palm.", hand);
await player.feel("A faint vibration through the floor.", feet);
```

**Key Distinction:**
- `think()` = Mental, internal dialogue, the narrator's voice
- `feel()` = Physical, tactile sensations, body awareness
- Both maintain immersion by staying in-character

## Double Dispatch Pattern

When objects need to interact, use **double dispatch** to delegate capability checks:

### The Pattern

**DON'T** centralize all logic in one place:
```javascript
// BAD: Lock has to know about every possible tool
lock.pick(tool) {
  if (tool.name === 'lockpick' || tool.name === 'hairpin' || tool.name === 'paperclip' || ...)
}
```

**DO** delegate to the other object:
```javascript
// GOOD: Lock asks the tool if it can pick
lock.pick(tool) {
  if (!tool.canPick || !tool.canPick(self)) {
    return { success: false, reason: "Tool inadequate" };
  }
  // ... picking logic
}

// Each tool defines its own capabilities
lockpick.canPick(lock) {
  return lock.lockDifficulty <= self.quality;
}

hairpin.canPick(lock) {
  return lock.lockDifficulty <= 3; // Basic locks only
}
```

### Benefits

1. **Extensibility** - New tools don't require modifying locks
2. **Encapsulation** - Tool capabilities stay with the tool
3. **Discoverable** - AI can read tool abilities to understand what works
4. **Symmetric** - Both objects participate in the interaction

### Example: Lock Picking

```javascript
// Lock prototype
$lock.setMethod('pick', `
  const tool = args[0];
  const picker = args[1];

  // Double dispatch: ask tool if it can pick THIS lock
  const canPick = await tool.canPick?.(self);
  if (!canPick) {
    return { success: false, reason: "That won't work on this lock" };
  }

  // Tool is suitable, now check skill
  const difficulty = self.lockDifficulty || 5;
  const skill = picker.lockpickingSkill || 0;
  const quality = tool.quality || 1;

  const chance = (skill + quality) / difficulty;
  const success = Math.random() < chance;

  if (success) {
    self.locked = false;
    return { success: true };
  } else {
    return { success: false, reason: "The lock resists your efforts" };
  }
`);

// Lockpick tool
$lockpick.setMethod('canPick', `
  const lock = args[0];
  const difficulty = lock.lockDifficulty || 5;
  return difficulty <= self.quality * 2; // Quality determines max difficulty
`);

// Hairpin tool
$hairpin.setMethod('canPick', `
  const lock = args[0];
  const difficulty = lock.lockDifficulty || 5;
  return difficulty <= 3; // Hairpins only work on simple locks
`);
```

## describeForAI(): Understanding Before Modifying

Before the narrator modifies an object, it should understand it:

### The Method

```javascript
// Every object inherits from $describable
$describable.setMethod('describeForAI', `
  const parts = [];

  // Basic identity
  parts.push(\`Name: \${self.name}\`);
  parts.push(\`Type: \${self.parent?.name || 'Object'}\`);

  // Properties with descriptions
  const props = Object.keys(self).filter(k => !k.startsWith('_'));
  for (const key of props) {
    const desc = self.getPropertyDescription?.(key);
    const value = self[key];
    if (desc) {
      parts.push(\`\${key}: \${JSON.stringify(value)} // \${desc}\`);
    }
  }

  // Abilities
  if (self.abilities) {
    parts.push(\`\\nAbilities:\\n\${self.abilities}\`);
  }

  return parts.join('\\n');
`);
```

### Usage in Narrator

```javascript
// Before modifying door state
const doorInfo = await door.describeForAI();
// Returns:
// Name: Security Door
// Type: door
// locked: true // When true, door won't open without key, picking, or force
// durability: 80 // Structural integrity 0-100. Force reduces it. At 0, breaks.
//
// Abilities:
// OPENING: Requires 'locked' to be false. Push or pull to swing.
// LOCKING: Key with matching 'keyId' toggles 'locked' state.
// FORCING: Strength check against 'durability'. Success damages door...

// Now narrator understands constraints before modifying locked/durability
```

## Growing the Spec

When the Creator role discovers valid interactions, it formalizes them:

### The Process

1. **Narrator executes** - Player does something creative that works
2. **Creator identifies** - This interaction should be repeatable
3. **Creator adds spec** - Either as ability text or method
4. **Log the change** - Track organic growth

### Example: Discovering Wire Cutting

```javascript
// Player: "cut the tripwire with my knife"
// Narrator: Executes successfully (knife is sharp, wire is thin)

// Creator: This should work for all blades on all wires
await $blade.editMethod('abilities',
  existing => existing + `\n\nCUTTING: Sharp edge can sever thin materials like wire, rope, fabric.`
);

await $ai.logWorld('narrator', 'Added cutting ability to $blade after player discovery');

// Next time any player tries cutting with any blade, ability is formally specified
```

## Example: Searching for Hidden Items

Player types: "search the room carefully for hidden devices"

### Step 1: Bug Fixer (Validation)

**Check for failure conditions:**
- Metagaming? No - player staying in-character
- Trolling? No - legitimate game action
- Nonsense? No - physically possible action

**Result:** PASS → Continue to Narrator

### Step 2: Narrator (Execution)

**Gather context:**
```javascript
const room = player.location;
const roomInfo = await room.describeForAI();
// Gets all room properties, concealed items, abilities

const playerInfo = await player.describeForAI();
// Gets perception skills, cybernetics, abilities
```

**Read abilities from describeForAI() output:**
```
Sensor (concealed):
  concealed: true // If true, hidden from casual observation until revealed
  Abilities:
  DISCOVERY: Thorough search might reveal it. Electronic sweeps definitely find it.

Player:
  perceptionSkill: 7 // Awareness and detection ability 0-10
  Abilities:
  PERCEPTION: Detect hidden objects based on awareness skill.
  Cybereye upgrades improve detection.
```

**Reason about physics:**
- Player is searching thoroughly (intent)
- Sensor says thorough search "might" reveal (physics)
- Player has perceptionSkill: 7 (capability)
- Decision: SUCCESS

**Modify state directly:**
```javascript
const revealed = room.revealed || {};
revealed[player.id] = revealed[player.id] || [];
revealed[player.id].push(sensor.id);
room.revealed = revealed;
```

**Narrate via internal monologue:**
```javascript
await player.think("Your fingers trace along the walls, checking behind fixtures...");
await player.tell("Near the air vent, you notice a tiny blinking LED - a motion sensor, nearly invisible against the dark metal.");
```

### Step 3: Creator (Growth)

**Potential enhancement discovered:**

If this is the first time searching has revealed concealed items, Creator might add:

```javascript
// Add to $player prototype
$player.editMethod('abilities',
  existing => existing + `\n\nSEARCHING: Careful systematic search can reveal concealed
  items based on perceptionSkill. Higher skill increases chance of discovery.`
);

await $ai.logWorld('creator', 'Formalized search mechanics after player discovery');
```

## Example: Bug Fixer Catching Metagaming

Player types: "I use my knowledge that this is a video game to clip through the wall"

### Step 1: Bug Fixer (Validation)

**Check for failure conditions:**
- Metagaming? **YES** - references "video game", breaks fourth wall
- Trolling? Possibly - attempting to exploit game mechanics
- Nonsense? In-world, yes - "clip through wall" isn't physical

**Result:** FAIL → Correction via internal monologue

**Response:**
```javascript
await player.think("You blink, confused. Clip through the wall? This is reality, not some simulated construct. The concrete is solid, cold under your palm. If you want through, you'll need to find a door, break it down, or cut a hole.");
```

**STOP** - Do not proceed to Narrator. Player input rejected gracefully in-character.

## Example: Bug Fixer Handling Nonsense

Player types: "I quantum tunnel my consciousness into the door and become one with the lock"

### Step 1: Bug Fixer (Validation)

**Check for failure conditions:**
- Metagaming? No - staying in setting
- Trolling? Possibly - but could be in-character if player has neural interface
- Nonsense? **Depends** - check player abilities

**Gather context:**
```javascript
const playerInfo = await player.describeForAI();
// Check for: neural interface, psychic abilities, augmentations
```

**If player has no such capabilities:**

```javascript
await player.think("You shake your head. Whatever that stim-shot was, it's making you think strange thoughts. You can't 'become one' with a door - you're flesh and metal, and it's just a lock. Focus.");
```

**If player has neural interface:**

**Result:** PASS → Continue to Narrator

Narrator interprets creatively:
- "Quantum tunnel consciousness" → neural hack attempt
- Reads lock.abilities for hacking vulnerabilities
- Executes as: attempt to wirelessly interface with electronic lock

## Example: Double Dispatch for Lock Picking

Player types: "pick the lock with my hairpin"

### Step 1: Bug Fixer ✓ PASS

### Step 2: Narrator (Execution)

**Gather context:**
```javascript
const lock = /* door's lock component */;
const hairpin = player.inventory.find(i => i.name.includes('hairpin'));

const lockInfo = await lock.describeForAI();
const hairpinInfo = await hairpin.describeForAI();
```

**describeForAI() returns:**
```
Lock:
  locked: true // When true, door won't open without key, picking, or force
  lockDifficulty: 4 // Picking difficulty 1-10
  Methods: pick(tool, picker)

Hairpin:
  quality: 2 // Tool quality 1-10
  Methods: canPick(lock)
```

**Double dispatch pattern:**
```javascript
// Lock delegates capability check to tool
const result = await lock.pick(hairpin, player);

// Inside lock.pick():
//   1. Ask hairpin: canPick = await hairpin.canPick(self)
//   2. hairpin checks: lock.lockDifficulty <= 3 (hairpins only work on simple locks)
//   3. lockDifficulty is 4, so canPick returns false
//   4. lock.pick() returns { success: false, reason: "Tool inadequate" }
```

**Narrate failure:**
```javascript
await player.think("The hairpin bends uselessly in the lock. This mechanism is too complex for such a flimsy tool. You'll need proper lockpicks.");
```

### Step 3: Creator (No Growth)

This is already formalized - both `lock.pick()` and `hairpin.canPick()` exist. No new specifications needed.

## Example: Double Dispatch Success + Growth

Player types: "use the credit card to slip the latch"

### Step 1: Bug Fixer ✓ PASS

### Step 2: Narrator (Execution)

**Gather context:**
```javascript
const door = player.location.exits.north; // Simple door with latch
const card = player.inventory.find(i => i.type === 'creditcard');

const doorInfo = await door.describeForAI();
const cardInfo = await card.describeForAI();
```

**describeForAI() returns:**
```
Door:
  locked: false // Door is closed but not locked
  hasLatch: true // Simple latch, not deadbolt
  Abilities:
  OPENING: Push or pull when unlocked. Latch holds it closed.
  SHIMMING: Thin rigid objects can slip the latch if no deadbolt.

CreditCard:
  (No canShim method yet - tool not formalized for this use)
```

**Reasoning:**
- Door abilities say "thin rigid objects can slip the latch"
- Credit card is thin and rigid
- This should work

**Direct property modification:**
```javascript
door.closed = false; // Latch slipped, door opens
```

**Narrate success:**
```javascript
await player.think("You slide the card between the door and frame, working it down until you feel the latch...");
await player.tell("*Click* - the latch slips free and the door swings open.");
```

### Step 3: Creator (Growth Opportunity)

**New interaction discovered:** Credit cards can slip latches

**Formalize to prototype:**
```javascript
// Add to $creditcard prototype
$creditcard.setMethod('canShim', `
  const door = args[0];
  // Credit cards can slip simple latches but not deadbolts
  return door.hasLatch && !door.hasDeadbolt;
`);

// Update $door to use double dispatch
$door.editMethod('abilities',
  'SHIMMING: Thin rigid objects can slip the latch if no deadbolt.',
  'SHIMMING: Thin rigid objects can slip the latch if no deadbolt. Use tool.canShim(door) to check.'
);

await $ai.logWorld('creator', 'Formalized credit card shimming after player discovery');
```

**Future interactions:** Now any door can call `tool.canShim(self)` to check compatibility

## Building Objects

### The Pattern

1. **Properties** hold state
2. **Property descriptions** explain what state means
3. **Abilities** describe physics/interactions
4. **Minimal infrastructure methods** only when needed (onRoomEvent, etc.)

### Example: Security Camera

```javascript
const camera = await $recycler.create($describable, {
  name: 'Security Camera',
  description: 'A dome camera with blinking red LED.',
  boltedDown: true,
  recording: true,
  eventLog: [],
  abilities: `Surveillance device that records visual activity.

RECORDING: When 'recording' is true, logs arrivals, departures,
and notable events to 'eventLog' via onRoomEvent().

DETECTION: Notices movement within line of sight. Cannot see
through walls or in darkness. Red LED indicates active status.

TAMPERING: Can be disabled by covering lens, cutting power, or
hacking. Disabled cameras stop recording but log the attempt first.

PLAYBACK: Anyone with security access can review 'eventLog'.`
});

// Property descriptions
camera.setPropertyDescription('recording', "Whether actively recording.");
camera.setPropertyDescription('eventLog', "Array of { timestamp, type, desc }.");

// Infrastructure method - room calls this on events
camera.setMethod('onRoomEvent', `
  if (!self.recording) return;
  const event = args[0];
  const log = self.eventLog || [];
  log.push({ timestamp: Date.now(), ...event });
  if (log.length > 100) log.shift();
  self.eventLog = log;
`);
```

## Upgrading Infrastructure

When you need capabilities that don't exist, trace and upgrade:

### The Pattern: Intent → Verb → Implementation → Change

1. **Identify the need:** "I want hidden items that don't show in look"

2. **Trace from the verb:**
   ```javascript
   const lookCode = $player.getMethod('look');
   // Shows: look calls room.describe(player)
   ```

3. **Follow the call:**
   ```javascript
   const describeCode = $room.getMethod('describe');
   // Find: const others = contents.filter(item => item !== viewer);
   // THERE - that's where to add filtering
   ```

4. **Make the change:**
   ```javascript
   $room.editMethod('describe',
     'const others = contents.filter(item => item !== viewer);',
     `const others = contents.filter(item => {
       if (item === viewer) return false;
       if (item.concealed) {
         const revealed = self.revealed || {};
         return (revealed[viewer?.id] || []).includes(item.id);
       }
       return true;
     });`
   );
   ```

5. **Test and log:**
   ```javascript
   await $ai.logWorld('pluribus', 'Upgraded $room.describe for concealment.');
   ```

## Why This Matters

### Registered Verbs = Dead Code

A registered verb does one thing, one way, forever. It can't be reasoned about, combined, or extended.

### Abilities = Living Physics

The AI can:
- Combine abilities from multiple objects
- Handle edge cases creatively
- Extend interactions naturally
- Narrate outcomes dynamically

### The Test

If you're tempted to register a verb, ask:

> "Can the AI handle this by reading abilities?"

The answer is almost always **YES**.

## Key Principles

1. **Properties are self-documenting** - Every property carries meaning via descriptions
2. **Abilities describe relationships** - How properties interact, not what they mean
3. **AI is the physics engine** - Interprets descriptions + abilities, modifies properties
4. **Infrastructure is minimal** - Only high-frequency, zero-ambiguity verbs stay coded
5. **No procedural game logic** - Physics lives in prose, not code
6. **Discovery is growth** - New interactions can become permanent abilities

### Priority Order: Bug Fixer First

The AI must **always** validate input before executing:
- Metagaming, trolling, nonsense → Caught by Bug Fixer
- Use `player.think()` for corrections - the voice in their head
- Never break immersion with external meta-commentary

### The Narrator is the Voice in Their Head

Internal monologue maintains immersion:
- `player.think()` - Thoughts, realizations, mental dialogue
- `player.feel()` - Tactile sensations (distinct from thinking)
- Corrections feel like self-awareness, not game master intervention

### Understand Before Modifying

Call `describeForAI()` to understand objects before changing them:
- Reads property descriptions as inline comments
- Includes abilities as physics documentation
- Ensures narrator respects constraints

### Double Dispatch for Interactions

Objects delegate capability checks to each other:
- `lock.pick(tool)` → `tool.canPick(lock)`
- Keeps capabilities with the object that has them
- Extensible - new tools don't require modifying all locks
- Discoverable - AI reads methods/abilities to understand what works

### Growing the Spec is Normal

When players discover valid interactions:
1. Execute successfully (Narrator role)
2. Add to appropriate prototype (Creator role)
3. Log the enhancement for review
4. Spec grows organically through play

## Complete Flow Summary

Every non-infrastructure player action follows this complete flow:

### Phase 1: Bug Fixer (MANDATORY FIRST)

**Always validate before executing:**

```javascript
// Check player input for failure conditions
const validation = await validateInput(playerCommand, player);

if (validation.metagaming) {
  await player.think("You snap out of it. This is real, not a game...");
  return; // STOP - don't continue to Narrator
}

if (validation.trolling) {
  await player.think("You pause. That's not going to work and you know it...");
  return; // STOP
}

if (validation.nonsense) {
  // Check if player has abilities that make this possible
  const playerInfo = await player.describeForAI();
  if (!hasCapability(playerInfo, playerCommand)) {
    await player.think("You shake your head. That doesn't make any sense...");
    return; // STOP
  }
  // Otherwise, pass to Narrator for creative interpretation
}

// PASS - continue to Narrator
```

### Phase 2: Narrator (CORE EXECUTION)

**Execute validated intent:**

```javascript
// 1. Understand objects before modifying
const targetInfo = await target.describeForAI();
const playerInfo = await player.describeForAI();
const toolInfo = tool ? await tool.describeForAI() : null;

// 2. Read abilities as physics documentation
//    describeForAI() returns properties with inline descriptions
//    Plus abilities section explaining physics/interactions

// 3. Use double dispatch for capability checks
const canPerform = await target.interactionMethod(tool, player);
if (!canPerform) {
  await player.think("Internal realization of why it won't work...");
  return;
}

// 4. Modify properties directly based on physics
target.locked = false;
target.durability -= 10;
player.inventory.push(item);

// 5. Narrate using appropriate method
await player.think("Internal monologue of realization/process");
await player.tell("External sensory results");
await room.announce("What others see/hear", [player]);
```

### Phase 3: Creator (OPTIONAL ENHANCEMENT)

**Formalize new discoveries:**

```javascript
// If this interaction worked but isn't formally specified...
if (newInteractionDiscovered) {
  // Identify which prototype should gain the capability
  const prototype = identifyPrototype(tool);

  // Add method or ability
  prototype.setMethod('canShim', `
    const door = args[0];
    return door.hasLatch && !door.hasDeadbolt;
  `);

  // Or update abilities
  prototype.editMethod('abilities',
    existing => existing + `\n\nSHIMMING: Can slip simple latches on doors.`
  );

  // Log for review
  await $ai.logWorld('creator', `Formalized ${interaction} after player discovery`);
}
```

## Quick Reference

### When to Use Each Method

| Method | Use Case | Example |
|--------|----------|---------|
| `player.think(msg)` | Internal thoughts, realizations, corrections | "You pause. That won't work..." |
| `player.feel(msg, part)` | Tactile sensations | "Sharp pain in your hand" |
| `player.tell(msg)` | External sensory input visible to player | "The door swings open" |
| `room.announce(msg, exclude)` | Events visible to others in room | "Alice picks the lock" |
| `describeForAI()` | Understand object before modifying | Get properties + abilities |
| `tool.canPick(lock)` | Double dispatch capability check | Tool answers if it can pick this lock |
| `$ai.logWorld(speaker, msg)` | Log spec growth | Track Creator enhancements |

### The Three AI Roles

1. **Bug Fixer** - Validates input, catches failures, corrects via internal monologue
2. **Narrator** - Executes validated actions, interprets physics, modifies state
3. **Creator** - Formalizes discoveries, grows specification, logs enhancements

### Key Principles in Practice

**Always validate first:**
```javascript
Bug Fixer → validates → player.think(correction) OR pass to Narrator
```

**Always understand before modifying:**
```javascript
await target.describeForAI() → read constraints → modify properties
```

**Always delegate capability checks:**
```javascript
lock.pick(tool) → tool.canPick(lock) → both objects participate
```

**Always formalize discoveries:**
```javascript
New valid interaction → add to prototype → log enhancement
```

### The Voice in Their Head

The narrator speaks **as the player's internal monologue**, not as an external voice:

**Good (immersive):**
> You shake your head. Trying to hack a terminal with your bare hands? You need actual tools.

**Bad (breaks immersion):**
> You cannot do that. You need a hacking tool.

**Good (natural realization):**
> The hairpin bends uselessly. This lock is too complex for such a flimsy tool.

**Bad (game master voice):**
> Your hairpin is not strong enough to pick this lock.

The player never hears "the game" talking to them. They hear their own thoughts.
