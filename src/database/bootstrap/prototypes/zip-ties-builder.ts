import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the ZipTies prototype
 */
export class ZipTiesBuilder implements Builder {
  static provides = ['zipTies'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('zipTies');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('zipTies', tool, {
        properties: {
          name: 'Zip Ties',
          description: 'A bundle of plastic zip ties',
          weight: 50,
          count: 20,

          abilities: `Plastic restraints. Quick to apply, need to cut to remove.
Bind wrists, secure cables, bundle items. Single use each.
Can't be untied - must cut. Thin enough to conceal.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('count', 'Number of zip ties remaining');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[ZipTiesBuilder] Type 'zipTies' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(ZipTiesBuilder);
