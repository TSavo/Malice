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
   */
  private async ensureSystem(): Promise<void> {
    let system = await this.manager.load(2);
    if (!system) {
      system = await this.manager.create({
        parent: 1,
        properties: {
          name: 'System',
          authManagerId: 3, // Object ID of AuthManager
        },
        methods: {
          // Called when a new connection arrives
          onConnection: `
            const context = args[0]; // ConnectionContext

            // Load AuthManager and set as handler
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
}
