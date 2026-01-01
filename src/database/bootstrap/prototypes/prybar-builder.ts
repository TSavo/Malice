import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Prybar prototype
 * Smaller than crowbar
 */
export class PrybarBuilder implements Builder {
  static provides = ['prybar'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('prybar');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('prybar', tool, {
        properties: {
          name: 'Prybar',
          description: 'A small prying tool',
          weight: 300,

          abilities: `Compact prying tool. Less leverage than crowbar but concealable.
Open panels, pry gaps, pop locks. Fits in pocket or bag.
Good for quick entry. Less effective on heavy doors.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PrybarBuilder] Type 'prybar' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PrybarBuilder);
