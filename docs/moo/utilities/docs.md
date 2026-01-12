# $docs - Documentation System

Use `$docs` to browse, search, create, and edit documentation stored as MOO objects.

## Purpose

The `$docs` singleton manages documentation as editable MOO objects. Documents are initially imported from the `docs/` directory at first startup, then stored permanently in the MOO database. **All edits are made in-game** - the disk files are only used for initial import.

## Key Concept: In-Game Editing

Documents live in the MOO database, not on disk. This means:
- **Edits persist** - changes are saved to MongoDB immediately
- **No file access needed** - edit docs via MOO code or MCP
- **Bootstrap preserves edits** - existing docs are never overwritten
- **Create new docs anytime** - no need to touch the filesystem

## Quick Start

```javascript
// Edit an existing document
await $docs.set('moo/utilities/docs', '# New Content\n\nUpdated documentation...');

// Create a new document
await $docs.create('guides/my-guide', '# My Guide\n\nGuide content here...');

// Search and browse
const results = await $docs.search('bootstrap');
const guide = await $docs.get('BUILDERS-GUIDE');
```

## What $docs Handles

- ✅ **Editing** documents in-game via `set()`
- ✅ **Creating** new documents via `create()`
- ✅ **Deleting** and **renaming** documents
- ✅ Full-text search across all documents
- ✅ Path-based and name-based retrieval
- ✅ Category and folder browsing
- ✅ Automatic persistence to MongoDB

## API Reference

### Editing API

#### set() - Update Document Content

```javascript
await $docs.set(path, content)
```

Updates an existing document's content.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Document path (e.g., "moo/utilities/docs") |
| `content` | string | New markdown content |

**Returns:** `{ success: true, path, title, contentLength }` or `{ success: false, error }`

**Examples:**
```javascript
// Update a document
const result = await $docs.set('guides/BUILDERS-GUIDE', `# Builders Guide

Updated content here...
`);

// Check result
if (result.success) {
  console.log(`Updated ${result.path}, new length: ${result.contentLength}`);
}
```

#### create() - Create New Document

```javascript
await $docs.create(path, content, options?)
```

Creates a new document at the specified path.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Document path (e.g., "guides/my-new-guide") |
| `content` | string | Markdown content |
| `options.title` | string | Optional title override (otherwise extracted from `# heading`) |

**Returns:** `{ success: true, id, path, title }` or `{ success: false, error }`

**Examples:**
```javascript
// Create a new guide
await $docs.create('guides/quick-start', `# Quick Start Guide

Get started with Malice in 5 minutes.

## Installation
...
`);

// Create with explicit title
await $docs.create('internal/notes', 'Some notes...', {
  title: 'Developer Notes'
});
```

#### delete() - Delete Document

```javascript
await $docs.delete(path)
```

Permanently deletes a document.

| Parameter | Type | Description |
|-----------|------|-------------|
| `path` | string | Document path to delete |

**Returns:** `{ success: true, path, deletedId }` or `{ success: false, error }`

**Examples:**
```javascript
// Delete a document
await $docs.delete('guides/outdated-guide');

// To re-import from disk after deletion, run bootstrap:apply
```

#### rename() - Rename/Move Document

```javascript
await $docs.rename(oldPath, newPath)
```

Moves a document to a new path.

| Parameter | Type | Description |
|-----------|------|-------------|
| `oldPath` | string | Current document path |
| `newPath` | string | New document path |

**Returns:** `{ success: true, oldPath, newPath, id }` or `{ success: false, error }`

**Examples:**
```javascript
// Rename a document
await $docs.rename('guides/old-name', 'guides/new-name');

// Move to different category
await $docs.rename('internal/api-notes', 'reference/api-notes');
```

#### stats() - Get Statistics

```javascript
await $docs.stats()
```

Returns documentation statistics.

**Returns:**
```javascript
{
  total: 85,                    // Total documents
  categories: 8,                // Number of categories
  byCategory: {                 // Count per category
    moo: 25,
    guides: 10,
    ...
  },
  totalContentLength: 250000,   // Total chars across all docs
  averageLength: 2941,          // Average doc length
  inGameCreated: 5,             // Docs created in-game
  importedFromDisk: 80,         // Docs imported from disk
  loadedAt: '2025-01-10...'     // Last bootstrap time
}
```

### Reading API

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
| `source` | string | Origin: `"disk"` (imported) or `"in-game"` (created/edited) |
| `importedAt` | string | ISO timestamp when imported from disk |
| `createdAt` | string | ISO timestamp when created in-game |
| `editedAt` | string | ISO timestamp of last in-game edit |

**Example:**
```javascript
const doc = await $docs.getByPath('moo/prototypes/agents');

console.log(doc.name);       // 'agents'
console.log(doc.path);       // 'moo/prototypes/agents'
console.log(doc.category);   // 'moo'
console.log(doc.title);      // 'Agents & NPCs'
console.log(doc.content);    // '# Agents & NPCs\n\n...'
console.log(doc.source);     // 'disk' or 'in-game'
console.log(doc.editedAt);   // '2025-01-10T12:00:00Z' (if edited)
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

## How Documents Work

### Initial Import (First Startup)

1. At first server startup, `$docs` scans the `docs/` directory recursively
2. Each `.md` file becomes a `$doc` MOO object stored in MongoDB
3. The first `#` heading is extracted as the `title`
4. Path structure determines `category` (top-level folder)
5. Documents are indexed by both `name` and `path`

### Subsequent Startups (Preserves Edits)

1. Bootstrap checks if each doc path already exists in the registry
2. **Existing docs are SKIPPED** - in-game edits are preserved
3. Only NEW files (not in registry) are imported from disk
4. To re-import a doc from disk: delete it first, then run `bootstrap:apply`

### Re-importing from Disk

If you need to reset a doc to its disk version:
```javascript
// Delete the in-game version
await $docs.delete('guides/BUILDERS-GUIDE');

// Then run bootstrap:apply to re-import from docs/guides/BUILDERS-GUIDE.md
```

## Tips & Best Practices

1. **Edit in-game** - Use `$docs.set()` to update docs, changes persist immediately
2. **Use paths for precision** - `getByPath()` when you know exact location
3. **Use names for convenience** - `get()` when filename is unique
4. **Search with categories** - Narrow search scope for better results
5. **Check for null** - `get()` and `getByPath()` return `null` if not found
6. **Track changes** - Check `doc.editedAt` to see when a doc was last modified
7. **Create new categories** - Just use a new path prefix like `await $docs.create('newcat/doc', '...')`

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
