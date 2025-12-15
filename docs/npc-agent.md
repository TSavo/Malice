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
| `attacked` | `{ attackerName }` | NPC was attacked |
| `time_passed` | `{}` | Periodic check for autonomous actions |
| `plot_event` | `{ description }` | Plot-related event |

Custom events are also supported - they're formatted as generic prompts.

## MCP Tools Available

NPCs have access to all MCP tools:

### Object Manipulation
- `get_object` - Fetch object by ID
- `set_property` - Set property value
- `get_property` - Get property value
- `call_method` - Execute method on object
- `create_object` - Create new object
- `clone_object` - Clone existing object
- `recycle_object` - Delete object

### World Queries
- `world` - DSL-based world queries
- `search_objects` - Search by name pattern
- `find_by_property` - Find by property value
- `find_children` - Find object descendants
- `find_in_location` - Find objects in room

### Room/Navigation
- `get_room_info` - Full room details
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
You have access to MCP tools that let you:
- Query and manipulate game objects (get_object, set_property, call_method, etc.)
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
| `POLL_INTERVAL` | `30000` | How often to sync with AI registry (ms) |

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
