import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Dumpster prototype
 * Large waste container
 */
export class DumpsterBuilder implements Builder {
  static provides = ['dumpster'];
  static depends = ['furniture', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('dumpster');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('dumpster', furniture, {
        properties: {
          name: 'Dumpster',
          description: 'A large metal waste container',
          weight: 200000,
          open: false,
          contents: null,

          abilities: `Large metal bin. Lid opens for access. Can hide inside (disgusting).
Search for discarded items - food, evidence, valuables.
Climbing on top provides elevation. Metal stops bullets.
Smells terrible. Rolling on wheels if unlocked.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('open', 'Whether lid is open');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DumpsterBuilder] Type 'dumpster' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DumpsterBuilder);
