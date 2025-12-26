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
    └─ NO  → AI Narrator
                ├─ Gather context (room, contents, player abilities)
                ├─ Read relevant abilities
                ├─ Reason about intent vs physics
                ├─ Modify properties directly
                └─ Narrate outcome
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

## Example: Searching for Hidden Items

Player types: "search the room carefully for hidden devices"

1. **No matching verb** → Goes to AI narrator

2. **AI gathers context:**
   - Player's perception skills, cybernetics
   - Room contents (including concealed items)
   - Each item's abilities

3. **AI reads abilities:**
   ```
   Sensor abilities: "DISCOVERY: Thorough search might reveal it.
   Electronic sweeps definitely find it."

   Player abilities: "PERCEPTION: Detect hidden objects based on
   awareness skill. Cybereye upgrades improve detection."
   ```

4. **AI reasons:**
   - Player is searching thoroughly
   - Sensor says thorough search "might" reveal
   - Player has decent perception
   - Decision: SUCCESS

5. **AI modifies state directly:**
   ```javascript
   const room = player.location;
   const revealed = room.revealed || {};
   revealed[player.id] = revealed[player.id] || [];
   revealed[player.id].push(sensor.id);
   room.revealed = revealed;
   ```

6. **AI narrates:**
   > "You run your fingers along the walls, checking behind fixtures. Near the air vent, you notice a tiny blinking LED - a motion sensor, nearly invisible against the dark metal."

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
