import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Hardpoint prototype
 * Mounting point on vehicle for turrets, racks, or pods
 */
export class HardpointBuilder implements Builder {
  static provides = ['hardpoint'];
  static depends = ['describable'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('hardpoint');
    if (existing) {
      this.obj = existing;
    } else {
      const describable = await this.manager.load('describable');
      if (!describable) throw new Error('Describable type not found');

      this.obj = await this.manager.define('hardpoint', describable, {
        properties: {
          name: 'Hardpoint',
          description: 'A vehicle mounting point',
          slot: 'roof', // roof, left-side, right-side, front, rear
          supportedMounts: ['turret', 'rack', 'pod'],
          mount: null, // objref to installed $turret, $rack, etc.
          vehicle: null, // objref to parent vehicle
          weight: 5000, // 5kg base mounting hardware

          abilities: `Vehicle mounting point. Install turrets, racks, or pods here.

'slot' = position on vehicle (roof, left-side, right-side, front, rear).
'supportedMounts' = what can be installed (turret, rack, pod).
Set 'mount' to attach equipment. One mount per hardpoint.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription(
      'slot',
      'Position on vehicle: roof, left-side, right-side, front, rear',
    );
    obj.setPropertyDescription(
      'supportedMounts',
      'Array of mount types this hardpoint accepts',
    );
    obj.setPropertyDescription(
      'mount',
      'Installed equipment ($turret, $rack, etc.) or null',
    );
    obj.setPropertyDescription(
      'vehicle',
      'Parent vehicle this hardpoint is on',
    );
  }

  async registerAliases(): Promise<void> {
    console.log("[HardpointBuilder] Type 'hardpoint' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HardpointBuilder);
