---
name: Malice Website Management
description: Use this skill when asked to "edit the website", "change a web page", "create a route", "modify web content", "update the site", "add a page", "fix the website", or when dealing with $webDomain, $webRoute, $domainRegistry, HTTP handlers, or web routing in Malice.
version: 1.0.0
---

# Malice Website Management

## Core Concept

**The website IS MOO objects.** There is no source code to edit. Routes are objects in MongoDB. You edit them directly via `execute_moo_code`. Changes are live immediately.

## Key Objects

| Object | Purpose |
|--------|---------|
| `$domainRegistry` | Central domain manager, entry point for requests |
| `$webDomain` | Domain/subdomain node (e.g., thecontinuum.city) |
| `$webRoute` | Path route node (e.g., /api/status) |
| `$continuumDomain` | The main Continuum site |
| `$cartelDomain` | Gray Cartel site |

## Common Tasks

### List All Domains

```javascript
const domains = await $.domainRegistry.list();
return domains;
// Returns: [{ id: 236, segment: 'thecontinuum.city', name: 'The Continuum' }, ...]
```

### View Route Tree

```javascript
const domain = await $load('continuumDomain');
const tree = await domain.rootRoute.printTree();
return tree;
// Returns visual tree of all routes
```

### Find a Route

```javascript
const domain = await $load('continuumDomain');
const root = domain.rootRoute;
const children = await root.getChildren();
return children.map(c => ({ 
  id: c.id, 
  segment: c.segment, 
  name: c.name 
}));
```

### Edit a Route Handler

```javascript
const route = await $load(routeId);

route.setMethod('handleRequest', `
  const meta = args[0];
  // meta contains: { method, path, query, headers, body, captures }
  
  return {
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>New Content</h1></body></html>'
  };
`);
// Done. Next request uses the new handler.
```

### Create a New Route

```javascript
// 1. Find the parent route
const domain = await $load('continuumDomain');
const parentRoute = domain.rootRoute; // or a child route

// 2. Create the new route
const newRoute = await $recycler.create($webRoute, {
  parent: parentRoute,
  name: 'My New Page',
  segment: 'newpage',  // URL will be /newpage
  methods: ['GET'],
  contentType: 'text/html'
});

// 3. Set the handler
newRoute.setMethod('handleRequest', `
  return {
    status: 200,
    contentType: 'text/html',
    body: '<h1>Hello World</h1>'
  };
`);
// Route is live immediately at /newpage
```

### Route Handler Response Format

```javascript
return {
  status: 200,                    // HTTP status code
  contentType: 'text/html',       // MIME type
  body: '<html>...</html>',       // Response body (string)
  headers: {                      // Optional additional headers
    'X-Custom': 'value'
  }
};
```

### Accessing Request Data

The `meta` object passed to `handleRequest` contains:

```javascript
const meta = args[0];
// meta.method   - 'GET', 'POST', etc.
// meta.path     - '/full/path'
// meta.query    - { key: 'value' } from query string
// meta.headers  - Request headers
// meta.body     - Request body (for POST/PUT)
// meta.captures - Wildcard captures from route matching
```

### Wildcard Routes

```javascript
// Create route with wildcard segment
const userRoute = await $recycler.create($webRoute, {
  parent: parentRoute,
  segment: '*',  // Matches anything
  name: 'User Profile'
});

userRoute.setMethod('handleRequest', `
  const meta = args[0];
  const username = meta.captures[0]; // Captured value
  
  // Look up user...
  return {
    status: 200,
    body: 'Profile for: ' + username
  };
`);
```

## Architecture

```
HTTP Request
    ↓
web-server.ts
    ↓
$domainRegistry.handleRequest()
    ↓
findDomain(hostname)  →  $webDomain
    ↓
resolve(path segments)  →  $webRoute
    ↓
route.handleRequest(meta)
    ↓
Response
```

## Important Notes

- **No restart needed.** Edit an object, it's live.
- **No source files.** The objects ARE the code.
- **Methods are strings.** Stored in MongoDB, compiled on execution.
- **Use $recycler.** Don't create objects manually.
