import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Smokable prototype
 * Base for cigarettes, cigars, pipes, etc.
 */
export class SmokableBuilder implements Builder {
  static provides = ['smokable'];
  static depends = ['edible'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('smokable');
    if (existing) {
      this.obj = existing;
    } else {
      const edible = await this.manager.load('edible');
      if (!edible) throw new Error('Edible type not found');

      this.obj = await this.manager.define('smokable', edible, {
        properties: {
          name: 'Smokable',
          description: 'Something that can be smoked',
          calories: 0,
          hydration: -5, // Dehydrating
          lit: false,

          abilities: `Must be lit to smoke. Each drag consumes a portion.

Requires free hand. Smell lingers on clothes/room.
Can't smoke underwater, in vacuum, or where oxygen is limited.
Extinguishes if dropped or wet.`,
        },
        methods: {},
      });
    }

    this.obj.setPropertyDescription('lit', 'Must be true to smoke');
  }

  async registerAliases(): Promise<void> {
    console.log("[SmokableBuilder] Type 'smokable' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SmokableBuilder);
