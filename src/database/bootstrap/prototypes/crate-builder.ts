import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Crate prototype
 * Shipping container
 */
export class CrateBuilder implements Builder {
  static provides = ['crate'];
  static depends = ['furniture', 'pocket'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('crate');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('crate', furniture, {
        properties: {
          name: 'Crate',
          description: 'A wooden shipping crate',
          weight: 10000,
          open: false,
          sealed: true,
          contents: null,

          abilities: `Wooden box for shipping. Sealed crates must be pried open (crowbar, force).
Once opened, can't be resealed properly. Nails or staples hold lid.
Can stand on. Wood burns, breaks with enough force.
Stacking creates cover or climbing opportunities.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sealed', 'Whether crate is nailed shut');
      this.obj.setPropertyDescription('open', 'Whether lid is removed/open');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CrateBuilder] Type 'crate' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CrateBuilder);
