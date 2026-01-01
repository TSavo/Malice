import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Multitool prototype
 */
export class MultitoolBuilder implements Builder {
  static provides = ['multitool'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('multitool');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('multitool', tool, {
        properties: {
          name: 'Multitool',
          description: 'A folding multi-tool',
          weight: 200,

          abilities: `Many tools in one. Knife, pliers, screwdriver, file, can opener, etc.
Jack of all trades, master of none - each function weaker than dedicated tool.
Compact and portable. Essential survival gear.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MultitoolBuilder] Type 'multitool' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MultitoolBuilder);
