# Web Routes in Malice

This guide explains how to build web endpoints and pages using the MOO-based web routing system.

## Architecture Overview

```
HTTP Request → Web Server → $webSite.handleRequest()
                                    ↓
                           $webRouter.dispatch()
                                    ↓
                           Route.match() → Route.handleRequest()
```

**Key Objects:**
- `$webRoute` - Prototype for all route definitions
- `$webRouter` - Singleton that dispatches requests to routes
- `$webSite` - Main entry point, delegates to router then falls back to pages

## Creating a Route

### 1. Create Route Object

Routes inherit from `$webRoute` and define path, methods, and handler:

```javascript
// Create a new API route
const myRoute = await $recycler.create($webRoute, {
  name: 'My API Route',
  description: 'Returns some data',
  path: '/api/mydata',           // URL path
  methods: ['GET'],               // HTTP methods: GET, POST, PUT, DELETE
  contentType: 'application/json', // Response Content-Type
  requiresAuth: false,            // false, true, or 'admin'
});
```

### 2. Add Handler Method

The handler receives `(params, meta)` and returns a response:

```javascript
myRoute.setMethod('handleRequest', `
  const params = args[0] || {};  // URL params from :param or *
  const meta = args[1] || {};    // { query, isAdmin, player, ... }

  // Your logic here
  const data = { hello: 'world', time: Date.now() };

  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(data)
  };
`);
```

### 3. Register with Router

```javascript
await $.webRouter.register(myRoute);
```

## Route Properties

| Property | Type | Description |
|----------|------|-------------|
| `path` | string | URL pattern: `/api/users/:id`, `/docs/*` |
| `methods` | string[] | HTTP methods: `['GET']`, `['GET', 'POST']` |
| `contentType` | string | Response type: `application/json`, `text/html` |
| `requiresAuth` | boolean\|string | `false`, `true` (any auth), `'admin'` |
| `middleware` | string[] | Middleware names to run before handler |
| `handler` | string | Handler method name (default: `handleRequest`) |

## Path Patterns

### Static Paths
```javascript
path: '/api/status'        // Matches exactly /api/status
```

### URL Parameters
```javascript
path: '/api/users/:id'     // :id captured as params.id
path: '/api/:type/:id'     // Multiple params

// In handler:
const userId = params.id;
```

### Wildcards
```javascript
path: '/docs/*'            // * matches rest of path

// /docs/guide/intro → params['*'] = 'guide/intro'
```

## Handler Response Formats

### Full Response Object
```javascript
return {
  status: 200,              // HTTP status code
  contentType: 'text/html', // Overrides route contentType
  body: '<h1>Hello</h1>',   // Response body
  headers: { 'X-Custom': 'value' }  // Optional headers
};
```

### Simple Return (uses route contentType)
```javascript
return { data: [1, 2, 3] };  // Auto-stringified as JSON
return '<html>...</html>';   // Returned as-is for text/html
```

### Error Responses
```javascript
if (!found) {
  return { status: 404, body: JSON.stringify({ error: 'Not found' }) };
}
```

## Query String Access

Query parameters are in `meta.query`:

```javascript
// Request: /api/rooms?z_min=0&limit=10

myRoute.setMethod('handleRequest', `
  const meta = args[1] || {};
  const zMin = parseInt(meta.query?.z_min) || 0;
  const limit = parseInt(meta.query?.limit) || 100;

  // Use zMin, limit...
`);
```

## Authentication

### Public Routes
```javascript
requiresAuth: false  // Anyone can access
```

### Authenticated Routes
```javascript
requiresAuth: true   // Requires logged-in player

// In handler:
const player = meta.player;  // Player object or null
```

### Admin Routes
```javascript
requiresAuth: 'admin'  // Requires admin privileges

// In handler:
const isAdmin = meta.isAdmin;  // true/false
```

## HTML Pages

For pages, return full HTML:

```javascript
const pageRoute = await $recycler.create($webRoute, {
  name: 'Dashboard Page',
  path: '/dashboard',
  methods: ['GET'],
  contentType: 'text/html',
  requiresAuth: true,
});

pageRoute.setMethod('handleRequest', `
  const player = args[1]?.player;

  return {
    status: 200,
    contentType: 'text/html',
    body: \\\`<!DOCTYPE html>
<html>
<head><title>Dashboard</title></head>
<body>
  <h1>Welcome, \\\${player?.name || 'Guest'}</h1>
</body>
</html>\\\`
  };
`);
```

## Dynamic Config via Props

Store config in route properties for runtime tweaking:

```javascript
const mapRoute = await $recycler.create($webRoute, {
  path: '/map',
  methods: ['GET'],
  contentType: 'text/html',
  // Custom props
  roomColor: 0x00ff44,
  roomOpacity: 0.7,
  blockSize: 1.8,
});

mapRoute.setMethod('handleRequest', `
  // Read config from self
  const color = self.roomColor || 0x00ff00;
  const opacity = self.roomOpacity || 0.5;

  // Inject into HTML template
  const html = \\\`<script>
    const CONFIG = { color: \\\${color}, opacity: \\\${opacity} };
  </script>\\\`;

  return { status: 200, body: html };
`);

// Later, tweak without rebuild:
$.mapRoute.roomOpacity = 0.9;
```

## Middleware

Middleware runs before the handler:

```javascript
// Register middleware on router
await $.webRouter.addMiddleware('logRequest', 'logMiddleware');

// Add middleware to route
myRoute.middleware = ['logRequest'];

// Implement middleware method on route
myRoute.setMethod('logMiddleware', `
  const path = args[0];
  const method = args[1];
  console.log('[Request]', method, path);

  return null;  // Continue to next middleware/handler
  // Or return { status: 403, body: 'Forbidden' } to short-circuit
`);
```

## Complete Example: JSON API

```javascript
// Create route for player stats
const statsRoute = await $recycler.create($webRoute, {
  name: 'Player Stats API',
  path: '/api/players/:id/stats',
  methods: ['GET'],
  contentType: 'application/json',
  requiresAuth: true,
});

statsRoute.setMethod('handleRequest', `
  const params = args[0];
  const meta = args[1];

  // Get player ID from URL
  const playerId = parseInt(params.id);
  if (isNaN(playerId)) {
    return { status: 400, body: JSON.stringify({ error: 'Invalid player ID' }) };
  }

  // Load player
  const player = await $load(playerId);
  if (!player) {
    return { status: 404, body: JSON.stringify({ error: 'Player not found' }) };
  }

  // Check authorization
  if (!meta.isAdmin && meta.player?.id !== playerId) {
    return { status: 403, body: JSON.stringify({ error: 'Not authorized' }) };
  }

  // Return stats
  return {
    status: 200,
    body: JSON.stringify({
      id: player.id,
      name: player.name,
      hp: player.hp,
      location: player.location?.name,
    })
  };
`);

// Register with router
await $.webRouter.register(statsRoute);

// Add alias for easy access
await $.addAlias('statsRoute', statsRoute.id);
```

## Debugging Routes

Check registered routes:
```javascript
const routes = $.webRouter.routes;  // Array of route IDs
for (const id of routes) {
  const r = await $load(id);
  console.log(r.path, r.methods);
}
```

Test dispatch manually:
```javascript
const result = await $.webRouter.dispatch('/api/status', 'GET', {});
console.log(result);
```
