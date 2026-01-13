---
name: Documentation Search
description: Use this skill when asked to "search docs", "find documentation", "look up", "read the docs", "check documentation", or when using $docs to find information in Malice.
version: 1.0.0
---

# Documentation Search with $docs

## Overview

`$docs` provides access to all Malice documentation. Search for topics, read full documents, or browse available docs.

## Searching

```javascript
// Search by keyword
const results = await $docs.search('combat');
// Returns array of { name, snippet, relevance }

// Search with multiple terms
const results = await $docs.search('web routing');
```

## Reading Documents

```javascript
// Read full document by name
const content = await $docs.read('BUILDERS-GUIDE');
// Returns full markdown content

// Read with specific section
const content = await $docs.read('MCP-TOOLS', 'execute_moo_code');
```

## Listing Available Docs

```javascript
// Get all doc names
const docs = await $docs.list();
// Returns array of document names
```

## Available Documentation

| Document | Topic |
|----------|-------|
| `ABILITIES-FIRST` | Why abilities, not coded verbs |
| `AGENT-GUIDE` | AI agent architecture |
| `BUILDERS-GUIDE` | Creating game content |
| `DEPLOYMENT` | Server setup, Docker |
| `MALICE-DOESNT-CARE` | The agreement, game philosophy |
| `MCP-TOOLS` | Available MCP tools |
| `NARRATOR-PROMPT` | AI narrator system |
| `OOC-POLICY` | Out-of-character rules |
| `PLAYER-GUIDE` | Gameplay, commands |
| `SMITH-TOWER-BUILDERS-GUIDE` | Smith Tower location details |
| `TAILORING` | Clothing and appearance |
| `TIMELINE` | Game world history |
| `WEB-ROUTES` | Website routing system |
| `WHAT-IS-MALICE` | Game overview |
| `moo-programming` | MOO code patterns |
| `npc-agent` | NPC AI system |
| `plot-jobs` | Plot/job system |

## Common Patterns

### Find Info Before Answering

```javascript
// Don't guess - search first
const results = await $docs.search('character creation');
if (results.length > 0) {
  const doc = await $docs.read(results[0].name);
  // Now you have the actual documentation
}
```

### Check Multiple Topics

```javascript
const topics = ['combat', 'damage', 'health'];
for (const topic of topics) {
  const results = await $docs.search(topic);
  if (results.length > 0) {
    // Found relevant docs
  }
}
```

### Get Specific Section

```javascript
// Read MOO programming, focus on methods
const content = await $docs.read('moo-programming');
// Parse for the section you need
```

## When to Use $docs

- Development questions → Search first
- "How does X work?" → Check docs
- Architecture questions → BUILDERS-GUIDE, AGENT-GUIDE
- Gameplay questions → PLAYER-GUIDE (but "find out IC" for lore)
- Deployment/ops → DEPLOYMENT

## Important Notes

- Documentation is editable in-game via `$docs.edit(name, content)`
- Docs persist in MongoDB, not on disk
- Search is fuzzy - close matches count
- Always check docs before guessing
