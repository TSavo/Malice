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
 * - boltedDown: true (default, cannot be moved)
 * - language: (optional) language of the sign
 *
 * Methods:
 * - read(agent): Returns the sign's text (optionally formatted)
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
      },
      methods: {},
    });

    obj.setMethod('read', `
      /** Read the sign's text. */
      const agent = args[0];
      // Optionally, check language or access here
      return self.text;
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
