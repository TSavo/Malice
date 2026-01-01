import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Medkit prototype
 */
export class MedkitBuilder implements Builder {
  static provides = ['medkit'];
  static depends = ['medical', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('medkit');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('medkit', medical, {
        properties: {
          name: 'First Aid Kit',
          description: 'A portable first aid kit',
          weight: 500,
          supplies: 100,
          contents: null,

          abilities: `Contains bandages, antiseptic, painkillers, basic supplies.
'supplies' depletes as items used. Can treat minor to moderate wounds.
Not for surgery or severe trauma. Refillable from medical supplies.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('supplies', 'Supply level 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MedkitBuilder] Type 'medkit' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MedkitBuilder);
