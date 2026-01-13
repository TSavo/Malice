---
name: Connection Troubleshooting
description: Use this skill when asked about "connection issues", "can't connect", "registration problems", "chargen stuck", "character creation", "websocket", "/play not working", "can't log in", "faction site", or troubleshooting player connection flow in Malice.
version: 1.0.0
---

# Connection Troubleshooting

## How to Find What You Need

**Primary doc:**
```javascript
await $docs.read('TROUBLESHOOTING');
```

**Search for specific issues:**
```javascript
// Registration
await $docs.search('registration');
await $docs.search('/register');

// WebSocket/connection
await $docs.search('websocket');
await $docs.search('transport');

// Character creation
await $docs.search('chargen');
await $docs.search('character creation');
await $docs.search('debugging-chargen-sessions');
```

## The Flow

```
malice.world → faction site → register → /play → chargen → game
```

1. **malice.world** - Landing, faction selection
2. **Faction site** - thecontinuum.city, graycartel.com, neurallog.io
3. **Registration** - POST /register
4. **WebSocket** - /play page connects
5. **Chargen** - AI interviewer creates character
6. **Game** - Player enters world

## Quick Diagnostics

```javascript
// Check player state
const player = await $query()
  .parent($player)
  .prop('username')
  .equals('username_here')
  .first();

if (player) {
  return {
    connected: !!player._context,
    chargenComplete: player.chargenComplete,
    chargenInProgress: player.chargenInProgress,
    location: player.location?.name
  };
}
```

## Common Issues

| Issue | Check |
|-------|-------|
| Can't reach site | DNS, ports, server running |
| Registration fails | Username format, already exists |
| WebSocket drops | Transport status, auth token |
| Chargen stuck | AI query, session state |

Always read `TROUBLESHOOTING` doc for detailed flow and solutions.
