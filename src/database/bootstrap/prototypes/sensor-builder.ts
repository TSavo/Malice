import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Sensor prototype
 * Detection device (motion, heat, proximity)
 */
export class SensorBuilder implements Builder {
  static provides = ['sensor'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('sensor');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('sensor', describable, {
        properties: {
          name: 'Sensor',
          description: 'A motion detection sensor',
          active: true,
          sensorType: 'motion',
          triggered: false,
          linkedTo: null,
          weight: 100,

          abilities: `Detects presence in area. Types: motion, heat, proximity, laser tripwire.
When triggered, activates 'linkedTo' device (alarm, trap, camera, etc).
Can be fooled - move slowly for motion, cold suit for heat.
Needs power. Small, can be hidden.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('sensorType', 'Type: motion, heat, proximity, laser');
      this.obj.setPropertyDescription('linkedTo', 'Objref to device activated on trigger');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SensorBuilder] Type 'sensor' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SensorBuilder);
