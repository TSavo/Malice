# $issues - Issue Tracker

Use `$issues` for in-game bug tracking, feature requests, and task management.

## Purpose

The `$issues` singleton provides a lightweight issue tracking system stored directly in the MOO database. Issues can be created, updated, commented on, and resolved without external tooling.

## Why Use This?

**Bad: External issue tracking**
```javascript
// Issues in GitHub, but game state in MOO
// Context lost, can't reference objects directly
// AI can't see or update issues
```

**Good: In-game issue tracking**
```javascript
// Create issue with object reference
await $issues.create({
  title: 'Exit command not working in basement',
  type: 'bug',
  priority: 'high',
  relatedObject: 42  // Direct object ID reference
});

// AI auto-fixer can see and attempt fixes
await $autoFixer.tick();
```

## What $issues Handles

- ✅ Bug reports with priority and type classification
- ✅ Feature requests and task tracking
- ✅ Comments and status updates
- ✅ Assignment and tagging
- ✅ Search and filtering
- ✅ Integration with $autoFixer for automatic bug fixing

## Issue Lifecycle

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│  [open] ──→ [in_progress] ──→ [resolved] ──→ [closed]        │
│     │              │              │                           │
│     │              │              └──→ [reopened] ──→ ...     │
│     │              │                                          │
│     └──────────────┴──────────────→ [wontfix]                │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

**Statuses:**
| Status | Description |
|--------|-------------|
| `open` | New issue, not yet being worked on |
| `in_progress` | Actively being worked on |
| `resolved` | Fix applied, pending verification |
| `closed` | Verified fixed and complete |
| `wontfix` | Intentionally not fixing |

## API Reference

### create() - Create Issue

```javascript
await $issues.create(options)
```

Creates a new issue.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `title` | string | Yes | Issue title/summary |
| `body` | string | No | Detailed description |
| `type` | string | No | `'bug'`, `'feature'`, `'task'`, `'question'` (default: `'bug'`) |
| `priority` | string | No | `'low'`, `'medium'`, `'high'`, `'critical'` (default: `'medium'`) |
| `tags` | string[] | No | Array of tags for categorization |
| `reporter` | string | No | Username of reporter |
| `relatedObject` | number | No | ID of related MOO object |

**Returns:** `{ success: true, id: number, issue: object }`

**Examples:**
```javascript
// Bug report
const result = await $issues.create({
  title: 'Exit command not working in basement',
  body: 'When trying to go north from basement (#42), nothing happens',
  type: 'bug',
  priority: 'high',
  tags: ['rooms', 'exits'],
  reporter: 'alice',
  relatedObject: 42
});

// Feature request
await $issues.create({
  title: 'Add voice chat support',
  body: 'Players want to talk to each other in real-time',
  type: 'feature',
  priority: 'low',
  tags: ['audio', 'social']
});

// Task
await $issues.create({
  title: 'Review NPC dialogue in tutorial',
  type: 'task',
  priority: 'medium',
  tags: ['content', 'tutorial']
});
```

### get() - Get Issue

```javascript
await $issues.get(id)
```

Retrieves a specific issue by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |

**Returns:** Issue object or `null`

**Examples:**
```javascript
const issue = await $issues.get(42);
console.log(issue.title);
console.log(issue.status);
console.log(issue.comments);
```

### list() - List Issues

```javascript
await $issues.list(filters?)
```

Lists issues with optional filtering.

| Filter | Type | Description |
|--------|------|-------------|
| `status` | string | Filter by status |
| `type` | string | Filter by type |
| `priority` | string | Filter by priority |
| `assignee` | string | Filter by assignee |
| `tag` | string | Filter by tag |
| `all` | boolean | Include closed issues (default: `false`) |

**Returns:** Array of issue objects

**Examples:**
```javascript
// List open issues (default)
const issues = await $issues.list();

// Filter by status
const inProgress = await $issues.list({ status: 'in_progress' });

// Filter by type and priority
const criticalBugs = await $issues.list({
  type: 'bug',
  priority: 'critical'
});

// Filter by assignee
const myIssues = await $issues.list({ assignee: 'alice' });

// Filter by tag
const roomIssues = await $issues.list({ tag: 'rooms' });

// Include closed issues
const allIssues = await $issues.list({ all: true });
```

### search() - Search Issues

```javascript
await $issues.search(query)
```

Searches issue titles and bodies for matching text.

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Search text (case-insensitive) |

**Returns:** Array of matching issues

**Examples:**
```javascript
const results = await $issues.search('exit');
const results = await $issues.search('NPC dialogue');
```

### update() - Update Issue

```javascript
await $issues.update(id, updates)
```

Updates an issue's properties.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |
| `updates.title` | string | New title |
| `updates.body` | string | New body |
| `updates.status` | string | New status |
| `updates.priority` | string | New priority |
| `updates.type` | string | New type |

**Examples:**
```javascript
// Update priority
await $issues.update(42, { priority: 'critical' });

// Update status
await $issues.update(42, { status: 'in_progress' });

// Update multiple fields
await $issues.update(42, {
  priority: 'high',
  status: 'in_progress',
  body: 'Additional details: the exit exists but canAccess() fails'
});
```

### assign() - Assign Issue

```javascript
await $issues.assign(id, assignee)
```

Assigns an issue to someone.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |
| `assignee` | string | Username to assign |

**Examples:**
```javascript
await $issues.assign(42, 'bob');
await $issues.assign(42, null);  // Unassign
```

### comment() - Add Comment

```javascript
await $issues.comment(id, text, author?)
```

Adds a comment to an issue.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |
| `text` | string | Comment text |
| `author` | string | Comment author (optional) |

**Examples:**
```javascript
// Add a comment
await $issues.comment(42, 'Found the root cause - bad exit link', 'alice');

// System-generated comment
await $issues.comment(42, 'Auto-fixer attempted repair');
```

### tag() / untag() - Manage Tags

```javascript
await $issues.tag(id, ...tags)
await $issues.untag(id, ...tags)
```

Adds or removes tags from an issue.

**Examples:**
```javascript
// Add tags
await $issues.tag(42, 'urgent', 'blocking');

// Remove tags
await $issues.untag(42, 'low-priority');
```

### resolve() - Resolve Issue

```javascript
await $issues.resolve(id, resolution?)
```

Marks an issue as resolved with optional explanation.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |
| `resolution` | string | Optional resolution message |

**Examples:**
```javascript
await $issues.resolve(42, 'Fixed in commit abc123');
await $issues.resolve(42, 'Exit link was pointing to recycled room');
```

### close() / reopen() - Status Changes

```javascript
await $issues.close(id)
await $issues.reopen(id)
```

Closes a resolved issue or reopens a closed one.

**Examples:**
```javascript
// Close after verification
await $issues.close(42);

// Reopen if problem recurs
await $issues.reopen(42);
```

### wontfix() - Won't Fix

```javascript
await $issues.wontfix(id, reason?)
```

Marks an issue as won't fix.

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Issue ID |
| `reason` | string | Optional reason |

**Examples:**
```javascript
await $issues.wontfix(42, 'Working as designed');
await $issues.wontfix(42, 'Duplicate of #38');
```

### stats() - Get Statistics

```javascript
await $issues.stats()
```

Returns issue statistics.

**Returns:**
```javascript
{
  total: 45,
  openCount: 12,
  byStatus: { open: 8, in_progress: 4, resolved: 20, closed: 13 },
  byType: { bug: 25, feature: 15, task: 5 },
  byPriority: { critical: 2, high: 10, medium: 20, low: 13 },
  createdThisWeek: 5,
  resolvedThisWeek: 8
}
```

### getTags() / getAssignees()

```javascript
await $issues.getTags()
await $issues.getAssignees()
```

Returns all tags/assignees currently in use.

**Examples:**
```javascript
const tags = await $issues.getTags();
// ['rooms', 'exits', 'npc', 'combat', ...]

const assignees = await $issues.getAssignees();
// ['alice', 'bob', 'claude', ...]
```

## Issue Object Structure

```javascript
{
  id: 42,
  title: 'Exit command not working in basement',
  body: 'Detailed description...',
  type: 'bug',
  status: 'open',
  priority: 'high',
  tags: ['rooms', 'exits'],
  reporter: 'alice',
  assignee: 'bob',
  relatedObject: 42,
  createdAt: '2026-01-10T12:00:00Z',
  updatedAt: '2026-01-10T14:30:00Z',
  resolvedAt: null,
  closedAt: null,
  resolution: null,
  comments: [
    {
      text: 'Looking into this',
      author: 'bob',
      timestamp: '2026-01-10T14:30:00Z'
    }
  ]
}
```

## Types and Priorities

**Types:**
| Type | Use For |
|------|---------|
| `bug` | Something is broken |
| `feature` | New functionality request |
| `task` | Work item that needs doing |
| `question` | Clarification needed |

**Priorities:**
| Priority | Description |
|----------|-------------|
| `critical` | System breaking, immediate attention |
| `high` | Important, affects gameplay |
| `medium` | Should be addressed soon |
| `low` | Nice to have, no rush |

## Integration with $autoFixer

The `$autoFixer` singleton automatically attempts to fix open issues:

```javascript
// $autoFixer runs hourly via $scheduler
// It picks high-priority issues and attempts AI-powered fixes

// Manual trigger
await $autoFixer.tick();

// Attempt fix on specific issue
await $autoFixer.attemptFix(42);

// Check auto-fixer history
const history = await $autoFixer.getFixHistory(10);
```

See [$autoFixer](../../reference/globals.md#autofixer) for full configuration.

## Real-World Examples

### Bug Report Workflow

```javascript
// 1. Player reports bug
await $issues.create({
  title: 'Cannot pick up item in dark room',
  body: 'The torch in room #123 cannot be picked up',
  type: 'bug',
  priority: 'medium',
  reporter: player.playername,
  relatedObject: 123
});

// 2. Developer investigates
await $issues.update(42, { status: 'in_progress' });
await $issues.assign(42, 'developer');
await $issues.comment(42, 'Investigating canContain() on player hands');

// 3. Fix applied
await $issues.comment(42, 'Fixed hand capacity check');
await $issues.resolve(42, 'Hand was at max weight, added error message');

// 4. Verified and closed
await $issues.close(42);
```

### Feature Request Tracking

```javascript
// Create feature request
await $issues.create({
  title: 'Add pet system',
  body: 'Players want companion animals that follow them',
  type: 'feature',
  priority: 'low',
  tags: ['enhancement', 'pets']
});

// Track progress
await $issues.update(15, { status: 'in_progress' });
await $issues.comment(15, 'Designed pet prototype hierarchy');
await $issues.comment(15, 'Implemented $pet with follow behavior');
await $issues.comment(15, 'Added feeding and happiness system');
await $issues.resolve(15, 'Pet system complete');
```

### Weekly Bug Review

```javascript
// Get stats for weekly review
const stats = await $issues.stats();
console.log(`Open: ${stats.openCount}`);
console.log(`Created this week: ${stats.createdThisWeek}`);
console.log(`Resolved this week: ${stats.resolvedThisWeek}`);

// List critical bugs
const critical = await $issues.list({ priority: 'critical' });
for (const bug of critical) {
  console.log(`#${bug.id}: ${bug.title}`);
}
```

### Bulk Tag Operations

```javascript
// Tag all room-related issues
const roomIssues = await $issues.search('room');
for (const issue of roomIssues) {
  await $issues.tag(issue.id, 'rooms');
}

// Find all issues with a tag
const tagged = await $issues.list({ tag: 'rooms' });
```

## Tips & Best Practices

1. **Use relatedObject** - Link issues to MOO objects for context
2. **Be specific in titles** - "Exit broken" vs "North exit from #42 returns wrong error"
3. **Add comments** - Document investigation progress
4. **Use priorities correctly** - Critical = breaking, Low = cosmetic
5. **Tag consistently** - Create a tag taxonomy and stick to it
6. **Close resolved issues** - Don't leave resolved issues hanging
7. **Search before creating** - Check for duplicates

## MCP Integration

Issues are queryable via MCP for AI assistants:

```javascript
// In execute_moo_code
const openBugs = await $issues.list({ type: 'bug', status: 'open' });
const myWork = await $issues.list({ assignee: 'claude' });
```

## See Also

- [$autoFixer](../../reference/globals.md#autofixer) - Automatic issue fixing
- [$docs](./docs.md) - Documentation system
- [Builders Guide](../../guides/BUILDERS-GUIDE.md) - Reporting builder issues
