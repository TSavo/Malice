# $emote - Sensory-Aware Emotes

Use `$emote` for freeform roleplaying actions with sensory routing. Different viewers perceive different parts based on their senses (sight, hearing, smell, taste).

## Purpose

Provides sensory-aware freeform emote parsing and broadcasting. Players can express actions using simple prefix notation, and the system routes each part to viewers based on their available senses—blind characters don't see visual actions, deaf characters don't hear sounds, etc.

**Core Concept**: `$.emote.broadcast()` is the central method that handles everything:
- Parses prefix notation into sensory segments
- Conjugates verbs based on viewer perspective (you/Bob)
- Resolves pronouns (him/her/their → actual references)
- Routes each segment through appropriate sensory channels
- Applies sensory gating (blind miss visual, deaf miss audio, etc.)
- Formats final output with proper grammar and punctuation

## Why Use This?

**Bad: No sensory awareness**
```javascript
// Everyone sees everything, regardless of senses
await room.announce(`${actor.name} smiles and says, "Hello!"`);
// Blind character sees: "Bob smiles and says, 'Hello!'" 
// (How do they see the smile?)
```

**Good: Sensory routing**
```javascript
await $emote.broadcast('.smile and "Hello!"', actor, room);
// Sighted+Hearing: "Bob smiles and says, 'Hello!'"
// Blind only:      "Bob says, 'Hello!'"
// Deaf only:       "Bob smiles and says something."
```

## Input Syntax

### Sensory Prefixes

| Prefix | Type | Routed Via | Example | Gated By |
|--------|------|------------|---------|----------|
| `.verb` | Visual | `viewer.see()` | `.smile` | Blindness, darkness, line of sight |
| `,verb` | Audible | `viewer.hear()` | `,growl` | Deafness, distance, noise |
| `~verb` | Olfactory | `viewer.smell()` | `~reek of garlic` | Anosomia, air flow |
| `^verb` | Gustatory | `viewer.taste()` | `^taste blood` | Ageusia, proximity |
| `"text"` | Speech | `viewer.hear()` | `"Hello!"` | Deafness, distance, noise |

### Emote Elements

```
.verb phrase          - Visual action, verb conjugated (you fall / Bob falls)
,verb phrase          - Audible non-speech (growl, sigh, footsteps)
~verb phrase          - Smell-based action
^verb phrase          - Taste-based action
.say "text"           - Speech with verb (says, whispers, etc.)
"text"                - Direct speech (automatically uses "says")
PlayerName            - Shift target for following pronouns
him/her/them          - Object pronouns refer to current target
myself/yourself       - Reflexive pronouns refer to actor
```

### Complete Syntax Examples

```javascript
// Single sensory action
".smile"                                  // Visual only
",laugh"                                  // Audio only
"~reek of sweat"                         // Smell only
"^taste copper"                          // Taste only
"\"Hello!\""                             // Speech only

// Combined actions with conjunctions
".smile and .wave"                       // Multiple visual
".nod and \"I agree\""                   // Visual + speech
",sigh and .slump"                       // Audio + visual
".enter, ~reeking of smoke, and ,cough" // Visual + smell + audio

// Speech with custom verbs
".say quietly \"Follow me\""             // Whisper variant
".shout \"Help!\""                       // Loud speech
".mutter \"Whatever\""                   // Under breath

// Target pronouns
".look at Alice and .smile at her"       // Pronoun refers to Alice
".hand Bob the key and .nod to him"      // Pronoun refers to Bob
".pat myself on the back"                // Reflexive (actor = target)

// Complex multi-sensory emote
".stumble into the room, ,breathing heavily, and ~reeking of whiskey"
```

### Prefix Syntax Details

#### Visual Actions (`.prefix`)

Visual actions are what viewers see with their eyes:

```javascript
// Basic visual verbs
".smile"           // Bob smiles. / You smile.
".wave"            // Bob waves. / You wave.
".nod"             // Bob nods. / You nod.
".frown"           // Bob frowns. / You frown.

// Visual with objects
".draw his sword"               // Bob draws his sword.
".pull out a cigarette"         // Bob pulls out a cigarette.
".toss the coin to Alice"       // Bob tosses the coin to Alice.

// Visual with adverbs/adjectives
".smile warmly"                 // Bob smiles warmly.
".walk slowly to the door"      // Bob walks slowly to the door.
".raise his hand hesitantly"    // Bob raises his hand hesitantly.

// Complex visual phrases
".reach into his pocket and .pull out a worn photograph"
// Bob reaches into his pocket and pulls out a worn photograph.
```

#### Audible Actions (`,prefix`)

Audio actions are non-speech sounds viewers hear:

```javascript
// Vocal sounds
",laugh"           // Bob laughs.
",sigh"            // Bob sighs.
",grunt"           // Bob grunts.
",gasp"            // Bob gasps.
",scream"          // Bob screams.

// Body sounds
",snap his fingers"              // Bob snaps his fingers.
",clap"                          // Bob claps.
",whistle"                       // Bob whistles.
",clear his throat"              // Bob clears his throat.

// Movement sounds
",footsteps echo on the stone floor"  // Bob's footsteps echo...
",rustle through the papers"          // Bob rustles through the papers.
",creak the floorboards"              // Bob creaks the floorboards.

// With intensity
",laugh loudly"                  // Bob laughs loudly.
",whisper quietly"               // Bob whispers quietly.
",growl menacingly"              // Bob growls menacingly.
```

#### Olfactory Actions (`~prefix`)

Smell actions describe scents viewers perceive:

```javascript
// Personal scents
"~reek of alcohol"               // Bob reeks of alcohol.
"~smell of fresh soap"           // Bob smells of fresh soap.
"~stink of sweat"                // Bob stinks of sweat.

// Environmental scents
"~smell of smoke and ash"        // Bob smells of smoke and ash.
"~reek of the sewers"            // Bob reeks of the sewers.
"~carry the scent of roses"      // Bob carries the scent of roses.

// Subtle scents
"~have a faint metallic odor"    // Bob has a faint metallic odor.
"~smell faintly of gunpowder"    // Bob smells faintly of gunpowder.
```

#### Gustatory Actions (`^prefix`)

Taste actions are rarely used, typically for intimate contact or consumption:

```javascript
// Tasting something
"^taste blood on his lips"       // Bob tastes blood on his lips.
"^taste copper"                  // Bob tastes copper.
"^taste the bitterness"          // Bob tastes the bitterness.

// Note: Taste requires very close proximity or direct contact
// Most viewers won't perceive these unless they're tasting the same thing
```

#### Speech (`"text"`)

Speech is heard by others as audio:

```javascript
// Direct speech
"\"Hello!\""                     // Bob says, "Hello!"
"\"Watch out!\""                 // Bob says, "Watch out!"

// With visual action
".wave and \"Good morning!\""    // Bob waves and says, "Good morning!"

// Custom speech verb
".say softly \"I love you\""     // Bob says softly, "I love you."
".whisper \"Follow me\""         // Bob whispers, "Follow me."
".shout \"Fire!\""               // Bob shouts, "Fire!"
".mutter \"Whatever\""           // Bob mutters, "Whatever."
```

### Conjugation Rules

The system automatically conjugates verbs. Understanding the patterns helps write natural emotes:

#### Regular Conjugation

```javascript
// Most verbs: add 's' for 3rd person
"fall"    → "you fall"    / "Bob falls"
"walk"    → "you walk"    / "Bob walks"
"run"     → "you run"     / "Bob runs"
"smile"   → "you smile"   / "Bob smiles"

// Verbs ending in 's', 'sh', 'ch', 'x', 'z': add 'es'
"pass"    → "you pass"    / "Bob passes"
"rush"    → "you rush"    / "Bob rushes"
"catch"   → "you catch"   / "Bob catches"
"fix"     → "you fix"     / "Bob fixes"
"buzz"    → "you buzz"    / "Bob buzzes"

// Verbs ending in consonant + 'y': change to 'ies'
"try"     → "you try"     / "Bob tries"
"carry"   → "you carry"   / "Bob carries"
"worry"   → "you worry"   / "Bob worries"

// Verbs ending in vowel + 'y': add 's'
"play"    → "you play"    / "Bob plays"
"enjoy"   → "you enjoy"   / "Bob enjoys"
```

#### Irregular Verbs

The `$english` utility handles common irregular verbs:

```javascript
"have"    → "you have"    / "Bob has"
"go"      → "you go"      / "Bob goes"
"do"      → "you do"      / "Bob does"
"be"      → "you are"     / "Bob is"
```

#### Multi-Word Verbs

Only the main verb conjugates:

```javascript
".fall down"             → "You fall down." / "Bob falls down."
".walk away"             → "You walk away." / "Bob walks away."
".look around carefully" → "You look around carefully." / "Bob looks around carefully."
```

### Pronoun Patterns

#### Object Pronouns (him/her/them)

Refer to previously mentioned characters:

```javascript
".look at Alice and .smile at her"
// Actor: "You look at Alice and smile at her."
// Others: "Bob looks at Alice and smiles at her."

".hand the sword to Charlie and .nod to him"
// Actor: "You hand the sword to Charlie and nod to him."
// Others: "Bob hands the sword to Charlie and nods to him."

".address the crowd and .wave to them"
// Actor: "You address the crowd and wave to them."
// Others: "Bob addresses the crowd and waves to them."
```

#### Possessive Pronouns (his/her/their)

Indicate ownership:

```javascript
".draw his sword"
// Actor: "You draw your sword."
// Others: "Bob draws his sword."

".check her inventory"
// Actor: "You check your inventory."
// Others: "Alice checks her inventory."

".gather their belongings"
// Actor: "You gather your belongings."
// Others: "They gather their belongings."
```

#### Reflexive Pronouns (himself/herself/themselves)

Action directed at self:

```javascript
".hurt himself"
// Actor: "You hurt yourself."
// Others: "Bob hurts himself."

".talk to herself"
// Actor: "You talk to yourself."
// Others: "Alice talks to herself."

".pride themselves on accuracy"
// Actor: "You pride yourself on accuracy."
// Others: "They pride themselves on accuracy."
```

#### Explicit Reflexive (myself/yourself/themself)

Force reflexive even when not auto-detected:

```javascript
".pat myself on the back"
// Actor: "You pat yourself on the back."
// Others: "Bob pats himself on the back."

".remind yourself to breathe"
// Actor: "You remind yourself to breathe."
// Others: "Bob reminds himself to breathe."
```

## How broadcast() Works

### Automatic Processing Pipeline

When you call `$emote.broadcast(emoteString, actor, room)`, it:

1. **Parses** the emote string into sensory segments
2. **Conjugates** verbs based on viewer perspective (2nd person for actor, 3rd for others)
3. **Resolves** pronouns (him/her/them → actual names, you/your for actor)
4. **Filters** segments based on each viewer's senses
5. **Formats** final text with proper grammar and punctuation
6. **Routes** to each viewer via their sensory methods

### Conjugation Magic

The system automatically conjugates verbs based on who's viewing:

```javascript
await $emote.broadcast('.fall down', actor, room);

// Actor sees:     "You fall down."        (2nd person, present tense)
// Others see:     "Bob falls down."       (3rd person, adds 's')
```

Common conjugation patterns:
- `fall` → `you fall` / `Bob falls`
- `try` → `you try` / `Bob tries`
- `dash` → `you dash` / `Bob dashes`
- `carry` → `you carry` / `Bob carries`

### Pronoun Resolution

Pronouns are resolved differently per viewer:

```javascript
await $emote.broadcast('.pat himself on the back', actor, room);

// Actor sees:     "You pat yourself on the back."
// Others see:     "Bob pats himself on the back."
```

Pronoun types handled:
- **Subject**: he/she/they → you (for actor)
- **Object**: him/her/them → you (for actor)
- **Possessive**: his/her/their → your (for actor)
- **Reflexive**: himself/herself/themselves → yourself (for actor)

## API Reference

### broadcast() - Send to Room

```javascript
await $emote.broadcast(emoteString, actor, room)
```

Main entry point—parses emote and broadcasts to all in room with sensory filtering.

| Parameter | Type | Description |
|-----------|------|-------------|
| `emoteString` | string | Emote with prefix notation |
| `actor` | RuntimeObject | Person performing emote |
| `room` | RuntimeObject | Room to broadcast to |

**Examples:**
```javascript
// Visual action
await $emote.broadcast('.smile', actor, room);
// Sighted: "Bob smiles."
// Blind: (nothing)

// Audio action
await $emote.broadcast(',growl menacingly', actor, room);
// Hearing: "Bob growls menacingly."
// Deaf: (nothing)

// Combined actions
await $emote.broadcast('.smile and "Hello!"', actor, room);
// Full senses: "Bob smiles and says, 'Hello!'"
// Blind: "Bob says, 'Hello!'"
// Deaf: "Bob smiles and says something."
```

### parseSegments() - Parse Emote

```javascript
await $emote.parseSegments(emoteString, actor, isFirstPerson)
```

Parses emote into segments for inspection or custom processing.

**Examples:**
```javascript
const segments = await $emote.parseSegments('.fall and ,groan', actor, false);
// Returns array of segment objects with type, text, sensory requirements
```

### format() - Format for Viewer

```javascript
await $emote.format(segments, viewer)
```

Formats parsed segments for specific viewer based on their senses.

**Examples:**
```javascript
const segments = await $emote.parseSegments('.wave', actor, false);
const text = await $emote.format(segments, viewer);
// Returns personalized view based on viewer's senses
```

### processEmote() - Single Viewer

```javascript
await $emote.processEmote(emoteString, actor, viewer)
```

Process emote for one specific viewer (combines parse and format).

**Examples:**
```javascript
const result = await $emote.processEmote('.wave', actor, viewer);
await viewer.tell(result);
```

### Pronoun Helpers

```javascript
await $emote.getObjectPronoun(obj)      // "him"/"her"/"them"
await $emote.getPossessive(obj)         // "his"/"her"/"their"
await $emote.getReflexive(obj)          // "himself"/"herself"/"themselves"
await $emote.getSubjectPronoun(obj)     // "he"/"she"/"they"
```

## Real-World Examples

### Basic Emotes

```javascript
// Simple visual
await $emote.broadcast('.wave', actor, room);
// "Bob waves."

// Visual with target
await $emote.broadcast('.wave to Alice', actor, room);
// "Bob waves to Alice."

// Audio action
await $emote.broadcast(',clear his throat', actor, room);
// "Bob clears his throat."

// Smell action
await $emote.broadcast('~reek of cheap cologne', actor, room);
// "Bob reeks of cheap cologne."
```

### Speech Emotes

```javascript
// Direct speech
await $emote.broadcast('"Hello, everyone!"', actor, room);
// "Bob says, 'Hello, everyone!'"

// Speech with action
await $emote.broadcast('.wave and "Hello!"', actor, room);
// "Bob waves and says, 'Hello!'"

// Custom verb
await $emote.broadcast('.say loudly "Listen up!"', actor, room);
// "Bob says loudly, 'Listen up!'"
```

### Complex Emotes

```javascript
// Multiple actions
await $emote.broadcast('.stand up, ,sigh heavily, and .walk to the door', actor, room);
// Sighted+Hearing: "Bob stands up, sighs heavily, and walks to the door."
// Blind only: "Bob sighs heavily." (only hears the sigh)
// Deaf only: "Bob stands up and walks to the door." (only sees movement)

// With target pronouns
await $emote.broadcast('.look at Alice and .smile at her', actor, room);
// "Bob looks at Alice and smiles at her."

// Reflexive
await $emote.broadcast('.hurt himself', actor, room);
// Actor sees: "You hurt yourself."
// Others see: "Bob hurts himself."
```

### Sensory Combinations

```javascript
// Visual + audio
await $emote.broadcast('.raise his hand and ,clear his throat', actor, room);
// Full senses: "Bob raises his hand and clears his throat."
// Blind: "Bob clears his throat."
// Deaf: "Bob raises his hand."
// Blind+Deaf: (nothing)

// Smell + visual
await $emote.broadcast('.enter the room, ~reeking of smoke', actor, room);
// Sighted+Smell: "Bob enters the room, reeking of smoke."
// Blind+Smell: "Bob reeks of smoke."
// Sighted only: "Bob enters the room."
```

### Combat Emotes

```javascript
// Attack with sensory details
await $emote.broadcast(
  '.swing his sword at Alice, ,grunting with effort',
  actor,
  room
);
// "Bob swings his sword at Alice, grunting with effort."

// Injury description
await $emote.broadcast(
  '.clutch his bleeding wound and ,cry out in pain',
  victim,
  room
);
// "Bob clutches his bleeding wound and cries out in pain."
```

### Environmental Emotes

```javascript
// Room effect (no actor)
await $emote.broadcast(
  ',creak ominously and ~smell of decay',
  null,
  room
);
// "The room creaks ominously and smells of decay."

// Weather effect
await $emote.broadcast(
  ',thunder rumbles in the distance and .lightning flashes',
  null,
  room
);
// Hearing+Sight: "Thunder rumbles in the distance and lightning flashes."
// Deaf: "Lightning flashes."
// Blind: "Thunder rumbles in the distance."
```

### Stealth Emotes

```javascript
// Quiet action (audio reduced)
await $emote.broadcast('.sneak quietly to the door', actor, room);
// Sighted: "Bob sneaks quietly to the door."
// Others might not perceive if perception check fails

// Silent visual
await $emote.broadcast('.gesture silently to Alice', actor, room);
// Sighted: "Bob gestures silently to Alice."
// Blind/Deaf: (nothing)
```

## Sensory Routing Details

### Vision (`.prefix`)
- Routed through `viewer.see()`
- Requires line of sight
- Affected by darkness, blindness, invisibility

### Hearing (`,prefix` and `"speech"`)
- Routed through `viewer.hear()`
- Works through walls (reduced)
- Affected by deafness, distance, noise

### Smell (`~prefix`)
- Routed through `viewer.smell()`
- Requires olfactory sense
- Affected by anosomia, air flow

### Taste (`^prefix`)
- Routed through `viewer.taste()`
- Very localized (same object/location)
- Requires gustatory sense

## Sensory Gating Examples

### Multi-Perspective Output

The same emote produces different output for different viewers based on their senses:

```javascript
await $emote.broadcast(
  '.stumble into the room, ,breathing heavily, and ~reeking of whiskey',
  actor,
  room
);

// Full senses (sighted, hearing, smell):
// "Bob stumbles into the room, breathing heavily, and reeking of whiskey."

// Blind only (hearing, smell):
// "Bob breathes heavily and reeks of whiskey."
// (No "stumble into room" - that's visual)

// Deaf only (sighted, smell):
// "Bob stumbles into the room and reeks of whiskey."
// (No "breathing heavily" - that's audio)

// Blind + deaf (smell only):
// "Bob reeks of whiskey."
// (Only the smell component)

// Sighted only:
// "Bob stumbles into the room."
// (No audio or smell components)

// No senses:
// (nothing - completely filtered out)
```

### Speech Filtering

Speech is routed as audio, so deaf characters miss it:

```javascript
await $emote.broadcast('.smile and "Hello there!"', actor, room);

// Sighted + hearing:
// "Bob smiles and says, 'Hello there!'"

// Blind + hearing:
// "Bob says, 'Hello there!'"
// (No smile - that's visual)

// Sighted + deaf:
// "Bob smiles and says something."
// (Sees lips move, but can't hear words)

// Blind + deaf:
// (nothing - no sensory component available)
```

### Combat Sensory Complexity

```javascript
await $emote.broadcast(
  '.swing his sword at Alice, ,grunting with effort, and ~smell of sweat',
  attacker,
  room
);

// Alice (full senses):
// "Bob swings his sword at you, grunting with effort, and smells of sweat."

// Bob (attacker, full senses):
// "You swing your sword at Alice, grunting with effort, and smell of sweat."

// Observer (sighted + hearing):
// "Bob swings his sword at Alice, grunting with effort."
// (No smell)

// Observer (blind + hearing):
// "Bob grunts with effort."
// (Can't see the sword swing, can hear the grunt)

// Observer (deaf):
// "Bob swings his sword at Alice and smells of sweat."
// (Sees the attack, smells the sweat, but no sound)
```

### Environmental Effects

```javascript
// Room event with no actor
await $emote.broadcast(
  ',wind howls through the broken windows and ~smell of decay',
  null,
  room
);

// Hearing + smell:
// "Wind howls through the broken windows and smells of decay."

// Deaf + smell:
// "Smells of decay."
// (Can't hear the wind)

// Hearing only:
// "Wind howls through the broken windows."
// (Can't smell the decay)
```

### Stealth and Partial Perception

```javascript
await $emote.broadcast('.sneak quietly behind the guard', actor, room);

// Sighted:
// "Bob sneaks quietly behind the guard."

// Blind:
// (nothing - sneaking is primarily visual)

// Note: In actual gameplay, this might trigger perception checks.
// A guard with high awareness might still "hear" quiet movement.
```

## When to Use $emote vs Other Tools

### Use $emote When:

- **Freeform roleplaying** - Player-initiated emotes and social RP
- **Combat descriptions** - Attacks, defenses, injuries
- **Environmental effects** - Weather, room ambiance, NPC actions
- **Multi-sensory events** - Things that involve sight, sound, smell, taste
- **Complex actions** - Multiple steps or compound actions
- **Targeting needed** - Actions directed at specific characters

### Use $pronoun When:

- **Pre-scripted game messages** - System-generated notifications
- **Simple announcements** - "Bob has entered the room"
- **Perspective-aware but sensory-agnostic** - Don't need sensory filtering
- **Single-line messages** - No complex parsing needed

```javascript
// $pronoun example - simple announcement
await $pronoun.broadcast(
  '{actor} {have} entered the room.',
  actor,
  room
);
// Actor: "You have entered the room."
// Others: "Bob has entered the room."
```

### Use Direct Sensory Methods When:

- **Single sensory channel** - Only one sense needed
- **No perspective shift** - Same message for everyone
- **Performance critical** - Avoid parsing overhead
- **Custom filtering** - Need more control than $emote provides

```javascript
// Direct sensory method
const viewers = room.contents.filter(obj => obj.isAgent);
for (const viewer of viewers) {
  const msg = await viewer.hear({
    text: 'Thunder rumbles in the distance.',
    source: room,
    volume: 0.7
  });
  if (msg) {
    await viewer.tell(msg);
  }
}
```

### Comparison Table

| Feature | $emote | $pronoun | Direct Sensory |
|---------|--------|----------|----------------|
| Sensory filtering | ✓ | ✗ | ✓ (manual) |
| Verb conjugation | ✓ | ✗ | ✗ |
| Pronoun resolution | ✓ | ✓ | ✗ |
| Perspective shift | ✓ | ✓ | ✗ |
| Multi-sensory | ✓ | ✗ | ✗ |
| Freeform parsing | ✓ | ✗ | ✗ |
| Performance | Medium | Fast | Fastest |
| Use case | RP emotes | System messages | Targeted effects |

### Decision Flow

```
Need sensory filtering (blind/deaf/etc)?
  Yes → Need freeform parsing (.verb ,verb)?
    Yes → $emote.broadcast()
    No → Direct sensory methods (see/hear/smell/taste)
  No → Need perspective shift (you/Bob)?
    Yes → $pronoun.broadcast()
    No → room.announce() or viewer.tell()
```

## Tips & Best Practices

1. **Combine sensory modes** - Use multiple prefixes for rich scenes
2. **Use targeting** - Reference other characters with pronouns
3. **Visual + audio for important actions** - Don't assume everyone can see
4. **Smell for atmosphere** - Environmental descriptions
5. **Taste for consumption** - Eating, drinking, kissing
6. **Check what viewers perceive** - Test with different sense combinations
7. **Use appropriate verbs** - Match action to sensory mode

## Common Patterns

### Social Interaction

```javascript
// Greeting
await $emote.broadcast('.wave and "Hey there!"', actor, room);

// Farewell
await $emote.broadcast('.wave goodbye and .leave', actor, room);

// Attention getting
await $emote.broadcast(',clear his throat and .look around', actor, room);
```

### Atmospheric Description

```javascript
// Multiple senses
await $emote.broadcast(
  '.notice the flickering torches, ,hear water dripping, and ~smell mildew',
  actor,
  room
);
```

### Combat Action

```javascript
// Attack with sound
await $emote.broadcast('.strike with his sword, ,yelling', attacker, room);

// Defensive
await $emote.broadcast('.dodge and .roll aside', defender, room);
```

### Stealth/Sneaking

```javascript
// Quiet movement
await $emote.broadcast('.creep silently toward the door', actor, room);

// Hidden action
await $emote.broadcast('.signal silently to Alice', actor, room);
```

## Integration with Senses

For emotes to work properly, characters need sense methods:

```javascript
// On agent/player objects
async see(event) {
  // Process visual events
  if (this.blind) return null;
  if (!this.hasLineOfSight(event.source)) return null;
  return event.text;
}

async hear(event) {
  // Process audio events
  if (this.deaf) return null;
  return event.text;
}

async smell(event) {
  // Process olfactory events
  if (this.anosmic) return null;
  return event.text;
}

async taste(event) {
  // Process gustatory events
  if (!this.hasTongue) return null;
  return event.text;
}
```

## Advanced Integration Patterns

### Custom Sensory Processing

Characters can implement custom logic in their sensory methods:

```javascript
// On a player/agent object
async see(event) {
  // Check if blind
  if (this.blind) return null;

  // Check perception filter (neural interface, hallucinations, etc.)
  const filters = this.perceptionFilters || [];
  for (const filter of filters) {
    if (filter.onSee) {
      const modified = await filter.onSee(event.text, event.source);
      if (modified !== undefined) {
        event.text = modified;
      }
    }
  }

  // Check if source is invisible
  if (event.source?.invisible && !this.canSeeInvisible) {
    return null;
  }

  // Reduce clarity in darkness
  if (this.location?.dark && !this.hasNightVision) {
    return 'You see movement in the darkness.';
  }

  return event.text;
}
```

### Combining with Perception Filters

Perception filters can modify emote output:

```javascript
// Neural interface perception filter
const maskFilter = {
  async onSee(message, source) {
    // Augment visual data with analysis
    if (source.isAgent) {
      const threat = await analyzeThreat(source);
      return `${message} [Threat: ${threat}]`;
    }
    return message;
  },

  async onHear(message, source) {
    // Translate speech in real-time
    if (message.includes('says,')) {
      return await translateSpeech(message);
    }
    return message;
  }
};

await agent.addPerceptionFilter(mask, maskFilter);

// Now all emotes are filtered through the neural interface
await $emote.broadcast('.wave and "Hello!"', bob, room);
// Agent sees: "Bob waves and says, 'Hello!' [Threat: LOW]"
```

### Room-Level Sensory Effects

Rooms can modify how emotes propagate:

```javascript
// Noisy room dampens quiet sounds
async broadcast(message, actor) {
  const viewers = this.contents.filter(obj => obj.isAgent);

  for (const viewer of viewers) {
    if (this.noisy && message.includes(',whisper')) {
      // Whispers lost in noise
      continue;
    }

    const personalized = await $emote.processEmote(message, actor, viewer);
    await viewer.tell(personalized);
  }
}
```

### Emote Macros

Players can define custom emote shortcuts:

```javascript
// On player object
this.emoteMacros = {
  bow: '.bow deeply with respect',
  laugh: ',laugh heartily',
  flee: '.turn pale and ,scream and .run away in terror',
  attack: '.draw his weapon and .charge forward, ,yelling'
};

// Usage in-game
> emote bow
// Expands to: .bow deeply with respect
```

### Contextual Emote Validation

Validate emotes based on character state:

```javascript
// Before broadcasting
async validateEmote(emoteString, actor) {
  // Can't talk if gagged
  if (actor.gagged && emoteString.includes('"')) {
    return {
      valid: false,
      error: 'You try to speak but only muffled sounds escape.'
    };
  }

  // Can't see visual actions if blind
  if (actor.blind && emoteString.includes('.look')) {
    return {
      valid: false,
      error: 'You cannot see.'
    };
  }

  // Can't perform actions while paralyzed
  if (actor.paralyzed) {
    return {
      valid: false,
      error: 'You cannot move.'
    };
  }

  return { valid: true };
}
```

## Edge Cases and Limitations

### Empty Emotes After Filtering

Some viewers may receive empty emotes if all segments are filtered:

```javascript
await $emote.broadcast('.wave', actor, room);

// Blind viewer gets nothing
// System should handle gracefully - no output, no error
```

### Speech Without Quotes

Speech must be quoted, or it becomes part of the verb:

```javascript
// Wrong - "says Hello!" (treats "Hello!" as part of verb)
await $emote.broadcast('.say Hello!', actor, room);

// Right - says, 'Hello!'
await $emote.broadcast('.say "Hello!"', actor, room);
// Or just:
await $emote.broadcast('"Hello!"', actor, room);
```

### Pronoun Ambiguity

When multiple targets exist, pronouns may be ambiguous:

```javascript
// Clear target
await $emote.broadcast('.look at Alice and .smile at her', actor, room);
// "Bob looks at Alice and smiles at her."

// Ambiguous - who is "them"?
await $emote.broadcast('.look at Alice and Bob and .wave at them', actor, room);
// System will use last mentioned target (Bob)
// Consider being explicit with names instead
```

### Performance with Large Rooms

Emotes process every viewer individually - can be slow in crowded areas:

```javascript
// Optimization: Skip unconscious/logged-out viewers
const activeViewers = room.contents.filter(obj =>
  obj.isAgent && obj.conscious && obj.connection
);

for (const viewer of activeViewers) {
  const msg = await $emote.processEmote(emoteString, actor, viewer);
  if (msg) await viewer.tell(msg);
}
```

### Conjugation Edge Cases

Some verbs don't follow standard rules:

```javascript
// Regular: "try" → "tries"
await $emote.broadcast('.try', actor, room);
// "Bob tries."

// Irregular verbs are handled by $english utility
// "go" → "goes" (not "gos")
// "have" → "has" (not "haves")
// See $english documentation for full list
```

## Performance Considerations

### Parsing Overhead

Emote parsing has overhead - use appropriately:

```javascript
// Bad for simple messages
await $emote.broadcast('.enter', actor, room);
// Overkill - just use $pronoun or direct announcement

// Good for complex emotes
await $emote.broadcast(
  '.burst through the door, ,breathing heavily, ~reeking of smoke, and "Fire!"',
  actor,
  room
);
// Multi-sensory, worth the parsing
```

### Caching Considerations

Parse once, format per viewer:

```javascript
// Efficient implementation inside broadcast()
const segments = await $emote.parseSegments(emoteString, actor, false);

// Reuse parsed segments for each viewer
for (const viewer of viewers) {
  const formatted = await $emote.format(segments, viewer);
  if (formatted) await viewer.tell(formatted);
}
```

### Batch Emotes

When multiple NPCs emit at once, consider batching:

```javascript
// Instead of individual broadcasts
for (const npc of npcs) {
  await $emote.broadcast('.cheer', npc, room);
}

// Consider a single compound emote
await room.announce('The crowd erupts in cheers.');
```

## Quick Reference Guide

### Syntax Cheat Sheet

```
Visual:      .verb phrase     →  viewer.see()
Audio:       ,verb phrase     →  viewer.hear()
Smell:       ~verb phrase     →  viewer.smell()
Taste:       ^verb phrase     →  viewer.taste()
Speech:      "text"           →  viewer.hear()

Pronouns:    him/her/them     →  object pronoun (target)
             his/her/their    →  possessive (ownership)
             himself/herself  →  reflexive (self-action)
             myself/yourself  →  explicit reflexive
```

### Common Emote Patterns

```javascript
// Greeting someone
".wave to Alice and \"Hello!\""
".smile and .nod to Bob"

// Leaving
".wave goodbye and .head for the door"
".stand and .walk out"

// Reactions
",laugh and .slap his knee"
".raise an eyebrow"
",sigh heavily"

// Combat
".draw his weapon and .advance on Bob"
".dodge and .roll to the side"
".swing his sword at Alice, ,yelling"

// Stealth
".creep quietly toward the door"
".gesture silently to Alice"
".slip into the shadows"

// Multi-sensory atmosphere
".enter the tavern, ~reeking of rain, and ,stomp his boots"
".light a cigarette and ~fill the air with smoke"
```

### Sensory Filter Quick Test

To test what different viewers perceive:

```javascript
// Test emote with all sensory modes
await $emote.broadcast(
  '.raise his hand, ,clear his throat, ~smell of cologne, and "Attention!"',
  actor,
  room
);

// Full senses:
// "Bob raises his hand, clears his throat, smells of cologne, and says, 'Attention!'"

// Blind only:
// "Bob clears his throat, smells of cologne, and says, 'Attention!'"

// Deaf only:
// "Bob raises his hand and smells of cologne."

// No smell:
// "Bob raises his hand, clears his throat, and says, 'Attention!'"

// Blind + deaf:
// "Bob smells of cologne."
```

### Troubleshooting Common Issues

#### Problem: Emote appears as-is without parsing

```javascript
// Wrong - missing prefix
await $emote.broadcast('smile', actor, room);
// Output: "Bob smile" (not parsed)

// Right - include prefix
await $emote.broadcast('.smile', actor, room);
// Output: "Bob smiles."
```

#### Problem: Speech not showing properly

```javascript
// Wrong - quotes missing
await $emote.broadcast('.say Hello', actor, room);
// Output: "Bob says Hello." (wrong grammar)

// Right - quote the speech
await $emote.broadcast('.say "Hello"', actor, room);
// Output: "Bob says, 'Hello!'"
```

#### Problem: Pronoun not resolving

```javascript
// Wrong - no target established
await $emote.broadcast('.smile at her', actor, room);
// Output: "Bob smiles at her." (who is "her"?)

// Right - establish target first
await $emote.broadcast('.look at Alice and .smile at her', actor, room);
// Output: "Bob looks at Alice and smiles at her."
```

#### Problem: Conjugation sounds wrong

```javascript
// Wrong - verb needs to be first word after prefix
await $emote.broadcast('.quickly run', actor, room);
// Output: "Bob quicklys run." (bad conjugation)

// Right - verb first, then modifiers
await $emote.broadcast('.run quickly', actor, room);
// Output: "Bob runs quickly."
```

### Integration Checklist

For $emote to work properly in your world:

- [ ] Agents implement `see(event)` method (returns text or null)
- [ ] Agents implement `hear(event)` method (returns text or null)
- [ ] Agents implement `smell(event)` method (returns text or null)
- [ ] Agents implement `taste(event)` method (returns text or null)
- [ ] Agents have `blind`, `deaf` properties (or equivalent checks)
- [ ] Rooms have `contents` array of objects in the room
- [ ] Agents filter by `isAgent` property or similar
- [ ] $english utility available for verb conjugation
- [ ] $pronoun utility available for pronoun resolution

### Performance Optimization Tips

1. **Cache parsed segments** - Don't re-parse for each viewer
2. **Filter viewers first** - Only process active, conscious agents
3. **Batch simple messages** - Use direct announces for crowds
4. **Limit emote length** - Very long emotes increase parse time
5. **Use simpler tools when appropriate** - $pronoun for simple messages

## Real-World Integration Example

Complete example showing how to add emotes to a custom verb:

```javascript
// On $agent or custom prototype
await agent.setMethod('dance', `
  // Validate action
  if (self.paralyzed) {
    return self.tell("You can't move!");
  }

  // Determine dance style based on mood/skills
  let style = 'awkwardly';
  if (self.skills?.dancing > 50) {
    style = 'gracefully';
  } else if (self.drunk) {
    style = 'unsteadily';
  }

  // Create multi-sensory emote
  const emote = \`.dance \${style} and ,hum a tune\`;

  // Broadcast to room
  await $emote.broadcast(emote, self, self.location);

  // Update state
  self.lastAction = 'dancing';
  self.stamina = (self.stamina || 100) - 5;

  return null; // Already sent message via broadcast
`);

// Usage in-game
> dance
// Sighted+Hearing: "You dance gracefully and hum a tune."
// Others see: "Alice dances gracefully and hums a tune."
// Blind person: "Alice hums a tune."
// Deaf person: "Alice dances gracefully."
```

## See Also

- [$pronoun](./pronoun.md) - Perspective-aware messaging (used internally)
- [$english](./english.md) - Verb conjugation (used for emote verbs)
- [Best Practices](../best-practices.md) - Immersive RP patterns
- [Sensory System](../core/senses.md) - Implementing see/hear/smell/taste methods
- [Perception Filters](../core/perception-filters.md) - Advanced sensory modification
