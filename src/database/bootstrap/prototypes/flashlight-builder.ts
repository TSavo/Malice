import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Flashlight prototype
 * Portable light source
 */
export class FlashlightBuilder implements Builder {
  static provides = ['flashlight'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('flashlight');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('flashlight', describable, {
        properties: {
          name: 'Flashlight',
          description: 'A portable electric light',
          on: false,
          battery: 100,
          weight: 200,

          abilities: `Portable light source. Toggle on/off. Illuminates dark areas.
Drains battery while on. Dead battery = no light. Can be recharged.
Beam visible from distance. Can temporarily blind if shone in eyes.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('on', 'Whether light is currently on');
      this.obj.setPropertyDescription('battery', 'Battery charge 0-100');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[FlashlightBuilder] Type 'flashlight' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(FlashlightBuilder);
