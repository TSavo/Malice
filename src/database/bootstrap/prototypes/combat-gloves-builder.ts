import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the CombatGloves prototype
 */
export class CombatGlovesBuilder implements Builder {
  static provides = ['combatGloves'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('combatGloves');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('combatGloves', armor, {
        properties: {
          name: 'Combat Gloves',
          description: 'Reinforced tactical gloves',
          covers: ['hands'],
          protection: 15,
          armorType: 'blunt',
          weight: 200,

          abilities: `Protects hands, improves grip. Reinforced knuckles for punching.
Allows dexterity for triggers, tools. Reduces cuts from glass, wire.
Knuckle strikes do more damage. Fingerless variants exist.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CombatGlovesBuilder] Type 'combatGloves' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CombatGlovesBuilder);
