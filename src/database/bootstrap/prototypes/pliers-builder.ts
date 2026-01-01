import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Pliers prototype
 */
export class PliersBuilder implements Builder {
  static provides = ['pliers'];
  static depends = ['tool'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('pliers');
    if (existing) {
      this.obj = existing;
    } else {
      const tool = await this.manager.load('tool');
      if (!tool) throw new Error('Tool type not found');

      this.obj = await this.manager.define('pliers', tool, {
        properties: {
          name: 'Pliers',
          description: 'A pair of pliers',
          weight: 200,

          abilities: `Grip, bend, pull, twist. Hold small objects, pull nails, bend wire.
Needle-nose reaches tight spaces. Can extract bullets crudely.
Grip hot objects. Pull teeth (torture). Bend metal.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[PliersBuilder] Type 'pliers' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PliersBuilder);
