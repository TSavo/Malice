---
name: Issue Tracking
description: Use this skill when asked to "file a bug", "create an issue", "report a problem", "track a bug", "check issue status", "list issues", or when using $issues for bug tracking in Malice.
version: 1.0.0
---

# Issue Tracking with $issues

## Overview

`$issues` is the in-game bug and feature tracking system. Create issues, search existing ones, update status, and track resolution.

## Creating Issues

```javascript
const issue = await $issues.create({
  title: 'Brief, specific description',
  body: `
## Description
What's happening.

## Steps to Reproduce
1. Do this
2. Then this
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.
  `,
  labels: ['bug'],  // or 'feature', 'investigation', 'cheating'
  reporter: 'Charon'  // or player name
});

return { success: true, issueId: issue.id };
```

## Searching Issues

```javascript
// Find open issues
const open = await $issues.query({ status: 'open' });

// Search by keyword
const matches = await $issues.query({ search: 'combat damage' });

// Filter by label
const bugs = await $issues.query({ labels: ['bug'] });

// Combined filters
const results = await $issues.query({
  status: 'open',
  labels: ['bug'],
  search: 'inventory'
});
```

## Reading an Issue

```javascript
const issue = await $issues.get(issueId);
return {
  id: issue.id,
  title: issue.title,
  body: issue.body,
  status: issue.status,
  labels: issue.labels,
  reporter: issue.reporter,
  created: issue.created,
  comments: issue.comments
};
```

## Updating Issues

```javascript
// Update status
await $issues.update(issueId, { status: 'closed' });

// Add label
await $issues.update(issueId, { 
  labels: [...existingLabels, 'confirmed'] 
});

// Add comment
await $issues.comment(issueId, {
  author: 'Charon',
  body: 'Investigated - this is working as designed.'
});
```

## Issue Labels

| Label | Use For |
|-------|---------|
| `bug` | Something broken |
| `feature` | Enhancement request |
| `investigation` | Needs more research |
| `cheating` | Suspected cheater |
| `confirmed` | Bug verified |
| `wontfix` | Intentional behavior |
| `duplicate` | Already reported |

## Issue Statuses

| Status | Meaning |
|--------|---------|
| `open` | New or in progress |
| `closed` | Resolved or rejected |

## Common Patterns

### Check Before Creating

```javascript
// Don't create duplicates
const existing = await $issues.query({ 
  search: 'specific keyword' 
});

if (existing.length > 0) {
  // Add comment to existing instead
  await $issues.comment(existing[0].id, {
    author: 'Charon',
    body: 'Additional report: ...'
  });
} else {
  // Create new
  await $issues.create({ ... });
}
```

### Bug Report Template

```javascript
await $issues.create({
  title: '[System] Specific problem description',
  body: `
## Reporter
${playerName} via Discord

## Description
${description}

## Evidence
${evidence || 'None provided'}

## Investigation Notes
- Checked X: result
- Checked Y: result
`,
  labels: ['bug', 'needs-verification'],
  reporter: 'Charon'
});
```

### Cheating Report Template

```javascript
await $issues.create({
  title: '[Investigation] Possible cheating: ' + playerName,
  body: `
## Accused
${playerName} (#${playerId})

## Allegation
${allegation}

## Evidence Gathered
${evidence}

## Conclusion
${conclusion || 'Pending investigation'}
`,
  labels: ['investigation', 'cheating'],
  reporter: 'Charon'
});
```

## When to Create Issues

- **Bug:** System not working as designed
- **Feature:** Reasonable enhancement request
- **Investigation:** Needs admin review (cheating, edge cases)

## When NOT to Create Issues

- Player complaints about fairness (game working as designed)
- Lore questions (tell them to find out IC)
- Requests for spawning/modifications (just say no)
- Duplicate reports (comment on existing)
