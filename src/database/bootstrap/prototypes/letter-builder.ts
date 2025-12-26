import type { RuntimeObject } from '../../../../types/object.js';
import type { ObjectManager } from '../../object-manager.js';
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
 */
export class LetterBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    // Inherit from Writable
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Letter',
        description: 'A piece of paper for writing messages.',
        text: '',
        writable: true,
        maxLength: 1000,

        abilities: `Portable writable paper for personal correspondence.

WRITING: Inherits from $.writable. write(agent, text) records message.

READING: read() returns written text.

PORTABLE: Can be picked up, given, dropped. Compact size.

EVIDENCE: Written letters persist. Can be found, read by others. Evidence of communication.

DESTRUCTION: Can be burned, torn, disposed. Fire destroys contents permanently.`,
      },
      methods: {},
    });

    // Inherit methods from Writable
    const writable = new WritableBuilder(this.manager);
    const writableObj = await writable.build(parentId);
    for (const [name, method] of Object.entries(writableObj.getOwnMethods())) {
      obj.setMethod(name, method.code);
    }

    // Add property descriptions
    obj.setPropertyDescription(
      'text',
      'The written message content of the letter',
    );
    obj.setPropertyDescription(
      'maxLength',
      'Maximum character length for the letter text',
    );

    return obj;
  }
}
