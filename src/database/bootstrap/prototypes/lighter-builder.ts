import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Lighter prototype
 */
export class LighterBuilder implements Builder {
  static provides = ['lighter'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('lighter');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('lighter', tool, {
        properties: {
          name: 'Lighter',
          description: 'A pocket lighter',
          weight: 30,
          fuel: 100,
          lit: false,

          abilities: `Creates flame. Light cigarettes, candles, fuses, fires.
Fuel depletes with use. Won't light when wet or in wind.
Can ignite flammable materials. Small light source when lit.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('fuel', 'Fuel remaining 0-100');
      this.obj.setPropertyDescription(
        'lit',
        'Whether flame is currently burning',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[LighterBuilder] Type 'lighter' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(LighterBuilder);
