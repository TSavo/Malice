import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Hacksaw prototype
 */
export class HacksawBuilder implements Builder {
  static provides = ['hacksaw'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('hacksaw');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('hacksaw', tool, {
        properties: {
          name: 'Hacksaw',
          description: 'A metal-cutting handsaw',
          weight: 400,
          bladeCondition: 100,

          abilities: `Cuts through metal, plastic, bone. Slow but quiet compared to power tools.
Blade dulls with use - replace when worn. Takes time but works on anything.
Can cut through bars, locks, pipes. Blade can break under pressure.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('bladeCondition', 'Blade sharpness 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[HacksawBuilder] Type 'hacksaw' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HacksawBuilder);
