import { ObjectManager } from '../object-manager.js';

/**
 * Builds CharGen object (#5)
 * Handles character creation
 */
export class CharGenBuilder {
  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load(5);
    if (existing) return;

    await this.manager.create({
      parent: 1,
      properties: {
        name: 'CharGen',
        description: 'Character creation system',
      },
      methods: {
        onNewUser: `
          const context = args[0];
          const username = args[1];
          const password = args[2];

          context.send('=== Character Creation ===\\\\r\\\\n');
          context.send(\`Username: \${username}\\\\r\\\\n\`);
          context.send('\\\\r\\\\nCreating your character...\\\\r\\\\n');

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

          context.send(\`Character created! You are #\${player.id}\\\\r\\\\n\`);
          context.authenticate(player.id);

          // Call player's connect method
          await player.call('connect', context);
        `,
      },
    });
  }

  async registerAlias(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) return;

    const aliases = (root.get('aliases') as Record<string, number>) || {};
    aliases.charGen = 5;
    root.set('aliases', aliases);
    await root.save();
  }
}
