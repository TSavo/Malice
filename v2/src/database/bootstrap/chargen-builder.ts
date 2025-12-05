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
          const objectManager = await $.load(0);
          const aliases = objectManager.get('aliases') || {};
          const playerPrototypeId = aliases.player;

          // Check if this is the first player (admin user)
          // Count existing player objects by checking objects with playername property
          const db = $.db;
          const existingPlayers = await db.objects.countDocuments({
            'properties.playername': { $exists: true, $ne: '' }
          });
          const isFirstPlayer = existingPlayers === 0;

          // Get recycler for object creation
          const recycler = await $.recycler;
          if (!recycler) {
            throw new Error('Recycler not available');
          }

          // Create Player object through recycler (inherits from Player prototype)
          // Pass null as caller since player is not yet authenticated
          const player = await recycler.call('create', {
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
              canUseDevTools: isFirstPlayer,
              isWizard: isFirstPlayer,
              isSuspended: false,
              createdAt: new Date(),
              lastLogin: new Date(),
              totalPlaytime: 0,
              title: isFirstPlayer ? 'the Administrator' : 'the Newbie',
            },
          }, null); // null caller - player not yet authenticated

          if (isFirstPlayer) {
            context.send('\\\\r\\\\n');
            context.send('═══════════════════════════════════════════════════════════\\\\r\\\\n');
            context.send('  🔱 YOU ARE THE FIRST USER - ADMIN PRIVILEGES GRANTED 🔱\\\\r\\\\n');
            context.send('═══════════════════════════════════════════════════════════\\\\r\\\\n');
            context.send('\\\\r\\\\n');
            context.send('You have been granted wizard status and DevTools access.\\\\r\\\\n');
            context.send('Use these powers wisely to build your world!\\\\r\\\\n');
            context.send('\\\\r\\\\n');
          }

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
