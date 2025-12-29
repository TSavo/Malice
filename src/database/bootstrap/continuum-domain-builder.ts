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
              body: self.renderSetupPage(errors, username)
            };
          }
          
          // Create the admin player
          const adminPlayer = await $recycler.create($admin, {
            name: username,
            playername: username.toLowerCase(),
            passwordHash: await $authManager.hashPassword(password),
          });
          
          // Place in start room
          const startRoom = $startRoom || await $query().prop('name').equals('S. Main St').first();
          if (startRoom) {
            await adminPlayer.moveTo(startRoom);
          }
          
          return {
            status: 200,
            contentType: 'text/html',
            body: self.renderSuccessPage(username, adminPlayer.id)
          };
          
        } catch (err) {
          return {
            status: 200,
            contentType: 'text/html',
            body: self.renderSetupPage(['Error: ' + (err.message || String(err))], '')
          };
        }
      }
      
      // GET - show setup form
      return {
        status: 200,
        contentType: 'text/html',
        body: self.renderSetupPage([], '')
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
      
      <a 
        href="/play"
        class="block w-full py-3 bg-malice-surface border border-malice-accent text-malice-accent font-bold rounded-lg hover:bg-malice-accent hover:text-malice-bg transition-colors text-center"
      >
        Connect to Game
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
        body: \`<!DOCTYPE html>
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
  <!-- Header -->
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
  
  <!-- Main Content -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Left Panel: Object Tree -->
    <div class="w-72 bg-malice-surface border-r border-gray-800 flex flex-col">
      <div class="p-2 border-b border-gray-800 flex items-center gap-2">
        <select id="treeRoot" onchange="loadTree()" class="flex-1 bg-malice-bg border border-gray-700 rounded px-2 py-1 text-sm">
          <option value="aliases">Aliases</option>
          <option value="prototypes">Prototypes</option>
          <option value="rooms">Rooms</option>
          <option value="players">Players</option>
          <option value="all">All Objects</option>
        </select>
        <button onclick="loadTree()" class="text-malice-accent hover:text-green-400">↻</button>
      </div>
      <div id="objectTree" class="flex-1 overflow-auto scrollbar p-2 text-sm"></div>
    </div>
    
    <!-- Center Panel: Object Editor -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Object Header -->
      <div id="objectHeader" class="bg-malice-surface border-b border-gray-800 px-4 py-2 hidden">
        <div class="flex items-center justify-between">
          <div>
            <span id="objectId" class="text-malice-accent font-bold"></span>
            <span id="objectName" class="ml-2 text-gray-300"></span>
          </div>
          <div class="flex gap-2">
            <button onclick="saveObject()" class="bg-malice-accent text-black px-3 py-1 rounded text-sm font-medium hover:bg-green-400">Save</button>
            <button onclick="refreshObject()" class="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Refresh</button>
          </div>
        </div>
        <div class="text-sm text-malice-muted mt-1">
          Parent: <span id="objectParent" class="text-gray-400 cursor-pointer hover:text-malice-accent" onclick="loadParent()"></span>
        </div>
      </div>
      
      <!-- Tabs -->
      <div id="objectTabs" class="bg-malice-surface border-b border-gray-800 px-4 flex hidden">
        <div class="method-tab active" onclick="showTab('properties')">Properties</div>
        <div class="method-tab" onclick="showTab('methods')">Methods</div>
        <div class="method-tab" onclick="showTab('children')">Children</div>
      </div>
      
      <!-- Properties Tab -->
      <div id="propertiesTab" class="flex-1 overflow-auto scrollbar p-4">
        <div id="propertiesContent" class="text-malice-muted text-center py-8">Select an object to view its properties</div>
      </div>
      
      <!-- Methods Tab -->
      <div id="methodsTab" class="flex-1 flex-col hidden">
        <div class="border-b border-gray-800 p-2 flex items-center gap-2 bg-malice-surface">
          <select id="methodSelect" onchange="loadMethod()" class="flex-1 bg-malice-bg border border-gray-700 rounded px-2 py-1 text-sm">
            <option value="">Select a method...</option>
          </select>
          <button onclick="saveMethod()" class="bg-malice-accent text-black px-3 py-1 rounded text-sm font-medium hover:bg-green-400">Save Method</button>
          <button onclick="addMethod()" class="bg-gray-700 text-white px-2 py-1 rounded text-sm hover:bg-gray-600">+ New</button>
        </div>
        <div id="methodEditor" class="flex-1"></div>
      </div>
      
      <!-- Children Tab -->
      <div id="childrenTab" class="flex-1 overflow-auto scrollbar p-4 hidden">
        <div id="childrenContent"></div>
      </div>
    </div>
    
    <!-- Right Panel: Code Executor -->
    <div class="w-96 bg-malice-surface border-l border-gray-800 flex flex-col">
      <div class="p-2 border-b border-gray-800 flex items-center justify-between">
        <span class="text-sm font-medium">Execute MOO Code</span>
        <button onclick="executeCode()" class="bg-malice-accent text-black px-3 py-1 rounded text-sm font-medium hover:bg-green-400">Run</button>
      </div>
      <div id="codeEditor" class="flex-1 border-b border-gray-800"></div>
      <div class="h-48 flex flex-col">
        <div class="px-2 py-1 bg-malice-bg border-b border-gray-800 text-xs text-malice-muted">Output</div>
        <pre id="codeOutput" class="flex-1 overflow-auto scrollbar p-2 text-xs bg-malice-bg text-gray-300 whitespace-pre-wrap"></pre>
      </div>
    </div>
  </div>
  
  <script>
    // State
    let currentObject = null;
    let methodEditor = null;
    let codeEditor = null;
    let currentMethod = null;
    
    // Initialize CodeMirror editors
    document.addEventListener('DOMContentLoaded', () => {
      // Method editor
      methodEditor = CodeMirror(document.getElementById('methodEditor'), {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
      });
      
      // Code executor
      codeEditor = CodeMirror(document.getElementById('codeEditor'), {
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        value: '// Execute MOO code here\\n// Available: $, $load, $query, $create, etc.\\n\\nconst rooms = await $query().parent($room).limit(5).all();\\nreturn rooms.map(r => ({ id: r.id, name: r.name }));',
      });
      
      // Load initial tree
      loadTree();
    });
    
    // API helper
    async function api(endpoint, options = {}) {
      const res = await fetch('/admin/api' + endpoint, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      return res.json();
    }
    
    // Load object tree
    async function loadTree() {
      const root = document.getElementById('treeRoot').value;
      const tree = document.getElementById('objectTree');
      tree.innerHTML = '<div class="text-malice-muted">Loading...</div>';
      
      try {
        const data = await api('/tree?root=' + root);
        if (data.error) throw new Error(data.error);
        
        tree.innerHTML = '';
        renderTree(tree, data.items, 0);
      } catch (err) {
        tree.innerHTML = '<div class="text-malice-danger">Error: ' + err.message + '</div>';
      }
    }
    
    function renderTree(container, items, depth) {
      for (const item of items) {
        const div = document.createElement('div');
        div.className = 'tree-item';
        div.style.paddingLeft = (depth * 12 + 4) + 'px';
        div.innerHTML = '<span class="text-malice-accent">#' + item.id + '</span> ' + escapeHtml(item.name || '(unnamed)');
        div.onclick = (e) => { e.stopPropagation(); loadObject(item.id); };
        container.appendChild(div);
        
        if (item.children && item.children.length > 0) {
          renderTree(container, item.children, depth + 1);
        }
      }
    }
    
    // Load object
    async function loadObject(id) {
      try {
        const data = await api('/object/' + id);
        if (data.error) throw new Error(data.error);
        
        currentObject = data;
        
        // Update header
        document.getElementById('objectHeader').classList.remove('hidden');
        document.getElementById('objectTabs').classList.remove('hidden');
        document.getElementById('objectId').textContent = '#' + data.id;
        document.getElementById('objectName').textContent = data.name || '(unnamed)';
        document.getElementById('objectParent').textContent = data.parent ? '#' + data.parent.id + ' ' + (data.parent.name || '') : 'none';
        document.getElementById('objectParent').dataset.id = data.parent?.id || '';
        
        // Update properties
        renderProperties(data.properties);
        
        // Update methods
        renderMethods(data.methods);
        
        // Update children
        renderChildren(data.children);
        
        // Highlight in tree
        document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
        
        showTab('properties');
      } catch (err) {
        alert('Error loading object: ' + err.message);
      }
    }
    
    function renderProperties(props) {
      const container = document.getElementById('propertiesContent');
      if (!props || Object.keys(props).length === 0) {
        container.innerHTML = '<div class="text-malice-muted">No properties</div>';
        return;
      }
      
      let html = '<table class="w-full text-sm"><thead><tr class="text-left text-malice-muted border-b border-gray-800"><th class="pb-2">Name</th><th class="pb-2">Value</th><th class="pb-2 w-20">Actions</th></tr></thead><tbody>';
      
      for (const [key, value] of Object.entries(props)) {
        const valueStr = formatValue(value);
        html += '<tr class="prop-row border-b border-gray-800"><td class="py-2 text-malice-accent">' + escapeHtml(key) + '</td>';
        html += '<td class="py-2"><input type="text" data-prop="' + escapeHtml(key) + '" value="' + escapeHtml(valueStr) + '" class="bg-malice-bg border border-gray-700 rounded px-2 py-1 w-full text-sm focus:border-malice-accent focus:outline-none"></td>';
        html += '<td class="py-2"><button onclick="deleteProp(\\'' + escapeHtml(key) + '\\')" class="text-malice-danger hover:text-red-400 text-xs">Delete</button></td></tr>';
      }
      
      html += '</tbody></table>';
      html += '<div class="mt-4 flex gap-2"><input type="text" id="newPropName" placeholder="New property name" class="bg-malice-bg border border-gray-700 rounded px-2 py-1 text-sm flex-1 focus:border-malice-accent focus:outline-none">';
      html += '<button onclick="addProp()" class="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">Add Property</button></div>';
      
      container.innerHTML = html;
    }
    
    function formatValue(value) {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (typeof value === 'object') {
        if (value.type === 'objref') return '#' + value.value;
        return JSON.stringify(value);
      }
      return String(value);
    }
    
    function renderMethods(methods) {
      const select = document.getElementById('methodSelect');
      select.innerHTML = '<option value="">Select a method...</option>';
      
      if (!methods) return;
      
      for (const name of Object.keys(methods).sort()) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
      }
    }
    
    function loadMethod() {
      const name = document.getElementById('methodSelect').value;
      if (!name || !currentObject) return;
      
      currentMethod = name;
      const code = currentObject.methods[name] || '';
      methodEditor.setValue(code);
    }
    
    function renderChildren(children) {
      const container = document.getElementById('childrenContent');
      if (!children || children.length === 0) {
        container.innerHTML = '<div class="text-malice-muted">No children</div>';
        return;
      }
      
      let html = '<div class="space-y-1">';
      for (const child of children) {
        html += '<div class="tree-item" onclick="loadObject(' + child.id + ')"><span class="text-malice-accent">#' + child.id + '</span> ' + escapeHtml(child.name || '(unnamed)') + '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }
    
    // Tab switching
    function showTab(tab) {
      document.querySelectorAll('.method-tab').forEach(el => el.classList.remove('active'));
      document.querySelector('.method-tab:nth-child(' + (tab === 'properties' ? 1 : tab === 'methods' ? 2 : 3) + ')').classList.add('active');
      
      document.getElementById('propertiesTab').classList.toggle('hidden', tab !== 'properties');
      document.getElementById('methodsTab').classList.toggle('hidden', tab !== 'methods');
      document.getElementById('methodsTab').classList.toggle('flex', tab === 'methods');
      document.getElementById('childrenTab').classList.toggle('hidden', tab !== 'children');
      
      if (tab === 'methods') {
        setTimeout(() => methodEditor.refresh(), 10);
      }
    }
    
    // Save object properties
    async function saveObject() {
      if (!currentObject) return;
      
      const props = {};
      document.querySelectorAll('[data-prop]').forEach(input => {
        const key = input.dataset.prop;
        let value = input.value;
        
        // Parse value
        if (value === 'null') value = null;
        else if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value.match(/^#\\d+$/)) value = { type: 'objref', value: parseInt(value.slice(1)) };
        else if (value.match(/^-?\\d+$/)) value = parseInt(value);
        else if (value.match(/^-?\\d+\\.\\d+$/)) value = parseFloat(value);
        else if (value.startsWith('[') || value.startsWith('{')) {
          try { value = JSON.parse(value); } catch {}
        }
        
        props[key] = value;
      });
      
      try {
        const data = await api('/object/' + currentObject.id, {
          method: 'PUT',
          body: JSON.stringify({ properties: props }),
        });
        
        if (data.error) throw new Error(data.error);
        alert('Saved!');
        loadObject(currentObject.id);
      } catch (err) {
        alert('Error saving: ' + err.message);
      }
    }
    
    // Save method
    async function saveMethod() {
      if (!currentObject || !currentMethod) return;
      
      const code = methodEditor.getValue();
      
      try {
        const data = await api('/object/' + currentObject.id + '/method/' + currentMethod, {
          method: 'PUT',
          body: JSON.stringify({ code }),
        });
        
        if (data.error) throw new Error(data.error);
        alert('Method saved!');
        loadObject(currentObject.id);
      } catch (err) {
        alert('Error saving method: ' + err.message);
      }
    }
    
    // Add new method
    async function addMethod() {
      const name = prompt('Method name:');
      if (!name || !currentObject) return;
      
      try {
        const data = await api('/object/' + currentObject.id + '/method/' + name, {
          method: 'PUT',
          body: JSON.stringify({ code: '// New method\\nreturn null;' }),
        });
        
        if (data.error) throw new Error(data.error);
        loadObject(currentObject.id);
        
        setTimeout(() => {
          document.getElementById('methodSelect').value = name;
          loadMethod();
          showTab('methods');
        }, 100);
      } catch (err) {
        alert('Error adding method: ' + err.message);
      }
    }
    
    // Add new property
    async function addProp() {
      const name = document.getElementById('newPropName').value.trim();
      if (!name || !currentObject) return;
      
      try {
        const props = { ...currentObject.properties, [name]: null };
        const data = await api('/object/' + currentObject.id, {
          method: 'PUT',
          body: JSON.stringify({ properties: props }),
        });
        
        if (data.error) throw new Error(data.error);
        loadObject(currentObject.id);
      } catch (err) {
        alert('Error adding property: ' + err.message);
      }
    }
    
    // Delete property
    async function deleteProp(name) {
      if (!currentObject || !confirm('Delete property "' + name + '"?')) return;
      
      try {
        const data = await api('/object/' + currentObject.id + '/property/' + name, {
          method: 'DELETE',
        });
        
        if (data.error) throw new Error(data.error);
        loadObject(currentObject.id);
      } catch (err) {
        alert('Error deleting property: ' + err.message);
      }
    }
    
    // Execute code
    async function executeCode() {
      const code = codeEditor.getValue();
      const output = document.getElementById('codeOutput');
      output.textContent = 'Executing...';
      
      try {
        const data = await api('/execute', {
          method: 'POST',
          body: JSON.stringify({ code }),
        });
        
        if (data.error) {
          output.innerHTML = '<span class="text-malice-danger">Error: ' + escapeHtml(data.error) + '</span>';
        } else {
          output.textContent = JSON.stringify(data.result, null, 2);
        }
      } catch (err) {
        output.innerHTML = '<span class="text-malice-danger">Error: ' + escapeHtml(err.message) + '</span>';
      }
    }
    
    // Search objects
    async function searchObjects() {
      const query = document.getElementById('searchInput').value.trim();
      if (!query) return loadTree();
      
      const tree = document.getElementById('objectTree');
      tree.innerHTML = '<div class="text-malice-muted">Searching...</div>';
      
      try {
        const data = await api('/search?q=' + encodeURIComponent(query));
        if (data.error) throw new Error(data.error);
        
        tree.innerHTML = '';
        if (data.items.length === 0) {
          tree.innerHTML = '<div class="text-malice-muted">No results</div>';
          return;
        }
        
        renderTree(tree, data.items, 0);
      } catch (err) {
        tree.innerHTML = '<div class="text-malice-danger">Error: ' + err.message + '</div>';
      }
    }
    
    // Keyboard shortcuts
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchObjects();
    });
    
    // Helper
    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    
    function refreshObject() {
      if (currentObject) loadObject(currentObject.id);
    }
    
    function loadParent() {
      const parentId = document.getElementById('objectParent').dataset.id;
      if (parentId) loadObject(parseInt(parentId));
    }
  </script>
</body>
</html>\`
      };
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
      // Try new modular client first, fall back to legacy
      const newClient = $.maliceClientJs;
      if (newClient && newClient.getScript) {
        const script = await newClient.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }

      const legacy = $.clientJsRoute;
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

    // === NEW DESKTOP CLIENT MODULES ===

    // /js/desktop.js - Desktop entry point
    const desktopJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Desktop JS Route',
      segment: 'desktop.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    desktopJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.desktopJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/window.js - Base Window class
    const windowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Window JS Route',
      segment: 'window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    windowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.windowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/terminal-window.js - Terminal window class
    const terminalWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'TerminalWindow JS Route',
      segment: 'terminal-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    terminalWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.terminalWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/html-window.js - HtmlWindow class
    const htmlWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'HtmlWindow JS Route',
      segment: 'html-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    htmlWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.htmlWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/iframe-window.js - IframeWindow class
    const iframeWindowJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'IframeWindow JS Route',
      segment: 'iframe-window.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    iframeWindowJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.iframeWindowJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/taskbar.js - Taskbar class
    const taskbarJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'Taskbar JS Route',
      segment: 'taskbar.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    taskbarJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.taskbarJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
    `,
    );

    // /js/window-manager.js - WindowManager class
    const windowManagerJsRoute = await this.createRoute(webRoute, jsRoute, {
      name: 'WindowManager JS Route',
      segment: 'window-manager.js',
      methods: ['GET'],
      contentType: 'application/javascript',
    });
    windowManagerJsRoute.setMethod(
      'handleRequest',
      `
      const mod = $.windowManagerJs;
      if (mod && mod.getScript) {
        const script = await mod.getScript();
        return {
          status: 200,
          contentType: 'application/javascript',
          body: script,
          headers: { 'Cache-Control': 'public, max-age=3600' }
        };
      }
      return { status: 404, contentType: 'text/plain', body: 'Module not found' };
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
