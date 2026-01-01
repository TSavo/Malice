import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Bumper prototype
 * Front/rear impact absorption - cosmetic/protective
 */
export class BumperBuilder implements Builder {
  static provides = ['bumper'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('bumper');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('bumper', vehiclePart, {
        properties: {
          name: 'Bumper',
          description: 'An impact absorption panel',
          partType: 'bumper',
          position: 'front', // front, rear
          weight: 12000, // 12kg

          abilities: `Impact absorption panel. Cosmetic/protective.

'position' = front or rear.
Absorbs minor collisions, protects vehicle body.
Damageable - dents and bends from impacts.
Optional - vehicle works without bumpers.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription('position', 'Bumper position: front, rear');
  }

  async registerAliases(): Promise<void> {
    console.log("[BumperBuilder] Type 'bumper' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(BumperBuilder);
