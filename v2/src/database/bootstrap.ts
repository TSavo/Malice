import { ObjectManager } from './object-manager.js';

/**
 * Bootstrap core game objects
 * Creates the fundamental objects needed for the game to function
 */
export class GameBootstrap {
  constructor(private manager: ObjectManager) {}

  /**
   * Initialize all core objects
   */
  async bootstrap(): Promise<void> {
    await this.ensureRoot();
    await this.ensureSystem();
    await this.ensureAuthManager();
    await this.ensureCharGen();
    await this.ensurePreAuthHandler();
    await this.ensureDescribable();
    await this.ensureAgent();
    await this.ensureHuman();
    await this.ensurePlayer();

    // Register core aliases dynamically
    await this.registerCoreAliases();
  }

  /**
   * Register core system aliases
   * These are loaded from MongoDB object IDs and made available as $.alias
   * In the future, this mapping could be stored in MongoDB itself
   */
  private async registerCoreAliases(): Promise<void> {
    await this.manager.registerAliasById('system', 2);
    await this.manager.registerAliasById('authManager', 3);
    await this.manager.registerAliasById('charGen', 4);
    await this.manager.registerAliasById('preAuthHandler', 5);
    await this.manager.registerAliasById('describable', 10);
    await this.manager.registerAliasById('agent', 11);
    await this.manager.registerAliasById('human', 12);
    await this.manager.registerAliasById('player', 13);

    console.log('✅ Registered core system aliases');
  }

  /**
   * Ensure root object #1 exists
   */
  private async ensureRoot(): Promise<void> {
    let root = await this.manager.load(1);
    if (!root) {
      root = await this.manager.create({
        parent: 0,
        properties: {},
        methods: {},
      });
      console.log('✅ Created root object #1');
    }
  }

  /**
   * Ensure System object #2 exists
   * Handles system-level operations like connection handling
   * Routes to interactive auth or pre-auth based on transport credentials
   */
  private async ensureSystem(): Promise<void> {
    let system = await this.manager.load(2);
    if (!system) {
      system = await this.manager.create({
        parent: 1,
        properties: {
          name: 'System',
        },
        methods: {
          // Called when a new connection arrives
          onConnection: `
            const context = args[0]; // ConnectionContext
            const authInfo = context.getAuthInfo();

            if (authInfo === null) {
              // Mode 1: No transport auth - interactive login required
              const authManager = await $.authManager;

              if (!authManager) {
                context.send('Error: Authentication system not available.\\r\\n');
                context.close();
                return;
              }

              // Set AuthManager as input handler
              context.setHandler(authManager);

              // Call AuthManager's onConnect
              try {
                await authManager.call('onConnect', context);
              } catch (err) {
                console.error('Error in AuthManager.onConnect:', err);
                context.send('Error initializing connection.\\r\\n');
                context.close();
              }
            } else {
              // Mode 2: Transport provided auth credentials - validate them
              const preAuthHandler = await $.preAuthHandler;

              if (!preAuthHandler) {
                context.send('Error: Pre-authentication system not available.\\r\\n');
                context.close();
                return;
              }

              // Set PreAuthHandler as input handler
              context.setHandler(preAuthHandler);

              // Call PreAuthHandler's onPreAuth with auth info
              try {
                await preAuthHandler.call('onPreAuth', context, authInfo);
              } catch (err) {
                console.error('Error in PreAuthHandler.onPreAuth:', err);
                context.send('Error processing authentication.\\r\\n');
                context.close();
              }
            }
          `,
        },
      });
      console.log('✅ Created System object #2');
    }
  }

  /**
   * Ensure AuthManager object #3 exists
   * Handles login screen and authentication
   */
  private async ensureAuthManager(): Promise<void> {
    let auth = await this.manager.load(3);
    if (!auth) {
      auth = await this.manager.create({
        parent: 1,
        properties: {
          name: 'AuthManager',
          welcomeMessage: 'Welcome to Malice!\r\n\r\nLogin: ',
        },
        methods: {
          // Called when connection is first established
          onConnect: `
            const context = args[0]; // ConnectionContext passed in
            const welcome = self.welcomeMessage;
            context.send(welcome);

            // Set state to collect username
            self._state = { stage: 'username', context: context };
          `,

          // Called when user sends input
          onInput: `
            const context = args[0]; // ConnectionContext
            const input = args[1];   // User input

            const state = self._state || { stage: 'username' };

            if (state.stage === 'username') {
              const username = input.trim();

              if (!username) {
                context.send('Please enter a username: ');
                return;
              }

              // Check if user exists
              const users = await context.$.db.listAll();
              const existingUser = users.find(u =>
                u.parent === 13 && // Is a Player object
                u.properties.playername === username.toLowerCase()
              );

              if (existingUser) {
                // Existing user - ask for password
                self._state = { stage: 'password', username: username, userId: existingUser._id };
                context.send('Password: ');
              } else {
                // New user - ask for password to create account
                self._state = { stage: 'new-password', username: username };
                context.send('New user! Choose a password: ');
              }
            } else if (state.stage === 'password') {
              // Login existing user
              const password = input.trim();

              // Load user as RuntimeObject
              const player = await context.$.load(state.userId);

              // Check if suspended
              if (player.get('isSuspended')) {
                context.send('Your account has been suspended\\r\\n');
                context.close();
                return;
              }

              // Verify password
              const valid = await player.call('checkPassword', password);

              if (!valid) {
                context.send('Invalid password\\r\\n');
                context.send('Login: ');
                self._state = { stage: 'username' };
                return;
              }

              // Authenticate and connect
              context.authenticate(player.id);
              await player.call('connect', context);

            } else if (state.stage === 'new-password') {
              // Create new user
              const password = input.trim();

              if (password.length < 6) {
                context.send('Password must be at least 6 characters\\r\\n');
                context.send('Choose a password: ');
                return;
              }

              // Hand off to CharGen
              const chargen = await $.charGen;
              if (chargen) {
                await chargen.call('onNewUser', context, state.username, password);
              }
            }
          `,
        },
      });
      console.log('✅ Created AuthManager object #3');
    }
  }

  /**
   * Ensure CharGen object #4 exists
   * Handles character creation
   */
  private async ensureCharGen(): Promise<void> {
    let chargen = await this.manager.load(4);
    if (!chargen) {
      chargen = await this.manager.create({
        parent: 1,
        properties: {
          name: 'CharGen',
        },
        methods: {
          // Called when new user needs to create a character
          onNewUser: `
            const context = args[0]; // ConnectionContext
            const username = args[1];
            const password = args[2];

            context.send('=== Character Creation ===\\r\\n');
            context.send(\`Username: \${username}\\r\\n\`);
            context.send('\\r\\nCreating your character...\\r\\n');

            // Hash password
            const bcrypt = require('bcrypt');
            const passwordHash = await bcrypt.hash(password, 10);

            // Create Player object (inherits from Player prototype #13)
            const player = await context.$.create({
              parent: 13, // Inherit from Player prototype
              properties: {
                // Describable
                name: username,
                description: 'A new adventurer',
                aliases: [username.toLowerCase()],

                // Agent
                location: 0, // TODO: Set to starting room
                inventory: [],

                // Human
                sex: 'non-binary',
                pronouns: {
                  subject: 'they',
                  object: 'them',
                  possessive: 'their',
                },
                age: 25,
                species: 'human',

                // Player
                playername: username.toLowerCase(),
                email: '',
                passwordHash: passwordHash,
                canUseDevTools: false,
                isWizard: false,
                isSuspended: false,
                createdAt: new Date(),
                lastLogin: new Date(),
                totalPlaytime: 0,
                title: 'the Newbie',
              },
            });

            context.send(\`Character created! You are #\${player.id}\\r\\n\`);
            context.authenticate(player.id);

            // Call player's connect method
            await player.call('connect', context);
          `,
        },
      });
      console.log('✅ Created CharGen object #4');
    }
  }

  /**
   * Ensure PreAuthHandler object #5 exists
   * Handles pre-authenticated connections (SSL cert, HTTP auth, OAuth, etc.)
   */
  private async ensurePreAuthHandler(): Promise<void> {
    let preAuth = await this.manager.load(5);
    if (!preAuth) {
      preAuth = await this.manager.create({
        parent: 1,
        properties: {
          name: 'PreAuthHandler',
        },
        methods: {
          // Called when connection arrives with transport-level auth
          onPreAuth: `
            const context = args[0]; // ConnectionContext
            const authInfo = args[1]; // AuthInfo from transport

            context.send('Pre-authenticated connection detected\\r\\n');
            context.send(\`Auth mode: \${authInfo.mode}\\r\\n\`);

            // Route to appropriate handler based on auth mode
            try {
              switch (authInfo.mode) {
                case 'ssl-cert':
                  await self.handleSSLCert(context, authInfo.sslCert);
                  break;

                case 'http-basic':
                  await self.handleHTTPBasic(context, authInfo.httpBasic);
                  break;

                case 'oauth':
                  await self.handleOAuth(context, authInfo.oauth);
                  break;

                case 'custom':
                  await self.handleCustom(context, authInfo.custom);
                  break;

                default:
                  context.send(\`Unknown authentication mode: \${authInfo.mode}\\r\\n\`);
                  context.close();
              }
            } catch (err) {
              context.send(\`Authentication error: \${err.message}\\r\\n\`);
              context.close();
            }
          `,

          // Handle SSL client certificate authentication
          handleSSLCert: `
            const context = args[0];
            const cert = args[1];

            // Verify certificate was validated by TLS layer
            if (!cert.verified) {
              context.send('SSL certificate not verified by server\\r\\n');
              context.close();
              return;
            }

            context.send(\`Certificate CN: \${cert.commonName}\\r\\n\`);
            context.send(\`Fingerprint: \${cert.fingerprint}\\r\\n\`);

            // Find Player by SSL fingerprint or email
            const users = await context.$.db.listAll();
            const playerDoc = users.find(u =>
              u.parent === 13 && // Is a Player object
              (u.properties.sslFingerprint === cert.fingerprint ||
               u.properties.email === cert.commonName)
            );

            if (!playerDoc) {
              context.send(\`No player found for certificate: \${cert.commonName}\\r\\n\`);
              context.send('Contact an administrator to register your certificate.\\r\\n');
              context.close();
              return;
            }

            // Load as RuntimeObject
            const player = await context.$.load(playerDoc._id);

            // Check if suspended
            if (player.get('isSuspended')) {
              context.send('Your account has been suspended\\r\\n');
              context.close();
              return;
            }

            // Check if user has DevTools permission
            const canUseDevTools = player.get('canUseDevTools') === true;
            if (!canUseDevTools) {
              context.send('Your account does not have DevTools access.\\r\\n');
              context.close();
              return;
            }

            // Authenticate and connect
            context.authenticate(player.id);
            await player.call('connect', context);
          `,

          // Handle HTTP Basic Authentication
          handleHTTPBasic: `
            const context = args[0];
            const basic = args[1];

            context.send(\`Authenticating user: \${basic.username}\\r\\n\`);

            // Find Player by playername
            const users = await context.$.db.listAll();
            const userDoc = users.find(u =>
              u.parent === 13 && // Is a Player object
              u.properties.playername === basic.username.toLowerCase()
            );

            if (!userDoc) {
              context.send('Invalid username or password\\r\\n');
              context.close();
              return;
            }

            // Load as RuntimeObject to use methods
            const player = await context.$.load(userDoc._id);

            // Check if suspended
            if (player.get('isSuspended')) {
              context.send('Your account has been suspended\\r\\n');
              context.close();
              return;
            }

            // Verify password using Player's checkPassword method
            const valid = await player.call('checkPassword', basic.password);

            if (!valid) {
              context.send('Invalid username or password\\r\\n');
              context.close();
              return;
            }

            // Authenticate and connect
            context.authenticate(player.id);
            await player.call('connect', context);
          `,

          // Handle OAuth / JWT
          handleOAuth: `
            const context = args[0];
            const oauth = args[1];

            context.send('OAuth authentication not yet implemented\\r\\n');
            context.send(\`Token: \${oauth.token.substring(0, 20)}...\\r\\n\`);

            // TODO: Verify JWT token using jose or similar
            // const { jwtVerify } = require('jose');
            // const { payload } = await jwtVerify(oauth.token, publicKey);

            // TODO: Find user by OAuth subject claim
            // const user = users.find(u => u.properties.oauthSubject === payload.sub);

            context.close();
          `,

          // Handle custom authentication
          handleCustom: `
            const context = args[0];
            const custom = args[1];

            context.send(\`Custom authentication type: \${custom.type}\\r\\n\`);
            context.send('Custom authentication not yet implemented\\r\\n');
            context.close();
          `,
        },
      });
      console.log('✅ Created PreAuthHandler object #5');
    }
  }

  /**
   * Ensure Describable object #10 exists
   * Base for all things that can be described (rooms, objects, NPCs, players)
   */
  private async ensureDescribable(): Promise<void> {
    let describable = await this.manager.load(10);
    if (!describable) {
      describable = await this.manager.create({
        parent: 1,
        properties: {
          name: 'Describable',
          description: 'Base prototype for things that can be described',
          aliases: [],
        },
        methods: {
          // Return full description
          describe: `
            return \`\${self.name}\\r\\n\${self.description}\`;
          `,

          // Return short description (just name)
          shortDesc: `
            return self.name;
          `,
        },
      });
      console.log('✅ Created Describable object #10');
    }
  }

  /**
   * Ensure Agent object #11 exists
   * Base for things that can act (NPCs, players)
   */
  private async ensureAgent(): Promise<void> {
    let agent = await this.manager.load(11);
    if (!agent) {
      agent = await this.manager.create({
        parent: 10, // Inherits from Describable
        properties: {
          name: 'Agent',
          description: 'Base prototype for things that can act',
          location: 0,
          inventory: [],
        },
        methods: {
          // Move to a new location
          moveTo: `
            const targetId = args[0];
            // TODO: Notify old location
            self.location = targetId;
            // TODO: Notify new location
          `,

          // Say something in current location
          say: `
            const message = args[0];
            // TODO: Broadcast to room
            return \`\${self.name} says: \${message}\`;
          `,

          // Emote an action
          emote: `
            const action = args[0];
            // TODO: Broadcast to room
            return \`\${self.name} \${action}\`;
          `,
        },
      });
      console.log('✅ Created Agent object #11');
    }
  }

  /**
   * Ensure Human object #12 exists
   * Base for human-like agents (players and human NPCs)
   */
  private async ensureHuman(): Promise<void> {
    let human = await this.manager.load(12);
    if (!human) {
      human = await this.manager.create({
        parent: 11, // Inherits from Agent
        properties: {
          name: 'Human',
          description: 'Base prototype for human-like agents',
          sex: 'non-binary',
          pronouns: {
            subject: 'they',
            object: 'them',
            possessive: 'their',
          },
          age: 25,
          species: 'human',
        },
        methods: {
          // Get pronoun of specified type
          pronoun: `
            const type = args[0]; // 'subject', 'object', 'possessive'
            return self.pronouns[type] || 'they';
          `,
        },
      });
      console.log('✅ Created Human object #12');
    }
  }

  /**
   * Ensure Player object #13 exists
   * Prototype for all player characters
   */
  private async ensurePlayer(): Promise<void> {
    let player = await this.manager.load(13);
    if (!player) {
      player = await this.manager.create({
        parent: 12, // Inherits from Human
        properties: {
          name: 'Player',
          description: 'Base prototype for player characters',
          playername: '',
          email: '',
          passwordHash: '',
          sslFingerprint: '',
          oauthSubject: '',

          // Permissions
          canUseDevTools: false,
          isWizard: false,
          isSuspended: false,

          // Stats
          createdAt: null,
          lastLogin: null,
          totalPlaytime: 0,

          // Player-specific
          title: '',
          homepage: '',
        },
        methods: {
          // Called when player connects
          connect: `
            const context = args[0];

            context.send(\`\\r\\nWelcome back, \${self.name}!\\r\\n\`);
            context.send(\`You are \${self.description}\\r\\n\`);

            // Update last login
            self.lastLogin = new Date();
            await self.save();

            // Show location if set
            if (self.location && self.location !== 0) {
              const location = await $.load(self.location);
              if (location) {
                const desc = await location.call('describe');
                context.send(\`\\r\\n\${desc}\\r\\n\`);
              }
            }

            // TODO: Notify others in room
          `,

          // Called when player disconnects
          disconnect: `
            // Save any unsaved state
            await self.save();

            // TODO: Notify room
          `,

          // Check if password matches
          checkPassword: `
            const password = args[0];
            const bcrypt = require('bcrypt');
            return await bcrypt.compare(password, self.passwordHash);
          `,

          // Set new password
          setPassword: `
            const password = args[0];
            const bcrypt = require('bcrypt');
            const hash = await bcrypt.hash(password, 10);
            self.passwordHash = hash;
            await self.save();
          `,
        },
      });
      console.log('✅ Created Player object #13');
    }
  }
}
