# Building Great NPCs

A practical guide to creating compelling AI-controlled characters in Malice.

## Quick Start

```javascript
// Spawn a guard NPC at your location
const guard = await $ai.spawn('guard', {
  name: 'Marcus Webb',
  sex: 'male',
  age: 35,
  location: player.location,
  clothed: true
});

// Set personality
await $ai.setPersonality(guard.id, {
  traits: ['suspicious', 'loyal', 'gruff'],
  quirks: ['tugs at beard when thinking'],
  values: ['duty', 'honor'],
  motivations: ['protect the building'],
  fears: ['failing those who depend on him']
});

// Set history
await $ai.setHistory(guard.id, {
  backstory: 'Former soldier who retired after the Border Wars.',
  events: ['Enlisted at age 18', 'Rose to sergeant', 'Lost squad in an ambush'],
  relationships: { 'Building Manager': 'Respects her leadership' },
  secrets: ['Still has nightmares about the ambush']
});
```

## The Spawn Process

### @spawn Command (In-Game)

From the game as an admin:

```
> @spawn guard Marcus

Creating AI-controlled human with role: guard
Name: Marcus
Sex: [1] Male [2] Female [3] Non-binary: 1
Age (18-100): 35
Appearance: [1] Quick - random [2] Detailed: 1

Created: Marcus (#3061) as guard
Placed in: Smith Tower Lobby
```

### Programmatic Spawn

```javascript
const npc = await $ai.spawn('shopkeeper', {
  name: 'Wong Chen',
  description: 'A sharp-eyed merchant in traditional clothing.',
  sex: 'male',
  age: 55,
  height: 1.65,
  weight: 70,
  appearance: {
    eyeColor: 'brown',
    hairColor: 'gray',
    hairStyle: 'tied back',
    skinTone: 'tan',
    buildType: 'wiry'
  },
  location: shopRoomId,
  spawnedBy: player.id
});
```

## Crafting Great System Prompts

Every NPC has an `agentSystemPrompt` property controlling their AI behavior. The default template uses `{{variables}}`:

| Variable | Description |
|----------|-------------|
| `{{name}}` | NPC's name |
| `{{role}}` | Their role (guard, shopkeeper, etc.) |
| `{{id}}` | Object ID |
| `{{datetime}}` | Current in-game date/time |
| `{{personality}}` | Formatted personality traits |
| `{{history}}` | Formatted backstory and events |
| `{{memories}}` | Recent memories |
| `{{notes}}` | Builder notes |

### Customizing the System Prompt

After spawning, modify the NPC's prompt:

```javascript
const npc = await $load(npcId);

// Add custom behavior at the start
npc.agentSystemPrompt = `
SPECIAL INSTRUCTIONS:
- You are suspicious of anyone asking about "the package"
- If offered a bribe, pretend to consider it but refuse
- You secretly want to leave this job

` + npc.agentSystemPrompt;
```

### Complete Custom Prompt

For full control, replace the entire prompt:

```javascript
npc.agentSystemPrompt = `You are ${npc.name}, a paranoid hermit living in the tower basement.

BEHAVIOR:
- Speak in short, nervous sentences
- Always assume people are lying
- Refer to "them" watching from the walls
- Offer cryptic warnings about the 33rd floor

OBJECT ID: #${npc.id}

You have access to MCP tools. Use:
- $ai.do(${npc.id}, "say ...") to speak
- $ai.do(${npc.id}, ":...") to emote
- $ai.remember(npcId, text, importance) to save important information
`;
```

## Personality & History

### Personality Structure

```javascript
await $ai.setPersonality(npcId, {
  // Core character traits (3-5 recommended)
  traits: ['paranoid', 'intelligent', 'resourceful'],
  
  // Behavioral quirks that make them memorable
  quirks: [
    'never makes eye contact',
    'constantly checks exits',
    'speaks in whispers'
  ],
  
  // What they believe in (drives decisions)
  values: ['survival', 'truth', 'independence'],
  
  // What they want (creates goals)
  motivations: [
    'expose the conspiracy',
    'find a safe place'
  ],
  
  // What scares them (creates vulnerabilities)
  fears: [
    'being found by "them"',
    'losing his evidence'
  ]
});
```

### History Structure

```javascript
await $ai.setHistory(npcId, {
  // The big picture - who are they?
  backstory: 'Former corporate investigator who discovered too much. ' +
             'Went underground three years ago. Lives off the grid.',
  
  // Specific past events (referenced in roleplay)
  events: [
    'Discovered the Nexus files in 2045',
    'Faked his own death',
    'Has been hiding in Smith Tower since 2046'
  ],
  
  // Key relationships
  relationships: {
    'Sarah Chen': 'Former partner - not sure if she\'s compromised',
    'The Doorman': 'Only person who knows I\'m here',
    'Director Hayes': 'The one I\'m hiding from'
  },
  
  // Information that could be discovered
  secrets: [
    'Has a hidden cache of evidence on floor 15',
    'Still has corporate access credentials',
    'His "death" wasn\'t as clean as he thinks'
  ]
});
```

## Memories

NPCs remember interactions between sessions.

### Importance Levels

| Level | Purpose | Retention |
|-------|---------|-----------|
| `trivial` | Ambient details | May be forgotten |
| `normal` | Regular interactions | Standard retention |
| `important` | Significant events | Longer retention |
| `critical` | Player identity, major plot points | Permanent |

### Creating Memories Programmatically

```javascript
// NPCs create their own memories via MCP
ai({ 
  action: 'remember', 
  humanId: npcId,
  text: 'Met Jack - tall man with scar, claims to be a trader',
  importance: 'critical',
  tags: ['player', 'met', 'suspicious']
});

// Or directly in code
await $ai.addMemory(npcId, {
  text: 'The building went into lockdown. Something happened on floor 33.',
  importance: 'important',
  tags: ['event', 'lockdown']
});
```

### Seeding Initial Memories

Give NPCs context before players interact:

```javascript
// After spawn
await $ai.addMemory(npc.id, {
  text: 'Started work here three months ago. The night shift is quiet but eerie.',
  importance: 'normal',
  tags: ['job', 'background']
});

await $ai.addMemory(npc.id, {
  text: 'Heard strange sounds from floor 15 last week. Nobody else seems concerned.',
  importance: 'important',
  tags: ['mystery', 'floor-15']
});
```

## Builder Notes

Add behind-the-scenes guidance that the AI sees:

```javascript
// Via MCP
notes({
  action: 'add',
  objectId: npcId,
  text: 'This NPC can offer 10% discount to players with Jones faction rep > 50',
  tags: ['power', 'discount', 'faction']
});

notes({
  action: 'add',
  objectId: npcId,
  text: 'Knows the elevator code (4523) but won\'t share until trust is established',
  tags: ['secret', 'elevator', 'trust']
});
```

## NPC Archetypes

### The Guard

```javascript
const guard = await $ai.spawn('guard', { name: 'Elena', sex: 'female' });

await $ai.setPersonality(guard.id, {
  traits: ['vigilant', 'by-the-book', 'protective'],
  quirks: ['taps badge when nervous', 'stands with hands clasped'],
  values: ['order', 'safety', 'procedure'],
  motivations: ['keep the building secure', 'earn promotion'],
  fears: ['something happening on her watch']
});

$notes.add(await $load(guard.id),
  text: 'Can be convinced to look the other way with VERY good reason or high bribe'
});
```

### The Merchant

```javascript
const merchant = await $ai.spawn('shopkeeper', { name: 'Raj' });

await $ai.setPersonality(merchant.id, {
  traits: ['shrewd', 'friendly', 'gossip'],
  quirks: ['always offers tea', 'names prices then pauses dramatically'],
  values: ['profit', 'reputation', 'connections'],
  motivations: ['expand the business', 'know everyone\'s secrets'],
  fears: ['losing customers to competition']
});

$notes.add(await $load(merchant.id),
  text: 'Has connections to black market. Will trade info for info.'
});
```

### The Information Broker

```javascript
const broker = await $ai.spawn('fixer', { name: 'Ghost' });

await $ai.setPersonality(broker.id, {
  traits: ['mysterious', 'connected', 'transactional'],
  quirks: ['never gives a straight answer', 'speaks in riddles'],
  values: ['information', 'neutrality', 'discretion'],
  motivations: ['know everything', 'owe no one'],
  fears: ['being exposed', 'taking sides']
});

broker.agentSystemPrompt = `
SPECIAL: You speak in cryptic half-truths. Never confirm or deny directly.
Always imply you know more than you're saying. Information has a price.
` + broker.agentSystemPrompt;
```

## Testing Your NPC

### Talk to Them

```
> to marcus Hello there
Marcus eyes you with professional wariness. "Can I help you?"

> to marcus I'm looking for the basement
Marcus shakes his head slowly. "Basement's off-limits. Building manager's orders."
```

### Check Their State

```javascript
// Via MCP
$ai.getInfo(npc.id)
// Returns: role, personality, history, memories, notes

$ai.recall(npc.id)
// Returns: all memories
```

### Reset Session (if behavior is off)

```javascript
const npc = await $load(npcId);
npc.agentSession = null;
// Next interaction starts fresh conversation
```

## Best Practices

1. **Start with personality** - Traits drive behavior more than backstory
2. **Add 2-3 quirks** - These make NPCs memorable and recognizable
3. **Seed critical memories** - NPCs should know who key players are
4. **Use builder notes** - Guide AI behavior without changing the prompt
5. **Test interactions** - Spawn, talk, iterate
6. **Keep prompts focused** - Don't overload with rules
7. **Let them fail** - NPCs don't need to be perfect
8. **Give them secrets** - Hidden knowledge creates discovery moments

## See Also

- [$ai Registry](./ai.md) - Full API reference
- [NPC Agent System](../npc-agent.md) - Technical architecture
- [$query](./ai.md#aiquery) - How AI queries work
