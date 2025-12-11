# $.pronoun - Perspective-Aware Messaging

Use `$.pronoun.sub()` for text that varies by viewer (second vs third person). Essential for immersive messaging where the actor sees "You" while others see the actor's name.

## Purpose

Provides perspective-aware message formatting. Automatically converts templates with pronoun codes into personalized messages for each viewer—actors see "you," targets see "you," observers see names.

## Why Use This?

**Bad: Manual perspective handling**
```javascript
// 30 lines per message type
async function attackMessage(attacker, target, damage, viewers) {
  for (const viewer of viewers) {
    let msg;
    if (viewer.id === attacker.id) {
      msg = `You hit ${target.name} for ${damage} damage.`;
    } else if (viewer.id === target.id) {
      msg = `${attacker.name} hits you for ${damage} damage.`;
    } else {
      msg = `${attacker.name} hits ${target.name} for ${damage} damage.`;
    }
    await viewer.tell(msg);
  }
}
```

**Good: One template, all perspectives**
```javascript
await $.pronoun.announce(
  room,
  '%N %v{hit} %tN for ' + damage + ' damage.',
  attacker,
  null,
  target
);
// Attacker: "You hit Bob for 15 damage."
// Target:   "Jim hits you for 15 damage."
// Others:   "Jim hits Bob for 15 damage."
```

## Template Codes

### Actor Codes (The person performing the action)

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

### Target Codes (The person being acted upon)

Prefix with `%t`:

| Code | Meaning | Target Sees | Others See |
|------|---------|-------------|------------|
| `%tN` | Target name (cap) | You | Jim |
| `%tn` | Target name (lower) | you | Jim |
| `%ts` | Target subject | you | he/she/they |
| `%to` | Target object | you | him/her/them |
| `%tp` | Target possessive | your | his/her/their |
| `%tq` | Target possessive noun | yours | his/hers/theirs |
| `%tr` | Target reflexive | yourself | himself/herself |

### Object Codes (Things involved in the action)

| Code | Meaning | Example |
|------|---------|---------|
| `%d` | Direct object | "the sword" |
| `%D` | Direct object (cap) | "The sword" |
| `%i` | Indirect object | "the chest" |
| `%I` | Indirect object (cap) | "The chest" |
| `%l` | Location name | "the tavern" |
| `%L` | Location name (cap) | "The tavern" |

## API Reference

### sub() - Format for One Viewer

```javascript
await $.pronoun.sub(template, actor, directObj?, target?, indirectObj?, location?, viewer?)
```

Returns formatted string from template for specific viewer.

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | string | Template with pronoun codes |
| `actor` | RuntimeObject | Person performing action |
| `directObj` | RuntimeObject | Direct object (optional) |
| `target` | RuntimeObject | Person receiving action (optional) |
| `indirectObj` | RuntimeObject | Indirect object (optional) |
| `location` | RuntimeObject | Location (optional) |
| `viewer` | RuntimeObject | Who's reading (defaults to actor) |

**Examples:**
```javascript
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
// Attacker: "You punch Jim in his face, breaking his nose!"
// Victim:   "Bob punches you in your face, breaking your nose!"
// Others:   "Bob punches Jim in his face, breaking his nose!"
```

### announce() - Broadcast to Room

```javascript
await $.pronoun.announce(room, template, actor, directObj?, target?, indirectObj?, location?)
```

Broadcasts perspective-aware message to everyone in a room.

**Examples:**
```javascript
// Everyone in the room gets the appropriate perspective
await $.pronoun.announce(room, '%N %v{enter} from the north.', actor);

// With objects
await $.pronoun.announce(room, '%N %v{drop} %d.', actor, item);

// With targets
await $.pronoun.announce(room, '%N %v{wave} at %tN.', actor, null, target);
```

### tell() - Send to One Person

```javascript
await $.pronoun.tell(player, template, actor, directObj?, target?, indirectObj?, location?)
```

Sends perspective-aware message to one specific person.

**Examples:**
```javascript
// tell() - Send to one specific person
await $.pronoun.tell(player, '%N %v{feel} dizzy.', player);
// Player sees: "You feel dizzy."

// Send message about another actor to a player
await $.pronoun.tell(observer, '%N %v{collapse}.', actor);
// If observer is actor: "You collapse."
// If observer is not actor: "Bob collapses."
```

## Real-World Examples

### Combat Hit

```javascript
// One template, all perspectives handled
await $.pronoun.announce(
  room,
  '%N %v{swing} %d at %tN, striking %to in the chest!',
  attacker,
  weapon,
  victim
);
// Attacker: "You swing the axe at Bob, striking him in the chest!"
// Victim:   "Jim swings the axe at you, striking you in the chest!"
// Others:   "Jim swings the axe at Bob, striking him in the chest!"
```

### Picking Up Items

```javascript
await $.pronoun.announce(
  room,
  '%N %v{pick} up %d.',
  player,
  item
);
// Player: "You pick up the rusty sword."
// Others: "Bob picks up the rusty sword."
```

### Possessive Actions

```javascript
// Possessive pronoun (adjective form)
await $.pronoun.announce(
  room,
  '%N %v{take} %p sword.',
  actor
);
// Actor:  "You take your sword."
// Others: "Bob takes his sword."

// Possessive noun (standalone form)
await $.pronoun.announce(
  room,
  'The victory is %q!',
  actor
);
// Actor:  "The victory is yours!"
// Others: "The victory is his!"
```

### Reflexive Actions

```javascript
await $.pronoun.announce(
  room,
  '%N %v{hurt} %r!',
  actor
);
// Actor:  "You hurt yourself!"
// Others: "Bob hurts himself!"
```

### Social Interaction

```javascript
await $.pronoun.announce(
  room,
  '%N %v{smile} warmly at %tN.',
  actor,
  null,
  target
);
// Actor:  "You smile warmly at Jim."
// Target: "Bob smiles warmly at you."
// Others: "Bob smiles warmly at Jim."
```

## Combining with $.english

```javascript
// Use $.english for list formatting, $.pronoun for perspective
const items = ['sword', 'shield', 'helm'];
const itemList = await $.english.list(items);

await $.pronoun.announce(
  room,
  `%N %v{drop} ${itemList}.`,
  player
);
// Player: "You drop sword, shield, and helm."
// Others: "Bob drops sword, shield, and helm."
```

## Tips & Best Practices

1. **Use announce() for room messages** - Handles all viewers automatically
2. **Use tell() for private messages** - Send to one person
3. **Combine with $.english** - Format lists/counts, then apply pronouns
4. **Test all perspectives** - Verify actor, target, and observer views
5. **Cache templates** - Complex templates can be stored and reused

## Common Patterns

### Two-Person Interaction

```javascript
// Actor gives item to target
await $.pronoun.announce(
  room,
  '%N %v{hand} %d to %tN.',
  giver,
  item,
  receiver
);
```

### Self-Action

```javascript
// Actor examines themselves
await $.pronoun.tell(
  player,
  '%N %v{examine} %r carefully.',
  player
);
```

### Environmental Effect

```javascript
// Location-based message
await $.pronoun.announce(
  room,
  '%N %v{feel} the heat from %l.',
  player,
  null,
  null,
  null,
  room
);
```

## See Also

- [$.english](./english.md) - Grammar and pluralization
- [$.format](./format.md) - Text layout and compose()
- [Best Practices](../best-practices.md) - Composition patterns
