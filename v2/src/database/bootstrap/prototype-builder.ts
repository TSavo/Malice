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
        description: 'Base prototype for things that exist in the world',
        aliases: [],
        location: null, // ObjId | null - where this object is located
      },
      methods: {},
    });

    obj.setMethod('describe', `
      return \`\${self.name}\\r\\n\${self.description}\`;
    `);

    obj.setMethod('shortDesc', `
      return self.name;
    `);

    // THE primitive for all location changes
    // Everything that moves goes through this method
    obj.setMethod('moveTo', `
      const destination = args[0]; // ObjId or RuntimeObject
      const mover = args[1]; // Who/what is causing the move (optional)

      const destId = typeof destination === 'number' ? destination : destination?.id;
      if (destId === undefined || destId === null) {
        throw new Error('Invalid destination');
      }

      const sourceId = self.location;
      const source = sourceId ? await $.load(sourceId) : null;
      const dest = await $.load(destId);

      if (!dest) {
        throw new Error(\`Destination #\${destId} not found\`);
      }

      // Pre-move hooks (can throw to cancel the move)
      if (source && source.onContentLeaving) {
        await source.onContentLeaving(self, dest, mover);
      }
      await self.onLeaving(source, dest, mover);

      // Perform the actual move
      if (source && source.removeContent) {
        await source.removeContent(self.id);
      }
      self.location = destId;
      if (dest.addContent) {
        await dest.addContent(self.id);
      }
      await self.save();

      // Post-move hooks (for notifications, verb registration, etc.)
      if (source && source.onContentLeft) {
        await source.onContentLeft(self, dest, mover);
      }
      await self.onArrived(dest, source, mover);
      if (dest.onContentArrived) {
        await dest.onContentArrived(self, source, mover);
      }
    `);

    // Hook: called before leaving current location
    // Override to prepare for departure, can throw to cancel
    obj.setMethod('onLeaving', `
      const source = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing, allow move
    `);

    // Hook: called after arriving at new location
    // Override to register verbs, announce arrival, etc.
    obj.setMethod('onArrived', `
      const dest = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
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
            const shortDesc = await obj.shortDesc();
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

    // Hook: called before an object leaves this location
    // Can throw to prevent the move
    obj.setMethod('onContentLeaving', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: allow all departures
    `);

    // Hook: called after an object has left this location
    // Use for cleanup, unregistering verbs, notifications
    obj.setMethod('onContentLeft', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];
      // Default: do nothing
    `);

    // Hook: called after an object has arrived in this location
    // Use for announcements, registering verbs, triggers
    obj.setMethod('onContentArrived', `
      const obj = args[0];
      const source = args[1];
      const mover = args[2];
      // Default: do nothing
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
            const shortDesc = await obj.shortDesc();
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

    // The 'go' verb - used by exit directions
    obj.setMethod('go', `
      const context = args[0];
      const player = args[1];
      const direction = args[2];

      const exits = self.exits || {};
      const destId = exits[direction];

      if (!destId) {
        return \`You can't go \${direction} from here.\`;
      }

      // Move player to destination (triggers all hooks)
      await player.moveTo(destId, player);

      // Show new room
      const dest = await $.load(destId);
      if (dest) {
        return await dest.describe(player);
      }
    `);

    // Override: when an agent arrives, register exit verbs
    obj.setMethod('onContentArrived', `
      const obj = args[0];
      const source = args[1];
      const mover = args[2];

      // Only register verbs for agents (things with registerVerb)
      if (!obj.registerVerb) return;

      // Register each exit direction as a verb
      const exits = self.exits || {};
      for (const direction of Object.keys(exits)) {
        await obj.registerVerb(direction, self, 'go');
      }

      // TODO: Announce arrival to others in room
    `);

    // Override: when an agent leaves, unregister exit verbs
    obj.setMethod('onContentLeft', `
      const obj = args[0];
      const dest = args[1];
      const mover = args[2];

      // Only unregister verbs for agents
      if (!obj.unregisterVerbsFrom) return;

      // Unregister all verbs this room provided
      await obj.unregisterVerbsFrom(self.id);

      // TODO: Announce departure to others in room
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
        // Verb registry: { verbName: { obj: ObjId, method: string } }
        verbs: {},
      },
      methods: {},
    });

    // Register a verb that this agent can use
    // verbName: the command word (e.g., 'shoot', 'look')
    // sourceObj: the object that provides the verb
    // methodName: the method to call on sourceObj (defaults to verbName)
    obj.setMethod('registerVerb', `
      const verbName = args[0];
      const sourceObj = args[1]; // RuntimeObject or ObjId
      const methodName = args[2] || verbName;

      const sourceId = typeof sourceObj === 'number' ? sourceObj : sourceObj.id;
      const verbs = self.verbs || {};
      verbs[verbName] = { obj: sourceId, method: methodName };
      self.verbs = verbs;
      await self.save();
    `);

    // Unregister a verb
    obj.setMethod('unregisterVerb', `
      const verbName = args[0];
      const verbs = self.verbs || {};
      delete verbs[verbName];
      self.verbs = verbs;
      await self.save();
    `);

    // Unregister all verbs provided by a specific object
    obj.setMethod('unregisterVerbsFrom', `
      const sourceObj = args[0];
      const sourceId = typeof sourceObj === 'number' ? sourceObj : sourceObj.id;
      const verbs = self.verbs || {};

      for (const [verbName, info] of Object.entries(verbs)) {
        if (info.obj === sourceId) {
          delete verbs[verbName];
        }
      }

      self.verbs = verbs;
      await self.save();
    `);

    // Check if agent has a specific verb registered
    obj.setMethod('hasVerb', `
      const verbName = args[0];
      const verbs = self.verbs || {};
      return verbName in verbs;
    `);

    // Get verb info (for dispatch)
    obj.setMethod('getVerb', `
      const verbName = args[0];
      const verbs = self.verbs || {};
      return verbs[verbName] || null;
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

      // Register player's default verbs
      await self.registerVerb('look', self);
      await self.registerVerb('l', self, 'look'); // alias
      await self.registerVerb('say', self);
      await self.registerVerb('emote', self);
      await self.registerVerb('quit', self);

      // If we have a location, move into it to trigger verb registration
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          // Trigger onArrived to register room verbs
          await self.onArrived(location, null, null);
          // Show room description
          const desc = await location.describe(self);
          context.send(\`\\r\\n\${desc}\\r\\n\`);
        }
      }

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

      try {
        // Look up verb in registry
        const verbInfo = await self.getVerb(verb);

        if (verbInfo) {
          // Found registered verb - dispatch to handler
          const handler = await $.load(verbInfo.obj);
          if (handler) {
            const result = await handler[verbInfo.method](context, self, argString);
            if (result !== undefined) {
              context.send(\`\${result}\\r\\n\`);
            }
          } else {
            context.send(\`Error: verb handler #\${verbInfo.obj} not found.\\r\\n\`);
          }
        } else {
          // No registered verb found
          context.send(\`I don't understand "\${verb}".\\r\\n\`);
        }

        context.send('> ');
      } catch (err) {
        context.send(\`Error: \${err.message}\\r\\n\`);
        context.send('> ');
      }
    `);

    obj.setMethod('quit', `
      const context = args[0];
      const player = args[1]; // self

      context.send('Goodbye!\\r\\n');
      await self.disconnect();
      context.close();
    `);

    obj.setMethod('disconnect', `
      // Unregister all verbs from current location
      if (self.location && self.location !== 0) {
        const location = await $.load(self.location);
        if (location) {
          await self.unregisterVerbsFrom(location.id);
        }
      }

      // Save any unsaved state
      await self.save();

      // TODO: Notify room that player left
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
