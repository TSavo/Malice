import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the WireCutters prototype
 */
export class WireCuttersBuilder implements Builder {
  static provides = ['wireCutters'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('wireCutters');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('wireCutters', tool, {
        properties: {
          name: 'Wire Cutters',
          description: 'Heavy-duty wire cutters',
          weight: 300,

          abilities: `Cut wires, cables, thin metal. Sever electrical lines, fences, zip ties.
Can cut through chain-link fence. Cutting live wires risks electrocution.
Also cuts handcuff chains with effort. Leaves clean cut marks.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[WireCuttersBuilder] Type 'wireCutters' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WireCuttersBuilder);
