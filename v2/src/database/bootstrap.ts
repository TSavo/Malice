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
          `,

          // Called when user sends input
          onInput: `
            const context = args[0]; // ConnectionContext
            const input = args[1];   // User input

            const username = input.trim();

            if (!username) {
              context.send('Please enter a username: ');
              return;
            }

            // For now, just create new user via CharGen
            context.send(\`Creating new character for \${username}...\\r\\n\`);

            const chargen = await $.charGen;
            if (chargen) {
              await chargen.call('onNewUser', context, username);
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

            context.send('=== Character Creation ===\\r\\n');
            context.send(\`Username: \${username}\\r\\n\`);
            context.send('\\r\\nCreating your character...\\r\\n');

            // Create user object (inherits from root for now)
            const user = await context.$.create({
              parent: 1, // Inherit from root
              properties: {
                username: username,
                name: username,
                hp: 100,
                maxHp: 100,
                location: 0, // No location yet
              },
            });

            context.send(\`Character created! You are #\${user.id}\\r\\n\`);
            context.authenticate(user.id);

            // TODO: Hand off to game state manager
            context.send('Welcome to the game!\\r\\n');
            context.send('Type commands here...\\r\\n');
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

            // Find user by SSL fingerprint or email
            const users = await context.$.db.listAll();
            const user = users.find(u =>
              u.properties.sslFingerprint === cert.fingerprint ||
              u.properties.email === cert.commonName
            );

            if (!user) {
              context.send(\`No user found for certificate: \${cert.commonName}\\r\\n\`);
              context.send('Contact an administrator to register your certificate.\\r\\n');
              context.close();
              return;
            }

            // Check if user object has DevTools permission
            const canUseDevTools = user.properties.canUseDevTools === true;
            if (!canUseDevTools) {
              context.send('Your account does not have DevTools access.\\r\\n');
              context.close();
              return;
            }

            // Authenticate and welcome
            context.authenticate(user._id);
            context.send(\`Welcome back, \${user.properties.name}!\\r\\n\`);
            context.send('SSL authentication successful.\\r\\n');

            // TODO: Hand off to appropriate handler (game, devtools, etc.)
            context.send('You are now authenticated. Type commands...\\r\\n');
          `,

          // Handle HTTP Basic Authentication
          handleHTTPBasic: `
            const context = args[0];
            const basic = args[1];

            context.send(\`Authenticating user: \${basic.username}\\r\\n\`);

            // Find user by username
            const users = await context.$.db.listAll();
            const user = users.find(u =>
              u.properties.username === basic.username
            );

            if (!user) {
              context.send('Invalid username or password\\r\\n');
              context.close();
              return;
            }

            // TODO: Verify password hash (need bcrypt or similar)
            // For now, just check if passwordHash property exists
            if (!user.properties.passwordHash) {
              context.send('Account not configured for password authentication\\r\\n');
              context.close();
              return;
            }

            // TODO: Actual password verification
            // const bcrypt = require('bcrypt');
            // const valid = await bcrypt.compare(basic.password, user.properties.passwordHash);

            // Authenticate
            context.authenticate(user._id);
            context.send(\`Welcome back, \${user.properties.name}!\\r\\n\`);

            // TODO: Hand off to appropriate handler
            context.send('You are now authenticated. Type commands...\\r\\n');
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
}
