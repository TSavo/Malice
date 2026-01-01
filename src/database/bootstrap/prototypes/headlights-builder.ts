import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Headlights prototype
 * Vehicle lighting system
 */
export class HeadlightsBuilder implements Builder {
  static provides = ['headlights'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('headlights');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('headlights', vehiclePart, {
        properties: {
          name: 'Headlights',
          description: 'Vehicle lighting system',
          partType: 'headlights',
          weight: 2000,
          condition: 100,
          damage: 0,
          on: false,
          highBeam: false,

          abilities: `Illuminates the road ahead. Required at night for safe driving.
'on' = lights active. 'highBeam' = brighter but blinds oncoming traffic.
Broken lights = can't see at night, illegal to drive. Draws battery power.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('on', 'Whether headlights are currently on');
      this.obj.setPropertyDescription('highBeam', 'Whether high beams are active');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[HeadlightsBuilder] Type 'headlights' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(HeadlightsBuilder);
