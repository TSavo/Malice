---
name: Malice Website Management
description: Use this skill when asked to "edit the website", "change a web page", "create a route", "modify web content", "update the site", "add a page", "fix the website", or when dealing with $webDomain, $webRoute, $domainRegistry, HTTP handlers, or web routing in Malice.
version: 1.0.0
---

# Website Management

## How to Find What You Need

**Primary doc:**
```javascript
await $docs.read('WEB-ROUTES');
```

**Search for specifics:**
```javascript
// Routing architecture
await $docs.search('web routing');
await $docs.search('domain registry');

// Handler patterns
await $docs.search('handleRequest');
await $docs.search('route handler');

// Creating routes
await $docs.search('create route');
await $docs.search('webRoute');
```

**Related docs:**
- `BUILDERS-GUIDE` - general content creation
- `moo-programming` - method syntax, object patterns

## Key Concepts (read docs for details)

- Website = MOO objects in MongoDB
- No source files - edit objects via `execute_moo_code`
- Changes are live immediately
- Key objects: `$domainRegistry`, `$webDomain`, `$webRoute`
