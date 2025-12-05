import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

/**
 * Builds CharGen object (dynamic ID)
 * Handles character creation
 */
export class CharGenBuilder {
  private charGen: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if already exists via alias
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    if (aliases.charGen) {
      this.charGen = await this.manager.load(aliases.charGen);
      if (this.charGen) return; // Already exists
    }

    // Create new CharGen
    this.charGen = await this.manager.create({
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

          // Get Player prototype via alias
          const root = await $.load(1);
          const aliases = objectManager.get('aliases') || {};
          const playerPrototypeId = aliases.player;

          // Create Player object (inherits from Player prototype)
          const player = await context.$.create({
            parent: playerPrototypeId,
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
    if (!this.charGen) return;

    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.charGen = this.charGen.id;
    objectManager.set('aliases', aliases);
    await objectManager.save();

    console.log(`✅ Registered charGen alias -> #${this.charGen.id}`);
  }
}
