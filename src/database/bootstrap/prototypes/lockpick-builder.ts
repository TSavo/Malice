import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Lockpick prototype
 */
export class LockpickBuilder implements Builder {
  static provides = ['lockpick'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('lockpick');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('lockpick', tool, {
        properties: {
          name: 'Lockpick Set',
          description: 'A set of lockpicking tools',
          weight: 50,

          abilities: `Open locks without key. Requires skill - harder locks take longer.
Can break if forced. Leaves no obvious evidence if successful.
Illegal to possess in many jurisdictions. Electronic locks need different tools.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[LockpickBuilder] Type 'lockpick' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(LockpickBuilder);
