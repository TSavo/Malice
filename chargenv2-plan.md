# CharGen v2 Plan - AI-Autonomous Interview System

## Overview

Redesign character generation to be fully AI-driven. The AI agent has access to BOTH main MCP tools AND CharGen MCP tools. When a new player joins, a single `$query` call kicks off an autonomous agent that:
1. Creates a private interview room (with creative description)
2. Spawns an NPC interviewer
3. Tailors the NPC
4. Moves the player in
5. Introduces itself and conducts the interview
6. On completion, cleans up and sends player to starting room

**Key Architecture**:
- `$query` modified to accept additional MCP servers as parameter
- The AI agent uses main MCP tools (dig, ai.spawn, ai.tailor, move_object) for setup
- The AI agent uses CharGen MCP tools for recording answers
- Player speech triggers `onSpokenTo` → resumes the Claude session

## Event Flow

```
1. AuthManager.onNewUser() → $.charGen.startNPCInterview(context, username, password)
2. Create player object (minimal, no body yet)
3. Call $query with chargen system prompt + CharGen MCP server
4. AI agent autonomously:
   a. Creates interview room (using dig tool - creative description)
   b. Spawns NPC interviewer (using ai.spawn)
   c. Tailors NPC (using ai.tailor)
   d. Moves player into room (using move_object)
   e. Has NPC greet player and ask first question
   f. Calls start_interview via CharGen MCP
5. AI turn ends
   ↓
6. Player types response
7. NPC.onSpokenTo → $query(systemPrompt, playerMessage, agentSession, {additionalMcpServers})
8. AI interprets answer, calls answer_question via CharGen MCP
9. AI asks next question (via ai.do "say ...")
10. AI turn ends
   ↓
[Repeat 6-10 until all questions answered]
   ↓
11. AI calls finish_interview (CharGen MCP)
12. finishInterview creates body, moves player to starting room, cleans up room/NPC
13. Player enters game world
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/database/object-manager.ts` | Modify `$query` to accept additional MCP servers parameter |
| `src/database/bootstrap/chargen-builder.ts` | Add `startNPCInterview()`, `interviewerPrompt`, `registerForRecycle()`, `cleanupForPlayer()`, update `finishInterview()` |
| `src/mcp/chargen-mcp-server.ts` | Add `register_for_recycle` tool |
| `src/database/bootstrap/prototypes/human-builder.ts` | Update `onSpokenTo` to pass additionalMcpServers for chargen-interviewer role |
| `src/index.ts` | Already done - starts CharGen MCP on port 3002 |

## Implementation Details

### 0. Update `$query` to accept additional MCP servers (object-manager.ts)

Modify the `query()` method signature to accept optional additional MCP servers:

```typescript
async query(
  systemPrompt: string,
  prompt: string,
  session?: string,
  options?: { additionalMcpServers?: Record<string, { type: string; url: string }> }
): Promise<{ response: string; session: string }> {
  const { query: sdkQuery } = await import('@anthropic-ai/claude-agent-sdk');

  // Base MCP servers
  const mcpServers: Record<string, { type: string; url: string }> = {
    'malice-moo': {
      type: 'http',
      url: 'http://localhost:3001/mcp',
    },
  };

  // Add any additional MCP servers
  if (options?.additionalMcpServers) {
    Object.assign(mcpServers, options.additionalMcpServers);
  }

  const queryOptions: Record<string, unknown> = {
    systemPrompt,
    mcpServers,
    allowedTools: ['*'],
    // ... rest unchanged
  };
  // ...
}
```

### 1. New Method: `startNPCInterview(context, username, password)`

Minimal bootstrap - creates player and kicks off autonomous AI:

```typescript
chargen.setMethod('startNPCInterview', `
  const context = args[0];
  const username = args[1];
  const password = args[2];

  // 1. Create player object (minimal, no body)
  const player = await $.recycler.create({
    parent: $.player.id,
    properties: {
      name: username,
      aliases: [username.toLowerCase()],
      description: 'A new arrival.',
    }
  });
  player.passwordHash = await $.hash(password);
  context.setHandler(player);
  context.authenticate(player.id);
  player._context = context;

  // 2. Store player reference on chargen for cleanup tracking
  player.chargenInProgress = true;

  // 3. Kick off the autonomous AI agent
  const kickoffPrompt = \`A new player has just connected. Their player ID is \${player.id}.

Your task:
1. Create a private interview room using the dig tool (be creative with the description)
2. Spawn yourself as an NPC interviewer using ai.spawn (role: "chargen-interviewer")
3. Tailor yourself appropriately using ai.tailor
4. Move the player into your room using move_object
5. Greet them warmly and begin the character creation interview
6. Call start_interview with their player ID
7. Ask the first question

Remember: After asking a question, STOP and wait for their response.\`;

  // Call with CharGen MCP server added
  $query(self.interviewerPrompt, kickoffPrompt, null, {
    additionalMcpServers: {
      'malice-chargen': { type: 'http', url: 'http://localhost:3002/mcp' }
    }
  }).then(result => {
    // Store session on player for continuation (NPC doesn't exist yet)
    player.chargenAgentSession = result.session;
  });
`);
```

### 2. Interviewer System Prompt

Store on `$.charGen.interviewerPrompt`:

```
You are conducting a character creation interview for a new player in a MUD game.

## Phase 1: Setup (First Turn Only)
Use the main MCP tools to set up the interview:
1. **Create a room** using dig(name, description) - be creative with the description!
2. **Spawn yourself** using ai(action="spawn", role="chargen-interviewer", name="<your name>", ...)
3. **Tailor yourself** using ai(action="tailor", humanId=<your id>, context="...")
4. **Move the player** using move_object(objectId=<player id>, destinationId=<room id>)
5. **Greet the player** using ai(action="do", humanId=<your id>, command="say ...")

## Phase 2: Interview
Use the CharGen MCP tools (malice-chargen server):
- start_interview(playerId) - Call this first to get the question list
- answer_question(playerId, questionId, answer) - Record each answer
- get_next_question(playerId) - See what's left to ask
- get_progress(playerId) - Review all answers
- finish_interview(playerId) - Complete when all questions answered

## How to Speak/Act
Use ai(action="do", humanId=YOUR_ID, command="..."):
- "say Hello, welcome!" - speak to the player
- "emote smiles warmly" - perform an action

## Interview Questions
Guide the player through:
- Name, sex, age
- Height, weight
- Eye color and shape
- Hair color, style, texture
- Skin tone, build type
- Face shape, nose, lips
- Freckles, distinguishing marks, facial hair
- Stat allocation (20 points across body parts)

## Conversation Style
- Be warm, welcoming, professional
- Ask questions naturally, not robotically
- Accept creative answers (heterochromia, unusual colors, etc.)
- Group related questions when it feels natural

## CRITICAL RULES
1. After asking a question, STOP and wait for the player's response
2. Do NOT continue asking questions without player input
3. Register objects for cleanup using register_for_recycle (CharGen MCP):
   - register_for_recycle(playerId=<player id>, objectId=<room id>)
   - register_for_recycle(playerId=<player id>, objectId=<your npc id>)
```

### 3. Update `onNewUser()` - Route to NPC Interview

```typescript
chargen.setMethod('onNewUser', `
  const context = args[0];
  const username = args[1];
  const password = args[2];

  // Use autonomous AI interview system
  await self.startNPCInterview(context, username, password);
`);
```

### 4. Add `registerForRecycle` Method and MCP Tool

The AI agent registers objects (room, NPC) for cleanup when interview finishes:

**On $.charGen (chargen-builder.ts):**
```typescript
// Storage for cleanup registry
chargen.recycleRegistry = {};  // { playerId: [objectId, objectId, ...] }

chargen.setMethod('registerForRecycle', `
  const playerId = args[0];
  const objectId = args[1];

  const registry = self.recycleRegistry || {};
  if (!registry[playerId]) {
    registry[playerId] = [];
  }
  registry[playerId].push(objectId);
  self.recycleRegistry = registry;

  return { success: true, playerId, objectId };
`);

chargen.setMethod('cleanupForPlayer', `
  const playerId = args[0];
  const registry = self.recycleRegistry || {};
  const objectIds = registry[playerId] || [];

  // Recycle all registered objects
  for (const objectId of objectIds) {
    try {
      await $.recycler.recycle(objectId);
    } catch (e) {
      // Ignore errors - object may already be recycled
    }
  }

  // Clear registry for this player
  delete registry[playerId];
  self.recycleRegistry = registry;

  return { success: true, recycled: objectIds.length };
`);
```

**Add MCP Tool (chargen-mcp-server.ts):**
```typescript
server.tool(
  'register_for_recycle',
  'Register an object (room, NPC) to be recycled when interview finishes.',
  {
    playerId: z.number().describe('Player object ID'),
    objectId: z.number().describe('Object ID to recycle on completion'),
  },
  async ({ playerId, objectId }) => {
    const chargen = await this.getCharGen();
    const result = await chargen.registerForRecycle(playerId, objectId);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  }
);
```

### 5. Update `finishInterview()` - Use cleanupForPlayer

```typescript
chargen.setMethod('finishInterview', `
  // ... existing body creation code ...

  // Move player to starting room
  const startingRoomId = self.startingRoom || 1353;
  const startingRoom = await $.load(startingRoomId);
  await player.moveTo(startingRoom, player);

  // Clear chargen state
  player.chargenInProgress = false;
  player.chargenAgentSession = null;

  // Connect player to game
  await player.connect(player._context);

  // Cleanup all registered objects (async, don't wait)
  self.cleanupForPlayer(playerId).catch(() => {});

  return { success: true, playerId, bodyId: body.id };
`);
```

### 6. Handle Continued Conversation (onSpokenTo)

The NPC's `onSpokenTo` needs to pass the additional MCP servers when continuing:

```typescript
// In human-builder.ts onSpokenTo, or in the chargen interviewer specifically:
// When building the prompt and calling $query, include additionalMcpServers

// Option: Check if this is a chargen NPC and add chargen MCP
if (self.role === 'chargen-interviewer') {
  $query(systemPrompt, userPrompt, self.agentSession, {
    additionalMcpServers: {
      'malice-chargen': { type: 'http', url: 'http://localhost:3002/mcp' }
    }
  }).then(result => { self.agentSession = result.session; });
}
```

## CharGen MCP Server (Already Implemented)

The MCP server on port 3002 is already created with these tools:
- `start_interview` - Initialize interview for a player
- `get_next_question` - Get next unanswered question
- `answer_question` - Record an answer
- `get_progress` - Get all questions and answers
- `finish_interview` - Complete chargen, create body
- `get_suggestions` - Get suggestions for a question

## Key Design Decisions

1. **Room per player**: Create fresh room, recycle when done
2. **Auto-move on finish**: `finishInterview` moves player to starting room
3. **Recycle NPC**: Despawn interviewer after each interview
4. **Session-based conversation**: NPC uses `$query` with `agentSession` for multi-turn dialogue
5. **Player speech triggers continuation**: `onSpokenTo` resumes the Claude session
