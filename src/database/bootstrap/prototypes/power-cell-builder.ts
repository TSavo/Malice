import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the PowerCell prototype
 * Rechargeable battery pack
 */
export class PowerCellBuilder implements Builder {
  static provides = ['powerCell'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('powerCell');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('powerCell', describable, {
        properties: {
          name: 'Power Cell',
          description: 'A rechargeable battery pack',
          charge: 100,
          capacity: 100,
          weight: 500,

          abilities: `Portable power storage. Recharge from outlet or generator.
Powers devices, tools, implants. Swap depleted cells for charged ones.
Damaged cells can leak or explode. EMP drains charge instantly.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('charge', 'Current charge 0-100');
      this.obj.setPropertyDescription('capacity', 'Maximum charge capacity');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PowerCellBuilder] Type 'powerCell' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PowerCellBuilder);
