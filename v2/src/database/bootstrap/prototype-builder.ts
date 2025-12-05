import { ObjectManager } from '../object-manager.js';
import type { RuntimeObject } from '../../types/object.js';

/**
 * Builds the object prototype hierarchy
 *
 * Creates prototypes with DYNAMIC IDs (no hardcoding):
 * - Describable: name, description, aliases
 * - Agent: location, inventory, moveTo/say/emote
 * - Human: sex, pronouns, age
 * - Player: auth fields, permissions, connect/checkPassword
 *
 * All IDs are dynamically assigned and registered as aliases in root.properties.aliases
 */
export class PrototypeBuilder {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all prototype objects
   * Idempotent - checks for existing aliases before creating
   */
  async buildPrototypes(): Promise<void> {
    // Check if prototypes already exist via aliases
    const objectManager = await this.manager.load(0);
    if (!objectManager) throw new Error('Root object not found - run minimal bootstrap first');

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};

    // Create prototypes (or get existing ones)
    const describable = aliases.describable
      ? await this.manager.load(aliases.describable)
      : await this.createDescribable();

    const agent = aliases.agent
      ? await this.manager.load(aliases.agent)
      : await this.createAgent(describable!.id);

    const human = aliases.human
      ? await this.manager.load(aliases.human)
      : await this.createHuman(agent!.id);

    const player = aliases.player
      ? await this.manager.load(aliases.player)
      : await this.createPlayer(human!.id);

    // Register aliases in root.properties.aliases
    await this.registerAliases({
      describable: describable!.id,
      agent: agent!.id,
      human: human!.id,
      player: player!.id,
    });
  }

  private async createDescribable(): Promise<RuntimeObject> {
    return await this.manager.create({
      parent: 1,
      properties: {
        name: 'Describable',
        description: 'Base prototype for things that can be described',
        aliases: [],
      },
      methods: {
        describe: `
          return \`\${self.name}\\r\\n\${self.description}\`;
        `,
        shortDesc: `
          return self.name;
        `,
      },
    });
  }

  private async createAgent(describableId: number): Promise<RuntimeObject> {
    return await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Agent',
        description: 'Base prototype for things that can act',
        location: 0,
        inventory: [],
      },
      methods: {
        moveTo: `
          const targetId = args[0];
          // TODO: Notify old location
          self.location = targetId;
          // TODO: Notify new location
          await self.save();
        `,
        say: `
          const message = args[0];
          // TODO: Broadcast to room
          return \`\${self.name} says: \${message}\`;
        `,
        emote: `
          const action = args[0];
          // TODO: Broadcast to room
          return \`\${self.name} \${action}\`;
        `,
      },
    });
  }

  private async createHuman(agentId: number): Promise<RuntimeObject> {
    return await this.manager.create({
      parent: agentId,
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
        pronoun: `
          const type = args[0]; // 'subject', 'object', 'possessive'
          return self.pronouns[type] || 'they';
        `,
      },
    });
  }

  private async createPlayer(humanId: number): Promise<RuntimeObject> {
    return await this.manager.create({
      parent: humanId,
      properties: {
        name: 'Player',
        description: 'Base prototype for player characters',

        // Authentication
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
              const desc = await location.describe();
              context.send(\`\\r\\n\${desc}\\r\\n\`);
            }
          }

          // TODO: Notify others in room
        `,

        disconnect: `
          // Save any unsaved state
          await self.save();

          // TODO: Notify room
        `,

        checkPassword: `
          const password = args[0];
          const bcrypt = require('bcrypt');
          return await bcrypt.compare(password, self.passwordHash);
        `,

        setPassword: `
          const password = args[0];
          const bcrypt = require('bcrypt');
          const hash = await bcrypt.hash(password, 10);
          self.passwordHash = hash;
          await self.save();
        `,
      },
    });
  }

  private async registerAliases(ids: {
    describable: number;
    agent: number;
    human: number;
    player: number;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.describable = ids.describable;
    aliases.agent = ids.agent;
    aliases.human = ids.human;
    aliases.player = ids.player;

    objectManager.set('aliases', aliases);
    await objectManager.save();

    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, agent=#${ids.agent}, human=#${ids.human}, player=#${ids.player}`,
    );
  }
}
