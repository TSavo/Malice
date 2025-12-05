import { ObjectManager } from '../object-manager.js';

/**
 * Builds the object prototype hierarchy
 *
 * Creates:
 * - #10 Describable: name, description, aliases
 * - #11 Agent: location, inventory, moveTo/say/emote
 * - #12 Human: sex, pronouns, age
 * - #13 Player: auth fields, permissions, connect/checkPassword
 */
export class PrototypeBuilder {
  constructor(private manager: ObjectManager) {}

  /**
   * Build all prototype objects
   */
  async buildPrototypes(): Promise<void> {
    await this.createDescribable();
    await this.createAgent();
    await this.createHuman();
    await this.createPlayer();

    // Update root.aliases
    await this.registerAliases();
  }

  private async createDescribable(): Promise<void> {
    const existing = await this.manager.load(10);
    if (existing) return;

    await this.manager.create({
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

  private async createAgent(): Promise<void> {
    const existing = await this.manager.load(11);
    if (existing) return;

    await this.manager.create({
      parent: 10, // Inherits from Describable
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

  private async createHuman(): Promise<void> {
    const existing = await this.manager.load(12);
    if (existing) return;

    await this.manager.create({
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
        pronoun: `
          const type = args[0]; // 'subject', 'object', 'possessive'
          return self.pronouns[type] || 'they';
        `,
      },
    });
  }

  private async createPlayer(): Promise<void> {
    const existing = await this.manager.load(13);
    if (existing) return;

    await this.manager.create({
      parent: 12, // Inherits from Human
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
              const desc = await location.call('describe');
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

  private async registerAliases(): Promise<void> {
    const root = await this.manager.load(1);
    if (!root) return;

    const aliases = (root.get('aliases') as Record<string, number>) || {};
    aliases.describable = 10;
    aliases.agent = 11;
    aliases.human = 12;
    aliases.player = 13;

    root.set('aliases', aliases);
    await root.save();
  }
}
