# Malice Connection Troubleshooting

This guide follows the actual user flow from landing to gameplay.

## The Flow

```
1. malice.world (landing page)
      ↓
2. Choose faction → redirects to faction site
      ↓  
3. Faction site (thecontinuum.city, graycartel.com, or neurallog.io)
      ↓
4. Register account
      ↓
5. /play page → WebSocket connection
      ↓
6. Character creation (chargen)
      ↓
7. Enter game world
```

---

## Step 1: Landing Page (malice.world)

**URL:** https://malice.world

**What should happen:**
- Landing page loads with faction selection
- Three factions visible: Continuum, Gray Cartel, Neural Log
- Clicking a faction redirects to that faction's site

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| Page won't load | Server down | Check if web server is running |
| Factions don't appear | JavaScript error | Check browser console |
| Links don't work | DNS not configured | Use direct ports (localhost:8000, :8001) |

**To check:**
```javascript
// Is metaDomain working?
const meta = await $load('metaDomain');
const root = meta.rootRoute;
return await root.printTree();
```

---

## Step 2: Faction Site

**URLs:**
- Continuum: https://thecontinuum.city (or localhost:8000)
- Gray Cartel: https://graycartel.com (or localhost:8001)
- Neural Log: https://neurallog.io (or localhost:8002)

**What should happen:**
- Faction landing page with theme
- Link to registration/play page
- Continuum: /play
- Cartel: /descend → /play

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| Can't reach site | DNS not configured | Use localhost:PORT |
| Wrong theme shows | Domain mismatch | Check $domainRegistry |
| 404 errors | Routes not built | Restart server to rebuild routes |

**To check:**
```javascript
// List registered domains
const domains = await $.domainRegistry.list();

// Check specific domain
const continuum = await $load('continuumDomain');
return await continuum.rootRoute.printTree();
```

---

## Step 3: Registration

**Endpoint:** POST /register (on faction server)

**Required fields:**
- username: 3-16 chars, starts with letter, alphanumeric + underscore
- password: 6+ characters
- email: valid email format

**What should happen:**
1. Form submits to /register
2. Server validates input
3. Creates player object in MOO
4. Creates session token
5. Redirects to /play

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| "Username taken" | Already exists | Choose different username |
| "Invalid username" | Bad format | Follow the rules above |
| 500 error | Server error | Check server logs |
| Redirect fails | Cookie issue | Check browser allows cookies |

**To check:**
```javascript
// Find player by username
const players = await $query()
  .parent($player)
  .prop('username')
  .equals('username_here')
  .all();

// Check if player exists but chargen incomplete
if (players.length > 0) {
  const p = players[0];
  return {
    id: p.id,
    username: p.username,
    chargenComplete: p.chargenComplete,
    factionId: p.factionId
  };
}
```

---

## Step 4: WebSocket Connection (/play page)

**URL:** /play on faction site

**What should happen:**
1. Page loads with terminal UI
2. JavaScript establishes WebSocket connection
3. Player sees connection message
4. If chargen incomplete, chargen starts

**WebSocket URL pattern:**
```
wss://[domain]/ws?token=[session_token]
```

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| "Connection failed" | WebSocket server down | Check transport is running |
| Keeps reconnecting | Auth token invalid | Re-login, get new token |
| No response after connect | Chargen didn't start | Check chargen system |
| SSL errors | Certificate issues | Check cert configuration |

**To check:**
```javascript
// Check transport bundles
const bundles = await $.transports.listBundles();

// Check if player is connected
const players = await $query()
  .parent($player)
  .prop('username')
  .equals('username_here')
  .first();

if (players) {
  return {
    id: players.id,
    connected: !!players._context,
    chargenComplete: players.chargenComplete,
    chargenInProgress: players.chargenInProgress
  };
}
```

---

## Step 5: Character Creation (Chargen)

**What should happen:**
1. AI interviewer manifests
2. Asks player questions
3. Builds character based on responses
4. Creates character appearance, background, etc.
5. Completes chargen, player enters world

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| No interviewer appears | Chargen not started | Check $.charGen.startNPCInterview |
| Interviewer silent | AI query failing | Check $aiQuery, API keys |
| Stuck in chargen | Timeout or error | Reset chargen state |
| Can't complete | Missing required info | Interviewer needs to extract data |

**To check:**
```javascript
// Get player's chargen state
const player = await $query()
  .parent($player)
  .prop('username')
  .equals('username_here')
  .first();

if (player) {
  return {
    chargenInProgress: player.chargenInProgress,
    chargenComplete: player.chargenComplete,
    chargenAgentSession: player.chargenAgentSession?.substring(0, 20),
    chargenStartTime: player.chargenStartTime,
    location: player.location?.name
  };
}

// Reset stuck chargen (if needed)
// player.chargenInProgress = false;
// player.chargenAgentSession = null;
// await $.charGen.startNPCInterview(player);
```

**To debug chargen session:**
```javascript
await $docs.read('debugging-chargen-sessions');
```

---

## Step 6: Entering the World

**What should happen:**
1. Chargen completes
2. Player spawns in starting location
3. Player can move, look, interact

**Common issues:**

| Problem | Cause | Solution |
|---------|-------|----------|
| Wrong spawn location | Chargen bug | Move player manually |
| Can't see room | Description missing | Check room.describe() |
| Commands don't work | Verb parsing issue | Check verb system |

**To check:**
```javascript
const player = await $load(playerId);
return {
  location: player.location?.name,
  locationId: player.location?.id,
  contents: player.location?.contents?.length || 0
};

// Move player to correct location if stuck
// const startRoom = await $load('startRoom');
// await player.moveTo(startRoom);
```

---

## General Diagnostics

### Server Status
```javascript
return {
  scheduler: await $scheduler.status(),
  playerCount: (await $query().parent($player).all()).length,
  connectedCount: (await $query().parent($player).prop('_context').exists().all()).length
};
```

### Check Logs
Server logs show errors. Look for:
- `[FactionWeb]` - Registration issues
- `[Transport]` - Connection issues
- `[CharGen]` - Character creation issues
- `[ObjectManager.$aiQuery]` - AI interaction issues

### Force Reset Player
```javascript
const player = await $load(playerId);

// Reset chargen
player.chargenInProgress = false;
player.chargenComplete = false;
player.chargenAgentSession = null;

// Restart chargen
await $.charGen.startNPCInterview(player);
```

---

## Quick Reference: Ports

| Service | Default Port |
|---------|--------------|
| Main web server | 80 |
| Continuum faction | 8000 |
| Gray Cartel faction | 8001 |
| Neural Log faction | 8002 |
| MCP server | 3010 |
| Session MCP (Continuum) | 3012 |
| Session MCP (Cartel) | 3013 |
