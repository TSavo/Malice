import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

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
export class MetaDomainBuilder {
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

    // /admin - redirect to setup if no admins, else editor
    adminRoute.setMethod(
      'handleRequest',
      `
      const adminCandidates = await $query().prop('isAdmin').equals(true).limit(10).all();
      const hasAdmins = adminCandidates.some(a => a.playername && a.playername.length > 0);

      if (!hasAdmins) {
        return {
          status: 302,
          headers: { 'Location': '/admin/setup' },
          body: ''
        };
      }

      return {
        status: 302,
        headers: { 'Location': '/admin/editor' },
        body: ''
      };
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

      // Read the editor HTML from file
      const fs = await import('fs');
      try {
        let html = fs.readFileSync('./admin-editor.html', 'utf-8');
        // Inject player name
        html = html.replace('{{playerName}}', playerName);
        return {
          status: 200,
          contentType: 'text/html',
          body: html
        };
      } catch (err) {
        // Fallback to inline editor if file not found
        return {
          status: 200,
          contentType: 'text/html',
          body: await self.renderEditorPage(playerName)
        };
      }
    `,
    );

    // Fallback inline editor renderer
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
    .CodeMirror { height: 100%; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
    .tree-item { cursor: pointer; padding: 2px 4px; border-radius: 2px; }
    .tree-item:hover { background: #1a1a1a; }
    .tree-item.selected { background: #00ff8822; }
    .prop-row:hover { background: #1a1a1a; }
    .method-tab { padding: 4px 12px; cursor: pointer; border-bottom: 2px solid transparent; }
    .method-tab.active { border-bottom-color: #00ff88; color: #00ff88; }
    .method-tab:hover { background: #1a1a1a; }
    .scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
    .scrollbar::-webkit-scrollbar-track { background: #0a0a0a; }
    .scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    .scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
  </style>
</head>
<body class="bg-malice-bg text-gray-200 font-mono h-screen flex flex-col overflow-hidden">
  <header class="bg-malice-surface border-b border-gray-800 px-4 py-2 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-malice-accent font-bold">MOO Editor</h1>
      <span class="text-malice-muted text-sm">Logged in as: \${playerName}</span>
    </div>
    <div class="flex items-center gap-2">
      <input type="text" id="searchInput" placeholder="Search objects..."
        class="bg-malice-bg border border-gray-700 rounded px-3 py-1 text-sm w-64 focus:border-malice-accent focus:outline-none">
      <button onclick="searchObjects()" class="bg-malice-accent text-black px-3 py-1 rounded text-sm font-medium hover:bg-green-400">Search</button>
    </div>
  </header>
  <div class="flex-1 flex items-center justify-center text-malice-muted">
    <p>Editor UI loading... If this persists, check that admin-editor.html exists.</p>
  </div>
</body>
</html>\`;
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
          const localProps = obj.getLocalProperties ? obj.getLocalProperties() : [];

          for (const key of localProps) {
            const val = obj.get(key);
            properties[key] = val;
          }

          const methods = {};
          const localMethods = obj.getLocalMethods ? obj.getLocalMethods() : [];
          for (const name of localMethods) {
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

      const code = body.code || '';
      if (!code) {
        return { status: 400, body: JSON.stringify({ error: 'No code provided' }) };
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
  }

  async registerAlias(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'metaDomain', this.domain.id);
    console.log(`[MetaDomain] Registered metaDomain alias -> #${this.domain.id}`);
  }
}
