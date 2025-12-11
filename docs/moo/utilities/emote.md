# $.emote - Sensory-Aware Emotes

Use `$.emote` for freeform roleplaying actions with sensory routing. Different viewers perceive different parts based on their senses (sight, hearing, smell, taste).

## Purpose

Provides sensory-aware freeform emote parsing and broadcasting. Players can express actions using simple prefix notation, and the system routes each part to viewers based on their available senses—blind characters don't see visual actions, deaf characters don't hear sounds, etc.

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
await $.emote.broadcast('.smile and "Hello!"', actor, room);
// Sighted+Hearing: "Bob smiles and says, 'Hello!'"
// Blind only:      "Bob says, 'Hello!'"
// Deaf only:       "Bob smiles and says something."
```

## Input Syntax

### Sensory Prefixes

| Prefix | Type | Routed Via | Example |
|--------|------|------------|---------|
| `.verb` | Visual | `viewer.see()` | `.smile` |
| `,verb` | Audible | `viewer.hear()` | `,growl` |
| `~verb` | Olfactory | `viewer.smell()` | `~reek of garlic` |
| `^verb` | Gustatory | `viewer.taste()` | `^taste blood` |
| `"text"` | Speech | `viewer.hear()` | `"Hello!"` |

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

## API Reference

### broadcast() - Send to Room

```javascript
await $.emote.broadcast(emoteString, actor, room)
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
await $.emote.broadcast('.smile', actor, room);
// Sighted: "Bob smiles."
// Blind: (nothing)

// Audio action
await $.emote.broadcast(',growl menacingly', actor, room);
// Hearing: "Bob growls menacingly."
// Deaf: (nothing)

// Combined actions
await $.emote.broadcast('.smile and "Hello!"', actor, room);
// Full senses: "Bob smiles and says, 'Hello!'"
// Blind: "Bob says, 'Hello!'"
// Deaf: "Bob smiles and says something."
```

### parseSegments() - Parse Emote

```javascript
await $.emote.parseSegments(emoteString, actor, isFirstPerson)
```

Parses emote into segments for inspection or custom processing.

**Examples:**
```javascript
const segments = await $.emote.parseSegments('.fall and ,groan', actor, false);
// Returns array of segment objects with type, text, sensory requirements
```

### format() - Format for Viewer

```javascript
await $.emote.format(segments, viewer)
```

Formats parsed segments for specific viewer based on their senses.

**Examples:**
```javascript
const segments = await $.emote.parseSegments('.wave', actor, false);
const text = await $.emote.format(segments, viewer);
// Returns personalized view based on viewer's senses
```

### processEmote() - Single Viewer

```javascript
await $.emote.processEmote(emoteString, actor, viewer)
```

Process emote for one specific viewer (combines parse and format).

**Examples:**
```javascript
const result = await $.emote.processEmote('.wave', actor, viewer);
await viewer.tell(result);
```

### Pronoun Helpers

```javascript
await $.emote.getObjectPronoun(obj)      // "him"/"her"/"them"
await $.emote.getPossessive(obj)         // "his"/"her"/"their"
await $.emote.getReflexive(obj)          // "himself"/"herself"/"themselves"
await $.emote.getSubjectPronoun(obj)     // "he"/"she"/"they"
```

## Real-World Examples

### Basic Emotes

```javascript
// Simple visual
await $.emote.broadcast('.wave', actor, room);
// "Bob waves."

// Visual with target
await $.emote.broadcast('.wave to Alice', actor, room);
// "Bob waves to Alice."

// Audio action
await $.emote.broadcast(',clear his throat', actor, room);
// "Bob clears his throat."

// Smell action
await $.emote.broadcast('~reek of cheap cologne', actor, room);
// "Bob reeks of cheap cologne."
```

### Speech Emotes

```javascript
// Direct speech
await $.emote.broadcast('"Hello, everyone!"', actor, room);
// "Bob says, 'Hello, everyone!'"

// Speech with action
await $.emote.broadcast('.wave and "Hello!"', actor, room);
// "Bob waves and says, 'Hello!'"

// Custom verb
await $.emote.broadcast('.say loudly "Listen up!"', actor, room);
// "Bob says loudly, 'Listen up!'"
```

### Complex Emotes

```javascript
// Multiple actions
await $.emote.broadcast('.stand up, ,sigh heavily, and .walk to the door', actor, room);
// Sighted+Hearing: "Bob stands up, sighs heavily, and walks to the door."
// Blind only: "Bob sighs heavily." (only hears the sigh)
// Deaf only: "Bob stands up and walks to the door." (only sees movement)

// With target pronouns
await $.emote.broadcast('.look at Alice and .smile at her', actor, room);
// "Bob looks at Alice and smiles at her."

// Reflexive
await $.emote.broadcast('.hurt himself', actor, room);
// Actor sees: "You hurt yourself."
// Others see: "Bob hurts himself."
```

### Sensory Combinations

```javascript
// Visual + audio
await $.emote.broadcast('.raise his hand and ,clear his throat', actor, room);
// Full senses: "Bob raises his hand and clears his throat."
// Blind: "Bob clears his throat."
// Deaf: "Bob raises his hand."
// Blind+Deaf: (nothing)

// Smell + visual
await $.emote.broadcast('.enter the room, ~reeking of smoke', actor, room);
// Sighted+Smell: "Bob enters the room, reeking of smoke."
// Blind+Smell: "Bob reeks of smoke."
// Sighted only: "Bob enters the room."
```

### Combat Emotes

```javascript
// Attack with sensory details
await $.emote.broadcast(
  '.swing his sword at Alice, ,grunting with effort',
  actor,
  room
);
// "Bob swings his sword at Alice, grunting with effort."

// Injury description
await $.emote.broadcast(
  '.clutch his bleeding wound and ,cry out in pain',
  victim,
  room
);
// "Bob clutches his bleeding wound and cries out in pain."
```

### Environmental Emotes

```javascript
// Room effect (no actor)
await $.emote.broadcast(
  ',creak ominously and ~smell of decay',
  null,
  room
);
// "The room creaks ominously and smells of decay."

// Weather effect
await $.emote.broadcast(
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
await $.emote.broadcast('.sneak quietly to the door', actor, room);
// Sighted: "Bob sneaks quietly to the door."
// Others might not perceive if perception check fails

// Silent visual
await $.emote.broadcast('.gesture silently to Alice', actor, room);
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
await $.emote.broadcast('.wave and "Hey there!"', actor, room);

// Farewell
await $.emote.broadcast('.wave goodbye and .leave', actor, room);

// Attention getting
await $.emote.broadcast(',clear his throat and .look around', actor, room);
```

### Atmospheric Description

```javascript
// Multiple senses
await $.emote.broadcast(
  '.notice the flickering torches, ,hear water dripping, and ~smell mildew',
  actor,
  room
);
```

### Combat Action

```javascript
// Attack with sound
await $.emote.broadcast('.strike with his sword, ,yelling', attacker, room);

// Defensive
await $.emote.broadcast('.dodge and .roll aside', defender, room);
```

### Stealth/Sneaking

```javascript
// Quiet movement
await $.emote.broadcast('.creep silently toward the door', actor, room);

// Hidden action
await $.emote.broadcast('.signal silently to Alice', actor, room);
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

## See Also

- [$.pronoun](./pronoun.md) - Perspective-aware messaging (used internally)
- [$.english](./english.md) - Verb conjugation (used for emote verbs)
- [Best Practices](../best-practices.md) - Immersive RP patterns
