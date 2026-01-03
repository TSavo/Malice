import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Dynamite prototype
 */
export class DynamiteBuilder implements Builder {
  static provides = ['dynamite'];
  static depends = ['explosive'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('dynamite');
    if (existing) {
      this.obj = existing;
    } else {
      const explosive = await this.manager.load('explosive');
      if (!explosive) throw new Error('Explosive type not found');

      this.obj = await this.manager.define('dynamite', explosive, {
        properties: {
          name: 'Dynamite',
          description: 'Stick of dynamite',
          weight: 200,
          damage: 120,
          blastRadius: 8,
          fuseLength: 10,
          fuseLit: false,

          abilities: `Classic explosive stick with fuse. Light fuse, place or throw.
Fuse burns visibly - can be extinguished. Bundle sticks for bigger blast.
Unstable when old - sweating nitroglycerin. Handle carefully.
Good for demolition, mining, improvised weapons.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'fuseLength',
        'Fuse burn time in seconds',
      );
      this.obj.setPropertyDescription('fuseLit', 'Whether fuse is burning');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[DynamiteBuilder] Type 'dynamite' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(DynamiteBuilder);
