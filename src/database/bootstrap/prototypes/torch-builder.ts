import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Torch prototype
 * Burning light source
 */
export class TorchBuilder implements Builder {
  static provides = ['torch'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('torch');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('torch', tool, {
        properties: {
          name: 'Torch',
          description: 'A burning torch',
          weight: 500,
          lit: false,
          burnTime: 60, // minutes remaining

          abilities: `Burning light source. Illuminates area, can ignite things.
Burns down over time. Can be used as weapon - causes burn damage.
Extinguishes in water or without oxygen. Smoke and light visible from distance.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('lit', 'Whether torch is burning');
      this.obj.setPropertyDescription('burnTime', 'Minutes of burn time remaining');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[TorchBuilder] Type 'torch' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(TorchBuilder);
