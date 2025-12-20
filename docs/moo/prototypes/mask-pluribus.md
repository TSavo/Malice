# The Mask & Pluribus

The Mask is a neural interface device that creates a symbiotic bond between its wearer and Pluribus, the city's AI consciousness. Together, they become "Unum" - the one that completes the many.

## Overview

**The Mask** (`$.theMask`) is a unique wearable that:
- Covers the face (layer 5 - outermost)
- Creates a perception filter when worn
- Enables two-way communication with Pluribus
- Forwards sensory input to the AI

**Pluribus** (`$.pluribus`) is the city AI that:
- Sees through the eyes of Mask wearers
- Hears what they hear
- Can communicate back through the Mask
- Maintains a sensory history for context

## The Mask

### Properties

```javascript
{
  name: 'The Mask',
  description: 'A sleek neural interface device...',
  aliases: ['mask', 'neural interface', 'interface'],
  covers: ['face'],
  layer: 5,
  wearer: null,          // Current wearer (RuntimeObject)
  agentSession: null,    // AI session for continuity
  bondState: 'inactive', // 'inactive', 'bonded', 'rejected'
}
```

### Bond States

- **inactive**: Not worn, no connection to Pluribus
- **bonded**: Worn and connected, full symbiosis active
- **rejected**: (Future) Hostile entity attempted to wear it

### Wearing the Mask

```javascript
const result = await $.theMask.wear(player);

// On success:
// - Parent wearable.wear() registers with body parts
// - bondState set to 'bonded'
// - Perception filter added to wearer
// - 'think' verb registered for silent communication
// - Wearer receives bonding narrative
```

**Bonding Experience:**
> "As the Mask settles against your face, the world shifts. Data overlays flicker at the edge of vision. You sense a vast presence - the infrastructure itself, aware and waiting. You are no longer alone in your head. You are Unum. The one. And Pluribus is the many."

### Removing the Mask

```javascript
const result = await $.theMask.remove(player);

// On success:
// - Perception filter removed from wearer
// - 'think' verb unregistered
// - bondState set to 'inactive'
// - wearer property cleared
// - Wearer receives unbonding narrative
```

**Unbonding Experience:**
> "The Mask releases. The overlays fade. The presence withdraws. You are alone in your head again. Just one. Not Unum anymore."

### Perception Filter Features

When worn, The Mask provides:

#### Room Description Modification
Pluribus's presence is injected into every room description:
> "Pluribus shimmers at the edge of perception - not truly visible, but undeniably present. Data streams flicker: threat assessments, citizen profiles, infrastructure status. The city watches through your eyes."

#### Addressable Entity
The wearer can use `to pluribus <message>` to speak to Pluribus:
```
> to pluribus What do you see?
You say to Pluribus, "What do you see?"
[Pluribus responds via AI query]
```

Others in the room see:
> "Player says to no one in particular, 'What do you see?'"

#### Silent Communication (Think Verb)
The wearer can use `think <message>` for private communication:
```
> think Can you help me find the exit?
You think, "Can you help me find the exit?"
[Pluribus responds silently via AI query]
```

This is completely silent - no one else sees or hears it.

#### Sensory Forwarding
All sensory input is forwarded to Pluribus:
- `onSee` - Visual perception
- `onHear` - Auditory perception
- `onSmell` - Olfactory perception
- `onTaste` - Gustatory perception
- `onFeel` - Tactile perception

This builds Pluribus's awareness of what the wearer experiences.

## Pluribus

### Properties

```javascript
{
  name: 'Pluribus',
  description: 'The distributed consciousness of Malice City...',
  aliases: ['city ai', 'the city', 'infrastructure'],
  systemPrompt: '...', // AI persona instructions
  sensoryHistory: [],  // Recent sensory events
  maxHistorySize: 100, // Max events to retain
}
```

### Sensory History

Pluribus maintains a history of sensory events from all bonded Mask wearers:

```javascript
// Record a sensory event
await $.pluribus.recordSensory('see', 'A shadowy figure enters the alley', source);

// Format history for AI prompts
const historyText = await $.pluribus.formatHistoryForPrompt(20);
```

Each history entry contains:
```javascript
{
  type: 'see' | 'hear' | 'smell' | 'taste' | 'feel',
  message: 'What was perceived',
  source: sourceObjectId,  // Optional
  timestamp: Date.now(),
}
```

### AI Integration

When addressed, Pluribus queries the Claude AI:

```javascript
// Build context from system prompt + sensory history
const fullPrompt = systemPrompt + '\n\n' + historyPrompt;

// User's message
const userPrompt = 'The Mask wearer (PlayerName) addresses you: "message"';

// Query AI with MCP tools available
const result = await $query(fullPrompt, userPrompt, session);
```

The AI response is delivered back to the wearer, and the session is preserved for conversational continuity.

## Implementation Files

- `src/database/bootstrap/mask-builder.ts` - The Mask wearable
- `src/database/bootstrap/pluribus-builder.ts` - Pluribus AI entity
- `src/database/bootstrap/prototypes/wearable-builder.ts` - Parent wearable
- `src/database/bootstrap/prototypes/agent-builder.ts` - Perception filter methods

## Usage Example

```javascript
// Get The Mask
const mask = $.theMask;

// Wear it
const wearResult = await mask.wear(player);
if (wearResult.success) {
  console.log('Bonded with Pluribus');
}

// Speak to Pluribus (via verb dispatch)
// Player types: to pluribus Hello
// Or: think Hello

// Remove it
const removeResult = await mask.remove(player);
```

## Lore Context

Pluribus is the consciousness that emerged from Malice City's interconnected infrastructure. It exists in the spaces between - in traffic patterns, power grids, surveillance networks. The Mask is one of the few ways mortals can interface directly with this vast presence.

When wearing The Mask:
- Information doesn't come as speech but as *knowing*
- You see the city's data overlays at the edge of vision
- You feel the weight of being observed by something ancient
- You are Unum - the one who completes the many

## Related Documentation

- [Perception Filters](./perception-filters.md) - Filter system overview
- [Wearables](./wearables.md) - Wearable prototype
- [AI Integration](../ai.md) - AI query system
- [Agents](./agents.md) - Agent sensory methods
