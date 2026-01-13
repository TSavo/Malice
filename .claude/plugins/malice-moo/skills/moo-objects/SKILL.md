---
name: MOO Objects and Methods
description: Use this skill when asked about "MOO objects", "properties", "methods", "setMethod", "$load", "$recycler", "create objects", "edit methods", "object inheritance", "prototypes", or general MOO programming in Malice.
version: 1.0.0
---

# MOO Objects and Methods

For MOO programming documentation, read from $docs:

```javascript
const content = await $docs.read('moo-programming');
```

For building game content:

```javascript
const content = await $docs.read('BUILDERS-GUIDE');
```

Key concepts:
- Everything is a MOO object in MongoDB
- Methods are TypeScript strings, hot-reloadable
- Use `$recycler` to create objects
- Use `$load(id)` to load objects

Key objects: `$recycler`, `$describable`, `$room`, `$player`, `$item`
