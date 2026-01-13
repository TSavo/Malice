---
name: Query Objects
description: Use this skill when asked to "find objects", "search for", "query objects", "list all", "get objects where", or when using $query to locate objects in Malice.
version: 1.0.0
---

# Query Objects

For query documentation, read from $docs:

```javascript
const content = await $docs.read('moo-programming');
// Search for the $query section
```

Or search:

```javascript
const results = await $docs.search('query');
```

Quick reference:
- `$query().parent($room).all()` - all rooms
- `$query().prop('name').contains('Tower').all()` - by property
- `.first()` for single result, `.count()` for count
