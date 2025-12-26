import { ObjectManager } from '../../object-manager.js';
import type { RuntimeObject } from '../../../../types/object.js';

/**
 * Builds the Writable prototype
 * Base for objects that can be written on or edited (e.g., letters, notebooks, whiteboards).
 *
 * Inherits from Describable.
 *
 * Properties:
 * - text: The current written text
 * - writable: true (default)
 * - maxLength: Maximum allowed length (optional)
 *
 * Methods:
 * - read(agent): Returns the current text
 * - write(agent, newText): Sets or appends to the text
 */
export class WritableBuilder {
  constructor(private manager: ObjectManager) {}

  async build(parentId: number): Promise<RuntimeObject> {
    const parentObj = await this.manager.load(parentId);
    const obj = await this.manager.create({
      parent: parentObj!,
      properties: {
        name: 'Writable',
        description: 'Something you can write on.',
        text: '',
        writable: true,
        maxLength: 2000,

        abilities: `Surface that can be written on. Base for letters, notes, whiteboards.

READING: read() returns current 'text' content. AI can invoke directly.

WRITING: write(agent, newText) sets 'text' if 'writable' is true. Respects 'maxLength' limit.

PORTABLE: Can be picked up, carried, dropped. Contents persist.`,
      },
      methods: {},
    });

    obj.setMethod('read', `
      /** Read the current text. */
      return self.text || '(It is blank.)';
    `);

    obj.setMethod('write', `
      /** Write or edit the text. */
      const agent = args[0];
      const newText = args[1];
      if (!self.writable) return 'You cannot write on this.';
      if (typeof newText !== 'string' || !newText.trim()) return 'What do you want to write?';
      if (self.maxLength && newText.length > self.maxLength) return 'That is too long.';
      self.text = newText;
      return 'You write: ' + newText;
    `);

    obj.setPropertyDescription('text', 'The current written text content on this object');
    obj.setPropertyDescription('writable', 'Whether the object can currently be written on');
    obj.setPropertyDescription('maxLength', 'Maximum allowed length for text content');

    return obj;
  }
}
