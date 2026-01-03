import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the C4 prototype
 */
export class C4Builder implements Builder {
  static provides = ['c4'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('c4');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('c4', explosive, {
        properties: {
          name: 'C4',
          description: 'Plastic explosive',
          weight: 500,
          damage: 200,
          blastRadius: 10,
          detonator: null,

          abilities: `Moldable plastic explosive. Shape to breach doors, walls, vehicles.
Requires detonator - won't explode from fire or impact.
Can be divided into smaller charges. Very stable until triggered.
Shaped charges direct blast. Breaching charges blow locks/hinges.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'detonator',
        'Objref to attached detonator',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[C4Builder] Type 'c4' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(C4Builder);
