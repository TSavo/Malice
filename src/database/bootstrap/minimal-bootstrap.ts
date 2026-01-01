import type { ObjectManager } from '../object-manager';

/**
 * Minimal Bootstrap - Creates only the absolute essentials
 *
 * Creates:
 * - #1 Root: Empty base object (always #1, parent of all objects)
 * - #2 System: Connection router (registered as $.system)
 *
 * World is automatically built on first run (prototypes + core systems)
 */
export class MinimalBootstrap {
  constructor(private manager: ObjectManager) {}

  /**
   * Bootstrap the minimal required objects
   */
  async bootstrap(): Promise<void> {
    await this.ensureRoot();
    await this.ensureSystem();
    await this.registerCoreAliases();

    console.log('✅ Minimal bootstrap complete');
  }

  /**
   * Register core aliases in #0.properties.aliases (ObjectManager)
   */
  private async registerCoreAliases(): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    // Register core aliases
    if (!aliases.nothing) aliases.nothing = -1;
    if (!aliases.object_manager) aliases.object_manager = 0;
    if (!aliases.root) aliases.root = 1;
    if (!aliases.system) aliases.system = 2;

    objectManager.set('aliases', aliases);

    // Add alias management methods to #0
    if (!objectManager.hasMethod('addAlias')) {
      objectManager.setMethod(
        'addAlias',
        `
        /** Register a system alias.
         *  Usage: await $[0].addAlias('myUtil', obj.id)
         *  @param name - Alias name (becomes $.name)
         *  @param objId - Object ID to alias
         *  @returns true on success
         */
        const name = args[0];
        const objId = args[1];

        if (!name || typeof name !== 'string') {
          throw new Error('addAlias: name required');
        }
        if (objId === undefined || objId === null) {
          throw new Error('addAlias: objId required');
        }

        const aliases = self.aliases || {};
        aliases[name] = objId;
        self.aliases = aliases;
        return true;
      `,
      );
    }

    if (!objectManager.hasMethod('removeAlias')) {
      objectManager.setMethod(
        'removeAlias',
        `
        /** Remove a system alias.
         *  Usage: await $[0].removeAlias('myUtil')
         *  @param name - Alias name to remove
         *  @returns true if removed, false if didn't exist
         */
        const name = args[0];

        if (!name || typeof name !== 'string') {
          throw new Error('removeAlias: name required');
        }

        // Protect core aliases
        const protected_aliases = ['nothing', 'object_manager', 'root', 'system'];
        if (protected_aliases.includes(name)) {
          throw new Error('removeAlias: cannot remove protected alias ' + name);
        }

        const aliases = self.aliases || {};
        if (aliases[name] === undefined) {
          return false;
        }

        delete aliases[name];
        self.aliases = aliases;
        return true;
      `,
      );
    }

    if (!objectManager.hasMethod('getAlias')) {
      objectManager.setMethod(
        'getAlias',
        `
        /** Get an alias by name.
         *  Usage: const id = await $[0].getAlias('myUtil')
         *  @param name - Alias name
         *  @returns Object ID or undefined
         */
        const name = args[0];
        const aliases = self.aliases || {};
        return aliases[name];
      `,
      );
    }

    if (!objectManager.hasMethod('clearAliasesForObject')) {
      objectManager.setMethod(
        'clearAliasesForObject',
        `
        /** Remove all aliases pointing to a specific object ID.
         *  Used by recycler to clean up when deleting objects.
         *  Usage: await $[0].clearAliasesForObject(123)
         *  @param objId - Object ID to clear aliases for
         *  @returns number of aliases removed
         */
        const objId = args[0];

        if (objId === undefined || objId === null) {
          return 0;
        }

        const aliases = self.aliases || {};
        let removed = 0;

        // Find and remove all aliases pointing to this object
        for (const [name, id] of Object.entries(aliases)) {
          if (id === objId) {
            delete aliases[name];
            removed++;
          }
        }

        if (removed > 0) {
          self.aliases = aliases;
        }

        return removed;
      `,
      );
    }

    // === GLOBAL MULTIPLEXED CHANNEL BROADCASTS ===

    if (!objectManager.hasMethod('broadcastState')) {
      objectManager.setMethod(
        'broadcastState',
        `
        /**
         * Send state channel message to all connected multiplexed clients globally
         * @param type - State message type (e.g., 'announcement', 'event')
         * @param data - State data payload
         * @returns Number of clients messaged
         */
        const type = args[0];
        const data = args[1];

        // Find all players with active connections
        const players = await $query()
          .parent($player)
          .prop('connection').exists()
          .all();

        let count = 0;
        for (const p of players) {
          if (p.state) {
            try {
              await p.call('state', type, data);
              count++;
            } catch (e) {
              // Ignore - player may not have mux connection
            }
          }
        }
        return count;
        `,
      );
    }

    if (!objectManager.hasMethod('broadcastCtrl')) {
      objectManager.setMethod(
        'broadcastCtrl',
        `
        /**
         * Send ctrl channel message to all connected multiplexed clients globally
         * @param type - Ctrl message type (e.g., 'mode', 'prompt')
         * @param data - Ctrl data payload
         * @returns Number of clients messaged
         */
        const type = args[0];
        const data = args[1];

        const players = await $query()
          .parent($player)
          .prop('connection').exists()
          .all();

        let count = 0;
        for (const p of players) {
          if (p.ctrl) {
            try {
              await p.call('ctrl', type, data);
              count++;
            } catch (e) {
              // Ignore - player may not have mux connection
            }
          }
        }
        return count;
        `,
      );
    }

    if (!objectManager.hasMethod('broadcastChannel')) {
      objectManager.setMethod(
        'broadcastChannel',
        `
        /**
         * Send message on any channel to all connected multiplexed clients globally
         * @param channel - Channel name (e.g., 'custom:alerts')
         * @param data - Message payload
         * @returns Number of clients messaged
         */
        const channel = args[0];
        const data = args[1];

        const players = await $query()
          .parent($player)
          .prop('connection').exists()
          .all();

        let count = 0;
        for (const p of players) {
          if (p.channel) {
            try {
              await p.call('channel', channel, data);
              count++;
            } catch (e) {
              // Ignore - player may not have mux connection
            }
          }
        }
        return count;
        `,
      );
    }

    console.log('✅ Registered core aliases in #0.properties.aliases');
  }

  /**
   * Ensure Root object #1 exists
   * Base of all inheritance, stores global configuration
   *
   * Note: Root is a special bootstrap object created via db.create() with explicit ID.
   * Normal objects should be created via $.recycler which uses manager.create().
   */
  private async ensureRoot(): Promise<void> {
    let root = await this.manager.load(1);
    if (!root) {
      // Create directly in database with explicit ID (bootstrap-only pattern)
      await this.manager.db.create({
        _id: 1,
        parent: { type: 'objref', target: 'object', id: 0 },
        properties: {
          name: { type: 'string', value: 'Root' },
          description: { type: 'string', value: 'Base of all objects' },
          config: {
            type: 'object',
            value: {
              siteName: { type: 'string', value: 'Malice' },
              motd: { type: 'string', value: 'Welcome to Malice!' },
              maxConnections: { type: 'number', value: 100 },
            },
          },
        },
        methods: {},
      });
      // Now load it to get the RuntimeObject
      root = await this.manager.load(1);
      console.log('✅ Created Root object #1');
    }
  }

  /**
   * Ensure System object exists
   * Routes new connections to appropriate handlers
   */
  private async ensureSystem(): Promise<void> {
    // Check if System already exists via alias OR directly by ID
    const objectManager = await this.manager.load(0);
    const aliases =
      (objectManager?.get('aliases') as Record<string, number>) || {};

    let system = aliases.system
      ? await this.manager.load(aliases.system)
      : null;

    // Also check if #2 exists directly (in case alias wasn't registered yet)
    if (!system) {
      system = await this.manager.load(2);
    }

    if (!system) {
      // Create directly in database with explicit ID (bootstrap-only pattern)
      // Normal objects should be created via $.recycler
      await this.manager.db.create({
        _id: 2,
        parent: { type: 'objref', target: 'object', id: 1 },
        properties: {
          name: { type: 'string', value: 'System' },
          description: {
            type: 'string',
            value: 'Connection router and system coordinator',
          },
        },
        methods: {},
      });
      // Now load it to get the RuntimeObject
      system = await this.manager.load(2);
      if (!system)
        throw new Error('Failed to load System object after creation');

      // Called when a new connection arrives
      system.setMethod(
        'onConnection',
        `
        const context = args[0];
        const authInfo = context.getAuthInfo();

        // Check if world is built
        const authManager = await $.authManager;
        if (!authManager) {
          context.send('\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('  MALICE - System Not Initialized\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('\\r\\n');
          context.send('The game world has not been built yet.\\r\\n');
          context.send('This should not happen - world builds automatically on startup.\\r\\n');
          context.send('Please restart the server.\\r\\n');
          context.send('\\r\\n');
          context.close();
          return;
        }

        // REQUIRE authentication - no anonymous connections
        if (!authInfo || authInfo.mode === 'none') {
          context.send('\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('  MALICE - Authentication Required\\r\\n');
          context.send('═══════════════════════════════════════════════════════════\\r\\n');
          context.send('\\r\\n');
          context.send('You must create an account on a faction website first.\\r\\n');
          context.send('Then connect using your username and password.\\r\\n');
          context.send('\\r\\n');
          context.close();
          return;
        }

        // Route authenticated connections to PreAuthHandler
        const preAuth = await $.preAuthHandler;
        if (!preAuth) {
          context.send('Pre-authentication not available.\\r\\n');
          context.close();
          return;
        }

        context.setHandler(preAuth);
        await preAuth.onPreAuth(context, authInfo);
      `,
      );
      console.log(`✅ Created System object #${system.id}`);
    }

    // Ensure processColors exists - shared color code processing utility
    if (!system.hasMethod('processColors')) {
      system.setMethod(
        'processColors',
        `
        /** Process %{color} codes in text, converting to ANSI escape sequences.
         *  Usage: const colored = await $system.processColors('%{green}Hello%{/}');
         *  
         *  Supported codes:
         *  - Named colors: red, green, yellow, blue, magenta, cyan, white, gray
         *  - Bright: brightred, brightgreen, etc.
         *  - Styles: bold, dim, italic, underline, blink, reverse, strike
         *  - Extended: orange, pink, purple, gold, coral, etc.
         *  - Short forms: %{r}, %{g}, %{b}, %{B} (bold), etc.
         *  - 256-color: %{123} (palette index 0-255)
         *  - RGB: %{255,128,0} (true color)
         *  - Reset: %{/} or %{reset}
         *  - Background: bgred, bggreen, etc.
         *  
         *  @param text - Text with %{...} color codes
         *  @param options - Optional { color: boolean } to strip codes if false
         *  @returns Text with ANSI codes (or stripped if color disabled)
         */
        const text = args[0];
        const options = args[1] || { color: true };
        
        if (!text || typeof text !== 'string') return text;
        
        const useColor = options.color !== false;

        const colors = {
          // Reset
          '/': '\\x1b[0m',
          'reset': '\\x1b[0m',

          // Styles
          'bold': '\\x1b[1m',
          'dim': '\\x1b[2m',
          'italic': '\\x1b[3m',
          'underline': '\\x1b[4m',
          'blink': '\\x1b[5m',
          'reverse': '\\x1b[7m',
          'hidden': '\\x1b[8m',
          'strike': '\\x1b[9m',

          // Standard foreground colors
          'black': '\\x1b[30m',
          'red': '\\x1b[31m',
          'green': '\\x1b[32m',
          'yellow': '\\x1b[33m',
          'blue': '\\x1b[34m',
          'magenta': '\\x1b[35m',
          'cyan': '\\x1b[36m',
          'white': '\\x1b[37m',
          'gray': '\\x1b[90m',
          'grey': '\\x1b[90m',

          // Bright foreground colors
          'brightblack': '\\x1b[90m',
          'brightred': '\\x1b[91m',
          'brightgreen': '\\x1b[92m',
          'brightyellow': '\\x1b[93m',
          'brightblue': '\\x1b[94m',
          'brightmagenta': '\\x1b[95m',
          'brightcyan': '\\x1b[96m',
          'brightwhite': '\\x1b[97m',

          // Background colors
          'bgblack': '\\x1b[40m',
          'bgred': '\\x1b[41m',
          'bggreen': '\\x1b[42m',
          'bgyellow': '\\x1b[43m',
          'bgblue': '\\x1b[44m',
          'bgmagenta': '\\x1b[45m',
          'bgcyan': '\\x1b[46m',
          'bgwhite': '\\x1b[47m',

          // Bright background colors
          'bgbrightblack': '\\x1b[100m',
          'bgbrightred': '\\x1b[101m',
          'bgbrightgreen': '\\x1b[102m',
          'bgbrightyellow': '\\x1b[103m',
          'bgbrightblue': '\\x1b[104m',
          'bgbrightmagenta': '\\x1b[105m',
          'bgbrightcyan': '\\x1b[106m',
          'bgbrightwhite': '\\x1b[107m',

          // Extended named colors (256-color palette)
          'orange': '\\x1b[38;5;208m',
          'pink': '\\x1b[38;5;213m',
          'purple': '\\x1b[38;5;129m',
          'brown': '\\x1b[38;5;94m',
          'lime': '\\x1b[38;5;118m',
          'teal': '\\x1b[38;5;30m',
          'navy': '\\x1b[38;5;17m',
          'maroon': '\\x1b[38;5;52m',
          'olive': '\\x1b[38;5;58m',
          'silver': '\\x1b[38;5;7m',
          'gold': '\\x1b[38;5;220m',
          'coral': '\\x1b[38;5;209m',
          'salmon': '\\x1b[38;5;173m',
          'violet': '\\x1b[38;5;177m',
          'indigo': '\\x1b[38;5;54m',
          'crimson': '\\x1b[38;5;160m',
          'azure': '\\x1b[38;5;39m',
          'aqua': '\\x1b[38;5;51m',
          'turquoise': '\\x1b[38;5;80m',
          'chartreuse': '\\x1b[38;5;118m',
          'tan': '\\x1b[38;5;180m',
          'khaki': '\\x1b[38;5;143m',
          'lavender': '\\x1b[38;5;183m',
          'plum': '\\x1b[38;5;96m',
          'mint': '\\x1b[38;5;121m',
          'peach': '\\x1b[38;5;217m',
          'ivory': '\\x1b[38;5;230m',
          'beige': '\\x1b[38;5;230m',
          'hotpink': '\\x1b[38;5;206m',
          'deeppink': '\\x1b[38;5;198m',
          'skyblue': '\\x1b[38;5;117m',
          'steelblue': '\\x1b[38;5;67m',
          'forestgreen': '\\x1b[38;5;28m',
          'seagreen': '\\x1b[38;5;78m',
          'slategray': '\\x1b[38;5;66m',
          'darkgray': '\\x1b[38;5;240m',
          'lightgray': '\\x1b[38;5;250m',

          // Short forms for foreground
          'k': '\\x1b[30m', // black
          'r': '\\x1b[31m',
          'g': '\\x1b[32m',
          'y': '\\x1b[33m',
          'b': '\\x1b[34m',
          'm': '\\x1b[35m',
          'c': '\\x1b[36m',
          'w': '\\x1b[37m',
          'd': '\\x1b[90m', // dim/gray
          'o': '\\x1b[38;5;208m', // orange
          'p': '\\x1b[38;5;129m', // purple

          // Short forms for styles
          'B': '\\x1b[1m',  // bold
          'D': '\\x1b[2m',  // dim
          'I': '\\x1b[3m',  // italic
          'U': '\\x1b[4m',  // underline
          'R': '\\x1b[7m',  // reverse
          'S': '\\x1b[9m',  // strikethrough
        };

        // Replace %{...} patterns
        return text.replace(/%\\{([^}]+)\\}/g, (match, code) => {
          if (!useColor) return ''; // Strip color codes

          const lower = code.toLowerCase();

          // Named color or short form
          if (colors[code] || colors[lower]) {
            return colors[code] || colors[lower];
          }

          // 256-color palette: %{123}
          const num = parseInt(code, 10);
          if (!isNaN(num) && num >= 0 && num <= 255) {
            return '\\x1b[38;5;' + num + 'm';
          }

          // RGB true color: %{r,g,b}
          const rgb = code.split(',').map(n => parseInt(n.trim(), 10));
          if (rgb.length === 3 && rgb.every(n => !isNaN(n) && n >= 0 && n <= 255)) {
            return '\\x1b[38;2;' + rgb[0] + ';' + rgb[1] + ';' + rgb[2] + 'm';
          }

          // Unknown - leave as-is
          return match;
        });
        `,
      );
    }

    // Always ensure tickAllPlayers exists (may not exist on older systems)
    if (!system.hasMethod('tickAllPlayers')) {
      // Tick all online players (heartbeat)
      // Called by scheduler every minute
      system.setMethod(
        'tickAllPlayers',
        `
        const authManager = $.authManager;
        if (!authManager) return { error: 'No authManager' };

        const onlinePlayers = authManager.onlinePlayers || [];
        const results = [];

        for (const playerId of onlinePlayers) {
          const player = await $load(playerId);
          if (player && player.heartbeat) {
            try {
              await player.heartbeat();
              results.push({ player: playerId, success: true });
            } catch (err) {
              results.push({ player: playerId, success: false, error: String(err) });
            }
          }
        }

        return { tickedPlayers: results.length, results: results };
      `,
      );
    }

    // Auth token storage for web pre-auth
    // Always update these methods to ensure correct implementation
    system.setMethod(
      'storeAuthToken',
      `
      /** Store a one-time auth token for web pre-authentication.
       *  @param token - UUID token string
       *  @param playerId - Player object ID
       *  @param expiresAt - Timestamp when token expires
       */
      const token = args[0];
      const playerId = args[1];
      const expiresAt = args[2];

      // Must reassign whole object to trigger persistence
      const tokens = self.authTokens || {};
      tokens[token] = { playerId, expiresAt };
      self.authTokens = tokens;
      `,
    );

    system.setMethod(
      'validateAuthToken',
      `
      /** Validate and consume a one-time auth token.
       *  @param token - Token to validate
       *  @returns Player ID if valid, null otherwise
       */
      const token = args[0];

      const tokens = self.authTokens || {};
      const entry = tokens[token];

      if (!entry) {
        return null;
      }

      // Check expiration
      if (Date.now() > entry.expiresAt) {
        delete tokens[token];
        self.authTokens = tokens;
        return null;
      }

      // One-time use - delete after validation
      const playerId = entry.playerId;
      delete tokens[token];
      self.authTokens = tokens;

      return playerId;
      `,
    );
  }
}
