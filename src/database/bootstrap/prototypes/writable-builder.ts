import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Writable type
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
export class WritableBuilder implements Builder {
  static provides = ['writable'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('writable');
    if (existing) {
      this.obj = existing;
    } else {
      // Create writable as a TYPE
      const parentObj = await this.manager.load('describable');
      if (!parentObj)
        throw new Error('WritableBuilder: $describable not found');

      this.obj = await this.manager.define('writable', parentObj, {
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
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj;
    obj.setMethod(
      'read',
      `
      /** Read the current text. */
      return self.text || '(It is blank.)';
    `,
    );

    obj.setMethod(
      'write',
      `
      /** Write or edit the text. */
      const agent = args[0];
      const newText = args[1];
      if (!self.writable) return 'You cannot write on this.';
      if (typeof newText !== 'string' || !newText.trim()) return 'What do you want to write?';
      if (self.maxLength && newText.length > self.maxLength) return 'That is too long.';
      self.text = newText;
      return 'You write: ' + newText;
    `,
    );

    obj.setPropertyDescription(
      'text',
      'The current written text content on this object',
    );
    obj.setPropertyDescription(
      'writable',
      'Whether the object can currently be written on',
    );
    obj.setPropertyDescription(
      'maxLength',
      'Maximum allowed length for text content',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[WritableBuilder] Type 'writable' auto-aliased`);
  }
}

// Self-register
registerBuilder(WritableBuilder);
