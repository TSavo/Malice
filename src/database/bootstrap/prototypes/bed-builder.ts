import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bed prototype
 */
export class BedBuilder implements Builder {
  static provides = ['bed'];
  static depends = ['furniture'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('bed');
    if (existing) {
      this.obj = existing;
    } else {
      const furniture = await this.manager.load('furniture');
      if (!furniture) throw new Error('Furniture type not found');

      this.obj = await this.manager.define('bed', furniture, {
        properties: {
          name: 'Bed',
          description: 'A place to sleep',
          weight: 40000,
          occupant: null,
          quality: 'standard',

          abilities: `Sleep here to restore energy and heal. Quality affects recovery rate.
Cheap beds restore slowly, luxury beds restore fast.
Can hide under bed. Mattress provides some cover from gunfire.
Very vulnerable while sleeping - ambush risk.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('occupant', 'Objref to person sleeping');
      this.obj.setPropertyDescription(
        'quality',
        'cheap, standard, or luxury - affects rest quality',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[BedBuilder] Type 'bed' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BedBuilder);
