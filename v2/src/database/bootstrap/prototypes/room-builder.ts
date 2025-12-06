import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Room prototype
 * Base prototype for rooms with exits
 */
export class RoomBuilder {
  constructor(private manager: ObjectManager) {}

  async build(locationId: number): Promise<RuntimeObject> {
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
    `);

    obj.setMethod('removeExit', `
      const direction = args[0];
      const exits = self.exits || {};
      delete exits[direction];
      self.exits = exits;
    `);

    // The 'go' verb - used by exit directions
    // Pattern is just the direction word like 'north', 'south'
    // args[3] = direction string (from %s in pattern, but we store it as literal)
    obj.setMethod('go', `
      // The direction is embedded in the command - extract first word
      const direction = command.trim().toLowerCase().split(/\\s+/)[0];

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

      // Register each exit direction as a verb (simple pattern, just the word)
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

    // Rooms can contain things
    obj.setMethod('canContain', `
      const obj = args[0];
      return true;
    `);

    return obj;
  }
}
