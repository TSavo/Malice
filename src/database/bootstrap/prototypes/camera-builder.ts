import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Camera prototype
 * Surveillance/recording device
 */
export class CameraBuilder implements Builder {
  static provides = ['camera'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('camera');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('camera', describable, {
        properties: {
          name: 'Camera',
          description: 'A surveillance camera',
          recording: false,
          powered: true,
          storage: [],
          weight: 500,

          abilities: `Records video of area. Mounted or handheld.
When 'recording', logs events to 'storage'. Can be reviewed later.
Needs power. Can be disabled by covering lens, cutting wire, or EMP.
Night vision models exist. May have remote viewing capability.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('recording', 'Whether actively recording');
      this.obj.setPropertyDescription('storage', 'Array of recorded events');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[CameraBuilder] Type 'camera' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(CameraBuilder);
