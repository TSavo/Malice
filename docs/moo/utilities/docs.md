# $docs - Documentation System

Use `$docs` to browse, search, and query documentation loaded from `docs/` at startup.

## Purpose

The `$docs` singleton loads all markdown documentation from the `docs/` directory into MOO objects. Each document becomes a queryable `$doc` object with content, path, and category metadata.

## Why Use This?

**Bad: Hardcoded documentation paths**
```javascript
// Reading docs manually
const fs = require('fs');
const content = fs.readFileSync('docs/moo/prototypes/agents.md');
// No search, no structure, no runtime access
```

**Good: Queryable documentation**
```javascript
// Search all docs
const results = await $docs.search('bootstrap');

// Browse by category
const mooTree = await $docs.tree('moo');

// Get specific doc
const agentDoc = await $docs.get('agents');
```

## What $docs Handles

- ✅ Loading all markdown files from `docs/` at startup
- ✅ Organizing by folder/category
- ✅ Full-text search across all documents
- ✅ Path-based and name-based retrieval
- ✅ Category and folder browsing

## API Reference

### list() - List Documents

```javascript
await $docs.list(folder?)
```

Lists all documents, optionally filtered by folder path.

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | string | Optional folder path to filter by |

**Returns:** Array of `$doc` objects

**Examples:**
```javascript
// List all documents
const allDocs = await $docs.list();

// List documents in a specific folder
const mooDocs = await $docs.list('moo');
const protoDocs = await $docs.list('moo/prototypes');
const utilDocs = await $docs.list('moo/utilities');
```

### get() - Get Document by Name

```javascript
await $docs.get(name)
```

Retrieves a document by its filename (without extension).

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Document filename without `.md` extension |

**Returns:** `$doc` object or `null` if not found

**Examples:**
```javascript
// Get a document by name (case-insensitive)
const guide = await $docs.get('BUILDERS-GUIDE');
const agents = await $docs.get('agents');
const core = await $docs.get('core-concepts');
```

### getByPath() - Get Document by Path

```javascript
await $docs.getByPath(path)
```

Retrieves a document by its exact path from docs root.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Path from docs root (without extension) |

**Returns:** `$doc` object or `null` if not found

**Examples:**
```javascript
// Get by exact path
const agents = await $docs.getByPath('moo/prototypes/agents');
const scheduler = await $docs.getByPath('moo/utilities/scheduler');
const guide = await $docs.getByPath('guides/BUILDERS-GUIDE');
```

### search() - Search Documents

```javascript
await $docs.search(query, options?)
```

Searches document content and titles for matching text.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search text (case-insensitive) |
| `options.category` | string | Limit search to a top-level category |
| `options.limit` | number | Maximum results to return |

**Returns:** Array of matching `$doc` objects

**Examples:**
```javascript
// Search all docs
const results = await $docs.search('bootstrap');

// Search within a category
const mooResults = await $docs.search('prototype', { category: 'moo' });

// Limit results
const topResults = await $docs.search('room', { limit: 10 });

// Combined options
const filtered = await $docs.search('exit', {
  category: 'moo',
  limit: 5
});
```

### tree() - Get Folder Structure

```javascript
await $docs.tree(folder?)
```

Returns the document folder structure as a nested object.

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | string | Optional root folder to start from |

**Returns:** Nested object representing folder structure

**Examples:**
```javascript
// Get full tree
const fullTree = await $docs.tree();
// {
//   'city-ai': { 'CONTEXT': doc, 'MAP': doc, ... },
//   'moo': {
//     'core-concepts': doc,
//     'prototypes': { 'agents': doc, 'rooms': doc, ... },
//     'utilities': { 'scheduler': doc, 'recycler': doc, ... }
//   },
//   ...
// }

// Get subtree
const mooTree = await $docs.tree('moo');
const protoTree = await $docs.tree('moo/prototypes');
```

### getCategories() - Get Top-Level Categories

```javascript
await $docs.getCategories()
```

Returns all top-level folder names (categories).

**Returns:** Array of category strings

**Examples:**
```javascript
const categories = await $docs.getCategories();
// ['city-ai', 'greeter', 'guides', 'internal', 'lore', 'moo', 'prompts', 'reference']
```

## $doc Object Properties

Each document is represented as a `$doc` object with these properties:

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Filename without extension |
| `path` | string | Full path from docs root (e.g., "moo/prototypes/agents") |
| `category` | string | Top-level folder (e.g., "moo", "city-ai") |
| `title` | string | Title extracted from first `#` heading |
| `content` | string | Full markdown content |
| `filename` | string | Original filename with extension |

**Example:**
```javascript
const doc = await $docs.getByPath('moo/prototypes/agents');

console.log(doc.name);      // 'agents'
console.log(doc.path);      // 'moo/prototypes/agents'
console.log(doc.category);  // 'moo'
console.log(doc.title);     // 'Agents & NPCs'
console.log(doc.filename);  // 'agents.md'
console.log(doc.content);   // '# Agents & NPCs\n\n...'
```

## MCP Resources

Documentation is also accessible via MCP resources:

| Resource | Description |
|----------|-------------|
| `moo://docs` | List all documentation files |
| `moo://docs/{name}` | Get documentation by name |
| `moo://city-ai` | List city AI documentation |
| `moo://city-ai/{name}` | Get city AI doc by name |

**Examples:**
```
moo://docs/BUILDERS-GUIDE
moo://docs/core-concepts
moo://city-ai/CONTEXT
moo://city-ai/MAP-UNDERGROUND
```

## Real-World Examples

### Finding Relevant Documentation

```javascript
// AI assistant helping a builder
async function findRelevantDocs(topic) {
  const results = await $docs.search(topic, { limit: 5 });

  if (results.length === 0) {
    return 'No documentation found for: ' + topic;
  }

  return results.map(doc =>
    `- ${doc.title} (${doc.path})`
  ).join('\n');
}
```

### Browsing Documentation by Category

```javascript
// List all MOO documentation
async function listMooDocs() {
  const docs = await $docs.list('moo');

  console.log('MOO Documentation:');
  for (const doc of docs) {
    console.log(`  ${doc.path}: ${doc.title}`);
  }
}
```

### Getting Protocol Documentation

```javascript
// Get specific protocol docs
async function getProtocolInfo(protoName) {
  const doc = await $docs.getByPath('moo/prototypes/' + protoName);

  if (!doc) {
    return 'No documentation for prototype: ' + protoName;
  }

  return doc.content;
}
```

### Building a Documentation Index

```javascript
// Create searchable index for AI
async function buildDocIndex() {
  const categories = await $docs.getCategories();
  const index = {};

  for (const cat of categories) {
    index[cat] = (await $docs.list(cat)).map(doc => ({
      name: doc.name,
      path: doc.path,
      title: doc.title
    }));
  }

  return index;
}
```

## How Documents Are Loaded

1. At server startup, `$docs` scans the `docs/` directory recursively
2. Each `.md` file becomes a `$doc` object
3. The first `#` heading is extracted as the `title`
4. Path structure determines `category` (top-level folder)
5. Documents are indexed by both `name` and `path`

## Tips & Best Practices

1. **Use paths for precision** - `getByPath()` when you know exact location
2. **Use names for convenience** - `get()` when filename is unique
3. **Search with categories** - Narrow search scope for better results
4. **Cache results** - Document content doesn't change during runtime
5. **Use tree() for navigation** - Show users available documentation
6. **Check for null** - `get()` and `getByPath()` return `null` if not found

## Document Organization

The `docs/` folder structure:

```
docs/
├── city-ai/          # City AI system documentation
│   ├── CONTEXT.md
│   ├── MAP-UNDERGROUND.md
│   └── ...
├── greeter/          # Onboarding system docs
│   ├── 00-overview.md
│   ├── continuum/
│   └── underground/
├── guides/           # Developer guides
│   ├── BUILDERS-GUIDE.md
│   └── ...
├── lore/             # Game lore and worldbuilding
├── moo/              # MOO system documentation
│   ├── core-concepts.md
│   ├── prototypes/   # Prototype documentation
│   ├── reference/    # Reference guides
│   └── utilities/    # Utility object docs
├── prompts/          # AI prompt documentation
└── reference/        # General reference docs
```

## See Also

- [$issues](./issues.md) - In-game issue tracking
- [$aiQuery](../reference/globals.md#aiquery---ai-queries) - Query AI about documentation
- [Builders Guide](../../guides/BUILDERS-GUIDE.md) - How to build in Malice
