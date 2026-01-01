import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Radio prototype
 * Two-way radio communication device
 */
export class RadioBuilder implements Builder {
  static provides = ['radio'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('radio');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('radio', describable, {
        properties: {
          name: 'Radio',
          description: 'A two-way radio transceiver',
          on: false,
          channel: 1,
          battery: 100,
          weight: 300,

          abilities: `Two-way voice communication. Set channel to talk to others on same channel.
Push-to-talk. Range limited by terrain and interference.
Can be monitored/jammed. Encrypted channels exist. Drains battery.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('channel', 'Frequency channel 1-99');
      this.obj.setPropertyDescription('on', 'Whether radio is powered on');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[RadioBuilder] Type 'radio' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RadioBuilder);
