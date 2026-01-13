---
name: MOO Objects and Methods
description: Use this skill when asked about "MOO objects", "properties", "methods", "setMethod", "$load", "$recycler", "create objects", "edit methods", "object inheritance", "prototypes", or general MOO programming in Malice.
version: 1.0.0
---

# MOO Objects and Methods

## How to Find What You Need

**Primary doc:**
```javascript
await $docs.read('moo-programming');
```

**Search for specifics:**
```javascript
// Object basics
await $docs.search('RuntimeObject');
await $docs.search('properties methods');

// Creating objects
await $docs.search('recycler create');
await $docs.search('create object');

// Methods
await $docs.search('setMethod');
await $docs.search('method execution');

// Inheritance
await $docs.search('prototype inheritance');
await $docs.search('parent type');

// Loading
await $docs.search('$load');
await $docs.search('aliases');
```

**Related docs:**
- `BUILDERS-GUIDE` - creating game content
- `AGENT-GUIDE` - AI-controlled objects
- `typescript-guide` - async patterns

## Key Concepts (read docs for details)

- Everything is a MOO object in MongoDB
- Methods are TypeScript strings, compiled on execution
- Use `$recycler.create()` not manual creation
- Use `$load(id)` or `$aliasName` to access objects
- Changes persist automatically
