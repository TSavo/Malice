---
name: Issue Tracking
description: Use this skill when asked to "file a bug", "create an issue", "report a problem", "track a bug", "check issue status", "list issues", or when using $issues for bug tracking in Malice.
version: 1.0.0
---

# Issue Tracking

## How to Find What You Need

**Search for $issues docs:**
```javascript
await $docs.search('issues');
await $docs.search('bug tracking');
await $docs.search('$issues');
```

**Related patterns:**
```javascript
await $docs.search('create issue');
await $docs.search('issue labels');
await $docs.search('issue query');
```

## Quick Reference

**Create:**
```javascript
await $issues.create({
  title: 'Brief description',
  body: 'Details...',
  labels: ['bug'],
  reporter: 'Charon'
});
```

**Search:**
```javascript
await $issues.list({ status: 'open' });
await $issues.search('keyword');
await $issues.list({ tag: 'bug' });
```

**Update:**
```javascript
await $issues.update(id, { status: 'closed' });
await $issues.comment(id, { author: 'Charon', body: 'Note' });
```

## Key Concepts (search docs for details)

- Labels: `bug`, `feature`, `investigation`, `cheating`
- Always check for duplicates before creating
- Add comments to existing issues when relevant
- Include reproduction steps for bugs
