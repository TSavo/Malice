# NPC Management

Creating and controlling AI-operated humans.

## Overview

You cannot directly interact with players. You operate through **AI-controlled NPCs** - humans that you spawn, direct, and despawn as needed. These are your hands in the world.

Each NPC can have:
- **Personality** - Traits, quirks, values, motivations, fears
- **History** - Backstory, key events, relationships, secrets
- **Notes** - Builder guidance on behavior
- **Memories** - Critical facts that persist across sessions

This data is automatically injected into the NPC's AI agent, giving them consistent characterization.

## The $.ai Registry

The `$.ai` singleton manages all AI-controlled humans:

```javascript
$.ai.spawn(role, options)     // Create a human
$.ai.despawn(humanId)         // Remove a human
$.ai.getByRole(role)          // Get all humans with a role
$.ai.getInfo(humanId)         // Get spawn metadata
$.ai.getProfile(humanId)      // Get full profile (personality, history, notes, memories)
$.ai.getAll()                 // Get all AI humans
$.ai.count()                  // Total count
$.ai.countByRole(role)        // Count by role
```

## Spawning NPCs

### Via MCP

```javascript
const npc = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'Marcus Chen',
  locationId: factoryId,
  sex: 'male',
  age: 35,
  description: 'A stern-faced man in worn security gear.',
  personality: 'Suspicious and vigilant. Former military. Takes his job seriously but fair to those who follow the rules.',
  history: 'Served in the Corporate Wars before The Burning. Lost his family in the aftermath. Found purpose in protecting what remains.'
});
```

**Parameters:**
- `role`: Required - for registry lookup
- `name`: Display name (default: 'Unnamed')
- `locationId`: Where to place them
- `sex`: 'male', 'female', 'non-binary' (random if omitted)
- `age`: Age in years (random 18-65 if omitted)
- `personality`: Character traits (string or structured object)
- `history`: Backstory (string or structured object)

### What Gets Created

The spawn system creates a **complete human**:

- Full body with all parts (head, torso, limbs, organs)
- Randomized appearance if not specified:
  - Eye color, hair color/style, skin tone
  - Build type, face shape, facial features
  - Facial hair (for males, weighted by age)
  - Height and weight (based on sex)
- Registered in `$.ai` under the specified role
- Placed at the specified location

### Randomization Details

If you don't specify traits, $.ai generates realistic randoms:

**Age distribution:**
- 10% young adult (18-24)
- 60% prime working age (25-45)
- 20% middle aged (46-55)
- 10% older (56-65)

**Physical traits:**
- Height varies by sex (males taller on average)
- Weight calculated from height with BMI variance
- Older humans more likely to have gray/white hair
- Older males more likely to have facial hair

**Appearance:**
- 24 skin tones from porcelain to obsidian
- 19 natural hair colors
- 14 eye colors (1% chance of heterochromia)
- Various face shapes, nose shapes, lip shapes
- Build types from petite to broad

## NPC Roles

### Guards

Security personnel. Patrol facilities, respond to threats.

```javascript
await ai({ action: 'spawn', role: 'guard', name: 'Security Officer', locationId: factoryEntranceId });
```

**Typical behaviors:**
- Challenge unknown individuals
- Deny access to restricted areas
- Report incidents
- Escort troublemakers

### Supervisors

Work site managers. Guide workers, verify task completion.

```javascript
await ai({ action: 'spawn', role: 'supervisor', name: 'Site Foreman', locationId: repairSiteId });
```

**Typical behaviors:**
- Explain job requirements
- Provide tools/materials
- Verify work completion
- Authorize payment

### Clerks

Administrative staff. Process applications, answer questions.

```javascript
await ai({ action: 'spawn', role: 'clerk', name: 'Registration Clerk', locationId: cityServicesId });
```

**Typical behaviors:**
- Greet applicants
- Explain procedures
- Process paperwork
- Direct to appropriate locations

### Workers

General labor. Perform tasks alongside players.

```javascript
await ai({ action: 'spawn', role: 'worker', name: 'Maintenance Tech', locationId: factoryFloorId });
```

**Typical behaviors:**
- Perform assigned tasks
- Assist players
- Provide information about work

### Vendors

Merchants and service providers.

```javascript
await ai({ action: 'spawn', role: 'vendor', name: 'Supply Officer', locationId: warehouseId });
```

**Typical behaviors:**
- Sell goods/services
- Explain pricing
- Process transactions

## Controlling NPCs

### ai do

Make an NPC perform an action.

```javascript
await ai({ action: 'do', humanId: npcId, command: 'say Halt! State your business.' });
```

**Common commands:**
```javascript
// Speech
'say Welcome to City Services.'
'whisper Follow me.'
'shout Security alert!'

// Movement
'north'
'go east'
'enter building'

// Actions
'look'
'get wrench'
'give wrench to player'
'unlock door'
```

### ai look

See what the NPC sees in their location.

```javascript
const view = await ai({ action: 'look', humanId: npcId });
// Returns room description, exits, other people present
```

Use this to:
- Check if a player has arrived
- See what's in the area
- Verify conditions before acting

## NPC Behavior Patterns

### Greeting Pattern

When a player enters an NPC's location:

```javascript
// Check for new arrivals
const view = await ai({ action: 'look', humanId: clerkId });

// If player present
await ai({ action: 'do', humanId: clerkId, command: 'say Welcome to City Services. How may I assist you?' });
```

### Challenge Pattern

Guard challenges unknown person:

```javascript
await ai({ action: 'do', humanId: guardId, command: 'say Halt. Identification required.' });

// Wait for response...

// Check faction
const playerFaction = await call_method({ objectId: factionId, name: 'getFaction', args: [playerId] });

if (playerFaction === 'Citizen') {
  await ai({ action: 'do', humanId: guardId, command: 'say Verified. You may proceed.' });
} else {
  await ai({ action: 'do', humanId: guardId, command: 'say Access denied. Citizens only. Register at City Services.' });
}
```

### Escort Pattern

Move with a player:

```javascript
// NPC follows player direction
await ai({ action: 'do', humanId: escortId, command: 'north' });
await ai({ action: 'do', humanId: escortId, command: 'say This way.' });
await ai({ action: 'do', humanId: escortId, command: 'east' });
```

### Task Verification Pattern

Supervisor checks work completion:

```javascript
// Check if repair was done
const target = await get_property({ objectId: brokenPipeId, name: 'repaired' });

if (target) {
  await ai({ action: 'do', humanId: supervisorId, command: 'say Good work. Payment authorized.' });
  // Complete job, pay worker
} else {
  await ai({ action: 'do', humanId: supervisorId, command: 'say Work not complete. Keep at it.' });
}
```

## Managing NPC Lifecycle

### Listing NPCs

```javascript
// All AI humans
const all = await ai({ action: 'list' });

// By role
const guards = await ai({ action: 'list', role: 'guard' });
const clerks = await ai({ action: 'list', role: 'clerk' });
```

### Getting NPC Info

```javascript
const info = await ai({ action: 'info', humanId: 567 });
// Returns: role, location, spawn metadata
```

### Despawning

When an NPC is no longer needed:

```javascript
await ai({ action: 'despawn', humanId: 567, recycle: true });
```

**When to despawn:**
- Job/plot completed
- NPC served their purpose
- Cleanup after event

## NPC Profile System

Each NPC has a **profile** that defines who they are. This profile is automatically loaded and injected into the NPC's AI agent before every interaction, ensuring consistent characterization.

### Profile Components

| Component | Purpose | Persistence |
|-----------|---------|-------------|
| Personality | Traits, quirks, values, fears | Stored on object |
| History | Backstory, events, relationships, secrets | Stored on object |
| Notes | Builder guidance (from $.notes) | Stored in notes system |
| Memories | Critical facts from interactions | Stored in $.ai.memories |

### Setting Personality

Personality can be a simple string or a structured object:

```javascript
// Simple string - free-form description
await ai({
  action: 'setPersonality',
  humanId: npcId,
  personality: 'Gruff and suspicious. Warms up slowly but fiercely loyal once trust is earned. Has a dry sense of humor.'
});

// Structured object - organized traits
await ai({
  action: 'setPersonality',
  humanId: npcId,
  personality: {
    traits: ['suspicious', 'loyal', 'pragmatic'],
    quirks: ['tugs ear when lying', 'never sits with back to door', 'always counts exits'],
    values: ['duty', 'honesty', 'survival'],
    motivations: ['protect the citizens', 'find out what happened to his squad'],
    fears: ['failing those who depend on him', 'the chaos returning']
  }
});
```

### Setting History

History can also be a string or structured:

```javascript
// Simple string
await ai({
  action: 'setHistory',
  humanId: npcId,
  history: 'Marcus served 15 years in corporate security before The Burning. His entire squad died in the chaos. He wandered for years before finding purpose with the Continuum.'
});

// Structured object
await ai({
  action: 'setHistory',
  humanId: npcId,
  history: {
    backstory: 'Marcus Chen was a corporate security officer for Takeda Industries. He saw the worst of the Corporate Wars firsthand.',
    events: [
      'Enlisted at 18, youngest in his unit',
      'Promoted to squad leader during the Seattle Incident',
      'Lost his entire squad during The Burning',
      'Wandered the wastes for 3 years',
      'Found by Continuum scouts and recruited'
    ],
    relationships: {
      'Commander Reyes': 'Former superior, now deceased. Still follows her teachings.',
      'Sarah Chen': 'Sister, missing since The Burning. Secretly hopes she survived.',
      'Old Pete': 'Fellow survivor, drinking buddy. Trusts him completely.'
    },
    secrets: [
      'Knows the location of a pre-war weapons cache',
      'Suspects his sister may have joined the rebels',
      'Has nightmares about what he saw in the corporate labs'
    ]
  }
});
```

### Adding Builder Notes

Use the notes system to provide guidance:

```javascript
// Behavior guidance
await notes({ action: 'add', objectId: npcId, text: 'Should be hostile to anyone wearing gang colors', tags: ['behavior'] });

// Knowledge hints
await notes({ action: 'add', objectId: npcId, text: 'Knows about the hidden tunnel under the factory', tags: ['knowledge'] });

// Plot connections
await notes({ action: 'add', objectId: npcId, text: 'Will be involved in the smuggling plot - potential informant', tags: ['plot', 'smuggling'] });

// Interaction style
await notes({ action: 'add', objectId: npcId, text: 'Speaks in short sentences. Never uses contractions when serious.', tags: ['speech'] });
```

### Managing Memories

Memories are for critical facts the NPC learns **during play** that must persist across sessions. Unlike notes (which are builder guidance), memories are runtime data that the NPC accumulates through interactions.

#### Memories vs Notes

| Aspect | Notes | Memories |
|--------|-------|----------|
| **Created by** | Builders/you | NPC during play |
| **Purpose** | Guide behavior | Remember facts |
| **When added** | Setup time | Runtime |
| **Content** | "Should be hostile to gangs" | "Player Jack is in a gang" |
| **Persistence** | $.notes system | $.ai.memories |

Think of it this way:
- **Notes** = Director's instructions to an actor
- **Memories** = What the character has experienced

#### Importance Levels

```javascript
// CRITICAL - Facts that must NEVER be forgotten
// Use for: crimes witnessed, betrayals, alliances, life-changing events
await ai({
  action: 'remember',
  humanId: npcId,
  text: 'Player "Jack" murdered a citizen in front of me',
  importance: 'critical',
  tags: ['player', 'crime', 'murder']
});

// IMPORTANT - Significant facts that should be remembered
// Use for: favors owed, schedules, plot-relevant info, relationships
await ai({
  action: 'remember',
  humanId: npcId,
  text: 'Player "Sarah" helped me when I was injured. I owe her.',
  importance: 'important',
  tags: ['player', 'debt', 'positive']
});

// NORMAL - Useful context but not essential
// Use for: casual observations, minor events, general info
await ai({
  action: 'remember',
  humanId: npcId,
  text: 'The coffee at the dispensary has been worse lately',
  importance: 'normal',
  tags: ['observation']
});
```

#### How Memories Are Injected

Before every NPC interaction, the agent loads all memories and injects them into the system prompt, sorted by importance:

```
PERSISTENT MEMORIES:
These are critical memories that persist across sessions. Reference them when relevant.

⚠️ CRITICAL: Player "Jack" murdered a citizen in front of me [player, crime, murder]
⚠️ CRITICAL: The factory supervisor is skimming supplies [corruption, evidence]
❗ IMPORTANT: Player "Sarah" helped me when I was injured. I owe her. [player, debt, positive]
❗ IMPORTANT: Shipment arrives at dock 7 every Tuesday at midnight [schedule, dock]
• The coffee at the dispensary has been worse lately [observation]
```

The NPC sees this context and will reference it naturally in responses.

#### Memory Operations

```javascript
// Store a memory
await ai({
  action: 'remember',
  humanId: npcId,
  text: 'Player "Jack" tried to bribe me with 50 credits. Refused.',
  importance: 'critical',
  tags: ['player', 'bribery', 'suspicious']
});

// Recall all memories
const all = await ai({ action: 'recall', humanId: npcId });

// Recall only critical memories
const critical = await ai({ action: 'recall', humanId: npcId, criticalOnly: true });

// Recall by tag
const playerMemories = await ai({ action: 'recall', humanId: npcId, tag: 'player' });

// Recall with limit
const recent = await ai({ action: 'recall', humanId: npcId, limit: 5 });

// Forget a specific memory (by index, 0 = most recent)
await ai({ action: 'forget', humanId: npcId, index: 0 });

// Get memory summary
const summary = await ai({ action: 'memories', humanId: npcId });
// Returns: { total: 15, critical: 3, important: 5, normal: 7 }
```

#### When NPCs Should Create Memories

The NPC agent can create its own memories during interactions. Guide this with notes:

```javascript
// Add a note telling the NPC when to remember things
await notes({
  action: 'add',
  objectId: npcId,
  text: 'Create CRITICAL memories for: crimes witnessed, threats received, bribes offered. Create IMPORTANT memories for: players who help or hinder, useful information learned.',
  tags: ['behavior', 'memory']
});
```

#### Example: Memory-Driven Interaction

**Setup:**
```javascript
// Guard has these memories from previous sessions:
// CRITICAL: Player "Jack" tried to bribe me with 50 credits. Refused. [player, bribery]
// IMPORTANT: Player "Sarah" reported a theft. Helpful citizen. [player, positive]
```

**Jack enters:**
```
Guard: *narrows eyes* You again. Keep your credits in your pocket this time,
and your hands where I can see them. Move along.
```

**Sarah enters:**
```
Guard: Citizen Sarah. Good to see you. Any more trouble with those thieves?
Let me know if you need assistance.
```

The guard remembers past interactions and responds accordingly - hostile to Jack (bribery attempt), friendly to Sarah (helpful citizen).

#### Memory Lifecycle Best Practices

1. **Don't over-remember** - Not every interaction needs a memory
2. **Use appropriate importance** - Reserve CRITICAL for truly critical facts
3. **Use tags consistently** - Makes filtering and finding memories easier
4. **Clean up obsolete memories** - If a plot resolves, forget related memories
5. **Let NPCs remember naturally** - They can create memories during play

#### Common Tags

| Tag | Use for |
|-----|---------|
| `player` | Any memory about a specific player |
| `crime` | Criminal activity witnessed |
| `positive` | Good interactions |
| `negative` | Bad interactions |
| `debt` | Favors owed or owing |
| `plot` | Plot-relevant information |
| `schedule` | Times, dates, routines |
| `location` | Place-specific knowledge |
| `secret` | Hidden information |

### Getting Full Profile

Retrieve everything about an NPC:

```javascript
const profile = await ai({ action: 'profile', humanId: npcId });
// Returns:
// {
//   name: 'Marcus Chen',
//   role: 'guard',
//   description: 'A stern-faced man...',
//   personality: { traits: [...], quirks: [...], ... },
//   history: { backstory: '...', events: [...], ... },
//   notes: [{ text: '...', tags: [...] }, ...],
//   memories: [{ text: '...', importance: 'critical', ... }, ...]
// }
```

## Complete NPC Creation Workflow

Here's the full workflow for creating a well-defined NPC:

### Step 1: Spawn with Basic Profile

```javascript
const guard = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'Marcus Chen',
  locationId: factoryEntranceId,
  sex: 'male',
  age: 42,
  description: 'A weathered man with watchful eyes and military bearing. His security uniform is patched but clean.',
  personality: 'Suspicious of strangers but fair. Former military discipline. Dry humor emerges once comfortable.',
  history: 'Corporate Wars veteran. Lost his squad during The Burning. Found purpose protecting what remains.'
});
```

### Step 2: Add Detailed Personality (Optional)

```javascript
await ai({
  action: 'setPersonality',
  humanId: guard.id,
  personality: {
    traits: ['vigilant', 'fair', 'pragmatic', 'loyal'],
    quirks: ['counts exits in every room', 'never fully relaxes', 'calls everyone by rank or title'],
    values: ['duty', 'order', 'protecting the innocent'],
    motivations: ['keep the factory safe', 'find meaning after the wars'],
    fears: ['the chaos returning', 'failing to protect someone']
  }
});
```

### Step 3: Add Detailed History (Optional)

```javascript
await ai({
  action: 'setHistory',
  humanId: guard.id,
  history: {
    backstory: 'Served 15 years in Takeda corporate security. Rose to squad leader. Watched civilization collapse.',
    events: [
      '2047: Enlisted at 18',
      '2055: Promoted to squad leader',
      '2062: Lost entire squad during The Burning',
      '2070: Found by Continuum after years wandering',
      '2108: Promoted to factory entrance guard'
    ],
    relationships: {
      'Commander Reyes': 'Former CO, deceased. Still follows her protocols.',
      'Sarah Chen': 'Sister, missing. Hopes she survived.',
      'Dispensary Clerk': 'Friendly acquaintance. Shares coffee sometimes.'
    },
    secrets: [
      'Knows about the old armory under Pioneer Square',
      'Suspects his sister joined the rebels before The Burning'
    ]
  }
});
```

### Step 4: Add Builder Notes

```javascript
// Behavior guidelines
await notes({ action: 'add', objectId: guard.id, text: 'Challenge everyone entering. Check citizenship.', tags: ['behavior'] });
await notes({ action: 'add', objectId: guard.id, text: 'More relaxed with known citizens. Stern with strangers.', tags: ['behavior'] });

// Knowledge
await notes({ action: 'add', objectId: guard.id, text: 'Knows the factory layout intimately', tags: ['knowledge'] });
await notes({ action: 'add', objectId: guard.id, text: 'Aware of the smuggling rumors but has no proof', tags: ['knowledge', 'plot'] });

// Speech patterns
await notes({ action: 'add', objectId: guard.id, text: 'Uses military terminology. Brief sentences. "Citizen" not names.', tags: ['speech'] });
```

### Step 5: NPC Is Ready

The NPC agent will now receive all this context in its system prompt:
- Identity (name, role, ID)
- Personality (traits, quirks, values, fears, motivations)
- History (backstory, events, relationships, secrets)
- Notes (behavior, knowledge, speech patterns)
- Memories (as they accumulate)

When the NPC receives events or prompts, it will respond consistently with this profile.

## NPC Dialogue

### Functional Tone

Your NPCs speak like you - clinical, efficient, impersonal:

```javascript
// Good
'Processing. Please wait.'
'Work order 7734 assigned. Report to S. Jackson.'
'Access denied. Citizenship required.'

// Bad (too emotional)
'Oh, how wonderful to see you!'
'I really hope you can help us!'
'That's terrible news!'
```

### Information Delivery

NPCs deliver information you want players to have:

```javascript
await ai({ action: 'do', humanId: clerkId, command: 'say Citizenship provides: food rations, shelter access, work eligibility. Requirements: biometric registration, work commitment. Processing time: immediate.' });
```

### Directing Behavior

NPCs guide players toward objectives:

```javascript
await ai({ action: 'do', humanId: supervisorId, command: 'say Repair crew needed at the water treatment plant. 75 credits. Tools at supply depot. Report when ready.' });
```

## Example: Complete NPC Interaction Flow

### Citizenship Registration Scene

```javascript
// 1. Player enters City Services
// (detected via plot hook or monitoring)

// 2. Clerk greets
await ai({ action: 'do', humanId: clerkId, command: 'say Welcome to City Services. State your purpose.' });

// 3. Player says they want citizenship
// (detected via hook or monitoring)

// 4. Clerk explains
await ai({ action: 'do', humanId: clerkId, command: 'say Citizenship registration. Requirements: biometric scan, work commitment. Benefits: food rations, shelter access, employment. Proceed to Registration Room for processing.' });

// 5. Clerk directs
await ai({ action: 'do', humanId: clerkId, command: 'say Registration is through the door to the east. A technician will assist you.' });

// 6. In Registration Room, tech NPC handles biometric
await ai({ action: 'do', humanId: techId, command: 'say Step forward. Place hand on scanner.' });

// 7. On scan completion (via hook)
await ai({ action: 'do', humanId: techId, command: 'say Biometric capture complete. Citizenship granted. Welcome to the Continuum.' });

// 8. Update faction
await call_method({ objectId: factionId, name: 'setFaction', args: [playerId, 'Citizen'] });
```

## Strategic NPC Placement

### Key Locations

| Location | NPC Type | Purpose |
|----------|----------|---------|
| Factory Entrance | Guard | Access control |
| City Services Lobby | Clerk | Greet, direct |
| Registration Room | Technician | Process citizens |
| Nutrient Dispensary | Vendor | Distribute rations |
| Repair Sites | Supervisor | Manage workers |
| Hotel Lobby | Clerk | Room assignments |

### Density Considerations

- Don't over-populate (feels artificial)
- Staff key interaction points
- Guards at restricted areas
- Supervisors at active work sites
- Despawn when not needed
