import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Hammer prototype
 */
export class HammerBuilder implements Builder {
  static provides = ['hammer'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('hammer');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('hammer', tool, {
        properties: {
          name: 'Hammer',
          description: 'A claw hammer',
          weight: 500,

          abilities: `Drive and remove nails. Break things with blunt force.
Claw end pries boards, removes nails. Effective blunt weapon.
Can break locks, windows, bones. Loud impacts.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[HammerBuilder] Type 'hammer' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HammerBuilder);
