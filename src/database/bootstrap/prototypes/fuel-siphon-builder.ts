import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the FuelSiphon prototype
 * Tool for transferring fuel between tanks/containers
 */
export class FuelSiphonBuilder implements Builder {
  static provides = ['fuelSiphon'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('fuelSiphon');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('fuelSiphon', describable, {
        properties: {
          name: 'Fuel Siphon',
          description: 'A rubber hose with hand pump for transferring fuel',
          weight: 500, // grams

          abilities: `Transfers fuel between tanks, vehicles, containers.

Requires access to fuel tank - vehicle must be unlocked or have open fuel door.
Slow without pump. Leaves evidence (gas smell, wet hose).`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FuelSiphonBuilder] Type 'fuelSiphon' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FuelSiphonBuilder);
