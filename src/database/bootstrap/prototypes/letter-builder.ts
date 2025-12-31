import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { registerBuilder, type Builder } from '../builder-registry';

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
 * - read(agent): Returns the letter's text (inherited)
 * - write(agent, newText): Sets the letter's text (inherited)
 */
export class LetterBuilder implements Builder {
  static provides = ['letter'];
  static depends = ['writable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(forceRebuild = false): Promise<void> {
    const $ = this.manager as any;

    if ($.letter && !forceRebuild) {
      this.obj = $.letter;
      return;
    }

    const parentObj = $.writable;
    if (!parentObj) throw new Error('LetterBuilder: $writable not found');

    this.obj = await this.manager.create({
      parent: parentObj,
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
    // Register in memory for immediate access
    if (!this.obj) return;
    const objectManager = await this.manager.load(0);
    await objectManager?.call('addAlias', 'letter', this.obj.id);
  }
}

// Self-register
registerBuilder(LetterBuilder);
