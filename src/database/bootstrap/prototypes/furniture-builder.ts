import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Furniture prototype
 * Base for all furniture items
 */
export class FurnitureBuilder implements Builder {
  static provides = ['furniture'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('furniture');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('furniture', describable, {
        properties: {
          name: 'Furniture',
          description: 'A piece of furniture',
          weight: 20000,
          anchored: false,

          abilities: `Room fixture. Can hide behind for cover. May conceal items underneath/behind.
Anchored furniture can't be moved. Heavy furniture hard to move alone.
Can be destroyed - wood burns, glass shatters.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('anchored', 'Whether bolted down or too heavy to move');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FurnitureBuilder] Type 'furniture' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FurnitureBuilder);
