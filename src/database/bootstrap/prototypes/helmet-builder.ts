import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Helmet prototype
 */
export class HelmetBuilder implements Builder {
  static provides = ['helmet'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('helmet');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('helmet', armor, {
        properties: {
          name: 'Helmet',
          description: 'Protective headgear',
          covers: ['head'],
          protection: 35,
          armorType: 'ballistic',
          weight: 1500,

          abilities: `Protects head from impacts and shrapnel. May stop pistol rounds.
Face exposed unless has visor. Reduces hearing slightly.
Ballistic helmets heavy. Hard hats lighter but less protection.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[HelmetBuilder] Type 'helmet' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HelmetBuilder);
