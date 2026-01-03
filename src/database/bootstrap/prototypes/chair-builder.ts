import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Chair prototype
 */
export class ChairBuilder implements Builder {
  static provides = ['chair'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('chair');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('chair', furniture, {
        properties: {
          name: 'Chair',
          description: 'A seat for one person',
          weight: 5000,
          occupant: null,

          abilities: `Seat for one. Sit to rest legs, reduces fatigue recovery time.
Can be thrown as improvised weapon. Swivel chairs roll.
Standing from chair takes a moment - disadvantage if ambushed while seated.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'occupant',
        'Objref to person sitting in chair',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ChairBuilder] Type 'chair' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ChairBuilder);
