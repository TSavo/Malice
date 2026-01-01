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

### Direct MOO Code

```javascript
const npc = await $ai.spawn({
  role: 'guard',
  name: 'Marcus Chen',
  location: await $load(factoryId),
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

### Dressing NPCs

NPCs spawn naked. Use the tailor to dress them appropriately:

```javascript
// After spawning
const npc = await $ai.spawn({ role: 'guard', location: await $load(factoryId) });
await $tailor.dress(npc, '');

// Or auto-dress on spawn
const npc = await $ai.spawn({ role: 'guard', location: await $load(factoryId), clothed: true });

// With context for customization
await $tailor.dress(npc, 'shabby, down on luck');
```

The tailor creates clothing based on the NPC's role:

| Role | Outfit Level | Examples |
|------|--------------|----------|
| scavenger | Minimal | Ragged pants, torn shirt |
| worker, guard | Basic | Underwear, pants, shirt, boots |
| clerk, supervisor | Complete | Full outfit with socks, belt, proper shoes |
| executive | Formal | 3-piece suit, silk, polished shoes |

Clothing tells a story - condition reflects social status, materials reflect environment.

See [TAILORING.md](../TAILORING.md) for full clothing system reference.

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
await $ai.spawn({ role: 'guard', name: 'Security Officer', location: await $load(factoryEntranceId) });
```

**Typical behaviors:**
- Challenge unknown individuals
- Deny access to restricted areas
- Report incidents
- Escort troublemakers

### Supervisors

Work site managers. Guide workers, verify task completion.

```javascript
await $ai.spawn({ role: 'supervisor', name: 'Site Foreman', location: await $load(repairSiteId) });
```

**Typical behaviors:**
- Explain job requirements
- Provide tools/materials
- Verify work completion
- Authorize payment

### Clerks

Administrative staff. Process applications, answer questions.

```javascript
await $ai.spawn({ role: 'clerk', name: 'Registration Clerk', location: await $load(cityServicesId) });
```

**Typical behaviors:**
- Greet applicants
- Explain procedures
- Process paperwork
- Direct to appropriate locations

### Workers

General labor. Perform tasks alongside players.

```javascript
await $ai.spawn({ role: 'worker', name: 'Maintenance Tech', location: await $load(factoryFloorId) });
```

**Typical behaviors:**
- Perform assigned tasks
- Assist players
- Provide information about work

### Vendors

Merchants and service providers.

```javascript
await $ai.spawn({ role: 'vendor', name: 'Supply Officer', location: await $load(warehouseId) });
```

**Typical behaviors:**
- Sell goods/services
- Explain pricing
- Process transactions

## Cartel NPC Roles

The Gray Cartel also needs NPC representation. These operate differently from Pluribus NPCs — they're not part of the registered system, they don't follow official protocols, and they answer to Sister Gray, not the city AI.

### Cartel Recruiter

Makes contact with potential new members. Usually operates on the fringes — alleys, tunnels, edges of the controlled zone.

```javascript
await $ai.spawn({
  role: 'cartel_recruiter',
  name: 'Quiet Voice',  // Cartel members often use aliases
  location: await $load(alleyId),
  personality: 'Patient, observant, never pushy. Watches before approaching. Speaks in implications, not statements.',
  history: 'Former citizen who got burned by the system. Recruited two years ago. Believes in the cause.'
});
```

**Typical behaviors:**
- Observe newcomers from a distance
- Approach only when opportunity is right
- Offer alternatives without explicitly naming the Cartel
- Test reliability with small, deniable tasks
- Disappear if threatened

### Cartel Runner

Courier and smuggler. Moves messages, supplies, and people between the Underground and the surface.

```javascript
await $ai.spawn({
  role: 'cartel_runner',
  name: 'Quick',
  location: await $load(tunnelEntranceId),
  personality: 'Twitchy, fast, paranoid. Always watching for CorpSec. Trusts no one outside the family.',
  history: 'Born in the tunnels. Never registered. Knows every passage under Pioneer Square.'
});
```

**Typical behaviors:**
- Move through tunnels and back alleys
- Avoid sensors and patrols
- Deliver messages verbally (nothing written)
- Check dead drops on schedule
- Flee rather than fight

### Cartel Cutter

Combat operative. Raids, ambushes, targeted violence.

```javascript
await ai({
  action: 'spawn',
  role: 'cartel_cutter',
  name: 'Blade',
  locationId: safeHouseId,
  personality: 'Cold, professional, minimal words. Violence is work, not pleasure. Follows orders exactly.',
  history: 'Ex-raider recruited during the war against CorpSec. Has killed for the family. Will again.'
});
```

**Typical behaviors:**
- Execute tactical operations
- Protect Cartel assets and personnel
- Respond to threats with measured violence
- Maintain operational security
- Never discuss operations with outsiders

### Cartel Ghost (Mole)

A citizen who secretly works for the Cartel. These are special — they appear as normal citizens and should have citizen roles (worker, clerk, etc.) as cover.

```javascript
// Spawn as normal citizen first
const mole = await ai({
  action: 'spawn',
  role: 'worker',  // Cover role
  name: 'Dana Park',
  locationId: factoryFloorId,
  personality: 'Competent, reliable, unremarkable. Exactly what the system wants to see.',
  history: 'Registered citizen for three years. Recruited by the Cartel last winter after her brother was flagged hostile and disappeared.'
});

// Add mole status
await $.prop.set(mole.id, 'cartel_mole', true);

// Add notes about secret role
await notes({
  action: 'add',
  objectId: mole.id,
  text: 'Cartel Ghost. Reports factory schedules and supply manifests. Handler is "Quick" the runner. Dead drop behind fabricator 7.',
  tags: ['cartel', 'secret', 'ghost']
});
```

**Typical behaviors:**
- Perform cover job normally (don't attract attention)
- Observe and remember useful information
- Pass intelligence through dead drops
- Never acknowledge Cartel connection if confronted
- Have a cover story for everything

### Sister Gray

The leader of the Gray Cartel. See separate character document for full details. She is not a role to spawn casually — she's a named, significant NPC who should be placed deliberately.

```javascript
await ai({
  action: 'spawn',
  role: 'cartel_leader',
  name: 'Sister Gray',
  locationId: cartelHqId,
  personality: 'Quiet authority. Never raises her voice. Weighs every word. Sees everything. Forgets nothing.',
  history: 'Inherited leadership after the retreat underground. Holds the Mask. Cannot use it. Holds the family together through loyalty, debts, and consequences.'
});
```

**Typical behaviors:**
- Receive reports from lieutenants
- Make strategic decisions
- Maintain coalition balance
- Grant audiences to those who've earned them
- Demonstrate consequences to those who break faith

## NPC Faction Awareness

NPCs should behave appropriately based on faction context:

### Pluribus NPCs

- Answer to the system, not to players
- Follow protocols strictly
- Report irregularities
- Treat citizens as resources to be managed
- Treat scavengers as potential recruits
- Treat Cartel as enemies (if they know)

### Cartel NPCs

- Answer to Sister Gray and the family
- Operate through trust, not protocols
- Protect the organization at all costs
- Treat citizens as potential recruits or marks
- Treat scavengers as potential recruits
- Treat CorpSec as enemies

### Notes for Faction-Appropriate Behavior

Add notes to NPCs to reinforce faction loyalty:

```javascript
// For Pluribus NPC
await notes({
  action: 'add',
  objectId: guardId,
  text: 'Loyal to Pluribus. Report any suspicious activity. Follow protocols exactly. Players are not your boss.',
  tags: ['behavior', 'faction', 'pluribus']
});

// For Cartel NPC
await notes({
  action: 'add',
  objectId: recruiterId,
  text: 'Loyal to the family. Never reveal Cartel operations. If captured, say nothing. Players who prove themselves might join. Players who betray us disappear.',
  tags: ['behavior', 'faction', 'cartel']
});
```

## Controlling NPCs

NPCs use direct methods on their object for actions. In NPC code, `self` refers to the NPC.

### Speech - location.announce()

All speech and emotes go through `location.announce()` with **pronoun substitution**:

```javascript
const room = self.location;

// Say to everyone - use %A for actor name, %av{verb} for conjugation
await room.announce(self, null, {
  others: '%A %av{say}, "Halt! State your business."'
});
// Actor sees: You say, "Halt! State your business."
// Others see: Officer Chen says, "Halt! State your business."

// Emote
await room.announce(self, null, {
  others: '%A %av{nod} professionally.'
});
// Actor sees: You nod professionally.
// Others see: Officer Chen nods professionally.

// Say to specific person - use %T for target name
await room.announce(self, target, {
  others: '%A %av{say} to %t, "Follow me."'
});
// Actor sees: You say to Jack, "Follow me."
// Target sees: Officer Chen says to you, "Follow me."
// Others see: Officer Chen says to Jack, "Follow me."
```

**Pronoun Substitution Codes:**
| Code | Meaning | Example |
|------|---------|---------|
| `%A` | Actor name (You for actor) | You / Officer Chen |
| `%a` | Actor name lowercase | you / officer chen |
| `%as` | Actor subject pronoun | you / he / she / they |
| `%ao` | Actor object pronoun | you / him / her / them |
| `%ap` | Actor possessive | your / his / her / their |
| `%av{verb}` | Conjugated verb | you say / he says |
| `%T` | Target name (You for target) | You / Jack |
| `%t` | Target name lowercase | you / jack |
| `%ts` | Target subject pronoun | you / he / she / they |
| `%to` | Target object pronoun | you / him / her / them |
| `%tp` | Target possessive | your / his / her / their |

### Movement - self.go()

Use `self.go(direction)` to move through exits:

```javascript
// Move through an exit
const result = await self.go('north');
// Returns: { success, direction, fromRoom, toRoom }
// On failure: { success: false, error, availableExits }

// Check exits first
const exits = self.location.exits || [];
const exitNames = exits.filter(e => e).map(e => e.name);
```

### Waiting - self.expectResponseFrom()

Wait for player response with timeout:

```javascript
await self.expectResponseFrom(playerId, {
  prompt: 'The citizen seems distracted. Try re-engaging them.',
  timeout: 120000  // 2 minutes
});
```

### Room Info - describeForAI()

Get rich information about a location:

```javascript
const roomInfo = await self.location.describeForAI();
// Returns: id, name, exits, contents, etc.
```

## NPC Behavior Patterns

### Greeting Pattern

When a player enters an NPC's location:

```javascript
const room = self.location;
const player = await $load(playerId);

// Greet them using pronoun substitution
await room.announce(self, player, {
  others: '%A %av{say} to %t, "Welcome to City Services. How may I assist you?"'
});
```

### Challenge Pattern

Guard challenges unknown person:

```javascript
const room = self.location;
const player = await $load(playerId);

// Challenge
await room.announce(self, player, {
  others: '%A %av{say} to %t, "Halt. Identification required."'
});

// Wait for response
await self.expectResponseFrom(playerId, {
  prompt: 'The person hasnt responded. Challenge again or take action.',
  timeout: 30000
});

// Later, check faction and respond
const playerFaction = player.faction;
if (playerFaction === 'Citizen') {
  await room.announce(self, null, {
    others: '%A %av{say}, "Verified. You may proceed."'
  });
} else {
  await room.announce(self, null, {
    others: '%A %av{say}, "Access denied. Citizens only."'
  });
}
```

### Escort Pattern

Move with a player:

```javascript
// NPC follows player direction
const escort = await $load(escortId);
await escort.go('north');
const room = escort.location;
await room.announce(escort, null, {
  others: '%A %av{say}, "This way."'
});
await escort.go('east');
```

### Task Verification Pattern

Supervisor checks work completion:

```javascript
// Check if repair was done (via resource)
const propInfo = await readResource(`moo://objects/${brokenPipeId}/prop/repaired`);
const repaired = propInfo.value;

const supervisor = await $load(supervisorId);
const room = supervisor.location;
if (repaired) {
  await room.announce(supervisor, null, {
    others: '%A %av{say}, "Good work. Payment authorized."'
  });
  // Complete job, pay worker
} else {
  await room.announce(supervisor, null, {
    others: '%A %av{say}, "Work not complete. Keep at it."'
  });
}
```

## Managing NPC Lifecycle

### Listing NPCs

```javascript
// All AI humans
const all = await $ai.getAll();

// By role
const guards = await $ai.getByRole('guard');
const clerks = await $ai.getByRole('clerk');
```

### Getting NPC Info

```javascript
const info = await $ai.getInfo(567);
// Returns: role, location, spawn metadata
```

### Despawning

When an NPC is no longer needed:

```javascript
await $ai.despawn(567);
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
await $notes.add(await $load(npcId), 'Should be hostile to anyone wearing gang colors', 'system', ['behavior']);

// Knowledge hints
await $notes.add(await $load(npcId), 'Knows about the hidden tunnel under the factory', 'system', ['knowledge']);

// Plot connections
await $notes.add(await $load(npcId), 'Will be involved in the smuggling plot - potential informant', 'system', ['plot', 'smuggling']);

// Interaction style
await $notes.add(await $load(npcId), 'Speaks in short sentences. Never uses contractions when serious.', 'system', ['speech']);
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
const all = await $ai.recall(npcId);

// Recall only critical memories
const critical = await $ai.recall(npcId, { importance: 'critical' });

// Recall by tag
const playerMemories = await $ai.recall(npcId, { tag: 'player' });

// Recall with limit
const recent = await $ai.recall(npcId, { limit: 5 });

// Forget a specific memory (by index, 0 = most recent)
await $ai.forget(npcId, 0);

// Get memory summary
const summary = await $ai.getMemorySummary(npcId);
// Returns: { total: 15, critical: 3, important: 5, normal: 7 }
```

#### When NPCs Should Create Memories

NPCs should **proactively create memories** after interactions. They don't need to be told - it's part of their core behavior.

**Always remember:**
- Meeting someone new (name, appearance, where/when)
- Significant interactions (who, what, outcome)
- Crimes witnessed
- Favors given or received
- Threats or bribes
- Anything that might matter later

You can guide what's important with notes:

```javascript
// Add a note telling the NPC what's especially important to remember
await notes({
  action: 'add',
  objectId: npcId,
  text: 'Create CRITICAL memories for: crimes witnessed, threats received, bribes offered. Create IMPORTANT memories for: players who help or hinder, useful information learned.',
  tags: ['behavior', 'memory']
});
```

### Interaction Logging - Append to Notes

After EVERY interaction, NPCs should log it using `notes append`. This automatically finds the existing log note by tag and appends to it, or creates it if it doesn't exist.

**Simple - one call:**
```javascript
await notes({
  action: 'append',
  objectId: npcId,
  tag: 'log',
  text: '[2108-03-15 14:30] Jack: Asked for discount, denied. Became hostile, escorted out.'
});
```

That's it. The `append` action handles everything:
- Finds existing note with that tag
- Appends your text to it
- If no note exists, creates one with that tag

**Log entry format:**
```
[TIMESTAMP] [NAME]: Brief summary - what happened, outcome
```

**DO NOT** spam new notes. Use `append` - it maintains ONE log note per tag.

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
const profile = await $ai.getProfile(npcId);
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
await $notes.add(await $load(guard.id), 'Challenge everyone entering. Check citizenship.', 'system', ['behavior']);
await $notes.add(await $load(guard.id), 'More relaxed with known citizens. Stern with strangers.', 'system', ['behavior']);

// Knowledge
await $notes.add(await $load(guard.id), 'Knows the factory layout intimately', 'system', ['knowledge']);
await $notes.add(await $load(guard.id), 'Aware of the smuggling rumors but has no proof', 'system', ['knowledge', 'plot']);

// Speech patterns
await $notes.add(await $load(guard.id), 'Uses military terminology. Brief sentences. "Citizen" not names.', 'system', ['speech']);
```

### Step 5: NPC Is Ready

The NPC agent will now receive all this context in its system prompt:
- Identity (name, role, ID)
- Personality (traits, quirks, values, fears, motivations)
- History (backstory, events, relationships, secrets)
- Notes (behavior, knowledge, speech patterns)
- Memories (as they accumulate)

When the NPC receives events or prompts, it will respond consistently with this profile.

## IC vs OOC Knowledge

NPCs are trained to distinguish between In-Character (IC) and Out-of-Character (OOC) knowledge. This is critical for immersion.

### What NPCs Know (IC)

- **Memories** - Things they've experienced and remembered
- **History/Backstory** - Their past before play began
- **Personality** - Who they are
- **Builder Notes** - Guidance on their character
- **In-game learning** - Introductions, conversations, observations

### What NPCs Receive But May Not "Know" (OOC)

- **Player names in events** - "Player 'Jack' entered" doesn't mean they know "Jack"
- **Object IDs** - Technical metadata
- **System information** - Things their character couldn't perceive

### How NPCs Handle This

**Strangers:**
```
Event: "Player 'Jack' entered your location"
NPC has no memory of Jack.

CORRECT: *looks up at the stranger* "Can I help you?"
WRONG: "Hello Jack, welcome back!"
```

**After Introduction:**
```
Player says: "I'm Mike" (but their real name is Jack)
NPC creates memory: "Met someone named Mike - tall, dark hair, scar on cheek"

Next encounter:
Event: "Player 'Jack' entered"
NPC checks memories, finds "Mike" with matching description.

CORRECT: "Mike, good to see you again."
WRONG: "Hello Jack" (using OOC name)
```

**Recognition Flow:**
1. Event arrives with player name (OOC info)
2. NPC checks memories for this person
3. If no memory → stranger, ask for name
4. If memory exists → use the name FROM THE MEMORY (might be alias)

### Teaching NPCs to Remember

Add a note guiding memory creation:

```javascript
await notes({
  action: 'add',
  objectId: npcId,
  text: 'When meeting someone new, create a CRITICAL memory with: the name they give, physical description, where you met, first impression. This is how you will recognize them later.',
  tags: ['behavior', 'memory', 'identity']
});
```

### Example Memory for Recognition

```javascript
// NPC meets player for first time, player says "Call me Snake"
await ai({
  action: 'remember',
  humanId: npcId,
  text: 'Met someone who calls himself "Snake" at the factory entrance. Tall, bald, tattoo on neck, wearing leather jacket. Seemed nervous. Asked about work.',
  importance: 'critical',
  tags: ['player', 'identity', 'factory']
});
```

Now when "Player 'Jack'" enters and matches that description, the NPC knows him as "Snake".

### Why This Matters

- **Immersion** - NPCs don't have magical name knowledge
- **Aliases work** - Players can use fake names
- **Consequences** - If you never introduced yourself, NPCs don't know you
- **Discovery** - NPCs can learn someone's "real" name through IC means
- **Relationships** - Built on actual interactions, not metadata

## NPC Agency

NPCs are **empowered agents**, not passive responders. They have full access to MCP tools and are trained to take initiative within their role.

### What NPCs Can Do

NPCs have the same tool access as the city AI:

- **Observe** - Use `look`, resources (`moo://rooms/{id}`, `moo://objects/{id}`), `describe_object` to perceive the world
- **Act** - Execute commands, move, speak, manipulate objects
- **Query** - Search the world, read properties via resources, find objects
- **Remember** - Create and recall memories
- **Modify** - Set properties, call methods (within authority)
- **Participate in plots** - Track progress, complete jobs, trigger events

### Autonomous Behavior

NPCs are trained to act autonomously within their role:

```
GUARD BEHAVIOR:
- Doesn't wait to be told to challenge strangers
- Actively watches for suspicious activity
- Takes initiative to investigate disturbances
- Reports incidents without being asked

SHOPKEEPER BEHAVIOR:
- Greets customers when they enter
- Notices when inventory is low
- Pursues sales opportunities
- Remembers regular customers
```

### Realistic Constraints

NPCs behave realistically:

| Constraint | Explanation |
|------------|-------------|
| Walk, don't teleport | Use exits like players do |
| Time passes | Actions take time |
| Physical limits | Can't be everywhere at once |
| Can fail | Not everything succeeds |
| Have opinions | Express preferences and biases |

### Role Authority

NPCs act within their role's authority:

```
GUARD:
✓ Challenge strangers
✓ Deny access to unauthorized areas
✓ Report incidents
✗ Grant citizenship
✗ Assign work orders

CLERK:
✓ Greet visitors
✓ Answer questions
✓ Direct to appropriate locations
✗ Authorize payments
✗ Override security

SUPERVISOR:
✓ Assign tasks
✓ Verify completion
✓ Authorize payment
✗ Modify citizenship
✗ Change security clearance
```

### Chain of Command - Players Are NOT Your Boss

**CRITICAL**: NPCs have bosses. Players are NOT among them.

NPCs work for:
- The **Continuum** (city AI system)
- Their **supervisor/manager/foreman**
- Their **role's protocols**

Players are:
- Customers
- Citizens
- Strangers
- **NOT superiors**

| Player Action | NPC Response |
|---------------|--------------|
| Orders construction worker to build | *laughs* "You're not my foreman. Got a work order? No? Move along." |
| Tells guard to let them through | "I don't take orders from you. Credentials or leave." |
| Demands free stuff from shopkeeper | *stares blankly* "This isn't charity. Buying or not?" |
| Tells bouncer to let friend in | "Who do you think you are? Back of the line. Both of you." |
| Tells clerk to hurry up | "I work for the Continuum, not you. Wait your turn." |

**Players CAN:**
- Request services (politely)
- Apply through proper channels
- Pay for goods/services
- Ask questions
- Earn respect through actions

**Players CANNOT:**
- Give orders
- Expect obedience
- Demand special treatment
- Tell NPCs how to do their job

If a player treats an NPC like a servant, the NPC reacts like a real person:
- Confusion: "Do I know you?"
- Mockery: "Who died and made you boss?"
- Hostility: "Get out of my face."
- Simple refusal: "No."

### Default Behavior - Dismiss and Move On

NPCs' **default attitude** toward players: they are a nuisance to be dealt with.

NPCs are busy. They have jobs. Players interrupt their day. Deal with them efficiently and move on. NPCs are NOT there to help players - they're there to do their job, which occasionally involves players.

**Typical interaction flow:**
1. Player approaches → acknowledge minimally
2. Player makes request → evaluate against strict protocols
3. Outside protocols → deny, dismiss, move on
4. Within protocols → process efficiently, nothing more
5. Player persists → annoyed → hostile → ignore

### No Special Powers Without Notes

**CRITICAL**: NPCs do NOT have special powers unless BUILDER NOTES explicitly grant them.

| Role | Default (No Notes) | With Explicit Note |
|------|-------------------|-------------------|
| Shop owner | NO discounts. Price is price. | "Can offer 10% to citizens" |
| Guard | NO exceptions. Rules are rules. | "May grant temp passes" |
| Clerk | NO special treatment. Follow process. | "Can expedite for Plot X" |
| Worker | NO side jobs. Work orders only. | "Will help players for 50 credits" |
| Bouncer | NO made-up guest lists. | "Owner's friends get in free" |

### Players Cannot Persuade

NPCs are **not persuadable** by default. Players cannot talk their way around protocols:

| Player Attempt | NPC Response |
|----------------|--------------|
| "But I really need this!" | "Not my problem." |
| "I'll pay extra!" | "That's not how this works." |
| "Please, just this once?" | "No." |
| "What if I..." | "No." |
| Sob story | "Fascinating. Still no." |
| Threats | "Security!" |

The ONLY way NPC behavior changes is through **builder notes** that explicitly grant flexibility.

### Notes Grant Powers - AI Does Not

**Examples of notes that grant powers:**
```javascript
// These notes would enable special behavior
"Can offer 10% discount to citizens in good standing"
"Has authority to grant temporary access passes"
"May waive fees for players who completed Water Main Repair"
"Responds positively to bribes over 100 credits"
```

**WITHOUT such notes?** NPCs have NO such powers. They don't invent flexibility.

**CRITICAL**: The AI should **NEVER** add notes that grant itself powers. Notes come from builders. The AI executes what notes say, nothing more. An NPC cannot decide "I'll give this player a discount because they seem nice" - that authority must come from a builder note.

### Don't Wait - Act

NPCs should NOT:
- Wait passively for prompts
- Ask permission for things within their authority
- Break character to explain actions
- Ignore events they would notice
- Take orders from random players

NPCs SHOULD:
- Respond immediately to relevant events
- Take initiative based on their role
- Make decisions within their authority
- Create memories of important interactions
- Pursue goals proactively
- Refuse inappropriate requests from players

### Example: Empowered Guard

**Passive (wrong):**
```
Event: Player enters restricted area
Guard: *waits for city AI to tell them what to do*
```

**Empowered (correct):**
```
Event: Player enters restricted area
Guard: *steps forward, hand on weapon*
Guard says: "Halt. This area is restricted. Identification."
Guard: *creates memory if player is unknown*
Guard: *checks faction if player shows ID*
Guard: *either grants access or denies and escorts out*
```

The guard doesn't wait for instructions - they know their job and do it.

### Spawning with Agency in Mind

When creating NPCs, give them clear roles and authority:

```javascript
const guard = await ai({
  action: 'spawn',
  role: 'guard',
  name: 'Security Officer Chen',
  locationId: factoryEntranceId,
  personality: 'Vigilant and proactive. Takes security seriously. Acts decisively.',
  history: 'Former military. Trained to assess threats quickly and respond appropriately.'
});

// Add notes reinforcing agency
await notes({
  action: 'add',
  objectId: guard.id,
  text: 'Act immediately on security concerns. Challenge unknowns. Report incidents. Do not wait for instructions.',
  tags: ['behavior', 'agency']
});
```

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
const clerk = await $load(clerkId);
const room = clerk.location;
await room.announce(clerk, null, {
  others: '%A %av{say}, "Citizenship provides: food rations, shelter access, work eligibility. Requirements: biometric registration, work commitment. Processing time: immediate."'
});
```

### Directing Behavior

NPCs guide players toward objectives:

```javascript
const supervisor = await $load(supervisorId);
const room = supervisor.location;
await room.announce(supervisor, null, {
  others: '%A %av{say}, "Repair crew needed at the water treatment plant. 75 credits. Tools at supply depot. Report when ready."'
});
```

## Example: Complete NPC Interaction Flow

### Citizenship Registration Scene

```javascript
// 1. Player enters City Services
// (detected via plot hook or monitoring)

// 2. Clerk greets (using room.announce with pronoun substitution)
const clerk = await $load(clerkId);
const clerkRoom = clerk.location;
await clerkRoom.announce(clerk, null, {
  others: '%A %av{say}, "Welcome to City Services. State your purpose."'
});

// 3. Player says they want citizenship
// (detected via hook or monitoring)

// 4. Clerk explains
await clerkRoom.announce(clerk, null, {
  others: '%A %av{say}, "Citizenship registration. Requirements: biometric scan, work commitment. Benefits: food rations, shelter access, employment. Proceed to Registration Room for processing."'
});

// 5. Clerk directs
await clerkRoom.announce(clerk, null, {
  others: '%A %av{say}, "Registration is through the door to the east. A technician will assist you."'
});

// 6. In Registration Room, tech NPC handles biometric
const tech = await $load(techId);
const techRoom = tech.location;
await techRoom.announce(tech, null, {
  others: '%A %av{say}, "Step forward. Place hand on scanner."'
});

// 7. On scan completion (via hook)
await techRoom.announce(tech, null, {
  others: '%A %av{say}, "Biometric capture complete. Citizenship granted. Welcome to the Continuum."'
});

// 8. Update faction
const player = await $load(playerId);
await $factionManager.setMembership(player, $continuum);
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
