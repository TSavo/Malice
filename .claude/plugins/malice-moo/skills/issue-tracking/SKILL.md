---
name: Issue Tracking
description: Use this skill when asked to "file a bug", "create an issue", "report a problem", "track a bug", "check issue status", "list issues", or when using $issues for bug tracking in Malice.
version: 1.0.0
---

# Issue Tracking

## Creating Issues

```javascript
await $issues.create({
  title: 'Brief description',
  body: 'Details, steps to reproduce, expected vs actual',
  labels: ['bug'],  // or 'feature', 'investigation'
  reporter: 'Charon'
});
```

## Searching Issues

```javascript
const open = await $issues.query({ status: 'open' });
const matches = await $issues.query({ search: 'keyword' });
```

## Updating Issues

```javascript
await $issues.update(issueId, { status: 'closed' });
await $issues.comment(issueId, { author: 'Charon', body: 'Note...' });
```

## Labels

- `bug` - Something broken
- `feature` - Enhancement request
- `investigation` - Needs research
- `cheating` - Suspected cheater

Check for duplicates before creating. Add comments to existing issues when possible.
