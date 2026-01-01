import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the StabVest prototype
 */
export class StabVestBuilder implements Builder {
  static provides = ['stabVest'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('stabVest');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('stabVest', armor, {
        properties: {
          name: 'Stab Vest',
          description: 'Anti-stab body armor',
          covers: ['torso'],
          protection: 35,
          armorType: 'stab',
          weight: 2500,

          abilities: `Chainmail or laminate layers stop blades and spikes.
Worn by prison guards, bouncers. Lighter than ballistic vest.
Won't stop bullets. Good against knives, broken glass, needles.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[StabVestBuilder] Type 'stabVest' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(StabVestBuilder);
