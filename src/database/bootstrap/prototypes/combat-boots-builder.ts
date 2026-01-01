import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the CombatBoots prototype
 */
export class CombatBootsBuilder implements Builder {
  static provides = ['combatBoots'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('combatBoots');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('combatBoots', armor, {
        properties: {
          name: 'Combat Boots',
          description: 'Heavy tactical boots',
          covers: ['feet'],
          protection: 20,
          armorType: 'composite',
          weight: 1500,
          steelToe: true,

          abilities: `Reinforced footwear. Steel toe protects from crushing, improves kicks.
Ankle support for rough terrain. Puncture-resistant soles.
Loud footsteps. Takes time to lace up. Good traction.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('steelToe', 'Whether boots have steel toe caps');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CombatBootsBuilder] Type 'combatBoots' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CombatBootsBuilder);
