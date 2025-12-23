# Debugging CharGen & NPC Sessions

This guide covers debugging the AI-autonomous character generation (chargen v2) system and NPC/query sessions in general.

## Architecture Overview

### CharGen v2 Flow
1. New player connects via telnet
2. AuthManager routes to CharGen for new users
3. CharGen calls `startNPCInterview(playerId)` which:
   - Creates an AI agent session via `$query`
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
```bash
# List NPC sessions via MCP
mcp__malice__ai action=list

# Get specific NPC info
mcp__malice__ai action=info humanId=<npc-id>
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
2. Is `ai.do` command syntax correct?
3. Is room's `announce()` method working?

## Debugging Tools

### Check Player State
```javascript
// Via MCP
mcp__malice__describe_object objectId="#<player-id>"

// Check player properties
mcp__malice__call_method objectId="#<player-id>" name="get" args=["chargenState"]
```

### Check NPC State
```javascript
// List AI humans
mcp__malice__ai action=list

// Get NPC info
mcp__malice__ai action=info humanId=<npc-id>

// Check what NPC sees
mcp__malice__ai action=look humanId=<npc-id>
```

### Check Room Contents
```javascript
// List objects in a room
mcp__malice__find_in_location locationId="#<room-id>"

// Get room exits
mcp__malice__get_exits roomId="#<room-id>"
```

### Trace Message Delivery

Message flow for NPC speech:
```
ai.do "say Hello"
  → callVerb('say', ...)
  → room.announce(message)
  → for each viewer: viewer.see(message)
  → viewer.tell(message)
  → _context.send(message)
```

To debug:
1. Check NPC's location matches player's location
2. Check player has `_context` (connected telnet session)
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

### 1. Start Telnet Connection
```bash
telnet localhost 5555
```

### 2. Monitor Docker Logs (Separate Terminal)
```bash
docker compose logs -f game 2>&1 | grep -E "(chargen|ai\.|NPC|spawn|query)"
```

### 3. Check Session State
After login attempt, check:
```javascript
// Get player's chargen state
mcp__malice__call_method objectId="#<player-id>" name="get" args=["chargenState"]
mcp__malice__call_method objectId="#<player-id>" name="get" args=["chargenAgentSession"]
```

### 4. Verify NPC Actions
```javascript
// Execute command as NPC
mcp__malice__ai action=do humanId=<npc-id> command="look"
mcp__malice__ai action=do humanId=<npc-id> command="say Hello, I can see you."
```

## Adding Debug Logging

### In MOO Methods
```typescript
// Add to any method
$log('DEBUG', 'see() called', { selfId: self.id, message: args[0] });
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
| `src/database/bootstrap/prototypes/player-builder.ts` | Player `tell()` to telnet |

## Testing Chargen Flow

1. Connect: `telnet localhost 5555`
2. Enter a new username (creates new player)
3. Watch Docker logs for AI spawn
4. Verify NPC appears in room: `look`
5. Answer NPC questions via speech: `say My name is John`
6. Check chargen progress: Use MCP tools to query player state
