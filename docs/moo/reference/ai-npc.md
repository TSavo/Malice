# AI/NPC System Reference

The AI system manages AI-controlled human characters (NPCs) that are indistinguishable from player characters. NPCs are regular `$human` instances tracked by role with personality, history, and persistent memories.

## Overview

AI-controlled NPCs:
- Are standard Human objects with full bodies
- Can speak, move, hold items, wear clothing
- Have personality traits and backstory
- Maintain persistent memories across sessions
- Are tracked in a central registry by role

## Creating NPCs

### spawn - Create a New NPC

```javascript
// Basic spawn with just a role
const npc = await $ai.spawn('guard');

// Full spawn with options
const npc = await $ai.spawn('shopkeeper', {
  name: 'Marcus',
  description: 'A gruff middle-aged merchant.',
  sex: 'male',
  age: 45,
  location: await $load(storeRoom).id,
  personality: {
    traits: ['greedy', 'suspicious', 'cunning'],
    quirks: ['counts coins obsessively'],
    values: ['profit', 'self-preservation'],
    fears: ['losing money', 'the Continuum'],
    motivations: ['get rich', 'stay under the radar'],
  },
  history: {
    backstory: 'Former corporate accountant who fled during The Burning.',
    events: ['Survived the collapse of Omnicorp', 'Lost family in riots'],
    secrets: ['Has a hidden stash of pre-Burning currency'],
    relationships: { 'City Guard': 'bribes them regularly' },
  },
});
```

### Spawn Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | NPC's name (default: 'Unnamed') |
| `description` | string | Description text |
| `sex` | string | 'male', 'female', 'non-binary' (random if omitted) |
| `age` | number | Age in years (18-65 weighted random if omitted) |
| `height` | number | Height in meters (random based on sex if omitted) |
| `weight` | number | Weight in kg (random based on BMI if omitted) |
| `locationId` | number | Room ID to spawn in |
| `appearance` | object | Physical appearance details |
| `personality` | string/object | Personality description or structured data |
| `history` | string/object | Backstory or structured history |
| `clothed` | boolean | Auto-dress using tailor agent |
| `spawnedBy` | number | Creator's object ID (for tracking) |

### Appearance Options

If not provided, appearance is randomly generated:

```javascript
appearance: {
  skinTone: 'olive',
  eyeColor: 'green',
  leftEyeColor: 'green',      // For heterochromia
  rightEyeColor: 'blue',
  eyeStyle: 'almond',
  hairColor: 'brown',
  hairStyle: 'curly',
  hairTexture: 'thick',
  buildType: 'athletic',
  faceShape: 'oval',
  noseShape: 'roman',
  lipShape: 'full',
  freckles: 'light',
  facialHair: 'stubble',
  distinguishingMark: 'scar on left cheek',
}
```

## Managing NPCs

### despawn - Remove an NPC

```javascript
// Remove NPC and recycle all objects
await $ai.despawn(npcId);

// Remove from registry but keep the object
await $ai.despawn(npcId, false);
```

### NPC Communication (via announce)

NPCs speak and emote using `location.announce()` with pronoun substitution:

```javascript
const npc = await $load(npcId);
const room = npc.location;

// Make NPC speak - %A = NPC's name, %av{say} = conjugated verb
await room.announce(npc, null, {
  others: '%A %av{say}, "Hello there!"'
});
// Others see: "Marcus says, Hello there!"

// Make NPC emote
await room.announce(npc, null, {
  others: '%A %av{wave} dismissively.'
});
// Others see: "Marcus waves dismissively."

// Speak to specific target - %T = target name, %t = lowercase
await room.announce(npc, target, {
  target: '%A %av{say} to you, "State your business."',
  others: '%A %av{say} to %t, "State your business."'
});

// Move NPC through exit
await npc.go('north');
// Returns: { success, direction, fromRoom, toRoom, availableExits }
```

### look - Get NPC's View

```javascript
// Get what the NPC can see
const view = await $ai.look(npcId);
// Returns room description, exits, contents, etc.
```

## Personality and History

### Setting Personality

```javascript
// String form
await $ai.setPersonality(npcId, 'A grumpy but fair guard who has seen too much.');

// Structured form
await $ai.setPersonality(npcId, {
  traits: ['loyal', 'disciplined', 'cynical'],
  quirks: ['cracks knuckles when nervous'],
  values: ['duty', 'order'],
  fears: ['chaos', 'losing control'],
  motivations: ['protect the city', 'earn respect'],
});
```

### Setting History

```javascript
// String form
await $ai.setHistory(npcId, 'Former soldier who joined the guard after The Burning.');

// Structured form
await $ai.setHistory(npcId, {
  backstory: 'Born in the lower levels, clawed his way up.',
  events: [
    'Witnessed the Corporate Riots of 2095',
    'Lost his partner in a gang ambush',
    'Promoted to Senior Guard after exposing corruption'
  ],
  secrets: [
    'Takes bribes from the Syndicate',
    'Has a gambling problem'
  ],
  relationships: {
    'Captain Torres': 'mentor and father figure',
    'The Syndicate': 'owes them money',
  },
});
```

### Getting Full Profile

```javascript
const profile = await $ai.getProfile(npcId);
// {
//   success: true,
//   humanId: 123,
//   role: 'guard',
//   name: 'Marcus',
//   description: '...',
//   personality: {...},
//   history: {...},
//   notes: [...],
//   memories: [...],
// }
```

## Memory System

NPCs have persistent memories that survive session resets. Use memories to build IC (in-character) knowledge over time.

### Creating Memories

```javascript
// Remember meeting someone
await $ai.remember(npcId,
  'Met Jack - tall, scar on cheek, said he works maintenance',
  'critical',
  ['player', 'introduction']
);

// Remember an event
await $ai.remember(npcId,
  'Witnessed fight in the market square between two gangs',
  'important',
  ['crime', 'location']
);

// Remember casual info
await $ai.remember(npcId,
  'The coffee at the corner shop is terrible',
  'normal',
  ['location']
);
```

### Importance Levels

| Level | Description | Persistence |
|-------|-------------|-------------|
| `critical` | Identity info, major events, crimes | Never forget |
| `important` | Useful facts, schedules | Retained long-term |
| `normal` | Minor observations | May be pruned |

### Memory Tags

Common tags for organization:
- `player` - About a player character
- `npc` - About another NPC
- `location` - About a place
- `crime` - Witnessed crime
- `positive` - Good interaction
- `negative` - Bad interaction
- `secret` - Confidential info
- `plot` - Related to a storyline

### Retrieving Memories

```javascript
// Get all memories
const result = await $ai.recall(npcId);
// { success: true, memories: [...], count: N }

// Filter by importance
const critical = await $ai.recall(npcId, { importance: 'critical' });

// Filter by tag
const playerMems = await $ai.recall(npcId, { tag: 'player' });

// Limit results
const recent = await $ai.recall(npcId, { limit: 10 });
```

### Removing Memories

```javascript
// Remove by index (0 = most recent)
await $ai.forget(npcId, 0);

// Remove by text pattern
await $ai.forgetByText(npcId, 'Jack');

// Clear all memories
await $ai.clearMemories(npcId);
```

### Memory Summary for AI Context

```javascript
// Get formatted summary for system prompt
const summary = await $ai.getMemorySummary(npcId);

// With options
const summary = await $ai.getMemorySummary(npcId, {
  maxLength: 2000,
  criticalOnly: true,
});
```

## Registry Queries

### Check if AI-Controlled

```javascript
const isAI = await $ai.isAiControlled(humanId);
// true or false
```

### List NPCs

```javascript
// Get all NPCs
const all = await $ai.getAll();
// Array of Human RuntimeObjects

// Get NPCs by role
const guards = await $ai.getByRole('guard');
// Array of Human RuntimeObjects

// Get all roles
const roles = await $ai.getRoles();
// ['guard', 'shopkeeper', 'clerk', ...]

// Get counts
const total = await $ai.count();
const guardCount = await $ai.countByRole('guard');
```

### Get NPC Info

```javascript
const info = await $ai.getInfo(npcId);
// {
//   human: RuntimeObject,
//   role: 'guard',
//   spawnedAt: '2024-01-15T10:30:00Z',
//   spawnedBy: 42,
//   originalLocation: 123,
//   personality: {...},
//   history: {...},
//   name: 'Marcus',
//   location: RuntimeObject,
// }
```

### Change Role

```javascript
await $ai.setRole(npcId, 'supervisor');
// Moves NPC from old role to new role in registry
```

## AI Agent System Prompt

Each NPC has an `agentSystemPrompt` property that defines their behavior when controlled by an AI agent. The default prompt includes:

- Identity and role information
- IC vs OOC knowledge separation rules
- World knowledge via MCP resources
- Memory management instructions
- Communication commands
- Chain of command principles
- Agency guidelines

### System Prompt Variables

The prompt uses `{{variable}}` syntax for templating:

| Variable | Description |
|----------|-------------|
| `{{name}}` | NPC's name |
| `{{role}}` | NPC's role |
| `{{id}}` | NPC's object ID |
| `{{datetime}}` | Current date/time |
| `{{personality}}` | Formatted personality |
| `{{history}}` | Formatted history |
| `{{memories}}` | Memory summary |
| `{{notes}}` | Builder notes |
| `{{sensoryHistory}}` | Recent sensory events |

### Customizing the Prompt

```javascript
// Get default prompt
const defaultPrompt = $ai.defaultAgentPrompt;

// Set custom prompt for specific NPC
npc.agentSystemPrompt = customPrompt;
```

## Auto-Dressing with Tailor

The `tailor` action uses an AI agent to dress NPCs appropriately:

```javascript
// Dress NPC based on role/context
await $ai.tailor(npcId);

// With context hint
await $ai.tailor(npcId, 'shabby, recently fired, down on luck');
```

## Event Hooks

NPCs use the same hooks as players:

### onSpokenTo

```javascript
// Called when someone speaks to the NPC
human.setMethod('onSpokenTo', `
  const speaker = args[0];
  const speech = args[1];

  // Check memories for this person
  // Generate appropriate response
  // Create memory of interaction
`);
```

### onItemReceived

```javascript
// Called when NPC receives an item
human.setMethod('onItemReceived', `
  const item = args[0];
  const giver = args[1];

  // React to the item
  // Maybe give something in return
`);
```

## Notes System Integration

Builder notes provide guidance for NPC behavior:

```javascript
// Add a note
await $notes.add(npcId,
  'Can offer 10% discount to citizens in good standing',
  'builder',
  ['powers', 'pricing']
);

// NPCs should read notes but NEVER add powers to themselves
// Notes come from builders only
```

## MCP Tool Integration

The MCP server provides tools for managing NPCs:

```javascript
// Spawn NPC
const npc = await $ai.spawn({ role: 'guard', name: 'Bob', location: await $load(123) });

// Despawn
await $ai.despawn(456);

// NPC communication - use announce with pronoun substitution
const room = npc.location;
await room.announce(npc, null, {
  others: '%A %av{say}, "Hello!"'
});

// NPC movement
await npc.go('north');

// Memory management
await $ai.remember(456, 'Met Jack', 'critical');

// Get profile
await $ai.getProfile(456);
```

## Best Practices

### 1. Give NPCs Clear Roles

```javascript
// Good - specific role
await $ai.spawn('checkpoint-guard');

// Less useful - too generic
await $ai.spawn('npc');
```

### 2. Create Memories for Recognition

```javascript
// NPCs should remember who they've met
await $ai.remember(npcId,
  'Met [name they gave] - [physical description] - [when/where]',
  'critical',
  ['player', 'introduction']
);
```

### 3. Use Notes for Powers

NPCs have no special powers by default. Use builder notes to grant them:

```javascript
// In builder code, not in NPC code
await $notes.add(npcId,
  'Has authority to issue temporary passes',
  'builder',
  ['powers']
);
```

### 4. Log Interactions

```javascript
// NPCs should log interactions for continuity
await $notes.append(npcId, 'log',
  '[timestamp] [name]: Summary of what happened'
);
```

### 5. Respect Chain of Command

NPCs work for the Continuum, not players. They:
- Follow their role's protocols
- Don't take orders from random players
- Dismiss requests outside their authority
- Are NOT persuadable to bend rules

## See Also

- [Prototypes Reference](./prototypes.md) - Human prototype
- [Body System](./body-system.md) - NPC bodies
- [$ Globals Reference](./globals.md) - $ai
- [Plot System](./plots.md) - NPC involvement in plots
