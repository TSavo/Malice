import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds the thecontinuum.city domain
 *
 * This is Pluribus's official citizenship recruitment website.
 * Sets up:
 * - Root domain: thecontinuum.city
 * - Subdomain: www → alias to root
 * - Wildcard subdomain: * → player profiles
 * - Route tree for all paths
 */
export class ContinuumDomainBuilder {
  private domain: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Need dependencies
    if (!aliases.webDomain) {
      throw new Error('$webDomain must be built before ContinuumDomainBuilder');
    }
    if (!aliases.domainRegistry) {
      throw new Error(
        '$domainRegistry must be built before ContinuumDomainBuilder',
      );
    }
    if (!aliases.webRoute) {
      throw new Error('$webRoute must be built before ContinuumDomainBuilder');
    }

    const webDomain = await this.manager.load(aliases.webDomain);
    const domainRegistry = await this.manager.load(aliases.domainRegistry);
    const webRoute = await this.manager.load(aliases.webRoute);

    if (!webDomain || !domainRegistry || !webRoute) {
      throw new Error('Failed to load dependencies');
    }

    // Check if already exists
    if (aliases.continuumDomain) {
      this.domain = await this.manager.load(aliases.continuumDomain);
      if (this.domain && !forceRebuild) return;
    }

    // Create the root domain
    if (!this.domain) {
      this.domain = await this.manager.create({
        parent: webDomain,
        properties: {
          name: 'The Continuum',
          description: 'Official Seattle Citizen Services website',
          segment: 'thecontinuum.city',
        },
        methods: {},
      });
    }

    // Set up subdomains and routes
    await this.buildSubdomains(webDomain);
    await this.buildRouteTree(webRoute);

    // Register with domain registry
    await domainRegistry.call('register', this.domain);

    // Also register as the wildcard/default domain
    // This means localhost, 127.0.0.1, or any unrecognized host
    // will be served by thecontinuum.city
    await domainRegistry.call('setDefault', this.domain);

    console.log(
      '[ContinuumDomain] Registered thecontinuum.city as default domain',
    );
  }

  private async buildSubdomains(_webDomain: RuntimeObject): Promise<void> {
    if (!this.domain) return;

    // www subdomain - alias to root
    await this.manager.create({
      parent: this.domain, // Child of thecontinuum.city
      properties: {
        name: 'WWW Subdomain',
        segment: 'www',
        aliasOf: this.domain, // Delegates to parent
      },
      methods: {},
    });

    // Wildcard subdomain for player profiles
    const playerSubdomain = await this.manager.create({
      parent: this.domain,
      properties: {
        name: 'Player Subdomain',
        segment: '*',
        description:
          'Handles player profile subdomains like kevin.thecontinuum.city',
      },
      methods: {},
    });

    // Player subdomain handler
    playerSubdomain.setMethod(
      'handleRequest',
      `
      /**
       * Handle requests to player subdomains.
       * self.match contains the subdomain (player name).
       */
      const path = args[0] || '/';
      const method = args[1] || 'GET';
      const meta = args[2] || {};
      
      const playerName = self.match;
      
      if (!playerName) {
        return { status: 404, body: 'Player not found' };
      }
      
      // Look up player by name
      const player = await $query()
        .parent($player)
        .prop('playername').equals(playerName.toLowerCase())
        .first();
      
      if (!player) {
        return {
          status: 404,
          contentType: 'text/html',
          body: '<html><body style="background:#0a0a0a;color:#ff3366;font-family:monospace;padding:2rem;"><h1>Citizen Not Found</h1><p>No registered citizen: ' + playerName + '</p></body></html>'
        };
      }
      
      // Render player profile
      const name = player.name || player.playername || 'Unknown';
      const description = player.description || 'No public profile.';
      
      return {
        status: 200,
        contentType: 'text/html',
        body: \`<!DOCTYPE html>
<html>
<head>
  <title>\${name} - Seattle Citizen</title>
  <style>
    body { background: #0a0a0a; color: #e0e0e0; font-family: monospace; padding: 2rem; }
    h1 { color: #00ff88; }
    .profile { border: 1px solid #333; padding: 1rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div style="color:#666;font-size:0.8rem;">SEATTLE CITIZEN SERVICES</div>
  <h1>\${name}</h1>
  <div class="profile">
    <p>\${description}</p>
  </div>
  <p style="margin-top:2rem;"><a href="/" style="color:#00ff88;">Return to Citizen Services</a></p>
</body>
</html>\`
      };
    `,
    );
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
      name: 'Continuum Root Route',
      segment: '',
      methods: ['GET'],
      contentType: 'text/html',
    });

    // Set as the domain's route tree
    this.domain.set('rootRoute', rootRoute);

    // Root route handler - homepage
    rootRoute.setMethod(
      'handleRequest',
      `
      /**
       * Serve the homepage
       */
      const meta = args[0] || {};
      
      // Get homepage from $homepage page object
      const homepage = await $.homepage;
      if (homepage && homepage.render) {
        const html = await homepage.render();
        return {
          status: 200,
          contentType: 'text/html',
          body: html
        };
      }
      
      return {
        status: 200,
        contentType: 'text/html',
        body: '<html><body><h1>The Continuum</h1><p>Welcome to Seattle.</p></body></html>'
      };
    `,
    );

    // /play route
    const playRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Play Route',
      segment: 'play',
      methods: ['GET'],
      contentType: 'text/html',
    });

    playRoute.setMethod(
      'handleRequest',
      `
      const playPage = await $.playPage;
      if (playPage && playPage.render) {
        const html = await playPage.render();
        return { status: 200, contentType: 'text/html', body: html };
      }
      return { status: 200, body: '<html><body><h1>Terminal</h1></body></html>' };
    `,
    );

    // /api route - parent for all API routes
    const apiRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'API Route',
      segment: 'api',
      methods: ['GET'],
      contentType: 'application/json',
    });

    // /api/status - inline the handler
    const statusRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'Status API',
      segment: 'status',
      methods: ['GET'],
      contentType: 'application/json',
      startTime: Date.now(),
      basePopulation: 487,
    });

    statusRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      try {
        // Get connected players
        const connections = await $world.getAuthenticatedConnections();
        const playerCount = connections.length;

        // Get AI NPCs
        const npcIds = await $ai.getAll();
        const npcCount = npcIds.length;

        // Calculate population:
        // Base population represents the unseen masses of New Seattle
        const basePopulation = self.basePopulation || 487;
        const population = basePopulation + playerCount + npcCount;

        // Get room count
        const allRooms = await $world.getAllRooms();
        const roomCount = allRooms.length;

        // Calculate uptime
        const startTime = self.startTime || Date.now();
        const uptimeMs = Date.now() - startTime;
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        const uptimeDays = Math.floor(uptimeSeconds / 86400);
        const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
        const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

        let uptimeStr = '';
        if (uptimeDays > 0) uptimeStr += uptimeDays + 'd ';
        if (uptimeHours > 0 || uptimeDays > 0) uptimeStr += uptimeHours + 'h ';
        uptimeStr += uptimeMinutes + 'm';

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            online: true,
            population: population,
            rooms: roomCount,
            uptime: uptimeStr,
            uptimeMs: uptimeMs,
            timestamp: Date.now(),
            version: '0.1.0',
            ports: {
              telnet: 5555,
              ssh: 5556,
              web: 80,
              websocket: 8080
            }
          })
        };
      } catch (err) {
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to get status', online: false })
        };
      }
    `,
    );

    // /api/news - inline the handler
    const newsRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'News API',
      segment: 'news',
      methods: ['GET'],
      contentType: 'application/json',
    });

    newsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};

      try {
        // Get news from $.news
        if (!$.news) {
          return {
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [], timestamp: Date.now() })
          };
        }

        const limit = parseInt(meta.query?.limit) || 10;
        const category = meta.query?.category;

        const items = await $.news.getForApi({ limit, category });

        return {
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: items,
            timestamp: Date.now()
          })
        };
      } catch (err) {
        return {
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to get news', items: [] })
        };
      }
    `,
    );

    // /api/map/* routes
    const mapApiRoute = await this.createRoute(webRoute, apiRoute, {
      name: 'Map API',
      segment: 'map',
      methods: ['GET'],
      contentType: 'application/json',
    });

    // /api/map/rooms - inline the handler
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

    // /api/map/players - inline the handler
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

    // /docs route parent
    const docsRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'Docs Route',
      segment: 'docs',
      methods: ['GET'],
      contentType: 'text/html',
    });

    // /docs (no wildcard) - serve index
    docsRoute.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const fs = await import('fs');

      const filePath = './docs/WHAT-IS-MALICE.md';

      try {
        if (!fs.existsSync(filePath)) {
          return {
            status: 404,
            contentType: 'text/html',
            body: '<h1>Documentation not found</h1>'
          };
        }

        const markdown = fs.readFileSync(filePath, 'utf-8');

        // Convert markdown to HTML (basic)
        let html = markdown
          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
          .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
          .replace(/\\\`\\\`\\\`(\\w*)([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre class="bg-malice-surface p-4 rounded my-4 overflow-x-auto"><code>$2</code></pre>')
          .replace(/\\\`([^\\\`]+)\\\`/g, '<code class="bg-malice-surface px-1 rounded">$1</code>')
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" class="text-malice-accent hover:underline">$1</a>')
          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
          .replace(/(<li.*<\\/li>\\n?)+/g, '<ul class="list-disc my-4">$&</ul>')
          .replace(/\\n\\n/g, '</p><p class="my-4">')
          .replace(/\\n/g, '<br>');

        // Wrap in paragraph if needed
        if (!html.startsWith('<')) {
          html = '<p class="my-4">' + html + '</p>';
        }

        // Get doc template
        const docTemplate = $.docTemplate;
        if (docTemplate) {
          const title = markdown.match(/^# (.+)$/m)?.[1] || 'Documentation';
          const fullHtml = await docTemplate.render({
            title: title + ' - Malice',
            content: '<article class="prose prose-invert max-w-none">' + html + '</article>',
          });
          return { status: 200, contentType: 'text/html', body: fullHtml };
        }

        return { status: 200, contentType: 'text/html', body: html };
      } catch (err) {
        return {
          status: 500,
          contentType: 'text/html',
          body: 'Error loading documentation: ' + String(err)
        };
      }
    `,
    );

    // /docs/* wildcard handler - inline the handler
    const docsWildcard = await this.createRoute(webRoute, docsRoute, {
      name: 'Docs Wildcard',
      segment: '*',
      methods: ['GET'],
      contentType: 'text/html',
    });

    docsWildcard.setMethod(
      'handleRequest',
      `
      const meta = args[0] || {};
      const docName = self.match || '';
      const fs = await import('fs');
      const path = await import('path');

      // Map URL to file path (case-insensitive)
      let filePath = '';
      if (!docName || docName === '') {
        filePath = './docs/WHAT-IS-MALICE.md';
      } else {
        // Try exact match first, then uppercase
        const baseName = docName.endsWith('.md') ? docName : docName + '.md';
        const exactPath = './docs/' + baseName;
        const upperPath = './docs/' + baseName.toUpperCase();
        
        if (fs.existsSync(exactPath)) {
          filePath = exactPath;
        } else if (fs.existsSync(upperPath)) {
          filePath = upperPath;
        } else {
          // Try to find case-insensitively
          const docsDir = fs.readdirSync('./docs');
          const match = docsDir.find(f => f.toLowerCase() === baseName.toLowerCase());
          filePath = match ? './docs/' + match : exactPath;
        }
      }

      try {
        if (!fs.existsSync(filePath)) {
          return {
            status: 404,
            contentType: 'text/html',
            body: '<h1>Documentation not found</h1><p>File: ' + filePath + '</p>'
          };
        }

        const markdown = fs.readFileSync(filePath, 'utf-8');

        // Convert markdown to HTML (basic)
        let html = markdown
          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold mt-6 mb-2">$1</h3>')
          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-8 mb-3">$1</h2>')
          .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
          .replace(/\\\`\\\`\\\`(\\w*)([\\s\\S]*?)\\\`\\\`\\\`/g, '<pre class="bg-malice-surface p-4 rounded my-4 overflow-x-auto"><code>$2</code></pre>')
          .replace(/\\\`([^\\\`]+)\\\`/g, '<code class="bg-malice-surface px-1 rounded">$1</code>')
          .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
          .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
          .replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href="$2" class="text-malice-accent hover:underline">$1</a>')
          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
          .replace(/(<li.*<\\/li>\\n?)+/g, '<ul class="list-disc my-4">$&</ul>')
          .replace(/\\n\\n/g, '</p><p class="my-4">')
          .replace(/\\n/g, '<br>');

        // Wrap in paragraph if needed
        if (!html.startsWith('<')) {
          html = '<p class="my-4">' + html + '</p>';
        }

        // Get doc template
        const docTemplate = $.docTemplate;
        if (docTemplate) {
          const title = markdown.match(/^# (.+)$/m)?.[1] || 'Documentation';
          const fullHtml = await docTemplate.render({
            title: title + ' - Malice',
            content: '<article class="prose prose-invert max-w-none">' + html + '</article>',
          });
          return { status: 200, contentType: 'text/html', body: fullHtml };
        }

        return { status: 200, contentType: 'text/html', body: html };
      } catch (err) {
        return {
          status: 500,
          contentType: 'text/html',
          body: 'Error loading documentation: ' + String(err)
        };
      }
    `,
    );

    // /map route - inline the handler
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
      const isAdmin = meta.isAdmin || false;

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

    // /js/malice-client.js - client script
    const jsRoute = await this.createRoute(webRoute, rootRoute, {
      name: 'JS Route',
      segment: 'js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    const clientJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Client JS Route',
      segment: 'malice-client.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });

    // The client JS is defined in website-builder.ts as $.clientJsRoute
    // For now, delegate to that if it exists, otherwise return empty
    clientJsRoute.setMethod(
      'handleRequest',
      `
      const legacy = await $.clientJsRoute;
      if (legacy && legacy.getScript) {
        const script = await legacy.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 200, contentType: 'application/javascript', body: '// MaliceClient not available' };
    `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.domain) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'continuumDomain', this.domain.id);
    console.log(`✅ Registered continuumDomain alias -> #${this.domain.id}`);
  }
}
