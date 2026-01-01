import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Starter prototype
 * Electric motor that starts the engine
 */
export class StarterBuilder implements Builder {
  static provides = ['starter'];
  static depends = ['vehiclePart'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('starter');
    if (existing) {
      this.obj = existing;
    } else {
      const vehiclePart = await this.manager.load('vehiclePart');
      if (!vehiclePart) throw new Error('VehiclePart type not found');

      this.obj = await this.manager.define('starter', vehiclePart, {
        properties: {
          name: 'Starter Motor',
          description: 'Electric motor that cranks the engine',
          partType: 'starter',
          weight: 5000,
          condition: 100,
          damage: 0,

          abilities: `Cranks the engine to start it. Needs battery power.
Dead battery or broken starter = can't start normally.
Can be bypassed with jumper cables or push-starting (manual trans only).
Clicking sound with no start = starter or battery issue.`,
        },
        methods: {},
      });
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[StarterBuilder] Type 'starter' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(StarterBuilder);
