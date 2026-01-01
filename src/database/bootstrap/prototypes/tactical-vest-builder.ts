import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the TacticalVest prototype
 */
export class TacticalVestBuilder implements Builder {
  static provides = ['tacticalVest'];
  static depends = ['armor', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('tacticalVest');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('tacticalVest', armor, {
        properties: {
          name: 'Tactical Vest',
          description: 'Military load-bearing armor',
          covers: ['torso'],
          protection: 50,
          armorType: 'composite',
          weight: 8000,
          pockets: [],

          abilities: `Heavy military armor with MOLLE webbing for pouches.
Stops rifle rounds. Ceramic plates in front and back.
Pouches carry magazines, grenades, gear. Heavy but well-distributed weight.
Plates crack after multiple rifle hits - must replace.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('pockets', 'Attached pouches for gear');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TacticalVestBuilder] Type 'tacticalVest' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TacticalVestBuilder);
