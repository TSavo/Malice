# Notes System Reference

The notes system (`$notes`) provides a simple way to attach metadata, comments, and tracking information to any object in the game. Notes are indexed by object ID and stored with timestamp, author, and tags.

## Overview

Notes are useful for:
- **Builder annotations** - Document special behavior or design decisions
- **Admin tracking** - Mark objects for review, debugging, or cleanup
- **Temporary data** - Store information that doesn't belong in properties
- **Cross-reference** - Track relationships without modifying objects

Unlike properties, notes:
- Don't require property definitions on prototypes
- Are centralized in `$notes` registry (not on individual objects)
- Can be searched by text, tag, or author
- Include automatic timestamps

## Adding Notes

### Basic Usage

```javascript
// Simple note
await $notes.add(object, 'This needs review');

// With author
await $notes.add(object, 'Fixed the verb handler', player);

// With tags
await $notes.add(object, 'Prototype for new weapon system', player, ['prototype', 'weapons']);

// Multiple tags
await $notes.add(object, 'Deprecated - use new version', 'admin', ['deprecated', 'cleanup']);
```

### Return Value

```javascript
const result = await $notes.add(object, 'Some note', 'builder', ['todo']);
// { success: true, index: 0 }
```

### Note Structure

Each note contains:

| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Note content |
| `author` | string | Who created the note (name or 'system') |
| `authorId` | number | Author's object ID (if object passed) |
| `timestamp` | string | ISO timestamp (auto-added) |
| `tags` | array | Array of tag strings |

## Retrieving Notes

### Get All Notes for an Object

```javascript
// Get all notes
const notes = await $notes.get(object);
// [
//   { text: '...', author: 'builder', timestamp: '2024-01-15T10:30:00Z', tags: ['todo'] },
//   { text: '...', author: 'admin', timestamp: '2024-01-16T14:20:00Z', tags: [] }
// ]

// Empty array if no notes
const empty = await $notes.get(objectWithNoNotes);
// []
```

### Get a Single Note

```javascript
// Get by index (0 = first note)
const note = await $notes.getOne(object, 0);
// { text: '...', author: 'builder', timestamp: '...', tags: [...] }

// Returns null if index doesn't exist
const missing = await $notes.getOne(object, 999);
// null
```

### Count Notes

```javascript
const count = await $notes.count(object);
// 5

const none = await $notes.count(objectWithNoNotes);
// 0
```

### Format for Display

```javascript
const formatted = await $notes.format(object);
// [0] 1/15/2024 10:30:00 AM by builder [todo]
//     This needs review
// [1] 1/16/2024 2:20:00 PM by admin [deprecated, cleanup]
//     Deprecated - use new version

// If no notes
const empty = await $notes.format(objectWithNoNotes);
// "No notes."
```

## Searching Notes

### Search by Text

```javascript
// Find all notes containing "weapon"
const results = await $notes.search('weapon');
// [
//   { objectId: 100, index: 0, note: {...} },
//   { objectId: 150, index: 2, note: {...} }
// ]

// Case-insensitive substring match
const results = await $notes.search('WEAPON');
// Same results as above
```

### Search by Tag

```javascript
// Find all notes tagged 'todo'
const todos = await $notes.search('', { tag: 'todo' });

// Find deprecated items
const deprecated = await $notes.search('', { tag: 'deprecated' });
```

### Search by Author

```javascript
// Find all notes by a specific builder
const builderNotes = await $notes.search('', { author: 'builder' });

// Find all admin notes
const adminNotes = await $notes.search('', { author: 'admin' });
```

### Combined Filters

```javascript
// Text + tag
const todoWeapons = await $notes.search('weapon', { tag: 'todo' });

// Text + author
const builderWeapons = await $notes.search('weapon', { author: 'builder' });

// Tag + author + limit
const adminTodos = await $notes.search('', {
  tag: 'todo',
  author: 'admin',
  limit: 10
});
```

### Search Options

| Option | Type | Description |
|--------|------|-------------|
| `tag` | string | Only return notes with this tag |
| `author` | string | Only return notes by this author |
| `limit` | number | Max results (default: 50) |

## Deleting Notes

### Delete by Index

```javascript
// Delete the first note
const result = await $notes.delete(object, 0);
// { success: true, deleted: { text: '...', author: '...', ... } }

// Index out of range
const failed = await $notes.delete(object, 999);
// { success: false, error: 'Note not found' }
```

### Clear All Notes

```javascript
// Remove all notes from an object
const result = await $notes.clear(object);
// { success: true, deleted: 5 }

// No notes to delete
const empty = await $notes.clear(objectWithNoNotes);
// { success: true, deleted: 0 }
```

## Finding Objects with Notes

```javascript
// List all objects that have notes
const objects = await $notes.listObjects();
// [
//   { objectId: 100, count: 3 },
//   { objectId: 150, count: 1 },
//   { objectId: 200, count: 7 }
// ]

// Use to find all tagged objects
const todoObjects = await $notes.search('', { tag: 'todo' });
const uniqueIds = [...new Set(todoObjects.map(r => r.objectId))];
// [100, 150, 200, ...]
```

## Common Patterns

### Mark for Review

```javascript
// Builder marks object for later review
await $notes.add(object, 'Check if this respects cooldown timer', player, ['review', 'behavior']);
```

### Deprecation Tracking

```javascript
// Mark old prototype as deprecated
await $notes.add(oldWeapon, 'Deprecated - use #1234 instead', 'admin', ['deprecated']);

// Find all deprecated objects
const deprecated = await $notes.search('', { tag: 'deprecated' });
```

### Temporary Admin Flags

```javascript
// Mark player for admin attention
await $notes.add(player, 'Possible exploit - investigate chat logs', 'security', ['investigate', 'urgent']);

// Find urgent issues
const urgent = await $notes.search('', { tag: 'urgent' });
```

### Build Progress Tracking

```javascript
// Track world building progress
await $notes.add(room, 'TODO: Add NPCs and interactive objects', 'worldbuilder', ['todo', 'needs-content']);

// Find incomplete areas
const incomplete = await $notes.search('', { tag: 'needs-content' });
```

### Debug Annotations

```javascript
// Document weird behavior
await $notes.add(object, 'Verb throws error when called during combat - needs fix', 'dev', ['bug', 'combat']);

// Find all bugs
const bugs = await $notes.search('', { tag: 'bug' });
```

### Builder Communication

```javascript
// Leave notes for other builders
await $notes.add(room, 'This connects to the new district - dont delete the north exit!', currentBuilder, ['important']);

// Check for important notes
const important = await $notes.search('', { tag: 'important' });
```

## Notes vs Properties

**Use Properties when:**
- Data is part of object's identity/state
- Data needs to persist with the object
- Data is accessed frequently in code
- Data follows a schema

**Use Notes when:**
- Temporary tracking/debugging
- Meta-information about the object
- No need to define property structure
- Cross-cutting concerns (review, cleanup, etc.)

## Example: Cleanup Workflow

```javascript
// 1. Mark old objects for cleanup
const oldRooms = await $.db.listAll();
for (const room of oldRooms) {
  if (room.properties.zone?.value === 'old_district') {
    await $notes.add(room._id, 'Part of old district - safe to recycle', 'admin', ['cleanup', 'old-district']);
  }
}

// 2. Review cleanup candidates
const toCleanup = await $notes.search('', { tag: 'cleanup' });
console.log(`Found ${toCleanup.length} objects marked for cleanup`);

// 3. Actually clean up
for (const result of toCleanup) {
  const obj = await $load(result.objectId);
  console.log(`Recycling #${obj.id}: ${obj.name}`);
  await $recycler.recycle(obj.id);
}

// 4. Notes automatically deleted when objects are recycled
```

## Example: Code Review System

```javascript
// Builder creates new verb
await object.setMethod('hackTerminal', `...complex code...`);
await $notes.add(object, 'New hackTerminal verb needs review', builder, ['review', 'verb']);

// Reviewer finds all pending reviews
const pending = await $notes.search('', { tag: 'review' });

// Reviewer approves
await $notes.delete(object, 0);  // Remove review note
await $notes.add(object, 'Reviewed and approved by senior builder', reviewer, ['approved']);
```

## Implementation Notes

- Notes are stored in `$notes.registry` as `{ objectId: [notes...] }`
- When objects are recycled, their notes remain until explicitly cleared
- No limit on number of notes per object
- Search results are limited to 50 by default (configurable)
- Accepts both object references and numeric IDs
- Author can be a string or RuntimeObject (auto-extracts name)

## See Also

- [AI/NPC System](./ai-npc.md) - NPC builder notes using `$notes`
- [Patterns](./patterns.md) - Common MOO coding patterns
- [Quick Reference](./quick-reference.md) - Utility system overview
