import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

/**
 * Builds the Letter type
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
 * - read(agent): Returns the letter's text (inherited)
 * - write(agent, newText): Sets the letter's text (inherited)
 */
export class LetterBuilder implements Builder {
  static provides = ['letter'];
  static depends = ['writable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    // Check if type already exists (types auto-alias)
    const existing = await this.manager.load('letter');
    if (existing) {
      this.obj = existing;
    } else {
      // Create letter as a TYPE
      const parentObj = await this.manager.load('writable');
      if (!parentObj) throw new Error('LetterBuilder: $writable not found');

      this.obj = await this.manager.define('letter', parentObj, {
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
    }

    // Always rebuild methods (ensures they exist even if type was pre-existing)
    const obj = this.obj;
    // Add property descriptions
    obj.setPropertyDescription(
      'text',
      'The written message content of the letter',
    );
    obj.setPropertyDescription(
      'maxLength',
      'Maximum character length for the letter text',
    );
  }

  async registerAliases(): Promise<void> {
    // Types auto-alias by name, no manual registration needed
    if (!this.obj) return;
    console.log(`[LetterBuilder] Type 'letter' auto-aliased`);
  }
}

// Self-register
registerBuilder(LetterBuilder);
