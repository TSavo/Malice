import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Pill prototype
 * Swallowable drug in tablet/capsule form
 */
export class PillBuilder implements Builder {
  static provides = ['pill'];
  static depends = ['drug'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('pill');
    if (existing) {
      this.obj = existing;
    } else {
      const drug = await this.manager.load('drug');
      if (!drug) throw new Error('Drug type not found');

      this.obj = await this.manager.define('pill', drug, {
        properties: {
          name: 'Pill',
          description: 'A tablet or capsule',
          weight: 2,

          abilities: `Swallow whole with water. One dose per pill.

Takes ~30 min to take effect (digestion). Can be crushed and snorted for faster effect but harsher.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PillBuilder] Type 'pill' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PillBuilder);
