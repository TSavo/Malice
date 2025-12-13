import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Sign prototype
 * Immovable, readable object for rooms, elevators, doors, etc.
 *
 * Inherits from Describable.
 *
 * Properties:
 * - name: Sign name (e.g., 'Building Directory')
 * - description: Physical description
 * - text: The text or directory displayed on the sign
 * - content: Alias for text (some signs use this property)
 * - boltedDown: true (default, cannot be moved)
 * - language: (optional) language of the sign
 * - authorizedUpdaters: (optional) array of object IDs or aliases allowed to update
 * - publiclyWritable: (optional) if true, anyone can update (default: false)
 *
 * Methods:
 * - read(agent): Returns the sign's text (optionally formatted)
 * - updateText(agent, newText): Updates the sign text if authorized
 */
export class SignBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Sign',
        description: 'A sturdy, bolted-down sign.',
        text: 'The sign is blank.',
        boltedDown: true,
        language: 'English',
        authorizedUpdaters: [],
        publiclyWritable: false,
      },
      methods: {},
    });

    obj.setMethod('read', `
      /** Read the sign's text. */
      const agent = args[0];
      // Support both 'text' and 'content' properties
      const content = self.content || self.text;
      return content;
    `);

    obj.setMethod('updateText', `
      /**
       * Update the sign's text (authorization required).
       * @param agent - The object attempting to update
       * @param newText - The new text content
       */
      const agent = args[0];
      const newText = args[1];

      if (!agent) {
        return { success: false, message: 'No agent specified.' };
      }

      // Check if publicly writable
      if (self.publiclyWritable) {
        if (self.content !== undefined) {
          self.content = newText;
        } else {
          self.text = newText;
        }
        return { success: true, message: 'Sign updated.' };
      }

      // Check if agent is a wizard/admin
      if (agent.wizard) {
        if (self.content !== undefined) {
          self.content = newText;
        } else {
          self.text = newText;
        }
        return { success: true, message: 'Sign updated by admin.' };
      }

      // Check authorized updaters list
      if (self.authorizedUpdaters && Array.isArray(self.authorizedUpdaters)) {
        const isAuthorized = self.authorizedUpdaters.some(auth => {
          if (typeof auth === 'number') {
            return agent.id === auth;
          }
          if (typeof auth === 'string') {
            // Check if agent has this alias
            return agent.name === auth || agent.aliases?.includes(auth);
          }
          return false;
        });

        if (isAuthorized) {
          if (self.content !== undefined) {
            self.content = newText;
          } else {
            self.text = newText;
          }
          return { success: true, message: 'Sign updated by authorized system.' };
        }
      }

      return { success: false, message: 'Access denied: You are not authorized to update this sign.' };
    `);

    // Room-centric verb declaration for sign
    obj.setMethod('getRoomVerbs', `
      /** Declare verbs to be registered by the room for players. */
      return [
        { pattern: 'read %i', method: 'read' }
      ];
    `);

    return obj;
  }
}
