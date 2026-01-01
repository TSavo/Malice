import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Wrench prototype
 */
export class WrenchBuilder implements Builder {
  static provides = ['wrench'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('wrench');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('wrench', tool, {
        properties: {
          name: 'Wrench',
          description: 'An adjustable wrench',
          weight: 400,

          abilities: `Grip and turn nuts, bolts, pipes. Adjustable jaw fits many sizes.
Essential for mechanical work. Heavy enough for blunt weapon.
Can shut off valves, disconnect pipes, remove bolts.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[WrenchBuilder] Type 'wrench' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(WrenchBuilder);
