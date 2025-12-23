# CharGen v2 Plan - AI-Autonomous Interview System

## Overview

Redesign character generation to be fully AI-driven using **code-first MCP**. The AI agent uses `execute_moo_code` to call MOO methods directly. When a new player joins, a single `$query` call kicks off an autonomous agent that:
1. Creates a private interview room (with creative description)
2. Spawns an NPC interviewer
3. Tailors the NPC
4. Moves the player in
5. Introduces itself and conducts the interview
6. On completion, cleans up and sends player to starting room

**Key Architecture**:
- Single code-first MCP server on port 3010 with all tools
- The AI uses `execute_moo_code` to call $.charGen methods directly
- The AI uses standard MCP tools (dig, ai, move_object) for setup
- Player speech triggers `onSpokenTo` → resumes the Claude session

## Event Flow

```
1. AuthManager.onNewUser() → $.charGen.startNPCInterview(context, username, password)
2. Create player object (minimal, no body yet)
3. Call $query with chargen system prompt
4. AI agent autonomously:
   a. Creates interview room (using dig tool - creative description)
   b. Spawns NPC interviewer (using ai tool)
   c. Tailors NPC (using ai tool)
   d. Moves player into room (using move_object)
   e. Has NPC greet player and ask first question
   f. Calls $.charGen.startInterview() via execute_moo_code
5. AI turn ends
   ↓
6. Player types response
7. NPC.onSpokenTo → $query(systemPrompt, playerMessage, agentSession)
8. AI interprets answer, calls $.charGen.answerQuestion() via execute_moo_code
9. AI asks next question (via ai tool)
10. AI turn ends
   ↓
[Repeat 6-10 until all questions answered]
   ↓
11. AI calls $.charGen.finishInterview() via execute_moo_code
12. finishInterview creates body, moves player to starting room, cleans up room/NPC
13. Player enters game world
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/database/bootstrap/chargen-builder.ts` | ✅ DONE: `startNPCInterview()`, `interviewerPrompt`, `registerForRecycle()`, `cleanupForPlayer()`, `finishInterview()` |
| `src/database/bootstrap/mcp-builder.ts` | ✅ DONE: Code-first MCP with all tools (no separate chargen server needed) |
| `src/database/bootstrap/prototypes/human-builder.ts` | ✅ DONE: Removed additionalMcpServers parameter |
| `src/database/bootstrap/prototypes/player-builder.ts` | ✅ DONE: Removed additionalMcpServers parameter |
| `src/index.ts` | ✅ DONE: Single MCP server on port 3010 |

## Implementation Details

### Code-First MCP Architecture

All CharGen functionality now uses the single code-first MCP server on port 3010. The AI writes MOO code using `execute_moo_code` to call $.charGen methods directly:

```javascript
// Example: Start interview
execute_moo_code({
  code: `
    const player = await $load(12345);
    return await $.charGen.startInterview(player);
  `
})

// Example: Answer question
execute_moo_code({
  code: `
    const player = await $load(12345);
    return await $.charGen.answerQuestion(player, "name", "John Smith");
  `
})

// Example: Finish interview
execute_moo_code({
  code: `
    const player = await $load(12345);
    return await $.charGen.finishInterview(player);
  `
})
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
2. Spawn yourself as an NPC interviewer using ai tool (role: "chargen-interviewer")
3. Tailor yourself appropriately using ai tool
4. Move the player into your room using move_object
5. Greet them warmly and begin the character creation interview
6. Call $.charGen.startInterview() using execute_moo_code with their player ID
7. Ask the first question

Remember: After asking a question, STOP and wait for their response.\`;

  // Call $query with interviewer prompt
  $query(self.interviewerPrompt, kickoffPrompt, null).then(result => {
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
Use execute_moo_code to call $.charGen methods directly:
- `await $.charGen.startInterview(player)` - Call this first to get the question list
- `await $.charGen.answerQuestion(player, questionId, answer)` - Record each answer
- `await $.charGen.getNextQuestion(player)` - See what's left to ask
- `await $.charGen.getProgress(player)` - Review all answers
- `await $.charGen.finishInterview(player)` - Complete when all questions answered

## How to Speak/Act
Use ai tool with action="do":
- `ai(action="do", humanId=YOUR_ID, command="say Hello, welcome!")` - speak to the player
- `ai(action="do", humanId=YOUR_ID, command="emote smiles warmly")` - perform an action

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
3. Register objects for cleanup using execute_moo_code:
   - `await $.charGen.registerForRecycle(playerId, roomId)`
   - `await $.charGen.registerForRecycle(playerId, myId)`
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

**AI Usage (via execute_moo_code):**
```javascript
// Register room for recycling
execute_moo_code({
  code: `await $.charGen.registerForRecycle(${playerId}, ${roomId});`
})

// Register NPC for recycling
execute_moo_code({
  code: `await $.charGen.registerForRecycle(${playerId}, ${npcId});`
})
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

✅ DONE: The NPC's `onSpokenTo` now uses the single code-first MCP server:

```typescript
// In human-builder.ts onSpokenTo - simplified
$query(systemPrompt, userPrompt, self.interactionSession)
  .then(result => {
    self.interactionSession = result.session;
  });
```

The AI interviewer has access to all $.charGen methods via `execute_moo_code`:
- `await $.charGen.startInterview(player)` - Initialize interview for a player
- `await $.charGen.getNextQuestion(player)` - Get next unanswered question
- `await $.charGen.answerQuestion(player, questionId, answer)` - Record an answer
- `await $.charGen.getProgress(player)` - Get all questions and answers
- `await $.charGen.finishInterview(player)` - Complete chargen, create body
- `await $.charGen.getSuggestions(questionId)` - Get suggestions for a question
- `await $.charGen.registerForRecycle(playerId, objectId)` - Register object for cleanup
- `await $.charGen.rejectPlayer(player, reason)` - Reject and disconnect player

## Key Design Decisions

1. **Room per player**: Create fresh room, recycle when done
2. **Auto-move on finish**: `finishInterview` moves player to starting room
3. **Recycle NPC**: Despawn interviewer after each interview
4. **Session-based conversation**: NPC uses `$query` with `agentSession` for multi-turn dialogue
5. **Player speech triggers continuation**: `onSpokenTo` resumes the Claude session
