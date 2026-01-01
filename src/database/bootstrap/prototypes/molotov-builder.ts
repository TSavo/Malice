import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Molotov prototype
 */
export class MolotovBuilder implements Builder {
  static provides = ['molotov'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('molotov');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('molotov', explosive, {
        properties: {
          name: 'Molotov Cocktail',
          description: 'Improvised incendiary',
          weight: 500,
          damage: 50,
          blastRadius: 3,
          lit: false,

          abilities: `Bottle of fuel with burning wick. Shatters on impact, spreads fire.
Light wick, throw at target. Fire spreads on flammable surfaces.
Burns for 30+ seconds. Smoke and flames block vision.
Improvised from bottle, fuel, rag. Cheap but effective.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('lit', 'Whether wick is burning');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[MolotovBuilder] Type 'molotov' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(MolotovBuilder);
