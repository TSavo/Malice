import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Defibrillator prototype
 */
export class DefibrillatorBuilder implements Builder {
  static provides = ['defibrillator'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('defibrillator');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('defibrillator', medical, {
        properties: {
          name: 'Defibrillator',
          description: 'An automated external defibrillator',
          weight: 2000,
          charge: 100,

          abilities: `Restarts stopped heart. Apply pads, deliver shock.
AED talks you through it. Only works on shockable rhythms.
Time critical - brain damage after minutes. Requires charge.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('charge', 'Battery level 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DefibrillatorBuilder] Type 'defibrillator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DefibrillatorBuilder);
