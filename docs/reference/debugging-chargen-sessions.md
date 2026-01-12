# Debugging CharGen & NPC Sessions

This guide covers debugging the AI-autonomous character generation (chargen v2) system and NPC/query sessions in general.

## Architecture Overview

### CharGen v2 Flow
1. New player connects via WebSocket
2. AuthManager routes to CharGen for new users
3. CharGen calls `startNPCInterview(playerId)` which:
   - Creates an AI agent session via `$aiQuery`
   - Spawns an NPC interviewer (e.g., "Processing Officer Venn")
   - Creates an interview room
   - Moves player and NPC to that room
4. AI conducts interview through in-game speech
5. AI uses execute_moo_code to call $.charGen methods (answerQuestion, finishInterview, etc.)
6. $.charGen.finishInterview() creates the player's body

### Key Components
- **Port 3010**: Code-first MCP server (all tools including chargen via execute_moo_code)
- **`$.charGen`**: CharGen object with methods (startInterview, answerQuestion, finishInterview, etc.)
- **`$.ai`**: AI human registry for tracking NPCs

## Session Logging

### Location (Inside Docker)
```
/home/node/.claude/projects/-home-node/*.jsonl
```

### Accessing Logs
```bash
# List session files
docker exec malice-game ls -la /home/node/.claude/projects/-home-node/

# View a specific session
docker exec malice-game cat /home/node/.claude/projects/-home-node/<session-id>.jsonl
```

### MCP Resources for Sessions

Use execute_moo_code:

```typescript
execute_moo_code({
  code: `
    // List all AI NPCs
    const npcs = $ai.listActiveHumans();

    // Get specific NPC info
    const npc = await $load(npcId);
    return {
      npcs,
      npc: npc ? { id: npc.id, name: npc.name, location: npc.location?.id } : null
    };
  `
})
```

Note: CharGen uses a different property (`chargenAgentSession` on player) rather than the AI registry's session tracking.

## Common Issues

### 1. "$.chargen alias not found"
**Cause**: Case sensitivity - alias is `charGen` not `chargen`
**Fix**: Use `aliases.charGen` (camelCase) in lookups

### 2. "Cannot set properties of null (setting 'body')"
**Cause**: `createHumanBody()` called with null owner
**Context**: AI spawn intentionally passes null, sets owner later
**Fix**: Null check in body-factory-builder.ts: `if (owner) { owner.body = torso; }`

### 3. Player not receiving NPC messages
**Cause**: Player has no body/eyes during chargen, `see()` returns false
**Fix**: `see()` method falls back to `tell()` when no eyes exist

### 4. NPC spawned but not speaking
**Check**:
1. Is NPC in same room as player?
2. Is the room's `announce()` method working?
3. Does the NPC have a valid location?

## Debugging Tools

### Check Player State

```typescript
execute_moo_code({
  code: `
    const player = await $load(playerId);
    return {
      chargenState: player.chargenState,
      chargenAgentSession: player.chargenAgentSession,
      chargenInProgress: player.chargenInProgress,
      chargenComplete: player.chargenComplete,
      location: player.location?.name,
      body: player.body?.id
    };
  `
})
```

### Check NPC State

```typescript
execute_moo_code({
  code: `
    // List all AI NPCs
    const npcs = $ai.listActiveHumans();

    // Get specific NPC
    const npc = await $load(npcId);
    const room = npc?.location;

    return {
      npcs,
      npc: npc ? {
        id: npc.id,
        name: npc.name,
        location: room?.name,
        locationContents: room?.contents
      } : null
    };
  `
})
```

### Check Room Contents

```typescript
execute_moo_code({
  code: `
    const room = await $load(roomId);
    const contents = [];
    for (const id of (room.contents || [])) {
      const obj = await $load(id);
      if (obj) contents.push({ id: obj.id, name: obj.name });
    }
    return {
      room: { id: room.id, name: room.name },
      contents,
      exits: room.exits || {}
    };
  `
})
```

### Trace Message Delivery

Message flow for NPC speech:
```
room.announce(actor, target, messages)
  → for each viewer: viewer.see(message)
  → viewer.tell(message)
  → _context.send(message)
```

To debug:
1. Check NPC's location matches player's location
2. Check player has `_context` (connected WebSocket session)
3. Check `see()` method returns true (or falls back to `tell()`)

### Force Bootstrap Rebuild
When modifying builder files, apply changes with:
```bash
docker compose down
docker compose build game
FORCE_BOOTSTRAP=true docker compose up -d
```

### View Live Logs
```bash
# Follow game container logs
docker compose logs -f game

# Filter for specific patterns
docker compose logs -f game 2>&1 | grep -i "chargen\|ai\|spawn"
```

## Debugging Session Flow

### 1. Start WebSocket Connection

Connect to the faction's WebSocket endpoint:
```bash
# Using wscat (npm install -g wscat)
wscat -c ws://localhost:8080/mux

# Or use the faction's web interface at http://localhost:8000/play
```

### 2. Monitor Docker Logs (Separate Terminal)
```bash
docker compose logs -f game 2>&1 | grep -E "(chargen|ai\.|NPC|spawn|query)"
```

### 3. Check Session State
After login attempt, check:
```typescript
execute_moo_code({
  code: `
    const player = await $load(playerId);
    return {
      chargenState: player.chargenState,
      chargenAgentSession: player.chargenAgentSession,
      chargenInProgress: player.chargenInProgress,
      _chargenPromise: !!player._chargenPromise
    };
  `
})
```

### 4. Verify NPC Actions
```typescript
execute_moo_code({
  code: `
    const npc = await $load(npcId);
    const room = npc?.location;

    // Have NPC speak
    if (room?.announce) {
      await room.announce(npc, null, {
        others: '%A says, "Hello, I can see you."'
      });
    }

    return { success: true, room: room?.name };
  `
})
```

## Adding Debug Logging

### In MOO Methods
```typescript
// Add to any method
console.log('[DEBUG] see() called', { selfId: self.id, message: args[0] });
```

### In TypeScript Builders
```typescript
console.log('[CharGen] startNPCInterview called for player:', playerId);
```

### Check Logs
```bash
docker compose logs game --tail 100 | grep DEBUG
```

## Key Files

| File | Purpose |
|------|---------|
| `src/mcp/mcp-server-codefirst.ts` | Code-first MCP server (port 3010) |
| `src/database/bootstrap/mcp-builder.ts` | MCP tool objects builder |
| `src/database/bootstrap/chargen-builder.ts` | CharGen object methods |
| `src/database/bootstrap/ai-builder.ts` | AI human spawning |
| `src/database/bootstrap/body-factory-builder.ts` | Body creation |
| `src/database/bootstrap/prototypes/embodied-builder.ts` | `see()`, `tell()` methods |
| `src/database/bootstrap/prototypes/player-builder.ts` | Player `tell()` to WebSocket |

## Testing Chargen Flow

1. Connect: `wscat -c ws://localhost:8080/mux` or visit `http://localhost:8000/play`
2. Enter a new username (creates new player)
3. Watch Docker logs for AI spawn
4. Verify NPC appears in room: `look`
5. Answer NPC questions via speech: `say My name is John`
6. Check chargen progress: Use execute_moo_code to query player state
