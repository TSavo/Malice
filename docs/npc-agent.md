# NPC Agent Module

AI-powered NPCs using the Claude Agent SDK with full MCP tool access.

## Quick Start (Docker)

```bash
# Start all services including NPC agent
docker compose up -d

# View NPC agent logs
docker logs -f malice-npc-agent
```

The NPC agent service automatically:
- Connects to the game's MCP server
- Uses MongoDB change streams to react to NPC spawn/despawn events (no polling)
- Creates agents for all AI-controlled NPCs in the registry
- Persists session IDs to MongoDB
- Resumes sessions on restart

## Overview

The NPC Agent module enables AI-controlled characters in the game world. Each NPC gets a Claude-powered agent that can:

- Access all MCP tools (plot management, notes, world queries, object manipulation)
- Maintain persistent memory across interactions via session resumption
- Respond to game events in character
- Execute game commands as their character

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NPCAgentManager                         │
│  - Manages multiple NPC agents                              │
│  - Syncs with $.ai registry                                 │
│  - Routes events to NPCs by location                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       NPCAgent                              │
│  - Single NPC's AI agent                                    │
│  - Claude Agent SDK query() loop                            │
│  - Session persistence                                      │
│  - Event handling                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (HTTP)                        │
│  - All game tools exposed                                   │
│  - plot, notes, world, ai, object manipulation              │
│  - localhost:3001/mcp                                       │
└─────────────────────────────────────────────────────────────┘
```

## Installation

The module requires the Claude Agent SDK:

```bash
npm install @anthropic-ai/claude-agent-sdk
```

## Authentication

The Claude Agent SDK supports multiple authentication methods:

### 1. Claude Max/Pro Subscription (Recommended)

If you have Claude Code installed and authenticated, it will use your credentials automatically:

```bash
# Just run - it picks up Claude Code auth
npx tsx test-npc-agent.ts
```

Or explicitly set a token:

```bash
# Generate a long-lived token
claude setup-token

# Use it
export CLAUDE_CODE_OAUTH_TOKEN=<your-token>
npx tsx test-npc-agent.ts
```

### 2. API Key

```bash
export ANTHROPIC_API_KEY=<your-api-key>
npx tsx test-npc-agent.ts
```

## Usage

### Creating a Single NPC Agent

```typescript
import { NPCAgent } from './src/npc-agent/index.js';

const agent = new NPCAgent({
  npcId: 3028,              // MOO object ID
  name: 'Marcus Webb',       // Display name
  role: 'guard',            // Role for system prompt
  mcpHost: 'localhost',     // MCP server host
  mcpPort: 3001,            // MCP server port
});

// Send a prompt
const response = await agent.prompt('A player just entered. Greet them.');
console.log(response);

// Handle game events
const eventResponse = await agent.handleEvent('player_said', {
  playerName: 'Jack',
  message: 'Hello there!'
});
```

### Using the Agent Manager

```typescript
import { NPCAgentManager } from './src/npc-agent/index.js';

const manager = new NPCAgentManager(objectManager, {
  mcpHost: 'localhost',
  mcpPort: 3001,
});

// Create agent for existing NPC
const agent = await manager.createAgent(npcId, { role: 'shopkeeper' });

// Sync with $.ai registry (creates agents for all registered AI humans)
const created = await manager.syncWithRegistry();
console.log(`Created ${created} agents from registry`);

// Broadcast event to all NPCs in a location
const responses = await manager.broadcastToLocation(roomId, 'player_entered', {
  playerName: 'Jack'
});

// List all managed agents
const agents = manager.listAgents();
```

## Configuration

### NPCAgentConfig

```typescript
interface NPCAgentConfig {
  npcId: number;              // MOO object ID
  name: string;               // Display name
  role: string;               // Role (guard, shopkeeper, etc.)
  systemPromptAddition?: string;  // Extra system prompt text
  mcpHost?: string;           // MCP server host (default: localhost)
  mcpPort?: number;           // MCP server port (default: 3001)
  workingDirectory?: string;  // Working directory for agent
  allowedTools?: string[];    // Allowed built-in tools
}
```

### NPCAgentManagerConfig

```typescript
interface NPCAgentManagerConfig {
  mcpHost?: string;           // MCP server host
  mcpPort?: number;           // MCP server port
  workingDirectory?: string;  // Working directory
  defaultAllowedTools?: string[];  // Default tools for all agents
}
```

## Events

### NPCAgent Events

```typescript
agent.on('tool_use', ({ tool, input }) => {
  console.log(`Agent used tool: ${tool}`);
});

agent.on('error', (error) => {
  console.error('Agent error:', error);
});

agent.on('message', (message) => {
  // All SDK messages for debugging
});

agent.on('reset', () => {
  console.log('Agent session reset');
});
```

### NPCAgentManager Events

```typescript
manager.on('agent_created', ({ npcId, name, role }) => {
  console.log(`Created agent for ${name}`);
});

manager.on('agent_removed', ({ npcId, name }) => {
  console.log(`Removed agent for ${name}`);
});

manager.on('npc_tool_use', ({ npcId, tool, input }) => {
  console.log(`NPC #${npcId} used ${tool}`);
});

manager.on('npc_error', ({ npcId, error }) => {
  console.error(`NPC #${npcId} error:`, error);
});

manager.on('shutdown', () => {
  console.log('Manager shutdown');
});
```

## Game Event Types

The `handleEvent()` method supports these event types:

| Event Type | Data | Description |
|------------|------|-------------|
| `player_entered` | `{ playerName }` | Player entered NPC's location |
| `player_left` | `{ playerName }` | Player left NPC's location |
| `player_said` | `{ playerName, message }` | Player spoke |
| `player_emoted` | `{ playerName, action }` | Player performed emote |
| `item_dropped` | `{ playerName, itemName }` | Player dropped item |
| `item_received` | `{ playerName, itemName }` | Player gave item to NPC |
| `attacked` | `{ attackerName }` | NPC was attacked |
| `time_passed` | `{}` | Periodic check for autonomous actions |
| `plot_event` | `{ description }` | Plot-related event |

Custom events are also supported - they're formatted as generic prompts.

## MCP Tools & Resources Available

NPCs have access to MCP tools and resources:

### Resources (Read-Only)

**Live Game Data:**
- `moo://objects/{id}` - Get object details
- `moo://objects/{id}/prop/{name}` - Get property value
- `moo://objects/{id}/method/{name}` - Get method code (walks inheritance)
- `moo://rooms/{id}` - Room state (exits, contents, players)
- `moo://ai/{id}` - NPC profile, memories, notes
- `moo://plots/{id}` - Plot details
- `moo://players` - List all players

**Documentation:**
- `moo://docs/{name}` - Technical docs (mcp-tools, plot-jobs, builders-guide, moo-programming, npc-agent, timeline)
- `moo://city-ai/{name}` - World knowledge (context, factions, rules, locations, map, npcs, jobs, plots, tools)

### Object Manipulation (Tools)
- `set_property` - Set property value
- `call_method` - Execute method on object
- `create_object` - Create new object
- `clone_object` - Clone existing object
- `recycle_object` - Delete object

### World Queries (Tools)
- `world` - DSL-based world queries
- `search_objects` - Search by name pattern
- `find_by_property` - Find by property value
- `find_children` - Find object descendants
- `find_in_location` - Find objects in room

### Room/Navigation (Tools)
- `get_exits` - List room exits
- `list_rooms` - List all rooms
- `move_object` - Move object to location

### Plot Management
- `plot` - Full plot/phase/job management
- Create plots, manage phases, track jobs

### Notes
- `notes` - Add/search notes on objects

### AI Management
- `ai` - Spawn/despawn AI humans

### Sessions
- `session_connect` - Telnet session
- `session_send` - Send command
- `session_log` - Get session log

## System Prompt

Each NPC gets a system prompt that includes:

1. **Identity** - Name, role, object ID
2. **Capabilities** - Available MCP tools and how to use them
3. **Game Mechanics** - How to speak, emote, move
4. **Communication** - How to interact with players
5. **Custom additions** - Via `systemPromptAddition` config

Example system prompt excerpt:

```
You are Marcus Webb, an AI-controlled character in a text-based multiplayer
online game (MOO/MUD).

ROLE: guard

IDENTITY:
- You ARE the character, not an AI assistant pretending to be one
- Respond in character at all times
- Your NPC object ID is #3028

CAPABILITIES:
You have access to MCP resources and tools:
- Read game state via resources (moo://objects/{id}, moo://rooms/{id}, etc.)
- Manipulate objects (set_property, call_method, etc.)
- Manage plots and quests (plot tool with phases, jobs, events)
- Take notes on objects and situations (notes tool)
...
```

## Session Persistence

Each NPC maintains a session ID for memory continuity:

```typescript
// First interaction - new session created
await agent.prompt('Hello!');
console.log(agent.getState().sessionId); // "abc123..."

// Subsequent interactions resume the session
await agent.prompt('What did I just say?');
// Agent remembers the previous interaction

// Reset to start fresh
agent.reset();
```

## NPC Profile Data

Each AI NPC can have rich profile data that's automatically injected into their system prompt:

### Personality

Define how the NPC behaves and interacts. Can be a string or structured object:

```javascript
// Simple string personality
ai({ action: 'setPersonality', humanId: 3028, personality: 'Gruff but fair. Suspicious of strangers. Loyal to those who earn his trust.' })

// Structured personality
ai({ action: 'setPersonality', humanId: 3028, personality: {
  traits: ['suspicious', 'loyal', 'gruff'],
  quirks: ['tugs at beard when thinking', 'never sits with back to door'],
  values: ['duty', 'honor', 'family'],
  motivations: ['protect the town', 'find his missing brother'],
  fears: ['failing those who depend on him', 'the dark creatures from the north']
}})
```

### History/Backstory

Define the NPC's past and relationships:

```javascript
// Simple string history
ai({ action: 'setHistory', humanId: 3028, history: 'Former soldier who retired after the Border Wars. Lost his brother during the final battle.' })

// Structured history
ai({ action: 'setHistory', humanId: 3028, history: {
  backstory: 'Marcus served 20 years in the Royal Guard before retiring to Pioneer Square. He saw terrible things during the Border Wars.',
  events: [
    'Enlisted at age 18 after his village was raided',
    'Rose to sergeant during the Border Wars',
    'Lost his brother Thomas in the final battle',
    'Retired to Pioneer Square five years ago'
  ],
  relationships: {
    'Mayor Chen': 'Respects her leadership',
    'Old Pete': 'Drinking buddy at the tavern',
    'Thomas Webb': 'Missing brother - presumed dead'
  },
  secrets: [
    'Saw something in the northern caves he never speaks of',
    'Suspects his brother may still be alive'
  ]
}})
```

### Builder Notes

Use the existing `$.notes` system to add notes to NPCs that guide their behavior:

```javascript
notes({ action: 'add', objectId: 3028, text: 'Should be hostile to players wearing gang colors', tags: ['behavior'] })
notes({ action: 'add', objectId: 3028, text: 'Knows about the hidden passage in the library', tags: ['knowledge'] })
```

### Get Full Profile

Retrieve all profile data for an NPC:

```javascript
ai({ action: 'profile', humanId: 3028 })
// Returns: { personality, history, notes, memories, name, description, role }
```

### Setting Profile at Spawn

You can set personality and history when spawning:

```javascript
ai({
  action: 'spawn',
  role: 'guard',
  name: 'Marcus Webb',
  locationId: 80,
  personality: 'Gruff but fair. Suspicious of strangers.',
  history: 'Former soldier who retired after the Border Wars.'
})
```

## Persistent Memories

Beyond session-based memory, NPCs can store critical memories that persist even when sessions are reset or context is summarized. This is ideal for information that must never be forgotten.

### Memory Storage

Memories are stored in `$.ai.memories[humanId]` and automatically injected into the NPC's system prompt before each interaction.

```typescript
// Memory structure
interface Memory {
  text: string;                              // The memory content
  importance: 'critical' | 'important' | 'normal';  // Priority level
  timestamp: string;                         // ISO timestamp
  tags: string[];                            // Categorization tags
}
```

### Using Memories via MCP

NPCs can manage their own memories using the `ai` tool:

```javascript
// Store a critical memory
ai({ action: 'remember', humanId: 3028, text: 'Player Jack is wanted for theft', importance: 'critical', tags: ['player', 'criminal'] })

// Store an important memory
ai({ action: 'remember', humanId: 3028, text: 'The merchant guild meeting is at noon', importance: 'important', tags: ['event', 'guild'] })

// Recall all memories
ai({ action: 'recall', humanId: 3028 })

// Recall only critical memories
ai({ action: 'recall', humanId: 3028, criticalOnly: true })

// Recall by tag
ai({ action: 'recall', humanId: 3028, tag: 'player' })

// Forget a specific memory by index
ai({ action: 'forget', humanId: 3028, index: 2 })

// Get memory summary (count by importance)
ai({ action: 'memories', humanId: 3028 })
```

### Memory Injection

The NPCAgent automatically:
1. Loads memories via MCP before each prompt
2. Sorts memories by importance (critical → important → normal)
3. Injects them into the system prompt with visual markers:

```
PERSISTENT MEMORIES:
These are critical memories that persist across sessions. Reference them when relevant.

⚠️ CRITICAL: Player Jack is wanted for theft [player, criminal]
❗ IMPORTANT: The merchant guild meeting is at noon [event, guild]
• The weather has been rainy lately [weather]
```

### Best Practices

- **Critical memories**: Facts that must never be forgotten (crimes, alliances, player traits)
- **Important memories**: Significant events, deadlines, quests in progress
- **Normal memories**: Context that's useful but not essential
- Use **tags** for categorization: `player`, `quest`, `location`, `event`, `item`, etc.
- Memories persist across session resets, so use them for truly critical information
- The agent can add/remove its own memories based on what it deems important

## Integration with $.ai Registry

The `NPCAgentManager` can sync with the game's `$.ai` registry:

```typescript
// In game bootstrap or on-demand
await manager.syncWithRegistry();
```

This creates agents for all AI humans registered via:

```typescript
await $.ai.spawn('guard', { name: 'Marcus Webb', locationId: 80 });
```

## Example: Guard NPC

```typescript
import { NPCAgent } from './src/npc-agent/index.js';

const guard = new NPCAgent({
  npcId: 3028,
  name: 'Marcus Webb',
  role: 'guard',
  systemPromptAddition: `
    SPECIFIC DUTIES:
    - Guard the entrance to Pioneer Square
    - Check credentials of anyone trying to enter restricted areas
    - Report suspicious activity to the plot system
    - Be vigilant but not hostile to civilians
  `
});

// Player enters
const greeting = await guard.handleEvent('player_entered', {
  playerName: 'Jack'
});
// "Marcus eyes the newcomer warily. 'Hold it right there.
//  State your business in Pioneer Square.'"

// Player speaks
const response = await guard.handleEvent('player_said', {
  playerName: 'Jack',
  message: 'I\'m looking for work'
});
// "Marcus relaxes slightly. 'Work, huh? Check the job board
//  outside the Smith Tower. They're always hiring.'"
```

## Docker Deployment

The NPC agent runs as a separate Docker container for isolation and scalability.

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   malice-game   │────▶│  malice-mongo   │◀────│ malice-npc-agent│
│                 │     │                 │     │                 │
│  - Game server  │     │  - MongoDB      │     │  - Claude SDK   │
│  - MCP server   │◀────│  - Session IDs  │     │  - AI agents    │
│  - Telnet/WS    │     │  - NPC data     │     │  - Session files│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                                               │
        │              HTTP (MCP Protocol)              │
        └───────────────────────────────────────────────┘
```

### Volumes

| Volume | Container | Purpose |
|--------|-----------|---------|
| `mongodb_data` | malice-mongo | Game database |
| `npc_agent_sessions` | malice-npc-agent | Claude session files |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_HOST` | `malice-game` | Game MCP server hostname |
| `MCP_PORT` | `3001` | Game MCP server port |
| `MONGO_URI` | `mongodb://mongodb:27017` | MongoDB connection string |
| `MONGO_DB` | `malice` | Database name |

### Session Persistence

Session IDs are stored on NPC objects in MongoDB:

```javascript
// NPC object in MongoDB
{
  _id: 3028,
  name: "Marcus Webb",
  role: "guard",
  agentSessionId: "cca3aea4-e755-4006-9d8b-e08b880963a0"  // Persisted here
}
```

Session files are stored in the `npc_agent_sessions` Docker volume at `/app/.claude/`.

On container restart:
1. Service queries AI registry for NPCs
2. Loads `agentSessionId` from each NPC object
3. Resumes Claude sessions using stored IDs
4. Full conversation history is restored

### Scaling

To run multiple NPC agent instances (for load balancing):

```yaml
# docker-compose.override.yml
services:
  npc-agent:
    deploy:
      replicas: 3
```

Each instance will manage a subset of NPCs based on which ones it syncs first.

## Troubleshooting

### "Authentication required" error

Ensure you have one of:
- Claude Code installed and authenticated
- `CLAUDE_CODE_OAUTH_TOKEN` environment variable
- `ANTHROPIC_API_KEY` environment variable

### MCP connection errors

Ensure the MCP server is running:
```bash
docker logs malice-game | grep MCP
# Should show: 🔮 MCP server listening on http://0.0.0.0:3001/mcp
```

### Agent not responding

Check if the agent is already processing:
```typescript
if (agent.isProcessing()) {
  console.log('Agent is busy');
}
```

### Session memory issues

Reset the session if needed:
```typescript
agent.reset();
```

## MCP `ai` Tool Integration

The NPC Agent system integrates with the MCP `ai` tool, which provides a way to spawn and control AI-controlled humans from Claude Code or other MCP clients.

### Workflow

1. **Spawn via MCP**: Use the `ai` tool to spawn an AI human
2. **Agent Created**: NPCAgentManager detects the new NPC and creates an agent
3. **Events Trigger**: Game events (player enters, speaks, etc.) are sent to the agent
4. **Agent Acts**: Agent uses MCP tools to respond and take actions

### MCP `ai` Tool Actions

```javascript
// Spawn a new AI human (creates MOO object + registers with $.ai)
ai({ action: 'spawn', role: 'guard', name: 'Marcus', locationId: 100 })

// Execute a command as the AI human (verbs like get, drop, say, etc.)
ai({ action: 'do', humanId: 567, command: 'say Hello there!' })

// See what the AI human sees (room description, exits, contents)
ai({ action: 'look', humanId: 567 })

// Get detailed info about an AI human
ai({ action: 'info', humanId: 567 })

// List all AI humans (optionally by role)
ai({ action: 'list', role: 'guard' })

// Remove an AI human
ai({ action: 'despawn', humanId: 567 })
```

### Testing with AI Humans

AI humans are useful for testing game mechanics without needing a real player connection:

```javascript
// 1. Spawn a test human
const result = await ai({ action: 'spawn', role: 'tester', name: 'TestBot', locationId: roomId });
const testerId = result.id;

// 2. Test picking up items
await ai({ action: 'do', humanId: testerId, command: 'get apple' });

// 3. Test dropping items
await ai({ action: 'do', humanId: testerId, command: 'drop apple' });

// 4. Check the room state
const view = await ai({ action: 'look', humanId: testerId });

// 5. Clean up
await ai({ action: 'despawn', humanId: testerId });
```

### What AI Humans Can Do

AI humans spawned via the `ai` tool have:

- **Full verb registration** - get, drop, look, say, emote, and all registered verbs
- **Physical body** - hands for holding items, standard human body parts
- **Location** - placed in a room, can see and interact with contents
- **Command execution** - any player command can be executed via `do`

### Verb Argument Convention

When writing verb handlers that AI humans (or players) will use, remember:

- **`player`** is a direct variable, NOT in `args`
- **`args`** only contains resolved pattern variables (`%i`, `%t`, `%s`)

```javascript
// CORRECT - for verb pattern 'drop %i'
obj.setMethod('drop', `
  const item = args[0];  // Resolved item from %i
  // 'player' is available directly
  await item.moveTo(player.location, player);
`);

// WRONG - player is not args[0]
obj.setMethod('drop', `
  const player = args[0];  // WRONG!
  const item = args[1];    // WRONG!
`);
```

See [verbs.md](moo/advanced/verbs.md) for complete documentation on verb argument conventions.
