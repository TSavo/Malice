import type { RuntimeObject } from '../../../../types/object';
import type { ObjectManager } from '../../object-manager';
import { type Builder, registerBuilder } from '../builder-registry';

/**
 * Builds the Air Tank prototype
 * Compressed oxygen reservoir for rebreather installation (consumable)
 */
export class AirTankBuilder implements Builder {
  static provides = ['airTank'];
  static depends = ['medical'];

  private obj: RuntimeObject | null = null;

  constructor(private manager: ObjectManager) {}

  async build(): Promise<void> {
    const existing = await this.manager.load('airTank');
    if (existing) {
      this.obj = existing;
    } else {
      const medical = await this.manager.load('medical');
      if (!medical) throw new Error('Medical type not found');

      this.obj = await this.manager.define('airTank', medical, {
        properties: {
          name: 'Implant Air Tank',
          description: 'Compressed oxygen reservoir for rebreather installation',
          weight: 200,
          capacity: 30,
          pressurized: true,
          sealed: true,

          abilities: `Compressed oxygen reservoir for rebreather installation.

CONTENTS: Medical-grade compressed oxygen.
30 minutes of breathing at rest.
Includes recycler unit and pressure regulator.
Pre-filled and ready for installation.

REQUIRED FOR: Rebreather installation.
One tank = one rebreather = 30 minutes capacity.
Consumed during installation - becomes part of patient.

COMPONENTS: Titanium tank (high-pressure rated).
Oxygen recycler (converts CO2 back to O2).
Pressure regulator (controls flow to lungs).
All integrated into single implant package.

STERILE: Surgical-grade. Sealed packaging.
Opening package before surgery = contamination risk.
Implanting non-sterile tank = chest infection.
Life-threatening complication if not addressed.

PRESSURE: Tank contains compressed gas.
Do NOT puncture, drop, or expose to extreme heat.
Explosion risk if mishandled.
Keep away from open flame.

INSTALLATION: Doc creates chest cavity.
Tank positioned between lungs.
Connections to airways established.
Recycler and regulator calibrated.
4-6 hour procedure for experienced surgeon.

CAPACITY: 30 minutes at rest.
Heavy exertion = 15-20 minutes.
Recycler extends effective capacity.
Patient should not rely on maximum duration.

REFILL: Once installed, tank refills naturally.
Patient breathes, tank compresses excess.
1 hour of normal breathing = full tank.
Cannot refill in toxic atmosphere.

WEIGHT: Adds noticeable mass to chest.
Patient will feel the weight.
Buoyancy affected in water.

STORAGE: Cool, dry, away from heat sources.
Pressure vessels are dangerous if damaged.
Inspect packaging before use.
Do not use if dented or corroded.`,
        },
        methods: {},
      });

      this.obj.setPropertyDescription('capacity', 'Minutes of breathable air at rest');
      this.obj.setPropertyDescription('pressurized', 'Whether tank is currently pressurized');
      this.obj.setPropertyDescription('sealed', 'Whether the sterile packaging is intact');
    }
  }

  async registerAliases(): Promise<void> {
    console.log("[AirTankBuilder] Type 'airTank' auto-aliased");
  }

  getObject(): RuntimeObject | null {
    return this.obj;
  }
}

registerBuilder(AirTankBuilder);
