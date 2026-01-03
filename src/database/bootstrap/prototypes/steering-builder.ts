import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Steering prototype
 * Steering system for vehicles
 */
export class SteeringBuilder implements Builder {
  static provides = ['steering'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('steering');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('steering', vehiclePart, {
        properties: {
          name: 'Steering System',
          description: 'Controls vehicle direction',
          partType: 'steering',
          weight: 8000,
          condition: 100,
          damage: 0,
          powerAssist: true,

          abilities: `Controls direction. Power assist makes turning easier.
Damaged steering = loose handling, drifts. Can fail completely.
Hydraulic fluid leak = stiff steering. Complete failure = uncontrollable.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription(
        'powerAssist',
        'Whether power steering is functional',
      );
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[SteeringBuilder] Type 'steering' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(SteeringBuilder);
