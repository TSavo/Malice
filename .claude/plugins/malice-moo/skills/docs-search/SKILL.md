---
name: Documentation Search
description: Use this skill when asked to "search docs", "find documentation", "look up", "read the docs", "check documentation", or when using $docs to find information in Malice.
version: 1.0.0
---

# Documentation Search

## Reading Docs

```javascript
const content = await $docs.read('DOC-NAME');
```

## Searching Docs

```javascript
const results = await $docs.search('topic');
// Returns matching docs with snippets
```

## Listing All Docs

```javascript
const all = await $docs.list();
```

## Key Documents

| Doc | Topic |
|-----|-------|
| `BUILDERS-GUIDE` | Creating content |
| `MCP-TOOLS` | Available tools |
| `WEB-ROUTES` | Website routing |
| `moo-programming` | MOO code patterns |
| `AGENT-GUIDE` | AI agents |
| `PLAYER-GUIDE` | Gameplay |

Always search $docs before guessing. The docs are editable - they may have been updated.
