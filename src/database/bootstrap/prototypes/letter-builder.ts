import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';
import { WritableBuilder } from './writable-builder.js';

/**
 * Builds the Letter prototype
 * A writable, portable letter that can be read and written on.
 *
 * Inherits from Writable.
 *
 * Properties:
 * - name: 'Letter'
 * - description: 'A piece of paper for writing messages.'
 * - text: The letter's contents
 * - writable: true
 * - maxLength: 1000
 *
 * Methods:
 * - read(agent): Returns the letter's text
 * - write(agent, newText): Sets the letter's text
 * - getRoomVerbs(): Declares 'read %i' and 'write %i' verbs
 */
export class LetterBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    // Inherit from Writable
    const obj = await this.manager.create({
      parent: parentId,
      properties: {
        name: 'Letter',
        description: 'A piece of paper for writing messages.',
        text: '',
        writable: true,
        maxLength: 1000,
      },
      methods: {},
    });

    // Inherit methods from Writable
    const writable = new WritableBuilder(this.manager);
    const writableObj = await writable.build(parentId);
    for (const [name, method] of Object.entries(writableObj.getOwnMethods())) {
      obj.setMethod(name, method.code);
    }

    return obj;
  }
}
