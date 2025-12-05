import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

/**
 * Builds AuthManager object (dynamic ID)
 * Handles interactive login (username/password)
 */
export class AuthManagerBuilder {
  private authManager: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.authManager) {
      this.authManager = await this.manager.load(aliases.authManager);
      if (this.authManager) return; // Already exists
    }

    // Create new AuthManager
    this.authManager = await this.manager.create({
      parent: 1,
      properties: {
        name: 'AuthManager',
        description: 'Interactive login and authentication',
        welcomeMessage: 'Welcome to Malice!\\r\\n\\r\\nLogin: ',
      },
      methods: {
        onConnect: `
          const context = args[0];
          const welcome = self.welcomeMessage;
          context.send(welcome);

          // Set state to collect username
          self._state = { stage: 'username', context: context };
        `,

        onInput: `
          const context = args[0];
          const input = args[1];

          const state = self._state || { stage: 'username' };

          if (state.stage === 'username') {
            const username = input.trim();

            if (!username) {
              context.send('Please enter a username: ');
              return;
            }

            // Check if user exists via alias lookup
            const objectManager = await $.load(0);
            const aliases = objectManager.get('aliases') || {};
            const playerPrototypeId = aliases.player;

            // Find player with this username
            const users = await context.$.db.listAll();
            const existingUser = users.find(u =>
              u.parent === playerPrototypeId &&
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
              context.send('Your account has been suspended\\\\r\\\\n');
              context.close();
              return;
            }

            // Verify password
            const valid = await player.call('checkPassword', password);

            if (!valid) {
              context.send('Invalid password\\\\r\\\\n');
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
              context.send('Password must be at least 6 characters\\\\r\\\\n');
              context.send('Choose a password: ');
              return;
            }

            // Hand off to CharGen
            const chargen = (await $).charGen;
            if (chargen) {
              await chargen.call('onNewUser', context, state.username, password);
            }
          }
        `,
      },
    });
  }

  async registerAlias(): Promise<void> {
    if (!this.authManager) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.authManager = this.authManager.id;
    objectManager.set('aliases', aliases);
    await objectManager.save();

    console.log(`✅ Registered authManager alias -> #${this.authManager.id}`);
  }
}
