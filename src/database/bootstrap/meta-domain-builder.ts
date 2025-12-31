import type { RuntimeObject } from '../../../types/object';
import type { ObjectManager } from '../object-manager';
import { registerBuilder, type Builder } from './builder-registry';

/**
 * Builds the malice.world meta-domain
 *
 * This is the admin/meta website served directly on port 80.
 * Contains:
 * - /admin/* - Admin setup wizard and MOO editor
 * - /map/* - 3D world map visualization
 * - /api/map/* - Map API endpoints
 *
 * NOT registered with $domainRegistry - served directly by web-server.ts
 */
export class MetaDomainBuilder implements Builder {
  static provides = ['metaDomain'];
  static depends = ['webDomain', 'webRoute'];

  private domain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need dependencies
    if (!aliases.webDomain) {
      throw new Error('$webDomain must be built before MetaDomainBuilder');
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before MetaDomainBuilder');
    }

    const webDomain = await this.manager.load(aliases.webDomain);
    const webRoute = await this.manager.load(aliases.webRoute);

    if (!webDomain || !webRoute) {
      throw new Error('Failed to load dependencies');
    }

    // Check if already exists
    if (aliases.metaDomain) {
      this.domain = await this.manager.load(aliases.metaDomain);
      if (this.domain && !forceRebuild) return;
    }

    // Create the meta domain
    if (!this.domain) {
      this.domain = await this.manager.create({
        parent: webDomain,
        properties: {
          name: 'Malice Meta',
          description: 'Admin and meta website for malice.world',
          segment: 'malice.world',
        },
        methods: {},
      });
    }

    // Build route tree
    await this.buildRouteTree(webRoute);

    console.log('[MetaDomain] Built malice.world meta-domain');
  }

  /**
   * Helper to create a route and add it as a child of its parent in the tree.
   */
  private async createRoute(
    webRoute: RuntimeObject,
    parentNode: RuntimeObject | null,
    props: Record<string, unknown>,
  ): Promise<RuntimeObject> {
    const route = await this.manager.create({
      parent: webRoute,
      properties: {
        children: [], // Initialize empty children array
        ...props,
      },
      methods: {},
    });

    // Add to parent's children array
    if (parentNode) {
      await parentNode.call('addChild', route);
    }

    return route;
  }

  private async buildRouteTree(webRoute: RuntimeObject): Promise<void> {
    if (!this.domain) return;

    // Create root route for this domain
    const rootRoute = await this.createRoute(webRoute, null, {
      name: 'Meta Root Route',
      segment: '',
      methods: ['GET'],
      contentType: 'text/html',
    });

    // Set on domain
    this.domain.set('rootRoute', { type: 'objref', value: rootRoute.id });

    // Root route - redirect to /admin
    rootRoute.setMethod(
      'handleRequest',
      `
      return {
        status: 302,
        headers: { 'Location': '/admin' },
        body: ''
      };
    `,
    );

    // ========== API Routes ==========
    const apiRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'API Route',
      segment: 'api',
      methods: ['GET', 'POST'],
      contentType: 'application/json',
    });

    // /api/map/* routes
    const mapApiRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'Map API',
      segment: 'map',
      methods: ['GET'],
      contentType: 'application/json',
    });

    // /api/map/rooms
    const mapRoomsRoute = await this.createRoute(webRoute, mapApiRoute, {
      name: 'Map Rooms API',
      segment: 'rooms',
      methods: ['GET'],
    });
    mapRoomsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Get all rooms from $world
      const allRooms = await $world.getAllRooms();

      // Filter by z_min if provided
      const zMin = meta.query?.z_min;
      let rooms = allRooms;
      if (zMin !== undefined) {
        const zMinNum = parseInt(zMin);
        if (!isNaN(zMinNum)) {
          rooms = rooms.filter(r => r.z >= zMinNum);
        }
      }

      // Build a coordinate lookup for filtered rooms
      const coordLookup = new Map();
      for (const r of rooms) {
        coordLookup.set(r.x + ',' + r.y + ',' + r.z, true);
      }

      // Collect all exits (connections between rooms)
      const exits = [];
      const seenConnections = new Set();

      for (const room of rooms) {
        // Load the actual room object to get exits
        const roomObj = await $load(room.id);
        if (!roomObj || !roomObj.exits) continue;

        const roomExits = roomObj.exits;
        if (!Array.isArray(roomExits)) continue;

        for (const exit of roomExits) {
          if (!exit || !exit.destRoom) continue;

          const dest = exit.destRoom;
          if (!dest) continue;

          const destX = dest.x;
          const destY = dest.y;
          const destZ = dest.z;

          // Only include if destination is in our filtered set
          const destKey = destX + ',' + destY + ',' + destZ;
          if (!coordLookup.has(destKey)) continue;

          // Dedupe bidirectional connections
          const connKey = [
            room.x + ',' + room.y + ',' + room.z,
            destKey
          ].sort().join('|');

          if (seenConnections.has(connKey)) continue;
          seenConnections.add(connKey);

          exits.push({
            from: { x: room.x, y: room.y, z: room.z },
            to: { x: destX, y: destY, z: destZ }
          });
        }
      }

      // Return rooms and exits
      const filteredRooms = rooms.map(r => ({
        x: r.x,
        y: r.y,
        z: r.z,
        name: r.name
      }));

      return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rooms: filteredRooms, exits })
      };
    `,
    );

    // /api/map/players - heatmap
    const mapPlayersRoute = await this.createRoute(webRoute, mapApiRoute, {
      name: 'Map Players API',
      segment: 'players',
      methods: ['GET'],
      cachedHeatmap: null,
      cacheTimestamp: 0,
    });
    mapPlayersRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Check cache (30 seconds)
      const now = Date.now();
      const cacheAge = now - (self.cacheTimestamp || 0);
      if (cacheAge < 30000 && self.cachedHeatmap) {
        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            heatmap: self.cachedHeatmap,
            timestamp: self.cacheTimestamp,
            cached: true
          })
        };
      }

      // Get all connected players
      const connections = await $world.getAuthenticatedConnections();

      // Get all AI NPCs
      const npcIds = await $ai.getAll();

      // Collect positions
      const positions = [];

      // Add player positions
      for (const conn of connections) {
        try {
          const player = conn.player;
          if (!player || !player.location) continue;

          const loc = player.location;
          if (!loc) continue;

          const x = loc.x;
          const y = loc.y;
          const z = loc.z;

          if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            // Filter to z >= 0 only (above ground)
            if (z >= 0) {
              positions.push({ x, y, z });
            }
          }
        } catch (err) {
          console.error('[MapPlayers] Error getting player position:', err);
        }
      }

      // Add NPC positions
      for (const npcId of npcIds) {
        try {
          const npc = await $load(npcId);
          if (!npc || !npc.location) continue;

          const loc = npc.location;
          if (!loc) continue;

          const x = loc.x;
          const y = loc.y;
          const z = loc.z;

          if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            // Filter to z >= 0 only
            if (z >= 0) {
              positions.push({ x, y, z });
            }
          }
        } catch (err) {
          console.error('[MapPlayers] Error getting NPC position:', err);
        }
      }

      // Aggregate to 5x5 grid
      const gridSize = 5;
      const gridCounts = {};

      for (const pos of positions) {
        const gridX = Math.floor(pos.x / gridSize) * gridSize;
        const gridY = Math.floor(pos.y / gridSize) * gridSize;
        const gridZ = pos.z;
        const key = gridX + ',' + gridY + ',' + gridZ;

        gridCounts[key] = (gridCounts[key] || 0) + 1;
      }

      // Convert to array
      const heatmap = [];
      for (const [key, count] of Object.entries(gridCounts)) {
        const parts = key.split(',');
        heatmap.push({
          x: parseInt(parts[0]),
          y: parseInt(parts[1]),
          z: parseInt(parts[2]),
          count: count
        });
      }

      // Cache the result
      self.cachedHeatmap = heatmap;
      self.cacheTimestamp = now;

      return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          heatmap,
          timestamp: now,
          cached: false
        })
      };
    `,
    );

    // /api/map/players/admin - admin only, exact positions
    const mapPlayersAdminRoute = await this.createRoute(
      webRoute,
      mapPlayersRoute,
      {
        name: 'Map Players Admin API',
        segment: 'admin',
        methods: ['GET'],
        requiresAuth: 'admin',
      },
    );
    mapPlayersAdminRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Check admin auth
      if (!meta.isAdmin) {
        return {
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Admin access required' })
        };
      }

      // Get all connected players
      const connections = await $world.getAuthenticatedConnections();

      // Get all AI NPCs
      const npcIds = await $ai.getAll();

      const agents = [];

      // Add players
      for (const conn of connections) {
        try {
          const player = conn.player;
          if (!player || !player.location) continue;

          const loc = player.location;
          if (!loc) continue;

          const x = loc.x;
          const y = loc.y;
          const z = loc.z;

          if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            agents.push({
              id: player.id,
              name: player.name || 'Unknown',
              x,
              y,
              z,
              roomName: loc.name || '',
              isNPC: false
            });
          }
        } catch (err) {
          console.error('[MapPlayersAdmin] Error getting player position:', err);
        }
      }

      // Add NPCs
      for (const npcId of npcIds) {
        try {
          const npc = await $load(npcId);
          if (!npc || !npc.location) continue;

          const loc = npc.location;
          if (!loc) continue;

          const x = loc.x;
          const y = loc.y;
          const z = loc.z;

          if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
            agents.push({
              id: npc.id,
              name: npc.name || 'NPC',
              x,
              y,
              z,
              roomName: loc.name || '',
              isNPC: true
            });
          }
        } catch (err) {
          console.error('[MapPlayersAdmin] Error getting NPC position:', err);
        }
      }

      return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ agents })
      };
    `,
    );

    // ========== Map Page Routes ==========

    // /map route
    const mapRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Map Page',
      segment: 'map',
      methods: ['GET'],
      contentType: 'text/html',
    });
    mapRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Read the HTML file
      const fs = await import('fs');
      let html = '';
      try {
        html = fs.readFileSync('./world-map-3d.html', 'utf-8');
      } catch (err) {
        return {
          status: 500,
          contentType: 'text/html',
          body: '<h1>Error loading map</h1><p>' + err.message + '</p>'
        };
      }

      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `,
    );

    // /map/admin route
    const mapAdminRoute = await this.createRoute(webRoute, mapRoute, {
      name: 'Map Admin Page',
      segment: 'admin',
      methods: ['GET'],
      contentType: 'text/html',
      requiresAuth: 'admin',
    });
    mapAdminRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Check admin auth
      if (!meta.isAdmin) {
        return {
          status: 403,
          contentType: 'text/html',
          body: '<h1>Access Denied</h1><p>Admin access required.</p>'
        };
      }

      // Read the HTML file
      const fs = await import('fs');
      let html = '';
      try {
        html = fs.readFileSync('./world-map-3d.html', 'utf-8');
        // Inject admin mode
        html = html.replace('const isAdmin = false;', 'const isAdmin = true;');
      } catch (err) {
        return {
          status: 500,
          contentType: 'text/html',
          body: '<h1>Error loading map</h1><p>' + err.message + '</p>'
        };
      }

      return {
        status: 200,
        contentType: 'text/html',
        body: html
      };
    `,
    );

    // ========== Admin Routes ==========

    // /admin routes - require admin auth
    const adminRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Admin Route',
      segment: 'admin',
      methods: ['GET', 'POST'],
      requiresAuth: 'admin',
    });

    // /admin - Dashboard with links to all admin pages
    adminRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);

      if (!hasAdmins) {
        return {
          status: 302,
          headers: { 'Location': '/admin/setup' },
          body: ''
        };
      }

      if (!meta.isAdmin) {
        return {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Malice Admin"' },
          body: 'Authentication required'
        };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard - Malice</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { theme: { extend: { colors: { malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' } } } } }</script>
  <style>body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }</style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-malice-accent mb-8">Malice Admin</h1>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <a href="/admin/editor" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">Object Editor</div>
        <div class="text-malice-muted text-sm">Browse and edit MOO objects, methods, and properties</div>
      </a>
      <a href="/admin/scheduler" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">Scheduler</div>
        <div class="text-malice-muted text-sm">Manage periodic jobs and background tasks</div>
      </a>
      <a href="/admin/rooms" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">Room Editor</div>
        <div class="text-malice-muted text-sm">Visual room layout and exit management</div>
      </a>
      <a href="/admin/players" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">Player Editor</div>
        <div class="text-malice-muted text-sm">Manage player accounts, stats, and inventory</div>
      </a>
      <a href="/admin/ai" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">AI Dashboard</div>
        <div class="text-malice-muted text-sm">NPC registry, memories, and world log</div>
      </a>
      <a href="/admin/log" class="bg-malice-surface border border-gray-700 rounded-lg p-6 hover:border-malice-accent transition-colors">
        <div class="text-xl font-bold mb-2">Live Log</div>
        <div class="text-malice-muted text-sm">Real-time infrastructure and game event logs</div>
      </a>
    </div>
    <div class="mt-8 text-malice-muted text-sm">
      <a href="/map/admin" class="hover:text-malice-accent">3D Map</a> &middot;
      <a href="/admin/setup" class="hover:text-malice-accent">Setup Wizard</a>
    </div>
  </div>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/setup - Initial admin setup wizard
    const setupRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Admin Setup',
      segment: 'setup',
      methods: ['GET', 'POST'],
      contentType: 'text/html',
    });

    setupRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Check if setup is needed
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);

      // If admins exist, redirect to editor (setup complete)
      if (hasAdmins) {
        return {
          status: 302,
          headers: { 'Location': '/admin/editor' },
          body: ''
        };
      }

      // Handle POST - create admin user
      if (meta.method === 'POST') {
        try {
          const bodyStr = meta.body || '';
          const params = new URLSearchParams(bodyStr);
          const username = (params.get('username') || '').trim();
          const password = params.get('password') || '';
          const confirmPassword = params.get('confirmPassword') || '';

          // Validation
          const errors = [];
          if (!username || username.length < 3) {
            errors.push('Username must be at least 3 characters');
          }
          if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            errors.push('Username can only contain letters, numbers, and underscores');
          }
          if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters');
          }
          if (password !== confirmPassword) {
            errors.push('Passwords do not match');
          }

          // Check if username already exists
          if (username) {
            const existing = await $query().prop('playername').equals(username.toLowerCase()).first();
            if (existing) {
              errors.push('Username already exists');
            }
          }

          if (errors.length > 0) {
            return {
              status: 200,
              contentType: 'text/html',
              body: await self.renderSetupPage(errors, username)
            };
          }

          // Create the admin player
          const adminPlayer = await $recycler.create($admin, {
            name: username,
            playername: username.toLowerCase(),
            passwordHash: await $.hashPassword(password),
            chargenComplete: true,
          });

          // Place in start room
          const startRoom = $startRoom || await $query().prop('name').equals('S. Main St').first();
          if (startRoom) {
            await adminPlayer.moveTo(startRoom);
          }

          return {
            status: 200,
            contentType: 'text/html',
            body: await self.renderSuccessPage(username, adminPlayer.id)
          };

        } catch (err) {
          return {
            status: 200,
            contentType: 'text/html',
            body: await self.renderSetupPage(['Error: ' + (err.message || String(err))], '')
          };
        }
      }

      // GET - show setup form
      return {
        status: 200,
        contentType: 'text/html',
        body: await self.renderSetupPage([], '')
      };
    `,
    );

    // Helper method to render setup page
    setupRoute.setMethod(
      'renderSetupPage',
      `
      const errors = args[0] || [];
      const username = args[1] || '';

      const errorHtml = errors.length > 0
        ? '<div class="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6"><ul class="list-disc list-inside text-red-300">' +
          errors.map(e => '<li>' + e + '</li>').join('') +
          '</ul></div>'
        : '';

      return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-malice-bg text-gray-100 font-mono min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-malice-accent mb-2">Malice Setup</h1>
      <p class="text-malice-muted">Create your administrator account</p>
    </div>

    \${errorHtml}

    <form method="POST" class="bg-malice-surface rounded-lg p-6 space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-300 mb-2">Username</label>
        <input
          type="text"
          id="username"
          name="username"
          value="\${username}"
          required
          minlength="3"
          pattern="[a-zA-Z0-9_]+"
          class="w-full px-4 py-3 bg-malice-bg border border-malice-muted rounded-lg focus:border-malice-accent focus:outline-none text-gray-100"
          placeholder="admin"
        />
        <p class="text-xs text-malice-muted mt-1">Letters, numbers, and underscores only</p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minlength="6"
          class="w-full px-4 py-3 bg-malice-bg border border-malice-muted rounded-lg focus:border-malice-accent focus:outline-none text-gray-100"
          placeholder="Enter password"
        />
        <p class="text-xs text-malice-muted mt-1">Minimum 6 characters</p>
      </div>

      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          class="w-full px-4 py-3 bg-malice-bg border border-malice-muted rounded-lg focus:border-malice-accent focus:outline-none text-gray-100"
          placeholder="Confirm password"
        />
      </div>

      <button
        type="submit"
        class="w-full py-3 bg-malice-accent text-malice-bg font-bold rounded-lg hover:bg-green-400 transition-colors"
      >
        Create Admin Account
      </button>
    </form>

    <p class="text-center text-malice-muted text-sm mt-6">
      This account will have full administrative access to the MOO.
    </p>
  </div>
</body>
</html>\`;
    `,
    );

    // Helper method to render success page
    setupRoute.setMethod(
      'renderSuccessPage',
      `
      const username = args[0];
      const playerId = args[1];

      return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Setup Complete - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-malice-bg text-gray-100 font-mono min-h-screen flex items-center justify-center">
  <div class="w-full max-w-md p-8 text-center">
    <div class="mb-8">
      <div class="text-6xl mb-4">&#x2705;</div>
      <h1 class="text-3xl font-bold text-malice-accent mb-2">Setup Complete!</h1>
      <p class="text-gray-300">Administrator account created successfully.</p>
    </div>

    <div class="bg-malice-surface rounded-lg p-6 mb-6 text-left">
      <div class="flex justify-between py-2 border-b border-malice-muted">
        <span class="text-malice-muted">Username:</span>
        <span class="text-malice-accent">\${username}</span>
      </div>
      <div class="flex justify-between py-2">
        <span class="text-malice-muted">Player ID:</span>
        <span class="text-gray-300">#\${playerId}</span>
      </div>
    </div>

    <div class="space-y-3">
      <a
        href="/admin/editor"
        class="block w-full py-3 bg-malice-accent text-malice-bg font-bold rounded-lg hover:bg-green-400 transition-colors text-center"
      >
        Open MOO Editor
      </a>
    </div>

    <p class="text-malice-muted text-sm mt-6">
      Use your new credentials to log in via telnet, SSH, or the web client.
    </p>
  </div>
</body>
</html>\`;
    `,
    );

    // /admin/editor - MOO object editor
    const editorRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'MOO Editor',
      segment: 'editor',
      methods: ['GET'],
      contentType: 'text/html',
      requiresAuth: 'admin',
    });

    editorRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      // Check if there are any admin PLAYERS
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);

      // If no admins, redirect to setup
      if (!hasAdmins) {
        return {
          status: 302,
          headers: { 'Location': '/admin/setup' },
          body: ''
        };
      }

      // Require auth if admins exist
      if (!meta.isAdmin) {
        return {
          status: 401,
          headers: { 'WWW-Authenticate': 'Basic realm="Malice Admin"' },
          contentType: 'text/html',
          body: '<h1>Authentication Required</h1><p>Admin access only.</p>'
        };
      }

      const playerName = meta.player?.playername || 'admin';
      return {
        status: 200,
        contentType: 'text/html',
        body: await self.renderEditorPage(playerName)
      };
    `,
    );

    // Editor page renderer - HTML only, JS served separately
    editorRoute.setMethod(
      'renderEditorPage',
      `
      const playerName = args[0] || 'admin';
      return \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MOO Editor - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { mono: ['JetBrains Mono', 'monospace'] },
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
  <style>
    .CodeMirror { height: 100%; font-family: 'JetBrains Mono', monospace; font-size: 13px; background: #0a0a0a; }
    .CodeMirror-gutters { background: #0a0a0a; border-right: 1px solid #333; }
    .tree-item { cursor: pointer; padding: 4px 8px; border-radius: 4px; margin: 1px 0; }
    .tree-item:hover { background: #1f1f1f; }
    .tree-item.selected { background: #00ff8833; border-left: 2px solid #00ff88; }
    .prop-row { display: flex; padding: 6px 8px; border-bottom: 1px solid #1a1a1a; }
    .prop-row:hover { background: #1a1a1a; }
    .method-tab { padding: 6px 16px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
    .method-tab.active { border-bottom-color: #00ff88; color: #00ff88; background: #0a0a0a; }
    .method-tab:hover { background: #1a1a1a; }
    .scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
    .scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    .scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
    .panel { background: #141414; border: 1px solid #2a2a2a; border-radius: 6px; }
    .btn { padding: 6px 12px; border-radius: 4px; font-size: 13px; cursor: pointer; transition: all 0.15s; }
    .btn-primary { background: #00ff88; color: #000; font-weight: 500; }
    .btn-primary:hover { background: #00cc6a; }
    .btn-secondary { background: #2a2a2a; color: #ccc; }
    .btn-secondary:hover { background: #3a3a3a; }
    .btn-danger { background: #ff3366; color: #fff; }
    .btn-danger:hover { background: #cc2952; }
    .input { background: #0a0a0a; border: 1px solid #333; padding: 6px 10px; border-radius: 4px; color: #eee; }
    .input:focus { outline: none; border-color: #00ff88; }
  </style>
</head>
<body class="bg-malice-bg text-gray-200 font-mono h-screen flex flex-col overflow-hidden">
  <header class="bg-malice-surface border-b border-gray-800 px-4 py-2 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-malice-accent font-bold text-lg">MOO Editor</h1>
      <span class="text-malice-muted text-sm">|\${playerName}</span>
    </div>
    <div class="flex items-center gap-2">
      <input type="text" id="searchInput" placeholder="Search by name or #id..."
        class="input w-72" onkeydown="if(event.key==='Enter')searchObjects()">
      <button onclick="searchObjects()" class="btn btn-primary">Search</button>
    </div>
  </header>

  <main class="flex-1 flex overflow-hidden p-2 gap-2">
    <!-- Left Panel: Object Tree -->
    <div class="panel w-72 flex flex-col">
      <div class="p-2 border-b border-gray-800 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-400">Objects</span>
        <select id="treeRoot" onchange="loadTree()" class="input text-xs py-1">
          <option value="aliases">Aliases</option>
          <option value="rooms">Rooms</option>
          <option value="players">Players</option>
          <option value="items">Items</option>
        </select>
      </div>
      <div id="objectTree" class="flex-1 overflow-auto scrollbar p-2 text-sm"></div>
    </div>

    <!-- Middle Panel: Object Details -->
    <div class="panel flex-1 flex flex-col min-w-0">
      <div id="objectHeader" class="p-3 border-b border-gray-800">
        <div class="text-malice-muted text-sm">Select an object from the tree</div>
      </div>

      <!-- Properties Section -->
      <div class="border-b border-gray-800">
        <div class="p-2 bg-malice-surface flex items-center justify-between">
          <span class="text-sm font-medium text-gray-400">Properties</span>
          <button onclick="addProperty()" class="text-xs text-malice-accent hover:underline">+ Add</button>
        </div>
        <div id="propertiesPanel" class="max-h-48 overflow-auto scrollbar"></div>
      </div>

      <!-- Methods Section -->
      <div class="flex-1 flex flex-col min-h-0">
        <div class="p-2 bg-malice-surface flex items-center justify-between">
          <span class="text-sm font-medium text-gray-400">Methods</span>
          <button onclick="addMethod()" class="text-xs text-malice-accent hover:underline">+ Add</button>
        </div>
        <div id="methodTabs" class="flex border-b border-gray-800 overflow-x-auto scrollbar bg-malice-surface"></div>
        <div id="methodEditor" class="flex-1 relative"></div>
        <div id="methodActions" class="p-2 border-t border-gray-800 flex gap-2 hidden">
          <button onclick="saveMethod()" class="btn btn-primary">Save Method</button>
          <button onclick="deleteMethod()" class="btn btn-danger">Delete</button>
          <span id="methodStatus" class="text-sm text-malice-muted ml-auto"></span>
        </div>
      </div>
    </div>

    <!-- Right Panel: REPL -->
    <div class="panel w-80 flex flex-col">
      <div class="p-2 border-b border-gray-800">
        <span class="text-sm font-medium text-gray-400">Execute Code</span>
      </div>
      <div id="replOutput" class="flex-1 overflow-auto scrollbar p-2 text-xs font-mono bg-black/30"></div>
      <div class="p-2 border-t border-gray-800">
        <textarea id="replInput" rows="4" class="input w-full text-xs resize-none"
          placeholder="// MOO code here..."></textarea>
        <div class="flex gap-2 mt-2">
          <button onclick="executeCode()" class="btn btn-primary flex-1">Run</button>
          <button onclick="clearRepl()" class="btn btn-secondary">Clear</button>
        </div>
      </div>
    </div>
  </main>

  <script src="/admin/editor.js"></script>
</body>
</html>\`;
    `,
    );

    // /admin/editor.js - Editor JavaScript module
    const editorJsRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Editor JS',
      segment: 'editor.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    editorJsRoute.setMethod(
      'handleRequest',
      `
      return {
        status: 200,
        contentType: 'application/javascript',
        body: await self.getScript()
      };
    `,
    );

    editorJsRoute.setMethod(
      'getScript',
      `
      return \`
let currentObject = null;
let currentMethod = null;
let editor = null;
let dirty = false;

async function api(path, options = {}) {
  const res = await fetch('/admin/api' + path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  return res.json();
}

async function loadTree() {
  const root = document.getElementById('treeRoot').value;
  const data = await api('/tree?root=' + root);
  const tree = document.getElementById('objectTree');
  tree.innerHTML = data.items?.map(item =>
    '<div class="tree-item" onclick="selectObject(' + item.id + ')" data-id="' + item.id + '">' +
    '<span class="text-malice-muted">#' + item.id + '</span> ' + escapeHtml(item.name) + '</div>'
  ).join('') || '<div class="text-malice-muted p-2">No objects found</div>';
}

async function searchObjects() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return loadTree();
  const data = await api('/search?q=' + encodeURIComponent(q));
  const tree = document.getElementById('objectTree');
  tree.innerHTML = data.items?.map(item =>
    '<div class="tree-item" onclick="selectObject(' + item.id + ')" data-id="' + item.id + '">' +
    '<span class="text-malice-muted">#' + item.id + '</span> ' + escapeHtml(item.name) + '</div>'
  ).join('') || '<div class="text-malice-muted p-2">No results</div>';
}

async function selectObject(id) {
  if (dirty && !confirm('Unsaved changes. Continue?')) return;
  dirty = false;

  document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
  document.querySelector('.tree-item[data-id="' + id + '"]')?.classList.add('selected');

  const data = await api('/object/' + id);
  if (data.error) return alert(data.error);

  currentObject = data;
  renderObject(data);
}

function renderObject(obj) {
  document.getElementById('objectHeader').innerHTML =
    '<div class="flex items-center gap-3">' +
    '<span class="text-malice-accent font-bold">#' + obj.id + '</span>' +
    '<span class="text-lg">' + escapeHtml(obj.name || 'unnamed') + '</span>' +
    '<span class="text-malice-muted text-sm">parent: #' + (obj.parentId ?? 'none') + '</span>' +
    '</div>';

  const propsHtml = Object.entries(obj.properties || {}).map(([key, val]) => {
    const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
    return '<div class="prop-row">' +
      '<span class="w-32 text-malice-accent truncate">' + escapeHtml(key) + '</span>' +
      '<span class="flex-1 text-gray-400 truncate text-xs" title="' + escapeHtml(valStr) + '">' + escapeHtml(valStr.slice(0, 100)) + '</span>' +
      '<button onclick="editProperty(\\\\\\'' + escapeHtml(key) + '\\\\\\')" class="text-xs text-malice-muted hover:text-white ml-2">edit</button>' +
      '</div>';
  }).join('');
  document.getElementById('propertiesPanel').innerHTML = propsHtml || '<div class="p-3 text-malice-muted text-sm">No properties</div>';

  const methods = Object.keys(obj.methods || {});
  const tabsHtml = methods.map(name =>
    '<div class="method-tab" onclick="selectMethod(\\\\\\'' + escapeHtml(name) + '\\\\\\')" data-method="' + escapeHtml(name) + '">' +
    escapeHtml(name) + '</div>'
  ).join('');
  document.getElementById('methodTabs').innerHTML = tabsHtml || '<div class="p-2 text-malice-muted text-sm">No methods</div>';

  if (methods.length > 0) selectMethod(methods[0]);
  else {
    currentMethod = null;
    if (editor) editor.setValue('');
    document.getElementById('methodActions').classList.add('hidden');
  }
}

function selectMethod(name) {
  if (dirty && !confirm('Unsaved changes. Continue?')) return;
  dirty = false;

  currentMethod = name;
  document.querySelectorAll('.method-tab').forEach(el => el.classList.remove('active'));
  document.querySelector('.method-tab[data-method="' + name + '"]')?.classList.add('active');

  const code = currentObject.methods[name] || '';
  if (!editor) {
    editor = CodeMirror(document.getElementById('methodEditor'), {
      value: code,
      mode: 'javascript',
      theme: 'dracula',
      lineNumbers: true,
      tabSize: 2,
      indentWithTabs: false
    });
    editor.on('change', () => { dirty = true; document.getElementById('methodStatus').textContent = 'Modified'; });
  } else {
    editor.setValue(code);
  }
  dirty = false;
  document.getElementById('methodStatus').textContent = '';
  document.getElementById('methodActions').classList.remove('hidden');
}

async function saveMethod() {
  if (!currentObject || !currentMethod) return;
  const code = editor.getValue();
  const res = await api('/object/' + currentObject.id + '/method/' + currentMethod, {
    method: 'PUT',
    body: JSON.stringify({ code })
  });
  if (res.error) alert('Error: ' + res.error);
  else {
    dirty = false;
    document.getElementById('methodStatus').textContent = 'Saved!';
    setTimeout(() => document.getElementById('methodStatus').textContent = '', 2000);
  }
}

async function deleteMethod() {
  if (!currentObject || !currentMethod) return;
  if (!confirm('Delete method "' + currentMethod + '"?')) return;
  const res = await api('/object/' + currentObject.id + '/method/' + currentMethod, { method: 'DELETE' });
  if (res.error) alert('Error: ' + res.error);
  else selectObject(currentObject.id);
}

async function addMethod() {
  if (!currentObject) return alert('Select an object first');
  const name = prompt('Method name:');
  if (!name) return;
  const res = await api('/object/' + currentObject.id + '/method/' + name, {
    method: 'PUT',
    body: JSON.stringify({ code: '// ' + name + '\\\\nreturn null;' })
  });
  if (res.error) alert('Error: ' + res.error);
  else selectObject(currentObject.id);
}

async function editProperty(key) {
  if (!currentObject) return;
  const current = currentObject.properties[key];
  const valStr = typeof current === 'object' ? JSON.stringify(current, null, 2) : String(current);
  const newVal = prompt('Value for "' + key + '" (JSON):', valStr);
  if (newVal === null) return;
  try {
    const parsed = JSON.parse(newVal);
    const res = await api('/object/' + currentObject.id + '/property/' + key, {
      method: 'PUT',
      body: JSON.stringify({ value: parsed })
    });
    if (res.error) alert('Error: ' + res.error);
    else selectObject(currentObject.id);
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}

async function addProperty() {
  if (!currentObject) return alert('Select an object first');
  const name = prompt('Property name:');
  if (!name) return;
  const value = prompt('Value (JSON):', 'null');
  if (value === null) return;
  try {
    const parsed = JSON.parse(value);
    const res = await api('/object/' + currentObject.id + '/property/' + name, {
      method: 'PUT',
      body: JSON.stringify({ value: parsed })
    });
    if (res.error) alert('Error: ' + res.error);
    else selectObject(currentObject.id);
  } catch (e) {
    alert('Invalid JSON: ' + e.message);
  }
}

async function executeCode() {
  const code = document.getElementById('replInput').value;
  const output = document.getElementById('replOutput');
  output.innerHTML += '<div class="text-malice-accent mb-1">&gt; executing...</div>';

  try {
    const res = await api('/execute', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    const resultStr = typeof res.result === 'object' ? JSON.stringify(res.result, null, 2) : String(res.result ?? 'undefined');
    if (res.error) {
      output.innerHTML += '<div class="text-red-400 mb-2">' + escapeHtml(res.error) + '</div>';
    } else {
      output.innerHTML += '<div class="text-gray-300 mb-2 whitespace-pre-wrap">' + escapeHtml(resultStr) + '</div>';
    }
  } catch (e) {
    output.innerHTML += '<div class="text-red-400 mb-2">' + escapeHtml(e.message) + '</div>';
  }
  output.scrollTop = output.scrollHeight;
}

function clearRepl() {
  document.getElementById('replOutput').innerHTML = '';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Init
(async function() {
  await loadTree();
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (id) {
    await selectObject(parseInt(id));
    const el = document.querySelector('.tree-item[data-id="' + id + '"]');
    if (el) el.scrollIntoView({ block: 'center' });
  }
})();
\`;
    `,
    );

    // /admin/api - API endpoints for editor
    const adminApiRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Admin API',
      segment: 'api',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      contentType: 'application/json',
      requiresAuth: 'admin',
    });

    // /admin/api/tree - Get object tree
    const treeApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Tree API',
      segment: 'tree',
      methods: ['GET'],
    });

    treeApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      // Setup mode: allow access if no admin players exist
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const root = meta.query?.root || 'aliases';
      let items = [];

      try {
        if (root === 'aliases') {
          const aliases = $.system?.aliases || {};
          for (const [name, id] of Object.entries(aliases)) {
            if (typeof id !== 'number') continue; // Skip nested objects like bodyParts
            const obj = await $load(id);
            if (obj) {
              items.push({ id, name: name + ' (' + (obj.name || '') + ')' });
            }
          }
          items.sort((a, b) => a.name.localeCompare(b.name));
        } else if (root === 'prototypes') {
          const protos = await $query().prop('name').contains('').limit(100).all();
          items = protos.filter(p => {
            const name = (p.name || '').toLowerCase();
            return name.includes('prototype') || name.startsWith('$');
          }).map(p => ({ id: p.id, name: p.name }));
        } else if (root === 'rooms') {
          const rooms = await $query().parent($room).limit(100).all();
          items = rooms.map(r => ({ id: r.id, name: r.name || 'Room #' + r.id }));
        } else if (root === 'players') {
          const players = await $query().parent($player).limit(100).all();
          items = players.map(p => ({ id: p.id, name: p.name || p.playername || 'Player #' + p.id }));
        } else {
          const objs = await $query().limit(100).all();
          items = objs.map(o => ({ id: o.id, name: o.name || '#' + o.id }));
        }

        return { status: 200, body: JSON.stringify({ items }) };
      } catch (err) {
        return { status: 500, body: JSON.stringify({ error: String(err) }) };
      }
    `,
    );

    // /admin/api/search - Search objects
    const searchApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Search API',
      segment: 'search',
      methods: ['GET'],
    });

    searchApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const query = meta.query?.q || '';
      if (!query) {
        return { status: 200, body: JSON.stringify({ items: [] }) };
      }

      try {
        let items = [];

        // Search by ID
        if (query.match(/^#?\\d+$/)) {
          const id = parseInt(query.replace('#', ''));
          const obj = await $load(id);
          if (obj) {
            items.push({ id: obj.id, name: obj.name || '#' + obj.id });
          }
        } else {
          // Search by name
          const results = await $query().prop('name').contains(query).limit(50).all();
          items = results.map(o => ({ id: o.id, name: o.name || '#' + o.id }));

          // Also search aliases
          const aliases = $.system?.aliases || {};
          for (const [name, id] of Object.entries(aliases)) {
            if (typeof id !== 'number') continue;
            if (name.toLowerCase().includes(query.toLowerCase()) && !items.find(i => i.id === id)) {
              const obj = await $load(id);
              if (obj) {
                items.push({ id, name: name + ' (' + (obj.name || '') + ')' });
              }
            }
          }
        }

        return { status: 200, body: JSON.stringify({ items }) };
      } catch (err) {
        return { status: 500, body: JSON.stringify({ error: String(err) }) };
      }
    `,
    );

    // /admin/api/object/* - Object CRUD
    const objectApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Object API',
      segment: 'object',
      methods: ['GET', 'PUT', 'DELETE'],
    });

    // /admin/api/object/:id
    const objectByIdRoute = await this.createRoute(webRoute, objectApiRoute, {
      name: 'Object By ID',
      segment: '*',
      methods: ['GET', 'PUT', 'DELETE'],
    });

    objectByIdRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      // Parse path: could be just ID, or ID/method/name, or ID/property/name
      const pathParts = (self.match || '').split('/');
      const id = parseInt(pathParts[0]);
      const subResource = pathParts[1]; // 'method' or 'property'
      const resourceName = pathParts.slice(2).join('/');

      if (isNaN(id)) {
        return { status: 400, body: JSON.stringify({ error: 'Invalid object ID' }) };
      }

      try {
        const obj = await $load(id);
        if (!obj) {
          return { status: 404, body: JSON.stringify({ error: 'Object not found' }) };
        }

        // Handle sub-resources
        if (subResource === 'method' && resourceName) {
          if (meta.method === 'PUT') {
            // Parse body from raw request
            const bodyStr = meta.body || '{}';
            let body;
            try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

            obj.setMethod(resourceName, body.code || '');
            return { status: 200, body: JSON.stringify({ success: true }) };
          } else if (meta.method === 'DELETE') {
            obj.deleteMethod(resourceName);
            return { status: 200, body: JSON.stringify({ success: true }) };
          }
        }

        if (subResource === 'property' && resourceName) {
          if (meta.method === 'DELETE') {
            obj.delete(resourceName);
            return { status: 200, body: JSON.stringify({ success: true }) };
          }
        }

        // GET - return object details
        if (meta.method === 'GET') {
          const parent = obj.parent;
          const properties = {};
          const ownProps = obj.getOwnProperties ? obj.getOwnProperties() : {};

          for (const key of Object.keys(ownProps)) {
            const val = obj.get(key);
            properties[key] = val;
          }

          const methods = {};
          const ownMethods = obj.getOwnMethods ? obj.getOwnMethods() : {};
          for (const name of Object.keys(ownMethods)) {
            methods[name] = obj.getMethod(name);
          }

          // Get children (objects with this as parent)
          const children = await $query().parent(obj).limit(50).all();

          return {
            status: 200,
            body: JSON.stringify({
              id: obj.id,
              name: obj.name,
              parent: parent ? { id: parent.id, name: parent.name } : null,
              properties,
              methods,
              children: children.map(c => ({ id: c.id, name: c.name })),
            })
          };
        }

        // PUT - update object
        if (meta.method === 'PUT') {
          const bodyStr = meta.body || '{}';
          let body;
          try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

          if (body.properties) {
            for (const [key, value] of Object.entries(body.properties)) {
              obj.set(key, value);
            }
          }

          return { status: 200, body: JSON.stringify({ success: true }) };
        }

        return { status: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
      } catch (err) {
        return { status: 500, body: JSON.stringify({ error: String(err) }) };
      }
    `,
    );

    // /admin/api/execute - Execute MOO code
    const executeApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Execute API',
      segment: 'execute',
      methods: ['POST'],
    });

    executeApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const bodyStr = meta.body || '{}';
      let body;
      try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

      let code = body.code || '';
      if (!code) {
        return { status: 400, body: JSON.stringify({ error: 'No code provided' }) };
      }

      // Auto-return for simple expressions (REPL-like behavior)
      // Only if no return/const/let/var/if/for/while/function and no semicolons
      const trimmed = code.trim();
      const isStatement = /^(return|const|let|var|if|for|while|function|class|switch|try|throw)\\b/.test(trimmed);
      const hasMultipleStatements = trimmed.includes(';');
      if (!isStatement && !hasMultipleStatements && !trimmed.includes('\\n')) {
        code = 'return (' + code + ')';
      }

      try {
        // Use $mcp.execute for full MOO context (includes all $aliases)
        const mcp = $mcp;
        if (mcp && mcp.execute) {
          const playerId = meta.player?.id;
          const result = await mcp.execute(code, playerId);
          return { status: 200, body: JSON.stringify({ result }) };
        }

        // Fallback: basic execution without $aliases
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction('$', '$load', '$query', '$create', 'player', code);
        const result = await fn($, $load, $query, $create, meta.player);
        return { status: 200, body: JSON.stringify({ result }) };
      } catch (err) {
        return { status: 200, body: JSON.stringify({ error: String(err) }) };
      }
    `,
    );

    // ========== Scheduler Page ==========

    // /admin/scheduler - Scheduler management UI
    const schedulerRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Scheduler',
      segment: 'scheduler',
      methods: ['GET'],
      contentType: 'text/html',
    });

    schedulerRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: 'Unauthorized' };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>Scheduler - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
  <style>
    body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-malice-accent">Scheduler</h1>
      <div class="flex items-center gap-4">
        <span id="status" class="text-sm"></span>
        <button onclick="togglePause()" id="pauseBtn" class="px-4 py-2 bg-malice-surface border border-gray-700 rounded hover:border-malice-accent">
          Loading...
        </button>
        <a href="/admin/editor" class="text-malice-muted hover:text-malice-accent">Editor</a>
      </div>
    </div>

    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-gray-700">
          <th class="text-left p-3 text-malice-muted">Job Name</th>
          <th class="text-left p-3 text-malice-muted">Interval</th>
          <th class="text-left p-3 text-malice-muted">Next Run</th>
          <th class="text-left p-3 text-malice-muted">Target</th>
          <th class="text-left p-3 text-malice-muted">Actions</th>
        </tr>
      </thead>
      <tbody id="jobsTable">
        <tr><td colspan="5" class="p-3 text-malice-muted">Loading...</td></tr>
      </tbody>
    </table>
  </div>

  <script>
    async function api(path, options = {}) {
      const res = await fetch('/admin/api/scheduler' + path, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      return res.json();
    }

    function formatInterval(ms) {
      if (!ms) return 'one-shot';
      if (ms < 1000) return ms + 'ms';
      if (ms < 60000) return (ms / 1000) + 's';
      if (ms < 3600000) return (ms / 60000) + 'm';
      return (ms / 3600000) + 'h';
    }

    function formatNextRun(timestamp, paused) {
      if (paused) return '<span class="text-yellow-500">paused</span>';
      if (!timestamp) return 'never';
      const diff = timestamp - Date.now();
      if (diff <= 0) return '<span class="text-malice-accent">now</span>';
      if (diff < 60000) return 'in ' + Math.round(diff / 1000) + 's';
      if (diff < 3600000) return 'in ' + Math.round(diff / 60000) + 'm';
      return 'in ' + Math.round(diff / 3600000) + 'h';
    }

    let isPaused = false;

    async function loadJobs() {
      const data = await api('');
      isPaused = data.paused;

      document.getElementById('status').innerHTML = isPaused
        ? '<span class="text-yellow-500">● PAUSED</span>'
        : '<span class="text-malice-accent">● RUNNING</span>';
      document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';

      const tbody = document.getElementById('jobsTable');
      if (!data.jobs || data.jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-3 text-malice-muted">No jobs scheduled</td></tr>';
        return;
      }

      tbody.innerHTML = data.jobs.map(function(job) {
        return '<tr class="border-b border-gray-800 hover:bg-malice-surface">' +
          '<td class="p-3 font-mono">' + job.name + '</td>' +
          '<td class="p-3">' + formatInterval(job.interval) + '</td>' +
          '<td class="p-3">' + formatNextRun(job.nextRun, isPaused || !job.enabled) + '</td>' +
          '<td class="p-3 text-malice-muted">#' + job.targetId + '.' + job.method + '</td>' +
          '<td class="p-3">' +
            '<button onclick="runJob(\\'' + job.name + '\\')" class="px-2 py-1 bg-malice-accent text-black rounded text-sm mr-2" title="Run Now">▶</button>' +
            '<button onclick="toggleJob(\\'' + job.name + '\\', ' + !job.enabled + ')" class="px-2 py-1 bg-malice-surface border border-gray-700 rounded text-sm ' + (job.enabled ? '' : 'text-yellow-500') + '" title="' + (job.enabled ? 'Disable' : 'Enable') + '">' +
              (job.enabled ? '⏸' : '▶') +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    async function togglePause() {
      await api(isPaused ? '/resume' : '/pause', { method: 'POST' });
      loadJobs();
    }

    async function runJob(name) {
      await api('/' + encodeURIComponent(name) + '/run', { method: 'POST' });
      loadJobs();
    }

    async function toggleJob(name, enable) {
      await api('/' + encodeURIComponent(name) + '/enable', {
        method: 'POST',
        body: JSON.stringify({ enabled: enable })
      });
      loadJobs();
    }

    loadJobs();
    setInterval(loadJobs, 5000);
  </script>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/api/scheduler - List all jobs
    const schedulerApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Scheduler API',
      segment: 'scheduler',
      methods: ['GET', 'POST'],
    });

    schedulerApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const jobNames = await $scheduler.listJobs();
      const paused = await $scheduler.isPaused();

      // Get full details for each job
      const jobs = [];
      for (const name of jobNames) {
        const job = await $scheduler.getJob(name);
        if (job) {
          jobs.push({ name, ...job });
        }
      }

      return {
        status: 200,
        body: JSON.stringify({ jobs, paused })
      };
    `,
    );

    // /admin/api/scheduler/:name - Job actions
    const schedulerJobRoute = await this.createRoute(webRoute, schedulerApiRoute, {
      name: 'Scheduler Job API',
      segment: '*',
      methods: ['GET', 'POST'],
    });

    schedulerJobRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const match = self.match || '';
      const parts = match.split('/');
      const jobName = decodeURIComponent(parts[0]);
      const action = parts[1];

      if (action === 'run' && meta.method === 'POST') {
        const result = await $scheduler.runNow(jobName);
        return { status: 200, body: JSON.stringify(result) };
      }

      if (action === 'enable' && meta.method === 'POST') {
        const bodyStr = meta.body || '{}';
        let body;
        try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }
        const enabled = body.enabled !== false;
        const result = await $scheduler.setEnabled(jobName, enabled);
        return { status: 200, body: JSON.stringify(result) };
      }

      if (jobName === 'pause' && meta.method === 'POST') {
        const result = await $scheduler.pause();
        return { status: 200, body: JSON.stringify(result) };
      }

      if (jobName === 'resume' && meta.method === 'POST') {
        const result = await $scheduler.resume();
        return { status: 200, body: JSON.stringify(result) };
      }

      // GET job details
      const job = await $scheduler.getJob(jobName);
      if (!job) {
        return { status: 404, body: JSON.stringify({ error: 'Job not found' }) };
      }
      return { status: 200, body: JSON.stringify(job) };
    `,
    );

    // ========== Room Editor Page ==========

    // /admin/rooms - Room management UI
    const roomsRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Room Editor',
      segment: 'rooms',
      methods: ['GET'],
      contentType: 'text/html',
    });

    roomsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: 'Unauthorized' };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>Room Editor - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
  <style>
    body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }
    .grid-cell { width: 40px; height: 40px; border: 1px solid #333; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .grid-cell:hover { border-color: #00ff88; }
    .grid-cell.occupied { background: #1a3a2a; }
    .grid-cell.selected { border-color: #00ff88; border-width: 2px; }
  </style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-malice-accent">Room Editor</h1>
      <div class="flex items-center gap-4">
        <span class="text-malice-muted">Z-Level:</span>
        <button onclick="changeZ(-1)" class="px-2 py-1 bg-malice-surface border border-gray-700 rounded">▼</button>
        <span id="zLevel" class="text-lg font-mono w-8 text-center">0</span>
        <button onclick="changeZ(1)" class="px-2 py-1 bg-malice-surface border border-gray-700 rounded">▲</button>
        <a href="/admin/editor" class="text-malice-muted hover:text-malice-accent ml-4">Editor</a>
        <a href="/admin/scheduler" class="text-malice-muted hover:text-malice-accent">Scheduler</a>
      </div>
    </div>

    <div class="flex gap-6">
      <!-- Grid View -->
      <div class="flex-1">
        <div id="grid" class="inline-grid gap-0" style="grid-template-columns: repeat(21, 40px);"></div>
        <div class="mt-2 text-malice-muted text-sm">Click cell to select/create room. Green = room exists.</div>
      </div>

      <!-- Room Details -->
      <div class="w-80 bg-malice-surface border border-gray-700 rounded p-4">
        <div id="roomDetails">
          <p class="text-malice-muted">Select a room from the grid</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentZ = 0;
    let rooms = [];
    let selectedRoom = null;

    async function api(path, options = {}) {
      const res = await fetch('/admin/api/rooms' + path, {
        ...options,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...options.headers }
      });
      return res.json();
    }

    async function loadRooms() {
      const data = await api('?z=' + currentZ);
      rooms = data.rooms || [];
      renderGrid();
    }

    function renderGrid() {
      const grid = document.getElementById('grid');
      grid.innerHTML = '';

      // Create 21x21 grid centered on 0,0 (-10 to 10)
      for (let y = 10; y >= -10; y--) {
        for (let x = -10; x <= 10; x++) {
          const room = rooms.find(r => r.x === x && r.y === y);
          const cell = document.createElement('div');
          cell.className = 'grid-cell' + (room ? ' occupied' : '') + (selectedRoom && selectedRoom.x === x && selectedRoom.y === y ? ' selected' : '');
          cell.title = room ? room.name + ' (#' + room.id + ')' : x + ',' + y + ',' + currentZ;
          cell.onclick = () => selectCell(x, y, room);
          if (room) {
            cell.innerHTML = '<span class="text-xs text-malice-accent">' + room.id + '</span>';
          }
          grid.appendChild(cell);
        }
      }
    }

    function selectCell(x, y, room) {
      selectedRoom = room ? { ...room, x, y } : { x, y, z: currentZ };
      renderGrid();
      renderDetails();
    }

    function renderDetails() {
      const div = document.getElementById('roomDetails');
      if (!selectedRoom) {
        div.innerHTML = '<p class="text-malice-muted">Select a room from the grid</p>';
        return;
      }

      if (selectedRoom.id) {
        div.innerHTML = \`
          <h3 class="text-lg font-bold mb-3">\${escapeHtml(selectedRoom.name)}</h3>
          <div class="text-sm text-malice-muted mb-2">#\${selectedRoom.id} @ (\${selectedRoom.x}, \${selectedRoom.y}, \${currentZ})</div>

          <div class="mb-4">
            <label class="block text-sm text-malice-muted mb-1">Name</label>
            <input type="text" id="roomName" value="\${escapeHtml(selectedRoom.name)}" class="w-full bg-malice-bg border border-gray-700 rounded px-2 py-1">
          </div>

          <div class="mb-4">
            <label class="block text-sm text-malice-muted mb-1">Description</label>
            <textarea id="roomDesc" rows="3" class="w-full bg-malice-bg border border-gray-700 rounded px-2 py-1">\${escapeHtml(selectedRoom.description || '')}</textarea>
          </div>

          <div class="mb-4">
            <label class="block text-sm text-malice-muted mb-1">Exits</label>
            <div id="exitsList" class="text-sm">\${renderExits(selectedRoom.exits)}</div>
            <button onclick="addExit()" class="mt-2 px-2 py-1 bg-malice-surface border border-gray-700 rounded text-sm">+ Add Exit</button>
          </div>

          <div class="flex gap-2">
            <button onclick="saveRoom()" class="px-3 py-1 bg-malice-accent text-black rounded">Save</button>
            <button onclick="openInEditor()" class="px-3 py-1 bg-malice-surface border border-gray-700 rounded">Open in Editor</button>
          </div>
        \`;
      } else {
        div.innerHTML = \`
          <h3 class="text-lg font-bold mb-3">New Room</h3>
          <div class="text-sm text-malice-muted mb-4">@ (\${selectedRoom.x}, \${selectedRoom.y}, \${currentZ})</div>

          <div class="mb-4">
            <label class="block text-sm text-malice-muted mb-1">Name</label>
            <input type="text" id="roomName" placeholder="Room name" class="w-full bg-malice-bg border border-gray-700 rounded px-2 py-1">
          </div>

          <button onclick="createRoom()" class="px-3 py-1 bg-malice-accent text-black rounded">Create Room</button>
        \`;
      }
    }

    function renderExits(exits) {
      if (!exits || Object.keys(exits).length === 0) return '<span class="text-malice-muted">No exits</span>';
      return Object.entries(exits).map(([dir, dest]) =>
        \`<div class="flex justify-between items-center py-1">
          <span>\${dir} → #\${typeof dest === 'object' ? dest.id : dest}</span>
          <button onclick="deleteExit('\${dir}')" class="text-malice-danger text-xs">×</button>
        </div>\`
      ).join('');
    }

    async function saveRoom() {
      const name = document.getElementById('roomName').value;
      const description = document.getElementById('roomDesc').value;
      await api('/' + selectedRoom.id, {
        method: 'PUT',
        body: JSON.stringify({ name, description })
      });
      await loadRooms();
      selectedRoom = rooms.find(r => r.id === selectedRoom.id);
      renderDetails();
    }

    async function createRoom() {
      const name = document.getElementById('roomName').value || 'New Room';
      const result = await api('', {
        method: 'POST',
        body: JSON.stringify({ name, x: selectedRoom.x, y: selectedRoom.y, z: currentZ })
      });
      if (result.id) {
        await loadRooms();
        selectedRoom = rooms.find(r => r.id === result.id);
        renderDetails();
      }
    }

    async function addExit() {
      const dir = prompt('Exit direction (north, south, east, west, up, down):');
      if (!dir) return;
      const destId = prompt('Destination room ID:');
      if (!destId) return;
      await api('/' + selectedRoom.id + '/exits', {
        method: 'POST',
        body: JSON.stringify({ direction: dir, destinationId: parseInt(destId) })
      });
      await loadRooms();
      selectedRoom = rooms.find(r => r.id === selectedRoom.id);
      renderDetails();
    }

    async function deleteExit(dir) {
      if (!confirm('Delete exit ' + dir + '?')) return;
      await api('/' + selectedRoom.id + '/exits/' + dir, { method: 'DELETE' });
      await loadRooms();
      selectedRoom = rooms.find(r => r.id === selectedRoom.id);
      renderDetails();
    }

    function openInEditor() {
      window.location.href = '/admin/editor?id=' + selectedRoom.id;
    }

    function changeZ(delta) {
      currentZ += delta;
      document.getElementById('zLevel').textContent = currentZ;
      selectedRoom = null;
      loadRooms();
    }

    function escapeHtml(str) {
      return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    loadRooms();
  </script>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/api/rooms - List/create rooms
    const roomsApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Rooms API',
      segment: 'rooms',
      methods: ['GET', 'POST'],
    });

    roomsApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      if (meta.method === 'POST') {
        // Create new room
        const bodyStr = meta.body || '{}';
        let body;
        try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

        const room = await $recycler.create($room, {
          name: body.name || 'New Room',
          description: body.description || '',
          x: body.x ?? 0,
          y: body.y ?? 0,
          z: body.z ?? 0
        });

        return { status: 200, body: JSON.stringify({ id: room.id, name: room.name }) };
      }

      // GET - list rooms at z-level
      const z = parseInt(meta.query?.z ?? '0');
      const allRooms = await $query().parent($room).all();

      // Serialize exits properly (convert objrefs to IDs)
      function serializeExits(exits) {
        if (!exits) return {};
        const result = {};
        for (const [dir, dest] of Object.entries(exits)) {
          if (dest && typeof dest === 'object' && dest.id !== undefined) {
            result[dir] = dest.id;
          } else {
            result[dir] = dest;
          }
        }
        return result;
      }

      const rooms = allRooms
        .filter(r => (r.z ?? 0) === z)
        .map(r => ({
          id: r.id,
          name: r.name,
          x: r.x ?? 0,
          y: r.y ?? 0,
          description: r.description || '',
          exits: serializeExits(r.exits)
        }));

      return { status: 200, body: JSON.stringify({ rooms, z }) };
    `,
    );

    // /admin/api/rooms/:id - Room CRUD
    const roomByIdRoute = await this.createRoute(webRoute, roomsApiRoute, {
      name: 'Room By ID API',
      segment: '*',
      methods: ['GET', 'PUT', 'DELETE', 'POST'],
    });

    roomByIdRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const match = self.match || '';
      const parts = match.split('/');
      const roomId = parseInt(parts[0]);
      const subPath = parts.slice(1).join('/');

      if (isNaN(roomId)) {
        return { status: 400, body: JSON.stringify({ error: 'Invalid room ID' }) };
      }

      const room = await $load(roomId);
      if (!room) {
        return { status: 404, body: JSON.stringify({ error: 'Room not found' }) };
      }

      // Helper to serialize exits
      function serializeExits(exits) {
        if (!exits) return {};
        const result = {};
        for (const [dir, dest] of Object.entries(exits)) {
          if (dest && typeof dest === 'object' && dest.id !== undefined) {
            result[dir] = dest.id;
          } else {
            result[dir] = dest;
          }
        }
        return result;
      }

      // Handle exits sub-resource
      if (subPath.startsWith('exits')) {
        const exitDir = parts[2];

        if (meta.method === 'POST') {
          // Add exit
          const bodyStr = meta.body || '{}';
          let body;
          try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

          const exits = room.exits || {};
          exits[body.direction] = body.destinationId;
          room.exits = exits;

          return { status: 200, body: JSON.stringify({ success: true }) };
        }

        if (meta.method === 'DELETE' && exitDir) {
          // Delete exit
          const exits = room.exits || {};
          delete exits[exitDir];
          room.exits = exits;

          return { status: 200, body: JSON.stringify({ success: true }) };
        }
      }

      if (meta.method === 'PUT') {
        // Update room
        const bodyStr = meta.body || '{}';
        let body;
        try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

        if (body.name !== undefined) room.name = body.name;
        if (body.description !== undefined) room.description = body.description;
        if (body.x !== undefined) room.x = body.x;
        if (body.y !== undefined) room.y = body.y;
        if (body.z !== undefined) room.z = body.z;

        return { status: 200, body: JSON.stringify({ success: true }) };
      }

      if (meta.method === 'DELETE') {
        await $recycler.recycle(room);
        return { status: 200, body: JSON.stringify({ success: true }) };
      }

      // GET - return room details
      return {
        status: 200,
        body: JSON.stringify({
          id: room.id,
          name: room.name,
          description: room.description || '',
          x: room.x ?? 0,
          y: room.y ?? 0,
          z: room.z ?? 0,
          exits: serializeExits(room.exits)
        })
      };
    `,
    );

    // ========== Player Editor Page ==========

    // /admin/players - Player management UI
    const playersRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Player Editor',
      segment: 'players',
      methods: ['GET'],
      contentType: 'text/html',
    });

    playersRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: 'Unauthorized' };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>Player Editor - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' }
          }
        }
      }
    }
  </script>
  <style>
    body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-malice-accent">Player Editor</h1>
      <div class="flex items-center gap-4">
        <input type="text" id="search" placeholder="Search players..." class="bg-malice-surface border border-gray-700 rounded px-3 py-1" oninput="filterPlayers()">
        <a href="/admin/editor" class="text-malice-muted hover:text-malice-accent">Editor</a>
        <a href="/admin/scheduler" class="text-malice-muted hover:text-malice-accent">Scheduler</a>
        <a href="/admin/rooms" class="text-malice-muted hover:text-malice-accent">Rooms</a>
      </div>
    </div>
    <div class="flex gap-6">
      <div class="w-64 bg-malice-surface border border-gray-700 rounded p-4 max-h-[80vh] overflow-y-auto">
        <div id="playerList"><p class="text-malice-muted">Loading...</p></div>
      </div>
      <div class="flex-1 bg-malice-surface border border-gray-700 rounded p-4">
        <div id="playerDetails"><p class="text-malice-muted">Select a player</p></div>
      </div>
    </div>
  </div>
  <script>
    let players = [], selectedPlayer = null;
    async function api(path, options = {}) {
      const res = await fetch('/admin/api/players' + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } });
      return res.json();
    }
    async function loadPlayers() {
      const data = await api('');
      players = data.players || [];
      renderList();
    }
    function filterPlayers() {
      const q = document.getElementById('search').value.toLowerCase();
      renderList(q);
    }
    function renderList(filter = '') {
      const div = document.getElementById('playerList');
      const filtered = filter ? players.filter(p => p.playername.toLowerCase().includes(filter) || p.name.toLowerCase().includes(filter)) : players;
      if (filtered.length === 0) { div.innerHTML = '<p class="text-malice-muted">No players found</p>'; return; }
      div.innerHTML = filtered.map(p => '<div class="p-2 cursor-pointer hover:bg-malice-bg rounded ' + (selectedPlayer?.id === p.id ? 'border border-malice-accent' : '') + '" onclick="selectPlayer(' + p.id + ')"><div class="font-bold">' + escapeHtml(p.name) + '</div><div class="text-xs text-malice-muted">' + escapeHtml(p.playername) + ' #' + p.id + '</div></div>').join('');
    }
    async function selectPlayer(id) {
      const data = await api('/' + id);
      selectedPlayer = data;
      renderList();
      renderDetails();
    }
    function renderDetails() {
      const div = document.getElementById('playerDetails');
      if (!selectedPlayer) { div.innerHTML = '<p class="text-malice-muted">Select a player</p>'; return; }
      const p = selectedPlayer;
      div.innerHTML = '<h2 class="text-xl font-bold mb-4">' + escapeHtml(p.name) + ' <span class="text-malice-muted text-sm">#' + p.id + '</span></h2>' +
        '<div class="grid grid-cols-2 gap-6">' +
        '<div><h3 class="text-lg text-malice-accent mb-2">Account</h3>' +
        '<div class="space-y-2 text-sm">' +
        '<div><span class="text-malice-muted">Username:</span> ' + escapeHtml(p.playername) + '</div>' +
        '<div><span class="text-malice-muted">Email:</span> ' + escapeHtml(p.email || 'none') + '</div>' +
        '<div><span class="text-malice-muted">Created:</span> ' + formatDate(p.createdAt) + '</div>' +
        '<div><span class="text-malice-muted">Last Login:</span> ' + formatDate(p.lastLogin) + '</div>' +
        '<div class="flex items-center gap-2"><span class="text-malice-muted">Wizard:</span> <input type="checkbox" ' + (p.isWizard ? 'checked' : '') + ' onchange="togglePerm(\\'isWizard\\', this.checked)"></div>' +
        '<div class="flex items-center gap-2"><span class="text-malice-muted">Suspended:</span> <input type="checkbox" ' + (p.isSuspended ? 'checked' : '') + ' onchange="togglePerm(\\'isSuspended\\', this.checked)"></div>' +
        '<div class="flex items-center gap-2"><span class="text-malice-muted">DevTools:</span> <input type="checkbox" ' + (p.canUseDevTools ? 'checked' : '') + ' onchange="togglePerm(\\'canUseDevTools\\', this.checked)"></div>' +
        '</div></div>' +
        '<div><h3 class="text-lg text-malice-accent mb-2">Stats</h3>' +
        '<div class="space-y-2 text-sm">' +
        '<div><span class="text-malice-muted">Location:</span> ' + (p.location ? '#' + p.location.id + ' ' + escapeHtml(p.location.name) : 'none') + ' <button onclick="teleport()" class="text-xs text-malice-accent ml-2">[teleport]</button></div>' +
        '<div><span class="text-malice-muted">Sleep:</span> ' + escapeHtml(p.sleepState || 'awake') + '</div>' +
        '<div><span class="text-malice-muted">Fitness XP:</span> ' + (p.fitnessXP || 0) + '</div>' +
        '<div><span class="text-malice-muted">Total Playtime:</span> ' + formatDuration(p.totalPlaytime) + '</div>' +
        '</div></div>' +
        '</div>' +
        '<div class="mt-6"><h3 class="text-lg text-malice-accent mb-2">Inventory</h3>' +
        '<div class="text-sm">' + renderInventory(p.inventory) + '</div></div>' +
        '<div class="mt-4 flex gap-2">' +
        '<button onclick="openInEditor()" class="px-3 py-1 bg-malice-surface border border-gray-700 rounded">Open in Editor</button>' +
        '</div>';
    }
    function renderInventory(inv) {
      if (!inv) return '<span class="text-malice-muted">No inventory data</span>';
      let html = '';
      if (inv.hands) { html += '<div class="mb-2"><span class="text-malice-muted">Hands:</span> ' + (inv.hands.length ? inv.hands.map(i => escapeHtml(i.name)).join(', ') : 'empty') + '</div>'; }
      if (inv.worn) { html += '<div class="mb-2"><span class="text-malice-muted">Worn:</span> ' + (inv.worn.length ? inv.worn.map(i => escapeHtml(i.name)).join(', ') : 'nothing') + '</div>'; }
      if (inv.carried) { html += '<div><span class="text-malice-muted">Carried:</span> ' + (inv.carried.length ? inv.carried.map(i => escapeHtml(i.name)).join(', ') : 'nothing') + '</div>'; }
      return html || '<span class="text-malice-muted">Empty</span>';
    }
    async function togglePerm(prop, value) {
      await api('/' + selectedPlayer.id, { method: 'PUT', body: JSON.stringify({ [prop]: value }) });
      await selectPlayer(selectedPlayer.id);
    }
    async function teleport() {
      const roomId = prompt('Room ID to teleport to:');
      if (!roomId) return;
      await api('/' + selectedPlayer.id + '/teleport', { method: 'POST', body: JSON.stringify({ roomId: parseInt(roomId) }) });
      await selectPlayer(selectedPlayer.id);
    }
    function openInEditor() { window.location.href = '/admin/editor?id=' + selectedPlayer.id; }
    function formatDate(ts) { if (!ts) return 'never'; return new Date(ts).toLocaleDateString(); }
    function formatDuration(ms) { if (!ms) return '0h'; const h = Math.floor(ms / 3600000); return h + 'h'; }
    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    loadPlayers();
  </script>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/api/players - List players
    const playersApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Players API',
      segment: 'players',
      methods: ['GET'],
    });

    playersApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const allPlayers = await $query().parent($player).all();
      const players = allPlayers.map(p => ({
        id: p.id,
        name: p.name,
        playername: p.playername || '',
        isWizard: p.isWizard || false,
        isSuspended: p.isSuspended || false
      }));

      return { status: 200, body: JSON.stringify({ players }) };
    `,
    );

    // /admin/api/players/:id - Player details/update
    const playerByIdRoute = await this.createRoute(webRoute, playersApiRoute, {
      name: 'Player By ID API',
      segment: '*',
      methods: ['GET', 'PUT', 'POST'],
    });

    playerByIdRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const match = self.match || '';
      const parts = match.split('/');
      const playerId = parseInt(parts[0]);
      const action = parts[1];

      if (isNaN(playerId)) {
        return { status: 400, body: JSON.stringify({ error: 'Invalid player ID' }) };
      }

      const player = await $load(playerId);
      if (!player) {
        return { status: 404, body: JSON.stringify({ error: 'Player not found' }) };
      }

      // Handle teleport action
      if (action === 'teleport' && meta.method === 'POST') {
        const bodyStr = meta.body || '{}';
        let body;
        try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

        const room = await $load(body.roomId);
        if (room) {
          player.location = room;
          return { status: 200, body: JSON.stringify({ success: true }) };
        }
        return { status: 400, body: JSON.stringify({ error: 'Invalid room' }) };
      }

      // Handle PUT - update player
      if (meta.method === 'PUT') {
        const bodyStr = meta.body || '{}';
        let body;
        try { body = typeof bodyStr === 'string' ? JSON.parse(bodyStr) : bodyStr; } catch { body = {}; }

        if (body.isWizard !== undefined) player.isWizard = body.isWizard;
        if (body.isSuspended !== undefined) player.isSuspended = body.isSuspended;
        if (body.canUseDevTools !== undefined) player.canUseDevTools = body.canUseDevTools;

        return { status: 200, body: JSON.stringify({ success: true }) };
      }

      // GET - return full player details
      const location = player.location;
      let inventory = { hands: [], worn: [], carried: [] };

      // Get hand contents
      if (player.getHands) {
        const hands = await player.getHands();
        if (hands.both) {
          for (const hand of hands.both) {
            if (hand && hand.contents) {
              for (const item of hand.contents) {
                if (item) inventory.hands.push({ id: item.id, name: item.name });
              }
            }
          }
        }
      }

      // Get worn items
      if (player.getWornItems) {
        const worn = await player.getWornItems();
        if (worn) {
          for (const item of worn) {
            if (item) inventory.worn.push({ id: item.id, name: item.name });
          }
        }
      }

      // Get direct contents
      const contents = player.contents || [];
      for (const item of contents) {
        if (item) inventory.carried.push({ id: item.id, name: item.name });
      }

      return {
        status: 200,
        body: JSON.stringify({
          id: player.id,
          name: player.name,
          playername: player.playername || '',
          email: player.email || '',
          isWizard: player.isWizard || false,
          isSuspended: player.isSuspended || false,
          canUseDevTools: player.canUseDevTools || false,
          createdAt: player.createdAt,
          lastLogin: player.lastLogin,
          totalPlaytime: player.totalPlaytime || 0,
          sleepState: player.sleepState || 'awake',
          fitnessXP: player.fitnessXP || 0,
          location: location ? { id: location.id, name: location.name } : null,
          inventory
        })
      };
    `,
    );

    // ========== AI Dashboard Page ==========

    // /admin/ai - AI/NPC management UI
    const aiRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'AI Dashboard',
      segment: 'ai',
      methods: ['GET'],
      contentType: 'text/html',
    });

    aiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: 'Unauthorized' };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>AI Dashboard - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { theme: { extend: { colors: { malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' } } } } }</script>
  <style>body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }</style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-malice-accent">AI Dashboard</h1>
      <div class="flex items-center gap-4">
        <a href="/admin/editor" class="text-malice-muted hover:text-malice-accent">Editor</a>
        <a href="/admin/scheduler" class="text-malice-muted hover:text-malice-accent">Scheduler</a>
        <a href="/admin/rooms" class="text-malice-muted hover:text-malice-accent">Rooms</a>
        <a href="/admin/players" class="text-malice-muted hover:text-malice-accent">Players</a>
      </div>
    </div>
    <div class="flex gap-6">
      <div class="w-64 bg-malice-surface border border-gray-700 rounded p-4 max-h-[60vh] overflow-y-auto">
        <h3 class="text-lg text-malice-accent mb-2">NPCs</h3>
        <div id="npcList"><p class="text-malice-muted">Loading...</p></div>
      </div>
      <div class="flex-1 bg-malice-surface border border-gray-700 rounded p-4">
        <div id="npcDetails"><p class="text-malice-muted">Select an NPC</p></div>
      </div>
    </div>
    <div class="mt-6 bg-malice-surface border border-gray-700 rounded p-4">
      <h3 class="text-lg text-malice-accent mb-2">World Log (Deity Chat)</h3>
      <div id="worldLog" class="max-h-48 overflow-y-auto text-sm font-mono"><p class="text-malice-muted">Loading...</p></div>
    </div>
  </div>
  <script>
    let npcs = [], selectedNpc = null;
    async function api(path, options = {}) { const res = await fetch('/admin/api/ai' + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } }); return res.json(); }
    async function loadNpcs() { const data = await api(''); npcs = data.npcs || []; renderList(); loadWorldLog(); }
    async function loadWorldLog() { const data = await api('/worldlog'); const div = document.getElementById('worldLog'); if (!data.log || data.log.length === 0) { div.innerHTML = '<p class="text-malice-muted">No world log entries</p>'; return; } div.innerHTML = data.log.map(entry => '<div class="py-1 border-b border-gray-800"><span class="text-malice-muted">' + formatDate(entry.timestamp) + '</span> <span class="' + (entry.author === 'pluribus' ? 'text-blue-400' : 'text-purple-400') + '">[' + entry.author + ']</span> ' + escapeHtml(entry.message) + '</div>').join(''); }
    function renderList() { const div = document.getElementById('npcList'); if (npcs.length === 0) { div.innerHTML = '<p class="text-malice-muted">No NPCs registered</p>'; return; } div.innerHTML = npcs.map(n => '<div class="p-2 cursor-pointer hover:bg-malice-bg rounded ' + (selectedNpc?.humanId === n.humanId ? 'border border-malice-accent' : '') + '" onclick="selectNpc(' + n.humanId + ')"><div class="font-bold">' + escapeHtml(n.name) + '</div><div class="text-xs text-malice-muted">' + escapeHtml(n.role) + ' #' + n.humanId + '</div></div>').join(''); }
    async function selectNpc(id) { const data = await api('/' + id); selectedNpc = data; renderList(); renderDetails(); }
    function renderDetails() { const div = document.getElementById('npcDetails'); if (!selectedNpc) { div.innerHTML = '<p class="text-malice-muted">Select an NPC</p>'; return; } const n = selectedNpc; div.innerHTML = '<h2 class="text-xl font-bold mb-4">' + escapeHtml(n.name) + ' <span class="text-malice-muted text-sm">#' + n.humanId + '</span></h2><div class="grid grid-cols-2 gap-6"><div><div class="text-sm space-y-2"><div><span class="text-malice-muted">Role:</span> ' + escapeHtml(n.role) + '</div><div><span class="text-malice-muted">Location:</span> ' + (n.location ? '#' + n.location.id + ' ' + escapeHtml(n.location.name) : 'none') + '</div><div><span class="text-malice-muted">Spawned:</span> ' + formatDate(n.spawnedAt) + '</div></div></div><div><h3 class="text-lg text-malice-accent mb-2">Personality</h3><div class="text-sm text-gray-400 whitespace-pre-wrap">' + escapeHtml(typeof n.personality === 'object' ? JSON.stringify(n.personality, null, 2) : n.personality) + '</div></div></div><div class="mt-4"><h3 class="text-lg text-malice-accent mb-2">Memories (' + (n.memories?.length || 0) + ')</h3><div class="max-h-40 overflow-y-auto text-sm">' + renderMemories(n.memories) + '</div></div><div class="mt-4 flex gap-2"><button onclick="openInEditor()" class="px-3 py-1 bg-malice-surface border border-gray-700 rounded">Open in Editor</button></div>'; }
    function renderMemories(memories) { if (!memories || memories.length === 0) return '<p class="text-malice-muted">No memories</p>'; return memories.map(m => '<div class="py-1 border-b border-gray-800"><span class="text-xs ' + (m.importance === 'critical' ? 'text-red-400' : m.importance === 'important' ? 'text-yellow-400' : 'text-gray-500') + '">[' + m.importance + ']</span> ' + escapeHtml(m.text) + '</div>').join(''); }
    function openInEditor() { window.location.href = '/admin/editor?id=' + selectedNpc.humanId; }
    function formatDate(ts) { if (!ts) return 'never'; return new Date(ts).toLocaleString(); }
    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    loadNpcs();
  </script>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/api/ai - List NPCs
    const aiApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'AI API',
      segment: 'ai',
      methods: ['GET'],
    });

    aiApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const registry = $ai.registry || {};
      const npcs = [];
      for (const [role, entries] of Object.entries(registry)) {
        if (Array.isArray(entries)) {
          for (const entry of entries) {
            npcs.push({
              humanId: entry.humanId,
              name: entry.name,
              role: entry.role || role,
              spawnedAt: entry.spawnedAt
            });
          }
        }
      }

      return { status: 200, body: JSON.stringify({ npcs }) };
    `,
    );

    // /admin/api/ai/:id - NPC details / worldlog
    const aiByIdRoute = await this.createRoute(webRoute, aiApiRoute, {
      name: 'AI By ID API',
      segment: '*',
      methods: ['GET'],
    });

    aiByIdRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const match = self.match || '';

      // Handle worldlog
      if (match === 'worldlog') {
        const log = await $ai.getWorldLog(50);
        return { status: 200, body: JSON.stringify({ log }) };
      }

      // NPC by ID
      const npcId = parseInt(match);
      if (isNaN(npcId)) {
        return { status: 400, body: JSON.stringify({ error: 'Invalid NPC ID' }) };
      }

      const human = await $load(npcId);
      if (!human) {
        return { status: 404, body: JSON.stringify({ error: 'NPC not found' }) };
      }

      // Find registry entry
      let registryEntry = null;
      const registry = $ai.registry || {};
      for (const [role, entries] of Object.entries(registry)) {
        if (Array.isArray(entries)) {
          const found = entries.find(e => e.humanId === npcId);
          if (found) { registryEntry = found; break; }
        }
      }

      // Get memories
      const memories = await $ai.recall(npcId, { limit: 20 });
      const location = human.location;

      return {
        status: 200,
        body: JSON.stringify({
          humanId: npcId,
          name: human.name,
          role: registryEntry?.role || 'unknown',
          personality: registryEntry?.personality || human.personality || '',
          history: registryEntry?.history || human.history || '',
          spawnedAt: registryEntry?.spawnedAt,
          location: location ? { id: location.id, name: location.name } : null,
          memories: memories || []
        })
      };
    `,
    );

    // ========== Live Log Page ==========

    // /admin/log - Live log viewer
    const logRoute = await this.createRoute(webRoute, adminRoute, {
      name: 'Live Log',
      segment: 'log',
      methods: ['GET'],
      contentType: 'text/html',
    });

    logRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: 'Unauthorized' };
      }

      const html = \`<!DOCTYPE html>
<html>
<head>
  <title>Live Log - Malice Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { theme: { extend: { colors: { malice: { bg: '#0a0a0a', surface: '#141414', accent: '#00ff88', danger: '#ff3366', muted: '#666' } } } } }</script>
  <style>body { background: #0a0a0a; font-family: 'JetBrains Mono', monospace; }</style>
</head>
<body class="text-gray-200 p-6">
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-malice-accent">Live Log</h1>
      <div class="flex items-center gap-4">
        <button onclick="togglePause()" id="pauseBtn" class="px-3 py-1 bg-malice-surface border border-gray-700 rounded">Pause</button>
        <button onclick="clearLog()" class="px-3 py-1 bg-malice-surface border border-gray-700 rounded">Clear</button>
        <a href="/admin/editor" class="text-malice-muted hover:text-malice-accent">Editor</a>
        <a href="/admin/scheduler" class="text-malice-muted hover:text-malice-accent">Scheduler</a>
      </div>
    </div>
    <div class="flex gap-2 mb-4">
      <button onclick="setTab('infra')" id="tabInfra" class="px-4 py-2 bg-malice-accent text-black rounded">Infrastructure</button>
      <button onclick="setTab('events')" id="tabEvents" class="px-4 py-2 bg-malice-surface border border-gray-700 rounded">Game Events</button>
    </div>
    <div class="mb-4 flex gap-4">
      <select id="typeFilter" class="bg-malice-surface border border-gray-700 rounded px-2 py-1" onchange="loadLogs()">
        <option value="">All Types</option>
        <option value="command">Commands</option>
        <option value="auth">Auth</option>
        <option value="connect">Connect</option>
        <option value="disconnect">Disconnect</option>
      </select>
      <input type="number" id="actorFilter" placeholder="Player ID" class="bg-malice-surface border border-gray-700 rounded px-2 py-1 w-28" onchange="loadLogs()">
    </div>
    <div id="logContainer" class="bg-malice-surface border border-gray-700 rounded p-4 h-[60vh] overflow-y-auto font-mono text-sm">
      <p class="text-malice-muted">Loading...</p>
    </div>
  </div>
  <script>
    let paused = false, tab = 'infra', logs = [];
    async function api(path, options = {}) { const res = await fetch('/admin/api/logs' + path, { ...options, credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers } }); return res.json(); }
    async function loadLogs() {
      if (paused) return;
      const type = document.getElementById('typeFilter').value;
      const actor = document.getElementById('actorFilter').value;
      let query = '?tab=' + tab;
      if (type) query += '&type=' + type;
      if (actor) query += '&actor=' + actor;
      const data = await api(query);
      logs = data.logs || [];
      renderLogs();
    }
    function renderLogs() {
      const div = document.getElementById('logContainer');
      if (logs.length === 0) { div.innerHTML = '<p class="text-malice-muted">No logs found</p>'; return; }
      div.innerHTML = logs.map(log => {
        const time = new Date(log.ts || log.timestamp).toLocaleTimeString();
        const type = log.type || 'event';
        const typeColor = type === 'command' ? 'text-malice-accent' : type === 'auth' ? 'text-blue-400' : type === 'connect' ? 'text-green-400' : type === 'disconnect' ? 'text-red-400' : 'text-gray-400';
        const actor = log.actor !== undefined ? '#' + log.actor : '';
        const detail = log.command || log.data?.message || log.message || JSON.stringify(log.data || {});
        return '<div class="py-1 border-b border-gray-800"><span class="text-malice-muted">' + time + '</span> <span class="' + typeColor + '">[' + type + ']</span> <span class="text-yellow-400">' + actor + '</span> ' + escapeHtml(String(detail).substring(0, 100)) + '</div>';
      }).join('');
      div.scrollTop = div.scrollHeight;
    }
    function setTab(t) { tab = t; document.getElementById('tabInfra').className = t === 'infra' ? 'px-4 py-2 bg-malice-accent text-black rounded' : 'px-4 py-2 bg-malice-surface border border-gray-700 rounded'; document.getElementById('tabEvents').className = t === 'events' ? 'px-4 py-2 bg-malice-accent text-black rounded' : 'px-4 py-2 bg-malice-surface border border-gray-700 rounded'; loadLogs(); }
    function togglePause() { paused = !paused; document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause'; }
    function clearLog() { logs = []; renderLogs(); }
    function escapeHtml(str) { return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    loadLogs();
    setInterval(loadLogs, 5000);
  </script>
</body>
</html>\`;

      return { status: 200, contentType: 'text/html', body: html };
    `,
    );

    // /admin/api/logs - Query logs
    const logsApiRoute = await this.createRoute(webRoute, adminApiRoute, {
      name: 'Logs API',
      segment: 'logs',
      methods: ['GET'],
    });

    logsApiRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);
      if (hasAdmins && !meta.isAdmin) {
        return { status: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
      }

      const tab = meta.query?.tab || 'infra';
      const type = meta.query?.type;
      const actor = meta.query?.actor ? parseInt(meta.query.actor) : null;

      let logs = [];

      if (tab === 'infra') {
        // Query infrastructure logs collection
        const logsCollection = $.db.db.collection('logs');
        const query = {};
        if (type) query.type = type;
        if (actor !== null) query.actor = actor;

        const cursor = logsCollection.find(query).sort({ ts: -1 }).limit(100);
        logs = await cursor.toArray();
      } else {
        // Query game_events collection
        const eventsCollection = $.db.db.collection('game_events');
        const query = {};
        if (type) query.type = type;

        const cursor = eventsCollection.find(query).sort({ timestamp: -1 }).limit(100);
        logs = await cursor.toArray();
      }

      return { status: 200, body: JSON.stringify({ logs, tab }) };
    `,
    );
  }

  async registerAliases(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'metaDomain', this.domain.id);
    console.log(`Registered metaDomain alias -> #${this.domain.id}`);
  }
}

// Self-register
registerBuilder(MetaDomainBuilder);
