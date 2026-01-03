import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Alarm prototype
 * Alert device
 */
export class AlarmBuilder implements Builder {
  static provides = ['alarm'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('alarm');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('alarm', describable, {
        properties: {
          name: 'Alarm',
          description: 'An alert system',
          armed: false,
          sounding: false,
          silent: false,
          linkedSensors: [],
          weight: 300,

          abilities: `Sounds alert when triggered. Can be linked to sensors, doors, etc.
Audible alarm heard throughout building. Silent alarms notify security remotely.
Must be armed to trigger. Disable with code, key, or cutting power.
Tamper detection triggers alarm if opened without disarming.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('armed', 'Whether alarm is active');
      this.obj.setPropertyDescription(
        'sounding',
        'Whether alarm is currently going off',
      );
      this.obj.setPropertyDescription(
        'silent',
        'If true, notifies remotely instead of sounding',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AlarmBuilder] Type 'alarm' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AlarmBuilder);
