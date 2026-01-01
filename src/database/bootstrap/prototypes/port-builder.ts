import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Port prototype
 * Firing ports, window slots - small openings in vehicle body
 */
export class PortBuilder implements Builder {
  static provides = ['port'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('port');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('port', vehiclePart, {
        properties: {
          name: 'Port',
          description: 'A small opening in the vehicle body',
          partType: 'port',
          side: 'left', // left, right, rear, front
          coverOpen: false,
          weight: 2000, // 2kg

          abilities: `Small opening in vehicle body. Firing ports, window slots.

'side' = position on vehicle. 'coverOpen' = whether port is open.
When open: can shoot through, limited visibility out.
When closed: protected, no visibility or firing.
Optional - vehicle works without ports.`,
        },
        methods: {},
      });
    }

    const obj = this.obj;

    obj.setPropertyDescription('side', 'Port position: left, right, rear, front');
    obj.setPropertyDescription('coverOpen', 'true = port open for firing/viewing');
  }

  async registerAliases(): Promise<void> {
    console.log("[PortBuilder] Type 'port' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(PortBuilder);
