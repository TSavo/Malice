import type { RuntimeObject } from '../../../types/object.js';
import type { ObjectManager } from '../object-manager.js';

/**
 * Builds AuthManager object (dynamic ID)
 * Handles interactive login (username/password)
 */
export class AuthManagerBuilder {
  private authManager: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases =
      (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.authManager) {
      this.authManager = await this.manager.load(aliases.authManager);
      if (this.authManager && !forceRebuild) return; // Already exists and not forcing rebuild
    }

    if (!this.authManager) {
      // Create new AuthManager only if it doesn't exist
      const root = await this.manager.load(1);
      this.authManager = await this.manager.create({
        parent: root!,
        properties: {
          name: 'AuthManager',
          description: 'Interactive login and authentication',
          welcomeMessage: '', // Set dynamically via showUplinkSequence
          uplinkSequence: [
            {
              delay: 0,
              text: '\r\n%{green}[NEURAL INTERFACE]%{/} Initializing...\r\n',
            },
            {
              delay: 400,
              text: '%{dim}> Calibrating synaptic bridge...%{/}\r\n',
            },
            {
              delay: 600,
              text: '%{dim}> Establishing encrypted tunnel...%{/}\r\n',
            },
            {
              delay: 800,
              text: '%{green}[OK]%{/} Handshake complete\r\n',
            },
            {
              delay: 400,
              text: '\r\n%{green}[NETWORK]%{/} Scanning for access points...\r\n',
            },
            {
              delay: 500,
              text: '%{dim}> Node detected: PIONEER-SQUARE-7%{/}\r\n',
            },
            {
              delay: 400,
              text: '%{dim}> Signal strength: 94%%{/}\r\n',
            },
            { delay: 300, text: '%{dim}> Latency: 12ms%{/}\r\n' },
            {
              delay: 600,
              text: '%{green}[OK]%{/} Uplink to Pioneer Square established\r\n',
            },
            {
              delay: 400,
              text: '\r\n%{green}[CONTINUUM]%{/} Authenticating...\r\n',
            },
            {
              delay: 700,
              text: '%{dim}> Verifying credentials...%{/}\r\n',
            },
            {
              delay: 500,
              text: '%{green}[OK]%{/} Connected to The Continuum\r\n',
            },
            {
              delay: 300,
              text: '\r\n%{cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%{/}\r\n',
            },
            {
              delay: 100,
              text: '%{bold}%{white}                    M A L I C E%{/}\r\n',
            },
            {
              delay: 100,
              text: '%{dim}                  Seattle - 2110%{/}\r\n',
            },
            {
              delay: 100,
              text: '%{cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━%{/}\r\n',
            },
            {
              delay: 400,
              text: "\r\nType 'new' to create a character, or enter your username.\r\n\r\n> ",
            },
          ],
        },
        methods: {},
      });
    }

    // Setup methods (runs on both create and force rebuild)
    this.authManager.setMethod(
      'onConnect',
      `
          const context = args[0];
          
          // Play uplink sequence with delays
          const sequence = self.uplinkSequence || [];
          let totalDelay = 0;
          
          // Mark as playing sequence (ignore input during this time)
          self._state = { stage: 'uplink', context: context };
          
          for (const step of sequence) {
            totalDelay += step.delay;
            // Process color codes via $system.processColors
            const coloredText = await $system.processColors(step.text);
            setTimeout(() => {
              context.send(coloredText);
            }, totalDelay);
          }
          
          // After sequence completes, switch to username stage
          setTimeout(() => {
            self._state = { stage: 'username', context: context };
          }, totalDelay + 100);
        `,
    );

    this.authManager.setMethod(
      'onInput',
      `
          const context = args[0];
          const input = args[1];

          const state = self._state || { stage: 'username', attempts: 0 };
          
          // Ignore input during uplink sequence
          if (state.stage === 'uplink') {
            return;
          }

          if (state.stage === 'username') {
            const username = input.trim().toLowerCase();

            if (!username) {
              context.send('> ');
              return;
            }

            // Check for 'new' command to create character
            if (username === 'new') {
              self._state = { stage: 'new-username', attempts: 0 };
              context.send('Choose a username: ');
              return;
            }

            // Check if user exists via alias lookup
            const objectManager = await $load(0);
            const aliases = objectManager.aliases || {};
            const playerPrototypeId = aliases.player;

            // Find player with this username
            // Helper to extract value from typed Value or raw value
            const getValue = (v) => v && typeof v === 'object' && 'type' in v ? v.value : v;
            const users = await context.$.db.listAll();
            const adminPrototypeId = aliases.admin;
            const existingUser = users.find(u =>
              (getValue(u.parent) === playerPrototypeId || getValue(u.parent) === adminPrototypeId) &&
              getValue(u.properties.playername) === username
            );

            if (existingUser) {
              // Existing user - ask for password
              self._state = { stage: 'password', username: username, userId: existingUser._id, attempts: 0 };
              context.send('Password: ');
            } else {
              // User not found - increment attempts
              const attempts = (state.attempts || 0) + 1;
              if (attempts >= 3) {
                context.send('Too many failed attempts. Disconnecting.\\r\\n');
                context.close();
                return;
              }
              self._state = { stage: 'username', attempts: attempts };
              context.send(\`User '\${input.trim()}' not found. Type 'new' to create a character.\\r\\n> \`);
            }
          } else if (state.stage === 'new-username') {
            // Choosing username for new character
            const username = input.trim().toLowerCase();

            if (!username) {
              context.send('Choose a username: ');
              return;
            }

            // Validate username format
            if (!/^[a-z][a-z0-9_]{2,15}$/.test(username)) {
              context.send('Username must be 3-16 characters, start with a letter, and contain only letters, numbers, and underscores.\\r\\nChoose a username: ');
              return;
            }

            // Check if username already taken
            const objectManager = await $load(0);
            const aliases = objectManager.aliases || {};
            const playerPrototypeId = aliases.player;
            const adminPrototypeId = aliases.admin;
            const getValue = (v) => v && typeof v === 'object' && 'type' in v ? v.value : v;
            const users = await context.$.db.listAll();
            const existingUser = users.find(u =>
              (getValue(u.parent) === playerPrototypeId || getValue(u.parent) === adminPrototypeId) &&
              getValue(u.properties.playername) === username
            );

            if (existingUser) {
              // Check if existing user completed chargen
              const chargenComplete = getValue(existingUser.properties.chargenComplete);

              if (chargenComplete) {
                // Complete character - name is truly taken
                context.send('That username is already taken.\\r\\nChoose a username: ');
                return;
              }

              // Incomplete character - check if still connected
              const incompletePlayer = await context.$.load(existingUser._id);
              if (incompletePlayer && incompletePlayer._context) {
                // Still connected (doing chargen) - don't recycle
                context.send('That username is already taken.\\r\\nChoose a username: ');
                return;
              }

              // Disconnected incomplete character - recycle and allow re-registration
              console.log('[AuthManager] Recycling incomplete character:', username, 'id:', existingUser._id);
              if (incompletePlayer) {
                await $recycler.recycle(incompletePlayer);
              }
              // Fall through to create new character with this username
            }

            // Username available - ask for password
            self._state = { stage: 'new-password', username: username };
            context.send('Choose a password: ');
          } else if (state.stage === 'password') {
            // Login existing user
            const password = input.trim();

            // Ignore empty input (e.g., stray newlines)
            if (!password) {
              return;
            }

            // Load user as RuntimeObject
            const player = await context.$.load(state.userId);

            // Check if suspended
            if (player.isSuspended) {
              context.send('Your account has been suspended\\r\\n');
              context.close();
              return;
            }

            // Verify password
            const valid = await player.checkPassword(password);

            if (!valid) {
              const attempts = (state.attempts || 0) + 1;
              if (attempts >= 3) {
                context.send('Too many failed password attempts. Disconnecting.\\r\\n');
                context.close();
                return;
              }
              self._state = { ...state, attempts: attempts };
              context.send(\`Invalid password. (\${3 - attempts} attempts remaining)\\r\\nPassword: \`);
              return;
            }

            // Authenticate and connect
            context.authenticate(player.id);
            await player.connect(context);

          } else if (state.stage === 'new-password') {
            // Create new user
            const password = input.trim();

            // Ignore empty input (e.g., stray newlines)
            if (!password) {
              return;
            }

            if (password.length < 6) {
              context.send('Password must be at least 6 characters\\r\\n');
              context.send('Choose a password: ');
              return;
            }

            // Check if this is a Cartel recruit (connected via graycartel.com/descend)
            const authInfo = context.getAuthInfo();
            const chargenMode = authInfo?.metadata?.chargenMode;
            
            // Hand off to appropriate CharGen based on mode
            if (chargenMode === 'cartel' && $.cartelCharGen) {
              await $.cartelCharGen.onNewUser(context, state.username, password);
            } else if ($.charGen) {
              await $.charGen.onNewUser(context, state.username, password);
            } else {
              context.send('Character creation system not available.\\r\\n');
            }
          }
        `,
    );
  }

  async registerAlias(): Promise<void> {
    if (!this.authManager) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    await objectManager.call('addAlias', 'authManager', this.authManager.id);
    console.log(`✅ Registered authManager alias -> #${this.authManager.id}`);
  }
}
