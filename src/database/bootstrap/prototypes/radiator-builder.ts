import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Radiator prototype
 * Engine cooling system - prevents overheating
 */
export class RadiatorBuilder implements Builder {
  static provides = ['radiator'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('radiator');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('radiator', vehiclePart, {
        properties: {
          name: 'Radiator',
          description: 'Engine cooling system',
          partType: 'radiator',
          coolantLevel: 100, // 0-100 percent
          temperature: 20, // Current temp in celsius
          maxTemp: 110, // Overheating threshold
          weight: 8000, // 8kg

          abilities: `Engine cooling system. Prevents overheating.

'coolantLevel' = fluid level (0-100). Low coolant = poor cooling.
'temperature' rises during operation, drops when idle.
If 'temperature' exceeds 'maxTemp', engine overheats and stalls.
Damaged radiators leak coolant and cool poorly.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription('coolantLevel', 'Coolant fluid level 0-100');
    obj.setPropertyDescription('temperature', 'Current temperature in celsius');
    obj.setPropertyDescription('maxTemp', 'Overheating threshold temperature');
  }

  async registerAliases(): Promise<void> {
    console.log("[RadiatorBuilder] Type 'radiator' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(RadiatorBuilder);
