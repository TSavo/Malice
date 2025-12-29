# Web Routing in Malice

This guide explains the multi-domain web routing system.

## Architecture Overview

```
HTTP Request → web-server.ts → $domainRegistry.handleRequest()
                                       ↓
                              findDomain(hostname)
                                       ↓
                              $webDomain.handleRequest()
                                       ↓
                              resolve(path segments)
                                       ↓
                              $webRoute.handleRequest()
```

**Key Objects:**

| Object | Purpose |
|--------|---------|
| `$webNode` | Base prototype for segment-tree matching |
| `$webDomain` | Domain/subdomain node (inherits $webNode) |
| `$webRoute` | Path route node (inherits $webNode) |
| `$domainRegistry` | Central domain manager, entry point for requests |

**Built-in Domain:**
- `thecontinuum.city` - Pluribus's citizenship recruitment site (also serves as default for localhost)

## How It Works

### Segment Trees

Both domains and routes use the same tree structure (`$webNode`):

```
Domain Tree (hostname, right-to-left):
  thecontinuum.city
    ├── www (alias → parent)
    ├── api (API subdomain)
    └── * (wildcard → player profiles)

Route Tree (path, left-to-right):
  / (root)
    ├── api
    │   ├── status
    │   └── news
    ├── docs
    │   └── * (wildcard → doc name)
    └── play
```

### Wildcard Matching

The `*` segment matches anything and captures the value:

```javascript
// Subdomain wildcard: kevin.thecontinuum.city
// → domain.match = 'kevin'

// Path wildcard: /docs/PLAYER-GUIDE
// → route.match = 'PLAYER-GUIDE'
```

## Creating a New Domain

### 1. Create Domain Object

```javascript
const myDomain = await $recycler.create($webDomain, {
  name: 'My Site',
  description: 'A custom website',
  segment: 'example.com',
});
```

### 2. Create Route Tree

```javascript
// Root route
const rootRoute = await $recycler.create($webRoute, {
  name: 'Homepage',
  segment: '',  // Empty = root
  methods: ['GET'],
  contentType: 'text/html',
});

rootRoute.setMethod('handleRequest', `
  const meta = args[0] || {};
  return {
    status: 200,
    contentType: 'text/html',
    body: '<html><body><h1>Welcome</h1></body></html>'
  };
`);

// Set as domain's route tree
myDomain.rootRoute = rootRoute;
```

### 3. Add Child Routes

```javascript
// /api route
const apiRoute = await $recycler.create($webRoute, {
  parent: rootRoute,  // Child of root
  name: 'API',
  segment: 'api',
  methods: ['GET'],
  contentType: 'application/json',
});

// /api/data route
const dataRoute = await $recycler.create($webRoute, {
  parent: apiRoute,  // Child of /api
  name: 'Data API',
  segment: 'data',
  methods: ['GET'],
  contentType: 'application/json',
});

dataRoute.setMethod('handleRequest', `
  return { status: 200, body: JSON.stringify({ hello: 'world' }) };
`);
```

### 4. Register with Registry

```javascript
await $.domainRegistry.register(myDomain);

// Optionally set as default (handles unknown hosts)
await $.domainRegistry.setDefault(myDomain);
```

## Creating Subdomains

Subdomains are child `$webDomain` objects:

```javascript
// api.example.com
const apiSubdomain = await $recycler.create($webDomain, {
  parent: myDomain,  // Child of example.com
  name: 'API Subdomain',
  segment: 'api',
});

// www.example.com (alias to parent)
const wwwSubdomain = await $recycler.create($webDomain, {
  parent: myDomain,
  name: 'WWW Alias',
  segment: 'www',
  aliasOf: myDomain,  // Delegates to parent
});

// *.example.com (wildcard for user profiles)
const userSubdomain = await $recycler.create($webDomain, {
  parent: myDomain,
  name: 'User Subdomain',
  segment: '*',  // Wildcard
});

userSubdomain.setMethod('handleRequest', `
  const playerName = self.match;  // Captured from wildcard
  const path = args[0];
  const meta = args[2];
  
  // Look up player
  const player = await $query()
    .parent($player)
    .prop('playername').equals(playerName.toLowerCase())
    .first();
  
  if (!player) {
    return { status: 404, body: 'User not found' };
  }
  
  return {
    status: 200,
    contentType: 'text/html',
    body: '<h1>' + player.name + '</h1>'
  };
`);
```

## Route Properties

| Property | Type | Description |
|----------|------|-------------|
| `segment` | string | Path segment to match (empty for root, `*` for wildcard) |
| `methods` | string[] | HTTP methods: `['GET']`, `['GET', 'POST']` |
| `contentType` | string | Response type: `application/json`, `text/html` |
| `requiresAuth` | boolean\|string | `false`, `true` (any auth), `'admin'` |
| `handler` | string | Handler method name (default: `handleRequest`) |
| `match` | string | Captured value when this is a wildcard route |

## Handler Response Format

```javascript
return {
  status: 200,              // HTTP status code
  contentType: 'text/html', // Response Content-Type
  body: '<h1>Hello</h1>',   // Response body (string)
  headers: {                // Optional headers
    'X-Custom': 'value'
  }
};
```

## Meta Object

The `meta` object passed to handlers contains:

```javascript
{
  hostname: 'example.com',
  method: 'GET',
  headers: { ... },
  query: { key: 'value' },  // Parsed query string
  player: RuntimeObject,    // Authenticated player or null
  isAdmin: boolean,
  domain: $webDomain,       // The matched domain
  domainCaptures: string[], // Captured wildcard values from domain
  pathCaptures: string[],   // Captured wildcard values from path
}
```

## Authentication

### Public Routes
```javascript
requiresAuth: false  // Default - anyone can access
```

### Authenticated Routes
```javascript
requiresAuth: true   // Requires HTTP Basic Auth
```

### Admin Routes
```javascript
requiresAuth: 'admin'  // Requires admin privileges
```

Authentication is checked via the route's `checkAuth` method (inherited from `$webRoute`).

## Example: Complete API

```javascript
// Create domain
const apiDomain = await $recycler.create($webDomain, {
  name: 'API Domain',
  segment: 'api.example.com',
});

// Root route
const root = await $recycler.create($webRoute, {
  name: 'API Root',
  segment: '',
  methods: ['GET'],
});
apiDomain.rootRoute = root;

// /health endpoint
const health = await $recycler.create($webRoute, {
  parent: root,
  name: 'Health Check',
  segment: 'health',
  methods: ['GET'],
  contentType: 'application/json',
});

health.setMethod('handleRequest', `
  return {
    status: 200,
    body: JSON.stringify({ status: 'ok', timestamp: Date.now() })
  };
`);

// /users/:id endpoint (wildcard)
const users = await $recycler.create($webRoute, {
  parent: root,
  name: 'Users',
  segment: 'users',
  methods: ['GET'],
});

const userById = await $recycler.create($webRoute, {
  parent: users,
  name: 'User by ID',
  segment: '*',  // Captures user ID
  methods: ['GET'],
  contentType: 'application/json',
  requiresAuth: true,
});

userById.setMethod('handleRequest', `
  const userId = parseInt(self.match);
  const meta = args[0];
  
  const user = await $load(userId);
  if (!user) {
    return { status: 404, body: JSON.stringify({ error: 'Not found' }) };
  }
  
  return {
    status: 200,
    body: JSON.stringify({ id: user.id, name: user.name })
  };
`);

// Register
await $.domainRegistry.register(apiDomain);
```

## Debugging

### List Registered Domains
```javascript
const domains = await $.domainRegistry.list();
console.log(domains);
// [{ id: 236, segment: 'thecontinuum.city', name: 'The Continuum' }]
```

### Describe Registry
```javascript
const desc = await $.domainRegistry.describe();
console.log(desc);
// Domain Registry
// ================
// Default: thecontinuum.city
// Domains:
//   - thecontinuum.city (#236)
//     - www (#237)
//     - * (#238)
```

### Print Route Tree
```javascript
const domain = await $.continuumDomain;
const tree = await domain.rootRoute.printTree();
console.log(tree);
// (root)
//   api
//     status
//     news
//   docs
//     *
//   play
```

### Test Domain Resolution
```javascript
const match = await $.domainRegistry.findDomain('kevin.thecontinuum.city');
console.log(match.domain.segment);  // '*'
console.log(match.captures);        // ['kevin']
```

## Legacy Routing

The old `$webRouter` and `$webSite` objects still exist for backwards compatibility. If the new domain routing returns 404 or isn't configured, requests fall back to the legacy system.

To migrate a legacy route:
1. Create equivalent `$webRoute` in the new tree structure
2. Remove from `$.webRouter.routes`
3. Test both paths work
