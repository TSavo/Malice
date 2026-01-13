---
name: Query Objects
description: Use this skill when asked to "find objects", "search for", "query objects", "list all", "get objects where", or when using $query to locate objects in Malice.
version: 1.0.0
---

# Query Objects

## How to Find What You Need

**Primary doc:**
```javascript
await $docs.read('moo-programming');
```

**Search for specifics:**
```javascript
// Query basics
await $docs.search('$query');
await $docs.search('query builder');

// Filtering
await $docs.search('query prop');
await $docs.search('query parent');
await $docs.search('query filter');

// Results
await $docs.search('query all');
await $docs.search('query first');
```

**Related docs:**
- `BUILDERS-GUIDE` - finding objects to modify
- `MCP-TOOLS` - query via MCP

## Key Concepts (read docs for details)

- `$query()` returns a chainable builder
- `.parent($type)` filters by prototype
- `.prop('name').equals(value)` filters by property
- `.all()` returns array, `.first()` returns one
- `.count()` returns count without loading objects
