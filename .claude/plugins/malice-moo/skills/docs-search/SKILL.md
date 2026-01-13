---
name: Documentation Search
description: Use this skill when asked to "search docs", "find documentation", "look up", "read the docs", "check documentation", or when using $docs to find information in Malice.
version: 1.0.0
---

# Documentation Search

## How to Query $docs

**List all available docs:**
```javascript
await $docs.list();
```

**Read a specific doc:**
```javascript
await $docs.read('DOC-NAME');
```

**Search by keyword:**
```javascript
await $docs.search('topic');
await $docs.search('multiple keywords');
```

## Search Strategy

1. **Start broad:** `await $docs.search('combat')`
2. **Read promising results:** `await $docs.read('PLAYER-GUIDE')`
3. **Search within:** Look for specific section in returned content
4. **Try related terms:** If 'combat' fails, try 'damage', 'health', 'attack'

## Key Documents

| Doc | When to Use |
|-----|-------------|
| `BUILDERS-GUIDE` | Creating content, prototypes, rooms |
| `MCP-TOOLS` | Tool reference, execute_moo_code |
| `WEB-ROUTES` | Website, routing, domains |
| `moo-programming` | Code patterns, methods, properties |
| `AGENT-GUIDE` | AI agents, $aiQuery |
| `PLAYER-GUIDE` | Gameplay mechanics |
| `npc-agent` | NPC spawning, AI control |
| `plot-jobs` | Scheduled events, city AI |

## Important

- Docs are editable: `await $docs.set('DOC-NAME', newContent)`
- Create new docs: `await $docs.create('path/to/doc', content)`
- Always search before guessing
- Docs may have been updated by other AIs
