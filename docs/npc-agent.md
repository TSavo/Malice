# NPC Agent System

AI-powered NPCs using in-process Claude Agent SDK integration.

## Quick Start

```bash
# Start the game (NPCs are built-in, no separate container needed)
docker compose up -d

# Spawn an AI NPC via MCP (code-first)
execute_moo_code({
  code: `
    const room = await $load(173);
    const npc = await $ai.spawn({
      role: 'guard',
      name: 'Janet',
      location: room,
      clothed: true
    });
    return { npcId: npc.id };
  `
})

# Talk to them in-game
to janet Hello there!
```

## Overview

The NPC Agent system enables AI-controlled characters that respond intelligently to player interactions. Each NPC:

- Has a per-NPC system prompt stored as `systemPrompt`
- Maintains conversation context via `agentSession`
- Responds to directed speech (`to npc message`) and item gifts
- Uses MCP tools to speak, emote, and interact with the world

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Player Action                             │
│  "to janet hello" → to verb calls janet.onSpokenTo()        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    onSpokenTo Handler                        │
│  1. buildAgentPrompt() - assembles system prompt             │
│  2. $aiQuery(systemPrompt, userPrompt, session)               │
│  3. Agent uses MCP tools to respond                          │
│  4. Session saved for continuity                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (HTTP)                         │
│  - Code-first: execute_moo_code with full MOO context       │
│  - Direct access to $ai, $plot, $recycler, all $aliases     │
│  - localhost:3010/mcp                                        │
└─────────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Event Triggers

NPCs respond to two types of events:

**Directed Speech** (`to npc message`):
```
Player: to janet What's your name?
→ to verb finds Janet in room
→ calls janet.onSpokenTo(player, "What's your name?")
→ Janet responds via $aiQuery()
```

**Item Gifts** (`give item to npc`):
```
Player: give apple to janet
→ give verb transfers item
→ calls janet.onItemReceived(player, apple)
→ Janet responds via $aiQuery()
```

### 2. System Prompt Assembly

Each NPC has `buildAgentPrompt()` which:
1. Reads the NPC's `systemPrompt` property
2. Gets profile data from `$.ai` registry (personality, history, memories)
3. Substitutes template variables (`{{name}}`, `{{role}}`, `{{id}}`, etc.)
4. Returns the complete system prompt

Template variables:
- `{{name}}` - NPC's name
- `{{role}}` - NPC's role (guard, shopkeeper, etc.)
- `{{id}}` - NPC's object ID
- `{{datetime}}` - Current in-game date/time
- `{{personality}}` - Formatted personality section
- `{{history}}` - Formatted history section
- `{{memories}}` - Formatted memories section
- `{{notes}}` - Formatted builder notes

### 3. AI Query

```javascript
$aiQuery(systemPrompt, userPrompt, session)
  .then(result => {
    // Save session for continuity
    self.agentSession = result.session;
  });
```

The `$aiQuery()` method:
- Calls the Claude Agent SDK
- Provides access to all MCP tools
- Returns `{ response, session }` for continuity
- Agent uses direct methods to speak/emote/move

### 4. NPC Response

The agent responds using `location.announce()` with **pronoun substitution**:
```javascript
// Speech - %A = actor name, %av{verb} = conjugated verb
const room = self.location;
await room.announce(self, null, {
  others: '%A %av{say}, "Hello there!"'
});
// Others see: "Janet says, Hello there!"

// Emote
await room.announce(self, null, {
  others: '%A %av{wave} politely.'
});
// Others see: "Janet waves politely."

// Movement - use self.go()
await self.go('north');
// Returns: { success, direction, fromRoom, toRoom, availableExits }
```

## Per-NPC Storage

Each NPC stores:

| Property | Purpose |
|----------|---------|
| `systemPrompt` | Full system prompt template (copied from `$.ai.defaultAgentPrompt` at spawn) |
| `agentSession` | Claude session ID for conversation continuity |

This allows:
- Per-NPC prompt customization
- Conversation memory within sessions
- Different personalities per NPC

## Authentication

The Claude Agent SDK requires authentication:

### Claude Max/Pro Subscription (Recommended)

Mount your Claude credentials in Docker:
```yaml
# docker-compose.yml
volumes:
  - ${HOME}/.claude:/home/node/.claude
```

### API Key

```bash
export ANTHROPIC_API_KEY=<your-api-key>
```

## NPC Actions (Direct Methods)

NPCs act using methods directly on their object (self):

### Communication

Use `location.announce()` with pronoun substitution for all speech and emotes:

```javascript
// Say to room - %A = your name, %av{verb} = conjugated
const room = self.location;
await room.announce(self, null, {
  others: '%A %av{say}, "Hello!"'
});

// Emote
await room.announce(self, null, {
  others: '%A %av{wave}.'
});

// Say to specific person - %T = their name, %t = lowercase
await room.announce(self, target, {
  target: '%A %av{say} to you, "..."',
  others: '%A %av{say} to %t, "..."'
});

// Pronoun reference:
// %A = actor name (capitalized)
// %a = actor name (lowercase)
// %T = target name (capitalized)
// %t = target name (lowercase)
// %av{verb} = verb conjugated for actor (say → says)
// %as/%ao/%ap = actor pronouns (subject/object/possessive)
// %ts/%to/%tp = target pronouns
```

### Movement
```javascript
// Move through exit (never teleport)
await self.go('north');
// Returns: { success, direction, fromRoom, toRoom, availableExits }
```

### Waiting for Response
```javascript
// Set up timeout for player response
await self.expectResponseFrom(playerId, {
  prompt: 'They seem distracted. Try again.',
  timeout: 120000  // 2 minutes
});
```

### Memory Management
```javascript
$ai.remember(self.id, "Met Jack - suspicious character", "critical", ['player'])
$ai.recall(self.id)
```

### World Interaction
```javascript
// Read room info
const roomInfo = await self.location.describeForAI();
```

### Resources (Read-Only)
- `moo://objects/{id}` - Object details
- `moo://rooms/{id}` - Room state
- `moo://ai/{id}` - NPC profile and memories
- `moo://city-ai/*` - World knowledge docs

## NPC Profile Data

### Personality

```javascript
$ai.setPersonality(3028, {
  traits: ['suspicious', 'loyal', 'gruff'],
  quirks: ['tugs at beard when thinking'],
  values: ['duty', 'honor'],
  motivations: ['protect the town'],
  fears: ['failing those who depend on him']
}})
```

### History

```javascript
$ai.setHistory(3028, {
  backstory: 'Former soldier who retired after the Border Wars.',
  events: ['Enlisted at age 18', 'Rose to sergeant'],
  relationships: { 'Mayor Chen': 'Respects her leadership' },
  secrets: ['Saw something in the caves he never speaks of']
}})
```

### Memories

```javascript
// NPCs can create their own memories
$ai.remember(3028,
  text: 'Met Jack - tall, scar on cheek, claims to be a trader',
  importance: 'critical',
  tags: ['player', 'met']
})
```

## System Prompt Structure

The default system prompt (`$.ai.defaultAgentPrompt`) includes:

1. **IC vs OOC Knowledge** - How to handle player names vs character recognition
2. **Identity** - NPC is the character, not an AI playing one
3. **World Knowledge** - MCP resources for lore and locations
4. **Capabilities** - Available MCP tools
5. **Memory Management** - How to create and use memories
6. **Interaction Logging** - How to log conversations
7. **Agency** - NPCs are empowered to act autonomously
8. **Chain of Command** - Players are NOT the NPC's boss
9. **Default Behavior** - Dismiss and move on attitude
10. **Core Principles** - 11 rules for NPC behavior

## Customizing NPCs

### Custom System Prompt

Override an NPC's prompt after spawn:
```javascript
const janet = await $load(3061);
janet.systemPrompt = janet.systemPrompt.replace(
  'DEFAULT BEHAVIOR',
  'CUSTOM: You are friendly and helpful to newcomers.\n\nDEFAULT BEHAVIOR'
);
```

### Builder Notes

Add behavioral guidance via notes:
```javascript
$notes.add(await $load(3028),
  text: 'Can offer 10% discount to citizens in good standing',
  tags: ['power', 'discount']
})
```

## Example: Guard NPC

```javascript
// Spawn a guard
const result = await $.ai.spawn('guard', {
  name: 'Marcus Webb',
  sex: 'male',
  age: 35,
  location: await $load(lobbyId),
  clothed: true,
  personality: 'Gruff but fair. Suspicious of strangers.',
  history: 'Former soldier, 20 years in the Royal Guard.'
});

// Player interacts
// > to marcus Hello there
// Marcus eyes you suspiciously. "State your business."

// > to marcus I'm looking for work
// Marcus relaxes slightly. "Check the job board at Smith Tower."
```

## Troubleshooting

### NPC not responding

1. Check NPC is AI-controlled: `$ai.getInfo(ID)`
2. Verify `systemPrompt` exists on NPC
3. Check Docker logs: `docker logs malice-game`

### Authentication errors

Ensure Claude credentials are mounted:
```bash
ls -la ~/.claude/
# Should contain credentials.json or similar
```

### Session issues

Reset an NPC's session:
```javascript
const npc = await $load(npcId);
npc.agentSession = null;
```

## Migration from Old Architecture

The previous architecture used:
- Separate `malice-npc-agent` Docker container
- MongoDB change streams for game events
- `NPCAgentManager` and `NPCAgent` classes

The new architecture:
- In-process `$aiQuery()` calls
- Direct verb handler calls (`onSpokenTo`, `onItemReceived`)
- Per-NPC prompt and session storage
- No separate container or event system

Benefits:
- Simpler deployment (one container)
- Lower latency (no network hop)
- Easier debugging (all in one process)
- Per-NPC customization

## See Also

- [AI Registry](moo/ai.md) - `$.ai` registry for AI humans
- [MCP Tools](MCP-TOOLS.md) - Available MCP tools
- [Builder's Guide](BUILDERS-GUIDE.md) - Creating game content
