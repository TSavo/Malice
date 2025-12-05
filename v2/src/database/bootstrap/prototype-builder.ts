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

    const location = aliases.location
      ? await this.manager.load(aliases.location)
      : await this.createLocation(describable!.id);

    const room = aliases.room
      ? await this.manager.load(aliases.room)
      : await this.createRoom(location!.id);

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
      location: location!.id,
      room: room!.id,
      agent: agent!.id,
      human: human!.id,
      player: player!.id,
    });
  }

  private async createDescribable(): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: 1,
      properties: {
        name: 'Describable',
        description: 'Base prototype for things that can be described',
        aliases: [],
        location: null, // ObjId | null - Optional: where this object is located (Location prototype)
      },
      methods: {},
    });

    obj.setMethod('describe', `
      return \`\${self.name}\\r\\n\${self.description}\`;
    `);

    obj.setMethod('shortDesc', `
      return self.name;
    `);

    await obj.save();
    return obj;
  }

  private async createLocation(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Location',
        description: 'Base prototype for locations (things that can contain other things)',
        contents: [], // List of object IDs in this location
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this location

      // Show location name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show contents (if any), excluding the viewer
      const contents = self.contents || [];
      const others = contents.filter(id => id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const objId of others) {
          const obj = await $.load(objId);
          if (obj) {
            const shortDesc = obj.shortDesc ? await obj.shortDesc() : obj.name;
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `);

    obj.setMethod('addContent', `
      const objId = args[0];
      const contents = self.contents || [];
      if (!contents.includes(objId)) {
        contents.push(objId);
        self.contents = contents;
        await self.save();
      }
    `);

    obj.setMethod('removeContent', `
      const objId = args[0];
      const contents = self.contents || [];
      const index = contents.indexOf(objId);
      if (index !== -1) {
        contents.splice(index, 1);
        self.contents = contents;
        await self.save();
      }
    `);

    await obj.save();
    return obj;
  }

  private async createRoom(locationId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: locationId,
      properties: {
        name: 'Room',
        description: 'Base prototype for rooms',
        exits: {}, // Map of direction -> destination room ID
      },
      methods: {},
    });

    obj.setMethod('describe', `
      const viewer = args[0]; // Agent viewing this room

      // Show room name and description
      let output = \`\${self.name}\\r\\n\${self.description}\\r\\n\`;

      // Show exits
      const exits = self.exits || {};
      const exitNames = Object.keys(exits);
      if (exitNames.length > 0) {
        output += \`\\r\\nObvious exits: \${exitNames.join(', ')}\\r\\n\`;
      } else {
        output += '\\r\\nThere are no obvious exits.\\r\\n';
      }

      // Show contents (agents/objects in room), excluding the viewer
      const contents = self.contents || [];
      const others = contents.filter(id => id !== viewer?.id);
      if (others.length > 0) {
        output += '\\r\\nYou see:\\r\\n';
        for (const objId of others) {
          const obj = await $.load(objId);
          if (obj) {
            const shortDesc = obj.shortDesc ? await obj.shortDesc() : obj.name;
            output += \`  - \${shortDesc}\\r\\n\`;
          }
        }
      }

      return output;
    `);

    obj.setMethod('addExit', `
      const direction = args[0];
      const destId = args[1];
      const exits = self.exits || {};
      exits[direction] = destId;
      self.exits = exits;
      await self.save();
    `);

    obj.setMethod('removeExit', `
      const direction = args[0];
      const exits = self.exits || {};
      delete exits[direction];
      self.exits = exits;
      await self.save();
    `);

    await obj.save();
    return obj;
  }

  private async createAgent(describableId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: describableId,
      properties: {
        name: 'Agent',
        description: 'Base prototype for things that can act',
        location: 0,
        inventory: [],
      },
      methods: {},
    });

    obj.setMethod('moveTo', `
      const targetId = args[0];
      // TODO: Notify old location
      self.location = targetId;
      // TODO: Notify new location
      await self.save();
    `);

    obj.setMethod('say', `
      const message = args[0];
      // TODO: Broadcast to room
      return \`\${self.name} says: \${message}\`;
    `);

    obj.setMethod('emote', `
      const action = args[0];
      // TODO: Broadcast to room
      return \`\${self.name} \${action}\`;
    `);

    obj.setMethod('look', `
      const context = args[0];

      // Look at current location
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          const desc = await location.describe(self);
          return desc;
        }
      }

      return 'You are in a void.';
    `);

    await obj.save();
    return obj;
  }

  private async createHuman(agentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
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
      methods: {},
    });

    obj.setMethod('pronoun', `
      const type = args[0]; // 'subject', 'object', 'possessive'
      return self.pronouns[type] || 'they';
    `);

    await obj.save();
    return obj;
  }

  private async createPlayer(humanId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
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
      methods: {},
    });

    obj.setMethod('connect', `
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
          const desc = await location.describe(self);
          context.send(\`\\r\\n\${desc}\\r\\n\`);
        }
      }

      // TODO: Notify others in room

      // Set up command loop - player handles their own input now
      context.setHandler(self);

      // Show prompt
      context.send('> ');
    `);

    obj.setMethod('onInput', `
      const context = args[0];
      const input = args[1];

      const trimmed = input.trim();
      if (!trimmed) {
        context.send('> ');
        return;
      }

      // Parse command: "verb arg1 arg2 ..."
      const parts = trimmed.split(/\\s+/);
      const verb = parts[0].toLowerCase();
      const argString = parts.slice(1).join(' ');

      // Try to find callable method on self or location
      try {
        // Check if player has this verb as a callable method
        if (self.hasMethod && self.hasMethod(verb)) {
          const result = await self[verb](context, argString);
          if (result !== undefined) {
            context.send(\`\${result}\\r\\n\`);
          }
          context.send('> ');
          return;
        }

        // Check location for callable methods (room verbs)
        if (self.location && self.location !== 0) {
          const location = await $.load(self.location);
          if (location && location.hasMethod && location.hasMethod(verb)) {
            const result = await location[verb](context, self, argString);
            if (result !== undefined) {
              context.send(\`\${result}\\r\\n\`);
            }
            context.send('> ');
            return;
          }
        }

        // TODO: Check objects in location for callable methods
        // TODO: Check inventory for callable methods

        // No matching verb found
        context.send(\`I don't understand "\${verb}".\\r\\n\`);
        context.send('> ');
      } catch (err) {
        context.send(\`Error: \${err.message}\\r\\n\`);
        context.send('> ');
      }
    `);

    obj.setMethod('disconnect', `
      // Save any unsaved state
      await self.save();

      // TODO: Notify room
    `);

    obj.setMethod('checkPassword', `
      const password = args[0];
      const bcrypt = require('bcrypt');
      return await bcrypt.compare(password, self.passwordHash);
    `);

    obj.setMethod('setPassword', `
      const password = args[0];
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(password, 10);
      self.passwordHash = hash;
      await self.save();
    `);

    await obj.save();
    return obj;
  }

  private async registerAliases(ids: {
    describable: number;
    location: number;
    room: number;
    agent: number;
    human: number;
    player: number;
  }): Promise<void> {
    const objectManager = await this.manager.load(0);
    if (!objectManager) return;

    const aliases = (objectManager.get('aliases') as Record<string, number>) || {};
    aliases.describable = ids.describable;
    aliases.location = ids.location;
    aliases.room = ids.room;
    aliases.agent = ids.agent;
    aliases.human = ids.human;
    aliases.player = ids.player;

    objectManager.set('aliases', aliases);
    await objectManager.save();

    console.log(
      `✅ Registered prototype aliases: describable=#${ids.describable}, location=#${ids.location}, room=#${ids.room}, agent=#${ids.agent}, human=#${ids.human}, player=#${ids.player}`,
    );
  }
}
