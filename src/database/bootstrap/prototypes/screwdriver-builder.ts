import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Screwdriver prototype
 */
export class ScrewdriverBuilder implements Builder {
  static provides = ['screwdriver'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('screwdriver');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('screwdriver', tool, {
        properties: {
          name: 'Screwdriver',
          description: 'A flathead screwdriver',
          weight: 150,

          abilities: `Drive and remove screws. Pry open panels, vents, electronics.
Can be used to hotwire vehicles. Improvised stabbing weapon.
Flathead or Phillips types. Good for disassembly.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ScrewdriverBuilder] Type 'screwdriver' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ScrewdriverBuilder);
