import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the GasMask prototype
 */
export class GasMaskBuilder implements Builder {
  static provides = ['gasMask'];
  static depends = ['armor'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('gasMask');
    if (existing) {
      this.obj = existing;
    } else {
      const armor = await this.manager.load('armor');
      if (!armor) throw new Error('Armor type not found');

      this.obj = await this.manager.define('gasMask', armor, {
        properties: {
          name: 'Gas Mask',
          description: 'Respiratory protection mask',
          covers: ['face'],
          protection: 5,
          armorType: 'composite',
          weight: 500,
          filterLife: 100,

          abilities: `Filters air. Protects from tear gas, smoke, chemical agents.
Filter depletes in contaminated air. Replace when exhausted.
Muffles voice significantly. Restricts peripheral vision.
Seal must be tight - facial hair breaks seal.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('filterLife', 'Filter remaining 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[GasMaskBuilder] Type 'gasMask' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(GasMaskBuilder);
